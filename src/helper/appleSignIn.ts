import { NativeModules, Platform, TurboModuleRegistry } from 'react-native';
import { appleAuth } from '@invertase/react-native-apple-authentication';

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

export function isAppleSignInCancelled(error: unknown): boolean {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: string }).code)
      : '';
  return code === '1001' || code === String(appleAuth.Error?.CANCELED ?? '');
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

  const response = appleAuth.isSupported
    ? await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      })
    : await native.performRequest({
        nonceEnabled: true,
        requestedOperation: 1,
        requestedScopes: [0, 1],
      });

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
  console.log('[Apple Sign-In] API not called. Token length:', payload.Token.length);

  return payload;
}
