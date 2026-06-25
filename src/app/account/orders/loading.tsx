import { Skeleton } from "@/components/ui/skeleton";

// Buffering otomatis saat riwayat pesanan di-fetch dari server.
export default function OrdersLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full max-w-md mb-6" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border overflow-hidden">
          <div className="p-4 bg-muted/30 border-b flex items-center justify-between">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <div className="p-4 flex gap-4 items-center">
            <Skeleton className="h-16 w-16 rounded" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-28 ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}
