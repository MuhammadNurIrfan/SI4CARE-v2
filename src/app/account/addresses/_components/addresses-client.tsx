"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MapPin, Plus, MoreVertical, Pencil, Trash2, MapPinHouse } from "lucide-react";
import { createAddress, updateAddress, deleteAddress, setPrimaryAddress } from "@/actions/addresses";
import type { AddressInput } from "@/lib/validations/address";

export type AddressRow = AddressInput & { id: string; isPrimary: boolean };

const emptyForm: AddressInput = { label: "", name: "", phone: "", address: "", city: "" };

export function AddressesClient({ addresses }: { addresses: AddressRow[] }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressInput>(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function openAdd() {
    setEditId(null);
    setForm(emptyForm);
    setError("");
    setDialogOpen(true);
  }

  function openEdit(addr: AddressRow) {
    setEditId(addr.id);
    setForm({ label: addr.label, name: addr.name, phone: addr.phone, address: addr.address, city: addr.city });
    setError("");
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      if (editId) await updateAddress(editId, form);
      else await createAddress(form);
      setDialogOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan alamat.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteAddress(id);
    router.refresh();
  }

  async function handleSetPrimary(id: string) {
    await setPrimaryAddress(id);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Buku Alamat</h1>
          <p className="text-muted-foreground">Kelola alamat pengiriman pesanan Anda.</p>
        </div>
        <Button className="shrink-0 gap-2" onClick={openAdd}>
          <Plus className="h-4 w-4" /> Tambah Alamat Baru
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16 text-center">
          <MapPinHouse className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="font-semibold">Belum ada alamat tersimpan</p>
          <p className="mt-1 text-sm text-muted-foreground">Tambahkan alamat pertama Anda untuk mempercepat checkout.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {addresses.map((addr) => (
            <Card key={addr.id} className={addr.isPrimary ? "border-primary/50 bg-primary/5" : ""}>
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      <MapPin className={`h-5 w-5 ${addr.isPrimary ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-base">{addr.label}</span>
                        {addr.isPrimary && <Badge variant="default" className="text-[10px] h-5 px-2">Utama</Badge>}
                      </div>
                      <p className="font-semibold text-foreground mb-1">{addr.name} <span className="font-normal text-muted-foreground">({addr.phone})</span></p>
                      <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl">
                        {addr.address}<br />
                        {addr.city}
                      </p>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="-mr-2" />}>
                      <MoreVertical className="h-5 w-5 text-muted-foreground" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2" onClick={() => openEdit(addr)}>
                        <Pencil className="h-4 w-4" /> Ubah
                      </DropdownMenuItem>
                      {!addr.isPrimary && (
                        <DropdownMenuItem className="gap-2" onClick={() => handleSetPrimary(addr.id)}>
                          <MapPin className="h-4 w-4" /> Jadikan Utama
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive" onClick={() => handleDelete(addr.id)}>
                        <Trash2 className="h-4 w-4" /> Hapus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Ubah Alamat" : "Tambah Alamat Baru"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="label">Label</Label>
              <Input id="label" placeholder="cth: Rumah, Kantor" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="name">Nama Penerima</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="phone">Nomor Telepon</Label>
              <Input id="phone" type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="address">Alamat Lengkap</Label>
              <Textarea id="address" rows={3} value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="city">Kota / Kecamatan / Kode Pos</Label>
              <Input id="city" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving || !form.label || !form.name || !form.phone || !form.address || !form.city}>
              {saving ? "Menyimpan..." : editId ? "Simpan Perubahan" : "Tambah Alamat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
