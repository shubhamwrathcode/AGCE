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
import { useNavigation } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { useTheme } from "../../../hooks/useTheme";
import { back_ic, eye_open_icon, eye_close_icon } from '../../../helper/ImageAssets';
import { AppSafeAreaView, AppText, SEMI_BOLD, EIGHTEEN, FOURTEEN, SIXTEEN, TWELVE, BOLD, THIRTEEN, MEDIUM } from '../../../shared';
import { showError } from '../../../helper/logger';
import { colors } from '../../../theme/colors';
import { addAntiPhishingCode } from '../../../actions/accountActions';
import * as routes from '../../../navigation/routes';

const EditAntiPhishingScreen = ({ route }) => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { colors: themeColors, isDark } = useTheme();
  const userData = useAppSelector(state => state.auth.userData);

  // States
  const [newCode, setNewCode] = useState('');
  const [secureEntry, setSecureEntry] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation states
  const isLenValid = newCode.length >= 5 && newCode.length <= 8;
  const isCharValid = /^\d+$/.test(newCode);
  const isNewCodeValid = isLenValid && isCharValid;



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

    if (!antiPhishingCodeFromParams) return;
    const code = emailOtp || smsOtp || tofaCode;
    if (!code) return;

    let verifyMethod = 'email';
    if (tofaCode) verifyMethod = 'totp';
    else if (smsOtp) verifyMethod = 'mobile';
    else if (emailOtp) verifyMethod = 'email';

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
  const handleConfirm = () => {
    if (!isNewCodeValid) {
      showError('Please make sure all validation rules are met.');
      return;
    }

    Keyboard.dismiss();

    const hasGA = Number(userData?.['2fa'] || 0) === 2 || userData?.twoFaEnabled === true;
    const hasEmail = !!(userData?.emailId || userData?.email);
    const hasMobile = !!(userData?.mobileNumber || userData?.mobile_number);
    const methods = [];
    if (hasGA) methods.push('totp');
    if (hasEmail) methods.push('email');
    if (hasMobile) methods.push('mobile');
    if (methods.length === 0) methods.push('email');

    navigation.navigate(routes.PASSKEY_SECURITY_VERIFICATION_SCREEN, {
      targetScreen: routes.EDIT_ANTI_PHISHING_SCREEN,
      purpose: 'anti_phishing_edit',
      verifyMethods: methods,
      skipDirectVerification: true,
      targetParams: {
        antiPhishingCode: newCode,
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
              Edit Anti-Phishing Code
            </AppText>
          </View>
          <View style={{ width: 24 }} />
        </View>

        {isSubmitting ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={isDark ? '#D1AA67' : '#2A2A2E'} />
            <AppText type={FOURTEEN} style={{ color: isDark ? '#8A8A93' : '#8E8E93', marginTop: 16 }}>
              Updating anti-phishing code...
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
              <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F7', flexDirection: 'row', alignItems: 'center' }]}>
                <TextInput
                  style={[styles.textInput, { color: isDark ? '#FFFFFF' : '#1C1C1E', flex: 1 }]}
                  placeholder="5–8 digits"
                  placeholderTextColor={isDark ? '#8A8A93' : '#9E9EAE'}
                  value={newCode}
                  onChangeText={(t) => setNewCode(t.replace(/[^0-9]/g, ''))}
                  secureTextEntry={secureEntry}
                  keyboardType="number-pad"
                  maxLength={8}
                  cursorColor={colors.black}
                />
                <TouchableOpacity onPress={() => setSecureEntry(!secureEntry)} style={styles.eyeBtn}>
                  <FastImage
                    source={secureEntry ? eye_close_icon : eye_open_icon}
                    style={styles.eyeIcon}
                    tintColor={isDark ? '#8A8A93' : '#9E9EAE'}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>

              {/* Validation helper text */}
              <AppText type={TWELVE} style={[styles.fieldLabel, { color: isDark ? '#8A8A93' : '#9E9EAE', marginTop: 8, fontWeight: 'normal' }]}>
                Enter 5 to 8 digits only.
              </AppText>
            </ScrollView>

            {/* Action button at bottom */}
            <View style={styles.bottomSection}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleConfirm}
                disabled={!isNewCodeValid}
                style={[styles.confirmBtn, { backgroundColor: isDark ? '#2E2E32' : '#22252A', opacity: isNewCodeValid ? 1 : 0.5 }]}
              >
                <AppText type={SIXTEEN} weight={BOLD} style={{ color: '#FFFFFF' }}>
                  Confirm
                </AppText>
              </TouchableOpacity>

            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </AppSafeAreaView>
  );
};

export default EditAntiPhishingScreen;

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
  eyeBtn: {
    paddingLeft: 12,
    justifyContent: 'center',
  },
  eyeIcon: {
    width: 20,
    height: 20,
  },
  validText: {
    textAlign: 'center',
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
