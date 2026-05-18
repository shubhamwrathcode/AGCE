import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from "../../../hooks/useTheme";
import { useAppSelector } from "../../../store/hooks";
import {
  AppSafeAreaView,
  AppText,
  BOLD,
  EIGHTEEN,
  SIXTEEN,
  MEDIUM,
  SEMI_BOLD,
} from '../../../shared';
import FastImage from 'react-native-fast-image';
import { back_ic, right_ic } from '../../../helper/ImageAssets';
import * as routes from '../../../navigation/routes';

const AddPhoneNumberScreen = () => {
  const navigation = useNavigation();
  const { colors: themeColors, isDark } = useTheme();
  const userData = useAppSelector((state) => state.auth.userData);

  // Mask helper matching the mockup screenshot
  const profileMobile = userData?.mobileNumber ?? userData?.mobile_number ?? '';

  const maskPhone = (phone) => {
    if (!phone) return '+91*****3';
    const cleaned = String(phone).replace(/\s/g, '');
    const isIndia = cleaned.startsWith("+91") || cleaned.startsWith("91");
    const prefix = isIndia ? "+91" : "";
    const digitsOnly = cleaned.replace(/^\+91|^91/, '');
    if (digitsOnly.length < 2) return '+91*****3';
    return `${prefix}*****${digitsOnly.slice(-1)}`;
  };

  const displayPhone = maskPhone(profileMobile);

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
              Phone Number
            </AppText>
          </View>
          <View style={{ width: 24 }} />
        </View>

        {/* Content List exactly matching screenshot */}
        <View style={{ paddingTop: 8 }}>
          {/* Phone Number Row */}
          <View style={styles.row}>
            <AppText type={SIXTEEN} weight={MEDIUM} style={{ color: isDark ? '#FFFFFF' : '#1A1A1C' }}>
              Phone Number
            </AppText>
            <AppText type={SIXTEEN} style={{ color: isDark ? '#8A8A93' : '#9E9EAE' }}>
              {displayPhone}
            </AppText>
          </View>

          {/* Change Email Row */}
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => {
              navigation.navigate(routes.PASSKEY_SECURITY_VERIFICATION_SCREEN);
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

          {/* Unlink Phone Number Row */}
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => {
              navigation.navigate(routes.UNLINK_PHONE_NUMBER_SCREEN);
            }}
          >
            <AppText type={SIXTEEN} weight={MEDIUM} style={{ color: isDark ? '#FFFFFF' : '#1A1A1C' }}>
              Unlink Phone Number
            </AppText>
            <FastImage
              source={right_ic}
              style={styles.chevronIcon}
              tintColor={isDark ? '#8A8A93' : '#9E9EAE'}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </AppSafeAreaView>
  );
};

export default AddPhoneNumberScreen;

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
});
