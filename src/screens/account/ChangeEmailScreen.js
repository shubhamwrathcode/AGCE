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
import TouchableOpacityView from '../../shared/components/TouchableOpacityView';
import { back_ic, FINGERPRINT, pasteImg } from '../../helper/ImageAssets';
import { TextInput } from 'react-native';
import {
  sendSecurityOtp,
  initiateEmailChange,
  completeEmailChange,
  verifySecurityPasskey,
  getPasskeyList,
} from '../../actions/accountActions';
import { showError } from '../../helper/logger';
import { VerificationOptionsSheet } from '../../shared/components/VerificationOptionsSheet';
import { SpinnerSecond } from '../../shared/components/SpinnerSecond';
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

const ChangeEmailScreen = () => {
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
  const [hasPasskey, setHasPasskey] = useState(!!userData?.hasPasskey);

  const [step, setStep] = useState(1); // 1 = verify identity, 2 = change email (combined)
  const [verifyMethod, setVerifyMethod] = useState('email');
  const [availableMethods, setAvailableMethods] = useState([]);
  const [passkeyUserId, setPasskeyUserId] = useState(null);
  const [currentCode, setCurrentCode] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newEmailOtp, setNewEmailOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [resendTimerNew, setResendTimerNew] = useState(0);
  const [optionsSheetVisible, setOptionsSheetVisible] = useState(false);

  const optionsSheetRef = useRef(null);

  // Fetch passkey list to know if user has passkey
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await dispatch(getPasskeyList());
      if (!cancelled && res?.data?.passkeys?.length > 0) setHasPasskey(true);
    })();
    return () => { cancelled = true; };
  }, [dispatch]);

  // Web priority: Passkey > Google Auth > Email > Phone (all options like web)
  useEffect(() => {
    const methods = [];
    if (hasPasskey) methods.push({ value: 'passkey', label: 'Passkey', description: 'Use fingerprint or Face ID' });
    if (hasGoogleAuth) methods.push({ value: 'totp', label: 'Google Authenticator', description: 'Use your authenticator app' });
    if (hasEmail) methods.push({ value: 'email', label: 'Email OTP', description: `Send code to ${maskEmail(emailId)}` });
    if (hasMobile) methods.push({ value: 'mobile', label: 'Mobile OTP', description: `Send code to ${maskPhone(mobileNumber)}` });
    setAvailableMethods(methods);
    const def = hasPasskey ? 'passkey' : (hasGoogleAuth ? 'totp' : (hasEmail ? 'email' : 'mobile'));
    setVerifyMethod(def);
  }, [hasEmail, hasMobile, hasGoogleAuth, hasPasskey]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);
  useEffect(() => {
    if (resendTimerNew <= 0) return;
    const t = setTimeout(() => setResendTimerNew((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimerNew]);

  useEffect(() => {
    if (optionsSheetVisible) optionsSheetRef.current?.open();
    else optionsSheetRef.current?.close();
  }, [optionsSheetVisible]);

  useEffect(() => {
    if (step === 1 && verifyMethod !== 'passkey' && verifyMethod !== 'totp') {
      handleSendOtp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, verifyMethod]);

  const getVerifyTitle = () => {
    if (verifyMethod === 'passkey') return 'Passkey verification';
    if (verifyMethod === 'totp') return 'Google Authenticator';
    if (verifyMethod === 'email') return 'Email verification';
    return 'Mobile verification';
  };
  const getVerifyDesc = () => {
    if (verifyMethod === 'passkey') return 'Use your fingerprint or Face ID to verify your identity';
    if (verifyMethod === 'totp') return 'Enter the 6-digit code from your authenticator app';
    if (verifyMethod === 'email') return `Enter verification code sent to ${maskEmail(emailId)}`;
    return `Enter verification code sent to ${maskPhone(mobileNumber)}`;
  };

  const getPasskeySignId = () => emailId || mobileNumber || '';

  const handleVerifyPasskey = async () => {
    const signId = getPasskeySignId();
    if (!signId) { showError('Email or mobile required for passkey verification'); return; }
    const userId = await dispatch(verifySecurityPasskey(signId));
    if (userId) setPasskeyUserId(userId);
  };

  const handleSendOtp = async () => {
    if (verifyMethod === 'totp') return;
    const target = verifyMethod === 'email' ? 'email' : 'mobile';
    const ok = await dispatch(sendSecurityOtp(target, 'change_email'));
    if (ok) setResendTimer(60);
  };

  const handleStep1Continue = () => {
    if (verifyMethod === 'passkey') {
      if (!passkeyUserId) { showError('Please verify with passkey first'); return; }
      setStep(2);
      return;
    }
    if (!currentCode || currentCode.length !== CODE_LENGTH) {
      showError('Please enter a valid 6-digit code');
      return;
    }
    setStep(2);
  };

  const handleSendAction = async () => {
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) {
      showError('Please enter a valid email address');
      return;
    }
    const requestData = { newEmail: newEmail.trim() };
    if (verifyMethod === 'passkey') requestData.passkeyUserId = passkeyUserId;
    else if (verifyMethod === 'totp') requestData.tofaCode = currentCode;
    else if (verifyMethod === 'email') requestData.currentEmailOtp = currentCode;
    else if (verifyMethod === 'mobile') requestData.currentMobileOtp = currentCode;

    const success = await dispatch(initiateEmailChange(requestData));
    if (success) {
      const ok = await dispatch(sendSecurityOtp('new_email', 'change_email', newEmail.trim()));
      if (ok) setResendTimerNew(60);
    }
  };

  const handleStep3Complete = async () => {
    if (!newEmailOtp || newEmailOtp.length !== CODE_LENGTH) {
      showError('Please enter a valid 6-digit OTP');
      return;
    }
    const success = await dispatch(completeEmailChange(newEmailOtp));
    if (success) navigation.goBack();
  };

  const handleOptionsSelect = (value) => {
    setVerifyMethod(value);
    setCurrentCode('');
    setPasskeyUserId(null);
    setResendTimer(0);
    setOptionsSheetVisible(false);
  };

  return (
    <AppSafeAreaView style={{ backgroundColor: themeColors.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
          <TouchableOpacity
            onPress={() => (step > 0 ? setStep(step - 1) : navigation.goBack())}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <FastImage source={back_ic} style={styles.backIcon} tintColor={themeColors.text} resizeMode="contain" />
          </TouchableOpacity>
          <AppText weight={BOLD} type={EIGHTEEN} style={[styles.headerTitle, { color: themeColors.text }]}>
            {/* Change Email */}
          </AppText>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 && (
            <View style={{ paddingTop: 24 }}>
              <View style={{ marginBottom: 24 }}>
                <AppText type={THIRTEEN} style={{ color: themeColors.secondaryText, lineHeight: 20 }}>
                  {getVerifyDesc()}
                </AppText>
              </View>

              {verifyMethod === 'passkey' ? (
                <>
                  <View style={{ alignItems: 'center', marginVertical: 30 }}>
                    <View style={[styles.passkeyIconWrap, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" }]}>
                      <FastImage source={FINGERPRINT} style={{ width: 44, height: 44 }} resizeMode="contain" tintColor={themeColors.button} />
                    </View>
                  </View>
                  <Button
                    children={passkeyUserId ? 'Verified - Continue' : 'Verify with Passkey'}
                    onPress={passkeyUserId ? handleStep1Continue : handleVerifyPasskey}
                    loading={showButtonLoading}
                    containerStyle={{ borderRadius: 24, minHeight: 52, backgroundColor: '#C5A365' }}
                    titleStyle={{ color: themeColors.buttonText, fontSize: 16 }}
                  />
                </>
              ) : (
                <>
                  <View style={{ marginBottom: 12 }}>
                    <OtpInput6Digit
                      value={currentCode}
                      onChangeText={setCurrentCode}
                      isDark={isDark}
                    />
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    {verifyMethod !== 'totp' ? (
                      <TouchableOpacity onPress={handleSendOtp} disabled={resendTimer > 0 || isLoading}>
                        <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ textDecorationLine: 'underline', color: resendTimer > 0 ? themeColors.secondaryText : themeColors.text }}>
                          {resendTimer > 0 ? `Resend (${resendTimer}s)` : 'Resend'}
                        </AppText>
                      </TouchableOpacity>
                    ) : <View />}

                    <TouchableOpacity onPress={async () => {
                      try {
                        const Clipboard = require('@react-native-clipboard/clipboard').default;
                        const text = await Clipboard.getString();
                        if (text) setCurrentCode(text.replace(/\D/g, '').slice(0, CODE_LENGTH));
                      } catch (e) { }
                    }} style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text }}>Paste</AppText>
                      <FastImage source={pasteImg} style={{ width: 14, height: 14, marginLeft: 6 }} resizeMode="contain" tintColor={themeColors.text} />
                    </TouchableOpacity>
                  </View>

                  <Button
                    children="Confirm"
                    onPress={handleStep1Continue}
                    loading={showButtonLoading}
                    containerStyle={{ borderRadius: 24, minHeight: 52, backgroundColor: themeColors.button }}
                    titleStyle={{ color: themeColors.buttonText, fontSize: 16 }}
                    disabled={isLoading || currentCode.length !== CODE_LENGTH}
                  />
                </>
              )}

              {availableMethods.length > 1 && (
                <TouchableOpacityView onPress={() => setOptionsSheetVisible(true)} style={{ marginTop: 24, alignSelf: 'flex-start' }}>
                  <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ textDecorationLine: 'underline', color: themeColors.text }}>
                    Choose other verification method
                  </AppText>
                </TouchableOpacityView>
              )}
            </View>
          )}

          {step === 2 && (
            <View style={{ paddingTop: 10 }}>
              <AppText type={EIGHTEEN} weight={BOLD} style={{ color: themeColors.text, marginBottom: 24 }}>
                Change email address verification
              </AppText>

              <View style={{ marginBottom: 24 }}>
                <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text, marginBottom: 8 }}>
                  New Email
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
                  Email OTP
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
                  <TouchableOpacity onPress={handleSendAction} disabled={resendTimerNew > 0 || isLoading}>
                    <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: resendTimerNew > 0 ? themeColors.secondaryText : themeColors.button }}>
                      {resendTimerNew > 0 ? `Resend (${resendTimerNew}s)` : 'Send'}
                    </AppText>
                  </TouchableOpacity>
                </View>
                {resendTimerNew > 0 && (
                  <AppText type={TWELVE} style={{ color: themeColors.secondaryText, marginTop: 8 }}>
                    Valid for 10 minutes
                  </AppText>
                )}
              </View>

              <Button
                children="Confirm"
                onPress={handleStep3Complete}
                loading={showButtonLoading}
                containerStyle={{ borderRadius: 24, minHeight: 52, backgroundColor: '#C5A365' }}
                titleStyle={{ color: '#FFF', fontSize: 16 }}
                disabled={isLoading || newEmailOtp.length !== CODE_LENGTH || !newEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <VerificationOptionsSheet
        sheetRef={optionsSheetRef}
        options={availableMethods}
        onSelect={handleOptionsSelect}
      />
      <SpinnerSecond />
    </AppSafeAreaView>
  );
};

export default ChangeEmailScreen;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  backIcon: { width: 22, height: 22 },
  headerTitle: { fontSize: 18, marginLeft: 12 },
  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 40 },
  passkeyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
