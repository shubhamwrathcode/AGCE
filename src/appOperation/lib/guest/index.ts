import {AppOperation} from '../..';
import {
  ForgotPasswordProps,
  LoginProps,
  RegistrationProps,
  SendOtpRegistrationProps,
} from '../../../helper/types';
import {GUEST_TYPE} from '../../types';

export default (appOperation: AppOperation) => ({
  /** Resend OTP on account verification (same as web registrationOtp) */
  send_otp: (data: SendOtpRegistrationProps) =>
    appOperation.post('user/registration-otp', data, GUEST_TYPE),
  register_email: (data: RegistrationProps) =>
    appOperation.post('user/register-email', data, GUEST_TYPE),
  register_google: (data: RegistrationProps) =>
    appOperation.post('user/third-party-signup', data, GUEST_TYPE),
  register_phone: (data: RegistrationProps) =>
    appOperation.post('user/register-phone', data, GUEST_TYPE),
  /** Web parity: step-1 email availability check */
  check_signup_email: (email: string) =>
    appOperation.post('check-signup-email', { email: String(email || '').trim() }, GUEST_TYPE),
  /** Web parity: referral validity check */
  validate_signup_referral: (referralCode: string) =>
    appOperation.post(
      'validate-signup-referral',
      { referral_code: String(referralCode || '').trim() },
      GUEST_TYPE
    ),
  login: (data: LoginProps) =>
    appOperation.post('user/login', data, GUEST_TYPE),
  google_login: (data: LoginProps) =>
    appOperation.post('user/third-party-login', data, GUEST_TYPE),
  forgot: (data: ForgotPasswordProps) =>
    appOperation.post('user/forgot_password', data, GUEST_TYPE),
  /** Same as web /account-verification flow: verify OTP after register */
  verify_otp: (data: any) =>
    appOperation.post('user/verify-registration-otp', data, GUEST_TYPE),
  forgot_otp: (data: SendOtpRegistrationProps) =>
    appOperation.post('user/send-otp', data, GUEST_TYPE),
  verify_fac_otp: (data: SendOtpRegistrationProps) =>
    appOperation.post('user/verify-otp', data, GUEST_TYPE),
  
  app_version: () =>
    appOperation.get('admin/getApk', undefined, undefined, GUEST_TYPE),
  /** Web getOtp for login: Send OTP to email or mobile (type 'login') */
  send_login_otp: (signId: string, sendTo?: 'email' | 'mobile') => {
    const params: Record<string, unknown> = {
      email_or_phone: signId,
      type: 'login',
      resend: true,
    };
    if (sendTo) params.sendTo = sendTo;
    return appOperation.post('user/send-otp', params, GUEST_TYPE);
  },
  /** Passkey login: get assertion options (same as web passkeyGetAuthOptions) */
  passkeyGetAuthOptions: (signId: string) =>
    appOperation.post('security/passkey/auth/options', { signId }, GUEST_TYPE),
  /** Passkey login: verify assertion (same as web passkeyVerifyAuth) */
  passkeyVerifyAuth: (signId: string, credential: object) =>
    appOperation.post('security/passkey/auth/verify', { signId, credential }, GUEST_TYPE),
  /** Passkey login: complete and get token (same as web completePasskeyLogin) */
  completePasskeyLogin: (signId: string, verificationData: object) =>
    appOperation.post('security/passkey/login/complete', { signId, ...verificationData }, GUEST_TYPE),
  /** Discoverable passkey login (no email required – same as web “Continue with Passkey”) */
  passkeyDiscoverableAuthOptions: () =>
    appOperation.post('security/passkey/discoverable/options', {}, GUEST_TYPE),
  passkeyDiscoverableVerify: (credential: object, challenge: string) =>
    appOperation.post('security/passkey/discoverable/verify', { credential, challenge }, GUEST_TYPE),
});
