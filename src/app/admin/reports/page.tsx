import { getReportData } from "@/actions/reports";
import { ReportsClient } from "./_components/reports-client";

function defaultDates() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return { dateFrom: `${y}-${m}-01`, dateTo: `${y}-${m}-${day}` };
}

export default async function ReportsPage() {
  const { dateFrom, dateTo } = defaultDates();
  const data = await getReportData(dateFrom, dateTo, "semua");
  return <ReportsClient initialData={data} initialDateFrom={dateFrom} initialDateTo={dateTo} />;
}
