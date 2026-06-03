import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Platform,
  SafeAreaView,
  ActivityIndicator
} from "react-native";
import FastImage from "react-native-fast-image";
import { useRoute, useNavigation } from "@react-navigation/native";
import { AppText, SEMI_BOLD, Button, MEDIUM } from "../../shared";
import { colors, lightTheme } from "../../theme/colors";
import { useTheme } from "../../hooks/useTheme";
import {
  back_ic,
  bitcoin_ic,
  checkIc,
  downIcon,
  historyIcon,
  transferNew,
  REMOVE,
  marginIc,
  p2p_ic,
  fiat_ic,
  onchain_ic,
  deliveryFuture,
  tradeFi,
  usdtPerp,
  btcPerp,
  add
} from "../../helper/ImageAssets";
import SimpleToast from "react-native-simple-toast";
import { fontFamilyMedium } from "../../theme/typography";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { getParticularCoinBalance } from "../../actions/walletActions";
import RBSheet from "react-native-raw-bottom-sheet";
import { appOperation } from "../../appOperation";
import { IMAGE_BASE_URL } from "../../helper/Constants";

const AVAILABLE_WALLETS = [
  { key: "main", label: "Main Wallet", icon: tradeFi },
  { key: "spot", label: "Spot Wallet", icon: onchain_ic },
  // { key: "p2p", label: "P2P Wallet", icon: p2p_ic },
  // { key: "futures", label: "Futures Wallet", icon: deliveryFuture },
  // { key: "swap", label: "Swap Wallet", icon: fiat_ic },
  // { key: "earning", label: "Earning Wallet", icon: btcPerp },
  { key: "margin", label: "Isolated Margin Wallet", icon: marginIc },
  { key: "cross_margin", label: "Cross Margin Wallet", icon: usdtPerp },
];

const MarginTransfer = () => {
  const { colors: themeColors, isDark } = useTheme();
  const route = useRoute();
  const navigation = useNavigation();

  const [fromWalletType, setFromWalletType] = useState(route?.params?.fromWalletType || "spot");
  const [toWalletType, setToWalletType] = useState(route?.params?.toWalletType || "main");

  const [transferAmount, setTransferAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useAppDispatch();
  const particularCoinBalance = useAppSelector(state => state.wallet.particularCoinBalance);

  const buildCoinIconUri = useCallback((iconPath) => {
    const raw = iconPath === undefined || iconPath === null ? "" : String(iconPath).trim();
    if (!raw) return null;
    if (/^https?:\/\//i.test(raw)) return raw;
    const base = String(IMAGE_BASE_URL || "").replace(/\/+$/, "");
    const path = raw.startsWith("/") ? raw : `/${raw}`;
    return `${base}${path}`;
  }, []);

  // Coins / Pairs State
  const currencyData = useAppSelector((state) => state.wallet.userMainWallet || []);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [coinSearch, setCoinSearch] = useState("");

  const [marginPairs, setMarginPairs] = useState([]);
  const [selectedMarginPair, setSelectedMarginPair] = useState(null);
  const [marginAssetType, setMarginAssetType] = useState("base"); // 'base' | 'quote'
  const [marginMaxAmount, setMarginMaxAmount] = useState("0");

  // Bottom Sheets
  const rbSheetWallet = useRef();
  const rbSheetCoins = useRef();
  const rbSheetMarginPairs = useRef();

  const [selectingWalletFor, setSelectingWalletFor] = useState("from"); // "from" | "to"

  const isMarginTransfer = fromWalletType === "margin" || toWalletType === "margin";
  const isCrossMarginTransfer = fromWalletType === "cross_margin" || toWalletType === "cross_margin";

  // Pre-select coin
  useEffect(() => {
    if (currencyData.length > 0 && !selectedCurrency) {
      const defaultCoin = route?.params?.coin;
      const found = defaultCoin
        ? currencyData.find(c => c.short_name === defaultCoin || c.currency === defaultCoin)
        : currencyData.find(c => c.short_name === "BTC");
      setSelectedCurrency(found || currencyData[0]);
    }
  }, [currencyData, selectedCurrency, route?.params?.coin]);

  // Fetch Margin Pairs if dealing with isolated margin
  useEffect(() => {
    if (isMarginTransfer && marginPairs.length === 0) {
      appOperation.customer.margin_accounts().then((res) => {
        if (res?.success) {
          setMarginPairs(res.data);
          if (res.data.length > 0 && !selectedMarginPair) {
            setSelectedMarginPair(res.data[0]);
          }
        }
      }).catch(console.log);
    }
  }, [isMarginTransfer, marginPairs.length, selectedMarginPair]);

  // Fetch Max Transfer for Isolated Margin
  useEffect(() => {
    if (!isMarginTransfer || !selectedMarginPair?.pair_id) return;
    const direction = fromWalletType === "margin" ? "FROM_MARGIN" : "TO_MARGIN";
    const wt = fromWalletType === "margin" ? toWalletType : fromWalletType;

    appOperation.customer.margin_max_transfer({
      pairId: selectedMarginPair.pair_id,
      assetType: marginAssetType,
      direction,
      walletType: wt
    }).then((res) => {
      if (res?.success) setMarginMaxAmount(res.data?.max_amount ?? "0");
    }).catch(console.log);
  }, [isMarginTransfer, selectedMarginPair, marginAssetType, fromWalletType, toWalletType]);

  // Fetch Particular Coin Balance for Spot/Main/Cross Margin
  useEffect(() => {
    if (!isMarginTransfer && selectedCurrency?.currency_id && fromWalletType && toWalletType) {
      dispatch(getParticularCoinBalance({
        fromWallet: fromWalletType,
        toWallet: toWalletType,
        currencyId: selectedCurrency.currency_id
      }));
    }
  }, [selectedCurrency, fromWalletType, toWalletType, isMarginTransfer, dispatch]);

  const transferable = useMemo(() => {
    if (isMarginTransfer) return marginMaxAmount || "0.00";
    if (fromWalletType === "cross_margin") {
      return particularCoinBalance?.fromWallet?.max_transferable ?? particularCoinBalance?.fromWallet?.balance ?? "0.00";
    }
    return particularCoinBalance?.fromWallet?.balance || "0.00";
  }, [isMarginTransfer, marginMaxAmount, fromWalletType, particularCoinBalance]);

  // Get selected coin for margin display
  const marginSelectedCoinName = useMemo(() => {
    if (!isMarginTransfer || !selectedMarginPair) return "";
    return marginAssetType === "base" ? selectedMarginPair.base_asset : selectedMarginPair.quote_asset;
  }, [isMarginTransfer, selectedMarginPair, marginAssetType]);



  const filteredCoins = useMemo(() => {
    if (!coinSearch) return currencyData;
    const s = coinSearch.toLowerCase();
    return currencyData.filter(
      (c) =>
        (c?.short_name || "").toLowerCase().includes(s) ||
        (c?.currency || "").toLowerCase().includes(s)
    );
  }, [currencyData, coinSearch]);

  const handleSwapDirection = () => {
    const temp = fromWalletType;
    setFromWalletType(toWalletType);
    setToWalletType(temp);
    setTransferAmount("");
  };

  const handleAll = () => {
    setTransferAmount(String(transferable));
  };

  const handleConfirmTransfer = async () => {
    if (!transferAmount || Number(transferAmount) <= 0) {
      SimpleToast.show("Please enter a valid amount");
      return;
    }

    setIsLoading(true);
    try {
      if (isMarginTransfer) {
        if (!selectedMarginPair?.pair_id) throw new Error("Please select a margin pair");
        const direction = fromWalletType === "margin" ? "FROM_MARGIN" : "TO_MARGIN";
        const wt = fromWalletType === "margin" ? toWalletType : fromWalletType;
        const result = await appOperation.customer.margin_wallet_transfer({
          pairId: selectedMarginPair.pair_id,
          assetType: marginAssetType,
          amount: transferAmount,
          direction,
          walletType: wt
        });
        if (result?.success) {
          SimpleToast.show(result?.message || "Transfer successful");
          navigation.goBack();
        } else {
          SimpleToast.show(result?.message || "Transfer failed");
        }
      } else if (isCrossMarginTransfer) {
        const result = await appOperation.customer.cross_transfer({
          currency_id: selectedCurrency?.currency_id,
          amount: transferAmount,
          direction: fromWalletType === "cross_margin" ? "FROM_CROSS" : "TO_CROSS",
          walletType: "spot"
        });
        if (result?.success) {
          SimpleToast.show(result?.message || "Transfer successful");
          navigation.goBack();
        } else {
          SimpleToast.show(result?.message || "Transfer failed");
        }
      } else {
        const result = await appOperation.customer.tranfer_coin({
          fromWallet: fromWalletType,
          toWallet: toWalletType,
          currencyId: selectedCurrency?.currency_id,
          amount: transferAmount
        });
        if (result?.success) {
          SimpleToast.show(result?.message || "Transfer successful");
          navigation.goBack();
        } else {
          SimpleToast.show(result?.message || "Transfer failed");
        }
      }
    } catch (e) {
      SimpleToast.show(e?.message || "Transfer failed");
    } finally {
      setIsLoading(false);
    }
  };
  const getWalletLabel = (key) => AVAILABLE_WALLETS.find(w => w.key === key)?.label || "Wallet";

  const renderWalletCard = (type, labelText, onPress) => {
    return (
      <View style={[styles.directionCard, { backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7" }]}>
        <AppText style={styles.directionLabel}>{labelText}</AppText>
        <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.selectRow}>
          <AppText weight={SEMI_BOLD} style={[styles.directionValue, { color: themeColors.text }]}>
            {getWalletLabel(type)}
          </AppText>
          <FastImage source={downIcon} style={{ width: 10, height: 10 }} resizeMode="contain" tintColor={themeColors.secondaryText} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#171a20" : colors.white }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} style={styles.headerLeft}>
          <FastImage source={back_ic} style={{ width: 20, height: 20 }} resizeMode="contain" tintColor={themeColors.text} />
        </TouchableOpacity>
        <AppText weight={SEMI_BOLD} style={{ fontSize: 18, color: themeColors.text }}>Transfer</AppText>
        <TouchableOpacity onPress={() => SimpleToast.show("Transfer history coming soon")} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} style={styles.headerRight}>
          <FastImage source={historyIcon} style={{ width: 22, height: 22 }} resizeMode="contain" tintColor={themeColors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 }}>
        {/* Direction Cards */}
        <View style={styles.directionContainer}>
          {renderWalletCard(fromWalletType, "From", () => { setSelectingWalletFor("from"); rbSheetWallet.current?.open(); })}
          <View style={styles.swapBtnWrapper}>
            <TouchableOpacity activeOpacity={0.9} onPress={handleSwapDirection} style={[styles.swapCircle, { backgroundColor: colors.iconBgColor, borderColor: isDark ? "#171a20" : colors.white }]}>
              <FastImage source={transferNew} style={{ width: 18, height: 18 }} resizeMode="contain" />
            </TouchableOpacity>
          </View>
          {renderWalletCard(toWalletType, "To", () => { setSelectingWalletFor("to"); rbSheetWallet.current?.open(); })}
        </View>

        {/* Dynamic Selection: Margin Pair or Currency */}
        {isMarginTransfer ? (
          <>
            <AppText weight={SEMI_BOLD} style={[styles.sectionTitle, { color: themeColors.text }]}>Margin Pair</AppText>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => rbSheetMarginPairs.current?.open()}
              style={[styles.inputContainer, { backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7", marginBottom: 16 }]}
            >
              {selectedMarginPair?.icon_path && (
                <FastImage
                  source={{ uri: buildCoinIconUri(selectedMarginPair.icon_path) }}
                  style={{ width: 24, height: 24, marginRight: 8, borderRadius: 12 }}
                  resizeMode="contain"
                />
              )}
              <AppText weight={MEDIUM} style={{ flex: 1, color: themeColors.text, fontSize: 15 }}>
                {selectedMarginPair ? `${selectedMarginPair.base_asset}/${selectedMarginPair.quote_asset}` : "Select Pair"}
              </AppText>
              <FastImage source={downIcon} style={{ width: 12, height: 12 }} resizeMode="contain" tintColor={themeColors.secondaryText} />
            </TouchableOpacity>

            {selectedMarginPair && (
              <>
                <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
                  {["base", "quote"].map((assetType) => {
                    const isSelected = marginAssetType === assetType;
                    const assetName = assetType === "base" ? selectedMarginPair.base_asset : selectedMarginPair.quote_asset;
                    const coinInfo = currencyData.find(c => c.short_name === assetName);
                    const coinFullName = coinInfo?.currency || assetName;
                    const coinIcon = coinInfo?.icon_path;

                    return (
                      <TouchableOpacity
                        key={assetType}
                        onPress={() => setMarginAssetType(assetType)}
                        style={[
                          styles.coinBox,
                          {
                            flex: 1,
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "flex-start",
                            paddingHorizontal: 12,
                            paddingVertical: 12,
                            borderColor: isSelected ? "#D1AA67" : themeColors.themeBorderColor,
                            backgroundColor: isSelected ? (isDark ? "#2A241C" : "#FCF2E1") : (isDark ? "#1C1C1E" : colors.white),
                          }
                        ]}
                      >
                        {coinIcon ? (
                          <FastImage
                            source={{ uri: buildCoinIconUri(coinIcon) }}
                            style={{ width: 26, height: 26, borderRadius: 13 }}
                            resizeMode="contain"
                          />
                        ) : (
                          <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: "#E5E5E5" }} />
                        )}
                        <View style={{ marginLeft: 8, flex: 1, alignItems: "flex-start" }}>
                          <AppText weight={SEMI_BOLD} style={{ color: themeColors.text, fontSize: 14 }}>
                            {assetName}
                          </AppText>
                          {coinFullName !== assetName && (
                            <AppText style={{ color: themeColors.secondaryText, fontSize: 11, marginTop: 1 }}>
                              {coinFullName}
                            </AppText>
                          )}
                        </View>
                        {isSelected ? (
                          <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: "#D1AA67", alignItems: "center", justifyContent: "center" }}>
                            <FastImage source={checkIc} style={{ width: 10, height: 10 }} resizeMode="contain" tintColor="#FFF" />
                          </View>
                        ) : (
                          <View style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: "#E5E5EA" }} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}
          </>
        ) : (
          <>
            <AppText weight={SEMI_BOLD} style={[styles.sectionTitle, { color: themeColors.text }]}>Coin</AppText>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => rbSheetCoins.current?.open()}
              style={[styles.inputContainer, { backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7", marginBottom: 16 }]}
            >
              {selectedCurrency ? (
                <FastImage
                  source={buildCoinIconUri(selectedCurrency?.icon_path) ? { uri: buildCoinIconUri(selectedCurrency?.icon_path) } : bitcoin_ic}
                  style={{ width: 24, height: 24, marginRight: 10 }}
                  resizeMode="contain"
                />
              ) : null}
              <AppText weight={MEDIUM} style={{ flex: 1, color: themeColors.text, fontSize: 15 }}>
                {selectedCurrency?.short_name || "Select Coin"}
              </AppText>
              <FastImage source={downIcon} style={{ width: 12, height: 12 }} resizeMode="contain" tintColor={themeColors.secondaryText} />
            </TouchableOpacity>
          </>
        )}

        {/* Amount Input Section */}
        <AppText weight={SEMI_BOLD} style={[styles.sectionTitle, { color: themeColors.text }]}>Amount</AppText>
        <View style={[styles.inputContainer, { backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7" }]}>
          <TextInput
            placeholder="0.00"
            placeholderTextColor={isDark ? "#5A5A5C" : "#C7C7CC"}
            value={transferAmount}
            onChangeText={setTransferAmount}
            keyboardType="numeric"
            cursorColor={colors.black}
            style={{
              flex: 1,
              color: themeColors.text,
              fontSize: 15,
              fontFamily: fontFamilyMedium,
              paddingVertical: Platform.OS === "ios" ? 8 : 4,
            }}
          />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <AppText weight={SEMI_BOLD} style={{ color: themeColors.text, fontSize: 14 }}>
              {isMarginTransfer ? marginSelectedCoinName : selectedCurrency?.short_name || ""}
            </AppText>
            <View style={{ width: 1, height: 16, backgroundColor: themeColors.themeBorderColor }} />
            <TouchableOpacity onPress={handleAll}>
              <AppText weight={SEMI_BOLD} style={{ color: "#D1AA67", fontSize: 14 }}>All</AppText>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 }}>
          <AppText style={{ fontSize: 12, color: themeColors.secondaryText }}>
            Balance: {transferable} {isMarginTransfer ? marginSelectedCoinName : selectedCurrency?.short_name || ""}
          </AppText>
        </View>
      </ScrollView>

      {/* Confirm Button */}
      <View style={[styles.bottomBtnWrap, { borderTopColor: themeColors.themeBorderColor }]}>
        <Button
          onPress={handleConfirmTransfer}
          disabled={
            isLoading ||
            !transferAmount ||
            Number(transferAmount) <= 0 ||
            Number(transferAmount) > parseFloat(transferable || 0)
          }
        >
          {isLoading ? <ActivityIndicator color="#FFF" /> : "Confirm"}
        </Button>
      </View>

      {/* Wallet Selector Sheet */}
      <RBSheet
        ref={rbSheetWallet}
        closeOnDragDown={true}
        height={600}
        customStyles={{
          container: { backgroundColor: isDark ? "#171a20" : colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 16 },
          draggableIcon: { backgroundColor: isDark ? "#3A3A3C" : "#E5E5EA", width: 40 },
        }}
      >
        <AppText weight={SEMI_BOLD} style={{ fontSize: 18, color: themeColors.text, marginBottom: 16, textAlign: "center", marginTop: 10 }}>
          Select Wallet
        </AppText>
        <ScrollView showsVerticalScrollIndicator={false}>
          {AVAILABLE_WALLETS.filter(w => w.key !== fromWalletType && w.key !== toWalletType).map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[styles.accountCard, { borderColor: lightTheme.input, backgroundColor: isDark ? "#1C1C1E" : colors.white }]}
              onPress={() => {
                if (selectingWalletFor === "from") setFromWalletType(item.key);
                else setToWalletType(item.key);
                rbSheetWallet.current?.close();
                setTransferAmount("");
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <FastImage source={item.icon} style={{ width: 24, height: 24 }} resizeMode="contain" />
                <AppText weight={SEMI_BOLD} style={{ fontSize: 15, color: themeColors.text, marginLeft: 12 }}>{item.label}</AppText>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </RBSheet>

      {/* Coin Selector Sheet */}
      <RBSheet
        ref={rbSheetCoins}
        closeOnDragDown={true}
        height={600}
        customStyles={{
          container: { backgroundColor: isDark ? "#171a20" : colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 16 },
          draggableIcon: { backgroundColor: isDark ? "#3A3A3C" : "#E5E5EA", width: 40 },
        }}
      >
        <AppText weight={SEMI_BOLD} style={{ fontSize: 18, color: themeColors.text, marginBottom: 12, textAlign: "center", marginTop: 10 }}>Select Coin</AppText>
        <TextInput
          placeholder="Search coin"
          placeholderTextColor={themeColors.secondaryText}
          value={coinSearch}

          onChangeText={setCoinSearch}
          style={{
            backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7", color: themeColors.text,
            borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16,
            fontFamily: fontFamilyMedium
          }}
        />
        <ScrollView showsVerticalScrollIndicator={false}>
          {filteredCoins.map((item, idx) => (
            <TouchableOpacity
              key={item?.currency_id || idx}
              style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: themeColors.themeBorderColor }}
              onPress={() => {
                setSelectedCurrency(item);
                rbSheetCoins.current?.close();
                setTransferAmount("");
              }}
            >
              <FastImage
                source={buildCoinIconUri(item?.icon_path) ? { uri: buildCoinIconUri(item?.icon_path) } : bitcoin_ic}
                style={{ width: 26, height: 26 }}
                resizeMode="contain"
              />
              <AppText weight={SEMI_BOLD} style={{ fontSize: 15, color: themeColors.text, marginLeft: 12 }}>{item?.short_name}</AppText>
              {item?.currency && item.currency !== item.short_name && (
                <AppText style={{ fontSize: 13, color: themeColors.secondaryText, marginLeft: "auto" }}>
                  {item.currency}
                </AppText>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </RBSheet>

      {/* Margin Pair Selector Sheet */}
      <RBSheet
        ref={rbSheetMarginPairs}
        closeOnDragDown={true}
        height={600}
        customStyles={{
          container: { backgroundColor: isDark ? "#171a20" : colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 16 },
          draggableIcon: { backgroundColor: isDark ? "#3A3A3C" : "#E5E5EA", width: 40 },
        }}
      >
        <AppText weight={SEMI_BOLD} style={{ fontSize: 18, color: themeColors.text, marginBottom: 16, marginTop: 10 }}>Select Margin Pair</AppText>
        <ScrollView showsVerticalScrollIndicator={false}>
          {marginPairs.map((p) => (
            <TouchableOpacity
              key={p.pair_id}
              style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: themeColors.themeBorderColor }}
              onPress={() => {
                setSelectedMarginPair(p);
                rbSheetMarginPairs.current?.close();
                setTransferAmount("");
              }}
            >
              {p.icon_path ? (
                <FastImage
                  source={{ uri: buildCoinIconUri(p.icon_path) }}
                  style={{ width: 24, height: 24, borderRadius: 12 }}
                  resizeMode="contain"
                />
              ) : (
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: "#E5E5E5" }} />
              )}
              <AppText weight={SEMI_BOLD} style={{ flex: 1, fontSize: 15, color: themeColors.text, marginLeft: 12 }}>
                {p.base_asset}/{p.quote_asset}
              </AppText>
              {selectedMarginPair?.pair_id === p.pair_id && (
                <FastImage source={checkIc} style={{ width: 18, height: 18 }} resizeMode="contain" tintColor="black" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </RBSheet>

    </SafeAreaView>
  );
};

export default MarginTransfer;

const styles = StyleSheet.create({
  header: { height: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16 },
  headerLeft: { width: 32, height: 32, alignItems: "flex-start", justifyContent: "center" },
  headerRight: { width: 32, height: 32, alignItems: "flex-end", justifyContent: "center" },
  directionContainer: { position: "relative", marginBottom: 24, gap: 8 },
  directionCard: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 },
  directionLabel: { fontSize: 13, color: "#8E8E93", marginBottom: 4 },
  directionValue: { fontSize: 16 },
  selectRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  swapBtnWrapper: { height: 0, alignItems: "center", justifyContent: "center", zIndex: 10 },
  swapCircle: { width: 36, height: 36, borderRadius: 18, borderWidth: 3, alignItems: "center", justifyContent: "center", position: "absolute", top: -18 },
  sectionTitle: { fontSize: 14, marginBottom: 12, marginTop: 4 },
  inputContainer: { height: 50, borderRadius: 12, flexDirection: "row", alignItems: "center", paddingHorizontal: 14 },
  bottomBtnWrap: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth, backgroundColor: "transparent" },
  accountCard: { borderWidth: 1, borderRadius: 10, padding: 14, marginBottom: 12 },
  coinBox: { flex: 1, height: 50, borderRadius: 10, justifyContent: "center", borderWidth: 1 },
});
