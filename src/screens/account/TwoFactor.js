import React, { useState, useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  View,
  ScrollView,
  Platform,
  TouchableOpacity,
  Switch,
} from 'react-native';
import {
  AppSafeAreaView,
  AppText,
  SEMI_BOLD,
  BOLD,
  SIXTEEN,
  FOURTEEN,
  TEN,
  THIRTEEN,
  ELEVEN,
} from '../../shared';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import FastImage from 'react-native-fast-image';
import {
  back_ic,
  EMAIL,
  FINGERPRINT,
  LOCK_ICON,
  PHONE,
  SECURITY_SHEIELD,
} from '../../helper/ImageAssets';
import { ADD_PHONE_NUMBER_SCREEN, ADD_EMAIL_SCREEN, SETUP_TWO_FACTOR_SCREEN, ADD_PASSKEY_SCREEN, CHANGE_EMAIL_SCREEN, CHANGE_MOBILE_SCREEN, VIEW_PASSKEYS_SCREEN, DISABLE_2FA_SCREEN } from '../../navigation/routes';
import {
  getUserProfile,
  getPasskeyList,
} from '../../actions/accountActions';
import { showError } from '../../helper/logger';
import { Passkey } from 'react-native-passkey';
import { useTheme } from "../../hooks/useTheme";
import TouchableOpacityView from '../../common/TouchableOpacityView';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SHIMMER_STRIP = 180;
const H_PAD = 24;
const CARD_W = SCREEN_WIDTH - H_PAD;

/** Strings aligned with `arab_global_exchange` TwofactorPage 2FA card. */
const TWO_FA_COPY = {
  subtitle:
    'Choose Passkeys, Verification Code, or Trading Password to ensure the safety of your assets',
  passkeys: {
    title: 'Passkeys',
    recommended: 'Recommended',
    desc:
      'Enables secure, passwordless authentication using device-based credentials. Provides faster logins and stronger protection against phishing and unauthorized access.',
  },
  google: {
    title: 'Google Authenticator',
    desc:
      'Generates time-based one-time codes for secure login verification. Adds an extra layer of protection beyond passwords to prevent unauthorized access.',
  },
  email: {
    title: 'Email Verification',
    desc: 'Securely verifies user identity via email confirmation, adding an extra layer of protection.',
  },
  phone: {
    title: 'Phone Verification',
    desc:
      'Securely verifies user identity using SMS-based OTP. Ensures safe logins and protects sensitive actions with an added layer of security.',
  },
};

const maskTwoFaEmail = (email) => {
  if (!email) return '';
  const [username, domain] = String(email).split('@');
  if (!domain) return email;
  const masked = username.substring(0, 2) + '***' + username.slice(-1);
  return `${masked}@${domain}`;
};

const maskTwoFaPhone = (phone) => {
  if (!phone) return '';
  const cleaned = String(phone).replace(/\s/g, '');
  if (cleaned.length < 4) return phone;
  return '****' + cleaned.slice(-4);
};

const headerIconSurface = (isDark) => ({
  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
});

const TwoFaToggleCard = ({
  themeColors,
  isDark,
  iconSource,
  title,
  badge,
  description,
  value,
  onValueChange,
  highlighted,
  disabled,
}) => (
  <View
    style={[
      styles.optionCard,
      {
        backgroundColor: isDark ? themeColors.card : '#FFFFFF',
        borderColor: highlighted ? themeColors.text : themeColors.border,
        borderWidth: highlighted ? 1.5 : StyleSheet.hairlineWidth,
      },
      Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: isDark ? 0.25 : 0.07,
          shadowRadius: 10,
        },
        android: { elevation: 2 },
      }),
    ]}
  >
    <View style={styles.optionTopRow}>
      <View style={[styles.methodIconWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}>
        <FastImage source={iconSource} style={styles.methodIconImg} tintColor={themeColors.text} resizeMode="contain" />
      </View>
      <View style={styles.optionBody}>
        <View style={styles.tfHeadingLine}>
          <AppText type={THIRTEEN} weight={BOLD} style={{ color: themeColors.text }}>
            {title}
          </AppText>
          {badge}
        </View>
        <AppText type={TEN} style={[styles.tfRowDescription, { color: themeColors.secondaryText }]}>
          {description}
        </AppText>
      </View>
      <Switch
        value={value}
        disabled={disabled}
        onValueChange={onValueChange}
        trackColor={{
          false: isDark ? 'rgba(255,255,255,0.2)' : '#E8E8E8',
          true: themeColors.text,
        }}
        thumbColor="#FFFFFF"
        ios_backgroundColor={isDark ? 'rgba(255,255,255,0.2)' : '#E8E8E8'}
      />
    </View>
  </View>
);

const TwoFaIdentityCard = ({
  themeColors,
  isDark,
  iconSource,
  title,
  description,
  hasValue,
  maskedValue,
  actionLabel,
  onAction,
}) => (
  <View
    style={[
      styles.optionCard,
      {
        backgroundColor: isDark ? themeColors.card : '#FFFFFF',
        borderColor: themeColors.border,
        borderWidth: StyleSheet.hairlineWidth,
      },
      Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: isDark ? 0.25 : 0.07,
          shadowRadius: 10,
        },
        android: { elevation: 2 },
      }),
    ]}
  >
    <View style={styles.optionTopRow}>
      <View style={[styles.methodIconWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}>
        <FastImage source={iconSource} style={styles.methodIconImg} tintColor={themeColors.text} resizeMode="contain" />
      </View>
      <View style={[styles.optionBody, { paddingRight: 8 }]}>
        <AppText type={THIRTEEN} weight={BOLD} style={{ color: themeColors.text, marginBottom: 6 }}>
          {title}
        </AppText>
        <AppText type={TEN} style={[styles.tfRowDescription, { color: themeColors.secondaryText }]}>
          {description}
        </AppText>
      </View>
      <View style={styles.identityRightCol}>
        {hasValue ? (
          <>
            <AppText type={FOURTEEN} numberOfLines={1} style={{ color: themeColors.secondaryText, textAlign: 'right', maxWidth: 140 }}>
              {maskedValue}
            </AppText>
            <TouchableOpacityView activeOpacity={0.85} onPress={onAction} style={[styles.changeBtn, { backgroundColor: themeColors.text }]}>
              <AppText type={ELEVEN} weight={SEMI_BOLD} style={{ color: themeColors.background }}>
                {actionLabel}
              </AppText>
            </TouchableOpacityView>
          </>
        ) : (
          <>
            <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: themeColors.secondaryText, textAlign: 'right' }}>
              Off
            </AppText>
            <TouchableOpacityView activeOpacity={0.85} onPress={onAction} style={[styles.changeBtn, { backgroundColor: themeColors.text }]}>
              <AppText type={ELEVEN} weight={SEMI_BOLD} style={{ color: themeColors.background }}>
                {actionLabel}
              </AppText>
            </TouchableOpacityView>
          </>
        )}
      </View>
    </View>
  </View>
);

const ShimmerCell = ({ width: w, height, borderRadius = 6, style }) => {
  const shimmerX = useRef(new Animated.Value(-SHIMMER_STRIP)).current;
  const mounted = useRef(true);
  const { isDark } = useTheme();

  useEffect(() => {
    mounted.current = true;
    const run = () => {
      if (!mounted.current) return;
      shimmerX.setValue(-SHIMMER_STRIP);
      Animated.timing(shimmerX, {
        toValue: Math.max(w, 1) + SHIMMER_STRIP,
        duration: 1100,
        useNativeDriver: true,
      }).start(({ finished }) => { if (mounted.current && finished) run(); });
    };
    const t = setTimeout(run, 50);
    return () => { mounted.current = false; clearTimeout(t); shimmerX.stopAnimation(); };
  }, [shimmerX, w]);

  return (
    <View style={[{ width: w, height, borderRadius, overflow: 'hidden', backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }, style]}>
      <Animated.View
        style={{ position: 'absolute', top: 0, bottom: 0, width: SHIMMER_STRIP, transform: [{ translateX: shimmerX }], backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.4)' }}
      />
    </View>
  );
};

const TwoFaCardsSkeleton = () => {
  const { colors: themeColors, isDark } = useTheme();
  return (
    <>
      {[1, 2, 3, 4].map((i) => (
        <View
          key={i}
          style={[
            styles.optionCard,
            {
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: themeColors.border,
              backgroundColor: isDark ? themeColors.card : '#FFFFFF',
            },
          ]}
        >
          <View style={styles.optionTopRow}>
            <ShimmerCell width={44} height={44} borderRadius={12} />
            <View style={{ marginLeft: 12, flex: 1, gap: 8 }}>
              <ShimmerCell width={CARD_W * 0.35} height={14} borderRadius={4} />
              <ShimmerCell width={Math.min(CARD_W - 100, 260)} height={32} borderRadius={4} />
            </View>
            <ShimmerCell width={52} height={32} borderRadius={16} />
          </View>
        </View>
      ))}
    </>
  );
};

const TwoFactor = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const { colors: themeColors, isDark } = useTheme();
  const userData = useAppSelector((state) => state.auth.userData);
  const current2fa = userData?.['2fa'] ?? 0;
  const profileMobile = userData?.mobileNumber ?? userData?.mobile_number ?? '';
  const emailId = userData?.emailId ?? userData?.email_id ?? '';
  const hasEmail = !!emailId;
  const hasMobile = !!profileMobile;
  const hasGoogleAuth = current2fa === 2;

  const [passkeySupported, setPasskeySupported] = useState(false);
  const [passkeys, setPasskeys] = useState([]);
  const hasPasskey = passkeys.length > 0;
  const [contentLoading, setContentLoading] = useState(true);
  const profileDone = useRef(false);
  const passkeysDone = useRef(false);

  const checkPasskeySupport = () => {
    try {
      const supported = Passkey.isSupported();
      setPasskeySupported(!!supported);
    } catch {
      setPasskeySupported(false);
    }
  };

  const fetchPasskeys = async () => {
    try {
      const res = await dispatch(getPasskeyList());
      if (res?.success && res?.data) {
        setPasskeys(res.data.passkeys || []);
      }
    } catch (_) {
    } finally {
      passkeysDone.current = true;
      if (profileDone.current) setContentLoading(false);
    }
  };

  useEffect(() => {
    checkPasskeySupport();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      profileDone.current = false;
      passkeysDone.current = false;
      setContentLoading(true);
      dispatch(getUserProfile()).then(() => {
        profileDone.current = true;
        if (passkeysDone.current) setContentLoading(false);
      });
      fetchPasskeys();
    }, [])
  );

  const getActiveMethodsCount = () => {
    let count = 0;
    if (hasEmail) count++;
    if (hasMobile) count++;
    if (hasGoogleAuth) count++;
    if (hasPasskey) count++;
    return count;
  };

  const canMakeSensitiveChanges = () => getActiveMethodsCount() >= 2;

  const handleDisableGoogleAuthStart = () => {
    if (!canMakeSensitiveChanges()) {
      showError('You need at least 2 security methods to disable Google Authenticator');
      return;
    }
    navigation.navigate(DISABLE_2FA_SCREEN);
  };

  const handleAddPasskeyPress = () => {
    if (!passkeySupported) {
      showError('Passkeys are not supported on this device/browser');
      return;
    }
    if (!hasEmail && !hasMobile && !hasGoogleAuth) {
      showError('You need email, mobile or Google Authenticator to add a passkey');
      return;
    }
    navigation.navigate(ADD_PASSKEY_SCREEN);
  };

  const handleAddMobileStart = () => {
    if (!hasEmail && !hasMobile) {
      showError('You need email or mobile verification to add a mobile number');
      return;
    }
    navigation.navigate(ADD_PHONE_NUMBER_SCREEN);
  };

  const handleChangeMobileStart = () => {
    if (!canMakeSensitiveChanges()) {
      showError('Add another method first to change mobile');
      return;
    }
    navigation.navigate(CHANGE_MOBILE_SCREEN);
  };

  const handleChangeEmailStart = () => {
    if (!canMakeSensitiveChanges()) {
      showError('Add another method first to change email');
      return;
    }
    navigation.navigate(CHANGE_EMAIL_SCREEN);
  };

  const onPasskeySwitch = (v) => {
    if (v) {
      if (!hasPasskey) handleAddPasskeyPress();
      return;
    }
    if (hasPasskey) navigation.navigate(VIEW_PASSKEYS_SCREEN);
  };

  const onGoogleSwitch = (v) => {
    if (v) {
      if (!hasGoogleAuth) {
        if (!hasEmail && !hasMobile) {
          showError('You need an email or mobile number to set up Google Authenticator');
          return;
        }
        navigation.navigate(SETUP_TWO_FACTOR_SCREEN);
      }
      return;
    }
    if (hasGoogleAuth) handleDisableGoogleAuthStart();
  };

  return (
    <AppSafeAreaView style={{ backgroundColor: themeColors.background }}>
      <View style={[styles.securityHeader, { borderBottomColor: themeColors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.headerIconBtn, headerIconSurface(isDark)]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <FastImage source={back_ic} style={styles.headerIconImg} tintColor={themeColors.text} resizeMode="contain" />
        </TouchableOpacity>
        <View style={styles.securityHeaderTitleWrap}>
          <AppText type={SIXTEEN} weight={BOLD} style={{ color: themeColors.text }}>
            Security
          </AppText>
        </View>
        <View style={[styles.headerIconBtn, headerIconSurface(isDark)]}>
          <FastImage source={SECURITY_SHEIELD} style={styles.headerShieldImg} resizeMode="contain" />
        </View>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroRow}>
          <View style={styles.heroTextBlock}>
            <AppText type={SIXTEEN} weight={BOLD} style={[styles.heroTitle, { color: themeColors.text }]}>
              Two-Factor Authentication (2FA)
            </AppText>
            <AppText type={FOURTEEN} style={[styles.heroSubtitle, { color: themeColors.secondaryText }]}>
              {TWO_FA_COPY.subtitle}
            </AppText>
          </View>
          <View style={styles.heroImgWrap}>
            <FastImage source={SECURITY_SHEIELD} style={styles.heroImg} resizeMode="contain" />
          </View>
        </View>

        {contentLoading ? (
          <TwoFaCardsSkeleton />
        ) : (
          <View style={styles.cardsStack}>
            <TwoFaToggleCard
              themeColors={themeColors}
              isDark={isDark}
              iconSource={FINGERPRINT}
              title={TWO_FA_COPY.passkeys.title}
              badge={
                <View style={[styles.recommendedBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : '#EBEBEB' }]}>
                  <AppText type={TEN} weight={SEMI_BOLD} style={{ color: themeColors.secondaryText }}>
                    {TWO_FA_COPY.passkeys.recommended}
                  </AppText>
                </View>
              }
              description={TWO_FA_COPY.passkeys.desc}
              value={hasPasskey}
              onValueChange={onPasskeySwitch}
              highlighted={false}
              disabled={!passkeySupported && !hasPasskey}
            />
            <TwoFaToggleCard
              themeColors={themeColors}
              isDark={isDark}
              iconSource={LOCK_ICON}
              title={TWO_FA_COPY.google.title}
              badge={null}
              description={TWO_FA_COPY.google.desc}
              value={hasGoogleAuth}
              onValueChange={onGoogleSwitch}
              highlighted={hasGoogleAuth}
              disabled={false}
            />
            <TwoFaIdentityCard
              themeColors={themeColors}
              isDark={isDark}
              iconSource={EMAIL}
              title={TWO_FA_COPY.email.title}
              description={TWO_FA_COPY.email.desc}
              hasValue={hasEmail}
              maskedValue={maskTwoFaEmail(emailId)}
              actionLabel={hasEmail ? 'Change' : 'Turn on'}
              onAction={
                !hasEmail
                  ? () => {
                      if (!hasMobile && !hasGoogleAuth) {
                        showError('No verification method available to add email');
                        return;
                      }
                      navigation.navigate(ADD_EMAIL_SCREEN);
                    }
                  : handleChangeEmailStart
              }
            />
            <TwoFaIdentityCard
              themeColors={themeColors}
              isDark={isDark}
              iconSource={PHONE}
              title={TWO_FA_COPY.phone.title}
              description={TWO_FA_COPY.phone.desc}
              hasValue={hasMobile}
              maskedValue={maskTwoFaPhone(profileMobile)}
              actionLabel={hasMobile ? 'Change' : 'Turn on'}
              onAction={!hasMobile ? handleAddMobileStart : handleChangeMobileStart}
            />
          </View>
        )}

      </ScrollView>
    </AppSafeAreaView>
  );
};

export default TwoFactor;

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 48,
    paddingHorizontal: 16,
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconImg: { width: 22, height: 22 },
  headerShieldImg: { width: 24, height: 24 },
  securityHeaderTitleWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 4,
  },
  heroTextBlock: {
    flex: 1,
    paddingRight: 8,
    minWidth: 0,
  },
  heroTitle: {
    lineHeight: 24,
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  heroSubtitle: {
    lineHeight: 22,
  },
  heroImgWrap: {
    width: 112,
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImg: {
    width: 112,
    height: 112,
  },
  cardsStack: {
    marginBottom: 8,
  },
  optionCard: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 16,
    marginBottom: 12,
  },
  optionTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  optionBody: {
    flex: 1,
    marginLeft: 12,
    minWidth: 0,
  },
  identityRightCol: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    paddingLeft: 4,
    maxWidth: 148,
  },
  changeBtn: {
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 76,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tfHeadingLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  tfRowDescription: {
    lineHeight: 18,
  },
  methodIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodIconImg: { width: 22, height: 22 },
  recommendedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    justifyContent: 'center',
  },
});
