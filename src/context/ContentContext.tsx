"use client";

/**
 * Konten CMS landing — diisi dari DB oleh server (`(landing)/layout.tsx`) lalu
 * dibagikan ke komponen landing lewat context ini.
 *
 * Sebelumnya konten disimpan di localStorage (prototipe) sehingga edit admin di
 * /admin/content tidak pernah sampai ke pengunjung. Sekarang context ini hanya
 * pembawa nilai: tidak membaca/menulis localStorage, jadi salinan basi dari
 * sesi lama tidak bisa menimpa konten dari DB.
 */

import { createContext, useContext, ReactNode } from "react";
import { DEFAULT_CONTENT, type SiteContent } from "@/lib/content-defaults";

type Ctx = { content: SiteContent };

const ContentContext = createContext<Ctx | null>(null);

export function ContentProvider({
  children,
  initialContent = DEFAULT_CONTENT,
}: {
  children: ReactNode;
  initialContent?: SiteContent;
}) {
  return <ContentContext.Provider value={{ content: initialContent }}>{children}</ContentContext.Provider>;
}

export function useContent() {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error("useContent harus dipakai di dalam ContentProvider");
  return ctx;
}
