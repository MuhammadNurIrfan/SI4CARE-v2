"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, ImagePlus, Info, FolderOpen, X, Loader2 } from "lucide-react";
import { createCategory, updateCategory, deleteCategory } from "@/actions/categories";
import type { CategoryInput } from "@/lib/validations/catalog";

type CategoryRow = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
};

const emptyForm: CategoryInput = { name: "", description: "", imageUrl: null };

export function CategoriesClient({ categories }: { categories: CategoryRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryInput>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  function openAdd() {
    setEditId(null);
    setForm(emptyForm);
    setError("");
    setDialogOpen(true);
  }

  function openEdit(k: CategoryRow) {
    setEditId(k.id);
    setForm({ name: k.name, description: k.description ?? "", imageUrl: k.imageUrl });
    setError("");
    setDialogOpen(true);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload gagal");
      setForm((f) => ({ ...f, imageUrl: json.url as string }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload gagal");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function handleSave() {
    if (!form.name.trim()) { setError("Nama wajib diisi"); return; }
    setError("");
    startTransition(async () => {
      try {
        if (editId) await updateCategory(editId, form);
        else await createCategory(form);
        setDialogOpen(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal menyimpan");
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteCategory(id);
      router.refresh();
    });
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl md:text-2xl font-bold tracking-tight">Kategori Produk</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Kelola kategori beserta foto default produk
          </p>
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
          Foto yang diunggah di kategori akan otomatis menjadi{" "}
          <strong className="text-foreground">gambar semua produk</strong> dalam kategori tersebut
          (di katalog toko, POS, dan halaman produk) selama produk belum memiliki foto sendiri.
        </p>
      </div>

      {categories.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
          <FolderOpen className="h-12 w-12 opacity-20" />
          <p className="text-sm">Belum ada kategori. Tambah yang pertama.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((k) => (
          <Card key={k.id} className="overflow-hidden py-0">
            <div className="relative aspect-[16/8] bg-muted">
              {k.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={k.imageUrl} alt={k.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-1.5 text-muted-foreground">
                  <FolderOpen className="h-7 w-7 opacity-30" />
                  <span className="text-xs">Belum ada foto</span>
                </div>
              )}
              {k.imageUrl && (
                <Badge className="absolute right-2 top-2 bg-emerald-600 text-white border-0">
                  Foto aktif
                </Badge>
              )}
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold">{k.name}</h3>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground min-h-8">
                {k.description || "—"}
              </p>
              <div className="mt-3 flex gap-2 border-t pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1.5"
                  onClick={() => openEdit(k)}
                  disabled={isPending}
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => handleDelete(k.id)}
                  disabled={isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Kategori" : "Tambah Kategori Baru"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="knama">Nama Kategori *</Label>
              <Input
                id="knama"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="cth: Alat Diagnostik"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="kdesk">Deskripsi</Label>
              <Input
                id="kdesk"
                value={form.description ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Deskripsi singkat kategori"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Foto Produk Kategori</Label>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFile}
              />
              {form.imageUrl ? (
                <div className="relative overflow-hidden rounded-lg border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.imageUrl}
                    alt="Preview"
                    className="aspect-[16/8] w-full object-cover"
                  />
                  <div className="absolute right-2 top-2 flex gap-1.5">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 gap-1 text-xs"
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                    >
                      <ImagePlus className="h-3 w-3" /> Ganti
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 w-7 p-0"
                      onClick={() => setForm((f) => ({ ...f, imageUrl: null }))}
                      aria-label="Hapus foto"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex aspect-[16/8] w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <>
                      <ImagePlus className="h-7 w-7" />
                      <span className="text-xs font-medium">Klik untuk unggah foto (JPG/PNG/WebP)</span>
                    </>
                  )}
                </button>
              )}
              <p className="text-[11px] text-muted-foreground">
                Foto ini akan tampil di semua item dengan kategori yang sama. Maks 5 MB.
              </p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isPending}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={!form.name || isPending || uploading}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editId ? "Simpan Perubahan" : "Tambah Kategori"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
