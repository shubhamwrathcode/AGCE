import React, { useCallback } from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { useRoute } from "@react-navigation/native";
import { AppSafeAreaView, AppText, Button, SEMI_BOLD, TWELVE, FOURTEEN, BOLD, MEDIUM, EIGHTEEN } from "../../shared";
import { colors } from "../../theme/colors";
import { useTheme } from "../../hooks/useTheme";
import FastImage from "react-native-fast-image";
import { back_ic, copyIcon, externalLinkIcon } from "../../helper/ImageAssets";
import moment from "moment";
import NavigationService from "../../navigation/NavigationService";
import { CREATE_TICKET_SCREEN, DEPOSIT_DECLARATION_SCREEN } from "../../navigation/routes";
import { copyText } from "../../helper/utility";
import { presentDepositStatus, readDeclarationStatus, readDepositStatus } from "../../helper/depositDeclaration";

const pickExplorerHref = (raw) => {
  if (raw == null) return null;
  const s = typeof raw === "string" ? raw.trim() : String(raw).trim();
  return s || null;
};

const resolveExplorerUrl = (explorer, kind, value) => {
  const ex = explorer && typeof explorer === "object" ? explorer : {};
  const tpl =
    kind === "address"
      ? pickExplorerHref(ex.address) || pickExplorerHref(ex.address_url) || pickExplorerHref(ex.account)
      : pickExplorerHref(ex.tx) ||
        pickExplorerHref(ex.transaction) ||
        pickExplorerHref(ex.tx_hash_url) ||
        pickExplorerHref(ex.txUrl);
  if (!tpl || !value || value === "—") return null;
  if (/\{address\}/i.test(tpl) && kind === "address") return tpl.replace(/\{address\}/gi, encodeURIComponent(value));
  if ((/\{txid\}/i.test(tpl) || /\{txhash\}/i.test(tpl)) && kind === "tx") {
    return tpl.replace(/\{txid\}/gi, encodeURIComponent(value)).replace(/\{txhash\}/gi, encodeURIComponent(value));
  }
  return tpl;
};

const truncateMid = (s) => {
  if (!s || s === "—") return "—";
  const str = String(s);
  if (str.length <= 22) return str;
  return `${str.slice(0, 10)}…${str.slice(-8)}`;
};

export default function DepositHistoryDetail() {
  const route = useRoute();
  const { colors: themeColors, isDark } = useTheme();
  const row = route.params?.row || {};
  const presented = presentDepositStatus(
    readDepositStatus(row) || row.status,
    readDeclarationStatus(row) || row.declarationStatus
  );

  const statusLabel = presented.label || row.statusLabel || "—";
  const tone = presented.tone || row.actionTone || "info";
  const needsSenderConfirm = presented.needsSenderConfirm || row.needsSenderConfirm;
  const rejected = String(row.status || "").trim().toUpperCase().replace(/[^A-Z]/g, "") === "REJECTED" || statusLabel === "Blocked";

  const statusColor =
    tone === "success" ? "#05C46B" : tone === "pending" ? "#FFC312" : tone === "danger" ? "#FF3F34" : themeColors.text;
  const stepAccent = tone === "success" ? "#05C46B" : tone === "pending" ? "#FFC312" : tone === "danger" ? "#FF3F34" : "#64748B";

  const dateStr = moment(row.createdAt).isValid() ? moment(row.createdAt).format("DD/MM/YYYY, HH:mm:ss") : "—";
  const networkText = row.chain_full_name && row.chain_full_name !== "—" ? row.chain_full_name : row.chain || "—";
  const amountText = `${row.amount ?? "—"} ${row.short_name ?? ""}`.trim();
  const address = row.address && row.address !== "—" ? row.address : "";
  const txid = row.txid && row.txid !== "—" ? row.txid : "";
  const addressUrl = resolveExplorerUrl(row.explorer, "address", address);
  const txUrl = resolveExplorerUrl(row.explorer, "tx", txid);

  const openUrl = useCallback(async (url) => {
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch {
      /* ignore */
    }
  }, []);

  const note = needsSenderConfirm
    ? "Balance has not increased."
    : tone === "danger"
      ? rejected
        ? "Blocked by screening. Our team will review the transaction shortly and you will get an update via email."
        : "This deposit did not complete as expected. If funds left your external wallet, contact support with this reference."
      : tone === "success"
        ? "Your deposit has been credited. Balances may take a moment to update everywhere."
        : "Please note that you will receive an email once this deposit is confirmed.";

  const firstStepTitle = tone === "danger" ? "Deposit recorded" : tone === "success" ? "Deposit received" : "Deposit submitted";
  const secondStepTitle = tone === "danger" ? (statusLabel !== "—" ? statusLabel : "Deposit unsuccessful") : statusLabel !== "—" ? statusLabel : tone === "success" ? "Credited" : "Processing";

  const Row = ({ label, value, right }) => (
    <View style={[styles.row, { borderBottomColor: isDark ? themeColors.border : "#EEE" }]}>
      <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: isDark ? "#8E8E93" : "#666666" }}>
        {label}
      </AppText>
      <View style={styles.rowRight}>
        {typeof value === "string" ? (
          <AppText
            type={FOURTEEN}
            weight={MEDIUM}
            numberOfLines={1}
            ellipsizeMode="middle"
            style={{ color: themeColors.text, flexShrink: 1 }}
          >
            {value}
          </AppText>
        ) : (
          value
        )}
        {right ? <View style={styles.rowActions}>{right}</View> : null}
      </View>
    </View>
  );

  const IconActions = ({ value, url }) =>
    value ? (
      <>
        <TouchableOpacity onPress={() => copyText(value)} style={styles.iconBtn}>
          <FastImage source={copyIcon} style={styles.icon} resizeMode="contain" tintColor={themeColors.secondaryText} />
        </TouchableOpacity>
        {url ? (
          <TouchableOpacity onPress={() => openUrl(url)} style={styles.iconBtn}>
            <FastImage source={externalLinkIcon} style={styles.icon} resizeMode="contain" tintColor={themeColors.secondaryText} />
          </TouchableOpacity>
        ) : null}
      </>
    ) : null;

  return (
    <AppSafeAreaView style={{ flex: 1, backgroundColor: themeColors.background }}>
      <View style={[styles.header, { borderBottomColor: isDark ? themeColors.border : "#EEE" }]}>
        <TouchableOpacity onPress={() => NavigationService.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <FastImage source={back_ic} style={{ width: 18, height: 18 }} resizeMode="contain" tintColor={themeColors.text} />
        </TouchableOpacity>
        <AppText type={EIGHTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text }}>
          Deposit Details
        </AppText>
        <View style={{ width: 18, height: 18 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.stepper}>
          <View style={styles.stepRow}>
            <View style={styles.stepTrack}>
              <View style={[styles.stepDot, { backgroundColor: stepAccent }]} />
              <View style={[styles.stepLine, { backgroundColor: tone === "success" ? stepAccent : "#E5E7EB" }]} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: themeColors.text }}>
                {firstStepTitle}
              </AppText>
              <AppText type={TWELVE} weight={MEDIUM} style={{ color: themeColors.secondaryText, marginTop: 4 }}>
                {dateStr}
              </AppText>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepTrack}>
              <View style={[styles.stepDot, { backgroundColor: tone === "success" ? stepAccent : "#D1D5DB" }]} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText
                type={FOURTEEN}
                weight={MEDIUM}
                style={{ color: tone === "success" || tone === "danger" ? themeColors.text : themeColors.secondaryText }}
              >
                {secondStepTitle}
              </AppText>
              {tone !== "success" && tone !== "danger" && !needsSenderConfirm ? (
                <AppText type={TWELVE} weight={MEDIUM} style={{ color: themeColors.secondaryText, marginTop: 4 }}>
                  You will receive an email when this deposit completes.
                </AppText>
              ) : null}
              <AppText type={TWELVE} weight={MEDIUM} style={{ color: themeColors.secondaryText, marginTop: 4 }}>
                {dateStr}
              </AppText>
            </View>
          </View>
        </View>

        <AppText type={TWELVE} weight={MEDIUM} style={[styles.note, { color: tone === "danger" ? "#FF3F34" : themeColors.secondaryText }]}>
          {note}
        </AppText>

        {needsSenderConfirm ? (
          <Button
            containerStyle={styles.confirmBtn}
            onPress={() => NavigationService.navigate(DEPOSIT_DECLARATION_SCREEN, { depositId: row.id, row })}
          >
            Confirm sender
          </Button>
        ) : null}

        <View style={[styles.card, { borderColor: isDark ? themeColors.border : "#EEE" }]}>
          <Row
            label="Status"
            value={
              <AppText type={FOURTEEN} weight={BOLD} style={{ color: statusColor }}>
                {statusLabel}
              </AppText>
            }
          />
          <Row label="Date" value={dateStr} />
          <Row label="Coin" value={row.short_name || "—"} />
          <Row label="Amount" value={amountText} />
          <Row label="Network" value={networkText} />
          <Row label="Deposit Wallet" value={row.depositWallet || "Main Wallet"} />
          <Row label="Address" value={truncateMid(address || "—")} right={<IconActions value={address} url={addressUrl} />} />
          <Row label="TxID" value={truncateMid(txid || "—")} right={<IconActions value={txid} url={txUrl} />} />
        </View>

        <TouchableOpacity onPress={() => NavigationService.navigate(CREATE_TICKET_SCREEN)} style={styles.chatRow}>
          <AppText type={TWELVE} style={{ color: colors.orangeTheme }}>
            Need help? Chat with us
          </AppText>
        </TouchableOpacity>
      </ScrollView>
    </AppSafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 52,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
  },
  content: { padding: 16, paddingBottom: 40 },
  stepper: { marginTop: 10 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  stepTrack: { width: 18, alignItems: "center" },
  stepDot: { width: 10, height: 10, borderRadius: 5 },
  stepLine: { width: 2, height: 40 },
  note: { lineHeight: 18, marginTop: 10 },
  confirmBtn: { marginTop: 16 },
  card: { marginTop: 20, borderWidth: 1, borderRadius: 12, overflow: "hidden" },
  row: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
    maxWidth: "66%",
  },
  rowActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(148, 163, 184, 0.12)",
  },
  icon: { width: 14, height: 14 },
  chatRow: { marginTop: 20, alignItems: "center" },
});
