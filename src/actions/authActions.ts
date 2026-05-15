import AsyncStorage from '@react-native-async-storage/async-storage';
import {appOperation} from '../appOperation';
import {logger, showError, showSuccess} from '../helper/logger';
import {
  ForgotPasswordProps,
  LoginProps,
  RegistrationProps,
  SendOtpRegistrationProps,
} from '../helper/types';
import {setAppVersion, setLoading, setLoadingOtp, setUserData, setPending2FA, clearPending2FA} from '../slices/authSlice';
import {AppDispatch} from '../store/store';
import {USER_TOKEN_KEY} from '../helper/Constants';
import NavigationService from '../navigation/NavigationService';
import {
  ACCOUNT_ACTIVATED_SCREEN,
  AUTH_VERIFICATION_SCREEN,
  ENTER_OTP_SCREEN,
  LOGIN_SCREEN,
  NAVIGATION_AUTH_STACK,
  NAVIGATION_BOTTOM_TAB_STACK,
  OTP_VERIFY_SCREEN,
  REGISTER_SCREEN,
  VERIFY_ACCOUNT_SCREEN,
} from '../navigation/routes';
import {getUserProfile} from './accountActions';
import {Passkey} from 'react-native-passkey';
import {PASSKEY_RP_ID} from '../helper/Constants';
import {socketService} from '../services/socket/SocketService';
import {Platform} from 'react-native';

/** Persist signup/login JWT so customer APIs + socket work after register / verify-otp. */
async function persistSignupSessionToken(token: unknown) {
  const t = typeof token === 'string' && token.trim() ? token.trim() : '';
  if (!t) return;
  appOperation.setCustomerToken(t);
  await AsyncStorage.setItem(USER_TOKEN_KEY, t);
  socketService.reconnectWithToken(t);
}

function extractTokenFromAuthResponse(res: any): string | null {
  if (!res || typeof res !== 'object') return null;
  if (typeof res.token === 'string' && res.token.trim()) return res.token.trim();
  const d = res.data;
  if (typeof d === 'string' && d.trim().length > 10) return d.trim();
  if (d && typeof d === 'object') {
    if (typeof d.token === 'string' && d.token.trim()) return d.token.trim();
    if (typeof d.access_token === 'string' && d.access_token.trim()) return d.access_token.trim();
  }
  return null;
}

export const sendOtp =
  (
    data: SendOtpRegistrationProps,
    setDisbaleBtn = (p0: boolean) => {},
    setTimer = (p0: number) => {},
    setAttemptLeft = (_: string | number) => {}
  ) =>
  async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      const response: any = await appOperation.guest.send_otp(data);
      if (response.success) {
        showError(response.message);
        setDisbaleBtn(true);
        setTimer(60);
        setAttemptLeft(response?.attemptsLeft ?? "");
      }
      return response;
    } catch (e: any) {
      logger(e);
      showError(e?.message);
      return { success: false, message: e?.message };
    } finally {
      dispatch(setLoading(false));
    }
  };

  export const forgotOtp =
  (data: any, isNavigate = false) =>
  async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      const response: any = await appOperation.guest.forgot_otp(data);
      if (response.success) {
        showError(response.message);
        // isNavigate
        //   ? NavigationService.navigate(OTP_VERIFY_SCREEN, {data})
        //   : null;
      }
    } catch (e: any) {
      logger(e);
      showError(e?.message);
    } finally {
      dispatch(setLoading(false));
    }
  };

  export const getAppVersion =
  () =>
  async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      const response: any = await appOperation.guest.app_version();
      if (response.success) {
        // showError(response.message);
        dispatch(setAppVersion(response.data));
      } 
    } catch (e: any) {
      logger(e);
      showError(e?.message);
    } finally {
      dispatch(setLoading(false));
    }
  };

export const register =
  (data: RegistrationProps, setData = () => {}, setVerifyToken = (data: any) => {}, handleClearCaptcha = () => {}) => async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      const response: any = await appOperation.guest.register_email(data);
      if (__DEV__) {
        console.log('[register_email] API response:', JSON.stringify(response, null, 2));
      }
      if (!response.success) {
        showError(response.message);
        // handleClearCaptcha();
      } else {
        const tok = extractTokenFromAuthResponse(response);
        if (__DEV__) {
          console.log('[register_email] extracted token (preview):', tok ? `${tok.slice(0, 12)}…` : '(none)');
        }
        await persistSignupSessionToken(tok ?? response?.token);
        NavigationService.navigate(NAVIGATION_AUTH_STACK, {
          screen: VERIFY_ACCOUNT_SCREEN,
        });
      }
    } catch (e: any) {
      console.log('[register_email] API error:', e?.message ?? e, e?.response ?? '');
      logger(e);
      showError(e?.message);
      // handleClearCaptcha();
    } finally {
      dispatch(setLoading(false));
      // handleClearCaptcha();
    }
  };

  export const registerWithPhone =
  (data: RegistrationProps, setData = () => {}, setVerifyToken = (data: any) => {}, handleClearCaptcha = () => {}) => async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      const response: any = await appOperation.guest.register_phone(data);
      if (__DEV__) {
        console.log('[register_phone] API response:', JSON.stringify(response, null, 2));
      }
      if (!response.success) {
        showError(response.message);
        handleClearCaptcha();
      } else {
        showSuccess(response?.message);
        const tok = extractTokenFromAuthResponse(response);
        if (__DEV__) {
          console.log('[register_phone] extracted token (preview):', tok ? `${tok.slice(0, 12)}…` : '(none)');
        }
        await persistSignupSessionToken(tok ?? response?.token);
        handleClearCaptcha();
        NavigationService.navigate(NAVIGATION_AUTH_STACK, {
          screen: VERIFY_ACCOUNT_SCREEN,
        });
      }
    } catch (e: any) {
      console.log('[register_phone] API error:', e?.message ?? e, e?.response ?? '');
      logger(e);
      showError(e?.message);
      handleClearCaptcha();
    } finally {
      dispatch(setLoading(false));
      handleClearCaptcha();
    }
  };

  export const googleRegister =
  (data: RegistrationProps, setData = () => {}, setVerifyToken = (_: boolean) => {}, handleClearCaptcha = () => {}) => async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      const response: any = await appOperation.guest.register_google(data);
      console.log('[third-party-signup] API response:', JSON.stringify(response, null, 2));
      if (!response.success) {
        showError(response.message);
        handleClearCaptcha();
      } else {
        showSuccess(response?.message);
        appOperation.setCustomerToken(response?.token);
        handleClearCaptcha();
        NavigationService.navigate(NAVIGATION_AUTH_STACK, {
          screen: VERIFY_ACCOUNT_SCREEN,
        });
      }
    } catch (e: any) {
      console.log('[third-party-signup] API error:', e?.message ?? e, e?.response ?? '');
      logger(e);
      showError(e?.message);
      handleClearCaptcha();
    } finally {
      dispatch(setLoading(false));
    }
  };

/** Parity with web `LoginPage` classifyLoginFailureMessage — which field to outline on failure. */
export type LoginFailureKind =
  | 'activation'
  | 'user_not_found'
  | 'wrong_password'
  | 'auth_failed';

/**
 * Same rules as web `LoginPage`: generic “invalid email or password” → password field
 * (API cannot distinguish wrong email vs wrong password). Only explicit “not registered”
 * style copy highlights the identifier.
 */
export function classifyLoginFailureMessage(message: unknown): LoginFailureKind {
  const m = String(message || '').toLowerCase();
  if (!m) return 'auth_failed';
  if (m.includes('not been activated') || m.includes('not activated') || m.includes('verify your account')) {
    return 'activation';
  }
  if (
    m.includes('user not found') ||
    m.includes('no user found') ||
    m.includes('does not exist') ||
    m.includes('not registered') ||
    m.includes('no account with') ||
    m.includes('email is not registered') ||
    m.includes('username is not found') ||
    m.includes('username not found') ||
    m.includes('email not registered') ||
    m.includes('email address not found') ||
    m.includes('account not found') ||
    m.includes('no such user') ||
    m.includes('unknown email') ||
    m.includes('user does not exist') ||
    m.includes('email does not exist') ||
    m.includes('unregistered')
  ) {
    return 'user_not_found';
  }
  if (m.includes('invalid email or password') || m.includes('invalid credentials') || m.includes('wrong password')) {
    return 'wrong_password';
  }
  if (m.includes('password') && (m.includes('wrong') || m.includes('incorrect') || m.includes('invalid') || m.includes('mismatch'))) {
    return 'wrong_password';
  }
  return 'auth_failed';
}

function loginFailureHighlights(kind: LoginFailureKind): {
  highlightPasswordField: boolean;
  highlightIdentifierField: boolean;
} {
  switch (kind) {
    case 'activation':
    case 'user_not_found':
      return { highlightPasswordField: false, highlightIdentifierField: true };
    case 'wrong_password':
    case 'auth_failed':
    default:
      return { highlightPasswordField: true, highlightIdentifierField: false };
  }
}

function loginFailMessage(response: any): string {
  return String(response?.message ?? response?.data?.message ?? '').trim() || 'Login failed';
}

/**
 * Post-login 2FA screen: do not use passkey (type 4) on the client. Prefer email / SMS when the
 * identifier matches, then any other non-passkey method the backend lists.
 */
function resolveLogin2FADefaultMethod(
  methods: any[] | undefined,
  backendPreferred: number | undefined,
  loginIdentifier: string
): number {
  const list = Array.isArray(methods) ? methods.filter((m: any) => Number(m?.type) !== 4) : [];
  const has = (t: number) => list.some((m: any) => Number(m?.type) === t);
  const id = String(loginIdentifier ?? '').trim();
  const loggedInWithEmail = id.includes('@');

  if (loggedInWithEmail && has(1)) return 1;
  if (!loggedInWithEmail && id && has(3)) return 3;

  const bd = Number(backendPreferred);
  if (Number.isFinite(bd) && bd !== 4 && has(bd)) return bd;

  if (has(1)) return 1;
  if (has(3)) return 3;
  if (has(2)) return 2;
  return Number(list[0]?.type) && Number(list[0]?.type) !== 4 ? Number(list[0]?.type) : 1;
}

export type LoginThunkResult = {
  success: boolean;
  highlightPasswordField?: boolean;
  highlightIdentifierField?: boolean;
};

export const login = (data: LoginProps & { token?: string }) => async (
  dispatch: AppDispatch
): Promise<LoginThunkResult> => {
  try {
    dispatch(setLoading(true));
    const response: any = await appOperation.guest.login(data);

    if (!response.success) {
      if (response?.code == 403) {
        appOperation.setCustomerToken(response?.data);
        NavigationService.navigate(REGISTER_SCREEN, {myToken: true, userData: data});
        return {
          success: false,
          highlightPasswordField: false,
          highlightIdentifierField: false,
        };
      }
      const failMsg = loginFailMessage(response);
      showError(failMsg);
      const hi = loginFailureHighlights(classifyLoginFailureMessage(failMsg));
      return { success: false, ...hi };
    }

    const d = response?.data;
    const no2Fa = d?.['2fa'] === 0;
    const webShape = d?.requiresVerification === true;

    if (no2Fa && !webShape) {
      appOperation.setCustomerToken(d?.token);
      await AsyncStorage.setItem(USER_TOKEN_KEY, d?.token);
      socketService.reconnectWithToken(d?.token ?? null);
      await dispatch(getUserProfile());
      NavigationService.resetToMainApp(NAVIGATION_BOTTOM_TAB_STACK);
    } else if (webShape) {
      dispatch(setUserData(d));
      const methods = d?.availableMethods ?? [];
      dispatch(setPending2FA({
        loginSignId: d?.signId ?? data?.email_or_phone,
        availableMethods: methods,
        defaultMethod: resolveLogin2FADefaultMethod(methods, d?.defaultMethod, data?.email_or_phone),
        data: d,
      }));
      NavigationService.navigate(AUTH_VERIFICATION_SCREEN);
    } else {
      dispatch(setUserData(d));
      const methods = d?.availableMethods ?? [];
      dispatch(setPending2FA({
        loginSignId: data?.email_or_phone,
        availableMethods: methods,
        defaultMethod: resolveLogin2FADefaultMethod(methods, d?.['2fa'], data?.email_or_phone),
        data: d?.['2fa'] === 2 ? data : d,
      }));
      NavigationService.navigate(AUTH_VERIFICATION_SCREEN);
    }
    return { success: true };
  } catch (e: any) {
    logger(e);
    const errMsg = e?.response?.data?.message ?? e?.message ?? 'An error occurred. Please try again later.';
    showError(errMsg);
    if (e?.code == 403) {
      appOperation.setCustomerToken(e?.data);
      NavigationService.navigate(REGISTER_SCREEN, {myToken: true});
      return {
        success: false,
        highlightPasswordField: false,
        highlightIdentifierField: false,
      };
    }
    const hi = loginFailureHighlights(classifyLoginFailureMessage(errMsg));
    return { success: false, ...hi };
  } finally {
    dispatch(setLoading(false));
  }
};

export const googleLogin = (data: any) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true));
    const response: any = await appOperation.guest.google_login(data);
    if (!response.success) {
      showError(response.message);
    } else {
      const d = response?.data;
      const no2Fa = d?.['2fa'] === 0;
      const webShape = d?.requiresVerification === true;

      if (no2Fa && !webShape) {
        appOperation.setCustomerToken(d?.token);
        await AsyncStorage.setItem(USER_TOKEN_KEY, d?.token);
        socketService.reconnectWithToken(d?.token ?? null);
        await dispatch(getUserProfile());
        NavigationService.resetToMainApp(NAVIGATION_BOTTOM_TAB_STACK);
      } else if (webShape || (d?.['2fa'] && d?.['2fa'] !== 0)) {
        dispatch(setUserData(d));
        const signId = d?.signId ?? d?.emailId ?? d?.mobileNumber ?? '';
        const methods = d?.availableMethods ?? [];
        const loginHint = String(d?.emailId || d?.mobileNumber || signId || '');
        dispatch(setPending2FA({
          loginSignId: signId,
          availableMethods: methods,
          defaultMethod: resolveLogin2FADefaultMethod(methods, d?.defaultMethod, loginHint),
          data: d,
        }));
        NavigationService.navigate(AUTH_VERIFICATION_SCREEN);
      } else {
        appOperation.setCustomerToken(d?.token);
        await AsyncStorage.setItem(USER_TOKEN_KEY, d?.token);
        socketService.reconnectWithToken(d?.token ?? null);
        await dispatch(getUserProfile());
        NavigationService.resetToMainApp(NAVIGATION_BOTTOM_TAB_STACK);
      }
    }
  } catch (e: any) {
    logger(e);
    showError(e?.message);
    if (e?.code == 403) {
      appOperation.setCustomerToken(e?.data);
      NavigationService.navigate(REGISTER_SCREEN, {myToken: true});
      return;
    }
  } finally {
    dispatch(setLoading(false));
  }
};

export const forgotPassword =
  (data: ForgotPasswordProps) => async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      const response: any = await appOperation.guest.forgot(data);
      if (!response.success) {
        showError(response.message);
      } else {
        showError(response.message);
        NavigationService.reset(LOGIN_SCREEN);
      }
    } catch (e: any) {
      logger(e);
      showError(e?.message);
    } finally {
      dispatch(setLoading(false));
    }
  };

export const sendLoginOtp =
  (signId: string, sendTo: 'email' | 'mobile', setResendTimer?: (s: number) => void) =>
  async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      const response: any = await appOperation.guest.send_login_otp(signId, sendTo);
      if (response?.success) {
        showSuccess(response?.message ?? 'OTP sent successfully');
        setResendTimer?.(60);
      } else {
        showError(response?.message ?? 'Failed to Send OTP');
      }
    } catch (e: any) {
      logger(e);
      showError(e?.message ?? 'Failed to Send OTP');
    } finally {
      dispatch(setLoading(false));
    }
  };

/** Same as web RegistrationVerification handleLogin: verify-registration-otp API, success → Login (account activated) */
export const verifyOtp = (
  data: any,
  setOtp = (p0: string) => {},
  setOtpError = (_: boolean) => {},
  onBlocked = () => {}
) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoadingOtp(true));
    const response: any = await appOperation.guest.verify_otp(data);
    if (__DEV__) {
      console.log('[verify-registration-otp] API response:', JSON.stringify(response, null, 2));
    }

    if (!response.success) {
      showError(response?.message ?? 'Verification failed.');
      setOtpError(true);
      if (String(response?.message || '').toLowerCase().includes('no otp attempt left')) {
        onBlocked();
      }
    } else {
      showSuccess('Login successful');
      setOtpError(false);
      setOtp('');
      const tok = extractTokenFromAuthResponse(response);
      if (__DEV__) {
        console.log('[verify-registration-otp] extracted token (preview):', tok ? `${tok.slice(0, 12)}…` : '(unchanged — using token from register)');
      }
      if (tok) {
        await persistSignupSessionToken(tok);
      }
      NavigationService.resetToMainApp(NAVIGATION_BOTTOM_TAB_STACK);
      dispatch(getUserProfile());
    }
  } catch (e: any) {
    logger(e);
    const errorMessage =
      e?.response?.data?.message ??
      e?.message ??
      (e?.request ? 'Network error. Please check your internet connection.' : null);
    showError(errorMessage ?? 'An error occurred. Please try again later.');
    setOtpError(true);
    if (String(errorMessage || '').toLowerCase().includes('no otp attempt left')) {
      onBlocked();
    }
  } finally {
    dispatch(setLoadingOtp(false));
  }
};


export const verifyUser = (data: { email_or_phone: string; otp: string; type: number }) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoadingOtp(true));
    const payload = {
      email_or_phone: data.email_or_phone,
      type: data.type,
      otp: data.type === 2 ? data.otp : parseInt(data.otp, 10),
      resend: false,
    };
    console.log(payload, "payloadotp");
    
    const response: any = await appOperation.guest.verify_fac_otp(payload as any);
    if (response.success) {
      showSuccess(response?.message ?? 'Login successful');
      appOperation.setCustomerToken(response?.data?.token);
      await AsyncStorage.setItem(USER_TOKEN_KEY, response?.data?.token);
      socketService.reconnectWithToken(response?.data?.token ?? null);
      NavigationService.resetToMainApp(NAVIGATION_BOTTOM_TAB_STACK);
      dispatch(clearPending2FA());
      dispatch(getUserProfile());
    } else {
      showError(response?.message ?? 'Verification failed');
    }
    return response;
  } catch (e: any) {
    logger(e);
    showError(e?.message);
    if (e?.code == 403) {
      appOperation.setCustomerToken(e?.token);
      NavigationService.navigate(REGISTER_SCREEN, {myToken: true});
      return { success: false, code: 403, message: e?.message, token: e?.token };
    }
    return { success: false, message: e?.message };
  } finally {
    dispatch(setLoadingOtp(false));
  }
};

/**
 * Web parity: challenge/ids are bytes. Some backends (incorrectly) compare the *string form*
 * of `challenge` they issued with what comes back. So we must avoid mutating the string
 * (e.g. stripping "=" padding or converting url/base64 variants) unless absolutely necessary.
 *
 * Only convert when it looks like classic base64 (`+` or `/`). Otherwise keep as-is.
 */
const maybeBase64ToBase64Url = (s: string) => {
  const raw = String(s || '').trim();
  if (!raw) return raw;
  if (raw.includes('+') || raw.includes('/')) {
    // base64 -> base64url (keep padding to preserve bytes + server quirks)
    return raw.replace(/\+/g, '-').replace(/\//g, '_');
  }
  return raw; // already base64url-ish
};

const isRpIdMismatchForAndroid = (rpIdFromServer: string) => {
  if (Platform.OS !== 'android') return false;
  const server = String(rpIdFromServer || '').trim();
  const configured = String(PASSKEY_RP_ID || '').trim();
  if (!server || !configured) return false;
  return server !== configured;
};

/** Passkey login using device biometrics (fingerprint/face). Same flow as web: get options → authenticate → verify → complete. */
export const verifyPasskeyLogin = (signId: string) => async (dispatch: AppDispatch) => {
  try {
    if (!Passkey.isSupported()) {
      showError('Passkeys are not supported on this device');
      return false;
    }
    dispatch(setLoading(true));
    const optionsRes: any = await appOperation.guest.passkeyGetAuthOptions(signId);
    if (!optionsRes?.success || !optionsRes?.data) {
      showError(optionsRes?.message || 'Failed to get passkey options');
      return false;
    }
    const opts = optionsRes.data;
    const rawChallenge = typeof opts.challenge === 'string' ? opts.challenge : '';
    const challengeForNative = maybeBase64ToBase64Url(rawChallenge);
    // Web parity: prefer server-provided rpId. Only fall back to configured RP ID if missing.
    const rpIdFromServer = String(opts.rpId || opts.rp?.id || '').trim();
    if (isRpIdMismatchForAndroid(rpIdFromServer)) {
      console.warn('[Passkey][verifyPasskeyLogin] rpId mismatch - skipping native prompt', {
        server: rpIdFromServer,
        configured: PASSKEY_RP_ID,
      });
      showError('Passkey is not configured for this app. Please sign in with password.');
      return false;
    }
    const rpId =
      rpIdFromServer ||
      (PASSKEY_RP_ID && PASSKEY_RP_ID.trim() ? PASSKEY_RP_ID.trim() : '') ||
      '';
    const request: any = {
      challenge: challengeForNative || rawChallenge || opts.challenge,
      rpId: rpId || 'localhost',
      timeout: opts.timeout,
      userVerification: opts.userVerification || 'required',
    };
    if (opts.allowCredentials?.length) {
      request.allowCredentials = opts.allowCredentials.map((c: any) => ({
        type: c.type || 'public-key',
        id: typeof c.id === 'string' ? maybeBase64ToBase64Url(c.id) : c.id,
        transports: c.transports,
      }));
    }
    console.log('[Passkey][verifyPasskeyLogin] options', {
      signId,
      rpId: request.rpId,
      hasAllowCredentials: !!request.allowCredentials?.length,
      challengeLen: typeof request.challenge === 'string' ? request.challenge.length : null,
      challengePreview:
        typeof request.challenge === 'string'
          ? `${request.challenge.slice(0, 6)}…${request.challenge.slice(-6)}`
          : null,
    });
    console.log('[Passkey][verifyPasskeyLogin] calling Passkey.get', {
      rpId: request.rpId,
      userVerification: request.userVerification,
      allowCredentials: request.allowCredentials?.length ?? 0,
    });
    let credential: any;
    try {
      credential = await Passkey.get(request);
    } catch (e: any) {
      const msg = String(e?.message ?? e?.error ?? '');
      console.error('[Passkey][verifyPasskeyLogin] Passkey.get threw', {
        name: e?.name,
        code: e?.code,
        message: e?.message,
        raw: e,
      });
      // Common native error when RP ID / associated domain doesn't match device/app configuration.
      if (/incoming request cannot be validated/i.test(msg)) {
        showError(
          'Passkey is not available for this environment. Please sign in with password (or ask backend to use the correct RP ID).'
        );
      } else {
        showError(e?.message || 'Passkey prompt failed');
      }
      return false;
    }
    if (!credential) {
      showError('Authentication was cancelled');
      return false;
    }
    console.log('[Passkey][verifyPasskeyLogin] credential acquired', {
      type: (credential as any)?.type,
      id: (credential as any)?.id,
    });
    const verifyRes: any = await appOperation.guest.passkeyVerifyAuth(signId, credential);
    if (!verifyRes?.success) {
      console.warn('[Passkey][verifyPasskeyLogin] verify failed', verifyRes);
      showError(verifyRes?.message || 'Passkey verification failed');
      return false;
    }
    const completeRes: any = await appOperation.guest.completePasskeyLogin(signId, verifyRes.data || {});
    if (!completeRes?.success || !completeRes?.data?.token) {
      showError(completeRes?.message || 'Login failed');
      return false;
    }
    showSuccess(completeRes?.message ?? 'Login successful');
    appOperation.setCustomerToken(completeRes.data.token);
    await AsyncStorage.setItem(USER_TOKEN_KEY, completeRes.data.token);
    socketService.reconnectWithToken(completeRes.data.token ?? null);
    NavigationService.resetToMainApp(NAVIGATION_BOTTOM_TAB_STACK);
    dispatch(clearPending2FA());
    dispatch(getUserProfile());
    return true;
  } catch (e: any) {
    logger(e);
    const msg = String(e?.message ?? e?.error ?? '');
    if (e?.name === 'NotAllowedError' || /cancelled|cancel/i.test(msg)) {
      showError('Authentication was cancelled. Try again or use another method.');
    } else {
      showError(e?.message || 'Passkey authentication failed');
    }
    if (e?.code == 403) {
      appOperation.setCustomerToken(e?.token);
      NavigationService.navigate(REGISTER_SCREEN, {myToken: true});
      return false;
    }
    return false;
  } finally {
    dispatch(setLoading(false));
  }
};

/** Discoverable passkey login (no email required – same as web “Continue with Passkey”). */
export const passkeyDiscoverableLogin = () => async (dispatch: AppDispatch) => {
  try {
    if (!Passkey.isSupported()) {
      showError('Passkeys are not supported on this device');
      return false;
    }
    dispatch(setLoading(true));
    const optionsRes: any = await appOperation.guest.passkeyDiscoverableAuthOptions();
    if (!optionsRes?.success || !optionsRes?.data) {
      showError(optionsRes?.message || 'Failed to get authentication options');
      return false;
    }
    const opts = optionsRes.data;
    const challengeFromApi = optionsRes.challenge ?? opts.challenge;
    const rawChallenge = typeof challengeFromApi === 'string' ? challengeFromApi : '';
    const challengeForNative = maybeBase64ToBase64Url(rawChallenge);
    const rpIdFromServer = String(opts.rpId || opts.rp?.id || '').trim();
    if (isRpIdMismatchForAndroid(rpIdFromServer)) {
      console.warn('[Passkey][discoverable] rpId mismatch - skipping native prompt', {
        server: rpIdFromServer,
        configured: PASSKEY_RP_ID,
      });
      showError('Passkey is not configured for this app. Please sign in with password.');
      return false;
    }
    const rpId =
      rpIdFromServer ||
      (PASSKEY_RP_ID && PASSKEY_RP_ID.trim() ? PASSKEY_RP_ID.trim() : '') ||
      '';
    const request: any = {
      challenge: challengeForNative || rawChallenge || challengeFromApi,
      rpId: rpId || 'localhost',
      timeout: opts.timeout,
      userVerification: opts.userVerification || 'preferred',
    };
    if (opts.allowCredentials?.length) {
      request.allowCredentials = opts.allowCredentials.map((c: any) => ({
        type: c.type || 'public-key',
        id: typeof c.id === 'string' ? maybeBase64ToBase64Url(c.id) : c.id,
        transports: c.transports,
      }));
    }
    console.log('[Passkey][discoverable] options', {
      rpId: request.rpId,
      hasAllowCredentials: !!request.allowCredentials?.length,
      challengeLen: typeof request.challenge === 'string' ? request.challenge.length : null,
      challengePreview:
        typeof request.challenge === 'string'
          ? `${request.challenge.slice(0, 6)}…${request.challenge.slice(-6)}`
          : null,
    });
    const credential = await Passkey.get(request);
    if (!credential) {
      showError('Authentication was cancelled');
      return false;
    }
    const verifyRes: any = await appOperation.guest.passkeyDiscoverableVerify(
      credential,
      challengeFromApi ?? rawChallenge ?? request.challenge
    );
    if (!verifyRes?.success || !verifyRes?.data?.token) {
      showError(verifyRes?.message || 'Passkey verification failed');
      return false;
    }
    showSuccess(verifyRes?.message ?? 'Login successful');
    appOperation.setCustomerToken(verifyRes.data.token);
    await AsyncStorage.setItem(USER_TOKEN_KEY, verifyRes.data.token);
    socketService.reconnectWithToken(verifyRes.data.token ?? null);
    NavigationService.resetToMainApp(NAVIGATION_BOTTOM_TAB_STACK);
    dispatch(clearPending2FA());
    dispatch(getUserProfile());
    return true;
  } catch (e: any) {
    logger(e);
    const msg = String(e?.message ?? e?.error ?? '');
    if (e?.name === 'NotAllowedError' || /cancelled|cancel/i.test(msg)) {
      showError('Authentication was cancelled. Try again or use another method.');
    } else {
      showError(e?.message || 'Passkey authentication failed');
    }
    if (e?.code == 403) {
      appOperation.setCustomerToken(e?.token);
      NavigationService.navigate(REGISTER_SCREEN, {myToken: true});
      return false;
    }
    return false;
  } finally {
    dispatch(setLoading(false));
  }
};

export const logoutAction = () => async () => {
  appOperation.setCustomerToken('');
  await AsyncStorage.removeItem(USER_TOKEN_KEY);
  NavigationService.reset(NAVIGATION_AUTH_STACK);
};
