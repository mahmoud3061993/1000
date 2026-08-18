import fs from "fs";

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
