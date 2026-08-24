import { DEFAULT_SETTINGS } from "./constants.js";
import { db } from "./db.js";
import { nowIso } from "./utils.js";

const KEY = "arabity-settings";
let cache = { ...DEFAULT_SETTINGS };
const listeners = new Set();

export async function loadSettings() {
  const row = await db.get("settings", KEY);
  cache = { ...DEFAULT_SETTINGS, ...(row || {}), id: KEY };
  if (cache.theme) localStorage.setItem("arabity-theme", cache.theme);
  if (cache.currentCarId) localStorage.setItem("arabity-current-car", cache.currentCarId);
  return cache;
}

export function getSettings() {
  return cache;
}

export async function saveSettings(patch) {
  cache = { ...cache, ...patch, id: KEY, updatedAt: nowIso() };
  await db.put("settings", cache);
  if (cache.theme) localStorage.setItem("arabity-theme", cache.theme);
  if (cache.currentCarId) localStorage.setItem("arabity-current-car", cache.currentCarId);
  listeners.forEach((fn) => fn(cache));
  applyTheme(cache.theme);
  return cache;
}

export function onSettings(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function applyTheme(theme = cache.theme) {
  const dark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  localStorage.setItem("arabity-theme", theme);
}

export function currency() {
  return cache.currencySymbol || "جنيه";
}
