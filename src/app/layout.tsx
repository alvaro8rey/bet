import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { Analytics } from "@vercel/analytics/react";
import { PWARegister } from "@/components/PWARegister";
import { PostHogProvider } from "@/components/PostHogProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "SharpBet — Predicciones Deportivas",
  description: "Realiza predicciones deportivas con puntos virtuales. Sin dinero real.",
  keywords: ["predicciones deportivas", "apuestas virtuales", "fútbol", "tenis", "baloncesto"],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SharpBet",
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    images: ["/logo-white.png"],
  },
  verification: {
    google: "faAuPdI7h4EARGwvuGwh86OxwntGiWcob0Y3cthN-zc",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#0a0a0f" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9606090335798660"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased bg-background text-text-primary">
        <PostHogProvider>
          {children}
          <PWARegister />
          <Analytics />
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
        </PostHogProvider>
      </body>
    </html>
  );
}
