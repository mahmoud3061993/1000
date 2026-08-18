import { CheckoutForm } from "@/components/CheckoutForm";
import { LandingPage } from "@/components/LandingPage";
import { TrackingBoot } from "@/components/TrackingBoot";
import { INSTAPAY, WHATSAPP_NUMBER, kashierConfigured } from "@/lib/config";

export default function HomePage() {
  return (
    <>
      <TrackingBoot />
      <LandingPage whatsapp={WHATSAPP_NUMBER} />
      <CheckoutForm
        instapayNumber={INSTAPAY.number}
        instapayName={INSTAPAY.name}
        kashierReady={kashierConfigured()}
      />
    </>
  );
}
