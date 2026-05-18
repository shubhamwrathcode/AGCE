import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from "../../hooks/useTheme";
import {
  AppSafeAreaView,
  AppText,
  SEMI_BOLD,
  EIGHTEEN,
  SIXTEEN,
  MEDIUM,
} from '../../shared';
import FastImage from 'react-native-fast-image';
import { back_ic } from '../../helper/ImageAssets';

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
  const { colors: themeColors, isDark } = useTheme();

  // Switch states based on mockup screenshot
  const [googleAuth, setGoogleAuth] = useState(false);
  const [smsVerification, setSmsVerification] = useState(false);
  const [emailVerification, setEmailVerification] = useState(true);
  const [authenticator, setAuthenticator] = useState(false);

  return (
    <AppSafeAreaView style={{ backgroundColor: isDark ? '#121214' : '#FFFFFF', flex: 1 }}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header with SEMI_BOLD font weight exactly as requested */}
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
              Login 2-Step Verification
            </AppText>
          </View>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Google Authenticator Switch Row */}
          <View style={styles.switchRow}>
            <AppText type={SIXTEEN} weight={MEDIUM} style={{ color: isDark ? '#FFFFFF' : '#1A1A1C' }}>
              Google Authenticator
            </AppText>
            <ToggleSwitch
              value={googleAuth}
              onValueChange={setGoogleAuth}
              isDark={isDark}
            />
          </View>

          {/* SMS Verification Switch Row */}
          <View style={styles.switchRow}>
            <AppText type={SIXTEEN} weight={MEDIUM} style={{ color: isDark ? '#FFFFFF' : '#1A1A1C' }}>
              SMS verification
            </AppText>
            <ToggleSwitch
              value={smsVerification}
              onValueChange={setSmsVerification}
              isDark={isDark}
            />
          </View>

          {/* Email Verification Switch Row */}
          <View style={styles.switchRow}>
            <AppText type={SIXTEEN} weight={MEDIUM} style={{ color: isDark ? '#FFFFFF' : '#1A1A1C' }}>
              Email verification
            </AppText>
            <ToggleSwitch
              value={emailVerification}
              onValueChange={setEmailVerification}
              isDark={isDark}
            />
          </View>

          {/* Authenticator Switch Row */}
          <View style={styles.switchRow}>
            <AppText type={SIXTEEN} weight={MEDIUM} style={{ color: isDark ? '#FFFFFF' : '#1A1A1C' }}>
              Authenticator
            </AppText>
            <ToggleSwitch
              value={authenticator}
              onValueChange={setAuthenticator}
              isDark={isDark}
            />
          </View>
        </ScrollView>
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
});
