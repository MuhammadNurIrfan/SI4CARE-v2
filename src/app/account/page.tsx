"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/client";

export default function ProfilePage() {
  const { data: session, isPending: sessionLoading } = authClient.useSession();

  // ── Form profil ──────────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [savingProfile, startSaveProfile] = useTransition();

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name ?? "");
      setPhone((session.user as { phone?: string }).phone ?? "");
    }
  }, [session]);

  function handleSaveProfile() {
    setProfileMsg(null);
    startSaveProfile(async () => {
      const { error } = await authClient.updateUser({
        name: name.trim() || undefined,
        phone: phone.trim() || undefined,
      });
      if (error) {
        setProfileMsg({ ok: false, text: error.message ?? "Gagal menyimpan" });
      } else {
        setProfileMsg({ ok: true, text: "Profil berhasil diperbarui" });
      }
    });
  }

  // ── Form ganti password ──────────────────────────────────────────────────
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdMsg, setPwdMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [savingPwd, startSavePwd] = useTransition();

  function handleChangePassword() {
    setPwdMsg(null);
    if (newPwd !== confirmPwd) {
      setPwdMsg({ ok: false, text: "Konfirmasi password tidak cocok" });
      return;
    }
    if (newPwd.length < 8) {
      setPwdMsg({ ok: false, text: "Password baru minimal 8 karakter" });
      return;
    }
    startSavePwd(async () => {
      const { error } = await authClient.changePassword({
        currentPassword: currentPwd,
        newPassword: newPwd,
        revokeOtherSessions: true,
      });
      if (error) {
        setPwdMsg({ ok: false, text: error.message ?? "Gagal mengubah password" });
      } else {
        setPwdMsg({ ok: true, text: "Password berhasil diubah" });
        setCurrentPwd("");
        setNewPwd("");
        setConfirmPwd("");
      }
    });
  }

  if (sessionLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-48 rounded-xl border bg-muted/30 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">Profil Saya</h1>
        <p className="text-muted-foreground">Kelola informasi pribadi dan kata sandi Anda.</p>
      </div>

      {/* Informasi Pribadi */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Pribadi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6 max-w-xl">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama lengkap Anda"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={session?.user.email ?? ""}
                disabled
                readOnly
              />
              <p className="text-xs text-muted-foreground">
                Email tidak dapat diubah karena terikat dengan riwayat transaksi.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Nomor Telepon (WhatsApp)</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="cth: 08123456789"
              />
            </div>

            {profileMsg && (
              <p className={`text-sm ${profileMsg.ok ? "text-emerald-600" : "text-destructive"}`}>
                {profileMsg.text}
              </p>
            )}

            <Button onClick={handleSaveProfile} disabled={savingProfile}>
              {savingProfile ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan…
                </>
              ) : (
                "Simpan Perubahan"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Ubah Password */}
      <Card>
        <CardHeader>
          <CardTitle>Ubah Password</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-w-xl">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Password Saat Ini</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Password Baru</Label>
              <Input
                id="newPassword"
                type="password"
                minLength={8}
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
              <Input
                id="confirmPassword"
                type="password"
                minLength={8}
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                required
              />
            </div>

            {pwdMsg && (
              <p className={`text-sm ${pwdMsg.ok ? "text-emerald-600" : "text-destructive"}`}>
                {pwdMsg.text}
              </p>
            )}

            <Button
              variant="outline"
              onClick={handleChangePassword}
              disabled={savingPwd || !currentPwd || !newPwd || !confirmPwd}
            >
              {savingPwd ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memperbarui…
                </>
              ) : (
                "Perbarui Password"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
