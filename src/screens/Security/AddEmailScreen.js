import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  TextInput,
  Keyboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from "../../hooks/useTheme";
import { useAppSelector } from "../../store/hooks";
import {
  AppSafeAreaView,
  AppText,
  BOLD,
  FOURTEEN,
  SEMI_BOLD,
  EIGHTEEN,
  SIXTEEN,
  THIRTEEN,
  MEDIUM,
  TEN,
  ELEVEN,
  TWELVE,
} from '../../shared';
import FastImage from 'react-native-fast-image';
import { back_ic, right_ic, change_email_vector, securityrisk, warningImg } from '../../helper/ImageAssets';
import { colors } from '../../theme/colors';
import RBSheet from 'react-native-raw-bottom-sheet';
import { showError, showSuccess } from '../../helper/logger';

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

const AddEmailScreen = () => {
  const navigation = useNavigation();
  const { colors: themeColors, isDark } = useTheme();
  const userData = useAppSelector((state) => state.auth.userData);

  const confirmSheetRef = useRef(null);
  const shouldNavigateRef = useRef(false);

  // States for local settings toggles
  const [loginEnabled, setLoginEnabled] = useState(true);
  const [securityEnabled, setSecurityEnabled] = useState(true);
  const [withdrawalEnabled, setWithdrawalEnabled] = useState(true);

  // Screen View Controller: 'settings' or 'change_email'
  const [currentStep, setCurrentStep] = useState('settings');

  // States for Change Email View
  const [newEmail, setNewEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef(null);

  // Fallback / Mask email exactly like screenshot
  const rawEmail = userData?.emailId || 'r***9@gmail.com';
  const maskEmail = (email) => {
    if (!email) return '';
    const parts = email.split('@');
    if (parts.length < 2) return email;
    const name = parts[0];
    const domain = parts[1];
    if (name.length <= 2) return `***@${domain}`;
    return `${name.substring(0, 1)}***${name.slice(-1)}@${domain}`;
  };

  const displayEmail = maskEmail(rawEmail);

  const handleSendCode = () => {
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) {
      showError('Please enter a valid email address');
      return;
    }
    setCountdown(60);
    showSuccess('Verification code sent to your new email! (Mock)');
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleConfirmChange = () => {
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) {
      showError('Please enter a valid email address');
      return;
    }
    if (!verificationCode || verificationCode.length < 6) {
      showError('Please enter the 6-digit verification code');
      return;
    }
    showSuccess('Email updated successfully! (Mock)');
    setCurrentStep('settings');
    setNewEmail('');
    setVerificationCode('');
    setCountdown(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

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
              if (currentStep === 'change_email') {
                setCurrentStep('settings');
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
              {currentStep === 'change_email' ? 'Change Email' : 'Email Settings'}
            </AppText>
          </View>
          <View style={{ width: 24 }} />
        </View>

        {currentStep === 'settings' ? (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Linked Email Row */}
            <View style={styles.row}>
              <AppText type={SIXTEEN} weight={MEDIUM} style={{ color: isDark ? '#FFFFFF' : '#1A1A1C' }}>
                Linked Email
              </AppText>
              <AppText type={SIXTEEN} style={{ color: isDark ? '#8A8A93' : '#9E9EAE' }}>
                {displayEmail}
              </AppText>
            </View>

            {/* Change Email Row */}
            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.7}
              onPress={() => {
                Keyboard.dismiss();
                confirmSheetRef.current?.open();
              }}
            >
              <AppText type={SIXTEEN} weight={MEDIUM} style={{ color: isDark ? '#FFFFFF' : '#1A1A1C' }}>
                Change Email
              </AppText>
              <FastImage
                source={right_ic}
                style={styles.chevronIcon}
                tintColor={isDark ? '#8A8A93' : '#9E9EAE'}
                resizeMode="contain"
              />
            </TouchableOpacity>

            {/* Full Width Divider */}
            <View style={[styles.divider, { backgroundColor: isDark ? '#1E1E22' : '#F5F5FA' }]} />

            {/* Notice Box Description */}
            <View style={styles.descriptionContainer}>
              <AppText type={THIRTEEN} weight={MEDIUM} style={[styles.descriptionText, { color: isDark ? '#8A8A93' : '#9797A3' }]}>
                Used for account security alerts, login verification, withdrawal confirmation, and important account notifications.
              </AppText>
            </View>

            {/* Login Switch Row */}
            <View style={styles.switchRow}>
              <AppText type={SIXTEEN} weight={MEDIUM} style={{ color: isDark ? '#FFFFFF' : '#1A1A1C' }}>
                Login
              </AppText>
              <ToggleSwitch
                value={loginEnabled}
                onValueChange={setLoginEnabled}
                isDark={isDark}
              />
            </View>

            {/* Security Settings Switch Row */}
            <View style={styles.switchRow}>
              <AppText type={SIXTEEN} weight={MEDIUM} style={{ color: isDark ? '#FFFFFF' : '#1A1A1C' }}>
                Security Settings
              </AppText>
              <ToggleSwitch
                value={securityEnabled}
                onValueChange={setSecurityEnabled}
                isDark={isDark}
              />
            </View>

            {/* Withdrawal Switch Row */}
            <View style={styles.switchRow}>
              <AppText type={SIXTEEN} weight={MEDIUM} style={{ color: isDark ? '#FFFFFF' : '#1A1A1C' }}>
                Withdrawal
              </AppText>
              <ToggleSwitch
                value={withdrawalEnabled}
                onValueChange={setWithdrawalEnabled}
                isDark={isDark}
              />
            </View>
          </ScrollView>
        ) : (
          <View style={styles.flex}>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Warnings Box */}
              <View style={[styles.warningBox, { backgroundColor: isDark ? '#1E1E22' : '#F5F5F7' }]}>

                <FastImage source={warningImg} style={{ width: 18, height: 18 }} resizeMode='contain' />

                <View style={styles.warningList}>
                  <AppText type={ELEVEN} style={[styles.warningPoint, { color: isDark ? '#D1D1D6' : '#4E4E54', }]}>
                    1. To keep your account secure, withdrawals and P2P activities will be restricted for 24 hours after updating your email.
                  </AppText>
                  <AppText type={ELEVEN} style={[styles.warningPoint, { color: isDark ? '#D1D1D6' : '#4E4E54', }]}>
                    2. If your current email is linked as your username, it will automatically switch to the newly updated email address.
                  </AppText>
                  <AppText type={ELEVEN} style={[styles.warningPoint, { color: isDark ? '#D1D1D6' : '#4E4E54', }]}>
                    3. Changes made to the primary account email will also sync with connected subaccounts. Separate subaccounts with independent email settings will remain unchanged.
                  </AppText>
                </View>
              </View>

              {/* New Email field */}
              <AppText type={FOURTEEN} weight={SEMI_BOLD} style={[styles.fieldLabel, { color: isDark ? '#FFFFFF' : '#1C1C1E' }]}>
                New Email
              </AppText>
              <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F7' }]}>
                <TextInput
                  style={[styles.textInput, { color: isDark ? '#FFFFFF' : '#1C1C1E' }]}
                  placeholder="Enter your new email address"
                  placeholderTextColor={isDark ? '#8A8A93' : '#9E9EAE'}
                  value={newEmail}
                  onChangeText={setNewEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* New Email Verification Code field */}
              <AppText type={FOURTEEN} weight={SEMI_BOLD} style={[styles.fieldLabel, { color: isDark ? '#FFFFFF' : '#1C1C1E' }]}>
                New Email Verification Code
              </AppText>
              <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F7', flexDirection: 'row', alignItems: 'center' }]}>
                <TextInput
                  style={[styles.textInput, { color: isDark ? '#FFFFFF' : '#1C1C1E', flex: 1 }]}
                  placeholder="Enter the verification code"
                  placeholderTextColor={isDark ? '#8A8A93' : '#9E9EAE'}
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleSendCode}
                  disabled={countdown > 0}
                  style={styles.sendBtn}
                >
                  <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: '#D1AA67' }}>
                    {countdown > 0 ? `${countdown}s` : 'Send'}
                  </AppText>
                </TouchableOpacity>
              </View>

              {/* Valid for 10 minutes */}
              <AppText type={TWELVE} style={[styles.validText, { color: isDark ? '#8A8A93' : '#9E9EAE' }]}>
                Valid for 10 minutes
              </AppText>
            </ScrollView>

            {/* Confirm Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleConfirmChange}
              style={[styles.confirmBtn, { backgroundColor: isDark ? '#FFFFFF' : '#22252A' }]}
            >
              <AppText
                type={SIXTEEN}
                weight={SEMI_BOLD}
                style={{ color: isDark ? '#000000' : '#FFFFFF' }}
              >
                Confirm
              </AppText>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      <RBSheet
        ref={confirmSheetRef}
        closeOnDragDown
        closeOnPressMask
        height={380}
        animationType="slide"
        openDuration={200}
        closeDuration={200}
        onClose={() => {
          if (shouldNavigateRef.current) {
            setCurrentStep('change_email');
            shouldNavigateRef.current = false;
          }
        }}
        customStyles={{
          container: {
            backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
          },
          wrapper: {
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
          },
          draggableIcon: {
            backgroundColor: isDark ? '#3A3A3C' : '#E5E5EA',
            width: 40,
            height: 5,
            borderRadius: 2.5,
            marginTop: 10,
          },
        }}
      >
        <View style={styles.sheetContent}>
          {/* Warning Robot Illustration with Backdrop */}
          <View style={[styles.robotContainer, { backgroundColor: isDark ? '#2A2A2F' : '#F2F2F7' }]}>
            <FastImage
              source={securityrisk}
              style={styles.robotImage}
              resizeMode="contain"
            />
          </View>

          {/* Title */}
          <AppText
            type={EIGHTEEN}
            weight={SEMI_BOLD}
            style={[styles.sheetTitle, { color: isDark ? '#FFFFFF' : '#1C1C1E' }]}
          >
            Are you sure you want to change your email?
          </AppText>

          {/* Description */}
          <AppText
            type={THIRTEEN}
            weight={MEDIUM}
            style={[styles.sheetDescription, { color: isDark ? '#8A8A93' : '#6B7280' }]}
          >
            To protect your account and assets, withdrawals and P2P transactions will be temporarily restricted for 24 hours after updating your email address.
          </AppText>

          {/* Buttons Row */}
          <View style={styles.btnRow}>
            {/* Cancel Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => confirmSheetRef.current?.close()}
              style={[styles.sheetBtn, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}
            >
              <AppText
                type={SIXTEEN}
                weight={SEMI_BOLD}
                style={{ color: isDark ? '#FFFFFF' : '#1C1C1E' }}
              >
                Cancel
              </AppText>
            </TouchableOpacity>

            {/* Continue Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                shouldNavigateRef.current = true;
                confirmSheetRef.current?.close();
              }}
              style={[styles.sheetBtn, { backgroundColor: isDark ? '#FFFFFF' : '#22252A' }]}
            >
              <AppText
                type={SIXTEEN}
                weight={SEMI_BOLD}
                style={{ color: isDark ? '#000000' : '#FFFFFF' }}
              >
                Continue
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </RBSheet>
    </AppSafeAreaView>
  );
};

export default AddEmailScreen;

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
    height: 20
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    textAlign: 'center',
  },
  scroll: {
    flex: 1
  },
  scrollContent: {
    paddingTop: 4,
    paddingBottom: 40
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 48,
  },
  chevronIcon: {
    width: 14,
    height: 14,
  },
  divider: {
    height: 1.5,
    width: '100%',
    marginVertical: 6,
  },
  descriptionContainer: {
    paddingHorizontal: 20,
    marginTop: 2,
    marginBottom: 10,
  },
  descriptionText: {
    lineHeight: 18,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 48,
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
  sheetContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  robotContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  robotImage: {
    width: 80,
    height: 80,
  },
  sheetTitle: {
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  sheetDescription: {
    textAlign: 'center',
    lineHeight: 20,
    // paddingHorizontal: 8,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 24,
  },
  sheetBtn: {
    width: '48%',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningBox: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
  },
  exclamationCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  warningList: {
    flex: 1,
  },
  warningPoint: {
    lineHeight: 16,
    marginBottom: 8,
    marginLeft: 5
  },
  fieldLabel: {
    marginHorizontal: 16,
    marginTop: 20,
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
  validText: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  confirmBtn: {
    height: 50,
    borderRadius: 25,
    marginHorizontal: 16,
    marginBottom: Platform.OS === 'ios' ? 16 : 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
});
