import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const candidates = [
    join(process.cwd(), "public", "masaref-html.zip"),
    join(process.cwd(), "public", "spend", "masaref-html.zip"),
  ];
  for (const path of candidates) {
    try {
      const file = await readFile(path);
      return new NextResponse(file, {
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": 'attachment; filename="masaref-html.zip"',
          "Cache-Control": "no-store",
        },
      });
    } catch {
      // try the next location
    }
  }
  return NextResponse.redirect(new URL("/masaref-html.zip", "https://www.producthelpyou.online"));
}
