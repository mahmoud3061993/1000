import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function redirectTo(path: string, req: NextRequest) {
  const url = new URL(path, req.nextUrl.origin);
  return NextResponse.redirect(url);
}

export async function GET(req: NextRequest) {
  const orderId =
    req.nextUrl.searchParams.get("merchantOrderId") ||
    req.nextUrl.searchParams.get("orderId") ||
    "";
  if (!orderId) {
    return redirectTo("/thank-you?error=missing_order", req);
  }
  return redirectTo(`/thank-you?order=${orderId}&pending=1`, req);
}
