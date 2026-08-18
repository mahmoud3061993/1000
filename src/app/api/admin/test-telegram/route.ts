import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { notifyText } from "@/lib/notify";

export const runtime = "nodejs";

export async function POST() {
  if (!isAdminRequest()) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const result = await notifyText(
    "تجربة إشعار من لوحة الأدمن — لو الرسالة دي ظهرت على الموبايل يبقى الإشعارات شغالة.",
    {
      title: "تجربة إشعار الموبايل",
      priority: 5,
      tags: ["bell"],
    }
  );
  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: "فشل إرسال الإشعار. جرّب تاني بعد شوية، ولو استمرت المشكلة افتح لينك التفعيل من الموبايل.",
        channels: result,
      },
      { status: 502 }
    );
  }
  return NextResponse.json({
    ok: true,
    message: "اتبعت الإشعار على الموبايل. لو مش ظاهر، افتح لينك التفعيل من التليفون واسمح بالإشعارات.",
    channels: result,
  });
}
