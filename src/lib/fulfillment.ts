import { sendCapiEvent } from "./capi";
import { SITE_URL } from "./config";
import { Order, markOrderPaid } from "./db";
import { notifyOrder } from "./telegram";

export async function fulfillPaidOrder(
  order: Order,
  extra?: Partial<Order>
) {
  if (order.status === "paid") {
    return order;
  }

  const purchaseEventId = order.purchase_event_id || crypto.randomUUID();
  const paid = await markOrderPaid(order.id, {
    purchase_event_id: purchaseEventId,
    ...extra,
  });
  if (!paid) return null;

  await sendCapiEvent({
    eventName: "Purchase",
    eventId: purchaseEventId,
    eventSourceUrl: `${SITE_URL}/thank-you?order=${paid.id}`,
    user: {
      email: paid.email,
      phone: paid.phone,
      firstName: paid.name,
      ip: paid.ip || "",
      userAgent: paid.user_agent || "",
      fbp: paid.fbp || "",
      fbc: paid.fbc || "",
      externalId: paid.session_id,
    },
    customData: {
      value: paid.amount,
      currency: paid.currency,
      orderId: paid.id,
    },
  });

  await notifyOrder("paid", paid);
  return paid;
}
