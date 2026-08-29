import assert from "node:assert/strict";
import test from "node:test";
import { buildOfflineHtml } from "../scripts/build-offline.mjs";
import { isOfflineHtml, offlineHtmlUrl } from "../src/js/utils.js";

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
  } finally {
    globalThis.ARABITY_OFFLINE_FILE = prevFlag;
    globalThis.location = prevLoc;
  }
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
