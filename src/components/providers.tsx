"use client";

import { ReactNode } from "react";
import { ReactLenis } from "lenis/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/context/CartContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.5 }}>
      <TooltipProvider>
        <CartProvider>
          {children}
        </CartProvider>
      </TooltipProvider>
    </ReactLenis>
  );
}
