export const PRODUCT = {
  slug: "1000",
  name: "+1000 winning conversion ads canva editable templates",
  price: Number(process.env.PRODUCT_PRICE || 235),
  currency: process.env.PRODUCT_CURRENCY || "EGP",
  deliveryUrl: process.env.PRODUCT_DELIVERY_URL || "",
};

export const SITE_URL = (process.env.SITE_URL || "http://localhost:3000").replace(
  /\/$/,
  ""
);

export const WHATSAPP_NUMBER = (process.env.WHATSAPP_NUMBER || "201017420379").replace(
  /\D/g,
  ""
);

export const INSTAPAY = {
  number: process.env.INSTAPAY_NUMBER || "",
  name: process.env.INSTAPAY_NAME || "",
};

export const KASHIER = {
  mid: process.env.KASHIER_MID || "",
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

export function kashierConfigured() {
  return Boolean(KASHIER.mid && KASHIER.apiKey);
}

export function metaConfigured() {
  return Boolean(META.pixelId && META.accessToken);
}

export function telegramConfigured() {
  return Boolean(TELEGRAM.botToken && TELEGRAM.chatId);
}
