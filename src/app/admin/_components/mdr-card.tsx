import { CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MobileList, DesktopOnly, RecordCard, Field } from "@/components/admin/data-cards";
import type { DashMdr } from "@/lib/dashboard-query";
import { rp } from "./dashboard-format";

export function MdrCard({ mdrDetail }: { mdrDetail: DashMdr[] }) {
  return (
  <Card>
    <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><CreditCard className="h-4 w-4 text-primary" /> Detail Beban MDR (ditanggung toko vs tidak)</CardTitle></CardHeader>
    <CardContent className="p-0">
      <DesktopOnly className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Metode</TableHead>
              <TableHead>Kanal</TableHead>
              <TableHead className="text-center">Volume</TableHead>
              <TableHead className="text-right">Omzet</TableHead>
              <TableHead className="text-right">Rate</TableHead>
              <TableHead className="text-right">Beban MDR</TableHead>
              <TableHead>Ditanggung</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mdrDetail.length === 0 && (
              <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">Belum ada transaksi pada periode ini</TableCell></TableRow>
            )}
            {mdrDetail.map((m) => {
              const beban = m.beban;
              return (
                <TableRow key={`${m.channel}-${m.metode}`}>
                  <TableCell className="font-medium">{m.metode}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{m.channel}</TableCell>
                  <TableCell className="text-center">{Math.round(m.vol)}</TableCell>
                  <TableCell className="text-right">{rp(m.omzet)}</TableCell>
                  <TableCell className="text-right">{m.rate}%</TableCell>
                  <TableCell className="text-right text-destructive">{beban > 0 ? `−${rp(beban)}` : "—"}</TableCell>
                  <TableCell>
                    {m.rate === 0 ? <Badge variant="secondary">Tidak ada</Badge>
                      : m.ditanggung ? <Badge className="bg-amber-100 text-amber-800">Toko (subsidi)</Badge>
                      : <Badge variant="outline">Pelanggan</Badge>}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </DesktopOnly>

      <MobileList className="p-3">
        {mdrDetail.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Belum ada transaksi pada periode ini</p>}
        {mdrDetail.map((m) => {
          const beban = m.beban;
          return (
            <RecordCard key={`${m.channel}-${m.metode}`}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="font-semibold">{m.metode}</p>
                {m.rate === 0 ? <Badge variant="secondary">Tidak ada</Badge>
                  : m.ditanggung ? <Badge className="bg-amber-100 text-amber-800">Toko (subsidi)</Badge>
                  : <Badge variant="outline">Pelanggan</Badge>}
              </div>
              <Field label="Kanal" value={m.channel} />
              <Field label="Volume" value={Math.round(m.vol)} />
              <Field label="Omzet" value={rp(m.omzet)} />
              <Field label="Rate" value={`${m.rate}%`} />
              <Field label="Beban MDR" value={beban > 0 ? <span className="text-destructive">−{rp(beban)}</span> : "—"} />
            </RecordCard>
          );
        })}
      </MobileList>
      <p className="border-t bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground">
        Sesuai aturan QRIS, MDR tidak boleh dibebankan ke pelanggan — sehingga ditanggung toko (subsidi). Biaya ini mengurangi laba bersih.
      </p>
    </CardContent>
  </Card>
  );
}
