export type Attribution = {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
  fbclid: string;
};

export const ATTR_COOKIE = "elk_attr";

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
