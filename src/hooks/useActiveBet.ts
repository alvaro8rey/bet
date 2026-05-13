"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Bet } from "@/types";

export function useActiveBet() {
  const [activeBet, setActiveBet] = useState<Bet | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchActiveBet = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("bets")
      .select("*, event:events(*)")
      .eq("user_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    setActiveBet(data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) { setLoading(false); return; }

      await fetchActiveBet(user.id);

      // Limpiar canal previo si existe
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }

      const channel = supabase
        .channel(`active-bet-${user.id}-${Date.now()}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "bets", filter: `user_id=eq.${user.id}` },
          () => { if (!cancelled) fetchActiveBet(user.id); }
        )
        .subscribe();

      channelRef.current = channel;
    };

    init();

    return () => {
      cancelled = true;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [supabase, fetchActiveBet]);

  return { activeBet, loading, refetch: () => supabase.auth.getUser().then(({ data: { user } }) => user && fetchActiveBet(user.id)) };
}
