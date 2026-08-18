import { createHmac } from "crypto";
import { SITE_URL, telegramConfigured } from "./config";
import { getSettings } from "./db";
import { fileNameForMime, parseStoredScreenshot } from "./screenshot";
import { formatOrderMessage, notifyTelegram } from "./telegram";

export type NotifyKind = "lead" | "trying" | "pending" | "paid" | "failed";

type NotifyOrder = {
  id: string;
  name: string;
  email: string;
  phone: string;
  amount: number;
  currency: string;
  payment_method: string | null;
  status: string;
  instapay_screenshot?: string | null;
};

const ORDER_TITLES: Record<NotifyKind, string> = {
  lead: "طلب جديد — ملأ البيانات",
  trying: "بيحاول يدفع دلوقتي",
  pending: "طلب إنستاباي جديد — محتاج مراجعة",
  paid: "تم الدفع بنجاح",
  failed: "فشل دفع",
};

const ORDER_TAGS: Record<NotifyKind, string[]> = {
  lead: ["bust_in_silhouette", "bell"],
  trying: ["bell", "credit_card"],
  pending: ["warning", "camera"],
  paid: ["white_check_mark", "moneybag"],
  failed: ["x", "rotating_light"],
};

function firstNonEmpty(...values: Array<string | undefined>) {
  for (const value of values) {
    if (value && value.trim()) return value.trim();
  }
  return "";
}

export function sanitizeNtfyTopic(raw: string) {
  return raw.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
}

export function deriveNtfyTopic(env: NodeJS.Dict<string> = process.env) {
  const site = firstNonEmpty(
    env.SITE_URL,
    env.VERCEL_PROJECT_PRODUCTION_URL,
    env.VERCEL_URL,
    "elkousy"
  ).replace(/\/$/, "");
  const seed = firstNonEmpty(env.NTFY_SECRET, env.SESSION_SECRET, env.ADMIN_PASSWORD, "elkousy-alerts");
  const hash = createHmac("sha256", "elkousy-mobile-alerts")
    .update(`${site}|${seed}`)
    .digest("hex")
    .slice(0, 20);
  return `elkousy-${hash}`;
}

export function resolveNtfyTopic(env: NodeJS.Dict<string> = process.env, stored: Record<string, string> = {}) {
  const custom = sanitizeNtfyTopic(firstNonEmpty(env.NTFY_TOPIC, stored.ntfy_topic));
  return custom || deriveNtfyTopic(env);
}

export function ntfyServer(env: NodeJS.Dict<string> = process.env) {
  return firstNonEmpty(env.NTFY_SERVER, "https://ntfy.sh").replace(/\/$/, "");
}

export function ntfySubscribeUrl(topic: string, env: NodeJS.Dict<string> = process.env) {
  return `${ntfyServer(env)}/${encodeURIComponent(topic)}`;
}

export function ntfyAppUrl(topic: string) {
  return `ntfy://ntfy.sh/${encodeURIComponent(topic)}`;
}

export async function getNtfyTopic() {
  try {
    return resolveNtfyTopic(process.env, await getSettings());
  } catch (error) {
    console.error("ntfy topic falling back without database", error);
    return resolveNtfyTopic(process.env);
  }
}

export async function getNotificationInfo() {
  const topic = await getNtfyTopic();
  return {
    topic,
    subscribeUrl: ntfySubscribeUrl(topic),
    appUrl: ntfyAppUrl(topic),
    androidApp: "https://play.google.com/store/apps/details?id=io.heckel.ntfy",
    iosApp: "https://apps.apple.com/app/ntfy/id1625396347",
    telegram: telegramConfigured(),
    mobile: Boolean(topic),
  };
}

function channelOk(result: { skipped: boolean; ok?: boolean } | undefined) {
  return Boolean(result && !result.skipped && result.ok);
}

export async function notifyNtfy(
  text: string,
  opts: { title: string; screenshot?: string | null; priority?: number; tags?: string[] } = { title: "تنبيه" }
) {
  const topic = await getNtfyTopic();
  if (!topic) {
    return { skipped: true as const };
  }

  try {
    const server = ntfyServer();
    const res = await fetch(server, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic,
        title: opts.title,
        message: text,
        priority: opts.priority ?? 4,
        click: `${SITE_URL}/admin`,
        tags: opts.tags || ["bell"],
      }),
    });
    if (!res.ok) {
      console.error("ntfy message error", await res.text());
      return { skipped: false as const, ok: false as const };
    }

    const parsed = parseStoredScreenshot(opts.screenshot || null);
    if (parsed) {
      const photo = await fetch(`${server}/${encodeURIComponent(topic)}`, {
        method: "PUT",
        headers: {
          Title: "Instapay screenshot",
          Filename: fileNameForMime(parsed.mime),
          Click: `${SITE_URL}/admin`,
          Priority: String(opts.priority ?? 4),
        },
        body: new Uint8Array(parsed.buffer),
      });
      if (!photo.ok) {
        console.error("ntfy screenshot error", await photo.text());
      }
    }

    return { skipped: false as const, ok: true as const };
  } catch (error) {
    console.error("ntfy notify failed", error);
    return { skipped: false as const, ok: false as const };
  }
}

export async function notifyText(
  text: string,
  opts: { title?: string; screenshot?: string | null; priority?: number; tags?: string[] } = {}
) {
  const title = opts.title || "تنبيه من المتجر";
  const [mobile, telegram] = await Promise.all([
    notifyNtfy(text, {
      title,
      screenshot: opts.screenshot,
      priority: opts.priority,
      tags: opts.tags,
    }),
    notifyTelegram(text, opts.screenshot),
  ]);
  return {
    mobile,
    telegram,
    ok: channelOk(mobile) || channelOk(telegram),
  };
}

export async function notifyOrder(kind: NotifyKind, order: NotifyOrder) {
  const screenshot =
    kind === "pending" && order.instapay_screenshot ? order.instapay_screenshot : null;
  return notifyText(formatOrderMessage(kind, order), {
    title: ORDER_TITLES[kind],
    screenshot,
    priority: kind === "paid" || kind === "pending" || kind === "lead" ? 5 : 4,
    tags: ORDER_TAGS[kind],
  });
}
