#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
sdk="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/android-sdk}}"

if [[ ! -x "$sdk/cmdline-tools/latest/bin/sdkmanager" && ! -d "$sdk/platforms/android-34" ]]; then
  bash "$root/scripts/install-android-sdk.sh"
  sdk="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/android-sdk}}"
fi

export ANDROID_HOME="$sdk"
export ANDROID_SDK_ROOT="$sdk"
export PATH="$sdk/platform-tools:$sdk/cmdline-tools/latest/bin:$PATH"

printf 'sdk.dir=%s\n' "$sdk" > "$root/android/local.properties"

keystore="$root/android/app/arabity-sideload.jks"
if [[ ! -f "$keystore" ]]; then
  keytool -genkeypair -v \
    -keystore "$keystore" \
    -alias arabity \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -storepass arabity-sideload \
    -keypass arabity-sideload \
    -dname "CN=Arabity, OU=Sideload, O=Arabity, L=Cairo, ST=Cairo, C=EG"
fi

cd "$root"
npm install
npx cap sync android

cd "$root/android"
chmod +x gradlew
./gradlew assembleRelease --no-daemon

src="$root/android/app/build/outputs/apk/release/app-release.apk"
if [[ ! -f "$src" ]]; then
  echo "APK not found at $src" >&2
  exit 1
fi

mkdir -p "$root/dist" "$root/../public/car"
cp "$src" "$root/dist/arabity.apk"
cp "$src" "$root/../public/car/arabity.apk"
echo "Wrote $root/dist/arabity.apk and public/car/arabity.apk"
ls -lh "$src" "$root/dist/arabity.apk"
