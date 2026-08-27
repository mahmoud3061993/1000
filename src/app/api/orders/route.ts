import { NextRequest, NextResponse } from "next/server";
import { sendCapiEvent } from "@/lib/capi";
import { SITE_URL, getCatalogProduct, getPaymentConfig } from "@/lib/config";
import { createOrder, getSessionAdPath, getSessionAttribution, hasSessionEvent, insertEvent } from "@/lib/db";
import { mergeAdPaths, mergeAttribution, parseAdPath, parseAttribution, serializeAdPath } from "@/lib/attribution";
import { parseManualPaymentMethod } from "@/lib/orders";
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
  method: ReturnType<typeof parseManualPaymentMethod>;
  productSlug: string;
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
  adPath: string;
  checkoutAlready: boolean;
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
      method: parseManualPaymentMethod(form.get("method")),
      productSlug: String(form.get("productSlug") || "1000"),
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
      adPath: String(form.get("adPath") || ""),
      checkoutAlready: String(form.get("checkoutAlready") || "") === "true",
      screenshot: form.get("screenshot"),
    };
  }

  const body = await req.json().catch(() => ({}));
  return {
    name: String(body.name || "").trim(),
    email: String(body.email || "").trim(),
    phone: String(body.phone || "").trim(),
    method: parseManualPaymentMethod(body.method),
    productSlug: String(body.productSlug || "1000"),
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
    adPath: typeof body.adPath === "string" ? body.adPath : JSON.stringify(body.adPath || []),
    checkoutAlready: body.checkoutAlready === true || body.checkoutAlready === "true",
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
  const product = getCatalogProduct(payload.productSlug);
  const eventSourceUrl = `${SITE_URL}${product.path}`;

  if (!name || !validEmail(email) || !validPhone(phone)) {
    return NextResponse.json(
      { ok: false, error: "من فضلك أدخل الاسم والإيميل والموبايل بشكل صحيح" },
      { status: 400 }
    );
  }

  if (!method) {
    return NextResponse.json(
      { ok: false, error: "اختار إنستاباي أو محفظة كاش وارفع سكرين التحويل" },
      { status: 400 }
    );
  }

  if (method === "instapay" && !cfg.instapay.number) {
    return NextResponse.json(
      { ok: false, error: "بيانات إنستاباي غير مضافة بعد. ضيف الرقم من لوحة الأدمن." },
      { status: 400 }
    );
  }

  if (method === "wallet" && !cfg.wallet.number) {
    return NextResponse.json(
      { ok: false, error: "بيانات محفظة كاش غير مضافة بعد. ضيف الرقم من لوحة الأدمن." },
      { status: 400 }
    );
  }

  const screenshot = validateScreenshotFile(payload.screenshot);
  if (!screenshot.ok) {
    return NextResponse.json({ ok: false, error: screenshot.error }, { status: 400 });
  }
  const screenshotDataUrl = await fileToDataUrl(screenshot.file);

  const orderId = `ord_${Date.now().toString(36)}_${crypto.randomUUID().slice(0, 8)}`;
  const leadEventId = payload.leadEventId || crypto.randomUUID();
  const checkoutEventId = payload.checkoutEventId || crypto.randomUUID();
  const purchaseEventId = crypto.randomUUID();
  const fromVisit = await getSessionAttribution(sessionId);
  const visitPath = await getSessionAdPath(sessionId);
  const attribution = mergeAttribution(parseAttribution(payload as unknown as Record<string, unknown>), fromVisit);
  const adPath = mergeAdPaths(visitPath, parseAdPath(payload.adPath));
  const originalFbc = payload.fbc || fromVisit?.fbc || null;

  const order = await createOrder({
    id: orderId,
    session_id: sessionId,
    name,
    email,
    phone,
    amount: product.price,
    currency: product.currency,
    product_slug: product.slug,
    payment_method: method,
    status: "pending_review",
    kashier_order_id: null,
    kashier_transaction_id: null,
    instapay_screenshot: screenshotDataUrl,
    purchase_event_id: purchaseEventId,
    fbp: payload.fbp || fromVisit?.fbp || null,
    fbc: originalFbc,
    utm_source: attribution.utm_source || null,
    utm_medium: attribution.utm_medium || null,
    utm_campaign: attribution.utm_campaign || null,
    utm_content: attribution.utm_content || null,
    utm_term: attribution.utm_term || null,
    fbclid: attribution.fbclid || null,
    ad_path: serializeAdPath(adPath) || null,
    ip,
    user_agent: ua,
    created_at: new Date().toISOString(),
  });

  await notifyOrder("lead", order);

  await insertEvent({ id: leadEventId, session_id: sessionId, order_id: orderId, name: "Lead", product_slug: product.slug });
  const user = {
    email,
    phone,
    firstName: name,
    ip,
    userAgent: ua,
    fbp: payload.fbp || fromVisit?.fbp || "",
    fbc: originalFbc || "",
    externalId: sessionId,
  };

  await sendCapiEvent({
    eventName: "Lead",
    eventId: leadEventId,
    eventSourceUrl,
    user,
    customData: { orderId, contentName: product.pixelName, contentIds: [product.slug], value: product.price, currency: product.currency },
  });

  const checkoutAlready =
    payload.checkoutAlready || (await hasSessionEvent(sessionId, "InitiateCheckout"));
  if (!checkoutAlready) {
    await insertEvent({
      id: checkoutEventId,
      session_id: sessionId,
      order_id: orderId,
      name: "InitiateCheckout",
      product_slug: product.slug,
    });
    await sendCapiEvent({
      eventName: "InitiateCheckout",
      eventId: checkoutEventId,
      eventSourceUrl,
      user,
      customData: { orderId, contentName: product.pixelName, contentIds: [product.slug], value: product.price, currency: product.currency },
    });
  }

  const payEventId = payload.payEventId || crypto.randomUUID();
  await insertEvent({
    id: payEventId,
    session_id: sessionId,
    order_id: orderId,
    name: "AddPaymentInfo",
    product_slug: product.slug,
  });
  await sendCapiEvent({
    eventName: "AddPaymentInfo",
    eventId: payEventId,
    eventSourceUrl,
    user,
    customData: { orderId, contentName: product.pixelName, contentIds: [product.slug], value: product.price, currency: product.currency },
  });

  await notifyOrder("pending", order);
  return NextResponse.json({
    ok: true,
    orderId,
    method,
    redirect: `/thank-you?order=${orderId}&pending=1`,
    amount: product.price,
    purchaseEventId,
  });
}
