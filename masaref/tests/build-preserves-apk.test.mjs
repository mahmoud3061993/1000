import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const webApk = join(root, "..", "public", "spend", "masaref.apk");
const distApk = join(root, "dist", "masaref.apk");

test("masaref build keeps the APK after wiping public/spend", () => {
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
});
