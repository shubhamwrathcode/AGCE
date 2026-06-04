import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Platform,
  SafeAreaView,
  ActivityIndicator
} from "react-native";
import FastImage from "react-native-fast-image";
import {
  AppText,
  SEMI_BOLD,
  MEDIUM,
  fontFamilyMedium,
  fontFamilyRegular,
  BOLD
} from "../../shared";
import { IMAGE_BASE_URL } from "../../helper/Constants";
import { useTheme } from "../../hooks/useTheme";
import { colors } from "../../theme/colors";
import {
  back_ic,
  historyIcon,
  tick,
  swap,
  usdtIcon,
  bitcoinIcon,
  bnbIcon,
  trxIcon
} from "../../helper/ImageAssets";
import NavigationService from "../../navigation/NavigationService";
import SimpleToast from "react-native-simple-toast";
import { useRoute, useFocusEffect } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { appOperation } from "../../appOperation";
import { CUSTOMER_TYPE } from "../../appOperation/types";

const MarginBorrowRepay = () => {
  const { colors: themeColors, isDark } = useTheme();
  const route = useRoute();

  const pair = route?.params?.pair || "BTC/USDT";
  const [baseSymbol, quoteSymbol] = pair.split("/");

  const initialTab = route?.params?.activeTab || "Borrow";
  const loan = route?.params?.loan;

  const [activeTab, setActiveTab] = useState(initialTab); // "Borrow" or "Repay"

  const [selectedAsset, setSelectedAsset] = useState(route?.params?.coin || baseSymbol || "BTC");
  const [amount, setAmount] = useState("");

  const [liveData, setLiveData] = useState(null);
  const [busy, setBusy] = useState(false);

  const currencyData = useSelector((state) => state.home.currencyData);
  const coinPairs = useSelector((state) => state.home.coinPairs);
  const spotSelectedPair = useSelector((state) => state.home.spotSelectedPair);

  const coinBalance = useSelector((state) => state.home.coinBalance);

  const currentPairItem = useMemo(() => {
    if (!coinPairs || !Array.isArray(coinPairs)) return null;
    return coinPairs.find(p => p.base_currency === baseSymbol && p.quote_currency === quoteSymbol) || null;
  }, [coinPairs, baseSymbol, quoteSymbol]);

  const pairId = currentPairItem?._id || currencyData?._id || spotSelectedPair?._id || loan?.pair_id || "";

  const isBorrow = activeTab === "Borrow";
  const isCoinBase = selectedAsset === baseSymbol;

  const marginMode = route?.params?.marginMode || "Isolated";
  const isCross = marginMode === "Cross";

  const fetchLive = useCallback(() => {
    if (isCross) {
      appOperation.get(`cross/account`, undefined, undefined, CUSTOMER_TYPE)
        .then((res) => { if (res?.success) setLiveData(res.data); })
        .catch(() => { });
    } else {
      if (!pairId) {
        console.warn("MarginBorrowRepay: Missing pairId. Cannot fetch live data.");
        return;
      }
      appOperation.get(`margin/account/${pairId}`, undefined, undefined, CUSTOMER_TYPE)
        .then((res) => { if (res?.success) setLiveData(res.data); })
        .catch(() => { });
    }
  }, [pairId, isCross]);

  useFocusEffect(
    useCallback(() => {
      fetchLive();
    }, [fetchLive])
  );

  const borrowable = isCross
    ? (isCoinBase ? (liveData?.borrowable?.base ?? "0") : (liveData?.borrowable?.quote ?? "0")) // Note: Cross account might not return borrowable directly like this. It requires cross/borrowable API. Let's see if we have crossBorrowable in redux.
    : (isCoinBase ? (liveData?.borrowable?.base ?? "0") : (liveData?.borrowable?.quote ?? "0"));
    
  // Wait, I will use redux crossBorrowable instead if isCross
  const crossBorrowableMap = useSelector((state) => state.home.crossBorrowable) || {};
  const selectedCurrencyId = isCoinBase ? currentPairItem?.base_currency_id : currentPairItem?.quote_currency_id;
  const crossBorrowData = crossBorrowableMap[selectedCurrencyId] || {};
  const cBorrowable = crossBorrowData?.borrowable ?? crossBorrowData?.max_borrow ?? "0";

  const finalBorrowable = isCross ? cBorrowable : borrowable;

  const getCrossAsset = (symbol) => {
    if (!liveData?.assets) return null;
    return liveData.assets.find(a => a.currency === symbol) || null;
  };

  const borrowed = isCross
    ? (getCrossAsset(selectedAsset)?.borrowed || "0")
    : (isCoinBase ? (liveData?.balances?.base_borrowed ?? loan?.outstanding ?? "0") : (liveData?.balances?.quote_borrowed ?? loan?.outstanding ?? "0"));

  const sellCoinBal = coinBalance?.base_currency_balance;
  const buyCoinBal = coinBalance?.quote_currency_balance;

  // Margin balances take precedence over spot balance
  const available = isCross
    ? (getCrossAsset(selectedAsset)?.available || "0")
    : (isCoinBase ? (liveData?.balances?.base_available ?? sellCoinBal ?? "0") : (liveData?.balances?.quote_available ?? buyCoinBal ?? "0"));

  const ml = isCross ? (liveData?.summary?.margin_level != null ? parseFloat(liveData.summary.margin_level) : null) : (liveData?.margin_level != null ? parseFloat(liveData.margin_level) : null);
  const marginLevelDisplay = ml === null ? (isCross ? "—" : "13.52") : ml >= 999 ? "∞" : ml.toFixed(2);
  const liqPriceRaw = isCross ? (liveData?.summary?.est_liq_price ?? "") : (liveData?.est_liq_price ?? "");
  const liqPrice = liqPriceRaw ? parseFloat(liqPriceRaw).toFixed(2) : "—";

  const crossInterest = getCrossAsset(selectedAsset);
  
  const hourlyRate = isCross
    ? (crossInterest?.hourly_interest_rate_pct != null ? `${crossInterest.hourly_interest_rate_pct}%` : "0.00200000%")
    : (liveData?.interest?.hourly_pct != null ? `${liveData.interest.hourly_pct}%` : loan?.hourly_rate_pct != null ? `${loan.hourly_rate_pct}%` : selectedAsset === "BTC" ? "0.00125000%" : "0.00200000%");

  const annualRate = isCross
    ? (crossInterest?.annual_interest_rate_pct != null ? `${crossInterest.annual_interest_rate_pct}%` : "17.520000%")
    : (liveData?.interest?.annualized_pct != null ? `${liveData.interest.annualized_pct}%` : loan?.apr_pct != null ? `${loan.apr_pct}%` : selectedAsset === "BTC" ? "10.950000%" : "17.520000%");

  const handleConfirm = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      SimpleToast.show(`Please enter a valid ${isBorrow ? "loan" : "repayment"} amount`);
      return;
    }
    if (isBorrow && parseFloat(amount) > parseFloat(finalBorrowable || 0)) {
      SimpleToast.show("Amount exceeds borrowable limit");
      return;
    }
    if (!isBorrow && parseFloat(amount) > parseFloat(borrowed || 0)) {
      SimpleToast.show("Amount exceeds outstanding loan");
      return;
    }
    setBusy(true);
    try {
      let res;
      if (isCross) {
        if (!selectedCurrencyId) throw new Error("Currency ID not found");
        if (isBorrow) {
            res = await appOperation.customer.crossBorrow({ currency_id: selectedCurrencyId, amount });
        } else {
            res = await appOperation.customer.crossRepay({ currency_id: selectedCurrencyId, amount });
        }
      } else {
        const assetType = isCoinBase ? "base" : "quote";
        const endpoint = isBorrow ? "margin/borrow" : "margin/repay";
        const pairIdToUse = loan?.pair_id || pairId;
        const payload = { pairId: pairIdToUse, assetType, amount: String(amount) };
        console.log("[MarginBorrowRepay] Payload:", payload);
        res = await appOperation.post(endpoint, payload, CUSTOMER_TYPE);
      }
      
      if (res?.success) {
        SimpleToast.show(res.message || `${isBorrow ? "Borrowed" : "Repaid"} ${amount} ${selectedAsset} successfully`);
        setAmount("");
        fetchLive();
        if (!isBorrow) NavigationService.goBack();
      } else {
        SimpleToast.show(res?.message || "Operation failed");
      }
    } catch (err) {
      SimpleToast.show(err?.message || "Operation failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#171a20" : colors.white }}>
      {/* Header */}
      <View style={[styles.header]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 18 }}>
          <TouchableOpacity
            onPress={() => NavigationService.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <FastImage
              source={back_ic}
              style={{ width: 20, height: 20 }}
              resizeMode="contain"
              tintColor={themeColors.text}
            />
          </TouchableOpacity>

          <View style={styles.headerTabsContainer}>
            <TouchableOpacity onPress={() => { setActiveTab("Borrow"); setAmount(""); }} style={styles.headerTabBtn}>
              <AppText
                weight={SEMI_BOLD}
                style={{
                  fontSize: 18,
                  color: activeTab === "Borrow" ? themeColors.text : themeColors.secondaryText,
                }}
              >
                Borrow
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setActiveTab("Repay"); setAmount(""); }} style={styles.headerTabBtn}>
              <AppText
                weight={SEMI_BOLD}
                style={{
                  fontSize: 18,
                  color: activeTab === "Repay" ? themeColors.text : themeColors.secondaryText,
                }}
              >
                Repay
              </AppText>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => SimpleToast.show("History coming soon")}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <FastImage
            source={historyIcon}
            style={{ width: 22, height: 22 }}
            resizeMode="contain"
            tintColor={themeColors.text}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 }}
      >
        {/* Pairs */}
        <AppText weight={SEMI_BOLD} style={{ fontSize: 16, color: themeColors.text, marginBottom: 8 }}>Pairs</AppText>
        <View style={[styles.inputContainer, { backgroundColor: isDark ? "#2C2C2E" : "#F7F7F9", marginBottom: 16 }]}>
          <AppText weight={SEMI_BOLD} style={{ color: themeColors.text, fontSize: 15 }}>{pair}</AppText>
        </View>

        {/* Coin Selection (Pairs) */}
        <View style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: "row", gap: 12 }}>
            {[baseSymbol, quoteSymbol].map((symbol) => {
              if (!symbol) return null;
              const isSelected = selectedAsset === symbol;
              const isBase = symbol === baseSymbol;

              const getFullName = (sym) => {
                if (isBase) {
                  const baseName = currencyData?.base_currency_fullname || currencyData?.base_currency_name;
                  if (baseName) return baseName;
                } else {
                  const quoteName = currencyData?.quote_currency_fullname || currencyData?.quote_currency_name;
                  if (quoteName) return quoteName;
                }

                // Static fallbacks in case API data is missing full name
                if (sym === "BTC") return "Bitcoin";
                if (sym === "USDT") return "Tether";
                if (sym === "ETH") return "Ethereum";
                if (sym === "USDC") return "USD Coin";
                if (sym === "BNB") return "BNB";
                if (sym === "SOL") return "Solana";
                if (sym === "XRP") return "XRP";
                if (sym === "ADA") return "Cardano";
                if (sym === "DOGE") return "Dogecoin";
                return sym;
              };
              const fullName = getFullName(symbol);

              return (
                <TouchableOpacity
                  key={symbol}
                  onPress={() => { setSelectedAsset(symbol); setAmount(""); }}
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 12,
                    paddingHorizontal: 10,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: isSelected ? "#D9B37E" : (isDark ? "#2C2C2E" : "#F3F4F6"),
                    backgroundColor: isSelected ? (isDark ? "#2A2218" : "#FDF6ED") : (isDark ? "#1C1C1E" : "#FFFFFF"),
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 1,
                  }}
                  activeOpacity={0.8}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    {/* Coin Text */}
                    <View>
                      <AppText weight={BOLD} style={{ fontSize: 14, color: themeColors.text }}>
                        {symbol}
                      </AppText>
                      <AppText style={{ fontSize: 11, color: themeColors.secondaryText, marginTop: 1 }}>
                        {fullName}
                      </AppText>
                    </View>
                  </View>

                  {/* Radio Indicator */}
                  <View style={{
                    width: 18, height: 18, borderRadius: 9,
                    borderWidth: isSelected ? 0 : 1.5,
                    borderColor: isDark ? "#4A4A4C" : "#E5E7EB",
                    backgroundColor: isSelected ? "#C69C6D" : "transparent",
                    alignItems: "center", justifyContent: "center"
                  }}>
                    {isSelected && (
                      <FastImage source={tick} style={{ width: 10, height: 10 }} tintColor={colors.white} resizeMode="contain" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Outstanding Loan (Repay Tab Only) */}
        {!isBorrow && (
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
            <AppText style={{ fontSize: 14, color: themeColors.secondaryText }}>Outstanding Loan</AppText>
            <AppText style={{ fontSize: 14, color: themeColors.secondaryText }}>
              {parseFloat(borrowed || 0).toFixed(8)} {selectedAsset}
            </AppText>
          </View>
        )}

        {/* Loan Amount Label */}
        <AppText weight={SEMI_BOLD} style={{ fontSize: 16, color: themeColors.text, marginBottom: 8 }}>
          {isBorrow ? "Loan Amount" : "Repayment Amount"}
        </AppText>

        {/* Input */}
        <View style={[styles.inputContainer, { backgroundColor: isDark ? "#2C2C2E" : "#F7F7F9", marginBottom: isBorrow ? 20 : 8 }]}>
          <TextInput
            placeholder={`Enter ${isBorrow ? "borrow" : "repayment"} amount`}
            placeholderTextColor="#8E8E93"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            cursorColor={themeColors.text}
            style={{ flex: 1, color: themeColors.text, fontSize: 14, fontFamily: fontFamilyMedium, paddingVertical: Platform.OS === "ios" ? 12 : 8 }}
          />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <AppText style={{ color: themeColors.text, fontSize: 14 }}>{selectedAsset}</AppText>
            <TouchableOpacity onPress={() => setAmount(String(parseFloat(isBorrow ? finalBorrowable : borrowed)))} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <AppText style={{ color: themeColors.text, fontSize: 14 }}>All</AppText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Available Balance (Repay Tab Only) */}
        {!isBorrow && (
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
            <AppText style={{ fontSize: 13, color: themeColors.secondaryText }}>Available: </AppText>
            <AppText weight={SEMI_BOLD} style={{ fontSize: 13, color: themeColors.text, marginRight: 6 }}>
              {parseFloat(available || 0).toFixed(8)} {selectedAsset}
            </AppText>

          </View>
        )}

        {/* Detail Rows */}
        <View style={{ gap: 12, marginBottom: 20 }}>
          {isBorrow ? (
            <>
              <View style={styles.detailRow}>
                <AppText style={{ fontSize: 14, color: themeColors.secondaryText }}>Maximum Borrow Amount</AppText>
                <AppText style={{ fontSize: 14, color: themeColors.secondaryText }}>
                  {parseFloat(finalBorrowable || 0).toFixed(8)} {selectedAsset}
                </AppText>
              </View>
              <View style={styles.detailRow}>
                <AppText style={{ fontSize: 14, color: themeColors.secondaryText }}>Est. Liq Price</AppText>
                <AppText style={{ fontSize: 14, color: themeColors.secondaryText }}>
                  {liqPrice} {quoteSymbol}
                </AppText>
              </View>
              <View style={styles.detailRow}>
                <AppText style={{ fontSize: 14, color: themeColors.secondaryText }}>Hourly Interest Rate</AppText>
                <AppText style={{ fontSize: 14, color: themeColors.secondaryText }}>
                  {hourlyRate}
                </AppText>
              </View>

              {/* Note text between hourly and annual */}
              <AppText style={{ fontSize: 13, color: themeColors.secondaryText, lineHeight: 18, marginTop: 4, marginBottom: 4 }}>
                * Interest starts accruing immediately when tokens are borrowed. The first charge is prorated based on the actual time elapsed. Subsequent interest is charged once per hour until fully repaid.
              </AppText>

              <View style={styles.detailRow}>
                <AppText style={{ fontSize: 14, color: themeColors.secondaryText }}>Annualized Interest Rate</AppText>
                <AppText style={{ fontSize: 14, color: themeColors.secondaryText }}>
                  {annualRate}
                </AppText>
              </View>
              <View style={styles.detailRow}>
                <AppText style={{ fontSize: 14, color: themeColors.secondaryText }}>Borrowed</AppText>
                <AppText style={{ fontSize: 14, color: themeColors.secondaryText }}>
                  {parseFloat(borrowed || 0).toFixed(8)} {selectedAsset}
                </AppText>
              </View>
              <View style={styles.detailRow}>
                <AppText style={{ fontSize: 14, color: themeColors.secondaryText }}>Borrow Margin Level</AppText>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <FastImage source={tick} style={{ width: 14, height: 14 }} tintColor={themeColors.secondaryText} resizeMode="contain" />
                  <AppText style={{ fontSize: 14, color: themeColors.secondaryText }}>
                    {marginLevelDisplay}
                  </AppText>
                </View>
              </View>
            </>
          ) : null}
        </View>

        {/* Blue Info Box */}
        <View style={{
          flexDirection: "row",
          backgroundColor: isDark ? "#1C273D" : "#EEF4FF",
          padding: 12,
          borderRadius: 8,
          marginBottom: 24,
          alignItems: "flex-start",
          gap: 10
        }}>
          <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: "#3375E0", alignItems: "center", justifyContent: "center", marginTop: 2 }}>
            <AppText weight={MEDIUM} style={{ color: colors.white, fontSize: 10, }}>i</AppText>
          </View>
          <AppText style={{ flex: 1, fontSize: 13, color: isDark ? "#A0B5D8" : "#4A5A7B", lineHeight: 18 }} weight={MEDIUM}>
            {isBorrow
              ? "Borrowed funds are subject to hourly interest charges starting immediately. If your margin level falls below the maintenance threshold, your position may be automatically liquidated. Only borrow what you can afford to repay."
              : "Interest is settled first from your repayment amount, with the remainder applied to the principal. You may repay partially or in full at any time. After repayment, your margin level and liquidation price will update accordingly."}
          </AppText>
        </View>

        {/* Confirm Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleConfirm}
          disabled={busy}
          style={[styles.actionBtn, { backgroundColor: isDark ? "#1C1C1E" : "#11141D", marginBottom: 16, flexDirection: "row", gap: 8 }]}
        >
          {busy && <ActivityIndicator color={colors.white} size="small" />}
          <AppText weight={SEMI_BOLD} style={{ color: colors.white, fontSize: 16 }}>
            {busy ? "Confirming..." : "Confirm"}
          </AppText>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

export default MarginBorrowRepay;

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  headerTabsContainer: {
    flexDirection: "row",
    gap: 15,
  },
  headerTabBtn: {
    paddingVertical: 8,
  },
  inputContainer: {
    height: 50,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actionBtn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
});
