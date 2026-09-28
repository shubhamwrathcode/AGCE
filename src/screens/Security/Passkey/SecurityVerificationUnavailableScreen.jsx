import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  BackHandler,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../../hooks/useTheme';
import {
  AppSafeAreaView,
  AppText,
  EIGHTEEN,
  SEMI_BOLD,
  FOURTEEN,
  MEDIUM,
  SIXTEEN,
  TWELVE,
} from '../../../shared';
import { Button } from '../../../common/Button';
import FastImage from 'react-native-fast-image';
import { ShieldCheck } from 'lucide-react-native';
import {
  back_ic,
  googleAuthenticator,
  PHONE,
  EMAIL,
  passkey_login,
  security_vector2,
  succescelebrate,
  closeIcon,
  right_ic,
  security_vector_light2,
} from '../../../helper/ImageAssets';
import { colors } from '../../../theme/colors';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import * as routes from '../../../navigation/routes';
import { appOperation } from '../../../appOperation';
import { showError, showSuccess } from '../../../helper/logger';
import { getPasskeyAuthCredential, getUserProfile } from '../../../actions/accountActions';

const EMPTY_METHOD_FLAGS = { email: false, phone: false, authApp: false, passkeys: false };
const METHOD_KEYS = Object.keys(EMPTY_METHOD_FLAGS);
const PASSKEY_MODAL_DISMISS_MS = 350;

function remainingFlags(enabled, unavailable) {
  return {
    authApp: !!(enabled.authApp && !unavailable.authApp),
    email: !!(enabled.email && !unavailable.email),
    phone: !!(enabled.phone && !unavailable.phone),
    passkeys: !!(enabled.passkeys && !unavailable.passkeys),
  };
}

function selectedBackendMethodsFrom(unavailable, enabled) {
  const methods = [];
  if (unavailable.email && enabled.email) methods.push('email');
  if (unavailable.phone && enabled.phone) methods.push('mobile');
  if (unavailable.authApp && enabled.authApp) methods.push('totp');
  if (unavailable.passkeys && enabled.passkeys) methods.push('passkey');
  return methods;
}

function flagsFromBackendMethods(methods) {
  const list = Array.isArray(methods) ? methods : [];
  return {
    email: list.includes('email'),
    phone: list.includes('mobile'),
    authApp: list.includes('totp'),
    passkeys: list.includes('passkey'),
  };
}

function unwrapProgress(result) {
  const nested = result?.data?.data;
  if (nested && Array.isArray(nested.required_methods)) return nested;
  if (result?.data && Array.isArray(result.data.required_methods)) return result.data;
  return result?.data || {};
}

function maskEmailForDisplay(raw) {
  if (!raw || typeof raw !== 'string') return 'you***@email.com';
  const at = raw.indexOf('@');
  if (at <= 0) return '***';
  const local = raw.slice(0, at);
  const domain = raw.slice(at + 1);
  const visible = Math.min(3, local.length);
  return `${local.slice(0, visible)}***@${domain}`;
}

function maskPhoneDigits(digits) {
  const d = String(digits || '').replace(/\D/g, '');
  if (d.length < 4) return 'your phone';
  return `***${d.slice(-4)}`;
}

const sanitizeCode = (v) => String(v || '').replace(/\D/g, '').slice(0, 6);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function SecurityVerificationUnavailableScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useAppDispatch();
  const { colors: themeColors, isDark } = useTheme();
  const userData = useAppSelector((state) => state.auth.userData);

  const preselectMethods = route.params?.preselectMethods;
  const preselectKey = Array.isArray(preselectMethods) ? preselectMethods.join(',') : '';
  const preselectAppliedRef = useRef(false);

  const accountEmail = String(userData?.emailId || userData?.email || '').trim();
  const accountPhoneDigits = String(
    userData?.mobileNumber || userData?.mobile_number || userData?.phone || '',
  ).replace(/\D/g, '');
  const maskedEmail = useMemo(() => maskEmailForDisplay(accountEmail), [accountEmail]);
  const maskedPhone = useMemo(() => maskPhoneDigits(accountPhoneDigits), [accountPhoneDigits]);

  // select | confirm | requirements | success
  const [step, setStep] = useState('select');
  const [methodsLoading, setMethodsLoading] = useState(true);
  const [enabledSecurityMethods, setEnabledSecurityMethods] = useState({ ...EMPTY_METHOD_FLAGS });
  const [secUnavailable, setSecUnavailable] = useState({ ...EMPTY_METHOD_FLAGS });
  const [requiredMethods, setRequiredMethods] = useState([]);
  const [resetToken, setResetToken] = useState('');
  const [startBusy, setStartBusy] = useState(false);
  const [secResetAck, setSecResetAck] = useState(true);
  const [resetBusy, setResetBusy] = useState(false);
  const [secReqDone, setSecReqDone] = useState({ ...EMPTY_METHOD_FLAGS });

  // Proof modal: null | 'passkeys' | 'authApp' | 'email' | 'phone'
  const [proofKind, setProofKind] = useState(null);
  const [proofCode, setProofCode] = useState('');
  const [proofBusy, setProofBusy] = useState(false);
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [resendLeft, setResendLeft] = useState({ email: 0, mobile: 0 });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setMethodsLoading(true);
      const result = await appOperation.customer.get_security_methods_list().catch((e) => e);
      if (cancelled) return;
      const raw =
        result?.data?.security_methods ||
        result?.data?.data?.security_methods ||
        result?.security_methods ||
        result?.data?.securityMethods ||
        {};
      const nextEnabled = {
        email: !!raw.email,
        phone: !!(raw.phone ?? raw.mobile ?? raw.sms),
        authApp: !!raw.totp,
        passkeys: !!raw.passkey,
      };
      setEnabledSecurityMethods(nextEnabled);
      if (!preselectAppliedRef.current && Array.isArray(preselectMethods) && preselectMethods.length) {
        preselectAppliedRef.current = true;
        setSecUnavailable((prev) => ({
          ...prev,
          email: preselectMethods.includes('email') ? nextEnabled.email : prev.email,
          phone: preselectMethods.includes('phone') ? nextEnabled.phone : prev.phone,
          authApp: preselectMethods.includes('authApp') ? nextEnabled.authApp : prev.authApp,
          passkeys: preselectMethods.includes('passkeys') ? nextEnabled.passkeys : prev.passkeys,
        }));
      }
      setMethodsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectKey]);

  useEffect(() => {
    if (!resendLeft.email && !resendLeft.mobile) return undefined;
    const t = setTimeout(() => {
      setResendLeft((p) => ({ email: Math.max(0, p.email - 1), mobile: Math.max(0, p.mobile - 1) }));
    }, 1000);
    return () => clearTimeout(t);
  }, [resendLeft]);

  const methodRows = useMemo(() => {
    const rows = [];
    if (enabledSecurityMethods.email) {
      rows.push({ key: 'email', title: 'Email', subtitle: accountEmail ? maskedEmail : 'No email on file', icon: EMAIL });
    }
    if (enabledSecurityMethods.phone) {
      rows.push({ key: 'phone', title: 'Phone Number', subtitle: accountPhoneDigits ? maskedPhone : 'No phone on file', icon: PHONE });
    }
    if (enabledSecurityMethods.authApp) {
      rows.push({ key: 'authApp', title: 'Authenticator App', subtitle: '', icon: googleAuthenticator });
    }
    if (enabledSecurityMethods.passkeys) {
      rows.push({ key: 'passkeys', title: 'Passkeys', subtitle: '', icon: passkey_login });
    }
    return rows;
  }, [accountEmail, accountPhoneDigits, enabledSecurityMethods, maskedEmail, maskedPhone]);

  const selectedCount = useMemo(
    () => METHOD_KEYS.filter((key) => secUnavailable[key] && enabledSecurityMethods[key]).length,
    [enabledSecurityMethods, secUnavailable],
  );

  const remainingVerify = useMemo(() => {
    if (Array.isArray(requiredMethods) && requiredMethods.length) {
      return flagsFromBackendMethods(requiredMethods);
    }
    return remainingFlags(enabledSecurityMethods, secUnavailable);
  }, [enabledSecurityMethods, requiredMethods, secUnavailable]);

  const remainingProofDone =
    !!resetToken &&
    (!remainingVerify.authApp || secReqDone.authApp) &&
    (!remainingVerify.email || secReqDone.email) &&
    (!remainingVerify.phone || secReqDone.phone) &&
    (!remainingVerify.passkeys || secReqDone.passkeys);

  const reqTotal = METHOD_KEYS.filter((k) => remainingVerify[k]).length;
  const reqCompleted = METHOD_KEYS.filter((k) => remainingVerify[k] && secReqDone[k]).length;

  const selectedBackendMethods = useCallback(
    () => selectedBackendMethodsFrom(secUnavailable, enabledSecurityMethods),
    [enabledSecurityMethods, secUnavailable],
  );

  const applyProgress = useCallback((result) => {
    const progress = unwrapProgress(result);
    const required = Array.isArray(progress.required_methods) ? progress.required_methods : [];
    const verified = Array.isArray(progress.verified_methods) ? progress.verified_methods : [];
    setRequiredMethods(required);
    setSecReqDone(flagsFromBackendMethods(verified));
    if (progress.resetToken) {
      setResetToken(String(progress.resetToken));
    } else if (progress.complete !== true) {
      setResetToken('');
    }
    return progress;
  }, []);

  const closeProof = useCallback(() => {
    setProofKind(null);
    setProofCode('');
  }, []);

  const openProof = useCallback((kind) => {
    setProofCode('');
    setProofKind(kind);
  }, []);

  const goSecurityHome = useCallback(() => {
    navigation.navigate(routes.ACCOUNT_SCREEN);
  }, [navigation]);

  const markPasskeyUnavailable = useCallback(() => {
    closeProof();
    setSecUnavailable((prev) => ({ ...prev, passkeys: true }));
    setSecReqDone({ ...EMPTY_METHOD_FLAGS });
    setRequiredMethods([]);
    setResetToken('');
    setStep('select');
  }, [closeProof]);

  const startUnavailableResetSession = useCallback(async () => {
    const methods = selectedBackendMethods();
    if (!methods.length) {
      showError('Select at least one unavailable security method.');
      return;
    }
    if (!secResetAck) {
      showError('Confirm the security freeze before continuing.');
      return;
    }
    setStartBusy(true);
    try {
      const result = await appOperation.customer
        .start_unavailable_security_reset({ methods, freeze_acknowledged: true })
        .catch((e) => e);
      if (!result?.success) {
        showError(result?.message || 'Failed to start security verification.');
        return;
      }
      setResetToken('');
      setSecReqDone({ ...EMPTY_METHOD_FLAGS });
      applyProgress(result);
      setStep('requirements');
    } finally {
      setStartBusy(false);
    }
  }, [applyProgress, secResetAck, selectedBackendMethods]);

  const submitUnavailableReset = useCallback(async () => {
    const methods = selectedBackendMethods();
    if (!methods.length) {
      showError('Select at least one unavailable security method.');
      return;
    }
    if (!secResetAck) {
      showError('Confirm the security freeze before continuing.');
      return;
    }
    if (!resetToken) {
      showError('Verify all remaining security methods before continuing.');
      return;
    }
    setResetBusy(true);
    try {
      const result = await appOperation.customer
        .reset_unavailable_security_methods({ methods, freeze_acknowledged: true, resetToken })
        .catch((e) => e);
      if (!result?.success) {
        showError(result?.message || 'Failed to reset security methods.');
        return;
      }
      dispatch(getUserProfile(false, false, true));
      showSuccess(result?.message || 'Selected security methods were disabled.');
      closeProof();
      setResetToken('');
      setStep('success');
    } finally {
      setResetBusy(false);
    }
  }, [closeProof, dispatch, resetToken, secResetAck, selectedBackendMethods]);

  const verifyPasskeyProof = useCallback(async () => {
    if (passkeyBusy) return;
    setPasskeyBusy(true);
    try {
      // The native passkey prompt cannot present over an open RN Modal on iOS.
      setProofKind(null);
      await wait(PASSKEY_MODAL_DISMISS_MS);
      const credential = await dispatch(getPasskeyAuthCredential('', false));
      if (!credential) return;
      const result = await appOperation.customer
        .verify_all_security_methods({ purpose: 'unavailable_reset', type: 'passkey', credential })
        .catch((e) => e);
      if (!result?.success) {
        showError(result?.message || 'Passkey verification failed');
        return;
      }
      applyProgress(result);
      showSuccess('Passkey verified');
    } finally {
      setPasskeyBusy(false);
    }
  }, [applyProgress, dispatch, passkeyBusy]);

  const verifyCodeProof = useCallback(async () => {
    const type = proofKind === 'authApp' ? 'totp' : proofKind === 'phone' ? 'mobile' : 'email';
    const code = sanitizeCode(proofCode);
    if (code.length !== 6) {
      showError(type === 'totp' ? 'Enter the 6-digit authenticator code.' : 'Enter the 6-digit verification code.');
      return;
    }
    setProofBusy(true);
    try {
      const result = await appOperation.customer
        .verify_all_security_methods({ purpose: 'unavailable_reset', type, code })
        .catch((e) => e);
      if (!result?.success) {
        showError(result?.message || (type === 'totp' ? 'Invalid authenticator code' : 'Invalid OTP'));
        return;
      }
      applyProgress(result);
      closeProof();
    } finally {
      setProofBusy(false);
    }
  }, [applyProgress, closeProof, proofCode, proofKind]);

  const sendChannelOtp = useCallback(async (channel) => {
    if (otpSending || resendLeft[channel] > 0) return;
    setOtpSending(true);
    try {
      const result = await appOperation.customer.send_otp_for_email_or_mobile(channel).catch((e) => e);
      if (result?.success) {
        showSuccess(result?.message || 'Verification code sent');
        setResendLeft((p) => ({ ...p, [channel]: 60 }));
        return;
      }
      showError(result?.message || 'Failed to send verification code');
    } finally {
      setOtpSending(false);
    }
  }, [otpSending, resendLeft]);

  const pasteProofCode = useCallback(async () => {
    try {
      const Clipboard = require('@react-native-clipboard/clipboard').default;
      const text = await Clipboard.getString();
      if (text) setProofCode(sanitizeCode(text));
    } catch {
      // clipboard unavailable
    }
  }, []);

  const handleBack = useCallback(() => {
    if (proofKind) {
      closeProof();
      return true;
    }
    if (step === 'confirm') {
      setStep('select');
      return true;
    }
    if (step === 'requirements') {
      setStep('confirm');
      return true;
    }
    if (step === 'success') {
      goSecurityHome();
      return true;
    }
    navigation.goBack();
    return true;
  }, [closeProof, goSecurityHome, navigation, proofKind, step]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', handleBack);
    return () => sub.remove();
  }, [handleBack]);

  const screenBg = themeColors.background;
  const cardBg = themeColors.card;
  const borderCol = themeColors.border;
  const textColor = themeColors.text;
  const subTextColor = themeColors.secondaryText;
  const iconBadgeBg = themeColors.themeSelection;
  const inputBg = themeColors.input;
  const accent = isDark ? colors.orangeTheme : colors.buttonBg;
  const onAccent = isDark ? colors.black : colors.white;

  const renderPrimary = (label, onPress, { disabled = false, busy = false, style } = {}) => (
    <Button
      children={label}
      onPress={onPress}
      disabled={disabled}
      loading={busy}
      containerStyle={style}
    />
  );

  const renderCheckbox = (checked, style) => (
    <View
      style={[
        styles.checkbox,
        { borderColor: checked ? accent : subTextColor },
        checked && { backgroundColor: accent },
        style,
      ]}
    >
      {checked && <AppText style={[styles.checkmark, { color: onAccent }]}>✓</AppText>}
    </View>
  );

  const requirementRows = [
    remainingVerify.passkeys && {
      key: 'passkeys',
      title: 'Passkeys',
      desc: 'Verify with biometrics or security keys',
      icon: passkey_login,
    },
    remainingVerify.authApp && { key: 'authApp', title: 'Authenticator App', icon: googleAuthenticator },
    remainingVerify.phone && { key: 'phone', title: 'Phone Number', icon: PHONE },
    remainingVerify.email && { key: 'email', title: 'Email', icon: EMAIL },
  ].filter(Boolean);

  const renderProofFooter = () => (
    <View style={styles.protectedFooter}>
      <ShieldCheck size={14} color={subTextColor} strokeWidth={2} style={styles.protectedIcon} />
      <AppText type={TWELVE} style={{ color: subTextColor }}>
        Protected by Balance Risk
      </AppText>
    </View>
  );

  const renderCodeProof = () => {
    const isTotp = proofKind === 'authApp';
    const channel = proofKind === 'phone' ? 'mobile' : 'email';
    const title = isTotp
      ? 'Authenticator App Verification'
      : proofKind === 'phone'
        ? 'Security Verification Requirements'
        : 'Email Verification';
    const subtitle = isTotp
      ? 'Enter the 6-digit code generated by the Authenticator App.'
      : proofKind === 'phone'
        ? `Enter the 6-digit verification code sent to ${accountPhoneDigits ? maskedPhone : 'your phone'}.`
        : `Enter the 6-digit code Verification code sent to ${accountEmail ? maskedEmail : 'your email'}`;
    const label = isTotp ? 'Authenticator App' : proofKind === 'phone' ? 'Phone Verification Code' : 'Email Verification Code';
    const left = resendLeft[channel];
    const code = sanitizeCode(proofCode);

    return (
      <>
        <AppText type={SIXTEEN} weight={SEMI_BOLD} style={[styles.sheetTitle, { color: textColor }]}>
          {title}
        </AppText>
        <AppText type={TWELVE} weight={MEDIUM} style={[styles.sheetSubtitle, { color: subTextColor }]}>
          {subtitle}
        </AppText>
        <AppText type={TWELVE} weight={MEDIUM} style={[styles.inputLabel, { color: textColor }]}>
          {label}
        </AppText>
        <View style={[styles.inputRow, { backgroundColor: inputBg, borderColor: borderCol }]}>
          <TextInput
            value={proofCode}
            onChangeText={(v) => setProofCode(sanitizeCode(v))}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            maxLength={6}
            style={[styles.input, { color: textColor }]}
            placeholderTextColor={subTextColor}
          />
          {isTotp ? (
            <TouchableOpacity onPress={pasteProofCode} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: colors.orangeTheme }}>
                Paste
              </AppText>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => sendChannelOtp(channel)}
              disabled={otpSending || left > 0}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <AppText
                type={TWELVE}
                weight={SEMI_BOLD}
                style={{ color: otpSending || left > 0 ? subTextColor : colors.orangeTheme }}
              >
                {otpSending ? 'Sending…' : left > 0 ? `Resend in ${left}s` : 'Get Code'}
              </AppText>
            </TouchableOpacity>
          )}
        </View>
        {renderPrimary('Submit', verifyCodeProof, {
          disabled: code.length !== 6,
          busy: proofBusy,
          style: { marginTop: 20 },
        })}
        {renderProofFooter()}
      </>
    );
  };

  const renderPasskeyProof = () => (
    <>
      <AppText type={SIXTEEN} weight={SEMI_BOLD} style={[styles.sheetTitle, { color: textColor }]}>
        Verify with passkey
      </AppText>
      <View style={styles.passkeyHero}>
        <FastImage
          source={passkey_login}
          tintColor={textColor}
          style={styles.passkeyHeroImg}
          resizeMode="contain"
        />
      </View>
      <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: textColor, textAlign: 'center' }}>
        Complete verification using your passkey
      </AppText>
      <AppText type={TWELVE} weight={MEDIUM} style={[styles.sheetSubtitle, { color: subTextColor, textAlign: 'center', marginTop: 6 }]}>
        Please follow the instructions on your device to complete verification.
      </AppText>
      {renderPrimary('Verify', verifyPasskeyProof, { busy: passkeyBusy, style: { marginTop: 8 } })}
      <TouchableOpacity style={styles.linkBtn} onPress={markPasskeyUnavailable}>
        <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: colors.orangeTheme }}>
          My Passkeys Are Not Available
        </AppText>
      </TouchableOpacity>
      {renderProofFooter()}
    </>
  );

  return (
    <AppSafeAreaView style={[styles.container, { backgroundColor: screenBg }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <FastImage
            source={back_ic}
            resizeMode="contain"
            tintColor={textColor}
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <AppText type={EIGHTEEN} weight={SEMI_BOLD} style={[styles.headerTitle, { color: textColor }]}>
          Reset Security
        </AppText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {step === 'select' && (
          <View style={styles.stepContainer}>
            <AppText type={SIXTEEN} weight={SEMI_BOLD} style={[styles.title, { color: textColor }]}>
              Select Unavailable Methods
            </AppText>
            <AppText type={TWELVE} weight={MEDIUM} style={[styles.subtitle, { color: subTextColor }]}>
              Please select all security methods you can no longer access and want to reset.
            </AppText>

            <View style={styles.listContainer}>
              {methodsLoading ? (
                <View style={styles.loaderBox}>
                  <ActivityIndicator color={accent} />
                </View>
              ) : methodRows.length === 0 ? (
                <View style={[styles.itemCard, { backgroundColor: cardBg, borderColor: borderCol, opacity: 0.7 }]}>
                  <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: textColor }}>
                    No active security methods found
                  </AppText>
                </View>
              ) : (
                methodRows.map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    activeOpacity={0.8}
                    style={[styles.itemCard, { backgroundColor: cardBg, borderColor: borderCol }]}
                    onPress={() => setSecUnavailable((p) => ({ ...p, [item.key]: !p[item.key] }))}
                  >
                    <View style={styles.itemInfo}>
                      <View style={[styles.iconBadge, { backgroundColor: iconBadgeBg }]}>
                        <FastImage
                          source={item.icon}
                          tintColor={textColor}
                          style={styles.badgeImg}
                          resizeMode="contain"
                        />
                      </View>
                      <View style={styles.itemDetails}>
                        <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: textColor }}>
                          {item.title}
                        </AppText>
                        {!!item.subtitle && (
                          <AppText type={TWELVE} style={{ color: subTextColor, marginTop: 1 }}>
                            {item.subtitle}
                          </AppText>
                        )}
                      </View>
                    </View>
                    {renderCheckbox(!!secUnavailable[item.key])}
                  </TouchableOpacity>
                ))
              )}
            </View>

            {renderPrimary('Confirm Reset', () => setStep('confirm'), {
              disabled: selectedCount === 0 || methodRows.length === 0,
            })}

            <TouchableOpacity style={styles.linkBtn} onPress={() => navigation.navigate('Support')}>
              <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: colors.orangeTheme }}>
                How does this work?
              </AppText>
            </TouchableOpacity>
          </View>
        )}

        {step === 'confirm' && (
          <View style={styles.stepContainer}>
            <View style={styles.warningIllustrationContainer}>
              <FastImage source={isDark? security_vector_light2:security_vector2} style={styles.illustrationSmall} resizeMode="contain" />
            </View>

            <AppText type={SIXTEEN} weight={SEMI_BOLD} style={[styles.title, { color: textColor, textAlign: 'center' }]}>
              Are you sure you want to reset your Security Methods?
            </AppText>

            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.ackCard, { backgroundColor: cardBg, borderColor: borderCol }]}
              onPress={() => setSecResetAck((v) => !v)}
            >
              {renderCheckbox(secResetAck, { marginRight: 10, marginTop: 1 })}
              <AppText type={TWELVE} weight={MEDIUM} style={{ color: textColor, flex: 1, lineHeight: 18 }}>
                In order to protect your account, withdrawals, P2P selling, and payment services may be disabled for 48 to 72
                hours after you make this change
              </AppText>
            </TouchableOpacity>

            <View style={styles.actionRow}>
              <Button
                children="Cancel"
                onPress={() => setStep('select')}
                containerStyle={[styles.ghostBtn, { borderColor: borderCol, flex: 1, marginRight: 10 }]}
                titleStyle={{ color: textColor }}
              />
              {renderPrimary(startBusy ? 'Continuing…' : 'Confirm', startUnavailableResetSession, {
                disabled: !secResetAck,
                busy: startBusy,
                style: { flex: 1 },
              })}
            </View>
          </View>
        )}

        {step === 'requirements' && (
          <View style={styles.stepContainer}>
            <AppText type={SIXTEEN} weight={SEMI_BOLD} style={[styles.title, { color: textColor }]}>
              Security Verification Requirements
            </AppText>
            <AppText type={TWELVE} weight={MEDIUM} style={[styles.subtitle, { color: subTextColor }]}>
              Complete remaining enabled methods to continue.
            </AppText>

            <View style={[styles.progressCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
              <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: accent }}>
                {reqCompleted} / {reqTotal}
              </AppText>
              <View style={[styles.progressBarBg, { backgroundColor: borderCol }]}>
                <View style={[styles.progressBarFill, { backgroundColor: accent, width: `${reqTotal ? (reqCompleted / reqTotal) * 100 : 0}%` }]} />
              </View>
            </View>

            <View style={styles.listContainer}>
              {requirementRows.map((row) => (
                <TouchableOpacity
                  key={row.key}
                  activeOpacity={0.8}
                  disabled={!!secReqDone[row.key]}
                  style={[styles.reqCard, { backgroundColor: cardBg, borderColor: borderCol }]}
                  onPress={() => openProof(row.key)}
                >
                  <View style={styles.reqLeft}>
                    <View style={[styles.iconBadge, { backgroundColor: iconBadgeBg }]}>
                      <FastImage
                        source={row.icon}
                        tintColor={textColor}
                        style={styles.badgeImg}
                        resizeMode="contain"
                      />
                    </View>
                    <View style={styles.itemDetails}>
                      <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: textColor }}>
                        {row.title}
                      </AppText>
                      {!!row.desc && (
                        <AppText type={TWELVE} style={{ color: subTextColor, marginTop: 1 }}>
                          {row.desc}
                        </AppText>
                      )}
                    </View>
                  </View>
                  {secReqDone[row.key] ? (
                    <AppText style={styles.reqCheckGreen}>✓</AppText>
                  ) : (
                    <FastImage source={right_ic} tintColor={subTextColor} style={styles.arrowIcon} resizeMode="contain" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {renderPrimary(resetBusy ? 'Submitting…' : 'Continue', submitUnavailableReset, {
              disabled: !remainingProofDone,
              busy: resetBusy,
            })}

            {remainingVerify.passkeys && !secReqDone.passkeys ? (
              <TouchableOpacity style={styles.linkBtn} onPress={() => openProof('passkeys')}>
                <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: colors.orangeTheme }}>
                  Verify with Passkey
                </AppText>
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        {step === 'success' && (
          <View style={[styles.stepContainer, { alignItems: 'center', marginTop: 24 }]}>
            <View style={styles.successRing}>
              <FastImage source={succescelebrate} style={styles.illustrationSuccess} resizeMode="contain" />
            </View>
            <AppText type={SIXTEEN} weight={SEMI_BOLD} style={[styles.title, { color: textColor, textAlign: 'center', marginTop: 16 }]}>
              Security Methods Reset Successfully
            </AppText>
            <AppText type={TWELVE} weight={MEDIUM} style={[styles.subtitle, { color: subTextColor, textAlign: 'center' }]}>
              The methods you marked unavailable were disabled. Authenticator and other remaining methods stay on for login.
              Withdrawals and P2P are frozen for 72 hours.
            </AppText>
            {renderPrimary('OK', goSecurityHome, { style: { alignSelf: 'stretch', marginTop: 24 } })}
          </View>
        )}
      </ScrollView>

      <Modal visible={!!proofKind} transparent animationType="fade" onRequestClose={closeProof} statusBarTranslucent>
        <KeyboardAvoidingView style={styles.modalRoot} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeProof} />
          <View style={[styles.sheet, { backgroundColor: screenBg, borderColor: borderCol }]}>
            <TouchableOpacity style={styles.sheetClose} onPress={closeProof} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <FastImage source={closeIcon} tintColor={textColor} style={styles.sheetCloseIcon} resizeMode="contain" />
            </TouchableOpacity>
            {proofKind === 'passkeys' ? renderPasskeyProof() : proofKind ? renderCodeProof() : null}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </AppSafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    height: Platform.OS === 'ios' ? 44 : 56,
  },
  backButton: {
    padding: 6,
    marginLeft: -4,
  },
  backIcon: {
    width: 18,
    height: 18,
  },
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: -1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  stepContainer: {
    flex: 1,
    marginTop: 12,
  },
  title: {
    marginBottom: 6,
  },
  subtitle: {
    lineHeight: 18,
    marginBottom: 16,
  },
  listContainer: {
    marginBottom: 20,
  },
  loaderBox: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  badgeImg: {
    width: 20,
    height: 20,
  },
  itemDetails: {
    flex: 1,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  ghostBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },
  linkBtn: {
    alignSelf: 'center',
    paddingVertical: 14,
  },
  warningIllustrationContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  illustrationSmall: {
    width: 100,
    height: 100,
  },
  ackCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
    marginBottom: 24,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  progressBarBg: {
    height: 5,
    borderRadius: 2.5,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.orangeTheme,
    borderRadius: 2.5,
  },
  reqCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  reqLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reqCheckGreen: {
    color: '#34C759',
    fontWeight: 'bold',
    fontSize: 16,
  },
  arrowIcon: {
    width: 14,
    height: 14,
  },
  successRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationSuccess: {
    width: 72,
    height: 72,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  sheetClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 2,
  },
  sheetCloseIcon: {
    width: 14,
    height: 14,
  },
  sheetTitle: {
    marginBottom: 6,
    paddingRight: 28,
  },
  sheetSubtitle: {
    lineHeight: 18,
    marginBottom: 16,
  },
  inputLabel: {
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    fontSize: 16,
    letterSpacing: 2,
    paddingVertical: 0,
  },
  passkeyHero: {
    alignItems: 'center',
    marginVertical: 18,
  },
  passkeyHeroImg: {
    width: 72,
    height: 72,
  },
  protectedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  protectedIcon: {
    width: 14,
    height: 14,
    marginRight: 6,
  },
});
