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
  OtpInput6Digit,
  BOLD,
  FOURTEEN,
  THIRTEEN,
  SEMI_BOLD,
} from '../../shared';
import FastImage from 'react-native-fast-image';
import { back_ic, copyIcon, GOOGLE_VERIFY } from '../../helper/ImageAssets';
import TouchableOpacityView from '../../shared/components/TouchableOpacityView';
import {
  sendSecurityOtp,
  verifySecurityOtp,
  generateTwoFactorQr,
} from '../../actions/accountActions';
import { setTwoFaData } from '../../slices/homeSlice';
import { showSuccess, showError } from '../../helper/logger';
import { VERIFY_AUTHENTICATOR_CODE_SCREEN } from '../../navigation/routes';
import Clipboard from '@react-native-community/clipboard';
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

const SetupTwoFactorScreen = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { colors: themeColors, isDark } = useTheme();
  const userData = useAppSelector((state) => state.auth.userData);
  const isLoading = useAppSelector((state) => state.auth.isLoading);
  const showButtonLoading = useAppSelector((state) => state.auth.isLoading && state.auth.loadingFor !== 'otp');
  const twoFaQrData = useAppSelector((state) => state.home.twoFaQrData);

  const emailId = userData?.emailId ?? userData?.email_id ?? '';
  const profileMobile = userData?.mobileNumber ?? userData?.mobile_number ?? '';
  const profileCountryCode = userData?.country_code ?? userData?.countryCode ?? '';
  const mobileNumber = profileCountryCode && profileMobile ? `${profileCountryCode} ${profileMobile}`.trim() : profileMobile || '';
  const hasEmail = !!emailId;

  const [step, setStep] = useState(0);
  const [otpCode, setOtpCode] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  useEffect(() => {
    return () => {
      dispatch(setTwoFaData(undefined));
    };
  }, [dispatch]);

  const handleSendOtp = async () => {
    const target = hasEmail ? 'email' : 'mobile';
    const ok = await dispatch(sendSecurityOtp(target, '2fa_setup'));
    if (ok) setResendTimer(60);
  };

  const handleVerifyAndContinue = async () => {
    if (!otpCode || otpCode.length !== CODE_LENGTH) {
      showError('Please enter a valid 6-digit OTP');
      return;
    }
    const target = hasEmail ? 'email' : 'mobile';
    const verified = await dispatch(verifySecurityOtp(target, otpCode, '2fa_setup'));
    if (verified) {
      showSuccess('Verified! Generating QR code...');
      setOtpCode('');
      const ok = await dispatch(generateTwoFactorQr());
      if (ok) setStep(2);
    }
  };

  const copyQrSecretCode = () => {
    const code = twoFaQrData?.secret?.base32;
    if (code) {
      Clipboard.setString(code);
      showSuccess('Code copied to clipboard!');
    }
  };

  const handleContinueToVerify = () => {
    navigation.navigate(VERIFY_AUTHENTICATOR_CODE_SCREEN);
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
              else if (step === 2) {
                dispatch(setTwoFaData(undefined));
                setStep(0);
              } else setStep(0);
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
                <AppText type={FOURTEEN} weight={BOLD} style={{ color: themeColors.text, marginHorizontal: 5 }}>Enable Google Authenticator</AppText>
                <View style={styles.imageWrap}>
                  <FastImage source={GOOGLE_VERIFY} style={styles.emailImage} resizeMode="contain" />
                </View>
                <AppText type={THIRTEEN} style={{ color: themeColors.secondaryText, textAlign: 'center' }}>
                  Add an extra layer of security by linking your account with Google Authenticator.
                </AppText>
              </>
            )}

            {step === 1 && (
              <>
                <AppText type={FOURTEEN} weight={BOLD} style={{ color: themeColors.text, marginHorizontal: 5 }}>Enable Google Authenticator</AppText>
                <AppText type={THIRTEEN} style={{ color: themeColors.secondaryText, marginTop: 4, marginHorizontal: 5 }}>
                  Step 1: Verify your {hasEmail ? 'email' : 'mobile'} first for security
                </AppText>
                <AppText type={THIRTEEN} style={{ color: themeColors.text, marginTop: 16, marginHorizontal: 5 }}>
                  Click "Send OTP" to receive a verification code on{' '}
                  <AppText weight={SEMI_BOLD}>{hasEmail ? maskEmail(emailId) : maskPhone(mobileNumber)}</AppText>
                </AppText>
                <View style={{ marginTop: 24, marginHorizontal: 5 }}>
                  <OtpInput6Digit
                    label="Enter verification code"
                    value={otpCode}
                    onChangeText={setOtpCode}
                    isDark={isDark}
                  />
                </View>
                <View style={styles.resendRow}>
                  {resendTimer > 0 ? (
                    <AppText type={THIRTEEN} style={{ color: themeColors.secondaryText }}>Resend ({resendTimer}s)</AppText>
                  ) : (
                    <TouchableOpacity onPress={handleSendOtp} disabled={isLoading}>
                      <AppText weight={SEMI_BOLD} style={{ color: themeColors.button, fontSize: 13 }}>Get OTP</AppText>
                    </TouchableOpacity>
                  )}
                </View>
                <Button
                  children="Verify & Continue"
                  onPress={handleVerifyAndContinue}
                  loading={showButtonLoading}
                  containerStyle={styles.btn}
                  disabled={isLoading || otpCode.length !== CODE_LENGTH}
                />
              </>
            )}

            {step === 2 && (
              <>
                <AppText type={FOURTEEN} weight={BOLD} style={{ color: themeColors.text, marginHorizontal: 5 }}>Scan QR Code</AppText>
                <AppText type={THIRTEEN} style={{ color: themeColors.secondaryText, marginTop: 4, marginHorizontal: 5 }}>
                  Step 2: Scan with Google Authenticator app
                </AppText>
                {twoFaQrData?.qr_code ? (
                  <View style={styles.qrCodeContainer}>
                    <FastImage source={{ uri: twoFaQrData.qr_code }} resizeMode="contain" style={styles.qrImage} />
                  </View>
                ) : null}
                <AppText type={THIRTEEN} style={{ color: themeColors.secondaryText, marginTop: 12 }}>
                  Scan this QR code with Google Authenticator
                </AppText>

                <AppText type={THIRTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text, marginTop: 24 }}>Or enter this code manually:</AppText>
                <View style={[styles.qrAddressRow, { borderColor: themeColors.border, backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)" }]}>
                  <AppText ellipsizeMode="middle" numberOfLines={1} style={[styles.qrAddressText, { color: themeColors.text }]}>
                    {twoFaQrData?.secret?.base32 || 'Loading...'}
                  </AppText>
                  <TouchableOpacityView onPress={copyQrSecretCode} style={styles.qrCopyWrap} disabled={!twoFaQrData?.secret?.base32}>
                    <FastImage source={copyIcon} resizeMode="contain" tintColor={themeColors.text} style={styles.qrCopyIcon} />
                  </TouchableOpacityView>
                </View>

                <AppText type={THIRTEEN} style={{ color: themeColors.secondaryText, marginTop: 16 }}>
                  After scanning, tap Continue to enter the 6-digit code on the next screen.
                </AppText>
                <Button
                  children="Continue"
                  onPress={handleContinueToVerify}
                  containerStyle={styles.btn}
                />
              </>
            )}
          </View>
        </ScrollView>
        {step === 0 && (
          <View style={styles.bottomBtnWrap}>
            <Button
              children="Enable Google Authenticator"
              onPress={() => setStep(1)}
              containerStyle={styles.bottomBtn}
            />
          </View>
        )}
      </KeyboardAvoidingView>
      <SpinnerSecond />
    </AppSafeAreaView>
  );
};

export default SetupTwoFactorScreen;

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
  qrCodeContainer: { marginVertical: 20, alignItems: 'center' },
  qrImage: { height: 200, width: 200 },
  qrAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 8,
  },
  qrAddressText: { flex: 1, fontSize: 13 },
  qrCopyWrap: { padding: 8, marginLeft: 8 },
  qrCopyIcon: { width: 18, height: 18 },
});
