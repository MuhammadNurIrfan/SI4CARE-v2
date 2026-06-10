"use client";

import { useEffect, useState } from "react";
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
import {
  FileText, LayoutTemplate, Save, Plus, Pencil, Trash2, Eye, CheckCircle2, FileEdit, Clock, Search,
  Megaphone, MessageSquareQuote, HelpCircle, MousePointerClick, ExternalLink,
} from "lucide-react";
import Link from "next/link";
import {
  useContent, SECTION_META,
  HeroContent, CtaContent, Testimoni, FaqItem, Artikel, ArtikelStatus,
} from "@/context/ContentContext";

/* ── status artikel ── */
const statusCfg: Record<ArtikelStatus, { label: string; cls: string; icon: typeof FileEdit }> = {
  draft: { label: "Draft", cls: "bg-amber-100 text-amber-800 border-amber-200", icon: FileEdit },
  terbit: { label: "Terbit", cls: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: CheckCircle2 },
  terjadwal: { label: "Terjadwal", cls: "bg-blue-100 text-blue-800 border-blue-200", icon: Clock },
};

/** Tombol simpan per-section dengan indikator tersimpan */
function SaveBar({ onSave, dirty }: { onSave: () => void; dirty: boolean }) {
  const [saved, setSaved] = useState(false);
  return (
    <div className="flex items-center gap-3 border-t pt-4">
      <Button
        size="sm"
        className="gap-2"
        onClick={() => { onSave(); setSaved(true); setTimeout(() => setSaved(false), 2200); }}
      >
        <Save className="h-3.5 w-3.5" /> Simpan Section Ini
      </Button>
      {saved && <span className="text-sm font-medium text-emerald-600">✓ Tersimpan — langsung tampil di website</span>}
      {!saved && dirty && <span className="text-xs text-amber-600">Ada perubahan belum disimpan</span>}
    </div>
  );
}

export default function ContentPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl md:text-2xl font-bold tracking-tight">Konten &amp; Artikel</h1>
          <p className="text-sm md:text-base text-muted-foreground">Setiap section dapat diubah dan disimpan secara mandiri — perubahan langsung tampil di website.</p>
        </div>
        <Link href="/" target="_blank">
          <Button variant="outline" size="sm" className="gap-2"><ExternalLink className="h-3.5 w-3.5" /> Lihat Website</Button>
        </Link>
      </div>

      <Tabs defaultValue="landing" className="gap-5">
        <div className="-mx-4 md:mx-0 overflow-x-auto px-4 md:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsList className="h-9 w-max">
            <TabsTrigger value="landing" className="px-4 whitespace-nowrap"><LayoutTemplate className="mr-1.5 h-4 w-4" /> Landing Page</TabsTrigger>
            <TabsTrigger value="articles" className="px-4 whitespace-nowrap"><FileText className="mr-1.5 h-4 w-4" /> Artikel / Blog</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="landing"><LandingEditor /></TabsContent>
        <TabsContent value="articles"><ArticlesManager /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ═════════════ Landing editor — per section ═════════════ */
function LandingEditor() {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="space-y-6">
        <HeroEditor />
        <CtaEditor />
        <SectionVisibility />
      </div>
      <div className="space-y-6">
        <TestimonialEditor />
        <FaqEditor />
      </div>
    </div>
  );
}

/* ── 1. Hero ── */
function HeroEditor() {
  const { content, updateSection } = useContent();
  const [draft, setDraft] = useState<HeroContent>(content.hero);
  useEffect(() => setDraft(content.hero), [content.hero]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(content.hero);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base"><Megaphone className="h-4 w-4 text-primary" /> Section: Hero</CardTitle>
        <CardDescription>Teks utama yang pertama dilihat pengunjung.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-1.5">
          <Label className="text-xs">Badge (pita kecil di atas judul)</Label>
          <Input value={draft.badge} onChange={(e) => setDraft((d) => ({ ...d, badge: e.target.value }))} />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs">Judul Utama (tekan Enter untuk baris baru)</Label>
          <Textarea rows={2} value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs">Baris Judul Berwarna (gradien)</Label>
          <Input value={draft.titleHighlight} onChange={(e) => setDraft((d) => ({ ...d, titleHighlight: e.target.value }))} />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs">Subjudul</Label>
          <Textarea rows={3} value={draft.subtitle} onChange={(e) => setDraft((d) => ({ ...d, subtitle: e.target.value }))} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label className="text-xs">Tombol Utama</Label>
            <Input value={draft.ctaPrimary} onChange={(e) => setDraft((d) => ({ ...d, ctaPrimary: e.target.value }))} />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Tombol Sekunder</Label>
            <Input value={draft.ctaSecondary} onChange={(e) => setDraft((d) => ({ ...d, ctaSecondary: e.target.value }))} />
          </div>
        </div>
        <SaveBar dirty={dirty} onSave={() => updateSection("hero", draft)} />
      </CardContent>
    </Card>
  );
}

/* ── 2. CTA penutup ── */
function CtaEditor() {
  const { content, updateSection } = useContent();
  const [draft, setDraft] = useState<CtaContent>(content.cta);
  useEffect(() => setDraft(content.cta), [content.cta]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(content.cta);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base"><MousePointerClick className="h-4 w-4 text-primary" /> Section: CTA Penutup</CardTitle>
        <CardDescription>Banner ajakan belanja di bagian bawah landing page.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-1.5">
          <Label className="text-xs">Kicker (teks kecil di atas judul)</Label>
          <Input value={draft.kicker} onChange={(e) => setDraft((d) => ({ ...d, kicker: e.target.value }))} />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs">Judul</Label>
          <Textarea rows={2} value={draft.judul} onChange={(e) => setDraft((d) => ({ ...d, judul: e.target.value }))} />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs">Subjudul</Label>
          <Textarea rows={2} value={draft.subjudul} onChange={(e) => setDraft((d) => ({ ...d, subjudul: e.target.value }))} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <Label className="text-xs">Tombol Utama</Label>
            <Input value={draft.tombolUtama} onChange={(e) => setDraft((d) => ({ ...d, tombolUtama: e.target.value }))} />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">Tombol Sekunder</Label>
            <Input value={draft.tombolSekunder} onChange={(e) => setDraft((d) => ({ ...d, tombolSekunder: e.target.value }))} />
          </div>
        </div>
        <SaveBar dirty={dirty} onSave={() => updateSection("cta", draft)} />
      </CardContent>
    </Card>
  );
}

/* ── 3. Visibilitas section ── */
function SectionVisibility() {
  const { content, updateSection } = useContent();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Susunan &amp; Visibilitas Section</CardTitle>
        <CardDescription>Aktif/nonaktifkan section — perubahan langsung diterapkan.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {SECTION_META.map((s) => {
          const on = content.sections[s.key] !== false;
          return (
            <div key={s.key} className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{s.label}</p>
                <p className="text-[11px] text-muted-foreground truncate">{s.desc}</p>
              </div>
              <Badge variant={on ? "default" : "secondary"} className="text-[10px] shrink-0">
                {on ? "Tampil" : "Disembunyikan"}
              </Badge>
              <Switch
                checked={on}
                onCheckedChange={(v) => updateSection("sections", { ...content.sections, [s.key]: v })}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

/* ── 4. Testimoni ── */
function TestimonialEditor() {
  const { content, updateSection } = useContent();
  const [draft, setDraft] = useState<Testimoni[]>(content.testimonials);
  useEffect(() => setDraft(content.testimonials), [content.testimonials]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(content.testimonials);

  const update = (id: string, patch: Partial<Testimoni>) =>
    setDraft((p) => p.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base"><MessageSquareQuote className="h-4 w-4 text-primary" /> Section: Testimonial</CardTitle>
        <CardDescription>Ulasan pelanggan yang tampil di carousel landing page.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
          {draft.map((t) => (
            <div key={t.id} className="rounded-lg border p-3 space-y-2">
              <div className="flex gap-2">
                <Input className="h-8 text-xs" placeholder="Nama" value={t.name} onChange={(e) => update(t.id, { name: e.target.value })} />
                <Button
                  variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive hover:bg-destructive/10"
                  onClick={() => setDraft((p) => p.filter((x) => x.id !== t.id))}
                  aria-label="Hapus testimoni"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Input className="h-8 text-xs" placeholder="Peran · Kota" value={t.role} onChange={(e) => update(t.id, { role: e.target.value })} />
              <Textarea rows={2} className="text-xs" placeholder="Isi ulasan" value={t.content} onChange={(e) => update(t.id, { content: e.target.value })} />
            </div>
          ))}
        </div>
        <Button
          variant="outline" size="sm" className="w-full gap-2"
          onClick={() => setDraft((p) => [...p, { id: `t${Date.now()}`, name: "", role: "", content: "" }])}
        >
          <Plus className="h-3.5 w-3.5" /> Tambah Testimoni
        </Button>
        <SaveBar dirty={dirty} onSave={() => updateSection("testimonials", draft.filter((t) => t.name || t.content))} />
      </CardContent>
    </Card>
  );
}

/* ── 5. FAQ ── */
function FaqEditor() {
  const { content, updateSection } = useContent();
  const [draft, setDraft] = useState<FaqItem[]>(content.faq);
  useEffect(() => setDraft(content.faq), [content.faq]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(content.faq);

  const update = (id: string, patch: Partial<FaqItem>) =>
    setDraft((p) => p.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base"><HelpCircle className="h-4 w-4 text-primary" /> Section: FAQ</CardTitle>
        <CardDescription>Pertanyaan &amp; jawaban di landing page.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
          {draft.map((f, i) => (
            <div key={f.id} className="rounded-lg border p-3 space-y-2">
              <div className="flex gap-2 items-start">
                <span className="mt-2 text-[11px] font-bold text-muted-foreground shrink-0">#{i + 1}</span>
                <Input className="h-8 text-xs" placeholder="Pertanyaan" value={f.q} onChange={(e) => update(f.id, { q: e.target.value })} />
                <Button
                  variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive hover:bg-destructive/10"
                  onClick={() => setDraft((p) => p.filter((x) => x.id !== f.id))}
                  aria-label="Hapus FAQ"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <Textarea rows={2} className="text-xs" placeholder="Jawaban" value={f.a} onChange={(e) => update(f.id, { a: e.target.value })} />
            </div>
          ))}
        </div>
        <Button
          variant="outline" size="sm" className="w-full gap-2"
          onClick={() => setDraft((p) => [...p, { id: `f${Date.now()}`, q: "", a: "" }])}
        >
          <Plus className="h-3.5 w-3.5" /> Tambah FAQ
        </Button>
        <SaveBar dirty={dirty} onSave={() => updateSection("faq", draft.filter((f) => f.q))} />
      </CardContent>
    </Card>
  );
}

/* ═════════════ Articles manager ═════════════ */
function ArticlesManager() {
  const { content, updateSection } = useContent();
  const articles = content.articles;
  const setArticles = (next: Artikel[]) => updateSection("articles", next);

  const [filter, setFilter] = useState<"semua" | ArtikelStatus>("semua");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const emptyArtikel: Omit<Artikel, "id"> = { title: "", category: "Edukasi", status: "draft", date: new Date().toISOString().slice(0, 10), excerpt: "", body: "" };
  const [form, setForm] = useState<Omit<Artikel, "id">>(emptyArtikel);

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
    setForm(emptyArtikel);
    setOpen(true);
  }
  function openEdit(a: Artikel) {
    setEditId(a.id);
    setForm({ title: a.title, category: a.category, status: a.status, date: a.date, excerpt: a.excerpt, body: a.body });
    setOpen(true);
  }
  function save(asStatus?: ArtikelStatus) {
    const data = asStatus ? { ...form, status: asStatus } : form;
    if (!data.title) return;
    if (editId) setArticles(articles.map((a) => (a.id === editId ? { ...data, id: editId } : a)));
    else setArticles([{ ...data, id: String(Date.now()) }, ...articles]);
    setOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-lg border border-primary/15 bg-primary/5 p-3 text-xs text-muted-foreground">
        <Eye className="h-4 w-4 shrink-0 text-primary" />
        <span>Artikel berstatus <strong className="text-foreground">Terbit</strong> otomatis tampil di halaman <Link href="/blog" target="_blank" className="text-primary underline underline-offset-2">/blog</Link>. Draft &amp; Terjadwal hanya terlihat di sini.</span>
      </div>

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

      {/* Daftar artikel — card list (rapi di mobile & desktop) */}
      <div className="space-y-2.5">
        {filtered.length === 0 && (
          <Card><CardContent className="py-10 text-center text-muted-foreground">Tidak ada artikel</CardContent></Card>
        )}
        {filtered.map((a) => {
          const cfg = statusCfg[a.status];
          return (
            <Card key={a.id} className="py-0">
              <CardContent className="flex flex-col gap-2 p-3.5 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium leading-snug line-clamp-1">{a.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{a.excerpt || "—"}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="text-[10px]">{a.category}</Badge>
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.cls}`}>
                    <cfg.icon className="h-3 w-3" /> {cfg.label}
                  </span>
                  <span className="text-xs text-muted-foreground hidden sm:inline">{a.date}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(a)} aria-label="Edit"><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setArticles(articles.filter((x) => x.id !== a.id))} aria-label="Hapus"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Editor dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[90dvh] overflow-y-auto">
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
              <Textarea rows={6} placeholder="Tulis isi artikel di sini..." value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} />
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
