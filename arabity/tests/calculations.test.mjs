import assert from "node:assert/strict";
import test from "node:test";
import { fullToFullConsumption, costPerKm, maintenanceStatus, documentStatus } from "../src/js/calculations.js";
import { careScore } from "../src/js/scoring.js";
import { moneyNumber as mn, pctChange, round } from "../src/js/utils.js";

test("money rounding avoids float noise", () => {
  assert.equal(mn(0.1 + 0.2), 0.3);
  assert.equal(mn(10.1 + 0.2), 10.3);
});

test("cost per km never divides by zero", () => {
  assert.equal(costPerKm(100, 0), null);
  assert.equal(costPerKm(100, 20), 5);
});

test("full-to-full needs two complete fills", () => {
  const one = fullToFullConsumption([{ id: "a", isFull: true, odometer: 1000, liters: 40, total: 600, date: "2026-01-01" }]);
  assert.equal(one.ready, false);
  const two = fullToFullConsumption([
    { id: "a", isFull: true, odometer: 1000, liters: 40, total: 600, date: "2026-01-01" },
    { id: "b", isFull: true, odometer: 1500, liters: 40, total: 600, date: "2026-01-15" },
  ]);
  assert.equal(two.ready, true);
  assert.equal(two.samples[0].kmL, 12.5);
});

test("incomplete fill is ignored for consumption", () => {
  const r = fullToFullConsumption([
    { id: "a", isFull: true, odometer: 1000, liters: 40, date: "2026-01-01" },
    { id: "b", isFull: false, odometer: 1200, liters: 20, date: "2026-01-10" },
    { id: "c", isFull: true, odometer: 1500, liters: 40, date: "2026-01-20" },
  ]);
  assert.equal(r.samples.length, 1);
  assert.equal(r.samples[0].distance, 500);
});

test("maintenance status labels", () => {
  assert.equal(maintenanceStatus(-10, null).id, "overdue");
  assert.equal(maintenanceStatus(100, null).id, "due");
  assert.equal(maintenanceStatus(800, null).id, "approaching");
  assert.equal(maintenanceStatus(5000, 90).id, "safe");
});

test("document remaining days", () => {
  const future = new Date();
  future.setDate(future.getDate() + 70);
  const st = documentStatus({ endDate: future.toISOString().slice(0, 10) });
  assert.equal(st.id, "safe");
});

test("care score is deterministic and max 100", () => {
  const empty = careScore({
    car: { odometer: 1000, updatedAt: new Date().toISOString() },
    maintenance: [],
    documents: [],
    tires: [],
    batteries: [],
    reminders: [],
  });
  assert.ok(empty.total <= 100);
  const full = careScore({
    car: { odometer: 1000, updatedAt: new Date().toISOString() },
    maintenance: [{ id: "1", type: "oil", date: new Date().toISOString().slice(0, 10), odometer: 1000, intervalKm: 10000 }],
    documents: [
      {
        id: "d",
        endDate: new Date(Date.now() + 120 * 86400000).toISOString().slice(0, 10),
      },
    ],
    tires: [{ id: "1" }, { id: "2" }, { id: "3" }, { id: "4" }],
    batteries: [{ id: "b", purchaseDate: "2026-01-01", warrantyEnd: "2027-01-01" }],
    reminders: [],
  });
  assert.equal(full.total, 100);
});

test("percent change", () => {
  assert.equal(pctChange(115, 100), 15);
  assert.equal(pctChange(10, 0), null);
  assert.equal(round(1.226, 2), 1.23);
});
