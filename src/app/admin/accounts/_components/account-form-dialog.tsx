"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createAccount, updateAccount, type AccountRow } from "@/actions/accounts";
import { ROLES, ROLE_LABEL, type AccountRole } from "@/lib/accounts-rules";

type Form = { name: string; email: string; phone: string; role: AccountRole; password: string };
const EMPTY: Form = { name: "", email: "", phone: "", role: "customer", password: "" };

/** `account` null = mode buat akun baru. Dialog dipasang ulang (key) tiap dibuka agar form selalu segar. */
export function AccountFormDialog({
  account,
  currentUserId,
  onClose,
  onSaved,
}: {
  account: AccountRow | null;
  currentUserId: string;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const editing = account !== null;
  const isSelf = account?.id === currentUserId;
  const [form, setForm] = useState<Form>(
    account ? { name: account.name, email: account.email, phone: account.phone ?? "", role: account.role, password: "" } : EMPTY,
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      try {
        const result = editing
          ? await updateAccount({ id: account.id, ...form })
          : await createAccount(form);
        if (!result.ok) return setError(result.error);
        onSaved(editing ? "Akun berhasil diperbarui" : "Akun berhasil dibuat");
      } catch {
        setError("Gagal menyimpan. Periksa koneksi lalu coba lagi.");
      }
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !pending && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit akun" : "Buat akun baru"}</DialogTitle>
          <DialogDescription>
            {editing ? "Ubah data akun. Kosongkan password jika tidak ingin menggantinya." : "Akun langsung aktif dan bisa dipakai login."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="grid gap-4" noValidate>
          <div className="grid gap-1.5">
            <Label htmlFor="acc-name" className="text-xs">Nama</Label>
            <Input id="acc-name" value={form.name} onChange={(e) => set("name", e.target.value)} autoComplete="off" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="acc-email" className="text-xs">Email (untuk login)</Label>
            <Input id="acc-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} autoComplete="off" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="acc-phone" className="text-xs">Telepon (opsional)</Label>
            <Input id="acc-phone" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="off" />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Peran</Label>
            <Select
              value={form.role}
              onValueChange={(v) => { if (v && (ROLES as readonly string[]).includes(v)) set("role", v as AccountRole); }}
              disabled={isSelf}
            >
              <SelectTrigger aria-label="Peran"><SelectValue>{ROLE_LABEL[form.role]}</SelectValue></SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>)}
              </SelectContent>
            </Select>
            {isSelf && <p className="text-[11px] text-muted-foreground">Peran akun Anda sendiri tidak dapat diubah.</p>}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="acc-password" className="text-xs">{editing ? "Password baru (opsional)" : "Password"}</Label>
            <Input
              id="acc-password"
              type="password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              autoComplete="new-password"
              placeholder="Minimal 8 karakter"
            />
            {editing && form.password && !isSelf && (
              <p className="text-[11px] text-muted-foreground">Pengguna ini akan otomatis keluar dari semua perangkat.</p>
            )}
          </div>

          {error && <p role="alert" className="rounded bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={pending}>Batal</Button>
            <Button type="submit" disabled={pending || !form.name.trim() || !form.email.trim() || (!editing && !form.password)}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Simpan" : "Buat akun"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
