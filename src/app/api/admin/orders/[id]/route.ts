import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { getOrder, updateOrder } from "@/lib/db";
import { fulfillPaidOrder } from "@/lib/fulfillment";
import { canConfirmInstapay, canRejectInstapay } from "@/lib/orders";
import { notifyTelegram } from "@/lib/telegram";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminRequest()) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const action = body.action === "reject" ? "reject" : "confirm";
  const order = await getOrder(params.id);
  if (!order) {
    return NextResponse.json({ ok: false, error: "الطلب غير موجود" }, { status: 404 });
  }

  if (action === "confirm") {
    if (!canConfirmInstapay(order) && order.status !== "awaiting_payment") {
      return NextResponse.json({ ok: false, error: "مفيش حاجة تتأكد في الطلب ده" }, { status: 400 });
    }
    const paid = await fulfillPaidOrder(order);
    return NextResponse.json({ ok: true, order: paid });
  }

  if (!canRejectInstapay(order)) {
    return NextResponse.json({ ok: false, error: "مفيش حاجة تترفض" }, { status: 400 });
  }
  const rejected = await updateOrder(order.id, { status: "rejected" });
  await notifyTelegram(
    `طلب مرفوض بعد مراجعة إنستاباي\nالاسم: ${order.name}\nالموبايل: ${order.phone}\nرقم الطلب: ${order.id}`
  );
  return NextResponse.json({ ok: true, order: rejected });
}
