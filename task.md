# AGCE Development Tasks

### 1. iOS Launch & Fabric Crash Fixes
- Fixed blank white screen / crash on iOS by setting `RCTAppDependencyProvider` in `AppDelegate` (RN 0.79 Fabric).
- Restored `RCTEventEmitter` no-op registration in `index.js` so Fabric native events do not redbox; `LogBox.ignoreAllLogs()` now only runs outside `__DEV__`.
- Added `enableScreens(false)` for react-native-screens 3.37 + RN 0.79 Fabric compatibility.
- Wrapped the app in `GestureHandlerRootView`, `AppErrorBoundary`, and iOS-safe `SafeAreaProvider` initial metrics in `App.tsx`.
- Patched `react-native-fast-image` (`FFFastImageView`) to use `imageWithTintColor:` on iOS 13+ so tab-icon tint no longer crashes on iOS 26.
- Skipped `GoogleSignin.configure()` on iOS until `iosClientId` / `GoogleService-Info.plist` exist (configure returns void; used try/catch, not `.catch()`).

### 2. iOS Safe Area & Header Layout
- `AppSafeAreaView`: added an iOS top inset spacer (`insets.top`, fallback 59) so headers sit below the status bar; Android spacer unchanged.
- Toolbar star `top` on iOS reduced from 40 to 15 to avoid double offset.
- Spot and Futures chart screens: header `paddingTop` set to 18 on iOS (was 52 on top of container `insets.top`), matching Android.

### 3. Deposit Fiat Theme Color
- Replaced hardcoded `#D4AF37` with `colors.orangeTheme` across `DepositFiatScreen.jsx`.

### 4. iOS Passkey Support (Login + Registration)
- Added `ios/AGCX/AGCX.entitlements` with Associated Domains `webcredentials:arabglobal.ae` (plus `?mode=developer` for debug) and wired `CODE_SIGN_ENTITLEMENTS` in the Xcode project.
- Login “Continue with Passkey” now checks `Passkey.isSupported()` and surfaces errors instead of failing silently.
- `passkeyDiscoverableLogin` / `verifyPasskeyLogin`: dismiss loading overlay and wait before the native sheet so iOS Face ID is not blocked.
- iOS uses `Passkey.getPlatformKey` (Face ID / Touch ID); Android still uses `Passkey.get`. Discoverable login omits `allowCredentials` on iOS the same way Android already did.
- Enable Passkey registration uses `Passkey.createPlatformKey` on iOS only.
- Added hostable AASA file at `ios/apple-app-site-association` for `35L2R5UU6Q.com.agcx.exchange`. **Must be served at `https://arabglobal.ae/.well-known/apple-app-site-association` (JSON 200, no redirect)** or iOS passkeys will still fail. Android passkeys do not sync to iCloud — add a passkey on the iPhone after AASA is live. Test on a real device.
