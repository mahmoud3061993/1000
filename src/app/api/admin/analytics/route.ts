import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { getAnalyticsReport, parseAnalyticsPeriod, parseProductFilter } from "@/lib/analytics";
import { clearAnalyticsData, usesRemoteDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!isAdminRequest()) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const period = parseAnalyticsPeriod(req.nextUrl.searchParams.get("period"));
  const product = parseProductFilter(req.nextUrl.searchParams.get("product") || "arabity");
  const report = await getAnalyticsReport(period, new Date(), product);
  return NextResponse.json({ ok: true, report, usesRemoteDb: usesRemoteDb() });
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest()) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  if (body.action !== "clear") {
    return NextResponse.json({ ok: false, error: "إجراء غير معروف" }, { status: 400 });
  }
  const cleared = await clearAnalyticsData("arabity");
  return NextResponse.json({ ok: true, ...cleared });
}
