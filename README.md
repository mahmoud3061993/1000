# صفحة هبوط +1000 Canva Ads

متجر رقمي لنفس صفحة الهبوط الحالية، مع:

- دفع كاشير (فيزا / محفظة) وتحويل تلقائي لصفحة الشكر بعد نجاح الدفع
- دفع إنستاباي يدوي مع رفع سكرين شوت، والطلب يبقى قيد المراجعة لحد تأكيده من الأدمن
- Meta Pixel + Conversions API (CAPI) لكل الأحداث، و`Purchase` بيتبعت من السيرفر لما الدفع يتأكد
- لوحة أدمن فيها عدد الدخول، مين ملأ البيانات، مين بيحاول يدفع، ومين دفع
- إشعارات على الموبايل عن طريق تيليجرام

## التشغيل محليًا

```bash
cp .env.example .env.local
npm install
npm run dev
```

- الصفحة: http://localhost:3000
- الأدمن: http://localhost:3000/admin

## المتغيرات المهمة

انسخ `.env.example` إلى `.env.local` وعدّل:

| المتغير | الغرض |
| --- | --- |
| `SITE_URL` | رابط الموقع النهائي (مهم لكاشير وCAPI) |
| `PRODUCT_DELIVERY_URL` | لينك Google Drive اللي هيظهر بعد الدفع |
| `ADMIN_PASSWORD` | دخول لوحة الأدمن |
| `SESSION_SECRET` | مفتاح توقيع جلسة الأدمن |
| `KASHIER_MID` / `KASHIER_API_KEY` / `KASHIER_MODE` | ربط كاشير (`live` أو `test`) |
| `INSTAPAY_NUMBER` / `INSTAPAY_NAME` | بيانات التحويل اليدوي |
| `META_PIXEL_ID` / `META_CAPI_ACCESS_TOKEN` | Pixel + CAPI |
| `META_TEST_EVENT_CODE` | اختياري لاختبار الأحداث من Events Manager |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | إشعارات الموبايل |
| `WHATSAPP_NUMBER` | زر الواتساب العائم |

## ربط كاشير

1. ادخل [لوحة التاجر](https://merchant.kashier.io)
2. انسخ الـ Merchant ID (`MID-xx-xx`) و Payment API Key
3. حطهم في البيئة، و`KASHIER_MODE=live` بعد ما الحساب يتفعّل
4. في إعدادات Webhook عند كاشير حط:
   `https://your-domain.com/api/kashier/webhook`
5. كاشير بيرجع العميل على:
   `https://your-domain.com/api/kashier/callback`
   وبعد التحقق من التوقيع بيتحوّل لصفحة الشكر

الوسائل المسموحة: `card,wallet` (فيزا ومحفظة).

## ربط Meta CAPI

1. من Events Manager خد Pixel ID
2. أنشئ Conversions API access token
3. الصفحة بتبعت من المتصفح Pixel ومن السيرفر CAPI بنفس `event_id` عشان ميحصلش double counting
4. الأحداث:
   - `PageView` و `ViewContent` عند فتح الصفحة
   - `Lead` و `InitiateCheckout` عند ملء الفورم
   - `AddPaymentInfo` عند التحويل لكاشير أو رفع سكرين إنستاباي
   - `Purchase` فقط بعد دفع كاشير الناجح أو بعد تأكيد الأدمن لإنستاباي

## إشعارات الموبايل (تيليجرام)

1. افتح تيليجرام وابحث عن `@BotFather` وأنشئ بوت، خد الـ token
2. ابعت لأي رسالة للبوت بتاعك
3. افتح `https://api.telegram.org/bot<TOKEN>/getUpdates` وانسخ `chat.id`
4. حط `TELEGRAM_BOT_TOKEN` و `TELEGRAM_CHAT_ID`
5. من لوحة الأدمن اضغط «تجربة إشعار الموبايل»

هيجيلك إشعار لما حد يحاول يدفع كاشير، لما يرفع سكرين إنستاباي، ولما الدفع يتأكد.

## لوحة الأدمن

`/admin` بتوريك:

- كام حد دخل
- كام حد ملأ البيانات
- كام حد لسه بيحاول يدفع (كاشير أو إنستاباي pending)
- كام حد دفع والإيراد
- فتح سكرين إنستاباي وتأكيد أو رفض التحويل

بعد تأكيد إنستاباي بيتبعت `Purchase` لميتا ويظهر لينك المكتبة في صفحة الشكر.

## النشر

الموقع محتاج سيرفر Node فيه مساحة ثابتة لقاعدة SQLite (`data/app.db`) وصور الإنستاباي (`data/uploads`). مناسب لـ Railway / Render / VPS، مش مناسب لـ Vercel من غير قاعدة خارجية.

```bash
npm run build
npm start
```

أو Docker:

```bash
docker build -t elkousy-1000 .
docker run -p 3000:3000 --env-file .env.local -v $(pwd)/data:/app/data elkousy-1000
```

## الاختبار

```bash
npm test
```
