import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { useTheme } from "../../hooks/useTheme";
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
  SIXTEEN,
  TWELVE,
} from '../../shared';
import FastImage from 'react-native-fast-image';
import { back_ic, change_email_vector, checkIc, editIcon, EMAIL_VERIFY, pasteImg } from '../../helper/ImageAssets';
import * as routes from '../../navigation/routes';
import { SETUP_TWO_FACTOR_SCREEN } from '../../navigation/routes';
import {
  sendSecurityOtp,
  addEmailToAccount,
  getUserProfile,
  initiateEmailChange,
  completeEmailChange,
} from '../../actions/accountActions';
import { VerificationOptionsSheet } from '../../shared/components/VerificationOptionsSheet';
import { showError } from '../../helper/logger';
import { SpinnerSecond } from '../../shared/components/SpinnerSecond';
import { colors } from '../../theme/colors';

const CODE_LENGTH = 6;

const maskPhone = (phone) => {
  if (!phone) return '';
  const cleaned = String(phone).replace(/\s/g, '');
  if (cleaned.length < 4) return phone;
  return '****' + cleaned.slice(-4);
};

const maskEmail = (email) => {
  if (!email) return '';
  const [username, domain] = email.split('@');
  if (!domain) return email;
  return `${(username || '').substring(0, 2)}***${(username || '').slice(-1)}@${domain}`;
};

const formatDate = (iso) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "—";
  }
};

const AddEmailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useAppDispatch();
  const { colors: themeColors, isDark } = useTheme();
  const userData = useAppSelector((state) => state.auth.userData);
  const isLoading = useAppSelector((state) => state.auth.isLoading);
  const showButtonLoading = useAppSelector((state) => state.auth.isLoading && state.auth.loadingFor === 'otp');

  const navigationMode = route?.params?.mode; // 'verify_for_ga'

  const profileMobile = userData?.mobileNumber ?? userData?.mobile_number ?? '';
  const profileCountryCode = userData?.country_code ?? userData?.countryCode ?? '';
  const mobileNumber = profileCountryCode && profileMobile ? `${profileCountryCode} ${profileMobile}`.trim() : profileMobile || '';
  const profileEmail = userData?.emailId ?? userData?.email_id ?? userData?.email ?? '';
  const hasEmail = !!profileEmail;
  const hasMobile = !!profileMobile;
  const hasGoogleAuth = (userData?.['2fa'] ?? 0) === 2;

  const firstStep = (navigationMode === 'verify_for_ga' || navigationMode === 'verify_for_password_change') ? 1 : (hasEmail ? -1 : 1);
  const [step, setStep] = useState(firstStep);
  const [warnA, setWarnA] = useState(false);
  const [warnB, setWarnB] = useState(false);

  const initialMethod = route?.params?.preferredMethod;
  const [verifyMethod, setVerifyMethod] = useState(initialMethod || (hasEmail ? 'email' : (hasGoogleAuth ? 'totp' : 'mobile')));
  const [googleCode, setGoogleCode] = useState('');
  const [mobileOtp, setMobileOtp] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newEmailOtp, setNewEmailOtp] = useState('');
  const [resendTimerAddEmail, setResendTimerAddEmail] = useState(0);
  const [resendTimerNewEmail, setResendTimerNewEmail] = useState(0);
  const [availableMethods, setAvailableMethods] = useState([]);
  const verifyOptionsSheetRef = useRef(null);

  /** Keep identity proof for final submission */
  const identityProofRef = useRef({
    verifyMethod: '',
    otpCode: '',
  });
  const otpSentForRef = useRef([]);

  useEffect(() => {
    if (resendTimerAddEmail <= 0) return;
    const t = setTimeout(() => setResendTimerAddEmail((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimerAddEmail]);
  useEffect(() => {
    if (resendTimerNewEmail <= 0) return;
    const t = setTimeout(() => setResendTimerNewEmail((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimerNewEmail]);

  useEffect(() => {
    const methods = [];
    if (hasGoogleAuth) methods.push({ value: 'totp', label: 'Google Authenticator', description: 'Use your authenticator app' });
    if (hasEmail) methods.push({ value: 'email', label: 'Email OTP', description: `Send code to ${maskEmail(profileEmail)}` });
    if (hasMobile) methods.push({ value: 'mobile', label: 'Mobile OTP', description: `Send code to ${maskPhone(mobileNumber)}` });
    setAvailableMethods(methods);
  }, [hasEmail, hasMobile, hasGoogleAuth]);

  useEffect(() => {
    if (step < 3 && verifyMethod !== 'totp') {
      handleSendOtpIdentity(verifyMethod);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, verifyMethod]);

  const handleVerifyIdentity = async () => {
    const code = verifyMethod === 'totp' ? googleCode : mobileOtp;
    if (!code || code.length !== CODE_LENGTH) {
      showError('Please enter a valid 6-digit code');
      return;
    }
    identityProofRef.current = { verifyMethod, otpCode: code };
    if (navigationMode === 'verify_for_ga') {
      navigation.navigate(SETUP_TWO_FACTOR_SCREEN, { identityProof: identityProofRef.current });
    } else if (navigationMode === 'verify_for_password_change') {
      navigation.navigate(routes.CHANGE_PASSWORD_SCREEN, {
        verifyMethod: identityProofRef.current.verifyMethod,
        otpCode: identityProofRef.current.otpCode,
        verified: true,
      });
    } else {
      setStep(2);
    }
  };

  const handleSendOtpIdentity = async (method = verifyMethod) => {
    if (method === 'totp') return;
    const purpose = (navigationMode === 'verify_for_password_change') ? 'change_password' : (hasEmail ? 'change_email' : 'add_email');
    const ok = await dispatch(sendSecurityOtp(method, purpose));
    if (ok) {
      setResendTimerAddEmail(60);
      otpSentForRef.current = [...new Set([...otpSentForRef.current, method])];
    }
  };

  useEffect(() => {
    if (step === 1 && verifyMethod !== 'totp') {
      if (!otpSentForRef.current.includes(verifyMethod)) {
        handleSendOtpIdentity(verifyMethod);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, verifyMethod]);

  const handleSendNewEmailOtp = async () => {
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) {
      showError('Please enter a valid email address');
      return;
    }

    if (hasEmail) {
      /** CHANGE MODE: Calls security/email/change/initiate */
      const proof = identityProofRef.current;
      const identity = { newEmail: newEmail.trim() };
      if (proof.verifyMethod === 'email') identity.currentEmailOtp = proof.otpCode;
      else if (proof.verifyMethod === 'mobile') identity.currentMobileOtp = proof.otpCode;
      else if (proof.verifyMethod === 'totp') identity.tofaCode = proof.otpCode;

      const ok = await dispatch(initiateEmailChange(identity));
      if (ok) setResendTimerNewEmail(60);
    } else {
      /** ADD MODE */
      const ok = await dispatch(sendSecurityOtp('new_email', 'add_email', newEmail.trim()));
      if (ok) setResendTimerNewEmail(60);
    }
  };

  const handleComplete = async () => {
    if (!newEmailOtp || newEmailOtp.length !== CODE_LENGTH) {
      showError('Please enter a valid 6-digit OTP');
      return;
    }

    if (hasEmail) {
      /** CHANGE MODE: completeEmailChange */
      const ok = await dispatch(completeEmailChange(newEmailOtp));
      if (ok) {
        await dispatch(getUserProfile());
        navigation.navigate(routes.TWO_FACTOR_AUTHENTICATION);
      }
    } else {
      /** ADD MODE: addEmailToAccount */
      const proof = identityProofRef.current;
      const identity = {};
      if (proof.verifyMethod === 'totp') identity.tofaCode = proof.otpCode;
      else if (proof.verifyMethod === 'mobile') identity.currentMobileOtp = proof.otpCode;
      else if (proof.verifyMethod === 'email') identity.emailOtp = proof.otpCode;

      const ok = await dispatch(addEmailToAccount({
        identity,
        email: newEmail.trim(),
        emailOtp: newEmailOtp,
      }));
      if (ok) {
        await dispatch(getUserProfile());
        navigation.navigate(routes.TWO_FACTOR_AUTHENTICATION);
      }
    }
  };

  return (
    <AppSafeAreaView style={{ backgroundColor: themeColors.background }}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              if (step > firstStep) setStep(step - 1);
              else navigation.goBack();
            }}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <FastImage source={back_ic} style={styles.backIcon} tintColor={themeColors.text} resizeMode="contain" />
          </TouchableOpacity>
          <AppText weight={BOLD} type={EIGHTEEN} style={[styles.headerTitle, { color: themeColors.text, marginLeft: 12 }]}>
            {navigationMode === 'verify_for_ga' || navigationMode === 'verify_for_password_change' ? 'Security Verification' : (hasEmail ? 'Change Email' : 'Add Email')}
          </AppText>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {step === -1 && (
              <View style={{ paddingTop: 10 }}>
                <AppText type={EIGHTEEN} weight={BOLD} style={{ color: themeColors.text, marginBottom: 8 }}>
                  Email Verification
                </AppText>
                <AppText type={FOURTEEN} style={{ color: themeColors.secondaryText, marginBottom: 24, lineHeight: 20 }}>
                  Verifies user identity through secure email confirmation. Helps protect account access and ensures authenticity. <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: '#AC8A51' }}>Learn More {'>'}</AppText>
                </AppText>

                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9',
                  borderRadius: 12,
                  padding: 20,
                  borderWidth: 1,
                  borderColor: themeColors.border,
                }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDark ? '#262626' : '#EEE', alignItems: 'center', justifyContent: 'center' }}>
                    <FastImage source={EMAIL_VERIFY} style={{ width: 20, height: 20 }} resizeMode="contain" tintColor={themeColors.text} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <AppText type={SIXTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text }}>
                      {maskEmail(profileEmail)}
                    </AppText>
                    <AppText type={TWELVE} style={{ color: themeColors.secondaryText, marginTop: 4 }}>
                      Added: {formatDate(userData?.emailVerifiedAt || userData?.createdAt)}
                    </AppText>
                  </View>
                  <TouchableOpacity onPress={() => setStep(0)} style={{ padding: 8 }}>
                    <FastImage source={editIcon} style={{ width: 16, height: 16 }} resizeMode="contain" tintColor={themeColors.secondaryText} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {step === 0 && (
              <View style={{ paddingTop: 10 }}>
                <View style={{ alignItems: 'center', marginBottom: 20 }}>
                  <FastImage source={change_email_vector} style={{ width: 120, height: 120 }} resizeMode="contain" />
                </View>
                <AppText type={EIGHTEEN} weight={BOLD} style={{ color: themeColors.text, textAlign: 'center', marginBottom: 12 }}>
                  Change your email?
                </AppText>
                <AppText type={FOURTEEN} style={{ color: themeColors.secondaryText, textAlign: 'center', marginBottom: 14, lineHeight: 20 }}>
                  Please confirm you understand the security notice before proceeding.
                </AppText>

                <View style={{
                  backgroundColor: isDark ? '#1A1A1A' : 'transparent', borderRadius: 12,
                  padding: 16, marginBottom: 14, borderWidth: 1, borderColor: themeColors.border
                }}>
                  <TouchableOpacity onPress={() => setWarnA(!warnA)} style={{ flexDirection: 'row', marginBottom: 16 }}>
                    <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: warnA ? themeColors.button : themeColors.border, backgroundColor: warnA ? themeColors.button : 'transparent', justifyContent: 'center', alignItems: 'center', marginTop: 2 }}>
                      {warnA && <FastImage source={checkIc} style={{ width: 10, height: 10 }} resizeMode="contain" tintColor={'#fff'} />}
                    </View>
                    <AppText type={THIRTEEN} style={{ flex: 1, marginLeft: 12, color: themeColors.text, lineHeight: 18 }}>
                      For enhanced security, withdrawals and P2P transactions may be restricted for 24 hours after updating your email.
                    </AppText>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setWarnB(!warnB)} style={{ flexDirection: 'row' }}>
                    <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: warnB ? themeColors.button : themeColors.border, backgroundColor: warnB ? themeColors.button : 'transparent', justifyContent: 'center', alignItems: 'center', marginTop: 2 }}>
                      {warnB && <FastImage source={checkIc} style={{ width: 10, height: 10 }} resizeMode="contain" tintColor={'#fff'} />}
                    </View>
                    <AppText type={THIRTEEN} style={{ flex: 1, marginLeft: 12, color: themeColors.text, lineHeight: 18 }}>
                      Your previous email can't be reused for 30 days.
                    </AppText>
                  </TouchableOpacity>
                </View>

                <Button
                  children="Confirm"
                  onPress={() => setStep(1)}
                  containerStyle={{ borderRadius: 24, backgroundColor: themeColors.button, }}
                  titleStyle={{ color: themeColors.buttonText, fontSize: 16 }}
                  disabled={!warnA || !warnB}
                />
              </View>
            )}

            {step === 1 && (
              <View style={{ paddingTop: 10 }}>
                <AppText type={EIGHTEEN} weight={BOLD} style={{ color: themeColors.text, marginBottom: 8 }}>
                  {verifyMethod === 'totp' ? 'Google Authenticator' : (verifyMethod === 'email' ? 'Verify Your Email' : 'Verify Your Mobile')}
                </AppText>
                <View style={{ marginBottom: 20 }}>
                  <AppText type={FOURTEEN} style={{ color: themeColors.secondaryText, lineHeight: 20 }}>
                    {verifyMethod === 'totp'
                      ? 'Enter the 6-digit code from your authenticator app.'
                      : `Enter the verification code sent to ${verifyMethod === 'email' ? maskEmail(profileEmail) : maskPhone(mobileNumber)}.`}
                  </AppText>
                </View>

                <View style={{ marginBottom: 12 }}>
                  <OtpInput6Digit
                    value={verifyMethod === 'totp' ? googleCode : mobileOtp}
                    onChangeText={verifyMethod === 'totp' ? setGoogleCode : setMobileOtp}
                    isDark={isDark}
                  />
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 8 }}>
                  {verifyMethod !== 'totp' ? (
                    <TouchableOpacity onPress={() => handleSendOtpIdentity()} disabled={resendTimerAddEmail > 0 || isLoading}>
                      <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ textDecorationLine: 'underline', color: resendTimerAddEmail > 0 ? themeColors.secondaryText : colors.buttonBg }}>
                        {resendTimerAddEmail > 0 ? `Resend (${resendTimerAddEmail}s)` : 'Resend'}
                      </AppText>
                    </TouchableOpacity>
                  ) : <View />}

                  <TouchableOpacity onPress={async () => {
                    try {
                      const Clipboard = require('@react-native-clipboard/clipboard').default;
                      const text = await Clipboard.getString();
                      const code = text.replace(/\D/g, '').slice(0, CODE_LENGTH);
                      if (verifyMethod === 'totp') setGoogleCode(code);
                      else setMobileOtp(code);
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
                  containerStyle={{ borderRadius: 24, backgroundColor: themeColors.button }}
                  titleStyle={{ color: themeColors.buttonText, fontSize: 16 }}
                  disabled={isLoading || (verifyMethod === 'totp' ? googleCode.length !== CODE_LENGTH : mobileOtp.length !== CODE_LENGTH)}
                />

                {availableMethods.length > 1 && (
                  <TouchableOpacity onPress={() => verifyOptionsSheetRef.current?.open()} style={{ marginTop: 24, margin: 2 }}>
                    <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ textDecorationLine: 'underline', color: themeColors.text }}>
                      Choose other verification method
                    </AppText>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {step === 2 && (
              <View style={{}}>
                <AppText type={EIGHTEEN} weight={BOLD} style={{ color: themeColors.text, }}>
                  {hasEmail ? 'Change Your Email Address' : 'Add Email Verification'}
                </AppText>
                <AppText type={FOURTEEN} style={{ color: themeColors.secondaryText, marginBottom: 18, lineHeight: 20 }}>
                  {hasEmail ? "Enter your new email and click 'Get Code' to receive a verification code." : "Please enter the email address you'd like to link to your account."}
                </AppText>

                <View style={{ marginBottom: 14 }}>
                  <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text, marginBottom: 8 }}>
                    New Email Address
                  </AppText>
                  <View style={{
                    backgroundColor: themeColors.input,
                    borderRadius: 8,
                    height: 52,
                    paddingHorizontal: 16,
                    borderWidth: isDark ? 1 : 0,
                    borderColor: isDark ? themeColors.border : 'transparent'
                  }}>
                    <TextInput
                      style={{ flex: 1, color: themeColors.text, fontSize: 14 }}
                      placeholder="Enter new email address"
                      placeholderTextColor={themeColors.secondaryText}
                      value={newEmail}
                      onChangeText={setNewEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View style={{ marginBottom: 32 }}>
                  <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text, marginBottom: 8 }}>
                    Enter Verification Code
                  </AppText>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: themeColors.input,
                    borderRadius: 8,
                    height: 52,
                    paddingHorizontal: 16,
                    borderWidth: isDark ? 1 : 0,
                    borderColor: isDark ? themeColors.border : 'transparent'
                  }}>
                    <TextInput
                      style={{ flex: 1, color: themeColors.text, fontSize: 14 }}
                      placeholder="Enter the code sent to your email"
                      placeholderTextColor={themeColors.secondaryText}
                      value={newEmailOtp}
                      onChangeText={setNewEmailOtp}
                      keyboardType="number-pad"
                    />
                    <TouchableOpacity onPress={handleSendNewEmailOtp} disabled={resendTimerNewEmail > 0 || isLoading}>
                      <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: resendTimerNewEmail > 0 ? themeColors.secondaryText : '#AC8A51' }}>
                        {resendTimerNewEmail > 0 ? `Resend (${resendTimerNewEmail}s)` : 'Get Code'}
                      </AppText>
                    </TouchableOpacity>
                  </View>
                  {resendTimerNewEmail > 0 && (
                    <AppText type={TWELVE} style={{ color: themeColors.secondaryText, marginTop: 8 }}>
                      Valid for 10 minutes
                    </AppText>
                  )}
                </View>

                <Button
                  children="Submit"
                  onPress={handleComplete}
                  loading={showButtonLoading}
                  containerStyle={{ borderRadius: 24, backgroundColor: themeColors.button }}
                  titleStyle={{ color: themeColors.buttonText, fontSize: 16 }}
                  disabled={isLoading || newEmailOtp.length !== CODE_LENGTH || !newEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())}
                />
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <VerificationOptionsSheet
        sheetRef={verifyOptionsSheetRef}
        options={availableMethods}
        onSelect={(val) => {
          setVerifyMethod(val);
          setMobileOtp('');
          setGoogleCode('');
          setResendTimerAddEmail(0);
          handleSendOtpIdentity(val);
        }}
      />
      <SpinnerSecond />
    </AppSafeAreaView>
  );
};

export default AddEmailScreen;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { padding: 4 },
  backIcon: { width: 20, height: 20 },
  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 40 },
  content: { borderRadius: 16, overflow: 'hidden' },
  imageWrap: { alignItems: 'center', justifyContent: 'center', marginVertical: 30 },
});
