# AGCE Development Tasks

### 1. Fiat Deposit & Help Integration
- Developed standalone Deposit Fiat screen with web parity, Virtual IBAN account details, and one-tap copy actions.
- Added Deposit Fiat Help bottom sheet with accordion FAQ questions and guidance.
- Added cross-navigation link in the FAQ sheet to easily switch to Crypto Deposit.
- Integrated KYC verification modal check for unverified users before allowing virtual account creation.

### 2. Fiat Withdrawal Feature & Security Verification
- Built end-to-end Fiat Withdrawal flow with live AED wallet balance, daily limits tracking, and real-time fee quote preview.
- Implemented UAE bank account addition and email OTP verification for whitelist management.
- Integrated multi-channel 2FA security verification (Email OTP, SMS OTP, Authenticator, and Fund Password) before submitting withdrawal requests.
- Added Withdraw Fiat Help bottom sheet with FAQ guidance and a quick link to Crypto Withdrawal.

### 3. Crypto Deposit & Withdrawal FAQ Enhancements
- Updated Crypto Deposit FAQ sheet with a bottom note and quick link to Deposit Fiat (AED).
- Updated Crypto Withdrawal FAQ sheet with a bottom note and quick link to Withdraw Fiat (AED).
- Optimized bottom sheet heights and scroll containers to prevent content cutoff when expanding FAQ items.

### 4. Direct File Download Module
- Built an Android native download module (FileDownloadModule) registered in MainApplication.
- Enabled direct saving of statement CSV files to the device Downloads folder with system download notifications.
- Replaced the native share sheet dialog with a smooth, direct download experience matching web behavior.

### 5. Deposit & Withdrawal History Parity
- Redesigned Fiat Deposit and Withdrawal History screens to achieve full parity with the web platform.
- Implemented Time filter dropdown (All time, 7d, 30d, 90d) and Status filter dropdown with bottom sheet selectors.
- Added Export Excel button that generates and downloads CSV statements directly to storage, automatically disabling when no records are present.
- Updated deposit history list items into a clean 3-row layout displaying Date & Status, Amount, Masked Sender IBAN, and Wallet.
- Maintained interactive detail sheets for viewing full transaction metadata and references.

### 6. Universal Deposit & Withdraw Choice Sheets
- Connected Deposit and Withdrawal actions in the Profile Drawer to open dual-option choice sheets (Crypto / Fiat).
- Connected the Estimated Balance card Deposit button on the Home screen to open the Deposit Choice Sheet.

### 7. iOS Launch & Fabric Crash Fixes
- Fixed blank white screen / crash on iOS by setting `RCTAppDependencyProvider` in `AppDelegate` (RN 0.79 Fabric).
- Restored `RCTEventEmitter` no-op registration in `index.js` so Fabric native events do not redbox; `LogBox.ignoreAllLogs()` now only runs outside `__DEV__`.
- Added `enableScreens(false)` for react-native-screens 3.37 + RN 0.79 Fabric compatibility.
- Wrapped the app in `GestureHandlerRootView`, `AppErrorBoundary`, and iOS-safe `SafeAreaProvider` initial metrics in `App.tsx`.
- Patched `react-native-fast-image` (`FFFastImageView`) to use `imageWithTintColor:` on iOS 13+ so tab-icon tint no longer crashes on iOS 26.
- Skipped `GoogleSignin.configure()` on iOS until `iosClientId` / `GoogleService-Info.plist` exist (configure returns void; used try/catch, not `.catch()`).

### 8. iOS Safe Area & Header Layout
- `AppSafeAreaView`: added an iOS top inset spacer (`insets.top`, fallback 59) so headers sit below the status bar; Android spacer unchanged.
- Toolbar star `top` on iOS reduced from 40 to 15 to avoid double offset.
- Spot and Futures chart screens: header `paddingTop` set to 18 on iOS (was 52 on top of container `insets.top`), matching Android.

### 9. Deposit Fiat Theme Color
- Replaced hardcoded `#D4AF37` with `colors.orangeTheme` across `DepositFiatScreen.jsx`.

### 10. iOS Passkey Support (Login + Registration)
- Added `ios/AGCX/AGCX.entitlements` with Associated Domains `webcredentials:arabglobal.ae` (plus `?mode=developer` for debug) and wired `CODE_SIGN_ENTITLEMENTS` in the Xcode project.
- Login “Continue with Passkey” now checks `Passkey.isSupported()` and surfaces errors instead of failing silently.
- `passkeyDiscoverableLogin` / `verifyPasskeyLogin`: dismiss loading overlay and wait before the native sheet so iOS Face ID is not blocked.
- iOS uses `Passkey.getPlatformKey` (Face ID / Touch ID); Android still uses `Passkey.get`. Discoverable login omits `allowCredentials` on iOS the same way Android already did.
- Enable Passkey registration uses `Passkey.createPlatformKey` on iOS only.
- Added hostable AASA file at `ios/apple-app-site-association` for `35L2R5UU6Q.com.agcx.exchange`. **Must be served at `https://arabglobal.ae/.well-known/apple-app-site-association` (JSON 200, no redirect)** or iOS passkeys will still fail. Android passkeys do not sync to iCloud — add a passkey on the iPhone after AASA is live. Test on a real device.
