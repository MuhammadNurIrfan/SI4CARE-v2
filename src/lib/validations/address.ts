import { z } from "zod";

export const addressSchema = z.object({
  label: z.string().min(1, "Label wajib diisi").max(50),
  name: z.string().min(1, "Nama wajib diisi").max(255),
  phone: z.string().min(8, "Nomor telepon tidak valid").max(30),
  address: z.string().min(1, "Alamat wajib diisi"),
  city: z.string().min(1, "Kota/kecamatan wajib diisi").max(255),
});

export type AddressInput = z.infer<typeof addressSchema>;
