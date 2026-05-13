"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";

const BANKRUPTCY_RESET_POINTS = 1000;

function isNextDay(dateStr: string): boolean {
  const bankruptDate = new Date(dateStr);
  const today = new Date();
  const bankruptDay = new Date(bankruptDate.getFullYear(), bankruptDate.getMonth(), bankruptDate.getDate());
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return todayDay > bankruptDay;
}

async function applyBankruptcyResetIfNeeded(
  supabase: ReturnType<typeof createClient>,
  data: Profile,
  userId: string
): Promise<Profile> {
  if (data.bankruptcy_at && isNextDay(data.bankruptcy_at)) {
    const { data: updated } = await supabase
      .from("profiles")
      .update({ points: BANKRUPTCY_RESET_POINTS, bankruptcy_at: null })
      .eq("user_id", userId)
      .select("*")
      .single();
    return updated ?? data;
  }
  return data;
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    setUserId(user.id);

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!data) { setLoading(false); return; }

    const resolved = await applyBankruptcyResetIfNeeded(supabase, data, user.id);
    setProfile(resolved);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchProfile();

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(() => {
      fetchProfile();
    });

    return () => authSub.unsubscribe();
  }, [fetchProfile, supabase]);

  // Suscripción en tiempo real: cualquier UPDATE en el perfil del usuario
  // actualiza el estado local sin recargar la página
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`profile:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          const updated = payload.new as Profile;
          const resolved = await applyBankruptcyResetIfNeeded(supabase, updated, userId);
          setProfile(resolved);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, supabase]);

  return { profile, loading, refetch: fetchProfile };
}
