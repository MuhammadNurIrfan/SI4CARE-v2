"use client";

import { useState } from "react";
import { Store, ShoppingBag } from "lucide-react";
import { KasirTab } from "./kasir-tab";
import { MarketplaceTab } from "./marketplace-tab";
import type { PosProduct } from "@/actions/pos";

export function PosClient({ products }: { products: PosProduct[] }) {
  const [tab, setTab] = useState<"kasir" | "marketplace">("kasir");

  return (
    <div className="flex flex-col h-[calc(100dvh-3.5rem)] lg:h-[calc(100dvh-4rem)] overflow-hidden">
      <div className="flex gap-1 p-2 bg-muted/30 border-b shrink-0">
        <button
          onClick={() => setTab("kasir")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === "kasir" ? "bg-background shadow-sm text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Store className="h-4 w-4" /> Kasir Toko
        </button>
        <button
          onClick={() => setTab("marketplace")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === "marketplace" ? "bg-background shadow-sm text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground"}`}
        >
          <ShoppingBag className="h-4 w-4" /> Transaksi Marketplace
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {tab === "kasir" ? <KasirTab products={products} /> : <MarketplaceTab products={products} />}
      </div>
    </div>
  );
}
