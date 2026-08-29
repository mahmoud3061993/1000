#!/usr/bin/env bash
set -euo pipefail

# Installs Android command-line SDK under $HOME/android-sdk (or $ANDROID_HOME).
SDK_ROOT="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/android-sdk}}"
export ANDROID_HOME="$SDK_ROOT"
export ANDROID_SDK_ROOT="$SDK_ROOT"

mkdir -p "$SDK_ROOT/cmdline-tools"
if [[ ! -x "$SDK_ROOT/cmdline-tools/latest/bin/sdkmanager" ]]; then
  zip="/tmp/commandlinetools-linux.zip"
  url="https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip"
  echo "Downloading Android command-line tools..."
  curl -fsSL "$url" -o "$zip"
  rm -rf /tmp/cmdline-tools-unpack
  mkdir -p /tmp/cmdline-tools-unpack
  unzip -q "$zip" -d /tmp/cmdline-tools-unpack
  rm -rf "$SDK_ROOT/cmdline-tools/latest"
  mkdir -p "$SDK_ROOT/cmdline-tools/latest"
  if [[ -d /tmp/cmdline-tools-unpack/cmdline-tools ]]; then
    cp -a /tmp/cmdline-tools-unpack/cmdline-tools/. "$SDK_ROOT/cmdline-tools/latest/"
  else
    cp -a /tmp/cmdline-tools-unpack/. "$SDK_ROOT/cmdline-tools/latest/"
  fi
fi

mkdir -p "$SDK_ROOT/licenses"
printf '%s\n' "24333f8a63b6825ea9c5514f83c2829b004d1fee" > "$SDK_ROOT/licenses/android-sdk-license"
printf '%s\n' "84831b9409646164c4c7ea161e2ba3e3" > "$SDK_ROOT/licenses/android-sdk-preview-license"

yes | "$SDK_ROOT/cmdline-tools/latest/bin/sdkmanager" --sdk_root="$SDK_ROOT" --licenses >/dev/null || true
"$SDK_ROOT/cmdline-tools/latest/bin/sdkmanager" --sdk_root="$SDK_ROOT" \
  "platform-tools" \
  "platforms;android-34" \
  "build-tools;34.0.0"

echo "Android SDK ready at $SDK_ROOT"
