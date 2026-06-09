/* ───────────────────────────────────────────────────────────────
   Original, hand-built SVG illustrations of medical devices.
   No emoji, no AI placeholders — fully original line/fill art.
   Palette: ink #0F2340 · blue #2168AE · teal #1A9E8A
──────────────────────────────────────────────────────────────── */

type IconProps = { className?: string };

const INK = "#0F2340";
const BLUE = "#2168AE";
const BLUE_SOFT = "#D7E7F6";
const TEAL = "#1A9E8A";
const TEAL_SOFT = "#D4F0E8";

/* Tensimeter / blood-pressure monitor */
export function TensimeterArt({ className }: IconProps) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Tensimeter">
      <rect x="22" y="30" width="76" height="56" rx="12" fill="#fff" stroke={INK} strokeWidth="3" />
      <rect x="32" y="40" width="56" height="26" rx="6" fill={BLUE_SOFT} />
      <text x="60" y="58" textAnchor="middle" fontSize="15" fontWeight="700" fill={BLUE} fontFamily="system-ui">120</text>
      <rect x="34" y="72" width="22" height="6" rx="3" fill={INK} opacity="0.18" />
      <circle cx="84" cy="76" r="5" fill={TEAL} />
      <path d="M18 96c10-10 24-10 34 0s24 10 34 0 18-6 18-6" stroke={TEAL} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M30 30c0-6 4-10 10-10" stroke={INK} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/* Nebulizer */
export function NebulizerArt({ className }: IconProps) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Nebulizer">
      <rect x="30" y="60" width="48" height="38" rx="10" fill="#fff" stroke={INK} strokeWidth="3" />
      <circle cx="54" cy="79" r="9" fill={TEAL_SOFT} stroke={TEAL} strokeWidth="3" />
      <path d="M78 70h10a10 10 0 0 1 10 10v6" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      <path d="M60 60V46a8 8 0 0 1 8-8h6" stroke={BLUE} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M74 30c5 0 9 3 9 8s-4 6-9 6" fill={BLUE_SOFT} stroke={BLUE} strokeWidth="3" />
      <circle cx="92" cy="34" r="2.5" fill={TEAL} />
      <circle cx="100" cy="26" r="2" fill={TEAL} opacity="0.7" />
      <circle cx="98" cy="44" r="1.8" fill={TEAL} opacity="0.6" />
    </svg>
  );
}

/* Wheelchair */
export function WheelchairArt({ className }: IconProps) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Kursi roda">
      <circle cx="56" cy="84" r="22" fill="none" stroke={INK} strokeWidth="3" />
      <circle cx="56" cy="84" r="6" fill={BLUE} />
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i * Math.PI) / 4;
        return <line key={i} x1={56 + Math.cos(a) * 7} y1={84 + Math.sin(a) * 7} x2={56 + Math.cos(a) * 21} y2={84 + Math.sin(a) * 21} stroke={INK} strokeWidth="1.6" opacity="0.5" />;
      })}
      <circle cx="92" cy="96" r="8" fill={TEAL} />
      <path d="M40 40h10l8 30h26" stroke={BLUE} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="52" cy="30" r="7" fill={TEAL_SOFT} stroke={TEAL} strokeWidth="3" />
      <path d="M44 50h22" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

/* Pulse oximeter */
export function OximeterArt({ className }: IconProps) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Oximeter">
      <rect x="34" y="34" width="52" height="44" rx="10" fill="#fff" stroke={INK} strokeWidth="3" />
      <rect x="42" y="42" width="36" height="22" rx="4" fill={INK} />
      <path d="M46 54h6l3-7 4 12 3-6h8" stroke={TEAL} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M40 78c0 8 8 14 20 14s20-6 20-14" stroke={BLUE} strokeWidth="3" strokeLinecap="round" />
      <rect x="50" y="88" width="20" height="14" rx="5" fill={BLUE_SOFT} stroke={BLUE} strokeWidth="3" />
      <circle cx="60" cy="95" r="2.4" fill={BLUE} />
    </svg>
  );
}

/* Infrared thermometer */
export function ThermometerArt({ className }: IconProps) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Termometer">
      <path d="M44 26h26a8 8 0 0 1 8 8v30l10 8v18a6 6 0 0 1-6 6H50a6 6 0 0 1-6-6V34a8 8 0 0 1 0-8z" fill="#fff" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <rect x="52" y="40" width="20" height="14" rx="4" fill={BLUE_SOFT} />
      <text x="62" y="51" textAnchor="middle" fontSize="9" fontWeight="700" fill={BLUE} fontFamily="system-ui">36.6</text>
      <circle cx="62" cy="74" r="6" fill={TEAL} />
      <path d="M88 50h14M90 42l12-5M90 58l12 5" stroke={TEAL} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/* Surgical mask */
export function MaskArt({ className }: IconProps) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Masker medis">
      <path d="M34 44c0-4 4-7 8-6l30 6 30-6c4-1 8 2 8 6v26c0 14-12 24-26 24h-6c-14 0-26-10-26-24z" transform="translate(-28 0)" fill={BLUE_SOFT} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M22 54h60M22 64h60M22 74h60" stroke={BLUE} strokeWidth="2.4" opacity="0.55" />
      <path d="M16 42c-6 0-10 4-10 10s4 10 10 10" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      <path d="M82 42c8 0 12 4 12 10s-4 10-12 10" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      <circle cx="100" cy="42" r="3" fill={TEAL} />
    </svg>
  );
}

/* Stethoscope */
export function StethoscopeArt({ className }: IconProps) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Stetoskop">
      <path d="M40 26v18a18 18 0 0 0 36 0V26" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="40" cy="24" r="4" fill={BLUE} />
      <circle cx="76" cy="24" r="4" fill={BLUE} />
      <path d="M58 62v18a22 22 0 0 0 22 22h2" stroke={TEAL} strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="86" cy="100" r="12" fill={TEAL_SOFT} stroke={TEAL} strokeWidth="3.5" />
      <circle cx="86" cy="100" r="4" fill={TEAL} />
    </svg>
  );
}

/* Heart / care mark — for badges */
export function HeartPulseArt({ className }: IconProps) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Perawatan">
      <path d="M60 96S22 74 22 48a20 20 0 0 1 38-8 20 20 0 0 1 38 8c0 26-38 48-38 48z" fill={BLUE_SOFT} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M30 58h14l5-10 7 20 5-12h22" stroke={TEAL} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* Soft abstract blob — decorative background */
export function Blob({ className }: IconProps) {
  return (
    <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path fill="currentColor" d="M44.7-66.6C57.4-59 66.6-44.6 71.4-29.1C76.2-13.5 76.6 3.2 71.1 17.5C65.6 31.8 54.2 43.7 41 53.2C27.8 62.7 13.9 69.8-1.8 72.3C-17.5 74.8-35 72.7-48.7 64C-62.4 55.3-72.3 40-76.4 23.4C-80.5 6.8-78.8-11.2-71.9-26.4C-65-41.6-52.9-54-38.7-61.8C-24.5-69.6-12.3-72.8 2.4-76.1C17-79.4 32-74.2 44.7-66.6Z" transform="translate(100 100)" />
    </svg>
  );
}

export const PRODUCT_ART: Record<string, (p: IconProps) => React.JSX.Element> = {
  tensimeter: TensimeterArt,
  nebulizer: NebulizerArt,
  wheelchair: WheelchairArt,
  oximeter: OximeterArt,
  thermometer: ThermometerArt,
  mask: MaskArt,
  stethoscope: StethoscopeArt,
  heart: HeartPulseArt,
};
