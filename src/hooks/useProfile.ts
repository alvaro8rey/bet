"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";

function isNextDay(dateStr: string): boolean {
  const bankruptDate = new Date(dateStr);
  const today = new Date();
  const bankruptDay = new Date(bankruptDate.getFullYear(), bankruptDate.getMonth(), bankruptDate.getDate());
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return todayDay > bankruptDay;
}

async function applyBankruptcyResetIfNeeded(data: Profile): Promise<Profile> {
  const needsReset =
    (data.bankruptcy_at && isNextDay(data.bankruptcy_at)) ||
    (data.bankruptcy_at && data.points > 0);

  if (!needsReset) return data;

  try {
    const res = await fetch("/api/profile/bankruptcy-reset", { method: "POST" });
    if (!res.ok) return data;
    const json = await res.json();
    return json.profile ?? data;
  } catch {
    return data;
  }
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

    const resolved = await applyBankruptcyResetIfNeeded(data);
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
            const resolved = await applyBankruptcyResetIfNeeded(updated);
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
