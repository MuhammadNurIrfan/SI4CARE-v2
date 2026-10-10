import { getPublishedArticles } from "@/actions/articles";
import { BlogList } from "./_components/blog-list";

export const metadata = {
  title: "Artikel & Blog | si4care — Alat Kesehatan Terpercaya",
  description: "Edukasi, tips, regulasi, dan insight seputar alat kesehatan dari para profesional si4care.",
};

// ISR: data dari DB. Tanpa ini halaman dirender statis saat build dan tak pernah berubah sampai deploy ulang.
export const revalidate = 60;

export default async function BlogPage() {
  const articles = await getPublishedArticles();
  return <BlogList articles={articles} />;
}
