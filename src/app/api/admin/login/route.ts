import { NextRequest, NextResponse } from "next/server";
import { adminCookieOptions, checkPassword, createAdminToken } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const password = String(body.password || "");
  if (!checkPassword(password)) {
    return NextResponse.json({ ok: false, error: "كلمة المرور غلط" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  const cookie = adminCookieOptions();
  res.cookies.set(cookie.name, createAdminToken(), cookie);
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  const cookie = adminCookieOptions();
  res.cookies.set(cookie.name, "", { ...cookie, maxAge: 0 });
  return res;
}
