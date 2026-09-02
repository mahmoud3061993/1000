import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { messageForOrderSubmitFailure } from "../src/lib/order-errors";

describe("checkout upload errors", () => {
  it("explains Vercel payload-too-large as a big receipt photo", () => {
    assert.match(
      messageForOrderSubmitFailure(413, "Request Entity Too Large\n\nFUNCTION_PAYLOAD_TOO_LARGE\n"),
      /صورة الإيصال كبيرة/
    );
  });

  it("keeps a generic upload message for other network failures", () => {
    assert.match(messageForOrderSubmitFailure(0, ""), /رفع الإيصال/);
    assert.match(messageForOrderSubmitFailure(502, "bad gateway"), /حفظ الطلب/);
  });
});
