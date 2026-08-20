import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { getPaymentConfig, kashierConfigured, emailConfigured } from "@/lib/config";
import { setSettings, usesRemoteDb } from "@/lib/db";
import { getNotificationInfo, sanitizeNtfyTopic } from "@/lib/notify";

export const runtime = "nodejs";

function asString(value: unknown) {
  return String(value || "").trim();
}

export async function GET() {
  if (!isAdminRequest()) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const cfg = await getPaymentConfig();
  const notifications = await getNotificationInfo();
  return NextResponse.json({
    ok: true,
    settings: {
      instapay_number: cfg.instapay.number,
      instapay_name: cfg.instapay.name,
      kashier_mid: cfg.kashier.mid,
      kashier_api_key_set: Boolean(cfg.kashier.apiKey),
      kashier_mode: cfg.kashier.mode,
      product_delivery_url: cfg.deliveryUrl,
      plant_delivery_url: cfg.plantDeliveryUrl,
      whatsapp_number: cfg.whatsapp,
      ntfy_topic: notifications.topic,
    },
    notifications,
    integrations: {
      kashier: kashierConfigured(cfg.kashier),
      instapay: Boolean(cfg.instapay.number),
      mobile: notifications.mobile,
      telegram: notifications.telegram,
      email: emailConfigured(),
    },
    envOverrides: cfg.envOverrides,
    usesRemoteDb: usesRemoteDb(),
  });
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest()) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const patch: Record<string, string> = {};

  if ("instapay_number" in body) patch.instapay_number = asString(body.instapay_number);
  if ("instapay_name" in body) patch.instapay_name = asString(body.instapay_name);
  if ("kashier_mid" in body) patch.kashier_mid = asString(body.kashier_mid);
  if ("kashier_mode" in body) {
    patch.kashier_mode = asString(body.kashier_mode).toLowerCase() === "test" ? "test" : "live";
  }
  if ("product_delivery_url" in body) {
    patch.product_delivery_url = asString(body.product_delivery_url);
  }
  if ("plant_delivery_url" in body) {
    patch.plant_delivery_url = asString(body.plant_delivery_url);
  }
  if ("whatsapp_number" in body) {
    patch.whatsapp_number = asString(body.whatsapp_number).replace(/\D/g, "");
  }
  if ("ntfy_topic" in body) {
    patch.ntfy_topic = sanitizeNtfyTopic(asString(body.ntfy_topic));
  }

  const apiKey = asString(body.kashier_api_key);
  if (apiKey) {
    patch.kashier_api_key = apiKey;
  }

  await setSettings(patch);
  const cfg = await getPaymentConfig();
  const notifications = await getNotificationInfo();
  return NextResponse.json({
    ok: true,
    notifications,
    integrations: {
      kashier: kashierConfigured(cfg.kashier),
      instapay: Boolean(cfg.instapay.number),
      mobile: notifications.mobile,
      telegram: notifications.telegram,
      email: emailConfigured(),
    },
    envOverrides: cfg.envOverrides,
    usesRemoteDb: usesRemoteDb(),
  });
}
