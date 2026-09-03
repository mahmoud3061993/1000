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
    assert.match(csv, /Advertiser,Page ID,Library ID,Days Running,Winner/);
    assert.match(csv, /Glow Co,99,111,/);
    assert.match(csv, /Get glowing skin in 7 days/);
    assert.match(csv, /https:\/\/video\.fbcdn\.net\/ad\.mp4/);
    assert.match(csv, /yes/);
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
});
