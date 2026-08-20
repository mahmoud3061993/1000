import { NextRequest, NextResponse } from "next/server";
import { deliveryUrlForProduct, getCatalogProduct, getPaymentConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const cfg = await getPaymentConfig();
  const slug = req.nextUrl.searchParams.get("product");
  const product = getCatalogProduct(slug);
  return NextResponse.json({
    deliveryUrl: deliveryUrlForProduct(product.slug, cfg),
    price: product.price,
    currency: product.currency,
    productSlug: product.slug,
    productName: product.arabicName,
    thankYouCta: product.thankYouCta,
    thankYouBody: product.thankYouBody,
    pendingBody: product.pendingBody,
  });
}
