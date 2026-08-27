import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { getPaymentConfig, metaConfigured, telegramConfigured, emailConfigured } from "@/lib/config";
import { getFunnelStats, listOrders, usesRemoteDb } from "@/lib/db";
import { getNotificationInfo } from "@/lib/notify";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!isAdminRequest()) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const status = req.nextUrl.searchParams.get("status") || "all";
  const q = req.nextUrl.searchParams.get("q") || "";
  const product = req.nextUrl.searchParams.get("product") || "arabity";
  const cfg = await getPaymentConfig();
  const notifications = await getNotificationInfo();
  return NextResponse.json({
    ok: true,
    stats: await getFunnelStats(product),
    orders: await listOrders({ status, q, product }),
    notifications,
    integrations: {
      meta: metaConfigured(),
      telegram: telegramConfigured(),
      instapay: Boolean(cfg.instapay.number),
      wallet: Boolean(cfg.wallet.number),
      mobile: notifications.mobile,
      email: emailConfigured(),
    },
    usesRemoteDb: usesRemoteDb(),
  });
}
