import type { NextConfig } from "next";

const IS_PROD = process.env.NODE_ENV === "production";

// Midtrans Snap URLs (sandbox + production)
const MIDTRANS_SNAP = "https://app.sandbox.midtrans.com https://app.midtrans.com";
const MIDTRANS_API  = "https://api.sandbox.midtrans.com https://api.midtrans.com";
const GOOGLE_FONTS  = "https://fonts.googleapis.com https://fonts.gstatic.com";
const UPSTASH       = "https://*.upstash.io";
const KOMERCE       = "https://merchant-api.komerce.id";

const securityHeaders = [
  // Cegah clickjacking — halaman tidak boleh di-embed di iframe domain lain
  { key: "X-Frame-Options", value: "DENY" },

  // Cegah MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },

  // Kontrol referrer info yang dikirim ke domain lain
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

  // Batasi fitur browser yang tidak digunakan
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(self), usb=()",
  },

  // HSTS: browser wajib pakai HTTPS selama 1 tahun (hanya aktif di production)
  ...(IS_PROD
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains; preload",
        },
      ]
    : []),

  // Content Security Policy
  // - script-src: self + Midtrans Snap (external payment widget) + 'unsafe-inline'
  //   (diperlukan Next.js RSC inline hydration scripts)
  // - style-src: self + unsafe-inline (Tailwind CSS-in-JS) + Google Fonts
  // - font-src: self + Google Fonts CDN
  // - img-src: self + data: (inline SVG/base64) + https (produk/avatar dari storage)
  // - connect-src: self + Midtrans API + Upstash Redis REST + Komerce shipping
  // - frame-src: Midtrans Snap popup iframe
  // - frame-ancestors: DENY (sama seperti X-Frame-Options tapi untuk CSP Level 2)
  // - object-src: none (block Flash/plugins)
  // - base-uri: self (cegah <base> tag injection)
  {
    key: "Content-Security-Policy",
    value: [
      `default-src 'self'`,
      `script-src 'self' 'unsafe-inline' ${MIDTRANS_SNAP}`,
      `style-src 'self' 'unsafe-inline' ${GOOGLE_FONTS}`,
      `font-src 'self' ${GOOGLE_FONTS}`,
      `img-src 'self' data: blob: https:`,
      `connect-src 'self' ${MIDTRANS_API} ${UPSTASH} ${KOMERCE}`,
      `frame-src 'self' ${MIDTRANS_SNAP}`,
      `frame-ancestors 'none'`,
      `object-src 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`,
    ]
      .join("; ")
      .replace(/\s+/g, " "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Terapkan ke semua route
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
