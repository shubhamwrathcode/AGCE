import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import FastImage from "react-native-fast-image";
import LinearGradient from "react-native-linear-gradient";
import Svg, {
  Defs,
  Image as SvgImage,
  LinearGradient as SvgGradient,
  Mask,
  Path,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import Animated, {
  Easing,
  Extrapolation,
  cancelAnimation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SystemBars } from "react-native-edge-to-edge";
import { AppText as BaseAppText, BOLD, MEDIUM, SEMI_BOLD } from "../../shared";
import CoinIcon from "../../common/CoinIcon";
import NavigationService from "../../navigation/NavigationService";
import { useTheme } from "../../hooks/useTheme";
import { fontFamilyBold, fontFamilyMedium, fontFamilySemiBold } from "../../theme/typography";
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
import useOtcDesk from "./useOtcDesk";
import {
  completedTrades,
  formatAvail,
  formatCountdown,
  moneyLine,
  netAfterProfit,
  sanitizeAmount,
  STATUS_COPY,
} from "./otcDeskLogic";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const GOLD = "#D1AA67";
const GOLD_TEXT = "#D5A760";

const HERO_BANNER_WIDTH = SCREEN_WIDTH * 0.9;
const HERO_BANNER_HEIGHT = HERO_BANNER_WIDTH * (1518 / 1893);
const HERO_BANNER_TOP_GAP = 16;
/** Rings of otc_herobnr_img.png, as fractions of the image width. */
const DOME_OUTER_RING_CENTER_Y = 0.527;
const DOME_OUTER_RING_RADIUS = 0.505;
/** The PNG is cropped just above the outer ring, so its glow is faded out along this radius. */
const DOME_GLOW_FADE_START = 0.5;
const DOME_GLOW_FADE_END = 0.527;
const DOME_RING_CENTER_Y = 0.5445;
const DOME_RING_RADIUS = 0.3915;

const ORBIT_RADIUS = HERO_BANNER_WIDTH * DOME_RING_RADIUS;
const ORBIT_SIZE = ORBIT_RADIUS * 2;
const BADGE_SIZE = 64;
const HEADER_HEIGHT = 50;
const HEADER_FADE_DISTANCE = 60;
const HERO_TITLE_OFFSET =
  HERO_BANNER_WIDTH * DOME_OUTER_RING_RADIUS * 0.5 + BADGE_SIZE / 2 + 14;
/** iOS resolves fonts by PostScript name (Inter18pt-*), not by the file names in typography. */
const WEIGHT_FONTS =
  Platform.OS === "ios"
    ? { [BOLD]: "Inter18pt-Bold", [SEMI_BOLD]: "Inter18pt-SemiBold", [MEDIUM]: "Inter18pt-Medium" }
    : { [BOLD]: fontFamilyBold, [SEMI_BOLD]: fontFamilySemiBold, [MEDIUM]: fontFamilyMedium };
const HERO_TITLE_FONT = WEIGHT_FONTS[BOLD];
const SUITE_TITLE_FONT = WEIGHT_FONTS[SEMI_BOLD];

const AppText = ({ weight, style, ...props }) => (
  <BaseAppText
    weight={weight}
    style={WEIGHT_FONTS[weight] ? [{ fontFamily: WEIGHT_FONTS[weight] }, style] : style}
    {...props}
  />
);
const SUITE_TITLE_SIZE = 26;
const SUITE_TITLE_HEIGHT = 34;
const ORBIT_SPIN_MS = 25000;
const BADGE_SPIN_MS = 40000;
const BADGE_FADE_RANGE = [0.15, 0.5];

const HERO_BOTTOM_HEIGHT = SCREEN_WIDTH * (1322 / 3840);
const BUILT_GRID_GAP = 12;
const WHY_GRID_GAP = 10;
const WHY_CARD_WIDTH = (SCREEN_WIDTH - 32 - WHY_GRID_GAP) / 2;
const BUILT_CARD_WIDTH = (SCREEN_WIDTH - 32 - BUILT_GRID_GAP) / 2;

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
  heroBg: "#181B21",
  sectionBg: "#171B20",
  heroFade: "#171a1f",
  text: "#FFFFFF",
  heroDesc: "#B9BCC0",
  cardBg: "rgba(255,255,255,0.1)",
  cardBorder: "rgba(255,255,255,0.15)",
  featureBg: "rgba(255,255,255,0.035)",
  featureBorder: "rgba(255,255,255,0.08)",
  whyCardBg: "#20242B",
  whyCardBorder: "rgba(255,255,255,0.08)",
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
  heroBg: "#FEFEFE",
  sectionBg: "#ffffff",
  heroFade: "#f7f7f7",
  text: "#0f172a",
  heroDesc: "#64748b",
  cardBg: "rgba(0,0,0,0.05)",
  cardBorder: "#eff4fb",
  featureBg: "#ffffff",
  featureBorder: "#e2e8f0",
  whyCardBg: "rgba(0,0,0,0.05)",
  whyCardBorder: "#eff6fe",
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

const GradientTitle = ({ text, endColor, style }) => (
  <Svg width="100%" height={SUITE_TITLE_HEIGHT} style={style} accessibilityLabel={text}>
    <Defs>
      <SvgGradient id="suiteTitleFill" x1="0" y1="0" x2="1" y2="0">
        <Stop offset="0" stopColor={GOLD_TEXT} />
        <Stop offset="0.55" stopColor="#E9DCC4" />
        <Stop offset="1" stopColor={endColor} />
      </SvgGradient>
    </Defs>
    <SvgText
      x="50%"
      y={SUITE_TITLE_SIZE}
      textAnchor="middle"
      fontFamily={SUITE_TITLE_FONT}
      fontSize={SUITE_TITLE_SIZE}
      fill="url(#suiteTitleFill)"
    >
      {text}
    </SvgText>
  </Svg>
);

const HeroBanner = React.memo(({ top }) => {
  const cx = HERO_BANNER_WIDTH / 2;
  const cy = HERO_BANNER_WIDTH * DOME_OUTER_RING_CENTER_Y;
  const r = HERO_BANNER_WIDTH * DOME_GLOW_FADE_END;
  return (
    <Svg
      width={HERO_BANNER_WIDTH}
      height={HERO_BANNER_HEIGHT}
      style={[styles.heroBanner, { top }]}
      pointerEvents="none"
    >
      <Defs>
        <RadialGradient id="domeFade" cx={cx} cy={cy} r={r} gradientUnits="userSpaceOnUse">
          <Stop offset={DOME_GLOW_FADE_START / DOME_GLOW_FADE_END} stopColor="#FFFFFF" stopOpacity={1} />
          <Stop offset={1} stopColor="#FFFFFF" stopOpacity={0} />
        </RadialGradient>
        <Mask id="domeMask" maskUnits="userSpaceOnUse" x={0} y={0} width={HERO_BANNER_WIDTH} height={HERO_BANNER_HEIGHT}>
          <Rect x={0} y={0} width={HERO_BANNER_WIDTH} height={cy} fill="url(#domeFade)" />
          <Rect x={0} y={cy} width={HERO_BANNER_WIDTH} height={HERO_BANNER_HEIGHT - cy} fill="#FFFFFF" />
        </Mask>
      </Defs>
      <SvgImage
        href={otcHeroBanner}
        width={HERO_BANNER_WIDTH}
        height={HERO_BANNER_HEIGHT}
        preserveAspectRatio="xMidYMid meet"
        mask="url(#domeMask)"
      />
    </Svg>
  );
});

const HeroOrbit = ({ isDark, top }) => {
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
    <Animated.View style={[styles.orbit, { top }, orbitStyle]} pointerEvents="box-none">
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

const OptionSheet = ({ visible, title, placeholder, options, selectedKey, onSelect, onClose, palette, themed }) => {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toUpperCase();
    if (!q) return options;
    return options.filter((item) => String(item.key || "").toUpperCase().includes(q) || String(item.label || "").toUpperCase().includes(q));
  }, [options, search]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetOverlay} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: palette.sheetBg, borderColor: palette.sheetBorder }]}>
        <View style={styles.sheetHeader}>
          <AppText weight={SEMI_BOLD} style={{ color: palette.text, fontSize: 18 }}>
            {title}
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
            placeholder={placeholder}
            placeholderTextColor={palette.muted}
            autoCapitalize="characters"
            style={themed.searchInput}
          />
        </View>
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.key}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <AppText style={[styles.sheetEmpty, { color: palette.muted }]}>No pairs found.</AppText>
          }
          renderItem={({ item }) => {
            const selected = item.key === selectedKey;
            return (
              <TouchableOpacity
                style={[styles.sheetItem, selected && styles.sheetItemSelected]}
                onPress={() => {
                  onSelect(item.key);
                  onClose();
                }}
              >
                <View style={styles.row}>
                  <CoinIcon coin={item.coin} style={styles.coinIcon} fallback={item.key === "USDT" ? tetherIcon : undefined} />
                  <View>
                    <AppText weight={BOLD} style={{ color: palette.text, fontSize: 13.5 }}>{item.label}</AppText>
                    {item.name ? (
                      <AppText style={{ color: palette.muted, fontSize: 11.5 }}>{item.name}</AppText>
                    ) : null}
                  </View>
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

const QuoteStatusCard = ({ desk, palette, themed, embedded = false }) => {
  const copy = STATUS_COPY[desk.view] || STATUS_COPY.awaiting;
  const source = desk.quote || desk.rfq || {};
  const side = String(source.side || "").toUpperCase();
  const meaning = side === "SELL"
    ? `Sell: you pay ${source.pay_asset || ""} and receive ${source.get_asset || ""}.`
    : side === "BUY"
      ? `Buy: you pay ${source.pay_asset || ""} and receive ${source.get_asset || ""}.`
      : "";
  const feeText = desk.quote && desk.quote.fee_percent != null ? String(desk.quote.fee_percent).trim() : "";
  const settledNet = desk.trade && desk.trade.net_get_amount ? String(desk.trade.net_get_amount).trim() : "";
  const quotedNet = feeText ? netAfterProfit(source.get_amount, feeText) : "";
  const afterProfit = settledNet
    ? moneyLine(settledNet, source.get_asset)
    : quotedNet
      ? moneyLine(quotedNet, source.get_asset)
      : moneyLine(source.get_amount, source.get_asset);
  const body = desk.view === "quote" && desk.quote && desk.quote.quote_source === "AUTO"
    ? "This is a firm system quote. Accept it before it expires."
    : copy.body;
  const showNew = desk.view === "accepted" || desk.view === "cancelled" || desk.view === "expired" || desk.view === "void";

  const row = (label, value) => (
    <View style={styles.statusRow}>
      <AppText style={{ color: palette.muted, fontSize: 13 }}>{label}</AppText>
      <AppText weight={SEMI_BOLD} style={{ color: palette.text, fontSize: 13, flexShrink: 1, textAlign: "right" }}>{value}</AppText>
    </View>
  );

  return (
    <View style={embedded ? styles.statusEmbed : themed.card}>
      <AppText weight={SEMI_BOLD} style={themed.cardTitle}>{copy.title}</AppText>
      <AppText style={[styles.statusBody, { color: palette.stepText }]}>{body}</AppText>
      {meaning ? <AppText style={[styles.statusBody, { color: palette.text }]}>{meaning}</AppText> : null}
      {row("Side", source.side || "—")}
      {row("You pay", moneyLine(source.pay_amount, source.pay_asset))}
      {row("You get", afterProfit)}
      {desk.quote?.rate ? row("Rate", String(desk.quote.rate)) : null}
      {desk.trade?.id ? row("Trade", desk.trade.status || desk.trade.id) : null}
      {desk.view === "quote" ? (
        <AppText weight={SEMI_BOLD} style={[styles.countdown, { color: desk.countdownMs <= 0 ? "#f6465d" : GOLD }]}>
          Expires in {formatCountdown(desk.countdownMs)}
        </AppText>
      ) : null}
      {desk.view === "quote" ? (
        desk.kycVerified ? (
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.requestBtn, (desk.submitting || desk.countdownMs <= 0) && styles.btnDisabled]}
            disabled={desk.submitting || desk.countdownMs <= 0}
            onPress={desk.acceptQuote}
          >
            <AppText weight={SEMI_BOLD} style={styles.requestBtnText}>
              {desk.submitting ? "Accepting…" : "Accept Quote"}
            </AppText>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity activeOpacity={0.85} style={styles.requestBtn} onPress={desk.goToKyc}>
            <AppText weight={SEMI_BOLD} style={styles.requestBtnText}>Submit Kyc</AppText>
          </TouchableOpacity>
        )
      ) : null}
      {desk.view === "awaiting" ? (
        <TouchableOpacity
          activeOpacity={0.85}
          style={[themed.secondaryBtn, styles.statusSecondary]}
          disabled={desk.submitting}
          onPress={desk.cancelRfq}
        >
          <AppText weight={SEMI_BOLD} style={{ color: palette.secondaryBtnText, fontSize: 15 }}>
            {desk.submitting ? "Cancelling…" : "Cancel request"}
          </AppText>
        </TouchableOpacity>
      ) : null}
      {showNew ? (
        <TouchableOpacity activeOpacity={0.85} style={styles.requestBtn} onPress={desk.startNewRequest}>
          <AppText weight={SEMI_BOLD} style={styles.requestBtnText}>New request</AppText>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const RequestQuoteCard = ({ desk, palette, themed }) => {
  const [pairOpen, setPairOpen] = useState(false);
  const [coinOpen, setCoinOpen] = useState(false);
  const [balanceTip, setBalanceTip] = useState(false);
  const [pairBase = "BTC", pairQuote = "USDT"] = String(desk.pairKey || "BTC/USDT").split("/");
  const isBuy = desk.quoteType === "buy";
  const amountValue = sanitizeAmount(desk.amount, 8);
  const coin = desk.amountAsset || pairBase;
  const lastPrice = Number(String(desk.ticker?.last || "").replace(/,/g, ""));
  const formattedRate = lastPrice > 0
    ? lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "";
  const priceFontSize = formattedRate.length > 12 ? 13 : formattedRate.length > 9 ? 15 : 18;
  const changeN = Number(String(desk.ticker?.change_percent ?? "").replace(/,/g, ""));
  const changeText = Number.isFinite(changeN) && formattedRate
    ? `${changeN > 0 ? "+" : ""}${changeN.toFixed(2)}%`
    : "";
  const amountCoin = desk.baseOptions.find((item) => item.symbol === coin);
  const pairItems = desk.pairOptions.map((item) => ({
    key: item.symbol,
    label: item.symbol,
    name: item.name,
    coin: { icon_path: item.iconPath, base_currency: item.symbol.split("/")[0] },
  }));
  const coinItems = (desk.baseOptions.length ? desk.baseOptions : [
    { symbol: pairBase, name: pairBase, iconPath: "" },
    { symbol: pairQuote, name: pairQuote, iconPath: "" },
  ]).map((item) => ({
    key: item.symbol,
    label: item.symbol,
    name: item.name && item.name !== item.symbol ? item.name : "",
    coin: { icon_path: item.iconPath, base_currency: item.symbol, short_name: item.symbol },
  }));
  const loggedInContinue = desk.isLoggedIn;
  const buttonLabel = loggedInContinue ? "Continue" : "Request Quote";
  const amountReady = /^\d+(\.\d+)?$/.test(amountValue) && Number(amountValue) > 0 && !desk.amountError;
  const disabled = loggedInContinue && (desk.assetsLoading || desk.submitting || !amountReady);

  return (
    <View style={themed.card}>
      <AppText weight={SEMI_BOLD} style={themed.cardTitle}>Request Quote</AppText>

      <QuoteTabs isBuy={isBuy} onChange={desk.setQuoteType} palette={palette} />

      <View style={[themed.inputCard, styles.pairRow]}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.pairPicker}
          disabled={desk.assetsLoading || !desk.pairOptions.length}
          onPress={() => setPairOpen(true)}
        >
          <AppText
            weight={SEMI_BOLD}
            numberOfLines={1}
            style={[styles.pairSymbol, { color: palette.text }]}
          >
            {desk.pairKey || "BTC/USDT"}
          </AppText>
          <Icon name="chevron-down" size={12} color="#c1c1c1" />
        </TouchableOpacity>
        {formattedRate ? (
          <View style={styles.livePrice}>
            <AppText
              weight={SEMI_BOLD}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
              style={[styles.liveLast, { color: palette.text, fontSize: priceFontSize }]}
            >
              {formattedRate}
            </AppText>
            {changeText ? (
              <AppText
                weight={SEMI_BOLD}
                numberOfLines={1}
                style={[styles.liveChange, { color: changeN >= 0 ? "#3ee49a" : "#ff5d5d" }]}
              >
                {changeText}
              </AppText>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={styles.fieldGroup}>
        <View style={styles.amountHead}>
          <AppText weight={MEDIUM} style={[themed.fieldLabel, styles.amountLabel]}>Amount</AppText>
          {desk.isLoggedIn && desk.available !== "" ? (
            <View style={styles.availWrap}>
              <AppText style={styles.availText}>
                Available: {formatAvail(desk.available)} {desk.availableAsset || (isBuy ? pairQuote : pairBase)}
                {Number(desk.lockedBalance) > 0 ? ` · Locked: ${formatAvail(desk.lockedBalance)}` : ""}
              </AppText>
              <TouchableOpacity onPress={() => setBalanceTip((open) => !open)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <AppText weight={SEMI_BOLD} style={styles.infoMark}>i</AppText>
              </TouchableOpacity>
              {balanceTip ? (
                <View style={styles.balanceTip}>
                  <AppText weight={SEMI_BOLD} style={styles.balanceTipText}>
                    This is the available balance in your Spot wallet. OTC uses the same balance.
                  </AppText>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
        <View style={[themed.inputCard, styles.spaceBetween]}>
          <TextInput
            value={amountValue}
            onChangeText={(text) => desk.setAmount(sanitizeAmount(text, 8))}
            placeholder={desk.minBase || "0"}
            placeholderTextColor={palette.placeholder === "#FFFFFF" ? "rgba(255,255,255,0.38)" : palette.placeholder}
            keyboardType="decimal-pad"
            style={[themed.amountInput, styles.amountInputLeft]}
          />
          <View style={styles.amountSide}>
            <TouchableOpacity style={styles.coinPick} onPress={() => setCoinOpen(true)}>
              <CoinIcon
                coin={amountCoin ? { icon_path: amountCoin.iconPath, short_name: coin, base_currency: coin } : { short_name: coin }}
                style={styles.coinIconLg}
                fallback={coin === "USDT" ? tetherIcon : undefined}
              />
              <AppText weight={SEMI_BOLD} style={[styles.pairSymbol, { color: palette.text }]}>{coin}</AppText>
              <Icon name="chevron-down" size={12} color="#c1c1c1" />
            </TouchableOpacity>
            <TouchableOpacity onPress={desk.onMax} hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}>
              <AppText weight={BOLD} style={styles.maxText}>Max</AppText>
            </TouchableOpacity>
          </View>
        </View>
        {desk.amountApprox ? (
          <AppText weight={MEDIUM} style={[styles.approxText, { color: palette.rateVal }]}>{desk.amountApprox}</AppText>
        ) : desk.minQuoteLabel ? (
          <AppText weight={MEDIUM} style={[styles.approxText, { color: palette.rateVal }]}>{desk.minQuoteLabel}</AppText>
        ) : null}
        {desk.amountError ? <AppText style={styles.fieldError}>{desk.amountError}</AppText> : null}
        {!desk.amountError && desk.amountWarning ? (
          <AppText style={styles.fieldWarning}>{desk.amountWarning}</AppText>
        ) : null}
      </View>

      {desk.isLoggedIn && !desk.deskOpen ? (
        <AppText style={styles.deskClosed}>The OTC desk is closed. New requests open again during desk hours.</AppText>
      ) : null}

      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.requestBtn, disabled && styles.btnDisabled]}
        disabled={disabled}
        onPress={desk.isLoggedIn ? desk.submitRfq : desk.goToLogin}
      >
        <AppText weight={SEMI_BOLD} style={styles.requestBtnText}>{buttonLabel}</AppText>
      </TouchableOpacity>

      {desk.view !== "form" ? (
        <View style={styles.statusBelow}>
          <QuoteStatusCard desk={desk} palette={palette} themed={themed} embedded />
        </View>
      ) : null}

      <OptionSheet
        visible={pairOpen}
        title="Select Pair"
        placeholder="Search pair"
        options={pairItems}
        selectedKey={desk.pairKey}
        onSelect={desk.onPairChange}
        onClose={() => setPairOpen(false)}
        palette={palette}
        themed={themed}
      />
      <OptionSheet
        visible={coinOpen}
        title="Amount coin"
        placeholder="Search coin"
        options={coinItems}
        selectedKey={coin}
        onSelect={desk.setAmountCoin}
        onClose={() => setCoinOpen(false)}
        palette={palette}
        themed={themed}
      />
    </View>
  );
};

const TradeRow = ({ row, palette, themed }) => {
  const isBuy = row.type === "Buy";
  return (
    <View style={[themed.tradeCard, styles.tradeCard]}>
      <View style={styles.spaceBetween}>
        <View style={styles.row}>
          <CoinIcon coin={{ short_name: row.base, base_currency: row.base }} style={styles.coinIcon} />
          <AppText weight={SEMI_BOLD} style={{ color: palette.text, fontSize: 14 }}>{row.pair}</AppText>
        </View>
        <AppText weight={SEMI_BOLD} style={{ color: isBuy ? "#20BF7A" : "#f6465d", fontSize: 13 }}>{row.type}</AppText>
      </View>
      <AppText style={{ color: palette.muted, fontSize: 12, marginTop: 6 }}>{row.date}</AppText>
      <View style={[styles.spaceBetween, { marginTop: 8 }]}>
        <AppText style={{ color: palette.stepText, fontSize: 12 }}>{row.amount}</AppText>
        <AppText style={{ color: palette.stepText, fontSize: 12 }}>{row.price}</AppText>
      </View>
      <AppText weight={MEDIUM} style={{ color: palette.text, fontSize: 13, marginTop: 4 }}>Total {row.total}</AppText>
    </View>
  );
};

const OtcDashboard = () => {
  const desk = useOtcDesk();
  const { isDark } = useTheme();
  const palette = isDark ? DARK_PALETTE : LIGHT_PALETTE;
  const themed = useMemo(() => getThemedStyles(palette), [palette]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const recentRows = useMemo(() => completedTrades(desk.trades, 5), [desk.trades]);
  const allRows = useMemo(() => completedTrades(desk.trades), [desk.trades]);
  const insets = useSafeAreaInsets();
  const headerTop = insets.top || (Platform.OS === "ios" ? 59 : StatusBar.currentHeight || 24);
  const heroTop = headerTop + HEADER_HEIGHT;
  const bannerTop = headerTop + HERO_BANNER_TOP_GAP;
  const orbitTop = bannerTop + HERO_BANNER_WIDTH * DOME_RING_CENTER_Y - ORBIT_RADIUS;
  const scrollRef = useRef(null);
  const quoteSectionY = useRef(0);
  const scrollY = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const headerBgStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, HEADER_FADE_DISTANCE], [0, 1], Extrapolation.CLAMP),
  }));

  const scrollToQuote = () => {
    scrollRef.current?.scrollTo({ y: Math.max(0, quoteSectionY.current - heroTop), animated: true });
  };

  return (
    <View style={[styles.flex1, { backgroundColor: palette.pageBg }]}>
      <SystemBars style={isDark ? "light" : "dark"} />

      <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Animated.ScrollView
          ref={scrollRef}
          onScroll={onScroll}
          scrollEventThrottle={16}
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
            <HeroBanner top={bannerTop} />
            <HeroOrbit isDark={isDark} top={orbitTop} />
            <FastImage source={otcHeroBottomBg} style={styles.heroBottom} resizeMode="cover" />
            <LinearGradient
              colors={[`${palette.heroFade}00`, palette.sectionBg]}
              style={styles.heroFade}
              pointerEvents="none"
            />

            <View style={[styles.heroContent, { paddingTop: heroTop + HERO_TITLE_OFFSET }]} pointerEvents="box-none">
              <AppText weight={BOLD} style={styles.heroAccent}>
                OTC Desk
              </AppText>
              <AppText weight={BOLD} style={themed.heroTitle} numberOfLines={1} adjustsFontSizeToFit>
                Built for large crypto trades.
              </AppText>
              <AppText style={themed.heroDesc}>
                Execute high-value crypto trades through a dedicated OTC desk with competitive pricing, deep liquidity, and personalized settlement support.
              </AppText>
              <View style={styles.heroBtns}>
                <TouchableOpacity activeOpacity={0.85} style={styles.primaryBtn} onPress={scrollToQuote}>
                  <AppText style={styles.primaryBtnText}>Trade Now</AppText>
                  <Icon name="arrow-right" size={16} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.85} style={themed.secondaryBtn} onPress={() => NavigationService.navigate("Support")}>
                  <AppText style={[styles.primaryBtnText, { color: palette.secondaryBtnText }]}>Contact Us</AppText>
                </TouchableOpacity>
              </View>
            </View>
          </ImageBackground>

          {/* Complete Trading Suite */}
          <View
            style={[styles.section, styles.suiteSection, { backgroundColor: palette.sectionBg }]}
            onLayout={(e) => {
              quoteSectionY.current = e.nativeEvent.layout.y;
            }}
          >
            <GradientTitle
              text="Complete Trading Suite"
              endColor={isDark ? "#FFFFFF" : palette.text}
              style={styles.suiteTitle}
            />

            <RequestQuoteCard desk={desk} palette={palette} themed={themed} />

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
                      <AppText weight={SEMI_BOLD} style={[styles.stepTitle, { color: palette.text }]}>
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
          <View style={[styles.whySection, { backgroundColor: palette.sectionBg }]}>
            <FastImage
              source={isDark ? otcDeskBg : otcDeskBgLight}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
            <AppText weight={BOLD} style={themed.sectionHeading} numberOfLines={1} adjustsFontSizeToFit>
              Why Trade with AGCE OTC Desk?
            </AppText>
            <View style={styles.whyGrid}>
              {WHY_TRADE_LIST.map(({ Icon: ListIcon, title, desc }) => (
                <View key={title} style={themed.whyCard}>
                  <View style={styles.whyCardHead}>
                    <View style={styles.whyIconBox}>
                      <ListIcon width={16} height={16} />
                    </View>
                    <AppText weight={SEMI_BOLD} style={[styles.whyTitle, { color: palette.text }]}>
                      {title}
                    </AppText>
                  </View>
                  <AppText style={[styles.whyDesc, { color: palette.whyDesc }]}>{desc}</AppText>
                </View>
              ))}
            </View>
          </View>

          {/* Built for trades */}
          <View style={[styles.section, { backgroundColor: palette.sectionBg }]}>
            <View style={styles.wordWrap}>
              {[
                { text: "Built for trades that need", color: palette.text },
                { text: "more than an exchange screen.", color: GOLD_TEXT },
              ].flatMap(({ text, color }) =>
                text.split(" ").map((word) => (
                  <AppText key={`${color}-${word}`} weight={BOLD} style={[themed.builtHeading, { color }]}>
                    {`${word} `}
                  </AppText>
                ))
              )}
            </View>
            <AppText style={[styles.builtDesc, { color: palette.builtDesc }]}>
              Large orders can create unnecessary market impact when executed through public order books. Our OTC desk provides direct execution and tailored liquidity for high-value transactions.
            </AppText>
            <View style={styles.builtFeatures}>
              {BUILT_FEATURES.map((item) => (
                <View key={item.title} style={[themed.builtFeature, styles.builtFeature]}>
                  <FastImage source={item.icon} style={styles.builtFeatureIcon} resizeMode="contain" />
                  <AppText weight={BOLD} style={[styles.builtFeatureTitle, { color: palette.text }]}>
                    {item.title}
                  </AppText>
                  <AppText style={[styles.builtFeatureDesc, { color: palette.builtDesc }]}>{item.desc}</AppText>
                </View>
              ))}
            </View>
          </View>

          {/* Recent Completed Trades */}
          <View style={[styles.section, styles.recentSection, { backgroundColor: palette.sectionBg }]}>
            <View style={styles.recentHeader}>
              <AppText
                weight={BOLD}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.62}
                style={[themed.sectionHeading, styles.recentHeading]}
              >
                Recent Completed Trades
              </AppText>
              <TouchableOpacity
                style={styles.viewAllHit}
                onPress={() => (desk.isLoggedIn ? setHistoryOpen(true) : desk.goToLogin())}
              >
                <AppText weight={SEMI_BOLD} numberOfLines={1} style={styles.viewAll}>
                  View All ›
                </AppText>
              </TouchableOpacity>
            </View>
            {desk.tradesLoading ? (
              <View style={themed.emptyBox}>
                <AppText style={[styles.emptyText, { color: palette.stepText }]}>Loading trades…</AppText>
              </View>
            ) : recentRows.length ? (
              <View style={styles.tradeList}>
                {recentRows.map((row) => (
                  <TradeRow key={row.id} row={row} palette={palette} themed={themed} />
                ))}
              </View>
            ) : (
              <View style={themed.emptyBox}>
                <AppText style={[styles.emptyText, { color: palette.stepText }]}>No completed OTC trades yet.</AppText>
              </View>
            )}
            <Modal visible={historyOpen} transparent animationType="slide" onRequestClose={() => setHistoryOpen(false)}>
              <Pressable style={styles.sheetOverlay} onPress={() => setHistoryOpen(false)} />
              <View style={[styles.sheet, { backgroundColor: palette.sheetBg, borderColor: palette.sheetBorder }]}>
                <View style={styles.sheetHeader}>
                  <AppText weight={SEMI_BOLD} style={{ color: palette.text, fontSize: 18 }}>Trade History</AppText>
                  <TouchableOpacity onPress={() => setHistoryOpen(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Icon name="close" size={22} color={palette.text} />
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={allRows}
                  keyExtractor={(item) => String(item.id)}
                  ListEmptyComponent={
                    <AppText style={[styles.sheetEmpty, { color: palette.muted }]}>No completed OTC trades yet.</AppText>
                  }
                  renderItem={({ item }) => <TradeRow row={item} palette={palette} themed={themed} />}
                />
              </View>
            </Modal>
          </View>
        </Animated.ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.header, { paddingTop: headerTop }]} pointerEvents="box-none">
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: palette.pageBg }, headerBgStyle]}
          pointerEvents="none"
        />
        <TouchableOpacity onPress={() => NavigationService.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <FastImage source={back_ic} style={styles.backIcon} tintColor={palette.text} resizeMode="contain" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default OtcDashboard;

const getThemedStyles = (palette) =>
  StyleSheet.create({
    heroTitle: {
      color: palette.text,
      fontFamily: HERO_TITLE_FONT,
      fontSize: 26,
      lineHeight: 32,
      letterSpacing: -0.5,
      textAlign: "center",
      marginTop: 2,
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
    card: {
      backgroundColor: palette.cardBg,
      borderColor: palette.cardBorder,
      borderWidth: 1,
      borderRadius: 20,
      padding: 20,
    },
    builtFeature: {
      backgroundColor: palette.featureBg,
      borderColor: palette.featureBorder,
    },
    cardTitle: {
      color: palette.text,
      fontSize: 20,
      lineHeight: 26,
      letterSpacing: -0.2,
      marginBottom: 14,
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
      fontFamily: WEIGHT_FONTS[MEDIUM],
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
      fontFamily: WEIGHT_FONTS[MEDIUM],
      paddingVertical: 0,
    },
    sectionHeading: {
      color: palette.text,
      fontSize: 20,
      lineHeight: 24,
      letterSpacing: -0.3,
      marginBottom: 12,
    },
    whyCard: {
      width: WHY_CARD_WIDTH,
      backgroundColor: palette.whyCardBg,
      borderColor: palette.whyCardBorder,
      borderWidth: 1,
      borderRadius: 14,
      padding: 12,
    },
    builtHeading: {
      color: palette.text,
      fontSize: 24,
      lineHeight: 31,
    },
    emptyBox: {
      backgroundColor: palette.cardBg,
      borderColor: palette.emptyBorder,
      borderWidth: 1,
      borderRadius: 16,
      paddingVertical: 16,
      paddingHorizontal: 16,
    },
    tradeCard: {
      backgroundColor: palette.cardBg,
      borderColor: palette.emptyBorder,
      borderWidth: 1,
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
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: (HEADER_HEIGHT - 18) / 2,
    minHeight: HEADER_HEIGHT,
  },
  backIcon: {
    width: 18,
    height: 18,
    marginTop: (HEADER_HEIGHT - 18) / 2,
  },
  scrollContent: {
    paddingBottom: 12,
  },
  hero: {
    width: SCREEN_WIDTH,
    alignItems: "center",
    overflow: "hidden",
  },
  heroBanner: {
    position: "absolute",
    width: HERO_BANNER_WIDTH,
    height: HERO_BANNER_HEIGHT,
  },
  orbit: {
    position: "absolute",
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
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  wordWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  heroAccent: {
    color: GOLD_TEXT,
    fontFamily: HERO_TITLE_FONT,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.5,
    textAlign: "center",
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
    paddingTop: 20,
    paddingBottom: 16,
  },
  suiteSection: {
    paddingTop: 16,
  },
  suiteTitle: {
    marginBottom: 12,
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
    height: 50,
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
    fontSize: 17,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  pairRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },
  pairPicker: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  pairSymbol: {
    flexShrink: 1,
    fontSize: 17,
  },
  livePrice: {
    flexShrink: 1,
    minWidth: 0,
    maxWidth: "58%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },
  liveLast: {
    flexShrink: 1,
    fontSize: 18,
    textAlign: "right",
  },
  liveChange: {
    fontSize: 14,
    flexShrink: 0,
  },
  availWrap: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    marginLeft: 8,
    gap: 4,
  },
  infoMark: {
    width: 14,
    height: 14,
    borderRadius: 7,
    overflow: "hidden",
    textAlign: "center",
    lineHeight: 14,
    fontSize: 10,
    color: "#7A8293",
    borderWidth: 1,
    borderColor: "#7A8293",
  },
  balanceTip: {
    position: "absolute",
    right: 0,
    bottom: 22,
    width: 230,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    zIndex: 8,
  },
  balanceTipText: {
    color: "#0f172a",
    fontSize: 11,
    lineHeight: 15,
  },
  amountSide: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
    gap: 8,
  },
  deskClosed: {
    color: "#f0c674",
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
  },
  statusEmbed: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  amountHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 7,
  },
  amountLabel: {
    marginBottom: 0,
  },
  availText: {
    flexShrink: 1,
    color: "#7A8293",
    fontSize: 12,
    lineHeight: 16,
    textAlign: "right",
  },
  amountInputLeft: {
    marginLeft: 0,
    textAlign: "left",
  },
  coinPick: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  maxText: {
    color: "#D5A760",
    fontSize: 12,
  },
  approxText: {
    fontSize: 13,
    lineHeight: 17,
    marginTop: 8,
    marginHorizontal: 2,
  },
  fieldError: {
    color: "#f07178",
    fontSize: 12,
    lineHeight: 16,
    marginTop: 6,
    marginHorizontal: 2,
  },
  fieldWarning: {
    color: "#e6b450",
    fontSize: 12,
    lineHeight: 16,
    marginTop: 6,
    marginHorizontal: 2,
  },
  statusBody: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 8,
  },
  countdown: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 12,
  },
  statusSecondary: {
    alignSelf: "stretch",
    justifyContent: "center",
    height: 46,
    marginTop: 4,
  },
  tradeList: {
    gap: 10,
  },
  tradeCard: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  worksCard: {
    marginTop: 14,
  },
  stepsList: {
    gap: 12,
    paddingTop: 2,
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
    lineHeight: 22,
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  whySection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    overflow: "hidden",
  },
  whyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: WHY_GRID_GAP,
  },
  whyCardHead: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  whyIconBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(209,170,103,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  whyTitle: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
  },
  whyDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  builtDesc: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 14,
  },
  builtFeatures: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: BUILT_GRID_GAP,
  },
  builtFeature: {
    width: BUILT_CARD_WIDTH,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
  },
  builtFeatureIcon: {
    width: 40,
    height: 40,
    marginBottom: 10,
  },
  builtFeatureTitle: {
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  builtFeatureDesc: {
    fontSize: 13,
    lineHeight: 19,
  },
  recentSection: {
    paddingTop: 8,
  },
  recentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  recentHeading: {
    flex: 1,
    minWidth: 0,
    marginBottom: 0,
    marginRight: 10,
  },
  viewAllHit: {
    flexShrink: 0,
  },
  viewAll: {
    color: GOLD,
    fontSize: 12,
    lineHeight: 16,
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
