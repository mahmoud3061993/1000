import type { Metadata } from "next";
import { CheckoutForm } from "@/components/CheckoutForm";
import { MldCheckoutLead, MldClosing, MldLandingPage } from "@/components/MldLandingPage";
import { TrackingBoot } from "@/components/TrackingBoot";
import { getCatalogProduct, getPaymentConfig } from "@/lib/config";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const product = getCatalogProduct("mld");

export const metadata: Metadata = {
  title: product.arabicName,
  description:
    "نزل كل الإعلانات من Meta Ads Library بدوسة واحدة. النسخة الاحترافية بتعرفك الـ winners قبل ما المنافس يشيلها. 499 جنيه — شراء مرة واحدة مدى الحياة.",
  openGraph: {
    title: product.arabicName,
    description: "عرض مدى الحياة: ادفع مرة واحدة قبل ما البيع يقف ويتحول لاشتراك شهري.",
  },
};

export default async function MldLandingRoute() {
  const cfg = await getPaymentConfig();
  const mld = getCatalogProduct("mld");
  return (
    <div className="mld-root">
      <TrackingBoot
        productSlug={mld.slug}
        price={mld.price}
        contentName={mld.pixelName}
        trackFunnel
      />
      <MldLandingPage whatsapp={cfg.whatsapp} price={mld.price} compareAtPrice={mld.compareAtPrice} />
      <section id="price" className="mld-checkout">
        <MldCheckoutLead price={mld.price} />
        <CheckoutForm
          instapayNumber={cfg.instapay.number}
          instapayName={cfg.instapay.name}
          walletNumber={cfg.wallet.number}
          walletName={cfg.wallet.name}
          price={mld.price}
          compareAtPrice={mld.compareAtPrice}
          productSlug={mld.slug}
          productTitle={mld.checkoutTitle}
          pixelName={mld.pixelName}
        />
      </section>
      <MldClosing price={mld.price} />
    </div>
  );
}
