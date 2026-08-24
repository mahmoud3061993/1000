# بناء APK لتطبيق عربيتي

المشروع جاهز لـ Android Studio عبر Capacitor.

- اسم التطبيق: **عربيتي**
- Package ID: `com.arabity.cartracker`

## المتطلبات

- Node.js 20+
- JDK 17 أو 21
- Android Studio (مع Android SDK + platform tools)
- متغيرات: `ANDROID_HOME` أو `ANDROID_SDK_ROOT`

## الخطوات

```bash
cd arabity
npm install
npm run build
npx cap add android          # مرة واحدة فقط لو مجلد android مش موجود
npx cap sync android
npx cap open android
```

من Android Studio:

1. استنى Gradle يخلّص
2. **Build → Build Bundle(s) / APK(s) → Build APK(s)** للنسخة التجريبية
3. **Build → Generate Signed Bundle / APK** لنسخة الإطلاق (محتاج keystore)

مسار APK التجريبي عادة:

`arabity/android/app/build/outputs/apk/debug/app-debug.apk`

## نسخة Release

1. أنشئ keystore واحفظه برا المستودع
2. في Android Studio: Generate Signed APK واختر release
3. أو أضف `keystore.properties` (مش هيترفع على git) واضبط `android/app/build.gradle`

## تغيير الاسم أو الحزمة

- الاسم الظاهر: `capacitor.config.json` → `appName` ثم `npx cap sync`
- أيضاً `android/app/src/main/res/values/strings.xml` → `app_name`
- Package ID: `capacitor.config.json` → `appId`
  بعد التغيير: حدّث `applicationId` في `android/app/build.gradle` و `namespace`، أو امسح `android/` وأعد `npx cap add android`

## تغيير الألوان والشعار

- الألوان: `arabity/src/css/variables.css` (`--navy-900`, `--accent`)
- لون شريط الحالة: `capacitor.config.json` → `StatusBar.backgroundColor`
- الشعار: بدّل `src/assets/icons/favicon.svg`
- أيقونة أندرويد: Android Studio → `android/app/src/main/res/mipmap-*` أو استخدم Image Asset

## العملة الافتراضية

`arabity/src/js/constants.js` → `DEFAULT_SETTINGS.currencySymbol` (`جنيه`)

المستخدم يقدر يغيّرها من الإعدادات من غير تحديث للتطبيق.

## الإشعارات

التطبيق يطلب الإذن بعد الاستخدام الأول، ومش هيقف لو المستخدم رفض. تذكيرات الكيلومتر تظهر داخل التطبيق حسب العداد، مش كإشعار تقويم وهمي.

## لو البناء فشل هنا

البيئة دي ممكن متكونش فيها Android SDK كامل. افتح المجلد `arabity/android` في Android Studio على جهازك وابنِ الـ APK من هناك بعد `npx cap sync`.
