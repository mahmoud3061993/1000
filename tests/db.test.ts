import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, describe, it } from "node:test";

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "elkousy-db-"));
process.env.APP_DB_PATH = path.join(tmpDir, "test.db");

describe("order funnel and payment states", async () => {
  const db = await import("../src/lib/db");

  after(async () => {
    await db.closeDb();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("counts visits, form fills, trying to pay, and paid orders", async () => {
    await db.insertVisit({ id: "v1", session_id: "s1" });
    await db.insertVisit({ id: "v2", session_id: "s1" });
    await db.insertVisit({ id: "v3", session_id: "s2" });

    const base = {
      session_id: "s1",
      name: "عميل",
      email: "a@b.com",
      phone: "01000000000",
      amount: 235,
      currency: "EGP",
      kashier_order_id: null,
      kashier_transaction_id: null,
      instapay_screenshot: null,
      purchase_event_id: null,
      fbp: null,
      fbc: null,
      ip: null,
      user_agent: null,
      created_at: new Date().toISOString(),
    } as const;

    await db.createOrder({
      ...base,
      id: "o1",
      payment_method: "kashier",
      status: "awaiting_payment",
    });
    await db.createOrder({
      ...base,
      id: "o2",
      session_id: "s2",
      payment_method: "instapay",
      status: "pending_review",
    });
    await db.createOrder({
      ...base,
      id: "o3",
      session_id: "s3",
      payment_method: "kashier",
      status: "form_filled",
    });

    await db.markOrderPaid("o1");
    const again = await db.markOrderPaid("o1");
    assert.equal(again?.status, "paid");

    const stats = await db.getFunnelStats();
    assert.equal(stats.visits, 3);
    assert.equal(stats.uniqueVisitors, 2);
    assert.equal(stats.formFilled, 3);
    assert.equal(stats.tryingToPay, 1);
    assert.equal(stats.paid, 1);
    assert.equal(stats.pendingReview, 1);
    assert.equal(stats.revenue, 235);
  });

  it("stores admin payment settings for Instapay and Kashier", async () => {
    await db.setSettings({
      instapay_number: "01017420379",
      kashier_mid: "MID-22-22",
      kashier_api_key: "k-secret",
    });
    const stored = await db.getSettings();
    assert.equal(stored.instapay_number, "01017420379");
    assert.equal(stored.kashier_mid, "MID-22-22");
    assert.equal(stored.kashier_api_key, "k-secret");
  });

  it("uses /tmp for SQLite on Vercel when Turso is not configured", () => {
    const url = db.resolveDatabaseUrl({ VERCEL: "1" });
    assert.equal(url.startsWith("file:/tmp/"), true);
  });
});
