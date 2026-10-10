"use client";

import { useState, useEffect } from "react";
import { useTransition } from "react";
import { updateContentSection } from "@/actions/content";
import type { ContentData } from "@/actions/content";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Save, Plus, Trash2 } from "lucide-react";
import { SECTION_META } from "@/lib/content-defaults";
import type { HeroContent, CtaContent, Testimoni, FaqItem } from "@/lib/content-defaults";

type LandingEditorClientProps = {
  initialContent: ContentData;
};

function SaveBar({ onSave, dirty, isPending }: { onSave: () => void; dirty: boolean; isPending: boolean }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (saved) {
      const timer = setTimeout(() => setSaved(false), 2200);
      return () => clearTimeout(timer);
    }
  }, [saved]);

  const handleSave = async () => {
    await onSave();
    setSaved(true);
  };

  return (
    <div className="flex items-center gap-3 border-t pt-4">
      <Button
        size="sm"
        className="gap-2"
        onClick={handleSave}
        disabled={isPending}
      >
        <Save className="h-3.5 w-3.5" /> {isPending ? "Menyimpan..." : "Simpan Section Ini"}
      </Button>
      {saved && <span className="text-sm font-medium text-emerald-600">✓ Tersimpan — langsung tampil di website</span>}
      {!saved && dirty && <span className="text-xs text-amber-600">Ada perubahan belum disimpan</span>}
    </div>
  );
}

function HeroEditor({ content, onUpdate, isPending }: { content: HeroContent; onUpdate: (data: Partial<ContentData>) => void; isPending: boolean }) {
  const [draft, setDraft] = useState<HeroContent>(content);
  useEffect(() => setDraft(content), [content]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(content);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Section: Hero</CardTitle>
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
        <SaveBar dirty={dirty} isPending={isPending} onSave={() => onUpdate({ hero: draft })} />
      </CardContent>
    </Card>
  );
}

function CtaEditor({ content, onUpdate, isPending }: { content: CtaContent; onUpdate: (data: Partial<ContentData>) => void; isPending: boolean }) {
  const [draft, setDraft] = useState<CtaContent>(content);
  useEffect(() => setDraft(content), [content]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(content);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Section: CTA Penutup</CardTitle>
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
        <SaveBar dirty={dirty} isPending={isPending} onSave={() => onUpdate({ cta: draft })} />
      </CardContent>
    </Card>
  );
}

function SectionVisibility({ content, onUpdate, isPending }: { content: Record<string, boolean>; onUpdate: (data: Partial<ContentData>) => void; isPending: boolean }) {
  const handleToggle = (key: string, value: boolean) => {
    onUpdate({ sections: { ...content, [key]: value } } as any);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Susunan &amp; Visibilitas Section</CardTitle>
        <CardDescription>Aktif/nonaktifkan section — perubahan langsung diterapkan.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {SECTION_META.map((s) => {
          const on = content[s.key] !== false;
          return (
            <div key={s.key} className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{s.label}</p>
                <p className="text-[11px] text-muted-foreground truncate">{s.desc}</p>
              </div>
              <Badge variant={on ? "default" : "secondary"} className="text-[10px] shrink-0">
                {on ? "Tampil" : "Disembunyikan"}
              </Badge>
              <Switch checked={on} onCheckedChange={(v) => handleToggle(s.key, v)} disabled={isPending} />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function TestimonialEditor({ content, onUpdate, isPending }: { content: Testimoni[]; onUpdate: (data: Partial<ContentData>) => void; isPending: boolean }) {
  const [draft, setDraft] = useState<Testimoni[]>(content);
  useEffect(() => setDraft(content), [content]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(content);

  const update = (id: string, patch: Partial<Testimoni>) =>
    setDraft((p) => p.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Section: Testimonial</CardTitle>
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
        <SaveBar dirty={dirty} isPending={isPending} onSave={() => onUpdate({ testimonials: draft.filter((t) => t.name || t.content) })} />
      </CardContent>
    </Card>
  );
}

function FaqEditor({ content, onUpdate, isPending }: { content: FaqItem[]; onUpdate: (data: Partial<ContentData>) => void; isPending: boolean }) {
  const [draft, setDraft] = useState<FaqItem[]>(content);
  useEffect(() => setDraft(content), [content]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(content);

  const update = (id: string, patch: Partial<FaqItem>) =>
    setDraft((p) => p.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Section: FAQ</CardTitle>
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
        <SaveBar dirty={dirty} isPending={isPending} onSave={() => onUpdate({ faq: draft.filter((f) => f.q) })} />
      </CardContent>
    </Card>
  );
}

export function LandingEditorClient({ initialContent }: LandingEditorClientProps) {
  const [content, setContent] = useState<ContentData>(initialContent);
  const [isPending, startTransition] = useTransition();

  const handleUpdate = (data: Partial<ContentData>) => {
    const merged = { ...content, ...data };
    setContent(merged);
    startTransition(async () => {
      try {
        await updateContentSection("landing", data);
      } catch (e) {
        console.error("Error updating content:", e);
      }
    });
  };

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="space-y-6">
        <HeroEditor content={content.hero} onUpdate={handleUpdate} isPending={isPending} />
        <CtaEditor content={content.cta} onUpdate={handleUpdate} isPending={isPending} />
        <SectionVisibility content={content.sections} onUpdate={handleUpdate} isPending={isPending} />
      </div>
      <div className="space-y-6">
        <TestimonialEditor content={content.testimonials} onUpdate={handleUpdate} isPending={isPending} />
        <FaqEditor content={content.faq} onUpdate={handleUpdate} isPending={isPending} />
      </div>
    </div>
  );
}
