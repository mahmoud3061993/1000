# بناء APK لتطبيق مصارف

- اسم التطبيق: **مصارف**
- Package ID: `com.masaref.spendcontrol`

## المتطلبات

- Node.js 20+
- JDK 17 أو 21
- Android Studio (مع Android SDK + platform tools)
- متغيرات: `ANDROID_HOME` أو `ANDROID_SDK_ROOT`

## الخطوات

```bash
cd masaref
npm install
npm run build
npx cap add android          # مرة واحدة فقط لو مجلد android مش موجود
npx cap sync android
npx cap open android
```

من Android Studio:

1. استنى Gradle يخلّص
2. **Build → Build Bundle(s) / APK(s) → Build APK(s)** للنسخة التجريبية
3. **Build → Generate Signed Bundle / APK** لنسخة الإطلاق

مسار APK التجريبي عادة:

`masaref/android/app/build/outputs/apk/debug/app-debug.apk`
