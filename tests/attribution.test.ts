import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  appendAdPath,
  formatAdPath,
  formatAttribution,
  mergeAdPaths,
  mergeAttribution,
  parseAdPath,
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

  it("keeps every ad in order when the visitor hits more than one", () => {
    const path = mergeAdPaths(
      [],
      [
        { utm_source: "facebook", utm_campaign: "car-a", utm_content: "فيديو 1", utm_term: "lookalike", fbclid: "click-a" },
      ]
    );
    const withSecond = appendAdPath(path, {
      utm_source: "facebook",
      utm_campaign: "car-b",
      utm_content: "كروسل 2",
      utm_term: "retarget",
      fbclid: "click-b",
    });
    assert.equal(withSecond.length, 2);
    assert.equal(withSecond[0].utm_content, "فيديو 1");
    assert.equal(withSecond[1].utm_content, "كروسل 2");
    const labeled = formatAdPath(withSecond);
    assert.match(labeled.title, /فيديو 1/);
    assert.match(labeled.title, /كروسل 2/);
    assert.equal(labeled.steps.length, 2);
    assert.match(labeled.steps[0], /أول دخول/);
    assert.match(labeled.steps[1], /آخر دخول/);
  });

  it("does not duplicate the same Facebook click, but fills in the ad name later", () => {
    const first = appendAdPath([], { fbclid: "click-a" });
    const named = appendAdPath(first, {
      fbclid: "click-a",
      utm_campaign: "car-a",
      utm_content: "فيديو 1",
    });
    assert.equal(named.length, 1);
    assert.equal(named[0].utm_content, "فيديو 1");
  });

  it("parses a stored ad path JSON from the order row", () => {
    const raw = JSON.stringify([
      { utm_content: "ad-1", utm_campaign: "c1", fbclid: "a" },
      { utm_content: "ad-2", utm_campaign: "c2", fbclid: "b" },
    ]);
    const path = parseAdPath(raw);
    assert.equal(path.length, 2);
    assert.equal(path[1].utm_content, "ad-2");
  });
});
