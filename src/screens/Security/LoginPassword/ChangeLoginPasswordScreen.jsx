import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  Keyboard,
} from 'react-native';
import { useTheme } from '../../../hooks/useTheme';
import NavigationService from '../../../navigation/NavigationService';
import FastImage from 'react-native-fast-image';
import {
  AppSafeAreaView,
  AppText,
  SIXTEEN,
  SEMI_BOLD,
  EIGHTEEN,
  MEDIUM,
  FOURTEEN,
  TWELVE,
  Input,
} from '../../../shared';
import { back_ic, checkIc } from '../../../helper/ImageAssets';
import { colors } from '../../../theme/colors';
import * as routes from '../../../navigation/routes';

const ChangeLoginPasswordScreen = () => {
  const { colors: themeColors, isDark } = useTheme();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // Validation checks (kept for the checklists visual representation):
  const checkLength = newPassword.length >= 6 && newPassword.length <= 8;
  const checkPattern = newPassword.length > 0 && /^[A-Za-z0-9_]+$/.test(newPassword);
  const checkNotAllSame = (() => {
    if (newPassword.length === 0) return false;
    const firstChar = newPassword[0];
    for (let i = 1; i < newPassword.length; i++) {
      if (newPassword[i] !== firstChar) return true;
    }
    return false;
  })();

  const allSatisfied = checkLength && checkPattern && checkNotAllSame;

  const handleConfirm = () => {
    Keyboard.dismiss();
    NavigationService.navigate(routes.RESET_YOUR_PASSWORD_SCREEN);
  };

  const handleForgotPassword = () => {
    NavigationService.navigate(routes.FORGOT_PASSWORD_SCREEN);
  };

  const renderCheckItem = (label, isValid) => {
    const activeColor = allSatisfied ? themeColors.text : (isDark ? '#4CD964' : '#34C759');
    return (
      <View style={styles.checkItem}>
        <FastImage
          source={checkIc}
          style={[styles.checkIcon, { tintColor: isValid ? activeColor : '#C1C1C1' }]}
          resizeMode="contain"
        />
        <AppText
          type={TWELVE}
          weight={MEDIUM}
          style={[
            styles.checkText,
            { color: isValid ? activeColor : (isDark ? '#8A8A93' : '#8E8E93') }
          ]}
        >
          {label}
        </AppText>
      </View>
    );
  };

  return (
    <AppSafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#121214' : colors.white }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => NavigationService.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <FastImage
            source={back_ic}
            tintColor={isDark ? colors.white : colors.black}
            style={{ width: 18, height: 18 }}
            resizeMode='contain'
          />
        </TouchableOpacity>

        <AppText type={EIGHTEEN} weight={SEMI_BOLD} style={[styles.headerTitle, { color: themeColors.text }]}>
          Change Login Password
        </AppText>
        <View style={{ width: 24 }} />
      </View>

      {/* Content ScrollView */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Old Password field */}
        <View style={styles.inputGroup}>
          <AppText type={FOURTEEN} weight={MEDIUM} style={[styles.label, { color: themeColors.text }]}>
            Old password
          </AppText>
          <Input
            placeholder="Please enter old password"
            placeholderTextColor={isDark ? '#8A8A93' : '#A9A9B2'}
            secureTextEntry={!showOldPass}
            isSecure={true}
            onPressVisible={() => setShowOldPass(!showOldPass)}
            value={oldPassword}
            onChangeText={setOldPassword}
            containerStyle={{ backgroundColor: isDark ? '#1C1C1E' : '#F5F5F7' }}
          />
        </View>

        {/* New Password field */}
        <View style={styles.inputGroup}>
          <AppText type={FOURTEEN} weight={MEDIUM} style={[styles.label, { color: themeColors.text }]}>
            New password
          </AppText>
          <Input
            placeholder="Please enter new password"
            placeholderTextColor={isDark ? '#8A8A93' : '#A9A9B2'}
            secureTextEntry={!showNewPass}
            isSecure={true}
            onPressVisible={() => setShowNewPass(!showNewPass)}
            value={newPassword}
            onChangeText={setNewPassword}
            containerStyle={{ backgroundColor: isDark ? '#1C1C1E' : '#F5F5F7' }}
          />

          {/* Validation Checklist */}
          <View style={styles.checklistContainer}>
            {renderCheckItem("6–8 characters", checkLength)}
            {renderCheckItem("Only letters, digits or underscore (A-Z, a-z, 0-9, _)", checkPattern)}
            {renderCheckItem("Characters cannot be all the same", checkNotAllSame)}
          </View>
        </View>

        {/* Confirm Password field */}
        <View style={styles.inputGroup}>
          <AppText type={FOURTEEN} weight={MEDIUM} style={[styles.label, { color: themeColors.text }]}>
            Confirm password
          </AppText>
          <Input
            placeholder="Please re-enter new password"
            placeholderTextColor={isDark ? '#8A8A93' : '#A9A9B2'}
            secureTextEntry={!showConfirmPass}
            isSecure={true}
            onPressVisible={() => setShowConfirmPass(!showConfirmPass)}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            containerStyle={{ backgroundColor: isDark ? '#1C1C1E' : '#F5F5F7' }}
          />
        </View>
      </ScrollView>

      {/* Bottom Confirm Button & Forgot Password Link - Hidden when keyboard is open */}
      {!isKeyboardVisible && (
        <View style={[styles.bottomContainer, { backgroundColor: isDark ? '#121214' : colors.white }]}>
          <TouchableOpacity
            style={[styles.confirmBtn, { backgroundColor: isDark ? '#2E2E32' : '#2A2A2E' }]}
            activeOpacity={0.8}
            onPress={handleConfirm}
          >
            <AppText type={SIXTEEN} weight={SEMI_BOLD} style={{ color: '#FFFFFF' }}>
              Confirm
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.forgotLink} activeOpacity={0.7} onPress={handleForgotPassword}>
            <AppText
              type={FOURTEEN}
              weight={MEDIUM}
              style={[styles.forgotText, { color: isDark ? '#FFFFFF' : '#000000' }]}
            >
              Forgot password
            </AppText>
          </TouchableOpacity>
        </View>
      )}
    </AppSafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 13,
    height: Platform.OS === 'ios' ? 44 : 56,
  },
  headerBtn: {
    padding: 6,
    marginLeft: -4,
  },
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: -1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 160,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
  },
  checklistContainer: {
    marginTop: 12,
    gap: 8,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIcon: {
    width: 14,
    height: 14,
    marginRight: 8,
  },
  checkText: {
    lineHeight: 16,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 15,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    paddingTop: 16,
    alignItems: 'center',
  },
  confirmBtn: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 16,
  },
  forgotLink: {
    paddingVertical: 4,
  },
  forgotText: {
    textDecorationLine: 'underline',
  },
});

export default ChangeLoginPasswordScreen;
