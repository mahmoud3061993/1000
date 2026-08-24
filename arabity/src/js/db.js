import { DB_NAME, DB_VERSION, STORES } from "./constants.js";

let dbp;

function openDb() {
  if (dbp) return dbp;
  dbp = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = req.result;
      const from = e.oldVersion || 0;
      for (const name of STORES) {
        if (!db.objectStoreNames.contains(name)) {
          const store = db.createObjectStore(name, { keyPath: "id" });
          if (name !== "settings" && name !== "milestonesSeen") {
            store.createIndex("carId", "carId", { unique: false });
            store.createIndex("createdAt", "createdAt", { unique: false });
          }
          if (["fuelEntries", "maintenanceRecords", "repairRecords", "expenses", "documents", "reminders"].includes(name)) {
            store.createIndex("date", "date", { unique: false });
          }
        }
      }
      if (from >= 1) {
        /* reserved for future additive migrations — never wipe */
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbp;
}

function txDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error("aborted"));
  });
}

export const db = {
  async ready() {
    return openDb();
  },

  async get(store, id) {
    const database = await openDb();
    return new Promise((resolve, reject) => {
      const req = database.transaction(store, "readonly").objectStore(store).get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  },

  async getAll(store) {
    const database = await openDb();
    return new Promise((resolve, reject) => {
      const req = database.transaction(store, "readonly").objectStore(store).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },

  async byCar(store, carId) {
    const all = await this.getAll(store);
    return all.filter((x) => x.carId === carId);
  },

  async put(store, record) {
    const database = await openDb();
    const tx = database.transaction(store, "readwrite");
    tx.objectStore(store).put(record);
    await txDone(tx);
    return record;
  },

  async putMany(store, records) {
    if (!records.length) return;
    const database = await openDb();
    const tx = database.transaction(store, "readwrite");
    const os = tx.objectStore(store);
    for (const rec of records) os.put(rec);
    await txDone(tx);
  },

  async del(store, id) {
    const database = await openDb();
    const tx = database.transaction(store, "readwrite");
    tx.objectStore(store).delete(id);
    await txDone(tx);
  },

  async clear(store) {
    const database = await openDb();
    const tx = database.transaction(store, "readwrite");
    tx.objectStore(store).clear();
    await txDone(tx);
  },

  async exportAll() {
    const data = {};
    for (const store of STORES) data[store] = await this.getAll(store);
    return data;
  },

  async replaceAll(payload) {
    const database = await openDb();
    const tx = database.transaction(STORES, "readwrite");
    for (const store of STORES) {
      const os = tx.objectStore(store);
      os.clear();
      for (const rec of payload[store] || []) os.put(rec);
    }
    await txDone(tx);
  },

  async mergeAll(payload) {
    for (const store of STORES) {
      const incoming = payload[store] || [];
      if (!incoming.length) continue;
      const existing = await this.getAll(store);
      const map = new Map(existing.map((x) => [x.id, x]));
      for (const rec of incoming) {
        const prev = map.get(rec.id);
        if (!prev) map.set(rec.id, rec);
        else {
          const pu = Date.parse(prev.updatedAt || prev.createdAt || 0) || 0;
          const ru = Date.parse(rec.updatedAt || rec.createdAt || 0) || 0;
          if (ru >= pu) map.set(rec.id, rec);
        }
      }
      await this.putMany(store, [...map.values()]);
    }
  },

  async deleteByCar(carId) {
    const skip = new Set(["settings", "workshops", "customCategories"]);
    for (const store of STORES) {
      if (skip.has(store)) continue;
      const rows = await this.getAll(store);
      const keep = rows.filter((x) => x.carId !== carId);
      if (keep.length !== rows.length) {
        await this.clear(store);
        await this.putMany(store, keep);
      }
    }
  },

  async deleteDemo() {
    for (const store of STORES) {
      if (store === "settings") continue;
      const rows = await this.getAll(store);
      const keep = rows.filter((x) => !x.isDemo);
      if (keep.length !== rows.length) {
        await this.clear(store);
        await this.putMany(store, keep);
      }
    }
  },

  async reset() {
    const database = await openDb();
    const tx = database.transaction(STORES, "readwrite");
    for (const store of STORES) tx.objectStore(store).clear();
    await txDone(tx);
  },
};

export async function bumpOdometer(car, km) {
  const n = Number(km);
  if (!car || !Number.isFinite(n) || n <= 0) return car;
  if (n > Number(car.odometer || 0)) {
    const next = { ...car, odometer: n, updatedAt: new Date().toISOString() };
    await db.put("cars", next);
    return next;
  }
  return car;
}
