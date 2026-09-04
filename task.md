# AGCE Development Tasks


### 1. Profile drawer — RN Text warning
- Removed extra whitespace inside the theme-toggle `TouchableOpacity` (`Text strings must be rendered within a <Text> component` on focus).

### 2. Login — lost method recovery (“Unable to verify?”)
- Start/verify APIs plus remaining-method OTP; after the last method is proven, **re-login** (no auto-login / no kept session).
- RBSheet flow: select lost method → 24h warning → remaining OTP; X closes recovery; “Back to methods” returns to the select step.
- After complete: toast, then login screen. Verify OTP keyboard cover: sheet `marginBottom` + `ScrollView`.

### 3. KYB status screens
- Slim `GET /api/v1/kyb/status`: legal name, application id, verified_at — do not render verifications / documents / webhook blobs.
- Due / Pending / Failed / Success views. Success matches web: 4 rows (Business Name, Status, Date, Method), orange theme, unlocked cards.

### 4. Login — “this device is block”
- HTTP rejects never hit the old login success log. Added `[Login]` + `send()` status/body logs; toast uses catch `e.message`. Device-id policy is backend-side.

### 5. Google Play — target API 36
- `compileSdk` / `targetSdk` / `buildTools` **36**. Play requires targeting Android 16 (API 36). Warning clears after a new AAB is uploaded.

### 6. Google Play — photo / video permissions
- Removed `READ_MEDIA_IMAGES` / `READ_MEDIA_VIDEO` (`tools:node="remove"`). Gallery uses the system photo picker; no gallery permission prompt on Android 13+.
- `READ_EXTERNAL_STORAGE` with `maxSdkVersion=32`. Camera permission unchanged.

### 7. Google Play — obfuscation 2%
- R8 minify (class renaming) enabled on release for Play’s obfuscation threshold.
- `shrinkResources` **off** — stripping RN library drawables caused a launch crash.
- `proguard-android.txt` (not optimize) plus keep-rules. Upload `mapping.txt` to Play.

### 8. Android back — app exits from inner screens
- Targeting API 36 enabled predictive back, which skipped RN `onBackPressed`. Set `enableOnBackInvokedCallback=false` and forward MainActivity dispatcher to the RN stack. Hardware back now pops to the previous screen.

### 9. iOS Google Sign-In
- `configure()` was skipped on iOS (`No active configuration`). Configure at app start; `GoogleService-Info.plist` lives in `ios/AGCX/`.
- URL scheme from `REVERSED_CLIENT_ID`; AppDelegate `GIDSignIn handleURL`. Native **rebuild** required (Metro reload is not enough).

### 10. Play Console — appeal + new build
- Submitted an **appeal** on Play for the given issue.
- Uploaded a **new build** for the remaining issues (API 36, media permissions, R8/obfuscation, back fix).

### 11. Android release crash on launch (debug OK)
- Debug ran; **release** crashed on open. R8 optimize + `shrinkResources` were stripping RN/native modules and drawables.
- `shrinkResources=false`, `-dontoptimize`, R8 fullMode off, keep RN + third-party modules. Uninstall the old `app-release.apk` and install a **new** `./gradlew assembleRelease` build.
