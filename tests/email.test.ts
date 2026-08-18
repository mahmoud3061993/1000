import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { emailConfigured } from "../src/lib/config";
import {
  PURCHASE_EMAIL_SUBJECT,
  buildPurchaseEmail,
  displayWhatsapp,
} from "../src/lib/email";

describe("paid order delivery email", () => {
  it("keeps the store subject and Drive link", () => {
    const drive = "https://drive.google.com/drive/u/0/folders/1YA69JKnLz1cCSa6913KvyuZdksZH-p6O";
    const email = buildPurchaseEmail({
      name: "أحمد",
      deliveryUrl: drive,
      whatsappDisplay: "01017420379",
    });
    assert.equal(email.subject, PURCHASE_EMAIL_SUBJECT);
    assert.match(email.subject, /تم تأكيد طلبك/);
    assert.match(email.text, /أهلًا بيك/);
    assert.match(email.text, /1000 Winning Static Ads/);
    assert.match(email.text, /860 Social Media Organic/);
    assert.match(email.text, /Ultimate CRO Checklist/);
    assert.match(email.text, /01017420379/);
    assert.match(email.text, /محمود القوصي/);
    assert.match(email.html, /dir="rtl"/);
    assert.equal(email.text.includes(drive), true);
    assert.equal(email.html.includes(drive), true);
  });

  it("formats Egyptian WhatsApp numbers for the email", () => {
    assert.equal(displayWhatsapp("201017420379"), "01017420379");
    assert.equal(displayWhatsapp("01017420379"), "01017420379");
  });

  it("treats email as ready when SMTP or Resend is set", () => {
    assert.equal(emailConfigured({}), false);
    assert.equal(emailConfigured({ SMTP_USER: "a@gmail.com", SMTP_PASS: "app-pass" }), true);
    assert.equal(emailConfigured({ RESEND_API_KEY: "re_test" }), true);
  });
});
