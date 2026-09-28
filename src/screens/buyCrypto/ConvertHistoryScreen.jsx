import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Share,
  Platform,
  NativeModules,
} from "react-native";
import FastImage from "react-native-fast-image";
import Clipboard from "@react-native-clipboard/clipboard";
import Toast from "react-native-simple-toast";
import {
  AppSafeAreaView,
  AppText,
  BOLD,
  SEMI_BOLD,
  MEDIUM,
  EIGHTEEN,
  SIXTEEN,
  FOURTEEN,
  THIRTEEN,
  TWELVE,
} from "../../shared";
import ShimmerBone from "../../shared/components/ShimmerBone";
import { colors } from "../../theme/colors";
import { useTheme } from "../../hooks/useTheme";
import {
  back_ic,
  closeIcon,
  copyIcon,
  downIcon,
  NO_NOTIFICATION_ICON_LIGHT,
  NO_NOTIFICATION_ICON,
} from "../../helper/ImageAssets";
import NavigationService from "../../navigation/NavigationService";
import { useAppSelector } from "../../store/hooks";
import { appOperation } from "../../appOperation";
import { NAVIGATION_BOTTOM_TAB_STACK, TRADE_SCREEN } from "../../navigation/routes";
import AnimatedBottomSheet from "../../common/AnimatedBottomSheet/AnimatedBottomSheet";
import { formatAedAmount } from "./convertHelpers";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const PAGE_SIZE = 20;

const TIME_FILTER_OPTIONS = [
  { value: "all", label: "All time" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All status" },
  { value: "BUY", label: "Buy" },
  { value: "SELL", label: "Sell" },
  { value: "EXECUTED", label: "Executed" },
  { value: "FAILED", label: "Failed" },
];

const STATUS_LABEL = {
  EXECUTED: "Executed",
  QUOTED: "Quoted",
  EXPIRED: "Expired",
  FAILED: "Failed",
};

const BADGE_TONES = {
  success: {
    dark: { bg: "#ecfdf31a", border: "#a7f3d024", text: "#0c935a" },
    light: { bg: "#ecfdf3", border: "#a7f3d0", text: "#0c935a" },
  },
  pending: {
    dark: { bg: "#fffbeb17", border: "#fde68a1a", text: "#cd7641" },
    light: { bg: "#fffbeb", border: "#fde68a", text: "#92400e" },
  },
  danger: {
    dark: { bg: "#fef2f2", border: "#fecaca", text: "#b42318" },
    light: { bg: "#fef2f2", border: "#fecaca", text: "#b42318" },
  },
  neutral: {
    dark: { bg: "rgba(148,163,184,0.12)", border: "rgba(148,163,184,0.22)", text: "#e2e8f0" },
    light: { bg: "#f1f5f9", border: "#e2e8f0", text: "#334155" },
  },
};

const STEP_COLORS = {
  success: { core: "#00C087", halo: "rgba(0, 192, 135, 0.18)", line: "rgba(0, 192, 135, 0.4)" },
  pending: { core: "#F59E0B", halo: "rgba(245, 158, 11, 0.28)", line: "rgba(245, 158, 11, 0.55)" },
  danger: { core: "#EF4444", halo: "rgba(239, 68, 68, 0.22)", line: "rgba(239, 68, 68, 0.5)" },
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function statusTone(status) {
  if (status === "EXECUTED") return "success";
  if (status === "QUOTED") return "pending";
  if (status === "EXPIRED") return "neutral";
  if (status === "FAILED") return "danger";
  return "neutral";
}

/** Same output as web `toLocaleString({ dateStyle: "medium", timeStyle: "short" })` — e.g. "Sep 28, 2026, 3:45 PM". */
function formatHistDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const h24 = d.getHours();
  const h12 = h24 % 12 || 12;
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}, ${h12}:${mm} ${h24 < 12 ? "AM" : "PM"}`;
}

function formatQuoteAmount(value, decimals) {
  const n = Number.parseFloat(String(value ?? "0").replace(/,/g, ""));
  if (!Number.isFinite(n)) return "0";
  const d = Number.isFinite(Number(decimals)) ? Math.max(0, Math.min(18, Number(decimals))) : 2;
  return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}

function feeBpsPercentLabel(feeBps) {
  const n = Number(feeBps);
  if (!Number.isFinite(n) || n < 0) return "";
  return `${(n / 100).toFixed(2)}%`;
}

function qtyPlaces(code) {
  return code === "AED" ? 2 : 6;
}

function mapTrade(item) {
  const status = String(item?.status || "").toUpperCase();
  const side = String(item?.side || "").toUpperCase();
  const spendCode = side === "BUY" ? item.quote_asset : item.base_asset;
  const receiveCode = side === "BUY" ? item.base_asset : item.quote_asset;
  return {
    id: String(item.id || item.quote_id || ""),
    createdAt: item.executed_at || item.created_at || null,
    dateLabel: formatHistDate(item.executed_at || item.created_at),
    createdLabel: formatHistDate(item.created_at),
    executedLabel: formatHistDate(item.executed_at),
    side,
    sideLabel: side === "SELL" ? "Sell" : "Buy",
    spend: item.you_spend || (side === "BUY" ? item.amount_aed : item.amount_crypto) || "0",
    spendCode: spendCode || "AED",
    receive: item.you_receive || (side === "BUY" ? item.amount_crypto : item.amount_aed) || "0",
    receiveCode: receiveCode || "USDT",
    fee: item.fee_aed || "0",
    feeType: String(item.fee_type || "").toUpperCase(),
    feeBps: item.fee_bps,
    rate: item.user_rate || item.cmc_rate || "",
    wallet: "Spot",
    status,
    statusLabel: STATUS_LABEL[status] || status || "—",
    statusTone: statusTone(status),
    asset: String(item.base_asset || "USDT").toUpperCase(),
  };
}

function spendLabel(row) {
  return `${formatQuoteAmount(row.spend, qtyPlaces(row.spendCode))} ${row.spendCode}`;
}

function receiveLabel(row) {
  return `${formatQuoteAmount(row.receive, qtyPlaces(row.receiveCode))} ${row.receiveCode}`;
}

function feeLabel(row) {
  const fee = formatAedAmount(row.fee);
  if (row.feeType === "BPS") {
    const pct = feeBpsPercentLabel(row.feeBps);
    return pct ? `${fee} AED (${pct})` : `${fee} AED`;
  }
  return `${fee} AED`;
}

function rowWithinTimeFilter(row, timeFilter) {
  if (!timeFilter || timeFilter === "all") return true;
  if (!row.createdAt) return true;
  const d = new Date(row.createdAt);
  if (Number.isNaN(d.getTime())) return true;
  const days = { "7d": 7, "30d": 30, "90d": 90 }[timeFilter];
  if (!days) return true;
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - days);
  return d >= cutoff;
}

function csvCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

const ConvertHistoryScreen = () => {
  const { colors: themeColors, isDark } = useTheme();
  const userData = useAppSelector((state) => state.auth.userData);
  const loggedIn = !!(userData?.id || userData?._id);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [timeFilter, setTimeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [detailRow, setDetailRow] = useState(null);
  const [exporting, setExporting] = useState(false);

  const detailSheetRef = useRef(null);
  const timePickerSheetRef = useRef(null);
  const statusPickerSheetRef = useRef(null);
  const detailRequestIdRef = useRef("");

  const loadPage = useCallback(
    async (nextPage, replace, isRefresh = false) => {
      if (!loggedIn) {
        setRows([]);
        setHasMore(false);
        setLoading(false);
        return;
      }
      if (isRefresh) {
        setRefreshing(true);
        setError(null);
      } else if (replace) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      const side = statusFilter === "BUY" || statusFilter === "SELL" ? statusFilter : undefined;
      const status = statusFilter === "FAILED" ? "FAILED" : "EXECUTED";
      const params = [
        `page=${nextPage}`,
        `limit=${PAGE_SIZE}`,
        `status=${encodeURIComponent(status)}`,
        side ? `side=${encodeURIComponent(side)}` : "",
      ]
        .filter(Boolean)
        .join("&");

      const res = await appOperation.customer.fiat_convert_trades(params).catch((e) => e);

      if (!res?.success) {
        if (replace) {
          setRows([]);
          setError(res?.message || res?.error?.message || "Could not load convert history.");
        }
        setHasMore(false);
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
        return;
      }

      const data = res.data || {};
      const mapped = (Array.isArray(data.items) ? data.items : []).map(mapTrade);
      setRows((prev) => (replace ? mapped : [...prev, ...mapped]));
      setPage(nextPage);
      setHasMore(!!data.has_more);
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    },
    [loggedIn, statusFilter]
  );

  useEffect(() => {
    loadPage(1, true);
  }, [loadPage]);

  const filteredRows = useMemo(
    () => rows.filter((row) => rowWithinTimeFilter(row, timeFilter)),
    [rows, timeFilter]
  );

  const openDetail = useCallback(async (row) => {
    setDetailRow(row);
    detailSheetRef.current?.open?.();
    if (!row?.id) return;
    detailRequestIdRef.current = row.id;
    const res = await appOperation.customer.fiat_convert_trade(row.id).catch(() => null);
    if (res?.success && res.data && detailRequestIdRef.current === row.id) {
      setDetailRow(mapTrade(res.data));
    }
  }, []);

  const closeDetail = () => {
    detailRequestIdRef.current = "";
    detailSheetRef.current?.close?.();
  };

  const handleCopy = (text) => {
    if (!text) return;
    Clipboard.setString(String(text));
    Toast.showWithGravity("Copied", Toast.SHORT, Toast.BOTTOM);
  };

  const handleBack = () => {
    NavigationService.navigate(NAVIGATION_BOTTOM_TAB_STACK, {
      screen: TRADE_SCREEN,
      params: { activeTab: "Buy Crypto" },
    });
  };

  const handleConvertAgain = (row) => {
    closeDetail();
    NavigationService.navigate(NAVIGATION_BOTTOM_TAB_STACK, {
      screen: TRADE_SCREEN,
      params: {
        activeTab: "Buy Crypto",
        convertSide: row.side === "SELL" ? "sell" : "buy",
        convertAsset: row.asset || "USDT",
        convertPresetKey: Date.now(),
      },
    });
  };

  const handleExportExcel = async () => {
    if (!filteredRows.length) {
      Toast.showWithGravity("No convert history to export.", Toast.SHORT, Toast.BOTTOM);
      return;
    }
    setExporting(true);
    try {
      const timeLabel = TIME_FILTER_OPTIONS.find((o) => o.value === timeFilter)?.label || "All time";
      const statusLabel = STATUS_FILTER_OPTIONS.find((o) => o.value === statusFilter)?.label || "All status";
      const headers = ["Date", "Side", "Amount", "Fee", "Wallet", "You receive", "Rate", "Status", "Reference"];
      const csvRows = filteredRows.map((row) =>
        [
          row.dateLabel,
          row.sideLabel,
          spendLabel(row),
          feeLabel(row),
          row.wallet,
          receiveLabel(row),
          row.rate ? `1 ${row.asset} ≈ ${row.rate} AED` : "",
          row.statusLabel,
          row.id,
        ]
          .map(csvCell)
          .join(",")
      );
      const csvContent = [
        "AGCE Convert History Statement",
        `Exported: ${new Date().toLocaleString()} | Filter: Time: ${timeLabel}, Status: ${statusLabel} | Records: ${filteredRows.length}`,
        "",
        headers.join(","),
        ...csvRows,
      ].join("\n");
      const fileName = `AGCE_Convert_History_${new Date().toISOString().slice(0, 10)}.csv`;

      if (Platform.OS === "android" && NativeModules.FileDownloadModule?.saveToDownloads) {
        await NativeModules.FileDownloadModule.saveToDownloads(fileName, csvContent, "text/csv");
        Toast.showWithGravity(`Downloaded ${fileName} to Downloads folder`, Toast.LONG, Toast.BOTTOM);
      } else {
        await Share.share({ title: fileName, message: csvContent });
      }
    } catch {
      Toast.showWithGravity("Could not export convert history.", Toast.SHORT, Toast.BOTTOM);
    } finally {
      setExporting(false);
    }
  };

  const textColor = isDark ? "#EAECEF" : "#1E2329";
  const subTextColor = isDark ? "#848E9C" : "#707A8A";
  const borderColor = isDark ? "#2B3139" : "#EAEAEA";
  const triggerBg = isDark ? "#181A20" : "#F3F3F3";
  const skeletonMode = loading && rows.length === 0 && !error;
  const exportDisabled = exporting || loading || filteredRows.length === 0;

  const renderBadge = (row) => {
    const tone = (BADGE_TONES[row.statusTone] || BADGE_TONES.neutral)[isDark ? "dark" : "light"];
    return (
      <View style={[styles.statusBadge, { backgroundColor: tone.bg, borderColor: tone.border }]}>
        <AppText type={TWELVE} weight={BOLD} color={tone.text}>
          {row.statusLabel}
        </AppText>
      </View>
    );
  };

  const renderKv = (label, value) => (
    <View style={styles.kvRow}>
      <AppText type={THIRTEEN} color={subTextColor}>
        {label}
      </AppText>
      <AppText type={THIRTEEN} weight={MEDIUM} color={textColor} style={styles.kvValue} numberOfLines={1}>
        {value}
      </AppText>
    </View>
  );

  const renderRow = ({ item: row, index }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => openDetail(row)}
      style={[styles.card, index > 0 && { borderTopWidth: 1, borderTopColor: borderColor }]}
    >
      <View style={styles.cardTop}>
        <AppText type={THIRTEEN} weight={SEMI_BOLD} color={textColor}>
          {row.dateLabel}
        </AppText>
        {renderBadge(row)}
      </View>
      {renderKv("Amount", spendLabel(row))}
      {renderKv("Fee", feeLabel(row))}
      {renderKv("Wallet", row.wallet)}
      {renderKv("You receive", receiveLabel(row))}
      <View style={styles.kvRow}>
        <AppText type={THIRTEEN} color={subTextColor}>
          Action
        </AppText>
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => openDetail(row)}
          style={[styles.reviewBtn, { borderColor: colors.orangeTheme }]}
        >
          <AppText type={TWELVE} weight={SEMI_BOLD} color={colors.orangeTheme}>
            Review
          </AppText>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderSkeleton = () => (
    <View>
      {Array.from({ length: 6 }, (_, i) => (
        <View key={i} style={[styles.card, i > 0 && { borderTopWidth: 1, borderTopColor: borderColor }]}>
          <View style={styles.cardTop}>
            <ShimmerBone width={140} height={14} borderRadius={4} />
            <ShimmerBone width={72} height={24} borderRadius={999} />
          </View>
          {[0, 1, 2, 3].map((k) => (
            <View key={k} style={styles.kvRow}>
              <ShimmerBone width={70} height={12} borderRadius={4} />
              <ShimmerBone width={110} height={12} borderRadius={4} />
            </View>
          ))}
          <View style={styles.kvRow}>
            <ShimmerBone width={50} height={12} borderRadius={4} />
            <ShimmerBone width={72} height={30} borderRadius={999} />
          </View>
        </View>
      ))}
    </View>
  );

  const renderEmpty = () => {
    if (skeletonMode) return renderSkeleton();
    if (error) {
      return (
        <View style={styles.stateWrap}>
          <AppText type={FOURTEEN} color={subTextColor} style={styles.stateText}>
            {error}
          </AppText>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => loadPage(1, true)}
            style={[styles.outlineBtn, { borderColor: colors.orangeTheme }]}
          >
            <AppText type={THIRTEEN} weight={SEMI_BOLD} color={colors.orangeTheme}>
              Try again
            </AppText>
          </TouchableOpacity>
        </View>
      );
    }
    if (loading) return null;
    return (
      <View style={styles.stateWrap}>
        <FastImage
          source={isDark ? NO_NOTIFICATION_ICON_LIGHT : NO_NOTIFICATION_ICON}
          style={styles.emptyImg}
          resizeMode="contain"
        />
        <AppText type={FOURTEEN} color={subTextColor} style={styles.stateText}>
          No converts yet. Confirm a convert to add it here.
        </AppText>
      </View>
    );
  };

  const renderFooter = () => {
    if (!hasMore || error || filteredRows.length === 0) return null;
    return (
      <View style={styles.moreWrap}>
        <TouchableOpacity
          activeOpacity={0.75}
          disabled={loadingMore}
          onPress={() => loadPage(page + 1, false)}
          style={[styles.outlineBtn, { borderColor: colors.orangeTheme, opacity: loadingMore ? 0.45 : 1 }]}
        >
          <AppText type={THIRTEEN} weight={SEMI_BOLD} color={colors.orangeTheme}>
            {loadingMore ? "Loading…" : "Load more"}
          </AppText>
        </TouchableOpacity>
      </View>
    );
  };

  const renderDropdown = (label, value, options, sheetRef) => (
    <View style={styles.ddCol}>
      <AppText type={TWELVE} color={subTextColor} style={styles.ddLabel}>
        {label}
      </AppText>
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => sheetRef.current?.open?.()}
        style={[styles.ddTrigger, { backgroundColor: triggerBg, borderColor }]}
      >
        <AppText type={THIRTEEN} weight={MEDIUM} color={textColor} numberOfLines={1} style={styles.ddValue}>
          {(options.find((o) => o.value === value) || options[0]).label}
        </AppText>
        <FastImage source={downIcon} style={styles.ddChevron} resizeMode="contain" tintColor={subTextColor} />
      </TouchableOpacity>
    </View>
  );

  const renderPickerSheet = (sheetRef, title, value, options, onChange, height) => (
    <AnimatedBottomSheet ref={sheetRef} sheetHeight={height} isDark={isDark}>
      <View style={styles.sheetInner}>
        <View style={styles.sheetHeader}>
          <AppText type={SIXTEEN} weight={BOLD} color={textColor}>
            {title}
          </AppText>
          <TouchableOpacity
            onPress={() => sheetRef.current?.close?.()}
            style={styles.closeBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <FastImage source={closeIcon} style={styles.closeIcon} resizeMode="contain" tintColor={subTextColor} />
          </TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {options.map((opt) => {
            const active = value === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                activeOpacity={0.7}
                onPress={() => {
                  onChange(opt.value);
                  sheetRef.current?.close?.();
                }}
                style={[
                  styles.optionRow,
                  { borderBottomColor: borderColor },
                  active && { backgroundColor: "rgba(209,170,103,0.16)" },
                ]}
              >
                <AppText
                  type={FOURTEEN}
                  weight={active ? BOLD : MEDIUM}
                  color={active ? colors.orangeTheme : textColor}
                >
                  {opt.label}
                </AppText>
                {active ? (
                  <AppText type={FOURTEEN} weight={BOLD} color={colors.orangeTheme}>
                    ✓
                  </AppText>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </AnimatedBottomSheet>
  );

  const renderDetail = () => {
    if (!detailRow) return null;
    const outcome =
      detailRow.statusTone === "success" ? "success" : detailRow.statusTone === "danger" ? "danger" : "pending";
    const doneStep = STEP_COLORS.success;
    const lastStep = STEP_COLORS[outcome];
    const fields = [
      { label: "Status", value: detailRow.statusLabel },
      { label: "Date", value: detailRow.dateLabel },
      { label: "Side", value: detailRow.sideLabel },
      { label: "You spend", value: spendLabel(detailRow) },
      { label: "You receive", value: receiveLabel(detailRow) },
      { label: "Fee", value: feeLabel(detailRow) },
      { label: "Rate", value: detailRow.rate ? `1 ${detailRow.asset} ≈ ${detailRow.rate} AED` : "" },
      { label: "Wallet", value: detailRow.wallet },
      { label: "Reference", value: detailRow.id, copy: true },
    ].filter((f) => f.value && f.value !== "—");

    return (
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={[styles.stepper, { borderBottomColor: borderColor }]}>
          <View style={styles.stepRow}>
            <View style={styles.stepTrack}>
              <View style={[styles.stepHalo, { backgroundColor: doneStep.halo }]}>
                <View style={[styles.stepCore, { backgroundColor: doneStep.core }]} />
              </View>
              <View style={[styles.stepLine, { backgroundColor: lastStep.line }]} />
            </View>
            <View style={[styles.stepText, { paddingBottom: 16 }]}>
              <AppText type={FOURTEEN} weight={BOLD} color={textColor}>
                Convert requested
              </AppText>
              <AppText type={TWELVE} color={subTextColor} style={{ marginTop: 2 }}>
                {detailRow.createdLabel !== "—" ? detailRow.createdLabel : detailRow.dateLabel}
              </AppText>
            </View>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepTrack}>
              <View style={[styles.stepHalo, { backgroundColor: lastStep.halo }]}>
                <View style={[styles.stepCore, { backgroundColor: lastStep.core }]} />
              </View>
            </View>
            <View style={styles.stepText}>
              <AppText type={FOURTEEN} weight={BOLD} color={textColor}>
                {detailRow.statusLabel}
              </AppText>
              <AppText type={TWELVE} color={subTextColor} style={{ marginTop: 2 }}>
                {detailRow.executedLabel !== "—" ? detailRow.executedLabel : detailRow.dateLabel}
              </AppText>
            </View>
          </View>
        </View>

        <View style={styles.detailList}>
          {fields.map((f) => (
            <View key={f.label} style={styles.detailRow}>
              <AppText type={THIRTEEN} color={subTextColor} style={styles.detailLabel}>
                {f.label}
              </AppText>
              <View style={styles.detailValueWrap}>
                <AppText
                  type={THIRTEEN}
                  weight={BOLD}
                  color={textColor}
                  numberOfLines={1}
                  ellipsizeMode={f.copy ? "middle" : "tail"}
                  style={styles.detailValue}
                >
                  {f.value}
                </AppText>
                {f.copy ? (
                  <TouchableOpacity
                    onPress={() => handleCopy(f.value)}
                    style={[
                      styles.copyBtn,
                      { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6", borderColor },
                    ]}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    activeOpacity={0.7}
                  >
                    <FastImage source={copyIcon} style={styles.copyIcon} resizeMode="contain" tintColor={subTextColor} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.againLink} activeOpacity={0.7} onPress={() => handleConvertAgain(detailRow)}>
          <AppText type={FOURTEEN} weight={SEMI_BOLD} color={colors.orangeTheme}>
            {detailRow.side === "SELL" ? `Sell ${detailRow.asset} again` : `Buy ${detailRow.asset} again`}
          </AppText>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return (
    <AppSafeAreaView style={{ backgroundColor: themeColors.background, flex: 1 }}>
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <TouchableOpacity
          onPress={handleBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.headerBtn}
        >
          <FastImage
            source={back_ic}
            style={styles.backIcon}
            resizeMode={FastImage.resizeMode.contain}
            tintColor={textColor}
          />
        </TouchableOpacity>
        <AppText type={EIGHTEEN} weight={SEMI_BOLD} color={textColor}>
          Convert history
        </AppText>
        <View style={styles.headerSpacer} />
      </View>

      <View style={[styles.filtersRow, { borderBottomColor: borderColor }]}>
        {renderDropdown("Time", timeFilter, TIME_FILTER_OPTIONS, timePickerSheetRef)}
        {renderDropdown("Status", statusFilter, STATUS_FILTER_OPTIONS, statusPickerSheetRef)}
        <TouchableOpacity
          activeOpacity={0.75}
          disabled={exportDisabled}
          onPress={handleExportExcel}
          style={[styles.exportBtn, { borderColor: colors.orangeTheme, opacity: exportDisabled ? 0.45 : 1 }]}
        >
          {exporting ? (
            <ActivityIndicator size="small" color={colors.orangeTheme} />
          ) : (
            <AppText type={THIRTEEN} weight={SEMI_BOLD} color={colors.orangeTheme}>
              Export Excel
            </AppText>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={skeletonMode ? [] : filteredRows}
        keyExtractor={(row, idx) => row.id || String(idx)}
        renderItem={renderRow}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadPage(1, true, true)}
            tintColor={colors.orangeTheme}
          />
        }
      />

      <AnimatedBottomSheet ref={detailSheetRef} sheetHeight={Math.min(SCREEN_HEIGHT * 0.8, 600)} isDark={isDark}>
        <View style={styles.sheetInner}>
          <View style={styles.sheetHeader}>
            <AppText type={EIGHTEEN} weight={BOLD} color={textColor}>
              Convert details
            </AppText>
            <TouchableOpacity
              onPress={closeDetail}
              style={styles.closeBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <FastImage source={closeIcon} style={styles.closeIcon} resizeMode="contain" tintColor={subTextColor} />
            </TouchableOpacity>
          </View>
          {renderDetail()}
        </View>
      </AnimatedBottomSheet>

      {renderPickerSheet(timePickerSheetRef, "Time", timeFilter, TIME_FILTER_OPTIONS, setTimeFilter, 300)}
      {renderPickerSheet(statusPickerSheetRef, "Status", statusFilter, STATUS_FILTER_OPTIONS, setStatusFilter, 360)}
    </AppSafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    padding: 6,
  },
  backIcon: {
    width: 18,
    height: 18,
  },
  headerSpacer: {
    width: 30,
  },
  filtersRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  ddCol: {
    flex: 1,
  },
  ddLabel: {
    fontSize: 11,
    marginBottom: 6,
    paddingLeft: 2,
  },
  ddTrigger: {
    height: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  ddValue: {
    flex: 1,
    marginRight: 4,
  },
  ddChevron: {
    width: 10,
    height: 10,
  },
  exportBtn: {
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  card: {
    paddingVertical: 16,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 8,
  },
  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  kvRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 6,
  },
  kvValue: {
    flexShrink: 1,
    textAlign: "right",
  },
  reviewBtn: {
    minHeight: 32,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stateWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyImg: {
    width: 100,
    height: 100,
    marginBottom: 12,
  },
  stateText: {
    textAlign: "center",
    marginBottom: 14,
  },
  outlineBtn: {
    height: 38,
    paddingHorizontal: 18,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  moreWrap: {
    alignItems: "center",
    paddingVertical: 16,
  },
  sheetInner: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  closeBtn: {
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  closeIcon: {
    width: 14,
    height: 14,
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  stepper: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },
  stepRow: {
    flexDirection: "row",
  },
  stepTrack: {
    width: 20,
    alignItems: "center",
  },
  stepHalo: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  stepCore: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stepLine: {
    width: 2,
    flex: 1,
    minHeight: 28,
    marginVertical: 2,
    borderRadius: 1,
  },
  stepText: {
    flex: 1,
    paddingLeft: 12,
  },
  detailList: {
    marginTop: 4,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 9,
    gap: 12,
  },
  detailLabel: {
    flexShrink: 0,
  },
  detailValueWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    maxWidth: "70%",
  },
  detailValue: {
    flexShrink: 1,
    textAlign: "right",
  },
  copyBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  copyIcon: {
    width: 13,
    height: 13,
  },
  againLink: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default ConvertHistoryScreen;
