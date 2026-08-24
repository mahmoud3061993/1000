# عربيتي

كل حاجة تخص عربيتك... في مكان واحد.

تطبيق عربي كامل (RTL) لإدارة مصاريف وصيانة السيارة **بدون إنترنت، بدون حساب، وبدون سيرفر**. البيانات بتفضل على جهازك (IndexedDB).

الموقع: [producthelpyou.online/car](https://www.producthelpyou.online/car)

## إيه اللي بتقدمه؟

- لوحة تحكم بتقول عربيتك كلفتك كام الشهر ده
- تتبع البنزين واستهلاكه (من تفويلة كاملة لتفويلة كاملة)
- صيانة مع العد التنازلي بالكيلومتر والتاريخ
- إصلاحات، مصاريف، مستندات، كاوتش، بطارية
- حالة متابعة (Car Care Score) — مش تشخيص ميكانيكي
- ملاحظات ذكية من الأرقام المسجّلة (من غير ذكاء اصطناعي)
- تقارير للطباعة وPDF من المتصفح
- دليل ورش، قائمة سفر، تذكيرات
- تصدير/استيراد نسخة احتياطية بين اللابتوب والموبايل
- عربيات متعددة، وضع فاتح/داكن، بيانات تجريبية

## البنية

```
arabity/
  src/                 مصدر التطبيق (HTML/CSS/JS)
  dist/                نسخة الإنتاج للديسكتوب
  android/             مشروع Capacitor (بعد المزامنة)
  desktop/             تشغيل ويندوز/لينكس بدون Node
  docs/                توثيق إضافي
  capacitor.config.json
public/car/            نفس المصدر ليشتغل على الموقع تحت /car
```

التخزين: IndexedDB (`arabity-db`) مع ترقية إصدارات من غير مسح بيانات. الإعدادات الخفيفة (المظهر) في localStorage.

## تشغيل الديسكتوب (للعميل)

مفيش إنترنت ولا Node.

1. انسخ مجلد `arabity/dist` (أو حزمة التوزيع).
2. ويندوز: شغّل `arabity/desktop/start-windows.bat`
3. لينكس: `bash arabity/desktop/start-linux.sh`
4. هيفتح http://127.0.0.1:8765

التشغيل من `file://` ممكن يمنع IndexedDB في بعض المتصفحات؛ السيرفر المحلي البسيط هو الطريقة الموثوقة.

## تشغيل التطوير

```bash
cd arabity
npm install
npm run dev          # http://127.0.0.1:8765
npm test
npm run build        # ينسخ إلى dist/ و public/car/
```

من جذر المشروع (مع موقع Next.js):

```bash
npm run arabity
npm run arabity:build
```

الموقع الكامل (المتجر + عربيتي على `/car`):

```bash
npm install
npm run dev          # http://localhost:3000/car
```

## النسخ الاحتياطي

- **تصدير:** الإعدادات → تصدير نسخة احتياطية → ملف `arabity-backup-YYYY-MM-DD.json`
- **استيراد:** دمج (من غير تكرار لنفس الـ ID) أو استبدال كامل بعد تحذير واضح

انقل الملف بأي طريقة (كابل، درايف، واتساب) بين اللابتوب والموبايل.

## أندرويد

راجع [BUILD-APK.md](BUILD-APK.md).

معرّف الحزمة: `com.arabity.cartracker`  
اسم التطبيق: عربيتي

## الخصوصية

كل البيانات محلية. مفيش تحليلات، تتبع، Firebase، أو API خارجي. الخطوط والأيقونات والرسوم محلية.

## تغيير الهوية البصرية

- الاسم: `arabity/src/index.html` و `capacitor.config.json` (`appName`)
- الحزمة: `capacitor.config.json` ← `appId` ثم `npx cap sync`
- الألوان: `arabity/src/css/variables.css`
- الشعار: `arabity/src/assets/icons/favicon.svg`
- العملة الافتراضية: `DEFAULT_SETTINGS` في `arabity/src/js/constants.js` و شاشة الإعدادات
