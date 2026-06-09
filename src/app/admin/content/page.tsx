"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  FileText, LayoutTemplate, Save, Plus, Pencil, Trash2, Eye, GripVertical, CheckCircle2, FileEdit, Clock, Search,
} from "lucide-react";

/* ───────── Landing sections ───────── */
const sectionMeta = [
  { key: "hero", label: "Hero", desc: "Judul utama, subjudul, dan tombol CTA" },
  { key: "social", label: "Social Proof", desc: "Marquee merek terpercaya" },
  { key: "benefits", label: "Keunggulan", desc: "6 nilai jual utama" },
  { key: "how", label: "Cara Belanja", desc: "4 langkah pembelian" },
  { key: "products", label: "Produk Unggulan", desc: "Carousel produk terlaris" },
  { key: "quality", label: "Komitmen Kualitas", desc: "Band lifestyle + statistik" },
  { key: "testimonials", label: "Testimonial", desc: "Carousel ulasan pelanggan" },
  { key: "articles", label: "Artikel", desc: "3 artikel terbaru" },
  { key: "faq", label: "FAQ", desc: "Pertanyaan umum" },
  { key: "cta", label: "CTA Penutup", desc: "Ajakan belanja terakhir" },
];

type ArticleStatus = "draft" | "terbit" | "terjadwal";

interface Article {
  id: string;
  title: string;
  category: string;
  status: ArticleStatus;
  date: string;
  excerpt: string;
}

const initialArticles: Article[] = [
  { id: "1", title: "Cara Memilih Tensimeter Digital yang Tepat untuk Rumah", category: "Edukasi", status: "terbit", date: "2026-05-28", excerpt: "Panduan memilih tensimeter akurat untuk pemakaian di rumah." },
  { id: "2", title: "5 Alat Kesehatan Wajib Ada di Setiap Rumah Tangga", category: "Tips & Trik", status: "terbit", date: "2026-05-20", excerpt: "Investasi alat kesehatan dasar untuk respons cepat darurat." },
  { id: "3", title: "Memahami Regulasi BPOM untuk Alat Kesehatan", category: "Regulasi", status: "draft", date: "2026-06-04", excerpt: "Rangkuman aturan distribusi alkes di Indonesia." },
  { id: "4", title: "Checklist Perlengkapan Medis Dasar untuk Klinik Pratama", category: "Klinik", status: "draft", date: "2026-06-05", excerpt: "Daftar alat diagnostik & habis pakai wajib untuk klinik." },
  { id: "5", title: "Promo Kemerdekaan: Diskon Alkes hingga 25%", category: "Promo", status: "terjadwal", date: "2026-08-10", excerpt: "Artikel kampanye yang dijadwalkan terbit otomatis." },
];

const statusCfg: Record<ArticleStatus, { label: string; cls: string; icon: typeof FileEdit }> = {
  draft: { label: "Draft", cls: "bg-amber-100 text-amber-800 border-amber-200", icon: FileEdit },
  terbit: { label: "Terbit", cls: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: CheckCircle2 },
  terjadwal: { label: "Terjadwal", cls: "bg-blue-100 text-blue-800 border-blue-200", icon: Clock },
};

export default function ContentPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Konten &amp; Artikel</h1>
        <p className="text-muted-foreground">Atur isi landing page dan kelola artikel blog — termasuk draft dan jadwal terbit.</p>
      </div>

      <Tabs defaultValue="landing" className="gap-5">
        <TabsList className="h-9">
          <TabsTrigger value="landing" className="px-4"><LayoutTemplate className="mr-1.5 h-4 w-4" /> Landing Page</TabsTrigger>
          <TabsTrigger value="articles" className="px-4"><FileText className="mr-1.5 h-4 w-4" /> Artikel / Blog</TabsTrigger>
        </TabsList>

        <TabsContent value="landing"><LandingEditor /></TabsContent>
        <TabsContent value="articles"><ArticlesManager /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ═════════════ Landing editor ═════════════ */
function LandingEditor() {
  const [heroTitle, setHeroTitle] = useState("Alat kesehatan terpercaya untuk keluarga & klinik.");
  const [heroSub, setHeroSub] = useState("Tensimeter, nebulizer, kursi roda, oximeter, dan ribuan produk alkes lainnya — 100% original, harga transparan.");
  const [ctaPrimary, setCtaPrimary] = useState("Lihat Produk Lengkap");
  const [ctaSecondary, setCtaSecondary] = useState("Cara Pembelian");
  const [visible, setVisible] = useState<Record<string, boolean>>(
    Object.fromEntries(sectionMeta.map((s) => [s.key, true]))
  );
  const [saved, setSaved] = useState(false);

  function save() { setSaved(true); setTimeout(() => setSaved(false), 2500); }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Hero content */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Konten Hero</CardTitle>
          <CardDescription>Teks utama yang pertama dilihat pengunjung.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-1.5">
            <Label className="text-xs">Judul Utama</Label>
            <Textarea rows={2} value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Subjudul</Label>
            <Textarea rows={3} value={heroSub} onChange={(e) => setHeroSub(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label className="text-xs">Tombol Utama</Label>
              <Input value={ctaPrimary} onChange={(e) => setCtaPrimary(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Tombol Sekunder</Label>
              <Input value={ctaSecondary} onChange={(e) => setCtaSecondary(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section toggles + order */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Susunan &amp; Visibilitas Section</CardTitle>
          <CardDescription>Aktif/nonaktifkan section. Seret untuk mengubah urutan.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {sectionMeta.map((s) => (
            <div key={s.key} className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5">
              <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground/50" />
              <div className="flex-1">
                <p className="text-sm font-medium">{s.label}</p>
                <p className="text-[11px] text-muted-foreground">{s.desc}</p>
              </div>
              <Badge variant={visible[s.key] ? "default" : "secondary"} className="text-[10px]">
                {visible[s.key] ? "Tampil" : "Disembunyikan"}
              </Badge>
              <Switch checked={visible[s.key]} onCheckedChange={(v) => setVisible((prev) => ({ ...prev, [s.key]: v }))} />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="lg:col-span-2 flex items-center gap-3">
        <Button onClick={save} className="gap-2"><Save className="h-4 w-4" /> Simpan Perubahan Landing</Button>
        <Button variant="outline" className="gap-2"><Eye className="h-4 w-4" /> Pratinjau</Button>
        {saved && <span className="text-sm font-medium text-emerald-600">✓ Tersimpan</span>}
      </div>
    </div>
  );
}

/* ═════════════ Articles manager ═════════════ */
function ArticlesManager() {
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [filter, setFilter] = useState<"semua" | ArticleStatus>("semua");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Article, "id">>({ title: "", category: "Edukasi", status: "draft", date: "2026-06-06", excerpt: "" });

  const counts = {
    semua: articles.length,
    draft: articles.filter((a) => a.status === "draft").length,
    terbit: articles.filter((a) => a.status === "terbit").length,
    terjadwal: articles.filter((a) => a.status === "terjadwal").length,
  };

  const filtered = articles.filter((a) => {
    const okStatus = filter === "semua" || a.status === filter;
    const okSearch = a.title.toLowerCase().includes(search.toLowerCase());
    return okStatus && okSearch;
  });

  function openNew() {
    setEditId(null);
    setForm({ title: "", category: "Edukasi", status: "draft", date: "2026-06-06", excerpt: "" });
    setOpen(true);
  }
  function openEdit(a: Article) {
    setEditId(a.id);
    setForm({ title: a.title, category: a.category, status: a.status, date: a.date, excerpt: a.excerpt });
    setOpen(true);
  }
  function save(asStatus?: ArticleStatus) {
    const data = asStatus ? { ...form, status: asStatus } : form;
    if (!data.title) return;
    if (editId) setArticles((p) => p.map((a) => (a.id === editId ? { ...data, id: editId } : a)));
    else setArticles((p) => [{ ...data, id: String(Date.now()) }, ...p]);
    setOpen(false);
  }

  return (
    <div className="space-y-4">
      {/* Filter chips */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {([
            ["semua", "Semua"],
            ["draft", "Draft"],
            ["terbit", "Terbit"],
            ["terjadwal", "Terjadwal"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${filter === key ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`}
            >
              {label} <span className={filter === key ? "opacity-80" : "text-muted-foreground"}>({counts[key]})</span>
            </button>
          ))}
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Tulis Artikel</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Cari judul artikel..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Judul</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">Tidak ada artikel</TableCell></TableRow>
              )}
              {filtered.map((a) => {
                const cfg = statusCfg[a.status];
                return (
                  <TableRow key={a.id}>
                    <TableCell className="max-w-[320px]">
                      <p className="truncate font-medium">{a.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{a.excerpt}</p>
                    </TableCell>
                    <TableCell><Badge variant="outline">{a.category}</Badge></TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.cls}`}>
                        <cfg.icon className="h-3 w-3" /> {cfg.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{a.date}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(a)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setArticles((p) => p.filter((x) => x.id !== a.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Editor dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{editId ? "Edit Artikel" : "Tulis Artikel Baru"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-1">
            <div className="grid gap-1.5">
              <Label className="text-xs">Judul</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Judul artikel..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label className="text-xs">Kategori</Label>
                <Select value={form.category} onValueChange={(v) => { if (v) setForm((f) => ({ ...f, category: v })); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Edukasi", "Tips & Trik", "Regulasi", "Klinik", "Promo", "Bisnis"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Tanggal Terbit</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Ringkasan / Excerpt</Label>
              <Textarea rows={2} value={form.excerpt} onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))} />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Isi Artikel</Label>
              <Textarea rows={5} placeholder="Tulis isi artikel di sini..." />
            </div>
          </div>
          <Separator />
          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="outline" onClick={() => save("draft")} disabled={!form.title} className="gap-2">
              <FileEdit className="h-4 w-4" /> Simpan sebagai Draft
            </Button>
            <Button onClick={() => save("terbit")} disabled={!form.title} className="gap-2">
              <CheckCircle2 className="h-4 w-4" /> Terbitkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
