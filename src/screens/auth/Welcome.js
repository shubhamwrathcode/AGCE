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
  BOLD,
  ELEVEN,
  FIFTEEN,
  FOURTEEN,
  MEDIUM,
  SEMI_BOLD,
  SIXTEEN,
  TEN,
  THIRTEEN,
  TWELVE,
  TWENTY,
} from "../../shared";
import {
  APP_LOGO,
  apple,
  back_ic,
  googleIcon,
  welcome_banner,
  NO_NOTIFICATION_ICON,
  NO_NOTIFICATION_ICON_LIGHT,
} from "../../helper/ImageAssets";
import NavigationService from "../../navigation/NavigationService";
import { LOGIN_SCREEN, REGISTER_SCREEN, TRADE_SCREEN, FUTURES_SCREEN, NAVIGATION_BOTTOM_TAB_STACK } from "../../navigation/routes";
import { useTheme } from "../../hooks/useTheme";
import { colors, darkTheme, lightTheme } from "../../theme/colors";
import Toast from "react-native-simple-toast";
import { useAppSelector } from "../../store/hooks";
import { useDispatch } from "react-redux";
import { IMAGE_BASE_URL } from "../../helper/Constants";
import { setFuturesPairs } from "../../slices/homeSlice";
import { fontFamilyMedium } from "../../theme/typography";
import WebView from "react-native-webview";
import { CHART_WEB_BASE_URL } from "../../helper/Constants";
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import { googleLogin } from "../../actions/authActions";
import { setLoading } from "../../slices/authSlice";
import { showError } from "../../helper/logger";

const formatVol = (vol) => {
  const n = Number(vol);
  if (!n || isNaN(n)) return "0";
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(2) + "K";
  return n.toFixed(2);
};

const formatPriceWithTick = (p, tickSize) => {
  const n = Number(p);
  if (!Number.isFinite(n)) return "";
  const t = Number(tickSize);
  if (Number.isFinite(t) && t > 0) {
    let decs = 0;
    const tsStr = String(t);
    if (tsStr.includes("e-")) {
      decs = parseInt(tsStr.split("e-")[1], 10);
    } else if (tsStr.includes(".")) {
      decs = tsStr.split(".")[1].length;
    }
    return n.toFixed(decs);
  }
  return n.toFixed(5); // fallback
};

const formatWithCommas = (val) => {
  if (val == null || val === "") return "";
  const str = String(val);
  if (!str.includes(".")) {
    return str.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  const [intPart, decPart] = str.split(".");
  let sign = "";
  let iPart = intPart;
  if (iPart.startsWith("-")) {
    sign = "-";
    iPart = iPart.slice(1);
  }
  const withSep = iPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${sign}${withSep}${decPart != null && decPart !== "" ? `.${decPart}` : ""}`;
};

const formatDisplayPrice = (p, tickSize) => {
  if (p == null || p === "") return "—";
  return formatWithCommas(formatPriceWithTick(p, tickSize));
};
import { SocketContext } from "../../SocketProvider";

const WELCOME_TABS = [
  { key: 1, label: "Trending" },
  { key: 2, label: "Spot" },
  { key: 3, label: "Futures" },
  { key: 4, label: "Hot" },
  { key: 5, label: "New Listing" },
  { key: 6, label: "Top Gainers" },
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
  const futuresPairs = useAppSelector((state) => state.home.futuresPairs ?? []);
  const socketLoading = useAppSelector((state) => state.home.socketLoading);
  const dispatch = useDispatch();
  const socketContextVars = useContext(SocketContext) || {};
  const { subscribeToMarket, unsubscribeFromMarket } = socketContextVars;
  const [isGoogleSignInInProgress, setIsGoogleSignInInProgress] = useState(false);

  useEffect(() => {
    try {
      GoogleSignin.configure({
        webClientId:
          "512474198099-lbg03gjaesa8n6vhf73c5t9f9j55t7tf.apps.googleusercontent.com",
        offlineAccess: true,
        forceCodeForRefreshToken: true,
      });
    } catch (e) {
      console.warn("GoogleSignin.configure error", e);
    }

    return () => {
      setIsGoogleSignInInProgress(false);
    };
  }, []);

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

  /** CoinList parity: 1=Trending, 2=Spot, 3=Futures, 4=Hot, 5=New Listing, 6=Top Gainers (no Favorite). */
  const [activeTabList, setActiveTabList] = useState(1);
  const [expandedRow, setExpandedRow] = useState(null);
  const userData = useAppSelector((state) => state.auth?.userData);

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
    if (activeTabList === 3) {
      if (!futuresPairs || futuresPairs.length === 0) return [];
      return [...futuresPairs].sort((a, b) => pairVolumeNumber(b) - pairVolumeNumber(a));
    }

    if (!spotUsdtPairs || spotUsdtPairs.length === 0) return [];

    if (activeTabList === 1) { // Trending
      return [...spotUsdtPairs].sort((a, b) => pairVolumeNumber(b) - pairVolumeNumber(a));
    }
    if (activeTabList === 2) { // Spot
      return [...spotUsdtPairs];
    }
    if (activeTabList === 4) { // Hot
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
    if (activeTabList === 5) { // New Listing
      return [...spotUsdtPairs].sort((a, b) => pairListingTimeMs(b) - pairListingTimeMs(a));
    }
    if (activeTabList === 6) { // Top Gainers
      return [...spotUsdtPairs].sort((a, b) => spotChangeNumber(b) - spotChangeNumber(a));
    }
    return [...spotUsdtPairs];
  }, [
    spotUsdtPairs,
    futuresPairs,
    activeTabList,
    pairVolumeNumber,
    HOT_BASE_ORDER,
    pickPairForBase,
    pairListingTimeMs,
    spotChangeNumber,
  ]);

  const fourItems = useMemo(
    () => (Array.isArray(filterData) ? filterData.slice(0, 10) : []),
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

  const onRowPress = useCallback((idx, isFutures) => {
    if (isFutures) {
      onLogin();
    } else {
      setExpandedRow(prev => (prev === idx ? null : idx));
    }
  }, [onLogin]);



  const onRegister = useCallback(() => {
    NavigationService.navigate(REGISTER_SCREEN);
  }, []);

  const onGoogle = async () => {
    if (isGoogleSignInInProgress) return;
    try {
      console.log("Starting Google Sign-In...");
      setIsGoogleSignInInProgress(true);
      dispatch(setLoading(true));

      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      const account = await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();

      let data = {
        Token: tokens?.accessToken || tokens?.idToken || account?.data?.idToken,
        type: 'google',
      };

      dispatch(googleLogin(data));
    } catch (error) {
      console.error("Google Sign In Error:", error?.code, error?.message, error);
      if (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof error.message === "string" &&
        error.message.includes("User cancelled flow")
      ) {
        showError("Google Sign-In was cancelled");
      } else if (error?.message && error.message.includes("Network error")) {
        showError("Network error. Please check your internet connection.");
      } else if (error?.message && error.message.includes("Invalid client")) {
        showError("Google Sign-In configuration error. Please contact support.");
      } else if (error?.code === statusCodes.SIGN_IN_CANCELLED) {
        showError("Google Sign-In was cancelled");
      } else if (error?.code === statusCodes.IN_PROGRESS) {
        showError("Google Sign-In already in progress");
      } else if (error?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        showError("Google Play Services not available or outdated");
      } else {
        const fallbackMessage =
          (typeof error === "string" && error) ||
          error?.message ||
          error?.error ||
          error?.error_description ||
          "Google Sign-In failed. Please try again.";
        showError(fallbackMessage);
      }
    } finally {
      setIsGoogleSignInInProgress(false);
      dispatch(setLoading(false));
    }
  };

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
            <View style={[styles.logoCircle, { backgroundColor: '#F5F6F7' }]}>
              <FastImage source={APP_LOGO} style={styles.logoImg} resizeMode="contain" />
            </View>
            <TouchableOpacity onPress={onLogin} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: palette.text }}>
                Log In
              </AppText>
            </TouchableOpacity>
          </View>

          {/* Hero card */}
          <View style={[styles.heroCard, { backgroundColor: isDark ? darkTheme.inputBorder : palette.card, borderColor: palette.border }]}>
            <View style={styles.heroStripeWrap} pointerEvents="none">
              {[...Array(24)].map((_, i) => (
                <View key={i} style={[styles.heroStripe, { backgroundColor: palette.stripe }]} />
              ))}
            </View>
            <AppText weight={BOLD} type={TWENTY} style={[styles.heroTitle, { color: palette.text }]}>
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
              <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: isDark ? colors.black : palette.btnText }}>
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
                    onPress={() => {
                      setActiveTabList(t.key);
                      setExpandedRow(null);
                    }}
                    activeOpacity={0.8}
                  >
                    <AppText
                      weight={SEMI_BOLD}
                      type={SIXTEEN}
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
                const isFutures = activeTabList === 3;
                const sym = isFutures ? String(item?.base_asset || item?.base_currency || "").toUpperCase() : String(item?.base_currency || "").toUpperCase();
                const q = isFutures ? (item?.margin_asset || "USDT") : (normSym(item?.quote_currency) || "USDT");
                const pairTop = sym ? `${sym} / ${q}` : "—";
                const name = isFutures ? "Perpetual" : (item?.base_currency_name || item?.base_currency || "—");
                const last = item?.buy_price ?? item?.last_price ?? item?.price ?? 0;
                const sub = item?.sell_price ?? item?.usd_price ?? item?.usdt_price ?? 0;
                const chg = Number(item?.change_percentage ?? item?.changePercentage ?? item?.change) || 0;
                const isUp = chg >= 0;
                const chgText = `${Math.abs(chg).toFixed(2)}%`;

                if (expandedRow === idx) {
                  // console.log(`\n\n=== EXPANDED ITEM DATA [${sym}] ===\n`, JSON.stringify(item, null, 2), `\n=================================\n\n`);
                }

                return (
                  <View key={`wrap-${idx}`}>
                    <TouchableOpacity
                      key={`live-${activeTabList}-${sym}-${idx}`}
                      style={[styles.row, expandedRow === idx && activeTabList !== 3 ? { borderBottomWidth: 0, paddingBottom: 8 } : {}]}
                      onPress={() => onRowPress(idx, isFutures)}
                      activeOpacity={0.85}
                    >
                      <View style={[styles.colSymbol, { flex: 1.2, right: 5 }]}>
                        <View style={[styles.iconCircle, {}]}>
                          <FastImage
                            source={item?.icon_path ? { uri: IMAGE_BASE_URL + item.icon_path } : undefined}
                            resizeMode="contain"
                            style={{ width: 32, height: 32, borderRadius: 50 }}
                          />
                        </View>
                        <View style={{ flex: 1, }}>
                          <AppText weight={SEMI_BOLD} type={FOURTEEN} style={[styles.coinName, { color: palette.text }]} numberOfLines={1}>
                            {sym}<AppText style={{ color: palette.muted, fontSize: 12 }}> / {q}</AppText>
                          </AppText>
                          <AppText style={[styles.coinSym, { color: palette.muted }]} numberOfLines={1}>
                            {name}
                          </AppText>
                        </View>
                      </View>
                      <View style={{ flex: 1, alignItems: "flex-end" }}>
                        <AppText weight={SEMI_BOLD} type={FIFTEEN} style={{ color: palette.text }} numberOfLines={1}>
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

                    {expandedRow === idx && !isFutures && (
                      <View style={{ marginHorizontal: -16, paddingHorizontal: 16, paddingBottom: 10, backgroundColor: isDark ? darkTheme.sheetDarkColor : palette.card }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 20, marginTop: 8 }}>
                          <TouchableOpacity
                            style={{ flex: 1, paddingVertical: 6, backgroundColor: isDark ? colors.white : '#1A1A1A', borderRadius: 30, alignItems: 'center', justifyContent: 'center' }}
                            onPress={() => NavigationService.navigate(NAVIGATION_BOTTOM_TAB_STACK, { screen: TRADE_SCREEN, params: { coinDetail: item } })}
                            activeOpacity={0.8}
                          >
                            <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: isDark ? colors.black : '#FFFFFF' }}>Trade</AppText>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={{ flex: 1, paddingVertical: 6, backgroundColor: isDark ? colors.white : '#1A1A1A', borderRadius: 30, alignItems: 'center', justifyContent: 'center' }}
                            onPress={() => NavigationService.navigate(NAVIGATION_BOTTOM_TAB_STACK, {
                              screen: FUTURES_SCREEN,
                              params: {
                                screen: 'Futures',
                                params: { coin: item }
                              }
                            })}
                            activeOpacity={0.8}
                          >
                            <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: isDark ? colors.black : '#FFFFFF' }}>Futures</AppText>
                          </TouchableOpacity>
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                          <View style={{ flex: 1 }}>
                            <AppText type={TEN} style={{ color: palette.muted, marginBottom: 4 }}>24h High</AppText>
                            <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: '#2DBE7E' }}>{item?.high ? formatDisplayPrice(item.high, item.tick_size) : "—"}</AppText>
                          </View>
                          <View style={{ flex: 1, alignItems: 'center' }}>
                            <AppText type={TEN} style={{ color: palette.muted, marginBottom: 4 }}>24h Low</AppText>
                            <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: '#EF4444' }}>{item?.low ? formatDisplayPrice(item.low, item.tick_size) : "—"}</AppText>
                          </View>
                          <View style={{ flex: 1, alignItems: 'flex-end' }}>
                            <AppText type={TEN} style={{ color: palette.muted, marginBottom: 4 }}>24h Vol</AppText>
                            <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: palette.text }}>{item?.volume ? formatVol(item.volume) : "—"}</AppText>
                          </View>
                        </View>

                        {/* Grid Row 2: 24h Change, 24h Open, Vol(Quote) */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                          <View style={{ flex: 1 }}>
                            <AppText type={TEN} style={{ color: palette.muted, marginBottom: 4 }}>24h Change</AppText>
                            <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: isUp ? '#2DBE7E' : '#EF4444' }}>{isUp ? '+' : '-'}{chgText}</AppText>
                          </View>
                          <View style={{ flex: 1, alignItems: 'center' }}>
                            <AppText type={TEN} style={{ color: palette.muted, marginBottom: 4 }}>24h Open</AppText>
                            <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: palette.text }}>{item?.open ? formatDisplayPrice(item.open, item.tick_size) : "—"}</AppText>
                          </View>
                          <View style={{ flex: 1, alignItems: 'flex-end' }}>
                            <AppText type={TEN} style={{ color: palette.muted, marginBottom: 4 }}>Vol ({q})</AppText>
                            <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: palette.text }}>{item?.volumeQuote || item?.quote_volume ? formatVol(item?.volumeQuote || item?.quote_volume) : "—"}</AppText>
                          </View>
                        </View>

                        {/* Chart WebView */}
                        <View style={{ height: 250, width: "100%", backgroundColor: palette.card, borderRadius: 8, overflow: 'hidden' }}>
                          <WebView
                            key={`${CHART_WEB_BASE_URL}chart/${isDark ? "dark" : "light"}/${sym}_${q}`}
                            source={{ uri: `${CHART_WEB_BASE_URL}chart/${isDark ? "dark" : "light"}/${sym}_${q}` }}
                            style={{ width: "100%", height: 280, marginTop: -30, backgroundColor: "transparent" }}
                            containerStyle={{ backgroundColor: "transparent" }}
                            opaque={false}
                            androidLayerType="hardware"
                            cacheEnabled
                            cacheMode="LOAD_CACHE_ELSE_NETWORK"
                            mixedContentMode="compatibility"
                            allowsInlineMediaPlayback
                            mediaPlaybackRequiresUserAction={false}
                            javaScriptEnabled
                            domStorageEnabled
                            scrollEnabled={false}
                            bounces={false}
                            sharedCookiesEnabled
                            javaScriptEnabledAndroid
                            scalesPageToFit={false}
                            automaticallyAdjustContentInsets={false}
                            setSupportMultipleWindows={false}
                            overScrollMode="never"
                          />
                        </View>
                      </View>
                    )}
                  </View>
                );
              })
              : (
                <View style={styles.marketEmpty}>
                  {socketLoading ? (
                    <AppText style={[styles.coinSym, { color: palette.muted, textAlign: "center" }]}>
                      Loading markets…
                    </AppText>
                  ) : (
                    <View style={{ alignItems: "center", justifyContent: "center" }}>
                      <FastImage
                        source={isDark ? NO_NOTIFICATION_ICON : NO_NOTIFICATION_ICON_LIGHT}
                        resizeMode="contain"
                        style={{ width: 100, height: 100, marginBottom: 10 }}
                      />
                      <AppText style={[styles.coinSym, { color: palette.muted, textAlign: "center", fontFamily: fontFamilyMedium }]}>
                        No market data available.
                      </AppText>
                    </View>
                  )}
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
            <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: isDark ? colors.black : palette.btnText }}>
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
          {Platform.OS === 'ios' && <TouchableOpacity
            style={[styles.socialBtn, { backgroundColor: palette.card, borderColor: palette.border }]}
            onPress={() => { }}
            activeOpacity={0.8}
          >
            <FastImage source={apple} tintColor={isDark ? colors.white : colors.black} style={[styles.socialIcon, {}]} resizeMode="contain" />
          </TouchableOpacity>}
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
    borderRadius: 20,
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
    width: 40,
    height: 40,
    borderRadius: 20,
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
    minWidth: 56,
    paddingHorizontal: 8,
    height: 25,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  changeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",

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
