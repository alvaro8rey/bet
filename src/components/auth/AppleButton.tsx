"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

export function AppleButton() {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleApple = async () => {
    setLoading(true);
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) document.cookie = `ref_code=${ref.toUpperCase()};path=/;max-age=3600`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      toast.error("Error al conectar con Apple");
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleApple}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl text-black font-medium text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg width="17" height="17" viewBox="0 0 814 1000" fill="currentColor">
        <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.5-155.5-120.5c-43.7-71.5-81.5-177.3-81.5-277.9 0-196.2 125.4-299.9 248.9-299.9 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/>
      </svg>
      {loading ? "Conectando..." : "Continuar con Apple"}
    </button>
  );
}
