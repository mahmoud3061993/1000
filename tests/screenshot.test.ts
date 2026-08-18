import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseStoredScreenshot, validateScreenshotFile } from "../src/lib/screenshot";

describe("screenshot storage for Vercel", () => {
  it("round-trips a data URL screenshot", () => {
    const buffer = Buffer.from("hello-image");
    const stored = `data:image/png;base64,${buffer.toString("base64")}`;
    const parsed = parseStoredScreenshot(stored);
    assert.equal(parsed?.mime, "image/png");
    assert.equal(parsed?.buffer.toString(), "hello-image");
  });

  it("returns null when empty", () => {
    assert.equal(parseStoredScreenshot(null), null);
    assert.equal(parseStoredScreenshot(""), null);
  });

  it("rejects missing or tiny screenshots", () => {
    assert.equal(validateScreenshotFile(null).ok, false);
    assert.equal(validateScreenshotFile("not-a-file").ok, false);
  });
});
