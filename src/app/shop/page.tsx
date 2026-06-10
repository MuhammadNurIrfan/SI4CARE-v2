"use client";

import { useState, useMemo } from "react";
import { SidebarFilter } from "@/components/shop/sidebar-filter";
import { ProductCard, Product } from "@/components/shop/product-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SlidersHorizontal, Search, ShieldCheck, Truck, BadgeCheck, PackageOpen, ChevronLeft, ChevronRight } from "lucide-react";

const allProducts: Product[] = [
  { id: "1", name: "Tensimeter Digital Omron HEM-7120", price: 540000, originalPrice: 620000, category: "Alat Diagnostik", stock: 15, art: "tensimeter", brand: "Omron", rating: 4.9, sold: 324 },
  { id: "2", name: "Tensimeter Lengan Atas Yuwell YE660D", price: 410000, category: "Alat Diagnostik", stock: 22, art: "tensimeter", brand: "Yuwell", rating: 4.7, sold: 156 },
  { id: "3", name: "Nebulizer Kompresor Omron NE-C28", price: 620000, category: "Alat Terapi", stock: 8, art: "nebulizer", brand: "Omron", rating: 4.8, sold: 142 },
  { id: "4", name: "Nebulizer Portable Yuwell Mesh", price: 385000, originalPrice: 450000, category: "Alat Terapi", stock: 19, art: "nebulizer", brand: "Yuwell", rating: 4.6, sold: 98 },
  { id: "5", name: "Kursi Roda Lipat Standar Sella", price: 1250000, category: "Alat Bantu Jalan", stock: 5, art: "wheelchair", brand: "Sella", rating: 4.7, sold: 64 },
  { id: "6", name: "Kursi Roda Travelling Ringan", price: 1680000, category: "Alat Bantu Jalan", stock: 3, art: "wheelchair", brand: "GEA Medical", rating: 4.8, sold: 31 },
  { id: "7", name: "Pulse Oximeter Fingertip Yuwell", price: 175000, originalPrice: 220000, category: "Alat Diagnostik", stock: 30, art: "oximeter", brand: "Yuwell", rating: 4.8, sold: 210 },
  { id: "8", name: "Termometer Tembak Infrared OneMed", price: 150000, originalPrice: 195000, category: "Alat Diagnostik", stock: 50, art: "thermometer", brand: "OneMed", rating: 4.6, sold: 188 },
  { id: "9", name: "Masker Medis 3-Ply OneMed (Box 50)", price: 25000, category: "APD", stock: 100, art: "mask", brand: "OneMed", rating: 4.9, sold: 1240 },
  { id: "10", name: "Masker N95 GEA Medical (isi 20)", price: 95000, originalPrice: 120000, category: "APD", stock: 0, art: "mask", brand: "GEA Medical", rating: 4.8, sold: 540 },
  { id: "11", name: "Stetoskop Littmann Classic III", price: 1850000, category: "Alat Diagnostik", stock: 4, art: "stethoscope", brand: "Littmann", rating: 5.0, sold: 47 },
  { id: "12", name: "Stetoskop Dual Head GEA Medical", price: 165000, category: "Alat Diagnostik", stock: 26, art: "stethoscope", brand: "GEA Medical", rating: 4.5, sold: 73 },
];

const CATEGORIES = ["Alat Diagnostik", "Alat Terapi", "Alat Bantu Jalan", "APD"];
const BRANDS = ["Omron", "Yuwell", "Sella", "OneMed", "GEA Medical", "Littmann"];

const trust = [
  { icon: BadgeCheck, text: "100% Original" },
  { icon: ShieldCheck, text: "Garansi Resmi" },
  { icon: Truck, text: "Kirim Nasional" },
];

export default function ShopPage() {
  const [search, setSearchRaw] = useState("");
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceMin, setPriceMinRaw] = useState<number | "">("");
  const [priceMax, setPriceMaxRaw] = useState<number | "">("");
  const [inStockOnly, setInStockOnlyRaw] = useState(false);
  const [sort, setSortRaw] = useState("terlaris");
  const [page, setPage] = useState(1);
  const PER_PAGE = 9;

  // any filter change returns to page 1
  const setSearch = (v: string) => { setSearchRaw(v); setPage(1); };
  const setPriceMin = (v: number | "") => { setPriceMinRaw(v); setPage(1); };
  const setPriceMax = (v: number | "") => { setPriceMaxRaw(v); setPage(1); };
  const setInStockOnly = (v: boolean) => { setInStockOnlyRaw(v); setPage(1); };
  const setSort = (v: string) => { setSortRaw(v); setPage(1); };
  const toggleCat = (c: string) => { setSelectedCats((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c])); setPage(1); };
  const toggleBrand = (b: string) => { setSelectedBrands((p) => (p.includes(b) ? p.filter((x) => x !== b) : [...p, b])); setPage(1); };
  const clearCats = () => { setSelectedCats([]); setPage(1); };
  const resetFilters = () => { setSelectedCats([]); setSelectedBrands([]); setPriceMinRaw(""); setPriceMaxRaw(""); setInStockOnlyRaw(false); setPage(1); };

  const filtered = useMemo(() => {
    const list = allProducts.filter((p) => {
      const q = search.toLowerCase();
      const okSearch = !q || p.name.toLowerCase().includes(q) || (p.brand ?? "").toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      const okCat = selectedCats.length === 0 || selectedCats.includes(p.category);
      const okBrand = selectedBrands.length === 0 || (p.brand ? selectedBrands.includes(p.brand) : false);
      const okMin = priceMin === "" || p.price >= priceMin;
      const okMax = priceMax === "" || p.price <= priceMax;
      const okStock = !inStockOnly || p.stock > 0;
      return okSearch && okCat && okBrand && okMin && okMax && okStock;
    });
    const sorted = [...list];
    if (sort === "termurah") sorted.sort((a, b) => a.price - b.price);
    else if (sort === "termahal") sorted.sort((a, b) => b.price - a.price);
    else if (sort === "terlaris") sorted.sort((a, b) => (b.sold ?? 0) - (a.sold ?? 0));
    else if (sort === "rating") sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    return sorted;
  }, [search, selectedCats, selectedBrands, priceMin, priceMax, inStockOnly, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const filterProps = {
    categories: CATEGORIES, brands: BRANDS, selectedCats, selectedBrands, priceMin, priceMax, inStockOnly,
    toggleCat, toggleBrand, setPriceMin, setPriceMax, setInStockOnly, onReset: resetFilters,
  };

  return (
    <div className="bg-background">
      {/* ── Hero band ── */}
      <section className="relative overflow-hidden border-b">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />
        <div className="container mx-auto px-4 py-12 md:px-6 md:py-16">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-primary">Katalog Produk</p>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight md:text-5xl">
            Belanja alat kesehatan <span className="text-gradient-brand">original</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            Ribuan produk alkes bergaransi resmi, harga transparan, siap dikirim ke seluruh Indonesia.
          </p>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
            {trust.map((t) => (
              <span key={t.text} className="flex items-center gap-2 text-sm text-muted-foreground">
                <t.icon className="h-4 w-4 text-primary" /> {t.text}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 md:px-6">
        {/* Category chips */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={clearCats}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${selectedCats.length === 0 ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`}
          >
            Semua Kategori
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => toggleCat(c)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${selectedCats.includes(c) ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Desktop sidebar */}
          <aside className="hidden w-72 shrink-0 lg:block">
            <div className="sticky top-28">
              <SidebarFilter {...filterProps} />
            </div>
          </aside>

          {/* Main */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Cari produk atau merek…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>

              {/* Mobile filter */}
              <Sheet>
                <SheetTrigger render={<Button variant="outline" className="lg:hidden gap-2" />}>
                  <SlidersHorizontal className="h-4 w-4" /> Filter
                </SheetTrigger>
                <SheetContent side="left" className="w-[320px] overflow-y-auto sm:w-[400px]">
                  <SheetHeader className="mb-4">
                    <SheetTitle>Filter Produk</SheetTitle>
                  </SheetHeader>
                  <SidebarFilter {...filterProps} />
                </SheetContent>
              </Sheet>

              <Select value={sort} onValueChange={(v) => { if (v) setSort(v); }}>
                <SelectTrigger className="w-full sm:w-[170px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="terlaris">Terlaris</SelectItem>
                  <SelectItem value="rating">Rating Tertinggi</SelectItem>
                  <SelectItem value="termurah">Harga Termurah</SelectItem>
                  <SelectItem value="termahal">Harga Termahal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <p className="mb-4 text-sm text-muted-foreground">
              Menampilkan <strong className="text-foreground">{paginated.length}</strong> dari <strong className="text-foreground">{filtered.length}</strong> produk
            </p>

            {/* Grid */}
            {filtered.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {paginated.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed py-20 text-center">
                <PackageOpen className="mb-4 h-12 w-12 text-muted-foreground/40" />
                <p className="font-heading text-lg font-semibold">Tidak ada produk yang cocok</p>
                <p className="mt-1 text-sm text-muted-foreground">Coba ubah kata kunci atau atur ulang filter.</p>
                <Button variant="outline" className="mt-5" onClick={() => { resetFilters(); setSearch(""); }}>Atur Ulang Filter</Button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} className="gap-1">
                  <ChevronLeft className="h-4 w-4" /> Sebelumnya
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const n = i + 1;
                    return (
                      <button
                        key={n}
                        onClick={() => setPage(n)}
                        className={`h-9 w-9 rounded-lg border text-sm font-medium transition-colors ${n === safePage ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
                <Button variant="outline" size="sm" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)} className="gap-1">
                  Selanjutnya <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
