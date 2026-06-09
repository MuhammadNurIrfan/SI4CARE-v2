/* ───────────────────────────────────────────────────────────────
   Real photography (open-source, Unsplash).
   Swap any URL with your own product/lifestyle shots — drop files in
   /public/images and use "/images/your-file.jpg". The <Photo> component
   shows an on-brand gradient if a URL ever fails to load, so the layout
   never breaks.
──────────────────────────────────────────────────────────────── */

const U = (id: string, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const PHOTOS = {
  // Hero — caring at-home / clinical setting
  hero: U("1576091160399-112ba8d25d1d", 1100),
  // Quality / lifestyle band
  quality: U("1581595219315-a187dd40c322", 1200),
  // Articles
  article1: U("1559757148-5c350d0d3c56", 800),
  article2: U("1584308666744-24d5c474f2ae", 800),
  article3: U("1505751172876-fa1923c5c528", 800),
  // CTA band
  cta: U("1631815588090-d4bfec5b1ccb", 1400),
} as const;
