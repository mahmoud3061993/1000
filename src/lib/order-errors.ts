export const RECEIPT_UPLOAD_LIMIT_BYTES = 3.2 * 1024 * 1024;

export function messageForOrderSubmitFailure(status: number, bodyText = "") {
  const text = bodyText.toLowerCase();
  if (
    status === 413 ||
    text.includes("function_payload_too_large") ||
    text.includes("request entity too large")
  ) {
    return "صورة الإيصال كبيرة على السيرفر. ارفع سكرين أصغر، أو صور الإيصال تاني بجودة أقل.";
  }
  if (status >= 500) {
    return "حصل خطأ في حفظ الطلب. جرّب تاني ولو الصورة كبيرة صغّرها.";
  }
  return "حصل خطأ في رفع الإيصال. جرّب شبكة تانية أو صورة أصغر.";
}
