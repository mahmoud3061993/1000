import { NextRequest, NextResponse } from "next/server";
import { getOrder } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") || "";
  const order = await getOrder(id);
  if (!order) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  return NextResponse.json({
    ok: true,
    id: order.id,
    status: order.status,
    name: order.name,
    email: order.email,
    amount: order.amount,
    currency: order.currency,
    payment_method: order.payment_method,
    purchase_event_id: order.purchase_event_id,
  });
}
