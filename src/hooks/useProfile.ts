"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  // Auto-reset if it's the next day after bankruptcy
  if (data.bankruptcy_at && isNextDay(data.bankruptcy_at)) {
    const { data: updated } = await supabase
      .from("profiles")
      .update({ points: BANKRUPTCY_RESET_POINTS, bankruptcy_at: null })
      .eq("user_id", userId)
      .select("*")
      .single();
    return updated ?? data;
  }
  // Clear bankruptcy_at if the user already has points (e.g. added manually)
  if (data.bankruptcy_at && data.points > 0) {
    const { data: updated } = await supabase
      .from("profiles")
      .update({ bankruptcy_at: null })
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
  const supabase = createClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!data) return;

    const resolved = await applyBankruptcyResetIfNeeded(supabase, data, userId);
    setProfile(resolved);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) { setLoading(false); return; }

      await fetchProfile(user.id);

      // Limpiar canal previo si existe
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }

      const channel = supabase
        .channel(`profile-${user.id}-${Date.now()}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "profiles", filter: `user_id=eq.${user.id}` },
          async (payload) => {
            if (cancelled) return;
            const updated = payload.new as Profile;
            const resolved = await applyBankruptcyResetIfNeeded(supabase, updated, user.id);
            setProfile(resolved);
          }
        )
        .subscribe();

      channelRef.current = channel;
    };

    init();

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(() => {
      if (!cancelled) init();
    });

    return () => {
      cancelled = true;
      authSub.unsubscribe();
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [supabase, fetchProfile]);

  const refetch = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await fetchProfile(user.id);
  }, [supabase, fetchProfile]);

  return { profile, loading, refetch };
}
