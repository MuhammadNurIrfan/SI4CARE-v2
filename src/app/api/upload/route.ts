// Upload foto produk/kategori.
// Jika R2_ENDPOINT dikonfigurasi → upload ke Cloudflare R2.
// Fallback → simpan ke public/uploads/ (lokal, tidak berfungsi di Vercel).
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { randomUUID } from "crypto";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { uploadToR2, r2Configured } from "@/lib/r2";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// Folder prefix di bucket berdasarkan query param ?folder=products|categories|general
const FOLDER_WHITELIST = ["products", "categories", "general"] as const;
type Folder = (typeof FOLDER_WHITELIST)[number];

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !["admin", "super_admin"].includes(session.user.role as string)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const folder = (request.nextUrl.searchParams.get("folder") ?? "general") as Folder;
  if (!FOLDER_WHITELIST.includes(folder)) {
    return NextResponse.json({ error: "Folder tidak valid" }, { status: 400 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Tipe file tidak didukung (JPG/PNG/WebP/GIF)" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Ukuran file melebihi 5 MB" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const filename = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  if (r2Configured) {
    const key = `${folder}/${filename}`;
    const url = await uploadToR2(key, buffer, file.type);
    return NextResponse.json({ url, storage: "r2" });
  }

  // Fallback lokal
  const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, filename), buffer);
  return NextResponse.json({ url: `/uploads/${folder}/${filename}`, storage: "local" });
}
