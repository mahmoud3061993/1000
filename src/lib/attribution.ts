export type Attribution = {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
  fbclid: string;
};

export type AdTouch = {
  utm_source: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
  fbclid: string;
};

export const ATTR_COOKIE = "elk_attr";
export const AD_PATH_COOKIE = "elk_ads";
export const FBC_LOCK_COOKIE = "elk_fbc";

export function emptyAttribution(): Attribution {
  return {
    utm_source: "",
    utm_medium: "",
    utm_campaign: "",
    utm_content: "",
    utm_term: "",
    fbclid: "",
  };
}

export function emptyTouch(): AdTouch {
  return {
    utm_source: "",
    utm_campaign: "",
    utm_content: "",
    utm_term: "",
    fbclid: "",
  };
}

function readValue(source: URLSearchParams | Record<string, unknown>, key: string) {
  if (source instanceof URLSearchParams) {
    return (source.get(key) || "").trim();
  }
  const value = source[key];
  if (value == null) return "";
  return String(value).trim();
}

export function parseAttribution(source: URLSearchParams | Record<string, unknown>): Attribution {
  return {
    utm_source: readValue(source, "utm_source"),
    utm_medium: readValue(source, "utm_medium"),
    utm_campaign: readValue(source, "utm_campaign") || readValue(source, "campaign_name"),
    utm_content:
      readValue(source, "utm_content") || readValue(source, "ad_name") || readValue(source, "utm_ad"),
    utm_term: readValue(source, "utm_term") || readValue(source, "adset_name"),
    fbclid: readValue(source, "fbclid"),
  };
}

export function toAdTouch(source: Partial<Attribution> | Partial<AdTouch> | null | undefined): AdTouch {
  return {
    utm_source: String(source?.utm_source || "").trim(),
    utm_campaign: String(source?.utm_campaign || "").trim(),
    utm_content: String(source?.utm_content || "").trim(),
    utm_term: String(source?.utm_term || "").trim(),
    fbclid: String(source?.fbclid || "").trim(),
  };
}

export function touchKey(touch: Partial<AdTouch> | null | undefined) {
  const t = toAdTouch(touch);
  if (t.fbclid) return `fb:${t.fbclid}`;
  const named = [t.utm_campaign, t.utm_content, t.utm_term].filter(Boolean).join("|");
  return named;
}

export function isMeaningfulTouch(touch: Partial<AdTouch> | null | undefined) {
  return Boolean(touchKey(touch));
}

export function appendAdPath(
  path: AdTouch[] | null | undefined,
  next: Partial<AdTouch> | Partial<Attribution> | null | undefined
): AdTouch[] {
  const current = Array.isArray(path) ? path.map((item) => toAdTouch(item)) : [];
  const touch = toAdTouch(next);
  if (!isMeaningfulTouch(touch)) return current;
  const last = current[current.length - 1];
  if (last && touchKey(last) === touchKey(touch)) {
    const enriched = toAdTouch(mergeAttribution(last, touch));
    if (
      enriched.utm_campaign !== last.utm_campaign ||
      enriched.utm_content !== last.utm_content ||
      enriched.utm_term !== last.utm_term ||
      enriched.utm_source !== last.utm_source
    ) {
      return [...current.slice(0, -1), enriched];
    }
    return current;
  }
  return [...current, touch];
}

export function parseAdPath(raw: unknown): AdTouch[] {
  if (Array.isArray(raw)) {
    return raw.reduce<AdTouch[]>((path, item) => appendAdPath(path, item as Partial<AdTouch>), []);
  }
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    return parseAdPath(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function serializeAdPath(path: AdTouch[] | null | undefined) {
  const clean = (path || []).map((item) => toAdTouch(item)).filter((item) => isMeaningfulTouch(item));
  return clean.length ? JSON.stringify(clean) : "";
}

export function mergeAdPaths(...paths: Array<AdTouch[] | null | undefined>) {
  return paths.reduce<AdTouch[]>((merged, path) => {
    for (const touch of path || []) merged = appendAdPath(merged, touch);
    return merged;
  }, []);
}

export function mergeAttribution(
  primary: Partial<Attribution> | null | undefined,
  fallback: Partial<Attribution> | null | undefined
): Attribution {
  const left = primary || {};
  const right = fallback || {};
  const out = emptyAttribution();
  (Object.keys(out) as Array<keyof Attribution>).forEach((key) => {
    out[key] = String(left[key] || right[key] || "").trim();
  });
  return out;
}

export function hasNamedAd(attr: Partial<Attribution> | null | undefined) {
  return Boolean(attr?.utm_campaign || attr?.utm_content);
}

export function formatAttribution(attr: {
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  utm_source?: string | null;
  fbclid?: string | null;
  fbc?: string | null;
}) {
  const campaign = (attr.utm_campaign || "").trim();
  const ad = (attr.utm_content || "").trim();
  const adset = (attr.utm_term || "").trim();
  const fromFacebook = Boolean(attr.fbclid || attr.fbc);

  if (campaign && ad) {
    return {
      title: ad,
      detail: adset ? `${campaign} / ${adset}` : campaign,
    };
  }
  if (ad) {
    return { title: ad, detail: campaign || adset || "إعلان مدفوع" };
  }
  if (campaign) {
    return { title: campaign, detail: adset || attr.utm_source || "حملة" };
  }
  if (fromFacebook) {
    return {
      title: "إعلان فيسبوك / إنستجرام",
      detail: "اللينك من غير اسم الإعلان",
    };
  }
  return { title: "رابط مباشر", detail: "مش من إعلان معروف" };
}

export function formatAdPath(path: AdTouch[] | null | undefined, fallback?: Parameters<typeof formatAttribution>[0]) {
  const steps = (path || []).filter((item) => isMeaningfulTouch(item));
  if (!steps.length) {
    const single = formatAttribution(fallback || {});
    return { ...single, steps: single.title === "رابط مباشر" ? [] : [single.title] };
  }
  const labels = steps.map((touch, index) => {
    const formatted = formatAttribution(touch);
    const prefix = index === 0 ? "أول دخول" : index === steps.length - 1 ? "آخر دخول" : `دخول ${index + 1}`;
    return `${index + 1}. ${formatted.title}${formatted.detail ? ` — ${formatted.detail}` : ""} (${prefix})`;
  });
  const first = formatAttribution(steps[0]);
  const last = formatAttribution(steps[steps.length - 1]);
  if (steps.length === 1) {
    return { title: first.title, detail: first.detail, steps: labels };
  }
  return {
    title: `${first.title} ← ${last.title}`,
    detail: `${steps.length} إعلانات بالترتيب: أول دخول ${first.title}، آخر دخول ${last.title}`,
    steps: labels,
  };
}

