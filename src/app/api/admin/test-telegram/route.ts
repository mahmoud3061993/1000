import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { notifyTelegram } from "@/lib/telegram";
import { telegramConfigured } from "@/lib/config";

export const runtime = "nodejs";

export async function POST() {
  if (!isAdminRequest()) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!telegramConfigured()) {
    return NextResponse.json(
      { ok: false, error: "تيليجرام مش متظبط. حط TELEGRAM_BOT_TOKEN و TELEGRAM_CHAT_ID" },
      { status: 400 }
    );
  }
  const result = await notifyTelegram("تجربة إشعار من لوحة الأدمن — لو الرسالة دي وصلتك يبقى الربط تمام.");
  return NextResponse.json({ ok: Boolean(result && "ok" in result ? result.ok : false) });
}
