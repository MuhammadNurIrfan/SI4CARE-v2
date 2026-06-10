"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  AlertTriangle,
  Package,
  ScanBarcode,
  RefreshCw,
  Download,
} from "lucide-react";
import { useRef } from "react";
import { MobileList, DesktopOnly, RecordCard, Field } from "@/components/admin/data-cards";
import { Barcode128, QrSvg, generateBarcodeValue, downloadSvg } from "@/components/barcode";
import { useCategories } from "@/context/CategoryContext";

type Produk = {
  id: string;
  nama: string;
  sku: string;
  barcode: string;
  kategori: string;
  stok: number;
  harga: number;
  stokMin: number;
  expDate: string;
  status: "aktif" | "nonaktif";
};

const initialProduk: Produk[] = [
  { id: "1", nama: "Tensimeter Digital OMRON HEM-7130", sku: "OMR-TEN-001", barcode: "8991234500017", kategori: "Alat Ukur", stok: 24, harga: 450000, stokMin: 5, expDate: "-", status: "aktif" },
  { id: "2", nama: "Nebulizer Omron NE-C28", sku: "OMR-NEB-001", barcode: "8991234500024", kategori: "Terapi", stok: 3, harga: 620000, stokMin: 5, expDate: "-", status: "aktif" },
  { id: "3", nama: "Masker Bedah 3-ply (50 pcs)", sku: "MSK-BDH-050", barcode: "8991234500031", kategori: "APD", stok: 150, harga: 35000, stokMin: 20, expDate: "2025-12-31", status: "aktif" },
  { id: "4", nama: "Pulse Oximeter Fingertip", sku: "OXI-FNG-001", barcode: "8991234500048", kategori: "Alat Ukur", stok: 18, harga: 175000, stokMin: 10, expDate: "-", status: "aktif" },
  { id: "5", nama: "Betadine Antiseptik 300ml", sku: "BTD-ANT-300", barcode: "8991234500055", kategori: "Antiseptik", stok: 45, harga: 42000, stokMin: 15, expDate: "2026-08-15", status: "aktif" },
  { id: "6", nama: "Kursi Roda Lipat Standar", sku: "KRS-LPT-001", barcode: "8991234500062", kategori: "Mobilitas", stok: 7, harga: 1250000, stokMin: 3, expDate: "-", status: "aktif" },
  { id: "7", nama: "Termometer Infrared Digital", sku: "TRM-INF-001", barcode: "", kategori: "Alat Ukur", stok: 0, harga: 185000, stokMin: 10, expDate: "-", status: "nonaktif" },
  { id: "8", nama: "Handscoon Latex M (100 pcs)", sku: "HND-LTX-M", barcode: "8991234500086", kategori: "APD", stok: 80, harga: 65000, stokMin: 20, expDate: "2025-06-30", status: "aktif" },
];

const emptyForm: Omit<Produk, "id"> = {
  nama: "",
  sku: "",
  barcode: "",
  kategori: "Alat Diagnostik",
  stok: 0,
  harga: 0,
  stokMin: 5,
  expDate: "",
  status: "aktif",
};

export default function ProductsPage() {
  const { categories } = useCategories();
  const kategoriList = ["Semua", ...categories.map((c) => c.nama)];
  const [produkList, setProdukList] = useState<Produk[]>(initialProduk);
  const [search, setSearch] = useState("");
  const [filterKategori, setFilterKategori] = useState("Semua");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Produk, "id">>(emptyForm);
  const [barcodeView, setBarcodeView] = useState<Produk | null>(null);
  const barcodeWrapRef = useRef<HTMLDivElement | null>(null);
  const qrWrapRef = useRef<HTMLDivElement | null>(null);

  const filtered = produkList.filter((p) => {
    const matchSearch =
      p.nama.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search);
    const matchKat = filterKategori === "Semua" || p.kategori === filterKategori;
    return matchSearch && matchKat;
  });

  function openAdd() {
    setEditId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(p: Produk) {
    setEditId(p.id);
    setForm({ nama: p.nama, sku: p.sku, barcode: p.barcode, kategori: p.kategori, stok: p.stok, harga: p.harga, stokMin: p.stokMin, expDate: p.expDate, status: p.status });
    setDialogOpen(true);
  }

  function handleSave() {
    if (!form.nama || !form.sku) return;
    if (editId) {
      setProdukList((prev) => prev.map((p) => (p.id === editId ? { ...form, id: editId } : p)));
    } else {
      setProdukList((prev) => [...prev, { ...form, id: String(Date.now()) }]);
    }
    setDialogOpen(false);
  }

  function handleDelete(id: string) {
    setProdukList((prev) => prev.filter((p) => p.id !== id));
  }

  const stokRendah = produkList.filter((p) => p.stok < p.stokMin && p.stok > 0).length;
  const habis = produkList.filter((p) => p.stok === 0).length;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl md:text-2xl font-bold tracking-tight">Produk & Batch</h1>
          <p className="text-muted-foreground">Kelola katalog produk dan manajemen stok</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Produk
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-primary p-1.5 bg-primary/10 rounded-lg" />
              <div>
                <p className="text-xs text-muted-foreground">Total Produk</p>
                <p className="text-xl font-bold">{produkList.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 flex items-center justify-center bg-emerald-100 rounded-lg">
                <span className="text-emerald-700 text-xs font-bold">OK</span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Produk Aktif</p>
                <p className="text-xl font-bold">{produkList.filter((p) => p.status === "aktif").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={stokRendah > 0 ? "border-yellow-400/50 bg-yellow-50/50" : ""}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-yellow-600 p-1.5 bg-yellow-100 rounded-lg" />
              <div>
                <p className="text-xs text-muted-foreground">Stok Rendah</p>
                <p className="text-xl font-bold text-yellow-600">{stokRendah}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={habis > 0 ? "border-destructive/30 bg-destructive/5" : ""}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-destructive p-1.5 bg-destructive/10 rounded-lg" />
              <div>
                <p className="text-xs text-muted-foreground">Stok Habis</p>
                <p className="text-xl font-bold text-destructive">{habis}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama produk atau SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterKategori} onValueChange={(v) => { if (v) setFilterKategori(v); }}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {kategoriList.map((k) => (
              <SelectItem key={k} value={k}>{k}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table (desktop) */}
      <Card>
        <CardContent className="p-0">
          <DesktopOnly className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Produk</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Barcode</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-right">Harga</TableHead>
                <TableHead className="text-center">Stok</TableHead>
                <TableHead>Exp. Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                    Tidak ada produk ditemukan
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((p) => {
                const stokAlert = p.stok === 0 ? "habis" : p.stok < p.stokMin ? "rendah" : "ok";
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">{p.nama}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">{p.sku}</TableCell>
                    <TableCell>
                      {p.barcode ? (
                        <button
                          onClick={() => setBarcodeView(p)}
                          className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-primary transition-colors"
                          title="Lihat barcode & QR"
                        >
                          <ScanBarcode className="h-3.5 w-3.5" />
                          {p.barcode}
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">—</span>
                      )}
                    </TableCell>
                    <TableCell>{p.kategori}</TableCell>
                    <TableCell className="text-right">
                      Rp {p.harga.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`font-semibold ${
                          stokAlert === "habis"
                            ? "text-destructive"
                            : stokAlert === "rendah"
                            ? "text-yellow-600"
                            : ""
                        }`}
                      >
                        {p.stok}
                      </span>
                      {stokAlert !== "ok" && (
                        <AlertTriangle
                          className={`inline-block ml-1 h-3.5 w-3.5 ${
                            stokAlert === "habis" ? "text-destructive" : "text-yellow-500"
                          }`}
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.expDate || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.status === "aktif" ? "default" : "secondary"}>
                        {p.status === "aktif" ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(p)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(p.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </DesktopOnly>

          {/* Cards (mobile) */}
          <MobileList className="p-3">
            {filtered.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Tidak ada produk ditemukan</p>}
            {filtered.map((p) => {
              const stokAlert = p.stok === 0 ? "habis" : p.stok < p.stokMin ? "rendah" : "ok";
              return (
                <RecordCard key={p.id}>
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold leading-snug">{p.nama}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">{p.sku}</p>
                    </div>
                    <Badge variant={p.status === "aktif" ? "default" : "secondary"} className="shrink-0">{p.status === "aktif" ? "Aktif" : "Nonaktif"}</Badge>
                  </div>
                  <Field label="Barcode" value={p.barcode ? (
                    <button onClick={() => setBarcodeView(p)} className="inline-flex items-center gap-1 font-mono text-primary underline-offset-2 underline">
                      {p.barcode}
                    </button>
                  ) : "—"} />
                  <Field label="Kategori" value={p.kategori} />
                  <Field label="Harga" value={`Rp ${p.harga.toLocaleString("id-ID")}`} />
                  <Field
                    label="Stok"
                    value={<span className={stokAlert === "habis" ? "text-destructive" : stokAlert === "rendah" ? "text-yellow-600" : ""}>{p.stok}{stokAlert !== "ok" && " ⚠"}</span>}
                  />
                  <Field label="Exp. Date" value={p.expDate || "-"} />
                  <div className="mt-3 flex gap-2 border-t pt-3">
                    <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
                    <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </RecordCard>
              );
            })}
          </MobileList>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Produk" : "Tambah Produk Baru"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="nama">Nama Produk *</Label>
              <Input
                id="nama"
                value={form.nama}
                onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
                placeholder="cth: Tensimeter Digital OMRON"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  value={form.sku}
                  onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                  placeholder="cth: OMR-TEN-001"
                  className="font-mono"
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Kategori</Label>
                <Select value={form.kategori} onValueChange={(v) => { if (v) setForm((f) => ({ ...f, kategori: v })); }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {kategoriList.filter((k) => k !== "Semua").map((k) => (
                      <SelectItem key={k} value={k}>{k}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="barcode">Barcode</Label>
              <div className="flex gap-2">
                <Input
                  id="barcode"
                  value={form.barcode}
                  onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))}
                  placeholder="Scan / ketik barcode yang sudah ada"
                  className="font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0 gap-1.5"
                  onClick={() => setForm((f) => ({ ...f, barcode: generateBarcodeValue() }))}
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Generate
                </Button>
              </div>
              {form.barcode && (
                <div className="mt-1 flex flex-wrap items-center gap-4 rounded-lg border bg-muted/30 p-3">
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <p className="mb-1 text-[10px] font-medium uppercase text-muted-foreground">Barcode Garis (Code128)</p>
                    <Barcode128 value={form.barcode} height={40} />
                  </div>
                  <div className="shrink-0">
                    <p className="mb-1 text-[10px] font-medium uppercase text-muted-foreground">QR Code</p>
                    <QrSvg value={form.barcode} size={72} />
                  </div>
                </div>
              )}
              <p className="text-[11px] text-muted-foreground">
                Isi barcode produk yang sudah ada, atau klik Generate untuk membuat kode baru (format EAN-13).
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="harga">Harga (Rp)</Label>
                <Input
                  id="harga"
                  type="number"
                  value={form.harga}
                  onChange={(e) => setForm((f) => ({ ...f, harga: Number(e.target.value) }))}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="stok">Stok Awal</Label>
                <Input
                  id="stok"
                  type="number"
                  value={form.stok}
                  onChange={(e) => setForm((f) => ({ ...f, stok: Number(e.target.value) }))}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="stokMin">Min. Stok</Label>
                <Input
                  id="stokMin"
                  type="number"
                  value={form.stokMin}
                  onChange={(e) => setForm((f) => ({ ...f, stokMin: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="expDate">Tanggal Kadaluarsa</Label>
                <Input
                  id="expDate"
                  type="date"
                  value={form.expDate}
                  onChange={(e) => setForm((f) => ({ ...f, expDate: e.target.value }))}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => { if (v === "aktif" || v === "nonaktif") setForm((f) => ({ ...f, status: v })); }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aktif">Aktif</SelectItem>
                    <SelectItem value="nonaktif">Nonaktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={!form.nama || !form.sku}>
              {editId ? "Simpan Perubahan" : "Tambah Produk"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Barcode Preview Dialog */}
      <Dialog open={!!barcodeView} onOpenChange={(o) => !o && setBarcodeView(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScanBarcode className="h-5 w-5" /> Barcode Produk
            </DialogTitle>
          </DialogHeader>
          {barcodeView && (
            <div className="space-y-4">
              <div>
                <p className="font-medium text-sm">{barcodeView.nama}</p>
                <p className="font-mono text-xs text-muted-foreground">{barcodeView.sku} · {barcodeView.barcode}</p>
              </div>
              <div className="rounded-lg border bg-white p-4">
                <p className="mb-2 text-[10px] font-medium uppercase text-muted-foreground">Barcode Garis (Code128)</p>
                <div ref={barcodeWrapRef} className="flex justify-center overflow-hidden">
                  <Barcode128 value={barcodeView.barcode} height={56} />
                </div>
              </div>
              <div className="rounded-lg border bg-white p-4">
                <p className="mb-2 text-[10px] font-medium uppercase text-muted-foreground">QR Code</p>
                <div ref={qrWrapRef} className="flex justify-center">
                  <QrSvg value={barcodeView.barcode} size={140} />
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  className="flex-1 gap-1.5"
                  onClick={() => downloadSvg(barcodeWrapRef.current?.querySelector("svg") ?? null, `barcode-${barcodeView.sku}.svg`)}
                >
                  <Download className="h-3.5 w-3.5" /> Unduh Barcode
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-1.5"
                  onClick={() => downloadSvg(qrWrapRef.current?.querySelector("svg") ?? null, `qr-${barcodeView.sku}.svg`)}
                >
                  <Download className="h-3.5 w-3.5" /> Unduh QR
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
