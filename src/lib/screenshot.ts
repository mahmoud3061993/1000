import fs from "fs";

export const SCREENSHOT_MIN_BYTES = 10_000;
export const SCREENSHOT_MAX_BYTES = 4 * 1024 * 1024;
export const SCREENSHOT_MIMES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

export function validateScreenshotFile(file: unknown): { ok: true; file: File } | { ok: false; error: string } {
  if (!(file instanceof File)) {
    return { ok: false, error: "ارفع سكرين شوت واضح لإيصال التحويل" };
  }
  if (file.size < SCREENSHOT_MIN_BYTES) {
    return { ok: false, error: "ارفع سكرين شوت واضح لإيصال التحويل" };
  }
  if (file.size > SCREENSHOT_MAX_BYTES) {
    return { ok: false, error: "الصورة أكبر من 4 ميجا" };
  }
  if (file.type && !SCREENSHOT_MIMES.includes(file.type)) {
    return { ok: false, error: "الصيغة المسموحة: JPG أو PNG" };
  }
  return { ok: true, file };
}

export async function fileToDataUrl(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = file.type || "image/jpeg";
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

export function parseStoredScreenshot(stored?: string | null) {
  if (!stored) return null;
  if (stored.startsWith("data:")) {
    const match = stored.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return null;
    return {
      mime: match[1],
      buffer: Buffer.from(match[2], "base64"),
    };
  }
  if (fs.existsSync(stored)) {
    const ext = stored.split(".").pop() || "jpg";
    const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
    return { mime, buffer: fs.readFileSync(stored) };
  }
  return null;
}

export function fileNameForMime(mime: string) {
  if (mime.includes("png")) return "screenshot.png";
  if (mime.includes("webp")) return "screenshot.webp";
  return "screenshot.jpg";
}
