import { getSettings } from "./db";
import { PLANT_DRIVE_URL } from "./plant-guide";
import { getCatalogProduct } from "./products";

export { PRODUCT, getCatalogProduct } from "./products";
export type { CatalogProduct, ProductSlug } from "./products";

export const DEFAULT_DELIVERY_URL =
  "https://drive.google.com/drive/u/0/folders/1YA69JKnLz1cCSa6913KvyuZdksZH-p6O";

export const CANONICAL_SITE_URL = "https://www.producthelpyou.online";

/** Old registrar domain is dead; rewrite leftover env/admin URLs onto the live site. */
export function rewriteRetiredSiteUrl(value: string) {
  return value.replace(
    /https?:\/\/(?:www\.)?mahmoudelkousy\.online/gi,
    CANONICAL_SITE_URL
  );
}

export type KashierCredentials = {
  mid: string;
  apiKey: string;
  mode: "live" | "test";
};

export const ARABITY_SYSTEM_URL = `${CANONICAL_SITE_URL}/car`;
export const ARABITY_DRIVE_URL =
  "https://drive.google.com/drive/u/0/folders/1g0QLdBay_9eWs_UWEHf2h5lU2tT57_3e";
export const MASAREF_SYSTEM_URL = `${CANONICAL_SITE_URL}/spend`;
export const MASAREF_FILES_URL = `${CANONICAL_SITE_URL}/spend/files.html`;
export const MASAREF_HTML_ZIP_URL = `${CANONICAL_SITE_URL}/spend/masaref-html.zip`;
export const MASAREF_APK_URL = `${CANONICAL_SITE_URL}/spend/masaref.apk`;
export const MASAREF_APK_ZIP_URL = `${CANONICAL_SITE_URL}/spend/masaref-android.zip`;
export const MASAREF_HOWTO_URL = `${CANONICAL_SITE_URL}/spend/howto.html`;
export const MASAREF_DRIVE_URL = MASAREF_FILES_URL;

export type PaymentConfig = {
  instapay: { number: string; name: string };
  wallet: { number: string; name: string };
  kashier: KashierCredentials;
  deliveryUrl: string;
  plantDeliveryUrl: string;
  arabityDeliveryUrl: string;
  masarefDeliveryUrl: string;
  whatsapp: string;
  usesRemoteDb: boolean;
  envOverrides: {
    instapay: boolean;
    wallet: boolean;
    kashier: boolean;
    deliveryUrl: boolean;
    plantDeliveryUrl: boolean;
    arabityDeliveryUrl: boolean;
    masarefDeliveryUrl: boolean;
  };
};

function firstNonEmpty(...values: Array<string | undefined>) {
  for (const value of values) {
    if (value && value.trim()) return value.trim();
  }
  return "";
}

function firstArabityDelivery(...values: Array<string | undefined>) {
  for (const value of values) {
    if (!value || !value.trim()) continue;
    const url = rewriteRetiredSiteUrl(value.trim());
    if (url === ARABITY_SYSTEM_URL || /\/car\/?$/.test(url)) continue;
    return url;
  }
  return ARABITY_DRIVE_URL;
}

function firstMasarefDelivery(...values: Array<string | undefined>) {
  for (const value of values) {
    if (!value || !value.trim()) continue;
    const url = rewriteRetiredSiteUrl(value.trim());
    if (url === MASAREF_SYSTEM_URL || /\/spend\/?$/.test(url)) continue;
    return url;
  }
  return MASAREF_DRIVE_URL;
}

function firstPlantDelivery(...values: Array<string | undefined>) {
  for (const value of values) {
    if (!value || !value.trim()) continue;
    const url = rewriteRetiredSiteUrl(value.trim());
    try {
      const parsed = new URL(url);
      if (parsed.pathname.startsWith("/products/plant")) return PLANT_DRIVE_URL;
    } catch {
      if (url.includes("/products/plant")) return PLANT_DRIVE_URL;
    }
    return url;
  }
  return PLANT_DRIVE_URL;
}

export function mergePaymentConfig(
  env: NodeJS.Dict<string>,
  stored: Record<string, string> = {}
): PaymentConfig {
  const instapayNumber = firstNonEmpty(
    env.INSTAPAY_NUMBER,
    stored.instapay_number,
    "01017420379"
  );
  const instapayName = firstNonEmpty(
    env.INSTAPAY_NAME,
    stored.instapay_name,
    "mahmoud a i m"
  );
  const walletNumber = firstNonEmpty(env.WALLET_NUMBER, stored.wallet_number, instapayNumber);
  const walletName = firstNonEmpty(env.WALLET_NAME, stored.wallet_name, instapayName);
  const kashierMid = firstNonEmpty(env.KASHIER_MID, stored.kashier_mid, "MID-40746-226");
  const kashierApiKey = firstNonEmpty(env.KASHIER_API_KEY, stored.kashier_api_key);
  const modeRaw = firstNonEmpty(env.KASHIER_MODE, stored.kashier_mode, "live").toLowerCase();
  return {
    instapay: { number: instapayNumber, name: instapayName },
    wallet: { number: walletNumber, name: walletName },
    kashier: {
      mid: kashierMid,
      apiKey: kashierApiKey,
      mode: modeRaw === "test" ? "test" : "live",
    },
    deliveryUrl: rewriteRetiredSiteUrl(
      firstNonEmpty(
        env.PRODUCT_DELIVERY_URL,
        stored.product_delivery_url,
        DEFAULT_DELIVERY_URL
      )
    ),
    plantDeliveryUrl: firstPlantDelivery(env.PLANT_DELIVERY_URL, stored.plant_delivery_url),
    arabityDeliveryUrl: firstArabityDelivery(env.ARABITY_DELIVERY_URL, stored.arabity_delivery_url),
    masarefDeliveryUrl: firstMasarefDelivery(env.MASAREF_DELIVERY_URL, stored.masaref_delivery_url),
    whatsapp: firstNonEmpty(env.WHATSAPP_NUMBER, stored.whatsapp_number, "201017420379").replace(
      /\D/g,
      ""
    ),
    usesRemoteDb: Boolean(env.TURSO_DATABASE_URL || env.LIBSQL_URL),
    envOverrides: {
      instapay: Boolean(env.INSTAPAY_NUMBER),
      wallet: Boolean(env.WALLET_NUMBER),
      kashier: Boolean(env.KASHIER_MID && env.KASHIER_API_KEY),
      deliveryUrl: Boolean(env.PRODUCT_DELIVERY_URL),
      plantDeliveryUrl: Boolean(env.PLANT_DELIVERY_URL),
      arabityDeliveryUrl: Boolean(env.ARABITY_DELIVERY_URL),
      masarefDeliveryUrl: Boolean(env.MASAREF_DELIVERY_URL),
    },
  };
}

export function deliveryUrlForProduct(slug: string | null | undefined, cfg: PaymentConfig) {
  const product = getCatalogProduct(slug);
  if (product.slug === "plant") return cfg.plantDeliveryUrl;
  if (product.slug === "arabity") return cfg.arabityDeliveryUrl || ARABITY_DRIVE_URL;
  if (product.slug === "masaref") return cfg.masarefDeliveryUrl || MASAREF_FILES_URL;
  return cfg.deliveryUrl || DEFAULT_DELIVERY_URL;
}

export async function getPaymentConfig(): Promise<PaymentConfig> {
  try {
    return mergePaymentConfig(process.env, await getSettings());
  } catch (error) {
    console.error("payment config falling back without database", error);
    return mergePaymentConfig(process.env);
  }
}

export const SITE_URL = rewriteRetiredSiteUrl(
  (
    process.env.SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000")
  ).replace(/\/$/, "")
);

export const WHATSAPP_NUMBER = (process.env.WHATSAPP_NUMBER || "201017420379").replace(
  /\D/g,
  ""
);

export const INSTAPAY = {
  number: process.env.INSTAPAY_NUMBER || "01017420379",
  name: process.env.INSTAPAY_NAME || "mahmoud a i m",
};

export const WALLET = {
  number: process.env.WALLET_NUMBER || INSTAPAY.number,
  name: process.env.WALLET_NAME || INSTAPAY.name,
};

export const KASHIER = {
  mid: process.env.KASHIER_MID || "MID-40746-226",
  apiKey: process.env.KASHIER_API_KEY || "",
  mode: (process.env.KASHIER_MODE || "live") as "live" | "test",
};

export const META = {
  pixelId: process.env.META_PIXEL_ID || "",
  accessToken: process.env.META_CAPI_ACCESS_TOKEN || "",
  testEventCode: process.env.META_TEST_EVENT_CODE || "",
};

export const ADMIN = {
  password: process.env.ADMIN_PASSWORD || "admin",
  sessionSecret: process.env.SESSION_SECRET || "dev-session-secret-change-me",
};

export const TELEGRAM = {
  botToken: process.env.TELEGRAM_BOT_TOKEN || "",
  chatId: process.env.TELEGRAM_CHAT_ID || "",
};

export function kashierConfigured(creds: KashierCredentials = KASHIER) {
  return Boolean(creds.mid && creds.apiKey);
}

export function metaConfigured() {
  return Boolean(META.pixelId && META.accessToken);
}

export function telegramConfigured() {
  return Boolean(TELEGRAM.botToken && TELEGRAM.chatId);
}

export function emailConfigured(env: NodeJS.Dict<string> = process.env) {
  if (env.RESEND_API_KEY) return true;
  return Boolean(env.SMTP_USER && env.SMTP_PASS);
}
