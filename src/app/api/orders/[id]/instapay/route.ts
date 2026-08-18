import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { sendCapiEvent } from "@/lib/capi";
import { SITE_URL } from "@/lib/config";
import { getOrder, insertEvent, updateOrder } from "@/lib/db";
import { notifyOrder } from "@/lib/telegram";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const order = getOrder(params.id);
  if (!order) {
    return NextResponse.json({ ok: false, error: "الطلب غير موجود" }, { status: 404 });
  }
  if (order.payment_method !== "instapay") {
    return NextResponse.json({ ok: false, error: "الطلب ده مش إنستاباي" }, { status: 400 });
  }

  const form = await req.formData();
  const file = form.get("screenshot");
  if (!(file instanceof File) || file.size < 10_000) {
    return NextResponse.json(
      { ok: false, error: "ارفع سكرين شوت واضح لإيصال التحويل" },
      { status: 400 }
    );
  }
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ ok: false, error: "الصورة أكبر من 8 ميجا" }, { status: 400 });
  }

  const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
  if (file.type && !allowed.includes(file.type)) {
    return NextResponse.json({ ok: false, error: "الصيغة المسموحة: JPG أو PNG" }, { status: 400 });
  }

  const ext = file.type.includes("png") ? "png" : file.type.includes("webp") ? "webp" : "jpg";
  const filename = `${order.id}.${ext}`;
  const dir = path.join(process.cwd(), "data", "uploads");
  fs.mkdirSync(dir, { recursive: true });
  const filepath = path.join(dir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filepath, buffer);

  const updated = updateOrder(order.id, {
    status: "pending_review",
    instapay_screenshot: filepath,
  })!;

  const payEventId = crypto.randomUUID();
  insertEvent({
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
