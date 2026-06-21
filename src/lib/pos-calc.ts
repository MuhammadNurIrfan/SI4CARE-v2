/** Fungsi kalkulasi POS — murni, tanpa DB, dapat di-unit-test terpisah. */

export const MDR_RATES: Record<string, number> = {
  tunai: 0,
  transfer: 0,
  qris: 0.7,
  kartu_debit: 1.0,
  kartu_kredit: 2.5,
};

export const PLATFORM_COMMISSION: Record<string, number> = {
  tokopedia: 1.8,
  shopee: 2.2,
  lazada: 2.5,
  blibli: 3.0,
  custom: 0,
};

// ─── KasirTab ────────────────────────────────────────────────────────────────

export type PosCartItem = {
  id: string;       // variantId
  name: string;
  sku: string;
  price: number;
  hpp: number;
  qty: number;
  disc: number;
  discType: "pct" | "rp";
};

export type CartTotals = {
  gross: number;
  itemDiscTotal: number;
  afterItemDisc: number;
  cartDiscValue: number;
  totalDisc: number;
  dpp: number;
  ppn: number;
  total: number;
  mdrAmount: number;
  netAmount: number;
  totalHpp: number;
  grossMargin: number;
  marginPct: number;
};

export function calcLineDiscount(item: PosCartItem): number {
  const gross = item.price * item.qty;
  const d = item.discType === "pct" ? (gross * item.disc) / 100 : item.disc;
  return Math.min(Math.max(0, d), gross);
}

export function calcCartTotals(
  cart: PosCartItem[],
  cartDisc: number,
  cartDiscType: "pct" | "rp",
  paymentMethod: string,
): CartTotals {
  const gross = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const itemDiscTotal = cart.reduce((s, i) => s + calcLineDiscount(i), 0);
  const afterItemDisc = gross - itemDiscTotal;
  const cartDiscValue = Math.min(
    cartDiscType === "pct" ? (afterItemDisc * cartDisc) / 100 : cartDisc,
    afterItemDisc,
  );
  const totalDisc = itemDiscTotal + cartDiscValue;
  const dpp = afterItemDisc - cartDiscValue;
  const ppn = dpp * 0.12;
  const total = dpp + ppn;
  const mdrRate = MDR_RATES[paymentMethod] ?? 0;
  const mdrAmount = total * (mdrRate / 100);
  const netAmount = total - mdrAmount;
  const totalHpp = cart.reduce((s, i) => s + i.hpp * i.qty, 0);
  const grossMargin = netAmount - totalHpp;
  const marginPct = dpp > 0 ? (grossMargin / dpp) * 100 : 0;
  return { gross, itemDiscTotal, afterItemDisc, cartDiscValue, totalDisc, dpp, ppn, total, mdrAmount, netAmount, totalHpp, grossMargin, marginPct };
}

// ─── MarketplaceTab ──────────────────────────────────────────────────────────

export type MpItem = {
  id: string;       // variantId
  name: string;
  sku: string;
  qty: number;
  price: number;
  hpp: number;
};

export type CustomFee = {
  id: string;
  name: string;
  kind: "pct" | "rp";
  value: number;
  sign: "minus" | "plus";
};

export type CustomFeeRow = CustomFee & { nominal: number; signed: number };

export type MarketplaceCalc = {
  nilaiBarang: number;
  nilaiHpp: number;
  komisiNominal: number;
  mdrNominal: number;
  customFeeRows: CustomFeeRow[];
  customFeesTotal: number;
  totalPotonganPlatform: number;
  netOngkir: number;
  netDiterima: number;
  marginKotor: number;
  marginPct: number;
  isMinus: boolean;
  isTipis: boolean;
};

export function calcMarketplaceNet(
  items: MpItem[],
  params: {
    komisiPlatform: number;
    mdrPersen: number;
    biayaLayanan: number;
    ongkirDiterima: number;
    subsidiOngkir: number;
    ongkirKurir: number;
    voucherPlatform: number;
    customFees: CustomFee[];
  },
): MarketplaceCalc {
  const nilaiBarang = items.reduce((s, i) => s + i.price * i.qty, 0);
  const nilaiHpp = items.reduce((s, i) => s + i.hpp * i.qty, 0);
  const komisiNominal = nilaiBarang * (params.komisiPlatform / 100);
  const mdrNominal = nilaiBarang * (params.mdrPersen / 100);
  const customFeeRows: CustomFeeRow[] = params.customFees.map((f) => {
    const nominal = f.kind === "pct" ? (nilaiBarang * (f.value / 100)) : f.value;
    const signed = f.sign === "plus" ? nominal : -nominal;
    return { ...f, nominal, signed };
  });
  const customFeesTotal = customFeeRows.reduce((s, f) => s + f.signed, 0);
  const totalPotonganPlatform = komisiNominal + mdrNominal + params.biayaLayanan;
  const netOngkir = params.ongkirDiterima + params.subsidiOngkir - params.ongkirKurir;
  const netDiterima = nilaiBarang + params.voucherPlatform + netOngkir - totalPotonganPlatform + customFeesTotal;
  const marginKotor = netDiterima - nilaiHpp;
  const marginPct = nilaiBarang > 0 ? (marginKotor / nilaiBarang) * 100 : 0;
  return {
    nilaiBarang, nilaiHpp, komisiNominal, mdrNominal,
    customFeeRows, customFeesTotal, totalPotonganPlatform,
    netOngkir, netDiterima, marginKotor, marginPct,
    isMinus: marginKotor < 0,
    isTipis: marginKotor >= 0 && marginPct < 10,
  };
}
