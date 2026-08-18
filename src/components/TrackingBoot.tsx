"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

function cookie(name: string) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

function ensureSid() {
  let sid = cookie("sid");
  if (!sid) {
    sid = crypto.randomUUID();
    document.cookie = `sid=${sid}; path=/; max-age=${60 * 60 * 24 * 90}; samesite=lax`;
  }
  return sid;
}

export function getMetaCookies() {
  const fbp = cookie("_fbp");
  const existingFbc = cookie("_fbc");
  const fbclid = new URLSearchParams(window.location.search).get("fbclid");
  const fbc = existingFbc || (fbclid ? `fb.1.${Date.now()}.${fbclid}` : "");
  return {
    sessionId: ensureSid(),
    fbp,
    fbc,
  };
}

export function firePixel(event: string, extra: Record<string, unknown> = {}, eventId?: string) {
  if (typeof window.fbq === "function") {
    window.fbq("track", event, extra, eventId ? { eventID: eventId } : undefined);
  }
}

export function TrackingBoot() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const eventId = crypto.randomUUID();
    const cookies = getMetaCookies();
    firePixel("PageView", {}, eventId);
    const viewId = crypto.randomUUID();
    firePixel("ViewContent", { content_name: document.title, content_ids: ["1000"], value: 235, currency: "EGP" }, viewId);
    const payload = {
      ...cookies,
      utm_source: params.get("utm_source"),
      utm_medium: params.get("utm_medium"),
      utm_campaign: params.get("utm_campaign"),
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
