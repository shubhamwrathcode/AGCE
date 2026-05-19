import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useTheme } from '../../../hooks/useTheme';
import NavigationService from '../../../navigation/NavigationService';
import FastImage from 'react-native-fast-image';
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
} from '../../../shared';
import { back_ic, right_ic } from '../../../helper/ImageAssets';
import { colors } from '../../../theme/colors';

const FundPasswordMain = () => {
  const { colors: themeColors, isDark } = useTheme();

  const MenuItem = ({ label, value, onPress }) => (
    <TouchableOpacity
      style={[styles.menuItem, { borderBottomColor: isDark ? '#2C2C2E' : '#F0F0F0' }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={{ flex: 1 }}>
        <AppText type={SIXTEEN} weight={MEDIUM} style={{ color: themeColors.text }}>
          {label}
        </AppText>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {value && (
          <AppText type={FOURTEEN} style={{ color: isDark ? '#8A8A93' : '#8E8E93', marginRight: 8 }}>
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
        <View style={styles.menuList}>
          <MenuItem label="Change Fund Password" value="Change" />
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
    paddingHorizontal: 15,
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
    paddingHorizontal: 15,
    paddingTop: 16,
  },
  menuList: {
    marginTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  bottomContainer: {
    paddingHorizontal: 15,
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
});

export default FundPasswordMain;
