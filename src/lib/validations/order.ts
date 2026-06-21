import { z } from "zod";

export const createOrderSchema = z.object({
  addressId: z.string().min(1, "Pilih alamat pengiriman"),
  courier: z.string().min(1),
  courierService: z.string().min(1),
  shippingCost: z.number().min(0),
  voucherCode: z.string().optional().nullable(),
  items: z
    .array(
      z.object({
        variantId: z.string().min(1),
        productName: z.string().min(1),
        sku: z.string().min(1),
        quantity: z.number().int().positive(),
        unitPrice: z.number().positive(),
      }),
    )
    .min(1, "Keranjang kosong"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
