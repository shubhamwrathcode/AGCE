/* eslint-disable react-native/no-inline-styles */
import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { View, StyleSheet, Platform, ScrollView } from "react-native";
import { colors, lightTheme } from "../../theme/colors";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { universalPaddingHorizontal } from "../../theme/dimens";
import { useAppSelector } from "../../store/hooks";
import Favourites from "../other/Favourites";
import MarketList from "../other/MarketList";
import { FuturesList } from "../other/FuturesMarket";
import HomeCoinList from "./HomeCoinList";
import NavigationService from "../../navigation/NavigationService";
import { WALLET_SCREEN, MARKET_SCREEN, FUTURES_SCREEN } from "../../navigation/routes";
import TouchableOpacityView from "../../shared/components/TouchableOpacityView";
import FastImage from "react-native-fast-image";
import { AppText, MEDIUM, SEMI_BOLD } from "../../shared";
import { back_ic } from "../../helper/ImageAssets";
import { useDispatch } from "react-redux";
import { setBuyOrders, setSellOrders, setSpotSelectedPair, setFuturesSelectedPair } from "../../slices/homeSlice";
import { useTheme } from "../../hooks/useTheme";
import { IMAGE_BASE_URL } from "../../helper/Constants";
import StakingDahboardData from "./StakingDahboardData";

const CoinList = React.memo(() => {
  const { colors: themeColors } = useTheme();
  const coinPairs = useAppSelector((state) => state.home.coinPairs);
  const futuresPairs = useAppSelector((state) => state.home.futuresPairs ?? []);
  const theme = useAppSelector((state) => state.auth.theme);
  const dispatch = useDispatch();
  // Web parity tabs: 0=Favorite, 1=Trending, 2=Hot, 3=New Listing, 4=Top Gainers
  const [activeTabList, setActiveTabList] = useState(1);
  const prevTabRef = useRef(activeTabList);
  const tabScrollRef = useRef(null);

  const listAnimX = useSharedValue(0);
  const listAnimOpacity = useSharedValue(1);

  const indicatorX = useSharedValue(0);
  const indicatorW = useSharedValue(0);
  const tabLayoutsRef = useRef({});

  const tabs = useMemo(
    () => [
      { key: 0, label: "Favorite" },
      { key: 1, label: "Trending" },
      { key: 2, label: "Hot" },
      { key: 3, label: "New Listing" },
      { key: 4, label: "Top Gainers" },
    ],
    []
  );

  const handleTabChange = useCallback((tab) => {
    setActiveTabList(tab);
  }, []);

  const normSym = useCallback((s) => String(s || "").trim().toUpperCase(), []);
  const toNum = useCallback((v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }, []);

  const pairVolumeNumber = useCallback((p) => {
    return (
      toNum(p?.volume_24h) ||
      toNum(p?.volume) ||
      toNum(p?.quote_volume) ||
      0
    );
  }, [toNum]);

  const pairListingTimeMs = useCallback((p) => {
    const dt = p?.createdAt || p?.created_at || p?.listing_time || p?.listedAt;
    const ms = dt ? Date.parse(dt) : NaN;
    if (Number.isFinite(ms)) return ms;
    // fallback: ObjectId-ish ordering or numeric id
    const id = String(p?._id || p?.id || "");
    return id ? id.length : 0;
  }, []);

  const spotChangeNumber = useCallback((p) => {
    return toNum(p?.change_percentage ?? p?.changePercentage ?? p?.change);
  }, [toNum]);

  // Web: curated majors for Hot tab (fallback to volume list)
  const HOT_BASE_ORDER = useMemo(() => ["BTC", "ETH", "BNB", "SOL", "XRP", "DOGE", "MATIC"], []);
  const pickPairForBase = useCallback(
    (pairs, base) => {
      const b = normSym(base);
      // prefer USDT quote
      const usdt = pairs.find(
        (p) => normSym(p?.base_currency) === b && normSym(p?.quote_currency) === "USDT"
      );
      if (usdt) return usdt;
      return pairs.find((p) => normSym(p?.base_currency) === b);
    },
    [normSym]
  );

  // Web: use USDT-quoted universe (fallback to all if none)
  const spotUsdtPairs = useMemo(() => {
    if (!coinPairs || coinPairs.length === 0) return [];
    const usdt = coinPairs.filter((p) => normSym(p?.quote_currency) === "USDT");
    return usdt.length ? usdt : coinPairs;
  }, [coinPairs, normSym]);

  // 0=Favourite, 1=Trending, 2=Hot, 3=New Listing, 4=Top Gainers
  const filterData = useMemo(() => {
    if (!spotUsdtPairs || spotUsdtPairs.length === 0) return [];

    // Favorite handled by component; return a stable list for it too
    if (activeTabList === 0) return [...spotUsdtPairs];

    // Trending: highest 24h volume
    if (activeTabList === 1) {
      return [...spotUsdtPairs].sort((a, b) => pairVolumeNumber(b) - pairVolumeNumber(a));
    }

    // Hot: curated majors, fill remainder by trending
    if (activeTabList === 2) {
      const seen = new Set();
      const out = [];
      for (const base of HOT_BASE_ORDER) {
        const p = pickPairForBase(spotUsdtPairs, base);
        if (p && p?._id && !seen.has(p._id)) {
          seen.add(p._id);
          out.push(p);
        } else if (p && !p?._id) {
          out.push(p);
        }
      }
      for (const p of [...spotUsdtPairs].sort((a, b) => pairVolumeNumber(b) - pairVolumeNumber(a))) {
        if (out.length >= spotUsdtPairs.length) break;
        if (p?._id && seen.has(p._id)) continue;
        if (p?._id) seen.add(p._id);
        out.push(p);
        if (out.length >= 50) break;
      }
      return out;
    }

    // New Listing: newest createdAt/listing time
    if (activeTabList === 3) {
      return [...spotUsdtPairs].sort((a, b) => pairListingTimeMs(b) - pairListingTimeMs(a));
    }

    // Top Gainers: highest positive change
    if (activeTabList === 4) {
      return [...spotUsdtPairs].sort((a, b) => spotChangeNumber(b) - spotChangeNumber(a));
    }

    return [...spotUsdtPairs];
  }, [spotUsdtPairs, activeTabList, pairVolumeNumber, HOT_BASE_ORDER, pickPairForBase, pairListingTimeMs, spotChangeNumber]);

  const fourItems = useMemo(
    () => (Array.isArray(filterData) ? filterData.slice(0, 5) : []),
    [filterData]
  );

  const futuresFive = useMemo(
    () => (Array.isArray(futuresPairs) ? futuresPairs.slice(0, 5) : []),
    [futuresPairs]
  );

  const handleNavigate = useCallback((item) => {
    // Pre-set the selected pair and clear old order book in Redux BEFORE navigating.
    // This prevents the race condition where Spot's useFocusEffect re-subscribes
    // to the old pair's socket during the async gap before route.params takes effect.
    dispatch(setSpotSelectedPair(item));
    dispatch(setBuyOrders([]));
    dispatch(setSellOrders([]));
    NavigationService.navigate(WALLET_SCREEN, { coinDetail: item });
  }, [dispatch]);

  const handleViewMore = useCallback(() => {
    const tab =
      activeTabList === 0
        ? "Favourite"
        : activeTabList === 1
          ? "Trending"
          : activeTabList === 2
            ? "Hot"
            : activeTabList === 3
              ? "New Listing"
              : activeTabList === 4
                ? "Top Gainers"
                : "";
    NavigationService.navigate(MARKET_SCREEN, { tab });
  }, [activeTabList]);

  const handleFuturesNavigate = useCallback((item) => {
    // Pre-set the selected pair in Redux BEFORE navigating.
    // Same pattern as Spot: prevents the async gap where the old pair
    // would still be restored from Redux when Futures screen focuses.
    dispatch(setFuturesSelectedPair(item));
    NavigationService.navigate(FUTURES_SCREEN, { pair: item });
  }, [dispatch]);

  // animate list swipe + move selected indicator
  useEffect(() => {
    const prev = prevTabRef.current;
    const dir = activeTabList > prev ? 1 : -1; // right -> left swipe feel
    prevTabRef.current = activeTabList;

    // list swipe
    listAnimOpacity.value = 0.5;
    listAnimX.value = dir * 24;
    listAnimOpacity.value = withTiming(1, { duration: 180 });
    listAnimX.value = withTiming(0, { duration: 220 });

    // indicator slide
    const layout = tabLayoutsRef.current?.[String(activeTabList)];
    if (layout) {
      indicatorX.value = withTiming(layout.x, { duration: 220 });
      indicatorW.value = withTiming(layout.w, { duration: 220 });
      // keep selected tab in view
      tabScrollRef.current?.scrollTo?.({
        x: Math.max(0, layout.x - 60),
        animated: true,
      });
    }
  }, [activeTabList, indicatorX, indicatorW, listAnimOpacity, listAnimX]);

  const listAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: listAnimX.value }],
      opacity: listAnimOpacity.value,
    };
  });

  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: indicatorX.value }],
      width: indicatorW.value,
    };
  });

  return (
    <Animated.View
      entering={FadeIn.duration(600)}
      style={[styles.container, { marginBottom: 50, }]}
    >

      {/* Single elevated card: Tabs + 4 items list (no scroll) + View More */}
      <View style={[styles.elevatedCard, {}]}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <ScrollView
            ref={tabScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabRow}
          >
            <Animated.View pointerEvents="none" style={[styles.tabIndicator, indicatorStyle]} />
            {tabs.map((t) => {
              const active = activeTabList === t.key;
              return (
                <TouchableOpacityView
                  key={String(t.key)}
                  style={[
                    styles.tabPill,
                    active ? styles.tabPillActive : null,
                  ]}
                  onPress={() => handleTabChange(t.key)}
                  activeOpacity={0.8}
                  onLayout={(e) => {
                    const { x, width } = e.nativeEvent.layout;
                    tabLayoutsRef.current[String(t.key)] = { x, w: width };
                    // init indicator on first measure
                    if (t.key === activeTabList && indicatorW.value === 0) {
                      indicatorX.value = x;
                      indicatorW.value = width;
                    }
                  }}
                >
                  <AppText
                    weight={SEMI_BOLD}
                    style={[
                      styles.tabLabel,
                      { color: active ? "#111827" : "#9CA3AF" },
                    ]}
                  >
                    {t.label}
                  </AppText>
                </TouchableOpacityView>
              );
            })}
            <View style={{ width: 6 }} />
          </ScrollView>
        </Animated.View>

        <View style={styles.listWrap}>
          {activeTabList === 0 ? null : (
            <View style={styles.tableHeader}>
              <AppText style={[styles.tableHeaderText, { flex: 1.2 }]}>Symbol</AppText>
              <AppText style={[styles.tableHeaderText, { flex: 1, textAlign: "right" }]}>Last Price</AppText>
              <View style={{ flex: 0.9, alignItems: "flex-end" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <AppText style={styles.tableHeaderText}>24H Change</AppText>
                  <FastImage
                    source={back_ic}
                    style={{ width: 10, height: 10, transform: [{ rotate: "90deg" }] }}
                    resizeMode="contain"
                    tintColor={"#9CA3AF"}
                  />
                </View>
              </View>
            </View>
          )}

          <Animated.View style={listAnimatedStyle}>
            {activeTabList === 0 ? (
              <Favourites coinPairs={filterData} onPress={handleNavigate} from="home" />
            ) : (
              <View style={{ marginTop: 6 }}>
                {fourItems.map((item, idx) => {
                  const sym = String(item?.base_currency || "").toUpperCase();
                  const name = item?.base_currency_name || item?.base_currency || "—";
                  const last = item?.buy_price ?? item?.last_price ?? item?.price ?? 0;
                  const sub = item?.sell_price ?? item?.usd_price ?? item?.usdt_price ?? 0;
                  const chg = Number(item?.change_percentage) || 0;
                  const isUp = chg >= 0;
                  const chgText = `${Math.abs(chg).toFixed(2)}%`;
                  return (
                    <TouchableOpacityView
                      key={`${sym}-${idx}`}
                      onPress={() => handleNavigate(item)}
                      activeOpacity={0.85}
                      style={styles.row}
                    >
                      <View style={[styles.colSymbol, { flex: 1.2 }]}>
                        <View style={styles.iconCircle}>
                          <FastImage
                            source={
                              item?.icon_path
                                ? { uri: IMAGE_BASE_URL + item.icon_path }
                                : undefined
                            }
                            resizeMode="contain"
                            style={{ width: 22, height: 22 }}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <AppText style={styles.coinName} numberOfLines={1}>
                            {name}
                          </AppText>
                          <AppText style={styles.coinSym} numberOfLines={1}>
                            {sym}
                          </AppText>
                        </View>
                      </View>

                      <View style={{ flex: 1, alignItems: "flex-end" }}>
                        <AppText style={styles.priceMain} numberOfLines={1}>
                          {String(last)}
                        </AppText>
                        <AppText style={styles.priceSub} numberOfLines={1}>
                          {String(sub)}
                        </AppText>
                      </View>

                      <View style={{ flex: 0.9, alignItems: "flex-end" }}>
                        <View
                          style={[
                            styles.changePill,
                            { backgroundColor: isUp ? "#2DBE7E" : "#EF4444" },
                          ]}
                        >
                          <AppText style={styles.changeText} numberOfLines={1}>
                            {isUp ? "▲ " : "▼ "}
                            {chgText}
                          </AppText>
                        </View>
                      </View>
                    </TouchableOpacityView>
                  );
                })}
              </View>
            )}
          </Animated.View>
        </View>

        <TouchableOpacityView
          style={styles.viewMoreRow}
          onPress={handleViewMore}
          activeOpacity={0.7}
        >
          <AppText style={[styles.viewMoreText, { color: themeColors.text }]}>
            More →
          </AppText>
        </TouchableOpacityView>
      </View>
      <StakingDahboardData />

      <Animated.View entering={FadeIn.duration(600).delay(200)}>
        <HomeCoinList activeTabList={activeTabList} hideViewMore />
      </Animated.View>
    </Animated.View>
  );
});

CoinList.displayName = "CoinList";

const HOME_HORIZONTAL_PADDING = 12;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: HOME_HORIZONTAL_PADDING,
    paddingVertical: universalPaddingHorizontal,
  },
  elevatedCard: {
    padding: 5,
    paddingTop: 10,
    overflow: "visible",

  },
  listWrap: {
    marginTop: 6,
    minHeight: 275, // Stabilize height to prevent the "felta hua" shadow expansion artifact on load
  },
  marketListFixed: {
    width: "100%",
    padding: 0,
  },
  tabRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    position: "relative",
  },
  tabIndicator: {
    position: "absolute",
    left: 0,
    bottom: 0,
    height: 30,
    borderRadius: 10,
    backgroundColor: lightTheme.input,
    zIndex: -1,
  },
  tabPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 5,
  },
  tabPillActive: {
    backgroundColor: lightTheme.input,
  },
  tabLabel: {
    fontSize: 12,
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingTop: 5,
  },
  tableHeaderText: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  colSymbol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
    overflow: "hidden",
  },
  coinName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  coinSym: {
    marginTop: 0,
    fontSize: 10,
    color: "#9CA3AF",
  },
  priceMain: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  priceSub: {
    marginTop: 2,
    fontSize: 10,
    color: "#9CA3AF",
  },
  changePill: {
    minWidth: 70,
    paddingHorizontal: 8,
    height: 26,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  changeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  viewMoreRow: {
    flexDirection: "row",
    alignSelf: "center",
    alignItems: "center",
    paddingVertical: 10,
  },
  viewMoreText: {
    fontSize: 13,
  },
});

export default CoinList;
