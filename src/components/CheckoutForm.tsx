"use client";

import { useMemo, useState } from "react";
import { firePixel, getTrackingContext } from "./TrackingBoot";

type Method = "kashier" | "instapay";

export function CheckoutForm({
  instapayNumber,
  instapayName,
  kashierReady,
  price = 235,
  compareAtPrice = 2870,
  productSlug = "1000",
  productTitle = "+1000 winning conversion ads canva editable templates",
  pixelName = "+1000 Canva Ads",
}: {
  instapayNumber: string;
  instapayName: string;
  kashierReady: boolean;
  price?: number;
  compareAtPrice?: number;
  productSlug?: string;
  productTitle?: string;
  pixelName?: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState<Method>(
    kashierReady ? "kashier" : instapayNumber ? "instapay" : "kashier"
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");

  const canSubmit = useMemo(() => {
    if (!name || !email || !phone || busy) return false;
    if (method === "instapay") return Boolean(instapayNumber && file);
    return kashierReady;
  }, [name, email, phone, busy, method, instapayNumber, file, kashierReady]);

  function pickFile(next: File | null) {
    setFile(next);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(next ? URL.createObjectURL(next) : "");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (method === "instapay" && !file) {
        setError("ارفع سكرين شوت التحويل من إنستاباي وبعدين دوس دفعت");
        setBusy(false);
        return;
      }

      const cookies = getTrackingContext();
      const leadEventId = crypto.randomUUID();
      const checkoutEventId = crypto.randomUUID();
      const payEventId = crypto.randomUUID();
      firePixel("Lead", { content_name: pixelName, content_ids: [productSlug] }, leadEventId);
      let checkoutAlready = false;
      try {
        checkoutAlready = Boolean(sessionStorage.getItem(`elkousy-funnel:${productSlug}:InitiateCheckout`));
      } catch {
        checkoutAlready = false;
      }
      if (!checkoutAlready) {
        firePixel(
          "InitiateCheckout",
          { value: price, currency: "EGP", content_name: pixelName, content_ids: [productSlug] },
          checkoutEventId
        );
      }
      firePixel("AddPaymentInfo", { value: price, currency: "EGP", content_name: pixelName, content_ids: [productSlug] }, payEventId);

      const common = {
        ...cookies,
        name,
        email,
        phone,
        method,
        productSlug,
        leadEventId,
        checkoutEventId,
        payEventId,
        checkoutAlready,
        adPath: JSON.stringify(cookies.adPath || []),
      };

      let res: Response;
      if (method === "instapay" && file) {
        const data = new FormData();
        Object.entries(common).forEach(([key, value]) => {
          if (value) data.set(key, String(value));
        });
        data.set("screenshot", file);
        res = await fetch("/api/orders", { method: "POST", body: data });
      } else {
        res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(common),
        });
      }

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

      window.location.href = json.redirect || `/thank-you?order=${json.orderId}&pending=1`;
    } catch {
      setError("حصل خطأ في الاتصال");
      setBusy(false);
    }
  }

  return (
    <section id="order-form" className="checkout-wrap">
      <h2 className="checkout-title">{productTitle}</h2>
      <div className="checkout-price">
        <strong>{price} ج.م</strong>
        <s>{compareAtPrice} ج.م</s>
      </div>
      <div className="checkout-box">
        <h3>يرجى ادخال معلوماتك لإكمال الطلب</h3>
        <form onSubmit={submit}>
          {error ? <div className="form-error">{error}</div> : null}
          {!kashierReady && !instapayNumber ? (
            <div className="form-error">
              الدفع مش متظبط لسه. من لوحة الأدمن حط رقم إنستاباي أو مفاتيح كاشير.
            </div>
          ) : null}
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
              <small>{kashierReady ? "دفع فوري عبر كاشير" : "كاشير مش متظبط لسه — من الأدمن"}</small>
            </button>
            <button
              type="button"
              className={`pay-option ${method === "instapay" ? "active" : ""}`}
              onClick={() => setMethod("instapay")}
              disabled={!instapayNumber}
            >
              إنستاباي
              <small>{instapayNumber ? "حوّل وارفع السكرين ودوس دفعت" : "ضيف رقم إنستاباي من الأدمن"}</small>
            </button>
          </div>

          {method === "instapay" && instapayNumber ? (
            <div className="instapay-box">
              <div className="instapay-steps">حوّل {price} جنيه إنستاباي، ارفع سكرين التحويل، وبعدين دوس دفعت.</div>
              {instapayName ? <div>{instapayName}</div> : null}
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
                  onChange={(e) => pickFile(e.target.files?.[0] || null)}
                  required
                />
              </div>
              {preview ? (
                <img src={preview} alt="سكرين التحويل" className="screenshot-preview" />
              ) : null}
            </div>
          ) : null}

          <div className="total-row">
            <span>الاجمالي</span>
            <span>{price} ج.م</span>
          </div>
          <button className="buy-btn" disabled={!canSubmit}>
            {busy
              ? method === "kashier"
                ? "جاري التحويل لكاشير..."
                : "جاري إرسال الإيصال..."
              : method === "instapay"
                ? "دفعت"
                : "ادفع بفيزا أو محفظة"}
          </button>
        </form>
      </div>
    </section>
  );
}
