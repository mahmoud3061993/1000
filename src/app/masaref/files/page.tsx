import type { Metadata } from "next";
import { DownloadLink, StaticPageLink } from "@/components/DownloadLink";

export const metadata: Metadata = {
  title: "تحميل ملفات مصارف",
  description: "نزّل سيستم مصارف للكمبيوتر وتطبيق الأندرويد.",
};

export default function MasarefFilesPage() {
  return (
    <main className="thankyou masaref-files-page">
      <div className="thankyou-card" style={{ textAlign: "right" }}>
        <p style={{ margin: 0, color: "#0f766e", fontWeight: 800 }}>مصارف</p>
        <h1>تحميل الملفات</h1>
        <p>السيستم للكمبيوتر ملف ZIP. فك الضغط وافتح index.html. الأندرويد APK، ولو المتصفح منعه نزّل النسخة المضغوطة.</p>
        <div className="file-links masaref-files">
          <DownloadLink className="drive-link" href="/download/masaref-html" filename="masaref-html.zip">
            نزّل السيستم للكمبيوتر (HTML ZIP)
          </DownloadLink>
          <DownloadLink className="drive-link" href="/spend/masaref.apk" filename="masaref.apk">
            نزّل تطبيق أندرويد (APK)
          </DownloadLink>
          <DownloadLink className="drive-link" href="/spend/masaref-android.zip" filename="masaref-android.zip">
            أندرويد ZIP لو الـ APK اتقفل
          </DownloadLink>
          <StaticPageLink className="drive-link" href="/spend/howto.html">
            الدليل
          </StaticPageLink>
          <StaticPageLink className="drive-link" href="/spend/">
            افتح السيستم أونلاين
          </StaticPageLink>
        </div>
      </div>
    </main>
  );
}
