import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { useTheme } from "../../../hooks/useTheme";
import { back_ic } from '../../../helper/ImageAssets';
import { AppSafeAreaView, AppText, SEMI_BOLD, EIGHTEEN, FOURTEEN, SIXTEEN, TWELVE, BOLD, NORMAL } from '../../../shared';
import * as routes from '../../../navigation/routes';
import { showError } from '../../../helper/logger';
import { addAntiPhishingCode } from '../../../actions/accountActions';

const CreateAntiPhishingScreen = ({ route }) => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { colors: themeColors, isDark } = useTheme();
  const userData = useAppSelector(state => state.auth.userData);

  // Form State
  const [newCodeField, setNewCodeField] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Micro-interactive Validation states
  const isLenValid = newCodeField.length >= 6 && newCodeField.length <= 8;
  const isCharValid = /^[A-Za-z0-9_]+$/.test(newCodeField);
  const isAntiCodeValid = isLenValid && isCharValid;

  /**
   * When SecurityVerification screen navigates back here with OTP codes,
   * we pick them up from route.params and auto-submit.
   */
  useEffect(() => {
    const params = route?.params || {};
    const emailOtp = params.emailOtp;
    const smsOtp = params.smsOtp;
    const tofaCode = params.tofaCode;
    const antiPhishingCodeFromParams = params.antiPhishingCode;

    // Only proceed if we have a verification code AND the anti-phishing code
    if (!antiPhishingCodeFromParams) return;
    const code = emailOtp || smsOtp || tofaCode;
    if (!code) return;

    // Determine verifyMethod from which OTP was provided
    let verifyMethod = 'email';
    if (tofaCode) verifyMethod = 'totp';
    else if (smsOtp) verifyMethod = 'mobile';
    else if (emailOtp) verifyMethod = 'email';

    // Auto-submit
    const submitCode = async () => {
      setIsSubmitting(true);
      try {
        const payload = {
          antiPhishingCode: antiPhishingCodeFromParams,
          verifyMethod,
          code,
        };
        const success = await dispatch(addAntiPhishingCode(payload));
        if (success) {
          navigation.navigate(routes.ANTI_PHISHING_CODE_SCREEN);
        }
      } catch (error) {
        showError(error?.message || 'Something went wrong');
      } finally {
        setIsSubmitting(false);
      }
    };

    submitCode();
  }, [route?.params]);

  /** Navigate to SecurityVerification screen for OTP/TOTP verification */
  const handleConfirmAndVerify = () => {
    if (!isAntiCodeValid) {
      showError('Please make sure all validation rules are met.');
      return;
    }

    Keyboard.dismiss();

    // Build verifyMethods array based on user's security settings
    const hasGA = Number(userData?.['2fa'] || 0) === 2 || userData?.twoFaEnabled === true;
    const hasEmail = !!(userData?.emailId || userData?.email);
    const hasMobile = !!(userData?.mobileNumber || userData?.mobile_number);
    const methods = [];
    if (hasGA) methods.push('totp');
    if (hasEmail) methods.push('email');
    if (hasMobile) methods.push('mobile');
    if (methods.length === 0) methods.push('email');

    // Navigate to SecurityVerification — it will come back to this screen with OTP codes
    navigation.navigate(routes.PASSKEY_SECURITY_VERIFICATION_SCREEN, {
      targetScreen: routes.CREATE_ANTI_PHISHING_SCREEN,
      purpose: 'anti_phishing_add',
      verifyMethods: methods,
      skipDirectVerification: true,
      targetParams: {
        antiPhishingCode: newCodeField,
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
              Create Anti-Phishing Code
            </AppText>
          </View>
          <View style={{ width: 24 }} />
        </View>

        {isSubmitting ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={isDark ? '#D1AA67' : '#2A2A2E'} />
            <AppText type={FOURTEEN} style={{ color: isDark ? '#8A8A93' : '#8E8E93', marginTop: 16 }}>
              Setting anti-phishing code...
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
              <AppText type={FOURTEEN} weight={SEMI_BOLD} style={[styles.fieldLabel, { color: isDark ? '#FFFFFF' : '#1C1C1E', marginTop: 8 }]}>
                Anti-Phishing Code
              </AppText>
              <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F7' }]}>
                <TextInput
                  style={[styles.textInput, { color: isDark ? '#FFFFFF' : '#1C1C1E' }]}
                  placeholder="6–8 characters"
                  placeholderTextColor={isDark ? '#8A8A93' : '#9E9EAE'}
                  value={newCodeField}
                  onChangeText={setNewCodeField}
                  keyboardType="default"
                  maxLength={8}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
              </View>

              {/* Micro-interactive Validation Points */}
              <View style={styles.valWrapper}>
                <View style={styles.valRow}>
                  <AppText style={[styles.checkmark, { color: isLenValid ? '#4CD964' : '#8E8E93' }]}>✓</AppText>
                  <AppText type={TWELVE} style={[styles.valText, { color: isLenValid ? (isDark ? '#FFFFFF' : '#1C1C1E') : '#8E8E93' }]}>
                    6-8 characters
                  </AppText>
                </View>

                <View style={styles.valRow}>
                  <AppText style={[styles.checkmark, { color: isCharValid ? '#4CD964' : '#8E8E93' }]}>✓</AppText>
                  <AppText type={TWELVE} style={[styles.valText, { color: isCharValid ? (isDark ? '#FFFFFF' : '#1C1C1E') : '#8E8E93' }]}>
                    Only letters, digits or underscore (A-Z, a-z, 0-9, _)
                  </AppText>
                </View>
              </View>
            </ScrollView>

            {/* Confirm button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleConfirmAndVerify}
              disabled={!isAntiCodeValid}
              style={[
                styles.confirmBtn,
                {
                  backgroundColor: isDark ? '#2E2E32' : '#22252A',
                  opacity: isAntiCodeValid ? 1 : 0.5,
                },
              ]}
            >
              <AppText type={SIXTEEN} weight={BOLD} style={{ color: '#FFFFFF' }}>
                Confirm
              </AppText>
            </TouchableOpacity>
          </>
        )}
      </KeyboardAvoidingView>
    </AppSafeAreaView>
  );
};

export default CreateAntiPhishingScreen;

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
    paddingTop: 16,
    paddingBottom: 100,
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
  },
  textInput: {
    fontSize: 14,
    padding: 0,
    flex: 1,
  },
  valWrapper: {
    marginHorizontal: 16,
    marginTop: 12,
  },
  valRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  checkmark: {
    fontSize: 14,
    marginRight: 8,
  },
  valText: {
    lineHeight: 18,
  },
  confirmBtn: {
    height: 50,
    borderRadius: 25,
    marginHorizontal: 16,
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
