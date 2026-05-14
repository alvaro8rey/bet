import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.sharpbet.es";
  const now = new Date();

  return [
    { url: base,                          lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${base}/premios`,             lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${base}/como-ganar-puntos`,   lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/auth/register`,       lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/auth/login`,          lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/contact`,             lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/legal/terms`,         lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${base}/legal/privacy`,       lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
  ];
}
