"use client";

/**
 * Kategori produk dengan foto — dikelola admin, dipakai di seluruh aplikasi.
 * Foto kategori otomatis menjadi gambar setiap produk dalam kategori tsb
 * (selama produk belum punya foto sendiri). Persist di localStorage (prototipe).
 */

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Kategori = {
  id: string;
  nama: string;
  deskripsi: string;
  /** Data-URL gambar hasil unggah manual ("" = belum ada foto) */
  image: string;
};

const SEED: Kategori[] = [
  { id: "k1", nama: "Alat Diagnostik", deskripsi: "Tensimeter, termometer, oximeter, stetoskop", image: "" },
  { id: "k2", nama: "Alat Terapi", deskripsi: "Nebulizer dan alat terapi pernapasan", image: "" },
  { id: "k3", nama: "Alat Bantu Jalan", deskripsi: "Kursi roda, tongkat, walker", image: "" },
  { id: "k4", nama: "APD", deskripsi: "Masker, sarung tangan, pelindung diri", image: "" },
  { id: "k5", nama: "Antiseptik", deskripsi: "Cairan antiseptik & disinfektan", image: "" },
  { id: "k6", nama: "Bahan Habis Pakai", deskripsi: "Kasa, plester, alkohol swab", image: "" },
];

const STORAGE_KEY = "si4care_categories";

type Ctx = {
  categories: Kategori[];
  addCategory: (k: Omit<Kategori, "id">) => void;
  updateCategory: (id: string, k: Partial<Omit<Kategori, "id">>) => void;
  removeCategory: (id: string) => void;
  /** Foto untuk kategori bernama `nama` ("" jika tidak ada) */
  getCategoryImage: (nama: string) => string;
};

const CategoryContext = createContext<Ctx | null>(null);

export function CategoryProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Kategori[]>(SEED);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCategories(JSON.parse(raw));
    } catch { /* abaikan */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    } catch { /* kuota localStorage penuh — abaikan di prototipe */ }
  }, [categories, hydrated]);

  const addCategory: Ctx["addCategory"] = (k) =>
    setCategories((prev) => [...prev, { ...k, id: `k${Date.now()}` }]);

  const updateCategory: Ctx["updateCategory"] = (id, k) =>
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...k } : c)));

  const removeCategory: Ctx["removeCategory"] = (id) =>
    setCategories((prev) => prev.filter((c) => c.id !== id));

  const getCategoryImage: Ctx["getCategoryImage"] = (nama) =>
    categories.find((c) => c.nama === nama)?.image ?? "";

  return (
    <CategoryContext.Provider value={{ categories, addCategory, updateCategory, removeCategory, getCategoryImage }}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategories() {
  const ctx = useContext(CategoryContext);
  if (!ctx) throw new Error("useCategories harus dipakai di dalam CategoryProvider");
  return ctx;
}
