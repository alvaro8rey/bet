"use client";

import { useEffect, useRef } from "react";

interface AdsterraUnitProps {
  adKey: string;
  width: number;
  height: number;
  className?: string;
}

export function AdsterraUnit({ adKey, width, height, className }: AdsterraUnitProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const injected = useRef(false);

  useEffect(() => {
    if (injected.current || !containerRef.current) return;
    injected.current = true;

    (window as any).atOptions = { key: adKey, format: "iframe", height, width, params: {} };

    const script = document.createElement("script");
    script.src = `https://www.highperformanceformat.com/${adKey}/invoke.js`;
    script.async = true;
    containerRef.current.appendChild(script);
  }, [adKey, width, height]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width, height, overflow: "hidden" }}
    />
  );
}
