import React, { useState, useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  View,
  ScrollView,
  Platform,
  TouchableOpacity,
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
} from '../../shared';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { colors } from '../../theme/colors';
import FastImage from 'react-native-fast-image';
import { back_ic, EMAIL, FINGERPRINT, LOCK_ICON, PHONE, UNLOCK_ICON, VERIFY_ICON_SUCCESS } from '../../helper/ImageAssets';
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
  const { colors: themeColors } = useTheme();
  return (
    <View style={{ marginBottom: 24 }}>
      {[1, 2, 3, 4].map((i) => (
        <View
          key={i}
          style={[
            styles.methodCard,
            { borderColor: themeColors.border, backgroundColor: themeColors.card }
          ]}
        >
          <ShimmerCell width={40} height={40} borderRadius={20} />
          <ShimmerCell width={CARD_W * 0.45} height={14} borderRadius={4} style={{ marginLeft: 12, flex: 1 }} />
          <ShimmerCell width={24} height={24} borderRadius={12} style={{ marginLeft: 8 }} />
        </View>
      ))}
    </View>
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

  return (
    <AppSafeAreaView style={{ backgroundColor: themeColors.background }}>
      <View style={[styles.securityHeader, { borderBottomColor: themeColors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.securityBackBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <FastImage source={back_ic} style={{ width: 22, height: 22 }} tintColor={themeColors.text} resizeMode="contain" />
        </TouchableOpacity>
        <View style={styles.securityHeaderTitleWrap}>
          <AppText type={SIXTEEN} weight={BOLD} style={{ color: themeColors.text }}>
            Security
          </AppText>
        </View>
        <View style={{ width: 22 }} />
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <AppText type={FOURTEEN} weight={SEMI_BOLD} style={[styles.sectionTitle, { color: themeColors.text }]}>
          Two-Factor Authentication (2FA)
        </AppText>
        <AppText type={FOURTEEN} style={[styles.sectionDesc, { color: themeColors.secondaryText }]}>
          To protect your account, it is recommended to enable at least two forms of 2FA.
        </AppText>

        <View style={styles.twoFaCardList}>
          {contentLoading ? (
            <TwoFaCardsSkeleton />
          ) : (
            <>
              {passkeySupported && (
                <TouchableOpacityView
                  activeOpacity={0.8}
                  onPress={hasPasskey ? () => navigation.navigate(VIEW_PASSKEYS_SCREEN) : handleAddPasskeyPress}
                  style={[styles.methodCard, { borderColor: themeColors.border, backgroundColor: themeColors.card }]}
                >
                  <View style={styles.methodCardLeft}>
                    <View style={[styles.methodIconWrap, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" }]}>
                      <FastImage source={FINGERPRINT} style={styles.methodIconImg} tintColor={themeColors.button} resizeMode="contain" />
                    </View>
                    <View style={styles.methodLabelWrap}>
                      <View style={styles.methodLabelRow}>
                        <AppText type={THIRTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text }}>
                          Passkeys (Biometrics)
                        </AppText>
                        <View style={[styles.recommendedBadge, { backgroundColor: themeColors.button + '20' }]}>
                          <AppText type={TEN} weight={SEMI_BOLD} style={{ color: themeColors.button }}>Recommended</AppText>
                        </View>
                      </View>
                    </View>
                  </View>
                  <View style={styles.methodCheckWrap}>
                    <FastImage source={hasPasskey ? VERIFY_ICON_SUCCESS : UNLOCK_ICON} style={{ width: 24, height: 24 }} resizeMode="contain" />
                  </View>
                </TouchableOpacityView>
              )}

              <TouchableOpacityView
                activeOpacity={0.8}
                onPress={hasGoogleAuth ? handleDisableGoogleAuthStart : () => { if (!hasEmail && !hasMobile) { showError('You need an email or mobile number to set up Google Authenticator'); return; } navigation.navigate(SETUP_TWO_FACTOR_SCREEN); }}
                style={[styles.methodCard, { borderColor: themeColors.border, backgroundColor: themeColors.card }]}
              >
                <View style={styles.methodCardLeft}>
                  <View style={[styles.methodIconWrap, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" }]}>
                    <FastImage source={LOCK_ICON} style={styles.methodIconImg} tintColor={themeColors.button} resizeMode="contain" />
                  </View>
                  <AppText type={THIRTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text }}>
                    Authenticator App
                  </AppText>
                </View>
                <View style={styles.methodCheckWrap}>
                  <FastImage source={hasGoogleAuth ? VERIFY_ICON_SUCCESS : UNLOCK_ICON} style={{ width: 24, height: 24 }} resizeMode="contain" />
                </View>
              </TouchableOpacityView>

              <TouchableOpacityView
                activeOpacity={0.8}
                onPress={!hasEmail ? () => { if (!hasMobile && !hasGoogleAuth) { showError('No verification method available to add email'); return; } navigation.navigate(ADD_EMAIL_SCREEN); } : (hasEmail && canMakeSensitiveChanges() ? handleChangeEmailStart : undefined)}
                style={[styles.methodCard, { borderColor: themeColors.border, backgroundColor: themeColors.card }]}
              >
                <View style={styles.methodCardLeft}>
                  <View style={[styles.methodIconWrap, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" }]}>
                    <FastImage source={EMAIL} style={styles.methodIconImg} tintColor={themeColors.button} resizeMode="contain" />
                  </View>
                  <AppText type={THIRTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text }}>
                    Email
                  </AppText>
                </View>
                <View style={styles.methodCheckWrap}>
                  <FastImage source={hasEmail ? VERIFY_ICON_SUCCESS : UNLOCK_ICON} style={{ width: 24, height: 24 }} resizeMode="contain" />
                </View>
              </TouchableOpacityView>

              <TouchableOpacityView
                activeOpacity={0.8}
                onPress={!hasMobile ? handleAddMobileStart : (canMakeSensitiveChanges() ? handleChangeMobileStart : undefined)}
                style={[styles.methodCard, { borderColor: themeColors.border, backgroundColor: themeColors.card }]}
              >
                <View style={styles.methodCardLeft}>
                  <View style={[styles.methodIconWrap, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" }]}>
                    <FastImage source={PHONE} style={styles.methodIconImg} tintColor={themeColors.button} resizeMode="contain" />
                  </View>
                  <AppText type={THIRTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text }}>
                    Phone
                  </AppText>
                </View>
                <View style={styles.methodCheckWrap}>
                  <FastImage source={hasMobile ? VERIFY_ICON_SUCCESS : UNLOCK_ICON} style={{ width: 24, height: 24 }} resizeMode="contain" />
                </View>
              </TouchableOpacityView>
            </>
          )}
        </View>
      </ScrollView>
    </AppSafeAreaView>
  );
};

export default TwoFactor;

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 40,
    paddingHorizontal: 16,
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  securityBackBtn: { padding: 4 },
  securityHeaderTitleWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { marginBottom: 8 },
  sectionDesc: { marginBottom: 20, lineHeight: 22 },
  twoFaCardList: { marginBottom: 24 },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 1.5 },
    }),
  },
  methodCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  methodIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  methodIconImg: { width: 22, height: 22 },
  methodLabelWrap: { flex: 1, justifyContent: 'center' },
  methodLabelRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  recommendedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    justifyContent: 'center',
  },
  methodCheckWrap: { marginLeft: 8 },
});
