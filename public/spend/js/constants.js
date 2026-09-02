export const APP_NAME = "مصارف";
export const APP_TAGLINE = "سيستم السيطرة على المصروفات";
export const STORAGE_KEY = "masaref-v1";
export const DB_NAME = "masaref-db";
export const DB_VERSION = 1;

export const CATEGORIES = [
  { id: "food", name: "طلبات أكل", emoji: "🍔", share: 0.28, color: "#EA580C" },
  { id: "outings", name: "قهوة وخروجات", emoji: "☕", share: 0.2, color: "#C026D3" },
  { id: "impulse", name: "مشتريات غير مخطط لها", emoji: "🛍️", share: 0.15, color: "#DC2626" },
  { id: "transport", name: "مواصلات", emoji: "🚌", share: 0.12, color: "#2563EB" },
  { id: "fun", name: "ترفيه", emoji: "🎮", share: 0.08, color: "#7C3AED" },
  { id: "health", name: "صحة", emoji: "💊", share: 0.07, color: "#059669" },
  { id: "other", name: "أخرى", emoji: "📦", share: 0.1, color: "#57534E" },
  { id: "rent", name: "إيجار / قسط", emoji: "🏠", share: 0, color: "#0F766E", fixed: true },
  { id: "bills", name: "فواتير", emoji: "💡", share: 0, color: "#B45309", fixed: true },
  { id: "debts", name: "ديون", emoji: "💳", share: 0, color: "#9F1239", fixed: true },
  { id: "savings", name: "توفير", emoji: "🏦", share: 0, color: "#047857", fixed: true },
];

export function categoryById(id) {
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES.find((c) => c.id === "other");
}

export const EMPTY_SETUP = {
  income: "",
  rent: "",
  bills: "",
  debts: "",
  savingsGoal: "",
  payday: 1,
  name: "",
};

export const NAV_ITEMS = [
  { id: "dashboard", label: "الرئيسية", icon: "home" },
  { id: "add", label: "تسجيل", icon: "plus" },
  { id: "decide", label: "ينفع أشتريها؟", icon: "ask" },
  { id: "expenses", label: "فلوسي", icon: "list" },
  { id: "more", label: "المزيد", icon: "more" },
];
