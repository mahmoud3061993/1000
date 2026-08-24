import { parseNum } from "./utils.js";

export function required(value, message) {
  if (value == null || String(value).trim() === "") return message;
  return "";
}

export function positive(value, message) {
  const n = parseNum(value);
  if (n == null) return message;
  if (n <= 0) return message || "المبلغ لازم يكون أكبر من صفر.";
  return "";
}

export function nonNegative(value, message) {
  const n = parseNum(value);
  if (n == null) return message;
  if (n < 0) return "القيمة لا يمكن تكون بالسالب.";
  return "";
}

export function odometerCheck(value, current, { allowLower = false } = {}) {
  const n = parseNum(value);
  if (n == null) return "اكتب عداد الكيلومتر.";
  if (n < 0) return "العداد لا يمكن يكون بالسالب.";
  if (!allowLower && current != null && n < Number(current) && n !== Number(current)) {
    return "عداد الكيلومتر أقل من آخر قراءة سجلتها. راجع الرقم.";
  }
  return "";
}

export function validateFuel(data, car) {
  const errors = {};
  const d = required(data.date, "اختار التاريخ.");
  if (d) errors.date = d;
  const odo = odometerCheck(data.odometer, car?.odometer, { allowLower: true });
  if (odo) errors.odometer = odo;
  const liters = parseNum(data.liters);
  const total = parseNum(data.total);
  const ppl = parseNum(data.pricePerLiter);
  if (data.fuelType === "electric") {
    if (total == null || total < 0) errors.total = "اكتب تكلفة الشحن.";
  } else {
    if (liters == null) errors.liters = "اكتب عدد اللترات الأول.";
    else if (liters <= 0) errors.liters = "عدد اللترات لازم يكون أكبر من صفر.";
    if (total == null && ppl == null) errors.total = "اكتب السعر أو الإجمالي.";
  }
  if (parseNum(data.odometer) != null && car && parseNum(data.odometer) < Number(car.odometer || 0)) {
    errors.odometerWarn = "العداد أقل من آخر قراءة مسجلة.";
  }
  return errors;
}

export function validateMoney(amount) {
  return positive(amount, "المبلغ لازم يكون أكبر من صفر.");
}

export function firstError(errors) {
  const key = Object.keys(errors).find((k) => k !== "odometerWarn" && errors[k]);
  return key ? errors[key] : "";
}
