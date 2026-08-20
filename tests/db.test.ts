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

  it("stores campaign and ad names on the order", async () => {
    await db.insertVisit({
      id: "v-ad",
      session_id: "s-ad",
      utm_campaign: "ramadan",
      utm_content: "video-1",
      fbclid: "click1",
    });
    const fromVisit = await db.getSessionAttribution("s-ad");
    assert.equal(fromVisit?.utm_campaign, "ramadan");
    assert.equal(fromVisit?.utm_content, "video-1");

    await db.createOrder({
      session_id: "s-ad",
      id: "o-ad",
      name: "عميل",
      email: "ad@b.com",
      phone: "01000000001",
      amount: 235,
      currency: "EGP",
      payment_method: "instapay",
      status: "pending_review",
      kashier_order_id: null,
      kashier_transaction_id: null,
      instapay_screenshot: null,
      purchase_event_id: null,
      fbp: null,
      fbc: null,
      utm_campaign: "ramadan",
      utm_content: "video-1",
      fbclid: "click1",
      ip: null,
      user_agent: null,
      created_at: new Date().toISOString(),
    });
    const listed = await db.listOrders({ q: "video-1" });
    assert.equal(listed.some((order) => order.id === "o-ad"), true);
    assert.equal(listed.find((order) => order.id === "o-ad")?.utm_content, "video-1");
  });

  it("deletes an old order from admin", async () => {
    await db.createOrder({
      session_id: "s-del",
      id: "o-del",
      name: "قديم",
      email: "old@b.com",
      phone: "01000000002",
      amount: 235,
      currency: "EGP",
      payment_method: "kashier",
      status: "failed",
      kashier_order_id: null,
      kashier_transaction_id: null,
      instapay_screenshot: null,
      purchase_event_id: null,
      fbp: null,
      fbc: null,
      ip: null,
      user_agent: null,
      created_at: new Date().toISOString(),
    });
    assert.equal(Boolean(await db.getOrder("o-del")), true);
    assert.equal(await db.deleteOrder("o-del"), true);
    assert.equal(await db.getOrder("o-del"), undefined);
    assert.equal(await db.deleteOrder("missing"), false);
  });

  it("uses /tmp for SQLite on Vercel when Turso is not configured", () => {
    const url = db.resolveDatabaseUrl({ VERCEL: "1" });
    assert.equal(url.startsWith("file:/tmp/"), true);
  });

  it("stores whether the purchase email was sent", async () => {
    await db.createOrder({
      session_id: "s-mail",
      id: "o-mail",
      name: "عميل",
      email: "mail@b.com",
      phone: "01000000003",
      amount: 235,
      currency: "EGP",
      payment_method: "kashier",
      status: "awaiting_payment",
      kashier_order_id: null,
      kashier_transaction_id: null,
      instapay_screenshot: null,
      purchase_event_id: null,
      fbp: null,
      fbc: null,
      ip: null,
      user_agent: null,
      created_at: new Date().toISOString(),
    });
    const paid = await db.markOrderPaid("o-mail");
    assert.equal(paid?.email_sent_at ?? null, null);
    const stamped = await db.updateOrder("o-mail", { email_sent_at: "2026-08-18T10:00:00.000Z" });
    assert.equal(stamped?.email_sent_at, "2026-08-18T10:00:00.000Z");
    const listed = await db.listOrders({ status: "paid" });
    assert.equal(listed.find((order) => order.id === "o-mail")?.email_sent_at, "2026-08-18T10:00:00.000Z");
  });

  it("filters orders and funnel stats by product", async () => {
    await db.createOrder({
      id: "o-plant",
      session_id: "s-plant",
      name: "نبات",
      email: "plant@b.com",
      phone: "01000000003",
      amount: 449,
      currency: "EGP",
      product_slug: "plant",
      payment_method: "kashier",
      status: "paid",
      kashier_order_id: null,
      kashier_transaction_id: null,
      instapay_screenshot: null,
      purchase_event_id: null,
      fbp: null,
      fbc: null,
      ip: null,
      user_agent: null,
      created_at: new Date().toISOString(),
      paid_at: new Date().toISOString(),
    });

    const plantOrders = await db.listOrders({ product: "plant" });
    assert.equal(plantOrders.some((order) => order.id === "o-plant"), true);
    assert.equal(plantOrders.every((order) => (order.product_slug || "1000") === "plant"), true);

    const adsOrders = await db.listOrders({ product: "1000" });
    assert.equal(adsOrders.some((order) => order.id === "o-plant"), false);

    const plantStats = await db.getFunnelStats("plant");
    assert.equal(plantStats.paid >= 1, true);
    assert.equal(plantStats.revenue >= 449, true);
  });
});
