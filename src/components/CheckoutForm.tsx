"use client";

import { useMemo, useState } from "react";
import { firePixel, getTrackingContext } from "./TrackingBoot";

type Method = "instapay" | "wallet";

export function CheckoutForm({
  instapayNumber,
  instapayName,
  walletNumber,
  walletName,
  price = 235,
  compareAtPrice = 2870,
  productSlug = "1000",
  productTitle = "+1000 winning conversion ads canva editable templates",
  pixelName = "+1000 Canva Ads",
  formNotice = "",
}: {
  instapayNumber: string;
  instapayName: string;
  walletNumber: string;
  walletName: string;
  price?: number;
  compareAtPrice?: number;
  productSlug?: string;
  productTitle?: string;
  pixelName?: string;
  formNotice?: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState<Method>(instapayNumber ? "instapay" : "wallet");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");

  const transferNumber = method === "wallet" ? walletNumber : instapayNumber;
  const transferName = method === "wallet" ? walletName : instapayName;
  const payReady = Boolean(instapayNumber || walletNumber);

  const canSubmit = useMemo(() => {
    if (!name || !email || !phone || busy || !file) return false;
    return Boolean(transferNumber);
  }, [name, email, phone, busy, file, transferNumber]);

  function pickFile(next: File | null) {
    setFile(next);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(next ? URL.createObjectURL(next) : "");
  }

  function chooseMethod(next: Method) {
    setMethod(next);
    setCopied(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (!file) {
        setError("ارفع سكرين شوت التحويل وبعدين دوس دفعت");
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

      const data = new FormData();
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
      Object.entries(common).forEach(([key, value]) => {
        if (value) data.set(key, String(value));
      });
      data.set("screenshot", file);

      const res = await fetch("/api/orders", { method: "POST", body: data });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error || "حصل خطأ، جرّب تاني");
        setBusy(false);
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
        {compareAtPrice > price ? <s>{compareAtPrice} ج.م</s> : null}
      </div>
      <div className="checkout-box">
        {formNotice ? <p className="checkout-notice">{formNotice}</p> : null}
        <h3>يرجى ادخال معلوماتك لإكمال الطلب</h3>
        <form onSubmit={submit}>
          {error ? <div className="form-error">{error}</div> : null}
          {!payReady ? (
            <div className="form-error">
              الدفع مش متظبط لسه. من لوحة الأدمن حط رقم إنستاباي أو رقم محفظة كاش.
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
              className={`pay-option ${method === "instapay" ? "active" : ""}`}
              onClick={() => chooseMethod("instapay")}
              disabled={!instapayNumber}
            >
              إنستاباي
              <small>{instapayNumber ? "حوّل وارفع السكرين" : "ضيف الرقم من الأدمن"}</small>
            </button>
            <button
              type="button"
              className={`pay-option ${method === "wallet" ? "active" : ""}`}
              onClick={() => chooseMethod("wallet")}
              disabled={!walletNumber}
            >
              محفظة كاش
              <small>{walletNumber ? "فودافون / أورنج / وي / اتصالات" : "ضيف الرقم من الأدمن"}</small>
            </button>
          </div>

          {transferNumber ? (
            <div className="instapay-box">
              <div className="instapay-steps">
                {method === "wallet"
                  ? `حوّل ${price} جنيه على محفظة كاش، ارفع سكرين التحويل، وبعدين دوس دفعت.`
                  : `حوّل ${price} جنيه إنستاباي، ارفع سكرين التحويل، وبعدين دوس دفعت.`}
              </div>
              {transferName ? <div>{transferName}</div> : null}
              <code>{transferNumber}</code>
              <button
                type="button"
                className="copy-btn"
                onClick={async () => {
                  await navigator.clipboard.writeText(transferNumber);
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
            {busy ? "جاري إرسال الإيصال..." : "دفعت"}
          </button>
        </form>
      </div>
    </section>
  );
}
