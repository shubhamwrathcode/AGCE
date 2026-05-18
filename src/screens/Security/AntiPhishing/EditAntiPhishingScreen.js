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
import { back_ic, eye_open_icon, eye_close_icon } from '../../../helper/ImageAssets';
import { AppSafeAreaView, AppText, SEMI_BOLD, EIGHTEEN, FOURTEEN, SIXTEEN, TWELVE, BOLD, THIRTEEN, MEDIUM } from '../../../shared';
import AgceGoldCard from './AgceGoldCard';
import { showError, showSuccess } from '../../../helper/logger';
import { colors } from '../../../theme/colors';

const EditAntiPhishingScreen = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { colors: themeColors, isDark } = useTheme();
  const userData = useAppSelector(state => state.auth.userData);

  // States
  const [currentCode, setCurrentCode] = useState('');
  const [newCode, setNewCode] = useState('');
  const [otp, setOtp] = useState('');
  const [secureEntry, setSecureEntry] = useState(true);
  const [resendTimer, setResendTimer] = useState(0);
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timerRef = useRef(null);

  useEffect(() => {
    fetchStatus();
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

  const fetchStatus = async () => {
    // Simulated load
    setCurrentCode('123456');
  };

  const maskCode = (code) => {
    if (!code) return '12******';
    if (code.length <= 2) return `${code}******`;
    return `${code.slice(0, 2)}******`;
  };

  const handleSendOtp = async () => {
    setIsOtpLoading(true);
    setTimeout(() => {
      setResendTimer(60);
      showSuccess('Verification code sent successfully!');
      setIsOtpLoading(false);
    }, 500);
  };

  const handleConfirm = async () => {
    if (!newCode || newCode.length < 6 || newCode.length > 8) {
      showError('Anti-phishing code must be between 6 and 8 characters');
      return;
    }
    if (!otp || otp.length < 6) {
      showError('Please enter the 6-digit OTP verification code');
      return;
    }

    Keyboard.dismiss();
    setIsSubmitting(true);
    setTimeout(() => {
      showSuccess('Anti-phishing code updated successfully!');
      setIsSubmitting(false);
      navigation.goBack();
    }, 1000);
  };

  const userEmail = userData?.emailId || 'r***9@gmail.com';

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

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Reusable AGCE Gold Card */}
          <AgceGoldCard code="X X X X X X" isDark={isDark} />

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

          {/* New Code */}
          <AppText type={FOURTEEN} weight={SEMI_BOLD} style={[styles.fieldLabel, { color: isDark ? '#FFFFFF' : '#1C1C1E', marginTop: 20 }]}>
            New Anti-Phishing Code:
          </AppText>
          <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F7', flexDirection: 'row', alignItems: 'center' }]}>
            <TextInput
              style={[styles.textInput, { color: isDark ? '#FFFFFF' : '#1C1C1E', flex: 1 }]}
              placeholder="Please enter"
              placeholderTextColor={isDark ? '#8A8A93' : '#9E9EAE'}
              value={newCode}
              onChangeText={(val) => setNewCode(val.replace(/[^A-Za-z0-9_]/g, ''))}
              secureTextEntry={secureEntry}
              maxLength={8}
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

          {/* Code Sent To */}
          <AppText type={FOURTEEN} weight={SEMI_BOLD} style={[styles.fieldLabel, { color: isDark ? '#FFFFFF' : '#1C1C1E', marginTop: 20 }]}>
            Code sent to: {userEmail}
          </AppText>
          <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F7', flexDirection: 'row', alignItems: 'center' }]}>
            <TextInput
              style={[styles.textInput, { color: isDark ? '#FFFFFF' : '#1C1C1E', flex: 1 }]}
              placeholder="Please enter"
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
        </ScrollView>

        {/* Action Elements at the bottom */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleConfirm}
            disabled={isSubmitting}
            style={[styles.confirmBtn, { backgroundColor: isDark ? '#2E2E32' : '#22252A' }]}
          >
            <AppText
              type={SIXTEEN}
              weight={BOLD}
              style={{ color: '#FFFFFF' }}
            >
              {isSubmitting ? 'Confirming...' : 'Confirm'}
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.unableLink} activeOpacity={0.7}>
            <AppText weight={MEDIUM} type={THIRTEEN} style={styles.unableText}>
              Unable to Verify?
            </AppText>
          </TouchableOpacity>
        </View>
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
  sendBtn: {
    paddingLeft: 12,
    justifyContent: 'center',
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
