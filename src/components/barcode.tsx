"use client";

/**
 * Barcode utilities — Code128-B (barcode garis) & QR code.
 * Code128 di-encode manual (tanpa dependensi), QR memakai `uqr` (zero-dep).
 */

import { useMemo } from "react";
import { encode as qrEncode } from "uqr";

/* ── Code128 pattern table (module widths, index 0–106) ── */
const C128 = [
  "212222","222122","222221","121223","121322","131222","122213","122312",
  "132212","221213","221312","231212","112232","122132","122231","113222",
  "123122","123221","223211","221132","221231","213212","223112","312131",
  "311222","321122","321221","312212","322112","322211","212123","212321",
  "232121","111323","131123","131321","112313","132113","132311","211313",
  "231113","231311","112133","112331","132131","113123","113321","133121",
  "313121","211331","231131","213113","213311","213131","311123","311321",
  "331121","312113","312311","332111","314111","221411","431111","111224",
  "111422","121124","121421","141122","141221","112214","112412","122114",
  "122411","142112","142211","241211","221114","413111","241112","134111",
  "111242","121142","121241","114212","124112","124211","411212","421112",
  "421211","212141","214121","412121","111143","111341","131141","114113",
  "114311","411113","411311","113141","114131","311141","411131","211412",
  "211214","211232","2331112",
];

/** Encode string → array of module widths (bar, space, bar, …). Null if invalid. */
export function code128Widths(value: string): number[] | null {
  if (!value) return null;
  const codes: number[] = [104]; // Start Code B
  for (const ch of value) {
    const c = ch.charCodeAt(0);
    if (c < 32 || c > 126) return null;
    codes.push(c - 32);
  }
  let checksum = codes[0];
  for (let i = 1; i < codes.length; i++) checksum += codes[i] * i;
  codes.push(checksum % 103, 106); // checksum + stop
  const widths: number[] = [];
  for (const code of codes) for (const d of C128[code]) widths.push(Number(d));
  return widths;
}

/* ── Komponen Barcode Garis (Code128-B) ── */
export function Barcode128({
  value,
  height = 52,
  moduleWidth = 2,
  showText = true,
  className,
}: {
  value: string;
  height?: number;
  moduleWidth?: number;
  showText?: boolean;
  className?: string;
}) {
  const widths = useMemo(() => code128Widths(value), [value]);
  if (!widths) {
    return <p className="text-xs text-muted-foreground">Barcode tidak valid (hanya karakter ASCII)</p>;
  }
  const totalModules = widths.reduce((s, w) => s + w, 0);
  const quiet = 10; // quiet zone (modules)
  const w = (totalModules + quiet * 2) * moduleWidth;
  const textH = showText ? 16 : 0;
  let x = quiet * moduleWidth;
  const bars: { x: number; w: number }[] = [];
  widths.forEach((mw, i) => {
    const bw = mw * moduleWidth;
    if (i % 2 === 0) bars.push({ x, w: bw });
    x += bw;
  });
  return (
    <svg
      viewBox={`0 0 ${w} ${height + textH}`}
      width={w}
      height={height + textH}
      className={className}
      role="img"
      aria-label={`Barcode ${value}`}
      style={{ maxWidth: "100%", height: "auto" }}
    >
      <rect width={w} height={height + textH} fill="white" />
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y={0} width={b.w} height={height} fill="black" />
      ))}
      {showText && (
        <text x={w / 2} y={height + 12} textAnchor="middle" fontSize="11" fontFamily="monospace" fill="black">
          {value}
        </text>
      )}
    </svg>
  );
}

/* ── Komponen QR Code ── */
export function QrSvg({
  value,
  size = 120,
  className,
}: {
  value: string;
  size?: number;
  className?: string;
}) {
  const qr = useMemo(() => {
    if (!value) return null;
    try {
      return qrEncode(value, { ecc: "M", border: 2 });
    } catch {
      return null;
    }
  }, [value]);
  if (!qr) return <p className="text-xs text-muted-foreground">QR tidak valid</p>;
  const n = qr.size;
  return (
    <svg
      viewBox={`0 0 ${n} ${n}`}
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`QR code ${value}`}
      shapeRendering="crispEdges"
    >
      <rect width={n} height={n} fill="white" />
      {qr.data.map((row, y) =>
        row.map((on, x) => (on ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="black" /> : null))
      )}
    </svg>
  );
}

/** Generate nilai barcode numerik 13 digit (EAN-13 style, prefix 899 = Indonesia). */
export function generateBarcodeValue(): string {
  const base = "899" + String(Math.floor(Math.random() * 1e9)).padStart(9, "0");
  // EAN-13 check digit
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(base[i]) * (i % 2 === 0 ? 1 : 3);
  return base + String((10 - (sum % 10)) % 10);
}

/** Unduh elemen SVG sebagai file .svg */
export function downloadSvg(svgEl: SVGSVGElement | null, filename: string) {
  if (!svgEl) return;
  const blob = new Blob([new XMLSerializer().serializeToString(svgEl)], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
