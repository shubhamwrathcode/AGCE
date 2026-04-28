import React, { useState, useEffect } from 'react';
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
} from '../../shared';
import FastImage from 'react-native-fast-image';
import { back_ic, EMAIL_VERIFY } from '../../helper/ImageAssets';
import {
  sendSecurityOtp,
  addEmailToAccount,
  getUserProfile,
} from '../../actions/accountActions';
import { showError } from '../../helper/logger';
import { SpinnerSecond } from '../../shared/components/SpinnerSecond';
import { useTheme } from "../../hooks/useTheme";

const CODE_LENGTH = 6;

const maskPhone = (phone) => {
  if (!phone) return '';
  const cleaned = String(phone).replace(/\s/g, '');
  if (cleaned.length < 4) return phone;
  return '****' + cleaned.slice(-4);
};

const AddEmailScreen = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { colors: themeColors, isDark } = useTheme();
  const userData = useAppSelector((state) => state.auth.userData);
  const isLoading = useAppSelector((state) => state.auth.isLoading);
  const showButtonLoading = useAppSelector((state) => state.auth.isLoading && state.auth.loadingFor === 'otp');

  const profileMobile = userData?.mobileNumber ?? userData?.mobile_number ?? '';
  const profileCountryCode = userData?.country_code ?? userData?.countryCode ?? '';
  const mobileNumber = profileCountryCode && profileMobile ? `${profileCountryCode} ${profileMobile}`.trim() : profileMobile || '';
  const hasMobile = !!profileMobile;
  const hasGoogleAuth = (userData?.['2fa'] ?? 0) === 2;

  const [step, setStep] = useState(0);
  const [googleCode, setGoogleCode] = useState('');
  const [mobileOtp, setMobileOtp] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newEmailOtp, setNewEmailOtp] = useState('');
  const [resendTimerAddEmail, setResendTimerAddEmail] = useState(0);
  const [resendTimerNewEmail, setResendTimerNewEmail] = useState(0);

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

  const firstStep = hasGoogleAuth ? 1 : hasMobile ? 2 : 3;

  const handleVerifyIdentity = async () => {
    if (step === 1 && hasGoogleAuth) {
      if (!googleCode || googleCode.length !== CODE_LENGTH) {
        showError('Please enter a valid 6-digit code');
        return;
      }
      setStep(hasMobile ? 2 : 3);
    } else if (step === 2 && hasMobile) {
      if (!mobileOtp || mobileOtp.length !== CODE_LENGTH) {
        showError('Please enter a valid 6-digit OTP');
        return;
      }
      setStep(3);
    }
  };

  const handleSendOtpMobile = async () => {
    const ok = await dispatch(sendSecurityOtp('mobile', 'add_email'));
    if (ok) setResendTimerAddEmail(60);
  };

  const handleNextToEmailOtp = () => {
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) {
      showError('Please enter a valid email address');
      return;
    }
    setStep(4);
  };

  const handleSendOtpNewEmail = async () => {
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) {
      showError('Please enter a valid email first');
      return;
    }
    const ok = await dispatch(sendSecurityOtp('new_email', 'add_email', newEmail.trim()));
    if (ok) setResendTimerNewEmail(60);
  };

  const handleComplete = async () => {
    if (!newEmailOtp || newEmailOtp.length !== CODE_LENGTH) {
      showError('Please enter a valid 6-digit OTP');
      return;
    }
    const payload = {
      email: newEmail.trim(),
      emailOtp: newEmailOtp,
      ...(hasGoogleAuth && googleCode ? { tofaCode: googleCode } : {}),
      ...(hasMobile && mobileOtp ? { mobileOtp } : {}),
    };
    const success = await dispatch(addEmailToAccount(payload));
    if (success) {
      await dispatch(getUserProfile());
      navigation.goBack();
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
              if (step === 0) navigation.goBack();
              else if (step > firstStep) setStep(step - 1);
              else setStep(0);
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
                <AppText type={FOURTEEN} weight={BOLD} style={{ color: themeColors.text }}>Add Email Address</AppText>
                <View style={styles.imageWrap}>
                  <FastImage source={EMAIL_VERIFY} style={styles.emailImage} resizeMode="contain" />
                </View>
                <AppText type={THIRTEEN} style={{ color: themeColors.secondaryText, textAlign: 'center' }}>
                  Add an email address to your account for secure login and notifications.
                </AppText>
              </>
            )}

            {step === 1 && hasGoogleAuth && (
              <>
                <AppText type={FOURTEEN} weight={BOLD} style={{ color: themeColors.text }}>Add Email Address</AppText>
                <AppText type={THIRTEEN} style={{ color: themeColors.secondaryText, marginTop: 4 }}>Step 1: Verify Google Authenticator</AppText>
                <View style={{ marginTop: 24 }}>
                  <OtpInput6Digit label="Google Authenticator Code" value={googleCode} onChangeText={setGoogleCode} isDark={isDark} />
                </View>
                <Button
                  children="Continue"
                  onPress={handleVerifyIdentity}
                  containerStyle={styles.btn}
                  disabled={googleCode.length !== CODE_LENGTH}
                />
              </>
            )}

            {step === 2 && hasMobile && (
              <>
                <AppText type={FOURTEEN} weight={BOLD} style={{ color: themeColors.text }}>Add Email Address</AppText>
                <AppText type={THIRTEEN} style={{ color: themeColors.secondaryText, marginTop: 4 }}>Step 2: Verify your mobile number</AppText>
                <AppText type={THIRTEEN} style={{ color: themeColors.text, marginTop: 16 }}>
                  Click "Send OTP" to receive a code on <AppText weight={SEMI_BOLD}>{maskPhone(mobileNumber)}</AppText>
                </AppText>
                <View style={{ marginTop: 20 }}>
                  <OtpInput6Digit
                    label="Mobile Verification Code"
                    value={mobileOtp}
                    onChangeText={setMobileOtp}
                    isDark={isDark}
                  />
                </View>
                <View style={styles.resendRow}>
                  {resendTimerAddEmail > 0 ? (
                    <AppText type={THIRTEEN} style={{ color: themeColors.secondaryText }}>Resend ({resendTimerAddEmail}s)</AppText>
                  ) : (
                    <TouchableOpacity onPress={handleSendOtpMobile} disabled={isLoading}>
                      <AppText weight={SEMI_BOLD} style={{ color: themeColors.button, fontSize: 13 }}>Send OTP</AppText>
                    </TouchableOpacity>
                  )}
                </View>
                <Button
                  children="Continue"
                  onPress={handleVerifyIdentity}
                  loading={showButtonLoading}
                  containerStyle={styles.btn}
                  disabled={isLoading || mobileOtp.length !== CODE_LENGTH}
                />
              </>
            )}

            {step === 3 && (
              <>
                <AppText type={FOURTEEN} weight={BOLD} style={{ color: themeColors.text }}>Add Email Address</AppText>
                <AppText type={THIRTEEN} style={{ color: themeColors.secondaryText, marginTop: 4 }}>Step 3: Enter your email address</AppText>
                <Input
                  title="Email Address"
                  value={newEmail}
                  onChangeText={setNewEmail}
                  placeholder="Enter your email address"
                  mainContainer={{ marginTop: 24 }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <Button
                  children="Continue"
                  onPress={handleNextToEmailOtp}
                  containerStyle={styles.btn}
                  disabled={!newEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())}
                />
              </>
            )}

            {step === 4 && (
              <>
                <AppText type={FOURTEEN} weight={BOLD} style={{ color: themeColors.text }}>Add Email Address</AppText>
                <AppText type={THIRTEEN} style={{ color: themeColors.secondaryText, marginTop: 4 }}>Step 4: Verify your email address</AppText>
                <AppText type={THIRTEEN} style={{ color: themeColors.text, marginTop: 16 }}>
                  Click "Send OTP" to receive a code on <AppText weight={SEMI_BOLD}>{newEmail}</AppText>
                </AppText>
                <View style={{ marginTop: 20 }}>
                  <OtpInput6Digit
                    label="Email Verification Code"
                    value={newEmailOtp}
                    onChangeText={setNewEmailOtp}
                    isDark={isDark}
                  />
                </View>
                <View style={styles.resendRow}>
                  {resendTimerNewEmail > 0 ? (
                    <AppText type={THIRTEEN} style={{ color: themeColors.secondaryText }}>Resend ({resendTimerNewEmail}s)</AppText>
                  ) : (
                    <TouchableOpacity onPress={handleSendOtpNewEmail} disabled={isLoading}>
                      <AppText weight={SEMI_BOLD} style={{ color: themeColors.button, fontSize: 13 }}>Send OTP</AppText>
                    </TouchableOpacity>
                  )}
                </View>
                <Button
                  children="Add Email Address"
                  onPress={handleComplete}
                  loading={showButtonLoading}
                  containerStyle={styles.btn}
                  disabled={isLoading || newEmailOtp.length !== CODE_LENGTH}
                />
              </>
            )}
          </View>
        </ScrollView>
        {step === 0 && (
          <View style={styles.bottomBtnWrap}>
            <Button
              children="Add Email Address"
              onPress={() => setStep(firstStep)}
              containerStyle={styles.bottomBtn}
            />
          </View>
        )}
      </KeyboardAvoidingView>
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
  btn: { marginTop: 30 },
  resendRow: { marginTop: 12, alignItems: 'flex-end' },
});
