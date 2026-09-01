import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import FastImage from "react-native-fast-image";
import Clipboard from "@react-native-clipboard/clipboard";
import Toast from "react-native-simple-toast";
import { useTheme } from "../../hooks/useTheme";
import { colors } from "../../theme/colors";
import { appOperation } from "../../appOperation";
import NavigationService from "../../navigation/NavigationService";
import {
  back_ic,
  closeIcon,
  NO_NOTIFICATION_ICON,
  NO_NOTIFICATION_ICON_LIGHT,
} from "../../helper/ImageAssets";
import AnimatedBottomSheet from "../../common/AnimatedBottomSheet/AnimatedBottomSheet";
import {
  AppSafeAreaView,
  AppText,
  BOLD,
  SEMI_BOLD,
  MEDIUM,
  TWENTY_FOUR,
  EIGHTEEN,
  FIFTEEN,
  FOURTEEN,
  THIRTEEN,
  TWELVE,
} from "../../shared";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const TIME_FILTER_OPTIONS = [
  { value: "all", label: "All time" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All status" },
  { value: "AWAITING_ADMIN", label: "Under review" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "INITIATED", label: "Sent to bank" },
  { value: "COMPLETED", label: "Completed" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "FAILED", label: "Failed" },
  { value: "REVERSED", label: "Reversed" },
];

const STATUS_CONFIG = {
  COMPLETED: {
    label: "Completed",
    darkText: "#10B981",
    darkBg: "rgba(16,185,129,0.15)",
    lightText: "#059669",
    lightBg: "#D1FAE5",
  },
  PROCESSED: {
    label: "Completed",
    darkText: "#10B981",
    darkBg: "rgba(16,185,129,0.15)",
    lightText: "#059669",
    lightBg: "#D1FAE5",
  },
  AWAITING_ADMIN: {
    label: "Under review",
    darkText: "#F59E0B",
    darkBg: "rgba(245,158,11,0.15)",
    lightText: "#D97706",
    lightBg: "#FEF3C7",
  },
  SUBMITTED: {
    label: "Submitted",
    darkText: "#F59E0B",
    darkBg: "rgba(245,158,11,0.15)",
    lightText: "#D97706",
    lightBg: "#FEF3C7",
  },
  INITIATED: {
    label: "Sent to bank",
    darkText: "#3B82F6",
    darkBg: "rgba(59,130,246,0.15)",
    lightText: "#2563EB",
    lightBg: "#DBEAFE",
  },
  REJECTED: {
    label: "Rejected",
    darkText: "#EF4444",
    darkBg: "rgba(239,68,68,0.15)",
    lightText: "#DC2626",
    lightBg: "#FEE2E2",
  },
  CANCELLED: {
    label: "Cancelled",
    darkText: "#A1A1AA",
    darkBg: "rgba(255,255,255,0.08)",
    lightText: "#64748B",
    lightBg: "#F1F5F9",
  },
  FAILED: {
    label: "Failed",
    darkText: "#EF4444",
    darkBg: "rgba(239,68,68,0.15)",
    lightText: "#DC2626",
    lightBg: "#FEE2E2",
  },
  REVERSED: {
    label: "Reversed",
    darkText: "#EF4444",
    darkBg: "rgba(239,68,68,0.15)",
    lightText: "#DC2626",
    lightBg: "#FEE2E2",
  },
};

function isUserCancelled(item, status) {
  if (String(status || item?.status || "").toUpperCase() !== "REJECTED") return false;
  if (String(item?.status_label || "") === "Cancelled") return true;
  const reason = String(item?.reject_reason || item?.status_reason || "").trim();
  return reason === "Cancelled by user" || /^you cancelled this withdrawal/i.test(reason);
}

function mapFiatWithdrawRow(item) {
  const status = String(item?.status || "").toUpperCase();
  const cancelled = isUserCancelled(item, status);
  let statusLabel = item?.status_label || status || "—";
  if (cancelled) statusLabel = "Cancelled";
  else if (status === "REJECTED" && (statusLabel === "Declined" || !item?.status_label)) {
    statusLabel = "Rejected";
  }
  return {
    ...item,
    status,
    statusLabel,
    cancelled,
  };
}

function formatHistDateHeader(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const day = d.getDate();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day} ${month} ${year}, ${hours}:${minutes}`;
}

function formatAedAmount(val) {
  const n = Number(val);
  if (!Number.isFinite(n)) return String(val || "0.00");
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatBankLabel(item) {
  const ben = item?.whitelist || item?.beneficiary || null;
  const iban = String(item?.creditor_iban || ben?.iban || "").trim();
  if (iban && iban.length > 8) {
    return `${iban.slice(0, 4)}****${iban.slice(-4)}`;
  }
  const last4 = String(item?.creditor_iban_last4 || item?.iban_last4 || ben?.iban_last4 || "").trim();
  if (last4) return `AE80****${last4}`;
  return item?.bank_name || ben?.bank_name || "—";
}

const WithdrawFiatHistoryScreen = () => {
  const { colors: themeColors, isDark } = useTheme();

  // History State
  const [historyList, setHistoryList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [timeFilter, setTimeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTx, setSelectedTx] = useState(null);
  const [copiedField, setCopiedField] = useState("");
  const [cancellingId, setCancellingId] = useState("");

  const txDetailSheetRef = useRef(null);
  const cancelConfirmSheetRef = useRef(null);
  const [targetCancelItem, setTargetCancelItem] = useState(null);

  // Fetch Withdrawal History (Exact Web API Mapping)
  const fetchWithdrawalsHistory = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setHistoryLoading(true);

    try {
      const apiStatus =
        statusFilter === "all"
          ? ""
          : statusFilter === "CANCELLED"
            ? "REJECTED"
            : statusFilter;
      const query = apiStatus ? `status=${encodeURIComponent(apiStatus)}` : "";
      const res = await appOperation.customer.fiat_withdrawals_list(query).catch(() => null);
      if (res?.success && res?.data) {
        const items = Array.isArray(res.data) ? res.data : res.data.items || [];
        setHistoryList(items);
      } else {
        setHistoryList([]);
      }
    } catch {
      setHistoryList([]);
    } finally {
      setHistoryLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchWithdrawalsHistory();
  }, [fetchWithdrawalsHistory]);

  const onRefresh = () => {
    fetchWithdrawalsHistory(true);
  };

  // Copy to clipboard helper
  const handleCopy = (text, fieldName, label) => {
    if (!text) return;
    Clipboard.setString(String(text));
    setCopiedField(fieldName);
    Toast.showWithGravity(`${label} copied`, Toast.SHORT, Toast.BOTTOM);
    setTimeout(() => {
      setCopiedField((cur) => (cur === fieldName ? "" : cur));
    }, 2000);
  };

  // Handle Cancel Withdrawal Click
  const handleCancelClick = (item) => {
    const status = String(item.status || "").toUpperCase();
    if (status === "AWAITING_ADMIN" || status === "SUBMITTED") {
      setTargetCancelItem(item);
      cancelConfirmSheetRef.current?.open?.();
    } else {
      Toast.showWithGravity(`Cannot cancel withdrawal with status: ${status}`, Toast.SHORT, Toast.BOTTOM);
    }
  };

  // Confirm Cancel API Call
  const handleConfirmCancelWithdrawal = async () => {
    if (!targetCancelItem) return;
    const targetId = targetCancelItem.id || targetCancelItem._id;
    setCancellingId(targetId);
    try {
      const res = await appOperation.customer.fiat_withdrawals_cancel(targetId).catch((e) => e);
      if (res?.success) {
        cancelConfirmSheetRef.current?.close?.();
        txDetailSheetRef.current?.close?.();
        Toast.showWithGravity(res?.withdrawal?.status_label || "Withdrawal cancelled successfully", Toast.LONG, Toast.BOTTOM);
        setTargetCancelItem(null);
        await fetchWithdrawalsHistory(true);
      } else {
        Toast.showWithGravity(res?.message || "Could not cancel withdrawal", Toast.SHORT, Toast.BOTTOM);
      }
    } catch {
      Toast.showWithGravity("Could not cancel withdrawal", Toast.SHORT, Toast.BOTTOM);
    } finally {
      setCancellingId("");
    }
  };

  // Filtered History (Exact Web Filtering Parity)
  const filteredHistory = useMemo(() => {
    return historyList.map(mapFiatWithdrawRow).filter((row) => {
      if (timeFilter !== "all") {
        const iso = row?.created_at;
        if (iso) {
          const d = new Date(iso);
          if (!Number.isNaN(d.getTime())) {
            const days = { "7d": 7, "30d": 30, "90d": 90 }[timeFilter];
            if (days) {
              const cutoff = new Date();
              cutoff.setHours(0, 0, 0, 0);
              cutoff.setDate(cutoff.getDate() - days);
              if (d < cutoff) return false;
            }
          }
        }
      }
      if (statusFilter === "CANCELLED") return row.cancelled;
      if (statusFilter === "REJECTED") return row.status === "REJECTED" && !row.cancelled;
      return true;
    });
  }, [historyList, timeFilter, statusFilter]);

  // Color tokens
  const bgColor = themeColors.background;
  const itemBorderColor = isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0";
  const headerBorderColor = isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0";
  const textColor = isDark ? "#FFFFFF" : "#0F172A";
  const subTextColor = isDark ? "rgba(255,255,255,0.55)" : "#64748B";
  const badgePillBg = isDark ? "rgba(255,255,255,0.06)" : "#EDF2F7";

  return (
    <AppSafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: headerBorderColor }]}>
        <TouchableOpacity
          onPress={() => NavigationService.goBack()}
          style={styles.headerBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <FastImage
            source={back_ic}
            style={styles.backIcon}
            resizeMode={FastImage.resizeMode.contain}
            tintColor={textColor}
          />
        </TouchableOpacity>
        <AppText type={EIGHTEEN} weight={BOLD} color={textColor}>
          Withdrawal History
        </AppText>
        <View style={styles.headerRightSpacer} />
      </View>

      {/* Filter Tabs Container */}
      <View style={[styles.filtersContainer, { borderBottomColor: headerBorderColor }]}>
        {/* Time Filters - Equal Width Row */}
        <View style={styles.timeFiltersRow}>
          {TIME_FILTER_OPTIONS.map((tf) => {
            const active = timeFilter === tf.value;
            return (
              <TouchableOpacity
                key={tf.value}
                onPress={() => setTimeFilter(tf.value)}
                style={[
                  styles.timeFilterBtn,
                  {
                    backgroundColor: active
                      ? (isDark ? "rgba(209,170,103,0.18)" : "#FFFDF5")
                      : badgePillBg,
                    borderColor: active ? colors.orangeTheme : itemBorderColor,
                  },
                ]}
                activeOpacity={0.75}
              >
                <AppText
                  type={TWELVE}
                  weight={active ? BOLD : MEDIUM}
                  color={active ? colors.orangeTheme : subTextColor}
                  numberOfLines={1}
                >
                  {tf.label}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Status Filters - Uniform Equal Width Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statusFilterScroll}
        >
          {STATUS_FILTER_OPTIONS.map((sf) => {
            const active = statusFilter === sf.value;
            return (
              <TouchableOpacity
                key={sf.value}
                onPress={() => setStatusFilter(sf.value)}
                style={[
                  styles.statusFilterPill,
                  {
                    backgroundColor: active
                      ? (isDark ? "rgba(209,170,103,0.18)" : "#FFFDF5")
                      : badgePillBg,
                    borderColor: active ? colors.orangeTheme : itemBorderColor,
                  },
                ]}
                activeOpacity={0.75}
              >
                <AppText
                  type={TWELVE}
                  weight={active ? BOLD : MEDIUM}
                  color={active ? colors.orangeTheme : subTextColor}
                  numberOfLines={1}
                >
                  {sf.label}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main List ScrollView */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.orangeTheme} />}
      >
        {historyLoading && !refreshing ? (
          <View style={[styles.historyEmptyCard, { borderColor: itemBorderColor }]}>
            <ActivityIndicator size="small" color={colors.orangeTheme} />
            <AppText type={THIRTEEN} style={styles.loadingText} color={subTextColor}>
              Loading withdrawal history…
            </AppText>
          </View>
        ) : filteredHistory.length === 0 ? (
          <View style={[styles.historyEmptyCard, { borderColor: itemBorderColor }]}>
            <FastImage source={isDark ? NO_NOTIFICATION_ICON_LIGHT : NO_NOTIFICATION_ICON} style={styles.emptyIcon} resizeMode="contain" />
            <AppText type={FIFTEEN} weight={BOLD} style={styles.emptyTitle} color={textColor}>
              No withdrawal records found
            </AppText>
            <AppText type={TWELVE} style={styles.emptyDesc} color={subTextColor}>
              Your fiat AED withdrawal transactions will appear here after request.
            </AppText>
          </View>
        ) : (
          <View style={styles.historyListWrap}>
            {filteredHistory.map((item, idx) => {
              const statusKey = String(item.status || "COMPLETED").toUpperCase();
              const isCancelled = item.cancelled;
              const cfg = isCancelled
                ? STATUS_CONFIG.CANCELLED
                : STATUS_CONFIG[statusKey] || {
                  label: item.statusLabel || item.status || "—",
                  darkText: "#A1A1AA",
                  darkBg: "rgba(255,255,255,0.08)",
                  lightText: "#64748B",
                  lightBg: "#F1F5F9",
                };

              const statusBadgeText = isDark ? cfg.darkText : cfg.lightText;
              const statusBadgeBg = isDark ? cfg.darkBg : cfg.lightBg;
              const statusDisplayName = item.statusLabel || cfg.label;

              const amountFormatted = `${formatAedAmount(item.amount || item.net_aed || 0)} ${item.currency || "AED"}`;
              const feeFormatted = `${formatAedAmount(item.fee_aed || item.fee || 0)} ${item.currency || "AED"}`;
              const walletLabel = item.wallet_type === "spot" || !item.wallet_type ? "Spot" : String(item.wallet_type);
              const bankLabel = formatBankLabel(item);
              const canCancel = !isCancelled && (statusKey === "AWAITING_ADMIN" || statusKey === "SUBMITTED");

              return (
                <View
                  key={item.id || item._id || String(idx)}
                  style={[styles.historyItemCard, { borderBottomColor: itemBorderColor }]}
                >
                  {/* Top Header: Date/Time + Status Badge */}
                  <View style={styles.cardHeaderRow}>
                    <AppText type={FIFTEEN} weight={BOLD} color={textColor}>
                      {formatHistDateHeader(item.created_at)}
                    </AppText>

                    <View style={[styles.statusBadgePill, { backgroundColor: statusBadgeBg }]}>
                      <AppText type={TWELVE} weight={MEDIUM} color={statusBadgeText}>
                        {statusDisplayName}
                      </AppText>
                    </View>
                  </View>

                  {/* Key-Value Data Rows */}
                  <View style={styles.kvList}>
                    {/* Amount */}
                    <View style={styles.kvRow}>
                      <AppText type={FOURTEEN} color={subTextColor}>
                        Amount
                      </AppText>
                      <AppText type={FOURTEEN} weight={BOLD} color={textColor}>
                        {amountFormatted}
                      </AppText>
                    </View>

                    {/* Fee */}
                    <View style={styles.kvRow}>
                      <AppText type={FOURTEEN} color={subTextColor}>
                        Fee
                      </AppText>
                      <AppText type={FOURTEEN} weight={BOLD} color={textColor}>
                        {feeFormatted}
                      </AppText>
                    </View>

                    {/* Wallet */}
                    <View style={styles.kvRow}>
                      <AppText type={FOURTEEN} color={subTextColor}>
                        Wallet
                      </AppText>
                      <AppText type={FOURTEEN} weight={BOLD} color={textColor}>
                        {walletLabel}
                      </AppText>
                    </View>

                    {/* Bank */}
                    <View style={styles.kvRow}>
                      <AppText type={FOURTEEN} color={subTextColor}>
                        Bank
                      </AppText>
                      <AppText type={FOURTEEN} weight={BOLD} color={textColor}>
                        {bankLabel}
                      </AppText>
                    </View>

                    {/* Action Row */}
                    <View style={styles.actionRow}>
                      <AppText type={FOURTEEN} color={subTextColor}>
                        Action
                      </AppText>

                      <View style={styles.actionButtonsWrap}>
                        {/* Review / Details Button */}
                        <TouchableOpacity
                          activeOpacity={0.75}
                          onPress={() => {
                            setSelectedTx(item);
                            txDetailSheetRef.current?.open?.();
                          }}
                          style={[
                            styles.actionBtn,
                            {
                              borderColor: colors.orangeTheme,
                              backgroundColor: isDark ? "rgba(209,170,103,0.06)" : "#FFFDF5",
                            },
                          ]}
                        >
                          <AppText type={TWELVE} weight={SEMI_BOLD} color={colors.orangeTheme}>
                            Review
                          </AppText>
                        </TouchableOpacity>

                        {/* Cancel Button (Active when awaiting admin) */}
                        {canCancel ? (
                          <TouchableOpacity
                            activeOpacity={0.75}
                            onPress={() => handleCancelClick(item)}
                            style={[
                              styles.actionBtn,
                              {
                                borderColor: isDark ? "rgba(239,68,68,0.7)" : "#DC2626",
                                backgroundColor: isDark ? "rgba(239,68,68,0.06)" : "#FEF2F2",
                              },
                            ]}
                          >
                            <AppText type={TWELVE} weight={SEMI_BOLD} color={isDark ? "#F87171" : "#DC2626"}>
                              Cancel
                            </AppText>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Transaction Detail Bottom Sheet */}
      <AnimatedBottomSheet
        ref={txDetailSheetRef}
        sheetHeight={Math.min(SCREEN_HEIGHT * 0.72, 540)}
        isDark={isDark}
      >
        <View style={styles.txSheetInner}>
          <View style={styles.txSheetHeader}>
            <AppText type={EIGHTEEN} weight={BOLD} color={textColor}>
              Withdrawal Details
            </AppText>
            <TouchableOpacity
              onPress={() => txDetailSheetRef.current?.close?.()}
              style={[styles.closeCircle, { backgroundColor: badgePillBg }]}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <FastImage source={closeIcon} style={styles.closeIconSmall} resizeMode="contain" tintColor={subTextColor} />
            </TouchableOpacity>
          </View>

          {selectedTx ? (
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              <View style={styles.txAmountHero}>
                <AppText type={TWENTY_FOUR} weight={BOLD} color={textColor}>
                  {formatAedAmount(selectedTx.net_aed || selectedTx.amount || 0)} {selectedTx.currency || "AED"}
                </AppText>
                <View
                  style={[
                    styles.statusBadgePill,
                    {
                      marginTop: 8,
                      alignSelf: "center",
                      backgroundColor: selectedTx.cancelled
                        ? (isDark ? "rgba(255,255,255,0.08)" : "#F1F5F9")
                        : (isDark ? "rgba(209,170,103,0.15)" : "#FFFDF5"),
                    },
                  ]}
                >
                  <AppText
                    type={TWELVE}
                    weight={BOLD}
                    color={selectedTx.cancelled ? (isDark ? "#A1A1AA" : "#64748B") : colors.orangeTheme}
                  >
                    {selectedTx.statusLabel || (selectedTx.cancelled ? "Cancelled" : STATUS_CONFIG[String(selectedTx.status || "").toUpperCase()]?.label || selectedTx.status)}
                  </AppText>
                </View>
                {selectedTx.status_reason || selectedTx.reject_reason ? (
                  <AppText type={TWELVE} color={selectedTx.cancelled ? subTextColor : "#EF4444"} style={{ marginTop: 6, textAlign: "center" }}>
                    {selectedTx.status_reason || selectedTx.reject_reason}
                  </AppText>
                ) : null}
              </View>

              <View style={[styles.txDetailList, { borderColor: itemBorderColor }]}>
                {selectedTx.id || selectedTx._id ? (
                  <View style={styles.txDetailRow}>
                    <AppText type={THIRTEEN} weight={MEDIUM} color={subTextColor}>Transaction ID</AppText>
                    <View style={styles.copyableValueRow}>
                      <AppText type={FOURTEEN} weight={BOLD} color={textColor} numberOfLines={1}>
                        {selectedTx.id || selectedTx._id}
                      </AppText>
                      <TouchableOpacity
                        onPress={() => handleCopy(selectedTx.id || selectedTx._id, "tx_id", "ID")}
                        style={[styles.copyBtn, { backgroundColor: badgePillBg }]}
                      >
                        <AppText type={TWELVE} weight={BOLD} color={colors.orangeTheme}>
                          {copiedField === "tx_id" ? "Copied" : "Copy"}
                        </AppText>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}

                {selectedTx.channel_ref_id ? (
                  <View style={styles.txDetailRow}>
                    <AppText type={THIRTEEN} weight={MEDIUM} color={subTextColor}>Channel Ref</AppText>
                    <View style={styles.copyableValueRow}>
                      <AppText type={FOURTEEN} weight={BOLD} color={textColor} numberOfLines={1}>
                        {selectedTx.channel_ref_id}
                      </AppText>
                      <TouchableOpacity
                        onPress={() => handleCopy(selectedTx.channel_ref_id, "channel_ref", "Channel Ref")}
                        style={[styles.copyBtn, { backgroundColor: badgePillBg }]}
                      >
                        <AppText type={TWELVE} weight={BOLD} color={colors.orangeTheme}>
                          {copiedField === "channel_ref" ? "Copied" : "Copy"}
                        </AppText>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}

                <View style={styles.txDetailRow}>
                  <AppText type={THIRTEEN} weight={MEDIUM} color={subTextColor}>Gross Amount</AppText>
                  <AppText type={FOURTEEN} weight={BOLD} color={textColor}>
                    {formatAedAmount(selectedTx.amount || 0)} {selectedTx.currency || "AED"}
                  </AppText>
                </View>

                {selectedTx.fee_aed || selectedTx.fee ? (
                  <View style={styles.txDetailRow}>
                    <AppText type={THIRTEEN} weight={MEDIUM} color={subTextColor}>Fee</AppText>
                    <AppText type={FOURTEEN} weight={BOLD} color={textColor}>
                      {formatAedAmount(selectedTx.fee_aed || selectedTx.fee)} {selectedTx.currency || "AED"}
                    </AppText>
                  </View>
                ) : null}

                <View style={styles.txDetailRow}>
                  <AppText type={THIRTEEN} weight={MEDIUM} color={subTextColor}>Destination Bank</AppText>
                  <AppText type={FOURTEEN} weight={BOLD} color={textColor}>
                    {formatBankLabel(selectedTx)}
                  </AppText>
                </View>

                <View style={styles.txDetailRow}>
                  <AppText type={THIRTEEN} weight={MEDIUM} color={subTextColor}>Wallet</AppText>
                  <AppText type={FOURTEEN} weight={BOLD} color={textColor}>
                    {selectedTx.wallet_type === "spot" || !selectedTx.wallet_type ? "Spot" : String(selectedTx.wallet_type)}
                  </AppText>
                </View>

                <View style={styles.txDetailRow}>
                  <AppText type={THIRTEEN} weight={MEDIUM} color={subTextColor}>Date & Time</AppText>
                  <AppText type={FOURTEEN} weight={BOLD} color={textColor}>
                    {formatHistDateHeader(selectedTx.created_at)}
                  </AppText>
                </View>
              </View>
            </ScrollView>
          ) : null}
        </View>
      </AnimatedBottomSheet>

      {/* Cancel Confirmation Sheet */}
      <AnimatedBottomSheet
        ref={cancelConfirmSheetRef}
        sheetHeight={260}
        isDark={isDark}
      >
        <View style={styles.txSheetInner}>
          <AppText type={EIGHTEEN} weight={BOLD} style={{ marginBottom: 8 }} color={textColor}>
            Cancel withdrawal?
          </AppText>
          <AppText type={THIRTEEN} style={{ marginBottom: 20 }} color={subTextColor}>
            Are you sure you want to cancel withdrawal of {formatAedAmount(targetCancelItem?.amount)} AED? Funds will return to your Spot AED wallet.
          </AppText>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              onPress={() => cancelConfirmSheetRef.current?.close?.()}
              style={[styles.modalSecondaryBtn, { borderColor: itemBorderColor }]}
              activeOpacity={0.7}
            >
              <AppText type={FOURTEEN} weight={SEMI_BOLD} color={textColor}>Back</AppText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleConfirmCancelWithdrawal}
              disabled={!!cancellingId}
              style={[styles.modalDangerBtn, { backgroundColor: "#EF4444" }]}
              activeOpacity={0.85}
            >
              {cancellingId ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <AppText type={FOURTEEN} weight={BOLD} color="#FFFFFF">Cancel Withdrawal</AppText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </AnimatedBottomSheet>
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
  headerRightSpacer: {
    width: 30,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  timeFiltersRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  timeFilterBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statusFilterScroll: {
    gap: 8,
    paddingRight: 16,
  },
  statusFilterPill: {
    minWidth: 110,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  historyListWrap: {
    paddingTop: 8,
  },
  historyItemCard: {
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  statusBadgePill: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  kvList: {
    gap: 12,
  },
  kvRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  actionButtonsWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  historyEmptyCard: {
    padding: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
  },
  loadingText: {
    marginTop: 10,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    marginBottom: 4,
  },
  emptyDesc: {
    textAlign: "center",
  },
  txSheetInner: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  txSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  closeCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  closeIconSmall: {
    width: 14,
    height: 14,
  },
  txAmountHero: {
    alignItems: "center",
    paddingVertical: 14,
  },
  txDetailList: {
    marginTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
  },
  txDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  copyableValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  copyBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  modalSecondaryBtn: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalDangerBtn: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default WithdrawFiatHistoryScreen;
