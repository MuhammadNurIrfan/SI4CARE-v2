import { cacheGet, cacheSet } from "@/lib/cache";

/**
 * Klien API RajaOngkir by Komerce.
 *
 * Host lama `merchant-api.komerce.id` sudah mati (NXDOMAIN) dan bentuk API-nya
 * berubah, bukan sekadar pindah host:
 *   - host  : rajaongkir.komerce.id
 *   - ongkir: POST /calculate/domestic-cost, body `application/x-www-form-urlencoded`
 *   - origin & destination adalah ID NUMERIK dari endpoint pencarian
 *     (bukan nama kota seperti sebelumnya), jadi nama kota dari alamat pelanggan
 *     harus di-resolve dulu ke ID.
 * Dokumentasi: https://rajaongkir.com/docs/shipping-cost/getting_started/about
 */

export const KOMERCE_BASE = "https://rajaongkir.komerce.id/api/v1";

const FETCH_TIMEOUT_MS = 8000;
const DEST_ID_TTL = 60 * 60 * 24 * 7; // 7 hari — data wilayah jarang berubah

/**
 * Memo di memori proses: lapis kedua di bawah cache Redis. Saat Redis mati atau
 * belum dikonfigurasi, tanpa ini setiap request mengulang 1–2 pencarian wilayah.
 * Berlaku per instance (serverless: selama instance masih hangat).
 */
const destIdMemo = new Map<string, number>();

export type ShippingOption = {
  courier: string;
  courierName: string;
  service: string;
  description: string;
  price: number;
  etd: string;
};

export type KomerceDestination = {
  id: number;
  label: string;
  province: string;
  city: string;
  district: string;
  subdistrict: string;
  zipCode: string;
};

type RawDestination = {
  id?: number;
  label?: string;
  province_name?: string;
  city_name?: string;
  district_name?: string;
  subdistrict_name?: string;
  zip_code?: string;
};

type RawCost = {
  name?: string;
  code?: string;
  service?: string;
  description?: string;
  cost?: number;
  etd?: string;
};

type Envelope<T> = { meta?: { code?: number; message?: string }; data?: T };

/** Nama pendek untuk tampilan checkout (API mengembalikan "Jalur Nugraha Ekakurir (JNE)"). */
const COURIER_LABEL: Record<string, string> = {
  jne: "JNE",
  jnt: "J&T",
  sicepat: "SiCepat",
  pos: "POS Indonesia",
  sap: "SAP",
};

/**
 * Layanan kargo/barang khusus yang bukan opsi ongkir e-commerce biasa. API
 * mengembalikan mis. "JTR>200" (trucking, Rp800.000 untuk paket 1 kg) dan
 * "PAKETPOS DANGEROUS GOODS" — tampil di checkout hanya akan membingungkan.
 */
const EXCLUDED_SERVICE = /[<>]|trucking|kargo|cargo|dangerous|valuable/i;

async function komerceFetch<T>(path: string, init: RequestInit = {}): Promise<Envelope<T>> {
  const key = process.env.KOMERCE_API_KEY;
  if (!key) throw new Error("KOMERCE_API_KEY belum diisi");

  const resp = await fetch(`${KOMERCE_BASE}${path}`, {
    ...init,
    headers: { key, ...(init.headers ?? {}) },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    cache: "no-store",
  });
  if (!resp.ok) throw new Error(`Komerce HTTP ${resp.status}`);

  const json = (await resp.json()) as Envelope<T>;
  if (json.meta?.code !== 200) {
    throw new Error(`Komerce code ${json.meta?.code}: ${json.meta?.message ?? "tanpa pesan"}`);
  }
  return json;
}

/** Cari wilayah tujuan (kelurahan/kecamatan/kota) berdasarkan nama atau kode pos. */
export async function searchDestinations(query: string, limit = 10): Promise<KomerceDestination[]> {
  const params = new URLSearchParams({ search: query, limit: String(limit), offset: "0" });
  const json = await komerceFetch<RawDestination[]>(`/destination/domestic-destination?${params}`);
  return (json.data ?? [])
    .filter((d): d is RawDestination & { id: number } => typeof d.id === "number")
    .map((d) => ({
      id: d.id,
      label: d.label ?? "",
      province: d.province_name ?? "",
      city: d.city_name ?? "",
      district: d.district_name ?? "",
      subdistrict: d.subdistrict_name ?? "",
      zipCode: d.zip_code ?? "",
    }));
}

/**
 * Nama kota / kode pos → ID Komerce. Angka murni diperlakukan sebagai kode pos
 * (bukan ID): ID Komerce bisa 5 digit juga, jadi keduanya tak bisa dibedakan.
 * Hasil dicache; kegagalan (API mati, kota tak ditemukan) mengembalikan null
 * agar pemanggil bisa jatuh ke tabel ongkir cadangan.
 */
export async function resolveDestinationId(query: string): Promise<number | null> {
  const q = query.trim().toUpperCase();
  if (!q) return null;

  const memo = destIdMemo.get(q);
  if (memo !== undefined) return memo;

  const cacheKey = `komerce:dest:v1:${q}`;
  const cached = await cacheGet<number>(cacheKey);
  if (typeof cached === "number") {
    destIdMemo.set(q, cached);
    return cached;
  }

  try {
    const found = await searchDestinations(q, 10);
    if (found.length === 0) return null;
    // Pencarian "BANDUNG" mengembalikan Kota & Kabupaten bercampur — utamakan nama kota yang persis sama.
    const best = found.find((d) => d.city === q) ?? found[0];
    destIdMemo.set(q, best.id);
    await cacheSet(cacheKey, best.id, DEST_ID_TTL);
    return best.id;
  } catch (err) {
    console.warn(`[komerce] gagal resolve tujuan "${q}":`, err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * ID asal toko. `KOMERCE_STORE_ORIGIN_ID` (angka) diutamakan karena pasti;
 * kalau kosong, `KOMERCE_STORE_ORIGIN` (nama kota / kode pos) di-resolve —
 * hasilnya kelurahan pertama di kota itu, jadi kurang presisi.
 */
export async function getOriginId(): Promise<number | null> {
  const explicit = process.env.KOMERCE_STORE_ORIGIN_ID?.trim();
  if (explicit && /^\d+$/.test(explicit)) return Number(explicit);
  return resolveDestinationId(process.env.KOMERCE_STORE_ORIGIN?.trim() || "JAKARTA SELATAN");
}

/** "3 day" → "3 hari", "7-14 day" → "7-14 hari". */
function formatEtd(etd: string | undefined): string {
  if (!etd) return "-";
  if (/^0\s*days?$/i.test(etd.trim())) return "Hari ini";
  return etd.replace(/\bdays?\b/i, "hari");
}

export async function calculateCost(
  originId: number,
  destinationId: number,
  weightGrams: number,
  courier: string,
): Promise<ShippingOption[]> {
  const body = new URLSearchParams({
    origin: String(originId),
    destination: String(destinationId),
    weight: String(Math.round(weightGrams)),
    courier,
  });

  const json = await komerceFetch<RawCost[]>("/calculate/domestic-cost", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  return (json.data ?? [])
    .filter((r) => typeof r.cost === "number" && r.cost > 0)
    .filter((r) => !EXCLUDED_SERVICE.test(`${r.service ?? ""} ${r.description ?? ""}`))
    .map((r) => ({
      courier,
      courierName: COURIER_LABEL[courier] ?? (r.code ?? courier).toUpperCase(),
      service: r.service ?? "-",
      // Beberapa layanan (POS) mengisi `description` dengan kode angka ("240") — pakai nama layanan.
      description: !r.description || /^\d+$/.test(r.description) ? (r.service ?? "-") : r.description,
      price: r.cost as number,
      etd: formatEtd(r.etd),
    }));
}
