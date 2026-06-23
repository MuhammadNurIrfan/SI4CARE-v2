import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

const KOMERCE_BASE = "https://merchant-api.komerce.id/api/v1";
const CACHE_TTL = 60 * 60 * 24 * 7; // 7 hari — data kota jarang berubah

export type DestinationResult = {
  id: string;
  label: string;      // "Bandung, Jawa Barat"
  city: string;
  province: string;
  postalCode?: string;
};

type KomerceDestination = {
  id?: string | number;
  city_name?: string;
  city?: string;
  province?: string;
  province_name?: string;
  postal_code?: string;
  type?: string;
};

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const cacheKey = `dest:v1:${q.toUpperCase()}`;
  const cached = await redis.get<DestinationResult[]>(cacheKey);
  if (cached) {
    return NextResponse.json({ results: cached, fromCache: true });
  }

  const apiKey = process.env.KOMERCE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ results: MAJOR_CITIES.filter((c) =>
      c.label.toLowerCase().includes(q.toLowerCase()),
    ).slice(0, 10), fromCache: false, fallback: true });
  }

  try {
    const resp = await fetch(
      `${KOMERCE_BASE}/destination?search=${encodeURIComponent(q)}`,
      {
        headers: { key: apiKey },
        next: { revalidate: 0 },
      },
    );

    if (resp.ok) {
      const json = (await resp.json()) as {
        meta?: { code?: number };
        code?: number;
        data?: KomerceDestination[];
      };
      const code = json.meta?.code ?? json.code;

      if (code === 200 && Array.isArray(json.data) && json.data.length > 0) {
        const results: DestinationResult[] = json.data.slice(0, 15).map((d) => {
          const city = d.city_name ?? d.city ?? "";
          const province = d.province_name ?? d.province ?? "";
          return {
            id: String(d.id ?? city),
            label: province ? `${city}, ${province}` : city,
            city,
            province,
            postalCode: d.postal_code,
          };
        });
        await redis.set(cacheKey, results, { ex: CACHE_TTL });
        return NextResponse.json({ results, fromCache: false });
      }
    }
  } catch {
    // Fallback ke daftar kota statis
  }

  const fallback = MAJOR_CITIES.filter((c) =>
    c.label.toLowerCase().includes(q.toLowerCase()),
  ).slice(0, 10);
  return NextResponse.json({ results: fallback, fromCache: false, fallback: true });
}

// Daftar kota besar — dipakai saat Komerce API tidak dapat diakses dari lokal
const MAJOR_CITIES: DestinationResult[] = [
  { id: "jkt-pst",  label: "Jakarta Pusat, DKI Jakarta",     city: "JAKARTA PUSAT",     province: "DKI JAKARTA"    },
  { id: "jkt-sel",  label: "Jakarta Selatan, DKI Jakarta",   city: "JAKARTA SELATAN",   province: "DKI JAKARTA"    },
  { id: "jkt-ut",   label: "Jakarta Utara, DKI Jakarta",     city: "JAKARTA UTARA",     province: "DKI JAKARTA"    },
  { id: "jkt-bar",  label: "Jakarta Barat, DKI Jakarta",     city: "JAKARTA BARAT",     province: "DKI JAKARTA"    },
  { id: "jkt-tim",  label: "Jakarta Timur, DKI Jakarta",     city: "JAKARTA TIMUR",     province: "DKI JAKARTA"    },
  { id: "bdg",      label: "Bandung, Jawa Barat",            city: "BANDUNG",           province: "JAWA BARAT"     },
  { id: "bdg-kab",  label: "Bandung, Jawa Barat (Kab)",      city: "BANDUNG",           province: "JAWA BARAT"     },
  { id: "sby",      label: "Surabaya, Jawa Timur",           city: "SURABAYA",          province: "JAWA TIMUR"     },
  { id: "mdn",      label: "Medan, Sumatera Utara",          city: "MEDAN",             province: "SUMATERA UTARA" },
  { id: "mks",      label: "Makassar, Sulawesi Selatan",     city: "MAKASSAR",          province: "SULAWESI SELATAN"},
  { id: "smg",      label: "Semarang, Jawa Tengah",          city: "SEMARANG",          province: "JAWA TENGAH"    },
  { id: "yk",       label: "Yogyakarta, DI Yogyakarta",      city: "YOGYAKARTA",        province: "DI YOGYAKARTA"  },
  { id: "dpk",      label: "Depok, Jawa Barat",              city: "DEPOK",             province: "JAWA BARAT"     },
  { id: "tgr",      label: "Tangerang, Banten",              city: "TANGERANG",         province: "BANTEN"         },
  { id: "tgr-sel",  label: "Tangerang Selatan, Banten",      city: "TANGERANG SELATAN", province: "BANTEN"         },
  { id: "bks",      label: "Bekasi, Jawa Barat",             city: "BEKASI",            province: "JAWA BARAT"     },
  { id: "sby-sel",  label: "Sidoarjo, Jawa Timur",           city: "SIDOARJO",          province: "JAWA TIMUR"     },
  { id: "mlg",      label: "Malang, Jawa Timur",             city: "MALANG",            province: "JAWA TIMUR"     },
  { id: "bpn",      label: "Balikpapan, Kalimantan Timur",   city: "BALIKPAPAN",        province: "KALIMANTAN TIMUR"},
  { id: "plg",      label: "Palembang, Sumatera Selatan",    city: "PALEMBANG",         province: "SUMATERA SELATAN"},
  { id: "pkn",      label: "Pekanbaru, Riau",                city: "PEKANBARU",         province: "RIAU"           },
  { id: "bks-kab",  label: "Bekasi, Jawa Barat (Kab)",       city: "BEKASI",            province: "JAWA BARAT"     },
  { id: "bogor",    label: "Bogor, Jawa Barat",              city: "BOGOR",             province: "JAWA BARAT"     },
  { id: "denpasar", label: "Denpasar, Bali",                 city: "DENPASAR",          province: "BALI"           },
  { id: "pontia",   label: "Pontianak, Kalimantan Barat",    city: "PONTIANAK",         province: "KALIMANTAN BARAT"},
  { id: "samarinda",label: "Samarinda, Kalimantan Timur",    city: "SAMARINDA",         province: "KALIMANTAN TIMUR"},
  { id: "solo",     label: "Surakarta, Jawa Tengah",         city: "SURAKARTA",         province: "JAWA TENGAH"    },
  { id: "serang",   label: "Serang, Banten",                 city: "SERANG",            province: "BANTEN"         },
  { id: "jambi",    label: "Jambi, Jambi",                   city: "JAMBI",             province: "JAMBI"          },
  { id: "mndo",     label: "Manado, Sulawesi Utara",         city: "MANADO",            province: "SULAWESI UTARA" },
  { id: "ambon",    label: "Ambon, Maluku",                  city: "AMBON",             province: "MALUKU"         },
  { id: "kupang",   label: "Kupang, NTT",                    city: "KUPANG",            province: "NUSA TENGGARA TIMUR"},
  { id: "mataram",  label: "Mataram, NTB",                   city: "MATARAM",           province: "NUSA TENGGARA BARAT"},
  { id: "jayapura", label: "Jayapura, Papua",                city: "JAYAPURA",          province: "PAPUA"          },
  { id: "banda-aceh",label:"Banda Aceh, Aceh",              city: "BANDA ACEH",        province: "ACEH"           },
];
