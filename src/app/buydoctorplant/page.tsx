import type { Metadata } from "next";
import { CheckoutForm } from "@/components/CheckoutForm";
import { PlantLandingPage } from "@/components/PlantLandingPage";
import { TrackingBoot } from "@/components/TrackingBoot";
import { getCatalogProduct, getPaymentConfig } from "@/lib/config";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const product = getCatalogProduct("plant");

export const metadata: Metadata = {
  title: product.arabicName,
  description:
    "دليل تفاعلي لرعاية وإنقاذ النباتات المنزلية المتوفرة في مصر — 77 نوع بصور حقيقية، وأدوات تشخيص وري وتربة، بـ 350 جنيه.",
  openGraph: {
    title: product.arabicName,
    description: "77 نبات من المشاتل المصرية، وأدوات عناية تفاعلية. شراء لمرة واحدة.",
    images: ["/images/plant/og.jpg"],
  },
};

export default async function PlantProductPage() {
  const cfg = await getPaymentConfig();
  const plant = getCatalogProduct("plant");
  return (
    <>
      <TrackingBoot
        productSlug={plant.slug}
        price={plant.price}
        contentName={plant.pixelName}
        trackFunnel
      />
      <PlantLandingPage whatsapp={cfg.whatsapp} price={plant.price} />
      <CheckoutForm
        instapayNumber={cfg.instapay.number}
        instapayName={cfg.instapay.name}
        walletNumber={cfg.wallet.number}
        walletName={cfg.wallet.name}
        price={plant.price}
        compareAtPrice={plant.compareAtPrice}
        productSlug={plant.slug}
        productTitle={plant.checkoutTitle}
        pixelName={plant.pixelName}
      />
    </>
  );
}
