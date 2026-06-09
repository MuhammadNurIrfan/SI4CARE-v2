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

export default function LandingPage() {
  return (
    <>
      <Hero />
      <SocialProof />
      <Benefits />
      <HowItWorks />
      <FeaturedProducts />
      <QualityPromise />
      <Testimonials />
      <Articles />
      <FAQ />
      <CTA />
    </>
  );
}
