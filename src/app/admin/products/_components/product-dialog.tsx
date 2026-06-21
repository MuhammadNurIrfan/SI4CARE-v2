"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, RefreshCw } from "lucide-react";
import { Barcode128, QrSvg, generateBarcodeValue } from "@/components/barcode";
import { createProductWithVariant, updateProduct, updateVariant } from "@/actions/products";
import type { VariantRow } from "@/actions/products";

type CategoryRow = { id: string; name: string };

type Props = {
  open: boolean;
  onClose: () => void;
  editRow: VariantRow | null;
  categories: CategoryRow[];
  onSaved: () => void;
};

type FormState = {
  productName: string;
  brand: string;
  categoryId: string;
  isActive: boolean;
  sku: string;
  barcode: string;
  activePrice: string;
  minStock: string;
  stockMode: "fifo" | "fefo";
};

const emptyForm: FormState = {
  productName: "",
  brand: "",
  categoryId: "",
  isActive: true,
  sku: "",
  barcode: "",
  activePrice: "",
  minStock: "5",
  stockMode: "fifo",
};

export function ProductDialog({ open, onClose, editRow, categories, onSaved }: Props) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<FormState>(() =>
    editRow
      ? {
          productName: editRow.productName,
          brand: editRow.productBrand ?? "",
          categoryId: editRow.categoryId ?? "",
          isActive: editRow.productIsActive,
          sku: editRow.sku,
          barcode: editRow.barcode ?? "",
          activePrice: editRow.activePrice,
          minStock: String(editRow.minStock),
          stockMode: editRow.stockMode,
        }
      : emptyForm,
  );
  const [error, setError] = useState("");

  // Sync form when editRow changes (dialog re-open for different row)
  function resetToRow(row: VariantRow | null) {
    if (row) {
      setForm({
        productName: row.productName,
        brand: row.productBrand ?? "",
        categoryId: row.categoryId ?? "",
        isActive: row.productIsActive,
        sku: row.sku,
        barcode: row.barcode ?? "",
        activePrice: row.activePrice,
        minStock: String(row.minStock),
        stockMode: row.stockMode,
      });
    } else {
      setForm(emptyForm);
    }
    setError("");
  }

  function handleOpenChange(o: boolean) {
    if (!o) {
      onClose();
      resetToRow(editRow);
    }
  }

  // Re-initialise when dialog opens with a new editRow
  const stableKey = editRow?.variantId ?? "new";

  function handleSave() {
    const price = Number(form.activePrice);
    const minSt = Number(form.minStock);
    if (!form.productName.trim()) { setError("Nama produk wajib diisi"); return; }
    if (!form.sku.trim()) { setError("SKU wajib diisi"); return; }
    if (isNaN(price) || price <= 0) { setError("Harga harus angka positif"); return; }

    setError("");
    startTransition(async () => {
      try {
        if (editRow) {
          await Promise.all([
            updateProduct(editRow.productId, {
              name: form.productName,
              brand: form.brand || null,
              categoryId: form.categoryId || null,
              isActive: form.isActive,
            }),
            updateVariant(editRow.variantId, {
              sku: form.sku,
              barcode: form.barcode || null,
              activePrice: price,
              minStock: isNaN(minSt) ? 5 : minSt,
              stockMode: form.stockMode,
              isActive: form.isActive,
            }),
          ]);
        } else {
          await createProductWithVariant(
            {
              name: form.productName,
              brand: form.brand || null,
              categoryId: form.categoryId || null,
              isActive: form.isActive,
            },
            {
              sku: form.sku,
              barcode: form.barcode || null,
              activePrice: price,
              minStock: isNaN(minSt) ? 5 : minSt,
              stockMode: form.stockMode,
              isActive: form.isActive,
            },
          );
        }
        onSaved();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal menyimpan");
      }
    });
  }

  return (
    <Dialog key={stableKey} open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editRow ? "Edit Produk" : "Tambah Produk Baru"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          {/* Nama + Brand */}
          <div className="grid gap-1.5">
            <Label htmlFor="pnama">Nama Produk *</Label>
            <Input
              id="pnama"
              value={form.productName}
              onChange={(e) => setForm((f) => ({ ...f, productName: e.target.value }))}
              placeholder="cth: Tensimeter Digital OMRON HEM-7130"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="pbrand">Merek</Label>
              <Input
                id="pbrand"
                value={form.brand}
                onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                placeholder="cth: Omron"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Kategori</Label>
              <Select
                value={form.categoryId}
                onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v ?? "" }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— Tanpa Kategori —</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* SKU + Barcode */}
          <div className="grid gap-1.5">
            <Label htmlFor="psku">SKU *</Label>
            <Input
              id="psku"
              value={form.sku}
              onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
              placeholder="cth: OMR-TEN-001"
              className="font-mono"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="pbarcode">Barcode</Label>
            <div className="flex gap-2">
              <Input
                id="pbarcode"
                value={form.barcode}
                onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))}
                placeholder="Scan / ketik barcode"
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
                  <p className="mb-1 text-[10px] font-medium uppercase text-muted-foreground">
                    Barcode Garis (Code128)
                  </p>
                  <Barcode128 value={form.barcode} height={40} />
                </div>
                <div className="shrink-0">
                  <p className="mb-1 text-[10px] font-medium uppercase text-muted-foreground">QR Code</p>
                  <QrSvg value={form.barcode} size={72} />
                </div>
              </div>
            )}
          </div>

          {/* Harga + Min Stok + Mode */}
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="pharga">Harga Jual (Rp) *</Label>
              <Input
                id="pharga"
                type="number"
                value={form.activePrice}
                onChange={(e) => setForm((f) => ({ ...f, activePrice: e.target.value }))}
                placeholder="0"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="pminstok">Min. Stok</Label>
              <Input
                id="pminstok"
                type="number"
                value={form.minStock}
                onChange={(e) => setForm((f) => ({ ...f, minStock: e.target.value }))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Mode Stok</Label>
              <Select
                value={form.stockMode}
                onValueChange={(v) => {
                  if (v === "fifo" || v === "fefo") setForm((f) => ({ ...f, stockMode: v }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fifo">FIFO</SelectItem>
                  <SelectItem value="fefo">FEFO (ada ED)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status */}
          <div className="grid gap-1.5">
            <Label>Status</Label>
            <Select
              value={form.isActive ? "aktif" : "nonaktif"}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, isActive: v === "aktif" }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aktif">Aktif</SelectItem>
                <SelectItem value="nonaktif">Nonaktif</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {editRow && (
            <p className="text-[11px] text-muted-foreground rounded-lg border bg-muted/30 p-2.5">
              Stok ditambahkan lewat halaman <strong>Inbound</strong> (Transaksi Masuk) — bukan dari
              sini.
            </p>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Batal
          </Button>
          <Button
            onClick={handleSave}
            disabled={!form.productName || !form.sku || !form.activePrice || isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editRow ? "Simpan Perubahan" : "Tambah Produk"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
