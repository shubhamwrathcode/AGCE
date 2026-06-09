import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  View,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Animated,
  Dimensions,
  ScrollView,
} from "react-native";
import FastImage from "react-native-fast-image";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import {
  AppText,
  SEMI_BOLD,
  MEDIUM,
  BOLD,
  FOURTEEN,
  FIFTEEN,
} from "../../shared";
import { useTheme } from "../../hooks/useTheme";
import { colors } from "../../theme/colors";
import { back_ic, NO_NOTIFICATION_ICON, NO_NOTIFICATION_ICON_LIGHT, downIcon, checkIc } from "../../helper/ImageAssets";
import { appOperation } from "../../appOperation";
import { CUSTOMER_TYPE } from "../../appOperation/types";
import moment from "moment";
import RBSheet from "react-native-raw-bottom-sheet";
import TradeHistorySkeleton from "../account/TradeHistorySkeleton";

// ─── Constants ────────────────────────────────────────────────────────────────

const WALLET_LABELS = {
  main: "Main Wallet",
  spot: "Spot Wallet",
  futures: "Futures Wallet",
  margin: "Isolated Margin",
  cross_margin: "Cross Margin",
  p2p: "P2P Wallet",
  swap: "Swap Wallet",
  earning: "Earning Wallet",
};

const DIRECTION_LABELS = {
  TO_MARGIN: "To Isolated Margin",
  FROM_MARGIN: "From Isolated Margin",
  TO_CROSS: "To Cross Margin",
  FROM_CROSS: "From Cross Margin",
};

const LIMIT = 20;

function formatPair(raw) {
  if (!raw) return "—";
  if (raw.includes("/")) return raw;
  if (raw.length >= 6) {
    const known = ["USDT", "BTC", "ETH", "BNB", "USDC"];
    for (const q of known) {
      if (raw.endsWith(q)) return `${raw.slice(0, raw.length - q.length)}/${q}`;
    }
  }
  return raw;
}

const WALLET_OPTIONS = [
  { value: "all", label: "All" },
  { value: "main", label: "Main Wallet" },
  { value: "spot", label: "Spot Wallet" },
  { value: "futures", label: "Futures Wallet" },
  { value: "margin", label: "Isolated Margin" },
  { value: "cross_margin", label: "Cross Margin" },
];

function fmtWallet(val) {
  const s = String(val || "").toLowerCase();
  if (s.includes("spot")) return "Spot Wallet";
  if (s.includes("main")) return "Main Wallet";
  if (s.includes("p2p")) return "P2P Wallet";
  if (s.includes("future")) return "Futures Wallet";
  if (s.includes("cross")) return "Cross Margin";
  if (s.includes("margin") || s.includes("isolated")) return "Isolated Margin";
  return val ? String(val).charAt(0).toUpperCase() + String(val).slice(1) : "—";
}

function extractWalletKey(val) {
  const s = String(val || "").toLowerCase();
  if (s.includes("spot")) return "spot";
  if (s.includes("main")) return "main";
  if (s.includes("p2p")) return "p2p";
  if (s.includes("future")) return "futures";
  if (s.includes("cross")) return "cross_margin";
  if (s.includes("margin") || s.includes("isolated")) return "margin";
  return s.trim();
}

function fmtDirection(v) {
  if (!v) return "—";
  return DIRECTION_LABELS[v] ?? String(v);
}

function fmtAmount(amount) {
  if (amount == null || amount === "") return "—";
  const n = parseFloat(amount);
  if (!Number.isFinite(n)) return String(amount);
  return parseFloat(n.toFixed(8)).toString();
}

function fmtDate(iso) {
  if (!iso) return "—";
  const m = moment(iso);
  return m.isValid() ? m.format("DD/MM/YYYY HH:mm:ss") : String(iso);
}

function mapAllRow(raw, idx) {
  const from = raw.from_wallet ?? raw.fromWallet ?? "";
  const to = raw.to_wallet ?? raw.toWallet ?? "";
  const coin = String(raw.short_name ?? raw.coin ?? raw.asset ?? "").toUpperCase();
  const created = raw.createdAt ?? raw.created_at ?? "";
  return {
    id: raw.id ?? raw._id ?? `r-${idx}-${created}`,
    date: fmtDate(created),
    coin,
    amount: fmtAmount(raw.amount),
    from: fmtWallet(from),
    to: fmtWallet(to),
    fromKey: extractWalletKey(from),
    toKey: extractWalletKey(to),
    direction: null,
  };
}

function mapMarginRow(raw, idx) {
  const direction = raw.direction ?? raw.type;
  let from = raw.from_wallet ?? raw.from ?? "";
  let to = raw.to_wallet ?? raw.to ?? "";

  // Infer wallets if API only provides direction (very common in Margin APIs)
  if (!from && !to && direction) {
    if (String(direction).startsWith("TO_")) { from = "spot"; to = "margin"; }
    else if (String(direction).startsWith("FROM_")) { from = "margin"; to = "spot"; }
  }

  const coin = String(raw.asset ?? raw.coin ?? "").toUpperCase();
  return {
    id: raw.transfer_id ?? raw.id ?? raw._id ?? `m-${idx}`,
    date: fmtDate(raw.created_at ?? raw.time),
    coin,
    amount: fmtAmount(raw.amount),
    from: fmtWallet(from),
    to: fmtWallet(to),
    fromKey: extractWalletKey(from),
    toKey: extractWalletKey(to),
    direction: fmtDirection(direction),
    pair: formatPair(raw.contract ?? raw.pair ?? ""),
  };
}

function mapCrossRow(raw, idx) {
  const direction = raw.direction ?? raw.type;
  let from = raw.from_wallet ?? raw.from ?? "";
  let to = raw.to_wallet ?? raw.to ?? "";

  // Infer wallets if API only provides direction
  if (!from && !to && direction) {
    if (String(direction).startsWith("TO_")) { from = "spot"; to = "cross_margin"; }
    else if (String(direction).startsWith("FROM_")) { from = "cross_margin"; to = "spot"; }
  }

  const coin = String(raw.asset ?? raw.coin ?? "").toUpperCase();
  return {
    id: raw.transfer_id ?? raw.id ?? raw._id ?? `c-${idx}`,
    date: fmtDate(raw.created_at ?? raw.time),
    coin,
    amount: fmtAmount(raw.amount),
    from: fmtWallet(from),
    to: fmtWallet(to),
    fromKey: extractWalletKey(from),
    toKey: extractWalletKey(to),
    direction: fmtDirection(direction),
    pair: formatPair(raw.asset ?? raw.pair ?? raw.contract ?? ""),
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const TradeKvRow = React.memo(({ label, value, color, textColor, isDark }) => (
  <View style={styles.tradeKvRow}>
    <AppText type={FOURTEEN} weight={SEMI_BOLD} style={[styles.tradeKvK, { color: isDark ? "#8E8E93" : "#666666" }]}>{label}</AppText>
    <AppText type={FOURTEEN} weight={SEMI_BOLD} style={[styles.tradeKvV, { color: color ?? textColor }]} numberOfLines={3}>
      {value}
    </AppText>
  </View>
));

const HistoryCard = React.memo(({ item, themeColors, isDark }) => {
  const textColor = themeColors.text ?? "#000000";
  const directionColor = item.direction
    ? (item.direction.startsWith("To") ? "#01bc8d" : "#e45561")
    : undefined;

  return (
    <View style={[styles.historyCard, { backgroundColor: themeColors.background }]}>
      {/* Header row: Coin + Date */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <AppText type={FIFTEEN} weight={BOLD} style={{ color: textColor }}>
            {item.coin || "—"}
          </AppText>
          <AppText type={FIFTEEN} weight={MEDIUM} style={{ color: isDark ? "#8E8E93" : "#666666", marginTop: 4 }}>
            {item.date}
          </AppText>
        </View>
        {item.direction ? (
          <AppText weight={SEMI_BOLD} style={{ color: directionColor, fontSize: 13 }}>{item.direction}</AppText>
        ) : null}
      </View>

      {/* Detail rows */}
      <View style={styles.detailsContainer}>
        <TradeKvRow label="Amount" value={item.amount} textColor={textColor} isDark={isDark} />
        {item.pair && item.pair !== "—" && (
          <TradeKvRow label="Pair" value={item.pair} textColor={textColor} isDark={isDark} />
        )}
        <TradeKvRow label="From" value={item.from} textColor={textColor} isDark={isDark} />
        <TradeKvRow label="To" value={item.to} textColor={textColor} isDark={isDark} />
      </View>

      <View style={[styles.divider, { backgroundColor: isDark ? "#2C2C2E" : "#E5E5EA" }]} />
    </View>
  );
});

// ─── Filter Chip ──────────────────────────────────────────────────────────────

function FilterChip({ label, active, onPress, isDark, themeColors }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.chip, {
        backgroundColor: active ? colors.buttonBg : (isDark ? "#1C1C1E" : "#F2F2F7"),
        borderColor: active ? colors.buttonBg : (isDark ? "#2C2C2E" : "#E5E5EA"),
      }]}
    >
      <AppText weight={MEDIUM} style={{ fontSize: 13, color: active ? colors.white : themeColors.text }}>{label}</AppText>
      <FastImage
        source={downIcon}
        style={{ width: 10, height: 10, marginLeft: 8 }}
        resizeMode="contain"
        tintColor={active ? colors.white : themeColors.secondaryText}
      />
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

const TransferHistoryScreen = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { colors: themeColors, isDark } = useTheme();

  const [fromWallet, setFromWallet] = useState("all");
  const [toWallet, setToWallet] = useState("all");

  const filterSheetRef = useRef(null);
  const [filterTarget, setFilterTarget] = useState(null); // "from" | "to"

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const LIMIT = 20;

  useEffect(() => {
    setData([]);
    setPage(1);
    setHasMore(true);
  }, [fromWallet, toWallet]);

  const fetchData = useCallback(async (pageNum = 1, append = false) => {
    if (append) setLoadingMore(true); else setLoading(true);
    try {
      let res;
      const skip = (pageNum - 1) * LIMIT;

      const isIsolated = fromWallet === "margin" || toWallet === "margin";
      const isCross = fromWallet === "cross_margin" || toWallet === "cross_margin";

      if (isIsolated && !isCross) {
        let dir = "all";
        if (fromWallet === "margin" && toWallet !== "margin") dir = "FROM_MARGIN";
        if (toWallet === "margin" && fromWallet !== "margin") dir = "TO_MARGIN";

        res = await appOperation.get(
          `margin/history/transfer?page=${pageNum}&limit=${LIMIT}${dir !== "all" ? `&direction=${dir}` : ""}`,
          undefined, undefined, CUSTOMER_TYPE
        );
        const raw = res?.data?.transfers ?? (Array.isArray(res?.data) ? res.data : []);
        console.log("Margin API raw response:", raw);
        let items = raw.map(mapMarginRow);

        if (fromWallet !== "all" && fromWallet !== "margin") items = items.filter(it => it.fromKey === fromWallet || it.fromKey === "");
        if (toWallet !== "all" && toWallet !== "margin") items = items.filter(it => it.toKey === toWallet || it.toKey === "");

        if (append) setData(prev => [...prev, ...items]); else setData(items);
        setHasMore(raw.length >= LIMIT);

      } else if (isCross && !isIsolated) {
        let dir = "all";
        if (fromWallet === "cross_margin" && toWallet !== "cross_margin") dir = "FROM_CROSS";
        if (toWallet === "cross_margin" && fromWallet !== "cross_margin") dir = "TO_CROSS";

        res = await appOperation.customer.crossTransferHistory({
          page: pageNum,
          limit: LIMIT,
          direction: dir !== "all" ? dir : undefined,
        });
        const raw = res?.data?.transfers ?? (Array.isArray(res?.data) ? res.data : []);
        let items = raw.map(mapCrossRow);

        if (fromWallet !== "all" && fromWallet !== "cross_margin") items = items.filter(it => it.fromKey === fromWallet || it.fromKey === "");
        if (toWallet !== "all" && toWallet !== "cross_margin") items = items.filter(it => it.toKey === toWallet || it.toKey === "");

        if (append) setData(prev => [...prev, ...items]); else setData(items);
        setHasMore(raw.length >= LIMIT);

      } else {
        let url = `wallet/wallet-transfer-history?skip=${skip}&limit=${LIMIT}`;
        if (fromWallet !== "all") url += `&from_wallet=${fromWallet}`;
        if (toWallet !== "all") url += `&to_wallet=${toWallet}`;

        const p1 = appOperation.get(url, undefined, undefined, CUSTOMER_TYPE)
          .then(res => {
            const raw = res?.data?.data || res?.data?.items || res?.data?.rows || (Array.isArray(res?.data) ? res.data : []);
            return raw.map(mapAllRow);
          }).catch(e => { console.log(e); return []; });

        const p2 = appOperation.get(`margin/history/transfer?page=${pageNum}&limit=${LIMIT}`, undefined, undefined, CUSTOMER_TYPE)
          .then(res => {
            const raw = res?.data?.transfers ?? (Array.isArray(res?.data) ? res.data : []);
            let items = raw.map(mapMarginRow);
            if (fromWallet !== "all" && fromWallet !== "margin") items = items.filter(it => it.fromKey === fromWallet || it.fromKey === "");
            if (toWallet !== "all" && toWallet !== "margin") items = items.filter(it => it.toKey === toWallet || it.toKey === "");
            return items;
          }).catch(e => { console.log(e); return []; });

        const p3 = appOperation.customer.crossTransferHistory({ page: pageNum, limit: LIMIT })
          .then(res => {
            const raw = res?.data?.transfers ?? (Array.isArray(res?.data) ? res.data : []);
            let items = raw.map(mapCrossRow);
            if (fromWallet !== "all" && fromWallet !== "cross_margin") items = items.filter(it => it.fromKey === fromWallet || it.fromKey === "");
            if (toWallet !== "all" && toWallet !== "cross_margin") items = items.filter(it => it.toKey === toWallet || it.toKey === "");
            return items;
          }).catch(e => { console.log(e); return []; });

        const [items1, items2, items3] = await Promise.all([p1, p2, p3]);
        let combined = [...items1, ...items2, ...items3];

        combined.sort((a, b) => {
          const tA = moment(a.date, "DD/MM/YYYY HH:mm:ss").valueOf();
          const tB = moment(b.date, "DD/MM/YYYY HH:mm:ss").valueOf();
          return (isNaN(tB) ? 0 : tB) - (isNaN(tA) ? 0 : tA);
        });

        const hasMoreData = items1.length >= LIMIT || items2.length >= LIMIT || items3.length >= LIMIT;

        if (append) setData(prev => [...prev, ...combined]); else setData(combined);
        setHasMore(hasMoreData);
      }
    } catch {
      if (!append) setData([]);
      setHasMore(false);
    } finally {
      if (append) setLoadingMore(false); else setLoading(false);
    }
  }, [fromWallet, toWallet]);

  useEffect(() => {
    if (isFocused) { setPage(1); fetchData(1, false); }
  }, [fromWallet, toWallet, isFocused]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !loadingMore && !loading) {
      const next = page + 1;
      setPage(next);
      fetchData(next, true);
    }
  }, [hasMore, loadingMore, loading, page, fetchData]);

  const keyExtractor = useCallback((item, idx) => item?.id != null ? String(item.id) : `row_${idx}`, []);

  const renderItem = useCallback(({ item }) => (
    <HistoryCard item={item} themeColors={themeColors} isDark={isDark} />
  ), [themeColors, isDark]);

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.noDataRow}>
        <FastImage
          source={isDark ? NO_NOTIFICATION_ICON : NO_NOTIFICATION_ICON_LIGHT}
          style={{ width: 100, height: 100, marginBottom: 12 }}
          resizeMode="contain"
        />
        <AppText style={{ color: themeColors.secondaryText, fontSize: 14 }}>No transfer records found</AppText>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return <View style={{ height: 40 }} />;
    return <TradeHistorySkeleton />;
  };

  const sheetOptions = WALLET_OPTIONS;

  const currentFilterValue = filterTarget === "from" ? fromWallet : toWallet;

  const handleSelectFilter = (val) => {
    if (filterTarget === "from") setFromWallet(val);
    else if (filterTarget === "to") setToWallet(val);
    filterSheetRef.current?.close();
  };

  const openFilter = (target) => {
    setFilterTarget(target);
    filterSheetRef.current?.open();
  };

  const getLabel = (options, val) => options.find(o => o.value === val)?.label || val;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background ?? "#FFFFFF" }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <FastImage source={back_ic} style={{ width: 20, height: 20 }} resizeMode="contain" tintColor={themeColors.text} />
        </TouchableOpacity>
        <AppText weight={SEMI_BOLD} style={{ fontSize: 18, color: themeColors.text }}>Transfer History</AppText>
        <View style={{ width: 20 }} />
      </View>

      {/* Filters */}
      <View style={[styles.filterRow, { borderBottomColor: themeColors?.themeBorderColor ?? "#EEEEEE" }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <AppText type={FOURTEEN} weight={SEMI_BOLD} style={[styles.filterLabel, { color: isDark ? "#8E8E93" : "#666666" }]}>From:</AppText>
          <FilterChip
            label={getLabel(WALLET_OPTIONS, fromWallet)}
            active={fromWallet !== "all"}
            onPress={() => openFilter("from")}
            isDark={isDark}
            themeColors={themeColors}
          />
          <AppText type={FOURTEEN} weight={SEMI_BOLD} style={[styles.filterLabel, { color: isDark ? "#8E8E93" : "#666666", marginLeft: 8 }]}>To:</AppText>
          <FilterChip
            label={getLabel(WALLET_OPTIONS, toWallet)}
            active={toWallet !== "all"}
            onPress={() => openFilter("to")}
            isDark={isDark}
            themeColors={themeColors}
          />
        </ScrollView>
      </View>

      {/* List */}
      {loading ? (
        <TradeHistorySkeleton />
      ) : (
        <FlatList
          data={data}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Filter Bottom Sheet */}
      <RBSheet
        ref={filterSheetRef}
        height={Math.min(sheetOptions.length * 56 + 80, 400)}
        openDuration={220}
        customStyles={{
          container: {
            backgroundColor: isDark ? "#1C1C1E" : colors.white,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          },
        }}
      >
        <View style={{ padding: 16 }}>
          <AppText weight={SEMI_BOLD} style={{ fontSize: 17, color: themeColors.text, marginBottom: 14 }}>
            {filterTarget === "from" ? "From Wallet" : "To Wallet"}
          </AppText>
          {sheetOptions.map(opt => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => handleSelectFilter(opt.value)}
              style={[styles.sheetRow, { borderBottomColor: themeColors?.themeBorderColor ?? "#EEEEEE" }]}
            >
              <AppText
                weight={currentFilterValue === opt.value ? SEMI_BOLD : MEDIUM}
                style={{ fontSize: 15, color: currentFilterValue === opt.value ? colors.buttonBg : themeColors.text }}
              >
                {opt.label}
              </AppText>
              {currentFilterValue === opt.value && (
                <FastImage source={checkIc} style={{ width: 14, height: 14 }} tintColor={colors.buttonBg} resizeMode="contain" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </RBSheet>
    </SafeAreaView>
  );
};

export default TransferHistoryScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  tabBar: { flexDirection: "row", height: 48, borderBottomWidth: 1 },
  tab: { flex: 1, justifyContent: "center", alignItems: "center", position: "relative" },
  tabText: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  activeTabIndicator: {
    height: 3,
    width: 24,
    backgroundColor: colors.buttonBg,
    borderRadius: 2,
    position: "absolute",
    bottom: -1,
  },
  filterRow: { borderBottomWidth: 1 },
  filterScroll: { paddingHorizontal: 16, paddingVertical: 12, alignItems: "center", gap: 10 },
  filterLabel: { alignSelf: "center" },
  filterDivider: { width: 1, height: 16, backgroundColor: "#E5E5EA", marginHorizontal: 4 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  listContent: { paddingHorizontal: 8, paddingVertical: 12, paddingBottom: 100, flexGrow: 1 },
  historyCard: {
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    backgroundColor: "transparent",
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  detailsContainer: { gap: 5 },
  divider: { height: 1.5, marginTop: 12, marginBottom: 4 },
  tradeKvRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8, paddingVertical: 2 },
  tradeKvK: { flex: 1 },
  tradeKvV: { flex: 2, textAlign: "right" },
  noDataRow: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 100 },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
