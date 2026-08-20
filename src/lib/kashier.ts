import crypto from "crypto";
import { KASHIER, SITE_URL, type KashierCredentials } from "./config";

export type KashierCallbackQuery = Record<string, string | string[] | undefined>;

function asString(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

export function generateKashierOrderHash(input: {
  mid: string;
  orderId: string;
  amount: string | number;
  currency: string;
  secret: string;
  customerReference?: string;
}) {
  const amount = formatKashierAmount(input.amount);
  let path = `/?payment=${input.mid}.${input.orderId}.${amount}.${input.currency}`;
  if (input.customerReference) {
    path += `.${input.customerReference}`;
  }
  return crypto.createHmac("sha256", input.secret).update(path).digest("hex");
}

export function formatKashierAmount(amount: string | number) {
  return Number(amount).toFixed(2);
}

export function buildKashierHppUrl(input: {
  orderId: string;
  amount: number;
  currency: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  allowedMethods?: string;
  credentials?: KashierCredentials;
  description?: string;
}) {
  const creds = input.credentials || KASHIER;
  const amount = formatKashierAmount(input.amount);
  const hash = generateKashierOrderHash({
    mid: creds.mid,
    orderId: input.orderId,
    amount,
    currency: input.currency,
    secret: creds.apiKey,
  });
  const callbackUrl = `${SITE_URL}/api/kashier/callback`;
  const params = new URLSearchParams({
    merchantId: creds.mid,
    orderId: input.orderId,
    mode: creds.mode,
    amount,
    currency: input.currency,
    hash,
    merchantRedirect: callbackUrl,
    allowedMethods: input.allowedMethods || "card,wallet",
    display: "ar",
    type: "external",
    description: input.description || "+1000 Canva Ads Templates",
  });
  if (input.customerName) params.set("customerName", input.customerName);
  if (input.customerEmail) params.set("customerEmail", input.customerEmail);
  if (input.customerPhone) params.set("customerMobile", input.customerPhone);
  return `https://checkout.kashier.io?${params.toString()}`;
}

/**
 * Kashier signs every query param except `signature` and `mode`,
 * in the order they appear on the callback URL.
 */
export function validateKashierCallbackSignature(
  searchParams: URLSearchParams,
  secret: string
) {
  const received = searchParams.get("signature") || "";
  if (!received || !secret) return false;

  const parts: string[] = [];
  searchParams.forEach((value, key) => {
    if (key === "signature" || key === "mode") return;
    parts.push(`${key}=${value}`);
  });

  const expected = crypto
    .createHmac("sha256", secret)
    .update(parts.join("&"))
    .digest("hex");

  return timingSafeEqualHex(expected, received);
}

export function validateKashierWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
) {
  if (!signatureHeader || !secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return timingSafeEqualHex(expected, signatureHeader);
}

export function isKashierSuccess(status: string | null | undefined) {
  const normalized = (status || "").toUpperCase();
  return normalized === "SUCCESS" || normalized === "PAID";
}

export function timingSafeEqualHex(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export function readCallbackFields(searchParams: URLSearchParams) {
  return {
    paymentStatus: asString(searchParams.get("paymentStatus") || ""),
    merchantOrderId: asString(searchParams.get("merchantOrderId") || ""),
    orderId: asString(searchParams.get("orderId") || ""),
    transactionId: asString(searchParams.get("transactionId") || ""),
    amount: asString(searchParams.get("amount") || ""),
    currency: asString(searchParams.get("currency") || ""),
    cardBrand: asString(searchParams.get("cardBrand") || ""),
    orderReference: asString(searchParams.get("orderReference") || ""),
    signature: asString(searchParams.get("signature") || ""),
  };
}
