import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import FastImage from "react-native-fast-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AppSafeAreaView,
  AppText,
  ELEVEN,
  FOURTEEN,
  MEDIUM,
  SEMI_BOLD,
  TEN,
  THIRTEEN,
  TWELVE,
} from "../../shared";
import {
  APP_LOGO,
  apple,
  back_ic,
  googleIcon,
  welcome_banner,
} from "../../helper/ImageAssets";
import NavigationService from "../../navigation/NavigationService";
import { LOGIN_SCREEN, REGISTER_SCREEN } from "../../navigation/routes";
import { useTheme } from "../../hooks/useTheme";
import { colors, lightTheme } from "../../theme/colors";
import Toast from "react-native-simple-toast";
import { useAppSelector } from "../../store/hooks";
import { IMAGE_BASE_URL } from "../../helper/Constants";
import { SocketContext } from "../../SocketProvider";

/** Same keys/labels as `CoinList.js` tabs, excluding Favorite (key 0). */
const WELCOME_TABS = [
  { key: 1, label: "Trending" },
  { key: 2, label: "Hot" },
  { key: 3, label: "New Listing" },
  { key: 4, label: "Top Gainers" },
];

const C = {
  lightBg: "#FFFFFF",
  lightCard: "#FFFFFF",
  lightBorder: "#E8E8E8",
  lightText: "#1A1A1A",
  lightMuted: "#8E8E93",
  lightBtn: "#2D2D2D",
  lightGreen: "#34C759",
  lightLogoBg: "#EFE6DC",
  lightStripe: "rgba(0,0,0,0.04)",
};

const Welcome = () => {
  const insets = useSafeAreaInsets();
  const { colors: themeColors, isDark } = useTheme();
  const coinPairs = useAppSelector((state) => state.home.coinPairs);
  const socketLoading = useAppSelector((state) => state.home.socketLoading);
  const socketContextVars = useContext(SocketContext) || {};
  const { subscribeToMarket, unsubscribeFromMarket } = socketContextVars;

  useEffect(() => {
    if (subscribeToMarket) subscribeToMarket();
  }, [subscribeToMarket]);

  useFocusEffect(
    useCallback(() => {
      if (subscribeToMarket) subscribeToMarket();
      return () => {
        if (unsubscribeFromMarket) unsubscribeFromMarket();
      };
    }, [subscribeToMarket, unsubscribeFromMarket])
  );

  /** CoinList parity: 1=Trending, 2=Hot, 3=New Listing, 4=Top Gainers (no Favorite). */
  const [activeTabList, setActiveTabList] = useState(1);

  const normSym = useCallback((s) => String(s || "").trim().toUpperCase(), []);
  const toNum = useCallback((v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }, []);

  const pairVolumeNumber = useCallback(
    (p) => toNum(p?.volume_24h) || toNum(p?.volume) || toNum(p?.quote_volume) || 0,
    [toNum]
  );

  const pairListingTimeMs = useCallback((p) => {
    const dt = p?.createdAt || p?.created_at || p?.listing_time || p?.listedAt;
    const ms = dt ? Date.parse(dt) : NaN;
    if (Number.isFinite(ms)) return ms;
    const id = String(p?._id || p?.id || "");
    return id ? id.length : 0;
  }, []);

  const spotChangeNumber = useCallback((p) => toNum(p?.change_percentage ?? p?.changePercentage ?? p?.change), [toNum]);

  const HOT_BASE_ORDER = useMemo(() => ["BTC", "ETH", "BNB", "SOL", "XRP", "DOGE", "MATIC"], []);
  const pickPairForBase = useCallback(
    (pairs, base) => {
      const b = normSym(base);
      const usdt = pairs.find(
        (p) => normSym(p?.base_currency) === b && normSym(p?.quote_currency) === "USDT"
      );
      if (usdt) return usdt;
      return pairs.find((p) => normSym(p?.base_currency) === b);
    },
    [normSym]
  );

  const spotUsdtPairs = useMemo(() => {
    if (!coinPairs || coinPairs.length === 0) return [];
    const usdt = coinPairs.filter((p) => normSym(p?.quote_currency) === "USDT");
    return usdt.length ? usdt : coinPairs;
  }, [coinPairs, normSym]);

  const filterData = useMemo(() => {
    if (!spotUsdtPairs || spotUsdtPairs.length === 0) return [];
    if (activeTabList === 1) {
      return [...spotUsdtPairs].sort((a, b) => pairVolumeNumber(b) - pairVolumeNumber(a));
    }
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
    if (activeTabList === 3) {
      return [...spotUsdtPairs].sort((a, b) => pairListingTimeMs(b) - pairListingTimeMs(a));
    }
    if (activeTabList === 4) {
      return [...spotUsdtPairs].sort((a, b) => spotChangeNumber(b) - spotChangeNumber(a));
    }
    return [...spotUsdtPairs];
  }, [
    spotUsdtPairs,
    activeTabList,
    pairVolumeNumber,
    HOT_BASE_ORDER,
    pickPairForBase,
    pairListingTimeMs,
    spotChangeNumber,
  ]);

  const fourItems = useMemo(
    () => (Array.isArray(filterData) ? filterData.slice(0, 5) : []),
    [filterData]
  );

  const palette = useMemo(
    () => ({
      bg: isDark ? themeColors.background : C.lightBg,
      card: isDark ? themeColors.card : C.lightCard,
      border: isDark ? themeColors.border : C.lightBorder,
      text: isDark ? themeColors.text : C.lightText,
      muted: isDark ? themeColors.secondaryText : C.lightMuted,
      btn: isDark ? themeColors.button : C.lightBtn,
      btnText: isDark ? themeColors.buttonText : "#FFFFFF",
      green: C.lightGreen,
      logoBg: isDark ? themeColors.themeElevationColor : C.lightLogoBg,
      stripe: isDark ? "rgba(255,255,255,0.06)" : C.lightStripe,
    }),
    [isDark, themeColors]
  );

  const onLogin = useCallback(() => {
    NavigationService.navigate(LOGIN_SCREEN);
  }, []);

  const onRegister = useCallback(() => {
    NavigationService.navigate(REGISTER_SCREEN);
  }, []);

  const onGoogle = useCallback(() => {
    Toast.showWithGravity("Coming soon", Toast.SHORT, Toast.BOTTOM);
  }, []);

  const footerPad = Math.max(insets.bottom, 12);

  return (
    <AppSafeAreaView style={[styles.root, { backgroundColor: palette.bg }]}>
      <View style={styles.flex}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: footerPad + 76 }]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Header */}
          <View style={[styles.header, { paddingTop: 8 }]}>
            <View style={[styles.logoCircle, { backgroundColor: lightTheme.input }]}>
              <FastImage source={APP_LOGO} style={styles.logoImg} resizeMode="contain" />
            </View>
            <TouchableOpacity onPress={onLogin} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: palette.text }}>
                Log In
              </AppText>
            </TouchableOpacity>
          </View>

          {/* Hero card */}
          <View style={[styles.heroCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <View style={styles.heroStripeWrap} pointerEvents="none">
              {[...Array(24)].map((_, i) => (
                <View key={i} style={[styles.heroStripe, { backgroundColor: palette.stripe }]} />
              ))}
            </View>
            <AppText weight={SEMI_BOLD} style={[styles.heroTitle, { color: palette.text }]}>
              Trade hundreds of{"\n"}cryptocurrencies instantly
            </AppText>
            <View style={styles.heroArtWrap}>
              <FastImage source={welcome_banner} style={styles.heroArt} resizeMode="contain" />
            </View>
            <TouchableOpacity
              style={[styles.heroCta, { backgroundColor: palette.btn }]}
              onPress={onLogin}
              activeOpacity={0.85}
            >
              <AppText type={THIRTEEN} weight={SEMI_BOLD} style={{ color: palette.btnText }}>
                Log In to Trade
              </AppText>
            </TouchableOpacity>
          </View>

          {/* Tabs — same as Home `CoinList` (Favorite tab omitted) */}
          <View style={[styles.tabsWrapper, { borderBottomColor: isDark ? "rgba(255,255,255,0.1)" : lightTheme.input }]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabRow}
              style={styles.tabsScroll}
            >
              {WELCOME_TABS.map((t) => {
                const active = activeTabList === t.key;
                return (
                  <TouchableOpacity
                    key={String(t.key)}
                    style={styles.tabPill}
                    onPress={() => setActiveTabList(t.key)}
                    activeOpacity={0.8}
                  >
                    <AppText
                      weight={SEMI_BOLD}
                      type={FOURTEEN}
                      style={{ color: active ? palette.text : palette.muted }}
                    >
                      {t.label}
                    </AppText>
                    {active && (
                      <View style={[styles.tabIndicator, { backgroundColor: palette.text }]} />
                    )}
                  </TouchableOpacity>
                );
              })}
              <View style={{ width: 16 }} />
            </ScrollView>
          </View>

          {/* Market list — same socket-fed `coinPairs` as Home `CoinList` */}
          <View style={styles.listWrap}>
            <View style={styles.tableHeader}>
              <AppText type={TWELVE} style={[styles.tableHeaderText, { flex: 1.2, color: palette.muted }]}>Symbol</AppText>
              <AppText type={TWELVE} style={[styles.tableHeaderText, { flex: 1, textAlign: "right", color: palette.muted }]}>Last Price</AppText>
              <View style={{ flex: 0.9, alignItems: "flex-end" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <AppText type={TWELVE} style={[styles.tableHeaderText, { color: palette.muted }]}>
                    24H Change
                  </AppText>
                  <View style={{ gap: 1 }}>
                    <FastImage
                      source={back_ic}
                      style={{ width: 6.5, height: 6.5, transform: [{ rotate: "90deg" }] }}
                      resizeMode="contain"
                      tintColor={palette.muted}
                    />
                    <FastImage
                      source={back_ic}
                      style={{ width: 6.5, height: 6.5, transform: [{ rotate: "-90deg" }] }}
                      resizeMode="contain"
                      tintColor={palette.muted}
                    />
                  </View>
                </View>
              </View>
            </View>

            {fourItems.length > 0
              ? fourItems.map((item, idx) => {
                const sym = String(item?.base_currency || "").toUpperCase();
                const q = normSym(item?.quote_currency) || "USDT";
                const pairTop = sym ? `${sym}/${q}` : "—";
                const name = item?.base_currency_name || item?.base_currency || "—";
                const last = item?.buy_price ?? item?.last_price ?? item?.price ?? 0;
                const sub = item?.sell_price ?? item?.usd_price ?? item?.usdt_price ?? 0;
                const chg =
                  Number(item?.change_percentage ?? item?.changePercentage ?? item?.change) || 0;
                const isUp = chg >= 0;
                const chgText = `${Math.abs(chg).toFixed(2)}%`;
                return (
                  <TouchableOpacity
                    key={`live-${activeTabList}-${sym}-${idx}`}
                    style={styles.row}
                    onPress={onLogin}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.colSymbol, { flex: 1.2, right: 10 }]}>
                      <View style={[styles.iconCircle, {}]}>
                        <FastImage
                          source={item?.icon_path ? { uri: IMAGE_BASE_URL + item.icon_path } : undefined}
                          resizeMode="contain"
                          style={{ width: 25, height: 25, borderRadius: 50 }}
                        />
                      </View>
                      <View style={{ flex: 1, }}>
                        <AppText weight={SEMI_BOLD} type={TWELVE} style={[styles.coinName, { color: palette.text }]} numberOfLines={1}>
                          {pairTop}
                        </AppText>
                        <AppText style={[styles.coinSym, { color: palette.muted }]} numberOfLines={1}>
                          {name}
                        </AppText>
                      </View>
                    </View>
                    <View style={{ flex: 1, alignItems: "flex-end" }}>
                      <AppText weight={MEDIUM} type={THIRTEEN} style={{ color: palette.text }} numberOfLines={1}>
                        {String(last)}
                      </AppText>
                      <AppText style={[styles.priceSub, { color: palette.muted }]} numberOfLines={1}>
                        {String(sub)}
                      </AppText>
                    </View>
                    <View style={{ flex: 0.9, alignItems: "flex-end" }}>
                      <View style={[styles.changePillCoin, { backgroundColor: isUp ? "#2DBE7E" : "#EF4444" }]}>
                        <AppText style={styles.changeText} weight={MEDIUM} type={ELEVEN} numberOfLines={1}>
                          {isUp ? "+ " : "- "}
                          {chgText}
                        </AppText>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
              : (
                <View style={styles.marketEmpty}>
                  <AppText style={[styles.coinSym, { color: palette.muted, textAlign: "center" }]}>
                    {socketLoading ? "Loading markets…" : "Markets unavailable. Check connection and try again."}
                  </AppText>
                </View>
              )}
          </View>
        </ScrollView>

        {/* Bottom bar */}
        <View
          style={[
            styles.footer,
            {
              paddingBottom: footerPad,
              paddingTop: 8,
              backgroundColor: palette.bg,
              borderTopColor: palette.border,
            },
          ]}
        >
          <TouchableOpacity style={[styles.signUpBtn, { backgroundColor: palette.btn }]} onPress={onRegister} activeOpacity={0.88}>
            <AppText type={THIRTEEN} weight={SEMI_BOLD} style={{ color: palette.btnText }}>
              Sign Up
            </AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.socialBtn, { backgroundColor: palette.card, borderColor: palette.border }]}
            onPress={onGoogle}
            activeOpacity={0.8}
          >
            <FastImage source={googleIcon} style={styles.socialIcon} resizeMode="contain" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.socialBtn, { backgroundColor: palette.card, borderColor: palette.border }]}
            onPress={onGoogle}
            activeOpacity={0.8}
          >
            <FastImage source={apple} style={styles.socialIcon} resizeMode="contain" />
          </TouchableOpacity>
        </View>
      </View>
    </AppSafeAreaView>
  );
};

export default Welcome;

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  logoImg: { width: 26, height: 20 },
  heroCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 12,
    overflow: "hidden",
    marginBottom: 8,
    // ...Platform.select({
    //   ios: {
    //     shadowColor: "#000",
    //     shadowOffset: { width: 0, height: 4 },
    //     shadowOpacity: 0.06,
    //     shadowRadius: 12,
    //   },
    //   android: { elevation: 3 },
    // }),
  },
  heroStripeWrap: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    justifyContent: "space-evenly",
    opacity: 0.5,
  },
  heroStripe: {
    width: 1,
    height: "100%",
  },
  heroTitle: {
    textAlign: "left",
    fontSize: 19,
    lineHeight: 24,
    marginBottom: 8,
    zIndex: 1,
    alignSelf: "flex-start",
  },
  heroArtWrap: {
    alignItems: "center",
    justifyContent: "center",
    height: 130,
    zIndex: 1,
    marginVertical: 20,
  },
  heroArt: {
    width: 196,
    height: 188,
    // maxHeight: 150,
  },
  heroCta: {
    height: 42,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  tabsWrapper: {
    marginHorizontal: -16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginTop: 8,
    marginBottom: 4,
  },
  tabsScroll: {},
  tabRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    paddingHorizontal: 16,
  },
  tabPill: {
    paddingHorizontal: 2,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tabIndicator: {
    height: 2.5,
    width: 24,
    borderRadius: 2,
    position: "absolute",
    bottom: 0,
  },
  tabLabel: {
    fontSize: 14,
  },
  listWrap: { marginTop: 6 },
  marketEmpty: { paddingVertical: 28, paddingHorizontal: 12 },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingTop: 5,
  },
  tableHeaderText: {

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
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  coinName: {

  },
  coinSym: {
    marginTop: 0,
    fontSize: 11,
  },
  priceMain: {
  },
  priceSub: {
    marginTop: 2,
    fontSize: 11,
  },
  changePillCoin: {
    minWidth: 55,
    paddingHorizontal: 8,
    height: 25,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  changeText: {
    color: "#FFFFFF",

  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
    // ...Platform.select({
    //   ios: {
    //     shadowColor: "#000",
    //     shadowOffset: { width: 0, height: -2 },
    //     shadowOpacity: 0.04,
    //     shadowRadius: 8,
    //   },
    //   android: { elevation: 8 },
    // }),
  },
  signUpBtn: {
    flex: 1,
    height: 42,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  socialBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  socialIcon: { width: 19, height: 19 },
});
