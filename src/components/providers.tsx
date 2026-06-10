"use client";

import { ReactNode } from "react";
import { ReactLenis } from "lenis/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/context/CartContext";
import { CategoryProvider } from "@/context/CategoryContext";
import { ContentProvider } from "@/context/ContentContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.5 }}>
      <TooltipProvider>
        <CategoryProvider>
          <ContentProvider>
            <CartProvider>
              {children}
            </CartProvider>
          </ContentProvider>
        </CategoryProvider>
      </TooltipProvider>
    </ReactLenis>
  );
}
