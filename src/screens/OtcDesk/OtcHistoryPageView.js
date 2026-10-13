import React from "react";
import { Platform, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from "react-native";
import { useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SystemBars } from "react-native-edge-to-edge";
import FastImage from "react-native-fast-image";
import { AppText as BaseAppText, BOLD, MEDIUM, SEMI_BOLD } from "../../shared";
import NavigationService from "../../navigation/NavigationService";
import { useTheme } from "../../hooks/useTheme";
import { back_ic } from "../../helper/ImageAssets";
import { fontFamilyBold, fontFamilyMedium, fontFamilySemiBold } from "../../theme/typography";

const WEIGHT_FONTS =
  Platform.OS === "ios"
    ? { [BOLD]: "Inter18pt-Bold", [SEMI_BOLD]: "Inter18pt-SemiBold", [MEDIUM]: "Inter18pt-Medium" }
    : { [BOLD]: fontFamilyBold, [SEMI_BOLD]: fontFamilySemiBold, [MEDIUM]: fontFamilyMedium };

const AppText = ({ weight, style, ...props }) => (
  <BaseAppText
    weight={weight}
    style={WEIGHT_FONTS[weight] ? [{ fontFamily: WEIGHT_FONTS[weight] }, style] : style}
    {...props}
  />
);

const DETAIL_ROWS = [
  { key: "date", label: "Date" },
  { key: "ticketId", label: "Ticket ID" },
  { key: "type", label: "Type" },
  { key: "pair", label: "Symbol" },
  { key: "side", label: "Side" },
  { key: "pay", label: "Amount" },
  { key: "tradedAmount", label: "Traded amount" },
  { key: "quotePrice", label: "Quote price" },
  { key: "status", label: "Status" },
  { key: "settlement", label: "Settlement Status" },
  { key: "receive", label: "You get" },
  { key: "requestRate", label: "Request rate" },
  { key: "deskRate", label: "Desk rate" },
  { key: "limitPrice", label: "Limit price" },
  { key: "progress", label: "Progress" },
  { key: "filledTotal", label: "Filled / Total" },
  { key: "opened", label: "Opened" },
];

function DetailRow({ label, value, text, muted }) {
  return (
    <View style={styles.detailRow}>
      <AppText style={{ color: muted, fontSize: 14, flex: 1 }}>{label}</AppText>
      <AppText weight={SEMI_BOLD} style={{ color: text, fontSize: 14, flex: 1.2, textAlign: "right" }}>
        {value || "—"}
      </AppText>
    </View>
  );
}

const OtcHistoryPageView = () => {
  const route = useRoute();
  const { isDark, colors: themeColors } = useTheme();
  const insets = useSafeAreaInsets();
  const headerTop = insets.top || (Platform.OS === "ios" ? 59 : StatusBar.currentHeight || 24);
  const record = route.params?.record || {};
  const text = themeColors.text;
  const muted = isDark ? "rgba(255,255,255,0.55)" : "#64748B";
  const border = themeColors.border;
  const rows = record.validUntil
    ? [...DETAIL_ROWS, { key: "validUntil", label: "Valid until" }]
    : DETAIL_ROWS;

  return (
    <View style={[styles.flex1, { backgroundColor: themeColors.background }]}>
      <SystemBars style={isDark ? "light" : "dark"} />
      <View style={[styles.header, { paddingTop: headerTop, backgroundColor: themeColors.background }]}>
        <TouchableOpacity style={styles.headerSide} onPress={() => NavigationService.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <FastImage source={back_ic} style={styles.backIcon} tintColor={text} resizeMode="contain" />
        </TouchableOpacity>
        <View style={styles.headerCenter} pointerEvents="none">
          <AppText weight={SEMI_BOLD} style={{ color: text, fontSize: 17 }}>History detail</AppText>
        </View>
        <View style={styles.headerSide} />
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        <View style={styles.hero}>
          <AppText weight={BOLD} style={{ color: text, fontSize: 22 }}>{record.pair || "—"}</AppText>
          <AppText style={{ color: muted, fontSize: 13, marginTop: 4 }}>{record.date || "—"} · {record.ticketId || "—"}</AppText>
        </View>
        <View style={[styles.card, { borderColor: border }]}>
          {rows.map((item) => (
            <DetailRow key={item.key} label={item.label} value={record[item.key]} text={text} muted={muted} />
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
  hero: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 14 },
  card: {
    marginHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: "transparent",
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 10,
  },
});
