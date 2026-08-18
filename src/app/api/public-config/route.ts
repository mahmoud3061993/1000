import { NextResponse } from "next/server";
import { PRODUCT, getPaymentConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const cfg = await getPaymentConfig();
  return NextResponse.json({
    deliveryUrl: cfg.deliveryUrl || PRODUCT.deliveryUrl,
    price: PRODUCT.price,
    currency: PRODUCT.currency,
  });
}
