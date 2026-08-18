import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { isAdminRequest } from "@/lib/auth";
import { getOrder } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAdminRequest()) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const order = getOrder(params.id);
  if (!order?.instapay_screenshot || !fs.existsSync(order.instapay_screenshot)) {
    return NextResponse.json({ ok: false, error: "مفيش سكرين" }, { status: 404 });
  }
  const file = fs.readFileSync(order.instapay_screenshot);
  const ext = order.instapay_screenshot.split(".").pop() || "jpg";
  const type = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  return new NextResponse(new Uint8Array(file), {
    headers: {
      "Content-Type": type,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
