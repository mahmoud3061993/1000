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
  const ip = clientIp(req);
  const ua = userAgent(req);

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
      referrer: body.referrer,
    });
  }

  await insertEvent({
    id: eventId,
    session_id: sessionId,
    order_id: body.orderId || null,
    name: eventName,
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
