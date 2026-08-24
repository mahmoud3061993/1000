import assert from "node:assert/strict";
import test from "node:test";
import { buildOfflineHtml } from "../scripts/build-offline.mjs";
import { androidApkUrl, guideHtmlUrl, isOfflineHtml, offlineHtmlUrl } from "../src/js/utils.js";

test("offline html url on hosted /car", () => {
  const prevFlag = globalThis.ARABITY_OFFLINE_FILE;
  const prevLoc = globalThis.location;
  globalThis.ARABITY_OFFLINE_FILE = false;
  globalThis.location = { protocol: "https:", pathname: "/car" };
  try {
    assert.equal(isOfflineHtml(), false);
    assert.equal(offlineHtmlUrl(), "/car/arabity-offline.html");
  } finally {
    globalThis.ARABITY_OFFLINE_FILE = prevFlag;
    globalThis.location = prevLoc;
  }
});

test("offline html url is empty inside the single file", () => {
  const prevFlag = globalThis.ARABITY_OFFLINE_FILE;
  const prevLoc = globalThis.location;
  globalThis.ARABITY_OFFLINE_FILE = true;
  globalThis.location = { protocol: "file:", pathname: "/tmp/عربيتي.html" };
  try {
    assert.equal(isOfflineHtml(), true);
    assert.equal(offlineHtmlUrl(), "");
    assert.equal(androidApkUrl(), "https://www.producthelpyou.online/car/arabity.apk");
  } finally {
    globalThis.ARABITY_OFFLINE_FILE = prevFlag;
    globalThis.location = prevLoc;
  }
});

test("android apk url on hosted /car", () => {
  const prevFlag = globalThis.ARABITY_OFFLINE_FILE;
  const prevLoc = globalThis.location;
  globalThis.ARABITY_OFFLINE_FILE = false;
  globalThis.location = { protocol: "https:", pathname: "/car/" };
  try {
    assert.equal(androidApkUrl(), "/car/arabity.apk");
    assert.equal(guideHtmlUrl(), "/car/guide.html");
  } finally {
    globalThis.ARABITY_OFFLINE_FILE = prevFlag;
    globalThis.location = prevLoc;
  }
});

test("user guide html explains install and daily use", async () => {
  const { readFile } = await import("node:fs/promises");
  const { dirname, join } = await import("node:path");
  const { fileURLToPath } = await import("node:url");
  const src = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "guide.html");
  const html = await readFile(src, "utf8");
  assert.match(html, /تثبيت التطبيق على الموبايل/);
  assert.match(html, /arabity\.apk/);
  assert.match(html, /تفويلة كاملة/);
  assert.match(html, /النسخ الاحتياطي/);
  assert.doesNotMatch(html, /https:\/\/fonts\.google/);
});

test("offline html is a self-contained file", async () => {
  const html = await buildOfflineHtml();
  assert.match(html, /عربيتي/);
  assert.match(html, /ARABITY_OFFLINE_FILE/);
  assert.match(html, /<style>/);
  assert.match(html, /indexedDB/);
  assert.doesNotMatch(html, /src="js\/app\.js"/);
  assert.doesNotMatch(html, /href="\/car\//);
  assert.doesNotMatch(html, /type="module"/);
  assert.doesNotMatch(html, /manifest\.json/);
  assert.ok(html.includes("<script>"));
  assert.ok(html.length > 50_000);
});
