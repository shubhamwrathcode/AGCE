import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Pressable,
  ActivityIndicator,
  Keyboard,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from "../../../hooks/useTheme";
import { useAppSelector } from "../../../store/hooks";
import {
  AppSafeAreaView,
  AppText,
  BOLD,
  EIGHTEEN,
  SIXTEEN,
  MEDIUM,
  SEMI_BOLD,
  FOURTEEN,
  TWELVE,
  THIRTEEN,
} from '../../../shared';
import ToggleSwitch from '../../../common/ToggleSwitch';
import FastImage from 'react-native-fast-image';
import { back_ic, eye_open_icon, eye_close_icon, pasteImg, checkIc } from '../../../helper/ImageAssets';
import * as routes from '../../../navigation/routes';
import { appOperation } from '../../../appOperation';
import Toast from "react-native-simple-toast";
import RBSheet from 'react-native-raw-bottom-sheet';

const getClipboardText = async () => {
  try {
    let text = '';
    try {
      const Clipboard = require('@react-native-clipboard/clipboard').default;
      text = await Clipboard.getString();
    } catch {
      try {
        const Clipboard = require('@react-native-community/clipboard').default;
        text = await Clipboard.getString();
      } catch {
        const { Clipboard } = require('react-native');
        text = await Clipboard.getString();
      }
    }
    return text;
  } catch (e) {
    return '';
  }
};

const WithdrawalSettingsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors: themeColors, isDark } = useTheme();
  const userData = useAppSelector((state) => state.auth.userData);

  // Settings states
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [emailVerify, setEmailVerify] = useState(false);
  const [smsVerify, setSmsVerify] = useState(false);
  const [googleVerify, setGoogleVerify] = useState(false);
  const [fundPassword, setFundPassword] = useState(false);
  const [trustedAddresses, setTrustedAddresses] = useState(false);

  // Bottom Sheet state
  const sheetRef = useRef(null);
  const otpInputRef = useRef(null);
  const [sheetType, setSheetType] = useState(null); // 'email' | 'mobile' | 'google_authenticator' | 'fund_password' | 'unbound_phone' | 'unbound_ga' | 'missing_fund_password' | 'missing_trusted_addresses'
  const [verificationCode, setVerificationCode] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [isBusy, setIsBusy] = useState(false);
  const [sheetError, setSheetError] = useState('');
  const [pendingToggle, setPendingToggle] = useState(null); // { method, enable, type }

  // Theme-aware styles
  const bgColor = isDark ? '#121214' : '#F8F9FA';
  const cardBg = isDark ? '#1E1E22' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#1C1C1E';
  const subTextColor = isDark ? '#8A8A93' : '#8E8E93';
  const borderColor = isDark ? '#2D2D32' : '#E5E5EA';
  const primaryColor = themeColors.button || '#F0B90B';

  const fetchSettings = async () => {
    try {
      setLoadingSettings(true);
      const res = await appOperation.customer.fetch_withdrawal_security_settings();
      if (res?.success) {
        const s = res.data?.settings;
        if (s) {
          setEmailVerify(!!s.methods?.email?.enabled);
          setSmsVerify(!!s.methods?.mobile?.enabled);
          setGoogleVerify(!!s.methods?.google_authenticator?.enabled);
          setFundPassword(!!s.methods?.fund_password?.enabled);
          setTrustedAddresses(!!s.trusted_addresses_only || !!s.trusted_addresses || !!s.methods?.trusted_addresses?.enabled || !!s.trustedAddresses);
        }
      }
    } catch (e) {
      // silent fallback
    } finally {
      setLoadingSettings(false);
    }
  };

  const executeToggleAction = async (pendingToggle, codes) => {
    try {
      setLoadingSettings(true);
      
      let code = '';
      if (pendingToggle.method === 'email') {
        code = codes.emailOtp;
      } else if (pendingToggle.method === 'mobile') {
        code = codes.smsOtp;
      } else if (pendingToggle.method === 'google_authenticator') {
        code = codes.tofaCode;
      }

      if (!code) {
        Toast.showWithGravity("Verification code is missing.", Toast.SHORT, Toast.BOTTOM);
        setLoadingSettings(false);
        return;
      }

      const payload = {
        method: pendingToggle.method,
        enable: pendingToggle.enable,
        code: code,
      };

      const res = await appOperation.customer.verify_and_toggle_withdrawal_setting(payload);
      
      if (res?.success) {
        if (pendingToggle.type === 'emailVerify') setEmailVerify(pendingToggle.enable);
        else if (pendingToggle.type === 'smsVerify') setSmsVerify(pendingToggle.enable);
        else if (pendingToggle.type === 'googleVerify') setGoogleVerify(pendingToggle.enable);

        Toast.showWithGravity(res.message || "Setting updated successfully.", Toast.SHORT, Toast.BOTTOM);
        fetchSettings();
      } else {
        Toast.showWithGravity(res?.message || "Verification failed. Please try again.", Toast.LONG, Toast.BOTTOM);
      }
    } catch (err) {
      Toast.showWithGravity("Something went wrong. Please try again later.", Toast.LONG, Toast.BOTTOM);
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    if (route.params?.pendingAction) {
      const { pendingAction, emailOtp, smsOtp, tofaCode } = route.params;
      
      // Clear the params so they don't run again on subsequent focus
      navigation.setParams({
        pendingAction: null,
        emailOtp: null,
        smsOtp: null,
        tofaCode: null,
      });

      // Call execution directly
      executeToggleAction(pendingAction, { emailOtp, smsOtp, tofaCode });
    }
  }, [route.params]);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const sendOtp = async (method) => {
    try {
      setIsBusy(true);
      setSheetError('');
      const res = await appOperation.customer.withdrawal_verification_otp({ method });
      setIsBusy(false);
      if (res?.success) {
        setResendTimer(60);
        Toast.showWithGravity(res.message || "Verification code sent.", Toast.SHORT, Toast.BOTTOM);
      } else {
        setSheetError(res?.message || "Failed to send verification code.");
      }
    } catch (error) {
      setIsBusy(false);
      setSheetError("Failed to send verification code. Please try again.");
    }
  };

  const handleToggleSwitch = async (type, enable) => {
    // Core-method enforcement: at least one of email / mobile / google_authenticator must remain enabled
    if (!enable && ['emailVerify', 'smsVerify', 'googleVerify'].includes(type)) {
      const activeMethods = [
        type !== 'emailVerify' && emailVerify,
        type !== 'smsVerify' && smsVerify,
        type !== 'googleVerify' && googleVerify
      ].filter(Boolean).length;

      if (activeMethods === 0) {
        Toast.showWithGravity(
          "At least one of email, mobile, or Google Authenticator must remain enabled for withdrawals.",
          Toast.LONG,
          Toast.BOTTOM
        );
        return;
      }
    }

    const backendMethod = 
      type === 'emailVerify' ? 'email' :
      type === 'smsVerify' ? 'mobile' :
      type === 'googleVerify' ? 'google_authenticator' :
      type === 'fundPassword' ? 'fund_password' : '';

    if (type === 'smsVerify' && enable) {
      const isPhoneBound = !!(userData?.mobileNumber || userData?.mobile_number);
      if (!isPhoneBound) {
        setSheetType('unbound_phone');
        sheetRef.current?.open();
        return;
      }
    }

    if (type === 'googleVerify' && enable) {
      const hasGA = Number(userData?.['2fa'] || 0) === 2 || userData?.twoFaEnabled === true;
      if (!hasGA) {
        setSheetType('unbound_ga');
        sheetRef.current?.open();
        return;
      }
    }

    if (type === 'fundPassword') {
      const hasFP = !!(userData?.fundPassword || userData?.payPin || userData?.isFundPasswordSet);
      if (!hasFP) {
        setSheetType('missing_fund_password');
        sheetRef.current?.open();
        return;
      }
    }

    if (type === 'trustedAddresses') {
      const hasTA = !!(userData?.trustedAddresses || userData?.trusted_addresses || userData?.addressBook?.length);
      if (!hasTA) {
        setSheetType('missing_trusted_addresses');
        sheetRef.current?.open();
        return;
      }
      setTrustedAddresses(enable);
      try {
        await appOperation.customer.update_withdrawal_security_settings({ trusted_addresses_only: enable });
        Toast.showWithGravity("Setting updated successfully.", Toast.SHORT, Toast.BOTTOM);
      } catch (e) {
        // fallback
      }
      return;
    }

    if (backendMethod === 'fund_password') {
      setPendingToggle({ method: backendMethod, enable, type });
      setVerificationCode('');
      setSheetError('');
      setIsPasswordVisible(false);
      setSheetType('fund_password');
      sheetRef.current?.open();
      return;
    }

    const verifyMethods = 
      backendMethod === 'email' ? ['email'] :
      backendMethod === 'mobile' ? ['mobile'] :
      backendMethod === 'google_authenticator' ? ['totp'] : [];

    if (verifyMethods.length > 0) {
      navigation.navigate(routes.PASSKEY_SECURITY_VERIFICATION_SCREEN, {
        targetScreen: routes.WITHDRAWAL_SETTINGS_SCREEN,
        purpose: 'verify_withdrawal_setting',
        verifyMethods: verifyMethods,
        skipDirectVerification: true,
        targetParams: {
          pendingAction: { method: backendMethod, enable, type }
        }
      });
    }
  };

  const handleConfirmVerification = async () => {
    if (!pendingToggle) return;

    if (sheetType === 'fund_password') {
      if (!verificationCode.trim()) {
        setSheetError("Please enter your fund password.");
        return;
      }
    } else {
      if (verificationCode.length < 6) {
        setSheetError("Please enter a valid 6-digit verification code.");
        return;
      }
    }

    try {
      setIsBusy(true);
      setSheetError('');

      const payload = {
        method: pendingToggle.method,
        enable: pendingToggle.enable,
      };

      if (sheetType === 'fund_password') {
        payload.fund_password = verificationCode;
      } else {
        payload.code = verificationCode;
      }

      const res = await appOperation.customer.verify_and_toggle_withdrawal_setting(payload);
      setIsBusy(false);

      if (res?.success) {
        if (pendingToggle.type === 'emailVerify') setEmailVerify(pendingToggle.enable);
        else if (pendingToggle.type === 'smsVerify') setSmsVerify(pendingToggle.enable);
        else if (pendingToggle.type === 'googleVerify') setGoogleVerify(pendingToggle.enable);
        else if (pendingToggle.type === 'fundPassword') setFundPassword(pendingToggle.enable);

        Toast.showWithGravity(res.message || "Setting updated successfully.", Toast.SHORT, Toast.BOTTOM);
        sheetRef.current?.close();
        fetchSettings();
      } else {
        setSheetError(res?.message || "Verification failed. Please try again.");
      }
    } catch (err) {
      setIsBusy(false);
      setSheetError("Something went wrong. Please try again later.");
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0 || !pendingToggle) return;
    await sendOtp(pendingToggle.method);
  };

  const handlePasteCode = async () => {
    const text = await getClipboardText();
    const sanitized = String(text || '').replace(/\D/g, '').slice(0, 6);
    if (sanitized) {
      setVerificationCode(sanitized);
      Toast.showWithGravity("Pasted from clipboard", Toast.SHORT, Toast.BOTTOM);
    } else {
      Toast.showWithGravity("No valid 6-digit code found in clipboard", Toast.SHORT, Toast.BOTTOM);
    }
  };

  const renderOtpBoxes = () => {
    const boxes = [];
    for (let i = 0; i < 6; i++) {
      const char = verificationCode[i] || '';
      const isFocused = verificationCode.length === i;
      boxes.push(
        <TouchableOpacity
          key={i}
          activeOpacity={1}
          onPress={() => otpInputRef.current?.focus()}
          style={[
            styles.otpBox,
            {
              backgroundColor: isDark ? '#222226' : '#F5F5F7',
              borderColor: isFocused ? primaryColor : (isDark ? '#3A3A40' : '#E5E5EA'),
            },
          ]}
        >
          <AppText
            type={EIGHTEEN}
            weight={SEMI_BOLD}
            style={{ color: textColor, textAlign: 'center' }}
          >
            {char}
          </AppText>
        </TouchableOpacity>
      );
    }
    return boxes;
  };

  const renderSheetContent = () => {
    if (sheetType === 'unbound_phone') {
      return (
        <View style={styles.alertContent}>
          <View style={[styles.alertIconBg, { backgroundColor: 'rgba(255,149,0,0.1)' }]}>
            <AppText type={EIGHTEEN} style={{ color: '#FF9500' }}>⚠️</AppText>
          </View>
          <AppText type={SIXTEEN} weight={SEMI_BOLD} style={[styles.alertTitle, { color: textColor }]}>
            Phone Unbound
          </AppText>
          <AppText type={FOURTEEN} style={[styles.alertDesc, { color: subTextColor }]}>
            Phone verification is available only after the phone is bound.
          </AppText>
          <TouchableOpacity
            style={[styles.sheetConfirmButton, { backgroundColor: primaryColor }]}
            activeOpacity={0.8}
            onPress={() => {
              sheetRef.current?.close();
              const hasGA = Number(userData?.['2fa'] || 0) === 2 || userData?.twoFaEnabled === true;
              const hasEmail = !!(userData?.emailId || userData?.email);
              const methods = [];
              if (hasGA) methods.push('totp');
              if (hasEmail) methods.push('email');
              if (methods.length === 0) methods.push('email');

              navigation.navigate(routes.PASSKEY_SECURITY_VERIFICATION_SCREEN, {
                targetScreen: routes.CHANGE_PHONE_NUMBER_SCREEN,
                purpose: 'change_mobile',
                verifyMethods: methods,
                skipDirectVerification: true,
              });
            }}
          >
            <AppText type={SIXTEEN} weight={BOLD} style={{ color: '#FFFFFF' }}>
              Bind Now
            </AppText>
          </TouchableOpacity>
        </View>
      );
    }

    if (sheetType === 'unbound_ga') {
      return (
        <View style={styles.alertContent}>
          <View style={[styles.alertIconBg, { backgroundColor: 'rgba(0,122,255,0.1)' }]}>
            <AppText type={EIGHTEEN} style={{ color: '#007AFF' }}>🛡️</AppText>
          </View>
          <AppText type={SIXTEEN} weight={SEMI_BOLD} style={[styles.alertTitle, { color: textColor }]}>
            Bind Google Authenticator
          </AppText>
          <AppText type={FOURTEEN} style={[styles.alertDesc, { color: subTextColor }]}>
            Please bind Google Authenticator first to enable this verification method.
          </AppText>
          <TouchableOpacity
            style={[styles.sheetConfirmButton, { backgroundColor: primaryColor }]}
            activeOpacity={0.8}
            onPress={() => {
              sheetRef.current?.close();
              const hasGA = Number(userData?.['2fa'] || 0) === 2 || userData?.twoFaEnabled === true;
              const hasEmail = !!(userData?.emailId || userData?.email);
              const hasMobile = !!(userData?.mobileNumber || userData?.mobile_number);
              const methods = [];
              if (hasGA) methods.push('totp');
              if (hasEmail) methods.push('email');
              if (hasMobile) methods.push('mobile');
              if (methods.length === 0) methods.push('email');

              navigation.navigate(routes.PASSKEY_SECURITY_VERIFICATION_SCREEN, {
                targetScreen: routes.PASSKEY_SETUP_AUTHENTICATOR_SCREEN,
                purpose: '2fa_setup',
                verifyMethods: methods,
                skipDirectVerification: false,
              });
            }}
          >
            <AppText type={SIXTEEN} weight={BOLD} style={{ color: '#FFFFFF' }}>
              Bind Now
            </AppText>
          </TouchableOpacity>
        </View>
      );
    }

    if (sheetType === 'missing_fund_password') {
      return (
        <View style={styles.alertContent}>
          <View style={[styles.alertIconBg, { backgroundColor: 'rgba(255,59,48,0.1)' }]}>
            <AppText type={EIGHTEEN} style={{ color: '#FF3B30' }}>🔑</AppText>
          </View>
          <AppText type={SIXTEEN} weight={SEMI_BOLD} style={[styles.alertTitle, { color: textColor }]}>
            No Fund Password Set
          </AppText>
          <AppText type={FOURTEEN} style={[styles.alertDesc, { color: subTextColor }]}>
            You need to set the fund password first to use it for withdrawal verification.
          </AppText>
          <TouchableOpacity
            style={[styles.sheetConfirmButton, { backgroundColor: primaryColor }]}
            activeOpacity={0.8}
            onPress={() => {
              sheetRef.current?.close();
              navigation.navigate(routes.FUND_PASSWORD_MAIN_SCREEN);
            }}
          >
            <AppText type={SIXTEEN} weight={BOLD} style={{ color: '#FFFFFF' }}>
              Set Now
            </AppText>
          </TouchableOpacity>
        </View>
      );
    }

    if (sheetType === 'missing_trusted_addresses') {
      return (
        <View style={styles.alertContent}>
          <View style={[styles.alertIconBg, { backgroundColor: 'rgba(90,200,250,0.1)' }]}>
            <AppText type={EIGHTEEN} style={{ color: '#5AC8FA' }}>📍</AppText>
          </View>
          <AppText type={SIXTEEN} weight={SEMI_BOLD} style={[styles.alertTitle, { color: textColor }]}>
            No Trusted Address Set
          </AppText>
          <AppText type={FOURTEEN} style={[styles.alertDesc, { color: subTextColor }]}>
            You need to add a trusted address first to use it for withdrawal verification.
          </AppText>
          <TouchableOpacity
            style={[styles.sheetConfirmButton, { backgroundColor: primaryColor }]}
            activeOpacity={0.8}
            onPress={() => {
              sheetRef.current?.close();
              // Navigate to withdraw flow or address book
              navigation.navigate(routes.WITHDRAW_SCREEN);
            }}
          >
            <AppText type={SIXTEEN} weight={BOLD} style={{ color: '#FFFFFF' }}>
              Set Now
            </AppText>
          </TouchableOpacity>
        </View>
      );
    }

    const isOtpSheet = ['email', 'mobile', 'google_authenticator'].includes(sheetType);

    return (
      <View>
        <View style={styles.sheetHeader}>
          <AppText type={EIGHTEEN} weight={SEMI_BOLD} style={{ color: textColor }}>
            {sheetType === 'email' && 'Verify Your Email'}
            {sheetType === 'mobile' && 'Verify Your Mobile'}
            {sheetType === 'google_authenticator' && 'Verify Google Authenticator'}
            {sheetType === 'fund_password' && 'Verify Fund Password'}
          </AppText>
          <TouchableOpacity
            onPress={() => sheetRef.current?.close()}
            style={styles.closeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <AppText type={EIGHTEEN} style={{ color: subTextColor }}>✕</AppText>
          </TouchableOpacity>
        </View>

        <AppText type={FOURTEEN} weight={MEDIUM} style={[styles.sheetSubtitle, { color: subTextColor }]}>
          {sheetType === 'email' && `Enter the 6-digit verification code sent to your email ${userData?.emailId || ''}, valid for 10 minutes.`}
          {sheetType === 'mobile' && `Enter the 6-digit verification code sent to your mobile number ${userData?.mobileNumber || userData?.mobile_number || ''}.`}
          {sheetType === 'google_authenticator' && 'Enter the 6-digit verification code from your Google Authenticator app.'}
          {sheetType === 'fund_password' && 'Enter your fund password to complete withdrawal settings verification.'}
        </AppText>

        {isOtpSheet ? (
          <View style={styles.otpSection}>
            <View style={styles.otpRow}>
              {renderOtpBoxes()}
            </View>

            <TextInput
              ref={otpInputRef}
              style={styles.hiddenInput}
              value={verificationCode}
              onChangeText={(text) => {
                setVerificationCode(text.replace(/\D/g, '').slice(0, 6));
                setSheetError('');
              }}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus={true}
            />

            <View style={styles.linksRow}>
              {sheetType !== 'google_authenticator' ? (
                resendTimer > 0 ? (
                  <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: subTextColor }}>
                    Resend in {resendTimer}s
                  </AppText>
                ) : (
                  <TouchableOpacity onPress={handleResendCode} activeOpacity={0.7}>
                    <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: primaryColor }}>
                      Resend Code
                    </AppText>
                  </TouchableOpacity>
                )
              ) : <View />}

              <TouchableOpacity
                onPress={handlePasteCode}
                activeOpacity={0.7}
                style={styles.pasteContainer}
              >
                <FastImage
                  source={pasteImg}
                  style={styles.pasteIcon}
                  tintColor={textColor}
                  resizeMode="contain"
                />
                <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: textColor }}>
                  Paste
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.passwordSection}>
            <View style={[styles.inputContainer, { backgroundColor: isDark ? '#222226' : '#F2F2F7' }]}>
              <TextInput
                style={[styles.textInput, { color: textColor, flex: 1 }]}
                placeholder="Fund Password"
                placeholderTextColor={isDark ? '#6A6A75' : '#9E9EAE'}
                secureTextEntry={!isPasswordVisible}
                value={verificationCode}
                onChangeText={(val) => {
                  setVerificationCode(val);
                  setSheetError('');
                }}
              />
              <TouchableOpacity
                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                style={styles.eyeBtn}
              >
                <FastImage
                  source={isPasswordVisible ? eye_open_icon : eye_close_icon}
                  style={styles.eyeIcon}
                  tintColor={subTextColor}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.forgotLink}
              onPress={() => {
                sheetRef.current?.close();
                navigation.navigate(routes.FUND_PASSWORD_MAIN_SCREEN);
              }}
            >
              <AppText type={TWELVE} style={{ color: subTextColor, textDecorationLine: 'underline' }}>
                Forgot Password?
              </AppText>
            </TouchableOpacity>
          </View>
        )}

        {!!sheetError && (
          <AppText type={TWELVE} style={styles.errorLabel}>
            {sheetError}
          </AppText>
        )}

        <TouchableOpacity
          style={[
            styles.sheetConfirmButton,
            { backgroundColor: primaryColor },
            (!verificationCode.trim() || isBusy) && styles.disabledButton
          ]}
          activeOpacity={0.8}
          onPress={handleConfirmVerification}
          disabled={!verificationCode.trim() || isBusy}
        >
          {isBusy ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <AppText type={SIXTEEN} weight={BOLD} style={{ color: '#FFFFFF' }}>
              Confirm
            </AppText>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <AppSafeAreaView style={{ backgroundColor: 'white', flex: 1 }}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <FastImage
              source={back_ic}
              style={styles.backIcon}
              tintColor={textColor}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <AppText weight={SEMI_BOLD} type={EIGHTEEN} style={[styles.headerTitle, { color: textColor }]}>
              Withdrawal Settings
            </AppText>
          </View>
          <View style={{ width: 24 }} />
        </View>

        {loadingSettings ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={primaryColor} />
          </View>
        ) : (
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Description Card */}
            <View style={[styles.infoCard, { backgroundColor: cardBg, borderColor }]}>
              <AppText type={TWELVE} weight={MEDIUM} style={{ color: subTextColor, lineHeight: 18 }}>
                Configure multi-factor authentication preferences specifically for your withdrawals to ensure complete safety of your assets.
              </AppText>
            </View>

            {/* Email Verification Row */}
            <View style={[styles.settingRow, { backgroundColor: cardBg, borderBottomColor: borderColor }]}>
              <View style={styles.textContainer}>
                <AppText type={SIXTEEN} weight={SEMI_BOLD} style={{ color: textColor }}>
                  Email verification
                </AppText>
                <AppText type={TWELVE} style={{ color: subTextColor, marginTop: 4 }}>
                  Request verification code via email when withdrawing.
                </AppText>
              </View>
              <ToggleSwitch
                value={emailVerify}
                onValueChange={(val) => handleToggleSwitch('emailVerify', val)}
                isDark={isDark}
              />
            </View>

            {/* SMS Verification Row */}
            <View style={[styles.settingRow, { backgroundColor: cardBg, borderBottomColor: borderColor }]}>
              <View style={styles.textContainer}>
                <AppText type={SIXTEEN} weight={SEMI_BOLD} style={{ color: textColor }}>
                  SMS Verification
                </AppText>
                <AppText type={TWELVE} style={{ color: subTextColor, marginTop: 4 }}>
                  Request verification code via mobile SMS when withdrawing.
                </AppText>
              </View>
              <ToggleSwitch
                value={smsVerify}
                onValueChange={(val) => handleToggleSwitch('smsVerify', val)}
                isDark={isDark}
              />
            </View>

            {/* Google Authenticator Row */}
            <View style={[styles.settingRow, { backgroundColor: cardBg, borderBottomColor: borderColor }]}>
              <View style={styles.textContainer}>
                <AppText type={SIXTEEN} weight={SEMI_BOLD} style={{ color: textColor }}>
                  Google Authenticator
                </AppText>
                <AppText type={TWELVE} style={{ color: subTextColor, marginTop: 4 }}>
                  Request verification code via Google Authenticator app when withdrawing.
                </AppText>
              </View>
              <ToggleSwitch
                value={googleVerify}
                onValueChange={(val) => handleToggleSwitch('googleVerify', val)}
                isDark={isDark}
              />
            </View>

            {/* Fund Password Row */}
            <View style={[styles.settingRow, { backgroundColor: cardBg, borderBottomColor: borderColor }]}>
              <View style={styles.textContainer}>
                <AppText type={SIXTEEN} weight={SEMI_BOLD} style={{ color: textColor }}>
                  Fund Password
                </AppText>
                <AppText type={TWELVE} style={{ color: subTextColor, marginTop: 4 }}>
                  Require fund password verification when withdrawing.
                </AppText>
              </View>
              <ToggleSwitch
                value={fundPassword}
                onValueChange={(val) => handleToggleSwitch('fundPassword', val)}
                isDark={isDark}
              />
            </View>

            {/* Trusted Address Row */}
            <View style={[styles.settingRow, { backgroundColor: cardBg, borderBottomColor: borderColor }]}>
              <View style={styles.textContainer}>
                <AppText type={SIXTEEN} weight={SEMI_BOLD} style={{ color: textColor }}>
                  Withdrawal Whitelist
                </AppText>
                <AppText type={TWELVE} style={{ color: subTextColor, marginTop: 4 }}>
                  Only allow withdrawals to saved trusted addresses in address book.
                </AppText>
              </View>
              <ToggleSwitch
                value={trustedAddresses}
                onValueChange={(val) => handleToggleSwitch('trustedAddresses', val)}
                isDark={isDark}
              />
            </View>
          </ScrollView>
        )}

        <RBSheet
          ref={sheetRef}
          closeOnDragDown={true}
          closeOnPressMask={true}
          onClose={() => {
            setVerificationCode('');
            setSheetError('');
            Keyboard.dismiss();
          }}
          customStyles={{
            container: {
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
              paddingBottom: Platform.OS === 'ios' ? 34 : 24,
              paddingHorizontal: 20,
              paddingTop: 8,
              height: 'auto',
            },
            wrapper: { backgroundColor: 'rgba(0,0,0,0.5)' },
            draggableIcon: { backgroundColor: isDark ? '#3A3A40' : '#E5E5EA', width: 36, height: 4 },
          }}
        >
          {renderSheetContent()}
        </RBSheet>

      </KeyboardAvoidingView>
    </AppSafeAreaView>
  );
};

export default WithdrawalSettingsScreen;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 6,
  },
  backIcon: {
    width: 20,
    height: 20,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
    paddingTop: 12,
  },
  infoCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  textContainer: {
    flex: 1,
    paddingRight: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  closeBtn: {
    padding: 4,
  },
  sheetSubtitle: {
    lineHeight: 20,
    marginBottom: 24,
  },
  otpSection: {
    alignItems: 'center',
    width: '100%',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  otpBox: {
    width: 46,
    height: 52,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hiddenInput: {
    position: 'absolute',
    width: 0,
    height: 0,
    opacity: 0,
  },
  linksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 28,
  },
  pasteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pasteIcon: {
    width: 14,
    height: 14,
    marginRight: 6,
  },
  passwordSection: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  textInput: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    paddingVertical: 0,
  },
  eyeBtn: {
    padding: 4,
  },
  eyeIcon: {
    width: 20,
    height: 20,
  },
  forgotLink: {
    alignSelf: 'flex-start',
    marginBottom: 28,
  },
  errorLabel: {
    color: '#FF3B30',
    alignSelf: 'flex-start',
    marginBottom: 16,
    lineHeight: 16,
  },
  sheetConfirmButton: {
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  disabledButton: {
    opacity: 0.6,
  },
  alertContent: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  alertIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  alertDesc: {
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
    paddingHorizontal: 10,
  },
});

