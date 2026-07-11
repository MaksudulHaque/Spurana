# SPURANA — NATIVE ANDROID (phone connected → Run)

## Now (PowerShell, one line at a time)
cd C:\Users\User\Downloads\spurana_5
npm install
npx cap open android

## In Android Studio (phone plugged in, USB debugging ON)
1. Wait for Gradle sync (first time downloads deps — a few minutes).
2. Your phone appears in the device dropdown (top bar). Allow the
   "USB debugging" prompt on the phone if it asks.
3. Press Run ▶ — installs + launches Spurana on the phone.
4. Guided meditation → haptic toggle ON → feel the breath-pulse
   (soft → strong as the session deepens).

## What's native in this build
- Real motor vibration (@capacitor/haptics) mapped to the breath ramp
- Android back button navigates screens; minimizes at home (no kill)
- Status bar + splash in void-dark with your brand icon (all densities)
- Screen stays awake during meditation, releases after

## Shareable APK for her
Build → Generate Signed Bundle / APK → APK → create keystore (SAVE it)
→ release → android/app/release/app-release.apk → send her that file.

## After any web change
node build.mjs
npx cap sync android
(then Run again)
