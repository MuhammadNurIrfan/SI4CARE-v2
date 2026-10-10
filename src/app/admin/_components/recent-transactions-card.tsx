import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MobileList, DesktopOnly, RecordCard, Field } from "@/components/admin/data-cards";
import type { DashRecent } from "@/lib/dashboard-query";
import { rp } from "./dashboard-format";

export function RecentTransactionsCard({
  rows, search, onSearch,
}: { rows: DashRecent[]; search: string; onSearch: (v: string) => void }) {
  return (
  <Card>
    <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
      <CardTitle className="text-base">Transaksi Terkini</CardTitle>
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Cari ID / produk…" value={search} onChange={(e) => onSearch(e.target.value)} className="pl-9 h-9" />
      </div>
    </CardHeader>
    <CardContent className="p-0">
      <DesktopOnly className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Kanal</TableHead>
              <TableHead>Produk</TableHead>
              <TableHead className="text-right">Omzet</TableHead>
              <TableHead className="text-right">HPP</TableHead>
              <TableHead className="text-right">Laba</TableHead>
              <TableHead className="text-right">MDR</TableHead>
              <TableHead>Status Dana</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={8} className="py-8 text-center text-muted-foreground">Tidak ada transaksi cocok</TableCell></TableRow>
            )}
            {rows.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-mono text-xs">{t.id}</TableCell>
                <TableCell><Badge variant="outline" className="capitalize">{t.channel}</Badge></TableCell>
                <TableCell className="max-w-[220px] truncate text-sm">{t.produk}</TableCell>
                <TableCell className="text-right text-sm">{rp(t.omzet)}</TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">{rp(t.hpp)}</TableCell>
                <TableCell className="text-right text-sm font-medium text-emerald-700">{rp(t.omzet - t.hpp - t.mdr)}</TableCell>
                <TableCell className="text-right text-sm text-amber-700">{t.mdr > 0 ? `−${rp(t.mdr)}` : "—"}</TableCell>
                <TableCell>
                  {t.dana === "pending"
                    ? <Badge className="bg-amber-100 text-amber-800">Belum masuk</Badge>
                    : <Badge className="bg-emerald-100 text-emerald-800">Uang riil</Badge>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DesktopOnly>

      <MobileList className="p-3">
        {rows.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Tidak ada transaksi cocok</p>}
        {rows.map((t) => (
          <RecordCard key={t.id}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="font-mono text-sm font-semibold">{t.id}</p>
              {t.dana === "pending"
                ? <Badge className="bg-amber-100 text-amber-800">Belum masuk</Badge>
                : <Badge className="bg-emerald-100 text-emerald-800">Uang riil</Badge>}
            </div>
            <Field label="Kanal" value={<Badge variant="outline" className="capitalize">{t.channel}</Badge>} />
            <Field label="Produk" value={<span className="line-clamp-1 text-right">{t.produk}</span>} />
            <Field label="Omzet" value={rp(t.omzet)} />
            <Field label="HPP" value={<span className="text-muted-foreground">{rp(t.hpp)}</span>} />
            <Field label="Laba" value={<span className="text-emerald-700">{rp(t.omzet - t.hpp - t.mdr)}</span>} />
            <Field label="MDR" value={t.mdr > 0 ? <span className="text-amber-700">−{rp(t.mdr)}</span> : "—"} />
          </RecordCard>
        ))}
      </MobileList>
    </CardContent>
  </Card>
  );
}
