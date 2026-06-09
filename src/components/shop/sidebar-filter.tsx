"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

export interface FilterState {
  categories: string[];
  brands: string[];
  selectedCats: string[];
  selectedBrands: string[];
  priceMin: number | "";
  priceMax: number | "";
  inStockOnly: boolean;
  toggleCat: (c: string) => void;
  toggleBrand: (b: string) => void;
  setPriceMin: (n: number | "") => void;
  setPriceMax: (n: number | "") => void;
  setInStockOnly: (v: boolean) => void;
  onReset: () => void;
}

export function SidebarFilter(props: FilterState) {
  const {
    categories, brands, selectedCats, selectedBrands, priceMin, priceMax,
    inStockOnly, toggleCat, toggleBrand, setPriceMin, setPriceMax, setInStockOnly, onReset,
  } = props;

  const activeCount =
    selectedCats.length + selectedBrands.length + (inStockOnly ? 1 : 0) + (priceMin !== "" || priceMax !== "" ? 1 : 0);

  return (
    <div className="w-full rounded-3xl border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-heading text-base font-bold">Filter</h3>
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" className="h-7 gap-1.5 px-2 text-xs text-muted-foreground" onClick={onReset}>
            <RotateCcw className="h-3 w-3" /> Reset
          </Button>
        )}
      </div>

      {/* In-stock toggle */}
      <div className="mb-4 flex items-center justify-between rounded-xl border bg-muted/30 px-3 py-2.5">
        <Label className="text-sm font-medium">Hanya yang tersedia</Label>
        <Switch checked={inStockOnly} onCheckedChange={setInStockOnly} />
      </div>

      <Accordion defaultValue={["category", "price", "brand"]} className="w-full">
        <AccordionItem value="category">
          <AccordionTrigger className="text-sm font-semibold">Kategori</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2.5 pt-1">
              {categories.map((cat, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <Checkbox id={`cat-${idx}`} checked={selectedCats.includes(cat)} onCheckedChange={() => toggleCat(cat)} />
                  <Label htmlFor={`cat-${idx}`} className="cursor-pointer text-sm font-normal">{cat}</Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="price">
          <AccordionTrigger className="text-sm font-semibold">Rentang Harga</AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Minimum</Label>
                <Input type="number" placeholder="Rp 0" value={priceMin} onChange={(e) => setPriceMin(e.target.value === "" ? "" : Number(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Maksimum</Label>
                <Input type="number" placeholder="Rp 2jt+" value={priceMax} onChange={(e) => setPriceMax(e.target.value === "" ? "" : Number(e.target.value))} />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="brand">
          <AccordionTrigger className="text-sm font-semibold">Merek</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2.5 pt-1">
              {brands.map((brand, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <Checkbox id={`brand-${idx}`} checked={selectedBrands.includes(brand)} onCheckedChange={() => toggleBrand(brand)} />
                  <Label htmlFor={`brand-${idx}`} className="cursor-pointer text-sm font-normal">{brand}</Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
