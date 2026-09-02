"use client";

import { useEffect, useMemo, useState } from "react";
import AdminAnalytics from "@/components/AdminAnalytics";
import { formatAdPath, parseAdPath } from "@/lib/attribution";
import { orderEmailStatus, paymentMethodLabel } from "@/lib/orders";
import { productAdminLabel } from "@/lib/products";

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
  email_sent_at?: string | null;
  product_slug?: string | null;
  utm_source?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  fbclid?: string | null;
  fbc?: string | null;
  ad_path?: string | null;
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

type PaymentSettings = {
  instapay_number: string;
  instapay_name: string;
  wallet_number: string;
  wallet_name: string;
  product_delivery_url: string;
  plant_delivery_url: string;
  arabity_delivery_url: string;
  masaref_delivery_url: string;
  whatsapp_number: string;
  ntfy_topic: string;
};

type Notifications = {
  topic: string;
  subscribeUrl: string;
  appUrl: string;
  androidApp: string;
  iosApp: string;
  telegram: boolean;
  mobile: boolean;
};

const STATUS_AR: Record<string, string> = {
  form_filled: "ملأ البيانات",
  awaiting_payment: "بيحاول يدفع",
  pending_review: "قيد المراجعة",
  paid: "تم الدفع",
  failed: "فشل",
  rejected: "مرفوض",
};

const emptySettings: PaymentSettings = {
  instapay_number: "",
  instapay_name: "",
  wallet_number: "",
  wallet_name: "",
  product_delivery_url: "",
  plant_delivery_url: "",
  arabity_delivery_url: "",
  masaref_delivery_url: "",
  whatsapp_number: "",
  ntfy_topic: "",
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState<"orders" | "settings" | "analytics">("analytics");
  const [stats, setStats] = useState<Stats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState("all");
  const [product, setProduct] = useState("all");
  const [q, setQ] = useState("");
  const [integrations, setIntegrations] = useState({
    meta: false,
    telegram: false,
    instapay: false,
    wallet: false,
    mobile: false,
    email: false,
  });
  const [notifications, setNotifications] = useState<Notifications | null>(null);
  const [usesRemoteDb, setUsesRemoteDb] = useState(true);
  const [settings, setSettings] = useState<PaymentSettings>(emptySettings);
  const [envOverrides, setEnvOverrides] = useState({
    instapay: false,
    wallet: false,
    deliveryUrl: false,
  });
  const [saving, setSaving] = useState(false);
  const [busyKey, setBusyKey] = useState("");
  const [message, setMessage] = useState("");

  async function load(nextStatus = status, nextQ = q, nextProduct = product) {
    const res = await fetch(
      `/api/admin/summary?status=${encodeURIComponent(nextStatus)}&q=${encodeURIComponent(nextQ)}&product=${encodeURIComponent(nextProduct)}`
    );
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
    if (json.notifications) setNotifications(json.notifications);
    setUsesRemoteDb(Boolean(json.usesRemoteDb));
    setChecking(false);
  }

  async function loadSettings() {
    const res = await fetch("/api/admin/settings");
    if (!res.ok) return;
    const json = await res.json();
    setSettings({
      instapay_number: json.settings.instapay_number || "",
      instapay_name: json.settings.instapay_name || "",
      wallet_number: json.settings.wallet_number || "",
      wallet_name: json.settings.wallet_name || "",
      product_delivery_url: json.settings.product_delivery_url || "",
      plant_delivery_url: json.settings.plant_delivery_url || "",
      arabity_delivery_url: json.settings.arabity_delivery_url || "",
      masaref_delivery_url: json.settings.masaref_delivery_url || "",
      whatsapp_number: json.settings.whatsapp_number || "",
      ntfy_topic: json.settings.ntfy_topic || json.notifications?.topic || "",
    });
    setEnvOverrides(json.envOverrides || envOverrides);
    if (json.notifications) setNotifications(json.notifications);
    if (json.integrations) {
      setIntegrations((prev) => ({ ...prev, ...json.integrations }));
    }
    if (typeof json.usesRemoteDb === "boolean") setUsesRemoteDb(json.usesRemoteDb);
  }

  useEffect(() => {
    load().then(() => loadSettings());
  }, []);

  const conversion = useMemo(() => {
    if (!stats || !stats.uniqueVisitors) return "0%";
    return `${((stats.paid / stats.uniqueVisitors) * 100).toFixed(1)}%`;
  }, [stats]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    if (busyKey) return;
    setBusyKey("login");
    setMessage("");
    try {
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
      await loadSettings();
    } finally {
      setBusyKey("");
    }
  }

  async function act(id: string, action: "confirm" | "reject" | "delete" | "email") {
    if (busyKey) return;
    if (action === "delete") {
      const ok = window.confirm("هتمسح الطلب ده نهائي؟ مش هيرجع تاني.");
      if (!ok) return;
    }
    const key = `${id}:${action}`;
    setBusyKey(key);
    setMessage("");
    try {
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
      setMessage(
        action === "delete" ? "اتمسح الطلب" : action === "email" ? "اتبعت إيميل التأكيد للعميل" : ""
      );
      await load();
    } finally {
      setBusyKey("");
    }
  }

  async function testNotify() {
    if (busyKey) return;
    setBusyKey("notify");
    setMessage("");
    try {
      const res = await fetch("/api/admin/test-telegram", { method: "POST" });
      const json = await res.json();
      setMessage(json.ok ? json.message || "تم إرسال تجربة الإشعار على الموبايل" : json.error || "فشل الإرسال");
    } finally {
      setBusyKey("");
    }
  }

  async function copyTopic() {
    const topic = notifications?.topic || settings.ntfy_topic;
    if (!topic) return;
    try {
      await navigator.clipboard.writeText(topic);
      setMessage("اتنسخ اسم قناة الإشعار");
    } catch {
      setMessage(topic);
    }
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (saving || busyKey) return;
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instapay_number: settings.instapay_number,
        instapay_name: settings.instapay_name,
        wallet_number: settings.wallet_number,
        wallet_name: settings.wallet_name,
        product_delivery_url: settings.product_delivery_url,
        plant_delivery_url: settings.plant_delivery_url,
        arabity_delivery_url: settings.arabity_delivery_url,
        masaref_delivery_url: settings.masaref_delivery_url,
        whatsapp_number: settings.whatsapp_number,
        ntfy_topic: settings.ntfy_topic,
      }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok || !json.ok) {
      setMessage(json.error || "فشل حفظ الإعدادات");
      return;
    }
    setMessage("اتحفظت إعدادات الدفع. ارجع للصفحة الرئيسية وجرّب الطلب.");
    await load();
    await loadSettings();
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
          <button className="buy-btn" style={{ marginTop: 14 }} disabled={busyKey === "login"}>
            {busyKey === "login" ? "جاري الدخول..." : "دخول"}
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
            <button className="ghost-btn" onClick={testNotify} disabled={Boolean(busyKey)}>
              {busyKey === "notify" ? "جاري الإرسال..." : "تجربة إشعار الموبايل"}
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

        {message ? (
          <div
            className={
              message.includes("اتحفظت") ||
              message.includes("اتبعت") ||
              message.includes("اتنسخ") ||
              message.includes("اتمسح") ||
              message.includes("تم إرسال")
                ? "form-ok"
                : "form-error"
            }
          >
            {message}
          </div>
        ) : null}

        <div className="admin-tabs">
          <button className={tab === "analytics" ? "active" : ""} onClick={() => setTab("analytics")}>
            تحليل
          </button>
          <button className={tab === "orders" ? "active" : ""} onClick={() => setTab("orders")}>
            الطلبات
          </button>
          <button className={tab === "settings" ? "active" : ""} onClick={() => setTab("settings")}>
            إعدادات الدفع
          </button>
        </div>

        <div style={{ marginBottom: 16, color: "#94A3B8" }}>
          الربط: إنستاباي {integrations.instapay ? "✅" : "❌"} — محفظة كاش {integrations.wallet ? "✅" : "❌"} — ميتا CAPI {integrations.meta ? "✅" : "❌"} — إشعارات الموبايل {integrations.mobile ? "✅" : "❌"} — إيميل العملاء {integrations.email ? "✅" : "❌"}
        </div>

        {tab !== "analytics" ? (
          <section className="settings-card notify-card">
            <h2>إشعارات الموبايل مباشرة</h2>
            <p>
              من غير تيليجرام. الإشعار هيظهر على التليفون زي إشعار الواتساب. افتح اللينك من الموبايل واسمح بالإشعارات، أو نزّل تطبيق ntfy المجاني.
            </p>
            <ol className="notify-steps">
              <li>افتح اللينك ده <strong>من الموبايل</strong> واسمح بالإشعارات</li>
              <li>لو آيفون: نزّل تطبيق ntfy وبعدين اضغط تفعيل</li>
              <li>ارجع هنا واضغط تجربة الإشعار</li>
            </ol>
            <div className="notify-actions">
              <a
                className="buy-btn"
                href={notifications?.subscribeUrl || "#"}
                target="_blank"
                rel="noreferrer"
              >
                تفعيل إشعارات الموبايل
              </a>
              <button type="button" className="ghost-btn" onClick={testNotify} disabled={Boolean(busyKey)}>
                {busyKey === "notify" ? "جاري الإرسال..." : "تجربة الإشعار"}
              </button>
              <a className="ghost-btn" href={notifications?.androidApp} target="_blank" rel="noreferrer">
                تطبيق أندرويد
              </a>
              <a className="ghost-btn" href={notifications?.iosApp} target="_blank" rel="noreferrer">
                تطبيق آيفون
              </a>
              <button type="button" className="ghost-btn" onClick={copyTopic}>
                نسخ القناة
              </button>
            </div>
          </section>
        ) : null}

        {tab === "analytics" ? <AdminAnalytics onCleared={() => load()} /> : null}

        {tab === "settings" ? (
          <form className="settings-card" onSubmit={saveSettings}>
            <h2>تفعيل الدفع اليدوي</h2>
            <p>
              العميل بيحوّل إنستاباي أو محفظة كاش، يرفع سكرين التحويل، والطلب بيفضل قيد المراجعة لحد ما تتأكد بنفسك وتضغط «تأكيد الدفع».
            </p>
            <p>
              عشان الأدمن يعرف كل طلب جاي من أنهي إعلان، في Ads Manager حط لينك صفحة المنتج زي ما هو بالظبط (سيب الأقواس زي ما هي). مصارف:
              <code className="settings-code" dir="ltr">
                {"https://www.producthelpyou.online/masaref?utm_source=facebook&utm_medium=paid&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}"}
              </code>
            </p>
            {!usesRemoteDb ? (
              <div className="form-error">
                قاعدة البيانات لسه ملف محلي. على Vercel الإعدادات ممكن تضيع بين الطلبات. الأفضل تربط Turso أو تحط نفس القيم في Environment Variables.
              </div>
            ) : null}
            {envOverrides.instapay || envOverrides.wallet ? (
              <div className="form-ok">
                في قيم متظبطة من Vercel Environment Variables وهتغلب اللي هتحفظه هنا.
              </div>
            ) : null}

            <div className="settings-grid">
              <div className="field">
                <label>رقم إنستاباي</label>
                <input
                  value={settings.instapay_number}
                  onChange={(e) => setSettings({ ...settings, instapay_number: e.target.value })}
                  placeholder="01xxxxxxxxx"
                  dir="ltr"
                />
              </div>
              <div className="field">
                <label>اسم حساب إنستاباي</label>
                <input
                  value={settings.instapay_name}
                  onChange={(e) => setSettings({ ...settings, instapay_name: e.target.value })}
                  placeholder="Mahmoud Elkousy"
                />
              </div>
              <div className="field">
                <label>رقم محفظة كاش</label>
                <input
                  value={settings.wallet_number}
                  onChange={(e) => setSettings({ ...settings, wallet_number: e.target.value })}
                  placeholder="01xxxxxxxxx"
                  dir="ltr"
                />
              </div>
              <div className="field">
                <label>اسم محفظة كاش</label>
                <input
                  value={settings.wallet_name}
                  onChange={(e) => setSettings({ ...settings, wallet_name: e.target.value })}
                  placeholder="Mahmoud Elkousy"
                />
              </div>
              <div className="field">
                <label>واتساب</label>
                <input
                  value={settings.whatsapp_number}
                  onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                  placeholder="201017420379"
                  dir="ltr"
                />
              </div>
              <div className="field settings-wide">
                <label>لينك فولدر عربيتي بعد الدفع (Google Drive: HTML + APK + الدليل)</label>
                <input
                  value={settings.arabity_delivery_url}
                  onChange={(e) => setSettings({ ...settings, arabity_delivery_url: e.target.value })}
                  placeholder="https://drive.google.com/..."
                  dir="ltr"
                />
              </div>
              <div className="field settings-wide">
                <label>لينك فولدر مصارف بعد الدفع (Google Drive: HTML + APK + الدليل)</label>
                <input
                  value={settings.masaref_delivery_url}
                  onChange={(e) => setSettings({ ...settings, masaref_delivery_url: e.target.value })}
                  placeholder="https://drive.google.com/..."
                  dir="ltr"
                />
                <p style={{ marginTop: 8, color: "#94a3b8", fontSize: 13, lineHeight: 1.7 }}>
                  لو فاضي، العميل هيتحوّل لصفحة التحميل على الموقع.
                  <br />
                  <a href="/spend/files.html" target="_blank" rel="noreferrer">صفحة الملفات</a>
                  {" · "}
                  <a href="/spend/masaref-html.zip">HTML ZIP</a>
                  {" · "}
                  <a href="/spend/masaref.apk">APK</a>
                </p>
              </div>
              <div className="field settings-wide">
                <label>قناة إشعار الموبايل (اختياري)</label>
                <input
                  value={settings.ntfy_topic}
                  onChange={(e) => setSettings({ ...settings, ntfy_topic: e.target.value })}
                  placeholder="elkousy-xxxxx"
                  dir="ltr"
                />
              </div>
            </div>
            <button className="buy-btn" disabled={saving}>
              {saving ? "جاري الحفظ..." : "حفظ إعدادات الدفع"}
            </button>
            <p style={{ marginTop: 16 }}>
              إيميل تأكيد الدفع بيتبعت لوحده بعد الدفع. عشان يشتغل حط في Vercel:
              <code className="settings-code" dir="ltr">
                SMTP_USER=ايميلك@gmail.com — SMTP_PASS=كلمة مرور التطبيقات من جوجل
              </code>
            </p>
          </form>
        ) : (
          <>
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
                <small>{stats?.pendingReview ?? 0} تحويل مستني مراجعتك</small>
              </div>
              <div className="stat">
                دفعوا
                <b>{stats?.paid ?? 0}</b>
                <small>
                  {stats?.revenue ?? 0} جنيه — تحويل {conversion}
                </small>
              </div>
            </div>

            <div className="toolbar">
              <input
                className="admin-search"
                placeholder="بحث بالاسم أو الموبايل أو الإعلان"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") load(status, q, product);
                }}
              />
              <select
                className="admin-filter"
                value={product}
                onChange={(e) => {
                  setProduct(e.target.value);
                  load(status, q, e.target.value);
                }}
              >
                <option value="all">كل المنتجات</option>
                <option value="masaref">مصارف</option>
                <option value="arabity">عربيتي</option>
                <option value="plant">دليل النباتات</option>
                <option value="1000">مكتبة الإعلانات</option>
              </select>
              <select
                className="admin-filter"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  load(e.target.value, q, product);
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
              <button
                className="ghost-btn"
                disabled={busyKey === "refresh"}
                onClick={async () => {
                  if (busyKey) return;
                  setBusyKey("refresh");
                  try {
                    await load(status, q, product);
                  } finally {
                    setBusyKey("");
                  }
                }}
              >
                {busyKey === "refresh" ? "جاري التحديث..." : "تحديث"}
              </button>
            </div>

            <table className="admin-table">
              <thead>
                <tr>
                  <th>الطلب</th>
                  <th>العميل</th>
                  <th>الإعلان</th>
                  <th>الوسيلة</th>
                  <th>الحالة</th>
                  <th>الإيميل</th>
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
                      <div style={{ color: "#64748B" }}>{productAdminLabel(order.product_slug)}</div>
                    </td>
                    <td>
                      <div>{order.name}</div>
                      <div>{order.phone}</div>
                      <div>{order.email}</div>
                    </td>
                    <td>
                      {(() => {
                        const source = formatAdPath(parseAdPath(order.ad_path), order);
                        return (
                          <>
                            <div>{source.title}</div>
                            {source.steps.length > 1
                              ? source.steps.map((step) => (
                                  <div key={step} style={{ color: "#94A3B8", fontSize: 12, lineHeight: 1.6 }}>
                                    {step}
                                  </div>
                                ))
                              : (
                                <div style={{ color: "#94A3B8" }}>{source.detail}</div>
                              )}
                          </>
                        );
                      })()}
                    </td>
                    <td>{paymentMethodLabel(order.payment_method)}</td>
                    <td>
                      <span className={`badge ${order.status}`}>{STATUS_AR[order.status] || order.status}</span>
                    </td>
                    <td>
                      {(() => {
                        const email = orderEmailStatus(order);
                        return <span className={`badge email-${email.key}`}>{email.label}</span>;
                      })()}
                    </td>
                    <td>{new Date(order.created_at).toLocaleString("ar-EG")}</td>
                    <td>
                      {order.instapay_screenshot ? (
                        <a href={`/api/admin/orders/${order.id}/screenshot`} target="_blank" rel="noreferrer">
                          السكرين
                        </a>
                      ) : null}
                      {order.status === "pending_review" || order.status === "awaiting_payment" ? (
                        <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                          <button
                            type="button"
                            className="ok-btn"
                            disabled={Boolean(busyKey)}
                            onClick={() => act(order.id, "confirm")}
                          >
                            {busyKey === `${order.id}:confirm` ? "جاري التأكيد..." : "تأكيد الدفع"}
                          </button>
                          {order.status === "pending_review" ? (
                            <button
                              type="button"
                              className="danger-btn"
                              disabled={Boolean(busyKey)}
                              onClick={() => act(order.id, "reject")}
                            >
                              {busyKey === `${order.id}:reject` ? "جاري الرفض..." : "رفض"}
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className="danger-btn"
                            disabled={Boolean(busyKey)}
                            onClick={() => act(order.id, "delete")}
                          >
                            {busyKey === `${order.id}:delete` ? "جاري المسح..." : "مسح"}
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                          {order.status === "paid" ? (
                            <button
                              type="button"
                              className="ok-btn"
                              disabled={Boolean(busyKey)}
                              onClick={() => act(order.id, "email")}
                            >
                              {busyKey === `${order.id}:email` ? "جاري الإرسال..." : "إعادة إرسال الإيميل"}
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className="danger-btn"
                            disabled={Boolean(busyKey)}
                            onClick={() => act(order.id, "delete")}
                          >
                            {busyKey === `${order.id}:delete` ? "جاري المسح..." : "مسح"}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {orders.length === 0 ? <p>مفيش طلبات بالحالة دي.</p> : null}
          </>
        )}
      </div>
    </div>
  );
}
