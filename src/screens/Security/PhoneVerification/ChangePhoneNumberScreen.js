import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from "../../../hooks/useTheme";
import {
  AppSafeAreaView,
  AppText,
  BOLD,
  EIGHTEEN,
  SIXTEEN,
  MEDIUM,
  ELEVEN,
  FOURTEEN,
  TWELVE,
  SEMI_BOLD,
} from '../../../shared';
import FastImage from 'react-native-fast-image';
import { back_ic, warningImg } from '../../../helper/ImageAssets';
import { colors } from '../../../theme/colors';
import { showSuccess, showError } from '../../../helper/logger';
import * as routes from '../../../navigation/routes';
import { useRoute } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { appOperation } from '../../../appOperation';
import { getUserProfile } from '../../../actions/accountActions';

const ChangePhoneNumberScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useAppDispatch();
  const { colors: themeColors, isDark } = useTheme();

  const userData = useAppSelector((state) => state.auth.userData);
  const isBinding = !userData?.mobileNumber && !userData?.mobile_number;

  const [newPhone, setNewPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef(null);

  // Extract upfront identity proof from SecurityVerification
  const {
    passkeyVerified,
    passkeyUserId,
    emailOtp,
    tofaCode,
  } = route.params || {};

  const handleSendCode = async () => {
    if (!newPhone) {
      showError('Please enter your new phone number first');
      return;
    }
    if (newPhone.length < 6) {
      showError('Please enter a valid phone number');
      return;
    }
    const fullPhone = `+91${newPhone}`; // Using static +91 for now as per UI
    if (countdown > 0) return;

    try {
      setIsLoading(true);
      const result = await appOperation.customer.securitySendOtp('new_mobile', 'change_mobile', fullPhone);
      if (result?.success) {
        showSuccess(result?.message || 'SMS code sent');
        setCountdown(60);
        timerRef.current = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timerRef.current);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        showError(result?.message || 'Failed to send SMS code');
      }
    } catch (error) {
      showError(error?.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!newPhone) {
      showError('Please enter your new phone number');
      return;
    }
    if (!verificationCode || verificationCode.length !== 6) {
      showError('Please enter the 6-digit verification code');
      return;
    }

    try {
      setIsLoading(true);
      const initData = {
        newMobileNumber: newPhone,
        newCountryCode: '+91', // Static for now as per UI
      };

      if (passkeyVerified) {
        initData.passkeyVerified = true;
        initData.passkeyUserId = passkeyUserId;
      } else if (tofaCode) {
        initData.tofaCode = tofaCode;
      } else if (emailOtp) {
        initData.currentEmailOtp = emailOtp;
      }

      const initResult = await appOperation.customer.securityMobileChangeInitiate(initData);
      if (!initResult?.success) {
        showError(initResult?.message || 'Failed to initiate mobile change');
        return;
      }

      const completeResult = await appOperation.customer.securityMobileChangeComplete({ newMobileOtp: verificationCode });
      if (completeResult?.success) {
        showSuccess(isBinding ? 'Phone number bound successfully' : (completeResult?.message || 'Mobile number updated successfully'));
        dispatch(getUserProfile());
        // Go back to the previous screen or Security Settings screen
        if (route.params?.fromScreen) {
          navigation.navigate(route.params.fromScreen);
        } else {
          navigation.navigate(routes.ACCOUNT_DETAILS_SCREEN);
        }
      } else {
        showError(completeResult?.message || 'Failed to complete mobile change');
      }
    } catch (error) {
      showError(error?.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
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
              {isBinding ? 'Bind Phone Number' : 'Change Phone Number'}
            </AppText>
          </View>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Warnings Box */}
          <View style={[styles.warningBox, { backgroundColor: isDark ? '#1E1E22' : '#F5F5F7' }]}>
            <FastImage source={warningImg} style={{ width: 18, height: 18, marginTop: 2 }} resizeMode="contain" />
            <View style={styles.warningList}>
              <AppText type={ELEVEN} style={[styles.warningPoint, { color: isDark ? '#D1D1D6' : '#4E4E54' }]}>
                1. To protect your account, withdrawals and P2P transactions will be restricted for 24 hours after updating your phone number.
              </AppText>
              <AppText type={ELEVEN} style={[styles.warningPoint, { color: isDark ? '#D1D1D6' : '#4E4E54' }]}>
                2. If your phone number is currently used as your username, it will automatically be replaced with the updated number.
              </AppText>
              <AppText type={ELEVEN} style={[styles.warningPoint, { color: isDark ? '#D1D1D6' : '#4E4E54' }]}>
                3. Phone number updates on the primary account will also sync across linked subaccounts. Separate subaccounts with independent settings will remain unchanged.
              </AppText>
            </View>
          </View>

          {/* New Phone Number Section */}
          <AppText type={FOURTEEN} weight={MEDIUM} style={[styles.fieldLabel, { color: isDark ? '#FFFFFF' : '#1A1A1C' }]}>
            {isBinding ? 'Phone Number' : 'New Phone Number'}
          </AppText>
          <View style={[styles.phoneInputContainer, { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F7' }]}>
            <TouchableOpacity style={styles.countryPicker} activeOpacity={0.8}>
              {/* Indian Flag Placeholder or Emoji */}
              <AppText style={{ fontSize: 18 }}>🇮🇳</AppText>
              <AppText type={FOURTEEN} weight={MEDIUM} style={[styles.countryCode, { color: isDark ? '#FFFFFF' : '#1C1C1E' }]}>
                +91
              </AppText>
              <AppText style={[styles.arrowDown, { color: isDark ? '#8A8A93' : '#9E9EAE' }]}>▼</AppText>
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: isDark ? '#2D2D30' : '#E5E5EA' }]} />
            <TextInput
              style={[styles.textInput, { color: isDark ? '#FFFFFF' : '#1C1C1E', flex: 1 }]}
              placeholder={isBinding ? "Enter your phone number" : "Enter your new phone number"}
              placeholderTextColor={isDark ? '#8A8A93' : '#9E9EAE'}
              keyboardType="number-pad"
              value={newPhone}
              onChangeText={(val) => setNewPhone(val.replace(/\D/g, ''))}
            />
          </View>

          {/* SMS Verification Code Section */}
          <AppText type={FOURTEEN} weight={MEDIUM} style={[styles.fieldLabel, { color: isDark ? '#FFFFFF' : '#1A1A1C' }]}>
            {isBinding ? 'SMS Verification Code' : 'New SMS Verification Code'}
          </AppText>
          <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F7', flexDirection: 'row', alignItems: 'center' }]}>
            <TextInput
              style={[styles.textInput, { color: isDark ? '#FFFFFF' : '#1C1C1E', flex: 1 }]}
              placeholder="Enter the verification code"
              placeholderTextColor={isDark ? '#8A8A93' : '#9E9EAE'}
              value={verificationCode}
              onChangeText={setVerificationCode}
              keyboardType="number-pad"
            />
            <TouchableOpacity
              onPress={handleSendCode}
              disabled={countdown > 0 || isLoading}
              style={styles.sendButton}
            >
              <AppText
                type={FOURTEEN}
                weight={MEDIUM}
                style={{ color: (countdown > 0 || isLoading) ? (isDark ? '#4E4E54' : '#C7C7CC') : colors.orangeTheme }}
              >
                {countdown > 0 ? `${countdown}s` : 'Send'}
              </AppText>
            </TouchableOpacity>
          </View>

          {/* Valid for 10 minutes */}
          <AppText type={TWELVE} style={[styles.validText, { color: isDark ? '#8A8A93' : '#9E9EAE' }]}>
            Valid for 10 minutes
          </AppText>
        </ScrollView>

        {/* Bottom anchored Confirm Button */}
        <View style={styles.bottomWrapper}>
          <TouchableOpacity
            style={[styles.confirmButton, { backgroundColor: isDark ? '#2E2E32' : '#2A2A2E' }]}
            activeOpacity={0.8}
            onPress={handleConfirm}
            disabled={isLoading}
          >
            <AppText type={SIXTEEN} weight={BOLD} style={{ color: '#FFFFFF' }}>
              {isLoading ? 'Processing...' : 'Confirm'}
            </AppText>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </AppSafeAreaView>
  );
};

export default ChangePhoneNumberScreen;

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
  warningBox: {
    flexDirection: 'row',
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  warningList: {
    flex: 1,
    marginLeft: 8,
  },
  warningPoint: {
    lineHeight: 16,
    marginBottom: 8,
  },
  fieldLabel: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  countryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  countryCode: {
    marginLeft: 6,
  },
  arrowDown: {
    fontSize: 8,
    marginLeft: 4,
  },
  divider: {
    width: 1,
    height: 20,
    marginHorizontal: 8,
  },
  inputContainer: {
    height: 48,
    borderRadius: 8,
    marginHorizontal: 16,
    paddingHorizontal: 12,
  },
  textInput: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    paddingVertical: 0,
  },
  sendButton: {
    paddingLeft: 10,
    justifyContent: 'center',
  },
  validText: {
    marginHorizontal: 16,
    marginTop: 8,
    marginLeft: 19,
  },
  bottomWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  confirmButton: {
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
});
