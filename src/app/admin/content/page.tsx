"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  FileText, LayoutTemplate, Save, Plus, Pencil, Trash2, Eye,
  Megaphone, MessageSquareQuote, HelpCircle, MousePointerClick, ExternalLink,
} from "lucide-react";
import Link from "next/link";
import {
  useContent, SECTION_META,
  HeroContent, CtaContent, Testimoni, FaqItem,
} from "@/context/ContentContext";
import { ArticlesManager } from "./_components/articles-manager";

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

