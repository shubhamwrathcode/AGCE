import React, { forwardRef, useEffect, useState } from "react";
import { View, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, ScrollView } from "react-native";
import FastImage from "react-native-fast-image";
import RBSheet from "react-native-raw-bottom-sheet";
import { AppText, BOLD, DISCLAIMTEXT, EIGHTEEN, FOURTEEN, MEDIUM, SEMI_BOLD, SIXTEEN, THIRTEEN, TWELVE } from "../../../shared";
import { colors } from "../../../theme/colors";
import { close_ic, checkIc } from "../../../helper/ImageAssets";
import Toast from "react-native-simple-toast";
import { appOperation } from "../../../appOperation";
import { CUSTOMER_TYPE } from "../../../appOperation/types";

function fmt(val, decimals = 8) {
  const n = parseFloat(val);
  if (!val || isNaN(n) || n === 0) return (0).toFixed(decimals);
  return n.toFixed(decimals);
}

const CrossBorrowRepaySheet = forwardRef(({ theme, themeColors, asset, currencyId, debt, freeBalance, defaultMode = "borrow", onSuccess }, ref) => {
  const [tab, setTab] = useState(defaultMode);
  const [amount, setAmount] = useState("");
  const [repayFull, setRepayFull] = useState(false);
  const [borrowable, setBorrowable] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setTab(defaultMode);
    setAmount("");
    setRepayFull(false);
  }, [defaultMode, asset]);

  useEffect(() => {
    if (tab !== "borrow" || !currencyId) return;
    const fetchBorrowable = async () => {
      try {
        const res = await appOperation.get(`cross/borrowable?currency_id=${currencyId}`, undefined, undefined, CUSTOMER_TYPE);
        if (res?.success) setBorrowable(res.data);
      } catch (e) {
      }
    };
    fetchBorrowable();
  }, [tab, currencyId]);

  const maxBorrow = borrowable?.borrowable
    ? parseFloat(borrowable.borrowable).toFixed(8).replace(/\.?0+$/, "")
    : "0";

  const outstandingTotal = parseFloat(
    debt?.outstanding ?? ((parseFloat(debt?.principal || 0) + parseFloat(debt?.interest_accrued || 0)).toFixed(8))
  );

  const maxRepay = Math.min(parseFloat(freeBalance || 0), outstandingTotal)
    .toFixed(8).replace(/\.?0+$/, "");

  const handleConfirm = async () => {
    setBusy(true);
    try {
      let res;
      if (tab === "borrow") {
        if (!amount || parseFloat(amount) <= 0) {
          Toast.showWithGravity("Enter a valid amount", Toast.SHORT, Toast.BOTTOM);
          return;
        }
        if (parseFloat(amount) > parseFloat(maxBorrow)) {
          Toast.showWithGravity("Amount exceeds borrowable limit", Toast.SHORT, Toast.BOTTOM);
          return;
        }
        res = await appOperation.post("cross/borrow", { currency_id: currencyId, amount }, CUSTOMER_TYPE);
      } else {
        const hasDebt = outstandingTotal > 0;
        if (!hasDebt) {
          Toast.showWithGravity("No outstanding loan for this asset", Toast.SHORT, Toast.BOTTOM);
          return;
        }
        if (!repayFull && (!amount || parseFloat(amount) <= 0)) {
          Toast.showWithGravity("Enter a valid amount", Toast.SHORT, Toast.BOTTOM);
          return;
        }
        if (!repayFull && parseFloat(amount) > parseFloat(maxRepay)) {
          Toast.showWithGravity("Amount exceeds repayable limit", Toast.SHORT, Toast.BOTTOM);
          return;
        }
        res = await appOperation.post("cross/repay", {
          currency_id: currencyId,
          amount: repayFull ? undefined : amount,
        }, CUSTOMER_TYPE);
      }

      if (res?.success) {
        Toast.showWithGravity(res.message || (tab === "borrow" ? "Borrowed successfully" : "Loan repaid"), Toast.SHORT, Toast.BOTTOM);
        setAmount("");
        ref.current?.close();
        if (onSuccess) onSuccess();
      } else {
        Toast.showWithGravity(res?.message || "Operation failed", Toast.SHORT, Toast.BOTTOM);
      }
    } catch (e) {
      Toast.showWithGravity(e?.message || "Operation failed", Toast.SHORT, Toast.BOTTOM);
    } finally {
      setBusy(false);
    }
  };

  return (
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
      <View style={{ flex: 1, paddingBottom: 10 }}>
        <View style={[styles.header, { borderBottomWidth: 1, borderBottomColor: themeColors.border }]}>
          <View style={styles.tabs}>
            <TouchableOpacity onPress={() => { setTab("borrow"); setAmount(""); setRepayFull(false); }}>
              <AppText type={tab === "borrow" ? EIGHTEEN : SIXTEEN} weight={BOLD} color={tab === "borrow" ? (theme === "Dark" ? colors.white : colors.black) : DISCLAIMTEXT}>Borrow</AppText>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setTab("repay"); setAmount(""); setRepayFull(false); }}>
              <AppText type={tab === "repay" ? EIGHTEEN : SIXTEEN} weight={BOLD} color={tab === "repay" ? (theme === "Dark" ? colors.white : colors.black) : DISCLAIMTEXT}>Repay</AppText>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => ref.current?.close()} style={styles.closeBtn}>
            <FastImage source={close_ic} style={styles.closeIcon} tintColor={themeColors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={{ marginBottom: 20 }}>
            <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ marginBottom: 8 }}>Asset</AppText>
            <View style={[styles.inputBox, { backgroundColor: theme === "Dark" ? "#2C2C2E" : "#F5F6F7", height: 44 }]}>
              <AppText type={FOURTEEN} weight={SEMI_BOLD} color={theme === "Dark" ? colors.white : colors.black}>{asset}</AppText>
            </View>
          </View>

          {tab === "borrow" ? (
            <>
              {borrowable && (
                <View style={{ gap: 8, marginBottom: 20 }}>
                  <View style={styles.infoRow}>
                    <AppText type={FOURTEEN} color={DISCLAIMTEXT}>Borrowable</AppText>
                    <AppText type={FOURTEEN} color={themeColors.text}>{fmt(maxBorrow)} {asset}</AppText>
                  </View>
                  <View style={styles.infoRow}>
                    <AppText type={FOURTEEN} color={DISCLAIMTEXT}>Limited by</AppText>
                    <AppText type={FOURTEEN} color={DISCLAIMTEXT}>Your margin capacity</AppText>
                  </View>
                </View>
              )}

              <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ marginBottom: 8 }}>Loan Amount</AppText>
              <View style={[styles.inputBox, { backgroundColor: theme === "Dark" ? "#2C2C2E" : "#F5F6F7", marginBottom: 16 }]}>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="Enter amount to borrow"
                  placeholderTextColor={DISCLAIMTEXT}
                  keyboardType="numeric"
                  style={[styles.input, { color: theme === "Dark" ? colors.white : colors.black }]}
                />
                <View style={styles.inputSuffix}>
                  <AppText type={THIRTEEN} color={DISCLAIMTEXT}>{asset}</AppText>
                  <TouchableOpacity onPress={() => setAmount(maxBorrow)}>
                    <AppText type={THIRTEEN} color={DISCLAIMTEXT} weight={MEDIUM}>Max</AppText>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.blueBanner, { backgroundColor: theme === "Dark" ? "#1C273D" : "#EEF4FF" }]}>
                <View style={styles.infoIconWrapper}>
                  <AppText type={TWELVE} color={colors.white} weight={BOLD}>i</AppText>
                </View>
                <AppText type={TWELVE} color={theme === "Dark" ? "#A0B5D8" : "#4A5A7B"} style={{ flex: 1 }}>
                  Borrowed funds are available immediately. Interest accrues against your shared collateral.
                </AppText>
              </View>
            </>
          ) : (
            <>
              <View style={{ gap: 10 }}>
                <View style={styles.infoRow}>
                  <AppText type={FOURTEEN} color={DISCLAIMTEXT}>Principal</AppText>
                  <AppText type={FOURTEEN} color={themeColors.text}>{fmt(debt?.principal)} {asset}</AppText>
                </View>
                <View style={styles.infoRow}>
                  <AppText type={FOURTEEN} color={DISCLAIMTEXT}>Accrued Interest</AppText>
                  <AppText type={FOURTEEN} color={themeColors.text}>
                    {fmt(debt?.interest_accrued)} {asset}
                  </AppText>
                </View>
                <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: "rgba(128,128,128,0.15)", paddingTop: 10, marginTop: 4 }]}>
                  <AppText type={FOURTEEN} color={DISCLAIMTEXT}>Total Owed</AppText>
                  <AppText type={FOURTEEN} weight={SEMI_BOLD} color={themeColors.text}>{fmt(outstandingTotal)} {asset}</AppText>
                </View>
                <View style={styles.infoRow}>
                  <AppText type={FOURTEEN} color={DISCLAIMTEXT}>Free Balance</AppText>
                  <AppText type={FOURTEEN} color={themeColors.text}>{fmt(freeBalance)} {asset}</AppText>
                </View>
              </View>

              <TouchableOpacity style={styles.repayAllCheck} onPress={() => { setRepayFull(!repayFull); setAmount(""); }}>
                <View style={styles.checkbox}>
                  {repayFull ? <FastImage source={checkIc} style={styles.checkIcon} tintColor={colors.buttonBg} /> : null}
                </View>
                <AppText type={FOURTEEN} color={DISCLAIMTEXT}>Repay All (clears full debt including accrued interest)</AppText>
              </TouchableOpacity>

              {!repayFull && (
                <>
                  <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ marginTop: 20, marginBottom: 8 }}>Repayment Amount</AppText>
                  <View style={[styles.inputBox, { backgroundColor: theme === "Dark" ? "#2C2C2E" : "#F5F6F7", marginBottom: 8 }]}>
                    <TextInput
                      value={amount}
                      onChangeText={setAmount}
                      placeholder="Enter amount to repay"
                      placeholderTextColor={DISCLAIMTEXT}
                      keyboardType="numeric"
                      style={[styles.input, { color: theme === "Dark" ? colors.white : colors.black }]}
                    />
                    <View style={styles.inputSuffix}>
                      <AppText type={THIRTEEN} color={DISCLAIMTEXT}>{asset}</AppText>
                      <TouchableOpacity onPress={() => setAmount(maxRepay)}>
                        <AppText type={THIRTEEN} weight={SEMI_BOLD} color={DISCLAIMTEXT}>Max</AppText>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <AppText type={TWELVE} color={DISCLAIMTEXT} style={{ marginBottom: 12 }}>Max repayable: {fmt(maxRepay)} {asset}</AppText>
                </>
              )}

              <View style={[styles.blueBanner, { backgroundColor: theme === "Dark" ? "#1C273D" : "#EEF4FF", marginTop: repayFull ? 20 : 0 }]}>
                <View style={styles.infoIconWrapper}>
                  <AppText type={TWELVE} color={colors.white} weight={BOLD}>i</AppText>
                </View>
                <AppText type={TWELVE} color={theme === "Dark" ? "#A0B5D8" : "#4A5A7B"} style={{ flex: 1 }}>
                  Interest is settled first, then principal. Partial repayment is allowed at any time.
                </AppText>
              </View>
            </>
          )}
        </ScrollView>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.confirmBtn, { flex: 1, backgroundColor: theme === "Dark" ? "#1C1C1E" : "#11141D" }]}
            onPress={() => ref.current?.close()}
          >
            <AppText type={FOURTEEN} weight={BOLD} style={{ color: colors.white }}>Cancel</AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.confirmBtn, { flex: 1, backgroundColor: "#D9B37E", opacity: busy ? 0.6 : 1 }]}
            disabled={busy}
            onPress={handleConfirm}
          >
            {busy ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <AppText type={FOURTEEN} weight={BOLD} style={{ color: colors.white }}>
                {tab === "borrow" ? "Confirm Borrow" : "Confirm Repay"}
              </AppText>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </RBSheet>
  );
});

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    paddingBottom: 15,
  },
  tabs: {
    flexDirection: "row",
    gap: 20,
  },
  closeBtn: {
    padding: 5,
  },
  closeIcon: {
    width: 14,
    height: 14,
  },
  content: {
    padding: 20,
  },
  assetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  infoBox: {
    padding: 15,
    borderRadius: 8,
    backgroundColor: "rgba(128,128,128,0.05)",
    gap: 10,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    height: 50,
    paddingHorizontal: 15,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 14,
  },
  inputSuffix: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  maxBtn: {
    padding: 4,
    backgroundColor: "rgba(128,128,128,0.1)",
    borderRadius: 4,
  },
  repayAllCheck: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 20,
    marginBottom: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: colors.grey,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  checkIcon: {
    width: 10,
    height: 10,
  },
  actions: {
    flexDirection: "row",
    gap: 15,
    marginTop: "auto",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  confirmBtn: {
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  blueBanner: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 8,
    alignItems: "flex-start",
    gap: 10,
  },
  infoIconWrapper: {
    width: 16, height: 16, borderRadius: 8, backgroundColor: "#3375E0", alignItems: "center", justifyContent: "center", marginTop: 2
  },
});

export default CrossBorrowRepaySheet;
