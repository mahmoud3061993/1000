import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { getPaymentConfig, emailConfigured } from "@/lib/config";
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
      wallet_number: cfg.wallet.number,
      wallet_name: cfg.wallet.name,
      product_delivery_url: cfg.deliveryUrl,
      plant_delivery_url: cfg.plantDeliveryUrl,
      arabity_delivery_url: cfg.arabityDeliveryUrl,
      whatsapp_number: cfg.whatsapp,
      ntfy_topic: notifications.topic,
    },
    notifications,
    integrations: {
      instapay: Boolean(cfg.instapay.number),
      wallet: Boolean(cfg.wallet.number),
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
  if ("wallet_number" in body) patch.wallet_number = asString(body.wallet_number);
  if ("wallet_name" in body) patch.wallet_name = asString(body.wallet_name);
  if ("product_delivery_url" in body) {
    patch.product_delivery_url = asString(body.product_delivery_url);
  }
  if ("plant_delivery_url" in body) {
    patch.plant_delivery_url = asString(body.plant_delivery_url);
  }
  if ("arabity_delivery_url" in body) {
    patch.arabity_delivery_url = asString(body.arabity_delivery_url);
  }
  if ("whatsapp_number" in body) {
    patch.whatsapp_number = asString(body.whatsapp_number).replace(/\D/g, "");
  }
  if ("ntfy_topic" in body) {
    patch.ntfy_topic = sanitizeNtfyTopic(asString(body.ntfy_topic));
  }

  await setSettings(patch);
  const cfg = await getPaymentConfig();
  const notifications = await getNotificationInfo();
  return NextResponse.json({
    ok: true,
    notifications,
    integrations: {
      instapay: Boolean(cfg.instapay.number),
      wallet: Boolean(cfg.wallet.number),
      mobile: notifications.mobile,
      telegram: notifications.telegram,
      email: emailConfigured(),
    },
    envOverrides: cfg.envOverrides,
    usesRemoteDb: usesRemoteDb(),
  });
}
