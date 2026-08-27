import { CheckoutForm } from "@/components/CheckoutForm";
import { LandingPage } from "@/components/LandingPage";
import { TrackingBoot } from "@/components/TrackingBoot";
import { PRODUCT, getPaymentConfig } from "@/lib/config";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const cfg = await getPaymentConfig();
  return (
    <>
      <TrackingBoot
        productSlug={PRODUCT.slug}
        price={PRODUCT.price}
        contentName={PRODUCT.pixelName}
        trackFunnel
      />
      <LandingPage whatsapp={cfg.whatsapp} />
      <CheckoutForm
        instapayNumber={cfg.instapay.number}
        instapayName={cfg.instapay.name}
        walletNumber={cfg.wallet.number}
        walletName={cfg.wallet.name}
        price={PRODUCT.price}
        compareAtPrice={PRODUCT.compareAtPrice}
        productSlug={PRODUCT.slug}
        productTitle={PRODUCT.checkoutTitle}
        pixelName={PRODUCT.pixelName}
      />
    </>
  );
}
