import { APP_VERSION, STORES } from "./constants.js";
import { db } from "./db.js";
import { downloadBlob, fileStamp, isNative, nativePlugin, nowIso } from "./utils.js";
import { toast, modal } from "./ui.js";

const BACKUP_KEYS = {
  appVersion: true,
  exportDate: true,
  cars: true,
  fuel: true,
  maintenance: true,
  repairs: true,
  expenses: true,
  documents: true,
  battery: true,
  tires: true,
  workshops: true,
  reminders: true,
  settings: true,
  checklists: true,
};

export async function buildBackup() {
  const raw = await db.exportAll();
  return {
    app: "arabity",
    appVersion: APP_VERSION,
    exportDate: nowIso(),
    cars: raw.cars,
    fuel: raw.fuelEntries,
    maintenance: raw.maintenanceRecords,
    repairs: raw.repairRecords,
    expenses: raw.expenses,
    documents: raw.documents,
    battery: raw.batteryRecords,
    tires: raw.tireRecords,
    workshops: raw.workshops,
    reminders: raw.reminders,
    settings: raw.settings,
    checklists: raw.checklists,
    customCategories: raw.customCategories,
    milestonesSeen: raw.milestonesSeen,
  };
}

export function validateBackup(data) {
  if (!data || typeof data !== "object") return "الملف مش نسخة احتياطية صحيحة.";
  if (data.app && data.app !== "arabity") return "النسخة دي مش تابعة لتطبيق عربيتي.";
  if (!Array.isArray(data.cars)) return "النسخة ناقصة بيانات العربيات.";
  return "";
}

function toInternal(data) {
  return {
    cars: data.cars || [],
    fuelEntries: data.fuel || data.fuelEntries || [],
    maintenanceRecords: data.maintenance || data.maintenanceRecords || [],
    repairRecords: data.repairs || data.repairRecords || [],
    expenses: data.expenses || [],
    documents: data.documents || [],
    batteryRecords: data.battery || data.batteryRecords || [],
    tireRecords: data.tires || data.tireRecords || [],
    workshops: data.workshops || [],
    reminders: data.reminders || [],
    checklists: data.checklists || [],
    customCategories: data.customCategories || [],
    settings: Array.isArray(data.settings) ? data.settings : data.settings ? [data.settings] : [],
    milestonesSeen: data.milestonesSeen || [],
  };
}

export async function exportBackup() {
  const payload = await buildBackup();
  const text = JSON.stringify(payload, null, 2);
  const name = `arabity-backup-${fileStamp()}.json`;
  const native = nativePlugin("Filesystem");
  const share = nativePlugin("Share");
  if (isNative() && native) {
    try {
      const file = await native.writeFile({
        path: name,
        data: btoa(unescape(encodeURIComponent(text))),
        directory: "CACHE",
        recursive: true,
      });
      if (share) {
        await share.share({ title: "نسخة عربيتي", url: file.uri, filename: name });
      }
      toast("تم إنشاء النسخة الاحتياطية");
      return;
    } catch (err) {
      console.warn(err);
    }
  }
  downloadBlob(new Blob([text], { type: "application/json" }), name);
  toast("تم إنشاء النسخة الاحتياطية");
}

export async function importBackup(jsonText, mode) {
  let data;
  try {
    data = JSON.parse(jsonText);
  } catch {
    throw new Error("invalid");
  }
  const err = validateBackup(data);
  if (err) throw new Error(err);
  const payload = toInternal(data);
  if (mode === "replace") await db.replaceAll(payload);
  else await db.mergeAll(payload);
}

export function pickBackupFile() {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return reject(new Error("nofile"));
      resolve(await file.text());
    };
    input.click();
  });
}

export function warnImport(onChoose) {
  modal({
    title: "استيراد نسخة احتياطية",
    body: `<p>الاستيراد هيأثر على البيانات الموجودة على الجهاز.</p>
      <p class="muted">الدمج بيحافظ على السجلات الحالية وبيضيف الجديد من غير تكرار لنفس الـ ID. الاستبدال بيمسح البيانات الحالية ويحط النسخة المستوردة.</p>`,
    actions: [
      { label: "دمج البيانات", primary: true, onClick: () => onChoose("merge") },
      { label: "استبدال البيانات الحالية", onClick: () => onChoose("replace") },
      { label: "إلغاء", onClick: () => {} },
    ],
  });
}

void BACKUP_KEYS;
void STORES;
