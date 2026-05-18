import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Modal,
  Pressable,
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
  SEMI_BOLD,
  FOURTEEN,
  TWELVE,
  THIRTEEN,
} from '../../../shared';
import ToggleSwitch from '../../../common/ToggleSwitch';
import FastImage from 'react-native-fast-image';
import { back_ic, eye_open_icon, eye_close_icon } from '../../../helper/ImageAssets';
import * as routes from '../../../navigation/routes';

const WithdrawalSettingsScreen = () => {
  const navigation = useNavigation();
  const { colors: themeColors, isDark } = useTheme();

  // Settings states
  const [emailVerify, setEmailVerify] = useState(true);
  const [smsVerify, setSmsVerify] = useState(true);
  const [fundPassword, setFundPassword] = useState(true);

  // Bottom Sheet state
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);
  const [enteredPassword, setEnteredPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [activeToggleTarget, setActiveToggleTarget] = useState(null); // track which row opened the modal

  const handleToggleSwitch = (type, value) => {
    setActiveToggleTarget(type);
    if (type === 'emailVerify') {
      navigation.navigate(routes.WITHDRAWAL_VERIFY_EMAIL_SCREEN);
    } else if (type === 'smsVerify') {
      navigation.navigate(routes.WITHDRAWAL_VERIFY_PHONE_SCREEN);
    } else if (type === 'fundPassword') {
      setIsBottomSheetVisible(true);
    }
  };

  const handleConfirmVerification = () => {
    setIsBottomSheetVisible(false);
    setEnteredPassword('');
    // Confirming Fund Password sheet simply completes the toggle
    setFundPassword(!fundPassword);
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
              Withdrawal Settings
            </AppText>
          </View>
          <View style={{ width: 24 }} />
        </View>

        {/* Content Settings List */}
        <View style={styles.scroll}>

          {/* Row 3: Email verification */}
          <View style={styles.settingRow}>
            <View style={styles.textContainer}>
              <AppText type={SIXTEEN} weight={MEDIUM} style={{ color: isDark ? '#FFFFFF' : '#1A1A1C' }}>
                Email verification
              </AppText>
            </View>
            <ToggleSwitch
              value={emailVerify}
              onValueChange={(val) => {
                setEmailVerify(val);
                handleToggleSwitch('emailVerify', val);
              }}
              isDark={isDark}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: isDark ? '#1E1E22' : '#F5F5FA' }]} />

          {/* Row 4: SMS Verification */}
          <View style={styles.settingRow}>
            <View style={styles.textContainer}>
              <AppText type={SIXTEEN} weight={MEDIUM} style={{ color: isDark ? '#FFFFFF' : '#1A1A1C' }}>
                SMS Verification
              </AppText>
            </View>
            <ToggleSwitch
              value={smsVerify}
              onValueChange={(val) => {
                setSmsVerify(val);
                handleToggleSwitch('smsVerify', val);
              }}
              isDark={isDark}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: isDark ? '#1E1E22' : '#F5F5FA' }]} />

          {/* Row 5: Fund Password */}
          <View style={styles.settingRow}>
            <View style={styles.textContainer}>
              <AppText type={SIXTEEN} weight={MEDIUM} style={{ color: isDark ? '#FFFFFF' : '#1A1A1C' }}>
                Fund Password
              </AppText>
            </View>
            <ToggleSwitch
              value={fundPassword}
              onValueChange={(val) => {
                setFundPassword(val);
                handleToggleSwitch('fundPassword', val);
              }}
              isDark={isDark}
            />
          </View>
        </View>

        {/* Verification Bottom Sheet Modal exactly matching mockup */}
        <Modal
          visible={isBottomSheetVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsBottomSheetVisible(false)}
        >
          <Pressable
            style={styles.backdrop}
            onPress={() => setIsBottomSheetVisible(false)}
          >
            <Pressable style={[styles.bottomSheet, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
              {/* Grab Bar handle */}
              <View style={[styles.grabBar, { backgroundColor: isDark ? '#4E4E54' : '#E5E5EA' }]} />

              {/* Title & Close */}
              <View style={styles.sheetHeader}>
                <AppText type={EIGHTEEN} weight={SEMI_BOLD} style={{ color: isDark ? '#FFFFFF' : '#000000' }}>
                  Verification
                </AppText>
                <TouchableOpacity
                  onPress={() => setIsBottomSheetVisible(false)}
                  style={styles.closeBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <AppText type={EIGHTEEN} style={{ color: isDark ? '#8A8A93' : '#8E8E93' }}>✕</AppText>
                </TouchableOpacity>
              </View>

              {/* Label */}
              <AppText type={FOURTEEN} weight={MEDIUM} style={[styles.fieldLabel, { color: isDark ? '#FFFFFF' : '#1C1C1E' }]}>
                Fund Password
              </AppText>

              {/* Input container */}
              <View style={[styles.inputContainer, { backgroundColor: isDark ? '#2D2D30' : '#F2F2F7' }]}>
                <TextInput
                  style={[styles.textInput, { color: isDark ? '#FFFFFF' : '#000000', flex: 1 }]}
                  placeholder="Fund Password"
                  placeholderTextColor={isDark ? '#8A8A93' : '#9E9EAE'}
                  secureTextEntry={!isPasswordVisible}
                  value={enteredPassword}
                  onChangeText={setEnteredPassword}
                />
                <TouchableOpacity
                  onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                  style={styles.eyeBtn}
                >
                  <FastImage
                    source={isPasswordVisible ? eye_open_icon : eye_close_icon}
                    style={styles.eyeIcon}
                    tintColor={isDark ? '#8A8A93' : '#9E9EAE'}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>

              {/* Forgot link */}
              <TouchableOpacity activeOpacity={0.7} style={styles.forgotLink}>
                <AppText type={TWELVE} style={{ color: isDark ? '#8A8A93' : '#8E8E93', textDecorationLine: 'underline' }}>
                  Forgot Password
                </AppText>
              </TouchableOpacity>

              {/* Confirm Button */}
              <TouchableOpacity
                style={[styles.sheetConfirmButton, { backgroundColor: isDark ? '#2E2E32' : '#2A2A2E' }]}
                activeOpacity={0.8}
                onPress={handleConfirmVerification}
              >
                <AppText type={SIXTEEN} weight={BOLD} style={{ color: '#FFFFFF' }}>
                  Confirm
                </AppText>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>

      </KeyboardAvoidingView>
    </AppSafeAreaView>
  );
};

export default WithdrawalSettingsScreen;

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
    paddingTop: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  textContainer: {
    flex: 1,
    paddingRight: 16,
  },
  subtext: {
    marginTop: 4,
    lineHeight: 16,
  },
  turnOnButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  divider: {
    height: 1,
    marginHorizontal: 20,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginTop: 8,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  grabBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  closeBtn: {
    padding: 4,
  },
  fieldLabel: {
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  textInput: {
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
  forgotLink: {
    alignSelf: 'flex-start',
    marginBottom: 28,
  },
  sheetConfirmButton: {
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
});
