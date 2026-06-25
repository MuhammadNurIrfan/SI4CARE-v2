"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Receipt, RefreshCw, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Ditampilkan saat status pesanan masih "pending" (pembayaran belum masuk/
 * tervalidasi Midtrans). Komponen ini:
 *  - Poll server tiap 8 dtk → halaman otomatis berubah jadi "Pesanan Berhasil"
 *    begitu webhook Midtrans menandai order "paid". Pelanggan tak perlu refresh.
 *  - Mengingatkan pelanggan menyimpan bukti pembayaran (receipt).
 */
export function PendingPayment() {
  const router = useRouter();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const poll = setInterval(() => router.refresh(), 8_000);
    const tick = setInterval(() => setElapsed((s) => s + 1), 1_000);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [router]);

  return (
    <div className="space-y-4 mb-6">
      {/* Status menunggu + indikator memeriksa pembayaran */}
      <Card className="border-amber-200 bg-amber-50/60">
        <CardContent className="p-5 flex items-start gap-4">
          <RefreshCw className="h-5 w-5 text-amber-600 shrink-0 mt-0.5 animate-spin" />
          <div>
            <p className="font-semibold text-amber-900">Memeriksa status pembayaran…</p>
            <p className="text-amber-800 text-sm mt-0.5">
              Halaman ini akan otomatis diperbarui begitu pembayaran Anda kami terima.
              Tidak perlu menutup atau me-refresh halaman.
            </p>
            <p className="text-amber-700/80 text-xs mt-1.5">
              Sudah menunggu {elapsed} detik. Pembayaran e-wallet/QRIS biasanya
              terkonfirmasi dalam beberapa detik; transfer bank (VA) bisa sampai
              beberapa menit.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* PENGINGAT: simpan bukti pembayaran */}
      <Card className="border-blue-200 bg-blue-50/60">
        <CardContent className="p-5 flex items-start gap-4">
          <div className="p-2 bg-blue-100 rounded-lg shrink-0">
            <Receipt className="h-5 w-5 text-blue-700" />
          </div>
          <div>
            <p className="font-semibold text-blue-900">Simpan bukti pembayaran Anda</p>
            <p className="text-blue-800 text-sm mt-0.5">
              Setelah membayar, <strong>screenshot atau simpan struk/receipt</strong> dari
              aplikasi pembayaran Anda. Bukti ini diperlukan jika status pesanan tidak
              berubah otomatis dan Anda perlu menghubungi admin untuk verifikasi manual.
            </p>
            <p className="text-blue-700 text-sm mt-2 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              Catat juga No. Pesanan di atas sebagai referensi.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
