"use client";

import { useEffect, useState } from "react";
import { firePixel } from "@/components/TrackingBoot";

type OrderInfo = {
  id: string;
  status: string;
  name: string;
  email: string;
  amount: number;
  currency: string;
  payment_method: string;
  purchase_event_id: string | null;
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

  useEffect(() => {
    if (!orderId) return;
    fetch(`/api/orders/${orderId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setOrder(json);
      })
      .catch(() => {});
    fetch("/api/public-config")
      .then((r) => r.json())
      .then((json) => setDeliveryUrl(json.deliveryUrl || ""))
      .catch(() => {});
  }, [orderId]);

  useEffect(() => {
    if (!order || order.status !== "paid") return;
    const eventId = order.purchase_event_id || order.id;
    firePixel(
      "Purchase",
      { value: order.amount, currency: order.currency, content_ids: ["1000"] },
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
            <p>شكراً {order?.name}. المكتبة هتوصلك على الإيميل، وتقدر تفتحها من الرابط تحت.</p>
            {deliveryUrl ? (
              <a className="drive-link" href={deliveryUrl} target="_blank" rel="noreferrer">
                افتح المكتبة دلوقتي
              </a>
            ) : (
              <p>هنبعتلك لينك Google Drive على الإيميل خلال دقايق.</p>
            )}
          </>
        ) : waiting ? (
          <>
            <h1>طلبك قيد المراجعة</h1>
            <p>استلمنا سكرين شوت إنستاباي. أول ما نتأكد من التحويل هنبعتلك المكتبة على الإيميل.</p>
          </>
        ) : (
          <>
            <h1>جاري تأكيد الطلب</h1>
            <p>لو دفعت كاشير واستنيت شوية وهتتأكد تلقائي. لو الصفحة فضلت كده، ابعتلنا على واتساب رقم الطلب.</p>
          </>
        )}
        {orderId ? <p style={{ marginTop: 18, color: "#64748B" }}>رقم الطلب: {orderId}</p> : null}
      </div>
    </main>
  );
}
