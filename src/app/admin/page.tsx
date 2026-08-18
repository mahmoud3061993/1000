"use client";

import { useEffect, useMemo, useState } from "react";

type Order = {
  id: string;
  name: string;
  email: string;
  phone: string;
  amount: number;
  currency: string;
  payment_method: string | null;
  status: string;
  created_at: string;
  paid_at: string | null;
  instapay_screenshot: string | null;
};

type Stats = {
  visits: number;
  uniqueVisitors: number;
  formFilled: number;
  tryingToPay: number;
  paid: number;
  pendingReview: number;
  failed: number;
  revenue: number;
};

const STATUS_AR: Record<string, string> = {
  form_filled: "ملأ البيانات",
  awaiting_payment: "بيحاول يدفع",
  pending_review: "قيد المراجعة",
  paid: "تم الدفع",
  failed: "فشل",
  rejected: "مرفوض",
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [integrations, setIntegrations] = useState({
    kashier: false,
    meta: false,
    telegram: false,
    instapay: false,
  });
  const [message, setMessage] = useState("");

  async function load(nextStatus = status, nextQ = q) {
    const res = await fetch(`/api/admin/summary?status=${encodeURIComponent(nextStatus)}&q=${encodeURIComponent(nextQ)}`);
    if (res.status === 401) {
      setAuthed(false);
      setChecking(false);
      return;
    }
    const json = await res.json();
    setAuthed(true);
    setStats(json.stats);
    setOrders(json.orders);
    setIntegrations(json.integrations);
    setChecking(false);
  }

  useEffect(() => {
    load();
  }, []);

  const conversion = useMemo(() => {
    if (!stats || !stats.uniqueVisitors) return "0%";
    return `${((stats.paid / stats.uniqueVisitors) * 100).toFixed(1)}%`;
  }, [stats]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const json = await res.json();
    if (!res.ok) {
      setMessage(json.error || "فشل الدخول");
      return;
    }
    setMessage("");
    await load();
  }

  async function act(id: string, action: "confirm" | "reject") {
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const json = await res.json();
    if (!res.ok) {
      setMessage(json.error || "حصل خطأ");
      return;
    }
    await load();
  }

  async function testTelegram() {
    const res = await fetch("/api/admin/test-telegram", { method: "POST" });
    const json = await res.json();
    setMessage(json.ok ? "تم إرسال تجربة الإشعار على تيليجرام" : json.error || "فشل الإرسال");
  }

  if (checking) {
    return (
      <div className="admin-body">
        <div className="admin-shell">جاري التحميل...</div>
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="admin-body">
        <form className="login-card" onSubmit={login}>
          <h1>لوحة الأدمن</h1>
          <p>ادخل كلمة المرور عشان تشوف الطلبات والإحصائيات.</p>
          {message ? <div className="form-error">{message}</div> : null}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="كلمة المرور"
          />
          <button className="buy-btn" style={{ marginTop: 14 }}>
            دخول
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-body">
      <div className="admin-shell">
        <div className="admin-top">
          <div>
            <h1 style={{ margin: 0 }}>لوحة المتابعة</h1>
            <p style={{ color: "#94A3B8" }}>كل الزيارات والطلبات وحالة الدفع في مكان واحد.</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="ghost-btn" onClick={testTelegram}>
              تجربة إشعار الموبايل
            </button>
            <button
              className="ghost-btn"
              onClick={async () => {
                await fetch("/api/admin/login", { method: "DELETE" });
                setAuthed(false);
              }}
            >
              خروج
            </button>
          </div>
        </div>

        {message ? <div className="form-error">{message}</div> : null}

        <div className="stats">
          <div className="stat">
            عدد الدخول
            <b>{stats?.visits ?? 0}</b>
            <small>{stats?.uniqueVisitors ?? 0} زائر مختلف</small>
          </div>
          <div className="stat">
            ملأ البيانات
            <b>{stats?.formFilled ?? 0}</b>
          </div>
          <div className="stat">
            بيحاول يدفع
            <b>{stats?.tryingToPay ?? 0}</b>
            <small>{stats?.pendingReview ?? 0} إنستاباي مستني مراجعة</small>
          </div>
          <div className="stat">
            دفعوا
            <b>{stats?.paid ?? 0}</b>
            <small>
              {stats?.revenue ?? 0} جنيه — تحويل {conversion}
            </small>
          </div>
        </div>

        <div style={{ marginBottom: 16, color: "#94A3B8" }}>
          الربط: كاشير {integrations.kashier ? "✅" : "❌"} — ميتا CAPI {integrations.meta ? "✅" : "❌"} — تيليجرام {integrations.telegram ? "✅" : "❌"} — إنستاباي {integrations.instapay ? "✅" : "❌"}
        </div>

        <div className="toolbar">
          <input
            className="admin-search"
            placeholder="بحث بالاسم أو الموبايل أو الإيميل"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") load(status, q);
            }}
          />
          <select
            className="admin-filter"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              load(e.target.value, q);
            }}
          >
            <option value="all">كل الحالات</option>
            <option value="form_filled">ملأ البيانات</option>
            <option value="awaiting_payment">بيحاول يدفع</option>
            <option value="pending_review">قيد المراجعة</option>
            <option value="paid">تم الدفع</option>
            <option value="failed">فشل</option>
            <option value="rejected">مرفوض</option>
          </select>
          <button className="ghost-btn" onClick={() => load(status, q)}>
            تحديث
          </button>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>الطلب</th>
              <th>العميل</th>
              <th>الوسيلة</th>
              <th>الحالة</th>
              <th>التاريخ</th>
              <th>إجراء</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>
                  {order.id}
                  <div>{order.amount} {order.currency}</div>
                </td>
                <td>
                  <div>{order.name}</div>
                  <div>{order.phone}</div>
                  <div>{order.email}</div>
                </td>
                <td>{order.payment_method === "instapay" ? "إنستاباي" : "كاشير"}</td>
                <td>
                  <span className={`badge ${order.status}`}>{STATUS_AR[order.status] || order.status}</span>
                </td>
                <td>{new Date(order.created_at).toLocaleString("ar-EG")}</td>
                <td>
                  {order.instapay_screenshot ? (
                    <a href={`/api/admin/orders/${order.id}/screenshot`} target="_blank" rel="noreferrer">
                      السكرين
                    </a>
                  ) : null}
                  {order.status === "pending_review" || order.status === "awaiting_payment" ? (
                    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                      <button className="ok-btn" onClick={() => act(order.id, "confirm")}>
                        تأكيد الدفع
                      </button>
                      {order.status === "pending_review" ? (
                        <button className="danger-btn" onClick={() => act(order.id, "reject")}>
                          رفض
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 ? <p>مفيش طلبات بالحالة دي.</p> : null}
      </div>
    </div>
  );
}
