import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { getOrder, updateOrder, deleteOrder } from "@/lib/db";
import { sendPurchaseEmail } from "@/lib/email";
import { fulfillPaidOrder } from "@/lib/fulfillment";
import { canConfirmInstapay, canRejectInstapay } from "@/lib/orders";
import { notifyText } from "@/lib/notify";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminRequest()) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const action = body.action;
  const order = await getOrder(params.id);
  if (!order) {
    return NextResponse.json({ ok: false, error: "الطلب غير موجود" }, { status: 404 });
  }

  if (action === "delete") {
    await deleteOrder(order.id);
    return NextResponse.json({ ok: true, deleted: order.id });
  }

  if (action === "email") {
    if (order.status !== "paid") {
      return NextResponse.json(
        { ok: false, error: "الإيميل بيتبعت بعد تأكيد الدفع بس" },
        { status: 400 }
      );
    }
    const sent = await sendPurchaseEmail(order);
    if (!sent.ok) {
      return NextResponse.json(
        { ok: false, error: sent.error || "فشل إرسال الإيميل" },
        { status: 400 }
      );
    }
    return NextResponse.json({ ok: true, emailed: true });
  }

  if (action === "confirm") {
    if (!canConfirmInstapay(order) && order.status !== "awaiting_payment") {
      return NextResponse.json({ ok: false, error: "مفيش حاجة تتأكد في الطلب ده" }, { status: 400 });
    }
    const paid = await fulfillPaidOrder(order);
    return NextResponse.json({ ok: true, order: paid });
  }

  if (action === "reject") {
    if (!canRejectInstapay(order)) {
      return NextResponse.json({ ok: false, error: "مفيش حاجة تترفض" }, { status: 400 });
    }
    const rejected = await updateOrder(order.id, { status: "rejected" });
    await notifyText(
      `طلب مرفوض بعد مراجعة إنستاباي\nالاسم: ${order.name}\nالموبايل: ${order.phone}\nرقم الطلب: ${order.id}`,
      { title: "طلب إنستاباي مرفوض", priority: 4, tags: ["x"] }
    );
    return NextResponse.json({ ok: true, order: rejected });
  }

  return NextResponse.json({ ok: false, error: "إجراء غير معروف" }, { status: 400 });
}
