import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Keyboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { useTheme } from "../../../hooks/useTheme";
import { back_ic } from '../../../helper/ImageAssets';
import { AppSafeAreaView, AppText, SEMI_BOLD, EIGHTEEN, FOURTEEN, SIXTEEN, TWELVE, BOLD, NORMAL } from '../../../shared';
import * as routes from '../../../navigation/routes';
import { showError, showSuccess } from '../../../helper/logger';

const CreateAntiPhishingScreen = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { colors: themeColors, isDark } = useTheme();
  const userData = useAppSelector(state => state.auth.userData);

  // Step state: 1 (Screenshot 1) or 2 (Screenshot 2)
  const [step, setStep] = useState(1);

  // Form State
  const [newCodeField, setNewCodeField] = useState('');
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timerRef = useRef(null);

  // Real-time Validations matching Screenshot 1 criteria
  const isLenValid = newCodeField.length >= 6 && newCodeField.length <= 8;
  const isCharValid = newCodeField.length > 0 && /^[A-Za-z0-9_]+$/.test(newCodeField);
  const isNotAllSame = newCodeField.length > 0 && !/^(.)\1+$/.test(newCodeField);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (resendTimer > 0) {
      timerRef.current = setInterval(() => {
        setResendTimer(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resendTimer]);

  const handleConfirmStep1 = () => {
    // Validation commented out for UI testing
    // if (!isLenValid || !isCharValid || !isNotAllSame) {
    //   showError('Please satisfy all anti-phishing code requirements.');
    //   return;
    // }
    Keyboard.dismiss();
    setStep(2);
  };

  const handleSendOtp = async () => {
    setIsOtpLoading(true);
    setTimeout(() => {
      setResendTimer(60);
      // showSuccess('Verification code sent successfully!');
      setIsOtpLoading(false);
    }, 500);
  };

  const handleSubmitStep2 = async () => {
    // Validation commented out for UI testing
    // if (!otp || otp.length < 6) {
    //   showError('Please enter the 6-digit OTP verification code');
    //   return;
    // }

    Keyboard.dismiss();
    setIsSubmitting(true);
    setTimeout(() => {
      // showSuccess('Anti-phishing code created successfully!');
      setIsSubmitting(false);
      navigation.navigate(routes.ANTI_PHISHING_CODE_SCREEN);
    }, 1000);
  };

  const userEmail = userData?.emailId || 'j***3@gmail.com';

  return (
    <AppSafeAreaView style={{ backgroundColor: isDark ? '#121214' : '#FFFFFF', flex: 1 }}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: isDark ? '#1E1E22' : '#F0F0F0' }]}>
          <TouchableOpacity
            onPress={() => {
              if (step === 2) {
                setStep(1);
              } else {
                navigation.goBack();
              }
            }}
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

        {step === 1 ? (
          /* Step 1 View: Screenshot 1 */
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
                placeholder="Please anti-phishing Code"
                placeholderTextColor={isDark ? '#8A8A93' : '#9E9EAE'}
                value={newCodeField}
                onChangeText={(val) => setNewCodeField(val.replace(/[^A-Za-z0-9_]/g, ''))}
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

              <View style={styles.valRow}>
                <AppText style={[styles.checkmark, { color: isNotAllSame ? '#4CD964' : '#8E8E93' }]}>✓</AppText>
                <AppText type={TWELVE} style={[styles.valText, { color: isNotAllSame ? (isDark ? '#FFFFFF' : '#1C1C1E') : '#8E8E93' }]}>
                  Characters cannot be all the same
                </AppText>
              </View>
            </View>
          </ScrollView>
        ) : (
          /* Step 2 View: Screenshot 2 */
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <AppText type={FOURTEEN} weight={SEMI_BOLD} style={[styles.fieldLabel, { color: isDark ? '#FFFFFF' : '#1C1C1E', marginTop: 8 }]}>
              Email Verification Code
            </AppText>
            <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F7', flexDirection: 'row', alignItems: 'center' }]}>
              <TextInput
                style={[styles.textInput, { color: isDark ? '#FFFFFF' : '#1C1C1E', flex: 1 }]}
                placeholder="Please Enter"
                placeholderTextColor={isDark ? '#8A8A93' : '#9E9EAE'}
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
              />
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleSendOtp}
                disabled={resendTimer > 0 || isOtpLoading}
                style={styles.sendBtn}
              >
                <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: '#D1AA67' }}>
                  {resendTimer > 0 ? `${resendTimer}s` : 'Send'}
                </AppText>
              </TouchableOpacity>
            </View>

            <AppText type={TWELVE} style={[styles.subInfoText, { color: isDark ? '#8A8A93' : '#8E8E93' }]}>
              Send the verification code to {userEmail}, and the code will be valid for 10 minutes
            </AppText>
          </ScrollView>
        )}

        {/* Dynamic bottom button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={step === 1 ? handleConfirmStep1 : handleSubmitStep2}
          disabled={isSubmitting}
          style={[styles.confirmBtn, { backgroundColor: isDark ? '#2E2E32' : '#22252A' }]}
        >
          <AppText
            type={SIXTEEN}
            weight={BOLD}
            style={{ color: '#FFFFFF' }}
          >
            {step === 1 ? 'Confirm' : (isSubmitting ? 'Submitting...' : 'Submit')}
          </AppText>
        </TouchableOpacity>
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
  sendBtn: {
    paddingLeft: 12,
    justifyContent: 'center',
  },
  valWrapper: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  valRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkmark: {
    fontSize: 12,
    marginRight: 8,
    fontWeight: 'bold',
  },
  valText: {
    lineHeight: 16,
    fontFamily: NORMAL
  },
  subInfoText: {
    marginHorizontal: 16,
    marginTop: 10,
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
