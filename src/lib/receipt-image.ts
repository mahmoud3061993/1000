import { RECEIPT_UPLOAD_LIMIT_BYTES } from "./order-errors";

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("jpeg"));
    }, "image/jpeg", quality);
  });
}

export async function compressReceiptImage(file: File): Promise<File> {
  if (file.size <= 900_000 && (file.type === "image/jpeg" || file.type === "image/jpg")) {
    return file;
  }

  let source: CanvasImageSource | null = null;
  try {
    source = await createImageBitmap(file);
  } catch {
    source = null;
  }

  if (!source) {
    if (file.size > RECEIPT_UPLOAD_LIMIT_BYTES) {
      throw new Error("too-large");
    }
    return file;
  }

  const width = "width" in source ? Number(source.width) : 1600;
  const height = "height" in source ? Number(source.height) : 1600;
  const maxEdge = 1600;
  const scale = Math.min(1, maxEdge / Math.max(width, height, 1));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    if (file.size > RECEIPT_UPLOAD_LIMIT_BYTES) throw new Error("too-large");
    return file;
  }
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

  let blob = await canvasToJpeg(canvas, 0.72);
  if (blob.size > RECEIPT_UPLOAD_LIMIT_BYTES) {
    blob = await canvasToJpeg(canvas, 0.52);
  }
  if (blob.size > RECEIPT_UPLOAD_LIMIT_BYTES) {
    throw new Error("too-large");
  }
  return new File([blob], "receipt.jpg", { type: "image/jpeg" });
}
