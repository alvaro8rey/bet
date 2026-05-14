import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = "https://www.sharpbet.es";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/premios", "/como-ganar-puntos", "/contact", "/legal/"],
        disallow: ["/api/", "/admin/", "/dashboard/", "/profile/", "/history/", "/bets/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
