import { DEFAULT_CHECKLIST } from "./constants.js";
import { db } from "./db.js";
import { uid, nowIso } from "./utils.js";

function rec(storeFields) {
  const t = nowIso();
  return { id: uid("rec"), createdAt: t, updatedAt: t, isDemo: true, ...storeFields };
}

export async function demoExists() {
  const cars = await db.getAll("cars");
  return cars.some((c) => c.isDemo);
}

export async function loadDemoData() {
  if (await demoExists()) return (await db.getAll("cars")).find((c) => c.isDemo);
  const t = nowIso();
  const carId = uid("car");
  const car = {
    id: carId,
    name: "Kia Cerato",
    make: "Kia",
    model: "Cerato",
    year: 2021,
    odometer: 68500,
    fuelType: "octane92",
    plate: "س ص د 1234",
    purchaseDate: "2021-06-15",
    purchasePrice: 385000,
    color: "أبيض",
    isDemo: true,
    createdAt: t,
    updatedAt: t,
    odometerUpdatedAt: t,
  };
  await db.put("cars", car);

  const fuel = [
    ["2026-03-02", 61200, 40, 15.75, true, "توتال التجمع"],
    ["2026-03-20", 62280, 42, 15.75, true, "موبيل المعادي"],
    ["2026-04-08", 63410, 41.5, 16.25, true, "توتال"],
    ["2026-04-27", 64520, 40.8, 16.25, true, "وطنية"],
    ["2026-05-16", 65600, 43, 16.75, true, "موبيل"],
    ["2026-06-04", 66640, 41.2, 16.75, true, "توتال التجمع"],
    ["2026-06-25", 67210, 38, 17.25, false, "وطنية"],
    ["2026-07-12", 67880, 42.5, 17.25, true, "توتال"],
    ["2026-08-03", 68500, 40.2, 17.25, true, "موبيل المعادي"],
  ].map(([date, odometer, liters, pricePerLiter, isFull, station]) =>
    rec({
      carId,
      date,
      odometer,
      liters,
      pricePerLiter,
      total: Math.round(liters * pricePerLiter * 100) / 100,
      fuelType: "octane92",
      station,
      isFull,
      notes: "",
    })
  );
  await db.putMany("fuelEntries", fuel);

  await db.putMany("maintenanceRecords", [
    rec({
      carId,
      date: "2026-02-18",
      odometer: 58500,
      type: "oil",
      workshop: "مركز كيا التجمع",
      partsCost: 1100,
      laborCost: 250,
      total: 1350,
      intervalKm: 10000,
      intervalMonths: 6,
      notes: "",
    }),
    rec({
      carId,
      date: "2026-02-18",
      odometer: 58500,
      type: "oil_filter",
      workshop: "مركز كيا التجمع",
      partsCost: 180,
      laborCost: 50,
      total: 230,
      intervalKm: 10000,
      notes: "",
    }),
    rec({
      carId,
      date: "2026-07-20",
      odometer: 68100,
      type: "oil",
      workshop: "مركز كيا التجمع",
      partsCost: 1250,
      laborCost: 300,
      total: 1550,
      intervalKm: 10000,
      intervalMonths: 6,
      notes: "",
    }),
    rec({
      carId,
      date: "2026-07-20",
      odometer: 68100,
      type: "ac_filter",
      workshop: "مركز كيا التجمع",
      partsCost: 220,
      laborCost: 80,
      total: 300,
      intervalKm: 15000,
      notes: "",
    }),
  ]);

  await db.putMany("repairRecords", [
    rec({
      carId,
      date: "2026-05-09",
      odometer: 65200,
      problem: "تكييف ضعيف",
      diagnosis: "شحن فريون وتنظيف",
      workshop: "ورشة التكييف - المعادي",
      parts: "فريون",
      partsCost: 900,
      laborCost: 800,
      total: 1700,
      warrantyUntil: "2026-11-09",
      notes: "",
    }),
    rec({
      carId,
      date: "2026-08-11",
      odometer: 68420,
      problem: "صوت في الفرامل",
      diagnosis: "تغيير تيل أمامي",
      workshop: "مركز كيا التجمع",
      parts: "تيل فرامل أصلي",
      partsCost: 1400,
      laborCost: 350,
      total: 1750,
      notes: "",
    }),
  ]);

  await db.putMany("expenses", [
    rec({ carId, date: "2026-08-02", category: "wash", amount: 150, payment: "cash", notes: "" }),
    rec({ carId, date: "2026-08-14", category: "parking", amount: 80, payment: "cash", notes: "" }),
    rec({ carId, date: "2026-07-01", category: "tolls", amount: 120, payment: "wallet", notes: "" }),
    rec({ carId, date: "2026-06-12", category: "wash", amount: 150, payment: "cash", notes: "" }),
    rec({ carId, date: "2026-04-22", category: "accessories", amount: 450, payment: "card", notes: "حامل موبايل" }),
  ]);

  await db.putMany("documents", [
    rec({
      carId,
      type: "license",
      title: "رخصة السيارة",
      startDate: "2025-09-12",
      endDate: "2026-09-11",
      cost: 1200,
      notes: "",
    }),
    rec({
      carId,
      type: "insurance",
      title: "التأمين",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      cost: 4200,
      notes: "",
    }),
  ]);

  await db.put(
    "batteryRecords",
    rec({
      carId,
      brand: "ACDelco",
      model: "70Ah",
      purchaseDate: "2024-11-02",
      installOdometer: 41200,
      price: 2800,
      warrantyMonths: 18,
      warrantyEnd: "2026-05-02",
      notes: "",
    })
  );

  const tireBase = {
    carId,
    brand: "Hankook",
    model: "Kinergy",
    installDate: "2025-03-10",
    installOdometer: 49800,
    price: 1850,
    manufactureDate: "2024-11-01",
    notes: "",
  };
  await db.putMany(
    "tireRecords",
    ["fl", "fr", "rl", "rr"].map((position) => rec({ ...tireBase, position }))
  );

  await db.put(
    "workshops",
    rec({
      name: "مركز كيا التجمع",
      type: "center",
      phone: "01000000000",
      address: "التجمع الخامس",
      specialty: "صيانة دورية",
      rating: 5,
      lastVisit: "2026-07-20",
      notes: "",
      carId: "shared",
    })
  );

  await db.put(
    "reminders",
    rec({
      carId,
      title: "تغيير الزيت القادم",
      kind: "km",
      odometer: 78100,
      date: "",
      done: false,
    })
  );

  await db.put("checklists", {
    id: uid("chk"),
    carId,
    items: DEFAULT_CHECKLIST.map((x) => ({ ...x, done: false, custom: false })),
    isDemo: true,
    createdAt: t,
    updatedAt: t,
  });

  return car;
}
