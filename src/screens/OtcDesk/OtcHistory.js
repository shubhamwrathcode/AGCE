import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SystemBars } from "react-native-edge-to-edge";
import FastImage from "react-native-fast-image";
import { AppText as BaseAppText, BOLD, MEDIUM, SEMI_BOLD } from "../../shared";
import NavigationService from "../../navigation/NavigationService";
import { useTheme } from "../../hooks/useTheme";
import { appOperation } from "../../appOperation";
import { CUSTOMER_TYPE } from "../../appOperation/types";
import { back_ic } from "../../helper/ImageAssets";
import { fontFamilyBold, fontFamilyMedium, fontFamilySemiBold } from "../../theme/typography";
import { deskView } from "./otcDeskLogic";
import { buildOtcTableRows, otcDetailRecord } from "./otcRecords";
import { OTC_HISTORY_PAGE_VIEW } from "../../navigation/routes";

const GOLD = "#D1AA67";
const PAGE_SIZE = 20;
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

function buildPalette(isDark, themeColors) {
  return {
    page: themeColors.background,
    card: isDark ? themeColors.card : "#FFFFFF",
    cardBorder: themeColors.border,
    text: themeColors.text,
    muted: isDark ? "rgba(255,255,255,0.55)" : "#64748B",
    line: isDark ? "rgba(255,255,255,0.08)" : "#E6EBF2",
    sheet: isDark ? themeColors.card : "#FFFFFF",
    buy: themeColors.spotTradeBuy,
    sell: themeColors.spotTradeSell,
    buySoft: isDark ? "rgba(56,183,129,0.16)" : "rgba(56,183,129,0.12)",
    sellSoft: isDark ? "rgba(237,78,78,0.16)" : "rgba(237,78,78,0.12)",
    goldSoft: "rgba(209,170,103,0.16)",
  };
}

function DetailRow({ label, value, palette, valueColor }) {
  return (
    <View style={styles.detailRow}>
      <AppText style={{ color: palette.muted, fontSize: 13, flex: 1 }}>{label}</AppText>
      <AppText weight={SEMI_BOLD} style={{ color: valueColor || palette.text, fontSize: 13, flex: 1.4, textAlign: "right" }}>
        {value}
      </AppText>
    </View>
  );
}

const OtcHistory = () => {
  const route = useRoute();
  const { isDark, colors: themeColors } = useTheme();
  const palette = buildPalette(isDark, themeColors);
  const insets = useSafeAreaInsets();
  const headerTop = insets.top || (Platform.OS === "ios" ? 59 : StatusBar.currentHeight || 24);
  const initialTab = route.params?.initialTab === "active" ? "active" : "history";
  const [tab, setTab] = useState(initialTab);
  const [items, setItems] = useState([]);
  const [rfq, setRfq] = useState(null);
  const [quote, setQuote] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const requestGen = useRef(0);
  const itemsRef = useRef([]);

  const load = useCallback(async (nextPage, nextTab, mode) => {
    const gen = ++requestGen.current;
    if (mode === "more") setLoadingMore(true);
    else if (mode === "refresh") setRefreshing(true);
    else setLoading(true);

    const tradesRes = await appOperation.get(
      "otc/trades",
      { page: nextPage, limit: PAGE_SIZE, view: nextTab },
      undefined,
      CUSTOMER_TYPE
    ).catch(() => null);
    const currentRes = nextPage === 1
      ? await appOperation.get("otc/rfq/current", undefined, undefined, CUSTOMER_TYPE).catch(() => null)
      : null;
    if (gen !== requestGen.current) return;

    const data = tradesRes?.data || {};
    const batch = Array.isArray(data.items) ? data.items : [];
    const limit = Number(data.limit) > 0 ? Number(data.limit) : PAGE_SIZE;
    const total = Number(data.total ?? tradesRes?.pagination?.total);
    const totalPages = Number(data.totalPages ?? tradesRes?.pagination?.totalPages);
    const more = Number.isFinite(totalPages) && totalPages > 0
      ? nextPage < totalPages
      : Number.isFinite(total) && total > 0
        ? nextPage * limit < total
        : batch.length >= limit;
    const base = nextPage === 1 ? [] : itemsRef.current;
    const seen = new Set(base.map((row) => String(row?.id || "")));
    const fresh = batch.filter((row) => row?.id && !seen.has(String(row.id)));
    const nextItems = [...base, ...fresh];
    itemsRef.current = nextItems;
    setItems(nextItems);
    if (currentRes?.success && currentRes.data?.rfq?.id) {
      setRfq(currentRes.data.rfq);
      setQuote(currentRes.data.quote || null);
    } else if (nextPage === 1) {
      setRfq(null);
      setQuote(null);
    }
    setPage(nextPage);
    setHasMore(more && fresh.length > 0);
    setLoading(false);
    setLoadingMore(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load(1, tab, "replace");
  }, [load, tab]);

  const rows = useMemo(
    () => buildOtcTableRows({
      tab,
      trades: items,
      rfq,
      quote,
      trade: null,
      view: deskView(rfq, quote, Date.now()),
    }),
    [tab, items, rfq, quote]
  );

  const switchTab = (next) => {
    if (next === tab) return;
    requestGen.current += 1;
    itemsRef.current = [];
    setItems([]);
    setHasMore(false);
    setLoading(true);
    setTab(next);
  };

  return (
    <View style={[styles.flex1, { backgroundColor: palette.page }]}>
      <SystemBars style={isDark ? "light" : "dark"} />
      <View style={[styles.header, { paddingTop: headerTop, backgroundColor: palette.page }]}>
        <TouchableOpacity style={styles.headerSide} onPress={() => NavigationService.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <FastImage source={back_ic} style={styles.backIcon} tintColor={palette.text} resizeMode="contain" />
        </TouchableOpacity>
        <View style={styles.headerCenter} pointerEvents="none">
          <AppText weight={SEMI_BOLD} style={{ color: palette.text, fontSize: 17 }}>OTC History</AppText>
        </View>
        <View style={styles.headerSide} />
      </View>

      <View style={[styles.histTabs, { borderBottomColor: palette.line }]}>
        {[
          { id: "active", label: "Active" },
          { id: "history", label: "History" },
        ].map((item) => {
          const selected = tab === item.id;
          return (
            <Pressable key={item.id} style={styles.histTab} onPress={() => switchTab(item.id)}>
              <AppText weight={SEMI_BOLD} style={{ color: selected ? palette.text : palette.muted, fontSize: 16 }}>
                {item.label}
              </AppText>
              {selected ? <View style={styles.histTabLine} /> : null}
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={loading ? [] : rows}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (loading || loadingMore || refreshing || !hasMore) return;
          load(page + 1, tab, "more");
        }}
        refreshing={refreshing}
        onRefresh={() => load(1, tab, "refresh")}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={GOLD} style={styles.loader} />
          ) : (
            <AppText style={{ color: palette.muted, textAlign: "center", marginTop: 28 }}>
              {tab === "active" ? "No open requests." : "No OTC history yet."}
            </AppText>
          )
        }
        ListFooterComponent={loadingMore ? <ActivityIndicator color={GOLD} style={styles.footerLoader} /> : null}
        renderItem={({ item }) => {
          const sell = item.side === "Sell";
          return (
            <View style={[styles.recordCard, { backgroundColor: "transparent", borderColor: palette.cardBorder }]}>
              <View style={styles.spaceBetween}>
                <View style={styles.recordTitle}>
                  <AppText weight={SEMI_BOLD} style={{ color: palette.text, fontSize: 15 }}>{item.pair}</AppText>
                  <AppText style={{ color: palette.muted, fontSize: 12, marginTop: 3 }} numberOfLines={1}>
                    {item.date} · {item.ticketId}
                  </AppText>
                </View>
                <View style={[styles.sidePill, { backgroundColor: sell ? palette.sellSoft : palette.buySoft }]}>
                  <AppText weight={SEMI_BOLD} style={{ color: sell ? palette.sell : palette.buy, fontSize: 12 }}>{item.side}</AppText>
                </View>
              </View>
              <View style={[styles.recordLine, { backgroundColor: palette.line }]} />
              <DetailRow label="Amount" value={item.pay} palette={palette} />
              <DetailRow label="Status" value={item.status} palette={palette} />
              {tab === "history" ? (
                <>
                  <DetailRow label="Traded amount" value={item.tradedAmount} palette={palette} />
                  <DetailRow label="Quote price" value={String(item.quotePrice)} palette={palette} />
                  <DetailRow label="Settlement Status" value={item.settlement} palette={palette} />
                </>
              ) : (
                <>
                  <DetailRow label="Limit price" value={String(item.limitPrice)} palette={palette} />
                  <DetailRow label="Progress" value={item.progress} palette={palette} />
                  <DetailRow label="Filled / Total" value={item.filledTotal} palette={palette} />
                </>
              )}
              <View style={styles.rowActions}>
                <TouchableOpacity style={[styles.viewChip, { backgroundColor: palette.goldSoft }]} onPress={() => NavigationService.navigate(OTC_HISTORY_PAGE_VIEW, { record: otcDetailRecord(item), section: tab })}>
                  <AppText weight={SEMI_BOLD} style={{ color: GOLD, fontSize: 12 }}>View</AppText>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
};

export default OtcHistory;

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
  histTabs: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 26,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  histTab: { paddingTop: 12, paddingBottom: 10, alignItems: "center" },
  histTabLine: {
    position: "absolute",
    bottom: -1,
    width: 26,
    height: 3,
    borderRadius: 2,
    backgroundColor: GOLD,
  },
  listContent: { flexGrow: 1, paddingBottom: 8 },
  recordCard: {
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
  },
  recordTitle: { flex: 1, paddingRight: 10 },
  sidePill: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  recordLine: { height: StyleSheet.hairlineWidth, marginTop: 10, marginBottom: 2 },
  viewChip: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  spaceBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 7,
  },
  rowActions: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", marginTop: 6 },
  loader: { marginTop: 36 },
  footerLoader: { marginVertical: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    padding: 18,
  },
  modalCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  modalHead: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8, gap: 8 },
  kicker: { color: GOLD, fontSize: 12, letterSpacing: 0.4, marginBottom: 2 },
});
