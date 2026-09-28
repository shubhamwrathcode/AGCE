import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Keyboard,
  Dimensions,
  Text,
  Animated,
} from "react-native";
import FastImage from "react-native-fast-image";
import Svg, { Path } from "react-native-svg";
import { Wallet, FileText, RefreshCw, Info, ShieldCheck } from "lucide-react-native";
import { useIsFocused } from "@react-navigation/native";
import { AppSafeAreaView, AppText, SEMI_BOLD } from "../../shared";
import { colors } from "../../theme/colors";
import { useTheme } from "../../hooks/useTheme";
import {
  back_ic,
  downIcon,
  bitcoinIcon,
  tetherIcon,
  bnbIcon,
  trxIcon,
  Polygon,
  transferNew,
  historyIcon,
  closeIcon,
  searchIcon,
} from "../../helper/ImageAssets";
import NavigationService from "../../navigation/NavigationService";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import AnimatedBottomSheet from "../../common/AnimatedBottomSheet/AnimatedBottomSheet";
import { appOperation } from "../../appOperation";
import { NAVIGATION_AUTH_STACK, LOGIN_SCREEN, CONVERT_HISTORY_SCREEN } from "../../navigation/routes";
import { showError, showSuccess } from "../../helper/logger";
import {
  FALLBACK_CATALOG,
  normalizeCatalog,
  cryptosForFiat,
  fiatsForCrypto,
  computeConvertPreview,
  formatLiveRateLine,
  formatQuoteAmount,
  formatAedAmount,
  quoteMidLine,
  quoteFeeLabel,
  isPositiveMoneyString,
  moneyGreaterThan,
  sanitizeAmountInput,
  newIdempotencyKey,
  assetName,
  parseFiatConvertLimits,
} from "./convertHelpers";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const GOLD = "#D1AA67";
const LIVE_GREEN = "#01BC8D";
const MUTED = "#848E9C";
/** REST poll for convert rates (web polls at the same interval when its socket is down) */
const RATES_POLL_MS = 2000;
const DEFAULT_MIN_AED = 100;

const AedSymbolIcon = ({ size = 13, color = "#FFFFFF" }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100" fill={color}>
    <Path d="M 24 14 H 54 C 76 14 90 28 90 50 C 90 72 76 86 54 86 H 24 V 14 Z M 37 25 V 75 H 52 C 69 75 78 65 78 50 C 78 35 69 25 52 25 H 37 Z" />
    <Path d="M 16 35 C 28 30 42 36 56 36 H 82 C 86 36 89 34 92 33 V 41 C 88 43 84 44 80 44 H 55 C 41 44 28 39 16 43 V 35 Z" />
    <Path d="M 16 52 C 28 47 42 53 56 53 H 82 C 86 53 89 51 92 50 V 58 C 88 60 84 61 80 61 H 55 C 41 61 28 56 16 60 V 52 Z" />
  </Svg>
);

const FiatIcon = ({ code, size = 22 }) => (
  <View style={[styles.fiatCircle, { width: size, height: size, borderRadius: size / 2 }]}>
    {code === "AED" ? (
      <AedSymbolIcon size={Math.round(size * 0.6)} />
    ) : (
      <Text style={[styles.fiatCircleText, { fontSize: Math.round(size * 0.42) }]}>
        {String(code || "").slice(0, 2)}
      </Text>
    )}
  </View>
);

const LiveDot = () => {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.4, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <Animated.View
      style={[
        styles.liveDot,
        { opacity: pulse, transform: [{ scale: pulse.interpolate({ inputRange: [0.4, 1], outputRange: [0.85, 1] }) }] },
      ]}
    />
  );
};

/** Single-side dashed borders don't render on iOS, so clip a fully dashed box to one edge. */
const DashedDivider = ({ color }) => (
  <View style={{ height: 1, overflow: "hidden", marginVertical: 3 }}>
    <View style={{ height: 2, borderWidth: 1, borderColor: color, borderStyle: "dashed" }} />
  </View>
);

const DashedVLine = ({ color }) => (
  <View style={{ flex: 1, width: 2, overflow: "hidden", marginVertical: 6 }}>
    <View style={{ flex: 1, width: 4, borderWidth: 2, borderColor: color, borderStyle: "dashed" }} />
  </View>
);

const CRYPTO_ICON_MAP = {
  USDT: tetherIcon,
  BTC: bitcoinIcon,
  ETH: Polygon,
  BNB: bnbIcon,
  TRX: trxIcon,
  SOL: Polygon,
  XRP: tetherIcon,
  DOGE: tetherIcon,
  USDC: tetherIcon,
};

const BuyCryptoScreen = ({ navigation, isEmbedded = false, presetSide, presetAsset, presetKey }) => {
  const { colors: themeColors, isDark } = useTheme();
  const dispatch = useAppDispatch();
  const userData = useAppSelector((state) => state.auth.userData);
  const loggedIn = !!(userData?.id || userData?._id);

  // Bottom Sheet Refs
  const rbSheetAssetPicker = useRef(null);
  const rbSheetConfirm = useRef(null);
  const rbSheetHistory = useRef(null);

  // States
  const [side, setSide] = useState("buy"); // "buy" | "sell"
  const isBuy = side === "buy";

  const [catalog, setCatalog] = useState(FALLBACK_CATALOG);
  const [fiatCode, setFiatCode] = useState("AED");
  const [cryptoCode, setCryptoCode] = useState("USDT");
  const [amount, setAmount] = useState("");
  const [inputField, setInputField] = useState("spend"); // "spend" | "receive"
  const [rates, setRates] = useState(null);
  const [spotBalance, setSpotBalance] = useState("0");
  const [loadingBalance, setLoadingBalance] = useState(false);

  // Picker modal state
  const [pickerType, setPickerType] = useState("spend"); // "spend" | "receive"
  const [pickerSearch, setPickerSearch] = useState("");

  // Convert Quote & Execution
  const [quoting, setQuoting] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [confirmQuote, setConfirmQuote] = useState(null);
  const [historyItems, setHistoryItems] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fiatOptions = useMemo(() => fiatsForCrypto(catalog, cryptoCode), [catalog, cryptoCode]);
  const cryptoOptions = useMemo(() => cryptosForFiat(catalog, fiatCode), [catalog, fiatCode]);

  const fiat = useMemo(
    () => fiatOptions.find((f) => f.code === fiatCode) || catalog.fiat[0] || FALLBACK_CATALOG.fiat[0],
    [fiatOptions, fiatCode, catalog]
  );
  const crypto = useMemo(
    () => cryptoOptions.find((c) => c.code === cryptoCode) || catalog.crypto[0] || FALLBACK_CATALOG.crypto[0],
    [cryptoOptions, cryptoCode, catalog]
  );

  const spendAsset = isBuy ? fiat : crypto;
  const receiveAsset = isBuy ? crypto : fiat;

  // Compute live preview calculation
  const preview = useMemo(() => {
    return computeConvertPreview({
      side: isBuy ? "BUY" : "SELL",
      amount,
      rates,
      baseAsset: crypto?.code || "USDT",
      quoteAsset: fiat?.code || "AED",
      qtyDecimals: crypto?.qty_decimals || 6,
      inputField,
    });
  }, [isBuy, amount, rates, crypto?.code, crypto?.qty_decimals, fiat?.code, inputField]);

  const liveRateText = useMemo(() => {
    return formatLiveRateLine(rates, crypto?.code || "USDT", fiat?.code || "AED");
  }, [rates, crypto?.code, fiat?.code]);

  // Load Catalog & Rates
  const loadInitialData = useCallback(async () => {
    try {
      const [assetsRes, ratesRes] = await Promise.all([
        appOperation.customer.fiat_convert_assets().catch(() => null),
        appOperation.customer.fiat_convert_rates().catch(() => null),
      ]);
      if (assetsRes?.success && assetsRes?.data) {
        setCatalog(normalizeCatalog(assetsRes.data));
      }
      if (ratesRes?.success && ratesRes?.data) {
        setRates(ratesRes.data);
      }
    } catch {
      setCatalog(FALLBACK_CATALOG);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const refreshRates = useCallback(async () => {
    const res = await appOperation.customer.fiat_convert_rates().catch(() => null);
    if (res?.success && res?.data) setRates(res.data);
  }, []);

  const isFocused = useIsFocused();
  useEffect(() => {
    if (!loggedIn || !isFocused) return undefined;
    const id = setInterval(refreshRates, RATES_POLL_MS);
    return () => clearInterval(id);
  }, [loggedIn, isFocused, refreshRates]);

  const [convertLimits, setConvertLimits] = useState({ minAed: null, maxAed: null });
  useEffect(() => {
    if (!loggedIn) return undefined;
    let cancelled = false;
    (async () => {
      const res = await appOperation.customer.fiat_limits().catch(() => null);
      if (!cancelled && res?.success) setConvertLimits(parseFiatConvertLimits(res.data));
    })();
    return () => {
      cancelled = true;
    };
  }, [loggedIn]);

  // Fetch Wallet Spot Balance
  const fetchBalance = useCallback(async () => {
    if (!loggedIn) {
      setSpotBalance("0");
      return;
    }
    const assetToFetch = isBuy ? fiat?.code : crypto?.code;
    if (!assetToFetch) return;
    setLoadingBalance(true);
    try {
      let list = [];
      const res = await appOperation.customer.user_wallet("spot").catch(() => null);
      if (res?.success && Array.isArray(res?.data)) {
        list = res.data;
      } else {
        const res2 = await appOperation.customer.user_wallet().catch(() => null);
        if (res2?.success && Array.isArray(res2?.data)) {
          list = res2.data;
        }
      }

      const want = String(assetToFetch).trim().toUpperCase();
      const row = list.find(
        (r) =>
          String(r?.short_name || "").trim().toUpperCase() === want ||
          String(r?.currency || "").trim().toUpperCase() === want ||
          String(r?.currency_symbol || "").trim().toUpperCase() === want ||
          String(r?.symbol || "").trim().toUpperCase() === want ||
          String(r?.coin || "").trim().toUpperCase() === want
      );

      setSpotBalance(row?.balance != null ? String(row.balance) : "0");
    } catch {
      setSpotBalance("0");
    } finally {
      setLoadingBalance(false);
    }
  }, [loggedIn, isBuy, fiat?.code, crypto?.code]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Spend & Receive values
  const spendAmountValue =
    inputField === "spend" ? amount : preview?.you_spend ? String(preview.you_spend) : "";
  const receiveAmountValue =
    inputField === "receive" ? amount : preview?.you_receive ? String(preview.you_receive) : "";

  const insufficientBalance =
    loggedIn &&
    isPositiveMoneyString(spendAmountValue) &&
    moneyGreaterThan(spendAmountValue, spotBalance);

  useEffect(() => {
    if (!presetKey) return;
    setSide(String(presetSide || "").toLowerCase() === "sell" ? "sell" : "buy");
    if (presetAsset) setCryptoCode(String(presetAsset).toUpperCase());
    setAmount("");
    setInputField("spend");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetKey]);

  // Handle Side Toggle (Buy / Sell)
  const handleToggleSide = (newSide) => {
    if (side === newSide) return;
    setSide(newSide);
    setAmount("");
    setInputField("spend");
  };

  // Open Asset Picker
  const handleOpenAssetPicker = (type) => {
    setPickerType(type);
    setPickerSearch("");
    rbSheetAssetPicker.current?.open();
  };

  const pickerOptions = useMemo(() => {
    const isSpendFiat = isBuy ? pickerType === "spend" : pickerType === "receive";
    const opts = isSpendFiat ? fiatOptions : cryptoOptions;
    const q = String(pickerSearch || "").trim().toLowerCase();
    if (!q) return opts;
    return opts.filter(
      (o) => o.code.toLowerCase().includes(q) || String(o.name || "").toLowerCase().includes(q)
    );
  }, [isBuy, pickerType, fiatOptions, cryptoOptions, pickerSearch]);

  const handleSelectAsset = (item) => {
    rbSheetAssetPicker.current?.close();
    const isSpendFiat = isBuy ? pickerType === "spend" : pickerType === "receive";
    if (isSpendFiat) {
      setFiatCode(item.code);
    } else {
      setCryptoCode(item.code);
    }
    setAmount("");
  };

  // Confirm Order Flow
  const handleReviewOrder = async () => {
    Keyboard.dismiss();
    if (!loggedIn) {
      NavigationService.navigate(NAVIGATION_AUTH_STACK, { screen: LOGIN_SCREEN });
      return;
    }
    if (!isPositiveMoneyString(spendAmountValue)) {
      showError("Please enter a valid amount");
      return;
    }
    if (insufficientBalance) {
      showError(`Insufficient ${spendAsset?.code} balance`);
      return;
    }

    setQuoting(true);
    try {
      const payload = isBuy
        ? {
          side: "BUY",
          base_asset: crypto.code,
          quote_asset: fiat.code,
          amount_aed: spendAmountValue,
        }
        : {
          side: "SELL",
          base_asset: crypto.code,
          quote_asset: fiat.code,
          amount_crypto: spendAmountValue,
        };

      console.log("➡️ [BUY_CRYPTO] QUOTE API REQUEST payload:", JSON.stringify(payload, null, 2));
      const res = await appOperation.customer.fiat_convert_quotes(payload).catch((err) => {
        console.error("❌ [BUY_CRYPTO] QUOTE API CATCH ERROR:", err);
        return null;
      });
      console.log("⬅️ [BUY_CRYPTO] QUOTE API RESPONSE:", JSON.stringify(res, null, 2));

      if (res?.success && res?.data) {
        setConfirmQuote(res.data);
      } else {
        console.warn("⚠️ [BUY_CRYPTO] QUOTE API unsuccessful or missing data, falling back to client preview");
        setConfirmQuote({
          ...preview,
          id: newIdempotencyKey("mock_qt"),
        });
      }
      rbSheetConfirm.current?.open();
    } catch (e) {
      console.error("❌ [BUY_CRYPTO] handleReviewOrder EXCEPTION:", e);
      setConfirmQuote({
        ...preview,
        id: newIdempotencyKey("mock_qt"),
      });
      rbSheetConfirm.current?.open();
    } finally {
      setQuoting(false);
    }
  };

  // Execute Order
  const handleExecuteConvert = async () => {
    if (!confirmQuote || executing) return;
    setExecuting(true);
    try {
      const quoteId = String(confirmQuote.id || confirmQuote._id || confirmQuote.quote_id || "");
      const key = newIdempotencyKey("cv");
      const executePayload = { quote_id: quoteId };
      const headers = { "Idempotency-Key": key };

      console.log("➡️ [BUY_CRYPTO] EXECUTE API REQUEST payload:", JSON.stringify(executePayload), "headers:", JSON.stringify(headers));

      const res = await appOperation.customer
        .fiat_convert_execute(executePayload, headers)
        .catch((err) => {
          console.error("❌ [BUY_CRYPTO] EXECUTE API CATCH ERROR:", err);
          return err;
        });

      console.log("⬅️ [BUY_CRYPTO] EXECUTE API RESPONSE:", JSON.stringify(res, null, 2));

      if (res?.success || res?.code === 200 || (!res?.error && res?.data)) {
        console.log("✅ [BUY_CRYPTO] CONVERT EXECUTION SUCCESS");
        showSuccess("Conversion executed successfully!");
        rbSheetConfirm.current?.close();
        setAmount("");
        fetchBalance();
      } else {
        const msg = res?.message || res?.error?.message || "Convert failed. Please try again.";
        console.warn("⚠️ [BUY_CRYPTO] CONVERT EXECUTION FAILED with message:", msg);
        showError(msg);
      }
    } catch (err) {
      console.error("❌ [BUY_CRYPTO] handleExecuteConvert EXCEPTION:", err);
      showError("Order execution failed. Please try again.");
    } finally {
      setExecuting(false);
    }
  };

  // History Flow
  const handleOpenHistory = () => {
    if (!loggedIn) {
      NavigationService.navigate(NAVIGATION_AUTH_STACK, { screen: LOGIN_SCREEN });
      return;
    }
    NavigationService.navigate(CONVERT_HISTORY_SCREEN);
  };

  const RootContainer = isEmbedded ? View : AppSafeAreaView;

  return (
    <RootContainer style={{ backgroundColor: themeColors.background, flex: 1 }}>
      {/* Top Header only when standalone screen */}
      {!isEmbedded && (
        <View style={[styles.header, { borderBottomColor: isDark ? themeColors.border : "#EEEEEE" }]}>
          <TouchableOpacity
            onPress={() => navigation?.goBack?.() || NavigationService.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.headerBtn}
          >
            <FastImage
              source={back_ic}
              style={{ width: 18, height: 18 }}
              resizeMode={FastImage.resizeMode.contain}
              tintColor={themeColors.text}
            />
          </TouchableOpacity>

          <AppText weight={SEMI_BOLD} style={[styles.headerTitle, { color: themeColors.text }]}>
            Buy / Sell Crypto
          </AppText>

          <TouchableOpacity onPress={handleOpenHistory} style={styles.headerBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <FastImage
              source={historyIcon}
              style={{ width: 20, height: 20 }}
              resizeMode={FastImage.resizeMode.contain}
              tintColor={themeColors.text}
            />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        contentContainerStyle={isEmbedded ? styles.embeddedContent : styles.scrollContent}
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {isEmbedded && (
          <TouchableOpacity
            onPress={handleOpenHistory}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={{ alignSelf: "flex-end", padding: 4, marginBottom: 12 }}
          >
            <FastImage
              source={historyIcon}
              style={{ width: 20, height: 20 }}
              resizeMode={FastImage.resizeMode.contain}
              tintColor={themeColors.text}
            />
          </TouchableOpacity>
        )}

        {/* Main Card Wrapper */}
        <View
          style={[
            styles.tradeCard,
            {
              backgroundColor: isDark ? 'transparent' : "#FFFFFF",
              borderColor: isDark ? "#282D3B" : "#DFE0E2",
            },
          ]}
        >
          {/* Buy / Sell Tabs */}
          <View
            style={[
              styles.tabsRow,
              {
                backgroundColor: isDark ? "#202329" : "#F2F3F4",
                borderBottomColor: isDark ? "#282D3B" : "#DFE0E2",
              },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleToggleSide("buy")}
              style={[
                styles.tabBtn,
                styles.tabBtnLeft,
                {
                  backgroundColor: isBuy
                    ? isDark
                      ? "#181A20"
                      : "#FFFFFF"
                    : isDark
                      ? "#202329"
                      : "#F2F3F4",
                  borderBottomWidth: isBuy ? 0 : 1,
                  borderBottomColor: isDark ? "#282D3B" : "#DFE0E2",
                },
              ]}
            >
              {isBuy && (
                <View
                  style={[
                    styles.activeIndicatorBar,
                    { backgroundColor: "#00C087" },
                  ]}
                />
              )}
              <Text
                style={[
                  styles.tabText,
                  {
                    color: isBuy
                      ? "#00C087"
                      : isDark
                        ? "#8E94A0"
                        : "#A0A3A7",
                    fontWeight: isBuy ? "800" : "600",
                    fontSize: isBuy ? 17 : 15,
                  },
                ]}
              >
                Buy
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleToggleSide("sell")}
              style={[
                styles.tabBtn,
                styles.tabBtnRight,
                {
                  backgroundColor: !isBuy
                    ? isDark
                      ? "#181A20"
                      : "#FFFFFF"
                    : isDark
                      ? "#202329"
                      : "#F2F3F4",
                  borderBottomWidth: !isBuy ? 0 : 1,
                  borderBottomColor: isDark ? "#282D3B" : "#DFE0E2",
                },
              ]}
            >
              {!isBuy && (
                <View
                  style={[
                    styles.activeIndicatorBar,
                    { backgroundColor: "#FF4D4F" },
                  ]}
                />
              )}
              <Text
                style={[
                  styles.tabText,
                  {
                    color: !isBuy
                      ? "#FF4D4F"
                      : isDark
                        ? "#8E94A0"
                        : "#A0A3A7",
                    fontWeight: !isBuy ? "800" : "600",
                    fontSize: !isBuy ? 17 : 15,
                  },
                ]}
              >
                Sell
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cardInnerContent}>
            {/* Spend Box */}
            <View
              style={[
                styles.fieldBox,
                {
                  backgroundColor: isDark ? "#191D28" : "#FFFFFF",
                  borderColor: isDark ? "#282E3E" : "#DFE0E2",
                },
              ]}
            >
              <Text style={[styles.fieldLabel, { color: isDark ? "#9CA3AF" : "#6B7280" }]}>
                {isBuy ? "You spend" : "You sell"}
              </Text>
              <View style={styles.fieldRow}>
                <TextInput
                  style={[styles.fieldInput, { color: isDark ? "#FFFFFF" : "#111827" }]}
                  placeholder="0.00"
                  placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                  keyboardType="decimal-pad"
                  value={spendAmountValue}
                  onChangeText={(text) => {
                    setInputField("spend");
                    setAmount(sanitizeAmountInput(text));
                  }}
                />

                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => handleOpenAssetPicker("spend")}
                  style={styles.fieldPill}
                >
                  {isBuy ? (
                    <FiatIcon code={spendAsset?.code} />
                  ) : (
                    <FastImage
                      source={CRYPTO_ICON_MAP[spendAsset?.code] || tetherIcon}
                      style={styles.cryptoIcon}
                      resizeMode={FastImage.resizeMode.contain}
                    />
                  )}
                  <Text style={[styles.pillCodeText, { color: isDark ? "#FFFFFF" : "#111827" }]}>
                    {spendAsset?.code || "—"}
                  </Text>
                  <FastImage
                    source={downIcon}
                    style={styles.pillCaret}
                    tintColor={isDark ? "#9CA3AF" : "#6B7280"}
                    resizeMode={FastImage.resizeMode.contain}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Receive Box */}
            <View
              style={[
                styles.fieldBox,
                {
                  backgroundColor: isDark ? "#191D28" : "#FFFFFF",
                  borderColor: isDark ? "#282E3E" : "#DFE0E2",
                  marginTop: 12,
                },
              ]}
            >
              <Text style={[styles.fieldLabel, { color: isDark ? "#9CA3AF" : "#6B7280" }]}>
                You receive (est.)
              </Text>
              <View style={styles.fieldRow}>
                <TextInput
                  style={[styles.fieldInput, { color: isDark ? "#FFFFFF" : "#111827" }]}
                  placeholder="0.00"
                  placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                  keyboardType="decimal-pad"
                  value={receiveAmountValue}
                  onChangeText={(text) => {
                    setInputField("receive");
                    setAmount(sanitizeAmountInput(text));
                  }}
                />

                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => handleOpenAssetPicker("receive")}
                  style={styles.fieldPill}
                >
                  {!isBuy ? (
                    <FiatIcon code={receiveAsset?.code} />
                  ) : (
                    <FastImage
                      source={CRYPTO_ICON_MAP[receiveAsset?.code] || tetherIcon}
                      style={styles.cryptoIcon}
                      resizeMode={FastImage.resizeMode.contain}
                    />
                  )}
                  <Text style={[styles.pillCodeText, { color: isDark ? "#FFFFFF" : "#111827" }]}>
                    {receiveAsset?.code || "—"}
                  </Text>
                  <FastImage
                    source={downIcon}
                    style={styles.pillCaret}
                    tintColor={isDark ? "#9CA3AF" : "#6B7280"}
                    resizeMode={FastImage.resizeMode.contain}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Balance / limits / live status */}
            <View
              style={[
                styles.hintsGrid,
                {
                  backgroundColor: isDark ? "transparent" : "#F8F9FA",
                  borderColor: isDark ? "#2B3139" : "#DFE0E2",
                },
              ]}
            >
              <View style={styles.hintsRow}>
                <View style={[styles.hintLine, { flex: 1 }]}>
                  <Wallet size={13} color={insufficientBalance ? "#FF4D4F" : MUTED} strokeWidth={1.8} />
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.hintText,
                      { color: insufficientBalance ? "#E45561" : MUTED, flexShrink: 1 },
                      insufficientBalance && { fontWeight: "600" },
                    ]}
                  >
                    {loggedIn
                      ? loadingBalance
                        ? "Loading spot balance…"
                        : `Spot available: ${formatQuoteAmount(spotBalance, spendAsset?.qty_decimals)} ${spendAsset?.code || ""}${insufficientBalance ? " · Not enough" : ""}`
                      : "Log in to see spot balance"}
                  </Text>
                </View>
                <View style={styles.hintLine}>
                  <LiveDot />
                  <Text style={styles.liveText}>Live</Text>
                </View>
              </View>
              {isBuy && (
                <View style={styles.hintLine}>
                  <FileText size={13} color={MUTED} strokeWidth={1.8} />
                  <Text numberOfLines={1} style={[styles.hintText, { color: MUTED, flexShrink: 1 }]}>
                    Minimum transaction: {formatAedAmount(convertLimits.minAed > 0 ? convertLimits.minAed : DEFAULT_MIN_AED)} AED
                    {convertLimits.minAed > 0 && convertLimits.maxAed != null
                      ? ` · ${formatAedAmount(convertLimits.maxAed)} max`
                      : ""}
                  </Text>
                </View>
              )}
              <View style={[styles.hintLine, { alignSelf: "flex-end" }]}>
                <Text style={styles.quoteTimerText}>Quote valid for 30s</Text>
                <TouchableOpacity onPress={refreshRates} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <RefreshCw size={12} color="#F0B90B" strokeWidth={2} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Quote summary */}
            <View
              style={[
                styles.quotePanel,
                {
                  backgroundColor: isDark ? "transparent" : "#F9FAFB",
                  borderColor: isDark ? "#2B3139" : "#E5E7EB",
                },
              ]}
            >
              <Text style={[styles.quoteSummaryTitle, { color: isDark ? "#FFFFFF" : "#121317" }]}>
                Quote summary
              </Text>

              <View style={styles.quoteRow}>
                <Text style={styles.quoteLabel}>Market rate</Text>
                <Text style={[styles.quoteVal, { color: isDark ? "#EAECEF" : "#1E2329" }]}>
                  {preview
                    ? `1 ${crypto?.code || ""} ≈ ${preview.cmc_rate || preview.user_rate} ${fiat?.code || ""}`
                    : liveRateText}
                </Text>
              </View>

              <View style={styles.quoteRow}>
                <View style={styles.hintLine}>
                  <Text style={styles.quoteLabel}>Fee</Text>
                  <Info size={12} color="#5E6673" strokeWidth={1.8} />
                </View>
                <Text style={[styles.quoteVal, { color: isDark ? "#EAECEF" : "#1E2329" }]}>
                  {preview ? quoteFeeLabel(preview, formatAedAmount) : "0.00 AED"}
                </Text>
              </View>

              <DashedDivider color={isDark ? "#2B2F36" : "#DFE0E2"} />

              <View style={styles.quoteRow}>
                <Text style={styles.quoteLabel}>You receive</Text>
                <Text style={[styles.quoteVal, { color: LIVE_GREEN, fontWeight: "700" }]}>
                  {preview
                    ? `${formatQuoteAmount(preview.you_receive, receiveAsset?.qty_decimals)} ${receiveAsset?.code || ""}`.trim()
                    : `0.00 ${receiveAsset?.code || "USDT"}`}
                </Text>
              </View>

              <View style={styles.quoteRow}>
                <Text style={styles.quoteLabel}>You spend</Text>
                <Text style={[styles.quoteVal, { color: isDark ? "#EAECEF" : "#1E2329" }]}>
                  {preview
                    ? `${formatQuoteAmount(preview.you_spend, spendAsset?.qty_decimals)} ${spendAsset?.code || ""}`.trim()
                    : `0.00 ${spendAsset?.code || "AED"}`}
                </Text>
              </View>

              <View style={styles.quoteRow}>
                <Text style={styles.quoteLabel}>Exchange rate (after fee)</Text>
                <Text style={[styles.quoteVal, { color: isDark ? "#EAECEF" : "#1E2329", flexShrink: 1, textAlign: "right" }]}>
                  {(preview && quoteMidLine(preview, fiat?.code, crypto?.code)) || "—"}
                </Text>
              </View>
            </View>

            {/* CTA Button */}
            <View style={{ marginTop: 16 }}>
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={quoting || (loggedIn && (!isPositiveMoneyString(spendAmountValue) || insufficientBalance))}
                onPress={handleReviewOrder}
                style={[
                  styles.ctaPillBtn,
                  {
                    backgroundColor: !loggedIn
                      ? colors.buttonBg
                      : !isPositiveMoneyString(spendAmountValue) || insufficientBalance
                        ? isDark
                          ? "#262C3A"
                          : "#DFE2E8"
                        : isBuy
                          ? "#01bc8d"
                          : "#e45561",
                  },
                ]}
              >
                {quoting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text
                    style={[
                      styles.ctaPillText,
                      {
                        color: !loggedIn || (isPositiveMoneyString(spendAmountValue) && !insufficientBalance)
                          ? "#FFFFFF"
                          : isDark
                            ? "#6B7280"
                            : "#8A94A6",
                      },
                    ]}
                  >
                    {!loggedIn
                      ? "Log In to Continue"
                      : !isPositiveMoneyString(spendAmountValue)
                        ? "Enter amount"
                        : insufficientBalance
                          ? `Insufficient ${spendAsset?.code} Balance`
                          : "Confirm"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.footerGuarantee}>
              <ShieldCheck size={13} color={LIVE_GREEN} strokeWidth={2} />
              <Text style={styles.footerGuaranteeText}>
                Secure conversion  •  Final rate shown before confirmation
              </Text>
            </View>
          </View>
        </View>

        {/* How it works */}
        <View style={styles.hotSection}>
          <Text style={[styles.hotTitle, { color: isDark ? "#FFFFFF" : "#121317" }]}>
            <Text style={{ color: GOLD }}>{isBuy ? "Buy" : "Sell"}</Text>{" "}
            {isBuy
              ? `${crypto?.code || "USDT"} with ${fiat?.code || "AED"}`
              : `${crypto?.code || "USDT"} for ${fiat?.code || "AED"}`}
          </Text>
          <Text style={styles.hotSubtitle}>
            {isBuy
              ? `Convert ${fiat?.code || "AED"} to ${crypto?.code || "USDT"} instantly at the best market rate.`
              : `Convert ${crypto?.code || "USDT"} to ${fiat?.code || "AED"} instantly at the best market rate.`}
          </Text>

          <View style={[styles.badgeBar, { borderBottomColor: isDark ? "#232730" : "#DFE0E2" }]}>
            {[
              { key: "spot", label: "SPOT", icon: <Wallet size={15} color={MUTED} strokeWidth={1.8} /> },
              { key: "fiat", label: fiat?.code || "AED", icon: <FiatIcon code={fiat?.code} size={20} /> },
              {
                key: "crypto",
                label: crypto?.code || "USDT",
                icon: (
                  <FastImage
                    source={CRYPTO_ICON_MAP[crypto?.code] || tetherIcon}
                    style={{ width: 20, height: 20, borderRadius: 10 }}
                    resizeMode={FastImage.resizeMode.contain}
                  />
                ),
              },
            ].map((b) => (
              <View
                key={b.key}
                style={[
                  styles.badge,
                  {
                    borderColor: isDark ? "#2B3139" : "#DFE0E2",
                    backgroundColor: isDark ? "transparent" : "#F8F9FA",
                  },
                ]}
              >
                {b.icon}
                <Text style={[styles.badgeText, { color: isDark ? "#EBEBEB" : "#262933" }]}>{b.label}</Text>
              </View>
            ))}
          </View>

          {[
            {
              title: "Enter amount",
              desc: `Enter ${fiat?.code || "AED"} or ${crypto?.code || "USDT"}. The other field updates automatically using the live rate.`,
              featureTitle: "Live rates from multiple sources",
              featureDesc: "Updated in real time",
            },
            {
              title: "Review quote",
              desc: "Review the rate, fee, amount received, and quote expiry before confirming.",
              featureTitle: "Secure & transparent",
              featureDesc: "No hidden fees. What you see is what you get.",
            },
            {
              title: "Confirm conversion",
              desc: `Confirm to complete the conversion and credit ${receiveAsset?.code || "USDT"} to your Spot wallet.`,
              featureTitle: "Instant credit",
              featureDesc: `${receiveAsset?.code || "USDT"} will be credited to your Spot wallet instantly.`,
            },
          ].map((step, idx, arr) => {
            const isLast = idx === arr.length - 1;
            const stepLineColor = isDark ? "#363B47" : "#DFE0E2";
            return (
              <View key={step.title} style={styles.step}>
                <View style={styles.stepIconWrap}>
                  <View style={[styles.stepDiamond, { backgroundColor: stepLineColor }]}>
                    <Text style={[styles.stepDiamondText, { color: isDark ? "#FFFFFF" : "#121317" }]}>{idx + 1}</Text>
                  </View>
                  {!isLast && <DashedVLine color={stepLineColor} />}
                </View>
                <View style={[styles.stepContent, isLast && { paddingBottom: 0 }]}>
                  <Text style={[styles.stepTitle, { color: isDark ? "#FFFFFF" : "#121317" }]}>{step.title}</Text>
                  <Text style={styles.stepDesc}>{step.desc}</Text>
                  <View
                    style={[
                      styles.featureCard,
                      { backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#EFEFEF" },
                    ]}
                  >
                    <Text style={[styles.featureTitle, { color: isDark ? "rgba(255,255,255,0.9)" : "#121317" }]}>
                      {step.featureTitle}
                    </Text>
                    <Text style={styles.featureDesc}>{step.featureDesc}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Asset Picker Bottom Sheet */}
      <AnimatedBottomSheet
        ref={rbSheetAssetPicker}
        sheetHeight={Math.min(SCREEN_HEIGHT * 0.74, 560)}
        isDark={isDark}
      >
        <View style={styles.sheetInner}>
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: isDark ? "#E6EDF6" : "#1A202C" }]}>
              Select Currency
            </Text>
            <TouchableOpacity
              onPress={() => rbSheetAssetPicker.current?.close()}
              style={[styles.closeCircle, { backgroundColor: isDark ? "#1C2430" : "#F0F3F8" }]}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.75}
            >
              <FastImage
                source={closeIcon}
                style={styles.closeIcon}
                resizeMode={FastImage.resizeMode.contain}
                tintColor={isDark ? "#C5D1E0" : "#4A5568"}
              />
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.searchRow,
              {
                backgroundColor: isDark ? "#121824" : "#F4F6F9",
                borderColor: isDark ? "#2A3649" : "#E2E8F0",
              },
            ]}
          >
            <FastImage
              source={searchIcon}
              style={styles.searchGlyph}
              resizeMode={FastImage.resizeMode.contain}
              tintColor={isDark ? "#7E8B9E" : "#94A3B8"}
            />
            <TextInput
              placeholder="Search token"
              placeholderTextColor={isDark ? "#7E8B9E" : "#8A94A6"}
              style={[styles.searchInput, { color: isDark ? "#E6EDF6" : "#1A202C" }]}
              value={pickerSearch}
              onChangeText={setPickerSearch}
              autoCorrect={false}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
          </View>

          <FlatList
            data={pickerOptions}
            keyExtractor={(item) => item.code}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 24 }}
            renderItem={({ item }) => {
              const isFiat = item.kind === "FIAT";
              const isSelected =
                (pickerType === "spend" && spendAsset?.code === item.code) ||
                (pickerType === "receive" && receiveAsset?.code === item.code);

              return (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleSelectAsset(item)}
                  style={[
                    styles.assetListItem,
                    {
                      borderBottomColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
                    },
                    isSelected && {
                      backgroundColor: isDark ? "rgba(209, 170, 103, 0.1)" : "rgba(209, 170, 103, 0.08)",
                    },
                  ]}
                >
                  {isFiat ? (
                    <FiatIcon code={item.code} size={32} />
                  ) : (
                    <FastImage
                      source={CRYPTO_ICON_MAP[item.code] || tetherIcon}
                      style={{ width: 32, height: 32, borderRadius: 16 }}
                      resizeMode={FastImage.resizeMode.contain}
                    />
                  )}
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.assetCodeText, { color: isDark ? "#E6EDF6" : "#1A202C" }]}>
                      {item.code}
                    </Text>
                    <Text style={[styles.assetNameText, { color: isDark ? "#7E8B9E" : "#8A94A6" }]}>
                      {item.name}
                    </Text>
                  </View>
                  {isSelected && (
                    <Text style={{ color: GOLD, fontSize: 15, fontWeight: "700" }}>✓</Text>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </AnimatedBottomSheet>

      {/* Review Order Bottom Sheet Modal */}
      <AnimatedBottomSheet
        ref={rbSheetConfirm}
        sheetHeight={Math.min(SCREEN_HEIGHT * 0.84, 550)}
        isDark={isDark}
      >
        <View style={styles.confirmSheetInner}>
          <View style={styles.confirmSheetHead}>
            <Text style={[styles.confirmSheetTitle, { color: isDark ? "#FFFFFF" : "#111827" }]}>
              Confirm convert
            </Text>
            <TouchableOpacity
              onPress={() => rbSheetConfirm.current?.close()}
              disabled={executing}
              style={styles.confirmCloseBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.7}
            >
              <FastImage
                source={closeIcon}
                style={styles.closeIconSmall}
                resizeMode={FastImage.resizeMode.contain}
                tintColor={isDark ? "#8E9BAE" : "#8A94A6"}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.confirmBodyScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.confirmQuoteList}>
              <View style={styles.confirmItem}>
                <Text style={[styles.confirmItemLabel, { color: isDark ? "#8E9BAE" : "#8A94A6" }]}>Mid</Text>
                <Text style={[styles.confirmItemValue, { color: isDark ? "#FFFFFF" : "#111827" }]}>
                  {quoteMidLine(confirmQuote, fiat?.code, crypto?.code) || `${confirmQuote?.you_spend || "1.00"} ${isBuy ? fiat?.code : crypto?.code} = ${confirmQuote?.you_receive || "3.67"} ${isBuy ? crypto?.code : fiat?.code}`}
                </Text>
              </View>

              <View style={styles.confirmItem}>
                <Text style={[styles.confirmItemLabel, { color: isDark ? "#8E9BAE" : "#8A94A6" }]}>Fee</Text>
                <Text style={[styles.confirmItemValue, { color: isDark ? "#FFFFFF" : "#111827" }]}>
                  {quoteFeeLabel(confirmQuote, formatAedAmount)}
                </Text>
              </View>

              <View style={styles.confirmItem}>
                <Text style={[styles.confirmItemLabel, { color: isDark ? "#8E9BAE" : "#8A94A6" }]}>You receive</Text>
                <Text style={[styles.confirmItemValue, { color: isDark ? "#FFFFFF" : "#111827" }]}>
                  {formatQuoteAmount(confirmQuote?.you_receive, isBuy ? crypto?.qty_decimals : fiat?.qty_decimals)}{" "}
                  {isBuy ? crypto?.code : fiat?.code}
                </Text>
              </View>

              <View style={styles.confirmItem}>
                <Text style={[styles.confirmItemLabel, { color: isDark ? "#8E9BAE" : "#8A94A6" }]}>You spend</Text>
                <Text style={[styles.confirmItemValue, { color: isDark ? "#FFFFFF" : "#111827" }]}>
                  {formatQuoteAmount(confirmQuote?.you_spend, isBuy ? fiat?.qty_decimals : crypto?.qty_decimals)}{" "}
                  {isBuy ? fiat?.code : crypto?.code}
                </Text>
              </View>

              <View style={styles.confirmItem}>
                <Text style={[styles.confirmItemLabel, { color: isDark ? "#8E9BAE" : "#8A94A6" }]}>Rate</Text>
                <Text style={[styles.confirmItemValue, { color: isDark ? "#FFFFFF" : "#111827" }]}>
                  1 {crypto?.code} ≈ {confirmQuote?.cmc_rate || confirmQuote?.user_rate || "3.673"} {fiat?.code}
                </Text>
              </View>
            </View>

            <Text style={[styles.confirmQuoteHint, { color: isDark ? "#8E9BAE" : "#8A94A6" }]}>
              Confirm spends from your spot wallet immediately. Only this confirm creates a history row.
            </Text>

            <View style={styles.confirmBtnWrap}>
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={executing}
                onPress={handleExecuteConvert}
                style={[
                  styles.confirmFullBtn,
                  { backgroundColor: "#2B313D" },
                ]}
              >
                {executing ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.confirmFullBtnText}>
                    Confirm
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </AnimatedBottomSheet>
    </RootContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  embeddedContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 120,
  },
  tradeCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  tabsRow: {
    flexDirection: "row",
    height: 52,
    borderBottomWidth: 1,
    position: "relative",
  },
  tabBtn: {
    flex: 1,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  tabBtnLeft: {
    borderTopLeftRadius: 16,
  },
  tabBtnRight: {
    borderTopRightRadius: 16,
  },
  activeIndicatorBar: {
    position: "absolute",
    top: 0,
    left: 28,
    right: 28,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  tabText: {
    fontSize: 16,
  },
  cardInnerContent: {
    padding: 16,
  },
  fieldBox: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 2,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fieldInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    paddingVertical: 4,
    paddingHorizontal: 0,
  },
  fieldPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingLeft: 8,
  },
  fiatCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#C9A227",
    alignItems: "center",
    justifyContent: "center",
  },
  fiatCircleText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  cryptoIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  pillCodeText: {
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 2,
  },
  pillCaret: {
    width: 10,
    height: 10,
    marginLeft: 2,
  },
  hintsGrid: {
    gap: 4,
    marginTop: 12,
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 12,
  },
  hintsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  hintLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  hintText: {
    fontSize: 13,
    lineHeight: 18,
  },
  quoteTimerText: {
    fontSize: 11.5,
    color: MUTED,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: LIVE_GREEN,
    shadowColor: LIVE_GREEN,
    shadowOpacity: 0.9,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  liveText: {
    color: LIVE_GREEN,
    fontSize: 12,
    fontWeight: "700",
  },
  quotePanel: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 10,
  },
  quoteSummaryTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  quoteRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  quoteLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: MUTED,
  },
  quoteVal: {
    fontSize: 13,
    fontWeight: "500",
  },
  footerGuarantee: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 10,
  },
  footerGuaranteeText: {
    fontSize: 11.5,
    color: MUTED,
  },
  hotSection: {
    marginTop: 28,
  },
  hotTitle: {
    fontSize: 26,
    fontWeight: "600",
    marginBottom: 8,
  },
  hotSubtitle: {
    fontSize: 15,
    lineHeight: 21,
    color: MUTED,
    marginBottom: 18,
  },
  badgeBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
    paddingBottom: 24,
    marginBottom: 24,
    borderBottomWidth: 1,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  step: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 14,
  },
  stepIconWrap: {
    width: 44,
    alignItems: "center",
    paddingTop: 6,
  },
  stepDiamond: {
    width: 30,
    height: 30,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "45deg" }],
    marginBottom: 6,
  },
  stepDiamondText: {
    fontSize: 14,
    fontWeight: "600",
    transform: [{ rotate: "-45deg" }],
  },
  stepContent: {
    flex: 1,
    paddingTop: 2,
    paddingBottom: 28,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 6,
  },
  stepDesc: {
    fontSize: 14,
    lineHeight: 20,
    color: MUTED,
  },
  featureCard: {
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    gap: 2,
  },
  featureTitle: {
    fontSize: 15,
  },
  featureDesc: {
    fontSize: 13,
    lineHeight: 18,
    color: MUTED,
  },
  ctaPillBtn: {
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaBtn: {
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaPillText: {
    fontSize: 15,
    fontWeight: "700",
  },
  sheetInner: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  closeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  closeIcon: {
    width: 14,
    height: 14,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 4,
    marginBottom: 12,
  },
  searchGlyph: {
    width: 14,
    height: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 6,
    paddingHorizontal: 0,
    minHeight: 36,
  },
  assetListItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  assetCodeText: {
    fontSize: 15,
    fontWeight: "700",
  },
  assetNameText: {
    fontSize: 12,
    marginTop: 2,
  },
  confirmSheetInner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  confirmSheetHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },
  confirmSheetTitle: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  confirmCloseBtn: {
    padding: 4,
  },
  closeIconSmall: {
    width: 16,
    height: 16,
  },
  confirmBodyScroll: {
    flex: 1,
  },
  confirmQuoteList: {
    gap: 18,
  },
  confirmItem: {
    gap: 5,
  },
  confirmItemLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  confirmItemValue: {
    fontSize: 17,
    fontWeight: "700",
  },
  confirmQuoteHint: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 20,
    marginBottom: 8,
  },
  confirmBtnWrap: {
    marginTop: 14,
    paddingBottom: 20,
  },
  confirmFullBtn: {
    width: "100%",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmFullBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  historyCard: {
    marginBottom: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
});

export default BuyCryptoScreen;
