import type { Metadata } from "next";
import { CheckoutForm } from "@/components/CheckoutForm";
import { MasarefCheckoutLead, MasarefClosing, MasarefLandingPage } from "@/components/MasarefLandingPage";
import { TrackingBoot } from "@/components/TrackingBoot";
import { getCatalogProduct, getPaymentConfig } from "@/lib/config";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const product = getCatalogProduct("masaref");

export const metadata: Metadata = {
  title: product.arabicName,
  description:
    "مرتبك بيخلص ومش عارف الفلوس بتروح فين؟ مصارف يكشفلك بتصرف فلوسك في إيه ويحطلك حد للصرف قبل ما فلوسك تخلص. 399 جنيه — دفع مرة واحدة.",
  openGraph: {
    title: product.arabicName,
    description: "سيستم السيطرة على المصروفات. حد يومي، تحذير بدري، وقرار قبل الشراء.",
  },
};

export default async function MasarefLandingRoute() {
  const cfg = await getPaymentConfig();
  const masaref = getCatalogProduct("masaref");
  return (
    <div className="masaref-root">
      <TrackingBoot
        productSlug={masaref.slug}
        price={masaref.price}
        contentName={masaref.pixelName}
        trackFunnel
      />
      <MasarefLandingPage whatsapp={cfg.whatsapp} price={masaref.price} />
      <section id="price" className="masaref-checkout">
        <MasarefCheckoutLead price={masaref.price} />
        <CheckoutForm
          instapayNumber={cfg.instapay.number}
          instapayName={cfg.instapay.name}
          walletNumber={cfg.wallet.number}
          walletName={cfg.wallet.name}
          price={masaref.price}
          compareAtPrice={0}
          productSlug={masaref.slug}
          productTitle={masaref.checkoutTitle}
          pixelName={masaref.pixelName}
        />
      </section>
      <MasarefClosing price={masaref.price} />
    </div>
  );
}
