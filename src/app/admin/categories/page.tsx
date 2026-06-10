"use client";

import { useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, ImagePlus, Info, FolderOpen, X } from "lucide-react";
import { useCategories, Kategori } from "@/context/CategoryContext";

const emptyForm = { nama: "", deskripsi: "", image: "" };

export default function CategoriesPage() {
  const { categories, addCategory, updateCategory, removeCategory } = useCategories();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const fileRef = useRef<HTMLInputElement | null>(null);

  function openAdd() {
    setEditId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(k: Kategori) {
    setEditId(k.id);
    setForm({ nama: k.nama, deskripsi: k.deskripsi, image: k.image });
    setDialogOpen(true);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, image: String(reader.result) }));
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function handleSave() {
    if (!form.nama) return;
    if (editId) updateCategory(editId, form);
    else addCategory(form);
    setDialogOpen(false);
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl md:text-2xl font-bold tracking-tight">Kategori Produk</h1>
          <p className="text-sm md:text-base text-muted-foreground">Kelola kategori beserta foto default produk</p>
        </div>
        <Button onClick={openAdd} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Tambah Kategori</span>
          <span className="sm:hidden">Tambah</span>
        </Button>
      </div>

      <div className="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-sm text-muted-foreground">
        <Info className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
        <p>
          Foto yang diunggah di kategori akan otomatis menjadi <strong className="text-foreground">gambar semua produk</strong> dalam
          kategori tersebut (di katalog toko, POS, dan halaman produk) selama produk belum memiliki foto sendiri.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((k) => (
          <Card key={k.id} className="overflow-hidden py-0">
            <div className="relative aspect-[16/8] bg-muted">
              {k.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={k.image} alt={k.nama} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-1.5 text-muted-foreground">
                  <FolderOpen className="h-7 w-7 opacity-30" />
                  <span className="text-xs">Belum ada foto</span>
                </div>
              )}
              {k.image && (
                <Badge className="absolute right-2 top-2 bg-emerald-600 text-white border-0">Foto aktif</Badge>
              )}
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold">{k.nama}</h3>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground min-h-8">{k.deskripsi || "—"}</p>
              <div className="mt-3 flex gap-2 border-t pt-3">
                <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => openEdit(k)}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button
                  variant="outline" size="sm"
                  className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => removeCategory(k.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Kategori" : "Tambah Kategori Baru"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="knama">Nama Kategori *</Label>
              <Input
                id="knama"
                value={form.nama}
                onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
                placeholder="cth: Alat Diagnostik"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="kdesk">Deskripsi</Label>
              <Input
                id="kdesk"
                value={form.deskripsi}
                onChange={(e) => setForm((f) => ({ ...f, deskripsi: e.target.value }))}
                placeholder="Deskripsi singkat kategori"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Foto Produk Kategori</Label>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
              {form.image ? (
                <div className="relative overflow-hidden rounded-lg border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.image} alt="Preview" className="aspect-[16/8] w-full object-cover" />
                  <div className="absolute right-2 top-2 flex gap-1.5">
                    <Button size="sm" variant="secondary" className="h-7 gap-1 text-xs" onClick={() => fileRef.current?.click()}>
                      <ImagePlus className="h-3 w-3" /> Ganti
                    </Button>
                    <Button size="sm" variant="secondary" className="h-7 w-7 p-0" onClick={() => setForm((f) => ({ ...f, image: "" }))} aria-label="Hapus foto">
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex aspect-[16/8] w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <ImagePlus className="h-7 w-7" />
                  <span className="text-xs font-medium">Klik untuk unggah foto (JPG/PNG)</span>
                </button>
              )}
              <p className="text-[11px] text-muted-foreground">
                Foto ini akan tampil di semua item dengan kategori yang sama.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={!form.nama}>
              {editId ? "Simpan Perubahan" : "Tambah Kategori"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
