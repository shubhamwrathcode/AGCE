import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
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
  THIRTEEN,
  BOLD,
} from '../../shared';
import { colors } from '../../theme/colors';
import FastImage from 'react-native-fast-image';
import TouchableOpacityView from '../../shared/components/TouchableOpacityView';
import { back_ic, SHARE_NEW_ICON, eye_open_icon, eye_close_icon, checkIc, closeIcon, minus } from '../../helper/ImageAssets';
import {
  sendSecurityOtp,
  securityChangePasswordAction,
} from '../../actions/accountActions';
import { FORGOT_PASSWORD_SCREEN, RESET_PASSWORD_FROM_CHANGE } from '../../navigation/routes';
import { showError } from '../../helper/logger';
import { VerificationOptionsSheet } from '../../shared/components/VerificationOptionsSheet';
import { SpinnerSecond } from '../../shared/components/SpinnerSecond';
import { validatePasswordStrict } from '../../helper/utility';

const RuleItem = ({ state, label, doneColor }) => {
  const isOk = state === "ok";
  const isBad = state === "bad";
  const isPending = state === "pending";
  return (
    <View style={styles.ruleRow}>
      <View
        style={[
          styles.ruleDot,
          {
            borderColor: isOk ? null : "#B8BDC7",
            backgroundColor: isOk ? doneColor : "transparent",
          },
        ]}
      >
        {isOk ? (
          <FastImage source={checkIc} style={{ width: 8, height: 8 }} tintColor="#FFFFFF" resizeMode="contain" />
        ) : null}
        {isBad ? <FastImage source={closeIcon} style={{ width: 7, height: 7 }} tintColor={colors.red} resizeMode="contain" /> : null}
        {isPending ? <FastImage source={minus} style={{ width: 12, height: 12 }} resizeMode="contain" /> : null}
      </View>
      <AppText type={THIRTEEN} style={{ color: "#9AA3AF" }}>
        {label}
      </AppText>
    </View>
  );
};

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
  const route = useRoute<any>();
  const dispatch = useAppDispatch();
  const userData = useAppSelector((state: any) => state.auth.userData);
  const isLoading = useAppSelector((state: any) => state.auth.isLoading);
  const theme = useAppSelector((state: any) => state.auth.theme);

  const emailId = userData?.emailId ?? userData?.email_id ?? '';
  const profileMobile = userData?.mobileNumber ?? userData?.mobile_number ?? '';
  const profileCountryCode = userData?.country_code ?? userData?.countryCode ?? '';
  const mobileNumber = profileCountryCode && profileMobile ? `${profileCountryCode} ${profileMobile}`.trim() : profileMobile || '';
  const usernamePart = useMemo(() => {
    const id = String(emailId || profileMobile || "");
    return id.includes("@") ? id.split("@")[0] : id;
  }, [emailId, profileMobile]);

  const [otp, setOtp] = useState('');
  // Set default dots for oldPassword as requested (similar to web saved state)
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [verifyMethod, setVerifyMethod] = useState('');
  const [availableMethods, setAvailableMethods] = useState<any[]>([]);
  const optionsSheetRef = useRef<any>(null);

  const isDark = theme === 'Dark';
  const textSecondary = isDark ? 'rgba(255,255,255,0.6)' : '#666';

  useEffect(() => {
    const methods: any[] = [];
    if (userData?.hasPasskey) methods.push({ value: 'passkey', label: 'Passkey', description: 'Use fingerprint or Face ID' });
    if ((userData?.['2fa'] ?? 0) === 2) methods.push({ value: 'totp', label: 'Google Authenticator', description: 'Use your authenticator app' });
    if (emailId) methods.push({ value: 'email', label: 'Email OTP', description: `Send code to ${maskEmail(emailId)}` });
    if (profileMobile) methods.push({ value: 'mobile', label: 'Mobile OTP', description: `Send code to ${maskPhone(mobileNumber)}` });
    setAvailableMethods(methods);

    const initialMethod = route?.params?.verifyMethod;
    const isVerified = route?.params?.verified;
    const prefilledOtp = route?.params?.otpCode;

    if (initialMethod && methods.find(m => m.value === initialMethod)) {
      setVerifyMethod(initialMethod);
      if (isVerified && prefilledOtp) {
        setOtp(prefilledOtp);
      } else if (route?.params?.autoSent) {
        setResendTimer(60);
      }
    } else if (!verifyMethod && methods.length > 0) {
      if (userData?.hasPasskey) setVerifyMethod('passkey');
      else if ((userData?.['2fa'] ?? 0) === 2) setVerifyMethod('totp');
      else if (emailId) setVerifyMethod('email');
      else if (profileMobile) setVerifyMethod('mobile');
    }
  }, [userData, emailId, profileMobile, mobileNumber, route?.params]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleSendOtp = async () => {
    const target = verifyMethod === 'email' ? 'email' : 'mobile';
    const ok = await dispatch(sendSecurityOtp(target, 'change_password'));
    if (ok) setResendTimer(60);
  };

  const signupPasswordRules = useMemo(
    () => [
      {
        id: "notAllNumbers",
        label: "Cannot be all numbers",
        passes: (p) => p.length > 0 && !/^\d+$/.test(p),
      },
      {
        id: "notAllLetters",
        label: "Cannot be all letters (case-sensitive)",
        passes: (p) => p.length > 0 && !/^[a-zA-Z]+$/.test(p),
      },
      {
        id: "minLength",
        label: "Minimum 8 characters required",
        passes: (p) => p.length >= 8,
      },
      {
        id: "notContainsUsername",
        label: "Cannot contain username",
        passes: (p) => !usernamePart || usernamePart.length < 2 || !p.toLowerCase().includes(usernamePart.toLowerCase()),
      },
      {
        id: "complexity",
        label: "Uppercase, lowercase, number, and a special character (#?!@$%^&*-)",
        passes: (p) => validatePasswordStrict(p),
      },
    ],
    [usernamePart]
  );

  const passwordRuleRowStates = useMemo(() => {
    const p = String(newPassword || "");
    if (!p.trim()) return signupPasswordRules.map(() => "idle");
    const results = signupPasswordRules.map((r) => r.passes(p));
    const firstFail = results.findIndex((ok) => !ok);
    if (firstFail === -1) return signupPasswordRules.map(() => "ok");
    return signupPasswordRules.map((_, i) => {
      if (i < firstFail) return "ok";
      if (i === firstFail) return "bad";
      return "pending";
    });
  }, [newPassword, signupPasswordRules]);

  const isReady = useMemo(() => {
    const p = String(newPassword || "");
    if (!p.trim()) return false;
    return signupPasswordRules.every((r) => r.passes(p));
  }, [newPassword, signupPasswordRules]);

  const handleSubmit = async () => {
    if (verifyMethod !== 'totp' && verifyMethod !== 'passkey' && !otp && !route?.params?.verified) {
      showError('Please enter verification code');
      return;
    }
    if (!oldPassword) {
      showError('Please enter your old password');
      return;
    }
    if (!isReady) {
      showError('Please meet all password requirements');
      return;
    }
    if (newPassword !== confirmPassword) {
      showError('Passwords do not match');
      return;
    }

    const payload = {
      oldPassword: oldPassword,
      newPassword: newPassword,
      confirmNewPassword: confirmPassword,
    };

    const success = await dispatch(securityChangePasswordAction(payload));
    if (success) {
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setResendTimer(0);
      navigation.goBack();
    }
  };

  const handleOptionsSelect = (value: string) => {
    setVerifyMethod(value);
    setOtp('');
    setResendTimer(0);
    setOptionsSheetVisible(false);
  };

  const getVerifyTitle = () => {
    if (verifyMethod === 'totp') return 'Authenticator App';
    if (verifyMethod === 'email') return 'Email Verification';
    if (verifyMethod === 'mobile') return 'Mobile Verification';
    return 'Security Verification';
  };

  const getVerifyDesc = () => {
    if (verifyMethod === 'totp') return 'Enter the 6-digit code from your authenticator app';
    if (verifyMethod === 'email') return `We'll send a verification code to ${maskEmail(emailId)}`;
    if (verifyMethod === 'mobile') return `We'll send a verification code to ${maskPhone(mobileNumber)}`;
    return '';
  };

  return (
    <AppSafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <FastImage source={back_ic} style={styles.backIcon} tintColor={colors.black} resizeMode="contain" />
          </TouchableOpacity>
          <AppText weight={SEMI_BOLD} type={SIXTEEN} color={colors.black} style={{ right: 10 }}>Change Login Password</AppText>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Verification Section */}
          {!route?.params?.verified && (
            <View style={{ marginBottom: 10 }}>
              <AppText weight={SEMI_BOLD} type={FOURTEEN} color={colors.black} style={styles.sectionTitle}>
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
            </View>
          )}

          <AppText color={colors.black} type={FOURTEEN} weight={SEMI_BOLD} style={{ marginTop: 10 }}>Old Password</AppText>
          <Input
            placeholder="Enter your Old Password"
            value={oldPassword}
            onChangeText={setOldPassword}
            secureTextEntry={!showOldPassword}
            isSecure
            onPressVisible={() => setShowOldPassword(!showOldPassword)}
            autoCapitalize="none"
            containerStyle={styles.passwordInput}
          />

          <AppText color={colors.black} type={FOURTEEN} weight={SEMI_BOLD} style={{ marginTop: 20 }}>New Password</AppText>
          <Input
            placeholder="Enter your New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showNewPassword}
            isSecure
            onPressVisible={() => setShowNewPassword(!showNewPassword)}
            autoCapitalize="none"
            containerStyle={styles.passwordInput}
          />

          <View style={styles.rulesBox}>
            {signupPasswordRules.map((rule, idx) => (
              <RuleItem
                key={rule.id}
                state={passwordRuleRowStates[idx]}
                label={rule.label}
                doneColor={colors.buttonBg}
              />
            ))}
          </View>

          <AppText color={colors.black} type={FOURTEEN} weight={SEMI_BOLD} style={{ marginTop: 20 }}>Confirm Password</AppText>
          <Input
            placeholder="Re-Enter your New Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            isSecure
            onPressVisible={() => setShowConfirmPassword(!showConfirmPassword)}
            autoCapitalize="none"
            containerStyle={styles.passwordInput}
          />

          <Button
            children="Confirm"
            onPress={handleSubmit}
            loading={isLoading}
            containerStyle={styles.submitBtn}
            titleStyle={{ color: colors.white, fontWeight: '700' }}
            disabled={(!otp && verifyMethod !== 'totp' && verifyMethod !== 'passkey' && !route?.params?.verified) || !oldPassword || !newPassword || !confirmPassword}
          />

          <TouchableOpacity
            onPress={() => navigation.navigate(RESET_PASSWORD_FROM_CHANGE)}
            style={styles.forgotBtn}
          >
            <AppText weight={MEDIUM} type={FOURTEEN} style={{ color: colors.buttonBg, textDecorationLine: 'underline' }}>Forgot password?</AppText>
          </TouchableOpacity>
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
  scrollContent: { padding: 24, paddingBottom: 60 },
  sectionTitle: { fontSize: 18, marginBottom: 5 },
  sectionDesc: { marginBottom: 20, opacity: 0.8 },
  switchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -10,
    marginBottom: 5,
  },
  passwordInput: {
    marginTop: 8,
  },
  rulesBox: {
    marginTop: 12,
    gap: 8,
  },
  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ruleDot: {
    width: 15,
    height: 15,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  submitBtn: {
    marginTop: 30,
    backgroundColor: colors.buttonBg,
    borderRadius: 30,
    height: 52,
  },
  forgotBtn: {
    marginTop: 24,
    alignItems: 'center',
  },
});

export default ChangePassword;
