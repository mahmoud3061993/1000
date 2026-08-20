import { NextRequest, NextResponse } from "next/server";
import { sendCapiEvent } from "@/lib/capi";
import { SITE_URL } from "@/lib/config";
import { insertEvent, insertVisit } from "@/lib/db";
import { clientIp, getOrCreateSessionId, userAgent } from "@/lib/request";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const sessionId = body.sessionId || getOrCreateSessionId();
  const eventName = body.eventName || "PageView";
  const eventId = body.eventId || crypto.randomUUID();
  const productSlug = body.productSlug === "plant" ? "plant" : "1000";
  const ip = clientIp(req);
  const ua = userAgent(req);
  const funnelOnly = eventName.startsWith("Scroll") || eventName === "CheckoutView";

  if (eventName === "PageView") {
    await insertVisit({
      id: crypto.randomUUID(),
      session_id: sessionId,
      ip,
      user_agent: ua,
      fbp: body.fbp,
      fbc: body.fbc,
      utm_source: body.utm_source,
      utm_medium: body.utm_medium,
      utm_campaign: body.utm_campaign,
      utm_content: body.utm_content,
      utm_term: body.utm_term,
      fbclid: body.fbclid,
      referrer: body.referrer,
      product_slug: productSlug,
    });
  }

  await insertEvent({
    id: eventId,
    session_id: sessionId,
    order_id: body.orderId || null,
    name: eventName,
    product_slug: productSlug,
  });

  if (eventName === "Purchase") {
    const skipped = NextResponse.json({
      ok: true,
      eventId,
      sessionId,
      skipped: "purchase_is_server_only",
    });
    skipped.cookies.set("sid", sessionId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 90,
    });
    return skipped;
  }

  if (funnelOnly) {
    const res = NextResponse.json({ ok: true, eventId, sessionId });
    res.cookies.set("sid", sessionId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 90,
    });
    return res;
  }

  await sendCapiEvent({
    eventName,
    eventId,
    eventSourceUrl: body.eventSourceUrl || `${SITE_URL}/`,
    user: {
      email: body.email,
      phone: body.phone,
      firstName: body.name,
      ip,
      userAgent: ua,
      fbp: body.fbp,
      fbc: body.fbc,
      externalId: sessionId,
    },
    customData:
      eventName === "PageView"
        ? undefined
        : {
            value: body.value,
            currency: body.currency,
            orderId: body.orderId,
            contentName: body.productSlug === "plant" ? "Plant Care Guide" : undefined,
            contentIds: [productSlug],
          },
  });

  const res = NextResponse.json({ ok: true, eventId, sessionId });
  res.cookies.set("sid", sessionId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
  return res;
}
