export const STATUS_LABELS: Record<string, string> = {
  form_filled: "ملأ البيانات",
  awaiting_payment: "بيحاول يدفع",
  pending_review: "قيد المراجعة",
  paid: "تم الدفع",
  failed: "فشل الدفع",
  rejected: "مرفوض",
};

export function canConfirmInstapay(order: { payment_method?: string | null; status: string }) {
  return order.payment_method === "instapay" && order.status === "pending_review";
}

export function canRejectInstapay(order: { payment_method?: string | null; status: string }) {
  return order.payment_method === "instapay" && order.status === "pending_review";
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
