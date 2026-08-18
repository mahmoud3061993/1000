import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { getPaymentConfig, kashierConfigured, metaConfigured, telegramConfigured } from "@/lib/config";
import { getFunnelStats, listOrders, usesRemoteDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!isAdminRequest()) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const status = req.nextUrl.searchParams.get("status") || "all";
  const q = req.nextUrl.searchParams.get("q") || "";
  const cfg = await getPaymentConfig();
  return NextResponse.json({
    ok: true,
    stats: await getFunnelStats(),
    orders: await listOrders({ status, q }),
    integrations: {
      kashier: kashierConfigured(cfg.kashier),
      meta: metaConfigured(),
      telegram: telegramConfigured(),
      instapay: Boolean(cfg.instapay.number),
    },
    usesRemoteDb: usesRemoteDb(),
  });
}
