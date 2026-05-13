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

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!data) { setLoading(false); return; }

    // Si tiene bancarrota registrada y ya es un día distinto → resetear a 1000 pts
    if (data.bankruptcy_at && isNextDay(data.bankruptcy_at)) {
      const { data: updated } = await supabase
        .from("profiles")
        .update({ points: BANKRUPTCY_RESET_POINTS, bankruptcy_at: null })
        .eq("user_id", user.id)
        .select("*")
        .single();

      setProfile(updated ?? data);
    } else {
      setProfile(data);
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchProfile();
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile, supabase]);

  return { profile, loading, refetch: fetchProfile };
}
