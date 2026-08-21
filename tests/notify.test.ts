import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deriveNtfyTopic, ntfySubscribeUrl, resolveNtfyTopic, sanitizeNtfyTopic } from "../src/lib/notify";

describe("mobile ntfy alerts", () => {
  it("keeps only ntfy-safe topic characters", () => {
    assert.equal(sanitizeNtfyTopic("elkousy alerts!!"), "elkousyalerts");
    assert.equal(sanitizeNtfyTopic("elkousy-orders_1"), "elkousy-orders_1");
  });

  it("derives a stable topic from the site URL and secret", () => {
    const env = { SITE_URL: "https://www.producthelpyou.online", SESSION_SECRET: "secret-a" };
    const first = deriveNtfyTopic(env);
    const second = deriveNtfyTopic(env);
    assert.equal(first, second);
    assert.match(first, /^elkousy-[a-f0-9]{20}$/);
    assert.notEqual(first, deriveNtfyTopic({ ...env, SESSION_SECRET: "secret-b" }));
  });

  it("lets NTFY_TOPIC override the derived channel", () => {
    const topic = resolveNtfyTopic(
      { SITE_URL: "https://example.com", NTFY_TOPIC: "my-store-alerts" },
      { ntfy_topic: "from-db" }
    );
    assert.equal(topic, "my-store-alerts");
    assert.equal(
      resolveNtfyTopic({ SITE_URL: "https://example.com" }, { ntfy_topic: "from-db" }),
      "from-db"
    );
  });

  it("builds a phone subscribe URL", () => {
    assert.equal(ntfySubscribeUrl("elkousy-abc"), "https://ntfy.sh/elkousy-abc");
  });
});
