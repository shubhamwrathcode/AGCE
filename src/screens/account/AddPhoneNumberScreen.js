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
} from '../../shared';
import FastImage from 'react-native-fast-image';
import { back_ic, PHONE_VERIFY } from '../../helper/ImageAssets';
import {
  sendSecurityOtp,
  addMobileToAccount,
  getUserProfile,
} from '../../actions/accountActions';
import { showError } from '../../helper/logger';
import PickerSelect from '../../shared/components/PickerSelect';
import { countriesList } from '../../helper/CountriesList';
import { SpinnerSecond } from '../../shared/components/SpinnerSecond';
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

  const [step, setStep] = useState(0);
  const [verifyMethod, setVerifyMethod] = useState('email');
  const [googleCode, setGoogleCode] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [newCountryCode, setNewCountryCode] = useState(profileCountryCode || '+91');
  const [newMobileNumber, setNewMobileNumber] = useState('');
  const [newMobileOtp, setNewMobileOtp] = useState('');
  const [resendTimerAddMobile, setResendTimerAddMobile] = useState(0);
  const [resendTimerNewMobile, setResendTimerNewMobile] = useState(0);

  /** Keep identity OTP/TOTP when steps unmount (matches web: values sent on final mobile/add only). */
  const identityProofRef = useRef({
    verifyMethod: 'email',
    emailOtp: '',
    googleCode: '',
  });

  /** Exact string passed to `security/send-otp` with target `new_mobile` — backend often validates SMS OTP against this key. */
  const lastNewMobileSendIdentifierRef = useRef('');

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

  const firstStep = hasGoogleAuth ? 1 : 2;

  /** Web parity (TwofactorPage / smsVerification): identity OTP/TOTP is validated on `security/mobile/add`, not via separate verify-otp beforehand. */
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
    }
  };

  const handleSendOtpIdentity = async () => {
    const ok = await dispatch(sendSecurityOtp(verifyMethod, 'add_mobile'));
    if (ok) setResendTimerAddMobile(60);
  };

  const handleNextToOtp = () => {
    if (!newMobileNumber || newMobileNumber.length < 6) {
      showError('Please enter a valid mobile number');
      return;
    }
    setStep(4);
  };

  const handleSendOtpNewMobile = async () => {
    const countryCodeStr = typeof newCountryCode === 'string' ? newCountryCode : (newCountryCode?.value ?? '+91');
    const cc = normalizeCountryCode(countryCodeStr);
    const digits = String(newMobileNumber ?? '').replace(/\D/g, '');
    /** Web `smsVerification`: `${country.code}${newMobile}` — no space; country includes leading `+`. */
    const fullNumber = `${cc}${digits}`;
    const ok = await dispatch(sendSecurityOtp('new_mobile', 'add_mobile', fullNumber));
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
    if (vm === 'email' && savedEmailOtp.length === CODE_LENGTH) {
      identity.emailOtp = savedEmailOtp;
    } else if (vm === 'mobile' && savedEmailOtp.length === CODE_LENGTH) {
      identity.currentMobileOtp = savedEmailOtp;
    } else if (vm === 'totp' && savedTotp.length === CODE_LENGTH) {
      identity.tofaCode = savedTotp;
    } else if (hasGoogleAuth && savedTotp.length === CODE_LENGTH && !savedEmailOtp) {
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

    /** Same as web `TwofactorPage` → `handleAddMobileComplete`: one POST; include `identifier` = phone key used for `new_mobile` send-otp so SMS OTP validates. */
    const success = await dispatch(
      addMobileToAccount(mobileNumberDigits, ccNorm, smsOtp, {
        ...identity,
        newMobileIdentifier,
      })
    );
    if (success) {
      await dispatch(getUserProfile());
      navigation.goBack();
    }
  };

  const flowTotal = hasGoogleAuth ? 4 : 3;
  const flowIndex =
    step === 0
      ? 0
      : hasGoogleAuth
        ? step
        : step - 1;
  const progressPct =
    step === 0 ? 0 : Math.min(100, (flowIndex / flowTotal) * 100);

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
              if (step === 0) navigation.goBack();
              else if (step > firstStep) setStep(step - 1);
              else setStep(0);
            }}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <FastImage source={back_ic} style={styles.backIcon} tintColor={themeColors.text} resizeMode="contain" />
          </TouchableOpacity>
          <AppText
            type={FOURTEEN}
            weight={SEMI_BOLD}
            numberOfLines={1}
            style={[styles.headerTitle, { color: themeColors.text }]}
          >
            Phone verification
          </AppText>
          <View style={styles.headerSide} />
        </View>

        {step > 0 ? (
          <View style={[styles.progressTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${progressPct}%`, backgroundColor: themeColors.button },
              ]}
            />
          </View>
        ) : null}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={step === 0 ? styles.scrollContentStep0 : styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 0 && (
            <View style={styles.hero}>
              <AppText type={SIXTEEN} weight={BOLD} style={[styles.heroTitle, { color: themeColors.text }]}>
                Secure your account
              </AppText>
              <AppText type={TWELVE} style={[styles.heroSubtitle, { color: themeColors.secondaryText }]}>
                Add a phone number for withdrawals and important security alerts. It only takes a minute.
              </AppText>
              <View style={[styles.heroImageRing, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                <FastImage source={PHONE_VERIFY} style={styles.phoneVerifyImage} resizeMode="contain" />
              </View>
            </View>
          )}

          {step === 1 && hasGoogleAuth && (
            <View style={[styles.card, { borderColor: themeColors.border, backgroundColor: themeColors.card }, cardShadow]}>
              {stepBadge(1)}
              <AppText type={FOURTEEN} weight={BOLD} style={[styles.cardTitle, { color: themeColors.text }]}>
                Authenticator
              </AppText>
              <AppText type={THIRTEEN} style={[styles.cardDesc, { color: themeColors.secondaryText }]}>
                Enter the 6-digit code from your Google Authenticator app.
              </AppText>
              <View style={styles.fieldBlock}>
                <OtpInput6Digit label="Authenticator code" value={googleCode} onChangeText={setGoogleCode} isDark={isDark} />
              </View>
              <Button
                children="Continue"
                onPress={handleVerifyIdentity}
                loading={showButtonLoading}
                containerStyle={[styles.btnPrimary, { backgroundColor: themeColors.button }]}
                titleStyle={{ color: themeColors.buttonText }}
                disabled={isLoading || googleCode.length !== CODE_LENGTH}
              />
            </View>
          )}

          {step === 2 && (
            <View style={[styles.card, { borderColor: themeColors.border, backgroundColor: themeColors.card }, cardShadow]}>
              {stepBadge(hasGoogleAuth ? 2 : 1)}
              <AppText type={FOURTEEN} weight={BOLD} style={[styles.cardTitle, { color: themeColors.text }]}>
                Verify identity
              </AppText>
              <AppText type={THIRTEEN} style={[styles.cardDesc, { color: themeColors.secondaryText }]}>
                {hasEmail && hasMobile
                  ? 'Choose email or SMS, send a one-time code, then enter it below.'
                  : hasEmail
                    ? 'We will send a one-time code to your email.'
                    : 'We will send a one-time code to your mobile.'}
              </AppText>

              {hasEmail && hasMobile && (
                <View style={styles.methodGroup}>
                  <AppText type={TWELVE} weight={SEMI_BOLD} style={[styles.sectionLabel, { color: themeColors.secondaryText }]}>
                    VERIFY WITH
                  </AppText>
                  <View style={styles.methodRow}>
                    <TouchableOpacityView
                      onPress={() => {
                        setVerifyMethod('email');
                        setEmailOtp('');
                        setResendTimerAddMobile(0);
                      }}
                      style={[
                        styles.methodChip,
                        { borderColor: themeColors.border },
                        verifyMethod === 'email' && {
                          borderColor: themeColors.button,
                          backgroundColor: `${themeColors.button}14`,
                        },
                      ]}
                    >
                      <AppText
                        weight={SEMI_BOLD}
                        type={THIRTEEN}
                        style={{ color: verifyMethod === 'email' ? themeColors.button : themeColors.text }}
                      >
                        Email
                      </AppText>
                    </TouchableOpacityView>
                    <TouchableOpacityView
                      onPress={() => {
                        setVerifyMethod('mobile');
                        setEmailOtp('');
                        setResendTimerAddMobile(0);
                      }}
                      style={[
                        styles.methodChip,
                        { borderColor: themeColors.border },
                        verifyMethod === 'mobile' && {
                          borderColor: themeColors.button,
                          backgroundColor: `${themeColors.button}14`,
                        },
                      ]}
                    >
                      <AppText
                        weight={SEMI_BOLD}
                        type={THIRTEEN}
                        style={{ color: verifyMethod === 'mobile' ? themeColors.button : themeColors.text }}
                      >
                        SMS
                      </AppText>
                    </TouchableOpacityView>
                  </View>
                </View>
              )}

              <AppText type={THIRTEEN} style={[styles.hintText, { color: themeColors.text }]}>
                Tap <AppText weight={SEMI_BOLD}>Send code</AppText> to message{' '}
                <AppText weight={SEMI_BOLD}>
                  {verifyMethod === 'email' ? maskEmail(emailId) : maskPhone(mobileNumber)}
                </AppText>
              </AppText>

              <View style={styles.fieldBlock}>
                <OtpInput6Digit
                  label={verifyMethod === 'email' ? 'Email code' : 'SMS code'}
                  value={emailOtp}
                  onChangeText={setEmailOtp}
                  isDark={isDark}
                />
              </View>

              <View style={[styles.resendBlock, { borderTopColor: themeColors.border }]}>
                {resendTimerAddMobile > 0 ? (
                  <AppText type={THIRTEEN} style={{ color: themeColors.secondaryText }}>
                    Resend in {resendTimerAddMobile}s
                  </AppText>
                ) : (
                  <TouchableOpacity onPress={handleSendOtpIdentity} disabled={isLoading}>
                    <AppText weight={SEMI_BOLD} type={THIRTEEN} style={{ color: themeColors.button }}>
                      Send code
                    </AppText>
                  </TouchableOpacity>
                )}
              </View>

              <Button
                children="Continue"
                onPress={handleVerifyIdentity}
                loading={showButtonLoading}
                containerStyle={styles.btnPrimary}
                titleStyle={{ color: themeColors.buttonText }}
                disabled={isLoading || emailOtp.length !== CODE_LENGTH}
              />
            </View>
          )}

          {step === 3 && (
            <View style={[styles.card, { borderColor: themeColors.border, backgroundColor: themeColors.card }, cardShadow]}>
              {stepBadge(hasGoogleAuth ? 3 : 2)}
              <AppText type={FOURTEEN} weight={BOLD} style={[styles.cardTitle, { color: themeColors.text }]}>
                Your number
              </AppText>
              <AppText type={THIRTEEN} style={[styles.cardDesc, { color: themeColors.secondaryText }]}>
                Enter the mobile number you want to link. You will confirm it with SMS next.
              </AppText>

              <View style={styles.fieldBlock}>
                <AppText type={THIRTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text, marginBottom: 8 }}>
                  Country
                </AppText>
                <PickerSelect
                  data={countryCodePickerData}
                  selected={newCountryCode}
                  onSelect={(item) => setNewCountryCode(item?.value ?? item ?? '+91')}
                  placeholder="Country code"
                  theme={isDark ? 'Dark' : 'Light'}
                  style={[
                    styles.picker,
                    {
                      borderColor: themeColors.border,
                      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                    },
                  ]}
                  flag={true}
                />
              </View>

              <Input
                title="Mobile number"
                value={newMobileNumber}
                onChangeText={(t) => setNewMobileNumber((t || '').replace(/\D/g, ''))}
                placeholder="Enter number"
                mainContainer={{ marginTop: 4 }}
                keyboardType="phone-pad"
              />

              <Button
                children="Continue"
                onPress={handleNextToOtp}
                containerStyle={[styles.btnPrimary, { backgroundColor: themeColors.button }]}
                titleStyle={{ color: themeColors.buttonText }}
                disabled={!newMobileNumber || newMobileNumber.length < 6}
              />
            </View>
          )}

          {step === 4 && (
            <View style={[styles.card, { borderColor: themeColors.border, backgroundColor: themeColors.card }, cardShadow]}>
              {stepBadge(hasGoogleAuth ? 4 : 3)}
              <AppText type={FOURTEEN} weight={BOLD} style={[styles.cardTitle, { color: themeColors.text }]}>
                SMS verification
              </AppText>
              <AppText type={THIRTEEN} style={[styles.cardDesc, { color: themeColors.secondaryText }]}>
                We sent a code to your new number. Enter it below to finish.
              </AppText>

              <AppText type={THIRTEEN} style={[styles.hintText, { color: themeColors.text }]}>
                Number:{' '}
                <AppText weight={SEMI_BOLD}>
                  {normalizeCountryCode(typeof newCountryCode === 'string' ? newCountryCode : newCountryCode?.value ?? '+91')}
                  {newMobileNumber}
                </AppText>
              </AppText>

              <View style={styles.fieldBlock}>
                <OtpInput6Digit
                  label="SMS code"
                  value={newMobileOtp}
                  onChangeText={setNewMobileOtp}
                  isDark={isDark}
                />
              </View>

              <View style={[styles.resendBlock, { borderTopColor: themeColors.border }]}>
                {resendTimerNewMobile > 0 ? (
                  <AppText type={THIRTEEN} style={{ color: themeColors.secondaryText }}>
                    Resend in {resendTimerNewMobile}s
                  </AppText>
                ) : (
                  <TouchableOpacity onPress={handleSendOtpNewMobile} disabled={isLoading}>
                    <AppText weight={SEMI_BOLD} type={THIRTEEN} style={{ color: themeColors.button }}>
                      Send code again
                    </AppText>
                  </TouchableOpacity>
                )}
              </View>

              <Button
                children="Add phone number"
                onPress={handleComplete}
                loading={showButtonLoading}
                containerStyle={[styles.btnPrimary, { backgroundColor: themeColors.button }]}
                titleStyle={{ color: themeColors.buttonText }}
                disabled={isLoading || newMobileOtp.length !== CODE_LENGTH}
              />
            </View>
          )}
        </ScrollView>

        {step === 0 && (
          <View style={styles.bottomBtnWrap}>
            <Button
              children="Add phone number"
              onPress={() => setStep(firstStep)}
              containerStyle={[styles.bottomBtn, { backgroundColor: themeColors.button }]}
              titleStyle={{ color: themeColors.buttonText }}
            />
          </View>
        )}
      </KeyboardAvoidingView>
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
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },
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
