import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(1, "Nama wajib diisi").max(100),
  description: z.string().max(500).optional(),
  imageUrl: z.string().max(500).optional().nullable(),
});
export type CategoryInput = z.infer<typeof categorySchema>;

export const productSchema = z.object({
  name: z.string().min(1, "Nama produk wajib diisi").max(255),
  brand: z.string().max(100).optional().nullable(),
  description: z.string().optional().nullable(),
  categoryId: z.string().length(36).optional().nullable(),
  imageUrl: z.string().max(500).optional().nullable(),
  isActive: z.boolean().default(true),
});
export type ProductInput = z.infer<typeof productSchema>;

export const variantSchema = z.object({
  productId: z.string().length(36),
  sku: z.string().min(1, "SKU wajib diisi").max(100),
  barcode: z.string().max(100).optional().nullable(),
  attributes: z.record(z.string(), z.string()).optional().nullable(),
  activePrice: z.number().positive("Harga harus > 0"),
  minStock: z.number().int().min(0).default(5),
  stockMode: z.enum(["fifo", "fefo"]).default("fifo"),
  isActive: z.boolean().default(true),
});
export type VariantInput = z.infer<typeof variantSchema>;

export const batchSchema = z.object({
  variantId: z.string().min(1),
  batchNumber: z.string().max(100).optional().nullable(),
  hpp: z.number().positive("HPP harus > 0"),
  quantity: z.number().int().positive("Qty harus > 0"),
  expiredDate: z.string().optional().nullable(),
  supplier: z.string().max(255).optional().nullable(),
});
export type BatchInput = z.infer<typeof batchSchema>;
