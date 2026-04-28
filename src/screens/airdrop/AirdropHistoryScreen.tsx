import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import FastImage from "react-native-fast-image";
import moment from "moment";
import Modal from "react-native-modal";
import { appOperation } from "../../appOperation";
import { back_ic, NO_NOTIFICATION_ICON } from "../../helper/ImageAssets";
import { useTheme } from "../../hooks/useTheme";
import NavigationService from "../../navigation/NavigationService";
import { AIRDROP_SCREEN } from "../../navigation/routes";
import { colors } from "../../theme/colors";
import { AppSafeAreaView, AppText, SEMI_BOLD, SIXTEEN, TWELVE } from "../../shared";
import KeyBoardAware from "../../shared/components/KeyboardAware";

type StatusKey = "pending" | "released" | "locked" | "failed";

const getRowStatus = (item: any): StatusKey => {
  const raw = String(item?.status ?? item?.releaseStatus ?? item?.state ?? "")
    .trim()
    .toUpperCase();
  if (raw.includes("FAIL")) return "failed";
  if (raw.includes("LOCK")) return "locked";
  if (raw.includes("PEND") || raw === "PENDING") return "pending";
  if (raw.includes("RELEASE") || raw === "RELEASED" || raw === "COMPLETED" || raw === "DONE") return "released";
  if (item?.transferredToMainWallet === true) return "released";
  if (item?.transferredToMainWallet === false) return "pending";
  return "pending";
};

const formatDateDisplay = (v: any) => {
  if (v == null || v === "") return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return moment(d).format("DD MMM YYYY, hh:mm A");
};

const truncateMiddle = (str: any, head = 10, tail = 8) => {
  const s = str == null ? "" : String(str);
  if (!s) return "—";
  if (s.length <= head + tail + 1) return s;
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
};

const toNum = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const AirdropHistoryScreen = () => {
  const { colors: themeColors, isDark } = useTheme();

  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState<any[]>([]);
  const [vesting, setVesting] = useState<any>({
    totalEarned: 0,
    lockedBalance: 0,
    releasedBalance: 0,
    availableBalance: 0,
    nextUnlockDate: null,
    nextUnlockPercentage: null,
    nextUnlock: null,
    activeVestings: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | StatusKey>("all");
  const [sortLatestFirst, setSortLatestFirst] = useState(true);
  const [statusSheetOpen, setStatusSheetOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [historyRes, vestingRes]: any[] = await Promise.all([
          appOperation.customer.get_referral_release_history(page, limit),
          appOperation.customer.get_referral_vesting_status(),
        ]);
        if (!active) return;

        if (historyRes?.success) {
          const payload = historyRes?.data || {};
          setRows(Array.isArray(payload?.items) ? payload.items : []);
          setTotal(Number(payload?.total) || 0);
        } else {
          setRows([]);
          setTotal(0);
        }

        if (vestingRes?.success && vestingRes?.data) {
          setVesting((prev: any) => ({ ...prev, ...vestingRes.data }));
        } else {
          setVesting({
            totalEarned: 0,
            lockedBalance: 0,
            releasedBalance: 0,
            availableBalance: 0,
            nextUnlockDate: null,
            nextUnlockPercentage: null,
            nextUnlock: null,
            activeVestings: [],
          });
        }

        if (!historyRes?.success && !vestingRes?.success) {
          setError("Failed to load referral release data.");
        }
      } catch (e: any) {
        if (!active) return;
        setRows([]);
        setTotal(0);
        setError(e?.message || "Something went wrong while loading data.");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [page, limit]);

  const filteredSortedRows = useMemo(() => {
    let list = Array.isArray(rows) ? [...rows] : [];
    const q = searchQuery.trim().toLowerCase();
    if (q) list = list.filter((r) => String(r?.vestingId ?? "").toLowerCase().includes(q));
    if (statusFilter !== "all") list = list.filter((r) => getRowStatus(r) === statusFilter);
    list.sort((a, b) => {
      const ta = new Date(a?.createdAt).getTime();
      const tb = new Date(b?.createdAt).getTime();
      const aa = Number.isNaN(ta) ? 0 : ta;
      const bb = Number.isNaN(tb) ? 0 : tb;
      return sortLatestFirst ? bb - aa : aa - bb;
    });
    return list;
  }, [rows, searchQuery, statusFilter, sortLatestFirst]);

  const hasApiRows = rows.length > 0;
  const hasDisplayRows = filteredSortedRows.length > 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const filtersActive = Boolean(searchQuery.trim()) || statusFilter !== "all";
  const rowSno = (displayIndex: number) =>
    filtersActive ? displayIndex + 1 : (page - 1) * limit + displayIndex + 1;

  const cardBg = isDark ? themeColors.themeElevationColor : "#FFFFFF";
  const softBg = isDark ? themeColors.themeSelection : "rgba(0,0,0,0.03)";
  const border = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)";
  const statusLabel =
    statusFilter === "all"
      ? "All Status"
      : statusFilter[0].toUpperCase() + statusFilter.slice(1);

  const badge = (st: StatusKey) => {
    if (st === "released") return { bg: "rgba(94,186,137,0.16)", bd: "rgba(94,186,137,0.40)", tx: "#2a8f5c", label: "Released" };
    if (st === "locked") return { bg: "rgba(30,86,245,0.10)", bd: "rgba(30,86,245,0.28)", tx: "#1e56f5", label: "Locked" };
    if (st === "failed") return { bg: "rgba(220,53,69,0.12)", bd: "rgba(220,53,69,0.35)", tx: "#c82333", label: "Failed" };
    return { bg: "rgba(232,162,60,0.18)", bd: "rgba(232,162,60,0.45)", tx: "#b45c06", label: "Pending" };
  };

  return (
    <AppSafeAreaView style={{ backgroundColor: themeColors.background, flex: 1 }}>
      <KeyBoardAware>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => NavigationService.goBack()}>
            <FastImage source={back_ic} resizeMode="contain" style={styles.backIcon} tintColor={themeColors.text} />
          </TouchableOpacity>
          <AppText weight={SEMI_BOLD} type={SIXTEEN} color={themeColors.text}>
            Airdrop History
          </AppText>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.summaryRow}>
            {[
              { label: "Total Earned", value: toNum(vesting.totalEarned), valueColor: themeColors.text },
              { label: "Locked Balance", value: toNum(vesting.lockedBalance), valueColor: themeColors.text },
              { label: "Released Balance", value: toNum(vesting.releasedBalance), valueColor: "#5eba89" },
              { label: "Available Balance", value: toNum(vesting.availableBalance), valueColor: themeColors.text },
            ].map((c) => (
              <View key={c.label} style={[styles.summaryCard, { backgroundColor: cardBg, borderColor: border }]}>
                <AppText type={TWELVE} style={{ color: themeColors.secondaryText }}>
                  {c.label}
                </AppText>
                <AppText weight={SEMI_BOLD} style={{ marginTop: 8, color: c.valueColor }}>
                  {c.value}
                </AppText>
              </View>
            ))}
          </View>

          {error ? (
            <View
              style={[
                styles.alert,
                {
                  backgroundColor: isDark ? "rgba(232,162,60,0.12)" : "rgba(232,162,60,0.18)",
                  borderColor: "rgba(232,162,60,0.35)",
                },
              ]}
            >
              <AppText type={TWELVE} style={{ color: isDark ? "rgba(255,255,255,0.80)" : "rgba(0,0,0,0.70)" }}>
                {error}
              </AppText>
            </View>
          ) : null}

          <View style={[styles.toolbar, { backgroundColor: softBg, borderColor: border }]}>
            <View style={[styles.searchBar, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#FFFFFF", borderColor: border }]}>
              <AppText style={{ color: themeColors.secondaryText }}>⌕</AppText>
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search vesting ID"
                placeholderTextColor={isDark ? "rgba(255,255,255,0.40)" : "rgba(0,0,0,0.40)"}
                style={[styles.searchInput, { color: themeColors.text }]}
              />
            </View>

            <TouchableOpacity
              onPress={() => setStatusSheetOpen(true)}
              activeOpacity={0.9}
              style={[
                styles.selectWrap,
                {
                  backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#FFFFFF",
                  borderColor: isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.10)",
                },
              ]}
            >
              <AppText type={TWELVE} style={{ color: isDark ? colors.white : colors.black }}>
                {statusLabel}
              </AppText>
              <AppText style={{ color: isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.55)" }}>
                ▼
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSortLatestFirst((v) => !v)}
              style={[
                styles.sortBtn,
                {
                  backgroundColor: isDark ? "rgba(30,86,245,0.14)" : "#FFFFFF",
                  borderColor: isDark ? colors.buttonBg : border,
                },
              ]}
            >
              <AppText type={TWELVE} style={{ color: isDark ? colors.white : "#1e56f5" }}>
                {sortLatestFirst ? "Latest first" : "Oldest first"}
              </AppText>
            </TouchableOpacity>

            <AppText type={TWELVE} style={{ color: themeColors.secondaryText }}>
              Filters and sort apply to the current page of results.
            </AppText>
          </View>

          {loading ? (
            <View style={{ paddingVertical: 18, alignItems: "center" }}>
              <ActivityIndicator color={isDark ? "rgba(255,255,255,0.65)" : "rgba(0,0,0,0.55)"} />
              <AppText type={TWELVE} style={{ marginTop: 10 }} color={themeColors.secondaryText}>
                Loading release history…
              </AppText>
            </View>
          ) : !hasApiRows ? (
            <View style={[styles.empty, { backgroundColor: cardBg, borderColor: border }]}>
              <AppText weight={SEMI_BOLD} style={{ color: themeColors.text }}>
                No release history yet
              </AppText>
              <AppText type={TWELVE} style={{ marginTop: 8 }} color={themeColors.secondaryText}>
                Join the airdrop campaign to earn rewards. Your vesting releases will appear here.
              </AppText>
              <TouchableOpacity
                onPress={() => NavigationService.navigate(AIRDROP_SCREEN)}
                style={[styles.primaryBtn, { backgroundColor: colors.buttonBg }]}
              >
                <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: colors.white }}>
                  Go to AirDrop
                </AppText>
              </TouchableOpacity>
            </View>
          ) : !hasDisplayRows ? (
            <View style={[styles.empty, { backgroundColor: cardBg, borderColor: border }]}>
              <AppText weight={SEMI_BOLD} style={{ color: themeColors.text }}>
                No matching releases
              </AppText>
              <AppText type={TWELVE} style={{ marginTop: 8 }} color={themeColors.secondaryText}>
                Try adjusting your search or status filter, or go to the next page.
              </AppText>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {filteredSortedRows.map((item, idx) => {
                const st = getRowStatus(item);
                const b = badge(st);
                const vid = item?.vestingId ?? "—";
                return (
                  <View key={item?._id ?? `${vid}-${idx}`} style={[styles.rowCard, { backgroundColor: cardBg, borderColor: border }]}>
                    <View style={styles.rowTop}>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <AppText type={TWELVE} style={{ color: themeColors.secondaryText }}>
                          Round {item?.round ?? "—"} · #{rowSno(idx)}
                        </AppText>
                        <AppText weight={SEMI_BOLD} style={{ marginTop: 6, color: themeColors.text }}>
                          {toNum(item?.amount)} {String(item?.shortName ?? "USDT").toUpperCase()}
                        </AppText>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: b.bg, borderColor: b.bd }]}>
                        <AppText type={TWELVE} style={{ color: b.tx }}>
                          {b.label}
                        </AppText>
                      </View>
                    </View>

                    <View style={[styles.grid, { borderTopColor: border }]}>
                      <View style={styles.gridRow}>
                        <AppText type={TWELVE} style={styles.dt} color={themeColors.secondaryText}>
                          Vesting ID
                        </AppText>
                        <AppText type={TWELVE} style={styles.dd} color={themeColors.text}>
                          {truncateMiddle(vid, 10, 8)}
                        </AppText>
                      </View>
                      <View style={styles.gridRow}>
                        <AppText type={TWELVE} style={styles.dt} color={themeColors.secondaryText}>
                          Token
                        </AppText>
                        <AppText type={TWELVE} style={styles.dd} color={themeColors.text}>
                          {String(item?.shortName ?? "USDT").toUpperCase()}
                        </AppText>
                      </View>
                      <View style={styles.gridRow}>
                        <AppText type={TWELVE} style={styles.dt} color={themeColors.secondaryText}>
                          Transferred
                        </AppText>
                        <AppText type={TWELVE} style={styles.dd} color={themeColors.text}>
                          {item?.transferredToMainWallet ? "Yes" : "No"}
                        </AppText>
                      </View>
                      <View style={styles.gridRow}>
                        <AppText type={TWELVE} style={styles.dt} color={themeColors.secondaryText}>
                          Date
                        </AppText>
                        <AppText type={TWELVE} style={styles.dd} color={themeColors.text}>
                          {formatDateDisplay(item?.createdAt)}
                        </AppText>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {hasApiRows ? (
            <View style={[styles.pagination, { borderColor: border }]}>
              <AppText type={TWELVE} style={{ color: themeColors.secondaryText }}>
                {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total}
              </AppText>
              <View style={styles.pagerBtns}>
                <TouchableOpacity style={[styles.pagerBtn, { opacity: page <= 1 ? 0.45 : 1 }]} onPress={() => setPage(1)} disabled={page <= 1}>
                  <AppText style={{ color: colors.white }}>⏮</AppText>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.pagerBtn, { opacity: page <= 1 ? 0.45 : 1 }]} onPress={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                  <AppText style={{ color: colors.white }}>‹</AppText>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.pagerBtn, { opacity: page >= totalPages ? 0.45 : 1 }]} onPress={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                  <AppText style={{ color: colors.white }}>›</AppText>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.pagerBtn, { opacity: page >= totalPages ? 0.45 : 1 }]} onPress={() => setPage(totalPages)} disabled={page >= totalPages}>
                  <AppText style={{ color: colors.white }}>⏭</AppText>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </ScrollView>

        <Modal
          isVisible={statusSheetOpen}
          onBackdropPress={() => setStatusSheetOpen(false)}
          onBackButtonPress={() => setStatusSheetOpen(false)}
          style={styles.sheetModal}
        >
          <View style={[styles.sheet, { backgroundColor: isDark ? themeColors.themeElevationColor : "#FFFFFF" }]}>
            <View style={styles.sheetHandle} />
            <AppText weight={SEMI_BOLD} style={{ color: themeColors.text }}>
              Filter by status
            </AppText>
            <View style={{ height: 12 }} />
            {([
              { label: "All Status", value: "all" },
              { label: "Pending", value: "pending" },
              { label: "Released", value: "released" },
              { label: "Locked", value: "locked" },
              { label: "Failed", value: "failed" },
            ] as const).map((opt) => {
              const active = statusFilter === (opt.value as any);
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => {
                    setStatusFilter(opt.value as any);
                    setStatusSheetOpen(false);
                  }}
                  style={[
                    styles.sheetRow,
                    {
                      backgroundColor: active ? "rgba(30,86,245,0.12)" : "transparent",
                      borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)",
                    },
                  ]}
                >
                  <AppText style={{ color: themeColors.text }}>{opt.label}</AppText>
                  {active ? <AppText style={{ color: colors.buttonBg }}>✓</AppText> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </Modal>
      </KeyBoardAware>
    </AppSafeAreaView>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    marginTop: 20,
    gap: 14,
    marginHorizontal: 16,
    alignItems: "center",
  },
  backIcon: { width: 20, height: 20 },
  content: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 12 },

  summaryRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 12 },
  summaryCard: { width: "48%", borderRadius: 14, borderWidth: 1, padding: 14 },

  alert: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 10 },

  toolbar: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 10, marginBottom: 12 },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, height: 44 },
  searchInput: { flex: 1, fontSize: 12, paddingVertical: 0 },
  filterPill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  sortBtn: { alignSelf: "flex-start", borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  selectWrap: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  empty: { borderWidth: 1, borderRadius: 14, padding: 16, alignItems: "center" },
  primaryBtn: { marginTop: 14, borderRadius: 999, paddingVertical: 12, paddingHorizontal: 18 },

  rowCard: { borderWidth: 1, borderRadius: 14, padding: 14 },
  rowTop: { flexDirection: "row", gap: 10, justifyContent: "space-between", paddingBottom: 12 },
  statusBadge: { borderWidth: 1, borderRadius: 10, paddingVertical: 6, paddingHorizontal: 10, alignSelf: "flex-start" },

  grid: { borderTopWidth: 1, paddingTop: 10, gap: 8 },
  gridRow: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  dt: { width: 92 },
  dd: { flex: 1, textAlign: "right" },

  pagination: { marginTop: 12, borderTopWidth: 1, paddingTop: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pagerBtns: { flexDirection: "row", gap: 8 },
  pagerBtn: { backgroundColor: colors.buttonBg, width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },

  sheetModal: { justifyContent: "flex-end", margin: 0 },
  sheet: { paddingTop: 10, paddingHorizontal: 16, paddingBottom: 22, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  sheetHandle: { alignSelf: "center", width: 44, height: 5, borderRadius: 999, backgroundColor: "rgba(0,0,0,0.20)", marginBottom: 10 },
  sheetRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, paddingHorizontal: 12, borderWidth: 1, borderRadius: 12, marginBottom: 10 },
});

export default AirdropHistoryScreen;