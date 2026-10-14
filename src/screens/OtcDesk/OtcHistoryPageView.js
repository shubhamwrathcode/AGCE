import React, { useMemo } from "react";
import { Platform, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from "react-native";
import { useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SystemBars } from "react-native-edge-to-edge";
import FastImage from "react-native-fast-image";
import { AppText as BaseAppText, MEDIUM, SEMI_BOLD } from "../../shared";
import CoinIcon from "../../common/CoinIcon";
import NavigationService from "../../navigation/NavigationService";
import { useTheme } from "../../hooks/useTheme";
import { back_ic } from "../../helper/ImageAssets";
import { buildMarketIconIndex, sameMarketIconFields, withMarketCoinIcon } from "../../helper/walletCoinIcon";
import { useAppSelector } from "../../store/hooks";
import { fontFamilyMedium, fontFamilySemiBold } from "../../theme/typography";

const BUY = "#0ECB81";
const SELL = "#F6465D";
const LABEL = "#707A8A";

const WEIGHT_FONTS =
  Platform.OS === "ios"
    ? { [SEMI_BOLD]: "Inter18pt-SemiBold", [MEDIUM]: "Inter18pt-Medium" }
    : { [SEMI_BOLD]: fontFamilySemiBold, [MEDIUM]: fontFamilyMedium };

const AppText = ({ weight, style, ...props }) => (
  <BaseAppText
    weight={weight}
    style={WEIGHT_FONTS[weight] ? [{ fontFamily: WEIGHT_FONTS[weight] }, style] : style}
    {...props}
  />
);

const HISTORY_ROWS = [
  { key: "date", label: "Date" },
  { key: "ticketId", label: "Ticket ID" },
  { key: "type", label: "Type" },
  { key: "pair", label: "Symbol" },
  { key: "side", label: "Side" },
  { key: "pay", label: "Amount" },
  { key: "tradedAmount", label: "Traded Amount" },
  { key: "quotePrice", label: "Quote price" },
  { key: "status", label: "Status" },
  { key: "settlement", label: "Settlement Status" },
];

const ACTIVE_ROWS = [
  { key: "date", label: "Date" },
  { key: "ticketId", label: "Ticket ID" },
  { key: "type", label: "Type" },
  { key: "pair", label: "Symbol" },
  { key: "side", label: "Side" },
  { key: "pay", label: "Amount" },
  { key: "status", label: "Status" },
  { key: "limitPrice", label: "Limit Price" },
  { key: "progress", label: "Progress" },
  { key: "averagePrice", label: "Average price" },
  { key: "filledTotal", label: "Filled / Total Amount" },
];

function DetailRow({ label, value, text }) {
  return (
    <View style={styles.detailRow}>
      <AppText style={styles.detailLabel}>{label}</AppText>
      <AppText style={[styles.detailValue, { color: text }]}>{value || "—"}</AppText>
    </View>
  );
}

const OtcHistoryPageView = () => {
  const route = useRoute();
  const { isDark, colors: themeColors } = useTheme();
  const insets = useSafeAreaInsets();
  const headerTop = insets.top || (Platform.OS === "ios" ? 59 : StatusBar.currentHeight || 24);
  const record = route.params?.record || {};
  const section = route.params?.section === "active" ? "active" : "history";
  const text = isDark ? "#E0E0E0" : "#1E2329";
  const pairColor = isDark ? "#FFFFFF" : "#0B0E11";
  const coinData = useAppSelector((state) => state.home.coinData, sameMarketIconFields);
  const base = String(record.pair || "").split("/")[0] || "";
  const coin = useMemo(() => {
    const index = buildMarketIconIndex(coinData);
    return withMarketCoinIcon({ short_name: base, base_currency: base }, index);
  }, [coinData, base]);
  const side = String(record.side || "").trim();
  const kind = String(record.type || "").trim();
  const subtype = [side && side !== "—" ? side : "", kind && kind !== "—" ? kind : "RFQ"].filter(Boolean).join(" ");
  const isSell = side.toLowerCase() === "sell";
  const rows = section === "active" ? ACTIVE_ROWS : HISTORY_ROWS;

  return (
    <View style={[styles.flex1, { backgroundColor: themeColors.background }]}>
      <SystemBars style={isDark ? "light" : "dark"} />
      <View style={[styles.header, { paddingTop: headerTop, backgroundColor: themeColors.background }]}>
        <TouchableOpacity style={styles.headerSide} onPress={() => NavigationService.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <FastImage source={back_ic} style={styles.backIcon} tintColor={pairColor} resizeMode="contain" />
        </TouchableOpacity>
        <View style={styles.headerCenter} pointerEvents="none">
          <AppText weight={SEMI_BOLD} style={{ color: pairColor, fontSize: 17 }}>OTC Order details</AppText>
        </View>
        <View style={styles.headerSide} />
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 24 }]}
      >
        <View style={styles.hero}>
          <View style={styles.pairLine}>
            <CoinIcon
              coin={coin}
              style={styles.coinIcon}
            />
            <AppText weight={MEDIUM} style={{ color: pairColor, fontSize: 16 }}>{record.pair || "—"}</AppText>
          </View>
          <AppText style={styles.datetime}>{record.date || "—"}</AppText>
          {subtype ? (
            <AppText style={[styles.subtype, { color: isSell ? SELL : BUY }]}>{subtype}</AppText>
          ) : null}
        </View>
        <View style={styles.rows}>
          {rows.map((item) => (
            <DetailRow key={item.key} label={item.label} value={record[item.key]} text={text} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default OtcHistoryPageView;

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  header: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  headerSide: { width: 72, alignItems: "flex-start", justifyContent: "center" },
  headerCenter: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 8,
    alignItems: "center",
  },
  backIcon: { width: 22, height: 22 },
  body: { paddingHorizontal: 16, paddingTop: 8 },
  hero: { paddingTop: 4, marginBottom: 8 },
  pairLine: { flexDirection: "row", alignItems: "center", gap: 8 },
  coinIcon: { width: 22, height: 22, borderRadius: 11 },
  datetime: { marginTop: 4, color: LABEL, fontSize: 13, lineHeight: 18 },
  subtype: { marginTop: 2, fontSize: 14, lineHeight: 20 },
  rows: { paddingTop: 4 },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 6,
  },
  detailLabel: { color: LABEL, fontSize: 14, lineHeight: 20, flexShrink: 0 },
  detailValue: { flex: 1, fontSize: 14, lineHeight: 20, textAlign: "right" },
});


