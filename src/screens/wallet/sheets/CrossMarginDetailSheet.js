import React, { forwardRef, useRef, useState } from "react";
import { View, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import FastImage from "react-native-fast-image";
import RBSheet from "react-native-raw-bottom-sheet";
import { AppText, BOLD, DISCLAIMTEXT, FOURTEEN, SEMI_BOLD, SIXTEEN, TWELVE, TWENTY_TWO } from "../../../shared";
import { colors } from "../../../theme/colors";
import NavigationService from "../../../navigation/NavigationService";
import { MARGIN_TRANSFER_SCREEN, TRADE_SCREEN } from "../../../navigation/routes";
import { bitcoin_ic, close_ic } from "../../../helper/ImageAssets";
import CrossBorrowRepaySheet from "./CrossBorrowRepaySheet";
import Toast from "react-native-simple-toast";
import { appOperation } from "../../../appOperation";
import { CUSTOMER_TYPE } from "../../../appOperation/types";

function fmt(val, decimals = 8) {
  const n = parseFloat(val);
  if (!val || isNaN(n) || n === 0) return "0";
  return parseFloat(n.toFixed(decimals)).toString();
}

function fmtPrice(val) {
  const n = parseFloat(val);
  if (!val || isNaN(n) || n === 0) return "0";
  return parseFloat(n.toFixed(2)).toString();
}

const CrossMarginDetailSheet = forwardRef(({ theme, themeColors, rowPopup, assets, debtByAsset, buildCoinIconUri, onSuccess }, ref) => {
  const isFund = rowPopup?.type === "fund";
  const d = rowPopup?.data;
  const borrowRepaySheetRef = useRef(null);
  const [borrowRepayMode, setBorrowRepayMode] = useState("borrow"); // "borrow" | "repay"

  const handleClosePosition = async (pairKey) => {
    try {
      const res = await appOperation.post("cross/position/close", { pair: pairKey }, CUSTOMER_TYPE);
      if (res?.success) {
        Toast.showWithGravity(res.message || "Position closed.", Toast.SHORT, Toast.BOTTOM);
        ref.current?.close();
        if (onSuccess) onSuccess();
      } else {
        Toast.showWithGravity(res?.message || "Failed to close position.", Toast.SHORT, Toast.BOTTOM);
      }
    } catch (error) {
      Toast.showWithGravity(error?.message || "Failed to close position.", Toast.SHORT, Toast.BOTTOM);
    }
  };

  const assetName = d?.asset;
  const latestAssetRow = assets?.find((a) => a.asset === assetName);
  const debtRow = debtByAsset?.[assetName] || d?.debt || null;
  const borrowedAmount = latestAssetRow ? latestAssetRow.borrowed : (d?.borrowed || 0);
  const hasBorrow = parseFloat(borrowedAmount) > 0;
  const freeBalance = latestAssetRow ? latestAssetRow.balance : (d?.balance || d?.assetRow?.balance || "0");
  const isLong = d?.side === "LONG";
  const sideColor = isLong ? colors.green : colors.red;
  const totalBal = isFund ? (parseFloat(latestAssetRow?.balance || d?.balance || 0) + parseFloat(latestAssetRow?.locked || d?.locked || 0)).toString() : null;
  const netBadgeColor = parseFloat(d?.net || 0) < 0 ? colors.red : parseFloat(d?.net || 0) > 0 ? colors.green : themeColors.text;
  const pnl = parseFloat(d?.unrealized_pnl || 0);
  const roe = parseFloat(d?.roe_pct || 0);
  const pnlColor = pnl >= 0 ? colors.green : colors.red;
  const sideColorText = isLong ? "GREEN" : "RED";

  const mPairKey = d?.pair || `${d?.asset}USDT`;

  return (
    <>
      <RBSheet
        ref={ref}
        height={580}
        openDuration={250}
        customStyles={{
          container: {
            backgroundColor: theme === "Dark" ? colors.black : colors.white,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          },
        }}
      >
        {d ? (
          <View style={{ flex: 1, paddingBottom: 10 }}>
            <View style={[styles.header, { borderBottomWidth: 1, borderBottomColor: themeColors.border }]}>
              <View style={styles.titleRow}>
                <View>
                  <AppText type={SIXTEEN} weight={BOLD}>{d.asset}</AppText>
                  {!isFund && (
                    <View style={[styles.sideBadge, { borderColor: sideColor, alignSelf: "flex-start" }]}>
                      <AppText type={TWELVE} color={sideColorText} weight={SEMI_BOLD}>{isLong ? "LONG" : "SHORT"}</AppText>
                    </View>
                  )}
                </View>
              </View>
              <TouchableOpacity onPress={() => ref.current?.close()} style={styles.closeBtn}>
                <FastImage source={close_ic} style={styles.closeIcon} tintColor={themeColors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              <View style={styles.hero}>
                {isFund ? (
                  <>
                    <AppText type={TWENTY_TWO} weight={BOLD} style={{ color: netBadgeColor }}>{fmt(d.net)} {d.asset}</AppText>
                    <AppText type={FOURTEEN} color={DISCLAIMTEXT}>Net Asset</AppText>
                  </>
                ) : (
                  <>
                    <AppText type={TWENTY_TWO} weight={BOLD} style={{ color: sideColor }}>{fmt(d.net_quantity)} {d.asset}</AppText>
                    <AppText type={FOURTEEN} color={DISCLAIMTEXT}>≈ {fmtPrice(Math.abs(parseFloat(d.value_usdt || 0)))} USDT</AppText>
                    {d.unrealized_pnl != null && (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                        <AppText type={SIXTEEN} weight={SEMI_BOLD} style={{ color: pnlColor }}>
                          {pnl >= 0 ? "+" : ""}{fmt(pnl, 4)} USDT
                        </AppText>
                        <AppText type={FOURTEEN} color={pnlColor}>
                          ({roe >= 0 ? "+" : ""}{fmtPrice(roe)}%)
                        </AppText>
                      </View>
                    )}
                  </>
                )}
              </View>

              <View style={styles.content}>
                {isFund ? (
                  <>
                    <DetailRow label="Total Balance" val={fmt(totalBal)} asset={d.asset} />
                    <DetailRow label="Available" val={fmt(d.balance)} asset={d.asset} />
                    <DetailRow label="Locked" val={parseFloat(d.locked) > 0 ? fmt(d.locked) : "—"} asset={d.asset} />
                    <DetailRow label="Borrowed" val={hasBorrow ? fmt(d.borrowed) : "—"} asset={d.asset} valColor={hasBorrow ? colors.red : undefined} />
                    <DetailRow label="Accrued Interest" val={debtRow?.interest_accrued && parseFloat(debtRow.interest_accrued) > 0 ? fmt(debtRow.interest_accrued) : "—"} asset={d.asset} valColor={debtRow?.interest_accrued && parseFloat(debtRow.interest_accrued) > 0 ? colors.red : undefined} />
                    <DetailRow label="Net" val={fmt(d.net)} asset={d.asset} valColor={netBadgeColor} />
                  </>
                ) : (
                  <>
                    <DetailRow label="Size" val={fmt(d.net_quantity)} asset={d.asset} valColor={sideColor} />
                    <DetailRow label="Position Value" val={fmt(Math.abs(parseFloat(d.value_usdt || 0)), 4)} asset="USDT" />
                    <DetailRow label="Entry Price" val={(d.entry_price == null || parseFloat(d.entry_price) === 0) ? "—" : fmtPrice(d.entry_price)} asset="USDT" />
                    <DetailRow label="Mark Price" val={d.mark_price != null ? fmtPrice(d.mark_price) : "—"} asset="USDT" />
                    <DetailRow label="Unrealized PnL" val={`${pnl >= 0 ? "+" : ""}${fmt(pnl, 4)}`} asset="USDT" valColor={pnlColor} />
                    <DetailRow label="ROE" val={`${roe >= 0 ? "+" : ""}${fmtPrice(roe)}`} asset="%" valColor={pnlColor} />
                    <DetailRow label="Realized PnL" val={fmt(d.realized_pnl, 4)} asset="USDT" />
                    {d.liquidation_price != null && (
                      <DetailRow label="Liquidation Price" val={fmtPrice(d.liquidation_price)} asset="USDT" valColor="#f59e0b" />
                    )}
                    <DetailRow label="Free Balance" val={fmt(freeBalance)} asset={d.asset} />
                  </>
                )}
              </View>
            </ScrollView>

            <View style={styles.actions}>
              {!isFund && (
                <ActionBtn
                  label="Close Position"
                  color={colors.red}
                  disabled={!d.position_id}
                  onPress={() => {
                    if (d.position_id) handleClosePosition(mPairKey);
                  }}
                />
              )}
              <ActionBtn
                label="Transfer"
                onPress={() => {
                  ref.current?.close();
                  NavigationService.navigate(MARGIN_TRANSFER_SCREEN, { fromWalletType: "spot", toWalletType: "cross_margin", coin: d?.asset });
                }}
              />
              <ActionBtn
                label="Borrow / Repay"
                onPress={() => {
                  setBorrowRepayMode(hasBorrow || debtRow ? "repay" : "borrow");
                  borrowRepaySheetRef.current?.open();
                }}
              />
            </View>
          </View>
        ) : <View />}
      </RBSheet>

      {d && (
        <CrossBorrowRepaySheet
          ref={borrowRepaySheetRef}
          theme={theme}
          themeColors={themeColors}
          asset={d.asset}
          currencyId={d.currency_id}
          debt={debtRow}
          freeBalance={freeBalance}
          defaultMode={borrowRepayMode}
          onSuccess={() => {
            if (onSuccess) onSuccess();
          }}
        />
      )}
    </>
  );
});

const DetailRow = ({ label, val, asset, valColor }) => (
  <View style={styles.row}>
    <AppText type={FOURTEEN} color={DISCLAIMTEXT}>{label}</AppText>
    <View style={{ alignItems: "flex-end" }}>
      <AppText type={FOURTEEN} weight={SEMI_BOLD} style={valColor ? { color: valColor } : {}}>
        {val === "—" ? "—" : asset === "%" ? `${val}%` : `${val} ${asset}`}
      </AppText>
    </View>
  </View>
);

const ActionBtn = ({ label, onPress, disabled, color }) => (
  <TouchableOpacity
    style={[styles.actionBtn, { opacity: disabled ? 0.5 : 1 }]}
    onPress={onPress}
    disabled={disabled}
  >
    <AppText type={FOURTEEN} weight={SEMI_BOLD} style={color ? { color } : {}}>{label}</AppText>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    paddingBottom: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  closeBtn: {
    padding: 5,
  },
  closeIcon: {
    width: 14,
    height: 14,
  },
  sideBadge: { borderWidth: 1, borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1, marginTop: 2 },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 5,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    marginTop: "auto",
    marginBottom: 10,
  },
  actionBtn: {
    flex: 1,
    height: 44,
    backgroundColor: "#F5F6F7",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default CrossMarginDetailSheet;
