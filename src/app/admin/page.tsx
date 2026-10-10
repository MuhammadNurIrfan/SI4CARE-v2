import { requireAdmin } from "@/lib/server-auth";
import { getDashboardData } from "@/lib/dashboard-query";
import { parsePeriod } from "@/lib/dashboard-range";
import { DashboardClient } from "./_components/dashboard-client";

// Selalu dirender per request: data keuangan harus terkini, dan halaman ini hanya untuk admin.
export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  // Layout admin sudah memeriksa sesi, tetapi layout dan page dirender paralel — jangan mengandalkan
  // layout untuk melindungi pengambilan data.
  await requireAdmin();
  const { period } = await searchParams;
  const data = await getDashboardData(parsePeriod(period));
  return <DashboardClient data={data} />;
}
