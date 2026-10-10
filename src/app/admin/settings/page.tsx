"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Save, Store, Bell, Shield, Printer, Receipt, Usb, Bluetooth, Wifi, Plug, CheckCircle2 } from "lucide-react";
import { SITE_CONFIG } from "@/lib/site-config";

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);

  // Toko
  const [namaToko, setNamaToko] = useState("Si4Care Medical Supply");
  const [alamat, setAlamat] = useState<string>(SITE_CONFIG.address);
  const [telepon, setTelepon] = useState<string>(SITE_CONFIG.phone);
  const [email, setEmail] = useState("admin@si4care.id");

  // Notifikasi
  const [notifStokRendah, setNotifStokRendah] = useState(true);
  const [notifExpDate, setNotifExpDate] = useState(true);
  const [notifPesananBaru, setNotifPesananBaru] = useState(true);
  const [hariSebelumExp, setHariSebelumExp] = useState("30");

  // POS
  const [ppn, setPpn] = useState("12");
  const [printOtomatis, setPrintOtomatis] = useState(false);
  const [footer, setFooter] = useState("Terima kasih telah berbelanja di Si4Care!");

  // Format struk
  const [paperSize, setPaperSize] = useState("80");
  const [showLogo, setShowLogo] = useState(true);
  const [headerLine, setHeaderLine] = useState("Si4Care Medical Supply");
  const [showSku, setShowSku] = useState(false);
  const [showCashier, setShowCashier] = useState(true);
  const [showTaxBreakdown, setShowTaxBreakdown] = useState(true);
  const [showQris, setShowQris] = useState(true);

  // Koneksi printer
  const [printerType, setPrinterType] = useState("thermal");
  const [connection, setConnection] = useState("usb");
  const [printerIp, setPrinterIp] = useState("192.168.1.50");
  const [autoCut, setAutoCut] = useState(true);
  const [printerStatus, setPrinterStatus] = useState<"idle" | "testing" | "ok">("idle");

  function testPrint() {
    setPrinterStatus("testing");
    setTimeout(() => setPrinterStatus("ok"), 1400);
    setTimeout(() => setPrinterStatus("idle"), 4000);
  }

  // Keamanan
  const [pwLama, setPwLama] = useState("");
  const [pwBaru, setPwBaru] = useState("");
  const [pwKonfirmasi, setPwKonfirmasi] = useState("");

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-muted-foreground">Konfigurasi profil toko, notifikasi, dan sistem</p>
      </div>

      {/* Profil Toko */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">Profil Toko</CardTitle>
              <CardDescription>Informasi utama toko Anda</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-1.5">
            <Label>Nama Toko</Label>
            <Input value={namaToko} onChange={(e) => setNamaToko(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Alamat</Label>
            <Textarea value={alamat} onChange={(e) => setAlamat(e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label>Nomor Telepon</Label>
              <Input value={telepon} onChange={(e) => setTelepon(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Email Admin</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifikasi & Alarm */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">Notifikasi & Alarm</CardTitle>
              <CardDescription>Atur kapan Anda mendapat peringatan sistem</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Alarm Stok Rendah</p>
              <p className="text-xs text-muted-foreground">Notifikasi saat stok di bawah minimum</p>
            </div>
            <Switch checked={notifStokRendah} onCheckedChange={setNotifStokRendah} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Peringatan Mendekati Kadaluarsa</p>
              <p className="text-xs text-muted-foreground">Notifikasi sebelum produk kadaluarsa</p>
            </div>
            <Switch checked={notifExpDate} onCheckedChange={setNotifExpDate} />
          </div>
          {notifExpDate && (
            <div className="flex items-center gap-3 pl-1">
              <Label className="text-sm shrink-0 text-muted-foreground">Berikan peringatan</Label>
              <Select value={hariSebelumExp} onValueChange={(v) => { if (v) setHariSebelumExp(v); }}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 hari</SelectItem>
                  <SelectItem value="14">14 hari</SelectItem>
                  <SelectItem value="30">30 hari</SelectItem>
                  <SelectItem value="60">60 hari</SelectItem>
                  <SelectItem value="90">90 hari</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">sebelum ED</span>
            </div>
          )}
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Notifikasi Pesanan Baru</p>
              <p className="text-xs text-muted-foreground">Alert saat pesanan masuk dari web atau marketplace</p>
            </div>
            <Switch checked={notifPesananBaru} onCheckedChange={setNotifPesananBaru} />
          </div>
        </CardContent>
      </Card>

      {/* Pengaturan POS */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">Pengaturan POS & Struk</CardTitle>
              <CardDescription>Konfigurasi pajak dan tampilan struk kasir</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="grid gap-1.5 w-40">
              <Label>PPN (%)</Label>
              <Input
                type="number"
                value={ppn}
                onChange={(e) => setPpn(e.target.value)}
                min="0"
                max="100"
              />
            </div>
            <p className="text-sm text-muted-foreground mt-5">
              Saat ini: PPN {ppn}% diterapkan pada setiap transaksi POS
            </p>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Cetak Struk Otomatis</p>
              <p className="text-xs text-muted-foreground">Print struk langsung setelah transaksi selesai</p>
            </div>
            <Switch checked={printOtomatis} onCheckedChange={setPrintOtomatis} />
          </div>
          <div className="grid gap-1.5">
            <Label>Pesan Footer Struk</Label>
            <Input
              value={footer}
              onChange={(e) => setFooter(e.target.value)}
              placeholder="Pesan yang tampil di bawah struk..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Format Struk */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">Format &amp; Tampilan Struk</CardTitle>
              <CardDescription>Atur ukuran kertas dan informasi yang dicetak. Pratinjau langsung di samping.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
            <div className="space-y-4">
              <div className="grid gap-1.5">
                <Label>Ukuran Kertas</Label>
                <Select value={paperSize} onValueChange={(v) => { if (v) setPaperSize(v); }}>
                  <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="58">Thermal 58mm</SelectItem>
                    <SelectItem value="80">Thermal 80mm</SelectItem>
                    <SelectItem value="a4">Kertas A4 (faktur)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Baris Header (Nama di atas struk)</Label>
                <Input value={headerLine} onChange={(e) => setHeaderLine(e.target.value)} />
              </div>
              <Separator />
              {[
                { label: "Tampilkan logo toko", desc: "Logo di bagian atas struk", v: showLogo, set: setShowLogo },
                { label: "Tampilkan SKU produk", desc: "Kode produk di tiap baris item", v: showSku, set: setShowSku },
                { label: "Tampilkan nama kasir", desc: "Identitas operator transaksi", v: showCashier, set: setShowCashier },
                { label: "Rincian pajak (PPN)", desc: "Pisahkan DPP dan PPN", v: showTaxBreakdown, set: setShowTaxBreakdown },
                { label: "QR pembayaran/QRIS di struk", desc: "Cetak QR untuk verifikasi", v: showQris, set: setShowQris },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <div><p className="text-sm font-medium">{row.label}</p><p className="text-xs text-muted-foreground">{row.desc}</p></div>
                  <Switch checked={row.v} onCheckedChange={row.set} />
                </div>
              ))}
            </div>

            {/* Live preview */}
            <div className="flex flex-col items-center">
              <p className="mb-2 text-xs text-muted-foreground">Pratinjau ({paperSize === "a4" ? "A4" : `${paperSize}mm`})</p>
              <div className={`rounded-lg border bg-white p-4 font-mono text-[10px] text-black shadow-sm ${paperSize === "58" ? "w-40" : paperSize === "80" ? "w-52" : "w-full"}`}>
                {showLogo && <div className="mx-auto mb-1 h-6 w-6 rounded bg-primary/15" />}
                <p className="text-center text-xs font-bold">{headerLine}</p>
                <p className="text-center text-[9px]">{SITE_CONFIG.addressShort}</p>
                <div className="my-1.5 border-t border-dashed" />
                <div className="flex justify-between text-[9px]"><span>POS-000123</span><span>06/06/26</span></div>
                {showCashier && <p className="text-[9px]">Kasir: Admin</p>}
                <div className="my-1.5 border-t border-dashed" />
                <div>
                  <p>Tensimeter OMRON</p>
                  {showSku && <p className="text-[9px] opacity-60">ALK-TEN-001</p>}
                  <div className="flex justify-between"><span>1x 540.000</span><span>540.000</span></div>
                </div>
                <div className="my-1.5 border-t border-dashed" />
                {showTaxBreakdown ? (
                  <>
                    <div className="flex justify-between"><span>DPP</span><span>482.143</span></div>
                    <div className="flex justify-between"><span>PPN 12%</span><span>57.857</span></div>
                  </>
                ) : (
                  <div className="flex justify-between"><span>PPN incl.</span><span>57.857</span></div>
                )}
                <div className="flex justify-between font-bold"><span>TOTAL</span><span>540.000</span></div>
                {showQris && <div className="mx-auto mt-2 h-10 w-10 bg-black/80" />}
                <p className="mt-2 text-center text-[9px]">{footer}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Koneksi Printer */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Plug className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">Koneksi Printer</CardTitle>
              <CardDescription>Hubungkan printer kasir dan uji cetak.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Jenis Printer</Label>
              <Select value={printerType} onValueChange={(v) => { if (v) setPrinterType(v); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="thermal">Thermal (struk)</SelectItem>
                  <SelectItem value="dotmatrix">Dot Matrix</SelectItem>
                  <SelectItem value="inkjet">Inkjet/Laser (A4)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Metode Koneksi</Label>
              <Select value={connection} onValueChange={(v) => { if (v) setConnection(v); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="usb">USB</SelectItem>
                  <SelectItem value="bluetooth">Bluetooth</SelectItem>
                  <SelectItem value="network">Jaringan (IP)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Connection-specific */}
          <div className="rounded-lg border bg-muted/30 p-3">
            {connection === "usb" && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Usb className="h-4 w-4 text-primary" /> Printer USB akan terdeteksi otomatis saat tercolok.</p>}
            {connection === "bluetooth" && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Bluetooth className="h-4 w-4 text-primary" /> Pastikan printer Bluetooth sudah dipasangkan (paired) dengan perangkat.</p>}
            {connection === "network" && (
              <div className="flex items-end gap-3">
                <div className="grid flex-1 gap-1.5">
                  <Label className="flex items-center gap-1.5 text-xs"><Wifi className="h-3.5 w-3.5" /> Alamat IP Printer</Label>
                  <Input value={printerIp} onChange={(e) => setPrinterIp(e.target.value)} className="font-mono" placeholder="192.168.1.50" />
                </div>
                <span className="pb-2 text-xs text-muted-foreground">Port 9100</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div><p className="text-sm font-medium">Potong kertas otomatis</p><p className="text-xs text-muted-foreground">Auto-cut setelah cetak (printer thermal)</p></div>
            <Switch checked={autoCut} onCheckedChange={setAutoCut} />
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={testPrint} className="gap-2" disabled={printerStatus === "testing"}>
              <Printer className="h-4 w-4" /> {printerStatus === "testing" ? "Mengirim…" : "Uji Cetak"}
            </Button>
            {printerStatus === "ok" && <Badge className="gap-1 bg-emerald-100 text-emerald-800"><CheckCircle2 className="h-3.5 w-3.5" /> Berhasil tercetak</Badge>}
            <span className="text-xs text-muted-foreground">Status: {printerType} · {connection}{connection === "network" ? ` (${printerIp})` : ""}</span>
          </div>
        </CardContent>
      </Card>

      {/* Keamanan */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">Keamanan Akun</CardTitle>
              <CardDescription>Ubah password akun admin</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 max-w-sm">
          <div className="grid gap-1.5">
            <Label>Password Lama</Label>
            <Input type="password" value={pwLama} onChange={(e) => setPwLama(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Password Baru</Label>
            <Input type="password" value={pwBaru} onChange={(e) => setPwBaru(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Konfirmasi Password Baru</Label>
            <Input type="password" value={pwKonfirmasi} onChange={(e) => setPwKonfirmasi(e.target.value)} />
          </div>
          {pwBaru && pwKonfirmasi && pwBaru !== pwKonfirmasi && (
            <p className="text-xs text-destructive">Password baru tidak cocok</p>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} className="px-6">
          <Save className="h-4 w-4 mr-2" />
          Simpan Pengaturan
        </Button>
        {saved && (
          <p className="text-sm text-emerald-600 font-medium">✓ Pengaturan berhasil disimpan</p>
        )}
      </div>
    </div>
  );
}
