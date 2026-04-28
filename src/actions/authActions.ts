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

export const sendOtp =
  (data: SendOtpRegistrationProps, setDisbaleBtn = (p0: boolean) => {}, setTimer = (p0: number) => {}) =>
  async (dispatch: AppDispatch) => {
    try {
      dispatch(setLoading(true));
      const response: any = await appOperation.guest.send_otp(data);
      if (response.success) {
        showError(response.message);
        setDisbaleBtn(true);
        setTimer(60);
      }
    } catch (e: any) {
      logger(e);
      showError(e?.message);
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
      console.log('[register_email] API response:', JSON.stringify(response, null, 2));
      if (!response.success) {
        showError(response.message);
        // handleClearCaptcha();
      } else {
        // showSuccess(response?.message);
        appOperation.setCustomerToken(response?.token);
        // handleClearCaptcha();
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
      console.log('[register_phone] API response:', JSON.stringify(response, null, 2));
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

export const login = (data: LoginProps & { token?: string }) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoading(true));
    const response: any = await appOperation.guest.login(data);

    if (!response.success) {
      if (response?.code == 403) {
        appOperation.setCustomerToken(response?.data);
        NavigationService.navigate(REGISTER_SCREEN, {myToken: true, userData: data});
        return;
      }
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
      } else if (webShape) {
        dispatch(setUserData(d));
        const methods = d?.availableMethods ?? [];
        const hasPasskey = methods.some((m: any) => m?.type === 4) || !!d?.hasPasskey;
        dispatch(setPending2FA({
          loginSignId: d?.signId ?? data?.email_or_phone,
          availableMethods: methods,
          defaultMethod: hasPasskey ? 4 : (d?.defaultMethod ?? 1),
          data: d,
        }));
        NavigationService.navigate(AUTH_VERIFICATION_SCREEN);
      } else {
        dispatch(setUserData(d));
        const methods = d?.availableMethods ?? [];
        const hasPasskey = methods.some((m: any) => m?.type === 4) || !!d?.hasPasskey;
        dispatch(setPending2FA({
          loginSignId: data?.email_or_phone,
          availableMethods: methods,
          defaultMethod: hasPasskey ? 4 : (d?.['2fa'] ?? 1),
          data: d?.['2fa'] === 2 ? data : d,
        }));
        NavigationService.navigate(AUTH_VERIFICATION_SCREEN);
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
        const hasPasskey = methods.some((m: any) => m?.type === 4) || !!d?.hasPasskey;
        dispatch(setPending2FA({
          loginSignId: signId,
          availableMethods: methods,
          defaultMethod: hasPasskey ? 4 : (d?.defaultMethod ?? 1),
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
export const verifyOtp = (data: any, setOtp = (p0: string) => {}) => async (dispatch: AppDispatch) => {
  try {
    dispatch(setLoadingOtp(true));
    const response: any = await appOperation.guest.verify_otp(data);

    if (!response.success) {
      showError(response?.message ?? 'Verification failed.');
      setOtp('');
    } else {
      showSuccess(response?.message ?? 'Account verified successfully.');
      setOtp('');
      NavigationService.navigate(NAVIGATION_AUTH_STACK, {
        screen: ACCOUNT_ACTIVATED_SCREEN,
      });
    }
  } catch (e: any) {
    logger(e);
    const errorMessage =
      e?.response?.data?.message ??
      e?.message ??
      (e?.request ? 'Network error. Please check your internet connection.' : null);
    showError(errorMessage ?? 'An error occurred. Please try again later.');
    setOtp('');
  } finally {
    dispatch(setLoadingOtp(false));
    setOtp('');
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
  } catch (e: any) {
    logger(e);
    showError(e?.message);
    if (e?.code == 403) {
      appOperation.setCustomerToken(e?.token);
      NavigationService.navigate(REGISTER_SCREEN, {myToken: true});
      return;
    }
  } finally {
    dispatch(setLoadingOtp(false));
  }
};

/** Normalize assertion challenge to base64url for native Passkey.get */
const toBase64URL = (str: string) =>
  str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

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
    const challenge =
      typeof opts.challenge === 'string'
        ? toBase64URL(opts.challenge.replace(/-/g, '+').replace(/_/g, '/'))
        : opts.challenge;
    const rpId =
      PASSKEY_RP_ID && PASSKEY_RP_ID.trim()
        ? PASSKEY_RP_ID.trim()
        : (opts.rpId || opts.rp?.id || '');
    const request: any = {
      challenge: challenge || opts.challenge,
      rpId: rpId || 'localhost',
      timeout: opts.timeout,
      userVerification: opts.userVerification || 'required',
    };
    if (opts.allowCredentials?.length) {
      request.allowCredentials = opts.allowCredentials.map((c: any) => ({
        type: c.type || 'public-key',
        id: typeof c.id === 'string' ? toBase64URL(c.id.replace(/-/g, '+').replace(/_/g, '/')) : c.id,
        transports: c.transports,
      }));
    }
    const credential = await Passkey.get(request);
    if (!credential) {
      showError('Authentication was cancelled');
      return false;
    }
    const verifyRes: any = await appOperation.guest.passkeyVerifyAuth(signId, credential);
    if (!verifyRes?.success) {
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
    const challenge =
      typeof challengeFromApi === 'string'
        ? toBase64URL(challengeFromApi.replace(/-/g, '+').replace(/_/g, '/'))
        : challengeFromApi;
    const rpId =
      PASSKEY_RP_ID && PASSKEY_RP_ID.trim()
        ? PASSKEY_RP_ID.trim()
        : (opts.rpId || opts.rp?.id || '');
    const request: any = {
      challenge: challenge || challengeFromApi,
      rpId: rpId || 'localhost',
      timeout: opts.timeout,
      userVerification: opts.userVerification || 'preferred',
    };
    if (opts.allowCredentials?.length) {
      request.allowCredentials = opts.allowCredentials.map((c: any) => ({
        type: c.type || 'public-key',
        id: typeof c.id === 'string' ? toBase64URL(c.id.replace(/-/g, '+').replace(/_/g, '/')) : c.id,
        transports: c.transports,
      }));
    }
    const credential = await Passkey.get(request);
    if (!credential) {
      showError('Authentication was cancelled');
      return false;
    }
    const verifyRes: any = await appOperation.guest.passkeyDiscoverableVerify(credential, challengeFromApi ?? challenge);
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
