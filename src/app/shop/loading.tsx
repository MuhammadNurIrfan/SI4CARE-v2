import { Skeleton } from "@/components/ui/skeleton";

// Tampil otomatis oleh Next.js saat data halaman /shop sedang di-fetch.
export default function ShopLoading() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
      <Skeleton className="h-9 w-48 mb-2" />
      <Skeleton className="h-5 w-72 mb-8" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-2xl sm:rounded-3xl border bg-card overflow-hidden">
            <Skeleton className="aspect-square w-full rounded-none" />
            <div className="p-2.5 sm:p-5 space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-8 w-full mt-3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
