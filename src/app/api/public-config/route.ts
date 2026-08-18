import { NextResponse } from "next/server";
import { PRODUCT } from "@/lib/config";

export function GET() {
  return NextResponse.json({
    deliveryUrl: PRODUCT.deliveryUrl,
    price: PRODUCT.price,
    currency: PRODUCT.currency,
  });
}
