import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useTheme } from "../../../hooks/useTheme";
import { useAppDispatch } from "../../../store/hooks";
import {
  AppSafeAreaView,
  AppText,
  SEMI_BOLD,
  EIGHTEEN,
  SIXTEEN,
  FOURTEEN,
  THIRTEEN,
  TWELVE,
  BOLD,
  MEDIUM,
  NORMAL,
} from '../../../shared';
import FastImage from 'react-native-fast-image';
import { antiphisinglock, back_ic, lock_ic, right_ic } from '../../../helper/ImageAssets';
import * as routes from '../../../navigation/routes';
import AgceGoldCard from './AgceGoldCard';

const AntiPhishingStatus = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const dispatch = useAppDispatch();
  const { colors: themeColors, isDark } = useTheme();

  const [hasCode, setHasCode] = useState(true);
  const [currentCode, setCurrentCode] = useState('123456');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // API Call removed as requested for pure UI testing
  }, [isFocused]);

  return (
    <AppSafeAreaView style={{ backgroundColor: isDark ? '#121214' : '#FFFFFF', flex: 1 }}>
      {/* Header Title dynamically changes based on active state exactly like mockup */}
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
            {hasCode ? 'Anti-Phishing Code Setting' : 'Anti-Phishing Code'}
          </AppText>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!hasCode ? (
          <View style={styles.flex}>
            {/* Reusable AGCE Gold Card showing verification state (Screenshot 3) */}
            <AgceGoldCard code="X X X X X X" isDark={isDark} />

            <AppText type={TWELVE} style={[styles.validText, { color: isDark ? '#8A8A93' : '#9E9EAE', marginTop: 10, marginBottom: 10 }]}>
              This code identifies official AGCE emails.
            </AppText>

            {/* Edit Anti-Phishing Code Option Row */}
            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(routes.EDIT_ANTI_PHISHING_SCREEN)}
            >
              <AppText type={SIXTEEN} weight={NORMAL} style={{ color: isDark ? '#FFFFFF' : '#1A1A1C' }}>
                Edit Anti-Phishing Code
              </AppText>
              <FastImage
                source={right_ic}
                style={styles.chevronIcon}
                tintColor={isDark ? '#8A8A93' : '#9E9EAE'}
                resizeMode="contain"
              />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: isDark ? '#1E1E22' : '#F5F5FA' }]} />

            {/* Disable Anti-Phishing Code Option Row */}
            <TouchableOpacity
              style={styles.row}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(routes.DISABLE_ANTI_PHISHING_SCREEN)}
            >
              <AppText type={SIXTEEN} weight={NORMAL} style={{ color: isDark ? '#FFFFFF' : '#1A1A1C' }}>
                Disable Anti-Phishing Code
              </AppText>
              <FastImage
                source={right_ic}
                style={styles.chevronIcon}
                tintColor={isDark ? '#8A8A93' : '#9E9EAE'}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.flex}>
            {/* Anti-Phishing Illustration (padlock + asterisks dialog bubble) */}
            <View style={styles.illustrationWrapper}>
              <FastImage
                source={antiphisinglock}
                resizeMode="contain"
                style={{ width: 150, height: 150 }}
              />
            </View>

            <View style={styles.content}>
              {/* Title */}
              <AppText
                type={SIXTEEN}
                weight={SEMI_BOLD}
                style={[styles.mainTitle, { color: isDark ? '#FFFFFF' : '#1C1C1E' }]}
              >
                How Does the Anti-Phishing Code Work?
              </AppText>

              {/* Description */}
              <AppText
                type={THIRTEEN}
                weight={NORMAL}
                style={[styles.description, { color: isDark ? '#8A8A93' : '#8E8E93' }]}
              >
                You can create your own anti-phishing code to appear in official AGCE emails and SMS messages. This feature helps you verify the authenticity of communications from AGCE.
              </AppText>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action Button at the bottom (only when disabled) */}
      {hasCode && (
        <View style={styles.bottomWrapper}>
          <TouchableOpacity
            style={[styles.confirmButton, { backgroundColor: isDark ? '#2E2E32' : '#2A2A2E' }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate(routes.CREATE_ANTI_PHISHING_SCREEN)}
          >
            <AppText type={SIXTEEN} weight={BOLD} style={{ color: '#FFFFFF' }}>
              Create
            </AppText>
          </TouchableOpacity>
        </View>
      )}
    </AppSafeAreaView>
  );
};

export default AntiPhishingStatus;

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
    paddingTop: 24,
    paddingBottom: 100,
  },
  illustrationWrapper: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 40,
  },
  bubbleContainer: {
    width: 160,
    height: 80,
    borderRadius: 20,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  asterisks: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D1AA67',
    letterSpacing: 4,
  },
  lockBadge: {
    position: 'absolute',
    top: -15,
    right: -15,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lockIcon: {
    width: 22,
    height: 22,
  },
  content: {
    paddingHorizontal: 20,
  },
  mainTitle: {
    textAlign: 'left',
    marginBottom: 12,
    lineHeight: 24,
  },
  description: {
    lineHeight: 20,
  },
  validText: {
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 52,
  },
  chevronIcon: {
    width: 14,
    height: 14,
  },
  divider: {
    height: 1,
    width: '92%',
    alignSelf: 'center',
    marginVertical: 4,
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
