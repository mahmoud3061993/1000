import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { getAnalyticsReport, parseAnalyticsPeriod } from "@/lib/analytics";
import { usesRemoteDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!isAdminRequest()) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const period = parseAnalyticsPeriod(req.nextUrl.searchParams.get("period"));
  const report = await getAnalyticsReport(period);
  return NextResponse.json({ ok: true, report, usesRemoteDb: usesRemoteDb() });
}
