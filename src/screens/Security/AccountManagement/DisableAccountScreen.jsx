import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../hooks/useTheme';
import {
  AppSafeAreaView,
  AppText,
  EIGHTEEN,
  SEMI_BOLD,
  FOURTEEN,
  MEDIUM,
  SIXTEEN,
  THIRTEEN,
} from '../../../shared';
import FastImage from 'react-native-fast-image';
import { back_ic, account_restrictions, Polygon, disableAccount } from '../../../helper/ImageAssets';
import { colors } from '../../../theme/colors';
import * as routes from '../../../navigation/routes';

const DisableAccountScreen = () => {
  const navigation = useNavigation();
  const { colors: themeColors, isDark } = useTheme();

  return (
    <AppSafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#121214' : colors.white }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.goBack()}
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
          Disable Account
        </AppText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Illustration */}
        <View style={styles.illustrationContainer}>
          <FastImage
            source={disableAccount}
            style={styles.illustration}
            resizeMode="contain"
          />
        </View>

        {/* Text */}
        <AppText type={FOURTEEN} weight={MEDIUM} style={[styles.description, { color: themeColors.text }]}>
          Please be aware of the following impacts on your account once it is disabled:
        </AppText>

        <View style={styles.bulletList}>
          <View style={styles.bulletItem}>
            <FastImage
              source={Polygon}
              style={{ width: 12, height: 12, marginTop: 5, marginRight: 10 }}
              resizeMode="contain"
            />
            <AppText type={THIRTEEN} weight={MEDIUM} style={[styles.bulletText, { color: themeColors.text }]}>
              Any pending withdrawal requests will be canceled.
            </AppText>
          </View>
          <View style={styles.bulletItem}>
            <FastImage
              source={Polygon}
              style={{ width: 12, height: 12, marginTop: 5, marginRight: 10 }}
              resizeMode="contain"
            />
            <AppText type={THIRTEEN} weight={MEDIUM} style={[styles.bulletText, { color: themeColors.text }]}>
              All trading features on your account will be disabled.
            </AppText>
          </View>
          <View style={styles.bulletItem}>
            <FastImage
              source={Polygon}
              style={{ width: 12, height: 12, marginTop: 5, marginRight: 10 }}
              resizeMode="contain"
            />
            <AppText type={THIRTEEN} weight={MEDIUM} style={[styles.bulletText, { color: themeColors.text }]}>
              All API keys linked to your account will be removed.
            </AppText>
          </View>
          <View style={styles.bulletItem}>
            <FastImage
              source={Polygon}
              style={{ width: 12, height: 12, marginTop: 5, marginRight: 10 }}
              resizeMode="contain"
            />
            <AppText type={THIRTEEN} weight={MEDIUM} style={[styles.bulletText, { color: themeColors.text }]}>
              Your identity verification details will be retained and not deleted.
            </AppText>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.disableBtn, { backgroundColor: isDark ? '#2E2E32' : '#2A2A2E' }]}
          activeOpacity={0.8}
          onPress={() => navigation.navigate(routes.DISABLE_ACCOUNT_VERIFY_SCREEN)}
        >
          <AppText type={SIXTEEN} weight={SEMI_BOLD} style={{ color: '#FFFFFF' }}>
            Disable Account
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
    paddingHorizontal: 12,
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
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  illustration: {
    width: 160,
    height: 160,
  },
  description: {
    lineHeight: 20,
    marginBottom: 20,
  },
  bulletList: {
    marginTop: 8,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  bulletPoint: {
    width: 12,
    height: 12,
    marginTop: 4,
    marginRight: 10,
    borderRadius: 2, // Slightly rounded hexagon shape approximation
    transform: [{ rotate: '45deg' }],
  },
  bulletText: {
    flex: 1,
    lineHeight: 20,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 34 : 24,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
  },
  disableBtn: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
});

export default DisableAccountScreen;
