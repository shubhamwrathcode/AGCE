import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useTheme } from "../../hooks/useTheme";
import { useAppSelector } from "../../store/hooks";
import {
  AppSafeAreaView,
  AppText,
  SEMI_BOLD,
  BOLD,
  EIGHTEEN,
  SIXTEEN,
  FOURTEEN,
  MEDIUM,
} from '../../shared';
import FastImage from 'react-native-fast-image';
import { back_ic } from '../../helper/ImageAssets';
import { appOperation } from '../../appOperation';
import * as routes from '../../navigation/routes';
import Toast from "react-native-simple-toast";

// --- Normalization Helpers to align with Web TwofactorPage/index.js ---
const truthyFlag = (v) => {
  if (v === true || v === 1) return true;
  if (v === false || v === 0 || v == null) return false;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "true" || s === "1" || s === "yes" || s === "on") return true;
    if (s === "false" || s === "0" || s === "no" || s === "off" || s === "") return false;
  }
  return Boolean(v);
};

const firstTruthyKey = (obj, keys) => {
  if (!obj || typeof obj !== "object") return false;
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, k) && obj[k] !== undefined && obj[k] !== null) {
      if (truthyFlag(obj[k])) return true;
    }
  }
  return false;
};

const normMethodToken = (x) => String(x ?? "").toLowerCase().replace(/[-_\s]+/g, "");

const parseEnabledMethodsArray = (arr) => {
  if (!Array.isArray(arr) || !arr.length) return null;
  const tokens = arr.map((x) => (typeof x === "string" ? normMethodToken(x) : normMethodToken(x?.method || x?.name || x)));
  return {
    totp: tokens.some((a) => a === "totp" || a === "topt" || a === "ga" || a.includes("google") || a.includes("authenticator")),
    email: tokens.some((a) => a === "email" || a === "mail" || a.includes("email") || a === "e-mail"),
    mobile: tokens.some((a) => a === "mobile" || a === "sms" || a === "phone" || a.includes("sms") || a.includes("phone")),
  };
};

const flattenOneLevelLogin2Step = (d) => {
  if (!d || typeof d !== "object") return {};
  const nestKeys = [
    "data",
    "login2Step",
    "login2_step",
    "loginTwoStep",
    "login_two_step",
    "loginStep",
    "settings",
    "two_fa",
    "twoFA",
  ];
  let out = { ...d };
  for (const nk of nestKeys) {
    const inner = d[nk];
    if (inner && typeof inner === "object" && !Array.isArray(inner)) {
      out = { ...out, ...inner };
    }
  }
  return out;
};

const normalizeCheckTwoLogin2StepPayload = (raw) => {
  if (!raw) return { totp: false, email: false, mobile: false };
  let d = raw;
  if (d && typeof d === "object" && d.data && typeof d.data === "object") {
    const inner = d.data;
    if (
      Object.prototype.hasOwnProperty.call(inner, "totp") ||
      Object.prototype.hasOwnProperty.call(inner, "TOTP") ||
      Object.prototype.hasOwnProperty.call(inner, "email") ||
      Object.prototype.hasOwnProperty.call(inner, "mobile")
    ) {
      d = inner;
    }
  }
  const dPreFlatten = d;
  d = flattenOneLevelLogin2Step(d);
  
  const reapplyTop = [
    ["totp", "totp"],
    ["TOTP", "totp"],
    ["email", "email"],
    ["mobile", "mobile"],
    ["sms", "mobile"],
    ["phone", "mobile"],
  ];
  for (const [from, to] of reapplyTop) {
    if (dPreFlatten && typeof dPreFlatten === "object" && Object.prototype.hasOwnProperty.call(dPreFlatten, from)) {
      d[to] = dPreFlatten[from];
    }
  }
  if (!d || typeof d !== "object") return { totp: false, email: false, mobile: false };

  const fromArrayKeys = [
    "enabledMethods",
    "methods",
    "activeMethods",
    "loginMethods",
    "twoFactorMethods",
    "two_step_methods",
    "enabled_2fa",
  ];
  let fromArr = null;
  for (const k of fromArrayKeys) {
    if (d[k] != null) {
      fromArr = parseEnabledMethodsArray(d[k]);
      if (fromArr) break;
    }
  }

  const fromKeys = {
    totp: firstTruthyKey(d, ["totp", "TOTP", "google_authenticator", "googleAuthenticator", "isTotp", "totp_enabled"]),
    email: firstTruthyKey(d, ["email", "emailVerification", "isEmail", "email_enabled", "is_email"]),
    mobile: firstTruthyKey(d, ["mobile", "sms", "phone", "smsVerification", "isPhone", "phone_verification", "is_phone"]),
  };
  if (!fromArr) {
    return {
      totp: !!fromKeys.totp,
      email: !!fromKeys.email,
      mobile: !!fromKeys.mobile,
    };
  }

  const explicit = {
    totp: Object.prototype.hasOwnProperty.call(dPreFlatten, "totp") || Object.prototype.hasOwnProperty.call(dPreFlatten, "TOTP"),
    email: Object.prototype.hasOwnProperty.call(dPreFlatten, "email"),
    mobile: ["mobile", "sms", "phone"].some((k) => Object.prototype.hasOwnProperty.call(dPreFlatten, k)),
  };
  return {
    totp: explicit.totp ? !!fromKeys.totp : !!fromKeys.totp || fromArr.totp,
    email: explicit.email ? !!fromKeys.email : !!fromKeys.email || fromArr.email,
    mobile: explicit.mobile ? !!fromKeys.mobile : !!fromKeys.mobile || fromArr.mobile,
  };
};

const ToggleSwitch = ({ value, onValueChange, isDark }) => {
  const animatedValue = React.useRef(new Animated.Value(value ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [value]);

  const thumbPosition = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onValueChange(!value)}
      style={[
        styles.customSwitchTrack,
        {
          backgroundColor: value
            ? (isDark ? '#FFFFFF' : '#2A2A2E')
            : (isDark ? '#2A2A2E' : '#E5E5EA'),
        }
      ]}
    >
      <Animated.View
        style={[
          styles.customSwitchThumb,
          {
            left: thumbPosition,
            backgroundColor: value
              ? (isDark ? '#000000' : '#FFFFFF')
              : (isDark ? '#8A8A93' : '#FFFFFF'),
          }
        ]}
      />
    </TouchableOpacity>
  );
};

const LoginTwoStepVerificationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors: themeColors, isDark } = useTheme();
  const userData = useAppSelector((state) => state.auth.userData);

  // Settings states normalized
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [googleAuth, setGoogleAuth] = useState(false);
  const [smsVerification, setSmsVerification] = useState(false);
  const [emailVerification, setEmailVerification] = useState(false);



  // Theme-aware styles
  const textColor = isDark ? '#FFFFFF' : '#1C1C1E';
  const subTextColor = isDark ? '#8A8A93' : '#8E8E93';
  const primaryColor = themeColors.button || '#F0B90B';

  const syncSettings = async () => {
    try {
      setLoadingSettings(true);
      const res = await appOperation.customer.securityCheckTwoLogin2Step();
      if (res?.success) {
        const n = normalizeCheckTwoLogin2StepPayload(res);
        setGoogleAuth(n.totp);
        setSmsVerification(n.mobile);
        setEmailVerification(n.email);
      }
    } catch (e) {
      // silent fallback
    } finally {
      setLoadingSettings(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      syncSettings();
    }, [])
  );

  const handleToggleSwitch = async (method, enable) => {
    // 1. Lockout protection: at least one method must remain active
    if (!enable) {
      const activeCount = [
        method !== 'totp' && googleAuth,
        method !== 'phone' && smsVerification,
        method !== 'email' && emailVerification
      ].filter(Boolean).length;

      if (activeCount === 0) {
        Toast.showWithGravity(
          "At least one verification method must remain enabled for login protection.",
          Toast.LONG,
          Toast.BOTTOM
        );
        return;
      }
    }

    // 2. Unbound state redirects:
    if (method === 'phone' && enable) {
      const isPhoneBound = !!(userData?.mobileNumber || userData?.mobile_number);
      if (!isPhoneBound) {
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
          targetParams: {
            fromScreen: routes.LOGIN_TWO_STEP_VERIFICATION_SCREEN,
          }
        });
        return;
      }
    }

    if (method === 'totp' && enable) {
      const hasGA = Number(userData?.['2fa'] || 0) === 2 || userData?.twoFaEnabled === true;
      if (!hasGA) {
        const hasEmail = !!(userData?.emailId || userData?.email);
        const hasMobile = !!(userData?.mobileNumber || userData?.mobile_number);
        const methods = [];
        if (hasEmail) methods.push('email');
        if (hasMobile) methods.push('mobile');
        if (methods.length === 0) methods.push('email');

        navigation.navigate(routes.PASSKEY_SECURITY_VERIFICATION_SCREEN, {
          targetScreen: routes.PASSKEY_SETUP_AUTHENTICATOR_SCREEN,
          purpose: '2fa_setup',
          verifyMethods: methods,
          skipDirectVerification: false,
          targetParams: {
            fromScreen: routes.LOGIN_TWO_STEP_VERIFICATION_SCREEN,
          }
        });
        return;
      }
    }

    // 3. Navigate to verification screen with target codes skipping direct verification
    const verifyMethods = 
      method === 'email' ? ['email'] :
      method === 'phone' ? ['mobile'] :
      method === 'totp' ? ['totp'] : [];

    if (verifyMethods.length > 0) {
      navigation.navigate(routes.PASSKEY_SECURITY_VERIFICATION_SCREEN, {
        targetScreen: routes.LOGIN_TWO_STEP_VERIFICATION_SCREEN,
        purpose: 'login_2step_verification',
        verifyMethods: verifyMethods,
        skipDirectVerification: false,
        targetParams: {
          pendingAction: { method, action: enable ? 'enable' : 'disable' }
        }
      });
    }
  };



  return (
    <AppSafeAreaView style={{ backgroundColor: isDark ? '#121214' : '#FFFFFF', flex: 1 }}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: isDark ? '#1E1E22' : '#F0F0F0' }]}>
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
              Login 2-Step Verification
            </AppText>
          </View>
          <View style={{ width: 24 }} />
        </View>

        {loadingSettings ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={primaryColor} />
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Google Authenticator Switch Row */}
            <View style={styles.switchRow}>
              <AppText type={SIXTEEN} weight={MEDIUM} style={{ color: textColor }}>
                Google Authenticator
              </AppText>
              <ToggleSwitch
                value={googleAuth}
                onValueChange={(val) => handleToggleSwitch('totp', val)}
                isDark={isDark}
              />
            </View>

            {/* SMS Verification Switch Row */}
            <View style={styles.switchRow}>
              <AppText type={SIXTEEN} weight={MEDIUM} style={{ color: textColor }}>
                SMS verification
              </AppText>
              <ToggleSwitch
                value={smsVerification}
                onValueChange={(val) => handleToggleSwitch('phone', val)}
                isDark={isDark}
              />
            </View>

            {/* Email Verification Switch Row */}
            <View style={styles.switchRow}>
              <AppText type={SIXTEEN} weight={MEDIUM} style={{ color: textColor }}>
                Email verification
              </AppText>
              <ToggleSwitch
                value={emailVerification}
                onValueChange={(val) => handleToggleSwitch('email', val)}
                isDark={isDark}
              />
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>


    </AppSafeAreaView>
  );
};

export default LoginTwoStepVerificationScreen;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
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
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 40,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 48,
    marginVertical: 4,
  },
  customSwitchTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    position: 'relative',
    justifyContent: 'center',
  },
  customSwitchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1.5,
    elevation: 2,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

});

