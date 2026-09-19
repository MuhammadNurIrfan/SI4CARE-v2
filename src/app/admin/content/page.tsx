import { getContentSections } from "@/actions/content";
import { LandingEditorClient } from "./_components/landing-editor-client";
import { ArticlesManager } from "./_components/articles-manager";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileText, LayoutTemplate, ExternalLink } from "lucide-react";
import Link from "next/link";

export default async function ContentPage() {
  const content = await getContentSections();

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

        <TabsContent value="landing">
          <LandingEditorClient initialContent={content} />
        </TabsContent>
        <TabsContent value="articles">
          <ArticlesManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
