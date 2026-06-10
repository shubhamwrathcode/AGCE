import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { View, Text, TouchableOpacity, FlatList, TextInput, StyleSheet, ActivityIndicator, Animated, Dimensions } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import FastImage from "react-native-fast-image";
import { AppText, BOLD, DISCLAIMTEXT, EIGHTEEN, FIFTEEN, FOURTEEN, SEMI_BOLD, SIXTEEN, TWELVE, TWENTY_SIX } from "../../../shared";
import { colors } from "../../../theme/colors";
import { appOperation } from "../../../appOperation";
import { CUSTOMER_TYPE } from "../../../appOperation/types";
import { searchIcon, checkIc, NO_NOTIFICATION_ICON, moreOption, bitcoin_ic } from "../../../helper/ImageAssets";
import MarginPairDetailSheet from "./MarginPairDetailSheet";
import NavigationService from "../../../navigation/NavigationService";
import { MARGIN_TRANSFER_SCREEN } from "../../../navigation/routes";

function fmt(val, decimals = 8) {
  const n = parseFloat(val);
  if (!val || isNaN(n) || n === 0) return "0.00";
  const str = parseFloat(n.toFixed(decimals)).toString();
  return str === "0" ? "0.00" : str;
}

function fmtPrice(val) {
  const n = parseFloat(val);
  if (!val || isNaN(n) || n === 0) return "0.00";
  const str = parseFloat(n.toFixed(2)).toString();
  return str === "0" ? "0.00" : str;
}

function buildPairRows(balanceRows, accounts) {
  const accountMap = {};
  for (const acc of accounts) accountMap[acc.pair] = acc;

  const pairMap = {};
  for (const row of balanceRows) {
    if (!pairMap[row.pair]) pairMap[row.pair] = { pair: row.pair, base: null, quote: null };
    if (row.asset_type === "base") pairMap[row.pair].base = row;
    else pairMap[row.pair].quote = row;
  }
  for (const acc of accounts) {
    if (!pairMap[acc.pair]) pairMap[acc.pair] = { pair: acc.pair, base: null, quote: null };
  }

  return Object.values(pairMap).map(({ pair, base, quote }) => {
    const acc = accountMap[pair] || {};
    const ml = acc.margin_level ? parseFloat(acc.margin_level) : null;
    const mlDisplay = ml === null ? "—" : ml >= 999 ? "∞" : ml.toFixed(2);
    return {
      pair_id: acc.pair_id || "",
      pair: `${base?.coin || acc.base_asset || ""}/${quote?.coin || acc.quote_asset || ""}`,
      pairRaw: pair,
      base: base?.coin || acc.base_asset || "",
      quote: quote?.coin || acc.quote_asset || "",
      icon_path: acc.icon_path || "",
      mmr: mlDisplay !== "—" ? mlDisplay : null,
      marginLevel: mlDisplay,
      status: acc.status || "NOT_OPENED",
      availableBase: fmt(base?.available ?? acc.base_balance ?? "0"),
      availableQuote: fmt(quote?.available ?? acc.quote_balance ?? "0"),
      borrowableBase: fmt(base?.borrowable ?? acc.base_borrowable ?? "0"),
      borrowableQuote: fmt(quote?.borrowable ?? acc.quote_borrowable ?? "0"),
      loanCapBase: fmt(base?.loan_cap ?? acc.base_loan_cap ?? "0"),
      loanCapQuote: fmt(quote?.loan_cap ?? acc.quote_loan_cap ?? "0"),
      borrowedBase: fmt(base?.borrowed ?? acc.base_borrowed ?? "0"),
      borrowedQuote: fmt(quote?.borrowed ?? acc.quote_borrowed ?? "0"),
      frozenBase: fmt(base?.frozen ?? acc.base_locked ?? "0"),
      frozenQuote: fmt(quote?.frozen ?? acc.quote_locked ?? "0"),
      netBase: fmt(base
        ? (parseFloat(base.available || 0) + parseFloat(base.frozen || 0) - parseFloat(base.borrowed || 0)).toString()
        : (parseFloat(acc.base_balance || 0) + parseFloat(acc.base_locked || 0) - parseFloat(acc.base_borrowed || 0)).toString()),
      netQuote: fmt(quote
        ? (parseFloat(quote.available || 0) + parseFloat(quote.frozen || 0) - parseFloat(quote.borrowed || 0)).toString()
        : (parseFloat(acc.quote_balance || 0) + parseFloat(acc.quote_locked || 0) - parseFloat(acc.quote_borrowed || 0)).toString()),
      liqPrice: fmtPrice(base?.est_liquidation_price ?? quote?.est_liquidation_price ?? ""),
    };
  });
}

const SHIMMER_STRIP = 160;
function ShimmerCell({ width: w, height, borderRadius = 6, style, isDark }) {
  const shimmerX = useRef(new Animated.Value(-SHIMMER_STRIP)).current;
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    const run = () => {
      if (!mounted.current) return;
      shimmerX.setValue(-SHIMMER_STRIP);
      Animated.timing(shimmerX, {
        toValue: Math.max(w, 1) + SHIMMER_STRIP,
        duration: 1100,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (mounted.current && finished) run();
      });
    };
    const t = setTimeout(run, 50);
    return () => {
      mounted.current = false;
      clearTimeout(t);
      shimmerX.stopAnimation();
    };
  }, [shimmerX, w]);

  const boneColor = isDark ? "#2A2A2A" : "#E1E9EE";
  const shimmerColors = isDark
    ? ["transparent", "rgba(255,255,255,0.08)", "transparent"]
    : ["transparent", "rgba(255,255,255,0.6)", "transparent"];

  return (
    <View style={[{ width: w, height, borderRadius, overflow: "hidden", backgroundColor: boneColor }, style]}>
      <Animated.View
        pointerEvents="none"
        style={{ position: "absolute", top: 0, bottom: 0, width: SHIMMER_STRIP, transform: [{ translateX: shimmerX }] }}
      >
        <LinearGradient colors={shimmerColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, width: SHIMMER_STRIP }} />
      </Animated.View>
    </View>
  );
}

const MarginWalletTab = ({ theme, themeColors, marginSummary, buildCoinIconUri }) => {
  const [pairs, setPairs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [liabilitiesOnly, setLiabilitiesOnly] = useState(false);
  const [hideSmall, setHideSmall] = useState(false);
  const [selectedPair, setSelectedPair] = useState(null);
  const sheetRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const fetchAccounts = async () => {
        try {
          const [balRes, accRes] = await Promise.all([
            appOperation.get("margin/wallet-balances", undefined, undefined, CUSTOMER_TYPE).catch(() => null),
            appOperation.get("margin/accounts", undefined, undefined, CUSTOMER_TYPE).catch(() => null),
          ]);
          if (balRes?.success || accRes?.success) {
            const accs = accRes?.data || [];
            const bals = balRes?.data || [];
            if (active) setPairs(buildPairRows(bals, accs));
          }
        } catch (e) { }
        if (active) setIsLoading(false);
      };
      
      fetchAccounts();
      const timer = setTimeout(() => {
        if (active) fetchAccounts();
      }, 1500);
      
      return () => {
        active = false;
        clearTimeout(timer);
      };
    }, [])
  );

  const filtered = useMemo(() => {
    let rows = pairs;
    if (liabilitiesOnly) {
      rows = rows.filter((r) => parseFloat(r.borrowedBase) > 0 || parseFloat(r.borrowedQuote) > 0);
    }
    if (hideSmall) {
      // Very basic approximation for < $1
      rows = rows.filter((r) => parseFloat(r.availableBase) >= 0.0001 || parseFloat(r.availableQuote) >= 1);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter((r) => (r.pair || "").toLowerCase().includes(q) || (r.base || "").toLowerCase().includes(q));
    }
    return rows;
  }, [pairs, search, hideSmall, liabilitiesOnly]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <AppText weight={SEMI_BOLD} type={EIGHTEEN}>Isolated Margin Account</AppText>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <AppText type={SIXTEEN} color={DISCLAIMTEXT} weight={SEMI_BOLD}>Total Assets</AppText>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <View style={styles.summaryValueRow}>
              <AppText type={TWENTY_SIX} weight={SEMI_BOLD}>{marginSummary?.total_assets_usd ?? "0.00"} </AppText>
              <AppText type={FIFTEEN} color={DISCLAIMTEXT} style={{ top: 5 }}>USD</AppText>
            </View>
            <AppText type={FOURTEEN} color={DISCLAIMTEXT}>≈{marginSummary?.total_assets_btc ?? "0.00000000"} BTC</AppText>
          </View>
          <TouchableOpacity
            style={[styles.transferBtn, { backgroundColor: colors.iconBgColor }]}
            onPress={() => NavigationService.navigate(MARGIN_TRANSFER_SCREEN, { fromWalletType: "spot", toWalletType: "margin" })}
          >
            <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: colors.black }}>Transfer</AppText>
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: 15, flexDirection: "row", alignItems: "center" }}>
          <AppText type={FOURTEEN} color={DISCLAIMTEXT}>Today's PnL </AppText>
          <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: parseFloat(marginSummary?.today_pnl_usd || 0) < 0 ? "#e45561" : "#01bc8d" }}>
            {marginSummary?.today_pnl_usd ?? "0.00"} USD
          </AppText>
        </View>

        <View style={{ marginTop: 15, flexDirection: "row", justifyContent: "space-between" }}>
          <View style={{ flex: 1 }}>
            <AppText type={FOURTEEN} color={DISCLAIMTEXT}>Account Equity</AppText>
            <View style={{ flexDirection: "row", alignItems: "flex-end", marginTop: 4 }}>
              <AppText type={EIGHTEEN} weight={SEMI_BOLD}>{marginSummary?.account_equity_usd ?? "0.00"} </AppText>
              <AppText type={TWELVE} color={DISCLAIMTEXT} style={{ marginBottom: 2 }}>USD</AppText>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <AppText type={FOURTEEN} color={DISCLAIMTEXT}>Total Liabilities</AppText>
            <View style={{ flexDirection: "row", alignItems: "flex-end", marginTop: 4 }}>
              <AppText type={EIGHTEEN} weight={SEMI_BOLD}>{marginSummary?.total_liabilities_usd ?? "0.00"} </AppText>
              <AppText type={TWELVE} color={DISCLAIMTEXT} style={{ marginBottom: 2 }}>USD</AppText>
            </View>
          </View>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersRow}>
        <View style={[styles.searchBox, { backgroundColor: theme === "Dark" ? "#2C2C2E" : "#F5F6F7" }]}>
          <FastImage source={searchIcon} style={styles.searchIcon} resizeMode="contain" tintColor={"#787878"} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search"
            placeholderTextColor={"#787878"}
            style={[styles.searchInput, { color: theme !== "Dark" ? "#000" : "#FFF" }]}
            returnKeyType="search"
          />
        </View>
      </View>

      <View style={styles.checkboxesRow}>
        <TouchableOpacity style={styles.checkboxWrapper} onPress={() => setLiabilitiesOnly((v) => !v)}>
          <View style={styles.checkbox}>
            {liabilitiesOnly ? <FastImage source={checkIc} style={styles.checkIcon} tintColor={colors.buttonBg} /> : null}
          </View>
          <AppText type={TWELVE} color={DISCLAIMTEXT}>Liabilities only</AppText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.checkboxWrapper} onPress={() => setHideSmall((v) => !v)}>
          <View style={styles.checkbox}>
            {hideSmall ? <FastImage source={checkIc} style={styles.checkIcon} tintColor={colors.buttonBg} /> : null}
          </View>
          <AppText type={TWELVE} color={DISCLAIMTEXT}>Hide assets {'<'} $1</AppText>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.pair}
        style={{ marginTop: 10 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
        renderItem={({ item, index }) => {
          const isLast = index === filtered.length - 1;
          return (
            <View style={[styles.row, { borderBottomColor: themeColors.border }, isLast && { borderBottomWidth: 0 }]}>
            <View style={styles.rowLeft}>
              <FastImage
                source={buildCoinIconUri(item.icon_path) ? { uri: buildCoinIconUri(item.icon_path) } : bitcoin_ic}
                style={styles.coinIcon}
              />
              <View>
                <AppText type={FOURTEEN} weight={SEMI_BOLD}>{item.pair}</AppText>
                {item.status === "NOT_OPENED" ? (
                  <View style={{ backgroundColor: theme === "Dark" ? "rgba(142,148,158,0.2)" : "rgba(142,148,158,0.1)", borderRadius: 3, paddingHorizontal: 5, paddingVertical: 2, alignSelf: "flex-start", marginTop: 4 }}>
                    <AppText type={TWELVE} color={DISCLAIMTEXT} style={{ fontSize: 10, lineHeight: 12 }}>Not opened</AppText>
                  </View>
                ) : item.mmr ? (
                  <View style={{ backgroundColor: "rgba(1,188,141,0.1)", borderRadius: 3, paddingHorizontal: 5, paddingVertical: 2, alignSelf: "flex-start", marginTop: 4 }}>
                    <AppText type={TWELVE} style={{ color: "#01bc8d", fontSize: 10, lineHeight: 12 }}>{item.mmr}</AppText>
                  </View>
                ) : (
                  <View style={{ backgroundColor: "rgba(1,188,141,0.1)", borderRadius: 3, paddingHorizontal: 5, paddingVertical: 2, alignSelf: "flex-start", marginTop: 4 }}>
                    <AppText type={TWELVE} style={{ color: "#01bc8d", fontSize: 10, lineHeight: 12 }}>{item.status}</AppText>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.rowRight}>
              <View style={{ alignItems: "flex-end", marginRight: 10 }}>
                <AppText type={FOURTEEN} weight={SEMI_BOLD}>{item.availableBase}</AppText>
                <AppText type={FOURTEEN} weight={SEMI_BOLD}>{item.availableQuote}</AppText>
              </View>
              <TouchableOpacity onPress={() => { setSelectedPair(item); sheetRef.current?.open(); }} style={styles.moreBtn}>
                <FastImage source={moreOption} style={styles.moreIcon} resizeMode="contain" tintColor={DISCLAIMTEXT} />
              </TouchableOpacity>
            </View>
          </View>
        );
      }}
        ListEmptyComponent={() => {
          if (isLoading) {
            return (
              <View style={{ marginTop: 10, gap: 16 }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                      <ShimmerCell isDark={theme === "Dark"} width={28} height={28} borderRadius={14} />
                      <View style={{ gap: 6 }}>
                        <ShimmerCell isDark={theme === "Dark"} width={60} height={16} borderRadius={4} />
                        <ShimmerCell isDark={theme === "Dark"} width={40} height={12} borderRadius={4} />
                      </View>
                    </View>
                    <View style={{ alignItems: "flex-end", gap: 6 }}>
                      <ShimmerCell isDark={theme === "Dark"} width={80} height={16} borderRadius={4} />
                      <ShimmerCell isDark={theme === "Dark"} width={60} height={12} borderRadius={4} />
                    </View>
                  </View>
                ))}
              </View>
            );
          }
          return (
            <View style={styles.emptyContainer}>
              <FastImage source={NO_NOTIFICATION_ICON} style={styles.emptyIcon} resizeMode="contain" />
              <AppText type={TWELVE} weight={SEMI_BOLD} color={DISCLAIMTEXT}>No Data Found</AppText>
            </View>
          );
        }}
        ListFooterComponent={() => <View style={{ height: 120 }} />}
      />

      <MarginPairDetailSheet
        ref={sheetRef}
        theme={theme}
        themeColors={themeColors}
        selectedPair={selectedPair}
        buildCoinIconUri={buildCoinIconUri}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 18, flex: 1 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  transferBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  summaryCard: {
    marginTop: 12,
    borderRadius: 14,
    backgroundColor: colors.white,

  },
  summaryValueRow: { flexDirection: "row", alignItems: "center", marginTop: 5 },
  pnlRow: { flexDirection: "row", marginTop: 10 },
  equityGrid: { flexDirection: "row", marginTop: 15 },
  filtersRow: { marginTop: 14, flexDirection: "row" },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 42,
  },
  searchIcon: { width: 14, height: 14 },
  searchInput: { flex: 1, height: 40, fontSize: 13 },
  checkboxesRow: { flexDirection: "row", gap: 20, marginTop: 10, marginBottom: 10 },
  checkboxWrapper: { flexDirection: "row", alignItems: "center", gap: 8 },
  checkbox: {
    width: 15,
    height: 15,
    borderWidth: 1,
    borderColor: colors.grey,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkIcon: { width: 8, height: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  coinIcon: { width: 28, height: 28, borderRadius: 14 },
  rowRight: { flexDirection: "row", alignItems: "center" },
  moreBtn: { paddingVertical: 6, paddingLeft: 6 },
  moreIcon: { width: 18, height: 18, transform: [{ rotate: "90deg" }] },
  emptyContainer: { alignItems: "center", marginTop: 40, gap: 10 },
  emptyIcon: { width: 80, height: 80 },
});

export default MarginWalletTab;
