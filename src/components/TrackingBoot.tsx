"use client";

import { useEffect } from "react";
import {
  AD_PATH_COOKIE,
  ATTR_COOKIE,
  FBC_LOCK_COOKIE,
  appendAdPath,
  emptyAttribution,
  mergeAttribution,
  parseAdPath,
  parseAttribution,
  serializeAdPath,
  type AdTouch,
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

function readStoredAdPath(): AdTouch[] {
  try {
    return parseAdPath(cookie(AD_PATH_COOKIE) || sessionStorage.getItem(AD_PATH_COOKIE) || "");
  } catch {
    return [];
  }
}

function writeStoredAdPath(path: AdTouch[]) {
  const payload = serializeAdPath(path);
  writeCookie(AD_PATH_COOKIE, payload);
  try {
    sessionStorage.setItem(AD_PATH_COOKIE, payload);
  } catch {
    // ignore
  }
}

/** Keep the first Facebook click. Later ads must not overwrite _fbc or Purchase goes to the wrong ad. */
export function ensureOriginalFbc(fbclidFromUrl?: string) {
  const urlClick = (fbclidFromUrl ?? (new URLSearchParams(window.location.search).get("fbclid") || "")).trim();
  let locked = cookie(FBC_LOCK_COOKIE);
  if (!locked && urlClick) {
    locked = `fb.1.${Date.now()}.${urlClick}`;
    writeCookie(FBC_LOCK_COOKIE, locked);
  }
  if (!locked) {
    locked = cookie("_fbc");
    if (locked) writeCookie(FBC_LOCK_COOKIE, locked);
  }
  if (locked) writeCookie("_fbc", locked);
  return locked;
}

export function captureAttribution() {
  const fromUrl = parseAttribution(new URLSearchParams(window.location.search));
  const firstTouch = mergeAttribution(readStoredAttribution(), fromUrl);
  writeStoredAttribution(firstTouch);
  const path = appendAdPath(readStoredAdPath(), fromUrl);
  writeStoredAdPath(path);
  const fbc = ensureOriginalFbc(fromUrl.fbclid);
  return { firstTouch, current: fromUrl, path, fbc };
}

export function getMetaCookies() {
  const fbp = cookie("_fbp");
  const fbc = ensureOriginalFbc();
  return {
    sessionId: ensureSid(),
    fbp,
    fbc,
  };
}

export function getTrackingContext() {
  const captured = captureAttribution();
  const cookies = getMetaCookies();
  return {
    ...cookies,
    ...captured.firstTouch,
    fbc: captured.fbc || cookies.fbc,
    fbclid: captured.firstTouch.fbclid || (cookies.fbc || "").replace(/^fb\.\d+\.\d+\./, ""),
    adPath: captured.path,
  };
}

export function firePixel(event: string, extra: Record<string, unknown> = {}, eventId?: string) {
  ensureOriginalFbc();
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
    const captured = captureAttribution();
    const cookies = getMetaCookies();
    const payload = {
      ...cookies,
      ...captured.current,
      fbc: captured.fbc || cookies.fbc,
      fbclid: captured.current.fbclid || captured.firstTouch.fbclid,
      adPath: captured.path,
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

    const sendCheckoutToMeta = () => {
      if (!markOnce(productSlug, "CheckoutView")) return;
      postEvent({ eventName: "CheckoutView", eventId: crypto.randomUUID(), ...payload });
      if (!markOnce(productSlug, "InitiateCheckout")) return;
      const checkoutId = crypto.randomUUID();
      firePixel(
        "InitiateCheckout",
        { value: price, currency: "EGP", content_name: contentName, content_ids: [productSlug] },
        checkoutId
      );
      postEvent({ eventName: "InitiateCheckout", eventId: checkoutId, ...payload });
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

    const observers: IntersectionObserver[] = [];
    if ("IntersectionObserver" in window) {
      const watch = (el: Element | null, onHit: () => void, ratio = 0.25) => {
        if (!el) return;
        const observer = new IntersectionObserver(
          (entries) => {
            if (entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= ratio)) {
              onHit();
              observer.disconnect();
            }
          },
          { threshold: [0.2, 0.35, 0.5] }
        );
        observer.observe(el);
        observers.push(observer);
      };

      watch(document.getElementById("order-form") || document.getElementById("price"), sendCheckoutToMeta, 0.2);
      document.querySelectorAll<HTMLElement>("[data-track-section]").forEach((el) => {
        const eventName = el.dataset.trackSection;
        if (eventName) watch(el, () => sendNamed(eventName), 0.2);
      });
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      observers.forEach((observer) => observer.disconnect());
    };
  }, [productSlug, price, contentName, trackFunnel]);

  return null;
}
