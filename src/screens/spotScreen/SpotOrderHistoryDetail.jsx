import React from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { useRoute } from "@react-navigation/native";
import { AppText, MEDIUM } from "../../shared";
import { colors } from "../../theme/colors";
import { useTheme } from "../../hooks/useTheme";
import FastImage from "react-native-fast-image";
import { back_ic, right_ic } from "../../helper/ImageAssets";
import NavigationService from "../../navigation/NavigationService";
import moment from "moment";
import { toFixedEight } from "../../helper/utility";
import { fontFamilyBold } from "../../theme/typography";

const SpotOrderHistoryDetail = () => {
  const route = useRoute();
  const { colors: themeColors } = useTheme();
  const order = route?.params?.item || {}; // Changed to match Spot.jsx navigation

  // 1. Try to get symbols from explicit currency fields (Most reliable)
  const baseCurrency = order?.ask_currency || order?.base_currency || order?.base_currency_short_name || "";
  const quoteCurrency = order?.pay_currency || order?.quote_currency || order?.quote_currency_short_name || "";

  let pair = "---";
  if (baseCurrency && quoteCurrency) {
    pair = `${baseCurrency}/${quoteCurrency}`;
  } else {
    // 2. Fallback: If fields are missing, handle the pair string carefully
    const rawPair = order?.pair || "";
    if (rawPair.includes("/")) {
      pair = rawPair;
    } else if (rawPair.length >= 5) {
      // Find where common quote currencies start from the end
      const quotes = ["USDT", "BTC", "ETH", "INR", "BNB", "TRX"];
      let found = false;
      for (const q of quotes) {
        if (rawPair.endsWith(q)) {
          const base = rawPair.slice(0, rawPair.length - q.length);
          pair = `${base}/${q}`;
          found = true;
          break;
        }
      }
      // 3. Absolute Fallback: If still not found, just use the string as is or split at last 3/4
      if (!found) {
        pair = rawPair; // Don't split if unsure, better than wrong split
      }
    }
  }

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

  const getSideColor = (s) => (s === "BUY" ? colors.green : colors.red);
  const getStatusColor = (st) => {
    if (st === "FILLED" || st === "EXECUTED" || st === "SUCCESS") return colors.green;
    if (st === "CANCELLED" || st === "CANCELED" || st === "REJECTED") return colors.red;
    return colors.lightYellow || "#EAB308";
  };

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
            <FastImage source={right_ic} style={styles.chevron} resizeMode="contain" tintColor={labelColor} />
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
          <Row label="TIF" value={order?.time_in_force || order?.tif || "GTC"} />
          <Row label="Price" value={type === "MARKET" ? "Market" : toFixedEight(price)} />
          <Row label="Avg" value={toFixedEight(avgPrice)} />
          <Row label="Quantity" value={toFixedEight(qty)} />
          <Row label="Filled" value={toFixedEight(filled)} />
          <Row label="Remaining" value={toFixedEight(remaining)} />
          <Row label="Fill %" value={order?.fill_percent || (qty > 0 ? `${Math.round((filled / qty) * 100)}%` : "0%")} />
          <Row label="Value" value={toFixedEight(value)} />
          <Row label="Fee" value={`${toFixedEight(fee)} ${quoteCurrency || ""}`} />
          <Row label="TDS" value={toFixedEight(tds)} />
          <Row label="Status" value={status} valueColor={getStatusColor(status)} />
        </View>
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
    paddingHorizontal: 30,
    paddingTop: 20,
    paddingBottom: 40,
  },
  topSection: {
    marginBottom: 20,
  },
  pairHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
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
    marginBottom: 4,
  },
  sideType: {
    fontSize: 12,
  },
  listSection: {
    marginTop: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
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
});

export default SpotOrderHistoryDetail;
