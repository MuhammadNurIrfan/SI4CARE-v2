"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search, ScanLine, Plus, Minus, Trash2, Printer, CreditCard,
  Banknote, QrCode, X, ShoppingCart, AlertTriangle, Info,
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories } from "@/context/CategoryContext";
import { savePosTransaction, type PosProduct } from "@/actions/pos";
import {
  MDR_RATES, calcLineDiscount, calcCartTotals,
  type PosCartItem, type CartTotals,
} from "@/lib/pos-calc";

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

type ReceiptData = {
  refNumber: string;
  date: string;
  cart: PosCartItem[];
  totals: CartTotals;
  paymentMethod: string;
  cashReceived: number;
};

export function KasirTab({ products }: { products: PosProduct[] }) {
  const router = useRouter();
  const { getCategoryImage } = useCategories();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scanMode, setScanMode] = useState(false);
  const [scanMsg, setScanMsg]   = useState<{ ok: boolean; text: string } | null>(null);
  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [cashInput, setCashInput] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("tunai");
  const [cartDisc, setCartDisc] = useState(0);
  const [cartDiscType, setCartDiscType] = useState<"pct" | "rp">("pct");
  const [error, setError] = useState<string | null>(null);
  const [cartSheetOpen, setCartSheetOpen] = useState(false);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    (p.barcode ?? "").includes(search),
  );

  function handleBarcodeSubmit(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    const val = barcodeInput.trim();
    if (!val) return;
    const match = products.find((p) => p.barcode === val);
    if (match) {
      if (match.stock === 0) {
        setScanMsg({ ok: false, text: `${match.name} — stok habis` });
      } else {
        addToCart(match);
        setScanMsg({ ok: true, text: `✓ ${match.name} ditambahkan` });
      }
    } else {
      setScanMsg({ ok: false, text: `Barcode ${val} tidak ditemukan` });
    }
    setBarcodeInput("");
    setTimeout(() => setScanMsg(null), 2500);
  }

  const addToCart = (p: PosProduct) =>
    setCart((prev) => {
      const ex = prev.find((i) => i.id === p.id);
      if (ex) return prev.map((i) => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { id: p.id, name: p.name, sku: p.sku, price: p.price, hpp: p.hpp, qty: 1, disc: 0, discType: "pct" }];
    });

  const updateQty = (id: string, d: number) =>
    setCart((prev) => prev.map((i) => i.id === id ? { ...i, qty: Math.max(0, i.qty + d) } : i).filter((i) => i.qty > 0));

  const t = calcCartTotals(cart, cartDisc, cartDiscType, paymentMethod);
  const cashAmt = parseInt(cashInput) || 0;
  const itemCount = cart.reduce((s, i) => s + i.qty, 0);

  const handleCheckout = () => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await savePosTransaction({
          items: cart.map((i) => ({ variantId: i.id, name: i.name, sku: i.sku, price: i.price, qty: i.qty, disc: i.disc, discType: i.discType })),
          cartDisc, cartDiscType, paymentMethod, cashReceived: cashAmt,
        });
        if (result.ok) {
          setReceiptData({ refNumber: result.refNumber, date: new Date().toLocaleDateString("id-ID"), cart: [...cart], totals: { ...t }, paymentMethod, cashReceived: cashAmt });
          setCart([]);
          setCashInput("");
          setCartDisc(0);
          setPaymentOpen(false);
          setCartSheetOpen(false);
          setReceiptOpen(true);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Terjadi kesalahan");
      }
    });
  };

  const handleNew = () => {
    setReceiptData(null);
    setReceiptOpen(false);
    router.refresh();
  };

  const renderCartPanel = () => (
    <>
      <div className="p-4 border-b flex items-center justify-between shrink-0">
        <h2 className="font-bold text-base">Keranjang Kasir</h2>
        {cart.length > 0 && <Button variant="ghost" size="sm" className="text-destructive text-xs" onClick={() => setCart([])}>Hapus Semua</Button>}
      </div>
      <ScrollArea className="flex-1 min-h-0">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground p-4">
            <ScanLine className="h-10 w-10 mb-3 opacity-20" />
            <p className="text-sm">Scan barcode atau klik produk</p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {cart.map((item) => {
              const ld = calcLineDiscount(item);
              return (
                <div key={item.id} className="bg-muted/30 rounded-lg p-2.5 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs line-clamp-1">{item.name}</p>
                      <p className="text-[11px] text-muted-foreground">{fmt(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQty(item.id, -1)}><Minus className="h-3 w-3" /></Button>
                      <span className="w-6 text-center text-xs font-bold">{item.qty}</span>
                      <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQty(item.id, 1)}><Plus className="h-3 w-3" /></Button>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0" onClick={() => setCart((p) => p.filter((i) => i.id !== item.id))}><X className="h-3.5 w-3.5" /></Button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground shrink-0">Diskon item</span>
                    <Input type="number" min={0} value={item.disc || ""} placeholder="0" onChange={(e) => setCart((p) => p.map((i) => i.id === item.id ? { ...i, disc: Math.max(0, Number(e.target.value)) } : i))} className="h-6 text-[11px] px-1.5 flex-1" />
                    <div className="flex rounded-md border overflow-hidden shrink-0">
                      {(["pct", "rp"] as const).map((tp) => (
                        <button key={tp} onClick={() => setCart((p) => p.map((i) => i.id === item.id ? { ...i, discType: tp } : i))} className={`px-1.5 h-6 text-[10px] font-medium ${item.discType === tp ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground"}`}>{tp === "pct" ? "%" : "Rp"}</button>
                      ))}
                    </div>
                    <span className={`text-[11px] font-bold w-20 text-right shrink-0 ${ld > 0 ? "text-emerald-600" : "text-foreground"}`}>
                      {ld > 0 ? `-${fmt(ld)}` : fmt(item.price * item.qty)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      <div className="border-t p-3 space-y-2 shrink-0 bg-background">
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground shrink-0">Bayar via:</Label>
          <Select value={paymentMethod} onValueChange={(v) => { if (v) setPaymentMethod(v); }}>
            <SelectTrigger className="h-7 text-xs flex-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="tunai">Tunai</SelectItem>
              <SelectItem value="transfer">Transfer Bank</SelectItem>
              <SelectItem value="qris">QRIS</SelectItem>
              <SelectItem value="kartu_debit">Kartu Debit</SelectItem>
              <SelectItem value="kartu_kredit">Kartu Kredit</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1.5">
          <Label className="text-xs text-muted-foreground shrink-0">Diskon total:</Label>
          <Input type="number" min={0} value={cartDisc || ""} placeholder="0" onChange={(e) => setCartDisc(Number(e.target.value))} className="h-7 text-xs flex-1" />
          <div className="flex rounded-md border overflow-hidden shrink-0">
            {(["pct", "rp"] as const).map((tp) => (
              <button key={tp} onClick={() => setCartDiscType(tp)} className={`px-2 h-7 text-[11px] font-medium ${cartDiscType === tp ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground"}`}>{tp === "pct" ? "%" : "Rp"}</button>
            ))}
          </div>
        </div>
        <Separator />
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <div className="flex justify-between"><span>Subtotal</span><span className="text-foreground font-medium">{fmt(t.gross)}</span></div>
          {t.itemDiscTotal > 0 && <div className="flex justify-between text-emerald-600"><span>Diskon item</span><span>-{fmt(t.itemDiscTotal)}</span></div>}
          {t.cartDiscValue > 0 && <div className="flex justify-between text-emerald-600"><span>Diskon total{cartDiscType === "pct" ? ` (${cartDisc}%)` : ""}</span><span>-{fmt(t.cartDiscValue)}</span></div>}
          <div className="flex justify-between"><span>DPP</span><span className="text-foreground">{fmt(t.dpp)}</span></div>
          <div className="flex justify-between"><span>PPN 12%</span><span className="text-foreground">{fmt(t.ppn)}</span></div>
          {(MDR_RATES[paymentMethod] ?? 0) > 0 && (
            <div className="flex justify-between text-amber-600 text-[11px]">
              <span>MDR {MDR_RATES[paymentMethod]}% <span className="text-muted-foreground">(ditanggung toko)</span></span>
              <span>-{fmt(t.mdrAmount)}</span>
            </div>
          )}
        </div>
        <Separator />
        <div className="flex justify-between items-center">
          <span className="font-bold text-sm">Total</span>
          <span className="font-bold text-lg text-primary">{fmt(t.total)}</span>
        </div>
        {cart.length > 0 && (
          <div className={`text-xs rounded-lg p-2 flex items-center gap-1.5 ${t.marginPct < 0 ? "bg-red-50 text-red-700" : t.marginPct < 10 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
            {t.marginPct < 0 ? <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> : <Info className="h-3.5 w-3.5 shrink-0" />}
            <span>Margin bersih: <strong>{t.marginPct.toFixed(1)}%</strong> ({fmt(t.grossMargin)})</span>
          </div>
        )}
        <Button size="default" className="w-full font-semibold" disabled={cart.length === 0} onClick={() => setPaymentOpen(true)}>Proses Pembayaran</Button>
      </div>
    </>
  );

  return (
    <div className="flex h-full overflow-hidden">
      {/* Katalog */}
      <div className="flex-1 flex flex-col overflow-hidden lg:border-r">
        <div className="p-3 lg:p-4 bg-background border-b flex gap-2 lg:gap-3 shrink-0 flex-col">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
              <Input placeholder="Cari produk, SKU, atau barcode..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Button
              variant={scanMode ? "default" : "outline"}
              className="gap-2 shrink-0"
              // Label teks disembunyikan di bawah breakpoint sm, jadi tanpa
              // aria-label tombol ini tidak punya nama aksesibel di mobile.
              aria-label={scanMode ? "Tutup mode scan barcode" : "Scan barcode"}
              onClick={() => { setScanMode((s) => !s); setScanMsg(null); setBarcodeInput(""); }}
            >
              <ScanLine className="h-4 w-4" /><span className="hidden sm:inline">{scanMode ? "Tutup Scan" : "Scan"}</span>
            </Button>
          </div>
          {scanMode && (
            <div className="flex flex-col gap-1.5">
              <Input
                autoFocus
                placeholder="Arahkan scanner atau ketik barcode lalu tekan Enter…"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={handleBarcodeSubmit}
                className="font-mono"
              />
              {scanMsg && (
                <p className={`text-xs px-1 ${scanMsg.ok ? "text-emerald-600" : "text-destructive"}`}>{scanMsg.text}</p>
              )}
            </div>
          )}
        </div>
        <ScrollArea className="flex-1 p-3 lg:p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 lg:gap-3 pb-24 lg:pb-0">
            {filtered.map((p) => {
              const img = getCategoryImage(p.category);
              const outOfStock = p.stock === 0;
              return (
                <button key={p.id} onClick={() => !outOfStock && addToCart(p)} disabled={outOfStock}
                  className="text-left bg-card border rounded-xl p-3 hover:shadow-md hover:border-primary/50 transition-all active:scale-95 group disabled:opacity-50 disabled:cursor-not-allowed">
                  <div className="w-full aspect-[5/3] lg:aspect-[4/3] bg-muted rounded-lg mb-2 overflow-hidden flex items-center justify-center text-xs text-muted-foreground">
                    {img ? <img src={img} alt={p.name} className="h-full w-full object-cover" /> : "Foto"}
                  </div>
                  <p className="text-[10px] text-muted-foreground font-mono mb-0.5">{p.sku}</p>
                  <h3 className="font-medium text-xs line-clamp-2 mb-1.5 group-hover:text-primary transition-colors">{p.name}</h3>
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-sm text-primary">{fmt(p.price)}</p>
                    <Badge variant={p.stock === 0 ? "destructive" : p.stock <= 5 ? "outline" : "secondary"} className="text-[9px]">
                      {p.stock === 0 ? "Habis" : p.stock}
                    </Badge>
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && <div className="col-span-full flex items-center justify-center h-48 text-muted-foreground">Produk tidak ditemukan</div>}
          </div>
        </ScrollArea>
      </div>

      {/* Keranjang desktop */}
      <div className="hidden lg:flex w-[400px] flex-col bg-background shrink-0">{renderCartPanel()}</div>

      {/* Mobile: floating bar */}
      <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Button className="w-full h-12 justify-between font-semibold text-sm" onClick={() => setCartSheetOpen(true)}>
          <span className="flex items-center gap-2"><ShoppingCart className="h-4 w-4" />Keranjang {itemCount > 0 && `(${itemCount})`}</span>
          <span>{cart.length > 0 ? fmt(t.total) : "Kosong"}</span>
        </Button>
      </div>

      <Sheet open={cartSheetOpen} onOpenChange={setCartSheetOpen}>
        <SheetContent side="bottom" showCloseButton={false} className="lg:hidden h-[88dvh] flex flex-col gap-0 p-0 rounded-t-2xl">
          <SheetTitle className="sr-only">Keranjang Kasir</SheetTitle>
          <div className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-muted-foreground/20" />
          {renderCartPanel()}
        </SheetContent>
      </Sheet>

      {/* Payment Dialog */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          <DialogHeader className="bg-primary text-primary-foreground p-5">
            <DialogTitle>Pembayaran Kasir</DialogTitle>
            <p className="text-primary-foreground/80 text-sm">Total: <span className="font-bold text-xl">{fmt(t.total)}</span></p>
          </DialogHeader>
          <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
            {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>}
            <div className="grid grid-cols-3 gap-2">
              {(["tunai", "qris", "kartu_kredit"] as const).map((m) => (
                <button key={m} onClick={() => setPaymentMethod(m)}
                  className={`flex flex-col items-center gap-1.5 p-3 border rounded-xl text-xs font-medium transition-all ${paymentMethod === m ? "border-primary ring-1 ring-primary bg-primary/5" : "hover:bg-muted"}`}>
                  {m === "tunai" ? <Banknote className="h-5 w-5" /> : m === "qris" ? <QrCode className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
                  {m === "tunai" ? "Tunai" : m === "qris" ? "QRIS" : "Kartu"}
                </button>
              ))}
            </div>
            {paymentMethod === "tunai" && (
              <div className="space-y-2">
                <Input type="number" placeholder="Nominal diterima..." className="h-12 text-lg font-bold text-center" value={cashInput} onChange={(e) => setCashInput(e.target.value)} />
                <div className="grid grid-cols-3 gap-1.5">
                  {[t.total, 50000, 100000, 200000, 500000, 1000000].filter((v, i, a) => a.indexOf(v) === i).slice(0, 6).map((a) => (
                    <Button key={a} variant="outline" className="text-xs h-8" onClick={() => setCashInput(String(a))}>{fmt(a)}</Button>
                  ))}
                </div>
                {cashAmt >= t.total && cashAmt > 0 && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex justify-between text-emerald-700">
                    <span className="font-medium">Kembalian</span>
                    <span className="font-bold">{fmt(cashAmt - t.total)}</span>
                  </div>
                )}
              </div>
            )}
            {paymentMethod === "qris" && (
              <div className="flex flex-col items-center py-2">
                <div className="w-40 h-40 bg-muted rounded-lg border-2 border-dashed flex items-center justify-center mb-2">
                  <QrCode className="h-16 w-16 text-muted-foreground/30" />
                </div>
                <p className="text-xs text-muted-foreground text-center">Pelanggan bayar {fmt(t.total)} · MDR 0.7% ditanggung toko</p>
              </div>
            )}
            <Button size="lg" className="w-full" disabled={(paymentMethod === "tunai" && cashAmt < t.total) || isPending} onClick={handleCheckout}>
              {isPending ? "Menyimpan..." : "Konfirmasi Bayar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={receiptOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-sm">
          {receiptData && (
            <>
              <div className="border rounded-lg p-5 space-y-3 bg-white text-black font-mono text-xs">
                <div className="text-center space-y-0.5">
                  <p className="text-sm font-bold">si4care</p>
                  <p className="text-[10px]">Jl. Kesehatan No. 123, Jakarta Selatan</p>
                </div>
                <Separator />
                <div className="flex justify-between text-[10px]"><span>No: {receiptData.refNumber}</span><span>{receiptData.date}</span></div>
                <Separator />
                <div className="space-y-1.5">
                  {receiptData.cart.map((i) => {
                    const ld = calcLineDiscount(i);
                    return (
                      <div key={i.id}>
                        <p className="truncate">{i.name}</p>
                        <div className="flex justify-between pl-2"><span>{i.qty}× {fmt(i.price)}</span><span className="font-bold">{fmt(i.price * i.qty)}</span></div>
                        {ld > 0 && <div className="flex justify-between pl-2 text-[10px]"><span>Diskon</span><span>-{fmt(ld)}</span></div>}
                      </div>
                    );
                  })}
                </div>
                <Separator />
                <div className="space-y-0.5">
                  <div className="flex justify-between"><span>Subtotal</span><span>{fmt(receiptData.totals.gross)}</span></div>
                  {receiptData.totals.totalDisc > 0 && <div className="flex justify-between"><span>Total Diskon</span><span>-{fmt(receiptData.totals.totalDisc)}</span></div>}
                  <div className="flex justify-between"><span>DPP</span><span>{fmt(receiptData.totals.dpp)}</span></div>
                  <div className="flex justify-between"><span>PPN 12%</span><span>{fmt(receiptData.totals.ppn)}</span></div>
                  <div className="flex justify-between font-bold text-sm"><span>TOTAL</span><span>{fmt(receiptData.totals.total)}</span></div>
                  <div className="flex justify-between"><span>Bayar ({receiptData.paymentMethod})</span><span>{receiptData.paymentMethod === "tunai" ? fmt(receiptData.cashReceived) : "Non-tunai"}</span></div>
                  {receiptData.paymentMethod === "tunai" && <div className="flex justify-between"><span>Kembalian</span><span>{fmt(Math.max(0, receiptData.cashReceived - receiptData.totals.total))}</span></div>}
                </div>
                <Separator />
                <p className="text-center text-[10px]">Terima kasih telah berbelanja di si4care!</p>
              </div>
              <div className="flex gap-2 mt-2">
                <Button variant="outline" className="flex-1 gap-1.5 text-xs" onClick={() => window.print()}><Printer className="h-3.5 w-3.5" /> Cetak</Button>
                <Button className="flex-1 text-xs" onClick={handleNew}>Transaksi Baru</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
