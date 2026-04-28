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
  SEMI_BOLD,
  FOURTEEN,
  TEN,
  TWELVE,
  MEDIUM,
  FIFTEEN,
  SIXTEEN,
} from '../../shared';
import { colors } from '../../theme/colors';
import FastImage from 'react-native-fast-image';
import TouchableOpacityView from '../../shared/components/TouchableOpacityView';
import { back_ic, SHARE_NEW_ICON, eye_open_icon, eye_close_icon } from '../../helper/ImageAssets';
import {
  sendSecurityOtp,
  changePassword,
  getPasskeyList,
  verifySecurityPasskey,
} from '../../actions/accountActions';
import { showError } from '../../helper/logger';
import { VerificationOptionsSheet } from '../../shared/components/VerificationOptionsSheet';
import { SpinnerSecond } from '../../shared/components/SpinnerSecond';

const maskEmail = (email: string) => {
  if (!email) return '';
  const [username, domain] = email.split('@');
  if (!domain) return email;
  return `${(username || '').substring(0, 3)}***${(username || '').slice(-10)}@${domain}`;
};

const maskPhone = (phone: string | number) => {
  if (!phone) return '';
  const cleaned = String(phone).replace(/\s/g, '');
  if (cleaned.length < 4) return phone;
  return '****' + cleaned.slice(-4);
};

const ChangePassword = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const userData = useAppSelector((state: any) => state.auth.userData);
  const isLoading = useAppSelector((state: any) => state.auth.isLoading);
  const theme = useAppSelector((state: any) => state.auth.theme);

  const emailId = userData?.emailId ?? userData?.email_id ?? '';
  const profileMobile = userData?.mobileNumber ?? userData?.mobile_number ?? '';
  const profileCountryCode = userData?.country_code ?? userData?.countryCode ?? '';
  const mobileNumber = profileCountryCode && profileMobile ? `${profileCountryCode} ${profileMobile}`.trim() : profileMobile || '';

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [verifyMethod, setVerifyMethod] = useState('');
  const [availableMethods, setAvailableMethods] = useState<any[]>([]);
  const [optionsSheetVisible, setOptionsSheetVisible] = useState(false);
  const optionsSheetRef = useRef<any>(null);

  const isDark = theme === 'Dark';
  const textPrimary = isDark ? colors.white : colors.black;
  const textSecondary = isDark ? 'rgba(255,255,255,0.6)' : '#666';

  // Available methods setup
  useEffect(() => {
    const methods: any[] = [];
    if (userData?.hasPasskey) methods.push({ value: 'passkey', label: 'Passkey', description: 'Use fingerprint or Face ID' });
    if ((userData?.['2fa'] ?? 0) === 2) methods.push({ value: 'totp', label: 'Google Authenticator', description: 'Use your authenticator app' });
    if (emailId) methods.push({ value: 'email', label: 'Email OTP', description: `Send code to ${maskEmail(emailId)}` });
    if (profileMobile) methods.push({ value: 'mobile', label: 'Mobile OTP', description: `Send code to ${maskPhone(mobileNumber)}` });
    setAvailableMethods(methods);

    if (!verifyMethod && methods.length > 0) {
      // Priority: Passkey > TOTP > Email > Mobile
      if (userData?.hasPasskey) setVerifyMethod('passkey');
      else if ((userData?.['2fa'] ?? 0) === 2) setVerifyMethod('totp');
      else if (emailId) setVerifyMethod('email');
      else if (profileMobile) setVerifyMethod('mobile');
    }
  }, [userData, emailId, profileMobile, mobileNumber]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleSendOtp = async () => {
    const target = verifyMethod === 'email' ? 'email' : 'mobile';
    const ok = await dispatch(sendSecurityOtp(target, 'forgot_password')); // Using forgot_password as per web logic
    if (ok) setResendTimer(60);
  };

  const getRequirementStatus = (password: string) => {
    if (!password) return { length: false, complex: false, spaces: false };
    return {
      length: password.length >= 8 && password.length <= 30,
      complex: /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password),
      spaces: !/\s/.test(password),
    };
  };

  const requirements = getRequirementStatus(newPassword);

  const handleSubmit = async () => {
    if (verifyMethod !== 'totp' && verifyMethod !== 'passkey' && !otp) {
      showError('Please enter verification code');
      return;
    }
    if (!requirements.length || !requirements.complex || !requirements.spaces) {
      showError('Please meet all password requirements');
      return;
    }
    if (newPassword !== confirmPassword) {
      showError('Passwords do not match');
      return;
    }

    const verifyMethodId = verifyMethod === 'email' ? 1 : (verifyMethod === 'totp' ? 2 : 3);

    const payload = {
      email_or_phone: verifyMethod === 'email' ? emailId : mobileNumber,
      new_password: newPassword,
      confirm_password: confirmPassword,
      verification_code: otp,
      verify_method: verifyMethodId,
    };

    const success = await dispatch(changePassword(payload));
    if (success) {
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setResendTimer(0);
    }
  };

  const handleOptionsSelect = (value: string) => {
    setVerifyMethod(value);
    setOtp('');
    setResendTimer(0);
    setOptionsSheetVisible(false);
  };

  const getVerifyTitle = () => {
    if (verifyMethod === 'totp') return 'Enter Google Authenticator Code';
    if (verifyMethod === 'email') return 'Enter Email Verification Code';
    if (verifyMethod === 'mobile') return 'Enter Mobile Verification Code';
    return 'Security Verification';
  };

  const getVerifyDesc = () => {
    if (verifyMethod === 'totp') return 'Enter the 6-digit code from your authenticator app';
    if (verifyMethod === 'email') return `We'll send a verification code to ${maskEmail(emailId)}`;
    if (verifyMethod === 'mobile') return `We'll send a verification code to ${maskPhone(mobileNumber)}`;
    return '';
  };

  return (
    <AppSafeAreaView style={{ flex: 1, backgroundColor: colors.newThemeColor }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <FastImage source={back_ic} style={styles.backIcon} tintColor={colors.white} resizeMode="contain" />
          </TouchableOpacity>
          <AppText weight={SEMI_BOLD} type={SIXTEEN} color={colors.white} style={{ right: 10 }}>Change Password</AppText>
          <View></View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <AppText weight={SEMI_BOLD} type={FOURTEEN} color={colors.white} style={styles.sectionTitle}>
            {getVerifyTitle()}
          </AppText>
          <AppText type={TEN} color={textSecondary} style={styles.sectionDesc}>
            {getVerifyDesc()}
          </AppText>

          {verifyMethod !== 'passkey' && (
            <Input
              title="Enter 6-digit Code"
              value={otp}
              onChangeText={setOtp}
              placeholder="Enter code here..."
              keyboardType="number-pad"
              maxLength={6}
              isOtp={true}
              otpText={resendTimer > 0 ? `Resend (${resendTimer}s)` : 'Get OTP'}
              onSendOtp={handleSendOtp}
              mainContainer={{ marginTop: 10 }}
            />
          )}

          {availableMethods.length > 1 && (
            <TouchableOpacityView onPress={() => {
              optionsSheetRef.current?.open();
            }} style={styles.switchWrap}>
              <AppText type={TWELVE} color={colors.buttonBg} style={{ fontWeight: '500' }}>Switch to Another Verification Option</AppText>
              <FastImage source={SHARE_NEW_ICON}
                style={{ width: 14, height: 14, marginLeft: 5 }}
                resizeMode="contain" tintColor={colors.buttonBg} />
            </TouchableOpacityView>
          )}

          <Input
            title="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Enter new password"
            secureTextEntry={!showNewPassword}
            isSecure={true}
            onFocus={() => { }}
            onPressVisible={() => setShowNewPassword(!showNewPassword)}
            mainContainer={{ marginTop: 10 }}
          />

          <View style={styles.requirementsBox}>
            <View style={styles.reqRow}>
              <View style={[styles.dot, { backgroundColor: requirements.length ? colors.green : '#ff4d4d' }]} />
              <AppText type={TEN} color={requirements.length ? colors.green : '#ff4d4d'}>8-30 characters</AppText>
            </View>
            <View style={styles.reqRow}>
              <View style={[styles.dot, { backgroundColor: requirements.complex ? colors.green : '#ff4d4d' }]} />
              <AppText type={TEN} color={requirements.complex ? colors.green : '#ff4d4d'}>At least one uppercase, lowercase, and number.</AppText>
            </View>
            <View style={styles.reqRow}>
              <View style={[styles.dot, { backgroundColor: requirements.spaces ? colors.green : '#ff4d4d' }]} />
              <AppText type={TEN} color={requirements.spaces ? colors.green : '#ff4d4d'}>Does not contain any spaces.</AppText>
            </View>
          </View>

          <Input
            title="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
            secureTextEntry={!showConfirmPassword}
            isSecure={true}
            onPressVisible={() => setShowConfirmPassword(!showConfirmPassword)}
          />

          <Button
            children="Submit"
            onPress={handleSubmit}
            loading={isLoading}
            containerStyle={styles.submitBtn}
            titleStyle={{ color: colors.black, fontWeight: '700' }}
            disabled={!otp && verifyMethod !== 'totp' && verifyMethod !== 'passkey'}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <VerificationOptionsSheet
        sheetRef={optionsSheetRef}
        options={availableMethods}
        onSelect={handleOptionsSelect}
        borderClr={isDark ? colors.dividerColor : colors.secondBorder}
      />
      <SpinnerSecond />
    </AppSafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
    justifyContent: "space-between",
  },
  backBtn: { padding: 4 },
  backIcon: { width: 20, height: 20, resizeMode: "contain" },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 18, marginBottom: 5 },
  sectionDesc: { marginBottom: 20, opacity: 0.8 },
  switchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -10,
    marginBottom: 5,
  },
  requirementsBox: {
    marginBottom: 12,
    marginTop: -8,
  },
  reqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 10,
  },
  submitBtn: {
    marginTop: 20,
    backgroundColor: '#dbdbdb',
    borderRadius: 30,
    height: 55,
  },
});

export default ChangePassword;
