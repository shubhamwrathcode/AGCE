import React, { useRef, useState, useEffect } from "react";
import { View, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import FastImage from "react-native-fast-image";
import RBSheet from "react-native-raw-bottom-sheet";
import Svg, { Path, Circle } from "react-native-svg";
import { AppText, SEMI_BOLD, MEDIUM, BOLD } from "../../shared";
import FuturesLeverageSlider from "../Futures/FuturesLeverageSlider";
import AdjustLeverageSheet from "../Futures/AdjustLeverageSheet";
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
  marginAccount,
  formatTotal,
  price,
  buy_price,
}) => {
  const rbSheetMarginMode = useRef();
  const [isLeverageVisible, setIsLeverageVisible] = useState(false);
  const [isLeverageSliding, setIsLeverageSliding] = useState(false);
  const isCross = marginMode === "Cross";
  const quoteSymbol = currencyData?.quote_currency || "USDT";
  const baseSymbol = currencyData?.base_currency || "BTC";
  const coinLabel = `${baseSymbol}/${quoteSymbol}`;
  const coinIconSrc = buildCoinImageUri(currencyData);

  // Same sources as web: isolated → margin/index + margin/MarginLeverageModal,
  // cross → cross_margin/index + cross_margin/MarginLeverageModal.
  const minLeverage = isCross ? 3 : (currencyData?.margin_config?.min_leverage ?? 1);
  const maxLeverage = isCross
    ? 5
    : (marginAccount?.max_leverage ?? currencyData?.margin_config?.max_leverage ?? 10);

  const allowedLeverages = React.useMemo(() => {
    const raw = isCross
      ? (currencyData?.margin_config?.cross_allowed_leverages ?? [3, 5])
      : currencyData?.margin_config?.isolated_allowed_leverages;
    if (Array.isArray(raw) && raw.length > 0) {
      const nums = [...new Set(raw.map(Number).filter((n) => Number.isFinite(n) && n > 0))].sort((a, b) => a - b);
      if (nums.length > 0) return nums;
    }
    const lo = Math.max(1, Math.round(Number(minLeverage) || 1));
    const hi = Math.max(lo, Math.round(Number(maxLeverage) || lo));
    const arr = [];
    for (let i = lo; i <= hi; i += 1) arr.push(i);
    return arr;
  }, [isCross, currencyData?.margin_config, minLeverage, maxLeverage]);

  const allowedMin = allowedLeverages[0];
  const allowedMax = allowedLeverages[allowedLeverages.length - 1];

  const clamp = (n) => {
    const x = Number(n);
    if (!Number.isFinite(x)) return allowedLeverages[0];
    if (allowedLeverages.includes(Math.round(x))) return Math.round(x);
    return allowedLeverages.reduce((best, v) => (Math.abs(v - x) < Math.abs(best - x) ? v : best), allowedLeverages[0]);
  };

  const validateLeverage = (lev) => {
    const n = Number(lev);
    if (!Number.isFinite(n) || n <= 0) return "Please enter a valid leverage value.";
    if (!allowedLeverages.includes(Math.round(n))) {
      return `Allowed leverage: ${allowedLeverages.map((a) => `${a}x`).join(", ")}.`;
    }
    if (n < allowedMin) return `Minimum leverage is ${allowedMin}x.`;
    if (n > allowedMax) return `Maximum leverage is ${allowedMax}x.`;
    return "";
  };

  const [leverageDraft, setLeverageDraft] = useState(() => clamp(parseInt(marginLeverage, 10)));
  const [leverageError, setLeverageError] = useState("");
  const [modeDraft, setModeDraft] = useState(marginMode || "Isolated");
  const [batchAdjustMarginMode, setBatchAdjustMarginMode] = useState(false);

  useEffect(() => { setLeverageError(""); }, [leverageDraft]);

  const Qf = Number(coinBalance?.quote_currency_balance) || 0;
  const Bf = Number(coinBalance?.base_currency_balance) || 0;
  const Qb = Number(coinBalance?.quote_currency_borrowed) || 0;
  const Bb = Number(coinBalance?.base_currency_borrowed) || 0;

  const socketNetEquity = coinBalance?.net_equity != null ? Number(coinBalance.net_equity) : null;
  const refPrice = parseFloat(buy_price) || parseFloat(price) || 0;

  const netEquity = (socketNetEquity != null && Number.isFinite(socketNetEquity) && socketNetEquity >= 0)
    ? socketNetEquity
    : Math.max(0, (Qf - Qb) + (Bf - Bb) * refPrice);

  const fmt = (n) => (formatTotal ? formatTotal(n) : Number(n).toFixed(2));

  const onLeverageSlidingChange = (sliding) => {
    setIsLeverageSliding(sliding);
  };

  const openLeverageSheet = () => {
    setLeverageDraft(clamp(parseInt(marginLeverage, 10)));
    setLeverageError("");
    setIsLeverageVisible(true);
  };

  const closeLeverageSheet = () => {
    setIsLeverageVisible(false);
    onLeverageSlidingChange(false);
  };

  const confirmLeverage = () => {
    const final = clamp(leverageDraft);
    const err = isCross ? "" : validateLeverage(final);
    if (err) {
      setLeverageError(err);
      return;
    }
    setMarginLeverage(`${final}x`);
    closeLeverageSheet();
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
        onPress={openLeverageSheet}
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
              const activeColor = colors.orangeTheme;
              return (
                <TouchableOpacity
                  key={item.name}
                  activeOpacity={0.8}
                  onPress={() => setModeDraft(item.name)}
                  style={{
                    backgroundColor: isSelected
                      ? (isDark ? "rgba(209, 170, 103, 0.10)" : "#FBF5EA")
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
                backgroundColor: colors.orangeTheme,
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

      {/* Margin Leverage Sheet — mirrors web cross_margin / margin MarginLeverageModal */}
      <AdjustLeverageSheet
        visible={isLeverageVisible}
        onClose={closeLeverageSheet}
        isDark={isDark}
        fieldLabel={isCross ? "Pair" : "Coin"}
        coinIcon={coinIconSrc ? (
          <FastImage source={{ uri: coinIconSrc }} style={{ width: 24, height: 24, borderRadius: 12 }} />
        ) : null}
        coinLabel={coinLabel}
        scrollEnabled={!isLeverageSliding}
        slider={(
          <FuturesLeverageSlider
            value={clamp(leverageDraft)}
            onChange={setLeverageDraft}
            onSlidingChange={onLeverageSlidingChange}
            minLeverage={allowedMin}
            maxLeverage={allowedMax}
            allowedValues={allowedLeverages}
            isDark={isDark}
            themeColors={themeColors}
          />
        )}
        error={leverageError}
        notes={[
          `Maximum position at current leverage: ${fmt(netEquity * clamp(leverageDraft))} ${quoteSymbol}`,
          "Please note that leverage changing will also apply for open positions and open orders.",
          "Selecting higher leverage increases your liquidation risk. Always manage your risk levels.",
        ]}
        warning={netEquity <= 0 ? "The current available margin ≤ 0. You can increase the leverage or add margin." : ""}
        showCancel={false}
        onConfirm={confirmLeverage}
      />
    </View>
  );
};

export default MarginHeaderDropdowns;
