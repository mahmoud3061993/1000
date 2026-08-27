# صفحة هبوط منتجات محمود القوصي

متجر رقمي لصفحات الهبوط:

- مكتبة +1000 Canva Ads: `/` و `/products/1000`
- دليل رعاية النباتات: الشراء `/buydoctorplant` — الدليل `/products/plant`
- عربيتي: الشراء `/carlanding` — النظام `/car`

الدفع في الاتنين واحد:

- دفع إنستاباي يدوي: العميل يحوّل ويرفع سكرين، والطلب يبقى قيد المراجعة لحد تأكيده من الأدمن
- دفع محفظة كاش يدوي بنفس الطريقة (فودافون / أورنج / وي / اتصالات)
- مفيش فيزا ولا كاشير: ولا طلب بيتأكد لوحده
- إيميل بعد تأكيد الدفع بتفاصيل المنتج ولينك الاستلام
- Meta Pixel + Conversions API (CAPI) لكل الأحداث، و`Purchase` بيتبعت من السيرفر لما الأدمن يأكد الدفع
- لوحة أدمن فيها عدد الدخول، مين ملأ البيانات، مين بيستنى مراجعة التحويل، ومين اتقفل
- إشعارات على الموبايل عن طريق تيليجرام

## عربيتي — `/car`

تطبيق إدارة مصاريف وصيانة العربية (عربي، بدون حساب وبدون إنترنت بعد التحميل):

- التشغيل المحلي: `npm run arabity` ثم http://127.0.0.1:8765
- صفحة هبوط البيع: https://www.producthelpyou.online/carlanding
- على الموقع: https://www.producthelpyou.online/car
- المصدر: مجلد `arabity/` — التوثيق في `arabity/README.md` وبناء الأندرويد في `arabity/BUILD-APK.md`

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
| `SITE_URL` | رابط الموقع النهائي (مهم لـ CAPI) |
| `PRODUCT_DELIVERY_URL` | لينك Google Drive لمكتبة الـ 1000 بعد الدفع |
| `PLANT_PRODUCT_PRICE` | سعر دليل النباتات (الافتراضي 350) |
| `PLANT_DELIVERY_URL` | لينك دخول دليل النباتات بعد الدفع |
| `ARABITY_PRODUCT_PRICE` | سعر عربيتي (الافتراضي 400) |
| `ARABITY_DELIVERY_URL` | لينك Google Drive لفولدر عربيتي بعد الدفع (HTML + APK + الدليل) |
| `PLANT_APP_ORIGIN` | أصل نشر الدليل عشان `/products/plant` تتوجه له |
| `ADMIN_PASSWORD` | دخول لوحة الأدمن |
| `SESSION_SECRET` | مفتاح توقيع جلسة الأدمن |
| `INSTAPAY_NUMBER` / `INSTAPAY_NAME` | رقم واسم إنستاباي |
| `WALLET_NUMBER` / `WALLET_NAME` | رقم واسم محفظة كاش (لو فاضي بياخد رقم إنستاباي) |
| `META_PIXEL_ID` / `META_CAPI_ACCESS_TOKEN` | Pixel + CAPI |
| `META_TEST_EVENT_CODE` | اختياري لاختبار الأحداث من Events Manager |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | إشعارات الموبايل |
| `WHATSAPP_NUMBER` | زر الواتساب العائم |

## الدفع اليدوي

1. من الأدمن حط رقم إنستاباي ورقم محفظة كاش (لو نفس الرقم، سيب محفظة كاش فاضي وهيستخدم رقم إنستاباي)
2. العميل يختار الوسيلة، يحوّل، يرفع سكرين، ويدوس **دفعت**
3. الطلب يدخل **قيد المراجعة**
4. لما تتأكد إن الفلوس وصلت، من الأدمن دوس **تأكيد الدفع**
5. ساعتها بيتبعت `Purchase` لميتا وإيميل الملفات للعميل

مفيش تأكيد تلقائي من بوابة دفع.

## ربط Meta CAPI

1. من Events Manager خد Pixel ID
2. أنشئ Conversions API access token
3. الصفحة بتبعت من المتصفح Pixel ومن السيرفر CAPI بنفس `event_id` عشان ميحصلش double counting
4. الأحداث:
   - `PageView` و `ViewContent` عند فتح الصفحة
   - `Lead` و `InitiateCheckout` عند ملء الفورم
   - `AddPaymentInfo` عند رفع سكرين التحويل
   - `Purchase` فقط بعد تأكيد الأدمن للدفع

## إشعارات الموبايل (تيليجرام)

1. افتح تيليجرام وابحث عن `@BotFather` وأنشئ بوت، خد الـ token
2. ابعت لأي رسالة للبوت بتاعك
3. افتح `https://api.telegram.org/bot<TOKEN>/getUpdates` وانسخ `chat.id`
4. حط `TELEGRAM_BOT_TOKEN` و `TELEGRAM_CHAT_ID`
5. من لوحة الأدمن اضغط «تجربة إشعار الموبايل»

هيجيلك إشعار لما حد يرفع سكرين التحويل، ولما تأكد الدفع بنفسك.

## لوحة الأدمن

`/admin` بتوريك:

- كام حد دخل
- كام حد ملأ البيانات
- كام حد لسه مستني مراجعة التحويل
- كام حد دفع والإيراد
- فتح سكرين التحويل وتأكيد أو رفض الطلب

بعد تأكيد الدفع بيتبعت `Purchase` لميتا ويظهر لينك الملفات في صفحة الشكر.

## تجربة الدفع

من `/admin` تبويب **إعدادات الدفع**:

1. حط رقم إنستاباي واسم الحساب
2. حط رقم محفظة كاش لو مختلف عن إنستاباي
3. احفظ، وارجع لصفحة المنتج

على الصفحة:

- **إنستاباي**: يظهر الرقم، العميل يحوّل، يرفع سكرين شوت، ويدوس **دفعت**. الطلب يدخل قيد المراجعة لحد ما تؤكده من الأدمن.
- **محفظة كاش**: نفس الخطوات على رقم المحفظة.

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
- https://www.producthelpyou.online/car — تطبيق **عربيتي** (مصاريف وصيانة العربية، بدون إنترنت بعد التحميل)
- https://www.producthelpyou.online/admin

## الاختبار

```bash
npm test
```
