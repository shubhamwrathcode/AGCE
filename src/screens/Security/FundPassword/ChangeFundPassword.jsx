import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, TextInput } from 'react-native';
import { useTheme } from '../../../hooks/useTheme';
import NavigationService from '../../../navigation/NavigationService';
import FastImage from 'react-native-fast-image';
import {
  AppSafeAreaView,
  AppText,
  SIXTEEN,
  SEMI_BOLD,
  EIGHTEEN,
  THIRTEEN,
  MEDIUM,
  FOURTEEN,
} from '../../../shared';
import { back_ic, eye_open_icon, eye_close_icon } from '../../../helper/ImageAssets';
import { colors } from '../../../theme/colors';
import * as routes from '../../../navigation/routes';

const ChangeFundPassword = () => {
  const { colors: themeColors, isDark } = useTheme();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordAgain, setNewPasswordAgain] = useState('');
  const [emailCode, setEmailCode] = useState('');

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showPass1, setShowPass1] = useState(false);
  const [showPass2, setShowPass2] = useState(false);

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
          Change fund password
        </AppText>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        
        {/* Current Password field */}
        <View style={styles.inputGroup}>
          <AppText type={FOURTEEN} weight={MEDIUM} style={[styles.label, { color: themeColors.text }]}>
            Current password
          </AppText>
          <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F7' }]}>
            <TextInput
              style={[styles.input, { color: themeColors.text }]}
              placeholder="Please enter"
              placeholderTextColor={isDark ? '#8A8A93' : '#A9A9B2'}
              secureTextEntry={!showCurrentPass}
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
            <TouchableOpacity onPress={() => setShowCurrentPass(!showCurrentPass)} style={styles.eyeBtn}>
              <FastImage
                source={showCurrentPass ? eye_open_icon : eye_close_icon}
                style={styles.eyeIcon}
                tintColor={isDark ? '#8A8A93' : '#8E8E93'}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* New Password field */}
        <View style={styles.inputGroup}>
          <AppText type={FOURTEEN} weight={MEDIUM} style={[styles.label, { color: themeColors.text }]}>
            New password
          </AppText>
          <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F7' }]}>
            <TextInput
              style={[styles.input, { color: themeColors.text }]}
              placeholder="Please enter"
              placeholderTextColor={isDark ? '#8A8A93' : '#A9A9B2'}
              secureTextEntry={!showPass1}
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TouchableOpacity onPress={() => setShowPass1(!showPass1)} style={styles.eyeBtn}>
              <FastImage
                source={showPass1 ? eye_open_icon : eye_close_icon}
                style={styles.eyeIcon}
                tintColor={isDark ? '#8A8A93' : '#8E8E93'}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* New Password Again field */}
        <View style={styles.inputGroup}>
          <AppText type={FOURTEEN} weight={MEDIUM} style={[styles.label, { color: themeColors.text }]}>
            New password again
          </AppText>
          <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F7' }]}>
            <TextInput
              style={[styles.input, { color: themeColors.text }]}
              placeholder="Please enter"
              placeholderTextColor={isDark ? '#8A8A93' : '#A9A9B2'}
              secureTextEntry={!showPass2}
              value={newPasswordAgain}
              onChangeText={setNewPasswordAgain}
            />
            <TouchableOpacity onPress={() => setShowPass2(!showPass2)} style={styles.eyeBtn}>
              <FastImage
                source={showPass2 ? eye_open_icon : eye_close_icon}
                style={styles.eyeIcon}
                tintColor={isDark ? '#8A8A93' : '#8E8E93'}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Email Verification Code field */}
        <View style={styles.inputGroup}>
          <AppText type={FOURTEEN} weight={MEDIUM} style={[styles.label, { color: themeColors.text }]}>
            Email verification code
          </AppText>
          <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F7' }]}>
            <TextInput
              style={[styles.input, { color: themeColors.text }]}
              placeholder="Please enter"
              placeholderTextColor={isDark ? '#8A8A93' : '#A9A9B2'}
              keyboardType="number-pad"
              value={emailCode}
              onChangeText={setEmailCode}
            />
            <TouchableOpacity activeOpacity={0.8} style={styles.sendBtn}>
              <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: colors.orangeTheme }}>
                Send
              </AppText>
            </TouchableOpacity>
          </View>
        </View>

      </View>

      {/* Confirm Button & Unable to Verify Link */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.confirmBtn, { backgroundColor: isDark ? '#FFFFFF' : '#2A2A2E' }]}
          activeOpacity={0.8}
          onPress={() => NavigationService.navigate(routes.PASSKEY_SECURITY_VERIFICATION_SCREEN, { targetScreen: routes.FUND_PASSWORD_MAIN_SCREEN })}
        >
          <AppText type={SIXTEEN} weight={SEMI_BOLD} style={{ color: isDark ? '#000000' : '#FFFFFF' }}>
            Confirm
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.unableLink} activeOpacity={0.7}>
          <AppText
            type={FOURTEEN}
            weight={MEDIUM}
            style={[styles.unableText, { color: isDark ? '#FFFFFF' : '#000000' }]}
          >
            Unable to Verify?
          </AppText>
        </TouchableOpacity>
      </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
  },
  inputContainer: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    paddingVertical: 0,
  },
  eyeBtn: {
    padding: 4,
  },
  eyeIcon: {
    width: 20,
    height: 20,
  },
  sendBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  bottomContainer: {
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
    marginBottom: 20,
  },
  unableLink: {
    paddingVertical: 4,
  },
  unableText: {
    textDecorationLine: 'underline',
  },
});

export default ChangeFundPassword;
