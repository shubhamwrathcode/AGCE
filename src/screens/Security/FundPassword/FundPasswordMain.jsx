import React, { useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useTheme } from '../../../hooks/useTheme';
import NavigationService from '../../../navigation/NavigationService';
import FastImage from 'react-native-fast-image';
import RBSheet from 'react-native-raw-bottom-sheet';
import {
  AppSafeAreaView,
  AppText,
  BOLD,
  FOURTEEN,
  SIXTEEN,
  SEMI_BOLD,
  TWELVE,
  EIGHTEEN,
  THIRTEEN,
  MEDIUM,
  TWENTY,
  FIFTEEN,
} from '../../../shared';
import { back_ic, right_ic, securityrisk, warningImg } from '../../../helper/ImageAssets';
import { colors } from '../../../theme/colors';
import * as routes from '../../../navigation/routes';

const FundPasswordMain = () => {
  const { colors: themeColors, isDark } = useTheme();
  const sheetRef = useRef(null);

  const MenuItem = ({ label, value, onPress }) => (
    <TouchableOpacity
      style={[styles.menuItem, { borderBottomColor: isDark ? '#2C2C2E' : '#F0F0F0' }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={{ flex: 1 }}>
        <AppText type={FIFTEEN} weight={MEDIUM} style={{ color: themeColors.text }}>
          {label}
        </AppText>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {value && (
          <AppText type={THIRTEEN} style={{ color: isDark ? '#8A8A93' : '#8E8E93', marginRight: 8 }}>
            {value}
          </AppText>
        )}
        <FastImage
          source={right_ic}
          style={{ width: 12, height: 12 }}
          tintColor={isDark ? '#8A8A93' : '#C1C1C1'}
          resizeMode="contain"
        />
      </View>
    </TouchableOpacity>
  );

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
          Set fund password
        </AppText>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View>
          <MenuItem
            label="Change Fund Password"
            value="Change"
            onPress={() => sheetRef.current?.open()}
          />
          <MenuItem label="Reset Fund Password" value="Reset" />
          <MenuItem label="Input Frequency" value="Never" />
        </View>
      </View>

      {/* Bottom Buttons Container */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.confirmButton, { backgroundColor: isDark ? '#FFFFFF' : '#2A2A2E' }]}
          activeOpacity={0.8}
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

      {/* RBSheet prompt for confirmation */}
      <RBSheet
        ref={sheetRef}
        height={380}
        closeOnDragDown={true}
        closeOnPressMask={true}
        customStyles={{
          container: {
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
          },
          wrapper: { backgroundColor: 'rgba(0,0,0,0.5)' },
          draggableIcon: { backgroundColor: isDark ? '#3A3A3C' : '#E5E5EA', width: 40 },
        }}
      >
        <View style={styles.sheetContainer}>
          <FastImage
            source={securityrisk}
            style={styles.sheetRobotIcon}
            resizeMode="contain"
          />
          <AppText
            type={TWENTY}
            weight={SEMI_BOLD}
            style={[styles.sheetTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}
          >
            Are you sure you want to change the fund password?
          </AppText>
          <AppText
            type={THIRTEEN}
            weight={MEDIUM}
            style={[styles.sheetSubtitle, { color: isDark ? '#8A8A93' : '#8E8E93' }]}
          >
            To protect your account and assets, withdrawals and P2P transactions will be temporarily restricted for 24 hours after updating your email address.
          </AppText>
          <View style={styles.sheetButtonRow}>
            <TouchableOpacity
              style={[styles.sheetCancelBtn, { backgroundColor: isDark ? '#2A2A2E' : '#F5F5F7' }]}
              onPress={() => sheetRef.current?.close()}
            >
              <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: isDark ? '#FFFFFF' : '#000000' }}>
                Cancel
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sheetContinueBtn, { backgroundColor: isDark ? '#FFFFFF' : '#2A2A2E' }]}
              onPress={() => {
                sheetRef.current?.close();
                NavigationService.navigate(routes.CHANGE_FUND_PASSWORD_SCREEN);
              }}
            >
              <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: isDark ? '#000000' : '#FFFFFF' }}>
                Continue
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </RBSheet>
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
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,

  },
  bottomContainer: {
    paddingHorizontal: 13,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    alignItems: 'center',
  },
  confirmButton: {
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
  sheetContainer: {
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    alignItems: 'center',
  },
  sheetRobotIcon: {
    width: 90,
    height: 90,
    marginBottom: 16,
  },
  sheetTitle: {
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 10,
  },
  sheetSubtitle: {
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  sheetButtonRow: {
    flexDirection: 'row',
    width: '100%',
  },
  sheetCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  sheetContinueBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
});

export default FundPasswordMain;
