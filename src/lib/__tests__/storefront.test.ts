import { describe, it, expect } from "vitest";
import { artKeyFor } from "../product-art";
import { pickFeaturedProducts, variantLabel } from "../shop-helpers";
import { DEFAULT_CONTENT, mergeWithDefaults } from "../content-defaults";
import type { ShopProduct } from "@/actions/products";

const product = (over: Partial<ShopProduct>): ShopProduct => ({
  id: "p1",
  variantId: "v1",
  sku: "SKU-1",
  name: "Produk",
  brand: null,
  price: 1000,
  category: "Umum",
  categoryId: null,
  imageUrl: null,
  categoryImageUrl: null,
  stock: 5,
  ...over,
});

describe("artKeyFor", () => {
  it.each([
    ["Tensimeter Digital Omron HEM-7120", "tensimeter"],
    ["Nebulizer Kompresor Omron NE-C28", "nebulizer"],
    ["Kursi Roda Lipat Standar Sella", "wheelchair"],
    ["Pulse Oximeter Fingertip Yuwell", "oximeter"],
    ["Termometer Tembak Infrared OneMed", "thermometer"],
    ["Masker N95 GEA Medical (isi 20)", "mask"],
    ["Stetoskop Dual Head GEA Medical", "stethoscope"],
  ])("%s → %s", (name, key) => {
    expect(artKeyFor(name)).toBe(key);
  });

  it("nama tak dikenal → ikon generik", () => {
    expect(artKeyFor("Plester Luka")).toBe("heart");
  });
});

describe("variantLabel", () => {
  it("menggabungkan nilai atribut", () => {
    expect(variantLabel({ warna: "Merah", ukuran: "L" }, "SKU-1")).toBe("Merah · L");
  });
  it("tanpa atribut → SKU", () => {
    expect(variantLabel(null, "SKU-1")).toBe("SKU-1");
    expect(variantLabel({}, "SKU-1")).toBe("SKU-1");
  });
  it("mengabaikan nilai kosong / spasi", () => {
    expect(variantLabel({ a: "  ", b: "" }, "SKU-9")).toBe("SKU-9");
  });
});

describe("pickFeaturedProducts", () => {
  it("hanya produk yang masih ada stok", () => {
    const out = pickFeaturedProducts([product({ id: "a", stock: 0 }), product({ id: "b", stock: 3 })]);
    expect(out.map((p) => p.id)).toEqual(["b"]);
  });

  it("satu kartu per produk walau punya banyak varian", () => {
    const out = pickFeaturedProducts([
      product({ id: "a", variantId: "a1" }),
      product({ id: "a", variantId: "a2" }),
      product({ id: "b", variantId: "b1" }),
    ]);
    expect(out.map((p) => p.variantId)).toEqual(["a1", "b1"]);
  });

  it("varian pertama habis tapi kedua ada → produk tetap ikut lewat varian yang ada stok", () => {
    const out = pickFeaturedProducts([
      product({ id: "a", variantId: "a1", stock: 0 }),
      product({ id: "a", variantId: "a2", stock: 4 }),
    ]);
    expect(out.map((p) => p.variantId)).toEqual(["a2"]);
  });

  it("dibatasi sesuai limit", () => {
    const many = Array.from({ length: 12 }, (_, i) => product({ id: `p${i}`, variantId: `v${i}` }));
    expect(pickFeaturedProducts(many, 8)).toHaveLength(8);
  });

  it("daftar kosong → kosong", () => {
    expect(pickFeaturedProducts([])).toEqual([]);
  });
});

describe("mergeWithDefaults", () => {
  it("tanpa data tersimpan → konten default", () => {
    expect(mergeWithDefaults(null)).toEqual(DEFAULT_CONTENT);
    expect(mergeWithDefaults(undefined)).toEqual(DEFAULT_CONTENT);
  });

  it("field hero yang diedit menimpa default, sisanya tetap", () => {
    const merged = mergeWithDefaults({ hero: { title: "Judul Baru" } as never });
    expect(merged.hero.title).toBe("Judul Baru");
    expect(merged.hero.subtitle).toBe(DEFAULT_CONTENT.hero.subtitle);
  });

  it("section baru yang belum ada di data lama tampil secara default", () => {
    // Data lama (sebelum section "articles" ada) tidak punya kuncinya.
    const merged = mergeWithDefaults({ sections: { hero: false } });
    expect(merged.sections.hero).toBe(false);
    expect(merged.sections.articles).toBe(true);
  });

  it("daftar testimoni kosong yang sengaja disimpan admin dihormati (bukan dikembalikan ke default)", () => {
    expect(mergeWithDefaults({ testimonials: [] }).testimonials).toEqual([]);
  });
});
