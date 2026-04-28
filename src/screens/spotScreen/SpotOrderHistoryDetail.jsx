import React, { useEffect } from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { AppText } from "../../shared";
import { colors } from "../../theme/colors";
import { useTheme } from "../../hooks/useTheme";
import { useAppSelector } from "../../store/hooks";
import FastImage from "react-native-fast-image";
import { back_ic, cancelcheck, closeIcon, headPhoneIcon, pendingCheck, successcheck } from "../../helper/ImageAssets";
import NavigationService from "../../navigation/NavigationService";
import moment from "moment";
import { toFixedSix, toFixedEight } from "../../helper/utility";
import { fontFamilyBold, fontFamilySemiBold } from "../../theme/typography";

const formatDateTime = (dateString) => {
  if (!dateString) return "---";
  return moment(dateString).format("YYYY-MM-DD HH:mm:ss");
};

const SpotOrderHistoryDetail = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { colors: themeColors, isDark } = useTheme();
  const order = route?.params?.order || {};

  // Log full order data once (to see what detail page receives — then show all on history page)
  useEffect(() => {
    if (Object.keys(order).length > 0) {
      console.log("SpotOrderHistoryDetail — order data received:", JSON.stringify(order, null, 2));
    }
  }, []);

  const baseCurrency = order?.ask_currency || order?.base_currency || order?.base_currency_short_name || "";
  const quoteCurrency = order?.pay_currency || order?.quote_currency || order?.quote_currency_short_name || "";
  const pair = order?.side === "BUY"
    ? `${baseCurrency}/${quoteCurrency}`
    : `${quoteCurrency}/${baseCurrency}`;

  const price = Number(order?.price) || 0;
  const qty = Number(order?.quantity) || 0;
  const remaining = Number(order?.remaining) ?? 0;
  const filledFromApi = Number(order?.filled);
  const filled = filledFromApi != null && !Number.isNaN(filledFromApi) ? filledFromApi : (qty - remaining);
  const avgPrice = Number(order?.avg_execution_price) || price;
  const total = avgPrice * (filled || qty);
  const fee = Number(order?.total_fee) || 0;
  const status = order?.status || "";
  const orderType = (order?.order_type === "MARKET" ? "Market" : "Limit") + " / " + (order?.side === "BUY" ? "Buy" : "Sell");
  const isFilled = status === "FILLED";
  const isCanceled = status === "CANCELLED" || status === "CANCELED";
  const isPending = status === "OPEN" || status === "PENDING" || status === "PARTIAL";

  const orderNo = order?.orderId || order?.order_id || order?._id || order?.id || "---";
  const filledQty = filled;

  const textColor = themeColors.text;
  const labelColor = themeColors.secondaryText;

  const Row = ({ label, value, valueColor, numberOfValueLines = 1 }) => (
    <View style={[styles.row, numberOfValueLines > 1 && styles.rowMultiline]}>
      <AppText style={[styles.label, { color: labelColor }]}>{label}</AppText>
      <AppText
        style={[styles.value, { color: valueColor || textColor }, numberOfValueLines > 1 && styles.valueMultiline]}
        numberOfLines={numberOfValueLines}
      >
        {value}
      </AppText>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <TouchableOpacity onPress={() => NavigationService.goBack()} style={styles.headerBtn}>
          <FastImage source={back_ic} style={styles.backIcon} resizeMode="contain" tintColor={themeColors.text} />
        </TouchableOpacity>
        <AppText style={[styles.headerTitle, { color: themeColors.text }]}>{pair}</AppText>
        <View></View>

      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.statusBlock}>
          <View style={[styles.statusCircle, { borderWidth: 1, borderColor: isFilled ? colors.green : isCanceled ? colors.red : isPending ? (colors.lightYellow || colors.disabledText) : colors.disabledText }]}>
            {isFilled && <FastImage source={successcheck} style={{ width: 40, height: 40 }} resizeMode="contain" />}
            {isCanceled && <FastImage source={cancelcheck} style={styles.statusCircleIcon} resizeMode="contain" />}
            {isPending && <FastImage source={pendingCheck} style={{ width: 30, height: 30 }} resizeMode="contain" />}
          </View>
          <AppText style={[styles.statusText, { color: isFilled ? colors.green : isCanceled ? colors.red : isPending ? (colors.lightYellow || colors.disabledText) : colors.disabledText }]}>
            {isFilled ? "Filled 100%" : isCanceled ? "Canceled" : isPending ? (status === "PARTIAL" ? "Partial" : status === "OPEN" ? "Open" : "Pending") : status}
          </AppText>
        </View>

        {/* Order Summary - same as reference image */}
        <View style={[styles.block, {}]}>
          <Row label="Order No." value={String(orderNo)} numberOfValueLines={2} />
          <Row label="Type" value={orderType} valueColor={order?.side === "BUY" ? colors.green : colors.red} />
          <Row label="Filled / Amount" value={`${toFixedEight(filledQty)} / ${toFixedEight(qty)}`} />
          <Row label="Avg. / Price" value={qty ? `${toFixedSix(avgPrice)} / ${toFixedSix(price)}${isFilled ? " (Counterparty 1)" : ""}` : `0 / ${toFixedSix(price)}`} />
          <Row label="Conditions" value=" -- " />
          <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
          <Row label="Fee" value={`${toFixedEight(fee)} ${baseCurrency}`} />
          <Row label="Total" value={`${toFixedEight(total)} ${quoteCurrency}`} />
          <Row label="Create time" value={formatDateTime(order?.createdAt)} />
          <Row label="Update time" value={formatDateTime(order?.updatedAt)} />
        </View>

        {/* Divider before Trade Details */}
        <View style={[styles.sectionDivider, { backgroundColor: themeColors.border }]} />

        {/* Trade Details - same as reference image */}
        <AppText style={[styles.sectionTitle, { color: textColor }]}>Trade Details</AppText>
        <View style={[styles.block, {}]}>
          <Row label="Date" value={formatDateTime(order?.updatedAt || order?.createdAt)} />
          <Row label="Price" value={toFixedSix(avgPrice)} />
          <Row label="Amount" value={toFixedEight(filledQty || qty)} />
          <Row label="Fee" value={`${toFixedEight(fee)} ${baseCurrency}`} />
          <Row label="Role" value="Taker" />
        </View>
        <AppText style={[styles.noMoreData, { color: labelColor }]}>No more data</AppText>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerBtn: {
    padding: 8,
    minWidth: 40,
  },
  backIcon: {
    width: 20,
    height: 20,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: fontFamilyBold,
    right: 15,
  },
  headerRightIcon: {
    width: 22,
    height: 22,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 21,
    paddingTop: 16,
    paddingBottom: 32,
  },
  statusBlock: {
    alignItems: "center",
    marginBottom: 24,
  },
  statusCircle: {
    width: 50,
    height: 50,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  checkmark: {
    fontSize: 28,
    color: colors.white,
    fontWeight: "bold",
  },
  statusCircleIcon: {
    width: 40,
    height: 40,
  },
  statusText: {
    fontSize: 15,
    fontFamily: fontFamilySemiBold
  },
  block: {
    borderRadius: 12,
    padding: 5,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  rowMultiline: {
    alignItems: "flex-start",
  },
  label: {
    fontSize: 12,
    flex: 1,
  },
  value: {
    fontSize: 12,
    flex: 1,
    textAlign: "right",
  },
  valueMultiline: {
    textAlign: "right",
    flexShrink: 1,
    maxWidth: "70%",
  },
  divider: {
    height: 1,
    opacity: 0.3,
    marginVertical: 12,
  },
  sectionDivider: {
    height: 1,
    opacity: 0.3,
    marginTop: 4,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
  },
  noMoreData: {
    textAlign: "center",
    fontSize: 12,
  },
});

export default SpotOrderHistoryDetail;
