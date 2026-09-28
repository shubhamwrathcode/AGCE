/**
 * Passkey (WebAuthn) relying-party config shared by every passkey verify endpoint.
 *
 * Android apps do not send "https://..." as the WebAuthn origin. They send
 * "android:apk-key-hash:<base64url(SHA-256 of the APK signing certificate)>",
 * so every certificate that can sign an installed build must be listed here.
 * Keep this list in sync with https://arabglobal.ae/.well-known/assetlinks.json.
 */

const PASSKEY_RP_ID = process.env.PASSKEY_RP_ID || 'arabglobal.ae';

const WEB_ORIGINS = [
  'https://arabglobal.ae', // web + iOS app
  'https://www.arabglobal.ae',
];

const ANDROID_APP_ORIGINS = [
  // Debug build (developer machine debug.keystore, SHA-256 0A:78:CC:…:22:C7)
  'android:apk-key-hash:CnjMz8-uKRv_AgDOO6QlehiiVOzdVjt2_pkGJUSQIsc',
  // Release APK signed with upload key (agcx-upload-key.keystore, SHA-256 31:F1:EF:…:34:D7)
  'android:apk-key-hash:MfHvB-WXB2ePH7kFeIsPaTsj42lsgUqyrTkIfIPVNNc',
  // Google Play app signing key (SHA-256 4B:AA:2B:…:B4:65)
  'android:apk-key-hash:S6orDrNXoO-0SWZyX6kO_BPGx8O81ZVJeJVvxw8TtGU',
  // Previous Google Play app signing key (SHA-256 C5:D1:E4:…:10:EA)
  'android:apk-key-hash:xdHkZ8NLp3lWJ36EtMKg_XEGpLwUiWAiDBetnPGSEOo',
];

/** Optional extra origins without a deploy, e.g. PASSKEY_EXTRA_ORIGINS="android:apk-key-hash:abc,https://staging.arabglobal.ae" */
const EXTRA_ORIGINS = String(process.env.PASSKEY_EXTRA_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const PASSKEY_EXPECTED_ORIGINS = [...new Set([...WEB_ORIGINS, ...ANDROID_APP_ORIGINS, ...EXTRA_ORIGINS])];

module.exports = {
  PASSKEY_RP_ID,
  PASSKEY_EXPECTED_ORIGINS,
};
