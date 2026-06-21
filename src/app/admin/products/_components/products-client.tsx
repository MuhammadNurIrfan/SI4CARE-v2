"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Card, CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Search, Pencil, Trash2, AlertTriangle, Package, ScanBarcode } from "lucide-react";
import { useRef } from "react";
import { MobileList, DesktopOnly, RecordCard, Field } from "@/components/admin/data-cards";
import { Barcode128, QrSvg, downloadSvg } from "@/components/barcode";
import { deleteProduct } from "@/actions/products";
import type { VariantRow } from "@/actions/products";
import { ProductDialog } from "./product-dialog";

type CategoryRow = { id: string; name: string };

type Props = {
  variants: VariantRow[];
  categories: CategoryRow[];
};

type BarcodeTarget = { name: string; sku: string; barcode: string };

export function ProductsClient({ variants, categories }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [filterKat, setFilterKat] = useState("Semua");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRow, setEditRow] = useState<VariantRow | null>(null);
  const [barcodeTarget, setBarcodeTarget] = useState<BarcodeTarget | null>(null);
  const barcodeWrapRef = useRef<HTMLDivElement | null>(null);
  const qrWrapRef = useRef<HTMLDivElement | null>(null);

  const filtered = variants.filter((v) => {
    const q = search.toLowerCase();
    const matchSearch =
      v.productName.toLowerCase().includes(q) ||
      v.sku.toLowerCase().includes(q) ||
      (v.barcode ?? "").includes(q);
    const matchKat =
      filterKat === "Semua" || v.categoryName === filterKat;
    return matchSearch && matchKat;
  });

  const stokRendah = variants.filter(
    (v) => v.totalStock < v.minStock && v.totalStock > 0,
  ).length;
  const habis = variants.filter((v) => v.totalStock === 0).length;

  function openAdd() {
    setEditRow(null);
    setDialogOpen(true);
  }

  function openEdit(v: VariantRow) {
    setEditRow(v);
    setDialogOpen(true);
  }

  function handleDelete(productId: string) {
    startTransition(async () => {
      await deleteProduct(productId);
      router.refresh();
    });
  }

  const katList = ["Semua", ...Array.from(new Set(variants.map((v) => v.categoryName).filter(Boolean)))];

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
                <p className="text-xs text-muted-foreground">Total Varian</p>
                <p className="text-xl font-bold">{variants.length}</p>
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
                <p className="text-xs text-muted-foreground">Varian Aktif</p>
                <p className="text-xl font-bold">{variants.filter((v) => v.isActive).length}</p>
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
        <Select value={filterKat} onValueChange={(v) => { if (v) setFilterKat(v); }}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {katList.map((k) => (
              <SelectItem key={k} value={k ?? ""}>{k}</SelectItem>
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
                  <TableHead>Mode</TableHead>
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
                {filtered.map((v) => {
                  const stokAlert =
                    v.totalStock === 0
                      ? "habis"
                      : v.totalStock < v.minStock
                      ? "rendah"
                      : "ok";
                  return (
                    <TableRow key={v.variantId}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {v.productName}
                        {v.productBrand && (
                          <span className="block text-[11px] text-muted-foreground font-normal">
                            {v.productBrand}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">{v.sku}</TableCell>
                      <TableCell>
                        {v.barcode ? (
                          <button
                            onClick={() =>
                              setBarcodeTarget({ name: v.productName, sku: v.sku, barcode: v.barcode! })
                            }
                            className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-primary transition-colors"
                            title="Lihat barcode & QR"
                          >
                            <ScanBarcode className="h-3.5 w-3.5" />
                            {v.barcode}
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">—</span>
                        )}
                      </TableCell>
                      <TableCell>{v.categoryName ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        Rp {Number(v.activePrice).toLocaleString("id-ID")}
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
                          {v.totalStock}
                        </span>
                        {stokAlert !== "ok" && (
                          <AlertTriangle
                            className={`inline-block ml-1 h-3.5 w-3.5 ${
                              stokAlert === "habis" ? "text-destructive" : "text-yellow-500"
                            }`}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[11px] uppercase font-mono">
                          {v.stockMode}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={v.isActive ? "default" : "secondary"}>
                          {v.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(v)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(v.productId)}
                            disabled={isPending}
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
            {filtered.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Tidak ada produk ditemukan
              </p>
            )}
            {filtered.map((v) => {
              const stokAlert =
                v.totalStock === 0 ? "habis" : v.totalStock < v.minStock ? "rendah" : "ok";
              return (
                <RecordCard key={v.variantId}>
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold leading-snug">{v.productName}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">{v.sku}</p>
                    </div>
                    <Badge
                      variant={v.isActive ? "default" : "secondary"}
                      className="shrink-0"
                    >
                      {v.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </div>
                  {v.barcode && (
                    <Field
                      label="Barcode"
                      value={
                        <button
                          onClick={() =>
                            setBarcodeTarget({ name: v.productName, sku: v.sku, barcode: v.barcode! })
                          }
                          className="inline-flex items-center gap-1 font-mono text-primary underline-offset-2 underline"
                        >
                          {v.barcode}
                        </button>
                      }
                    />
                  )}
                  <Field label="Kategori" value={v.categoryName ?? "—"} />
                  <Field
                    label="Harga"
                    value={`Rp ${Number(v.activePrice).toLocaleString("id-ID")}`}
                  />
                  <Field
                    label="Stok"
                    value={
                      <span
                        className={
                          stokAlert === "habis"
                            ? "text-destructive"
                            : stokAlert === "rendah"
                            ? "text-yellow-600"
                            : ""
                        }
                      >
                        {v.totalStock}
                        {stokAlert !== "ok" && " ⚠"}
                      </span>
                    }
                  />
                  <Field label="Mode" value={v.stockMode.toUpperCase()} />
                  <div className="mt-3 flex gap-2 border-t pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1.5"
                      onClick={() => openEdit(v)}
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleDelete(v.productId)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </RecordCard>
              );
            })}
          </MobileList>
        </CardContent>
      </Card>

      {/* Barcode Preview Dialog */}
      {barcodeTarget && (
        <BarcodeDialog
          target={barcodeTarget}
          onClose={() => setBarcodeTarget(null)}
          barcodeWrapRef={barcodeWrapRef}
          qrWrapRef={qrWrapRef}
        />
      )}

      {/* Add / Edit Dialog */}
      <ProductDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        editRow={editRow}
        categories={categories}
        onSaved={() => {
          setDialogOpen(false);
          router.refresh();
        }}
      />
    </div>
  );
}

// ─── Barcode preview inline ───────────────────────────────────────────────────

import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Download } from "lucide-react";

function BarcodeDialog({
  target,
  onClose,
  barcodeWrapRef,
  qrWrapRef,
}: {
  target: BarcodeTarget;
  onClose: () => void;
  barcodeWrapRef: React.RefObject<HTMLDivElement | null>;
  qrWrapRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanBarcode className="h-5 w-5" /> Barcode Produk
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="font-medium text-sm">{target.name}</p>
            <p className="font-mono text-xs text-muted-foreground">
              {target.sku} · {target.barcode}
            </p>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <p className="mb-2 text-[10px] font-medium uppercase text-muted-foreground">
              Barcode Garis (Code128)
            </p>
            <div ref={barcodeWrapRef} className="flex justify-center overflow-hidden">
              <Barcode128 value={target.barcode} height={56} />
            </div>
          </div>
          <div className="rounded-lg border bg-white p-4">
            <p className="mb-2 text-[10px] font-medium uppercase text-muted-foreground">QR Code</p>
            <div ref={qrWrapRef} className="flex justify-center">
              <QrSvg value={target.barcode} size={140} />
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="flex-1 gap-1.5"
              onClick={() =>
                downloadSvg(
                  barcodeWrapRef.current?.querySelector("svg") ?? null,
                  `barcode-${target.sku}.svg`,
                )
              }
            >
              <Download className="h-3.5 w-3.5" /> Unduh Barcode
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-1.5"
              onClick={() =>
                downloadSvg(
                  qrWrapRef.current?.querySelector("svg") ?? null,
                  `qr-${target.sku}.svg`,
                )
              }
            >
              <Download className="h-3.5 w-3.5" /> Unduh QR
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
