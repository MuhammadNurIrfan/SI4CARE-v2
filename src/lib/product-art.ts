/**
 * Pilih kunci ilustrasi (`PRODUCT_ART` di landing/_components/illustrations.tsx)
 * dari nama produk. Produk dari DB tidak punya field `art`, jadi sebelumnya semua
 * jatuh ke ikon hati generik; ilustrasi per jenis alat adalah identitas visual proyek.
 */
const RULES: Array<[RegExp, string]> = [
  [/tensimeter|tekanan darah/i, "tensimeter"],
  [/nebulizer|nebuliser/i, "nebulizer"],
  [/kursi roda|wheelchair/i, "wheelchair"],
  [/oximeter|oksimeter/i, "oximeter"],
  [/termometer|thermometer/i, "thermometer"],
  [/masker|mask/i, "mask"],
  [/stetoskop|stethoscope/i, "stethoscope"],
];

export function artKeyFor(name: string): string {
  return RULES.find(([re]) => re.test(name))?.[1] ?? "heart";
}
