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
