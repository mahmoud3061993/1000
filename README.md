# صفحة هبوط منتجات محمود القوصي

متجر رقمي لصفحات الهبوط:

- مكتبة +1000 Canva Ads: `/` و `/products/1000`
- دليل رعاية النباتات: الشراء `/buydoctorplant` — الدليل `/products/plant`

الدفع في الاتنين واحد:

- دفع كاشير (فيزا / محفظة) وتحويل تلقائي لصفحة الشكر بعد نجاح الدفع
- دفع إنستاباي يدوي مع رفع سكرين شوت، والطلب يبقى قيد المراجعة لحد تأكيده من الأدمن
- إيميل بعد تأكيد الدفع بتفاصيل المنتج ولينك الاستلام
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
| `PRODUCT_DELIVERY_URL` | لينك Google Drive لمكتبة الـ 1000 بعد الدفع |
| `PLANT_PRODUCT_PRICE` | سعر دليل النباتات (الافتراضي 350) |
| `PLANT_DELIVERY_URL` | لينك دخول دليل النباتات بعد الدفع |
| `PLANT_APP_ORIGIN` | أصل نشر الدليل عشان `/products/plant` تتوجه له |
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

## تجربة الدفع

من `/admin` تبويب **إعدادات الدفع**:

1. حط رقم إنستاباي واسم الحساب
2. حط كاشير `MID` و Payment API Key (`live` أو `test`)
3. احفظ، وارجع لصفحة المنتج

على الصفحة:

- **إنستاباي**: يظهر الرقم، العميل يحوّل، يرفع سكرين شوت، ويدوس **دفعت**. الطلب يدخل قيد المراجعة لحد ما تؤكده من الأدمن.
- **فيزا / محفظة**: بيحوّل العميل على كاشير (`card,wallet`). بعد نجاح الدفع كاشير يرجع على `/api/kashier/callback` وبعدين صفحة الشكر.

Webhook كاشير:

`https://www.producthelpyou.online/api/kashier/webhook`

لو حطيت نفس القيم في Vercel Environment Variables هتغلب اللي في الأدمن.

## الرفع على Vercel وربط producthelpyou.online

Vercel مناسب للمشروع بعد ما قاعدة البيانات بقت Turso/libSQL (مش ملف محلي). رابط الإعلانات القديم `/products/1000` شغال كمان.

### 1) قاعدة Turso المجانية (دقيقة أو اتنين)

1. اعمل حساب على [turso.tech](https://turso.tech)
2. أنشئ Database باسم `elkousy`
3. انسخ:
   - `TURSO_DATABASE_URL` (بتبدأ بـ `libsql://`)
   - `TURSO_AUTH_TOKEN`

### 2) ارفع المشروع على Vercel

من [vercel.com/new](https://vercel.com/new) اختار ريبو `mahmoud3061993/1000` والفرع `cursor/landing-kashier-capi-admin-12bb` (أو `main` بعد الدمج).

حط Environment Variables:

```
SITE_URL=https://www.producthelpyou.online
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
ADMIN_PASSWORD=...
SESSION_SECRET=...
KASHIER_MID=...
KASHIER_API_KEY=...
KASHIER_MODE=live
INSTAPAY_NUMBER=...
INSTAPAY_NAME=...
META_PIXEL_ID=...
META_CAPI_ACCESS_TOKEN=...
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
PRODUCT_DELIVERY_URL=...
WHATSAPP_NUMBER=201017420379
```

### 3) ربط الدومين

في Vercel → Project → Settings → Domains ضيف:

- `producthelpyou.online`
- `www.producthelpyou.online`

عند شركة الدومين (أو Cloudflare) غيّر الـ DNS من Easy Orders إلى Vercel:

```
A      @      10.0.1.2
CNAME  www    cname.vercel-dns.com
```

بعد ما الـ DNS يتحدث، الصفحة هتبقى:

- https://www.producthelpyou.online
- https://www.producthelpyou.online/products/1000
- https://www.producthelpyou.online/admin

وWebhook كاشير:

`https://www.producthelpyou.online/api/kashier/webhook`

## الاختبار

```bash
npm test
```
