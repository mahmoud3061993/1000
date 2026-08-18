import { cookies, headers } from "next/headers";
import { NextRequest } from "next/server";

export function getOrCreateSessionId() {
  const jar = cookies();
  const existing = jar.get("sid")?.value;
  if (existing) return existing;
  const sid = crypto.randomUUID();
  jar.set("sid", sid, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
  return sid;
}

export function readTrackingCookies(req?: NextRequest) {
  const source = req ? req.cookies : cookies();
  return {
    sid: source.get("sid")?.value || "",
    fbp: source.get("_fbp")?.value || source.get("fbp")?.value || "",
    fbc: source.get("_fbc")?.value || source.get("fbc")?.value || "",
  };
}

export function clientIp(req?: NextRequest) {
  const h = req ? req.headers : headers();
  const forwarded = h.get("x-forwarded-for") || "";
  return forwarded.split(",")[0]?.trim() || h.get("x-real-ip") || "";
}

export function userAgent(req?: NextRequest) {
  const h = req ? req.headers : headers();
  return h.get("user-agent") || "";
}

export function newEventId() {
  return crypto.randomUUID();
}
