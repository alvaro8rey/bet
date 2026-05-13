import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "PlayfulBet — Predicciones Deportivas",
  description: "Realiza predicciones deportivas con puntos virtuales. Sin dinero real.",
  keywords: ["predicciones deportivas", "apuestas virtuales", "fútbol", "tenis", "baloncesto"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-background text-text-primary">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#1a1a24",
              color: "#f0f0f8",
              border: "1px solid #2a2a3a",
              borderRadius: "12px",
              fontSize: "14px",
            },
            success: { iconTheme: { primary: "#00e676", secondary: "#0a0a0f" } },
            error: { iconTheme: { primary: "#ff4444", secondary: "#0a0a0f" } },
          }}
        />
      </body>
    </html>
  );
}
