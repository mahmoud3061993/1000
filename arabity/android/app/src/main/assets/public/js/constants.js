export const APP_VERSION = "1.0.0";
export const APP_NAME = "عربيتي";
export const DB_NAME = "arabity-db";
export const DB_VERSION = 2;

export const STORES = [
  "cars",
  "fuelEntries",
  "maintenanceRecords",
  "repairRecords",
  "expenses",
  "documents",
  "batteryRecords",
  "tireRecords",
  "workshops",
  "reminders",
  "checklists",
  "customCategories",
  "settings",
  "milestonesSeen",
];

export const FUEL_TYPES = [
  { id: "octane80", label: "بنزين 80" },
  { id: "octane92", label: "بنزين 92" },
  { id: "octane95", label: "بنزين 95" },
  { id: "diesel", label: "ديزل" },
  { id: "electric", label: "كهرباء" },
  { id: "other", label: "أخرى" },
];

export const MAINTENANCE_TYPES = [
  { id: "oil", label: "تغيير زيت" },
  { id: "oil_filter", label: "فلتر زيت" },
  { id: "air_filter", label: "فلتر هواء" },
  { id: "ac_filter", label: "فلتر تكييف" },
  { id: "spark_plugs", label: "بوجيهات" },
  { id: "brake_pads", label: "تيل فرامل" },
  { id: "rotors", label: "طنابير" },
  { id: "battery", label: "بطارية" },
  { id: "tires", label: "كاوتش" },
  { id: "gear_oil", label: "زيت فتيس" },
  { id: "coolant", label: "سائل تبريد" },
  { id: "belts", label: "سيور" },
  { id: "ac", label: "تكييف" },
  { id: "periodic", label: "صيانة دورية" },
  { id: "other", label: "أخرى" },
];

export const EXPENSE_CATEGORIES = [
  { id: "wash", label: "غسيل" },
  { id: "parking", label: "ركن" },
  { id: "tolls", label: "طرق ورسوم" },
  { id: "fines", label: "مخالفات" },
  { id: "accessories", label: "إكسسوارات" },
  { id: "insurance", label: "تأمين" },
  { id: "license", label: "ترخيص" },
  { id: "roadside", label: "مساعدة على الطريق" },
  { id: "other", label: "أخرى" },
];

export const PAYMENT_METHODS = [
  { id: "cash", label: "كاش" },
  { id: "card", label: "بطاقة" },
  { id: "instapay", label: "InstaPay" },
  { id: "wallet", label: "محفظة" },
  { id: "other", label: "أخرى" },
];

export const DOCUMENT_TYPES = [
  { id: "license", label: "رخصة السيارة" },
  { id: "insurance", label: "التأمين" },
  { id: "inspection", label: "الفحص" },
  { id: "roadside", label: "اشتراك المساعدة" },
  { id: "custom", label: "مستند مخصص" },
];

export const TIRE_POSITIONS = [
  { id: "fl", label: "أمامي شمال" },
  { id: "fr", label: "أمامي يمين" },
  { id: "rl", label: "خلفي شمال" },
  { id: "rr", label: "خلفي يمين" },
];

export const WORKSHOP_TYPES = [
  { id: "center", label: "مركز صيانة" },
  { id: "mechanic", label: "ميكانيكي" },
  { id: "electrician", label: "كهربائي" },
  { id: "tires", label: "كاوتش" },
  { id: "battery", label: "بطاريات" },
  { id: "ac", label: "تكييف" },
  { id: "body", label: "سمكري / دوكو" },
  { id: "other", label: "أخرى" },
];

export const DEFAULT_CHECKLIST = [
  { id: "tire_pressure", label: "ضغط الكاوتش" },
  { id: "engine_oil", label: "زيت المحرك" },
  { id: "coolant", label: "سائل التبريد" },
  { id: "brakes", label: "الفرامل" },
  { id: "spare", label: "الاستبن" },
  { id: "jack", label: "الكوريك" },
  { id: "battery", label: "البطارية" },
  { id: "lights", label: "الأنوار" },
  { id: "wipers", label: "المساحات" },
  { id: "fuel", label: "الوقود" },
  { id: "charger", label: "شاحن الموبايل" },
  { id: "papers", label: "أوراق العربية" },
];

export const MONTHS_AR = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

export const NAV_ITEMS = [
  { id: "dashboard", label: "الرئيسية", icon: "home" },
  { id: "cars", label: "السيارات", icon: "car" },
  { id: "fuel", label: "البنزين", icon: "fuel" },
  { id: "maintenance", label: "الصيانة", icon: "wrench" },
  { id: "repairs", label: "الإصلاحات", icon: "alert" },
  { id: "expenses", label: "المصاريف", icon: "wallet" },
  { id: "documents", label: "المستندات", icon: "doc" },
  { id: "parts", label: "الكاوتش والبطارية", icon: "tire" },
  { id: "timeline", label: "السجل", icon: "clock" },
  { id: "health", label: "حالة عربيتي", icon: "heart" },
  { id: "reports", label: "التقارير", icon: "chart" },
  { id: "cost", label: "عربيتك بتكلفك كام؟", icon: "spark" },
  { id: "workshops", label: "مراكز الصيانة", icon: "shop" },
  { id: "checklist", label: "قائمة السفر", icon: "check" },
  { id: "reminders", label: "التذكيرات", icon: "bell" },
  { id: "settings", label: "الإعدادات", icon: "settings" },
];

export const MORE_ITEMS = [
  { id: "cars", label: "السيارات", icon: "car" },
  { id: "fuel", label: "البنزين", icon: "fuel" },
  { id: "repairs", label: "الإصلاحات", icon: "alert" },
  { id: "expenses", label: "المصاريف", icon: "wallet" },
  { id: "documents", label: "المستندات", icon: "doc" },
  { id: "health", label: "حالة عربيتي", icon: "heart" },
  { id: "timeline", label: "السجل", icon: "clock" },
  { id: "workshops", label: "مراكز الصيانة", icon: "shop" },
  { id: "checklist", label: "قائمة السفر", icon: "check" },
  { id: "settings", label: "الإعدادات", icon: "settings" },
];

export const QUICK_ADD = [
  { id: "fuel", title: "تفويلة", desc: "سجل البنزين والعداد", icon: "fuel", color: "#0d9b8a" },
  { id: "maintenance", title: "صيانة", desc: "زيت، فلاتر، صيانة دورية", icon: "wrench", color: "#2563eb" },
  { id: "repair", title: "إصلاح", desc: "عطل أو تصليح طارئ", icon: "alert", color: "#dc3d3d" },
  { id: "expense", title: "مصروف", desc: "غسيل، ركن، رسوم…", icon: "wallet", color: "#d97706" },
  { id: "document", title: "تجديد / مستند", desc: "رخصة، تأمين، فحص", icon: "doc", color: "#7c3aed" },
];

export const MILESTONE_STEPS = [10000, 25000, 50000, 100000, 250000];

export const DEFAULT_SETTINGS = {
  currencySymbol: "جنيه",
  currencyCode: "EGP",
  fuelUnit: "km_l",
  theme: "system",
  hidePrivateNotes: false,
  currentCarId: "",
  notificationsAsked: false,
  notificationsEnabled: false,
  demoLoaded: false,
};
