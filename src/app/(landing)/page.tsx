"use client";

import { Hero } from "./_components/hero";
import { SocialProof } from "./_components/social-proof";
import { Benefits } from "./_components/benefits";
import { HowItWorks } from "./_components/how-it-works";
import { FeaturedProducts } from "./_components/featured-products";
import { QualityPromise } from "./_components/quality-promise";
import { Testimonials } from "./_components/testimonials";
import { Articles } from "./_components/articles";
import { FAQ } from "./_components/faq";
import { CTA } from "./_components/cta";
import { useContent } from "@/context/ContentContext";

export default function LandingPage() {
  const { content } = useContent();
  const show = (key: string) => content.sections[key] !== false;

  return (
    <>
      {show("hero") && <Hero />}
      {show("social") && <SocialProof />}
      {show("benefits") && <Benefits />}
      {show("how") && <HowItWorks />}
      {show("products") && <FeaturedProducts />}
      {show("quality") && <QualityPromise />}
      {show("testimonials") && <Testimonials />}
      {show("articles") && <Articles />}
      {show("faq") && <FAQ />}
      {show("cta") && <CTA />}
    </>
  );
}
