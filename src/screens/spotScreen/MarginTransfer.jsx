import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Platform,
  SafeAreaView
} from "react-native";
import FastImage from "react-native-fast-image";
import { useRoute, useNavigation } from "@react-navigation/native";
import { AppText, SEMI_BOLD, MEDIUM, Button } from "../../shared";
import { colors, lightTheme } from "../../theme/colors";
import { useTheme } from "../../hooks/useTheme";
import {
  back_ic,
  downIcon,
  historyIcon,
  bitcoinIcon,
  usdtIcon,
  add,
  transferNew,
  Polygon,
  REMOVE,
  usdtPerp,
  btcPerp,
  tradeFi,
  deliveryFuture,
  marginIc,
  optionIc,
  onchain_ic,
  p2p_ic,
  fiat_ic
} from "../../helper/ImageAssets";
import SimpleToast from "react-native-simple-toast";
import { fontFamilyMedium } from "../../theme/typography";
import { useAppSelector } from "../../store/hooks";
import RBSheet from "react-native-raw-bottom-sheet";
import TradingDataModal from "../../common/TradingDataModal/TradingDataModal";

const MarginTransfer = () => {
  const { colors: themeColors, isDark } = useTheme();
  const route = useRoute();
  const navigation = useNavigation();

  // Route parameters
  const pair = route?.params?.pair || "BTC/USDT";
  const defaultCoin = route?.params?.coin || "BTC";

  // Refs
  const rbSheetAccount = useRef();
  const rbSheetAddFunds = useRef();

  // Add Funds Options
  const addFundsOptions = [
    {
      id: "deposit",
      label: "Onchain Deposit",
      description: "Securely transfer crypto from external wallets or exchanges.",
      icon: onchain_ic,
      action: () => {
        rbSheetAddFunds.current?.close();
        SimpleToast.show("Deposit screen coming soon");
      }
    },
    {
      id: "p2p",
      label: "P2P Trading",
      description: "Trade crypto with zero fees and flexible payment options.",
      icon: p2p_ic,
      action: () => {
        rbSheetAddFunds.current?.close();
        SimpleToast.show("P2P trading coming soon");
      }
    },
    {
      id: "fiat",
      label: "Buy with Fiat",
      description: "Instantly buy crypto using cards, bank transfers, and more.",
      icon: fiat_ic,
      action: () => {
        rbSheetAddFunds.current?.close();
        SimpleToast.show("Buy with Fiat coming soon");
      }
    }
  ];

  // State variables
  const [selectedAccount, setSelectedAccount] = useState("Margin");
  const [selectedPair, setSelectedPair] = useState(pair);
  const [selectedAsset, setSelectedAsset] = useState(defaultCoin);
  const [amount, setAmount] = useState("");
  const [isFromSpot, setIsFromSpot] = useState(true);
  const [isPairModalVisible, setIsPairModalVisible] = useState(false);

  // Derive symbols dynamically
  const [baseSymbol, quoteSymbol] = selectedPair.split("/");

  // Sync selected asset if defaultCoin changes
  useEffect(() => {
    if (defaultCoin) {
      setSelectedAsset(defaultCoin);
    }
  }, [defaultCoin]);

  // Read wallet balances from Redux
  const coinBalance = useAppSelector((state) => state.home.coinBalance);

  const getTransferableBalance = (symbol) => {
    if (coinBalance) {
      if (symbol === coinBalance.base_currency) {
        return coinBalance.base_currency_balance || 0;
      }
      if (symbol === coinBalance.quote_currency) {
        return coinBalance.quote_currency_balance || 0;
      }
    }
    // Fallback mock balances matching the mockup design
    const mockBalances = {
      BTC: 0.1254,
      USDT: 0,
      OG: 0,
      ETH: 1.45,
    };
    return mockBalances[symbol] !== undefined ? mockBalances[symbol] : 0;
  };

  const assetDetails = {
    BTC: { fullName: "Bitcoin", icon: bitcoinIcon, color: "#F7931A" },
    USDT: { fullName: "Tether", icon: usdtIcon, color: "#26A17B" },
    OG: { fullName: "Zero A...", icon: Polygon, color: "#8247E5" },
  };

  const getAssetDetail = (symbol) => {
    return assetDetails[symbol] || { fullName: symbol, icon: undefined, color: "#99A6AF" };
  };

  const handleSwapDirection = () => {
    setIsFromSpot((prev) => !prev);
  };

  const handleAll = () => {
    const maxVal = getTransferableBalance(selectedAsset);
    setAmount(maxVal.toString());
  };

  const handleConfirm = () => {
    if (!amount || parseFloat(amount) <= 0) {
      SimpleToast.show("Please enter a valid amount");
      return;
    }
    SimpleToast.show("Transfer successful");
    navigation.goBack();
  };

  const handlePairChange = (coin) => {
    const newPair = `${coin.base_currency}/${coin.quote_currency}`;
    setSelectedPair(newPair);
    setSelectedAsset(coin.base_currency);
    setAmount("");
  };

  const handleSelectAccount = (label) => {
    setSelectedAccount(label);
    rbSheetAccount?.current?.close();
  };

  const accountOptions = [
    { id: "usdt_perp", label: "USDT Perp", balance: "$0.00", icon: usdtPerp },
    { id: "btc_perp", label: "BTC Perp", balance: "$0.00", icon: btcPerp },
    { id: "tradfi", label: "TradFi", balance: "$0.00", icon: tradeFi },
    { id: "delivery_futures", label: "Delivery Futures", balance: "$0.00", icon: deliveryFuture },
    { id: "margin", label: "Margin", balance: "$0.00", icon: marginIc },
    { id: "options", label: "Options", balance: "$0.00", icon: optionIc }
  ];

  const renderAccountCard = (isSpotCard, labelText) => {
    if (isSpotCard) {
      return (
        <View style={[styles.directionCard, { backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7" }]}>
          <AppText style={styles.directionLabel}>{labelText}</AppText>
          <AppText weight={SEMI_BOLD} style={[styles.directionValue, { color: themeColors.text }]}>
            Spot
          </AppText>
        </View>
      );
    }

    return (
      <View style={[styles.directionCard, { backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7" }]}>
        <AppText style={styles.directionLabel}>{labelText}</AppText>

        {/* Account Type Selector Trigger */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => rbSheetAccount?.current?.open()}
          style={styles.selectRow}
        >
          <AppText weight={SEMI_BOLD} style={[styles.directionValue, { color: themeColors.text }]}>
            {selectedAccount}
          </AppText>
          <FastImage
            source={downIcon}
            style={{ width: 10, height: 10 }}
            resizeMode="contain"
            tintColor={themeColors.secondaryText}
          />
        </TouchableOpacity>

        {/* Dynamic Trading Pair Row - only shown for Margin */}
        {selectedAccount === "Margin" && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsPairModalVisible(true)}
            style={[styles.selectRow, { marginTop: 8 }]}
          >
            <AppText style={{ color: themeColors.secondaryText, fontSize: 13 }}>
              {selectedPair}
            </AppText>
            <FastImage
              source={downIcon}
              style={{ width: 10, height: 10 }}
              resizeMode="contain"
              tintColor={themeColors.secondaryText}
            />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? "#171a20" : colors.white }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.headerLeft}
        >
          <FastImage
            source={back_ic}
            style={{ width: 20, height: 20 }}
            resizeMode="contain"
            tintColor={themeColors.text}
          />
        </TouchableOpacity>

        <AppText weight={SEMI_BOLD} style={{ fontSize: 18, color: themeColors.text }}>
          Transfer
        </AppText>

        <TouchableOpacity
          onPress={() => SimpleToast.show("Transfer history coming soon")}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.headerRight}
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
        {/* From / To Direction Selector Card */}
        <View style={styles.directionContainer}>
          {isFromSpot ? renderAccountCard(true, "From") : renderAccountCard(false, "From")}

          {/* Swap Button */}
          <View style={styles.swapBtnWrapper}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleSwapDirection}
              style={[
                styles.swapCircle,
                {
                  backgroundColor: colors.iconBgColor,
                  borderColor: colors.white,
                },
              ]}
            >
              <FastImage
                source={transferNew}
                style={{ width: 18, height: 18 }}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          {isFromSpot ? renderAccountCard(false, "To") : renderAccountCard(true, "To")}
        </View>

        {/* Coin Selection Section */}
        <AppText weight={SEMI_BOLD} style={[styles.sectionTitle, { color: themeColors.text }]}>
          Coin
        </AppText>

        <View style={styles.coinsRow}>
          {[baseSymbol, quoteSymbol].map((symbol) => {
            if (!symbol) return null;
            const isSelected = selectedAsset === symbol;
            const assetInfo = getAssetDetail(symbol);
            return (
              <TouchableOpacity
                key={symbol}
                activeOpacity={0.8}
                onPress={() => {
                  setSelectedAsset(symbol);
                  setAmount("");
                }}
                style={[
                  styles.coinBox,
                  {
                    borderColor: isSelected ? "#D1AA67" : themeColors.themeBorderColor,
                    backgroundColor: isSelected
                      ? (isDark ? "#2A241C" : "#FCF2E1")
                      : (isDark ? "#1C1C1E" : colors.white),
                  },
                ]}
              >
                <View style={styles.coinInner}>
                  {assetInfo.icon ? (
                    <FastImage source={assetInfo.icon} style={styles.coinIcon} resizeMode="contain" />
                  ) : (
                    <View style={[styles.coinIconFallback, { backgroundColor: assetInfo.color }]}>
                      <AppText weight={SEMI_BOLD} style={{ color: colors.white, fontSize: 13 }}>
                        {symbol.charAt(0)}
                      </AppText>
                    </View>
                  )}
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <AppText weight={SEMI_BOLD} style={{ color: themeColors.text, fontSize: 14 }}>
                        {symbol}
                      </AppText>
                      <AppText style={{ color: themeColors.secondaryText, fontSize: 11 }} numberOfLines={1}>
                        {assetInfo.fullName}
                      </AppText>
                    </View>
                    <AppText style={{ color: themeColors.text, fontSize: 13, marginTop: 2 }}>
                      {getTransferableBalance(symbol)}
                    </AppText>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Amount Input Section */}
        <AppText weight={SEMI_BOLD} style={[styles.sectionTitle, { color: themeColors.text }]}>
          Amount
        </AppText>

        <View style={[styles.inputContainer, { backgroundColor: isDark ? "#1C1C1E" : "#F2F2F7" }]}>
          <TextInput
            placeholder="Minimum 0.00000001"
            placeholderTextColor={isDark ? "#5A5A5C" : "#C7C7CC"}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            cursorColor={colors.black}
            style={{
              flex: 1,
              color: themeColors.text,
              fontSize: 14,
              fontFamily: fontFamilyMedium,
              paddingVertical: Platform.OS === "ios" ? 8 : 4,
            }}
          />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <AppText weight={SEMI_BOLD} style={{ color: themeColors.text, fontSize: 14 }}>
              {selectedAsset}
            </AppText>
            <View style={{ width: 1, height: 16, backgroundColor: themeColors.themeBorderColor }} />
            <TouchableOpacity onPress={handleAll}>
              <AppText weight={SEMI_BOLD} style={{ color: "#D1AA67", fontSize: 13 }}>All</AppText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Transferable Balance Label */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => rbSheetAddFunds.current?.open()}
          style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 }}
        >
          <AppText style={{ fontSize: 12, color: themeColors.secondaryText }}>
            Transferable: {getTransferableBalance(selectedAsset)} {selectedAsset}
          </AppText>
          <FastImage
            source={add}
            style={{ width: 14, height: 14 }}
            resizeMode="contain"
            tintColor={themeColors.secondaryText}
          />
        </TouchableOpacity>
      </ScrollView>

      {/* Pinned Confirm Button */}
      <View style={[styles.bottomBtnWrap, { borderTopColor: themeColors.themeBorderColor }]}>
        <Button
          onPress={handleConfirm}

        >
          Confirm
        </Button>
      </View>

      {/* Account Type Selector RBSheet */}
      <RBSheet
        ref={rbSheetAccount}
        closeOnDragDown={true}
        closeOnPressMask={true}
        height={600}
        animationType="slide"
        customStyles={{
          container: {
            backgroundColor: isDark ? "#171a20" : colors.white,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 24,
          },
          wrapper: {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          },
          draggableIcon: {
            backgroundColor: isDark ? "#3A3A3C" : "#E5E5EA",
            width: 40,
          },
        }}
      >
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 14, }}>
            <AppText weight={SEMI_BOLD} style={{ fontSize: 18, color: themeColors.text }}>
              Select
            </AppText>
            <TouchableOpacity
              onPress={() => rbSheetAccount?.current?.close()}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <FastImage source={REMOVE} style={{ width: 25, height: 25 }} resizeMode="contain" tintColor={colors.black} />
            </TouchableOpacity>
          </View>

          {/* List Options */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
          >
            {accountOptions.map((item) => {
              const isSelected = selectedAccount === item.label;
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.8}
                  onPress={() => handleSelectAccount(item.label)}
                  style={[
                    styles.accountCard,
                    {
                      borderColor: lightTheme.input,
                      backgroundColor: isDark ? "#1C1C1E" : colors.white,
                    },
                  ]}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    {/* Icon Circle */}

                    <FastImage
                      source={item.icon}
                      style={{ width: 25, height: 25, }}
                      resizeMode="contain"
                    />

                    {/* Text block */}
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <AppText weight={SEMI_BOLD} style={{ fontSize: 15, color: themeColors.text }}>
                        {item.label}
                      </AppText>
                      <AppText style={{ fontSize: 12, color: themeColors.secondaryText, marginTop: 2 }}>
                        {item.balance}
                      </AppText>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </RBSheet>

      {/* Add Funds RBSheet */}
      <RBSheet
        ref={rbSheetAddFunds}
        closeOnDragDown={true}
        closeOnPressMask={true}
        height={400}
        animationType="slide"
        customStyles={{
          container: {
            backgroundColor: isDark ? "#171a20" : colors.white,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 24,
          },
          wrapper: {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          },
          draggableIcon: {
            backgroundColor: isDark ? "#3A3A3C" : "#E5E5EA",
            width: 40,
          },
        }}
      >
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 14 }}>
            <AppText weight={SEMI_BOLD} style={{ fontSize: 18, color: themeColors.text }}>
              Add Funds
            </AppText>
            <TouchableOpacity
              onPress={() => rbSheetAddFunds?.current?.close()}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <FastImage source={REMOVE} style={{ width: 25, height: 25 }} resizeMode="contain" tintColor={themeColors.text} />
            </TouchableOpacity>
          </View>

          {/* Options */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 8 }}>
            {addFundsOptions.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                onPress={item.action}
                style={[
                  styles.accountCard,
                  {
                    borderColor: lightTheme.input,
                    backgroundColor: isDark ? "#1C1C1E" : colors.white,
                  },
                ]}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <FastImage
                    source={item.icon}
                    style={{ width: 28, height: 28 }}
                    resizeMode="contain"
                  />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <AppText weight={SEMI_BOLD} style={{ fontSize: 15, color: themeColors.text }}>
                      {item.label}
                    </AppText>
                    <AppText style={{ fontSize: 12, color: themeColors.secondaryText, marginTop: 4 }}>
                      {item.description}
                    </AppText>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </RBSheet>

      {/* Pair Selector Modal */}
      <TradingDataModal
        visible={isPairModalVisible}
        onClose={() => setIsPairModalVisible(false)}
        setCurrency={handlePairChange}
        isDark={isDark}
        theme={isDark ? "Dark" : "Light"}
      />
    </SafeAreaView>
  );
};

export default MarginTransfer;

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  headerLeft: {
    width: 32,
    height: 32,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  headerRight: {
    width: 32,
    height: 32,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  directionContainer: {
    position: "relative",
    marginBottom: 20,
    gap: 5,
  },
  directionCard: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  directionLabel: {
    fontSize: 12,
    color: "#8E8E93",
    marginBottom: 4,
  },
  directionValue: {
    fontSize: 16,
  },
  selectRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  swapBtnWrapper: {
    height: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  swapCircle: {
    width: 35,
    height: 35,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: -17.5,
  },
  sectionTitle: {
    fontSize: 14,
    marginBottom: 10,
    marginTop: 12,
  },
  coinsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 10,
  },
  coinBox: {
    flex: 1,
    height: 60,
    borderRadius: 8,
    paddingHorizontal: 12,
    justifyContent: "center",
    borderWidth: 1,
  },
  coinInner: {
    flexDirection: "row",
    alignItems: "center",
  },
  coinIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  coinIconFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  inputContainer: {
    height: 48,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  bottomBtnWrap: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    backgroundColor: "transparent",
  },
  accountCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
