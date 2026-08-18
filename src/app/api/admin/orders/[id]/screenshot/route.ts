import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { getOrder } from "@/lib/db";
import { parseStoredScreenshot } from "@/lib/screenshot";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminRequest()) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const order = await getOrder(params.id);
  const parsed = parseStoredScreenshot(order?.instapay_screenshot);
  if (!parsed) {
    return NextResponse.json({ ok: false, error: "مفيش سكرين" }, { status: 404 });
  }
  return new NextResponse(new Uint8Array(parsed.buffer), {
    headers: {
      "Content-Type": parsed.mime,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
