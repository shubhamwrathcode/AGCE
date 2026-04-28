import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import {
  AppSafeAreaView,
  AppText,
  ELEVEN,
  FOURTEEN,
  SEMI_BOLD,
  SIXTEEN,
  TEN,
  TWENTY,
  WHITE,
  YELLOW,
} from "../../shared";
import { useTheme } from "../../hooks/useTheme";
import KeyBoardAware from "../../shared/components/KeyboardAware";
import { useAppSelector } from "../../store/hooks";
import { back_ic, BACK_ICON, folder, NO_NOTIFICATION_ICON, NO_NOTIFICATION_ICON_LIGHT } from "../../helper/ImageAssets";
import FastImage from "react-native-fast-image";
import { useState } from "react";
import { colors } from "../../theme/colors";
import NavigationService from "../../navigation/NavigationService";
import moment from "moment";
import { toFixedFive, twoFixedTwo } from "../../helper/utility";

const EarningHistory = () => {
  const { colors: themeColors, theme, isDark } = useTheme();
  const subscribedActivePackages = useAppSelector(
    (state) => state.wallet.subscribedActivePackages
  );
  const subscribedCompletePackages = useAppSelector(
    (state) => state.wallet.subscribedCompletePackages
  );
  const subscribedCancelPackages = useAppSelector(
    (state) => state.wallet.subscribedCancelPackages
  );

  const [activeTab, setActiveTab] = useState("Active");

  let data =
    activeTab === "Active"
      ? subscribedActivePackages
      : activeTab === "Completed"
      ? subscribedCompletePackages
      : subscribedCancelPackages;

  return (
    <AppSafeAreaView style={{ backgroundColor: themeColors.background }}>
      <KeyBoardAware style={{ paddingHorizontal: 20 }}>
        <View style={{flexDirection: "row", alignItems: "center", gap: 20}}>
        <TouchableOpacity
          style={{ marginVertical: 20 }}
          onPress={() => NavigationService.goBack()}
        >
          <FastImage
            source={back_ic}
            style={{ width: 20, height: 20 }}
            resizeMode="contain"
            tintColor={themeColors.text}
          />
        </TouchableOpacity>
        <AppText style={{ margin: 10 }} weight={SEMI_BOLD} type={SIXTEEN}>
          Recent Plans{" "}
        </AppText>
        </View>
        
        
        <View style={styles.tabsWrapper}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "Active" && styles.tabActive,
            ]}
            onPress={() => setActiveTab("Active")}
          >
            <AppText
              weight={SEMI_BOLD}
              type={SIXTEEN}
              style={[styles.tabLabel,{
              color: activeTab === "Active" ? colors.buttonBg : themeColors.text
              }]}
            >
              Active
            </AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "Completed" && styles.tabActive,
            ]}
            onPress={() => setActiveTab("Completed")}
          >
            <AppText
              weight={SEMI_BOLD}
              type={SIXTEEN}
              style={[styles.tabLabel,{
                color: activeTab === "Completed" ? colors.buttonBg : themeColors.text
              }]}
            >
              Completed
            </AppText>
          </TouchableOpacity>
        </View>

        {data?.length > 0 ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
          >
            {data?.map((item, index) => (
              <View key={item?._id || index} style={[styles.historyCard, { backgroundColor: themeColors.themeElevationColor, borderColor: themeColors.border, borderWidth: 1 }]}>
                <View style={styles.cardRow}>
                  <AppText type={ELEVEN} color={themeColors.secondaryText}>Currency</AppText>
                  <AppText type={ELEVEN} weight={SEMI_BOLD} color={themeColors.text}>{item?.currency}</AppText>
                </View>
                <View style={styles.cardRow}>
                  <AppText type={ELEVEN} color={themeColors.secondaryText}>
                    {activeTab === "Active" ? "Deducted From" : "Received In"}
                  </AppText>
                  <AppText type={ELEVEN} style={{color: colors.buttonBg}}>
                    {activeTab === "Active"
                      ? (item?.wallet_type || "")?.toUpperCase()
                      : (item?.credited_wallet_type || "")?.toUpperCase()}{" "}
                    Wallet
                  </AppText>
                </View>
                <View style={styles.cardRow}>
                  <AppText type={ELEVEN} color={themeColors.secondaryText}>Duration</AppText>
                  <AppText type={ELEVEN} color={themeColors.text}>{item?.duration_days} days</AppText>
                </View>
                <View style={styles.cardRow}>
                  <AppText type={ELEVEN} color={themeColors.secondaryText}>Start Date</AppText>
                  <AppText type={ELEVEN} color={themeColors.text}>
                    {moment(item?.start_date).format("YYYY-MM-DD")}
                  </AppText>
                </View>
                <View style={styles.cardRow}>
                  <AppText type={ELEVEN} color={themeColors.secondaryText}>Mature Date</AppText>
                  <AppText type={ELEVEN} color={themeColors.text}>
                    {moment(item?.end_date).format("YYYY-MM-DD")}
                  </AppText>
                </View>
                <View style={styles.cardRow}>
                  <AppText type={ELEVEN} color={themeColors.secondaryText}>Subscription Amount</AppText>
                  <AppText type={ELEVEN} color={themeColors.text}>
                    {toFixedFive(Number(item?.invested_amount?.$numberDecimal || 0))} {item?.currency}
                  </AppText>
                </View>
                <View style={styles.cardRow}>
                  <AppText type={ELEVEN} color={themeColors.secondaryText}>Bonus Amount</AppText>
                  <AppText type={ELEVEN} color={YELLOW}>
                    +{toFixedFive(
                      Number(
                        (item?.expected_return?.$numberDecimal || 0) -
                          (item?.invested_amount?.$numberDecimal || 0)
                      )
                    )}
                  </AppText>
                </View>
                <View style={styles.cardRow}>
                  <AppText type={ELEVEN} color={themeColors.secondaryText}>
                    {activeTab === "Active" ? "Receivable Amount" : "Received Amount"}
                  </AppText>
                  <AppText type={ELEVEN} color={themeColors.text}>
                    {toFixedFive(Number(item?.expected_return?.$numberDecimal || 0))} {item?.currency}
                  </AppText>
                </View>
                <View style={[styles.cardRow, styles.cardRowLast]}>
                  <AppText type={ELEVEN} color={themeColors.secondaryText}>Status</AppText>
                  <AppText type={ELEVEN}  style={{color: colors.buttonBg}}>
                    {item?.status}
                  </AppText>
                </View>
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <FastImage
              source={isDark ? NO_NOTIFICATION_ICON : NO_NOTIFICATION_ICON_LIGHT}
              resizeMode="contain"
              style={{ width: 80, height: 80 }}
            />
          </View>
        )}

        {/* </View> */}
      </KeyBoardAware>
    </AppSafeAreaView>
  );
};

export default EarningHistory;

const styles = StyleSheet.create({
  tabsWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.dividerColor || "#3A3A3A",
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: -1,
  },
  tabLabel: {
    fontSize: 15,
  },
  tabActive: {
    borderBottomWidth: 1,
    borderBottomColor: colors.buttonBg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  historyCard: {
    backgroundColor: colors.themeElevationColor || "#282f3b",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  cardRowLast: {
    borderBottomWidth: 0,
  },
  emptyState: {
    minHeight: 400,
    justifyContent: "center",
    alignItems: "center",
  },
});
