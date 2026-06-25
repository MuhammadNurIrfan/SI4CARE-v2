"use client";

import { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/context/CartContext";
import { CategoryProvider } from "@/context/CategoryContext";
import { ContentProvider } from "@/context/ContentContext";

// Catatan: Lenis (smooth-scroll JS) sebelumnya membungkus root di sini, tapi
// menghijack scroll <html> secara global sehingga: (a) container scroll bersarang
// (sidebar admin, <main> dashboard, dialog) tidak bisa di-scroll, (b) tinggi
// virtual-scroll tidak ter-recalc saat gambar/konten async selesai load → konten
// bawah tidak terjangkau kecuali refresh. Kita pakai native smooth-scroll dari CSS
// (`scroll-behavior: smooth` di globals.css) yang andal di semua halaman.
export function Providers({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <CategoryProvider>
        <ContentProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </ContentProvider>
      </CategoryProvider>
    </TooltipProvider>
  );
}
