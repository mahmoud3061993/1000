import crypto from "crypto";
import { META, PRODUCT, SITE_URL } from "./config";

export type CapiEventName =
  | "PageView"
  | "ViewContent"
  | "InitiateCheckout"
  | "AddPaymentInfo"
  | "Purchase"
  | "Lead";

export type CapiUserData = {
  email?: string;
  phone?: string;
  firstName?: string;
  ip?: string;
  userAgent?: string;
  fbp?: string;
  fbc?: string;
  externalId?: string;
};

export type CapiCustomData = {
  value?: number;
  currency?: string;
  contentName?: string;
  contentIds?: string[];
  contentType?: string;
  orderId?: string;
};

export function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function normalizeEmail(email?: string) {
  return (email || "").trim().toLowerCase();
}

export function normalizePhone(phone?: string) {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("20")) return digits;
  if (digits.startsWith("0")) return `20${digits.slice(1)}`;
  if (digits.length === 10) return `20${digits}`;
  return digits;
}

export function hashUserData(user: CapiUserData) {
  const hashed: Record<string, unknown> = {};
  const email = normalizeEmail(user.email);
  const phone = normalizePhone(user.phone);
  const firstName = (user.firstName || "").trim().toLowerCase();

  if (email) hashed.em = [sha256(email)];
  if (phone) hashed.ph = [sha256(phone)];
  if (firstName) hashed.fn = [sha256(firstName)];
  if (user.externalId) hashed.external_id = [sha256(user.externalId)];
  if (user.ip) hashed.client_ip_address = user.ip;
  if (user.userAgent) hashed.client_user_agent = user.userAgent;
  if (user.fbp) hashed.fbp = user.fbp;
  if (user.fbc) hashed.fbc = user.fbc;
  return hashed;
}

export function buildCapiPayload(input: {
  eventName: CapiEventName;
  eventId: string;
  eventTime?: number;
  eventSourceUrl?: string;
  user: CapiUserData;
  customData?: CapiCustomData;
}) {
  const payload: Record<string, unknown> = {
    event_name: input.eventName,
    event_time: input.eventTime || Math.floor(Date.now() / 1000),
    event_id: input.eventId,
    event_source_url: input.eventSourceUrl || `${SITE_URL}/`,
    action_source: "website",
    user_data: hashUserData(input.user),
  };

  if (input.customData) {
    payload.custom_data = {
      value: input.customData.value ?? PRODUCT.price,
      currency: input.customData.currency || PRODUCT.currency,
      content_name: input.customData.contentName || PRODUCT.name,
      content_ids: input.customData.contentIds || [PRODUCT.slug],
      content_type: input.customData.contentType || "product",
      ...(input.customData.orderId ? { order_id: input.customData.orderId } : {}),
    };
  }

  return payload;
}

export async function sendCapiEvent(input: {
  eventName: CapiEventName;
  eventId: string;
  eventTime?: number;
  eventSourceUrl?: string;
  user: CapiUserData;
  customData?: CapiCustomData;
}) {
  if (!META.pixelId || !META.accessToken) {
    return { skipped: true as const, reason: "missing_meta_credentials" };
  }

  const body: Record<string, unknown> = {
    data: [buildCapiPayload(input)],
    access_token: META.accessToken,
  };
  if (META.testEventCode) {
    body.test_event_code = META.testEventCode;
  }

  const url = `https://graph.facebook.com/v21.0/${META.pixelId}/events`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error("Meta CAPI error", json);
    return { skipped: false as const, ok: false as const, error: json };
  }
  return { skipped: false as const, ok: true as const, result: json };
}
