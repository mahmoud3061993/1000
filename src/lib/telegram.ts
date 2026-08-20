import { TELEGRAM } from "./config";
import { fileNameForMime, parseStoredScreenshot } from "./screenshot";

type NotifyOrder = {
  id: string;
  name: string;
  email: string;
  phone: string;
  amount: number;
  currency: string;
  product_slug?: string | null;
  payment_method: string | null;
  status: string;
  instapay_screenshot?: string | null;
};

const STATUS_AR: Record<string, string> = {
  form_filled: "ملأ البيانات",
  awaiting_payment: "بيحاول يدفع",
  pending_review: "إنستاباي — قيد المراجعة",
  paid: "تم الدفع",
  failed: "فشل الدفع",
  rejected: "مرفوض",
};

export function formatOrderMessage(kind: "lead" | "trying" | "pending" | "paid" | "failed", order: NotifyOrder) {
  const titles = {
    lead: "طلب جديد — العميل ملأ بياناته",
    trying: "بيحاول يدفع دلوقتي",
    pending: "طلب إنستاباي جديد — محتاج مراجعة",
    paid: "تم الدفع بنجاح",
    failed: "فشل دفع",
  };
  const method = order.payment_method === "instapay" ? "إنستاباي" : "كاشير (فيزا/محفظة)";
  return [
    titles[kind],
    "",
    `الاسم: ${order.name}`,
    `الموبايل: ${order.phone}`,
    `الإيميل: ${order.email}`,
    `المنتج: ${order.product_slug === "plant" ? "دليل النباتات" : "مكتبة +1000 Canva"}`,
    `المبلغ: ${order.amount} ${order.currency}`,
    `الوسيلة: ${method}`,
    `الحالة: ${STATUS_AR[order.status] || order.status}`,
    `رقم الطلب: ${order.id}`,
  ].join("\n");
}

export async function notifyTelegram(text: string, screenshot?: string | null) {
  if (!TELEGRAM.botToken || !TELEGRAM.chatId) {
    return { skipped: true as const };
  }

  try {
    const parsed = parseStoredScreenshot(screenshot || null);
    if (parsed) {
      const form = new FormData();
      form.set("chat_id", TELEGRAM.chatId);
      form.set("caption", text.slice(0, 1000));
      form.set(
        "photo",
        new Blob([new Uint8Array(parsed.buffer)], { type: parsed.mime }),
        fileNameForMime(parsed.mime)
      );
      const res = await fetch(`https://api.telegram.org/bot${TELEGRAM.botToken}/sendPhoto`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        console.error("Telegram photo error", await res.text());
      }
      return { skipped: false as const, ok: res.ok };
    }

    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM.botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM.chatId,
        text,
      }),
    });
    if (!res.ok) {
      console.error("Telegram message error", await res.text());
    }
    return { skipped: false as const, ok: res.ok };
  } catch (error) {
    console.error("Telegram notify failed", error);
    return { skipped: false as const, ok: false as const };
  }
}
