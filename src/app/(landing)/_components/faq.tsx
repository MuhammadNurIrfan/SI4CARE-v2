"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { fadeInUp, VIEWPORT } from "@/lib/animationVariants";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";

import { useContent } from "@/context/ContentContext";

export function FAQ() {
  const { content } = useContent();
  const faqs = content.faq;
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-[0.9fr_1.4fr]">
          <motion.div variants={fadeInUp} initial="hidden" whileInView="show" viewport={VIEWPORT}>
            <span className="mb-3 block text-sm font-semibold uppercase tracking-[0.18em] text-primary">FAQ</span>
            <h2 className="font-heading text-3xl font-bold leading-tight md:text-4xl">Pertanyaan yang sering diajukan</h2>
            <p className="mt-4 text-muted-foreground">
              Masih ragu? Temukan jawaban cepat di sini, atau hubungi tim kami langsung.
            </p>
            <Link href="/contact" className="mt-6 inline-block">
              <Button variant="outline" className="gap-2">
                <MessageCircle className="h-4 w-4" /> Hubungi Kami
              </Button>
            </Link>
          </motion.div>

          <motion.div variants={fadeInUp} initial="hidden" whileInView="show" viewport={VIEWPORT}>
            <Accordion className="w-full space-y-3">
              {faqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`item-${i}`}
                  className="rounded-2xl border bg-card px-5 data-[state=open]:border-primary/30 data-[state=open]:shadow-sm"
                >
                  <AccordionTrigger className="py-5 text-left text-base font-semibold hover:no-underline">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 text-[15px] leading-relaxed text-muted-foreground">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
