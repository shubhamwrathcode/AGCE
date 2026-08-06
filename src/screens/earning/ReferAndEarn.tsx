import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, ScrollView } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import FastImage from 'react-native-fast-image';
import { AppSafeAreaView, AppText, SEMI_BOLD } from '../../shared';
import { useTheme } from '../../hooks/useTheme';
import { back_ic, invite_earn_img } from '../../helper/ImageAssets';
import Clipboard from '@react-native-clipboard/clipboard';
import Toast from 'react-native-simple-toast';
import { colors } from '../../theme/colors';
import NavigationService from '../../navigation/NavigationService';
import { fontFamilySemiBold, fontFamilyMedium, fontFamilyBold } from '../../theme/typography';
import { appOperation } from '../../appOperation';

const pickReferralCode = (payload: any) => {
  if (payload == null) return "";
  if (typeof payload === "string" || typeof payload === "number") return String(payload).trim();
  if (typeof payload !== "object") return "";

  const fromData =
    payload?.data?.refer_code ||
    payload?.data?.user_code ||
    payload?.data?.referral_code ||
    payload?.data?.referCode ||
    payload?.data?.code;
  if (fromData) return String(fromData).trim();

  const nested = payload.data ?? payload.result ?? payload;
  if (typeof nested === "string" || typeof nested === "number") return String(nested).trim();
  if (typeof nested !== "object" || nested == null) return "";
  return String(
    nested.refer_code ||
    nested.user_code ||
    nested.referral_code ||
    nested.referCode ||
    nested.code ||
    nested.refferal_code ||
    nested.user_refer_code ||
    ""
  ).trim();
};

const pickReferCount = (payload: any) => {
  if (payload == null) return 0;
  if (typeof payload === "number") return payload;
  if (typeof payload === "string" && payload.trim() !== "" && !Number.isNaN(Number(payload))) {
    return Number(payload);
  }
  if (typeof payload !== "object") return 0;
  const nested = payload.data ?? payload.result ?? payload;
  if (typeof nested === "number") return nested;
  if (typeof nested === "string" && nested.trim() !== "" && !Number.isNaN(Number(nested))) {
    return Number(nested);
  }
  if (typeof nested !== "object" || nested == null) return 0;
  const n =
    nested.total_refer_count ??
    nested.totalReferCount ??
    nested.total_count ??
    nested.count ??
    nested.total ??
    nested.friends ??
    nested.invites ??
    0;
  return Number(n) || 0;
};

const pickReferList = (payload: any) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const nested = payload.data ?? payload.result ?? payload.list ?? payload.users ?? payload;
  if (Array.isArray(nested)) return nested;
  if (nested && typeof nested === "object") {
    if (Array.isArray(nested.list)) return nested.list;
    if (Array.isArray(nested.users)) return nested.users;
    if (Array.isArray(nested.referrals)) return nested.referrals;
  }
  return [];
};

const ReferAndEarn = () => {
  const { isDark } = useTheme();

  const [referralCode, setReferralCode] = useState("");
  const [referCount, setReferCount] = useState(0);
  const [referList, setReferList] = useState([]);
  const [referralLoading, setReferralLoading] = useState(false);

  const loadReferralData = useCallback(async () => {
    setReferralLoading(true);
    try {
      const [codeRes, countRes, listRes] = await Promise.all([
        appOperation.customer.user_refer_code() as any,
        appOperation.customer.user_refer_count() as any,
        appOperation.customer.get_referral_list() as any,
      ]);

      if (codeRes?.success) {
        const code = pickReferralCode(codeRes);
        if (code) setReferralCode(code);
      }

      if (countRes?.success) {
        setReferCount(pickReferCount(countRes));
      }

      if (listRes?.success) {
        const list = pickReferList(listRes);
        setReferList(list as any);
        if (!countRes?.success) {
          setReferCount(list.length);
        }
      }
    } catch (e) {
      // keep UI defaults on network failure
    } finally {
      setReferralLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReferralData();
  }, [loadReferralData]);

  const friendsInvited = referCount || referList.length || 0;
  const referralLink = referralCode ? `http://localhost:9502/signup?referral_code=${referralCode}` : '';

  return (
    <AppSafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => NavigationService.goBack()}>
          <FastImage source={back_ic} style={styles.backIcon} tintColor={isDark ? colors.white : colors.black} resizeMode="contain" />
        </TouchableOpacity>
        <AppText style={[styles.headerTitle, { color: isDark ? colors.white : colors.black }]}>Referral Program</AppText>
        <View style={styles.backBtn} />
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.textSection}>
            <AppText style={[styles.titleTop, { color: isDark ? colors.white : colors.black }]}>Invite. Earn.</AppText>
            <AppText style={[styles.titleBottom, { color: '#EABE53' }]}>Grow Together.</AppText>

            <AppText style={[styles.desc, { color: isDark ? '#A0A0A0' : '#666' }]}>
              Share, invite and earn up to 100 USDT!
            </AppText>

            <TouchableOpacity style={styles.inviteBtn} onPress={() => { }}>
              <AppText style={styles.inviteBtnText}>Invite Friends</AppText>
              <View style={styles.arrowCircle}>
                <AppText style={styles.arrowText}>{'>'}</AppText>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.imageSection}>
            <FastImage
              source={invite_earn_img}
              style={styles.giftImage}
              resizeMode="contain"
            />
          </View>

          {/* Stats Section */}
          <View style={[styles.statsContainer, { backgroundColor: isDark ? '#0F0F0F' : '#F9F9F9' }]}>
            <AppText style={[styles.sectionHeader, { color: isDark ? '#A0A0A0' : '#666' }]}>Your Referral Code</AppText>
            <AppText style={[styles.referralCodeText, { color: isDark ? colors.white : colors.black }]}>
              {referralCode || (referralLoading ? "…" : "—")}
            </AppText>

            <View style={styles.gridContainer}>
              <View style={[styles.gridItem, { backgroundColor: isDark ? '#161616' : colors.white, borderColor: isDark ? '#222' : '#EEE' }]}>
                <AppText style={[styles.gridLabel, { color: isDark ? '#A0A0A0' : '#666' }]}>Your Commission Rate</AppText>
                <AppText style={[styles.gridValue, { color: '#EABE53' }]}>15%</AppText>
              </View>
              <View style={[styles.gridItem, { backgroundColor: isDark ? '#161616' : colors.white, borderColor: isDark ? '#222' : '#EEE' }]}>
                <AppText style={[styles.gridLabel, { color: isDark ? '#A0A0A0' : '#666' }]}>Friends' Kickback Rate</AppText>
                <AppText style={[styles.gridValue, { color: isDark ? colors.white : colors.black }]}>0%</AppText>
              </View>
              <View style={[styles.gridItem, { backgroundColor: isDark ? '#161616' : colors.white, borderColor: isDark ? '#222' : '#EEE' }]}>
                <AppText style={[styles.gridLabel, { color: isDark ? '#A0A0A0' : '#666' }]}>Friends You've Invited</AppText>
                <AppText style={[styles.gridValue, { color: isDark ? colors.white : colors.black }]}>{friendsInvited}</AppText>
              </View>
              <View style={[styles.gridItem, { backgroundColor: isDark ? '#161616' : colors.white, borderColor: isDark ? '#222' : '#EEE' }]}>
                <AppText style={[styles.gridLabel, { color: isDark ? '#A0A0A0' : '#666' }]}>Total Rewards Earned</AppText>
                <AppText style={[styles.gridValue, { color: isDark ? colors.white : colors.black }]}>0 USDT</AppText>
              </View>
            </View>

            <AppText style={[styles.sectionHeader, { color: isDark ? '#A0A0A0' : '#666', marginTop: 10, }]}>Share Your Link</AppText>
            <View style={[styles.linkBox, { backgroundColor: isDark ? '#161616' : colors.white, borderColor: isDark ? '#222' : '#EEE' }]}>
              <AppText style={[styles.linkText, { color: isDark ? colors.white : colors.black }]} numberOfLines={1}>
                {referralLink || "Sign in to get your referral link"}
              </AppText>
              <TouchableOpacity 
                disabled={!referralLink}
                onPress={() => {
                  Clipboard.setString(referralLink);
                  Toast.showWithGravity('Copied to clipboard', Toast.SHORT, Toast.BOTTOM);
                }}>
                <AppText style={styles.copyIcon}>❐</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Overview Section */}
        <View style={styles.overviewContainer}>
          <View style={styles.overviewHeader}>
            <AppText style={[styles.overviewTitle, { color: isDark ? colors.white : colors.black }]}>Overview</AppText>
            <TouchableOpacity style={[styles.dropdownBtn, { backgroundColor: isDark ? '#161616' : '#F5F5F5', borderColor: isDark ? '#222' : '#EEE' }]}>
              <AppText style={[styles.dropdownText, { color: isDark ? '#A0A0A0' : '#666' }]}>Last 30 Days</AppText>
              <AppText style={[styles.dropdownIcon, { color: isDark ? '#A0A0A0' : '#666' }]}>⌄</AppText>
            </TouchableOpacity>
          </View>

          <View style={styles.overviewGrid}>
            <View style={[styles.overviewCard, { backgroundColor: isDark ? '#0F0F0F' : '#F9F9F9', borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#EEE' }]}>
              <View style={styles.cardInner}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(2, 192, 118, 0.1)' }]}>
                  <AppText style={styles.iconEmoji}>💹</AppText>
                </View>
                <View style={styles.cardContent}>
                  <AppText style={[styles.cardLabel, { color: isDark ? '#A0A0A0' : '#666' }]}>Total Earnings</AppText>
                  <AppText style={[styles.cardValue, { color: isDark ? colors.white : colors.black }]}>0 USDT</AppText>
                  <AppText style={[styles.cardSubValue, { color: isDark ? '#666' : '#999' }]}>≈ $0.00</AppText>
                </View>
              </View>
            </View>

            <View style={[styles.overviewCard, { backgroundColor: isDark ? '#0F0F0F' : '#F9F9F9', borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#EEE' }]}>
              <View style={styles.cardInner}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(243, 156, 18, 0.1)' }]}>
                  <AppText style={styles.iconEmoji}>⏳</AppText>
                </View>
                <View style={styles.cardContent}>
                  <AppText style={[styles.cardLabel, { color: isDark ? '#A0A0A0' : '#666' }]}>Pending Earnings</AppText>
                  <AppText style={[styles.cardValue, { color: isDark ? colors.white : colors.black }]}>0 USDT</AppText>
                  <AppText style={[styles.cardSubValue, { color: isDark ? '#666' : '#999' }]}>≈ $0.00</AppText>
                </View>
              </View>
            </View>

            <View style={[styles.overviewCard, { backgroundColor: isDark ? '#0F0F0F' : '#F9F9F9', borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#EEE' }]}>
              <View style={styles.cardInner}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(52, 152, 219, 0.1)' }]}>
                  <AppText style={styles.iconEmoji}>👥</AppText>
                </View>
                <View style={styles.cardContent}>
                  <AppText style={[styles.cardLabel, { color: isDark ? '#A0A0A0' : '#666' }]}>Total Friends</AppText>
                  <AppText style={[styles.cardValue, { color: isDark ? colors.white : colors.black }]}>{friendsInvited}</AppText>
                  <AppText style={[styles.cardSubValue, { color: isDark ? '#666' : '#999' }]}>From your referrals</AppText>
                </View>
              </View>
            </View>

            <View style={[styles.overviewCard, { backgroundColor: isDark ? '#0F0F0F' : '#F9F9F9', borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#EEE' }]}>
              <View style={styles.cardInner}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(155, 89, 182, 0.1)' }]}>
                  <AppText style={styles.iconEmoji}>📊</AppText>
                </View>
                <View style={styles.cardContent}>
                  <AppText style={[styles.cardLabel, { color: isDark ? '#A0A0A0' : '#666' }]}>Total Trades</AppText>
                  <AppText style={[styles.cardValue, { color: isDark ? colors.white : colors.black }]}>0</AppText>
                  <AppText style={[styles.cardSubValue, { color: isDark ? '#666' : '#999' }]}>+0 this month</AppText>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Commission Performance Section */}
        <View style={styles.commissionContainer}>
          <View style={styles.commissionHeader}>
            <View>
              <AppText style={[styles.commissionTitle, { color: isDark ? colors.white : colors.black }]}>Commission</AppText>
              <AppText style={[styles.commissionTitle, { color: isDark ? colors.white : colors.black }]}>Performance</AppText>
            </View>
            <View style={[styles.dateBtn, { backgroundColor: isDark ? '#161616' : '#F9F9F9', borderColor: isDark ? '#222' : '#EEE' }]}>
              <AppText style={styles.dateIcon}>📅</AppText>
              <AppText style={[styles.dateText, { color: isDark ? '#A0A0A0' : '#666' }]}>May 01, 2024 - May 31, 2024</AppText>
            </View>
          </View>

          {/* Base Commission Card */}
          <View style={[styles.baseCommissionCard, { backgroundColor: isDark ? '#0F0F0F' : '#F9F9F9', borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#EEE' }]}>
            <AppText style={[styles.baseCommLabel, { color: isDark ? '#A0A0A0' : '#666' }]}>Your Base Commission Rate</AppText>
            <View style={styles.gaugeContainer}>
               <View style={[styles.gaugeBackground, { borderColor: isDark ? '#222' : '#E0E0E0' }]} />
               <View style={styles.gaugeProgress} />
               <AppText style={[styles.gaugeText, { color: isDark ? colors.white : colors.black }]}>15%</AppText>
            </View>
          </View>

          {/* Target Cards */}
          <View style={[styles.targetCard, { backgroundColor: isDark ? '#0F0F0F' : '#F9F9F9', borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#EEE' }]}>
            <View style={{ flex: 1 }}>
              <AppText style={[styles.targetTitle, { color: isDark ? colors.white : colors.black }]}>
                Reach <AppText style={{ color: '#EABE53' }}>$1,000 USDT</AppText> in trading volume
              </AppText>
              <AppText style={[styles.targetSub, { color: isDark ? '#A0A0A0' : '#666' }]}>your commission rate will rise to</AppText>
            </View>
            <AppText style={[styles.targetValue, { color: '#EABE53' }]}>25% ↗</AppText>
          </View>

          <View style={[styles.targetCard, { backgroundColor: isDark ? '#0F0F0F' : '#F9F9F9', borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#EEE' }]}>
            <View style={{ flex: 1 }}>
              <AppText style={[styles.targetTitle, { color: isDark ? colors.white : colors.black }]}>
                Reach <AppText style={{ color: '#EABE53' }}>$10,000 USDT</AppText> in trading volume
              </AppText>
              <AppText style={[styles.targetSub, { color: isDark ? '#A0A0A0' : '#666' }]}>your commission rate will rise to</AppText>
            </View>
            <AppText style={[styles.targetValue, { color: '#EABE53' }]}>35% ↗</AppText>
          </View>

          {/* Mini Stats with Graph */}
          <View style={[styles.miniStatCard, { backgroundColor: isDark ? '#0F0F0F' : '#F9F9F9', borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#EEE' }]}>
            <View style={[styles.miniIconBox, { backgroundColor: isDark ? '#161616' : colors.white, borderColor: isDark ? '#222' : '#EEE' }]}>
               <AppText style={styles.miniIcon}>👤</AppText>
            </View>
            <View style={styles.miniStatContent}>
               <AppText style={[styles.miniStatLabel, { color: isDark ? '#A0A0A0' : '#666' }]}>Valid Invites</AppText>
               <AppText style={[styles.miniStatValue, { color: isDark ? colors.white : colors.black }]}>{friendsInvited}</AppText>
            </View>
            <View style={styles.sparklineContainer}>
              <Svg height="40" width="80" viewBox="0 0 100 40">
                <Path d="M0 20 Q 15 5, 30 25 T 60 10 T 80 30 T 100 15" fill="none" stroke="#EABE53" strokeWidth="3" />
              </Svg>
            </View>
          </View>

          <View style={[styles.miniStatCard, { backgroundColor: isDark ? '#0F0F0F' : '#F9F9F9', borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#EEE' }]}>
            <View style={[styles.miniIconBox, { backgroundColor: isDark ? '#161616' : colors.white, borderColor: isDark ? '#222' : '#EEE' }]}>
               <AppText style={styles.miniIcon}>📊</AppText>
            </View>
            <View style={styles.miniStatContent}>
               <AppText style={[styles.miniStatLabel, { color: isDark ? '#A0A0A0' : '#666' }]}>Trading Volume</AppText>
               <AppText style={[styles.miniStatValue, { color: isDark ? colors.white : colors.black }]}>0 USDT</AppText>
            </View>
            <View style={styles.sparklineContainer}>
              <Svg height="40" width="80" viewBox="0 0 100 40">
                <Path d="M0 30 Q 25 15, 50 30 T 100 10" fill="none" stroke="#EABE53" strokeWidth="3" />
              </Svg>
            </View>
          </View>
        </View>

      </ScrollView>
    </AppSafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  backIcon: {
    width: 20,
    height: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fontFamilySemiBold,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  content: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  textSection: {
    width: '55%',
    zIndex: 2,
  },
  imageSection: {
    position: 'absolute',
    right: -10,
    top: -20,
    zIndex: 1,
  },
  titleTop: {
    fontSize: 22,
    fontFamily: fontFamilyBold,
    marginBottom: -2,
  },
  titleBottom: {
    fontSize: 22,
    fontFamily: fontFamilyBold,
    marginBottom: 8,
  },
  desc: {
    fontSize: 13,
    fontFamily: fontFamilyMedium,
    lineHeight: 20,
    marginBottom: 15,
  },
  inviteBtn: {
    backgroundColor: '#D1AA67',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
  },
  inviteBtnText: {
    color: colors.white,
    fontSize: 14,
    fontFamily: fontFamilySemiBold,
    marginRight: 8,
  },
  arrowCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    color: colors.white,
    fontSize: 10,
    fontFamily: fontFamilyBold,
  },
  giftImage: {
    width: 220,
    height: 220,
  },
  statsContainer: {
    marginTop: 40,
    borderRadius: 24,
    padding: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  sectionHeader: {
    fontSize: 14,
    fontFamily: fontFamilyMedium,
    textAlign: 'center',
    marginBottom: 5,
  },
  referralCodeText: {
    fontSize: 22,
    fontFamily: fontFamilyBold,
    textAlign: 'center',
    marginBottom: 14,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48.5%',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 5,
  },
  gridLabel: {
    fontSize: 11,
    fontFamily: fontFamilyMedium,
    textAlign: 'center',
    marginBottom: 5,
  },
  gridValue: {
    fontSize: 22,
    fontFamily: fontFamilyBold,
  },
  linkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
  },
  linkText: {
    fontSize: 13,
    fontFamily: fontFamilyMedium,
    flex: 1,
    marginRight: 10,
  },
  copyIcon: {
    fontSize: 16,
    color: '#888',
  },
  overviewContainer: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  overviewTitle: {
    fontSize: 22,
    fontFamily: fontFamilyBold,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  dropdownText: {
    fontSize: 13,
    fontFamily: fontFamilyMedium,
    marginRight: 12,
  },
  dropdownIcon: {
    fontSize: 16,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  overviewCard: {
    width: '48.5%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 8,
    marginBottom: 5,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  iconEmoji: {
    fontSize: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 11,
    fontFamily: fontFamilyMedium,
    marginBottom: 2,
  },
  cardValue: {
    fontSize: 16,
    fontFamily: fontFamilyBold,
    marginBottom: 2,
  },
  cardSubValue: {
    fontSize: 10,
    fontFamily: fontFamilyMedium,
  },
  commissionContainer: {
    marginTop: 30,
    paddingHorizontal: 16,
  },
  commissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  commissionTitle: {
    fontSize: 18,
    fontFamily: fontFamilyBold,
    lineHeight: 22,
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  dateIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  dateText: {
    fontSize: 11,
    fontFamily: fontFamilyMedium,
  },
  baseCommissionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  baseCommLabel: {
    fontSize: 12,
    fontFamily: fontFamilyMedium,
    marginBottom: 16,
  },
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 160,
    height: 80,
    overflow: 'hidden',
    position: 'relative',
  },
  gaugeBackground: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 12,
    position: 'absolute',
    top: 0,
  },
  gaugeProgress: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 12,
    borderColor: '#02C076',
    position: 'absolute',
    top: 0,
    borderBottomColor: 'transparent',
    borderRightColor: 'transparent',
    transform: [{ rotate: '-45deg' }],
  },
  gaugeText: {
    fontSize: 22,
    fontFamily: fontFamilyBold,
    position: 'absolute',
    bottom: 0,
  },
  targetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  targetTitle: {
    fontSize: 11,
    fontFamily: fontFamilySemiBold,
    marginBottom: 4,
  },
  targetSub: {
    fontSize: 10,
    fontFamily: fontFamilyMedium,
  },
  targetValue: {
    fontSize: 16,
    fontFamily: fontFamilyBold,
    marginLeft: 12,
  },
  miniStatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  miniIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  miniIcon: {
    fontSize: 16,
  },
  miniStatContent: {
    flex: 1,
  },
  miniStatLabel: {
    fontSize: 11,
    fontFamily: fontFamilyMedium,
    marginBottom: 2,
  },
  miniStatValue: {
    fontSize: 14,
    fontFamily: fontFamilyBold,
  },
  sparklineContainer: {
    width: 60,
    height: 30,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});

export default ReferAndEarn;
