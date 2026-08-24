# بناء APK لتطبيق عربيتي (من غير Play Store)

التطبيق بيتثبّت يدويًا على الموبايل (sideload) ويشتغل أوفلاين بعد التثبيت.

- اسم التطبيق: **عربيتي**
- Package ID: `com.arabity.cartracker`
- ملف التثبيت: `public/car/arabity.apk` وعلى الموقع `/car/arabity.apk`

## تثبيت على الموبايل

1. حمّل `arabity.apk` من الموقع أو من الإعدادات داخل النسخة الويب
2. على أندرويد: **الإعدادات → الأمان → تثبيت تطبيقات غير معروفة** (أو اسمح للمتصفح/مدير الملفات بالتثبيت)
3. افتح الملف ودوس **تثبيت**
4. لو ظهر تحذير Play Protect: اختار **تثبيت على أي حال** — التطبيق مش على المتجر ومش بيطلب صلاحيات غريبة

بعد التثبيت مش محتاج إنترنت. البيانات بتتحفظ على الموبايل. تقدر تنقلها للابتوب بنسخة احتياطية JSON من الإعدادات.

## بناء الـ APK هنا

```bash
cd arabity
npm install
bash scripts/build-apk.sh
```

السكربت يثبّت Android SDK في `$HOME/android-sdk` لو مش موجود، يزامن Capacitor، ويطلع:

- `arabity/dist/arabity.apk`
- `public/car/arabity.apk`

المتطلبات: Node.js 20+ و JDK 17 أو 21.

التوقيع: `android/app/arabity-sideload.jks` (مخصص للتثبيت اليدوي، مش Play Store). نفس المفتاح لازم يتستخدم في التحديثات عشان التثبيت فوق النسخة القديمة من غير مسح بيانات.

## من Android Studio

```bash
cd arabity
npm install
npm run build
npx cap sync android
npx cap open android
```

**Build → Build Bundle(s) / APK(s) → Build APK(s)**

مسار التجريبي: `arabity/android/app/build/outputs/apk/debug/app-debug.apk`  
مسار الإطلاق الموقَّع: `arabity/android/app/build/outputs/apk/release/app-release.apk`

## تغيير الاسم أو الحزمة

- الاسم الظاهر: `capacitor.config.json` → `appName` ثم `npx cap sync`
- أيضاً `android/app/src/main/res/values/strings.xml` → `app_name`
- Package ID: `capacitor.config.json` → `appId`
  بعد التغيير: حدّث `applicationId` في `android/app/build.gradle` و `namespace`، أو امسح `android/` وأعد `npx cap add android`

## تغيير الألوان والشعار

- الألوان: `arabity/src/css/variables.css` (`--navy-900`, `--accent`)
- لون شريط الحالة: `capacitor.config.json` → `StatusBar.backgroundColor`
- الشعار: بدّل `src/assets/icons/favicon.svg`
- أيقونة أندرويد: `android/app/src/main/res/drawable*` و `mipmap-*`

## العملة الافتراضية

`arabity/src/js/constants.js` → `DEFAULT_SETTINGS.currencySymbol` (`جنيه`)

المستخدم يقدر يغيّرها من الإعدادات من غير تحديث للتطبيق.

## الإشعارات

التطبيق يطلب الإذن بعد الاستخدام الأول، ومش هيقف لو المستخدم رفض. تذكيرات الكيلومتر تظهر داخل التطبيق حسب العداد، مش كإشعار تقويم وهمي.
