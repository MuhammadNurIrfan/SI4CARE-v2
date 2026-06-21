import { getPublishedArticles } from "@/actions/articles";
import { BlogList } from "./_components/blog-list";

export const metadata = {
  title: "Artikel & Blog | si4care — Alat Kesehatan Terpercaya",
  description: "Edukasi, tips, regulasi, dan insight seputar alat kesehatan dari para profesional si4care.",
};

export default async function BlogPage() {
  const articles = await getPublishedArticles();
  return <BlogList articles={articles} />;
}
