"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Bet } from "@/types";

export function useActiveBet() {
  const [activeBet, setActiveBet] = useState<Bet | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchActiveBet = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from("bets")
      .select("*, event:events(*)")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    setActiveBet(data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchActiveBet();
  }, [fetchActiveBet]);

  return { activeBet, loading, refetch: fetchActiveBet };
}
