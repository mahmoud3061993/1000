import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatAttribution,
  mergeAttribution,
  parseAttribution,
} from "../src/lib/attribution";

describe("order ad attribution", () => {
  it("reads campaign and ad names from landing URL params", () => {
    const attr = parseAttribution(
      new URLSearchParams(
        "utm_source=facebook&utm_campaign=offers&utm_content=video-ad&utm_term=lookalike&fbclid=abc123"
      )
    );
    assert.equal(attr.utm_campaign, "offers");
    assert.equal(attr.utm_content, "video-ad");
    assert.equal(attr.utm_term, "lookalike");
    assert.equal(attr.fbclid, "abc123");
  });

  it("keeps the first ad and fills missing fields later", () => {
    const first = parseAttribution(new URLSearchParams("utm_campaign=first&utm_content=ad-a"));
    const second = parseAttribution(new URLSearchParams("utm_campaign=second&utm_term=adset-2"));
    const merged = mergeAttribution(first, second);
    assert.equal(merged.utm_campaign, "first");
    assert.equal(merged.utm_content, "ad-a");
    assert.equal(merged.utm_term, "adset-2");
  });

  it("shows a readable admin label for named ads and Facebook clicks", () => {
    const named = formatAttribution({
      utm_campaign: "عروض رمضان",
      utm_content: "إعلان فيديو 1",
      utm_term: "اهتمامات",
    });
    assert.equal(named.title, "إعلان فيديو 1");
    assert.match(named.detail, /عروض رمضان/);

    const facebookOnly = formatAttribution({ fbclid: "xyz", fbc: "fb.1.1.xyz" });
    assert.match(facebookOnly.title, /فيسبوك/);

    const direct = formatAttribution({});
    assert.match(direct.title, /مباشر/);
  });
});
