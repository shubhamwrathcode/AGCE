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
  OtpInput6Digit,
  BOLD,
  FOURTEEN,
  THIRTEEN,
  SEMI_BOLD,
  EIGHTEEN,
  Button,
  Input,
  SIXTEEN,
  TWELVE,
} from '../../shared';
import FastImage from 'react-native-fast-image';
import {
  back_ic,
  SECURITY_SHEIELD,
  FINGERPRINT,
  homeIcon,
  passkey_login,
  security_risk_vector,
  right_ic,
  EMAIL_VERIFY,
  PHONE_VERIFY,
  GOOGLE_VERIFY,
  PASSKEY_VERIFY,
  pasteImg,
} from '../../helper/ImageAssets';
import {
  ADD_EMAIL_SCREEN,
  ADD_PHONE_NUMBER_SCREEN,
  SETUP_TWO_FACTOR_SCREEN,
} from '../../navigation/routes';
import {
  sendSecurityOtp,
  verifySecurityOtp,
  verifySecurityTotp,
  getPasskeyRegistrationOptions,
  verifyPasskeyRegistration,
  getUserProfile,
} from '../../actions/accountActions';
import { showSuccess, showError } from '../../helper/logger';
import { Passkey } from 'react-native-passkey';
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
  const [step, setStep] = useState(0); // 0: Intro/Risk, 1: Verification, 2: OTP
  const [verifyMethod, setVerifyMethod] = useState('email');
  const [availableMethods, setAvailableMethods] = useState([]);
  const [passkeyName, setPasskeyName] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const verifyOptionsSheetRef = useRef(null);

  const getActiveMethodsCount = () => {
    let count = 0;
    if (hasEmail) count++;
    if (hasMobile) count++;
    if (hasGoogleAuth) count++;
    return count;
  };

  const isSecuritySatisfied = getActiveMethodsCount() >= 2;

  const getVerifyTitle = () => {
    switch (verifyMethod) {
      case 'totp': return 'Google Authenticator';
      case 'email': return 'Email Verification';
      case 'mobile': return 'Phone Verification';
      default: return 'Identity Verification';
    }
  };

  const getVerifyDesc = () => {
    switch (verifyMethod) {
      case 'totp': return 'Enter the 6-digit code from your authenticator app';
      case 'email': return `Please enter the 6-digit code sent to ${maskEmail(emailId)}`;
      case 'mobile': return `Please enter the 6-digit code sent to ${maskPhone(mobileNumber)}`;
      default: return 'Please verify your identity to continue';
    }
  };

  const handleSendOtp = async () => {
    if (verifyMethod === 'totp') return;
    const ok = await dispatch(sendSecurityOtp(verifyMethod, 'add_passkey'));
    if (ok) {
      setResendTimer(60);
    }
  };

  const switchToVerification = () => {
    if (!isSecuritySatisfied) {
      setStep(2);
      return;
    }
    setStep(1);
    if (verifyMethod !== 'totp') {
      handleSendOtp();
    }
  };

  const handleVerifyIdentity = async () => {
    let ok = false;
    if (verifyMethod === 'totp') {
      ok = await dispatch(verifySecurityTotp(otpCode, 'add_passkey'));
    } else {
      ok = await dispatch(verifySecurityOtp(verifyMethod, otpCode, 'add_passkey'));
    }

    if (ok) {
      handleRegisterPasskey();
    }
  };

  useEffect(() => {
    try {
      setPasskeySupported(!!Passkey.isSupported());
    } catch {
      setPasskeySupported(false);
    }

    const name = emailId ? `Exchange - ${emailId.split('@')[0]}` : 'Exchange Passkey';
    setPasskeyName(name);
  }, [emailId]);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setInterval(() => setResendTimer(p => p - 1), 1000);
      return () => clearInterval(t);
    }
  }, [resendTimer]);

  useEffect(() => {
    const methods = [];
    if (hasGoogleAuth) methods.push({ value: 'totp', label: 'Google Authenticator', description: 'Use your authenticator app', icon: GOOGLE_VERIFY });
    if (hasEmail) methods.push({ value: 'email', label: 'Email OTP', description: `Send code to ${maskEmail(emailId)}`, icon: EMAIL_VERIFY });
    if (hasMobile) methods.push({ value: 'mobile', label: 'Mobile OTP', description: `Send code to ${maskPhone(mobileNumber)}`, icon: PHONE_VERIFY });
    setAvailableMethods(methods);
    const def = hasGoogleAuth ? 'totp' : (hasEmail ? 'email' : 'mobile');
    setVerifyMethod(def);
  }, [hasEmail, hasMobile, hasGoogleAuth]);

  const handleRegisterPasskey = async () => {
    if (!passkeySupported) {
      showError('Passkeys are not supported on this device');
      return;
    }

    const registrationOptions = await dispatch(getPasskeyRegistrationOptions());
    if (!registrationOptions) return;

    try {
      const passkeyResponse = await Passkey.create(registrationOptions);
      if (passkeyResponse) {
        const verified = await dispatch(verifyPasskeyRegistration(passkeyResponse, passkeyName || 'Mobile Passkey'));
        if (verified) {
          showSuccess('Passkey added successfully');
          await dispatch(getUserProfile());
          navigation.goBack();
        }
      }
    } catch (error) {
      if (error.message !== 'User cancelled the operation') {
        showError('Passkey registration failed');
      }
    }
  };

  const renderRiskStep = () => {
    const missingMethods = [];
    if (!hasEmail) missingMethods.push({ id: 'email', label: 'Email', icon: EMAIL_VERIFY, route: ADD_EMAIL_SCREEN });
    if (!hasMobile) missingMethods.push({ id: 'mobile', label: 'Phone Number', icon: PHONE_VERIFY, route: ADD_PHONE_NUMBER_SCREEN });
    if (!hasGoogleAuth) missingMethods.push({ id: 'totp', label: 'Google Authenticator', icon: GOOGLE_VERIFY, route: SETUP_TWO_FACTOR_SCREEN });

    return (
      <View style={styles.introContainer}>
        <View style={styles.illustrationWrap}>
          <FastImage source={security_risk_vector} style={styles.mainIllustration} resizeMode="contain" />
        </View>

        <AppText weight={BOLD} type={EIGHTEEN} style={{ color: themeColors.text, textAlign: 'center', marginBottom: 12 }}>
          Security Risk Warning
        </AppText>
        <AppText type={FOURTEEN} style={{ color: themeColors.secondaryText, textAlign: 'center', marginBottom: 32, lineHeight: 20 }}>
          To enhance your account security, please activate at least one additional verification method.
        </AppText>

        <View style={styles.riskList}>
          {missingMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[styles.riskItem, { borderColor: themeColors.border }]}
              onPress={() => navigation.navigate(method.route)}
            >
              <View style={styles.riskItemLeft}>
                <View style={[styles.featureIconBox, { backgroundColor: isDark ? '#262626' : '#F5F5F5' }]}>
                  <FastImage source={method.icon} style={styles.featureIcon} resizeMode="contain" />
                </View>
                <AppText weight={SEMI_BOLD} type={FOURTEEN} style={{ color: themeColors.text }}>{method.label}</AppText>
              </View>
              <FastImage source={right_ic} style={{ width: 14, height: 14 }} tintColor={themeColors.secondaryText} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderIntroStep = () => {
    return (
      <View style={styles.introContainer}>
        <AppText weight={BOLD} type={EIGHTEEN} style={{ color: themeColors.text, fontSize: 24, marginBottom: 12 }}>
          Passkey
        </AppText>
        <AppText type={FOURTEEN} style={{ color: themeColors.secondaryText, lineHeight: 20, marginBottom: 20 }}>
          Passkey keeps your account safe by protecting it from threats like phishing attacks. It also provides a more secure and convenient way to log in. <AppText type={FOURTEEN} style={{ color: '#007AFF' }}>Learn More {'>'}</AppText>
        </AppText>

        <View style={styles.illustrationWrap}>
          <FastImage source={PASSKEY_VERIFY} style={styles.mainIllustration} resizeMode="contain" />
        </View>

        <View style={styles.featureList}>
          <View style={styles.featureItem}>
            <View style={[styles.featureIconBox, { backgroundColor: isDark ? '#262626' : '#F5F5F5' }]}>
              <FastImage source={SECURITY_SHEIELD} style={styles.featureIcon} tintColor={themeColors.text} />
            </View>
            <View style={styles.featureText}>
              <AppText weight={BOLD} type={FOURTEEN} style={{ color: themeColors.text }}>High Security</AppText>
              <AppText type={TWELVE} style={{ color: themeColors.secondaryText }}>Protect accounts from traditional password theft risks</AppText>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIconBox, { backgroundColor: isDark ? '#262626' : '#F5F5F5' }]}>
              <FastImage source={FINGERPRINT} style={styles.featureIcon} tintColor={themeColors.text} />
            </View>
            <View style={styles.featureText}>
              <AppText weight={BOLD} type={FOURTEEN} style={{ color: themeColors.text }}>Easy Verification</AppText>
              <AppText type={TWELVE} style={{ color: themeColors.secondaryText }}>Verify in one tap, free from remembering complex passwords</AppText>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIconBox, { backgroundColor: isDark ? '#262626' : '#F5F5F5' }]}>
              <FastImage source={homeIcon} style={styles.featureIcon} tintColor={themeColors.text} />
            </View>
            <View style={styles.featureText}>
              <AppText weight={BOLD} type={FOURTEEN} style={{ color: themeColors.text }}>Multi-Device</AppText>
              <AppText type={TWELVE} style={{ color: themeColors.secondaryText }}>Use passkey across devices seamlessly</AppText>
            </View>
          </View>
        </View>

        <View style={styles.bottomBtnWrap}>
          <Button
            children="Add a Passkey"
            onPress={switchToVerification}
            containerStyle={{ backgroundColor: '#2B2E33', borderRadius: 25, height: 50 }}
            textStyle={{ fontSize: 16 }}
          />
        </View>
      </View>
    );
  };

  return (
    <AppSafeAreaView style={{ backgroundColor: themeColors.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <FastImage source={back_ic} style={styles.backIcon} tintColor={themeColors.text} resizeMode="contain" />
          </TouchableOpacity>
          <AppText weight={BOLD} type={EIGHTEEN} style={{ color: themeColors.text, marginLeft: 12 }}>Add Passkey</AppText>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {step === 0 ? renderIntroStep() : step === 2 ? renderRiskStep() : (
            <View style={{ paddingTop: 10 }}>
              <View style={{ marginBottom: 24 }}>
                <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text, marginBottom: 8 }}>
                  Passkey Name
                </AppText>
                <Input
                  value={passkeyName}
                  onChangeText={setPasskeyName}
                  placeholder="e.g. My Phone Passkey"
                  containerStyle={{ backgroundColor: themeColors.input, borderRadius: 12, height: 52 }}
                />
              </View>

              <AppText type={SIXTEEN} weight={BOLD} style={{ color: themeColors.text, marginBottom: 8 }}>
                {getVerifyTitle()}
              </AppText>
              <View style={{ marginBottom: 16 }}>
                <AppText type={THIRTEEN} style={{ color: themeColors.secondaryText, lineHeight: 20 }}>
                  {getVerifyDesc()}
                </AppText>
              </View>

              <View style={{ marginBottom: 12 }}>
                <OtpInput6Digit
                  value={otpCode}
                  onChangeText={setOtpCode}
                  isDark={isDark}
                />
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                {verifyMethod !== 'totp' ? (
                  <TouchableOpacity onPress={() => handleSendOtp()} disabled={resendTimer > 0 || isLoading}>
                    <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ textDecorationLine: 'underline', color: resendTimer > 0 ? themeColors.secondaryText : '#C5A365' }}>
                      {resendTimer > 0 ? `Resend (${resendTimer}s)` : 'Resend'}
                    </AppText>
                  </TouchableOpacity>
                ) : <View />}

                <TouchableOpacity onPress={async () => {
                  try {
                    const Clipboard = require('@react-native-clipboard/clipboard').default;
                    const text = await Clipboard.getString();
                    if (text) setOtpCode(text.replace(/\D/g, '').slice(0, CODE_LENGTH));
                  } catch (e) { }
                }} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text }}>Paste</AppText>
                  <FastImage source={pasteImg} style={{ width: 14, height: 14, marginLeft: 6 }} resizeMode="contain" tintColor={themeColors.text} />
                </TouchableOpacity>
              </View>

              <Button
                children="Confirm"
                onPress={handleVerifyIdentity}
                loading={showButtonLoading}
                containerStyle={{ borderRadius: 24, minHeight: 52, backgroundColor: themeColors.button }}
                titleStyle={{ color: themeColors.buttonText, fontSize: 16 }}
                disabled={isLoading || otpCode.length !== CODE_LENGTH}
              />

              {availableMethods.length > 1 && (
                <TouchableOpacity onPress={() => verifyOptionsSheetRef.current?.open()} style={{ marginTop: 24, alignSelf: 'flex-start' }}>
                  <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ textDecorationLine: 'underline', color: themeColors.text }}>
                    Choose other verification method
                  </AppText>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
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
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 4 },
  backIcon: { width: 22, height: 22 },
  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 40 },
  introContainer: {
    paddingTop: 10,
    flex: 1,
  },
  illustrationWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainIllustration: {
    width: 200,
    height: 200,
  },
  featureList: {
    marginTop: 10,
    gap: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureIcon: {
    width: 22,
    height: 22,
  },
  featureText: {
    flex: 1,
    gap: 2,
  },
  bottomBtnWrap: {
    marginTop: 50,
    paddingBottom: 20,
  },
  riskList: {
    gap: 12,
  },
  riskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderRadius: 16,
  },
  riskItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  }
});
