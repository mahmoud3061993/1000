import { db } from "./db.js";
import { loadAppContext, syncDateNotifications } from "./notifications.js";
import { getSettings, saveSettings, currency } from "./storage.js";
import { toast } from "./ui.js";
import { milestoneMessages } from "./insights.js";

export const state = {
  cars: [],
  car: null,
  ctx: null,
};

let afterRefresh = () => {};

export function setAfterRefresh(fn) {
  afterRefresh = fn;
}

export function appState() {
  return state;
}

export async function refresh(rerender = true) {
  state.cars = await db.getAll("cars");
  const settings = getSettings();
  let carId = settings.currentCarId;
  if (!carId || !state.cars.some((c) => c.id === carId)) carId = state.cars[0]?.id || "";
  if (carId !== settings.currentCarId) await saveSettings({ currentCarId: carId });
  state.ctx = carId
    ? await loadAppContext(carId)
    : {
        cars: state.cars,
        car: null,
        fuel: [],
        maintenance: [],
        repairs: [],
        expenses: [],
        documents: [],
        batteries: [],
        tires: [],
        workshops: [],
        reminders: [],
        checklists: [],
        customCategories: [],
        milestonesSeen: [],
      };
  state.car = state.ctx.car;
  await afterRefresh(rerender, state);
  if (state.ctx.car) {
    syncDateNotifications(state.ctx);
    const seen = new Set((state.ctx.milestonesSeen || []).map((x) => x.id));
    const msgs = milestoneMessages(state.ctx, currency(), seen);
    for (const m of msgs) {
      toast(m.text);
      await db.put("milestonesSeen", {
        id: m.id,
        carId: state.ctx.car.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }
}

let quick = () => {};
export function setQuickAdd(fn) {
  quick = fn;
}
export function openQuickAdd() {
  quick();
}
