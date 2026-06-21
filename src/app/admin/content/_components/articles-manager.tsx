"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Plus, Pencil, Trash2, Eye, CheckCircle2, FileEdit, Clock, Search, Loader2,
} from "lucide-react";
import {
  getAdminArticles, upsertArticle, deleteArticle,
  type ArticleRow, type ArticleStatus, type UpsertArticleInput,
} from "@/actions/articles";

const statusCfg: Record<ArticleStatus, { label: string; cls: string; icon: typeof FileEdit }> = {
  draft:      { label: "Draft",      cls: "bg-amber-100 text-amber-800 border-amber-200",    icon: FileEdit },
  terbit:     { label: "Terbit",     cls: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: CheckCircle2 },
  terjadwal:  { label: "Terjadwal",  cls: "bg-blue-100 text-blue-800 border-blue-200",       icon: Clock },
};

const CATEGORIES = ["Edukasi", "Tips & Trik", "Regulasi", "Klinik", "Promo", "Bisnis"];

type FormState = Omit<UpsertArticleInput, "id"> & { id?: string };
const emptyForm: FormState = {
  title: "", category: "Edukasi", excerpt: "", body: "",
  status: "draft", metaTitle: "", metaDescription: "",
};

export function ArticlesManager() {
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"semua" | ArticleStatus>("semua");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isPending, startTx] = useTransition();
  const [errMsg, setErrMsg] = useState<string | null>(null);

  useEffect(() => {
    getAdminArticles().then((rows) => { setArticles(rows); setLoading(false); });
  }, []);

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
    setForm(emptyForm);
    setErrMsg(null);
    setOpen(true);
  }
  function openEdit(a: ArticleRow) {
    setForm({
      id: a.id,
      title: a.title,
      category: a.category ?? "Edukasi",
      excerpt: a.excerpt ?? "",
      body: a.body ?? "",
      status: a.status,
      metaTitle: a.metaTitle ?? "",
      metaDescription: a.metaDescription ?? "",
    });
    setErrMsg(null);
    setOpen(true);
  }
  function handleSave(overrideStatus?: ArticleStatus) {
    const data = overrideStatus ? { ...form, status: overrideStatus } : form;
    if (!data.title.trim()) return;
    startTx(async () => {
      const res = await upsertArticle(data);
      if (res.ok) {
        const rows = await getAdminArticles();
        setArticles(rows);
        setOpen(false);
      } else {
        setErrMsg("Gagal menyimpan artikel");
      }
    });
  }
  function handleDelete(id: string) {
    startTx(async () => {
      await deleteArticle(id);
      setArticles((prev) => prev.filter((a) => a.id !== id));
    });
  }

  if (loading) {
    return <div className="flex items-center gap-2 py-8 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Memuat artikel...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-lg border border-primary/15 bg-primary/5 p-3 text-xs text-muted-foreground">
        <Eye className="h-4 w-4 shrink-0 text-primary mt-0.5" />
        <span>
          Artikel berstatus <strong className="text-foreground">Terbit</strong> tampil di{" "}
          <Link href="/blog" target="_blank" className="text-primary underline underline-offset-2">/blog</Link>.
          {" "}Setiap artikel memiliki URL unik (<code className="text-xs bg-muted px-1 rounded">/blog/[slug]</code>) dengan tag SEO &amp; schema.org.
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(["semua", "draft", "terbit", "terjadwal"] as const).map((key) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${filter === key ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`}>
              {key.charAt(0).toUpperCase() + key.slice(1)} <span className={filter === key ? "opacity-80" : "text-muted-foreground"}>({counts[key]})</span>
            </button>
          ))}
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Tulis Artikel</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Cari judul artikel..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

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
                  <p className="text-xs text-muted-foreground font-mono">/blog/{a.slug}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="text-[10px]">{a.category}</Badge>
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.cls}`}>
                    <cfg.icon className="h-3 w-3" /> {cfg.label}
                  </span>
                  <span className="text-xs text-muted-foreground hidden sm:inline">{a.publishedAt ?? a.createdAt}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(a)} aria-label="Edit"><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleDelete(a.id)} aria-label="Hapus">
                    {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Editor dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader><DialogTitle>{form.id ? "Edit Artikel" : "Tulis Artikel Baru"}</DialogTitle></DialogHeader>
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
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={form.status} onValueChange={(v) => { if (v) setForm((f) => ({ ...f, status: v as ArticleStatus })); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="terbit">Terbit</SelectItem>
                    <SelectItem value="terjadwal">Terjadwal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Ringkasan / Excerpt</Label>
              <Textarea rows={2} value={form.excerpt} onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))} />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Isi Artikel</Label>
              <Textarea rows={7} placeholder="Tulis isi artikel... Gunakan ## untuk heading, - untuk list." value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} className="font-mono text-xs" />
            </div>
            <Separator />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">SEO (opsional)</p>
            <div className="grid gap-1.5">
              <Label className="text-xs">Meta Title <span className="text-muted-foreground">(default: judul)</span></Label>
              <Input value={form.metaTitle ?? ""} onChange={(e) => setForm((f) => ({ ...f, metaTitle: e.target.value }))} placeholder={form.title || "Meta title..."} />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Meta Description <span className="text-muted-foreground">(default: excerpt)</span></Label>
              <Textarea rows={2} value={form.metaDescription ?? ""} onChange={(e) => setForm((f) => ({ ...f, metaDescription: e.target.value }))} placeholder={form.excerpt || "Deskripsi untuk mesin pencari (maks. 160 karakter)..."} />
            </div>
            {errMsg && <p className="text-sm text-destructive">{errMsg}</p>}
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="outline" onClick={() => handleSave("draft")} disabled={!form.title.trim() || isPending} className="gap-2">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileEdit className="h-4 w-4" />} Simpan Draft
            </Button>
            <Button onClick={() => handleSave("terbit")} disabled={!form.title.trim() || isPending} className="gap-2">
              <CheckCircle2 className="h-4 w-4" /> Terbitkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
