import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, Linking, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import RBSheet from 'react-native-raw-bottom-sheet';
import FastImage from 'react-native-fast-image';
import { AppSafeAreaView, AppText, SEMI_BOLD } from '../../shared';
import { useTheme } from '../../hooks/useTheme';
import { back_ic, usdtIcon, bitcoinIcon, checkIcon, checkIc, } from '../../helper/ImageAssets';
import NavigationService from '../../navigation/NavigationService';
import Toast from 'react-native-simple-toast';
import { colors } from '../../theme/colors';
import { fontFamilyMedium, fontFamilySemiBold, } from '../../theme/typography';
import { IMAGE_BASE_URL } from '../../helper/Constants';
import { appOperation } from '../../appOperation';

const { width } = Dimensions.get('window');

const mapLaunchpadStatus = (status: string) => {
  switch (String(status || '').toUpperCase()) {
    case 'LIVE': return 'LIVE';
    case 'UPCOMING': return 'UPCOMING';
    case 'ENDED': return 'ENDED';
    default: return 'ENDED';
  }
};

const formatPhaseTime = (value: any) => {
  if (!value) return '--';
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const getIconForCoin = (symbol: string, path: string) => {
  if (path) {
    const t = String(path).trim();
    if (/^https?:\/\//i.test(t) || t.startsWith('data:')) return { uri: t };
    const base = IMAGE_BASE_URL.replace(/\/$/, '');
    return { uri: t.startsWith('/') ? `${base}${t}` : `${base}/${t}` };
  }
  if (symbol === 'BTC') return bitcoinIcon;
  return usdtIcon;
};

const TABS = ['Founder', 'Highlight/Vision', 'Token Economics', 'Technical Overview', 'Risk Warning'];

const LaunchpadDetail = ({ route }: any) => {
  const { projectId } = route?.params || {};
  const { colors: themeColors, isDark } = useTheme();

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<any>(null);
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [tradeAmount, setTradeAmount] = useState('');

  const [balance, setBalance] = useState(0);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [tradeSubmitting, setTradeSubmitting] = useState(false);

  const tradeSheetRef = useRef<any>(null);

  useEffect(() => {
    fetchDetail();
  }, [projectId]);

  const fetchDetail = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res: any = await appOperation.customer.Launchpad_Project_Detail(projectId);
      if (res?.success && res?.data) {
        setDetail(res.data);
      } else {
        setDetail(null);
      }
    } catch (e) {
      console.log('Launchpad detail error', e);
      setDetail(null);
    } finally {
      setLoading(false);
    }
  };

  const handleWebsite = () => {
    const url = detail?.website;
    if (url) {
      Linking.openURL(url).catch(() => Toast.showWithGravity('Invalid URL', Toast.SHORT, Toast.BOTTOM));
    }
  };

  const fetchBalance = async (currencyId?: string) => {
    const cid = currencyId || detail?.quoteCurrency?._id || detail?.quoteCurrencyId || detail?.acceptedCurrencyId || '';
    if (!cid) return;
    setBalanceLoading(true);
    try {
      const res: any = await appOperation.customer.Launchpad_User_Balance(cid, 'earning');
      if (res?.success) {
        const data = res?.data;
        const rawBal = (data && typeof data === 'object') ? (data.balance ?? data.amount ?? 0) : (data ?? 0);
        const bal = (rawBal && typeof rawBal === 'object') ? (rawBal.$numberDecimal ?? rawBal.value ?? 0) : rawBal;
        setBalance(Number(bal) || 0);
      }
    } catch (err) {
      setBalance(0);
    } finally {
      setBalanceLoading(false);
    }
  };

  const openTradeSheet = () => {
    setTradeAmount('');
    tradeSheetRef.current?.open();
    fetchBalance();
  };

  const renderTabContent = () => {
    const pd = detail?.projectDetails || {};
    let content = '';

    switch (activeTab) {
      case 'Founder':
        content = `${pd.founderName || ''}\n\n${pd.aboutFounder || ''}`.trim();
        if (!content) content = 'No information available.';
        break;
      case 'Highlight/Vision':
        content = pd.vision || 'No information available.';
        break;
      case 'Token Economics':
        content = pd.tokenEconomics || 'No information available.';
        break;
      case 'Technical Overview':
        content = pd.technicalOverview || 'No information available.';
        break;
      case 'Risk Warning':
        content = pd.riskWarning || 'No information available.';
        break;
      default:
        content = 'No information available.';
    }

    return (
      <View style={styles.tabContentContainer}>
        {activeTab === 'Founder' && pd.founderName ? (
          <View style={styles.founderHeader}>
            <View style={styles.founderIconPlaceholder}>
              <AppText style={styles.founderIconText}>{String(pd.founderName)[0]?.toUpperCase()}</AppText>
            </View>
            <AppText style={[styles.founderNameText, { color: themeColors.text }]}>{pd.founderName}</AppText>
          </View>
        ) : null}

        {activeTab === 'Founder' ? (
          <AppText style={[styles.tabContentText, { color: themeColors.text }]}>{pd.aboutFounder || 'No information available.'}</AppText>
        ) : (
          <AppText style={[styles.tabContentText, { color: themeColors.text }]}>{content}</AppText>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <AppSafeAreaView style={{ backgroundColor: themeColors.background }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => NavigationService.goBack()} style={{ padding: 8 }}>
            <FastImage source={back_ic} style={styles.backIcon} tintColor={themeColors.text} resizeMode="contain" />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={themeColors.text} />
        </View>
      </AppSafeAreaView>
    );
  }

  if (!detail) {
    return (
      <AppSafeAreaView style={{ backgroundColor: themeColors.background }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => NavigationService.goBack()} style={{ padding: 8 }}>
            <FastImage source={back_ic} style={styles.backIcon} tintColor={themeColors.text} resizeMode="contain" />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <AppText style={{ color: themeColors.text }}>Project not found.</AppText>
        </View>
      </AppSafeAreaView>
    );
  }

  const tokenSymbol = detail?.tokenSymbol || detail?.baseCurrency?.short_name || 'Token';
  const acceptedCurrency = detail?.acceptedCurrency || detail?.quoteCurrency?.short_name || 'USDT';
  const tokenPrice = detail?.tokenPrice ?? 0;

  const formatNum = (num: any) => {
    if (isNaN(num)) return '0';
    return Number(num).toFixed(6).replace(/\.?0+$/, '');
  };

  const getAmountError = (value: string) => {
    const amount = parseFloat(value);
    const minBuy = Number(detail?.minBuy);
    const maxBuy = Number(detail?.maxBuy);
    if (value === '' || value === null || value === undefined) return '';
    if (isNaN(amount) || amount <= 0) return 'Amount must be greater than 0.';
    if (minBuy && amount < minBuy) return `Minimum amount is ${formatNum(minBuy)} ${acceptedCurrency}.`;
    if (maxBuy && amount > maxBuy) return `Maximum amount is ${formatNum(maxBuy)} ${acceptedCurrency}.`;
    if (balance != null && amount > balance) return 'Insufficient balance.';
    return '';
  };

  const amountError = getAmountError(tradeAmount);
  const estimatedTokens = (parseFloat(tradeAmount) || 0) * (Number(tokenPrice) || 0);

  const handleConfirmBuy = async () => {
    const err = getAmountError(tradeAmount === '' ? '0' : tradeAmount);
    if (err) {
      Toast.showWithGravity(err, Toast.SHORT, Toast.BOTTOM);
      return;
    }

    const amount = parseFloat(tradeAmount);
    const launchpadId = detail?._id || projectId;
    if (!launchpadId) {
      Toast.showWithGravity('Launchpad information not available.', Toast.SHORT, Toast.BOTTOM);
      return;
    }
    setTradeSubmitting(true);
    try {
      const result: any = await appOperation.customer.Launchpad_Buy_Token({ launchpadId, amount });
      if (result?.success) {
        Toast.showWithGravity(result?.message || 'Investment successful', Toast.SHORT, Toast.BOTTOM);
        tradeSheetRef.current?.close();
        setTradeAmount('');
        fetchDetail();
      } else {
        Toast.showWithGravity(result?.message || 'Investment failed.', Toast.SHORT, Toast.BOTTOM);
      }
    } catch (err) {
      Toast.showWithGravity('Something went wrong. Please try again.', Toast.SHORT, Toast.BOTTOM);
    } finally {
      setTradeSubmitting(false);
    }
  };

  const logoPath = detail?.logo || detail?.baseCurrency?.icon_path || '';
  const statusStr = mapLaunchpadStatus(detail?.status);

  const totalSupply = (detail?.totalSupply ?? 0).toLocaleString();
  const maxAllocation = (detail?.availableTokens ?? 0).toLocaleString();
  const totalAllocation = (detail?.availableTokens ?? 0).toLocaleString();
  const softCap = (detail?.softCap ?? 0).toLocaleString();
  const hardCap = (detail?.hardCap ?? 0).toLocaleString();
  const minBuy = (detail?.minBuy ?? 0).toLocaleString();
  const maxBuy = (detail?.maxBuy ?? 0).toLocaleString();
  const totalRaised = (detail?.totalRaised ?? 0).toLocaleString();

  return (
    <AppSafeAreaView style={{ backgroundColor: '#fff' }}>
      {/* Header Area */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => NavigationService.goBack()} style={{ padding: 8 }}>
          <FastImage source={back_ic} style={styles.backIcon} tintColor={themeColors.text} resizeMode="contain" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 250 }}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <FastImage source={getIconForCoin(tokenSymbol, logoPath)} style={styles.projectLogo} resizeMode="contain" />
            <AppText style={[styles.titleText, { color: themeColors.text }]}>{tokenSymbol}</AppText>
            <View style={[styles.statusBadge, { backgroundColor: '#F0F0F0' }]}>
              <AppText style={styles.statusBadgeText}>{statusStr}</AppText>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.tradeBtn, { backgroundColor: isDark ? themeColors.card : '#333' }]}
            onPress={openTradeSheet}
          >
            <AppText style={styles.tradeBtnText}>Trade</AppText>
          </TouchableOpacity>
        </View>

        {/* Description & Website */}
        <View style={styles.descSection}>
          <AppText style={[styles.descText, { color: themeColors.secondaryText }]}>
            {detail?.description || 'No description provided.'}
          </AppText>

          {detail?.website ? (
            <TouchableOpacity style={styles.websiteBtn} onPress={handleWebsite}>
              <AppText style={styles.websiteBtnText}>🌐 Website</AppText>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <AppText style={styles.statLabel}>Total Allocation</AppText>
            <AppText style={[styles.statValue, { color: themeColors.text }]}>{totalSupply} {tokenSymbol}</AppText>
          </View>
          <View style={styles.statBox}>
            <AppText style={styles.statLabel}>Number of Participants</AppText>
            <AppText style={[styles.statValue, { color: themeColors.text }]}>{detail?.totalParticipants || 0}</AppText>
          </View>
        </View>

        {/* Event Phases */}
        <View style={styles.sectionContainer}>
          <AppText style={[styles.sectionTitle, { color: themeColors.text }]}>Event Phases</AppText>
          <View style={styles.timeline}>

            <View style={styles.timelineLineWrapper}>
              <View style={styles.timelineLine} />
            </View>

            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: '#333' }]}><FastImage source={checkIc} style={styles.checkIcon} tintColor={colors.white} /></View>
              <View style={styles.timelineContent}>
                <AppText style={[styles.timelineTitle, { color: themeColors.text }]}>Warm Up</AppText>
                <AppText style={styles.timelineTime}>{formatPhaseTime(detail?.startTime)}</AppText>
              </View>
            </View>

            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: '#333' }]}><FastImage source={checkIc} style={styles.checkIcon} tintColor={colors.white} /></View>
              <View style={styles.timelineContent}>
                <AppText style={[styles.timelineTitle, { color: themeColors.text }]}>Subscription Starts</AppText>
                <AppText style={styles.timelineTime}>{formatPhaseTime(detail?.startTime)}</AppText>
              </View>
            </View>

            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: '#333' }]}><FastImage source={checkIc} style={styles.checkIcon} tintColor={colors.white} /></View>
              <View style={[styles.timelineContent, { paddingBottom: 0 }]}>
                <AppText style={[styles.timelineTitle, { color: themeColors.text }]}>Subscription Ends</AppText>
                <AppText style={styles.timelineTime}>{formatPhaseTime(detail?.endTime)}</AppText>
              </View>
            </View>
          </View>
        </View>

        {/* Launchpad Details Card */}
        <View style={styles.sectionContainer}>
          <AppText style={[styles.sectionTitle, { color: themeColors.text }]}>Launchpad Details</AppText>
          <View style={[styles.cardContainer, { backgroundColor: isDark ? themeColors.card : '#F9F9F9', borderColor: isDark ? themeColors.border : '#EAEAEA' }]}>

            <View style={[styles.detailRow, { borderBottomColor: isDark ? themeColors.border : '#EAEAEA' }]}>
              <AppText style={styles.detailLabel}>Total Supply</AppText>
              <AppText style={[styles.detailValue, { color: themeColors.text }]}>{totalSupply} {tokenSymbol}</AppText>
            </View>

            <View style={[styles.detailRow, { borderBottomColor: isDark ? themeColors.border : '#EAEAEA' }]}>
              <AppText style={styles.detailLabel}>Total Allocation for Launchpad</AppText>
              <AppText style={[styles.detailValue, { color: themeColors.text }]}>{totalAllocation} {tokenSymbol}</AppText>
            </View>

            <View style={[styles.detailRow, { borderBottomColor: isDark ? themeColors.border : '#EAEAEA' }]}>
              <AppText style={styles.detailLabel}>Allocation for {acceptedCurrency} Pool</AppText>
              <AppText style={[styles.detailValue, { color: themeColors.text }]}>{totalAllocation} {tokenSymbol}</AppText>
            </View>

            <View style={[styles.detailRow, { borderBottomColor: isDark ? themeColors.border : '#EAEAEA' }]}>
              <AppText style={styles.detailLabel}>Soft Cap</AppText>
              <AppText style={[styles.detailValue, { color: themeColors.text }]}>{softCap} {acceptedCurrency}</AppText>
            </View>

            <View style={[styles.detailRow, { borderBottomColor: isDark ? themeColors.border : '#EAEAEA' }]}>
              <AppText style={styles.detailLabel}>Hard Cap</AppText>
              <AppText style={[styles.detailValue, { color: themeColors.text }]}>{hardCap} {acceptedCurrency}</AppText>
            </View>

            <View style={[styles.detailRow, { borderBottomColor: isDark ? themeColors.border : '#EAEAEA' }]}>
              <AppText style={styles.detailLabel}>Total Commitment({acceptedCurrency})</AppText>
              <AppText style={[styles.detailValue, { color: themeColors.text }]}>{totalRaised} {acceptedCurrency}</AppText>
            </View>

            <View style={[styles.detailRow, { borderBottomColor: isDark ? themeColors.border : '#EAEAEA' }]}>
              <AppText style={styles.detailLabel}>Min Buy({acceptedCurrency})</AppText>
              <AppText style={[styles.detailValue, { color: themeColors.text }]}>{minBuy} {acceptedCurrency}</AppText>
            </View>

            <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
              <AppText style={styles.detailLabel}>Cap per Subscriber({acceptedCurrency})</AppText>
              <AppText style={[styles.detailValue, { color: themeColors.text }]}>{maxBuy} {acceptedCurrency}</AppText>
            </View>

          </View>
        </View>

        {/* Project Details Tabs */}
        <View style={styles.sectionContainer}>
          <AppText style={[styles.sectionTitle, { color: themeColors.text }]}>Project Details</AppText>
          <View style={[styles.cardContainer, { backgroundColor: isDark ? themeColors.card : '#F9F9F9', borderColor: isDark ? themeColors.border : '#EAEAEA', paddingHorizontal: 0 }]}>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
              {TABS.map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tabButton, activeTab === tab && { borderBottomColor: themeColors.text }]}
                  onPress={() => setActiveTab(tab)}
                >
                  <AppText style={[styles.tabButtonText, { color: activeTab === tab ? themeColors.text : '#888' }]}>{tab}</AppText>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {renderTabContent()}

          </View>
        </View>

        {/* Commit USDT Card (In-flow) */}
        <View style={styles.sectionContainer}>
          <View style={[styles.cardContainer, { backgroundColor: isDark ? themeColors.card : colors.white, borderColor: isDark ? themeColors.border : '#EAEAEA', paddingVertical: 16 }]}>
            <View style={styles.bottomHeaderRow}>
              <FastImage source={getIconForCoin(acceptedCurrency, detail?.quoteCurrency?.icon_path || '')} style={styles.bottomIcon} resizeMode="contain" />
              <AppText style={[styles.bottomTitle, { color: themeColors.text }]}>Commit {acceptedCurrency}</AppText>
            </View>

            <View style={styles.bottomStatsRow}>
              <View style={styles.bottomStatCol}>
                <AppText style={styles.bottomStatLabel}>Allocation</AppText>
                <AppText style={[styles.bottomStatValue, { color: themeColors.text }]}>
                  {totalAllocation} {tokenSymbol}
                </AppText>
              </View>
              <View style={[styles.bottomStatCol, { alignItems: 'flex-end' }]}>
                <AppText style={styles.bottomStatLabel}>Commitment</AppText>
                <AppText style={[styles.bottomStatValue, { color: themeColors.text }]}>
                  {totalRaised} {acceptedCurrency}
                </AppText>
              </View>
            </View>

            <View style={styles.bottomStatsRow}>
              <View style={styles.bottomStatCol}>
                <AppText style={styles.bottomStatLabel}>Cap per Subscriber</AppText>
                <AppText style={[styles.bottomStatValue, { color: themeColors.text }]}>
                  {maxBuy} {acceptedCurrency}
                </AppText>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: isDark ? themeColors.border : '#EAEAEA' }]} />

            <View style={styles.infoRow}>
              <AppText style={styles.infoLabel}>Subscription Price</AppText>
              <AppText style={[styles.infoValue, { color: themeColors.text }]}>1 {tokenSymbol} = {detail?.tokenPrice || 0} {acceptedCurrency}</AppText>
            </View>

            <View style={styles.infoRow}>
              <AppText style={styles.infoLabel}>Number of Participants</AppText>
              <AppText style={[styles.infoValue, { color: themeColors.text }]}>{detail?.totalParticipants || 0}</AppText>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Trade Modal using RBSheet */}
      <RBSheet
        ref={tradeSheetRef}
        height={320}
        openDuration={250}
        customStyles={{
          wrapper: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          },
          container: {
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            backgroundColor: isDark ? themeColors.card : colors.white,
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: Platform.OS === 'ios' ? 40 : 20,
            elevation: 10,
            zIndex: 9999,
          },
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <View style={styles.modalHeader}>
            <AppText style={[styles.modalTitle, { color: themeColors.text }]}>Trade {tokenSymbol}</AppText>
            <TouchableOpacity onPress={() => tradeSheetRef.current?.close()} style={styles.closeBtn}>
              <AppText style={[styles.closeIconText, { color: themeColors.text }]}>✕</AppText>
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <View style={styles.balanceRow}>
              <AppText style={styles.inputLabel}>Available Balance</AppText>
              <AppText style={[styles.inputLabel, { color: themeColors.text, fontFamily: fontFamilySemiBold }]}>
                {balanceLoading ? 'Loading...' : `${formatNum(balance)} ${acceptedCurrency}`}
              </AppText>
            </View>

            <AppText style={[styles.inputLabel, { marginTop: 16 }]}>Amount ({acceptedCurrency})</AppText>
            <View style={[styles.inputContainer, { borderColor: isDark ? themeColors.border : '#EAEAEA', backgroundColor: isDark ? themeColors.background : colors.white }]}>
              <TextInput
                style={[styles.textInput, { color: themeColors.text }]}
                placeholder={`Enter amount in ${acceptedCurrency}`}
                placeholderTextColor="#888"
                keyboardType="decimal-pad"
                value={tradeAmount}
                onChangeText={setTradeAmount}
              />
            </View>
            {amountError ? (
              <AppText style={styles.errorText}>{amountError}</AppText>
            ) : null}

            <View style={[styles.balanceRow, { marginTop: 20, marginBottom: 30 }]}>
              <AppText style={styles.inputLabel}>You will receive</AppText>
              <AppText style={[styles.inputLabel, { color: themeColors.text, fontFamily: fontFamilySemiBold }]}>
                {formatNum(estimatedTokens)} {tokenSymbol}
              </AppText>
            </View>

            <TouchableOpacity
              style={[
                styles.submitTradeBtn,
                { backgroundColor: (!tradeAmount || !!amountError || tradeSubmitting) ? '#666' : colors.buyBtnGreen }
              ]}
              disabled={!tradeAmount || !!amountError || tradeSubmitting}
              onPress={handleConfirmBuy}
            >
              {tradeSubmitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <AppText style={styles.submitTradeBtnText}>Trade</AppText>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </RBSheet>

    </AppSafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    height: 56,
  },
  backIcon: {
    width: 22,
    height: 22,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  titleText: {
    fontSize: 24,
    fontFamily: fontFamilySemiBold,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontFamily: fontFamilySemiBold,
    color: '#666',
  },
  tradeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tradeBtnText: {
    color: colors.white,
    fontSize: 14,
    fontFamily: fontFamilyMedium,
  },
  descSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  descText: {
    fontSize: 14,
    fontFamily: fontFamilyMedium,
    lineHeight: 22,
    marginBottom: 16,
  },
  websiteBtn: {
    backgroundColor: '#F5F5F5',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  websiteBtnText: {
    fontSize: 13,
    color: '#333',
    fontFamily: fontFamilyMedium,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  statBox: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    fontFamily: fontFamilyMedium,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontFamily: fontFamilySemiBold,
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: fontFamilySemiBold,
    marginBottom: 16,
  },
  timeline: {
    marginLeft: 8,
    position: 'relative',
  },
  timelineLineWrapper: {
    position: 'absolute',
    left: 10,
    top: 20,
    bottom: 20,
    width: 2,
    backgroundColor: '#EAEAEA',
    zIndex: 0,
  },
  timelineLine: {
    flex: 1,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    zIndex: 1,
  },
  timelineDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    marginTop: 0,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIcon: {
    width: 12,
    height: 12,
  },
  timelineContent: {
    paddingBottom: 30,
    flex: 1,
  },
  timelineTitle: {
    fontSize: 15,
    fontFamily: fontFamilyMedium,
    marginBottom: 4,
  },
  timelineTime: {
    fontSize: 13,
    color: '#888',
  },
  cardContainer: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  detailRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: 13,
    color: '#888',
    fontFamily: fontFamilyMedium,
    marginBottom: 6,
  },
  detailValue: {
    fontSize: 15,
    fontFamily: fontFamilySemiBold,
  },
  tabsScroll: {
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  tabButton: {
    paddingVertical: 12,
    marginRight: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonText: {
    fontSize: 14,
    fontFamily: fontFamilySemiBold,
  },
  tabContentContainer: {
    padding: 16,
  },
  founderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  founderIconPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0A500',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  founderIconText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: fontFamilySemiBold,
  },
  founderNameText: {
    fontSize: 16,
    fontFamily: fontFamilySemiBold,
  },
  tabContentText: {
    fontSize: 14,
    fontFamily: fontFamilyMedium,
    lineHeight: 22,
  },
  bottomHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  bottomIcon: {
    width: 28,
    height: 28,
    marginRight: 10,
  },
  bottomTitle: {
    fontSize: 18,
    fontFamily: fontFamilySemiBold,
  },
  bottomStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  bottomStatCol: {
    flex: 1,
  },
  bottomStatLabel: {
    fontSize: 13,
    color: '#888',
    fontFamily: fontFamilyMedium,
    marginBottom: 4,
  },
  bottomStatValue: {
    fontSize: 16,
    fontFamily: fontFamilySemiBold,
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 13,
    color: '#888',
    fontFamily: fontFamilyMedium,
  },
  infoValue: {
    fontSize: 13,
    fontFamily: fontFamilySemiBold,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: fontFamilySemiBold,
  },
  closeBtn: {
    padding: 4,
  },
  closeIconText: {
    fontSize: 20,
  },
  modalBody: {
    marginBottom: 10,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 13,
    color: '#888',
    fontFamily: fontFamilyMedium,
  },
  inputContainer: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 8,
    height: 50,
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: fontFamilyMedium,
  },
  errorText: {
    color: colors.red,
    fontSize: 12,
    fontFamily: fontFamilyMedium,
    marginTop: 4,
  },
  submitTradeBtn: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitTradeBtnText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: fontFamilySemiBold,
  },
});

export default LaunchpadDetail;
