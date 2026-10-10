"use client";

import { useState } from "react";
import { Store, ShoppingBag } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KasirTab } from "./kasir-tab";
import { MarketplaceTab } from "./marketplace-tab";
import type { PosProduct } from "@/actions/pos";

type PosTab = "kasir" | "marketplace";

// Tombol tab POS lebih besar dari default shadcn (h-8) dan tak memakai garis bawah.
// Override tinggi harus berprefiks `group-data-horizontal/tabs:` — tailwind-merge menganggap
// `h-auto` polos dan varian berprefiks sebagai kunci berbeda, sehingga h-8 bawaan tetap menang.
const triggerClass =
  "h-auto flex-none gap-2 rounded-lg px-4 py-2 text-muted-foreground " +
  "data-active:border-primary/20 data-active:text-primary data-active:shadow-sm";

export function PosClient({ products }: { products: PosProduct[] }) {
  const [tab, setTab] = useState<PosTab>("kasir");

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => setTab(v as PosTab)}
      className="flex h-[calc(100dvh-3.5rem)] flex-col gap-0 overflow-hidden lg:h-[calc(100dvh-4rem)]"
    >
      <TabsList className="group-data-horizontal/tabs:h-auto w-full shrink-0 justify-start gap-1 rounded-none border-b bg-muted/30 p-2">
        <TabsTrigger value="kasir" className={triggerClass}>
          <Store className="h-4 w-4" /> Kasir Toko
        </TabsTrigger>
        <TabsTrigger value="marketplace" className={triggerClass}>
          <ShoppingBag className="h-4 w-4" /> Transaksi Marketplace
        </TabsTrigger>
      </TabsList>

      {/* Hanya panel aktif yang di-mount (default base-ui) — sama seperti sebelumnya. */}
      <TabsContent value="kasir" className="flex flex-1 flex-col overflow-hidden text-base">
        <KasirTab products={products} />
      </TabsContent>
      <TabsContent value="marketplace" className="flex flex-1 flex-col overflow-hidden text-base">
        <MarketplaceTab products={products} />
      </TabsContent>
    </Tabs>
  );
}
