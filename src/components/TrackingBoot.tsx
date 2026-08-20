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

function postEvent(body: Record<string, unknown>) {
  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    body: JSON.stringify(body),
  }).catch(() => {});
}

function onceKey(productSlug: string, name: string) {
  return `elkousy-funnel:${productSlug}:${name}`;
}

function markOnce(productSlug: string, name: string) {
  try {
    const key = onceKey(productSlug, name);
    if (sessionStorage.getItem(key)) return false;
    sessionStorage.setItem(key, "1");
    return true;
  } catch {
    return true;
  }
}

export function TrackingBoot({
  productSlug = "1000",
  price = 235,
  contentName,
  trackFunnel = false,
}: {
  productSlug?: string;
  price?: number;
  contentName?: string;
  trackFunnel?: boolean;
}) {
  useEffect(() => {
    const attr = captureAttribution();
    const cookies = getMetaCookies();
    const payload = {
      ...cookies,
      ...attr,
      referrer: document.referrer,
      eventSourceUrl: window.location.href,
      productSlug,
      value: price,
      currency: "EGP",
    };

    const pageEventId = crypto.randomUUID();
    firePixel("PageView", {}, pageEventId);
    postEvent({ eventName: "PageView", eventId: pageEventId, ...payload });

    const viewId = crypto.randomUUID();
    firePixel(
      "ViewContent",
      { content_name: contentName || document.title, content_ids: [productSlug], value: price, currency: "EGP" },
      viewId
    );
    postEvent({ eventName: "ViewContent", eventId: viewId, ...payload });

    if (!trackFunnel) return;

    const sendNamed = (eventName: string) => {
      if (!markOnce(productSlug, eventName)) return;
      postEvent({ eventName, eventId: crypto.randomUUID(), ...payload });
    };

    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      const pct = max <= 0 ? 100 : Math.round((window.scrollY / max) * 100);
      if (pct >= 25) sendNamed("Scroll25");
      if (pct >= 50) sendNamed("Scroll50");
      if (pct >= 75) sendNamed("Scroll75");
      if (pct >= 90) sendNamed("Scroll100");
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const pay = document.getElementById("order-form");
    let observer: IntersectionObserver | null = null;
    if (pay && "IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.25)) {
            sendNamed("CheckoutView");
            observer?.disconnect();
          }
        },
        { threshold: [0.25, 0.5] }
      );
      observer.observe(pay);
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      observer?.disconnect();
    };
  }, [productSlug, price, contentName, trackFunnel]);

  return null;
}
