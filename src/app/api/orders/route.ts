import { NextRequest, NextResponse } from "next/server";
import { sendCapiEvent } from "@/lib/capi";
import { PRODUCT, SITE_URL, getPaymentConfig, kashierConfigured } from "@/lib/config";
import { createOrder, getSessionAttribution, insertEvent, type PaymentMethod } from "@/lib/db";
import { mergeAttribution, parseAttribution } from "@/lib/attribution";
import { buildKashierHppUrl } from "@/lib/kashier";
import { clientIp, getOrCreateSessionId, userAgent } from "@/lib/request";
import { fileToDataUrl, validateScreenshotFile } from "@/lib/screenshot";
import { notifyOrder } from "@/lib/notify";

export const runtime = "nodejs";

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

type OrderPayload = {
  name: string;
  email: string;
  phone: string;
  method: PaymentMethod;
  sessionId: string;
  leadEventId: string;
  checkoutEventId: string;
  payEventId: string;
  fbp: string;
  fbc: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
  fbclid: string;
  screenshot: FormDataEntryValue | null;
};

async function readPayload(req: NextRequest): Promise<OrderPayload> {
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    return {
      name: String(form.get("name") || "").trim(),
      email: String(form.get("email") || "").trim(),
      phone: String(form.get("phone") || "").trim(),
      method: (String(form.get("method") || "") === "instapay" ? "instapay" : "kashier") as PaymentMethod,
      sessionId: String(form.get("sessionId") || ""),
      leadEventId: String(form.get("leadEventId") || ""),
      checkoutEventId: String(form.get("checkoutEventId") || ""),
      payEventId: String(form.get("payEventId") || ""),
      fbp: String(form.get("fbp") || ""),
      fbc: String(form.get("fbc") || ""),
      utm_source: String(form.get("utm_source") || ""),
      utm_medium: String(form.get("utm_medium") || ""),
      utm_campaign: String(form.get("utm_campaign") || ""),
      utm_content: String(form.get("utm_content") || ""),
      utm_term: String(form.get("utm_term") || ""),
      fbclid: String(form.get("fbclid") || ""),
      screenshot: form.get("screenshot"),
    };
  }

  const body = await req.json().catch(() => ({}));
  return {
    name: String(body.name || "").trim(),
    email: String(body.email || "").trim(),
    phone: String(body.phone || "").trim(),
    method: (body.method === "instapay" ? "instapay" : "kashier") as PaymentMethod,
    sessionId: String(body.sessionId || ""),
    leadEventId: String(body.leadEventId || ""),
    checkoutEventId: String(body.checkoutEventId || ""),
    payEventId: String(body.payEventId || ""),
    fbp: String(body.fbp || ""),
    fbc: String(body.fbc || ""),
    utm_source: String(body.utm_source || ""),
    utm_medium: String(body.utm_medium || ""),
    utm_campaign: String(body.utm_campaign || ""),
    utm_content: String(body.utm_content || ""),
    utm_term: String(body.utm_term || ""),
    fbclid: String(body.fbclid || ""),
    screenshot: null,
  };
}

export async function POST(req: NextRequest) {
  const payload = await readPayload(req);
  const name = payload.name;
  const email = payload.email;
  const phone = payload.phone;
  const method = payload.method;
  const sessionId = payload.sessionId || getOrCreateSessionId();
  const ip = clientIp(req);
  const ua = userAgent(req);
  const cfg = await getPaymentConfig();

  if (!name || !validEmail(email) || !validPhone(phone)) {
    return NextResponse.json(
      { ok: false, error: "من فضلك أدخل الاسم والإيميل والموبايل بشكل صحيح" },
      { status: 400 }
    );
  }

  if (method === "kashier" && !kashierConfigured(cfg.kashier)) {
    return NextResponse.json(
      { ok: false, error: "بوابة كاشير غير مفعّلة حالياً. حط مفاتيح كاشير من الأدمن أو استخدم إنستاباي." },
      { status: 400 }
    );
  }

  if (method === "instapay" && !cfg.instapay.number) {
    return NextResponse.json(
      { ok: false, error: "بيانات إنستاباي غير مضافة بعد. ضيف الرقم من لوحة الأدمن." },
      { status: 400 }
    );
  }

  let screenshotDataUrl: string | null = null;
  if (method === "instapay") {
    const screenshot = validateScreenshotFile(payload.screenshot);
    if (!screenshot.ok) {
      return NextResponse.json({ ok: false, error: screenshot.error }, { status: 400 });
    }
    screenshotDataUrl = await fileToDataUrl(screenshot.file);
  }

  const orderId = `ord_${Date.now().toString(36)}_${crypto.randomUUID().slice(0, 8)}`;
  const leadEventId = payload.leadEventId || crypto.randomUUID();
  const checkoutEventId = payload.checkoutEventId || crypto.randomUUID();
  const purchaseEventId = crypto.randomUUID();
  const fromVisit = await getSessionAttribution(sessionId);
  const attribution = mergeAttribution(parseAttribution(payload as unknown as Record<string, unknown>), fromVisit);

  const order = await createOrder({
    id: orderId,
    session_id: sessionId,
    name,
    email,
    phone,
    amount: PRODUCT.price,
    currency: PRODUCT.currency,
    payment_method: method,
    status: method === "kashier" ? "awaiting_payment" : "pending_review",
    kashier_order_id: method === "kashier" ? orderId : null,
    kashier_transaction_id: null,
    instapay_screenshot: screenshotDataUrl,
    purchase_event_id: purchaseEventId,
    fbp: payload.fbp || fromVisit?.fbp || null,
    fbc: payload.fbc || fromVisit?.fbc || null,
    utm_source: attribution.utm_source || null,
    utm_medium: attribution.utm_medium || null,
    utm_campaign: attribution.utm_campaign || null,
    utm_content: attribution.utm_content || null,
    utm_term: attribution.utm_term || null,
    fbclid: attribution.fbclid || null,
    ip,
    user_agent: ua,
    created_at: new Date().toISOString(),
  });

  await notifyOrder("lead", order);

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
    fbp: payload.fbp,
    fbc: payload.fbc,
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

  const payEventId = payload.payEventId || crypto.randomUUID();
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

  if (method === "kashier") {
    const checkoutUrl = buildKashierHppUrl({
      orderId,
      amount: PRODUCT.price,
      currency: PRODUCT.currency,
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      allowedMethods: "card,wallet",
      credentials: cfg.kashier,
    });
    return NextResponse.json({
      ok: true,
      orderId,
      method,
      checkoutUrl,
      purchaseEventId,
    });
  }

  await notifyOrder("pending", order);
  return NextResponse.json({
    ok: true,
    orderId,
    method,
    redirect: `/thank-you?order=${orderId}&pending=1`,
    amount: PRODUCT.price,
    purchaseEventId,
  });
}
