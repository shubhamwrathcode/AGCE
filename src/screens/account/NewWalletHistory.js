import React, { useEffect, useState } from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import {
  AppSafeAreaView,
  AppText,
  Toolbar,
} from "../../shared";
import { colors } from "../../theme/colors";
import { useTheme } from "../../hooks/useTheme";
import { useAppSelector } from "../../store/hooks";
import FastImage from "react-native-fast-image";
import { NO_NOTIFICATION_ICON, NO_NOTIFICATION_ICON_LIGHT } from "../../helper/ImageAssets";
import { getWalletHistory } from "../../actions/walletActions";
import { useDispatch } from "react-redux";
import moment from "moment";
import NewWalletHistorySkeleton from "./NewWalletHistorySkeleton";
import NavigationService from "../../navigation/NavigationService";
import { WALLET_HISTORY_DETAILS_SCREEN } from "../../navigation/routes";
import { fontFamilySemiBold } from "../../theme/typography";

const NewWalletHistory = ({
  investments = [],
  totalSelfInvestment = 0,
  totalDownlineInvestment = 0,
  totalAllInvestment = 0,
}) => {
  const dispatch = useDispatch();
  const { colors: themeColors, isDark } = useTheme();
  const walletHistoryRedux = useAppSelector((state) => state.wallet.walletHistory);
  const [walletHistory, setWalletHistory] = useState([]);
  const [skip, setSkip] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const limit = 10;

  useEffect(() => {
    setSkip(0);
    setHasMore(true);
    setWalletHistory([]);
    setIsInitialLoad(true);
    loadMoreData(0, true);
  }, []);

  useEffect(() => {
    if (walletHistoryRedux == null) return;
    if (isInitialLoad) {
      setWalletHistory(walletHistoryRedux);
      setIsInitialLoad(false);
    } else {
      setWalletHistory(prev => [...prev, ...walletHistoryRedux]);
    }
    if (walletHistoryRedux.length < limit) setHasMore(false);
    setLoading(false);
  }, [walletHistoryRedux]);

  const loadMoreData = (currentSkip, isInitial = false) => {
    if (loading || (!hasMore && !isInitial)) return;
    
    setLoading(true);
    setSkip(currentSkip);
    dispatch(getWalletHistory(currentSkip, limit));
  };

  const handleScroll = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;

    if (isCloseToBottom && hasMore && !loading) {
      const nextSkip = skip + limit;
      loadMoreData(nextSkip);
    }
  };

  const getStatusColor = (status) => {
    if (status === "SUCCESS") return "#4CAF50";
    if (status === "COMPLETED") return "#FF9800";
    return "#F44336";
  };

  const formatDateTimeCard = (dateString) => {
    if (!dateString) return "---";
    return moment(dateString).format("YYYY-MM-DD HH:mm:ss");
  };

  const renderCard = (inv, idx) => {
    const textColor = themeColors.text;
    const labelColor = themeColors.secondaryText;
    const typeLabel = inv?.transaction_type || "Transaction";
    const isDeposit = (typeLabel || "").toLowerCase().includes("deposit");
    const typeColor = isDeposit ? colors.green : (typeLabel || "").toLowerCase().includes("withdraw") ? colors.red : labelColor;

    return (
      <TouchableOpacity
        key={idx}
        activeOpacity={0.8}
        onPress={() => NavigationService.navigate(WALLET_HISTORY_DETAILS_SCREEN, { item: inv })}
        style={styles.card}
      >
        <View style={styles.topRow}>
          <View style={styles.pairRow}>
            {/* <AppText style={[styles.cardTitle, { color: textColor }]}>
              {typeLabel}
            </AppText> */}
          </View>
        
        </View>
 <View style={{width:"100%",flexDirection:"row",justifyContent:"space-between"}}>
        <AppText style={[styles.orderTypeLabel, { color: typeColor }]}>
          {typeLabel}
         
        </AppText>
        <AppText style={[styles.cardDate, { color: labelColor }]}>
            {formatDateTimeCard(inv?.createdAt)}
          </AppText>
        </View>

        <View style={styles.cardRow}>
          <AppText style={[styles.cardLabel, { color: labelColor }]}>Amount:</AppText>
          <AppText style={[styles.cardValue, { color: textColor }]}>{inv?.amount ?? "0"}</AppText>
        </View>
        <View style={styles.cardRow}>
          <AppText style={[styles.cardLabel, { color: labelColor }]}>Chain:</AppText>
          <AppText style={[styles.cardValue, { color: textColor }]}>{inv?.chain || "---"}</AppText>
        </View>
        <View style={styles.cardRow}>
          <AppText style={[styles.cardLabel, { color: labelColor }]}>Fee:</AppText>
          <AppText style={[styles.cardValue, { color: textColor }]}>{inv?.fee ?? "0"}</AppText>
        </View>
        <View style={styles.cardRow}>
          <AppText style={[styles.cardLabel, { color: labelColor }]}>Status:</AppText>
          <AppText style={[styles.cardValue, { color: getStatusColor(inv?.status) }]}>{inv?.status || "---"}</AppText>
        </View>

        <View style={[styles.cardDivider, { backgroundColor: themeColors.border }]} />
      </TouchableOpacity>
    );
  };

  return (
    <AppSafeAreaView
      style={[
        styles.container,
        { backgroundColor: themeColors.background },
      ]}
    >
      <Toolbar
        isSecond
        title={"Deposit/Withdrawal history"}
        style={{ width: "75%", backgroundColor: "transparent" }}
      />

      {(walletHistoryRedux == null || isInitialLoad) ? (
        <NewWalletHistorySkeleton />
      ) : walletHistory?.length > 0 ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          onScroll={handleScroll}
          scrollEventThrottle={400}
        >
          {walletHistory.map((inv, idx) => renderCard(inv, idx))}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.buttonBg || "#007AFF"} />
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.noDataRow}>
          <FastImage
            source={isDark ? NO_NOTIFICATION_ICON : NO_NOTIFICATION_ICON_LIGHT}
            resizeMode="contain"
            style={{ width: 80, height: 80 }}
          />
        </View>
      )}
    </AppSafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 5,
    paddingBottom: 20,
  },
  card: {
    padding: 14,
    paddingBottom: 0,
    width: "100%",
    alignSelf: "center",
  },
  cardDivider: {
    height: 1,
    marginTop: 14,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  pairRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 14,
    marginRight: 6,
    fontFamily: fontFamilySemiBold,
  },
  cardDate: {
    fontSize: 11,
  },
  orderTypeLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
    justifyContent:"space-between"
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  cardLabel: {
    fontSize: 12,
    flex: 1,
  },
  cardValue: {
    fontSize: 12,
    flex: 1,
    textAlign: "right",
  },
  noDataRow: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    paddingTop: 50,
  },
  noDataText: {
    color: "#888",
    fontStyle: "italic",
    marginTop: 10,
    fontSize: 14,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default NewWalletHistory;
