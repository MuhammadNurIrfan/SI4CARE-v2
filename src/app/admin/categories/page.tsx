import { getCategories } from "@/actions/categories";
import { CategoriesClient } from "./_components/categories-client";

export default async function CategoriesPage() {
  const rows = await getCategories();
  return <CategoriesClient categories={rows} />;
}
