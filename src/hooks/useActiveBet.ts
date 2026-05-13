"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Bet } from "@/types";

export function useActiveBet() {
  const [activeBet, setActiveBet] = useState<Bet | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  const fetchActiveBet = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    setUserId(user.id);

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

  // Suscripción en tiempo real a INSERT/UPDATE de apuestas del usuario
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`bets:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bets",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Refetch para obtener la apuesta activa actualizada con el evento relacionado
          fetchActiveBet();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, supabase, fetchActiveBet]);

  return { activeBet, loading, refetch: fetchActiveBet };
}
