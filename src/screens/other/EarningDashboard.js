import {
  Dimensions,
  ScrollView,
  StyleSheet,
  View,
  Platform,
} from "react-native";
import React, { useMemo, useState } from "react";
import Carousel from "react-native-reanimated-carousel";
import {
  AppText,
  BLACK,
  FOURTEEN,
  NINE,
  SEMI_BOLD,
  TEN,
  TWELVE,
  YELLOW,
} from "../../shared";
import FastImage from "react-native-fast-image";
import LinearGradient from "react-native-linear-gradient";
import { NO_NOTIFICATION_ICON, NO_NOTIFICATION_ICON_LIGHT } from "../../helper/ImageAssets";
import { colors } from "../../theme/colors";
import { useTheme } from "../../hooks/useTheme";
import { BASE_URL } from "../../helper/Constants";
import { toFixedFive } from "../../helper/utility";
import moment from "moment";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PADDING = 20;
const PORTFOLIO_CARD_WIDTH = SCREEN_WIDTH - PADDING * 2;
const SHIMMER_STRIP_WIDTH = 100;

const formatNum = (val, decimals = 2) => {
  if (val == null || val === undefined) return "0.00";
  const n = typeof val === "object" && val?.$numberDecimal
    ? parseFloat(val.$numberDecimal)
    : Number(val);
  if (isNaN(n)) return "0.00";
  return n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

const parseAmount = (val) => {
  if (val == null || val === undefined) return 0;
  if (typeof val === "object" && val?.$numberDecimal != null) return parseFloat(val.$numberDecimal);
  return Number(val) || 0;
};

const EarningDashboard = ({
  earningPortfolio = [],
  portfolioSummary = {},
  children,
}) => {
  const { colors: themeColors, theme, isDark } = useTheme();
  const [portfolioCarouselIndex, setPortfolioCarouselIndex] = useState(0);
  const textColor = isDark ? colors.white : colors.black;
  const secondaryColor = isDark ? colors.descText : "#666";
  const cardBg = themeColors.themeElevationColor;
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const dividerColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const boneColor = themeColors.themeElevationColor;
  const shimmerColors = isDark 
    ? ["transparent", "rgba(255,255,255,0.16)", "transparent"]
    : ["transparent", "rgba(0,0,0,0.05)", "transparent"];

  const summary = useMemo(
    () => ({
      totalInvested: portfolioSummary?.total_invested ?? portfolioSummary?.totalInvested ?? 0,
      expectedReturn: portfolioSummary?.total_expected_return ?? portfolioSummary?.totalExpectedReturn ?? 0,
      runningInvestment: portfolioSummary?.total_running_investment ?? portfolioSummary?.totalRunningInvestment ?? 0,
      bonusRemaining: portfolioSummary?.total_bonus_remaining ?? portfolioSummary?.totalBonusRemaining ?? 0,
    }),
    [portfolioSummary]
  );

  const balanceCards = [
    { label: "Total Invested", value: formatNum(summary.totalInvested), key: "invested" },
    { label: "Expected Return", value: formatNum(summary.expectedReturn), key: "return" },
    { label: "Running Investment", value: formatNum(summary.runningInvestment), key: "running" },
    { label: "Bonus Remaining", value: formatNum(summary.bonusRemaining), key: "bonus" },
  ];

  const ShimmerBox = ({ width: w, height, borderRadius = 6, style }) => {
    const shimmerX = useRef(new Animated.Value(-SHIMMER_STRIP_WIDTH)).current;
    return (
      <View style={[{ width: w, height, borderRadius, backgroundColor: boneColor, overflow: 'hidden' }, style]}>
        <Animated.View style={{ width: SHIMMER_STRIP_WIDTH, height: '100%', transform: [{ translateX: shimmerX }] }}>
          <LinearGradient colors={shimmerColors} style={{ flex: 1 }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
        </Animated.View>
      </View>
    );
  };

  const renderAssetRow = (item, index) => {
    const invested = item?.invested_amount ?? item?.invested ?? 0;
    const expected = item?.expected_return ?? item?.expected_return ?? 0;
    const running = item?.running_investment ?? item?.running_investment ?? 0;
    const bonus = item?.bonus_remaining ?? item?.bonus_remaining ?? 0;
    const totalEarned = item?.total_earned ?? item?.totalEarned ?? 0;
    const payoutCount = item?.payout_count ?? item?.payoutCount ?? 0;
    const lastPayout = item?.last_payout_date ?? item?.lastPayoutDate;
    const useBonusFormat = invested !== 0 || expected !== 0 || running !== 0 || bonus !== 0;

    return (
      <View key={item?.currency_id || item?._id || index} style={[styles.assetCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <View style={styles.assetCardHeader}>
          <View style={styles.assetCurrencyRow}>
            {item?.icon_path ? (
              <FastImage
                source={{ uri: BASE_URL + item.icon_path }}
                style={styles.assetIcon}
                resizeMode="contain"
              />
            ) : null}
            <View>
              <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: textColor }}>
                {item?.currency}
              </AppText>
              {item?.currency_fullname ? (
                <AppText type={TEN} style={{ color: secondaryColor, marginTop: 2 }}>{item.currency_fullname}</AppText>
              ) : null}
            </View>
          </View>
        </View>
        <View style={[styles.assetCardDivider, { backgroundColor: dividerColor }]} />
        {useBonusFormat ? (
          <View style={styles.assetDetails}>
            <View style={styles.assetDetailRow}>
              <AppText type={TEN} style={{ color: secondaryColor }}>Total Invested</AppText>
              <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: textColor }}>{formatNum(invested)} {item?.currency}</AppText>
            </View>
            <View style={styles.assetDetailRow}>
              <AppText type={TEN} style={{ color: secondaryColor }}>Expected Return</AppText>
              <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: textColor }}>{formatNum(expected)} {item?.currency}</AppText>
            </View>
            <View style={styles.assetDetailRow}>
              <AppText type={TEN} style={{ color: secondaryColor }}>Running</AppText>
              <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: textColor }}>{formatNum(running)} {item?.currency}</AppText>
            </View>
            <View style={styles.assetDetailRow}>
              <AppText type={TEN} style={{ color: secondaryColor }}>Bonus Remaining</AppText>
              <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: colors.buttonBg }}>{formatNum(bonus)} {item?.currency}</AppText>
            </View>
          </View>
        ) : (
          <View style={styles.assetDetails}>
            <View style={styles.assetDetailRow}>
              <AppText type={TEN} style={{ color: secondaryColor }}>Total earned</AppText>
              <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: textColor }}>{formatNum(totalEarned)} {item?.currency}</AppText>
            </View>
            <View style={styles.assetDetailRow}>
              <AppText type={TEN} style={{ color: secondaryColor }}>Payout</AppText>
              <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: textColor }}>{formatNum(payoutCount)}</AppText>
            </View>
            <View style={styles.assetDetailRow}>
              <AppText type={TEN} style={{ color: secondaryColor }}>Last Payout</AppText>
              <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: textColor }}>
                {lastPayout ? moment(lastPayout).format("MMM DD, YYYY hh:mm A") : "—"}
              </AppText>
            </View>
          </View>
        )}
      </View>
    );
  };

  const emptyList = (
    <View style={styles.emptyWrap}>
      <FastImage source={isDark ? NO_NOTIFICATION_ICON : NO_NOTIFICATION_ICON_LIGHT} resizeMode="contain" style={styles.emptyIcon} />
      <AppText type={FOURTEEN} style={{ color: secondaryColor }}>Start investing to see your portfolio</AppText>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.headerRow, { marginTop: 5 }]}>
        <View style={styles.headerTextWrap}>
          <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: textColor, marginBottom: 8 }}>
            Zillion Exchange Earning Balance
          </AppText>
          <AppText type={TEN} style={{ color: secondaryColor }}>
            View your total earnings, rewards, and growth in one place.
          </AppText>
        </View>
        {/* <FastImage source={earning_balance_vector} style={styles.headerVector} resizeMode="contain" /> */}
      </View>

      {/* 4 Balance cards - or custom children from Earning.js */}
      {children != null ? children : (
        <View style={styles.balanceGrid}>
          {balanceCards.map((card) => (
            <View key={card.key} style={[styles.balanceCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: textColor }}>
                {card.value} $
              </AppText>
              <AppText type={TEN} style={{ color: secondaryColor, marginTop: 6 }}>
                {card.label}
              </AppText>
            </View>
          ))}
        </View>
      )}

      {/* My Earning Portfolio - Carousel */}
      {Array.isArray(earningPortfolio) && earningPortfolio.length > 0 && (
        <>
          <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: textColor, marginTop: 20, marginBottom: 12 }}>
            My Earning Portfolio
          </AppText>
          <Carousel
            loop={earningPortfolio.length > 1}
            width={PORTFOLIO_CARD_WIDTH}
            height={200}
            data={earningPortfolio}
            autoPlay
            autoPlayInterval={3500}
            scrollAnimationDuration={350}
            onSnapToItem={(index) => setPortfolioCarouselIndex(index)}
            renderItem={({ item }) => (
              <View style={[styles.portfolioCard, { backgroundColor: cardBg, borderColor: cardBorder, width: PORTFOLIO_CARD_WIDTH }]}>
                <View style={styles.portfolioCardPadding}>
                  <View style={styles.portfolioCardHeader}>
                    <View style={styles.portfolioCardCurrencyRow}>
                      <FastImage source={{ uri: BASE_URL + item?.icon_path }} style={styles.portfolioCardIcon} resizeMode="contain" />
                      <AppText color={colors.white} type={FOURTEEN} weight={SEMI_BOLD}>{item?.currency}</AppText>
                      <AppText color={colors.descText} type={FOURTEEN} weight={SEMI_BOLD}>({item?.currency_fullname})</AppText>
                    </View>
                    <View style={styles.portfolioCardPremiumTag}>
                      <AppText color={BLACK} type={TWELVE} weight={SEMI_BOLD}>Premium</AppText>
                    </View>
                  </View>
                  <View style={styles.portfolioCardRow}>
                    <View>
                      <AppText type={TWELVE} color={colors.white} weight={SEMI_BOLD}>{toFixedFive(item?.invested_amount)} {item?.currency}</AppText>
                      <AppText type={NINE} color={colors.descText}>Total Subscription Amount</AppText>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <AppText type={TWELVE} color={colors.white} weight={SEMI_BOLD}>{toFixedFive(item?.running_investment)} {item?.currency}</AppText>
                      <AppText type={NINE} color={colors.descText}>In-Order Balance</AppText>
                    </View>
                  </View>
                  <View style={styles.portfolioCardRow}>
                    <View>
                      <AppText type={TWELVE} color={colors.white} weight={SEMI_BOLD}>{toFixedFive(item?.bonus_remaining)} {item?.currency}</AppText>
                      <AppText type={NINE} color={colors.descText}>Remaining Bonus</AppText>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <AppText type={TWELVE} color={colors.white} weight={SEMI_BOLD}>{toFixedFive(item?.bonus_given)} {item?.currency}</AppText>
                      <AppText type={NINE} color={colors.descText}>Earned Bonus</AppText>
                    </View>
                  </View>
                </View>
              </View>
            )}
            style={styles.portfolioCarousel}
          />
          <View style={styles.portfolioDotsRow}>
            {earningPortfolio.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.portfolioDot,
                  portfolioCarouselIndex === index && styles.portfolioDotActive,
                ]}
              />
            ))}
          </View>
        </>
      )}

      {/* Earning Assets */}
      <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: textColor, marginTop: 20, marginBottom: 12 }}>
        Earning Assets
      </AppText>
      {Array.isArray(earningPortfolio) && earningPortfolio.length > 0 ? (
        earningPortfolio.map((item, index) => renderAssetRow(item, index))
      ) : (
        emptyList
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

export default EarningDashboard;

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 20 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },
  headerVector: {
    width: 100,
    height: 80,
  },
  balanceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  balanceCard: {
    width: "47%",
    minWidth: "47%",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    ...Platform.select({
      android: { elevation: 4 },
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8 },
    }),
  },
  portfolioCard: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    ...Platform.select({
      android: { elevation: 4 },
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8 },
    }),
  },
  portfolioCardPadding: { padding: 20 },
  portfolioCarousel: { width: "100%", alignSelf: "center" },
  portfolioDotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    gap: 8,
  },
  portfolioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  portfolioDotActive: { backgroundColor: colors.white },
  portfolioCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  portfolioCardCurrencyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  portfolioCardIcon: { width: 30, height: 30 },
  portfolioCardPremiumTag: {
    backgroundColor: YELLOW,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  portfolioCardRow: {
    marginTop: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  assetCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    overflow: "hidden",
    ...Platform.select({
      android: { elevation: 4 },
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8 },
    }),
  },
  assetCardHeader: {
    marginBottom: 12,
  },
  assetCardDivider: {
    height: 1,
    marginBottom: 12,
  },
  assetCurrencyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  assetIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  assetDetails: { gap: 10 },
  assetDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    opacity: 0.7,
    marginTop: 20
  },
});
