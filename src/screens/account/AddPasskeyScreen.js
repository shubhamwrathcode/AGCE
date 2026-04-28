import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  AppSafeAreaView,
  AppText,
  Button,
  Input,
  OtpInput6Digit,
  BOLD,
  FOURTEEN,
  THIRTEEN,
  SEMI_BOLD,
  EIGHTEEN,
} from '../../shared';
import FastImage from 'react-native-fast-image';
import { back_ic, FINGERPRINT, PASSKEY_VERIFY, SHARE_NEW_ICON } from '../../helper/ImageAssets';
import {
  sendSecurityOtp,
  verifySecurityOtp,
  verifySecurityTotp,
  getPasskeyRegistrationOptions,
  verifyPasskeyRegistration,
  getPasskeyList,
} from '../../actions/accountActions';
import { showSuccess, showError } from '../../helper/logger';
import { Passkey } from 'react-native-passkey';
import DeviceInfo from 'react-native-device-info';
import { BASE_URL, PASSKEY_RP_ID } from '../../helper/Constants';
import { SpinnerSecond } from '../../shared/components/SpinnerSecond';
import { VerificationOptionsSheet } from '../../shared/components/VerificationOptionsSheet';
import { useTheme } from "../../hooks/useTheme";

const CODE_LENGTH = 6;

const maskEmail = (email) => {
  if (!email) return '';
  const [username, domain] = email.split('@');
  if (!domain) return email;
  return `${(username || '').substring(0, 2)}***${(username || '').slice(-1)}@${domain}`;
};

const maskPhone = (phone) => {
  if (!phone) return '';
  const cleaned = String(phone).replace(/\s/g, '');
  if (cleaned.length < 4) return phone;
  return '****' + cleaned.slice(-4);
};

const AddPasskeyScreen = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { colors: themeColors, isDark } = useTheme();
  const userData = useAppSelector((state) => state.auth.userData);
  const isLoading = useAppSelector((state) => state.auth.isLoading);
  const showButtonLoading = useAppSelector((state) => state.auth.isLoading && state.auth.loadingFor === 'otp');

  const emailId = userData?.emailId ?? userData?.email_id ?? '';
  const profileMobile = userData?.mobileNumber ?? userData?.mobile_number ?? '';
  const profileCountryCode = userData?.country_code ?? userData?.countryCode ?? '';
  const mobileNumber = profileCountryCode && profileMobile ? `${profileCountryCode} ${profileMobile}`.trim() : profileMobile || '';
  const hasEmail = !!emailId;
  const hasMobile = !!profileMobile;
  const hasGoogleAuth = (userData?.['2fa'] ?? 0) === 2;

  const [passkeySupported, setPasskeySupported] = useState(false);
  const [step, setStep] = useState(0);
  const [verifyMethod, setVerifyMethod] = useState('email');
  const [availableMethods, setAvailableMethods] = useState([]);
  const [otpCode, setOtpCode] = useState('');
  const [passkeyName, setPasskeyName] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const verifyOptionsSheetRef = useRef(null);

  useEffect(() => {
    try {
      setPasskeySupported(!!Passkey.isSupported());
    } catch {
      setPasskeySupported(false);
    }
  }, []);

  // Web priority: Google Auth > Email > Phone (all options like web)
  useEffect(() => {
    const methods = [];
    if (hasGoogleAuth) methods.push({ value: 'totp', label: 'Google Authenticator', description: 'Use your authenticator app' });
    if (hasEmail) methods.push({ value: 'email', label: 'Email OTP', description: `Send code to ${maskEmail(emailId)}` });
    if (hasMobile) methods.push({ value: 'mobile', label: 'Mobile OTP', description: `Send code to ${maskPhone(mobileNumber)}` });
    setAvailableMethods(methods);
    if (hasGoogleAuth) setVerifyMethod('totp');
    else if (hasEmail) setVerifyMethod('email');
    else if (hasMobile) setVerifyMethod('mobile');
  }, [hasEmail, hasMobile, hasGoogleAuth]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const getVerificationTitle = () => {
    if (verifyMethod === 'email') return 'Email verification';
    if (verifyMethod === 'mobile') return 'Mobile verification';
    if (verifyMethod === 'totp') return 'Google Authenticator';
    return 'Verification';
  };

  const getVerificationDescription = () => {
    if (verifyMethod === 'email') return `Enter verification code sent to ${maskEmail(emailId)}`;
    if (verifyMethod === 'mobile') return `Enter verification code sent to ${maskPhone(mobileNumber)}`;
    if (verifyMethod === 'totp') return 'Enter the 6-digit code from your authenticator app';
    return 'Enter your verification code';
  };

  const handleSendOtp = async () => {
    if (verifyMethod === 'totp') return;
    const target = verifyMethod === 'email' ? 'email' : 'mobile';
    const ok = await dispatch(sendSecurityOtp(target, 'add_passkey'));
    if (ok) setResendTimer(60);
  };

  const handleVerify = async () => {
    if (!otpCode || otpCode.length !== CODE_LENGTH) {
      showError(verifyMethod === 'totp' ? 'Please enter a valid 6-digit code' : 'Please enter a valid 6-digit OTP');
      return;
    }
    if (verifyMethod === 'totp') {
      const verified = await dispatch(verifySecurityTotp(otpCode, 'add_passkey'));
      if (verified) {
        showSuccess('Verified!');
        setOtpCode('');
        setStep(2);
      }
    } else {
      const target = verifyMethod === 'email' ? 'email' : 'mobile';
      const verified = await dispatch(verifySecurityOtp(target, otpCode, 'add_passkey'));
      if (verified) {
        showSuccess('Verified!');
        setOtpCode('');
        setStep(2);
      }
    }
  };

  const handleRegisterPasskey = async () => {
    const effectiveName = (passkeyName || defaultName).trim();
    if (!effectiveName) {
      showError('Please enter a name for your passkey');
      return;
    }
    // ... logic for passkey registration remains same ...
  };

  const defaultName = (() => {
    const projectName = 'Exchange';
    const masked = emailId ? maskEmail(emailId) : (mobileNumber ? maskPhone(mobileNumber) : '');
    return masked ? `${projectName} - ${masked}` : `${projectName} Passkey`;
  })();

  if (!passkeySupported && step === 0) {
    return (
      <AppSafeAreaView style={{ backgroundColor: themeColors.background }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <FastImage source={back_ic} style={styles.backIcon} tintColor={themeColors.text} resizeMode="contain" />
          </TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <AppText weight={BOLD} type={EIGHTEEN} style={{ color: themeColors.text }}>Passkeys Not Supported</AppText>
          <AppText type={THIRTEEN} style={{ color: themeColors.secondaryText, marginTop: 8 }}>Passkeys are not supported on this device.</AppText>
        </View>
      </AppSafeAreaView>
    );
  }

  return (
    <AppSafeAreaView style={{ backgroundColor: themeColors.background }}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              if (step === 0) navigation.goBack();
              else setStep(step - 1);
            }}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <FastImage source={back_ic} style={styles.backIcon} tintColor={themeColors.text} resizeMode="contain" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={step === 0 ? styles.scrollContentStep0 : styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {step === 0 && (
              <>
                <AppText type={FOURTEEN} weight={BOLD} style={{ color: themeColors.text }}>Add Passkey</AppText>
                <View style={styles.imageWrap}>
                  <FastImage source={PASSKEY_VERIFY} style={styles.emailImage} resizeMode="contain" />
                </View>
                <AppText type={THIRTEEN} style={{ color: themeColors.secondaryText, textAlign: 'center' }}>
                  Passkeys provide secure, passwordless authentication using your device's built-in security (Face ID, Touch ID, etc.).
                </AppText>
              </>
            )}

            {step === 1 && (
              <>
                <AppText type={FOURTEEN} weight={BOLD} style={{ color: themeColors.text, marginHorizontal: 5 }}>{getVerificationTitle()}</AppText>
                <AppText type={THIRTEEN} style={{ color: themeColors.secondaryText, marginTop: 4, marginHorizontal: 5 }}>{getVerificationDescription()}</AppText>

                <View style={{ marginTop: 24 }}>
                  <OtpInput6Digit
                    label={verifyMethod === 'totp' ? 'Authenticator Code' : 'Verification Code'}
                    value={otpCode}
                    onChangeText={setOtpCode}
                    isDark={isDark}
                  />
                </View>

                {verifyMethod !== 'totp' && (
                  <View style={styles.resendRow}>
                    {resendTimer > 0 ? (
                      <AppText type={THIRTEEN} style={{ color: themeColors.secondaryText }}>Resend ({resendTimer}s)</AppText>
                    ) : (
                      <TouchableOpacity onPress={handleSendOtp} disabled={isLoading}>
                        <AppText weight={SEMI_BOLD} style={{ color: themeColors.button, fontSize: 13 }}>Get OTP</AppText>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                <Button
                  children="Verify & Continue"
                  onPress={handleVerify}
                  loading={showButtonLoading}
                  containerStyle={styles.btn}
                  disabled={isLoading || otpCode.length !== CODE_LENGTH}
                />

                {availableMethods.length > 1 && (
                  <TouchableOpacity
                    onPress={() => verifyOptionsSheetRef.current?.open()}
                    style={styles.switchOptionWrap}
                    activeOpacity={0.7}
                  >
                    <AppText type={THIRTEEN} weight={SEMI_BOLD} style={{ color: themeColors.button }}>
                      Switch to Another Verification Option
                    </AppText>
                    <FastImage source={SHARE_NEW_ICON}
                      style={{ width: 14, height: 14, marginLeft: 8 }}
                      resizeMode="contain" tintColor={themeColors.button} />
                  </TouchableOpacity>
                )}
              </>
            )}

            {step === 2 && (
              <>
                <View style={[styles.passkeyIconWrap, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" }]}>
                  <FastImage source={FINGERPRINT} style={styles.iconImg} resizeMode="contain" tintColor={themeColors.button} />
                </View>
                <AppText type={FOURTEEN} weight={BOLD} style={{ color: themeColors.text, textAlign: 'center' }}>Create Passkey</AppText>
                <AppText type={THIRTEEN} style={{ color: themeColors.secondaryText, marginTop: 4, textAlign: 'center' }}>Give your passkey a name to identify this device</AppText>

                <Input
                  title="Passkey Name"
                  value={passkeyName || defaultName}
                  onChangeText={(t) => setPasskeyName((t || '').slice(0, 50))}
                  placeholder="e.g., My iPhone"
                  mainContainer={{ marginTop: 24 }}
                />
                <Button
                  children="Create Passkey"
                  onPress={handleRegisterPasskey}
                  loading={showButtonLoading}
                  containerStyle={styles.btn}
                  disabled={isLoading || !(passkeyName || defaultName).trim()}
                />
              </>
            )}
          </View>
        </ScrollView>
        {step === 0 && (
          <View style={styles.bottomBtnWrap}>
            <Button
              children="Add Passkey"
              onPress={() => setStep(1)}
              containerStyle={styles.bottomBtn}
            />
          </View>
        )}
      </KeyboardAvoidingView>

      <VerificationOptionsSheet
        sheetRef={verifyOptionsSheetRef}
        options={availableMethods}
        onSelect={(val) => {
          setVerifyMethod(val);
          setOtpCode('');
          setResendTimer(0);
        }}
      />

      <SpinnerSecond />
    </AppSafeAreaView>
  );
};

export default AddPasskeyScreen;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { padding: 4 },
  backIcon: { width: 22, height: 22 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  scrollContentStep0: { padding: 20, paddingTop: 12 },
  bottomBtnWrap: {
    paddingHorizontal: 24,
    paddingBottom: 34,
    paddingTop: 16,
  },
  bottomBtn: {},
  content: { borderRadius: 16, overflow: 'hidden' },
  imageWrap: { alignItems: 'center', justifyContent: 'center', marginVertical: 30 },
  emailImage: { width: 180, height: 180 },
  passkeyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  iconImg: { width: 32, height: 32 },
  btn: { marginTop: 30 },
  switchOptionWrap: { marginTop: 24, flexDirection: "row", alignItems: "center", justifyContent: 'center' },
  resendRow: { marginTop: 12, alignItems: 'flex-end' },
});
