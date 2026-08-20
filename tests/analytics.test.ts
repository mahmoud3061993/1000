import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  addCalendarDays,
  buildAnalyticsReport,
  cairoYmd,
  parseAnalyticsPeriod,
  percentChange,
  periodRange,
} from "../src/lib/analytics";

describe("admin analytics periods", () => {
  const now = new Date("2026-08-18T15:00:00.000Z");

  it("parses day/week/month and defaults to week", () => {
    assert.equal(parseAnalyticsPeriod("day"), "day");
    assert.equal(parseAnalyticsPeriod("month"), "month");
    assert.equal(parseAnalyticsPeriod("nope"), "week");
  });

  it("uses Cairo calendar days for today, 7 days, and 30 days", () => {
    const today = cairoYmd(now);
    const day = periodRange("day", now);
    assert.equal(day.days, 1);
    assert.equal(day.fromYmd, today);
    assert.equal(day.toYmdExclusive, addCalendarDays(today, 1));

    const week = periodRange("week", now);
    assert.equal(week.days, 7);
    assert.equal(week.fromYmd, addCalendarDays(today, -6));
    assert.equal(week.previousTo, week.from);

    const month = periodRange("month", now);
    assert.equal(month.days, 30);
    assert.equal(month.fromYmd, addCalendarDays(today, -29));
  });

  it("counts closed orders, waiting payments, and income in the selected window", () => {
    const range = periodRange("week", now);
    const inCurrent = new Date(Date.parse(range.from) + 2 * 60 * 60 * 1000).toISOString();
    const inPrevious = new Date(Date.parse(range.previousFrom) + 2 * 60 * 60 * 1000).toISOString();
    const report = buildAnalyticsReport({
      period: "week",
      now,
      openPipeline: 2,
      visits: [
        { session_id: "s1", created_at: inCurrent },
        { session_id: "s1", created_at: inCurrent },
        { session_id: "s2", created_at: inCurrent },
        { session_id: "s9", created_at: inPrevious },
      ],
      orders: [
        {
          id: "paid-now",
          status: "paid",
          payment_method: "kashier",
          amount: 235,
          created_at: inCurrent,
          paid_at: inCurrent,
        },
        {
          id: "paid-later",
          status: "paid",
          payment_method: "instapay",
          amount: 235,
          created_at: inPrevious,
          paid_at: inCurrent,
        },
        {
          id: "waiting",
          status: "awaiting_payment",
          payment_method: "kashier",
          amount: 235,
          created_at: inCurrent,
          paid_at: null,
        },
        {
          id: "review",
          status: "pending_review",
          payment_method: "instapay",
          amount: 235,
          created_at: inCurrent,
          paid_at: null,
        },
        {
          id: "old-paid",
          status: "paid",
          payment_method: "kashier",
          amount: 235,
          created_at: inPrevious,
          paid_at: inPrevious,
        },
      ],
    });

    assert.equal(report.current.closed, 2);
    assert.equal(report.current.income, 470);
    assert.equal(report.current.waiting, 2);
    assert.equal(report.current.pendingReview, 1);
    assert.equal(report.current.leads, 3);
    assert.equal(report.current.uniqueVisitors, 2);
    assert.equal(report.current.instapayClosed, 1);
    assert.equal(report.current.kashierClosed, 1);
    assert.equal(report.previous.closed, 1);
    assert.equal(report.previous.income, 235);
    assert.equal(report.change.income, 100);
    assert.equal(report.openPipeline, 2);
    assert.equal(report.series.length, 7);
    assert.match(report.insight, /اتقفل 2 طلب/);
    assert.match(report.insight, /470/);
    assert.equal(report.sources.length >= 1, true);
    assert.equal(report.funnel.opens, 2);
    assert.equal(report.funnel.purchased, 2);
  });

  it("counts landing funnel unique sessions for scroll and checkout", () => {
    const range = periodRange("week", now);
    const inCurrent = new Date(Date.parse(range.from) + 2 * 60 * 60 * 1000).toISOString();
    const report = buildAnalyticsReport({
      period: "week",
      now,
      product: "plant",
      visits: [
        { session_id: "a", created_at: inCurrent, product_slug: "plant" },
        { session_id: "b", created_at: inCurrent, product_slug: "plant" },
        { session_id: "c", created_at: inCurrent, product_slug: "1000" },
      ],
      events: [
        { session_id: "a", name: "Scroll50", created_at: inCurrent, product_slug: "plant" },
        { session_id: "a", name: "CheckoutView", created_at: inCurrent, product_slug: "plant" },
        { session_id: "b", name: "Scroll50", created_at: inCurrent, product_slug: "plant" },
      ],
      orders: [
        {
          id: "p1",
          status: "paid",
          payment_method: "kashier",
          amount: 350,
          created_at: inCurrent,
          paid_at: inCurrent,
          product_slug: "plant",
        },
      ],
    });
    assert.equal(report.funnel.opens, 2);
    assert.equal(report.funnel.scroll50, 2);
    assert.equal(report.funnel.reachedPay, 1);
    assert.equal(report.funnel.leads, 1);
    assert.equal(report.funnel.purchased, 1);
    assert.equal(report.current.closed, 1);
    assert.equal(report.current.income, 350);
  });

  it("breaks the plant funnel down by ad and landing section", () => {
    const range = periodRange("week", now);
    const inCurrent = new Date(Date.parse(range.from) + 2 * 60 * 60 * 1000).toISOString();
    const report = buildAnalyticsReport({
      period: "week",
      now,
      product: "plant",
      visits: [
        {
          session_id: "ad1",
          created_at: inCurrent,
          product_slug: "plant",
          utm_campaign: "plant-sales",
          utm_content: "video-a",
        },
        {
          session_id: "ad2",
          created_at: inCurrent,
          product_slug: "plant",
          utm_campaign: "plant-sales",
          utm_content: "video-b",
        },
      ],
      events: [
        { session_id: "ad1", name: "Scroll50", created_at: inCurrent, product_slug: "plant" },
        { session_id: "ad1", name: "SectionTools", created_at: inCurrent, product_slug: "plant" },
        { session_id: "ad1", name: "CheckoutView", created_at: inCurrent, product_slug: "plant" },
        { session_id: "ad2", name: "Scroll25", created_at: inCurrent, product_slug: "plant" },
      ],
      orders: [
        {
          id: "paid-ad",
          session_id: "ad1",
          status: "paid",
          payment_method: "kashier",
          amount: 350,
          created_at: inCurrent,
          paid_at: inCurrent,
          product_slug: "plant",
          utm_campaign: "plant-sales",
          utm_content: "video-a",
        },
        {
          id: "wait-ad",
          session_id: "ad2",
          status: "awaiting_payment",
          payment_method: "kashier",
          amount: 350,
          created_at: inCurrent,
          paid_at: null,
          product_slug: "plant",
          utm_campaign: "plant-sales",
          utm_content: "video-b",
        },
      ],
    });
    assert.equal(report.funnel.waiting, 1);
    assert.equal(report.funnel.sections.find((section) => section.event === "SectionTools")?.count, 1);
    const videoA = report.sources.find((source) => source.title === "video-a");
    const videoB = report.sources.find((source) => source.title === "video-b");
    assert.equal(videoA?.opens, 1);
    assert.equal(videoA?.reachedPay, 1);
    assert.equal(videoA?.closed, 1);
    assert.equal(videoB?.opens, 1);
    assert.equal(videoB?.waiting, 1);
    assert.equal(videoB?.closed, 0);
  });

  it("treats a jump from zero as 100 percent", () => {
    assert.equal(percentChange(10, 0), 100);
    assert.equal(percentChange(0, 0), 0);
    assert.equal(percentChange(50, 100), -50);
  });
});
