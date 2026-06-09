"use client";

import { useState } from "react";
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
import { Ticket, Plus, Pencil, Trash2, Layers, Truck, Clock4, Percent, Tag, Info } from "lucide-react";

const formatRp = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);

type DiscType = "persen" | "nominal";

interface Voucher {
  id: string;
  code: string;
  type: DiscType;
  value: number;
  minBelanja: number;
  maxPotongan: number;
  kuota: number;
  terpakai: number;
  berlaku: string;
  scope: string;
  active: boolean;
}

const initialVouchers: Voucher[] = [
  { id: "1", code: "SEHAT10", type: "persen", value: 10, minBelanja: 100000, maxPotongan: 50000, kuota: 200, terpakai: 84, berlaku: "31 Jul 2026", scope: "Semua produk", active: true },
  { id: "2", code: "ONGKIRHEMAT", type: "nominal", value: 20000, minBelanja: 150000, maxPotongan: 20000, kuota: 500, terpakai: 312, berlaku: "30 Jun 2026", scope: "Ongkir", active: true },
  { id: "3", code: "ALKES50RB", type: "nominal", value: 50000, minBelanja: 500000, maxPotongan: 50000, kuota: 100, terpakai: 100, berlaku: "15 Jun 2026", scope: "Alat Diagnostik", active: false },
  { id: "4", code: "NEWMEMBER", type: "persen", value: 15, minBelanja: 0, maxPotongan: 75000, kuota: 1000, terpakai: 421, berlaku: "31 Des 2026", scope: "Pelanggan baru", active: true },
];

export default function DiscountsPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Diskon &amp; Voucher</h1>
          <p className="text-muted-foreground">Kelola voucher, diskon berjenjang, subsidi ongkir, dan promo clearance kadaluarsa.</p>
        </div>
      </div>

      <Tabs defaultValue="voucher" className="gap-5">
        <TabsList className="h-9 flex-wrap">
          <TabsTrigger value="voucher" className="px-3"><Ticket className="mr-1.5 h-4 w-4" /> Voucher</TabsTrigger>
          <TabsTrigger value="berjenjang" className="px-3"><Layers className="mr-1.5 h-4 w-4" /> Diskon Berjenjang</TabsTrigger>
          <TabsTrigger value="ongkir" className="px-3"><Truck className="mr-1.5 h-4 w-4" /> Subsidi Ongkir</TabsTrigger>
          <TabsTrigger value="clearance" className="px-3"><Clock4 className="mr-1.5 h-4 w-4" /> Clearance ED</TabsTrigger>
        </TabsList>

        <TabsContent value="voucher"><VoucherManager /></TabsContent>
        <TabsContent value="berjenjang"><TieredDiscount /></TabsContent>
        <TabsContent value="ongkir"><ShippingSubsidy /></TabsContent>
        <TabsContent value="clearance"><ClearanceED /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ════════ Voucher ════════ */
function VoucherManager() {
  const [vouchers, setVouchers] = useState<Voucher[]>(initialVouchers);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const empty: Omit<Voucher, "id" | "terpakai"> = { code: "", type: "persen", value: 0, minBelanja: 0, maxPotongan: 0, kuota: 100, berlaku: "", scope: "Semua produk", active: true };
  const [form, setForm] = useState(empty);

  function openNew() { setEditId(null); setForm(empty); setOpen(true); }
  function openEdit(v: Voucher) { setEditId(v.id); setForm({ code: v.code, type: v.type, value: v.value, minBelanja: v.minBelanja, maxPotongan: v.maxPotongan, kuota: v.kuota, berlaku: v.berlaku, scope: v.scope, active: v.active }); setOpen(true); }
  function save() {
    if (!form.code) return;
    if (editId) setVouchers((p) => p.map((v) => (v.id === editId ? { ...v, ...form } : v)));
    else setVouchers((p) => [{ ...form, id: String(Date.now()), terpakai: 0 }, ...p]);
    setOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{vouchers.length} voucher · {vouchers.filter((v) => v.active).length} aktif</p>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Buat Voucher</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Tipe / Nilai</TableHead>
                  <TableHead className="text-right">Min. Belanja</TableHead>
                  <TableHead className="text-right">Maks. Potongan</TableHead>
                  <TableHead>Kuota</TableHead>
                  <TableHead>Berlaku s/d</TableHead>
                  <TableHead>Cakupan</TableHead>
                  <TableHead className="text-center">Aktif</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vouchers.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell><span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-xs font-bold text-primary">{v.code}</span></TableCell>
                    <TableCell className="text-sm">{v.type === "persen" ? `${v.value}%` : formatRp(v.value)}</TableCell>
                    <TableCell className="text-right text-sm">{v.minBelanja ? formatRp(v.minBelanja) : "—"}</TableCell>
                    <TableCell className="text-right text-sm">{v.maxPotongan ? formatRp(v.maxPotongan) : "—"}</TableCell>
                    <TableCell className="text-sm">
                      <span className={v.terpakai >= v.kuota ? "text-destructive font-medium" : ""}>{v.terpakai}</span>
                      <span className="text-muted-foreground">/{v.kuota}</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{v.berlaku || "—"}</TableCell>
                    <TableCell className="text-sm"><Badge variant="outline">{v.scope}</Badge></TableCell>
                    <TableCell className="text-center">
                      <Switch checked={v.active} onCheckedChange={(c) => setVouchers((p) => p.map((x) => (x.id === v.id ? { ...x, active: c } : x)))} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(v)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setVouchers((p) => p.filter((x) => x.id !== v.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editId ? "Edit Voucher" : "Buat Voucher"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label className="text-xs">Kode Voucher</Label>
                <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} className="font-mono" placeholder="cth: SEHAT10" />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Tipe Potongan</Label>
                <Select value={form.type} onValueChange={(v) => { if (v === "persen" || v === "nominal") setForm((f) => ({ ...f, type: v })); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="persen">Persentase (%)</SelectItem>
                    <SelectItem value="nominal">Nominal (Rp)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label className="text-xs">{form.type === "persen" ? "Nilai (%)" : "Nilai (Rp)"}</Label>
                <Input type="number" value={form.value || ""} onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) }))} />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Maks. Potongan (Rp)</Label>
                <Input type="number" value={form.maxPotongan || ""} onChange={(e) => setForm((f) => ({ ...f, maxPotongan: Number(e.target.value) }))} disabled={form.type === "nominal"} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label className="text-xs">Min. Belanja (Rp)</Label>
                <Input type="number" value={form.minBelanja || ""} onChange={(e) => setForm((f) => ({ ...f, minBelanja: Number(e.target.value) }))} />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Kuota</Label>
                <Input type="number" value={form.kuota || ""} onChange={(e) => setForm((f) => ({ ...f, kuota: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label className="text-xs">Berlaku s/d</Label>
                <Input value={form.berlaku} onChange={(e) => setForm((f) => ({ ...f, berlaku: e.target.value }))} placeholder="cth: 31 Jul 2026" />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Cakupan</Label>
                <Select value={form.scope} onValueChange={(v) => { if (v) setForm((f) => ({ ...f, scope: v })); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Semua produk", "Alat Diagnostik", "APD", "Terapi", "Ongkir", "Pelanggan baru"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label className="text-sm">Aktifkan voucher</Label>
              <Switch checked={form.active} onCheckedChange={(c) => setForm((f) => ({ ...f, active: c }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={save} disabled={!form.code}>{editId ? "Simpan" : "Buat Voucher"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ════════ Tiered discount ════════ */
function TieredDiscount() {
  const [tiers, setTiers] = useState([
    { id: "1", min: 250000, potongan: 15000 },
    { id: "2", min: 500000, potongan: 40000 },
    { id: "3", min: 1000000, potongan: 100000 },
  ]);
  const [active, setActive] = useState(true);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><Layers className="h-4 w-4 text-primary" /> Diskon Berjenjang (Belanja Lebih, Hemat Lebih)</CardTitle>
          <CardDescription>Potongan otomatis berdasarkan total belanja. Hanya tingkat tertinggi yang terpenuhi yang diterapkan.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {tiers.map((t, i) => (
            <div key={t.id} className="flex items-center gap-3 rounded-lg border p-3">
              <Badge variant="secondary" className="shrink-0">Tier {i + 1}</Badge>
              <div className="grid flex-1 grid-cols-2 gap-3">
                <div className="grid gap-1">
                  <Label className="text-[11px] text-muted-foreground">Min. belanja (Rp)</Label>
                  <Input type="number" value={t.min} onChange={(e) => setTiers((p) => p.map((x) => (x.id === t.id ? { ...x, min: Number(e.target.value) } : x)))} />
                </div>
                <div className="grid gap-1">
                  <Label className="text-[11px] text-muted-foreground">Potongan (Rp)</Label>
                  <Input type="number" value={t.potongan} onChange={(e) => setTiers((p) => p.map((x) => (x.id === t.id ? { ...x, potongan: Number(e.target.value) } : x)))} />
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setTiers((p) => p.filter((x) => x.id !== t.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          ))}
          <Button variant="outline" className="w-full gap-2" onClick={() => setTiers((p) => [...p, { id: String(Date.now()), min: 0, potongan: 0 }])}><Plus className="h-4 w-4" /> Tambah Tier</Button>
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
            Diskon berjenjang <strong>tidak menumpuk</strong> dengan voucher. Sistem memilih potongan paling menguntungkan pelanggan.
          </div>
          <Button className="w-full">Simpan</Button>
        </CardContent>
      </Card>
    </div>
  );
}

/* ════════ Shipping subsidy ════════ */
function ShippingSubsidy() {
  const [active, setActive] = useState(true);
  const [minBelanja, setMinBelanja] = useState(300000);
  const [plafon, setPlafon] = useState(25000);
  const [zona, setZona] = useState("jabodetabek");

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><Truck className="h-4 w-4 text-primary" /> Engine Subsidi Ongkir</CardTitle>
          <CardDescription>Tanggung sebagian/seluruh ongkir saat syarat terpenuhi.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label className="text-sm">Aktifkan subsidi ongkir</Label>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Minimal belanja (Rp)</Label>
            <Input type="number" value={minBelanja} onChange={(e) => setMinBelanja(Number(e.target.value))} />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Plafon subsidi per pesanan (Rp)</Label>
            <Input type="number" value={plafon} onChange={(e) => setPlafon(Number(e.target.value))} />
            <p className="text-[11px] text-muted-foreground">Ongkir di atas plafon ditanggung pelanggan.</p>
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Zona yang dicakup</Label>
            <Select value={zona} onValueChange={(v) => { if (v) setZona(v); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="jabodetabek">Jabodetabek saja</SelectItem>
                <SelectItem value="jawa">Seluruh Jawa</SelectItem>
                <SelectItem value="nasional">Nasional</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full">Simpan Pengaturan</Button>
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader className="pb-3"><CardTitle className="text-base">Pratinjau Aturan</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted-foreground">Pelanggan dengan belanja ≥ <strong className="text-foreground">{formatRp(minBelanja)}</strong> di zona <strong className="text-foreground">{zona}</strong> mendapat subsidi ongkir hingga <strong className="text-foreground">{formatRp(plafon)}</strong>.</p>
          <Separator />
          <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800">
            Contoh: belanja {formatRp(450000)}, ongkir asli {formatRp(32000)} → pelanggan bayar ongkir {formatRp(Math.max(0, 32000 - plafon))} (subsidi {formatRp(Math.min(32000, plafon))}).
          </div>
          <p className="text-xs text-muted-foreground">Beban subsidi tercatat di buku biaya (ledger) per transaksi dan muncul di Laporan.</p>
        </CardContent>
      </Card>
    </div>
  );
}

/* ════════ Clearance ED ════════ */
function ClearanceED() {
  const items = [
    { produk: "Sarung Tangan Medis Latex (Box 100)", batch: "B2026-039", ed: "2026-06-30", sisaHari: 24, jual: 45000, usulDiskon: 30 },
    { produk: "Betadine Antiseptik 300ml", batch: "B2026-045", ed: "2026-08-15", sisaHari: 70, jual: 42000, usulDiskon: 15 },
    { produk: "Masker Medis 3-Ply (Box isi 50)", batch: "B2026-048", ed: "2026-12-31", sisaHari: 208, jual: 25000, usulDiskon: 0 },
  ];
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base"><Clock4 className="h-4 w-4 text-primary" /> Promo Clearance Mendekati Kadaluarsa</CardTitle>
        <CardDescription>Terapkan diskon otomatis pada batch yang mendekati ED untuk menekan kerugian write-off.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produk / Batch</TableHead>
                <TableHead>ED</TableHead>
                <TableHead className="text-center">Sisa Hari</TableHead>
                <TableHead className="text-right">Harga Jual</TableHead>
                <TableHead>Usulan Diskon</TableHead>
                <TableHead className="text-center">Terapkan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((it) => (
                <TableRow key={it.batch}>
                  <TableCell><p className="text-sm font-medium">{it.produk}</p><p className="font-mono text-[11px] text-muted-foreground">{it.batch}</p></TableCell>
                  <TableCell className="text-sm">{it.ed}</TableCell>
                  <TableCell className="text-center">
                    <span className={`font-medium ${it.sisaHari <= 30 ? "text-destructive" : it.sisaHari <= 90 ? "text-amber-600" : "text-muted-foreground"}`}>{it.sisaHari} hari</span>
                  </TableCell>
                  <TableCell className="text-right text-sm">{formatRp(it.jual)}</TableCell>
                  <TableCell>
                    {it.usulDiskon > 0 ? (
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-amber-700"><Percent className="h-3.5 w-3.5" /> {it.usulDiskon}% → {formatRp(it.jual * (1 - it.usulDiskon / 100))}</span>
                    ) : <span className="text-sm text-muted-foreground">Belum perlu</span>}
                  </TableCell>
                  <TableCell className="text-center"><Switch defaultChecked={it.usulDiskon > 0} disabled={it.usulDiskon === 0} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center gap-2 border-t bg-muted/30 p-3 text-xs text-muted-foreground">
          <Tag className="h-4 w-4 text-primary" /> Diskon clearance otomatis diberi label &ldquo;Promo ED&rdquo; di etalase dan struk.
        </div>
      </CardContent>
    </Card>
  );
}
