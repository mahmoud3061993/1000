import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const webApk = join(root, "..", "public", "spend", "masaref.apk");
const distApk = join(root, "dist", "masaref.apk");
const htmlZip = join(root, "..", "public", "spend", "masaref-html.zip");
const apkZip = join(root, "..", "public", "spend", "masaref-android.zip");
const filesPage = join(root, "..", "public", "spend", "files.html");

test("masaref build keeps the APK and packs downloadable zips", () => {
  mkdirSync(dirname(webApk), { recursive: true });
  const marker = existsSync(webApk) ? readFileSync(webApk) : Buffer.from("masaref-apk-keep-test");
  if (!existsSync(webApk)) writeFileSync(webApk, marker);

  const result = spawnSync(process.execPath, [join(root, "scripts", "build.mjs")], {
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(existsSync(webApk), true, "public/spend/masaref.apk missing after build");
  assert.equal(existsSync(distApk), true, "masaref/dist/masaref.apk missing after build");
  assert.deepEqual(readFileSync(webApk), marker);
  assert.deepEqual(readFileSync(distApk), marker);
  assert.equal(existsSync(htmlZip), true, "masaref-html.zip missing");
  assert.equal(existsSync(apkZip), true, "masaref-android.zip missing");
  assert.equal(existsSync(filesPage), true, "files.html missing");
  const listing = execFileSync("python3", ["-m", "zipfile", "-l", htmlZip], { encoding: "utf8" });
  assert.match(listing, /index\.html/);
  assert.match(listing, /files\.html/);
  assert.doesNotMatch(listing, /masaref\.apk/);
});
