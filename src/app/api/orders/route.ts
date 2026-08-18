import { NextRequest, NextResponse } from "next/server";
import { sendCapiEvent } from "@/lib/capi";
import {
  INSTAPAY,
  PRODUCT,
  SITE_URL,
  kashierConfigured,
} from "@/lib/config";
import { createOrder, insertEvent, updateOrder } from "@/lib/db";
import { buildKashierHppUrl } from "@/lib/kashier";
import { clientIp, getOrCreateSessionId, userAgent } from "@/lib/request";
import { notifyOrder } from "@/lib/telegram";

export const runtime = "nodejs";

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  const phone = String(body.phone || "").trim();
  const method = body.method === "instapay" ? "instapay" : "kashier";
  const sessionId = body.sessionId || getOrCreateSessionId();
  const ip = clientIp(req);
  const ua = userAgent(req);

  if (!name || !validEmail(email) || !validPhone(phone)) {
    return NextResponse.json(
      { ok: false, error: "من فضلك أدخل الاسم والإيميل والموبايل بشكل صحيح" },
      { status: 400 }
    );
  }

  if (method === "kashier" && !kashierConfigured()) {
    return NextResponse.json(
      { ok: false, error: "بوابة كاشير غير مفعّلة حالياً. استخدم إنستاباي أو راجع إعدادات الأدمن." },
      { status: 400 }
    );
  }

  if (method === "instapay" && !INSTAPAY.number) {
    return NextResponse.json(
      { ok: false, error: "بيانات إنستاباي غير مضافة بعد." },
      { status: 400 }
    );
  }

  const orderId = `ord_${Date.now().toString(36)}_${crypto.randomUUID().slice(0, 8)}`;
  const leadEventId = body.leadEventId || crypto.randomUUID();
  const checkoutEventId = body.checkoutEventId || crypto.randomUUID();
  const purchaseEventId = crypto.randomUUID();

  const order = await createOrder({
    id: orderId,
    session_id: sessionId,
    name,
    email,
    phone,
    amount: PRODUCT.price,
    currency: PRODUCT.currency,
    payment_method: method,
    status: method === "kashier" ? "awaiting_payment" : "form_filled",
    kashier_order_id: method === "kashier" ? orderId : null,
    kashier_transaction_id: null,
    instapay_screenshot: null,
    purchase_event_id: purchaseEventId,
    fbp: body.fbp || null,
    fbc: body.fbc || null,
    ip,
    user_agent: ua,
    created_at: new Date().toISOString(),
  });

  await insertEvent({ id: leadEventId, session_id: sessionId, order_id: orderId, name: "Lead" });
  await insertEvent({
    id: checkoutEventId,
    session_id: sessionId,
    order_id: orderId,
    name: "InitiateCheckout",
  });

  const user = {
    email,
    phone,
    firstName: name,
    ip,
    userAgent: ua,
    fbp: body.fbp,
    fbc: body.fbc,
    externalId: sessionId,
  };

  await sendCapiEvent({
    eventName: "Lead",
    eventId: leadEventId,
    eventSourceUrl: `${SITE_URL}/#order-form`,
    user,
    customData: { orderId },
  });
  await sendCapiEvent({
    eventName: "InitiateCheckout",
    eventId: checkoutEventId,
    eventSourceUrl: `${SITE_URL}/#order-form`,
    user,
    customData: { orderId },
  });

  if (method === "kashier") {
    const payEventId = body.payEventId || crypto.randomUUID();
    await insertEvent({
      id: payEventId,
      session_id: sessionId,
      order_id: orderId,
      name: "AddPaymentInfo",
    });
    await sendCapiEvent({
      eventName: "AddPaymentInfo",
      eventId: payEventId,
      eventSourceUrl: `${SITE_URL}/#order-form`,
      user,
      customData: { orderId },
    });
    await notifyOrder("trying", order);
    const checkoutUrl = buildKashierHppUrl({
      orderId,
      amount: PRODUCT.price,
      currency: PRODUCT.currency,
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      allowedMethods: "card,wallet",
    });
    return NextResponse.json({
      ok: true,
      orderId,
      method,
      checkoutUrl,
      purchaseEventId,
    });
  }

  await updateOrder(orderId, { status: "form_filled" });
  return NextResponse.json({
    ok: true,
    orderId,
    method,
    instapay: INSTAPAY,
    amount: PRODUCT.price,
    purchaseEventId,
  });
}
