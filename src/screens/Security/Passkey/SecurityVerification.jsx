import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView, Platform, TextInput, ActivityIndicator, ScrollView, KeyboardAvoidingView, Keyboard } from 'react-native';
import { AppText, BOLD, FOURTEEN, SIXTEEN, SEMI_BOLD, TWELVE, MEDIUM, TWENTY_TWO, THIRTEEN } from '../../../shared';
import { useTheme } from '../../../hooks/useTheme';
import NavigationService from '../../../navigation/NavigationService';
import FastImage from 'react-native-fast-image';
import { back_ic, pasteImg } from '../../../helper/ImageAssets';
import { colors } from '../../../theme/colors';
import * as routes from '../../../navigation/routes';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { sendSecurityOtp, verifySecurityOtp, verifySecurityTotp } from '../../../actions/accountActions';
import { logoutAction } from '../../../actions/authActions';
import { appOperation } from '../../../appOperation';
import { showError, showSuccess } from '../../../helper/logger';
import { VerificationOptionsSheet } from '../../../common/VerificationOptionsSheet';

const SecurityVerification = ({ route }) => {
  const dispatch = useAppDispatch();
  const { colors: themeColors, isDark } = useTheme();

  // Route Parameters for Reusability
  const params = route?.params || {};
  const targetScreen = params.targetScreen || routes.CHANGE_PHONE_NUMBER_SCREEN;
  const targetParams = params.targetParams || {};
  const purpose = params.purpose || 'security_verification';
  const skipDirectVerification = params.skipDirectVerification || false; // true if next screen handles final combined verification

  const userData = useAppSelector((state) => state.auth.userData);
  const emailId = userData?.emailId || userData?.email || '';
  const profileMobile = userData?.mobileNumber || userData?.mobile_number || '';
  const hasEmail = !!emailId;
  const hasMobile = !!profileMobile;
  const hasGoogleAuth = (userData?.['2fa'] || 0) === 2 || userData?.twoFaEnabled === true;

  // Dynamic Verification Methods Initialization
  const initialVerifyMethods = useMemo(() => {
    if (params.verifyMethods && params.verifyMethods.length > 0) {
      return params.verifyMethods;
    }
    // Dynamic detection based on user's active channel if none specified
    if (hasEmail) return ['email'];
    if (hasMobile) return ['mobile'];
    if (hasGoogleAuth) return ['totp'];
    return ['email'];
  }, [params.verifyMethods, hasEmail, hasMobile, hasGoogleAuth]);

  // Active methods in state so it can be changed dynamically by the user (only one active method is verified at a time)
  const [activeMethods, setActiveMethods] = useState([initialVerifyMethods[0]]);

  // Sync state when dynamic initialVerifyMethods changes on mount
  useEffect(() => {
    if (initialVerifyMethods && initialVerifyMethods.length > 0) {
      setActiveMethods([initialVerifyMethods[0]]);
    }
  }, [initialVerifyMethods]);

  // Track keyboard active state to toggle justifyContent
  const [isKeyboardActive, setIsKeyboardActive] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardActive(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardActive(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Input states
  const [smsCode, setSmsCode] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [totpCode, setTotpCode] = useState('');

  // Countdowns and loaders
  const [smsCountdown, setSmsCountdown] = useState(0);
  const [emailCountdown, setEmailCountdown] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // RBSheet reference for switching methods
  const sheetRef = useRef(null);
  const sentOtpRef = useRef(new Set());

  // Masking helpers
  const maskEmail = (email) => {
    if (!email) return '';
    const [u, d] = String(email).split('@');
    if (!d) return email;
    if (u.length <= 2) return `${u[0]}***@${d}`;
    return `${u.slice(0, 2)}***${u.slice(-1)}@${d}`;
  };

  const maskPhone = (phone) => {
    if (!phone) return '';
    const cleaned = String(phone).replace(/\s/g, '');
    if (cleaned.length < 4) return '***';
    return `${cleaned.slice(0, 3)}*****${cleaned.slice(-2)}`;
  };

  const displayEmail = maskEmail(emailId);
  const displayPhone = maskPhone(profileMobile);

  // Calculate dynamic available methods that the user has enabled (always includes all active methods)
  const availableOptions = useMemo(() => {
    const list = [];
    const allowed = params.verifyMethods || [];

    if (hasEmail && (allowed.length === 0 || allowed.includes('email'))) {
      list.push({
        value: 'email',
        label: 'Email Verification',
        description: `Verify using code sent to ${displayEmail}`,
      });
    }
    if (hasMobile && (allowed.length === 0 || allowed.includes('mobile'))) {
      list.push({
        value: 'mobile',
        label: 'Phone Verification',
        description: `Verify using code sent to ${displayPhone}`,
      });
    }
    if (hasGoogleAuth && (allowed.length === 0 || allowed.includes('totp'))) {
      list.push({
        value: 'totp',
        label: 'Google Authenticator',
        description: 'Verify using your Google Authenticator 2FA code',
      });
    }
    return list;
  }, [hasEmail, hasMobile, hasGoogleAuth, displayEmail, displayPhone, params.verifyMethods]);

  // Auto-send OTP when active methods change
  useEffect(() => {
    if (activeMethods.includes('email') && emailId) {
      const key = `email-${purpose}`;
      if (!sentOtpRef.current.has(key)) {
        sentOtpRef.current.add(key);
        void dispatch(sendSecurityOtp('email', purpose)).then((ok) => {
          if (ok) setEmailCountdown(60);
        });
      }
    }
    if (activeMethods.includes('mobile') && profileMobile) {
      const key = `mobile-${purpose}`;
      if (!sentOtpRef.current.has(key)) {
        sentOtpRef.current.add(key);
        void dispatch(sendSecurityOtp('mobile', purpose)).then((ok) => {
          if (ok) setSmsCountdown(60);
        });
      }
    }
  }, [activeMethods, emailId, profileMobile, purpose]);

  // Timers countdown
  useEffect(() => {
    if (smsCountdown <= 0) return undefined;
    const t = setTimeout(() => setSmsCountdown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [smsCountdown]);

  useEffect(() => {
    if (emailCountdown <= 0) return undefined;
    const t = setTimeout(() => setEmailCountdown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [emailCountdown]);

  // Action handlers for resending OTPs
  const handleSendEmailOtp = async () => {
    if (emailCountdown > 0) return;
    const ok = await dispatch(sendSecurityOtp('email', purpose));
    if (ok) {
      setEmailCountdown(60);
    }
  };

  const handleSendSmsOtp = async () => {
    if (smsCountdown > 0) return;
    const ok = await dispatch(sendSecurityOtp('mobile', purpose));
    if (ok) {
      setSmsCountdown(60);
    }
  };

  // Paste handlers
  const handlePasteCode = async (setter) => {
    try {
      const Clipboard = require('@react-native-clipboard/clipboard').default;
      const text = await Clipboard.getString();
      if (text) {
        setter(text.replace(/\D/g, '').slice(0, 6));
      }
    } catch (e) {
      // silent
    }
  };

  // Submit flow
  const handleConfirm = async () => {
    Keyboard.dismiss();

    // 1. Validation
    if (activeMethods.includes('email') && (!emailCode || emailCode.length !== 6)) {
      showError('Please enter the 6-digit email code');
      return;
    }
    if (activeMethods.includes('mobile') && (!smsCode || smsCode.length !== 6)) {
      showError('Please enter the 6-digit SMS code');
      return;
    }
    if (activeMethods.includes('totp') && (!totpCode || totpCode.length !== 6)) {
      showError('Please enter the 6-digit Google Authenticator code');
      return;
    }

    // 2. Direct Verification (if not skipped)
    if (!skipDirectVerification) {
      setIsSubmitting(true);
      try {
        if (purpose === 'delete_account') {
          const type = activeMethods[0];
          const submitType = type === 'mobile' ? 'phone' : type;
          const code = type === 'totp' ? totpCode : (type === 'email' ? emailCode : smsCode);

          const res = await appOperation.customer.securityClosedAccount({
            type: submitType,
            code,
          });

          if (res?.success) {
            showSuccess(res?.message || 'Account successfully closed');
            dispatch(logoutAction());
            return;
          } else {
            showError(res?.message || 'Verification failed');
            setIsSubmitting(false);
            return;
          }
        }

        if (purpose === 'disable_account') {
          const type = activeMethods[0];
          const submitType = type === 'mobile' ? 'phone' : type;
          const code = type === 'totp' ? totpCode : (type === 'email' ? emailCode : smsCode);

          const res = await appOperation.customer.securityDisableAccount({
            type: submitType,
            code,
          });

          if (res?.success) {
            showSuccess(res?.message || 'Account successfully disabled');
            dispatch(logoutAction());
            return;
          } else {
            showError(res?.message || 'Verification failed');
            setIsSubmitting(false);
            return;
          }
        }

        if (activeMethods.includes('email')) {
          const ok = await dispatch(verifySecurityOtp('email', emailCode, purpose));
          if (!ok) {
            setIsSubmitting(false);
            return;
          }
        }
        if (activeMethods.includes('mobile')) {
          const ok = await dispatch(verifySecurityOtp('mobile', smsCode, purpose));
          if (!ok) {
            setIsSubmitting(false);
            return;
          }
        }
        if (activeMethods.includes('totp')) {
          const ok = await dispatch(verifySecurityTotp(totpCode, purpose));
          if (!ok) {
            setIsSubmitting(false);
            return;
          }
        }
      } catch (err) {
        setIsSubmitting(false);
        showError('Verification failed');
        return;
      }
      setIsSubmitting(false);
    }

    // 3. Navigation to targetScreen with gathered codes
    showSuccess('Verification successful');
    NavigationService.navigate(targetScreen, {
      ...targetParams,
      emailOtp: activeMethods.includes('email') ? emailCode : undefined,
      smsOtp: activeMethods.includes('mobile') ? smsCode : undefined,
      tofaCode: activeMethods.includes('totp') ? totpCode : undefined,
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#121214' : '#FFFFFF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => NavigationService.goBack()}>
          <FastImage source={back_ic} tintColor={isDark ? '#FFFFFF' : '#000000'} style={{ width: 18, height: 18 }} resizeMode='contain' />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={[
          styles.contentContainer,
          { justifyContent: isKeyboardActive ? 'flex-start' : 'space-between' }
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topSection}>
          <AppText type={TWENTY_TWO} weight={SEMI_BOLD} style={[styles.mainTitle, { color: themeColors.text }]}>
            Security Verification
          </AppText>
          <AppText type={THIRTEEN} weight={MEDIUM} style={[styles.subtitle, { color: '#999' }]}>
            To ensure the security of your account, please complete the following verification operations.
          </AppText>

          {/* Dynamic SMS Code Group */}
          {activeMethods.includes('mobile') && (
            <View style={styles.inputGroup}>
              <AppText type={FOURTEEN} weight={MEDIUM} style={[styles.label, { color: themeColors.text }]}>
                Code sent to: {displayPhone || 'your registered phone'}
              </AppText>
              <View style={[styles.inputContainer, { backgroundColor: isDark ? '#2A2A2E' : '#F7F7F7' }]}>
                <TextInput
                  style={[styles.input, { color: themeColors.text }]}
                  placeholder="Please enter SMS Code"
                  placeholderTextColor="#999"
                  value={smsCode}
                  onChangeText={(v) => setSmsCode(v.replace(/\D/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <TouchableOpacity onPress={handleSendSmsOtp} disabled={smsCountdown > 0} style={styles.actionBtn}>
                  <AppText type={THIRTEEN} weight={MEDIUM} style={{ color: smsCountdown > 0 ? '#999' : colors.orangeTheme }}>
                    {smsCountdown > 0 ? `${smsCountdown}s` : 'Send'}
                  </AppText>
                </TouchableOpacity>
              </View>
              <View style={styles.inputFooter}>
                <AppText type={TWELVE} style={{ color: '#999' }}>Valid for 10 minutes</AppText>
                <TouchableOpacity onPress={() => handlePasteCode(setSmsCode)} style={styles.pasteWrap}>
                  <AppText type={TWELVE} weight={MEDIUM} style={{ color: themeColors.text, marginRight: 4 }}>Paste</AppText>
                  <FastImage source={pasteImg} style={{ width: 12, height: 12 }} tintColor={themeColors.text} resizeMode="contain" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Dynamic Email Code Group */}
          {activeMethods.includes('email') && (
            <View style={styles.inputGroup}>
              <AppText type={FOURTEEN} weight={MEDIUM} style={[styles.label, { color: themeColors.text }]}>
                Code sent to: {displayEmail || 'your registered email'}
              </AppText>
              <View style={[styles.inputContainer, { backgroundColor: isDark ? '#2A2A2E' : '#F7F7F7' }]}>
                <TextInput
                  style={[styles.input, { color: themeColors.text }]}
                  placeholder="Please enter Email Code"
                  placeholderTextColor="#999"
                  value={emailCode}
                  onChangeText={(v) => setEmailCode(v.replace(/\D/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                  maxLength={6}
                  cursorColor={colors.black}
                />
                <TouchableOpacity onPress={handleSendEmailOtp} disabled={emailCountdown > 0} style={styles.actionBtn}>
                  <AppText type={THIRTEEN} weight={MEDIUM} style={{ color: emailCountdown > 0 ? '#999' : colors.orangeTheme }}>
                    {emailCountdown > 0 ? `${emailCountdown}s` : 'Send'}
                  </AppText>
                </TouchableOpacity>
              </View>
              <View style={styles.inputFooter}>
                <AppText type={TWELVE} style={{ color: '#999' }}>Valid for 10 minutes</AppText>
                <TouchableOpacity onPress={() => handlePasteCode(setEmailCode)} style={styles.pasteWrap}>
                  <AppText type={TWELVE} weight={MEDIUM} style={{ color: themeColors.text, marginRight: 4 }}>Paste</AppText>
                  <FastImage source={pasteImg} style={{ width: 12, height: 12 }} tintColor={themeColors.text} resizeMode="contain" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Dynamic Google Authenticator (TOTP) Group */}
          {activeMethods.includes('totp') && (
            <View style={styles.inputGroup}>
              <AppText type={FOURTEEN} weight={MEDIUM} style={[styles.label, { color: themeColors.text }]}>
                Google Authenticator Code
              </AppText>
              <View style={[styles.inputContainer, { backgroundColor: isDark ? '#2A2A2E' : '#F7F7F7' }]}>
                <TextInput
                  style={[styles.input, { color: themeColors.text }]}
                  placeholder="Please enter 6-digit TOTP Code"
                  placeholderTextColor="#999"
                  value={totpCode}
                  onChangeText={(v) => setTotpCode(v.replace(/\D/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>
              <View style={styles.inputFooter}>
                <AppText type={TWELVE} style={{ color: '#999' }}>Enter code from Authenticator app</AppText>
                <TouchableOpacity onPress={() => handlePasteCode(setTotpCode)} style={styles.pasteWrap}>
                  <AppText type={TWELVE} weight={MEDIUM} style={{ color: themeColors.text, marginRight: 4 }}>Paste</AppText>
                  <FastImage source={pasteImg} style={{ width: 12, height: 12 }} tintColor={themeColors.text} resizeMode="contain" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: isDark ? '#FFFFFF' : '#2A2A2E' }]}
            activeOpacity={0.8}
            onPress={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size={'small'} color={isDark ? '#000' : '#FFF'} />
            ) : (
              <AppText type={SIXTEEN} weight={SEMI_BOLD} style={{ color: isDark ? '#000000' : '#FFFFFF' }}>
                Confirm
              </AppText>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkContainer} onPress={() => sheetRef.current?.open()}>
            <AppText type={FOURTEEN} weight={MEDIUM} style={[styles.linkText, { color: colors.black }]}>
              Choose other verification method
            </AppText>
          </TouchableOpacity>

          {/* <TouchableOpacity
            style={[styles.linkContainer, { marginTop: 12 }]}
            onPress={() => NavigationService.navigate(routes.SECURITY_VERIFICATION_UNAVAILABLE_SCREEN)}
          >
            <AppText type={FOURTEEN} weight={MEDIUM} style={[styles.linkText, { color: colors.orangeTheme }]}>
              Security verification unavailable?
            </AppText>
          </TouchableOpacity> */}
        </View>
      </ScrollView>


      {/* Reusable Verification Options RBSheet */}
      <VerificationOptionsSheet
        sheetRef={sheetRef}
        options={availableOptions}
        selectedValue={activeMethods[0]}
        onSelect={(val) => {
          // Switch active verification method
          setActiveMethods([val]);
          // Reset entered input fields
          setSmsCode('');
          setEmailCode('');
          setTotpCode('');
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: Platform.OS === 'ios' ? 44 : 56,
  },
  headerBtn: {
    padding: 4,
    marginLeft: -8,
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  topSection: {
    paddingTop: 10,
  },
  mainTitle: {
    marginBottom: 6,
  },
  subtitle: {
    lineHeight: 20,
    marginBottom: 22,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  actionBtn: {
    paddingLeft: 10,
    justifyContent: 'center',
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 3,
  },
  pasteWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomSection: {
    marginTop: 32,
  },
  submitBtn: {
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  linkText: {
    textDecorationLine: 'underline',
  },
});

export default SecurityVerification;
