import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import FastImage from "react-native-fast-image";
import LinearGradient from "react-native-linear-gradient";
import Svg, { Defs, LinearGradient as SvgGradient, Path, Stop } from "react-native-svg";
import Animated, {
  Easing,
  Extrapolation,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Toast from "react-native-simple-toast";
import { AppSafeAreaView, AppText, BOLD, MEDIUM, SEMI_BOLD } from "../../shared";
import CoinIcon from "../../common/CoinIcon";
import NavigationService from "../../navigation/NavigationService";
import { useTheme } from "../../hooks/useTheme";
import { useAppSelector } from "../../store/hooks";
import { fontFamilyMedium } from "../../theme/typography";
import {
  back_ic,
  tetherIcon,
  otcHeroVector,
  otcHeroVectorLight,
  otcHeroVector2,
  otcHeroVector2Light,
  otcHeroVector3,
  otcHeroVector3Light,
  otcHeroBanner,
  otcHeroBottomBg,
  otcHeroBg,
  otcHeroBgLight,
  otcDeskBg,
  otcDeskBgLight,
  otcBuiltTradesBg,
  otcBuiltTradesBgLight,
  otcInfoIcon,
  otcInfoIcon2,
  otcInfoIcon3,
  otcInfoIcon4,
} from "../../helper/ImageAssets";
import OtcListIcon1 from "../../../assets/images/otc_desk_list_icon1.svg";
import OtcListIcon2 from "../../../assets/images/otc_desk_list_icon2.svg";
import OtcListIcon3 from "../../../assets/images/otc_desk_list_icon3.svg";
import OtcListIcon4 from "../../../assets/images/otc_desk_list_icon4.svg";
import OtcListIcon5 from "../../../assets/images/otc_desk_list_icon5.svg";
import OtcListIcon6 from "../../../assets/images/otc_desk_list_icon6.svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const GOLD = "#D1AA67";
const GOLD_TEXT = "#D5A760";

const ORBIT_SIZE = Math.min(SCREEN_WIDTH - 40, 340);
const ORBIT_RADIUS = ORBIT_SIZE / 2;
const ORBIT_TOP = 24;
const BADGE_SIZE = 64;
const ORBIT_SPIN_MS = 25000;
const BADGE_SPIN_MS = 40000;
const BADGE_FADE_RANGE = [0.15, 0.5];

const HERO_BANNER_WIDTH = SCREEN_WIDTH * 0.9;
const HERO_BANNER_HEIGHT = HERO_BANNER_WIDTH * (1518 / 1893);
const HERO_BOTTOM_HEIGHT = SCREEN_WIDTH * (1322 / 3840);
const BUILT_IMG_HEIGHT = (SCREEN_WIDTH - 32) * (523 / 713);

const TAB_HEIGHT = 46;
const TAB_SLANT = 14;

const BADGE_IMAGES = [
  { dark: otcHeroVector, light: otcHeroVectorLight },
  { dark: otcHeroVector2, light: otcHeroVector2Light },
  { dark: otcHeroVector3, light: otcHeroVector3Light },
];

const HERO_BADGES = [-150, -90, -30, 30, 90, 150].map((angle, index) => ({
  key: String(angle),
  angle,
  ...BADGE_IMAGES[index % BADGE_IMAGES.length],
}));

const HOW_IT_WORKS = [
  { title: "Submit Quote", desc: "Enter the amount you want to trade and submit your quote request." },
  { title: "Confirm Quote", desc: "Our expert brokers confirm your quote at the best market rate." },
  { title: "Transfer Funds", desc: "Send your funds to our secure escrow wallet." },
  { title: "Confirm Order", desc: "Receive your assets directly once funds are verified." },
];

const WHY_TRADE_LIST = [
  {
    Icon: OtcListIcon1,
    title: "Expert Brokers",
    desc: "Professional OTC brokers handle every trade with precision and care.",
  },
  {
    Icon: OtcListIcon2,
    title: "Zero Slippage",
    desc: "Best price guarantees on all OTC orders with no slippage impact.",
  },
  {
    Icon: OtcListIcon3,
    title: "Qualified Desk",
    desc: "Licensed and certified OTC trading desk with full regulatory compliance.",
  },
  {
    Icon: OtcListIcon4,
    title: "No Fees",
    desc: "Zero trading fees for qualified OTC orders above minimum threshold.",
  },
  {
    Icon: OtcListIcon5,
    title: "Global Reach",
    desc: "Trade across all global markets 24/7 with our worldwide broker network.",
  },
  {
    Icon: OtcListIcon6,
    title: "Confidential",
    desc: "Full privacy and NDA-protected trading for institutional clients.",
  },
];

const BUILT_FEATURES = [
  {
    icon: otcInfoIcon,
    title: "Competitive institutional pricing",
    desc: "Access competitive institutional rates tailored to your trade size, volume, and execution needs.",
  },
  {
    icon: otcInfoIcon3,
    title: "Deep liquidity for large orders",
    desc: "Execute substantial crypto transactions with access to deep, curated liquidity.",
  },
  {
    icon: otcInfoIcon2,
    title: "Reduced market impact",
    desc: "Trade large positions without relying solely on public order books, helping maintain market execution.",
  },
  {
    icon: otcInfoIcon4,
    title: "Dedicated trade support",
    desc: "Get direct support from our OTC team throughout execution and settlement.",
  },
];

const DARK_PALETTE = {
  pageBg: "#12151B",
  sectionBg: "#171B20",
  heroFade: "#171a1f",
  text: "#FFFFFF",
  heroDesc: "#B9BCC0",
  cardBg: "rgba(255,255,255,0.1)",
  cardBorder: "rgba(255,255,255,0.15)",
  inputBorder: "#686868",
  label: "#848992",
  muted: "#7A8293",
  stepText: "#9CA3AF",
  whyDesc: "#AEAEAE",
  builtDesc: "#8493A8",
  rateVal: "#D8DCE6",
  tabBg: "#4C4E51",
  tabInactive: "#9CA3AF",
  placeholder: "#FFFFFF",
  secondaryBtnBg: "rgba(82,82,82,0.85)",
  secondaryBtnBorder: "rgba(255,255,255,0.12)",
  secondaryBtnText: "#D0D4DF",
  sheetBg: "#1E232E",
  sheetBorder: "rgba(255,255,255,0.1)",
  emptyBorder: "rgba(255,255,255,0.08)",
};

const LIGHT_PALETTE = {
  pageBg: "#f8fafc",
  sectionBg: "#ffffff",
  heroFade: "#f7f7f7",
  text: "#0f172a",
  heroDesc: "#64748b",
  cardBg: "rgba(0,0,0,0.05)",
  cardBorder: "#eff4fb",
  inputBorder: "#e7e7e7",
  label: "#64748b",
  muted: "#7A8293",
  stepText: "#64748b",
  whyDesc: "#64748b",
  builtDesc: "#64748b",
  rateVal: "#0f172a",
  tabBg: "#e2e8f0",
  tabInactive: "#8A919E",
  placeholder: "#94a3b8",
  secondaryBtnBg: "#ffffff",
  secondaryBtnBorder: "#cbd5e1",
  secondaryBtnText: "#334155",
  sheetBg: "#ffffff",
  sheetBorder: "#e2e8f0",
  emptyBorder: "#e2e8f0",
};

const showComingSoon = () => Toast.showWithGravity("Coming soon", Toast.SHORT, Toast.BOTTOM);

/** Digits and one decimal point only. Letters such as "0.0d" are dropped. */
function sanitizeAmount(raw, places = 8) {
  let text = String(raw ?? "").replace(/[^\d.]/g, "");
  const firstDot = text.indexOf(".");
  if (firstDot >= 0) {
    text = text.slice(0, firstDot + 1) + text.slice(firstDot + 1).replace(/\./g, "");
  }
  const parts = text.split(".");
  const whole = (parts[0] || "").replace(/^0+(?=\d)/, "");
  if (parts.length === 1) return whole;
  return `${whole || "0"}.${parts[1].slice(0, places)}`;
}

function trimCalc(raw, places) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return "";
  return n.toFixed(places).replace(/\.?0+$/, "");
}

function formatRate(n) {
  const [whole, frac] = Number(n).toFixed(2).split(".");
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${frac}`;
}

function pairKeyOf(pair) {
  return `${pair?.base_currency || ""}/${pair?.quote_currency || ""}`;
}

function pairRate(pair) {
  const n = Number(pair?.buy_price) || Number(pair?.sell_price);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

const LINE_ICON_PATHS = {
  close: "M6 6 L18 18 M18 6 L6 18",
  magnify: "M10.5 17 A6.5 6.5 0 1 1 10.5 4 A6.5 6.5 0 1 1 10.5 17 Z M15.5 15.5 L20 20",
  check: "M5 12.5 L10 17.5 L19 7",
  "chevron-down": "M6 9 L12 15 L18 9",
  "arrow-right": "M4 12 H19 M13 6 L19 12 L13 18",
};

const Icon = ({ name, size, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d={LINE_ICON_PATHS[name]}
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/** 1 at the top of the orbit, 0 on the horizontal centre line, -1 at the bottom. */
function orbitHeight(baseAngle, rotation) {
  "worklet";
  return -Math.sin(((baseAngle + rotation) * Math.PI) / 180);
}

const OrbitBadge = ({ badge, isDark, orbitRotation, counterRotation, onPressIn, onPressOut }) => {
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);
  const pressed = useRef(false);

  const rad = (badge.angle * Math.PI) / 180;
  const left = ORBIT_RADIUS + ORBIT_RADIUS * Math.cos(rad) - BADGE_SIZE / 2;
  const top = ORBIT_RADIUS + ORBIT_RADIUS * Math.sin(rad) - BADGE_SIZE / 2;

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      orbitHeight(badge.angle, orbitRotation.value),
      BADGE_FADE_RANGE,
      [0, 1],
      Extrapolation.CLAMP
    ),
    transform: [{ rotate: `${counterRotation.value}deg` }, { scale: scale.value }],
    shadowOpacity: glow.value * 0.95,
  }));

  return (
    <Pressable
      style={[styles.badgeHit, { left, top }]}
      onPressIn={() => {
        if (orbitHeight(badge.angle, orbitRotation.value) < BADGE_FADE_RANGE[0]) return;
        pressed.current = true;
        scale.value = withSpring(1.12, { damping: 15 });
        glow.value = withTiming(1, { duration: 300 });
        onPressIn();
      }}
      onPressOut={() => {
        if (!pressed.current) return;
        pressed.current = false;
        scale.value = withSpring(1, { damping: 15 });
        glow.value = withTiming(0, { duration: 300 });
        onPressOut();
      }}
    >
      <Animated.View style={[styles.badge, animatedStyle]}>
        <FastImage
          source={isDark ? badge.dark : badge.light}
          style={styles.badgeImage}
          resizeMode="contain"
        />
      </Animated.View>
    </Pressable>
  );
};

const HeroOrbit = ({ isDark }) => {
  const orbitRotation = useSharedValue(0);
  const counterRotation = useSharedValue(0);

  const startSpin = useCallback(() => {
    orbitRotation.value = withRepeat(
      withTiming(orbitRotation.value + 360, { duration: ORBIT_SPIN_MS, easing: Easing.linear }),
      -1,
      false
    );
    counterRotation.value = withRepeat(
      withTiming(counterRotation.value - 360, { duration: BADGE_SPIN_MS, easing: Easing.linear }),
      -1,
      false
    );
  }, [orbitRotation, counterRotation]);

  const pauseSpin = useCallback(() => {
    cancelAnimation(orbitRotation);
    cancelAnimation(counterRotation);
  }, [orbitRotation, counterRotation]);

  useEffect(() => {
    startSpin();
    return pauseSpin;
  }, [startSpin, pauseSpin]);

  const orbitStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${orbitRotation.value}deg` }],
  }));

  return (
    <Animated.View style={[styles.orbit, orbitStyle]} pointerEvents="box-none">
      {HERO_BADGES.map((badge) => (
        <OrbitBadge
          key={badge.key}
          badge={badge}
          isDark={isDark}
          orbitRotation={orbitRotation}
          counterRotation={counterRotation}
          onPressIn={pauseSpin}
          onPressOut={startSpin}
        />
      ))}
    </Animated.View>
  );
};

const QuoteTabs = ({ isBuy, onChange, palette }) => {
  const [width, setWidth] = useState(0);
  const activeW = width * 0.53;
  const r = TAB_HEIGHT / 2;
  const buyW = isBuy ? activeW : width - activeW;

  const path = isBuy
    ? `M ${r} 0 L ${activeW - TAB_SLANT} 0 L ${activeW} ${TAB_HEIGHT} L ${r} ${TAB_HEIGHT} A ${r} ${r} 0 0 1 ${r} 0 Z`
    : `M ${buyW + TAB_SLANT} 0 L ${width - r} 0 A ${r} ${r} 0 0 1 ${width - r} ${TAB_HEIGHT} L ${buyW} ${TAB_HEIGHT} Z`;

  return (
    <View
      style={[styles.tabs, { backgroundColor: palette.tabBg }]}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      {width > 0 && (
        <Svg width={width} height={TAB_HEIGHT} style={StyleSheet.absoluteFill}>
          <Defs>
            <SvgGradient id="tabFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={isBuy ? "#3EE49A" : "#FF6666"} />
              <Stop offset="1" stopColor={isBuy ? "#20BF7A" : "#EE3F3F"} />
            </SvgGradient>
            <SvgGradient id="tabShine" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={isBuy ? 0.3 : 0.2} />
              <Stop offset="0.25" stopColor="#FFFFFF" stopOpacity={0} />
            </SvgGradient>
          </Defs>
          <Path d={path} fill="url(#tabFill)" />
          <Path d={path} fill="url(#tabShine)" />
        </Svg>
      )}
      <Pressable style={[styles.tabLabel, { width: buyW }]} onPress={() => onChange("buy")}>
        <AppText
          weight={isBuy ? BOLD : MEDIUM}
          style={[styles.tabText, { color: isBuy ? "#FFFFFF" : palette.tabInactive }]}
        >
          Buy
        </AppText>
      </Pressable>
      <Pressable style={[styles.tabLabel, { width: width - buyW }]} onPress={() => onChange("sell")}>
        <AppText
          weight={BOLD}
          style={[styles.tabText, { color: !isBuy ? "#FFFFFF" : palette.tabInactive }]}
        >
          Sell
        </AppText>
      </Pressable>
    </View>
  );
};

const PairPickerModal = ({ visible, pairs, selectedKey, onSelect, onClose, palette, themed }) => {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toUpperCase();
    if (!q) return pairs;
    return pairs.filter((p) => pairKeyOf(p).includes(q));
  }, [pairs, search]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetOverlay} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: palette.sheetBg, borderColor: palette.sheetBorder }]}>
        <View style={styles.sheetHeader}>
          <AppText weight={SEMI_BOLD} style={{ color: palette.text, fontSize: 18 }}>
            Select Pair
          </AppText>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Icon name="close" size={22} color={palette.text} />
          </TouchableOpacity>
        </View>
        <View style={themed.searchBox}>
          <Icon name="magnify" size={18} color={palette.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search pair"
            placeholderTextColor={palette.muted}
            autoCapitalize="characters"
            style={themed.searchInput}
          />
        </View>
        <FlatList
          data={filtered}
          keyExtractor={(item) => pairKeyOf(item)}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <AppText style={[styles.sheetEmpty, { color: palette.muted }]}>No pairs found.</AppText>
          }
          renderItem={({ item }) => {
            const key = pairKeyOf(item);
            const selected = key === selectedKey;
            return (
              <TouchableOpacity
                style={[styles.sheetItem, selected && styles.sheetItemSelected]}
                onPress={() => {
                  onSelect(key);
                  onClose();
                }}
              >
                <View style={styles.row}>
                  <CoinIcon coin={item} style={styles.coinIcon} />
                  <AppText weight={BOLD} style={{ color: palette.text, fontSize: 14 }}>
                    {key}
                  </AppText>
                </View>
                {selected && <Icon name="check" size={18} color={GOLD_TEXT} />}
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </Modal>
  );
};

const RequestQuoteCard = ({ palette, themed }) => {
  const coinPairs = useAppSelector((state) => state.home.coinPairs);
  const pairs = useMemo(
    () => (Array.isArray(coinPairs) ? coinPairs.filter((p) => p?.base_currency && p?.quote_currency) : []),
    [coinPairs]
  );

  const [pairKey, setPairKey] = useState("");
  const [quoteType, setQuoteType] = useState("buy");
  const [amount, setAmount] = useState("");
  const [getDraft, setGetDraft] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (!pairs.length) return;
    setPairKey((prev) => {
      if (prev && pairs.some((p) => pairKeyOf(p) === prev)) return prev;
      const btc = pairs.find((p) => pairKeyOf(p) === "BTC/USDT");
      return pairKeyOf(btc || pairs[0]);
    });
  }, [pairs]);

  const selectedPair = useMemo(() => pairs.find((p) => pairKeyOf(p) === pairKey), [pairs, pairKey]);
  const [pairBase = "BTC", pairQuote = "USDT"] = (pairKey || "BTC/USDT").split("/");
  const isBuy = quoteType === "buy";
  const payCoin = isBuy ? pairQuote : pairBase;
  const getCoin = isBuy ? pairBase : pairQuote;
  const rate = pairRate(selectedPair);
  const places = 8;

  const payValue = sanitizeAmount(amount, places);
  let getValue = "";
  const amtNum = Number(payValue);
  if (rate > 0 && Number.isFinite(amtNum) && amtNum > 0) {
    getValue = isBuy ? trimCalc(amtNum / rate, places) : trimCalc(amtNum * rate, places);
  }

  const coinFor = useCallback(
    (symbol) => pairs.find((p) => p.base_currency === symbol) || null,
    [pairs]
  );

  const handlePayChange = (text) => {
    setGetDraft(null);
    setAmount(sanitizeAmount(text, places));
  };

  const handleGetChange = (text) => {
    const clean = sanitizeAmount(text, places);
    setGetDraft(clean);
    const n = Number(clean);
    if (!/^\d+(\.\d+)?$/.test(clean) || !Number.isFinite(n) || n <= 0 || !(rate > 0)) {
      if (!clean) setAmount("");
      return;
    }
    const nextPay = isBuy ? trimCalc(n * rate, places) : trimCalc(n / rate, places);
    if (nextPay) setAmount(nextPay);
  };

  const onPairChange = (key) => {
    setPairKey(key);
    setAmount("");
    setGetDraft(null);
  };

  const onSubmit = () => {
    if (!selectedPair) {
      Toast.showWithGravity("Select a pair before requesting a quote.", Toast.SHORT, Toast.BOTTOM);
      return;
    }
    if (!(rate > 0)) {
      Toast.showWithGravity("Live price is not available yet.", Toast.SHORT, Toast.BOTTOM);
      return;
    }
    if (!(Number(payValue) > 0)) {
      Toast.showWithGravity("Please enter a valid amount.", Toast.SHORT, Toast.BOTTOM);
      return;
    }
    showComingSoon();
  };

  const renderCoinLabel = (symbol) => {
    const coin = coinFor(symbol);
    return (
      <View style={styles.row}>
        <CoinIcon
          coin={coin}
          style={styles.coinIconLg}
          fallback={symbol === "USDT" ? tetherIcon : undefined}
        />
        <AppText weight={SEMI_BOLD} style={[styles.coinSymbol, { color: palette.text }]}>
          {symbol}
        </AppText>
      </View>
    );
  };

  return (
    <View style={themed.card}>
      <AppText weight={SEMI_BOLD} style={themed.cardTitle}>
        Request a Quote
      </AppText>

      <View style={styles.fieldGroup}>
        <AppText weight={MEDIUM} style={themed.fieldLabel}>
          Pair
        </AppText>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[themed.inputCard, styles.spaceBetween]}
          disabled={!pairs.length}
          onPress={() => setPickerOpen(true)}
        >
          <View style={styles.row}>
            <CoinIcon coin={selectedPair} style={styles.coinIcon} />
            <AppText weight={SEMI_BOLD} style={[styles.coinSymbol, { color: palette.text }]}>
              {pairKey || "Loading pairs…"}
            </AppText>
          </View>
          <Icon name="chevron-down" size={20} color="#c1c1c1" />
        </TouchableOpacity>
      </View>

      <QuoteTabs isBuy={isBuy} onChange={setQuoteType} palette={palette} />

      <View style={styles.fieldGroup}>
        <AppText weight={MEDIUM} style={themed.fieldLabel}>
          You Pay
        </AppText>
        <View style={[themed.inputCard, styles.spaceBetween]}>
          {renderCoinLabel(payCoin)}
          <TextInput
            value={payValue}
            onChangeText={handlePayChange}
            placeholder="0.00"
            placeholderTextColor={palette.placeholder}
            keyboardType="decimal-pad"
            style={themed.amountInput}
          />
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <AppText weight={MEDIUM} style={themed.fieldLabel}>
          You Get
        </AppText>
        <View style={[themed.inputCard, styles.spaceBetween]}>
          {renderCoinLabel(getCoin)}
          <TextInput
            value={getDraft != null ? getDraft : getValue}
            onChangeText={handleGetChange}
            onBlur={() => setGetDraft(null)}
            placeholder="0.00000000"
            placeholderTextColor={palette.placeholder}
            keyboardType="decimal-pad"
            style={themed.amountInput}
          />
        </View>
      </View>

      <View style={[styles.spaceBetween, styles.rateRow]}>
        <AppText weight={MEDIUM} style={[styles.rateText, { color: palette.muted }]}>
          Rate
        </AppText>
        <AppText weight={MEDIUM} style={[styles.rateText, styles.rateValue, { color: palette.rateVal }]}>
          {rate > 0 ? `1 ${pairBase} ≈ $${formatRate(rate)} ${pairQuote}` : "Live price is not available yet."}
        </AppText>
      </View>

      <TouchableOpacity activeOpacity={0.85} style={styles.requestBtn} onPress={onSubmit}>
        <AppText weight={SEMI_BOLD} style={styles.requestBtnText}>
          Request Quote
        </AppText>
      </TouchableOpacity>

      <PairPickerModal
        visible={pickerOpen}
        pairs={pairs}
        selectedKey={pairKey}
        onSelect={onPairChange}
        onClose={() => setPickerOpen(false)}
        palette={palette}
        themed={themed}
      />
    </View>
  );
};

const OtcDashboard = () => {
  const { isDark } = useTheme();
  const palette = isDark ? DARK_PALETTE : LIGHT_PALETTE;
  const themed = useMemo(() => getThemedStyles(palette), [palette]);
  const scrollRef = useRef(null);
  const quoteSectionY = useRef(0);

  const scrollToQuote = () => {
    scrollRef.current?.scrollTo({ y: Math.max(0, quoteSectionY.current - 8), animated: true });
  };

  return (
    <AppSafeAreaView style={{ flex: 1, backgroundColor: palette.pageBg }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => NavigationService.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <FastImage source={back_ic} style={styles.backIcon} tintColor={palette.text} resizeMode="contain" />
        </TouchableOpacity>
        <AppText weight={SEMI_BOLD} style={{ color: palette.text, fontSize: 20 }}>
          OTC Desk
        </AppText>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {/* Hero */}
          <ImageBackground
            source={isDark ? otcHeroBg : otcHeroBgLight}
            style={[styles.hero, { backgroundColor: palette.pageBg }]}
            resizeMode="cover"
          >
            <FastImage source={otcHeroBanner} style={styles.heroBanner} resizeMode="contain" />
            <HeroOrbit isDark={isDark} />
            <FastImage source={otcHeroBottomBg} style={styles.heroBottom} resizeMode="cover" />
            <LinearGradient
              colors={[`${palette.heroFade}00`, palette.sectionBg]}
              style={styles.heroFade}
              pointerEvents="none"
            />

            <View style={styles.heroContent} pointerEvents="box-none">
              <AppText weight={BOLD} style={themed.heroTitle}>
                <AppText weight={BOLD} style={[themed.heroTitle, { color: GOLD_TEXT }]}>
                  OTC Desk
                </AppText>
                {" Built\nfor large crypto trades."}
              </AppText>
              <AppText style={themed.heroDesc}>
                Execute high-value crypto trades through a dedicated OTC desk with competitive pricing, deep liquidity, and personalized settlement support.
              </AppText>
              <View style={styles.heroBtns}>
                <TouchableOpacity activeOpacity={0.85} style={styles.primaryBtn} onPress={scrollToQuote}>
                  <AppText style={styles.primaryBtnText}>Trade Now</AppText>
                  <Icon name="arrow-right" size={16} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.85} style={themed.secondaryBtn} onPress={showComingSoon}>
                  <AppText style={[styles.primaryBtnText, { color: palette.secondaryBtnText }]}>Contact Us</AppText>
                </TouchableOpacity>
              </View>
            </View>
          </ImageBackground>

          {/* Complete Trading Suite */}
          <View
            style={[styles.section, { backgroundColor: palette.sectionBg }]}
            onLayout={(e) => {
              quoteSectionY.current = e.nativeEvent.layout.y;
            }}
          >
            <AppText weight={MEDIUM} style={themed.suiteTitle}>
              Complete Trading Suite
            </AppText>

            <RequestQuoteCard palette={palette} themed={themed} />

            <View style={[themed.card, styles.worksCard]}>
              <AppText weight={SEMI_BOLD} style={themed.cardTitle}>
                How It OTC Works?
              </AppText>
              <View style={styles.stepsList}>
                {HOW_IT_WORKS.map((step, index) => (
                  <View key={step.title} style={styles.stepItem}>
                    <View style={styles.stepNum}>
                      <AppText weight={BOLD} style={styles.stepNumText}>
                        {index + 1}
                      </AppText>
                    </View>
                    <View style={styles.flex1}>
                      <AppText weight={BOLD} style={[styles.stepTitle, { color: palette.text }]}>
                        {step.title}
                      </AppText>
                      <AppText style={[styles.stepDesc, { color: palette.stepText }]}>{step.desc}</AppText>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Why Trade with AGCE OTC Desk? */}
          <ImageBackground
            source={isDark ? otcDeskBg : otcDeskBgLight}
            style={styles.whySection}
            resizeMode="cover"
          >
            <AppText weight={SEMI_BOLD} style={themed.sectionHeading}>
              Why Trade with AGCE OTC Desk?
            </AppText>
            <View style={styles.whyGrid}>
              {WHY_TRADE_LIST.map(({ Icon: ListIcon, title, desc }) => (
                <View key={title} style={themed.whyCard}>
                  <View style={styles.whyIconBox}>
                    <ListIcon width={20} height={20} />
                  </View>
                  <View style={styles.flex1}>
                    <AppText weight={BOLD} style={[styles.whyTitle, { color: palette.text }]}>
                      {title}
                    </AppText>
                    <AppText style={[styles.whyDesc, { color: palette.whyDesc }]}>{desc}</AppText>
                  </View>
                </View>
              ))}
            </View>
          </ImageBackground>

          {/* Built for trades */}
          <View style={[styles.section, { backgroundColor: palette.sectionBg }]}>
            <AppText weight={BOLD} style={themed.builtHeading}>
              {"Built for trades that need "}
              <AppText weight={BOLD} style={[themed.builtHeading, { color: GOLD_TEXT }]}>
                more than an exchange screen.
              </AppText>
            </AppText>
            <AppText style={[styles.builtDesc, { color: palette.builtDesc }]}>
              Large orders can create unnecessary market impact when executed through public order books. Our OTC desk provides direct execution and tailored liquidity for high-value transactions.
            </AppText>
            <FastImage
              source={isDark ? otcBuiltTradesBg : otcBuiltTradesBgLight}
              style={styles.builtImage}
              resizeMode="contain"
            />
            <View style={styles.builtFeatures}>
              {BUILT_FEATURES.map((item) => (
                <View key={item.title} style={styles.builtFeature}>
                  <FastImage source={item.icon} style={styles.builtFeatureIcon} resizeMode="contain" />
                  <AppText weight={MEDIUM} style={[styles.builtFeatureTitle, { color: palette.text }]}>
                    {item.title}
                  </AppText>
                  <AppText style={[styles.builtFeatureDesc, { color: palette.builtDesc }]}>{item.desc}</AppText>
                </View>
              ))}
            </View>
          </View>

          {/* Recent Completed Trades */}
          <View style={[styles.section, styles.recentSection, { backgroundColor: palette.sectionBg }]}>
            <View style={[styles.spaceBetween, styles.recentHeader]}>
              <AppText weight={SEMI_BOLD} style={[themed.sectionHeading, styles.recentHeading]}>
                Recent Completed Trades
              </AppText>
              <TouchableOpacity onPress={showComingSoon}>
                <AppText weight={SEMI_BOLD} style={styles.viewAll}>
                  View All Trade History ›
                </AppText>
              </TouchableOpacity>
            </View>
            <View style={themed.emptyBox}>
              <AppText style={[styles.emptyText, { color: palette.stepText }]}>No completed OTC trades yet.</AppText>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppSafeAreaView>
  );
};

export default OtcDashboard;

const getThemedStyles = (palette) =>
  StyleSheet.create({
    heroTitle: {
      color: palette.text,
      fontSize: 28,
      lineHeight: 34,
      textAlign: "center",
    },
    heroDesc: {
      color: palette.heroDesc,
      fontSize: 14,
      lineHeight: 20,
      textAlign: "center",
      marginTop: 14,
      marginBottom: 18,
    },
    secondaryBtn: {
      backgroundColor: palette.secondaryBtnBg,
      borderColor: palette.secondaryBtnBorder,
      borderWidth: 1,
      borderRadius: 50,
      paddingVertical: 9,
      paddingHorizontal: 22,
      flexDirection: "row",
      alignItems: "center",
    },
    suiteTitle: {
      color: palette.text,
      fontSize: 26,
      textAlign: "center",
      marginBottom: 18,
    },
    card: {
      backgroundColor: palette.cardBg,
      borderColor: palette.cardBorder,
      borderWidth: 1,
      borderRadius: 20,
      padding: 20,
    },
    cardTitle: {
      color: palette.text,
      fontSize: 20,
      marginBottom: 12,
    },
    fieldLabel: {
      color: palette.label,
      fontSize: 15,
      marginBottom: 7,
    },
    inputCard: {
      height: 48,
      borderRadius: 50,
      borderWidth: 1,
      borderColor: palette.inputBorder,
      backgroundColor: palette.cardBg,
      paddingHorizontal: 14,
    },
    amountInput: {
      flex: 1,
      marginLeft: 10,
      textAlign: "right",
      color: palette.text,
      fontSize: 14,
      fontFamily: fontFamilyMedium,
      paddingVertical: 0,
    },
    searchBox: {
      flexDirection: "row",
      alignItems: "center",
      height: 42,
      borderRadius: 50,
      borderWidth: 1,
      borderColor: palette.inputBorder,
      backgroundColor: palette.cardBg,
      paddingHorizontal: 12,
      marginBottom: 10,
    },
    searchInput: {
      flex: 1,
      marginLeft: 8,
      color: palette.text,
      fontSize: 14,
      fontFamily: fontFamilyMedium,
      paddingVertical: 0,
    },
    sectionHeading: {
      color: palette.text,
      fontSize: 22,
      marginBottom: 20,
    },
    whyCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      backgroundColor: palette.cardBg,
      borderColor: palette.cardBorder,
      borderWidth: 1,
      borderRadius: 18,
      padding: 18,
    },
    builtHeading: {
      color: palette.text,
      fontSize: 22,
      lineHeight: 28,
      marginBottom: 14,
    },
    emptyBox: {
      backgroundColor: palette.cardBg,
      borderColor: palette.emptyBorder,
      borderWidth: 1,
      borderRadius: 16,
      paddingVertical: 48,
      paddingHorizontal: 16,
    },
  });

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  spaceBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backIcon: {
    width: 18,
    height: 18,
  },
  headerSpacer: {
    width: 18,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  hero: {
    width: SCREEN_WIDTH,
    alignItems: "center",
    overflow: "hidden",
  },
  heroBanner: {
    position: "absolute",
    top: 0,
    width: HERO_BANNER_WIDTH,
    height: HERO_BANNER_HEIGHT,
  },
  orbit: {
    position: "absolute",
    top: ORBIT_TOP,
    left: (SCREEN_WIDTH - ORBIT_SIZE) / 2,
    width: ORBIT_SIZE,
    height: ORBIT_SIZE,
    borderRadius: ORBIT_RADIUS,
  },
  badgeHit: {
    position: "absolute",
    width: BADGE_SIZE,
    height: BADGE_SIZE,
  },
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    shadowColor: "rgb(254,203,72)",
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 25,
    shadowOpacity: 0,
  },
  badgeImage: {
    width: "100%",
    height: "100%",
  },
  heroBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: HERO_BOTTOM_HEIGHT,
  },
  heroFade: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  heroContent: {
    paddingTop: ORBIT_TOP + ORBIT_RADIUS * 0.5 + BADGE_SIZE / 2 + 40,
    paddingBottom: 48,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  heroBtns: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  primaryBtn: {
    backgroundColor: GOLD,
    borderRadius: 50,
    paddingVertical: 9,
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 36,
    paddingBottom: 40,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  coinIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    marginRight: 6,
  },
  coinIconLg: {
    width: 26,
    height: 26,
    borderRadius: 13,
    marginRight: 6,
  },
  coinSymbol: {
    fontSize: 14,
  },
  tabs: {
    height: TAB_HEIGHT,
    borderRadius: 50,
    overflow: "hidden",
    flexDirection: "row",
    marginBottom: 20,
  },
  tabLabel: {
    height: TAB_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: {
    fontSize: 15,
  },
  rateRow: {
    marginTop: 4,
    marginBottom: 20,
    marginHorizontal: 2,
  },
  rateText: {
    fontSize: 13,
  },
  rateValue: {
    flexShrink: 1,
    textAlign: "right",
    marginLeft: 12,
  },
  requestBtn: {
    height: 46,
    borderRadius: 50,
    backgroundColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "rgb(217,168,89)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 4,
  },
  requestBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
  },
  worksCard: {
    marginTop: 24,
  },
  stepsList: {
    gap: 18,
    paddingTop: 6,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  stepNum: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(209,170,103,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  stepNumText: {
    color: GOLD,
    fontSize: 15,
  },
  stepTitle: {
    fontSize: 16,
    marginBottom: 3,
  },
  stepDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  whySection: {
    paddingHorizontal: 16,
    paddingTop: 30,
    paddingBottom: 35,
    overflow: "hidden",
  },
  whyGrid: {
    gap: 14,
  },
  whyIconBox: {
    width: 45,
    height: 45,
    borderRadius: 16,
    backgroundColor: "rgba(209,170,103,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  whyTitle: {
    fontSize: 15,
    marginBottom: 5,
  },
  whyDesc: {
    fontSize: 13.5,
    lineHeight: 19,
  },
  builtDesc: {
    fontSize: 15,
    lineHeight: 24,
  },
  builtImage: {
    width: "100%",
    height: BUILT_IMG_HEIGHT,
    borderRadius: 14,
    marginTop: 18,
    marginBottom: 20,
  },
  builtFeatures: {
    gap: 24,
  },
  builtFeature: {
    alignItems: "center",
  },
  builtFeatureIcon: {
    width: 60,
    height: 60,
    marginBottom: 12,
  },
  builtFeatureTitle: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 6,
  },
  builtFeatureDesc: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  recentSection: {
    paddingTop: 30,
  },
  recentHeader: {
    marginBottom: 20,
  },
  recentHeading: {
    flexShrink: 1,
    marginBottom: 0,
    marginRight: 12,
  },
  viewAll: {
    color: GOLD,
    fontSize: 12,
    textAlign: "right",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 14,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    maxHeight: "70%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    padding: 16,
    paddingBottom: 30,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sheetItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  sheetItemSelected: {
    backgroundColor: "rgba(213,167,96,0.15)",
  },
  sheetEmpty: {
    textAlign: "center",
    paddingVertical: 24,
    fontSize: 13,
  },
});
