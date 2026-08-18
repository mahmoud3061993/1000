"use client";

import { useEffect, useState } from "react";
import type { AnalyticsPeriod, AnalyticsReport } from "@/lib/analytics";

const PERIODS: Array<{ id: AnalyticsPeriod; label: string }> = [
  { id: "day", label: "اليوم" },
  { id: "week", label: "آخر 7 أيام" },
  { id: "month", label: "آخر 30 يوم" },
];

function money(value: number) {
  return `${Number(value || 0).toLocaleString("ar-EG")} جنيه`;
}

function changeText(value: number) {
  if (value > 0) return `▲ ${value}% عن الفترة اللي قبلها`;
  if (value < 0) return `▼ ${Math.abs(value)}% عن الفترة اللي قبلها`;
  return "زي الفترة اللي قبلها";
}

function changeClass(value: number) {
  if (value > 0) return "up";
  if (value < 0) return "down";
  return "flat";
}

export default function AdminAnalytics() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("week");
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [usesRemoteDb, setUsesRemoteDb] = useState(true);

  async function load(nextPeriod = period) {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/admin/analytics?period=${nextPeriod}`);
    const json = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok || !json.ok) {
      setError(json.error || "فشل تحميل التحليل");
      return;
    }
    setReport(json.report);
    if (typeof json.usesRemoteDb === "boolean") setUsesRemoteDb(json.usesRemoteDb);
  }

  useEffect(() => {
    load(period);
  }, [period]);

  const maxIncome = Math.max(1, ...(report?.series.map((point) => point.income) || [1]));
  const current = report?.current;

  return (
    <div className="analytics-page">
      <div className="settings-card">
        <h2>تحليل المبيعات</h2>
        <p>
          شوف كام طلب اتقفل، كام لسه واقف على الدفع، وإجمالي الدخل. الأرقام بتتوقيت مصر، ومقارنة بالفترة اللي قبلها.
        </p>
        <div className="analytics-periods">
          {PERIODS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={period === item.id ? "active" : ""}
              onClick={() => setPeriod(item.id)}
            >
              {item.label}
            </button>
          ))}
          <button type="button" className="ghost-btn" onClick={() => load(period)} disabled={loading}>
            {loading ? "جاري التحميل..." : "تحديث"}
          </button>
        </div>
        {report ? (
          <div className="analytics-range">
            من {report.range.fromLabel} إلى {report.range.toLabel}
          </div>
        ) : null}
        {error ? <div className="form-error">{error}</div> : null}
        {!usesRemoteDb ? (
          <div className="form-error">
            التحليل ممكن يتصفر بين الزيارات لأن الموقع على Vercel من غير قاعدة بيانات ثابتة. عشان الأرقام تثبت، نربط Turso.
          </div>
        ) : null}
        {report ? <p className="analytics-insight">{report.insight}</p> : null}
      </div>

      <div className="stats analytics-hero">
        <div className="stat">
          توتال الدخل
          <b>{money(current?.income || 0)}</b>
          <small className={changeClass(report?.change.income || 0)}>{changeText(report?.change.income || 0)}</small>
        </div>
        <div className="stat">
          طلبات اتقفلت
          <b>{current?.closed ?? 0}</b>
          <small className={changeClass(report?.change.closed || 0)}>{changeText(report?.change.closed || 0)}</small>
        </div>
        <div className="stat">
          واقفين على الدفع
          <b>{current?.waiting ?? 0}</b>
          <small>{report?.openPipeline ?? 0} طلب مفتوح دلوقتي</small>
        </div>
        <div className="stat">
          متوسط الطلب
          <b>{money(current?.avgOrder || 0)}</b>
          <small>
            إنستاباي {current?.instapayClosed ?? 0} — كاشير {current?.kashierClosed ?? 0}
          </small>
        </div>
      </div>

      <div className="stats">
        <div className="stat">
          عدد الدخول
          <b>{current?.visits ?? 0}</b>
          <small>
            {current?.uniqueVisitors ?? 0} زائر مختلف — تحويل {current?.visitConversion ?? 0}%
          </small>
        </div>
        <div className="stat">
          ملأ البيانات
          <b>{current?.leads ?? 0}</b>
          <small>
            تحويل الطلبات {current?.leadConversion ?? 0}% — {changeText(report?.change.leads || 0)}
          </small>
        </div>
        <div className="stat">
          إنستاباي مستني مراجعة
          <b>{current?.pendingReview ?? 0}</b>
          <small>دول محتاجين تأكيد أو رفض</small>
        </div>
        <div className="stat">
          فشل / مرفوض
          <b>{current?.failed ?? 0}</b>
          <small>
            دخل إنستاباي {money(current?.instapayIncome || 0)} — كاشير {money(current?.kashierIncome || 0)}
          </small>
        </div>
      </div>

      <div className="settings-card">
        <h2>الدخل يوم بيوم</h2>
        <p>كل عمود هو دخل اليوم بالجنيه.</p>
        <div className="analytics-bars" aria-hidden="true">
          {(report?.series || []).map((point) => (
            <div key={point.date} className="analytics-bar">
              <span style={{ height: `${Math.max(6, (point.income / maxIncome) * 100)}%` }} />
              <small>{point.date.slice(8)}</small>
            </div>
          ))}
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>اليوم</th>
              <th>دخول</th>
              <th>طلبات</th>
              <th>اتقفلت</th>
              <th>واقفة</th>
              <th>الدخل</th>
            </tr>
          </thead>
          <tbody>
            {(report?.series || []).map((point) => (
              <tr key={point.date}>
                <td>{point.label}</td>
                <td>{point.visits}</td>
                <td>{point.leads}</td>
                <td>{point.closed}</td>
                <td>{point.waiting}</td>
                <td>{money(point.income)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
