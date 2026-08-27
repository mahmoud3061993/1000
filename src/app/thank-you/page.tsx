"use client";

import { useEffect, useState } from "react";
import { firePixel, ensureOriginalFbc } from "@/components/TrackingBoot";

type OrderInfo = {
  id: string;
  status: string;
  name: string;
  email: string;
  amount: number;
  currency: string;
  payment_method: string;
  purchase_event_id: string | null;
  product_slug?: string | null;
};

export default function ThankYouPage({
  searchParams,
}: {
  searchParams: { order?: string; pending?: string; error?: string };
}) {
  return <ThankYouClient orderId={searchParams.order || ""} pending={searchParams.pending === "1"} error={searchParams.error || ""} />;
}

function ThankYouClient({
  orderId,
  pending,
  error,
}: {
  orderId: string;
  pending: boolean;
  error: string;
}) {
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [deliveryUrl, setDeliveryUrl] = useState("");
  const [cta, setCta] = useState("افتح المكتبة دلوقتي");
  const [paidBody, setPaidBody] = useState("المكتبة هتوصلك على الإيميل، وتقدر تفتحها من الرابط تحت.");
  const [pendingBody, setPendingBody] = useState(
    "استلمنا سكرين التحويل. أول ما نتأكد إن الدفع وصل هنبعتلك الملفات على الإيميل."
  );

  useEffect(() => {
    if (!orderId) return;
    fetch(`/api/orders/${orderId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setOrder(json);
        const slug = json.product_slug || "1000";
        return fetch(`/api/public-config?product=${encodeURIComponent(slug)}`);
      })
      .then((r) => r?.json())
      .then((json) => {
        if (!json) return;
        setDeliveryUrl(json.deliveryUrl || "");
        if (json.thankYouCta) setCta(json.thankYouCta);
        if (json.thankYouBody) setPaidBody(json.thankYouBody);
        if (json.pendingBody) setPendingBody(json.pendingBody);
      })
      .catch(() => {});
  }, [orderId]);

  useEffect(() => {
    if (!order || order.status !== "paid") return;
    ensureOriginalFbc();
    const eventId = order.purchase_event_id || order.id;
    firePixel(
      "Purchase",
      { value: order.amount, currency: order.currency, content_ids: [order.product_slug || "1000"] },
      eventId
    );
  }, [order]);

  const paid = order?.status === "paid";
  const waiting = pending || order?.status === "pending_review";

  return (
    <main className="thankyou">
      <div className="thankyou-card">
        {error === "failed" ? (
          <>
            <h1>الدفع لم يكتمل</h1>
            <p>لو المبلغ اتخصم تواصل معانا على واتساب وهنراجع العملية.</p>
            <a className="drive-link" href="/">الرجوع للصفحة</a>
          </>
        ) : paid ? (
          <>
            <h1>تم الدفع بنجاح</h1>
            <p>
              شكراً {order?.name}.{" "}
              {paidBody.replace("{name}. ", "").replace("{name}", order?.name || "")}
            </p>
            {deliveryUrl ? (
              <a className="drive-link" href={deliveryUrl} target="_blank" rel="noreferrer">
                {cta}
              </a>
            ) : (
              <p>التفاصيل ولينك الدخول هتوصلك على الإيميل خلال دقايق.</p>
            )}
          </>
        ) : waiting ? (
          <>
            <h1>طلبك قيد المراجعة</h1>
            <p>{pendingBody}</p>
          </>
        ) : (
          <>
            <h1>جاري تأكيد الطلب</h1>
            <p>طلبك مستني مراجعة التحويل. أول ما نتأكد إن الدفع وصل هنبعتلك الملفات على الإيميل.</p>
          </>
        )}
        {orderId ? <p style={{ marginTop: 18, color: "#64748B" }}>رقم الطلب: {orderId}</p> : null}
      </div>
    </main>
  );
}
