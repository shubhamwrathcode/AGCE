import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  TouchableOpacity,
  View,
} from "react-native";
import WebView from "react-native-webview";
import { useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SystemBars } from "react-native-edge-to-edge";
import FastImage from "react-native-fast-image";
import { AppText as BaseAppText, BOLD, MEDIUM, SEMI_BOLD } from "../../shared";
import CoinIcon from "../../common/CoinIcon";
import NavigationService from "../../navigation/NavigationService";
import { OTC_HISTORY_PAGE_VIEW, OTC_HISTORY_SCREEN } from "../../navigation/routes";
import { useTheme } from "../../hooks/useTheme";
import { useExchangeData } from "../../services/socket/socketLiveStore";
import { CHART_WEB_BASE_URL } from "../../helper/Constants";
import { back_ic, historyIcon, tetherIcon } from "../../helper/ImageAssets";
import { fontFamilyBold, fontFamilyMedium, fontFamilySemiBold } from "../../theme/typography";
import useOtcDesk from "./useOtcDesk";
import {
  formatAvail,
  formatCountdown,
  moneyLine,
  profitOnGet,
  sanitizeAmount,
} from "./otcDeskLogic";
import { buildOtcTableRows, formatWhen, otcDetailRecord, rfqPair } from "./otcRecords";

const GOLD = "#D1AA67";
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
    card: "transparent",
    cardBorder: themeColors.border,
    text: themeColors.text,
    muted: isDark ? "rgba(255,255,255,0.55)" : "#64748B",
    line: isDark ? "rgba(255,255,255,0.08)" : "#E6EBF2",
    input: isDark ? "#12161C" : "#FFFFFF",
    inputBorder: isDark ? themeColors.border : "#E2E8F0",
    sheet: isDark ? themeColors.card : "#FFFFFF",
    chip: isDark ? "#232A36" : "#F1F5F9",
    buy: themeColors.spotTradeBuy,
    sell: themeColors.spotTradeSell,
    buySoft: isDark ? "rgba(56,183,129,0.16)" : "rgba(56,183,129,0.12)",
    sellSoft: isDark ? "rgba(237,78,78,0.16)" : "rgba(237,78,78,0.12)",
    goldSoft: "rgba(209,170,103,0.16)",
  };
}

const PREVIEW_LIMIT = 5;

function formatLeft(ms) {
  const total = Math.max(0, Math.ceil(Number(ms) / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

const CHART_BAR_H = 52;

function DetailRow({ label, value, emphasize, palette, valueColor }) {
  return (
    <View style={[styles.detailRow, emphasize && styles.detailEmphasis]}>
      <AppText style={{ color: palette.muted, fontSize: 13, flex: 1 }}>{label}</AppText>
      <AppText
        weight={emphasize ? BOLD : SEMI_BOLD}
        style={{ color: valueColor || (emphasize ? GOLD : palette.text), fontSize: emphasize ? 15 : 13, flex: 1.4, textAlign: "right" }}
      >
        {value}
      </AppText>
    </View>
  );
}

function RecordCard({ row, tab, palette, onView, onCancel }) {
  const sell = row.side === "Sell";
  return (
    <View style={[styles.recordCard, { backgroundColor: "transparent", borderColor: palette.cardBorder }]}>
      <View style={styles.spaceBetween}>
        <View style={styles.recordTitle}>
          <AppText weight={SEMI_BOLD} style={{ color: palette.text, fontSize: 15 }}>{row.pair}</AppText>
          <AppText style={{ color: palette.muted, fontSize: 12, marginTop: 3 }} numberOfLines={1}>
            {row.date} · {row.ticketId}
          </AppText>
        </View>
        <View style={[styles.sidePill, { backgroundColor: sell ? palette.sellSoft : palette.buySoft }]}>
          <AppText weight={SEMI_BOLD} style={{ color: sell ? palette.sell : palette.buy, fontSize: 12 }}>{row.side}</AppText>
        </View>
      </View>
      <View style={[styles.recordLine, { backgroundColor: palette.line }]} />
      <DetailRow label="Amount" value={row.pay} palette={palette} />
      <DetailRow label="Status" value={row.status} palette={palette} />
      {tab === "history" ? (
        <>
          <DetailRow label="Traded amount" value={row.tradedAmount} palette={palette} />
          <DetailRow label="Quote price" value={String(row.quotePrice)} palette={palette} />
          <DetailRow label="Settlement Status" value={row.settlement} palette={palette} />
        </>
      ) : (
        <>
          <DetailRow label="Limit price" value={String(row.limitPrice)} palette={palette} />
          <DetailRow label="Progress" value={row.progress} palette={palette} />
          <DetailRow label="Filled / Total" value={row.filledTotal} palette={palette} />
        </>
      )}
      <View style={styles.rowActions}>
        {onCancel ? (
          <TouchableOpacity onPress={onCancel} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <AppText weight={SEMI_BOLD} style={{ color: palette.sell, fontSize: 13 }}>Cancel</AppText>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={[styles.viewChip, { backgroundColor: palette.goldSoft }]} onPress={onView}>
          <AppText weight={SEMI_BOLD} style={{ color: GOLD, fontSize: 12 }}>View</AppText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function AcceptQuoteModal({ open, desk, palette, onClose }) {
  const quote = desk.quote;
  if (!open || !quote) return null;
  const side = String(quote.side || desk.rfq?.side || "").toUpperCase();
  const base = String(quote.pair_base || "").toUpperCase();
  const pairQuote = String(quote.pair_quote || "").toUpperCase();
  const pair = base && pairQuote ? `${base}/${pairQuote}` : rfqPair(desk.rfq);
  const profit = profitOnGet(quote.get_amount, quote.fee_percent);
  const feePercent = String(quote.fee_percent == null ? "" : quote.fee_percent).trim();
  const hasProfit = feePercent !== "" && feePercent !== "0" && profit.fee && profit.fee !== "0";
  const receive = profit.net
    ? moneyLine(profit.net, quote.get_asset)
    : moneyLine(quote.get_amount, quote.get_asset);
  const rate = quote.rate
    ? (base && pairQuote ? `${quote.rate} ${pairQuote} per 1 ${base}` : String(quote.rate))
    : "—";
  const requestRate = String(desk.rfq?.request_rate || "").trim();
  const expired = Number(desk.countdownMs) <= 0;
  const isSell = side === "SELL";

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: palette.sheet, borderColor: palette.cardBorder }]}>
          <View style={styles.modalHead}>
            <View style={styles.flex1}>
              <AppText weight={MEDIUM} style={styles.kicker}>Desk quote</AppText>
              <AppText weight={BOLD} style={{ color: palette.text, fontSize: 22 }}>Accept quote</AppText>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <AppText weight={MEDIUM} style={{ color: palette.muted, fontSize: 28, lineHeight: 30 }}>×</AppText>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false} bounces={false}>
            <AppText style={{ color: palette.text, fontSize: 14, lineHeight: 20, marginBottom: 12 }}>
              {isSell
                ? `Sell ${pair}. You pay ${quote.pay_asset || ""} and receive ${quote.get_asset || ""}.`
                : `Buy ${pair}. You pay ${quote.pay_asset || ""} and receive ${quote.get_asset || ""}.`}
            </AppText>
            <View style={[styles.timerBox, { backgroundColor: expired ? palette.sellSoft : "rgba(209,170,103,0.14)" }]}>
              <AppText weight={SEMI_BOLD} style={{ color: expired ? palette.sell : GOLD, fontSize: 15 }}>
                {expired ? "This quote has expired" : `Expires in ${formatCountdown(desk.countdownMs)}`}
              </AppText>
              {quote.expiresAt ? (
                <AppText style={{ color: palette.muted, fontSize: 12, marginTop: 2 }}>{formatWhen(quote.expiresAt)}</AppText>
              ) : null}
            </View>
            <DetailRow label="Pair" value={pair} palette={palette} />
            <DetailRow label="Side" value={side || "—"} palette={palette} />
            <DetailRow label="You pay" value={moneyLine(quote.pay_amount, quote.pay_asset)} palette={palette} />
            <DetailRow label="Rate" value={rate} palette={palette} />
            {requestRate ? <DetailRow label="Your request rate" value={requestRate} palette={palette} /> : null}
            <DetailRow label="Quoted receive" value={moneyLine(quote.get_amount, quote.get_asset)} palette={palette} />
            <DetailRow
              label="Desk profit"
              value={hasProfit ? `${moneyLine(profit.fee, quote.get_asset)} (${feePercent}%)` : "None"}
              palette={palette}
            />
            <DetailRow label="You receive" value={receive} emphasize palette={palette} />
            <AppText style={{ color: palette.muted, fontSize: 12, lineHeight: 18, marginTop: 8 }}>
              Accepting locks the amount you pay until the desk settles this trade.
            </AppText>
          </ScrollView>
          <View style={styles.modalActions}>
            {desk.kycVerified ? (
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.acceptBtn, { backgroundColor: isSell ? palette.sell : palette.buy }, (desk.submitting || expired) && styles.btnDisabled]}
                disabled={desk.submitting || expired}
                onPress={desk.acceptQuote}
              >
                <AppText weight={SEMI_BOLD} style={styles.acceptBtnText}>
                  {desk.submitting ? "Accepting…" : "Accept quote"}
                </AppText>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity activeOpacity={0.85} style={[styles.acceptBtn, { backgroundColor: GOLD }]} onPress={desk.goToKyc}>
                <AppText weight={SEMI_BOLD} style={styles.acceptBtnText}>Submit Kyc</AppText>
              </TouchableOpacity>
            )}
            <TouchableOpacity activeOpacity={0.85} style={styles.laterBtn} onPress={onClose} disabled={desk.submitting}>
              <AppText weight={SEMI_BOLD} style={{ color: palette.text, fontSize: 15 }}>Not now</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function OptionSheet({ visible, title, options, selectedKey, onSelect, onClose, palette }) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const q = search.trim().toUpperCase();
    if (!q) return options;
    return options.filter((item) => String(item.key || "").toUpperCase().includes(q) || String(item.label || "").toUpperCase().includes(q));
  }, [options, search]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetOverlay} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: palette.sheet, borderColor: palette.cardBorder }]}>
        <View style={styles.modalHead}>
          <AppText weight={SEMI_BOLD} style={{ color: palette.text, fontSize: 18 }}>{title}</AppText>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <AppText style={{ color: palette.muted, fontSize: 26 }}>×</AppText>
          </TouchableOpacity>
        </View>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search"
          placeholderTextColor={palette.muted}
          autoCapitalize="characters"
          style={[styles.searchInput, { color: palette.text, borderColor: palette.inputBorder, backgroundColor: palette.input }]}
        />
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.key}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<AppText style={{ color: palette.muted, textAlign: "center", marginTop: 24 }}>No pairs found.</AppText>}
          renderItem={({ item }) => {
            const selected = item.key === selectedKey;
            return (
              <TouchableOpacity
                style={[styles.sheetItem, selected && { backgroundColor: "rgba(209,170,103,0.12)" }]}
                onPress={() => {
                  onSelect(item.key);
                  onClose();
                }}
              >
                <View style={styles.row}>
                  <CoinIcon coin={item.coin} style={styles.coinIcon} fallback={item.key === "USDT" ? tetherIcon : undefined} />
                  <AppText weight={SEMI_BOLD} style={{ color: palette.text, fontSize: 14 }}>{item.label}</AppText>
                </View>
                {selected ? <AppText weight={BOLD} style={{ color: GOLD }}>✓</AppText> : null}
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </Modal>
  );
}

const OtcTrade = () => {
  const route = useRoute();
  const desk = useOtcDesk(route.params?.otcDraft);
  const { isDark, colors: themeColors } = useTheme();
  const palette = buildPalette(isDark, themeColors);
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const headerTop = insets.top || (Platform.OS === "ios" ? 59 : StatusBar.currentHeight || 24);
  const chartRoom = windowHeight - headerTop - CHART_BAR_H - insets.bottom - 8;
  const chartOpenH = Math.min(chartRoom, Math.round(windowHeight * 0.58));
  const [pairOpen, setPairOpen] = useState(false);
  const [coinOpen, setCoinOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [bottomTab, setBottomTab] = useState("active");
  const [chartReady, setChartReady] = useState(false);
  const [chartOpen, setChartOpen] = useState(false);
  const [chartMounted, setChartMounted] = useState(false);
  const chartProgress = useRef(new Animated.Value(0)).current;
  const chartOpenRef = useRef(false);
  const openedQuoteId = useRef("");

  const [pairBase = "BTC", pairQuote = "USDT"] = String(desk.pairKey || "BTC/USDT").split("/");
  const isBuy = desk.quoteType === "buy";
  const coin = desk.amountAsset || pairBase;
  const amountValue = sanitizeAmount(desk.amount, 8);
  const amountReady = /^\d+(\.\d+)?$/.test(amountValue) && Number(amountValue) > 0 && !desk.amountError;
  const samePair = rfqPair(desk.rfq).toUpperCase() === String(desk.pairKey || "").toUpperCase();
  const requestBlocked = samePair && (desk.view === "awaiting" || desk.view === "quote");
  const liveQuoteId = desk.view === "quote" ? String(desk.quote?.id || "") : "";
  const exchangeData = useExchangeData();
  const liveTick = exchangeData?.ticker && typeof exchangeData.ticker === "object" ? exchangeData.ticker : null;
  const liveRaw = liveTick?.buy_price ?? liveTick?.last_price ?? liveTick?.last ?? liveTick?.price ?? liveTick?.c
    ?? exchangeData?.buy_price ?? exchangeData?.last_price ?? exchangeData?.price;
  const liveN = Number(String(liveRaw ?? "").replace(/,/g, ""));
  const snapshotN = Number(String(desk.ticker?.last || "").replace(/,/g, ""));
  const lastPrice = Number.isFinite(liveN) && liveN > 0 ? liveN : snapshotN;
  const formattedRate = lastPrice > 0
    ? lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "—";
  const liveChange = liveTick?.change_percentage ?? liveTick?.change ?? exchangeData?.change_percentage ?? desk.ticker?.change_percent;
  const changeN = Number(String(liveChange ?? "").replace(/,/g, ""));
  const chartUri = `${CHART_WEB_BASE_URL}chart/${isDark ? "dark" : "light"}/${pairBase}_${pairQuote}`;
  const amountCoin = desk.baseOptions.find((item) => item.symbol === coin);

  useEffect(() => {
    setChartReady(false);
  }, [chartUri]);

  const openHistoryPage = (tab) => {
    if (!desk.isLoggedIn) {
      desk.goToLogin();
      return;
    }
    NavigationService.navigate(OTC_HISTORY_SCREEN, { initialTab: tab === "active" ? "active" : "history" });
  };

  const setChartExpanded = (next) => {
    if (chartOpenRef.current === next) return;
    chartOpenRef.current = next;
    setChartOpen(next);
    if (next) setChartMounted(true);
    Animated.timing(chartProgress, {
      toValue: next ? 1 : 0,
      duration: 420,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const toggleChart = () => setChartExpanded(!chartOpenRef.current);

  const chartTranslateY = chartProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [chartOpenH, 0],
  });
  const priceUp = !(changeN < 0);
  const priceColor = priceUp ? palette.buy : palette.sell;
  const chartBorder = palette.cardBorder;

  useEffect(() => {
    if (!liveQuoteId) {
      setQuoteOpen(false);
      return;
    }
    if (openedQuoteId.current === liveQuoteId) return;
    openedQuoteId.current = liveQuoteId;
    setQuoteOpen(true);
  }, [liveQuoteId]);

  const rows = useMemo(() => buildOtcTableRows({
    tab: bottomTab,
    trades: desk.trades,
    rfq: desk.rfq,
    quote: desk.quote,
    trade: desk.trade,
    view: desk.view,
  }), [bottomTab, desk.trades, desk.rfq, desk.quote, desk.trade, desk.view]);
  const previewRows = rows.slice(0, PREVIEW_LIMIT);

  const pairItems = desk.pairOptions.map((item) => ({
    key: item.symbol,
    label: item.symbol,
    coin: { icon_path: item.iconPath, base_currency: item.symbol.split("/")[0] },
  }));
  const coinItems = (desk.baseOptions.length ? desk.baseOptions : [
    { symbol: pairBase, name: pairBase, iconPath: "" },
    { symbol: pairQuote, name: pairQuote, iconPath: "" },
  ]).map((item) => ({
    key: item.symbol,
    label: item.symbol,
    coin: { icon_path: item.iconPath, short_name: item.symbol, base_currency: item.symbol },
  }));

  const ticketStatus = desk.view === "expired"
    ? (String(desk.rfq?.status || "").toUpperCase() === "REJECTED_TIMEOUT" ? "REJECTED_TIMEOUT" : "EXPIRED")
    : (desk.rfq?.status || "—");
  const ticketSide = String(desk.rfq?.side || (isBuy ? "BUY" : "SELL")).toUpperCase();
  const ticketSell = ticketSide === "SELL";
  const ticketPay = desk.rfq ? moneyLine(desk.rfq.pay_amount, desk.rfq.pay_asset) : "—";
  const ticketGet = desk.quote
    ? moneyLine(desk.quote.get_amount, desk.quote.get_asset)
    : desk.rfq
      ? moneyLine(desk.rfq.get_amount, desk.rfq.get_asset)
      : "—";
  const ticketRate = desk.quote?.rate ? String(desk.quote.rate) : "Pending";
  const ticketLine = desk.view === "awaiting"
    ? (desk.requestLeftMs > 0 ? `Awaiting desk · ${formatLeft(desk.requestLeftMs)} left` : "Awaiting desk")
    : desk.view === "quote"
      ? (Number(desk.countdownMs) > 0 ? `Firm quote ready · ${formatLeft(desk.countdownMs)} left` : "Firm quote ready")
      : desk.view === "expired"
        ? "This request has closed. Send a new one when you are ready."
        : "Live request";

  const requestMessage = !requestBlocked
    ? ""
    : desk.view === "quote"
      ? `A firm ${desk.pairKey} quote is still open. Accept it or wait until it expires before sending another request.`
      : `You already have a ${desk.pairKey} quote request open. Cancel it or wait until it closes before sending another.`;

  return (
    <View style={[styles.flex1, { backgroundColor: palette.page }]}>
      <SystemBars style={isDark ? "light" : "dark"} />
      <View style={[styles.header, { paddingTop: headerTop, backgroundColor: palette.page }]}>
        <TouchableOpacity style={styles.headerSide} onPress={() => NavigationService.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <FastImage source={back_ic} style={styles.backIcon} tintColor={palette.text} resizeMode="contain" />
        </TouchableOpacity>
        <View style={styles.headerCenter} pointerEvents="none">
          <AppText weight={SEMI_BOLD} style={{ color: palette.text, fontSize: 17 }}>OTC Spot</AppText>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }} onPress={() => openHistoryPage("history")}>
            <FastImage source={historyIcon} style={styles.historyIcon} tintColor={palette.text} resizeMode="contain" />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.flex1}>
        <ScrollView
          style={styles.flex1}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.scrollContent, { paddingBottom: CHART_BAR_H + insets.bottom + 28 }]}
        >
          <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.cardBorder }]}>
            <AppText weight={BOLD} style={{ color: palette.text, fontSize: 18, marginBottom: 12 }}>OTC Trading</AppText>
            <View style={[styles.sideTabs, { backgroundColor: palette.chip }]}>
              <Pressable style={[styles.sideTab, isBuy && { backgroundColor: palette.buy }]} onPress={() => desk.setQuoteType("buy")}>
                <AppText weight={SEMI_BOLD} style={{ color: isBuy ? "#FFFFFF" : palette.muted }}>Buy</AppText>
              </Pressable>
              <Pressable style={[styles.sideTab, !isBuy && { backgroundColor: palette.sell }]} onPress={() => desk.setQuoteType("sell")}>
                <AppText weight={SEMI_BOLD} style={{ color: !isBuy ? "#FFFFFF" : palette.muted }}>Sell</AppText>
              </Pressable>
            </View>

            <View style={styles.amountHead}>
              <AppText weight={MEDIUM} style={{ color: palette.muted, fontSize: 13 }}>Amount</AppText>
              {desk.isLoggedIn ? (
                <AppText style={{ color: palette.muted, fontSize: 12, flexShrink: 1, textAlign: "right" }}>
                  Available: {formatAvail(desk.available)} {desk.availableAsset || (isBuy ? pairQuote : pairBase)}
                </AppText>
              ) : null}
            </View>
            <View style={[styles.amountBox, { borderColor: palette.inputBorder, backgroundColor: palette.input }]}>
              <TextInput
                value={amountValue}
                onChangeText={(text) => desk.setAmount(sanitizeAmount(text, 8))}
                placeholder={desk.minBase || "0"}
                placeholderTextColor={palette.muted}
                keyboardType="decimal-pad"
                style={[styles.amountInput, { color: palette.text }]}
              />
              <TouchableOpacity style={styles.coinPick} onPress={() => setCoinOpen(true)}>
                <CoinIcon
                  coin={amountCoin ? { icon_path: amountCoin.iconPath, short_name: coin, base_currency: coin } : { short_name: coin }}
                  style={styles.coinIcon}
                  fallback={coin === "USDT" ? tetherIcon : undefined}
                />
                <AppText weight={SEMI_BOLD} style={{ color: palette.text, fontSize: 14 }}>{coin}</AppText>
              </TouchableOpacity>
              <TouchableOpacity onPress={desk.onMax} hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}>
                <AppText weight={BOLD} style={{ color: GOLD, fontSize: 13 }}>MAX</AppText>
              </TouchableOpacity>
            </View>
            {desk.amountApprox ? (
              <AppText weight={MEDIUM} style={styles.approx}>{desk.amountApprox}</AppText>
            ) : desk.minQuoteLabel ? (
              <AppText weight={MEDIUM} style={styles.approx}>{desk.minQuoteLabel}</AppText>
            ) : null}
            {desk.amountError ? <AppText style={styles.error}>{desk.amountError}</AppText> : null}
            {!desk.amountError && desk.amountWarning ? <AppText style={styles.warning}>{desk.amountWarning}</AppText> : null}
            {requestMessage ? <AppText style={styles.warning}>{requestMessage}</AppText> : null}

            {desk.isLoggedIn && !desk.kycVerified ? (
              <TouchableOpacity activeOpacity={0.85} style={styles.requestBtn} onPress={desk.goToKyc}>
                <AppText weight={SEMI_BOLD} style={styles.requestBtnText}>Submit Kyc</AppText>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.requestBtn, (desk.submitting || requestBlocked || !amountReady) && styles.btnDisabled]}
                disabled={desk.submitting || requestBlocked || !amountReady}
                onPress={desk.submitRfq}
              >
                <AppText weight={SEMI_BOLD} style={styles.requestBtnText}>
                  {desk.submitting ? "Requesting…" : "Request for Quote"}
                </AppText>
              </TouchableOpacity>
            )}

            {desk.rfq ? (
              <View style={[styles.ticketStrip, { borderTopColor: palette.line }]}>
                <View style={styles.ticketTop}>
                  <View style={styles.flex1}>
                    <AppText weight={SEMI_BOLD} style={{ color: palette.text, fontSize: 14 }} numberOfLines={1}>
                      {rfqPair(desk.rfq)}
                    </AppText>
                    <AppText style={{ color: palette.muted, fontSize: 12, marginTop: 2 }} numberOfLines={2}>
                      {ticketLine}
                    </AppText>
                  </View>
                  <View style={styles.ticketPills}>
                    <View style={[styles.sidePill, { backgroundColor: ticketSell ? palette.sellSoft : palette.buySoft }]}>
                      <AppText weight={SEMI_BOLD} style={{ color: ticketSell ? palette.sell : palette.buy, fontSize: 11 }}>{ticketSide}</AppText>
                    </View>
                    <View style={[styles.badge, { backgroundColor: palette.goldSoft }]}>
                      <AppText weight={SEMI_BOLD} style={{ color: GOLD, fontSize: 11 }}>{ticketStatus}</AppText>
                    </View>
                  </View>
                </View>
                <View style={styles.ticketFacts}>
                  <View style={styles.ticketFact}>
                    <AppText style={{ color: palette.muted, fontSize: 11 }}>You pay</AppText>
                    <AppText weight={SEMI_BOLD} style={{ color: palette.text, fontSize: 13, marginTop: 2 }} numberOfLines={1}>{ticketPay}</AppText>
                  </View>
                  <View style={styles.ticketFact}>
                    <AppText style={{ color: palette.muted, fontSize: 11 }}>You get</AppText>
                    <AppText weight={SEMI_BOLD} style={{ color: palette.text, fontSize: 13, marginTop: 2 }} numberOfLines={1}>{ticketGet}</AppText>
                  </View>
                  <View style={styles.ticketFact}>
                    <AppText style={{ color: palette.muted, fontSize: 11 }}>Rate</AppText>
                    <AppText weight={SEMI_BOLD} style={{ color: palette.text, fontSize: 13, marginTop: 2 }} numberOfLines={1}>{ticketRate}</AppText>
                  </View>
                </View>
                {desk.view === "awaiting" ? (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={[styles.secondaryBtn, { borderColor: palette.inputBorder }]}
                    disabled={desk.submitting}
                    onPress={() => setCancelOpen(true)}
                  >
                    <AppText weight={SEMI_BOLD} style={{ color: palette.text, fontSize: 14 }}>
                      {desk.submitting ? "Cancelling…" : "Cancel request"}
                    </AppText>
                  </TouchableOpacity>
                ) : null}
                {desk.view === "quote" ? (
                  <TouchableOpacity activeOpacity={0.85} style={styles.requestBtn} onPress={() => setQuoteOpen(true)}>
                    <AppText weight={SEMI_BOLD} style={styles.requestBtnText}>Review quote</AppText>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}
          </View>

          <View style={styles.historyBlock}>
            <View style={[styles.histTabs, { borderBottomColor: palette.line }]}>
              <View style={styles.histTabGroup}>
                {[
                  { id: "active", label: "Active" },
                  { id: "history", label: "History" },
                ].map((tab) => {
                  const selected = bottomTab === tab.id;
                  return (
                    <Pressable key={tab.id} style={styles.histTab} onPress={() => setBottomTab(tab.id)}>
                      <AppText weight={SEMI_BOLD} style={{ color: selected ? palette.text : palette.muted, fontSize: 16 }}>
                        {tab.label}
                      </AppText>
                      {selected ? <View style={styles.histTabLine} /> : null}
                    </Pressable>
                  );
                })}
              </View>
              <TouchableOpacity
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.viewAllBtn}
                onPress={() => openHistoryPage(bottomTab)}
              >
                <AppText weight={SEMI_BOLD} style={styles.viewAllText}>View All</AppText>
              </TouchableOpacity>
            </View>
            {previewRows.length ? previewRows.map((row) => (
              <RecordCard
                key={row.id}
                row={row}
                tab={bottomTab}
                palette={palette}
                onView={() => NavigationService.navigate(OTC_HISTORY_PAGE_VIEW, { record: otcDetailRecord(row), section: bottomTab })}
                onCancel={row.source && String(row.view?.id || "") === String(desk.rfq?.id || "") ? () => setCancelOpen(true) : null}
              />
            )) : (
              <AppText style={{ color: palette.muted, textAlign: "center", marginTop: 18, marginBottom: 8 }}>
                {bottomTab === "active" ? "No open requests." : "No OTC history yet."}
              </AppText>
            )}
          </View>
        </ScrollView>
        </View>

        <Pressable
          pointerEvents={chartOpen ? "auto" : "none"}
          style={[styles.chartBackdrop, { bottom: chartOpenH + CHART_BAR_H + insets.bottom }]}
          onPress={() => setChartExpanded(false)}
        />
        <Animated.View
          pointerEvents={chartOpen ? "auto" : "none"}
          style={[
            styles.chartSheet,
            {
              height: chartOpenH,
              backgroundColor: palette.page,
              borderColor: chartBorder,
              bottom: CHART_BAR_H + insets.bottom,
              transform: [{ translateY: chartTranslateY }],
            },
          ]}
        >
            <View style={styles.chartHandleWrap}>
              <View style={[styles.chartHandle, { backgroundColor: chartBorder }]} />
            </View>
            <View style={[styles.chartWrap, { backgroundColor: palette.page }]} pointerEvents={chartOpen ? "auto" : "none"}>
              {chartMounted ? (
                <WebView
                  source={{ uri: chartUri }}
                  style={[styles.chart, { backgroundColor: palette.page }]}
                  onLoadEnd={() => setChartReady(true)}
                  scrollEnabled
                  nestedScrollEnabled
                  bounces={false}
                  showsVerticalScrollIndicator={false}
                  showsHorizontalScrollIndicator={false}
                  javaScriptEnabled
                  domStorageEnabled
                  originWhitelist={["*"]}
                  androidLayerType="hardware"
                  overScrollMode="never"
                />
              ) : null}
              {chartMounted && !chartReady ? (
                <View style={[styles.chartLoading, { backgroundColor: palette.page }]}>
                  <ActivityIndicator color={GOLD} />
                </View>
              ) : null}
            </View>
        </Animated.View>
        <View
          style={[
            styles.chartDock,
            {
              backgroundColor: palette.page,
              borderColor: chartOpen ? chartBorder : palette.line,
              borderTopWidth: chartOpen ? 0 : StyleSheet.hairlineWidth,
              borderLeftWidth: chartOpen ? 1 : 0,
              borderRightWidth: chartOpen ? 1 : 0,
              paddingBottom: insets.bottom,
            },
          ]}
        >
          <Pressable style={styles.chartBar} onPress={toggleChart}>
            <AppText weight={SEMI_BOLD} style={{ color: palette.text, fontSize: 15 }}>
              {desk.pairKey || "BTC/USDT"} Chart
            </AppText>
            <View style={styles.chartPrice}>
              <AppText weight={BOLD} style={{ color: formattedRate === "—" ? palette.muted : priceColor, fontSize: 16 }}>
                {formattedRate}
              </AppText>
              {formattedRate === "—" ? null : (
                <AppText style={{ color: priceColor, fontSize: 12, lineHeight: 14 }}>{priceUp ? "▲" : "▼"}</AppText>
              )}
            </View>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <AcceptQuoteModal open={quoteOpen && desk.view === "quote"} desk={desk} palette={palette} onClose={() => setQuoteOpen(false)} />
      {cancelOpen ? (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => {
            if (desk.submitting) return;
            setCancelOpen(false);
          }}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => {
              if (desk.submitting) return;
              setCancelOpen(false);
            }}
          >
            <Pressable style={[styles.modalCard, { backgroundColor: palette.sheet, borderColor: palette.cardBorder }]} onPress={() => {}}>
              <AppText weight={MEDIUM} style={styles.kicker}>Quote request</AppText>
              <AppText weight={BOLD} style={{ color: palette.text, fontSize: 20, marginBottom: 8 }}>Cancel this request?</AppText>
              <DetailRow label="Pair" value={rfqPair(desk.rfq)} palette={palette} />
              <DetailRow label="Side" value={desk.rfq?.side || "—"} palette={palette} />
              <DetailRow label="You pay" value={moneyLine(desk.rfq?.pay_amount, desk.rfq?.pay_asset)} palette={palette} />
              <TouchableOpacity
                style={[styles.acceptBtn, { backgroundColor: palette.sell, marginTop: 12 }, desk.submitting && styles.btnDisabled]}
                disabled={desk.submitting}
                onPress={async () => {
                  const cancelled = await desk.cancelRfq?.();
                  if (cancelled) setCancelOpen(false);
                }}
              >
                <AppText weight={SEMI_BOLD} style={styles.acceptBtnText}>{desk.submitting ? "Cancelling…" : "Cancel request"}</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.laterBtn}
                disabled={desk.submitting}
                onPress={() => setCancelOpen(false)}
              >
                <AppText weight={SEMI_BOLD} style={{ color: palette.text, fontSize: 15 }}>Keep request</AppText>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
      <OptionSheet
        visible={pairOpen}
        title="Select Pair"
        options={pairItems}
        selectedKey={desk.pairKey}
        onSelect={desk.onPairChange}
        onClose={() => setPairOpen(false)}
        palette={palette}
      />
      <OptionSheet
        visible={coinOpen}
        title="Amount coin"
        options={coinItems}
        selectedKey={coin}
        onSelect={desk.setAmountCoin}
        onClose={() => setCoinOpen(false)}
        palette={palette}
      />
    </View>
  );
};

export default OtcTrade;

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
  headerTitle: { flexDirection: "row", alignItems: "center", gap: 4 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 16 },
  backIcon: { width: 22, height: 22 },
  historyIcon: { width: 22, height: 22 },
  historyBlock: { marginTop: 4, paddingBottom: 8 },
  histTabs: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  histTabGroup: { flexDirection: "row", alignItems: "flex-end", gap: 26 },
  viewAllBtn: { paddingTop: 12, paddingBottom: 10, paddingLeft: 12 },
  viewAllText: { color: GOLD, fontSize: 13 },
  histTab: { paddingTop: 12, paddingBottom: 10, alignItems: "center" },
  histTabLine: {
    position: "absolute",
    bottom: -1,
    width: 26,
    height: 3,
    borderRadius: 2,
    backgroundColor: GOLD,
  },
  scrollContent: { flexGrow: 1, paddingBottom: 12 },
  chartBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
  },
  chartDock: { zIndex: 4 },
  chartSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    overflow: "hidden",
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    zIndex: 3,
  },
  chartHandleWrap: { alignItems: "center", paddingTop: 8, paddingBottom: 4 },
  chartHandle: { width: 42, height: 4, borderRadius: 2 },
  chartBar: {
    height: CHART_BAR_H,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chartPrice: { flexDirection: "row", alignItems: "center", gap: 3 },
  chartWrap: { flex: 1 },
  chart: { flex: 1 },
  chartLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    marginHorizontal: 12,
    marginBottom: 10,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  ticketStrip: { marginTop: 14, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  ticketTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  ticketPills: { flexDirection: "row", alignItems: "center", gap: 6 },
  ticketFacts: { flexDirection: "row", marginTop: 10, gap: 8 },
  ticketFact: { flex: 1, minWidth: 0 },
  sideTabs: { flexDirection: "row", borderRadius: 12, padding: 3, marginBottom: 12 },
  sideTab: { flex: 1, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  amountHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 8 },
  amountBox: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 8,
  },
  amountInput: { flex: 1, fontSize: 16, paddingVertical: 10 },
  coinPick: { flexDirection: "row", alignItems: "center", gap: 6 },
  coinIcon: { width: 22, height: 22, borderRadius: 11 },
  coinIconLg: { width: 28, height: 28, borderRadius: 14 },
  approx: { color: "#8B93A7", fontSize: 12, marginTop: 6 },
  error: { color: "#f6465d", fontSize: 12, marginTop: 6 },
  warning: { color: GOLD, fontSize: 12, lineHeight: 17, marginTop: 6 },
  requestBtn: {
    height: 48,
    borderRadius: 24,
    backgroundColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  requestBtnText: { color: "#1A1408", fontSize: 15 },
  secondaryBtn: {
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  btnDisabled: { opacity: 0.45 },
  spaceBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 7,
  },
  detailEmphasis: { marginTop: 4 },
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
  rowActions: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: 14, marginTop: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
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
    maxHeight: "86%",
  },
  modalHead: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8, gap: 8 },
  modalScroll: { maxHeight: 340 },
  kicker: { color: GOLD, fontSize: 12, letterSpacing: 0.4, marginBottom: 2 },
  timerBox: { borderRadius: 12, padding: 12, marginBottom: 8 },
  modalActions: { marginTop: 8 },
  acceptBtn: { height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  acceptBtnText: { color: "#FFFFFF", fontSize: 15 },
  laterBtn: { height: 44, alignItems: "center", justifyContent: "center" },
  sheetOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: {
    maxHeight: "70%",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    padding: 16,
    paddingBottom: 24,
  },
  searchInput: { height: 42, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, marginBottom: 8 },
  sheetItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
});
