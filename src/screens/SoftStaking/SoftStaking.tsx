import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, TextInput, Dimensions, FlatList, StatusBar } from 'react-native';
import FastImage from 'react-native-fast-image';
import { AppSafeAreaView, AppText, MEDIUM, NORMAL, SEMI_BOLD } from '../../shared';
import { useTheme } from '../../hooks/useTheme';
import {
  back_ic,
  eye_open_icon,
  eye_close_icon,
  historyIcon,
  searchIcon,
  downIcon,
  upIcon,
  usdtIcon,
  btcPerp,
  INFO,
  NO_NOTIFICATION_ICON
} from '../../helper/ImageAssets';
import NavigationService from '../../navigation/NavigationService';
import Toast from 'react-native-simple-toast';
import { colors } from '../../theme/colors';
import { fontFamilyMedium, fontFamilySemiBold, } from '../../theme/typography';
import { appOperation } from '../../appOperation';
import { IMAGE_BASE_URL } from '../../helper/Constants';
import RBSheet from 'react-native-raw-bottom-sheet';

const STAKING_FAQ_ITEMS = [
  {
    question: "What is Soft Staking?",
    answer: "Soft Staking allows users to earn passive rewards on their crypto holdings while maintaining full access to their assets. Unlike traditional staking, your funds remain flexible and can be used or withdrawn at any time."
  },
  {
    question: "How does Soft Staking work?",
    answer: "Once eligible assets are deposited into your account, they automatically participate in the Soft Staking program. Rewards are generated based on your holdings and are credited according to the platform's reward schedule."
  },
  {
    question: "Do I need to lock my assets?",
    answer: "No. Soft Staking does not require a lock-up period. You can access, trade, or withdraw your assets whenever needed without waiting for an unstaking process."
  },
  {
    question: "Which cryptocurrencies are supported?",
    answer: "Supported cryptocurrencies may vary depending on the platform. You can view the latest list of eligible assets directly from the Soft Staking dashboard."
  },
  {
    question: "How are staking rewards calculated?",
    answer: "Rewards are typically calculated based on your average daily balance of eligible assets and the current annual percentage yield (APY) offered for each cryptocurrency."
  },
  {
    question: "When will I receive my rewards?",
    answer: "Rewards are typically distributed on a daily, weekly, or monthly basis, depending on the specific program terms. Please refer to the program rules for exact distribution schedules."
  },
  {
    question: "Are there any fees for Soft Staking?",
    answer: "Usually, there are no direct fees for participating in Soft Staking. However, standard network or withdrawal fees may apply when transferring your assets out of the platform."
  },
  {
    question: "Is Soft Staking safe?",
    answer: "Soft Staking is designed to provide a secure and convenient way to earn rewards. However, cryptocurrency investments involve market risks, and users should always conduct their own research before participating."
  },
  {
    question: "Can I stop Soft Staking at any time?",
    answer: "Yes. Since assets are not locked, you can stop participating simply by withdrawing or transferring your eligible assets from the staking account."
  },
  {
    question: "Why choose Soft Staking?",
    answer: "Soft Staking offers a simple way to generate passive income while maintaining liquidity, flexibility, and easy access to your crypto assets without long-term commitments."
  }
];



const promotionsData = [
  {
    id: '1',
    coin: 'USD1',
    status: 'Ongoing',
    minHolding: '1 USD1',
    stakingCap: '999,999,999 USD1',
    snapshotType: 'Spot/Futures',
    apr: '12%',
    cumulativeRewards: '0'
  },
  {
    id: '2',
    coin: 'USDG',
    status: 'Ongoing',
    minHolding: '1 USDG',
    stakingCap: '1,000,000 USDG',
    snapshotType: 'Spot',
    apr: '8%',
    cumulativeRewards: '0'
  }
];

const SoftStaking = () => {
  const { colors: themeColors, isDark } = useTheme();
  const [isHide, setIsHide] = useState(false);
  const [isSoftStakingEnabled, setIsSoftStakingEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState<'Products' | 'Promotions'>('Products');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [packages, setPackages] = useState<any[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);

  const faqSheetRef = useRef<any>(null);
  const [faqActiveIndex, setFaqActiveIndex] = useState<number | null>(null);

  React.useEffect(() => {
    fetchPackages();
    fetchStatus();
  }, []);

  const fetchPackages = async () => {
    setPackagesLoading(true);
    try {
      const res: any = await appOperation.customer.SoftStaking_Packages(1, 100);
      if (res?.success && Array.isArray(res.data)) {
        setPackages(res.data);
      }
    } catch (e) {
      console.log('SoftStaking Packages error', e);
    } finally {
      setPackagesLoading(false);
    }
  };

  const fetchStatus = async () => {
    try {
      const res: any = await appOperation.customer.SoftStaking_Status();
      if (res?.success) {
        setIsSoftStakingEnabled(res.data?.softStakingStaus === true);
      }
    } catch (e) {
      console.log('SoftStaking Status error', e);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatApr = (pkg: any) => {
    const min = pkg?.aprMin;
    const max = pkg?.aprMax;
    if (min != null && max != null && min !== max) return `${min}% - ${max}%`;
    if (max != null) return `${max}%`;
    return "—";
  };

  const filteredCoins = packages.filter(item =>
    String(item?.currency || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppSafeAreaView style={{ backgroundColor: colors.white }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => NavigationService.goBack()} style={{ padding: 8 }}>
          <FastImage source={back_ic} style={styles.backIcon} tintColor={themeColors.text} resizeMode="contain" />
        </TouchableOpacity>
        <AppText style={[styles.headerTitle, { color: themeColors.text }]} weight={SEMI_BOLD}>Soft Staking</AppText>
        <TouchableOpacity style={{ padding: 8 }} onPress={() => faqSheetRef.current?.open()}>
          <FastImage source={INFO} style={styles.backIcon} tintColor={themeColors.text} resizeMode="contain" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Holdings Section */}
        <View style={styles.holdingsContainer}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <AppText style={{ color: themeColors.secondaryText, fontSize: 14, marginRight: 6, borderBottomWidth: 1, borderBottomColor: themeColors.secondaryText, borderStyle: 'dotted' }}>Yesterday's Holdings</AppText>
                <TouchableOpacity onPress={() => setIsHide(!isHide)} style={{ padding: 4 }}>
                  <FastImage source={isHide ? eye_close_icon : eye_open_icon} style={{ width: 14, height: 14 }} tintColor={themeColors.secondaryText} resizeMode="contain" />
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 6 }}>
                <AppText style={{ color: themeColors.text, fontSize: 32, fontFamily: fontFamilySemiBold, marginRight: 6 }}>
                  {isHide ? '******' : '0.00'}
                </AppText>
                <AppText style={{ color: themeColors.text, fontSize: 16, marginBottom: 6 }}>USD</AppText>
              </View>
              <AppText style={{ color: themeColors.secondaryText, fontSize: 13 }}>
                Cumulative Rewards {isHide ? '******' : '0.00 USD'}
              </AppText>
            </View>
            <TouchableOpacity
              style={{ padding: 4 }}
              onPress={() => Toast.showWithGravity('Coming soon', Toast.SHORT, Toast.BOTTOM)}
            >
              <FastImage source={historyIcon} style={{ width: 20, height: 20 }} tintColor={themeColors.text} resizeMode="contain" />
            </TouchableOpacity>
          </View>

          {/* Enabled Pill */}
          {isSoftStakingEnabled ? (
            <TouchableOpacity
              style={[styles.statusPill, { backgroundColor: '#F0F0F0' }]}
              onPress={() => setIsSoftStakingEnabled(false)}
            >
              <AppText style={{ color: themeColors.text, fontSize: 14, fontFamily: fontFamilyMedium, marginRight: 8 }}>Soft Staking</AppText>
              <AppText style={{ color: '#03A66D', fontSize: 12, fontFamily: fontFamilyMedium }}>Enabled</AppText>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.statusPill, { backgroundColor: colors.black, justifyContent: 'center' }]}
              onPress={() => setIsSoftStakingEnabled(true)}
            >
              <AppText style={{ color: colors.white, fontSize: 14, fontFamily: fontFamilyMedium }}>Start Earning</AppText>
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity onPress={() => setActiveTab('Products')} style={styles.tabButton}>
            <AppText style={[styles.tabText, { color: activeTab === 'Products' ? themeColors.text : themeColors.secondaryText, fontFamily: activeTab === 'Products' ? fontFamilySemiBold : fontFamilyMedium }]}>Products</AppText>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('Promotions')} style={styles.tabButton}>
            <AppText style={[styles.tabText, { color: activeTab === 'Promotions' ? themeColors.text : themeColors.secondaryText, fontFamily: activeTab === 'Promotions' ? fontFamilySemiBold : fontFamilyMedium }]}>Promotions</AppText>
          </TouchableOpacity>
        </View>

        {activeTab === 'Products' ? (
          <View style={styles.productsContainer}>
            {/* Search */}
            <View style={[styles.searchContainer, { backgroundColor: '#F0F0F0' }]}>
              <FastImage source={searchIcon} style={styles.searchIconSmall} resizeMode="contain" tintColor={themeColors.secondaryText} />
              <TextInput
                style={[styles.searchInput, { color: themeColors.text }]}
                placeholder="Search"
                placeholderTextColor={themeColors.secondaryText}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Table Header */}
            <View style={styles.tableHeader}>
              <AppText style={styles.tableHeaderText}>Coin</AppText>
              <AppText style={styles.tableHeaderText}>Est. APR</AppText>
            </View>

            {/* Coin List */}
            {packagesLoading ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <AppText style={{ color: themeColors.secondaryText }}>Loading...</AppText>
              </View>
            ) : filteredCoins.length === 0 ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <FastImage source={NO_NOTIFICATION_ICON} style={{ width: 100, height: 100, marginBottom: 16 }} resizeMode="contain" />
              </View>
            ) : filteredCoins.map((item) => {
              const isExpanded = expandedId === item._id;
              return (
                <View key={item._id} style={styles.coinRowContainer}>
                  <TouchableOpacity style={styles.coinRowTop} onPress={() => toggleExpand(item._id)} activeOpacity={0.7}>
                    <View style={styles.coinInfo}>
                      <FastImage source={{ uri: `${IMAGE_BASE_URL}${item.iconPath}` }} style={styles.coinIcon} resizeMode="contain" />
                      <AppText style={[styles.coinName, { color: themeColors.text }]}>{item.currency}</AppText>
                      {item.badge ? (
                        <View style={[styles.badge, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F0F0F0' }]}>
                          <AppText style={[styles.badgeText, { color: themeColors.secondaryText }]}>{item.badge}</AppText>
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.aprSection}>
                      <AppText style={[styles.aprText, { color: themeColors.text }]}>{formatApr(item)}</AppText>
                      <FastImage
                        source={downIcon}
                        style={[styles.arrowIcon, { transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }]}
                        tintColor={themeColors.secondaryText}
                        resizeMode="contain"
                      />
                    </View>
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.expandedDetails}>
                      <View style={styles.detailRow}>
                        <AppText style={[styles.detailLabel, { color: themeColors.secondaryText }]}>Min Holding</AppText>
                        <AppText style={[styles.detailValue, { color: themeColors.text }]}>{item.minAmount} {item.currency}</AppText>
                      </View>
                      <View style={styles.detailRow}>
                        <AppText style={[styles.detailLabel, { color: themeColors.secondaryText }]}>Staking Cap</AppText>
                        <AppText style={[styles.detailValue, { color: themeColors.text }]}>{item.capAmount} {item.currency}</AppText>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.promotionsContainer}>
            {promotionsData.map((promo) => (
              <View key={promo.id} style={[styles.promoCard, { borderColor: isDark ? themeColors.border : '#EAEAEA', }]}>
                {/* Header Row */}
                <View style={styles.promoHeader}>
                  <View style={styles.promoCoinInfo}>
                    <View style={styles.placeholderIconContainer}>
                      <AppText style={styles.placeholderIconText}>{promo.coin.charAt(0)}</AppText>
                    </View>
                    <AppText style={[styles.promoCoinName, { color: themeColors.text }]}>{promo.coin}</AppText>
                  </View>
                  <View style={styles.ongoingTag}>
                    <AppText style={styles.ongoingTagText}>{promo.status}</AppText>
                  </View>
                </View>

                {/* Details */}
                <View style={styles.promoDetails}>
                  <View style={styles.promoDetailRow}>
                    <AppText style={[styles.promoDetailLabel, { color: themeColors.secondaryText }]}>Min Holding</AppText>
                    <AppText style={[styles.promoDetailValue, { color: themeColors.text }]}>{promo.minHolding}</AppText>
                  </View>
                  <View style={styles.promoDetailRow}>
                    <AppText style={[styles.promoDetailLabel, { color: themeColors.secondaryText }]}>Staking Cap</AppText>
                    <AppText style={[styles.promoDetailValue, { color: themeColors.text }]}>{promo.stakingCap}</AppText>
                  </View>
                  <View style={styles.promoDetailRow}>
                    <AppText style={[styles.promoDetailLabel, { color: themeColors.secondaryText }]}>Snapshot Type</AppText>
                    <AppText style={[styles.promoDetailValue, { color: themeColors.text }]}>{promo.snapshotType}</AppText>
                  </View>
                </View>

                {/* Increase Button */}
                <TouchableOpacity style={[styles.increaseBtn, { backgroundColor: '#F0F0F0' }]}>
                  <AppText style={[styles.increaseBtnText, { color: themeColors.text }]}>Increase {promo.coin}</AppText>
                </TouchableOpacity>

                {/* Event Rules */}
                <TouchableOpacity style={styles.eventRulesBtn}>
                  <AppText style={[styles.eventRulesText, { color: themeColors.secondaryText }]}>Event Rules</AppText>
                </TouchableOpacity>

                {/* Reward Box */}
                <View style={[styles.rewardBox, { backgroundColor: '#F0F0F0' }]}>
                  <View style={styles.rewardHeader}>
                    <View style={[styles.placeholderIconContainer, { width: 24, height: 24, borderRadius: 12 }]}>
                      <AppText style={[styles.placeholderIconText, { fontSize: 12 }]}>{promo.coin.charAt(0)}</AppText>
                    </View>
                    <View style={{ marginLeft: 8 }}>
                      <AppText style={[styles.rewardCoinName, { color: themeColors.text }]}>{promo.coin}</AppText>
                      <AppText style={[styles.rewardLabel, { color: themeColors.secondaryText }]}>Reward</AppText>
                    </View>
                  </View>
                  <View style={styles.promoDetailRow}>
                    <AppText style={[styles.promoDetailLabel, { color: themeColors.secondaryText }]}>Est. APR</AppText>
                    <AppText style={[styles.promoDetailValue, { color: themeColors.text }]}>{promo.apr}</AppText>
                  </View>
                  <View style={styles.promoDetailRow}>
                    <AppText style={[styles.promoDetailLabel, { color: themeColors.secondaryText }]}>Cumulative Rewards</AppText>
                    <AppText style={[styles.promoDetailValue, { color: themeColors.text }]}>{promo.cumulativeRewards}</AppText>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <RBSheet
        ref={faqSheetRef}
        keyboardAvoidingViewEnabled={false}
        {...({ customModalProps: { statusBarTranslucent: true } } as any)}
        closeOnDragDown={true}
        closeOnPressMask={true}
        height={450}
        customStyles={{
          wrapper: {
            backgroundColor: "rgba(0,0,0,0.5)"
          },
          draggableIcon: {
            backgroundColor: "transparent",
          },
          container: {
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingBottom: 20,
            backgroundColor: isDark ? themeColors.card : colors.white
          }
        }}
      >
        <View style={styles.modalHeader}>
          <AppText style={[styles.modalTitle, { color: themeColors.text }]}>FAQ</AppText>
          <TouchableOpacity onPress={() => faqSheetRef.current?.close()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <AppText style={[styles.modalCloseText, { color: themeColors.text }]}>×</AppText>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {STAKING_FAQ_ITEMS.map((item, index) => (
            <View key={String(index)} style={[styles.faqItemInner, { borderBottomColor: isDark ? themeColors.border : '#F0F0F5' }, index === STAKING_FAQ_ITEMS.length - 1 && styles.faqItemInnerLast]}>
              <TouchableOpacity
                style={styles.faqQuestionRow}
                onPress={() => setFaqActiveIndex(faqActiveIndex === index ? null : index)}
                activeOpacity={0.7}
              >
                <AppText style={[styles.faqQuestion, { color: themeColors.text }]}>{item.question}</AppText>
                <FastImage
                  source={faqActiveIndex === index ? upIcon : downIcon}
                  resizeMode="contain"
                  style={styles.faqArrow}
                  tintColor={themeColors.text}
                />
              </TouchableOpacity>
              {faqActiveIndex === index && (
                <View style={styles.faqAnswer}>
                  <AppText style={[styles.faqAnswerText, { color: themeColors.secondaryText }]}>{item.answer}</AppText>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      </RBSheet>
    </AppSafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  backIcon: {
    width: 20,
    height: 20,
  },
  headerTitle: {
    fontSize: 18,
  },
  holdingsContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tabButton: {
    marginRight: 24,
  },
  tabText: {
    fontSize: 16,
  },
  productsContainer: {
    paddingHorizontal: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 20,
  },
  searchIconSmall: {
    width: 16,
    height: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
    fontFamily: fontFamilyMedium,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  tableHeaderText: {
    fontSize: 12,
    color: '#888',
    fontFamily: fontFamilyMedium,
  },
  coinRowContainer: {
    marginBottom: 8,
  },
  coinRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  coinInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  coinName: {
    fontSize: 16,
    fontFamily: fontFamilyMedium,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: fontFamilyMedium,
  },
  aprSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aprText: {
    fontSize: 16,
    fontFamily: fontFamilyMedium,
    marginRight: 10,
  },
  arrowIcon: {
    width: 12,
    height: 12,
  },
  expandedDetails: {
    paddingLeft: 34,
    paddingRight: 22,
    paddingBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 13,
    fontFamily: NORMAL,
  },
  detailValue: {
    fontSize: 13,
    fontFamily: fontFamilyMedium,
  },
  promotionsContainer: {
    paddingHorizontal: 20,
  },
  promoCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  promoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  promoCoinInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeholderIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D1AA67',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  placeholderIconText: {
    color: '#FFF',
    fontFamily: fontFamilySemiBold,
    fontSize: 16,
  },
  promoCoinName: {
    fontSize: 18,
    fontFamily: fontFamilySemiBold,
  },
  ongoingTag: {
    backgroundColor: 'rgba(3, 166, 109, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  ongoingTagText: {
    color: '#03A66D',
    fontSize: 10,
    fontFamily: fontFamilyMedium,
  },
  promoDetails: {
    marginBottom: 16,
  },
  promoDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  promoDetailLabel: {
    fontSize: 13,
    fontFamily: NORMAL,
  },
  promoDetailValue: {
    fontSize: 13,
    fontFamily: fontFamilyMedium,
  },
  increaseBtn: {
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  increaseBtnText: {
    fontSize: 14,
    fontFamily: fontFamilyMedium,
  },
  eventRulesBtn: {
    alignItems: 'center',
    marginBottom: 16,
  },
  eventRulesText: {
    fontSize: 12,
    fontFamily: NORMAL,
  },
  rewardBox: {
    borderRadius: 12,
    padding: 16,
  },
  rewardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rewardCoinName: {
    fontSize: 14,
    fontFamily: fontFamilySemiBold,
  },
  rewardLabel: {
    fontSize: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: fontFamilySemiBold,
  },
  modalCloseText: {
    fontSize: 24,
  },
  modalList: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  faqItemInner: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  faqItemInnerLast: {
    borderBottomWidth: 0,
  },
  faqQuestionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontFamily: fontFamilySemiBold,
  },
  faqArrow: {
    width: 14,
    height: 14,
    marginLeft: 10,
  },
  faqAnswer: {
    marginTop: 12,
  },
  faqAnswerText: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: fontFamilyMedium,
  }
});

export default SoftStaking;
