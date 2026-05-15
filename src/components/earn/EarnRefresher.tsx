"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function EarnRefresher({ userId }: { userId: string }) {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Refresh when user comes back to tab after completing a survey
    const onVisible = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    // Refresh when Supabase realtime detects a new offerwall transaction
    const channel = supabase
      .channel(`earn-refresh-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "offerwall_transactions", filter: `user_id=eq.${userId}` },
        () => router.refresh()
      )
      .subscribe();

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      supabase.removeChannel(channel);
    };
  }, [userId, router, supabase]);

  return null;
}
