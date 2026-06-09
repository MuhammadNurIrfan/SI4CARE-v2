"use client";

import { motion } from "framer-motion";
import { fadeIn } from "@/lib/animationVariants";

const brands = [
  "OMRON", "Onemed", "ABN", "Littmann", "GEA Medical", "Rossmax",
  "Beurer", "Yuwell", "Riester", "Welch Allyn", "Hartmann", "Bard",
];

export function SocialProof() {
  return (
    <section className="border-y bg-card/60 py-9">
      <div className="container mx-auto px-4">
        <motion.p
          variants={fadeIn}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.8 }}
          className="mb-7 text-center text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground"
        >
          Merek terpercaya yang kami distribusikan
        </motion.p>

        <div className="mask-fade-x relative flex overflow-hidden">
          <div className="animate-marquee pause-on-hover flex shrink-0 items-center gap-12 pr-12">
            {[...brands, ...brands].map((b, i) => (
              <span
                key={i}
                className="font-heading whitespace-nowrap text-lg font-bold uppercase tracking-wide text-foreground/30 transition-colors hover:text-primary md:text-xl"
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
