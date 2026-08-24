import type { Metadata } from "next";
import { ArabityLandingPage } from "@/components/ArabityLandingPage";
import { CheckoutForm } from "@/components/CheckoutForm";
import { TrackingBoot } from "@/components/TrackingBoot";
import { getCatalogProduct, getPaymentConfig, kashierConfigured } from "@/lib/config";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const product = getCatalogProduct("arabity");

export const metadata: Metadata = {
  title: product.arabicName,
  description:
    "نظام عربي لإدارة البنزين والصيانة والمصاريف — بدون حساب وبدون نت بعد التحميل. ويب وكمبيوتر وأندرويد.",
  openGraph: {
    title: product.arabicName,
    description: "كل حاجة تخص عربيتك في مكان واحد. شراء لمرة واحدة.",
  },
};

export default async function ArabityLandingRoute() {
  const cfg = await getPaymentConfig();
  const arabity = getCatalogProduct("arabity");
  return (
    <div className="arabity-root">
      <TrackingBoot
        productSlug={arabity.slug}
        price={arabity.price}
        contentName={arabity.pixelName}
        trackFunnel
      />
      <ArabityLandingPage
        whatsapp={cfg.whatsapp}
        price={arabity.price}
        compareAtPrice={arabity.compareAtPrice}
      />
      <section id="price" className="arabity-checkout">
        <CheckoutForm
          instapayNumber={cfg.instapay.number}
          instapayName={cfg.instapay.name}
          kashierReady={kashierConfigured(cfg.kashier)}
          price={arabity.price}
          compareAtPrice={arabity.compareAtPrice}
          productSlug={arabity.slug}
          productTitle={arabity.checkoutTitle}
          pixelName={arabity.pixelName}
        />
      </section>
    </div>
  );
}
