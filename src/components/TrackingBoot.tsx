"use client";

import { useEffect } from "react";
import {
  ATTR_COOKIE,
  emptyAttribution,
  mergeAttribution,
  parseAttribution,
  type Attribution,
} from "@/lib/attribution";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

function cookie(name: string) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 90}; samesite=lax`;
}

function ensureSid() {
  let sid = cookie("sid");
  if (!sid) {
    sid = crypto.randomUUID();
    writeCookie("sid", sid);
  }
  return sid;
}

function readStoredAttribution(): Attribution {
  try {
    const raw = cookie(ATTR_COOKIE) || (typeof sessionStorage !== "undefined" ? sessionStorage.getItem(ATTR_COOKIE) : "") || "";
    if (!raw) return emptyAttribution();
    return mergeAttribution(JSON.parse(raw) as Partial<Attribution>, emptyAttribution());
  } catch {
    return emptyAttribution();
  }
}

function writeStoredAttribution(attr: Attribution) {
  const payload = JSON.stringify(attr);
  writeCookie(ATTR_COOKIE, payload);
  try {
    sessionStorage.setItem(ATTR_COOKIE, payload);
  } catch {
    // ignore private-mode storage errors
  }
}

export function captureAttribution() {
  const fromUrl = parseAttribution(new URLSearchParams(window.location.search));
  const merged = mergeAttribution(readStoredAttribution(), fromUrl);
  writeStoredAttribution(merged);
  if (fromUrl.fbclid && !cookie("_fbc")) {
    writeCookie("_fbc", `fb.1.${Date.now()}.${fromUrl.fbclid}`);
  }
  return merged;
}

export function getMetaCookies() {
  const fbp = cookie("_fbp");
  const existingFbc = cookie("_fbc");
  const fbclid = new URLSearchParams(window.location.search).get("fbclid") || "";
  const fbc = existingFbc || (fbclid ? `fb.1.${Date.now()}.${fbclid}` : "");
  return {
    sessionId: ensureSid(),
    fbp,
    fbc,
  };
}

export function getTrackingContext() {
  const cookies = getMetaCookies();
  const attr = captureAttribution();
  return {
    ...cookies,
    ...attr,
    fbclid: attr.fbclid || cookies.fbc.replace(/^fb\.\d+\.\d+\./, ""),
  };
}

export function firePixel(event: string, extra: Record<string, unknown> = {}, eventId?: string) {
  if (typeof window.fbq === "function") {
    window.fbq("track", event, extra, eventId ? { eventID: eventId } : undefined);
  }
}

export function TrackingBoot() {
  useEffect(() => {
    const attr = captureAttribution();
    const eventId = crypto.randomUUID();
    const cookies = getMetaCookies();
    firePixel("PageView", {}, eventId);
    const viewId = crypto.randomUUID();
    firePixel("ViewContent", { content_name: document.title, content_ids: ["1000"], value: 235, currency: "EGP" }, viewId);
    const payload = {
      ...cookies,
      ...attr,
      referrer: document.referrer,
      eventSourceUrl: window.location.href,
    };
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventName: "PageView", eventId, ...payload }),
    }).catch(() => {});
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName: "ViewContent",
        eventId: viewId,
        value: 235,
        currency: "EGP",
        ...payload,
      }),
    }).catch(() => {});
  }, []);
  return null;
}
