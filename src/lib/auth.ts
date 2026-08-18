import crypto from "crypto";
import { cookies } from "next/headers";
import { ADMIN } from "./config";

const COOKIE = "admin_session";
const MAX_AGE = 60 * 60 * 24 * 14;

function sign(value: string) {
  return crypto.createHmac("sha256", ADMIN.sessionSecret).update(value).digest("hex");
}

export function createAdminToken() {
  const payload = `admin.${Date.now()}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminToken(token?: string | null) {
  if (!token) return false;
  const lastDot = token.lastIndexOf(".");
  if (lastDot <= 0) return false;
  const payload = token.slice(0, lastDot);
  const signature = token.slice(lastDot + 1);
  const expected = sign(payload);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export function isAdminRequest() {
  return verifyAdminToken(cookies().get(COOKIE)?.value);
}

export function adminCookieOptions() {
  return {
    name: COOKIE,
    maxAge: MAX_AGE,
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
  };
}

export function checkPassword(password: string) {
  const left = Buffer.from(password);
  const right = Buffer.from(ADMIN.password);
  if (left.length !== right.length) {
    crypto.timingSafeEqual(left, left);
    return false;
  }
  return crypto.timingSafeEqual(left, right);
}
