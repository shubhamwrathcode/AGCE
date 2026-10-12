import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
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
import { useTheme } from "../../hooks/useTheme";
import { CHART_WEB_BASE_URL } from "../../helper/Constants";
import { back_ic, tetherIcon } from "../../helper/ImageAssets";
import { fontFamilyBold, fontFamilyMedium, fontFamilySemiBold } from "../../theme/typography";
import useOtcDesk from "./useOtcDesk";
import {
  formatAvail,
  formatCountdown,
  moneyLine,
  profitOnGet,
  sanitizeAmount,
} from "./otcDeskLogic";

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

const DARK = {
  page: "#12151B",
  card: "#1B2028",
  cardBorder: "rgba(255,255,255,0.08)",
  text: "#FFFFFF",
  muted: "#8B93A7",
  line: "rgba(255,255,255,0.08)",
  input: "#12151B",
  inputBorder: "#3A4150",
  sheet: "#1E232E",
  chip: "#2A3140",
};

const LIGHT = {
  page: "#F4F6F8",
  card: "#FFFFFF",
  cardBorder: "#E6EBF2",
  text: "#0F172A",
  muted: "#64748B",
  line: "#E6EBF2",
  input: "#FFFFFF",
  inputBorder: "#E2E8F0",
  sheet: "#FFFFFF",
  chip: "#F1F5F9",
};

const LIVE_STATUS = new Set(["OPEN", "QUOTED"]);
const LOCKED_STATUS = new Set(["PENDING_SETTLEMENT", "HELD"]);

function formatWhen(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatLeft(ms) {
  const total = Math.max(0, Math.ceil(Number(ms) / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function ticketLabel(id) {
  const text = String(id || "").trim();
  if (!text) return "—";
  return text.slice(-8).toUpperCase();
}

function rfqPair(row) {
  if (row?.pair_base && row?.pair_quote) return `${row.pair_base}/${row.pair_quote}`;
  const side = String(row?.side || "").toUpperCase();
  if (side === "SELL" && row?.pay_asset && row?.get_asset) return `${row.pay_asset}/${row.get_asset}`;
  if (row?.get_asset && row?.pay_asset) return `${row.get_asset}/${row.pay_asset}`;
  return "—";
}

function toTableRow(row, quote) {
  const status = String(row?.status || "—");
  const statusKey = status.toUpperCase();
  const quotedHere = quote && String(quote.rfq_id || quote.rfqId || "") === String(row?.id);
  const rate = quotedHere ? quote.rate : row?.rate;
  const sideRaw = String(row?.side || "").toUpperCase();
  const isTrade = LOCKED_STATUS.has(statusKey)
    || statusKey === "SETTLED"
    || statusKey === "VOID"
    || (row?.quote_id && row?.rfq_id && String(row.id) !== String(row.rfq_id));
  const settlement = statusKey === "SETTLED" || row?.settled_at
    ? "Settled"
    : statusKey === "PENDING_SETTLEMENT"
      ? "Pending"
      : statusKey === "HELD"
        ? "Held"
        : statusKey === "VOID"
          ? "Void"
          : "—";
  return {
    id: String(row?.id || rfqPair(row)),
    ticketId: ticketLabel(row?.id),
    date: formatWhen(row?.createdAt || row?.created_at),
    type: isTrade ? "Trade" : "RFQ",
    pair: rfqPair(row),
    side: sideRaw === "SELL" ? "Sell" : sideRaw === "BUY" ? "Buy" : "—",
    pay: moneyLine(row?.pay_amount, row?.pay_asset),
    receive: moneyLine(row?.net_get_amount || row?.get_amount, row?.get_asset),
    tradedAmount: isTrade || rate ? moneyLine(row?.net_get_amount || row?.get_amount, row?.get_asset) : "—",
    quotePrice: rate || "—",
    limitPrice: String(row?.request_rate || "").trim() || rate || "—",
    averagePrice: rate || "—",
    progress: statusKey === "QUOTED" ? "Quoted" : statusKey === "OPEN" ? "Open" : LOCKED_STATUS.has(statusKey) ? "Funds locked" : "—",
    filledTotal: statusKey === "OPEN" || statusKey === "QUOTED"
      ? `0 / ${moneyLine(row?.pay_amount, row?.pay_asset)}`
      : LOCKED_STATUS.has(statusKey)
        ? moneyLine(row?.pay_amount, row?.pay_asset)
        : "—",
    status,
    settlement,
    source: !isTrade && statusKey === "OPEN" ? row : null,
    view: {
      id: String(row?.id || ""),
      ticketId: ticketLabel(row?.id),
      pair: rfqPair(row),
      side: sideRaw === "SELL" ? "Sell" : sideRaw === "BUY" ? "Buy" : "—",
      pay: moneyLine(row?.pay_amount, row?.pay_asset),
      receive: moneyLine(row?.net_get_amount || row?.get_amount, row?.get_asset),
      status,
      requestRate: String(row?.request_rate || "").trim(),
      rate: rate || "",
      expiresAt: row?.expiresAt || (quotedHere ? quote?.expiresAt : null) || null,
      createdAt: row?.createdAt || row?.created_at || null,
    },
  };
}

function DetailRow({ label, value, emphasize, palette }) {
  return (
    <View style={[styles.detailRow, emphasize && styles.detailEmphasis]}>
      <AppText style={{ color: palette.muted, fontSize: 13, flex: 1 }}>{label}</AppText>
      <AppText
        weight={emphasize ? BOLD : SEMI_BOLD}
        style={{ color: emphasize ? GOLD : palette.text, fontSize: emphasize ? 15 : 13, flex: 1.2, textAlign: "right" }}
      >
        {value}
      </AppText>
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
            <View style={[styles.timerBox, { backgroundColor: expired ? "rgba(246,70,93,0.12)" : "rgba(209,170,103,0.14)" }]}>
              <AppText weight={SEMI_BOLD} style={{ color: expired ? "#f6465d" : GOLD, fontSize: 15 }}>
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
                style={[styles.acceptBtn, { backgroundColor: isSell ? "#f6465d" : "#20BF7A" }, (desk.submitting || expired) && styles.btnDisabled]}
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

function InfoModal({ title, kicker, rows, onClose, palette }) {
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.modalCard, { backgroundColor: palette.sheet, borderColor: palette.cardBorder }]} onPress={() => {}}>
          <View style={styles.modalHead}>
            <View style={styles.flex1}>
              {kicker ? <AppText weight={MEDIUM} style={styles.kicker}>{kicker}</AppText> : null}
              <AppText weight={BOLD} style={{ color: palette.text, fontSize: 20 }}>{title}</AppText>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <AppText weight={MEDIUM} style={{ color: palette.muted, fontSize: 28, lineHeight: 30 }}>×</AppText>
            </TouchableOpacity>
          </View>
          {rows.map((row) => (
            <DetailRow key={row.label} label={row.label} value={row.value} palette={palette} />
          ))}
        </Pressable>
      </Pressable>
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
  const { isDark } = useTheme();
  const palette = isDark ? DARK : LIGHT;
  const insets = useSafeAreaInsets();
  const headerTop = insets.top || (Platform.OS === "ios" ? 59 : StatusBar.currentHeight || 24);
  const [pairOpen, setPairOpen] = useState(false);
  const [coinOpen, setCoinOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [viewRow, setViewRow] = useState(null);
  const [bottomTab, setBottomTab] = useState("active");
  const [chartReady, setChartReady] = useState(false);
  const openedQuoteId = useRef("");

  const [pairBase = "BTC", pairQuote = "USDT"] = String(desk.pairKey || "BTC/USDT").split("/");
  const isBuy = desk.quoteType === "buy";
  const coin = desk.amountAsset || pairBase;
  const amountValue = sanitizeAmount(desk.amount, 8);
  const amountReady = /^\d+(\.\d+)?$/.test(amountValue) && Number(amountValue) > 0 && !desk.amountError;
  const samePair = rfqPair(desk.rfq).toUpperCase() === String(desk.pairKey || "").toUpperCase();
  const requestBlocked = samePair && (desk.view === "awaiting" || desk.view === "quote");
  const liveQuoteId = desk.view === "quote" ? String(desk.quote?.id || "") : "";
  const lastPrice = Number(String(desk.ticker?.last || "").replace(/,/g, ""));
  const formattedRate = lastPrice > 0
    ? lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "—";
  const changeN = Number(String(desk.ticker?.change_percent ?? "").replace(/,/g, ""));
  const changeText = Number.isFinite(changeN) && formattedRate !== "—"
    ? `${changeN > 0 ? "+" : ""}${changeN.toFixed(2)}%`
    : "";
  const chartUri = `${CHART_WEB_BASE_URL}chart/${isDark ? "dark" : "light"}/${pairBase}_${pairQuote}`;
  const amountCoin = desk.baseOptions.find((item) => item.symbol === coin);
  const headerCoin = desk.pairOptions.find((item) => item.symbol === desk.pairKey);

  useEffect(() => {
    setChartReady(false);
  }, [chartUri]);

  useEffect(() => {
    if (!liveQuoteId) {
      setQuoteOpen(false);
      return;
    }
    if (openedQuoteId.current === liveQuoteId) return;
    openedQuoteId.current = liveQuoteId;
    setQuoteOpen(true);
  }, [liveQuoteId]);

  const rows = useMemo(() => {
    const history = Array.isArray(desk.trades) ? desk.trades : [];
    const status = String(desk.rfq?.status || "").toUpperCase();
    const seen = new Set();
    const take = (row) => {
      if (!row) return false;
      const id = row.id ? String(row.id) : "";
      const rfqKey = row.rfq_id ? `rfq:${row.rfq_id}` : "";
      if ((id && seen.has(id)) || (rfqKey && seen.has(rfqKey))) return false;
      if (id) seen.add(id);
      if (rfqKey) seen.add(rfqKey);
      return true;
    };
    const liveStatus = (row) => LIVE_STATUS.has(String(row?.status || "").toUpperCase());
    const locked = (row) => LOCKED_STATUS.has(String(row?.status || "").toUpperCase());
    if (bottomTab === "active") {
      const list = [];
      if (desk.rfq && (desk.view === "awaiting" || desk.view === "quote") && take(desk.rfq)) {
        list.push({ ...desk.rfq, rate: desk.quote?.rate || desk.rfq.rate });
      }
      history.forEach((row) => {
        if ((liveStatus(row) || locked(row)) && take(row)) list.push(row);
      });
      if (locked(desk.trade) && take(desk.trade)) list.push(desk.trade);
      return list.map((row) => toTableRow(row, desk.quote));
    }
    const past = history.filter((row) => !locked(row) && !liveStatus(row));
    past.forEach((row) => {
      if (row?.id) seen.add(String(row.id));
      if (row?.rfq_id) seen.add(`rfq:${row.rfq_id}`);
    });
    const extras = [];
    if (desk.trade?.id && !locked(desk.trade) && !seen.has(String(desk.trade.id))) extras.push(desk.trade);
    if (desk.rfq?.id && (desk.view === "expired" || (status && status !== "OPEN" && status !== "QUOTED"))) {
      const closed = { ...desk.rfq, rate: desk.quote?.rate || desk.rfq.rate };
      if (!locked(closed) && !seen.has(String(desk.rfq.id)) && !seen.has(`rfq:${desk.rfq.id}`)) extras.push(closed);
    }
    return [...extras, ...past].map((row) => toTableRow(row, desk.quote));
  }, [bottomTab, desk.trades, desk.rfq, desk.quote, desk.trade, desk.view]);

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

  const requestMessage = !requestBlocked
    ? ""
    : desk.view === "quote"
      ? `A firm ${desk.pairKey} quote is still open. Accept it or wait until it expires before sending another request.`
      : `You already have a ${desk.pairKey} quote request open. Cancel it or wait until it closes before sending another.`;

  const ticketNote = !desk.rfq
    ? { title: "No open request", body: "Enter an amount and request a quote. The ticket updates from the desk." }
    : desk.view === "awaiting"
      ? {
        title: "Quote requested, awaiting desk",
        body: desk.rfq?.expiresAt
          ? `Your request is with the desk and stays valid until ${formatWhen(desk.rfq.expiresAt)}${desk.requestLeftMs > 0 ? ` · ${formatLeft(desk.requestLeftMs)} left` : ""}.`
          : "Your request is with the desk. This page checks status every few seconds until a quote is received.",
      }
      : desk.view === "quote"
        ? { title: "Firm quote ready", body: "The desk sent a quote. Review every detail in the popup and accept before it expires." }
        : desk.view === "expired"
          ? { title: "Request expired", body: "This request is no longer with the desk. Enter an amount to request a new quote." }
          : null;

  return (
    <View style={[styles.flex1, { backgroundColor: palette.page }]}>
      <SystemBars style={isDark ? "light" : "dark"} />
      <View style={[styles.header, { paddingTop: headerTop, backgroundColor: palette.card, borderBottomColor: palette.line }]}>
        <TouchableOpacity onPress={() => NavigationService.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <FastImage source={back_ic} style={styles.backIcon} tintColor={palette.text} resizeMode="contain" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerPair} activeOpacity={0.8} onPress={() => setPairOpen(true)}>
          <CoinIcon
            coin={headerCoin ? { icon_path: headerCoin.iconPath, short_name: pairBase, base_currency: pairBase } : { short_name: pairBase }}
            style={styles.coinIconLg}
            fallback={pairBase === "USDT" ? tetherIcon : undefined}
          />
          <View>
            <AppText weight={BOLD} style={{ color: palette.text, fontSize: 16 }}>{desk.pairKey || "BTC/USDT"}</AppText>
            <AppText style={{ color: palette.muted, fontSize: 11 }}>{headerCoin?.name || pairBase}</AppText>
          </View>
        </TouchableOpacity>
        <View style={styles.headerPrice}>
          <AppText weight={BOLD} style={{ color: changeN < 0 ? "#f6465d" : "#20BF7A", fontSize: 16 }}>{formattedRate}</AppText>
          {changeText ? (
            <AppText weight={SEMI_BOLD} style={{ color: changeN < 0 ? "#f6465d" : "#20BF7A", fontSize: 12 }}>{changeText}</AppText>
          ) : null}
        </View>
      </View>

      <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
        >
          <View style={[styles.chartWrap, { backgroundColor: palette.card }]}>
            <WebView
              source={{ uri: chartUri }}
              style={styles.chart}
              onLoadEnd={() => setChartReady(true)}
              scrollEnabled={false}
              javaScriptEnabled
              domStorageEnabled
              originWhitelist={["*"]}
            />
            {!chartReady ? (
              <View style={styles.chartLoading}>
                <ActivityIndicator color={GOLD} />
              </View>
            ) : null}
          </View>

          <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.cardBorder }]}>
            <AppText weight={BOLD} style={{ color: palette.text, fontSize: 18, marginBottom: 12 }}>OTC Trading</AppText>
            <View style={[styles.sideTabs, { backgroundColor: palette.chip }]}>
              <Pressable style={[styles.sideTab, isBuy && styles.buyTab]} onPress={() => desk.setQuoteType("buy")}>
                <AppText weight={SEMI_BOLD} style={{ color: isBuy ? "#FFFFFF" : palette.muted }}>Buy</AppText>
              </Pressable>
              <Pressable style={[styles.sideTab, !isBuy && styles.sellTab]} onPress={() => desk.setQuoteType("sell")}>
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
          </View>

          <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.cardBorder }]}>
            <View style={styles.spaceBetween}>
              <AppText weight={BOLD} style={{ color: palette.text, fontSize: 16 }}>Current Ticket</AppText>
              <View style={[styles.badge, { backgroundColor: palette.chip }]}>
                <AppText weight={SEMI_BOLD} style={{ color: GOLD, fontSize: 11 }}>{ticketStatus}</AppText>
              </View>
            </View>
            <DetailRow label="Ticker" value={desk.pairKey || "BTC/USDT"} palette={palette} />
            <DetailRow label="Order type" value="OTC RFQ" palette={palette} />
            <DetailRow label="Date" value={desk.rfq ? formatWhen(desk.rfq.createdAt) : "—"} palette={palette} />
            {desk.view === "awaiting" && desk.rfq?.expiresAt ? (
              <DetailRow
                label="Valid until"
                value={`${formatWhen(desk.rfq.expiresAt)}${desk.requestLeftMs > 0 ? ` · ${formatLeft(desk.requestLeftMs)} left` : " · closing"}`}
                palette={palette}
              />
            ) : null}
            {ticketNote ? (
              <View style={[styles.noteBox, { backgroundColor: palette.chip }]}>
                <AppText weight={SEMI_BOLD} style={{ color: palette.text, fontSize: 14 }}>{ticketNote.title}</AppText>
                <AppText style={{ color: palette.muted, fontSize: 13, lineHeight: 18, marginTop: 4 }}>{ticketNote.body}</AppText>
              </View>
            ) : null}
            <DetailRow label="Side" value={desk.rfq?.side || (isBuy ? "BUY" : "SELL")} palette={palette} />
            <DetailRow label="You pay" value={desk.rfq ? moneyLine(desk.rfq.pay_amount, desk.rfq.pay_asset) : "—"} palette={palette} />
            <DetailRow
              label="You get"
              value={desk.quote
                ? moneyLine(desk.quote.get_amount, desk.quote.get_asset)
                : desk.rfq
                  ? moneyLine(desk.rfq.get_amount, desk.rfq.get_asset)
                  : "—"}
              palette={palette}
            />
            <DetailRow label="Rate" value={desk.quote?.rate || "The desk sets the rate"} palette={palette} />
            {desk.quote?.expiresAt ? (
              <DetailRow
                label="Quote valid until"
                value={`${formatWhen(desk.quote.expiresAt)}${desk.view === "quote" ? ` · ${formatLeft(desk.countdownMs)} left` : ""}`}
                palette={palette}
              />
            ) : null}
            {desk.view === "awaiting" ? (
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.secondaryBtn, { borderColor: palette.inputBorder }]}
                disabled={desk.submitting}
                onPress={() => setCancelOpen(true)}
              >
                <AppText weight={SEMI_BOLD} style={{ color: palette.text, fontSize: 15 }}>
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

          <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.cardBorder }]}>
            <View style={[styles.sideTabs, { backgroundColor: palette.chip }]}>
              <Pressable style={[styles.sideTab, bottomTab === "active" && styles.goldTab]} onPress={() => setBottomTab("active")}>
                <AppText weight={SEMI_BOLD} style={{ color: bottomTab === "active" ? "#1A1408" : palette.muted, fontSize: 13 }}>
                  Active requests
                </AppText>
              </Pressable>
              <Pressable style={[styles.sideTab, bottomTab === "history" && styles.goldTab]} onPress={() => setBottomTab("history")}>
                <AppText weight={SEMI_BOLD} style={{ color: bottomTab === "history" ? "#1A1408" : palette.muted, fontSize: 13 }}>
                  History
                </AppText>
              </Pressable>
            </View>
            {rows.length ? rows.map((row) => (
              <View key={row.id} style={[styles.listCard, { borderColor: palette.line }]}>
                <View style={styles.spaceBetween}>
                  <AppText weight={SEMI_BOLD} style={{ color: palette.text, fontSize: 14 }}>{row.pair}</AppText>
                  <AppText weight={SEMI_BOLD} style={{ color: row.side === "Sell" ? "#f6465d" : "#20BF7A", fontSize: 13 }}>{row.side}</AppText>
                </View>
                <AppText style={{ color: palette.muted, fontSize: 12, marginTop: 4 }}>{row.date} · {row.ticketId}</AppText>
                <DetailRow label="Amount" value={row.pay} palette={palette} />
                <DetailRow label="Status" value={row.status} palette={palette} />
                {bottomTab === "history" ? (
                  <>
                    <DetailRow label="Traded amount" value={row.tradedAmount} palette={palette} />
                    <DetailRow label="Quote price" value={String(row.quotePrice)} palette={palette} />
                    <DetailRow label="Settlement" value={row.settlement} palette={palette} />
                  </>
                ) : (
                  <>
                    <DetailRow label="Limit price" value={String(row.limitPrice)} palette={palette} />
                    <DetailRow label="Progress" value={row.progress} palette={palette} />
                    <DetailRow label="Filled / Total" value={row.filledTotal} palette={palette} />
                  </>
                )}
                <View style={styles.rowActions}>
                  <TouchableOpacity onPress={() => setViewRow(row.view)}>
                    <AppText weight={SEMI_BOLD} style={{ color: GOLD, fontSize: 13 }}>View</AppText>
                  </TouchableOpacity>
                  {row.source && String(row.view?.id || "") === String(desk.rfq?.id || "") ? (
                    <TouchableOpacity onPress={() => setCancelOpen(true)}>
                      <AppText weight={SEMI_BOLD} style={{ color: "#f6465d", fontSize: 13 }}>Cancel</AppText>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            )) : (
              <AppText style={{ color: palette.muted, textAlign: "center", marginTop: 18, marginBottom: 8 }}>
                {bottomTab === "active" ? "No open requests." : "No OTC history yet."}
              </AppText>
            )}
          </View>
        </ScrollView>
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
                style={[styles.acceptBtn, { backgroundColor: "#f6465d", marginTop: 12 }, desk.submitting && styles.btnDisabled]}
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
      {viewRow ? (
        <InfoModal
          title={viewRow.pair || "RFQ"}
          kicker="Quote request"
          palette={palette}
          onClose={() => setViewRow(null)}
          rows={[
            { label: "Ticket", value: viewRow.ticketId },
            { label: "Side", value: viewRow.side },
            { label: "You pay", value: viewRow.pay },
            { label: "You get", value: viewRow.receive },
            { label: "Status", value: viewRow.status },
            { label: "Request rate", value: viewRow.requestRate || "—" },
            { label: "Desk rate", value: viewRow.rate || "The desk sets the rate" },
            { label: "Opened", value: formatWhen(viewRow.createdAt) },
            ...(viewRow.expiresAt ? [{ label: "Valid until", value: formatWhen(viewRow.expiresAt) }] : []),
          ]}
        />
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  backIcon: { width: 22, height: 22 },
  headerPair: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  headerPrice: { alignItems: "flex-end" },
  chartWrap: { height: 280, marginBottom: 10 },
  chart: { flex: 1, backgroundColor: "transparent" },
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
  sideTabs: { flexDirection: "row", borderRadius: 12, padding: 3, marginBottom: 12 },
  sideTab: { flex: 1, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  buyTab: { backgroundColor: "#20BF7A" },
  sellTab: { backgroundColor: "#f6465d" },
  goldTab: { backgroundColor: GOLD },
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
  noteBox: { borderRadius: 12, padding: 12, marginTop: 10 },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 7,
  },
  detailEmphasis: { marginTop: 4 },
  listCard: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 12, paddingTop: 12 },
  rowActions: { flexDirection: "row", justifyContent: "flex-end", gap: 18, marginTop: 4 },
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
