import type { Metadata } from "next";
import { ArabityCheckoutLead, ArabityClosing, ArabityLandingPage } from "@/components/ArabityLandingPage";
import { CheckoutForm } from "@/components/CheckoutForm";
import { TrackingBoot } from "@/components/TrackingBoot";
import { getCatalogProduct, getPaymentConfig, kashierConfigured } from "@/lib/config";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const product = getCatalogProduct("arabity");

export const metadata: Metadata = {
  title: product.arabicName,
  description:
    "سيستم عربيتي يخليك تعرف عربيتك بتكلفك كام، إيه اللي اتعمل فيها، وإيه اللي قرب ميعاده. 400 جنيه — دفع مرة واحدة.",
  openGraph: {
    title: product.arabicName,
    description: "اعرف عربيتك بتكلفك كام قبل ما المصاريف تفاجئك. دفع مرة واحدة.",
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
      />
      <section id="price" className="arabity-checkout">
        <ArabityCheckoutLead price={arabity.price} />
        <CheckoutForm
          instapayNumber={cfg.instapay.number}
          instapayName={cfg.instapay.name}
          kashierReady={kashierConfigured(cfg.kashier)}
          price={arabity.price}
          compareAtPrice={0}
          productSlug={arabity.slug}
          productTitle={arabity.checkoutTitle}
          pixelName={arabity.pixelName}
        />
      </section>
      <ArabityClosing price={arabity.price} />
    </div>
  );
}
