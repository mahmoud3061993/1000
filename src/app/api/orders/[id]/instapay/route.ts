import { NextRequest, NextResponse } from "next/server";
import { sendCapiEvent } from "@/lib/capi";
import { SITE_URL } from "@/lib/config";
import { getOrder, insertEvent, updateOrder } from "@/lib/db";
import { fileToDataUrl, validateScreenshotFile } from "@/lib/screenshot";
import { notifyOrder } from "@/lib/notify";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const order = await getOrder(params.id);
  if (!order) {
    return NextResponse.json({ ok: false, error: "الطلب غير موجود" }, { status: 404 });
  }
  if (order.payment_method !== "instapay") {
    return NextResponse.json({ ok: false, error: "الطلب ده مش إنستاباي" }, { status: 400 });
  }

  const form = await req.formData();
  const screenshot = validateScreenshotFile(form.get("screenshot"));
  if (!screenshot.ok) {
    return NextResponse.json({ ok: false, error: screenshot.error }, { status: 400 });
  }

  const dataUrl = await fileToDataUrl(screenshot.file);
  const updated = (await updateOrder(order.id, {
    status: "pending_review",
    instapay_screenshot: dataUrl,
  }))!;

  const payEventId = crypto.randomUUID();
  await insertEvent({
    id: payEventId,
    session_id: order.session_id,
    order_id: order.id,
    name: "AddPaymentInfo",
  });
  await sendCapiEvent({
    eventName: "AddPaymentInfo",
    eventId: payEventId,
    eventSourceUrl: `${SITE_URL}/#order-form`,
    user: {
      email: order.email,
      phone: order.phone,
      firstName: order.name,
      ip: order.ip || "",
      userAgent: order.user_agent || "",
      fbp: order.fbp || "",
      fbc: order.fbc || "",
      externalId: order.session_id,
    },
    customData: { orderId: order.id },
  });

  await notifyOrder("pending", updated);

  return NextResponse.json({
    ok: true,
    orderId: order.id,
    redirect: `/thank-you?order=${order.id}&pending=1`,
  });
}
