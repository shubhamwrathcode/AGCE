import { AppState, NativeModules, Platform, TurboModuleRegistry } from 'react-native';
import { appleAuth } from '@invertase/react-native-apple-authentication';
import { APPLE_IOS_CLIENT_ID } from './Constants';

export type AppleSignInPayload = {
  Token: string;
  type: 'apple';
  authorizationCode: string | null;
  appleUserId: string;
  email: string | null;
  fullName: {
    givenName: string | null;
    familyName: string | null;
    middleName: string | null;
    nickname: string | null;
  } | null;
  nonce: string | null;
  realUserStatus: number;
};

export type AppleThirdPartyBody = {
  Token: string;
  type: 'apple';
  referral_code: string;
  code: string;
  /** Helps backend pick JWT audience: Bundle ID on iOS, Services ID on web. */
  client_id: string;
  platform: 'ios';
};

const safeJson = (value: unknown) => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

function getAppleNativeModule(): any | null {
  try {
    return (
      NativeModules.RNAppleAuthModule ??
      TurboModuleRegistry.get('RNAppleAuthModule') ??
      null
    );
  } catch {
    return NativeModules.RNAppleAuthModule ?? null;
  }
}

export function isAppleAuthAvailable(): boolean {
  if (Platform.OS !== 'ios') return false;
  return !!(appleAuth.isSupported || getAppleNativeModule());
}

/** ASAuthorizationError.unknown — what iOS reports when the Apple sheet could not be presented. */
const APPLE_UNKNOWN_ERROR_CODE = '1000';
/** ASAuthorizationError.failed */
const APPLE_FAILED_ERROR_CODE = '1004';
const APPLE_RETRY_DELAYS_MS = [1000, 2000, 4000];
/** Adding an Apple Account in Settings (password, 2FA) can take a while. */
const APPLE_RETURN_TIMEOUT_MS = 10 * 60 * 1000;

function appleErrorCode(error: unknown): string {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: string }).code)
    : '';
}

function isRetryableAppleError(error: unknown): boolean {
  const code = appleErrorCode(error);
  return code === APPLE_UNKNOWN_ERROR_CODE || code === APPLE_FAILED_ERROR_CODE;
}

/** Resolves true once the app is in the foreground again, false if that does not happen in time. */
function waitForAppActive(timeoutMs: number): Promise<boolean> {
  if (AppState.currentState === 'active') return Promise.resolve(true);
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      subscription.remove();
      resolve(false);
    }, timeoutMs);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      clearTimeout(timer);
      subscription.remove();
      resolve(true);
    });
  });
}

export function isAppleSignInCancelled(error: unknown): boolean {
  const code = appleErrorCode(error);
  return code === '1001' || code === String(appleAuth.Error?.CANCELED ?? '');
}

/** iOS error text ("The operation couldn't be completed…") is not meaningful to users. */
export function appleSignInErrorMessage(error: unknown): string {
  const code = appleErrorCode(error);
  if (code === APPLE_UNKNOWN_ERROR_CODE || code === '1004') {
    return 'Apple Sign-In could not be completed. Please try again.';
  }
  const message = (error as { message?: string })?.message;
  if (!message || message.includes("operation couldn") || message.includes('AuthorizationError')) {
    return 'Apple Sign-In failed. Please try again.';
  }
  return message;
}

/**
 * Native Sign in with Apple. Does not call the backend.
 * identityToken is what will later go as `Token` with `type: 'apple'`.
 */
export async function performAppleSignIn(): Promise<AppleSignInPayload> {
  if (Platform.OS !== 'ios') {
    throw new Error('Apple Sign-In is only available on iOS');
  }

  const native = getAppleNativeModule();
  console.log('[Apple Sign-In] native module present:', !!native, 'isSupported:', appleAuth.isSupported);

  if (!native && !appleAuth.isSupported) {
    throw new Error(
      'Apple Sign-In native module missing. Reload is not enough — rebuild iOS: npx react-native run-ios'
    );
  }

  const requestCredential = () =>
    appleAuth.isSupported
      ? appleAuth.performRequest({
          requestedOperation: appleAuth.Operation.LOGIN,
          requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
        })
      : native.performRequest({
          nonceEnabled: true,
          requestedOperation: 1,
          requestedScopes: [0, 1],
        });

  // With no Apple Account on the device, iOS sends the user to add one and fails the pending request.
  // A freshly added account can take a few seconds before iOS will issue credentials for it.
  let response;
  for (let attempt = 0; ; attempt += 1) {
    try {
      response = await requestCredential();
      break;
    } catch (error) {
      if (!isRetryableAppleError(error) || attempt >= APPLE_RETRY_DELAYS_MS.length) throw error;
      console.warn('[Apple Sign-In] attempt', attempt + 1, 'failed with', appleErrorCode(error), 'appState:', AppState.currentState);
      const returned = await waitForAppActive(APPLE_RETURN_TIMEOUT_MS);
      if (!returned) throw error;
      await new Promise<void>((resolve) => setTimeout(resolve, APPLE_RETRY_DELAYS_MS[attempt]));
    }
  }

  console.log('==================== [Apple Sign-In RAW] ====================');
  console.log(safeJson(response));

  if (!response?.identityToken) {
    throw new Error('Apple Sign-In failed: no identity token');
  }

  const payload: AppleSignInPayload = {
    Token: response.identityToken,
    type: 'apple',
    authorizationCode: response.authorizationCode ?? null,
    appleUserId: response.user,
    email: response.email ?? null,
    fullName: response.fullName
      ? {
          givenName: response.fullName.givenName ?? null,
          familyName: response.fullName.familyName ?? null,
          middleName: response.fullName.middleName ?? null,
          nickname: response.fullName.nickname ?? null,
        }
      : null,
    nonce: response.nonce ?? null,
    realUserStatus: response.realUserStatus,
  };

  console.log('==================== [Apple Sign-In PAYLOAD FOR API] ====================');
  console.log(safeJson(payload));
  console.log('[Apple Sign-In] identityToken length:', payload.Token.length);

  return payload;
}

/** Body for `user/third-party-signup` / `user/third-party-login` (web curl parity + iOS aud hint). */
export function buildAppleThirdPartyBody(
  apple: AppleSignInPayload,
  extras: { referral_code?: string } = {},
): AppleThirdPartyBody {
  const body: AppleThirdPartyBody = {
    Token: apple.Token,
    type: 'apple',
    referral_code: String(extras.referral_code ?? ''),
    code: apple.authorizationCode ?? '',
    client_id: APPLE_IOS_CLIENT_ID,
    platform: 'ios',
  };
  console.log('[Apple Sign-In] API body (what backend receives):', {
    type: body.type,
    client_id: body.client_id,
    platform: body.platform,
    codeLength: body.code.length,
    tokenLength: body.Token.length,
    referral_code: body.referral_code,
  });
  return body;
}
