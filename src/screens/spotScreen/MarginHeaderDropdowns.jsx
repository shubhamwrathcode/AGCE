import React, { useRef, useState, useEffect } from "react";
import { View, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import FastImage from "react-native-fast-image";
import RBSheet from "react-native-raw-bottom-sheet";
import Svg, { Path, Circle } from "react-native-svg";
import { AppText, SEMI_BOLD, MEDIUM, BOLD, Button } from "../../shared";
import { colors, darkTheme, lightTheme } from "../../theme/colors";
import { checkIc, downIcon, tick, closeIcon, add, minus, right_ic } from "../../helper/ImageAssets";
import { IMAGE_BASE_URL } from "../../helper/Constants";
import { buildCoinImageUri } from "../../helper/coinIconUrl";
import ToggleSwitch from "../../common/ToggleSwitch";

const MarginHeaderDropdowns = ({
  marginMode,
  setMarginMode,
  marginLeverage,
  setMarginLeverage,
  themeColors,
  isDark,
  universalPaddingHorizontal,
  styles,
  coinBalance = {},
  crossAccount,
  crossBorrowable,
  currencyData = {},
  formatTotal,
  price,
  buy_price,
}) => {
  const rbSheetMarginMode = useRef();
  const rbSheetMarginLeverage = useRef();
  const isCross = marginMode === "Cross";
  const quoteSymbol = currencyData?.quote_currency || "USDT";
  const baseSymbol = currencyData?.base_currency || "BTC";
  const coinLabel = `${baseSymbol}/${quoteSymbol}`;
  const coinIconSrc = buildCoinImageUri(currencyData);

  const minLeverage = currencyData?.margin_config?.min_leverage ?? 1;
  const maxLeverage = (isCross ? crossAccount?.max_leverage : null) ?? currencyData?.margin_config?.max_leverage ?? 10;

  const allowedLeveragesRaw = isCross
    ? currencyData?.margin_config?.cross_allowed_leverages
    : currencyData?.margin_config?.isolated_allowed_leverages;
  const allowedLeverages = Array.isArray(allowedLeveragesRaw) ? allowedLeveragesRaw : [];
  const hasAllowed = allowedLeverages.length > 0;

  const DEFAULT_QUICK_LEVERAGE = [1, 2, 3, 5, 10, 20];
  const quickLeverages = hasAllowed
    ? allowedLeverages
    : DEFAULT_QUICK_LEVERAGE.filter((x) => x >= minLeverage && x <= maxLeverage);

  const snapToAllowed = (n) => {
    if (!hasAllowed) return n;
    return allowedLeverages.reduce((prev, cur) =>
      Math.abs(cur - n) < Math.abs(prev - n) ? cur : prev
    );
  };

  const getInitialLeverage = (val) => {
    let curr = parseInt(val, 10);
    if (!Number.isFinite(curr) || curr <= 0) return hasAllowed ? allowedLeverages[0] : minLeverage;
    if (hasAllowed) return allowedLeverages.includes(curr) ? curr : snapToAllowed(curr);
    return Math.min(Math.max(Math.round(curr), minLeverage), maxLeverage);
  };

  const [leverageDraft, setLeverageDraft] = useState(getInitialLeverage(marginLeverage));
  const [modeDraft, setModeDraft] = useState(marginMode || "Isolated");
  const [batchAdjustMarginMode, setBatchAdjustMarginMode] = useState(false);

  const Qf = Number(coinBalance?.quote_currency_balance) || 0;
  const Bf = Number(coinBalance?.base_currency_balance) || 0;
  const Qb = Number(coinBalance?.quote_currency_borrowed) || 0;
  const Bb = Number(coinBalance?.base_currency_borrowed) || 0;

  const socketNetEquity = coinBalance?.net_equity != null ? Number(coinBalance.net_equity) : null;
  const refPrice = parseFloat(buy_price) || parseFloat(price) || 0;

  const computedNetEquity = (socketNetEquity != null && Number.isFinite(socketNetEquity) && socketNetEquity >= 0)
    ? socketNetEquity
    : Math.max(0, (Qf - Qb) + (Bf - Bb) * refPrice);

  // Cross Margin Data
  const crossSummary = crossAccount?.summary || crossAccount || {};
  const crossNetEquity = crossSummary?.net_equity != null ? Number(crossSummary.net_equity) : computedNetEquity;
  const crossCurrentLoan = crossSummary?.total_liability != null ? Number(crossSummary.total_liability) : Qb;

  const netEquity = isCross ? crossNetEquity : computedNetEquity;
  const currentLoan = isCross ? crossCurrentLoan : Qb;

  const fmt = (n) => {
    const val = Number(n) || 0;
    if (formatTotal) {
      const res = formatTotal(val);
      if (res === "" || res == null) return "0";
      return res;
    }
    return val.toFixed(2).replace(/\.?0+$/, "") || "0";
  };

  const safeSet = (n) => {
    const x = Number(n);
    if (!Number.isFinite(x) || x <= 0) return;
    if (hasAllowed) {
      if (allowedLeverages.includes(x)) setLeverageDraft(x);
    } else {
      setLeverageDraft(Math.min(Math.max(Math.round(x), minLeverage), maxLeverage));
    }
  };

  const clamp = (n) => {
    const x = Number(n);
    if (!Number.isFinite(x)) return hasAllowed ? allowedLeverages[0] : minLeverage;
    if (hasAllowed) return snapToAllowed(x);
    if (x < minLeverage) return minLeverage;
    return Math.min(Math.round(x), maxLeverage);
  };

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => rbSheetMarginMode.current.open()}
        style={[
          styles.dropdown,
          {
            backgroundColor: isDark ? themeColors.background : lightTheme.input,
            flex: 1,
            borderRadius: 10,
            borderWidth: isDark ? 1 : 0,
            paddingVertical: 6,
            paddingHorizontal: 12,
            marginBottom: 0,
            flexDirection: "row",
            alignItems: "center",
            borderColor: isDark ? colors.themeElevationColor : "transparent"
          },
        ]}
      >
        <AppText weight={MEDIUM} style={{ color: themeColors.text, fontSize: 14 }}>
          {marginMode}
        </AppText>
        <FastImage
          source={downIcon}
          resizeMode="contain"
          style={{ width: 10, height: 10 }}
          tintColor={themeColors.secondaryText}
        />
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => rbSheetMarginLeverage.current.open()}
        style={[
          styles.dropdown,
          {
            backgroundColor: isDark ? colors.newThemeColor : lightTheme.input,
            width: 75,
            borderRadius: 10,
            borderWidth: isDark ? 1 : 0,
            paddingVertical: 6,
            paddingHorizontal: 12,
            marginBottom: 0,
            flexDirection: "row",
            alignItems: "center",
            borderColor: isDark ? colors.themeElevationColor : "transparent"
          },
        ]}
      >
        <AppText weight={MEDIUM} style={{ color: themeColors.text, fontSize: 14 }}>
          {marginLeverage}
        </AppText>
        <FastImage
          source={downIcon}
          resizeMode="contain"
          style={{ width: 10, height: 10 }}
          tintColor={themeColors.secondaryText}
        />
      </TouchableOpacity>

      {/* Margin Mode Sheet */}
      <RBSheet
        ref={rbSheetMarginMode}
        closeOnDragDown={false}
        closeOnPressMask={true}
        height={520}
        animationType="slide"
        onOpen={() => {
          setModeDraft(marginMode);
        }}
        customModalProps={{ statusBarTranslucent: true }}
        customStyles={{
          container: {
            backgroundColor: isDark ? colors.newThemeColor : (themeColors.background || "#FFFFFF"),
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingHorizontal: universalPaddingHorizontal || 16,
            paddingTop: 12,
            paddingBottom: 20,
          },
          wrapper: {
            backgroundColor: "#0006",
          },
        }}
      >
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: 4,
              paddingBottom: 6,
            }}
          >
            <AppText weight={BOLD} style={{ fontSize: 18, color: themeColors.text }}>
              Margin Mode
            </AppText>
            <TouchableOpacity
              onPress={() => rbSheetMarginMode?.current?.close()}
              style={{ padding: 6 }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <FastImage
                source={closeIcon}
                resizeMode="contain"
                style={{ width: 14, height: 14 }}
                tintColor={themeColors.secondaryText}
              />
            </TouchableOpacity>
          </View>
          <AppText
            style={{
              color: themeColors.secondaryText,
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            Select the unit type you want to use for placing your order.
          </AppText>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>
            {/* Margin Mode Cards */}
            {[
              {
                name: "Isolated",
                description:
                  "In isolated margin mode, the position margin is the allocated amount, and your loss is limited to it upon liquidation. You can also adjust the margin for positions in this mode.",
                type: "isolated",
              },
              {
                name: "Cross",
                description:
                  "In cross margin mode, the entire account balance is used as margin, and you may lose it all upon liquidation.",
                type: "cross",
              },
            ].map((item) => {
              const isSelected = modeDraft === item.name;
              const activeColor = colors.primaryColor || "#00BCD4";
              return (
                <TouchableOpacity
                  key={item.name}
                  activeOpacity={0.8}
                  onPress={() => setModeDraft(item.name)}
                  style={{
                    backgroundColor: isSelected
                      ? (isDark ? "rgba(0, 188, 212, 0.08)" : "#EBF8FA")
                      : (isDark ? (darkTheme.darkThemeInputColor || "#1E1E24") : "#F5F6F8"),
                    borderWidth: isSelected ? 1.5 : 1,
                    borderColor: isSelected
                      ? activeColor
                      : (isDark ? "rgba(255, 255, 255, 0.08)" : "#E5E7EB"),
                    borderRadius: 12,
                    padding: 14,
                    marginBottom: 12,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  {/* Left Icon Badge */}
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: isDark ? "rgba(255, 255, 255, 0.06)" : "#E9ECEF",
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: 12,
                    }}
                  >
                    {item.type === "isolated" ? (
                      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                        <Path
                          d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
                          stroke={isSelected ? activeColor : themeColors.secondaryText}
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <Circle
                          cx={9}
                          cy={7}
                          r={4}
                          stroke={isSelected ? activeColor : themeColors.secondaryText}
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <Path
                          d="M19 8v6M22 11h-6"
                          stroke={isSelected ? activeColor : themeColors.secondaryText}
                          strokeWidth={1.8}
                          strokeLinecap="round"
                        />
                      </Svg>
                    ) : (
                      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                        <Path
                          d="M17 21v-2a4 4 0 0 0-3-3.87M9 20H4a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v2"
                          stroke={isSelected ? activeColor : themeColors.secondaryText}
                          strokeWidth={1.8}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <Circle
                          cx={9}
                          cy={7}
                          r={4}
                          stroke={isSelected ? activeColor : themeColors.secondaryText}
                          strokeWidth={1.8}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <Path
                          d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"
                          stroke={isSelected ? activeColor : themeColors.secondaryText}
                          strokeWidth={1.8}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    )}
                  </View>

                  {/* Middle Content */}
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <AppText
                      weight={SEMI_BOLD}
                      style={{
                        color: themeColors.text,
                        fontSize: 15,
                        marginBottom: 4,
                      }}
                    >
                      {item.name}
                    </AppText>
                    <AppText
                      style={{
                        color: themeColors.secondaryText,
                        fontSize: 12,
                        lineHeight: 17,
                      }}
                    >
                      {item.description}
                    </AppText>
                  </View>

                  {/* Right Radio Indicator */}
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      borderWidth: 2,
                      borderColor: isSelected
                        ? activeColor
                        : (isDark ? "rgba(255, 255, 255, 0.3)" : "#C7C7CC"),
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: "transparent",
                    }}
                  >
                    {isSelected && (
                      <View
                        style={{
                          width: 11,
                          height: 11,
                          borderRadius: 5.5,
                          backgroundColor: activeColor,
                        }}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Info Note Row */}
            <View
              style={{
                backgroundColor: isDark
                  ? (darkTheme.darkThemeInputColor || "rgba(255, 255, 255, 0.04)")
                  : "#F5F6F8",
                borderRadius: 10,
                padding: 12,
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 16,
                marginTop: 4,
              }}
            >
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Circle cx={12} cy={12} r={10} stroke={themeColors.secondaryText} strokeWidth={1.8} />
                <Path
                  d="M12 16v-4M12 8h.01"
                  stroke={themeColors.secondaryText}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <AppText
                style={{
                  color: themeColors.secondaryText,
                  fontSize: 12,
                  lineHeight: 16,
                  marginLeft: 8,
                  flex: 1,
                }}
              >
                Switching margin modes only applies to the current trading pair.
              </AppText>
            </View>

            {/* Batch Adjust Leverage Row */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
                paddingHorizontal: 2,
              }}
            >
              <AppText weight={MEDIUM} style={{ fontSize: 14, color: themeColors.text }}>
                Batch Adjust Leverage
              </AppText>
              <ToggleSwitch
                value={batchAdjustMarginMode}
                onValueChange={setBatchAdjustMarginMode}
                isDark={isDark}
              />
            </View>

            {/* Continue Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                setMarginMode(modeDraft);
                rbSheetMarginMode?.current?.close();
              }}
              style={{
                backgroundColor: colors.primaryColor || "#00BCD4",
                borderRadius: 24,
                paddingVertical: 14,
                alignItems: "center",
                justifyContent: "center",
                marginTop: 4,
                marginBottom: 6,
              }}
            >
              <AppText weight={SEMI_BOLD} style={{ color: "#FFFFFF", fontSize: 16 }}>
                Continue
              </AppText>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </RBSheet>

      {/* Margin Leverage Sheet */}
      <RBSheet
        ref={rbSheetMarginLeverage}
        closeOnDragDown={false}
        closeOnPressMask={true}
        height={500}
        animationType="slide"
        onOpen={() => {
          setLeverageDraft(getInitialLeverage(marginLeverage));
        }}
        customModalProps={{ statusBarTranslucent: true }}
        customStyles={{
          container: {
            backgroundColor: isDark ? colors.newThemeColor : themeColors.themeElevationColor,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingHorizontal: universalPaddingHorizontal,
            paddingTop: 8,
            paddingBottom: 16,
          },
          wrapper: {
            backgroundColor: "#0006",
          },
        }}
      >
        <View style={{ flex: 1, paddingHorizontal: 10 }}>
          <View style={{
            flexDirection: "row", alignItems: "center", justifyContent: "space-between",
            paddingTop: 4, paddingBottom: 20
          }}>
            <AppText weight={SEMI_BOLD} style={{ fontSize: 18, color: themeColors.text, marginTop: 10 }}>
              Adjust Leverage
            </AppText>
            <TouchableOpacity onPress={() => rbSheetMarginLeverage?.current?.close()} style={{ padding: 4 }}>
              <FastImage
                source={closeIcon}
                resizeMode="contain"
                style={{ width: 15, height: 15 }}
                tintColor={themeColors.secondaryText}
              />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>

            {/* Coin Row */}
            <AppText style={{ color: themeColors.secondaryText, fontSize: 13, marginBottom: 8 }}>Coin</AppText>
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: isDark ? darkTheme.darkThemeInputColor : "#F2F2F7", padding: 12, borderRadius: 10, marginBottom: 16 }}>
              {!!coinIconSrc && (
                <FastImage source={{ uri: coinIconSrc }} style={{ width: 24, height: 24, borderRadius: 12, marginRight: 8 }} />
              )}
              <AppText weight={SEMI_BOLD} style={{ fontSize: 15, color: themeColors.text }}>{coinLabel}</AppText>
            </View>

            {/* Leverage Input */}
            <AppText style={{ color: themeColors.secondaryText, fontSize: 13, marginBottom: 8 }}>Leverage</AppText>
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: isDark ? darkTheme.darkThemeInputColor : "#F2F2F7", padding: 12, borderRadius: 10, marginBottom: 16 }}>
              <AppText weight={SEMI_BOLD} style={{ fontSize: 15, color: themeColors.text }}>{leverageDraft}x</AppText>
            </View>

            {/* Quick selector row */}
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {quickLeverages.map((x) => {
                const levStr = `${x}x`;
                const isSelected = leverageDraft === x;
                return (
                  <TouchableOpacity
                    key={levStr}
                    onPress={() => safeSet(x)}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: isSelected ? themeColors.text : "transparent",
                      backgroundColor: isDark ? darkTheme.darkThemeInputColor : "#F2F2F7",
                    }}
                  >
                    <AppText weight={SEMI_BOLD} style={{ color: themeColors.text, fontSize: 13 }}>
                      {levStr}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Details List */}
            <View style={{ marginBottom: 8, marginTop: 10 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 }}>
                <AppText style={{ color: themeColors.secondaryText, fontSize: 12 }}>Allow to Open</AppText>
                <AppText weight={MEDIUM} style={{ color: themeColors.text, fontSize: 12 }}>{fmt(netEquity * leverageDraft)} {quoteSymbol}</AppText>
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 }}>
                <AppText style={{ color: themeColors.secondaryText, fontSize: 12 }}>Maximum Borrowable</AppText>
                <AppText weight={MEDIUM} style={{ color: themeColors.text, fontSize: 12 }}>{fmt(Math.max(0, netEquity * (maxLeverage - 1) - currentLoan))} {quoteSymbol}</AppText>
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 }}>
                <AppText style={{ color: themeColors.secondaryText, fontSize: 12 }}>Leverage Range</AppText>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <AppText weight={MEDIUM} style={{ color: themeColors.text, fontSize: 12 }}>{minLeverage}x – {maxLeverage}x</AppText>
                </View>
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 }}>
                <AppText style={{ color: themeColors.secondaryText, fontSize: 12 }}>Current Loan</AppText>
                <AppText weight={MEDIUM} style={{ color: themeColors.text, fontSize: 12 }}>{fmt(currentLoan)} {quoteSymbol}</AppText>
              </View>
            </View>

            {/* Warning Message */}
            {netEquity <= 0 && (
              <AppText weight={MEDIUM} style={{ color: colors.orangeTheme, fontSize: 11, marginTop: 4, lineHeight: 14 }}>
                The current available margin ≤ 0. You can increase the leverage or add margin.
              </AppText>
            )}
          </ScrollView>

          {/* Confirm Button */}
          <Button
            onPress={() => {
              const final = hasAllowed ? snapToAllowed(leverageDraft) : clamp(leverageDraft);
              setMarginLeverage(`${final}x`);
              rbSheetMarginLeverage?.current?.close();
            }}
            containerStyle={{
              marginTop: 12,
              marginBottom: 8,
            }}
          >
            Confirm
          </Button>
        </View>
      </RBSheet>
    </View>
  );
};

export default MarginHeaderDropdowns;
