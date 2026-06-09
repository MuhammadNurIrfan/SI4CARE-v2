import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ProfilePage() {
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
          <form className="space-y-6 max-w-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nama Depan</Label>
                <Input id="firstName" defaultValue="Budi" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nama Belakang</Label>
                <Input id="lastName" defaultValue="Santoso" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="budi@example.com" disabled />
              <p className="text-xs text-muted-foreground">Email tidak dapat diubah karena terikat dengan riwayat transaksi.</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Nomor Telepon (WhatsApp)</Label>
              <Input id="phone" type="tel" defaultValue="081234567890" />
            </div>

            <Button type="button">Simpan Perubahan</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ubah Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4 max-w-xl">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Password Saat Ini</Label>
              <Input id="currentPassword" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Password Baru</Label>
              <Input id="newPassword" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
              <Input id="confirmPassword" type="password" />
            </div>
            <Button type="button" variant="outline">Perbarui Password</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
