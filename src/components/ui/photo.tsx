"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface PhotoProps {
  src: string;
  alt: string;
  className?: string;
  /** Tailwind classes for the gradient shown while loading / on error */
  fallbackClassName?: string;
  /** Untuk gambar di atas lipatan (hero/LCP): eager-load + prioritas tinggi
   *  agar tampil segera, tidak menunggu lazy-load. */
  priority?: boolean;
}

/**
 * Real photo with a tasteful gradient fallback. If the remote image fails
 * (offline / blocked), an on-brand gradient stays in place instead of a
 * broken-image icon — so the layout always looks intentional.
 */
export function Photo({ src, alt, className, fallbackClassName, priority = false }: PhotoProps) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
  const imgRef = useRef<HTMLImageElement>(null);

  // Cegah race-condition hidrasi: gambar (terutama lokal/cache) sering selesai
  // load SEBELUM React memasang handler onLoad, sehingga event onLoad tidak
  // pernah terpicu dan gambar nyangkut di opacity-0. Saat mount, cek apakah
  // gambar SUDAH selesai dan sinkronkan status secara manual.
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    if (img.complete) {
      setStatus(img.naturalWidth > 0 ? "loaded" : "error");
    }
  }, []);

  return (
    <span className={cn("relative block overflow-hidden", className)}>
      <span
        className={cn(
          "absolute inset-0 transition-opacity duration-500",
          "bg-gradient-to-br from-[oklch(0.93_0.05_175)] via-[oklch(0.94_0.03_225)] to-[oklch(0.90_0.06_228)]",
          status === "loaded" ? "opacity-0" : "opacity-100",
          fallbackClassName
        )}
        aria-hidden="true"
      />
      {status !== "error" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
          className={cn(
            "h-full w-full object-cover transition-opacity duration-700",
            status === "loaded" ? "opacity-100" : "opacity-0"
          )}
        />
      )}
    </span>
  );
}
