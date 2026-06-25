"use server";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/server-auth";

const MIDTRANS_API_BASE =
  process.env.MIDTRANS_IS_PRODUCTION === "true"
    ? "https://api.midtrans.com"
    : "https://api.sandbox.midtrans.com";

export type MidtransStatusResult =
  | {
      ok: true;
      transactionStatus: string; // settlement | pending | capture | deny | expire | cancel | ...
      fraudStatus: string | null;
      paymentType: string | null;
      grossAmount: string | null;
      settled: boolean; // true bila Midtrans menyatakan dana sudah masuk
      orderStatus: string; // status di DB kita saat ini
      mismatch: boolean; // Midtrans sudah settle TAPI order masih pending → perlu tindak lanjut
    }
  | { ok: false; error: string };

/**
 * READ-ONLY: tarik status otoritatif sebuah transaksi langsung dari Midtrans
 * (Core API). TIDAK mengubah stok/akuntansi — hanya melaporkan kebenaran dari
 * Midtrans agar admin bisa memverifikasi pesanan yang status-nya mencurigakan
 * (mis. pembayaran konter "sukses" tapi belum settle, atau webhook terlewat).
 *
 * Jika ditemukan mismatch (Midtrans settle tapi order masih pending), admin bisa
 * menindaklanjuti lewat transisi status manual yang sudah ada.
 */
export async function checkMidtransStatus(orderId: string): Promise<MidtransStatusResult> {
  await requireAdmin();

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return { ok: false, error: "Pesanan tidak ditemukan." };
  if (!order.midtransOrderId) {
    return {
      ok: false,
      error: "Pesanan ini tidak memiliki ID transaksi Midtrans (kemungkinan transaksi non-online).",
    };
  }

  try {
    // Midtrans Status API: GET /v2/{order_id}/status — auth Basic base64(serverKey:)
    const serverKey = process.env.MIDTRANS_SERVER_KEY ?? "";
    const auth = Buffer.from(`${serverKey}:`).toString("base64");
    const httpRes = await fetch(`${MIDTRANS_API_BASE}/v2/${order.midtransOrderId}/status`, {
      headers: { Authorization: `Basic ${auth}`, Accept: "application/json" },
      cache: "no-store",
    });

    const res = (await httpRes.json()) as {
      transaction_status?: string;
      fraud_status?: string;
      payment_type?: string;
      gross_amount?: string;
      status_code?: string;
      status_message?: string;
    };

    // 404 → transaksi belum tercatat di Midtrans (pembayaran belum dibuat/masuk)
    if (res.status_code === "404") {
      return { ok: false, error: "Transaksi belum tercatat di Midtrans — pelanggan kemungkinan belum memulai pembayaran." };
    }

    const transactionStatus = res.transaction_status ?? "unknown";
    const settled =
      transactionStatus === "settlement" ||
      (transactionStatus === "capture" && res.fraud_status === "accept");

    return {
      ok: true,
      transactionStatus,
      fraudStatus: res.fraud_status ?? null,
      paymentType: res.payment_type ?? null,
      grossAmount: res.gross_amount ?? null,
      settled,
      orderStatus: order.status,
      mismatch: settled && order.status === "pending_payment",
    };
  } catch (e) {
    // Midtrans 404 = transaksi belum tercatat (pelanggan belum menyelesaikan pembayaran).
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: `Gagal mengambil status dari Midtrans: ${msg}` };
  }
}
