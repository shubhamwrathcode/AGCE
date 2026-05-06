import React, { useState } from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRoute } from "@react-navigation/native";
import { useDispatch } from "react-redux";
import { AppText, MEDIUM } from "../../shared";
import { colors } from "../../theme/colors";
import { useTheme } from "../../hooks/useTheme";
import FastImage from "react-native-fast-image";
import { back_ic, right_ic } from "../../helper/ImageAssets";
import NavigationService from "../../navigation/NavigationService";
import moment from "moment";
import { toFixedEight, spotOpenOrderMarketLabel } from "../../helper/utility";
import { fontFamilyBold } from "../../theme/typography";
import { cancelOrder } from "../../actions/homeActions";

const SpotOrderHistoryDetail = () => {
  const route = useRoute();
  const dispatch = useDispatch();
  const { colors: themeColors } = useTheme();
  const order = route?.params?.order ?? route?.params?.item ?? {};

  const pair = spotOpenOrderMarketLabel(order);
  const quoteCurrency =
    order?.pay_currency ||
    order?.quote_currency ||
    order?.quote_currency_short_name ||
    order?.quote_asset ||
    (typeof pair === "string" && pair.includes("/") ? pair.split("/")[1]?.trim() : "") ||
    "";

  const price = Number(order?.price) || 0;
  const qty = Number(order?.quantity) || 0;
  const filled = Number(order?.filled_quantity ?? order?.filled ?? 0);
  const remaining = Number(order?.remaining_quantity ?? order?.remaining ?? 0);
  const avgPrice = Number(order?.avg_execution_price ?? order?.avgPrice ?? order?.average_price ?? price);
  const value = Number(order?.executed_value ?? order?.executedValue ?? (avgPrice * filled));
  const fee = Number(order?.total_fee ?? order?.fee ?? 0);
  const tds = Number(order?.total_tds ?? order?.tds ?? 0);
  const status = String(order?.status || "").toUpperCase();
  const side = String(order?.side || "").toUpperCase();
  const type = String(order?.order_type || order?.type || "MARKET").toUpperCase();

  const d = order?.updatedAt || order?.updated_at || order?.createdAt || order?.created_at;
  const dateStr = d ? moment(d).format("DD/MM/YYYY") : "---";
  const timeStr = d ? moment(d).format("HH:mm:ss") : "---";

  const getSideColor = (s) => (s === "BUY" ? themeColors.green : themeColors.red);
  const getStatusColor = (st) => {
    if (st === "FILLED" || st === "EXECUTED" || st === "SUCCESS") return themeColors.green;
    if (st === "CANCELLED" || st === "CANCELED" || st === "REJECTED") return themeColors.red;
    return themeColors.yellow || colors.lightYellow || "#EAB308";
  };

  const orderIdForCancel = order?._id || order?.id;
  const statusUpperCancel = String(order?.status || order?.user_status || "").toUpperCase();
  const canCancel =
    !!orderIdForCancel &&
    !["FILLED", "CANCELLED", "CANCELED", "COMPLETED", "EXECUTED", "REJECTED"].includes(statusUpperCancel);

  const [cancelLoading, setCancelLoading] = useState(false);

  const rawTif = order?.time_in_force ?? order?.tif ?? order?.timeInForce;
  const tifDisplay =
    rawTif != null && String(rawTif).trim() !== "" ? String(rawTif).trim().toUpperCase() : "—";

  const textColor = themeColors.text;
  const labelColor = themeColors.secondaryText;

  const Row = ({ label, value, valueColor }) => (
    <View style={styles.row}>
      <AppText style={[styles.label, { color: labelColor }]}>{label}</AppText>
      <AppText style={[styles.value, { color: valueColor || textColor }]}>{value}</AppText>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* Header Bar */}
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <TouchableOpacity onPress={() => NavigationService.goBack()} style={styles.headerBtn}>
          <FastImage source={back_ic} style={styles.backIcon} resizeMode="contain" tintColor={themeColors.text} />
        </TouchableOpacity>
        <AppText style={[styles.headerTitle, { color: themeColors.text }]}>Order Details</AppText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Summary Header */}
        <View style={styles.topSection}>
          <View style={styles.pairHeaderRow}>
            <AppText style={[styles.pairTitle, { color: textColor }]} weight={MEDIUM}>{pair}</AppText>
          </View>
          <AppText style={[styles.dateTime, { color: labelColor }]}>{dateStr} {timeStr}</AppText>
          <AppText style={[styles.sideType, { color: getSideColor(side) }]} weight={MEDIUM}>
            {side} · {type}
          </AppText>
        </View>

        {/* List of Details (Matches Screenshot) */}
        <View style={styles.listSection}>
          <Row label="Date" value={dateStr} />
          <Row label="Time" value={timeStr} />
          <Row label="Market" value={pair} />
          <Row label="Side" value={side} valueColor={getSideColor(side)} />
          <Row label="Type" value={type} />
          <Row label="TIF" value={tifDisplay} />
          <Row label="Price" value={type === "MARKET" ? "Market" : toFixedEight(price)} />
          <Row label="Avg" value={toFixedEight(avgPrice)} />
          <Row label="Quantity" value={toFixedEight(qty)} />
          <Row label="Filled" value={toFixedEight(filled)} />
          <Row label="Remaining" value={toFixedEight(remaining)} />
          <Row label="Fill %" value={order?.fill_percent || (qty > 0 ? `${Math.round((filled / qty) * 100)}%` : "0%")} />
          <Row label="Value" value={toFixedEight(value)} />
          <Row label="Fee" value={`${toFixedEight(fee)} ${quoteCurrency}`.trim()} />
          <Row label="TDS" value={toFixedEight(tds)} />
          <Row label="Status" value={status} valueColor={getStatusColor(status)} />
        </View>

        {canCancel ? (
          <TouchableOpacity
            activeOpacity={0.8}
            disabled={cancelLoading}
            onPress={async () => {
              const oid = order?._id || order?.id;
              if (!oid) return;
              setCancelLoading(true);
              try {
                const res = await dispatch(cancelOrder({ order_id: oid }));
                if (res?.success) {
                  NavigationService.goBack();
                }
              } finally {
                setCancelLoading(false);
              }
            }}
            style={styles.cancelOrderBtn}
          >
            {cancelLoading ? (
              <ActivityIndicator size="small" color={colors.red} />
            ) : (
              <AppText style={[styles.cancelOrderText, { color: colors.red }]} weight={MEDIUM}>
                Cancel order
              </AppText>
            )}
          </TouchableOpacity>
        ) : null}
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
  },
  backIcon: {
    width: 20,
    height: 20,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: fontFamilyBold,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 25,
    paddingTop: 16,
    paddingBottom: 32,
  },
  topSection: {
    marginBottom: 12,
  },
  pairHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  pairTitle: {
    fontSize: 16,
    marginRight: 6,
  },
  chevron: {
    width: 12,
    height: 12,
  },
  dateTime: {
    fontSize: 11,
    marginBottom: 2,
  },
  sideType: {
    fontSize: 12,
    marginTop: 2,
  },
  listSection: {
    marginTop: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
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
  cancelOrderBtn: {
    marginTop: 18,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  cancelOrderText: {
    fontSize: 15,
    fontWeight: "600",
  },
});

export default SpotOrderHistoryDetail;
