"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Ticket, Plus, Pencil, Trash2, Layers, Truck, Clock4, Percent, Tag, Info, Loader2, CheckCircle2 } from "lucide-react";
import {
  upsertVoucher, deleteVoucher, toggleVoucher, saveShippingSubsidy, saveTieredDiscounts,
  type VoucherRow, type ShippingSubsidyConfig, type TieredDiscountConfig, type TierConfig,
} from "@/actions/vouchers";

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

// ─── Discounts page root ──────────────────────────────────────────────────────

export function DiscountsClient({
  initialVouchers,
  initialSubsidy,
  initialTiered,
}: {
  initialVouchers: VoucherRow[];
  initialSubsidy: ShippingSubsidyConfig;
  initialTiered: TieredDiscountConfig;
}) {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Diskon &amp; Voucher</h1>
          <p className="text-muted-foreground">Kelola voucher, diskon berjenjang, subsidi ongkir, dan promo clearance.</p>
        </div>
      </div>

      <Tabs defaultValue="voucher" className="gap-5">
        <div className="-mx-4 md:mx-0 overflow-x-auto px-4 md:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsList className="h-9 w-max">
            <TabsTrigger value="voucher"    className="px-3 whitespace-nowrap"><Ticket className="mr-1.5 h-4 w-4" /> Voucher</TabsTrigger>
            <TabsTrigger value="berjenjang" className="px-3 whitespace-nowrap"><Layers className="mr-1.5 h-4 w-4" /> Diskon Berjenjang</TabsTrigger>
            <TabsTrigger value="ongkir"     className="px-3 whitespace-nowrap"><Truck className="mr-1.5 h-4 w-4" /> Subsidi Ongkir</TabsTrigger>
            <TabsTrigger value="clearance"  className="px-3 whitespace-nowrap"><Clock4 className="mr-1.5 h-4 w-4" /> Clearance ED</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="voucher">    <VoucherManager initial={initialVouchers} /></TabsContent>
        <TabsContent value="berjenjang"> <TieredDiscount initial={initialTiered} /></TabsContent>
        <TabsContent value="ongkir">     <ShippingSubsidy initial={initialSubsidy} /></TabsContent>
        <TabsContent value="clearance">  <ClearanceED /></TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Voucher Manager (DB-backed) ──────────────────────────────────────────────

type VForm = {
  code: string; type: "percent" | "fixed"; value: number;
  minOrder: number; maxDiscount: number | null;
  usageLimit: number | null; validFrom: string; validUntil: string; isActive: boolean;
};

const emptyForm: VForm = { code: "", type: "percent", value: 0, minOrder: 0, maxDiscount: null, usageLimit: null, validFrom: "", validUntil: "", isActive: true };

function VoucherManager({ initial }: { initial: VoucherRow[] }) {
  const [vouchers, setVouchers] = useState(initial);
  const [open, setOpen]         = useState(false);
  const [editId, setEditId]     = useState<string | null>(null);
  const [form, setForm]         = useState<VForm>(emptyForm);
  const [errMsg, setErrMsg]     = useState<string | null>(null);
  const [saved, setSaved]       = useState(false);
  const [isPending, startTx]    = useTransition();

  function openNew() { setEditId(null); setForm(emptyForm); setErrMsg(null); setOpen(true); }
  function openEdit(v: VoucherRow) {
    setEditId(v.id);
    setForm({ code: v.code, type: v.type, value: v.value, minOrder: v.minOrder, maxDiscount: v.maxDiscount, usageLimit: v.usageLimit, validFrom: v.validFrom, validUntil: v.validUntil, isActive: v.isActive });
    setErrMsg(null);
    setOpen(true);
  }

  function save() {
    startTx(async () => {
      const result = await upsertVoucher({ id: editId ?? undefined, ...form });
      if (!result.ok) { setErrMsg(result.error ?? "Gagal menyimpan"); return; }
      // Refresh list
      const { getVouchers } = await import("@/actions/vouchers");
      setVouchers(await getVouchers());
      setOpen(false);
      setErrMsg(null);
    });
  }

  function remove(id: string) {
    startTx(async () => {
      await deleteVoucher(id);
      setVouchers((p) => p.filter((v) => v.id !== id));
    });
  }

  function toggle(id: string, v: boolean) {
    startTx(async () => {
      await toggleVoucher(id, v);
      setVouchers((p) => p.map((r) => (r.id === id ? { ...r, isActive: v } : r)));
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{vouchers.length} voucher · {vouchers.filter((v) => v.isActive).length} aktif</p>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Buat Voucher</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Tipe / Nilai</TableHead>
                  <TableHead className="text-right">Min. Belanja</TableHead>
                  <TableHead className="text-right">Maks. Potongan</TableHead>
                  <TableHead>Kuota</TableHead>
                  <TableHead>Berlaku s/d</TableHead>
                  <TableHead className="text-center">Aktif</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vouchers.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="py-8 text-center text-muted-foreground">Belum ada voucher</TableCell></TableRow>
                )}
                {vouchers.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell><span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-xs font-bold text-primary">{v.code}</span></TableCell>
                    <TableCell className="text-sm">{v.type === "percent" ? `${v.value}%` : fmt(v.value)}</TableCell>
                    <TableCell className="text-right text-sm">{v.minOrder ? fmt(v.minOrder) : "—"}</TableCell>
                    <TableCell className="text-right text-sm">{v.maxDiscount ? fmt(v.maxDiscount) : "—"}</TableCell>
                    <TableCell className="text-sm">
                      <span className={v.usedCount >= (v.usageLimit ?? Infinity) ? "text-destructive font-medium" : ""}>{v.usedCount}</span>
                      <span className="text-muted-foreground">/{v.usageLimit ?? "∞"}</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{v.validUntil}</TableCell>
                    <TableCell className="text-center">
                      <Switch checked={v.isActive} onCheckedChange={(c) => toggle(v.id, c)} disabled={isPending} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(v)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => remove(v.id)} disabled={isPending}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile */}
          <div className="md:hidden divide-y">
            {vouchers.map((v) => (
              <div key={v.id} className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-xs font-bold text-primary">{v.code}</span>
                    <p className="mt-1 text-xs text-muted-foreground">{v.type === "percent" ? `${v.value}% potongan` : `Potong ${fmt(v.value)}`}{v.maxDiscount ? ` · maks ${fmt(v.maxDiscount)}` : ""}</p>
                  </div>
                  <Switch checked={v.isActive} onCheckedChange={(c) => toggle(v.id, c)} disabled={isPending} />
                </div>
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  <div><span className="text-muted-foreground">Min: </span><span className="font-medium">{v.minOrder ? fmt(v.minOrder) : "—"}</span></div>
                  <div><span className="text-muted-foreground">Berlaku: </span><span className="font-medium">{v.validUntil}</span></div>
                  <div><span className="text-muted-foreground">Kuota: </span><span className={`font-medium ${v.usedCount >= (v.usageLimit ?? Infinity) ? "text-destructive" : ""}`}>{v.usedCount}/{v.usageLimit ?? "∞"}</span></div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" className="flex-1 h-8 gap-1.5" onClick={() => openEdit(v)}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
                  <Button variant="outline" size="sm" className="h-8 text-destructive" onClick={() => remove(v.id)} disabled={isPending}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            ))}
            {vouchers.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Belum ada voucher</p>}
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Edit Voucher" : "Buat Voucher"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label className="text-xs">Kode Voucher</Label>
                <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} className="font-mono" placeholder="cth: SEHAT10" />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Tipe Potongan</Label>
                <Select value={form.type} onValueChange={(v) => { if (v === "percent" || v === "fixed") setForm((f) => ({ ...f, type: v })); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Persentase (%)</SelectItem>
                    <SelectItem value="fixed">Nominal (Rp)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label className="text-xs">{form.type === "percent" ? "Nilai (%)" : "Nilai (Rp)"}</Label>
                <Input type="number" value={form.value || ""} onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) }))} />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Maks. Potongan (Rp)</Label>
                <Input type="number" value={form.maxDiscount ?? ""} onChange={(e) => setForm((f) => ({ ...f, maxDiscount: e.target.value ? Number(e.target.value) : null }))} disabled={form.type === "fixed"} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label className="text-xs">Min. Belanja (Rp)</Label>
                <Input type="number" value={form.minOrder || ""} onChange={(e) => setForm((f) => ({ ...f, minOrder: Number(e.target.value) }))} />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Kuota (kosong = tidak terbatas)</Label>
                <Input type="number" value={form.usageLimit ?? ""} onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value ? Number(e.target.value) : null }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label className="text-xs">Berlaku Dari</Label>
                <Input type="date" value={form.validFrom} onChange={(e) => setForm((f) => ({ ...f, validFrom: e.target.value }))} />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Berlaku s/d</Label>
                <Input type="date" value={form.validUntil} onChange={(e) => setForm((f) => ({ ...f, validUntil: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label className="text-sm">Aktifkan voucher</Label>
              <Switch checked={form.isActive} onCheckedChange={(c) => setForm((f) => ({ ...f, isActive: c }))} />
            </div>
            {errMsg && <p className="text-sm text-destructive bg-destructive/10 rounded px-3 py-2">{errMsg}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={save} disabled={!form.code || isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editId ? "Simpan" : "Buat Voucher"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Tiered discount (DB-backed via appSettings) ──────────────────────────────

function TieredDiscount({ initial }: { initial: TieredDiscountConfig }) {
  const [tiers, setTiers]   = useState<TierConfig[]>(initial.tiers);
  const [active, setActive] = useState(initial.active);
  const [saved, setSaved]   = useState(false);
  const [isPending, startTx] = useTransition();

  function save() {
    startTx(async () => {
      await saveTieredDiscounts({ active, tiers });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><Layers className="h-4 w-4 text-primary" /> Diskon Berjenjang</CardTitle>
          <CardDescription>Potongan otomatis berdasarkan total belanja. Tingkat tertinggi yang terpenuhi diterapkan.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {tiers.map((t, i) => (
            <div key={t.id} className="flex items-center gap-3 rounded-lg border p-3">
              <Badge variant="secondary" className="shrink-0">Tier {i + 1}</Badge>
              <div className="grid flex-1 grid-cols-2 gap-3">
                <div className="grid gap-1">
                  <Label className="text-[11px] text-muted-foreground">Min. belanja (Rp)</Label>
                  <Input type="number" value={t.min} onChange={(e) => setTiers((p) => p.map((x) => x.id === t.id ? { ...x, min: Number(e.target.value) } : x))} />
                </div>
                <div className="grid gap-1">
                  <Label className="text-[11px] text-muted-foreground">Potongan (Rp)</Label>
                  <Input type="number" value={t.discount} onChange={(e) => setTiers((p) => p.map((x) => x.id === t.id ? { ...x, discount: Number(e.target.value) } : x))} />
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setTiers((p) => p.filter((x) => x.id !== t.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          ))}
          <Button variant="outline" className="w-full gap-2" onClick={() => setTiers((p) => [...p, { id: String(Date.now()), min: 0, discount: 0 }])}><Plus className="h-4 w-4" /> Tambah Tier</Button>
        </CardContent>
      </Card>

      <Card className="lg:sticky lg:top-20 h-fit">
        <CardHeader className="pb-3"><CardTitle className="text-base">Pengaturan</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div><p className="text-sm font-medium">Aktifkan diskon berjenjang</p><p className="text-[11px] text-muted-foreground">Berlaku di web &amp; POS</p></div>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground flex gap-2">
            <Info className="h-4 w-4 shrink-0 text-primary" />
            Diskon berjenjang <strong>tidak menumpuk</strong> dengan voucher. Sistem memilih potongan paling menguntungkan.
          </div>
          <Button className="w-full gap-2" onClick={save} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : null}
            {saved ? "Tersimpan!" : "Simpan ke DB"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Shipping Subsidy (DB-backed via appSettings) ────────────────────────────

function ShippingSubsidy({ initial }: { initial: ShippingSubsidyConfig }) {
  const [cfg, setCfg]         = useState(initial);
  const [saved, setSaved]     = useState(false);
  const [isPending, startTx]  = useTransition();

  function save() {
    startTx(async () => {
      await saveShippingSubsidy(cfg);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><Truck className="h-4 w-4 text-primary" /> Engine Subsidi Ongkir</CardTitle>
          <CardDescription>Tanggung sebagian/seluruh ongkir saat syarat terpenuhi. Disimpan di DB.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label className="text-sm">Aktifkan subsidi ongkir</Label>
            <Switch checked={cfg.active} onCheckedChange={(v) => setCfg((c) => ({ ...c, active: v }))} />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Minimal belanja (Rp)</Label>
            <Input type="number" value={cfg.minOrder} onChange={(e) => setCfg((c) => ({ ...c, minOrder: Number(e.target.value) }))} />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Plafon subsidi per pesanan (Rp)</Label>
            <Input type="number" value={cfg.cap} onChange={(e) => setCfg((c) => ({ ...c, cap: Number(e.target.value) }))} />
            <p className="text-[11px] text-muted-foreground">Ongkir di atas plafon ditanggung pelanggan.</p>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Zona yang dicakup</Label>
            <Select value={cfg.zone} onValueChange={(v) => { if (v === "jabodetabek" || v === "jawa" || v === "nasional") setCfg((c) => ({ ...c, zone: v })); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="jabodetabek">Jabodetabek saja</SelectItem>
                <SelectItem value="jawa">Seluruh Jawa</SelectItem>
                <SelectItem value="nasional">Nasional</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full gap-2" onClick={save} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : null}
            {saved ? "Tersimpan!" : "Simpan Pengaturan"}
          </Button>
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader className="pb-3"><CardTitle className="text-base">Pratinjau Aturan</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            Pelanggan dengan belanja ≥ <strong className="text-foreground">{fmt(cfg.minOrder)}</strong> di zona <strong className="text-foreground">{cfg.zone}</strong> mendapat subsidi hingga <strong className="text-foreground">{fmt(cfg.cap)}</strong>.
          </p>
          <Separator />
          <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800">
            Contoh: belanja {fmt(450000)}, ongkir asli {fmt(32000)} → pelanggan bayar {fmt(Math.max(0, 32000 - cfg.cap))} (subsidi {fmt(Math.min(32000, cfg.cap))}).
          </div>
          <p className="text-xs text-muted-foreground">Beban subsidi tercatat di buku biaya per transaksi dan muncul di Laporan.</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Clearance ED (DB batch queries — live data) ─────────────────────────────

function ClearanceED() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base"><Clock4 className="h-4 w-4 text-primary" /> Promo Clearance Mendekati Kadaluarsa</CardTitle>
        <CardDescription>Data batch mendekati ED ada di <strong>Pusat Alarm</strong>. Terapkan diskon di halaman Produk pada batch terkait.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground flex gap-2">
          <Tag className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p>Daftar batch mendekati ED tersedia di <a href="/admin/alarms" className="text-primary font-medium hover:underline">Pusat Alarm</a> dengan filter tipe "Mendekati ED". Dari sana, arahkan ke manajemen produk untuk menetapkan harga clearance.</p>
        </div>
      </CardContent>
    </Card>
  );
}
