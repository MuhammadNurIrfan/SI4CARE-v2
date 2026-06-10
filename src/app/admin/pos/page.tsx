"use client";

import { useState } from "react";
import {
  Search, ScanLine, Plus, Minus, Trash2, Printer, CreditCard,
  Banknote, QrCode, X, Store, ShoppingBag, ShoppingCart, Calculator, AlertTriangle, Info,
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useCategories } from "@/context/CategoryContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { POS_CATALOG } from "@/lib/mock-data";

const catalog = POS_CATALOG;

const mdrRates: Record<string, number> = {
  tunai: 0, transfer: 0, qris: 0.7, kartu_debit: 1.0, kartu_kredit: 2.5,
};

const platformCommission: Record<string, number> = {
  tokopedia: 1.8, shopee: 2.2, lazada: 2.5, blibli: 3.0, custom: 0,
};

const formatRp = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

interface CartItem { id: string; name: string; sku: string; price: number; hpp: number; qty: number; disc: number; discType: "pct" | "rp"; }
interface MpItem   { id: string; name: string; qty: number; price: number; hpp: number; }

/** Nominal discount for one cart line */
const lineDiscount = (i: CartItem) => {
  const gross = i.price * i.qty;
  const d = i.discType === "pct" ? (gross * i.disc) / 100 : i.disc;
  return Math.min(Math.max(0, d), gross);
};

/* ══════════════════════════════════════════════════════════════════
   TAB 1 — KASIR (POS TOKO FISIK)
══════════════════════════════════════════════════════════════════ */
function KasirTab() {
  const { getCategoryImage } = useCategories();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [cashInput, setCashInput] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<keyof typeof mdrRates>("tunai");
  // Overall (whole-cart) discount
  const [cartDisc, setCartDisc] = useState(0);
  const [cartDiscType, setCartDiscType] = useState<"pct" | "rp">("pct");

  const filtered = catalog.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode.includes(search)
  );

  const addToCart = (p: typeof catalog[0]) =>
    setCart(prev => {
      const ex = prev.find(i => i.id === p.id);
      if (ex) return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { id: p.id, name: p.name, sku: p.sku, price: p.price, hpp: p.hpp, qty: 1, disc: 0, discType: "pct" }];
    });

  const updateQty = (id: string, d: number) =>
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty + d) } : i).filter(i => i.qty > 0));

  const setItemDisc = (id: string, disc: number) =>
    setCart(prev => prev.map(i => i.id === id ? { ...i, disc: Math.max(0, disc) } : i));
  const setItemDiscType = (id: string, t: "pct" | "rp") =>
    setCart(prev => prev.map(i => i.id === id ? { ...i, discType: t } : i));

  const gross        = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const itemDiscTotal = cart.reduce((s, i) => s + lineDiscount(i), 0);
  const afterItemDisc = gross - itemDiscTotal;
  const cartDiscValue = Math.min(cartDiscType === "pct" ? (afterItemDisc * cartDisc) / 100 : cartDisc, afterItemDisc);
  const totalDisc     = itemDiscTotal + cartDiscValue;
  const dpp           = afterItemDisc - cartDiscValue; // taxable base after all discounts
  const ppn           = dpp * 0.12;
  const total         = dpp + ppn;
  const mdr           = total * (mdrRates[paymentMethod] / 100);
  const netKasir      = total - mdr;
  const totalHpp      = cart.reduce((s, i) => s + i.hpp * i.qty, 0);
  const marginNet     = netKasir - totalHpp - ppn;
  const marginPct     = dpp > 0 ? (marginNet / dpp) * 100 : 0;
  const cashAmt       = parseInt(cashInput) || 0;
  const change        = cashAmt - total;
  const subtotal      = gross; // alias for receipt

  const [receiptMeta, setReceiptMeta] = useState({ no: "", date: "" });
  const handleCheckout = () => {
    setReceiptMeta({ no: `POS-${String(Date.now()).slice(-6)}`, date: new Date().toLocaleDateString("id-ID") });
    setPaymentOpen(false);
    setCartSheetOpen(false);
    setReceiptOpen(true);
  };
  const handleNew = () => { setCart([]); setCashInput(""); setCartDisc(0); setReceiptOpen(false); };

  const [cartSheetOpen, setCartSheetOpen] = useState(false);
  const itemCount = cart.reduce((s, i) => s + i.qty, 0);

  /* Panel keranjang — dipakai di sidebar desktop & bottom-sheet mobile */
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
              {cart.map(item => {
                const ld = lineDiscount(item);
                return (
                <div key={item.id} className="bg-muted/30 rounded-lg p-2.5 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs line-clamp-1">{item.name}</p>
                      <p className="text-[11px] text-muted-foreground">{formatRp(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQty(item.id, -1)}><Minus className="h-3 w-3" /></Button>
                      <span className="w-6 text-center text-xs font-bold">{item.qty}</span>
                      <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQty(item.id, 1)}><Plus className="h-3 w-3" /></Button>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0" onClick={() => setCart(p => p.filter(i => i.id !== item.id))}><X className="h-3.5 w-3.5" /></Button>
                  </div>
                  {/* per-item discount */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-muted-foreground shrink-0">Diskon item</span>
                    <Input
                      type="number" min={0} value={item.disc || ""} placeholder="0"
                      onChange={e => setItemDisc(item.id, Number(e.target.value))}
                      className="h-6 text-[11px] px-1.5 flex-1"
                    />
                    <div className="flex rounded-md border overflow-hidden shrink-0">
                      {(["pct", "rp"] as const).map(t => (
                        <button key={t} onClick={() => setItemDiscType(item.id, t)}
                          className={`px-1.5 h-6 text-[10px] font-medium ${item.discType === t ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground"}`}>
                          {t === "pct" ? "%" : "Rp"}
                        </button>
                      ))}
                    </div>
                    <span className={`text-[11px] font-bold w-20 text-right shrink-0 ${ld > 0 ? "text-emerald-600" : "text-foreground"}`}>
                      {ld > 0 ? `-${formatRp(ld)}` : formatRp(item.price * item.qty)}
                    </span>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Totals */}
        <div className="border-t p-3 space-y-2 shrink-0 bg-background">
          {/* Payment method selector */}
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground shrink-0">Bayar via:</Label>
            <Select value={paymentMethod} onValueChange={v => { if (v) setPaymentMethod(v as keyof typeof mdrRates); }}>
              <SelectTrigger className="h-7 text-xs flex-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="tunai">Tunai (0% MDR)</SelectItem>
                <SelectItem value="transfer">Transfer Bank (0% MDR)</SelectItem>
                <SelectItem value="qris">QRIS (0.7% MDR)</SelectItem>
                <SelectItem value="kartu_debit">Kartu Debit (1.0% MDR)</SelectItem>
                <SelectItem value="kartu_kredit">Kartu Kredit (2.5% MDR)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Overall cart discount */}
          <div className="flex items-center gap-1.5">
            <Label className="text-xs text-muted-foreground shrink-0">Diskon total:</Label>
            <Input
              type="number" min={0} value={cartDisc || ""} placeholder="0"
              onChange={e => setCartDisc(Number(e.target.value))}
              className="h-7 text-xs flex-1"
            />
            <div className="flex rounded-md border overflow-hidden shrink-0">
              {(["pct", "rp"] as const).map(t => (
                <button key={t} onClick={() => setCartDiscType(t)}
                  className={`px-2 h-7 text-[11px] font-medium ${cartDiscType === t ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground"}`}>
                  {t === "pct" ? "%" : "Rp"}
                </button>
              ))}
            </div>
          </div>
          <Separator />
          <div className="space-y-1.5 text-xs text-muted-foreground">
            <div className="flex justify-between"><span>Subtotal</span><span className="text-foreground font-medium">{formatRp(gross)}</span></div>
            {itemDiscTotal > 0 && (
              <div className="flex justify-between text-emerald-600"><span>Diskon item</span><span>-{formatRp(itemDiscTotal)}</span></div>
            )}
            {cartDiscValue > 0 && (
              <div className="flex justify-between text-emerald-600"><span>Diskon total{cartDiscType === "pct" ? ` (${cartDisc}%)` : ""}</span><span>-{formatRp(cartDiscValue)}</span></div>
            )}
            <div className="flex justify-between"><span>DPP (setelah diskon)</span><span className="text-foreground">{formatRp(dpp)}</span></div>
            <div className="flex justify-between"><span>PPN 12%</span><span className="text-foreground">{formatRp(ppn)}</span></div>
            {mdrRates[paymentMethod] > 0 && (
              <div className="flex justify-between text-amber-600">
                <span>MDR {mdrRates[paymentMethod]}%</span>
                <span>-{formatRp(mdr)}</span>
              </div>
            )}
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="font-bold text-sm">Total</span>
            <span className="font-bold text-lg text-primary">{formatRp(total)}</span>
          </div>
          {/* Margin indicator */}
          {cart.length > 0 && (
            <div className={`text-xs rounded-lg p-2 flex items-center gap-1.5 ${marginPct < 0 ? "bg-red-50 text-red-700" : marginPct < 10 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
              {marginPct < 0 ? <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> : <Info className="h-3.5 w-3.5 shrink-0" />}
              <span>Margin bersih (setelah HPP & MDR): <strong>{marginPct.toFixed(1)}%</strong> ({formatRp(marginNet)})</span>
            </div>
          )}
          <Button size="default" className="w-full font-semibold" disabled={cart.length === 0} onClick={() => setPaymentOpen(true)}>Proses Pembayaran</Button>
        </div>
    </>
  );

  return (
    <div className="flex h-full overflow-hidden">
      {/* LEFT: Catalog */}
      <div className="flex-1 flex flex-col overflow-hidden lg:border-r">
        <div className="p-3 lg:p-4 bg-background border-b flex gap-2 lg:gap-3 shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
            <Input placeholder="Cari produk, SKU, atau scan barcode..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Button variant="outline" className="gap-2 shrink-0"><ScanLine className="h-4 w-4" /><span className="hidden sm:inline">Scan</span></Button>
        </div>
        <ScrollArea className="flex-1 p-3 lg:p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 lg:gap-3 pb-24 lg:pb-0">
            {filtered.map(p => (
              <button key={p.id} onClick={() => addToCart(p)}
                className="text-left bg-card border rounded-xl p-3 hover:shadow-md hover:border-primary/50 transition-all active:scale-95 group">
                <div className="w-full aspect-[5/3] lg:aspect-[4/3] bg-muted rounded-lg mb-2 overflow-hidden flex items-center justify-center text-xs text-muted-foreground">
                  {getCategoryImage(p.category) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={getCategoryImage(p.category)} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    "Foto"
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground font-mono mb-0.5">{p.sku}</p>
                <h3 className="font-medium text-xs line-clamp-2 mb-1.5 group-hover:text-primary transition-colors">{p.name}</h3>
                <div className="flex items-center justify-between">
                  <p className="font-bold text-sm text-primary">{formatRp(p.price)}</p>
                  <Badge variant="secondary" className="text-[9px]">{p.stock}</Badge>
                </div>
              </button>
            ))}
            {filtered.length === 0 && <div className="col-span-full flex items-center justify-center h-48 text-muted-foreground">Produk tidak ditemukan</div>}
          </div>
        </ScrollArea>
      </div>

      {/* RIGHT: Cart (desktop) */}
      <div className="hidden lg:flex w-[400px] flex-col bg-background shrink-0">
        {renderCartPanel()}
      </div>

      {/* Mobile: floating cart bar */}
      <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Button className="w-full h-12 justify-between font-semibold text-sm" onClick={() => setCartSheetOpen(true)}>
          <span className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Keranjang {itemCount > 0 && `(${itemCount} item)`}
          </span>
          <span>{cart.length > 0 ? formatRp(total) : "Kosong"}</span>
        </Button>
      </div>

      {/* Mobile: cart bottom sheet */}
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
            <p className="text-primary-foreground/80 text-sm">Total: <span className="font-bold text-xl">{formatRp(total)}</span></p>
          </DialogHeader>
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-3 gap-2">
              {(["tunai","qris","kartu_kredit"] as const).map(m => (
                <button key={m} onClick={() => setPaymentMethod(m)}
                  className={`flex flex-col items-center gap-1.5 p-3 border rounded-xl text-xs font-medium transition-all ${paymentMethod === m ? "border-primary ring-1 ring-primary bg-primary/5" : "hover:bg-muted"}`}>
                  {m === "tunai" ? <Banknote className="h-5 w-5" /> : m === "qris" ? <QrCode className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
                  {m === "tunai" ? "Tunai" : m === "qris" ? "QRIS" : "Kartu"}
                </button>
              ))}
            </div>
            {paymentMethod === "tunai" && (
              <div className="space-y-2">
                <Input type="number" placeholder="Nominal diterima..." className="h-12 text-lg font-bold text-center" value={cashInput} onChange={e => setCashInput(e.target.value)} />
                <div className="grid grid-cols-3 gap-1.5">
                  {[total, 50000, 100000, 200000, 500000, 1000000].filter((v,i,a) => a.indexOf(v)===i).slice(0,6).map(a => (
                    <Button key={a} variant="outline" className="text-xs h-8" onClick={() => setCashInput(String(a))}>{formatRp(a)}</Button>
                  ))}
                </div>
                {cashAmt >= total && cashAmt > 0 && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex justify-between text-emerald-700">
                    <span className="font-medium">Kembalian</span>
                    <span className="font-bold">{formatRp(change)}</span>
                  </div>
                )}
              </div>
            )}
            {paymentMethod === "qris" && (
              <div className="flex flex-col items-center py-2">
                <div className="w-40 h-40 bg-muted rounded-lg border-2 border-dashed flex items-center justify-center mb-2">
                  <QrCode className="h-16 w-16 text-muted-foreground/30" />
                </div>
                <p className="text-xs text-muted-foreground">Scan QR · MDR 0.7% ({formatRp(mdr)}) akan dikurangi</p>
              </div>
            )}
            <Button size="lg" className="w-full" disabled={paymentMethod === "tunai" && cashAmt < total} onClick={handleCheckout}>Konfirmasi Bayar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogContent className="sm:max-w-sm">
          <div className="border rounded-lg p-5 space-y-3 bg-white text-black font-mono text-xs">
            <div className="text-center space-y-0.5">
              <p className="text-sm font-bold">si4care</p>
              <p className="text-[10px]">Jl. Kesehatan No. 123, Jakarta Selatan</p>
            </div>
            <Separator />
            <div className="flex justify-between text-[10px]"><span>No: {receiptMeta.no}</span><span>{receiptMeta.date}</span></div>
            <Separator />
            <div className="space-y-1.5">
              {cart.map(i => {
                const ld = lineDiscount(i);
                return (
                <div key={i.id}>
                  <p className="truncate">{i.name}</p>
                  <div className="flex justify-between pl-2"><span>{i.qty}x {formatRp(i.price)}</span><span className="font-bold">{formatRp(i.price*i.qty)}</span></div>
                  {ld > 0 && <div className="flex justify-between pl-2 text-[10px]"><span>Diskon item</span><span>-{formatRp(ld)}</span></div>}
                </div>
                );
              })}
            </div>
            <Separator />
            <div className="space-y-0.5">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatRp(subtotal)}</span></div>
              {totalDisc > 0 && <div className="flex justify-between"><span>Total Diskon</span><span>-{formatRp(totalDisc)}</span></div>}
              <div className="flex justify-between"><span>DPP</span><span>{formatRp(dpp)}</span></div>
              <div className="flex justify-between"><span>PPN 12%</span><span>{formatRp(ppn)}</span></div>
              <div className="flex justify-between font-bold text-sm"><span>TOTAL</span><span>{formatRp(total)}</span></div>
              <div className="flex justify-between"><span>Bayar ({paymentMethod})</span><span>{paymentMethod==="tunai"?formatRp(cashAmt):"Non-tunai"}</span></div>
              {paymentMethod==="tunai" && <div className="flex justify-between"><span>Kembalian</span><span>{formatRp(change>0?change:0)}</span></div>}
            </div>
            <Separator />
            <p className="text-center text-[10px]">Terima kasih telah berbelanja di si4care!</p>
          </div>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1 gap-1.5 text-xs" onClick={() => window.print()}><Printer className="h-3.5 w-3.5" /> Cetak</Button>
            <Button className="flex-1 text-xs" onClick={handleNew}>Transaksi Baru</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   TAB 2 — TRANSAKSI MARKETPLACE (INPUT MANUAL)
══════════════════════════════════════════════════════════════════ */
function MarketplaceTab() {
  const [platform, setPlatform] = useState("tokopedia");
  const [noPesanan, setNoPesanan] = useState("");
  const [namaPembeli, setNamaPembeli] = useState("");
  const [items, setItems] = useState<MpItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [qty, setQty] = useState(1);

  // Fee fields (semua dalam persen kecuali yang nominal)
  const [komisiPlatform, setKomisiPlatform] = useState(platformCommission["tokopedia"]);
  const [mdrPersen, setMdrPersen] = useState(0.7);
  const [biayaLayanan, setBiayaLayanan] = useState(1000); // nominal
  const [ongkirDiterima, setOngkirDiterima] = useState(0); // ongkir dari pembeli
  const [ongkirKurir, setOngkirKurir] = useState(0);      // ongkir dibayar ke kurir
  const [subsidiOngkir, setSubsidiOngkir] = useState(0);  // subsidi dari platform
  const [voucherPlatform, setVoucherPlatform] = useState(0); // diskon ditanggung platform
  const [saved, setSaved] = useState(false);

  // Custom fees (admin dapat menambah dengan nama bebas)
  type FeeKind = "pct" | "rp";
  interface CustomFee { id: string; name: string; kind: FeeKind; value: number; sign: "minus" | "plus"; }
  const [customFees, setCustomFees] = useState<CustomFee[]>([]);
  const addCustomFee = () => setCustomFees(prev => [...prev, { id: String(Date.now()), name: "", kind: "rp", value: 0, sign: "minus" }]);
  const updateCustomFee = (id: string, patch: Partial<CustomFee>) => setCustomFees(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f));
  const removeCustomFee = (id: string) => setCustomFees(prev => prev.filter(f => f.id !== id));

  const addItem = () => {
    const prod = catalog.find(p => p.id === selectedProduct);
    if (!prod) return;
    setItems(prev => {
      const ex = prev.find(i => i.id === prod.id);
      if (ex) return prev.map(i => i.id === prod.id ? { ...i, qty: i.qty + qty } : i);
      return [...prev, { id: prod.id, name: prod.name, qty, price: prod.price, hpp: prod.hpp }];
    });
    setQty(1);
  };

  const nilaiBarang   = items.reduce((s, i) => s + i.price * i.qty, 0);
  const nilaiHpp      = items.reduce((s, i) => s + i.hpp * i.qty, 0);

  // Gross revenue yang masuk ke rekening toko dari platform
  // = nilai barang + ongkir diterima + subsidi ongkir + voucher ditanggung platform
  //   - komisi platform - MDR - biaya layanan - ongkir kurir
  const komisiNominal       = nilaiBarang * (komisiPlatform / 100);
  const mdrNominal          = nilaiBarang * (mdrPersen / 100);
  // Hitung nominal setiap custom fee
  const customFeeRows = customFees.map(f => {
    const nominal = f.kind === "pct" ? (nilaiBarang * (f.value / 100)) : f.value;
    const signed = f.sign === "plus" ? nominal : -nominal;
    return { ...f, nominal, signed };
  });
  const customFeesTotal = customFeeRows.reduce((s, f) => s + f.signed, 0); // + tambah pendapatan, - potongan
  const totalPotonganPlatform = komisiNominal + mdrNominal + biayaLayanan;
  const netOngkir           = ongkirDiterima + subsidiOngkir - ongkirKurir;
  const netDiterima         = nilaiBarang + voucherPlatform + netOngkir - totalPotonganPlatform + customFeesTotal;
  const marginKotor         = netDiterima - nilaiHpp;
  const marginPct           = nilaiBarang > 0 ? (marginKotor / nilaiBarang) * 100 : 0;

  const isMinus  = marginKotor < 0;
  const isTipis  = !isMinus && marginPct < 10;

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

  return (
    <ScrollArea className="flex-1 min-h-0 p-4 md:p-5">
      <div className="max-w-3xl mx-auto space-y-5">
        <div>
          <h2 className="text-lg font-bold">Input Transaksi Marketplace (Manual)</h2>
          <p className="text-sm text-muted-foreground">Catat pesanan dari marketplace secara manual beserta rincian biaya yang berbeda tiap platform.</p>
        </div>

        {/* Pending workflow explanation */}
        <div className="flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-sm">
          <Info className="h-5 w-5 shrink-0 text-amber-600" />
          <div className="text-amber-900">
            <p className="font-semibold">Disimpan sebagai &ldquo;Pending — Menunggu Validasi Settlement&rdquo;</p>
            <p className="mt-0.5 text-xs leading-relaxed text-amber-800">
              Transaksi ini langsung memesan (booking) stok dan muncul di <strong>Pesanan Masuk</strong>. Nilainya masuk ke <strong>Dana Pending</strong> di Dashboard — <strong>belum</strong> dihitung sebagai laba final. Laba baru diakui setelah dana settlement diterima &amp; <strong>divalidasi Owner</strong> di menu Marketplace.
            </p>
          </div>
        </div>

        {/* Platform & Header */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Informasi Pesanan</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Platform</Label>
                <Select value={platform} onValueChange={v => { if (v) { setPlatform(v); if (v !== "custom") setKomisiPlatform(platformCommission[v] ?? 0); }}}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tokopedia">Tokopedia (1.8%)</SelectItem>
                    <SelectItem value="shopee">Shopee (2.2%)</SelectItem>
                    <SelectItem value="lazada">Lazada (2.5%)</SelectItem>
                    <SelectItem value="blibli">Blibli (3.0%)</SelectItem>
                    <SelectItem value="custom">Platform Lain (Kustom)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">No. Pesanan Platform</Label>
                <Input placeholder="cth: INV/20260606/XXX" value={noPesanan} onChange={e => setNoPesanan(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Nama Pembeli</Label>
              <Input placeholder="Nama pelanggan di marketplace" value={namaPembeli} onChange={e => setNamaPembeli(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Produk yang Dijual</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Select value={selectedProduct} onValueChange={v => { if (v) setSelectedProduct(v); }}>
                <SelectTrigger className="flex-1"><SelectValue placeholder="Pilih produk..." /></SelectTrigger>
                <SelectContent>
                  {catalog.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name} — {formatRp(p.price)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center border rounded-lg">
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setQty(q => Math.max(1, q - 1))}><Minus className="h-3.5 w-3.5" /></Button>
                <span className="w-8 text-center text-sm font-bold">{qty}</span>
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setQty(q => q + 1)}><Plus className="h-3.5 w-3.5" /></Button>
              </div>
              <Button onClick={addItem} disabled={!selectedProduct}><Plus className="h-4 w-4 mr-1" /> Tambah</Button>
            </div>
            {items.length > 0 && (
              <div className="border rounded-lg divide-y overflow-hidden">
                {items.map(item => (
                  <div key={item.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs truncate">{item.name}</p>
                      <p className="text-[11px] text-muted-foreground">HPP: {formatRp(item.hpp)} · Jual: {formatRp(item.price)}</p>
                    </div>
                    <span className="text-xs">{item.qty}×</span>
                    <span className="font-bold text-xs w-24 text-right">{formatRp(item.price * item.qty)}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setItems(p => p.filter(i => i.id !== item.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                ))}
                <div className="flex justify-between px-3 py-2 bg-muted/30 text-sm font-bold">
                  <span>Subtotal Nilai Barang</span>
                  <span>{formatRp(nilaiBarang)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Biaya & Potongan */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Biaya & Potongan Platform</CardTitle></CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Komisi/Admin Fee Platform (%)</Label>
                <Input type="number" step="0.1" value={komisiPlatform} onChange={e => setKomisiPlatform(Number(e.target.value))} />
                <p className="text-[11px] text-muted-foreground">= {formatRp(komisiNominal)}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">MDR / Biaya Pembayaran (%)</Label>
                <Input type="number" step="0.1" value={mdrPersen} onChange={e => setMdrPersen(Number(e.target.value))} />
                <p className="text-[11px] text-muted-foreground">= {formatRp(mdrNominal)}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Biaya Layanan Tetap (Rp)</Label>
                <Input type="number" value={biayaLayanan} onChange={e => setBiayaLayanan(Number(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Voucher Ditanggung Platform (Rp)</Label>
                <Input type="number" value={voucherPlatform} onChange={e => setVoucherPlatform(Number(e.target.value))} />
                <p className="text-[11px] text-emerald-600">Tambah ke pendapatan</p>
              </div>
            </div>

            {/* Custom fees — admin bisa tambah komponen biaya/potongan dengan nama bebas */}
            <Separator className="my-4" />
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">Biaya / Potongan Tambahan</p>
                  <p className="text-[11px] text-muted-foreground">Tambah komponen lain (mis. Biaya Iklan, Cashback Penjual, dll). Beri nama bebas.</p>
                </div>
                <Button type="button" variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={addCustomFee}>
                  <Plus className="h-3.5 w-3.5" /> Tambah Kolom
                </Button>
              </div>
              {customFees.length === 0 && (
                <p className="rounded-lg border border-dashed py-3 text-center text-[11px] text-muted-foreground">
                  Belum ada komponen tambahan.
                </p>
              )}
              {customFees.map((f, idx) => {
                const row = customFeeRows[idx];
                return (
                  <div key={f.id} className="grid grid-cols-12 items-end gap-2 rounded-lg border bg-muted/20 p-2.5">
                    <div className="col-span-12 sm:col-span-5 space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Nama Komponen</Label>
                      <Input
                        placeholder="cth: Biaya Iklan Shopee"
                        value={f.name}
                        onChange={e => updateCustomFee(f.id, { name: e.target.value })}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="col-span-5 sm:col-span-2 space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Tipe</Label>
                      <div className="flex h-8 rounded-md border overflow-hidden">
                        {(["rp","pct"] as const).map(k => (
                          <button key={k} type="button" onClick={() => updateCustomFee(f.id, { kind: k })}
                            className={`flex-1 text-[11px] font-medium ${f.kind === k ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground"}`}>
                            {k === "rp" ? "Rp" : "%"}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-7 sm:col-span-3 space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Nilai</Label>
                      <Input
                        type="number" min={0} step={f.kind === "pct" ? "0.1" : "1"}
                        value={f.value || ""}
                        onChange={e => updateCustomFee(f.id, { value: Number(e.target.value) })}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="col-span-9 sm:col-span-1 space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Arah</Label>
                      <Select value={f.sign} onValueChange={v => { if (v === "plus" || v === "minus") updateCustomFee(f.id, { sign: v }); }}>
                        <SelectTrigger className="h-8 text-xs px-2"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minus">−</SelectItem>
                          <SelectItem value="plus">+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3 sm:col-span-1 flex justify-end">
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeCustomFee(f.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="col-span-12 -mt-1 flex justify-between text-[11px]">
                      <span className="text-muted-foreground">{f.kind === "pct" ? `${f.value || 0}% × nilai barang` : "Nominal tetap"}</span>
                      <span className={row.sign === "plus" ? "text-emerald-700 font-medium" : "text-amber-700 font-medium"}>
                        {row.sign === "plus" ? "+" : "−"}{formatRp(row.nominal)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Ongkir */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Ongkos Kirim</CardTitle></CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Ongkir dari Pembeli (Rp)</Label>
                <Input type="number" value={ongkirDiterima} onChange={e => setOngkirDiterima(Number(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Subsidi Ongkir Platform (Rp)</Label>
                <Input type="number" value={subsidiOngkir} onChange={e => setSubsidiOngkir(Number(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Ongkir Dibayar ke Kurir (Rp)</Label>
                <Input type="number" value={ongkirKurir} onChange={e => setOngkirKurir(Number(e.target.value))} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Kalkulasi Bersih */}
        {items.length > 0 && (
          <Card className={isMinus ? "border-destructive/40 bg-destructive/5" : isTipis ? "border-amber-300 bg-amber-50/50" : "border-emerald-300 bg-emerald-50/50"}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calculator className="h-4 w-4" /> Rekap Kalkulasi Bersih
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                <div className="flex justify-between text-muted-foreground"><span>Nilai Barang</span><span className="text-foreground font-medium">{formatRp(nilaiBarang)}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>HPP Total</span><span className="text-foreground font-medium">{formatRp(nilaiHpp)}</span></div>
                <div className="flex justify-between text-amber-700"><span>Komisi Platform</span><span>-{formatRp(komisiNominal)}</span></div>
                <div className="flex justify-between text-amber-700"><span>MDR</span><span>-{formatRp(mdrNominal)}</span></div>
                <div className="flex justify-between text-amber-700"><span>Biaya Layanan</span><span>-{formatRp(biayaLayanan)}</span></div>
                <div className="flex justify-between text-emerald-700"><span>Voucher Platform</span><span>+{formatRp(voucherPlatform)}</span></div>
                {customFeeRows.map(f => (
                  <div key={f.id} className={`flex justify-between ${f.sign === "plus" ? "text-emerald-700" : "text-amber-700"}`}>
                    <span className="truncate">{f.name || "(Tanpa nama)"}</span>
                    <span>{f.sign === "plus" ? "+" : "−"}{formatRp(f.nominal)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-muted-foreground col-span-2 pt-1 border-t"><span>Net Ongkir</span><span className={netOngkir >= 0 ? "text-emerald-700" : "text-destructive"}>{netOngkir >= 0 ? "+" : ""}{formatRp(netOngkir)}</span></div>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>Net Diterima</span>
                <span className={netDiterima < 0 ? "text-destructive" : "text-foreground"}>{formatRp(netDiterima)}</span>
              </div>
              <div className={`flex justify-between font-bold text-base ${isMinus ? "text-destructive" : isTipis ? "text-amber-700" : "text-emerald-700"}`}>
                <span className="flex items-center gap-1.5">
                  {(isMinus || isTipis) && <AlertTriangle className="h-4 w-4" />}
                  Margin Bersih
                </span>
                <span>{formatRp(marginKotor)} ({marginPct.toFixed(1)}%)</span>
              </div>
              {isMinus && <p className="text-xs text-destructive font-medium">⚠ Transaksi ini rugi! Net diterima di bawah HPP produk.</p>}
              {isTipis && <p className="text-xs text-amber-700 font-medium">⚠ Margin sangat tipis (&lt;10%). Pertimbangkan penyesuaian harga jual.</p>}
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3 pb-4">
          <Button className="flex-1" onClick={handleSave} disabled={items.length === 0 || !noPesanan}>
            {saved ? "✓ Tersimpan sebagai Pending Validasi" : "Simpan sebagai Pending Validasi"}
          </Button>
          <Button variant="outline" onClick={() => { setItems([]); setNoPesanan(""); setNamaPembeli(""); }}>Reset</Button>
        </div>
      </div>
    </ScrollArea>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ROOT — Tab Switcher
══════════════════════════════════════════════════════════════════ */
export default function POSPage() {
  const [tab, setTab] = useState<"kasir" | "marketplace">("kasir");

  return (
    <div className="flex flex-col h-[calc(100dvh-3.5rem)] lg:h-[calc(100dvh-4rem)] overflow-hidden">
      {/* Tab header */}
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

      {/* Tab content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {tab === "kasir" ? <KasirTab /> : <MarketplaceTab />}
      </div>
    </div>
  );
}
