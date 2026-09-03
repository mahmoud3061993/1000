import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { describe, it } from "node:test";

const require = createRequire(import.meta.url);
const MLD = require("../extension/shared.js");

const nowSec = Math.floor(Date.now() / 1000);
const fortySevenDaysAgo = nowSec - 47 * 86400;
const tenDaysAgo = nowSec - 10 * 86400;

function samplePayload() {
  return {
    data: {
      ad_library_main: {
        search_results_connection: {
          edges: [
            {
              node: {
                collated_results: [
                  {
                    ad_archive_id: "111",
                    page_name: "Glow Co",
                    page_id: "99",
                    start_date: fortySevenDaysAgo,
                    publisher_platform: ["FACEBOOK", "INSTAGRAM"],
                    snapshot: {
                      page_name: "Glow Co",
                      body: { text: "Get glowing skin in 7 days." },
                      title: "50% off today",
                      cta_text: "Shop now",
                      link_url: "https://example.com",
                      videos: [
                        {
                          video_hd_url: "https://video.fbcdn.net/ad.mp4",
                          video_sd_url: "https://video.fbcdn.net/ad-sd.mp4",
                        },
                      ],
                    },
                  },
                  {
                    adArchiveID: "222",
                    pageName: "Glow Co",
                    pageID: "99",
                    startDate: tenDaysAgo,
                    snapshot: {
                      page_name: "Glow Co",
                      body: { text: "New serum drop." },
                      images: [{ original_image_url: "https://scontent.fbcdn.net/ad.jpg" }],
                    },
                  },
                  {
                    ad_archive_id: "333",
                    page_name: "Other Brand",
                    start_date: fortySevenDaysAgo,
                    snapshot: {
                      videos: [{ video_hd_url: "https://video.fbcdn.net/stream.m3u8" }],
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    },
  };
}

describe("Meta Library Downloader parsers", () => {
  it("pulls ads from nested GraphQL using snake_case and camelCase", () => {
    const ads = MLD.adsFromPayload(samplePayload());
    const ids = ads.map((ad) => ad.id).sort();
    assert.deepEqual(ids, ["111", "222", "333"]);
    const glow = ads.find((ad) => ad.id === "111");
    assert.equal(glow.pageName, "Glow Co");
    assert.equal(glow.media[0].kind, "video");
    assert.equal(glow.media[0].url, "https://video.fbcdn.net/ad.mp4");
    assert.equal(glow.title, "50% off today");
  });

  it("marks 30+ day ads as winners and leaves newer ads unmarked", () => {
    const ads = MLD.adsFromPayload(samplePayload());
    assert.equal(ads.find((ad) => ad.id === "111").isWinner, true);
    assert.ok(ads.find((ad) => ad.id === "111").days >= 46);
    assert.equal(ads.find((ad) => ad.id === "222").isWinner, false);
  });

  it("prefers a clean MP4 over an HLS stream", () => {
    assert.equal(
      MLD.pickVideoUrl({
        video_hd_url: "https://cdn.example/ad.m3u8",
        video_sd_url: "https://cdn.example/ad.mp4",
      }),
      "https://cdn.example/ad.mp4"
    );
    assert.equal(MLD.isStreamUrl("https://cdn.example/ad.m3u8"), true);
    assert.equal(MLD.isStreamUrl("https://cdn.example/ad.mp4"), false);
  });

  it("builds a spy-on-page playbook per advertiser", () => {
    const ads = MLD.adsFromPayload(samplePayload());
    const groups = MLD.groupByAdvertiser(ads);
    assert.equal(groups[0].pageName, "Glow Co");
    assert.equal(groups[0].adCount, 2);
    assert.equal(groups[0].winners, 1);
    assert.equal(groups[0].video, 1);
    assert.equal(groups[0].image, 1);
    assert.equal(groups[0].topCreative.id, "111");
  });

  it("exports CSV with advertiser, copy, library id, media, and days", () => {
    const ads = MLD.adsFromPayload(samplePayload());
    const csv = MLD.adsToCsv(ads);
    assert.equal(csv.charCodeAt(0), 0xfeff);
    const body = csv.replace(/^\uFEFF/, "");
    assert.match(body, /Advertiser,Page ID,Library ID,Days Running,Winner/);
    assert.match(body, /Glow Co,99,111,/);
    assert.match(body, /Get glowing skin in 7 days/);
    assert.match(body, /50% off today/);
    assert.match(body, /Shop now/);
    assert.match(body, /https:\/\/example.com/);
    assert.match(body, /https:\/\/video\.fbcdn\.net\/ad\.mp4/);
    assert.match(body, /yes/);
  });

  it("names files from the advertiser and library id", () => {
    const ad = {
      pageName: "Glow Co: Winter / Sale?",
      id: "111",
      media: [{ kind: "video", url: "https://cdn.example/ad.mp4" }],
    };
    assert.equal(MLD.filenameFor(ad, ad.media[0], 0), "Glow_Co_Winter_Sale_111.mp4");
  });

  it("parses Library ID and start dates from Ad Library card text", () => {
    assert.equal(MLD.parseLibraryId("See ad details\nLibrary ID: 555001"), "555001");
    const start = MLD.parseStartDate("Started running on Jan 1, 2024");
    assert.equal(new Date(start).getFullYear(), 2024);
  });

  it("keeps GraphQL copy when merging a messy DOM scrape", () => {
    const graphql = MLD.normalizeAd({
      ad_archive_id: "111",
      page_name: "Glow Co",
      start_date: fortySevenDaysAgo,
      snapshot: { body: { text: "Get glowing skin in 7 days." }, videos: [{ video_hd_url: "https://cdn.example/ad.mp4" }] },
    });
    const scrape = MLD.normalizeAd({
      ad_archive_id: "111",
      page_name: "Glow Co",
      snapshot: { body: { text: "Glow Co\nSee ad details\nLibrary ID: 111" } },
    });
    const merged = MLD.mergeAd(scrape, graphql);
    assert.equal(merged.body, "Get glowing skin in 7 days.");
    assert.equal(merged.media[0].url, "https://cdn.example/ad.mp4");
    assert.equal(merged.isWinner, true);
  });

  it("strips Facebook's for (;;); JSON prefix", () => {
    const ads = MLD.adsFromPayload(`for (;;);${JSON.stringify(samplePayload())}`);
    assert.equal(ads.length, 3);
  });

  it("reads primary text, headline, and CTA from carousel cards when the top snapshot is empty", () => {
    const ad = MLD.normalizeAd({
      ad_archive_id: "444",
      page_name: "Glow Co",
      snapshot: {
        cards: [
          {
            body: "Get glowing skin in 7 days.",
            title: "50% off today",
            cta_text: "Shop now",
            link_url: "https://glow.example/offer",
          },
        ],
      },
    });
    assert.equal(ad.body, "Get glowing skin in 7 days.");
    assert.equal(ad.title, "50% off today");
    assert.equal(ad.cta, "Shop now");
    assert.equal(ad.link, "https://glow.example/offer");
  });

  it("humanizes GraphQL CTA types and ignores zero-width Ad Library chrome", () => {
    assert.equal(MLD.humanizeCta("SHOP_NOW"), "Shop now");
    const copy = MLD.parseCardCopy(
      "Glow Co\nActive\n\u200b\u200b\nStarted running on Jan 2, 2026\nFacebook · Instagram\nGet glowing skin in 7 days.\n50% off today\nShop now\nSee ad details\nLibrary ID: 111",
      "Glow Co"
    );
    assert.equal(copy.body, "Get glowing skin in 7 days.");
    assert.equal(copy.title, "50% off today");
    assert.equal(copy.cta, "Shop now");
    assert.equal(copy.status, "Active");
    assert.equal(MLD.isUsableCopy("\u200b\u200b"), false);
    assert.equal(MLD.isUsableCopy("Active"), false);
  });

  it("drops a chrome-only scrape when merging real ad copy", () => {
    const graphql = MLD.normalizeAd({
      ad_archive_id: "111",
      page_name: "Glow Co",
      start_date: fortySevenDaysAgo,
      snapshot: {
        body: { text: "Get glowing skin in 7 days." },
        title: "50% off today",
        cta_text: "Shop now",
        videos: [{ video_hd_url: "https://cdn.example/ad.mp4" }],
      },
    });
    const scrape = MLD.normalizeAd({
      ad_archive_id: "111",
      page_name: "Glow Co",
      snapshot: { body: { text: "\u200bActive\u200b" } },
    });
    const merged = MLD.mergeAd(scrape, graphql);
    assert.equal(merged.body, "Get glowing skin in 7 days.");
    assert.equal(merged.title, "50% off today");
    assert.equal(merged.cta, "Shop now");
  });

  it("keeps only the ad copy after Sponsored and drops extension/chrome text", () => {
    const copy = MLD.parseCardCopy(
      [
        "عيادة جراحات مجرى البول",
        "Sponsored",
        "إبعد 40 سنة بدون علاج مجرى البول",
        "😊 الحمدلله",
        "https://ayman-moussa.com",
        "01023513542",
        "إصلاح قطع في مجرى البول",
        "See ad details",
        "Library ID: 999",
      ].join("\n"),
      "عيادة جراحات مجرى البول"
    );
    assert.match(copy.body, /إبعد 40 سنة/);
    assert.match(copy.body, /إصلاح قطع/);
    assert.equal(copy.body.includes("عيادة جراحات"), false);
    assert.equal(copy.body.includes("Sponsored"), false);
    assert.equal(copy.body.includes("Library ID"), false);
  });

  it("also uses Open Drop-down as a cutoff", () => {
    const copy = MLD.parseCardCopy(
      [
        "11d",
        "Copy brief",
        "Offer",
        "Spy",
        "Open Drop-down",
        "خصم علي اي بدلة او اي بليزر 50%",
        "بمناسبه افتتاح أحدث فروع أراك",
        "See ad details",
        "Library ID: 999",
      ].join("\n"),
      "أراك"
    );
    assert.match(copy.body, /خصم علي اي بدلة/);
    assert.equal(copy.body.includes("Copy brief"), false);
    assert.equal(copy.body.includes("11d"), false);
    assert.equal(
      MLD.unwrapFacebookLink("https://l.facebook.com/l.php?u=https%3A%2F%2Fglow.example%2Foffer"),
      "https://glow.example/offer"
    );
  });

  it("parses advertiser watch input from a Page ID or Ad Library URL", () => {
    assert.equal(MLD.parseWatchInput("123456789012345").pageId, "123456789012345");
    const fromUrl = MLD.parseWatchInput(
      "https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&view_all_page_id=98765&search_type=page"
    );
    assert.equal(fromUrl.pageId, "98765");
    const ids = MLD.extractAdIdsFromHtml('{"ad_archive_id":"111","page_name":"Arak","adArchiveID":"222"}');
    assert.deepEqual(ids, ["111", "222"]);
    assert.equal(MLD.extractPageNameFromHtml('"page_name":"Arak"'), "Arak");
  });
});
