"use client";

import { useState } from "react";
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const contactInfo = [
  { icon: MapPin, label: "Alamat", value: "Jl. Kesehatan No. 123, Menteng, Jakarta Pusat 10310, Indonesia" },
  { icon: Phone, label: "Telepon", value: "+62 21 5555 7890" },
  { icon: Mail, label: "Email", value: "hello@si4care.id" },
  { icon: Clock, label: "Jam Operasional", value: "Senin–Jumat: 08.00–17.00 WIB\nSabtu: 09.00–13.00 WIB" },
];

export default function ContactPage() {
  const [form, setForm] = useState({ nama: "", email: "", topik: "", pesan: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSent(true);
    }, 1500);
  };

  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="py-16 px-4 text-center bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-2xl">
          <span className="text-sm font-semibold text-primary tracking-wider uppercase mb-4 block">Hubungi Kami</span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Ada yang bisa kami bantu?</h1>
          <p className="text-xl text-muted-foreground">
            Tim kami siap membantu pertanyaan seputar produk, kemitraan, atau dukungan teknis.
          </p>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-[400px_1fr] gap-10">
            {/* Info */}
            <div className="space-y-4">
              {contactInfo.map((c) => (
                <Card key={c.label}>
                  <CardContent className="p-5 flex items-start gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                      <c.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm mb-0.5">{c.label}</p>
                      <p className="text-muted-foreground text-sm whitespace-pre-line">{c.value}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Map placeholder */}
              <div className="rounded-xl overflow-hidden border bg-muted/30 aspect-[4/3] flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MapPin className="h-10 w-10 mx-auto mb-2 text-primary/40" />
                  <p className="text-sm">Google Maps — Jl. Kesehatan No. 123<br />Jakarta Pusat</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <Card>
              <CardContent className="p-8">
                {isSent ? (
                  <div className="flex flex-col items-center justify-center h-full min-h-[360px] text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-5">
                      <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Pesan Terkirim!</h2>
                    <p className="text-muted-foreground mb-6 max-w-sm">
                      Terima kasih, <strong>{form.nama}</strong>. Tim kami akan menghubungi Anda melalui <strong>{form.email}</strong> dalam 1×24 jam kerja.
                    </p>
                    <Button variant="outline" onClick={() => { setIsSent(false); setForm({ nama: "", email: "", topik: "", pesan: "" }); }}>
                      Kirim Pesan Lain
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <h2 className="text-2xl font-bold mb-6">Kirim Pesan</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Nama Lengkap *</Label>
                        <Input required value={form.nama} onChange={(e) => setForm(f => ({ ...f, nama: e.target.value }))} placeholder="Budi Santoso" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Email *</Label>
                        <Input required type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} placeholder="nama@email.com" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Topik *</Label>
                      <Select value={form.topik} onValueChange={(v) => { if (v) setForm(f => ({ ...f, topik: v })); }}>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Pilih topik..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="produk">Pertanyaan Produk</SelectItem>
                          <SelectItem value="pesanan">Status Pesanan</SelectItem>
                          <SelectItem value="kemitraan">Kemitraan / B2B</SelectItem>
                          <SelectItem value="teknis">Dukungan Teknis</SelectItem>
                          <SelectItem value="lainnya">Lainnya</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Pesan *</Label>
                      <Textarea
                        required
                        rows={5}
                        value={form.pesan}
                        onChange={(e) => setForm(f => ({ ...f, pesan: e.target.value }))}
                        placeholder="Ceritakan pertanyaan atau kebutuhan Anda..."
                      />
                    </div>
                    <Button type="submit" size="lg" className="w-full gap-2" disabled={isLoading || !form.topik}>
                      {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Mengirim...</> : <><Send className="h-4 w-4" /> Kirim Pesan</>}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
