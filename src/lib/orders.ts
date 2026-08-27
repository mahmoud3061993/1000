export const STATUS_LABELS: Record<string, string> = {
  form_filled: "ملأ البيانات",
  awaiting_payment: "بيحاول يدفع",
  pending_review: "قيد المراجعة",
  paid: "تم الدفع",
  failed: "فشل الدفع",
  rejected: "مرفوض",
};

export function isManualPaymentMethod(method?: string | null): method is "instapay" | "wallet" {
  return method === "instapay" || method === "wallet";
}

export function parseManualPaymentMethod(value: unknown) {
  const method = String(value || "");
  return isManualPaymentMethod(method) ? method : null;
}

export function paymentMethodLabel(method?: string | null) {
  if (method === "instapay") return "إنستاباي";
  if (method === "wallet") return "محفظة كاش";
  if (method === "kashier") return "كاشير (قديم)";
  return "—";
}

export function canConfirmManualPayment(order: { payment_method?: string | null; status: string }) {
  return isManualPaymentMethod(order.payment_method) && order.status === "pending_review";
}

export function canConfirmInstapay(order: { payment_method?: string | null; status: string }) {
  return canConfirmManualPayment(order);
}

export function canRejectInstapay(order: { payment_method?: string | null; status: string }) {
  return canConfirmManualPayment(order);
}

export function orderEmailStatus(order: { status: string; email_sent_at?: string | null }) {
  if (order.email_sent_at) {
    return { key: "sent" as const, label: "تم إرسال الإيميل" };
  }
  if (order.status === "paid") {
    return { key: "pending" as const, label: "لسه متبعتش" };
  }
  return { key: "waiting" as const, label: "بعد الدفع" };
}
