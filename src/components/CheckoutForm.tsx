"use client";

import { useMemo, useState } from "react";
import { firePixel, getMetaCookies } from "./TrackingBoot";

type Method = "kashier" | "instapay";

export function CheckoutForm({
  instapayNumber,
  instapayName,
  kashierReady,
}: {
  instapayNumber: string;
  instapayName: string;
  kashierReady: boolean;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState<Method>(kashierReady ? "kashier" : "instapay");
  const [orderId, setOrderId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const canSubmit = useMemo(() => name && email && phone && !busy, [name, email, phone, busy]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (method === "instapay" && orderId) {
        if (!file) {
          setError("ارفع سكرين شوت التحويل من إنستاباي");
          setBusy(false);
          return;
        }
        const data = new FormData();
        data.set("screenshot", file);
        const res = await fetch(`/api/orders/${orderId}/instapay`, { method: "POST", body: data });
        const json = await res.json();
        if (!res.ok || !json.ok) {
          setError(json.error || "حصل خطأ في رفع الإيصال");
          setBusy(false);
          return;
        }
        window.location.href = json.redirect;
        return;
      }

      const cookies = getMetaCookies();
      const leadEventId = crypto.randomUUID();
      const checkoutEventId = crypto.randomUUID();
      firePixel("Lead", { content_name: "+1000 Canva Ads" }, leadEventId);
      firePixel("InitiateCheckout", { value: 235, currency: "EGP" }, checkoutEventId);

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          method,
          leadEventId,
          checkoutEventId,
          ...cookies,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error || "حصل خطأ، جرّب تاني");
        setBusy(false);
        return;
      }

      if (json.method === "kashier" && json.checkoutUrl) {
        window.location.href = json.checkoutUrl;
        return;
      }

      setOrderId(json.orderId);
      setBusy(false);
    } catch {
      setError("حصل خطأ في الاتصال");
      setBusy(false);
    }
  }

  return (
    <section id="order-form" className="checkout-wrap">
      <h2 className="checkout-title">+1000 winning conversion ads canva editable templates</h2>
      <div className="checkout-price">
        <strong>235 ج.م</strong>
        <s>2870 ج.م</s>
      </div>
      <div className="checkout-box">
        <h3>يرجى ادخال معلوماتك لإكمال الطلب</h3>
        <form onSubmit={submit}>
          {error ? <div className="form-error">{error}</div> : null}
          <div className="field">
            <label>الاسم</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="اسمك بالكامل" />
          </div>
          <div className="field">
            <label>الإيميل</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="hannah.h@example.com" />
          </div>
          <div className="field">
            <label>رقم الموبايل</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="01xxxxxxxxx" />
          </div>

          <div className="pay-grid">
            <button
              type="button"
              className={`pay-option ${method === "kashier" ? "active" : ""}`}
              onClick={() => setMethod("kashier")}
              disabled={!kashierReady}
            >
              فيزا / محفظة
              <small>{kashierReady ? "دفع فوري عبر كاشير" : "كاشير مش متظبط لسه"}</small>
            </button>
            <button
              type="button"
              className={`pay-option ${method === "instapay" ? "active" : ""}`}
              onClick={() => setMethod("instapay")}
              disabled={!instapayNumber}
            >
              إنستاباي
              <small>حول وابعت سكرين شوت</small>
            </button>
          </div>

          {method === "instapay" && orderId ? (
            <div className="instapay-box">
              <div>حوّل {235} جنيه إنستاباي على:</div>
              <div>{instapayName}</div>
              <code>{instapayNumber}</code>
              <button
                type="button"
                className="copy-btn"
                onClick={async () => {
                  await navigator.clipboard.writeText(instapayNumber);
                  setCopied(true);
                }}
              >
                {copied ? "تم النسخ" : "نسخ الرقم"}
              </button>
              <div className="field" style={{ marginTop: 14 }}>
                <label>سكرين شوت إيصال التحويل</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  required
                />
              </div>
            </div>
          ) : null}

          <div className="total-row">
            <span>الاجمالي</span>
            <span>235 ج.م</span>
          </div>
          <button className="buy-btn" disabled={!canSubmit}>
            {busy
              ? "جاري التحويل..."
              : method === "instapay" && orderId
                ? "رفع الإيصال وإرسال الطلب"
                : "اشتري الملف دلوقتي"}
          </button>
        </form>
      </div>
    </section>
  );
}
