import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0f",
        surface: "#111118",
        "surface-2": "#1a1a24",
        "surface-3": "#22222f",
        border: "#2a2a3a",
        "border-light": "#333348",
        accent: "#00e676",
        "accent-dim": "#00c853",
        "accent-muted": "rgba(0,230,118,0.1)",
        blue: "#4488ff",
        "blue-dim": "#2266dd",
        "blue-muted": "rgba(68,136,255,0.1)",
        gold: "#ffd700",
        "text-primary": "#f0f0f8",
        "text-secondary": "#8888aa",
        "text-muted": "#55556a",
        win: "#00e676",
        loss: "#ff4444",
        pending: "#ffd700",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["'Courier New'", "monospace"],
        display: ["'Barlow Condensed'", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "accent-glow": "radial-gradient(ellipse at center, rgba(0,230,118,0.15) 0%, transparent 70%)",
        "card-shine": "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 50%)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { opacity: "0", transform: "translateY(16px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        slideInRight: { "0%": { opacity: "0", transform: "translateX(16px)" }, "100%": { opacity: "1", transform: "translateX(0)" } },
        glow: { "0%": { boxShadow: "0 0 5px rgba(0,230,118,0.2)" }, "100%": { boxShadow: "0 0 20px rgba(0,230,118,0.5)" } },
      },
      boxShadow: {
        "card": "0 4px 24px rgba(0,0,0,0.4)",
        "card-hover": "0 8px 40px rgba(0,0,0,0.6)",
        "accent": "0 0 20px rgba(0,230,118,0.3)",
        "accent-sm": "0 0 10px rgba(0,230,118,0.2)",
        "inset-border": "inset 0 1px 0 rgba(255,255,255,0.05)",
      },
    },
  },
  plugins: [],
};
export default config;
