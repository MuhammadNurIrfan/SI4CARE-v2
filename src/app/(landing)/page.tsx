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
import { loadContent } from "@/lib/content-query";
import { pickFeaturedProducts } from "@/lib/shop-helpers";
import { getShopProducts } from "@/actions/products";
import { getPublishedArticles } from "@/actions/articles";

export default async function LandingPage() {
  // Produk & artikel gagal dimuat → bagian itu disembunyikan, bukan seluruh landing jadi error.
  const [content, products, articles] = await Promise.all([
    loadContent(),
    getShopProducts().catch(() => []),
    getPublishedArticles().catch(() => []),
  ]);
  const featured = pickFeaturedProducts(products, 8);
  const show = (key: string) => content.sections[key] !== false;

  return (
    <>
      {show("hero") && <Hero />}
      {show("social") && <SocialProof />}
      {show("benefits") && <Benefits />}
      {show("how") && <HowItWorks />}
      {show("products") && featured.length > 0 && <FeaturedProducts products={featured} />}
      {show("quality") && <QualityPromise />}
      {show("testimonials") && <Testimonials />}
      {show("articles") && articles.length > 0 && <Articles articles={articles.slice(0, 3)} />}
      {show("faq") && <FAQ />}
      {show("cta") && <CTA />}
    </>
  );
}
