# Backend fix: passkeys fail in Android release / Play Store builds

## Problem

Passkey add, delete (step-up), and login work in the Android **debug** build but fail in the
**release** APK and Play Store builds.

On Android, the WebAuthn `origin` inside `clientDataJSON` is not `https://arabglobal.ae`. It is:

```
android:apk-key-hash:<base64url SHA-256 of the certificate that signed the installed app>
```

Debug, release APK, and Play Store builds are signed with different certificates, so each sends a
different origin. The backend currently accepts only some of them, so `@simplewebauthn/server`
rejects the rest with `Unexpected registration/authentication response origin`.

## Fix (2 steps)

### 1. Add the shared config

Copy `passkeyConfig.js` into the backend (e.g. `src/config/passkeyConfig.js`).

### 2. Use it in every passkey verify call

Replace the single-string `expectedOrigin` (and hard-coded RP ID) with the shared values in **all**
of these endpoints:

| Endpoint | Function |
|---|---|
| `POST security/passkey/register/verify` | `verifyRegistrationResponse` |
| `POST security/passkey/auth/verify` | `verifyAuthenticationResponse` |
| `POST security/passkey/step-up/verify` (used by delete passkey) | `verifyAuthenticationResponse` |
| `POST security/passkey/discoverable/verify` | `verifyAuthenticationResponse` |

```js
const { verifyRegistrationResponse, verifyAuthenticationResponse } = require('@simplewebauthn/server');
const { PASSKEY_RP_ID, PASSKEY_EXPECTED_ORIGINS } = require('../config/passkeyConfig');

// register/verify
const verification = await verifyRegistrationResponse({
  response: credential,
  expectedChallenge,
  expectedOrigin: PASSKEY_EXPECTED_ORIGINS, // was: 'https://arabglobal.ae' (string)
  expectedRPID: PASSKEY_RP_ID,
  requireUserVerification: true,
});

// auth/verify, step-up/verify, discoverable/verify
const verification = await verifyAuthenticationResponse({
  response: credential,
  expectedChallenge,
  expectedOrigin: PASSKEY_EXPECTED_ORIGINS, // was: 'https://arabglobal.ae' (string)
  expectedRPID: PASSKEY_RP_ID,
  credential: storedCredential, // v10+; older versions use `authenticator`
  requireUserVerification: true,
});
```

`expectedOrigin` accepts an array; the response is valid if its origin matches any entry.

If the backend has its own origin check (e.g. parses `clientDataJSON` and compares `origin`, or a
CORS-style allowlist applied to passkey routes), it must use the same `PASSKEY_EXPECTED_ORIGINS`.

## Also deploy (web team)

`arab_global_exchange/public/.well-known/assetlinks.json` already lists all 4 certificates. Deploy
it so `https://arabglobal.ae/.well-known/assetlinks.json` includes `4B:AA:2B:…:B4:65`
(currently missing on production).

## How to verify

1. Install the release APK / Play build, add a passkey, delete it, log in with it.
2. Server logs should no longer show `Unexpected ... origin`.
3. If a new signing key is ever added (new Play key, new upload key), add its origin via
   `PASSKEY_EXTRA_ORIGINS` or the list, and its SHA-256 to `assetlinks.json`.

Origin for a SHA-256 fingerprint:

```bash
echo "<SHA256 with colons>" | tr -d : | xxd -r -p | base64 | tr '+/' '-_' | tr -d '='
```

## Security note

The debug origin (`CnjMz8…`) belongs to a developer machine's debug keystore. Keep it only while
debug builds need to hit production; remove it (and `0A:78:…` from `assetlinks.json`) before
public launch, or allow it only on staging.
