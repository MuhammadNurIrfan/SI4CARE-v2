"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/client";

export default function ProfilePage() {
  const { data: session, isPending } = authClient.useSession();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [saveErr, setSaveErr] = useState("");

  // Isi form dari data sesi yang sebenarnya (sekali saat sesi termuat)
  useEffect(() => {
    if (!session?.user) return;
    const parts = (session.user.name ?? "").trim().split(" ");
    setFirstName(parts[0] ?? "");
    setLastName(parts.slice(1).join(" "));
    // phone adalah additional field better-auth
    setPhone((session.user as { phone?: string }).phone ?? "");
  }, [session?.user]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSavedMsg("");
    setSaveErr("");
    const name = `${firstName} ${lastName}`.trim();
    const { error } = await authClient.updateUser({ name, phone });
    setSaving(false);
    if (error) {
      setSaveErr(error.message ?? "Gagal menyimpan. Coba lagi.");
      return;
    }
    setSavedMsg("Perubahan tersimpan.");
  }

  // Ubah password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg("");
    setPwErr("");
    if (newPassword !== confirmPassword) {
      setPwErr("Konfirmasi password tidak cocok.");
      return;
    }
    setPwSaving(true);
    const { error } = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    });
    setPwSaving(false);
    if (error) {
      setPwErr(error.message ?? "Gagal mengubah password.");
      return;
    }
    setPwMsg("Password berhasil diperbarui.");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">Profil Saya</h1>
        <p className="text-muted-foreground">Kelola informasi pribadi dan kata sandi Anda.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Pribadi</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6 max-w-xl" onSubmit={handleSaveProfile}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nama Depan</Label>
                <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={isPending} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nama Belakang</Label>
                <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={isPending} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={session?.user.email ?? ""} disabled readOnly />
              <p className="text-xs text-muted-foreground">Email tidak dapat diubah karena terikat dengan riwayat transaksi.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Nomor Telepon (WhatsApp)</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={isPending} />
            </div>

            {savedMsg && <p className="text-sm text-emerald-600">{savedMsg}</p>}
            {saveErr && <p className="text-sm text-destructive">{saveErr}</p>}

            <Button type="submit" disabled={saving || isPending}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan…
                </>
              ) : (
                "Simpan Perubahan"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ubah Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4 max-w-xl" onSubmit={handleChangePassword}>
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Password Saat Ini</Label>
              <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Password Baru</Label>
              <Input id="newPassword" type="password" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
              <Input id="confirmPassword" type="password" minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>

            {pwMsg && <p className="text-sm text-emerald-600">{pwMsg}</p>}
            {pwErr && <p className="text-sm text-destructive">{pwErr}</p>}

            <Button type="submit" variant="outline" disabled={pwSaving}>
              {pwSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memperbarui…
                </>
              ) : (
                "Perbarui Password"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
