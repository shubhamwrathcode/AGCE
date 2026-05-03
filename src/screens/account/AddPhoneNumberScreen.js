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
  TWELVE,
  SIXTEEN,
  SEMI_BOLD,
  EIGHTEEN,
  FIFTEEN,
} from '../../shared';
import FastImage from 'react-native-fast-image';
import { back_ic, pasteImg, PHONE_VERIFY, SHARE_NEW_ICON, security_risk_vector, EMAIL_VERIFY, GOOGLE_VERIFY, FINGERPRINT } from '../../helper/ImageAssets';
import AuthPhoneInput from '../../shared/components/AuthPhoneInput';
import { TextInput } from 'react-native';
import * as routes from '../../navigation/routes';
import {
  sendSecurityOtp,
  addMobileToAccount,
  getUserProfile,
  initiateMobileChange,
  completeMobileChange,
} from '../../actions/accountActions';
import { showError } from '../../helper/logger';
import PickerSelect from '../../shared/components/PickerSelect';
import { countriesList } from '../../helper/CountriesList';
import { SpinnerSecond } from '../../shared/components/SpinnerSecond';
import { VerificationOptionsSheet } from '../../shared/components/VerificationOptionsSheet';
import { useTheme } from "../../hooks/useTheme";
import TouchableOpacityView from '../../common/TouchableOpacityView';

const CODE_LENGTH = 6;
const countryCodePickerData = countriesList || [];

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

/** Match web Twofactor (`+91`); picker may return `91` without plus — SMS OTP session keys must match send-otp + mobile/add. */
const normalizeCountryCode = (raw) => {
  const s = String(raw ?? '').trim();
  if (!s) return '+91';
  return s.startsWith('+') ? s : `+${s.replace(/^\+/, '')}`;
};

const AddPhoneNumberScreen = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { colors: themeColors, isDark } = useTheme();
  const userData = useAppSelector((state) => state.auth.userData);
  const isLoading = useAppSelector((state) => state.auth.isLoading);
  const showButtonLoading = useAppSelector((state) => state.auth.isLoading && state.auth.loadingFor === 'otp');

  const emailId = userData?.emailId ?? userData?.email_id ?? userData?.email ?? '';
  const profileCountryCode = userData?.country_code ?? userData?.countryCode ?? '';
  const profileMobile = userData?.mobileNumber ?? userData?.mobile_number ?? '';
  const mobileNumber = profileCountryCode && profileMobile ? `${profileCountryCode} ${profileMobile}`.trim() : profileMobile || '';
  const hasEmail = !!emailId;
  const hasMobile = !!profileMobile;
  const hasGoogleAuth = (userData?.['2fa'] ?? 0) === 2;
  const hasPasskey = (userData?.passkeys_count ?? 0) > 0;
  const passkeySupported = Platform.OS === 'ios' || Platform.OS === 'android';

  const firstStep = 2;
  const [step, setStep] = useState(firstStep);
  const [verifyMethod, setVerifyMethod] = useState('email');
  const [googleCode, setGoogleCode] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [newCountryCode, setNewCountryCode] = useState(profileCountryCode || '+91');
  const [newMobileNumber, setNewMobileNumber] = useState('');
  const [newMobileOtp, setNewMobileOtp] = useState('');
  const [resendTimerAddMobile, setResendTimerAddMobile] = useState(0);
  const [resendTimerNewMobile, setResendTimerNewMobile] = useState(0);
  const [countryName, setCountryName] = useState('IN');

  /** Keep identity OTP/TOTP when steps unmount (matches web: values sent on final mobile/add only). */
  const identityProofRef = useRef({
    verifyMethod: 'email',
    emailOtp: '',
    googleCode: '',
  });
  const [showRiskOptions, setShowRiskOptions] = useState(false);

  const [availableMethods, setAvailableMethods] = useState([]);
  const verifyOptionsSheetRef = useRef(null);

  /** Exact string passed to `security/send-otp` with target `new_mobile` — backend often validates SMS OTP against this key. */
  const lastNewMobileSendIdentifierRef = useRef('');

  useEffect(() => {
    const methods = [];
    if (hasGoogleAuth) methods.push({ value: 'totp', label: 'Google Authenticator', description: 'Use your authenticator app' });
    if (hasEmail) methods.push({ value: 'email', label: 'Email OTP', description: `Send code to ${maskEmail(emailId)}` });
    if (hasMobile) methods.push({ value: 'mobile', label: 'Mobile OTP', description: `Send code to ${maskPhone(profileMobile)}` });
    setAvailableMethods(methods);
  }, [hasEmail, hasMobile, hasGoogleAuth]);

  useEffect(() => {
    if (resendTimerAddMobile <= 0) return;
    const t = setTimeout(() => setResendTimerAddMobile((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimerAddMobile]);
  useEffect(() => {
    if (resendTimerNewMobile <= 0) return;
    const t = setTimeout(() => setResendTimerNewMobile((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimerNewMobile]);

  const handleSendOtpIdentity = async (methodOverride) => {
    const targetMethod = typeof methodOverride === 'string' ? methodOverride : verifyMethod;
    const ok = await dispatch(sendSecurityOtp(targetMethod, 'add_mobile'));
    if (ok) setResendTimerAddMobile(60);
  };

  useEffect(() => {
    if (firstStep === 2) {
      handleSendOtpIdentity(verifyMethod);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const handleVerifyIdentity = () => {
    if (step === 1 && hasGoogleAuth) {
      const totp = String(googleCode || '').replace(/\D/g, '').slice(0, CODE_LENGTH);
      if (totp.length !== CODE_LENGTH) {
        showError('Please enter a valid 6-digit code');
        return;
      }
      identityProofRef.current.googleCode = totp;
      identityProofRef.current.verifyMethod = 'totp';
      setStep(2);
      handleSendOtpIdentity(verifyMethod);
      return;
    }
    if (step === 2) {
      const otp = String(emailOtp || '').replace(/\D/g, '').slice(0, CODE_LENGTH);
      if (otp.length !== CODE_LENGTH) {
        showError('Please enter a valid 6-digit OTP');
        return;
      }
      identityProofRef.current.emailOtp = otp;
      identityProofRef.current.verifyMethod = verifyMethod;
      setStep(3);
    } else if (step === 3) {
      if (hasGoogleAuth) {
        setStep(4);
      } else {
        handleComplete();
      }
    } else if (step === 4) {
      handleComplete();
    }
  };

  const handleSendOtpNewMobile = async (overrideFullNumber) => {
    const countryCodeStr = typeof newCountryCode === 'string' ? newCountryCode : (newCountryCode?.value ?? '+91');
    const cc = normalizeCountryCode(countryCodeStr);
    const digits = String(newMobileNumber ?? '').replace(/\D/g, '');
    const fullNumber = typeof overrideFullNumber === 'string' ? overrideFullNumber : `${cc}${digits}`;

    const ok = await dispatch(sendSecurityOtp('new_mobile', hasMobile ? 'change_mobile' : 'add_mobile', fullNumber));
    if (ok) {
      lastNewMobileSendIdentifierRef.current = fullNumber;
      setResendTimerNewMobile(60);
    }
  };

  const handleComplete = async () => {
    const smsOtp = String(newMobileOtp || '').replace(/\D/g, '').slice(0, CODE_LENGTH);
    if (smsOtp.length !== CODE_LENGTH) {
      showError('Please enter a valid 6-digit OTP');
      return;
    }
    const countryCodeStr = typeof newCountryCode === 'string' ? newCountryCode : (newCountryCode?.value ?? '+91');
    const ccNorm = normalizeCountryCode(countryCodeStr);
    const mobileNumberDigits = String(newMobileNumber ?? '').replace(/\D/g, '').trim();
    if (!mobileNumberDigits || mobileNumberDigits.length < 6) {
      showError('Please enter a valid mobile number');
      return;
    }
    const proof = identityProofRef.current;
    const vm = proof.verifyMethod || verifyMethod;
    const savedEmailOtp = String(proof.emailOtp || emailOtp || '').replace(/\D/g, '').slice(0, CODE_LENGTH);
    const savedTotp = String(proof.googleCode || googleCode || '').replace(/\D/g, '').slice(0, CODE_LENGTH);

    const identity = {};
    if (savedEmailOtp.length === CODE_LENGTH) {
      if (vm === 'email') identity.emailOtp = savedEmailOtp;
      else if (vm === 'mobile') identity.currentMobileOtp = savedEmailOtp;
    }
    if (hasGoogleAuth && savedTotp.length === CODE_LENGTH) {
      identity.tofaCode = savedTotp;
    }

    if (!identity.emailOtp && !identity.currentMobileOtp && !identity.tofaCode) {
      showError('Verification is required. Please complete the email or authenticator step.');
      return;
    }

    const rebuildSendKey = `${ccNorm}${mobileNumberDigits}`;
    const newMobileIdentifier =
      lastNewMobileSendIdentifierRef.current &&
        lastNewMobileSendIdentifierRef.current === rebuildSendKey
        ? lastNewMobileSendIdentifierRef.current
        : rebuildSendKey;

    if (hasMobile) {
      /** CHANGE MODE: Must call Initiate (with identity proof) then Complete (with SMS OTP) sequentially. */
      const initiateData = {
        newMobileNumber: mobileNumberDigits,
        newCountryCode: ccNorm,
        ...identity
      };
      const initSuccess = await dispatch(initiateMobileChange(initiateData));
      if (initSuccess) {
        const completeSuccess = await dispatch(completeMobileChange(smsOtp));
        if (completeSuccess) {
          await dispatch(getUserProfile());
          navigation.navigate(routes.TWO_FACTOR_AUTHENTICATION);
        }
      }
    } else {
      /** ADD MODE: Calls security/mobile/add. */
      const success = await dispatch(
        addMobileToAccount(mobileNumberDigits, ccNorm, smsOtp, {
          ...identity,
          newMobileIdentifier,
        })
      );
      if (success) {
        await dispatch(getUserProfile());
        navigation.navigate(routes.TWO_FACTOR_AUTHENTICATION);
      }
    }
  };

  const flowTotal = hasGoogleAuth ? 3 : 2;
  const flowIndex = step - 1;
  const progressPct = Math.min(100, (flowIndex / flowTotal) * 100);

  const stepBadge = (n) => (
    <AppText type={TWELVE} weight={SEMI_BOLD} style={[styles.stepBadge, { color: themeColors.button }]}>
      Step {n} of {flowTotal}
    </AppText>
  );

  const cardShadow =
    Platform.OS === 'ios'
      ? {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.35 : 0.08,
        shadowRadius: 12,
      }
      : { elevation: 3 };

  return (
    <AppSafeAreaView style={{ backgroundColor: themeColors.background }}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              if (step === firstStep) navigation.goBack();
              else setStep(step - 1);
            }}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <FastImage source={back_ic} style={styles.backIcon} tintColor={themeColors.text} resizeMode="contain" />
          </TouchableOpacity>
          <AppText weight={BOLD} type={EIGHTEEN} style={[styles.headerTitle, { color: themeColors.text }]}>
            {hasMobile ? 'Change Mobile Number' : 'Add Mobile Number'}
          </AppText>
          <View style={styles.headerSide} />
        </View>

        <View style={[styles.progressTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${progressPct}%`, backgroundColor: themeColors.button },
            ]}
          />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 && hasGoogleAuth && (
            <View style={{ paddingTop: 10 }}>
              <AppText type={EIGHTEEN} weight={BOLD} style={{ color: themeColors.text, marginBottom: 12 }}>
                Verify Authenticator
              </AppText>

              <View style={{ marginBottom: 16 }}>
                <AppText type={THIRTEEN} style={{ color: themeColors.secondaryText, lineHeight: 20 }}>
                  Enter the 6-digit code from your Google Authenticator app.
                </AppText>
              </View>

              <View style={{ marginBottom: 12 }}>
                <OtpInput6Digit value={googleCode} onChangeText={setGoogleCode} isDark={isDark} />
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 24 }}>
                <TouchableOpacity onPress={async () => {
                  try {
                    const Clipboard = require('@react-native-clipboard/clipboard').default;
                    const text = await Clipboard.getString();
                    if (text) setGoogleCode(text.replace(/\D/g, '').slice(0, CODE_LENGTH));
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
                disabled={isLoading || googleCode.length !== CODE_LENGTH}
              />
            </View>
          )}

          {step === 2 && (
            <View style={{ paddingTop: 10 }}>
              <AppText type={EIGHTEEN} weight={BOLD} style={{ color: themeColors.text, marginBottom: 12 }}>
                Verify Your Email
              </AppText>

              <View style={{ marginBottom: 16 }}>
                <AppText type={THIRTEEN} style={{ color: themeColors.secondaryText, lineHeight: 20 }}>
                  The verification code has been sent to your {verifyMethod === 'email' ? 'email' : 'mobile'} {verifyMethod === 'email' ? maskEmail(emailId) : maskPhone(mobileNumber)}, valid for 10 minutes.
                </AppText>
              </View>

              <View style={{ marginBottom: 12 }}>
                <OtpInput6Digit
                  value={emailOtp}
                  onChangeText={setEmailOtp}
                  isDark={isDark}
                />
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <TouchableOpacity onPress={() => handleSendOtpIdentity()} disabled={resendTimerAddMobile > 0 || isLoading}>
                  <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ textDecorationLine: 'underline', color: resendTimerAddMobile > 0 ? themeColors.secondaryText : themeColors.text }}>
                    {resendTimerAddMobile > 0 ? `Resend (${resendTimerAddMobile}s)` : 'Resend'}
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity onPress={async () => {
                  try {
                    const Clipboard = require('@react-native-clipboard/clipboard').default;
                    const text = await Clipboard.getString();
                    if (text) setEmailOtp(text.replace(/\D/g, '').slice(0, CODE_LENGTH));
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
                disabled={isLoading || (verifyMethod === 'totp' ? googleCode.length !== CODE_LENGTH : emailOtp.length !== CODE_LENGTH)}
              />

              {hasEmail && (
                <TouchableOpacity onPress={() => setShowRiskOptions(true)} style={{ marginTop: 24 }}>
                  <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ textDecorationLine: 'underline', color: themeColors.text }}>
                    Choose other verification method
                  </AppText>
                </TouchableOpacity>
              )}
            </View>
          )}

          {step === 3 && (
            <View style={{ paddingTop: 10 }}>
              <AppText type={EIGHTEEN} weight={BOLD} style={{ color: themeColors.text, marginBottom: 20 }}>
                {hasMobile ? 'Change Mobile Number' : 'Link & Verify Mobile Number'}
              </AppText>

              <View style={{}}>
                <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text, marginBottom: 8 }}>
                  Phone
                </AppText>
                <AuthPhoneInput
                  value={newMobileNumber}
                  onChangeText={(t) => setNewMobileNumber((t || '').replace(/\D/g, ''))}
                  placeholder="Enter phone number"
                  onSelectCountry={(cc) => {
                    const code = Array.isArray(cc) ? cc[0] : cc;
                    setNewCountryCode(`+${code}`);
                  }}
                  onCountry={(c) => setCountryName(c)}
                  country={countryName}
                  countryCode={[newCountryCode.replace('+', '')]}
                />
              </View>

              <View style={{ marginBottom: 32 }}>
                <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text, marginBottom: 8 }}>
                  SMS Code
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
                    placeholder="Enter the code Sent to your phone"
                    placeholderTextColor={themeColors.secondaryText}
                    value={newMobileOtp}
                    onChangeText={setNewMobileOtp}
                    keyboardType="number-pad"
                  />
                  <TouchableOpacity onPress={() => handleSendOtpNewMobile()} disabled={resendTimerNewMobile > 0 || isLoading}>
                    <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: resendTimerNewMobile > 0 ? themeColors.secondaryText : themeColors.button }}>
                      {resendTimerNewMobile > 0 ? `Resend (${resendTimerNewMobile}s)` : 'Send'}
                    </AppText>
                  </TouchableOpacity>
                </View>
                {resendTimerNewMobile > 0 ? (
                  <AppText type={TWELVE} style={{ color: themeColors.secondaryText, marginTop: 8 }}>
                    Valid for 10 minutes
                  </AppText>
                ) : <View />}
              </View>

              <Button
                children={hasGoogleAuth ? "Next" : "Confirm"}
                onPress={handleVerifyIdentity}
                loading={showButtonLoading}
                containerStyle={{ borderRadius: 24, minHeight: 52, backgroundColor: themeColors.button }}
                titleStyle={{ color: themeColors.buttonText, fontSize: 16 }}
                disabled={isLoading || newMobileOtp.length !== CODE_LENGTH || !newMobileNumber || newMobileNumber.length < 6}
              />
            </View>
          )}

          {step === 4 && hasGoogleAuth && (
            <View style={{ paddingTop: 10 }}>
              <AppText type={EIGHTEEN} weight={BOLD} style={{ color: themeColors.text, marginBottom: 12 }}>
                Verify Authenticator
              </AppText>
              <AppText type={FOURTEEN} style={{ color: themeColors.secondaryText, marginBottom: 24, lineHeight: 20 }}>
                Enter the 6-digit code from your Google Authenticator app to finalize the changes.
              </AppText>

              <View style={{ marginBottom: 32 }}>
                <OtpInput6Digit
                  value={googleCode}
                  onChangeText={setGoogleCode}
                  disabled={isLoading}
                />
              </View>

              <Button
                children="Confirm"
                onPress={handleVerifyIdentity}
                loading={showButtonLoading}
                containerStyle={{ borderRadius: 24, minHeight: 52, backgroundColor: themeColors.button }}
                titleStyle={{ color: themeColors.buttonText, fontSize: 16 }}
                disabled={isLoading || googleCode.length !== CODE_LENGTH}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {showRiskOptions && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: themeColors.background, zIndex: 999 }]}>
          <AppSafeAreaView style={{ flex: 1 }}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setShowRiskOptions(false)} style={styles.backBtn}>
                <FastImage source={back_ic} style={styles.backIcon} tintColor={themeColors.text} resizeMode="contain" />
              </TouchableOpacity>
              <AppText weight={BOLD} type={EIGHTEEN} style={[styles.headerTitle, { color: themeColors.text }]}>
                Security Verification
              </AppText>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={{ padding: 24, alignItems: 'center' }}>
              <View style={{ width: 120, height: 120, marginBottom: 24 }}>
                <FastImage source={security_risk_vector} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
              </View>

              <AppText weight={BOLD} type={EIGHTEEN} style={{ color: themeColors.text, textAlign: 'center', marginBottom: 12 }}>
                Security Risk Warning
              </AppText>
              <AppText type={FOURTEEN} style={{ color: themeColors.secondaryText, textAlign: 'center', marginBottom: 32, lineHeight: 20 }}>
                To enhance your account security, please activate at least one additional verification method.
              </AppText>

              <View style={{ width: '100%' }}>
                {availableMethods.map((m) => (
                  <TouchableOpacity
                    key={m.value}
                    onPress={() => {
                      setVerifyMethod(m.value);
                      if (m.value === 'email') setEmailOtp('');
                      if (m.value === 'totp') setGoogleCode('');
                      setResendTimerAddMobile(0);
                      handleSendOtpIdentity(m.value);
                      setShowRiskOptions(false);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 16,
                      backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9',
                      borderRadius: 12,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: themeColors.border
                    }}
                  >
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: isDark ? '#262626' : '#EEE', alignItems: 'center', justifyContent: 'center' }}>
                      <FastImage 
                        source={m.value === 'totp' ? GOOGLE_VERIFY : (m.value === 'email' ? EMAIL_VERIFY : PHONE_VERIFY)} 
                        style={{ width: 16, height: 16 }} 
                        tintColor={themeColors.text}
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 16 }}>
                      <AppText type={SIXTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text }}>{m.label}</AppText>
                    </View>
                    <AppText style={{ color: themeColors.secondaryText }}>›</AppText>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </AppSafeAreaView>
        </View>
      )}
      <VerificationOptionsSheet
        sheetRef={verifyOptionsSheetRef}
        options={availableMethods}
        onSelect={(val) => {
          setVerifyMethod(val);
          setEmailOtp('');
          setResendTimerAddMobile(0);
          handleSendOtpIdentity(val);
        }}
      />
      <SpinnerSecond />
    </AppSafeAreaView>
  );
};

export default AddPhoneNumberScreen;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 48,
  },
  headerSide: { width: 40 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  backBtn: { padding: 8, width: 40 },
  backIcon: { width: 22, height: 22 },
  progressTrack: {
    height: 3,
    marginHorizontal: 20,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 40 },
  scrollContentStep0: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 120 },
  hero: { alignItems: 'center' },
  heroTitle: { textAlign: 'center', letterSpacing: -0.3 },
  heroSubtitle: {
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
    maxWidth: 320,
  },
  heroImageRing: {
    marginTop: 28,
    width: 168,
    height: 168,
    borderRadius: 84,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneVerifyImage: { width: 120, height: 120 },
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
    marginBottom: 8,
  },
  stepBadge: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  cardTitle: { marginBottom: 6 },
  cardDesc: { lineHeight: 20, marginBottom: 4 },
  sectionLabel: {
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  fieldBlock: { marginTop: 18 },
  hintText: { marginTop: 14, lineHeight: 20 },
  btnPrimary: { marginTop: 22, borderRadius: 14, minHeight: 52 },
  bottomBtnWrap: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128,128,128,0.2)',
  },
  bottomBtn: {
    borderRadius: 14,
    minHeight: 52,
  },
  picker: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  methodRow: { flexDirection: 'row', gap: 12 },
  methodGroup: { marginTop: 16 },
  methodChip: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resendBlock: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
});
