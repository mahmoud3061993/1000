import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { getFunnelStats, listOrders } from "@/lib/db";
import { INSTAPAY, kashierConfigured, metaConfigured, telegramConfigured } from "@/lib/config";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!isAdminRequest()) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const status = req.nextUrl.searchParams.get("status") || "all";
  const q = req.nextUrl.searchParams.get("q") || "";
  return NextResponse.json({
    ok: true,
    stats: getFunnelStats(),
    orders: listOrders({ status, q }),
    integrations: {
      kashier: kashierConfigured(),
      meta: metaConfigured(),
      telegram: telegramConfigured(),
      instapay: Boolean(INSTAPAY.number),
    },
  });
}
