import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { useTheme } from "../../../hooks/useTheme";
import { back_ic } from '../../../helper/ImageAssets';
import { AppSafeAreaView, AppText, SEMI_BOLD, EIGHTEEN, FOURTEEN, SIXTEEN, TWELVE, BOLD, THIRTEEN, MEDIUM } from '../../../shared';
import AgceGoldCard from './AgceGoldCard';
import { showError } from '../../../helper/logger';
import { colors } from '../../../theme/colors';
import {
  getAntiPhishingStatus,
  removeAntiPhishingCode,
} from '../../../actions/accountActions';
import * as routes from '../../../navigation/routes';

const DisableAntiPhishingScreen = ({ route }) => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { colors: themeColors, isDark } = useTheme();
  const userData = useAppSelector(state => state.auth.userData);

  // States
  const [currentCode, setCurrentCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /** Fetch current anti-phishing status from API */
  const fetchStatus = useCallback(async () => {
    try {
      const data = await dispatch(getAntiPhishingStatus());
      if (data) {
        setCurrentCode(data.antiPhishingCode || '');
      }
    } catch (e) {
      console.log('Error fetching anti-phishing status:', e);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  /**
   * When SecurityVerification screen navigates back here with OTP codes,
   * we pick them up from route.params and auto-submit remove.
   */
  useEffect(() => {
    const params = route?.params || {};
    const emailOtp = params.emailOtp;
    const smsOtp = params.smsOtp;
    const tofaCode = params.tofaCode;
    const isDisableFlow = params.isDisableFlow;

    if (!isDisableFlow) return;
    const code = emailOtp || smsOtp || tofaCode;
    if (!code) return;

    let verifyMethod = 'email';
    if (tofaCode) verifyMethod = 'totp';
    else if (smsOtp) verifyMethod = 'mobile';
    else if (emailOtp) verifyMethod = 'email';

    const submitRemove = async () => {
      setIsSubmitting(true);
      try {
        const payload = {
          verifyMethod,
          code,
        };
        const success = await dispatch(removeAntiPhishingCode(payload));
        if (success) {
          navigation.navigate(routes.ANTI_PHISHING_CODE_SCREEN);
        }
      } catch (error) {
        showError(error?.message || 'Something went wrong');
      } finally {
        setIsSubmitting(false);
      }
    };

    submitRemove();
  }, [route?.params]);

  const maskCode = (code) => {
    if (!code) return 'X X X X X X';
    if (code.length <= 2) return code.split('').join(' ');
    const head = code.slice(0, 2);
    const masked = '* '.repeat(Math.min(code.length - 2, 6)).trim();
    return `${head.split('').join(' ')} ${masked}`;
  };

  /** Navigate to SecurityVerification screen for OTP/TOTP verification */
  const handleConfirm = () => {
    const hasGA = Number(userData?.['2fa'] || 0) === 2 || userData?.twoFaEnabled === true;
    const hasEmail = !!(userData?.emailId || userData?.email);
    const hasMobile = !!(userData?.mobileNumber || userData?.mobile_number);
    const methods = [];
    if (hasGA) methods.push('totp');
    if (hasEmail) methods.push('email');
    if (hasMobile) methods.push('mobile');
    if (methods.length === 0) methods.push('email');

    navigation.navigate(routes.PASSKEY_SECURITY_VERIFICATION_SCREEN, {
      targetScreen: routes.DISABLE_ANTI_PHISHING_SCREEN,
      purpose: 'anti_phishing_remove',
      verifyMethods: methods,
      skipDirectVerification: true,
      targetParams: {
        isDisableFlow: true,
      },
    });
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
              tintColor={isDark ? '#FFFFFF' : '#000000'}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <AppText weight={SEMI_BOLD} type={EIGHTEEN} style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Disable Anti-Phishing Code
            </AppText>
          </View>
          <View style={{ width: 24 }} />
        </View>

        {isSubmitting ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={isDark ? '#D1AA67' : '#2A2A2E'} />
            <AppText type={FOURTEEN} style={{ color: isDark ? '#8A8A93' : '#8E8E93', marginTop: 16 }}>
              Removing anti-phishing code...
            </AppText>
          </View>
        ) : (
          <>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Reusable AGCE Gold Card */}
              <AgceGoldCard code={maskCode(currentCode)} isDark={isDark} />

              <AppText type={TWELVE} style={[styles.validText, { color: isDark ? '#8A8A93' : '#9E9EAE', marginTop: 10, marginBottom: 10 }]}>
                This code identifies official AGCE emails.
              </AppText>

              {/* Current Code */}
              <AppText type={FOURTEEN} weight={SEMI_BOLD} style={[styles.fieldLabel, { color: isDark ? '#FFFFFF' : '#1C1C1E' }]}>
                Current Anti-phishing Code
              </AppText>
              <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F7', opacity: 0.7 }]}>
                <TextInput
                  style={[styles.textInput, { color: isDark ? '#8A8A93' : '#8E8E93' }]}
                  value={maskCode(currentCode)}
                  editable={false}
                />
              </View>
            </ScrollView>

            {/* Action button */}
            <View style={styles.bottomSection}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleConfirm}
                style={[styles.confirmBtn, { backgroundColor: isDark ? '#2E2E32' : '#22252A' }]}
              >
                <AppText type={SIXTEEN} weight={BOLD} style={{ color: '#FFFFFF' }}>
                  Confirm
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity style={styles.unableLink} activeOpacity={0.7}>
                <AppText weight={MEDIUM} type={THIRTEEN} style={styles.unableText}>
                  Unable to Verify?
                </AppText>
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </AppSafeAreaView>
  );
};

export default DisableAntiPhishingScreen;

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
    paddingBottom: 120,
  },
  fieldLabel: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  inputContainer: {
    borderRadius: 12,
    height: 52,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    justifyContent: 'center',
    marginBottom: 4,
  },
  textInput: {
    fontSize: 14,
    padding: 0,
    flex: 1,
  },
  validText: {
    textAlign: 'center',
  },
  bottomSection: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  confirmBtn: {
    height: 50,
    borderRadius: 25,
    marginHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '92%',
    marginBottom: 12,
  },
  unableLink: {
    padding: 4,
  },
  unableText: {
    color: colors.black,
    textDecorationLine: 'underline',
  },
});
