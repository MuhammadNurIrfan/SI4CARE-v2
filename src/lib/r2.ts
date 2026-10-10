import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

// Cloudflare R2 (S3-compatible).
// Semua env vars opsional — jika tidak dikonfigurasi, upload fallback ke public/uploads/ (hanya lokal;
// di production route upload menolak dengan 503, lihat api/upload/route.ts).
//
// Nama kanonik sama dengan .env.example: R2_ACCESS_KEY dan R2_SECRET_KEY. Nama gaya AWS
// (R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY) tetap diterima. Dulu HANYA nama AWS yang dibaca,
// sehingga `.env` yang diisi sesuai dokumentasi membuat r2Configured diam-diam false.
const R2_ENDPOINT   = process.env.R2_ENDPOINT || undefined; // https://<account-id>.r2.cloudflarestorage.com
const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY || process.env.R2_ACCESS_KEY_ID || undefined;
const R2_SECRET_KEY = process.env.R2_SECRET_KEY || process.env.R2_SECRET_ACCESS_KEY || undefined;
const R2_BUCKET     = process.env.R2_BUCKET_NAME || "si4care";
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || undefined)?.replace(/\/+$/, ""); // https://cdn.example.com atau https://pub-xxx.r2.dev

export const r2Configured =
  !!(R2_ENDPOINT && R2_ACCESS_KEY && R2_SECRET_KEY && R2_PUBLIC_URL);

let _client: S3Client | null = null;
function getClient(): S3Client {
  if (!_client) {
    _client = new S3Client({
      region: "auto",
      endpoint: R2_ENDPOINT!,
      credentials: {
        accessKeyId: R2_ACCESS_KEY!,
        secretAccessKey: R2_SECRET_KEY!,
      },
    });
  }
  return _client;
}

/**
 * Upload buffer ke R2 dan kembalikan public URL.
 * Key format: `products/{uuid}.{ext}` atau `categories/{uuid}.{ext}`
 */
export async function uploadToR2(
  key: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );
  return `${R2_PUBLIC_URL}/${key}`;
}

/** Hapus object dari R2 — panggil saat foto produk diganti. */
export async function deleteFromR2(key: string): Promise<void> {
  await getClient().send(
    new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }),
  );
}

/** Ekstrak key dari URL public R2 (untuk operasi delete). */
export function keyFromR2Url(url: string): string | null {
  if (!R2_PUBLIC_URL || !url.startsWith(R2_PUBLIC_URL)) return null;
  return url.slice(R2_PUBLIC_URL.length + 1); // hapus leading "/"
}
