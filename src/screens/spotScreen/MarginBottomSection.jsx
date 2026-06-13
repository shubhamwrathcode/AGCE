import React from "react";
import { View, TouchableOpacity } from "react-native";
import FastImage from "react-native-fast-image";
import { AppText, Button } from "../../shared";
import { colors } from "../../theme/colors";
import { add } from "../../helper/ImageAssets";

const MarginBottomSection = ({
  quote_currency,
  base_currency,
  coinBalance,
  marginMode,
  isBuy,
  onSubmit,
  themeColors,
  styles,
  onBorrowPress,
  marginLeverage,
  price,
  amount,
  buy_price,
  amountIsQuote,
  formatTotal,
  loading,
  currencyData,
}) => {
  const leverage = parseInt(marginLeverage, 10) || 5;

  const isCross = marginMode === "Cross";

  const Qf = Number(coinBalance?.quote_currency_balance) || 0;
  const Bf = Number(coinBalance?.base_currency_balance) || 0;
  const Qb = Number(coinBalance?.quote_currency_borrowed) || 0;
  const Bb = Number(coinBalance?.base_currency_borrowed) || 0;

  const socketNetEquity = coinBalance?.net_equity != null ? Number(coinBalance.net_equity) : null;
  const refPrice = parseFloat(buy_price) || parseFloat(price) || 0;

  const netEquity = (socketNetEquity != null && Number.isFinite(socketNetEquity) && socketNetEquity >= 0)
    ? socketNetEquity
    : Math.max(0, (Qf - Qb) + (Bf - Bb) * refPrice);

  const baseEquity = Math.max(0, Bf - Bb);

  const qCap = coinBalance?.quote_remaining_capacity != null ? Number(coinBalance.quote_remaining_capacity) : null;
  const bCap = coinBalance?.base_remaining_capacity != null ? Number(coinBalance.base_remaining_capacity) : null;

  const quoteAvailable = isCross && (coinBalance?.buy?.available != null || coinBalance?.buy_available != null)
    ? Number(coinBalance?.buy?.available ?? coinBalance?.buy_available)
    : netEquity;
  const baseAvailable = isCross && (coinBalance?.sell?.available != null || coinBalance?.sell_available != null)
    ? Number(coinBalance?.sell?.available ?? coinBalance?.sell_available)
    : baseEquity;

  const grossQuoteMax = netEquity * leverage;
  const localQuoteMax = qCap != null && Number.isFinite(qCap) ? Math.min(grossQuoteMax, qCap + Qf) : grossQuoteMax;
  const maxLeverage = (isCross ? coinBalance?.max_leverage : null) ?? currencyData?.margin_config?.max_leverage ?? 10;
  const L = parseInt(marginLeverage, 10) || 1;
  const M = Number(maxLeverage);

  const crossMarginMaxAtLeverage = (available, maxAtMaxLeverage) => {
    const avail = Number(available);
    const maxAtMax = Number(maxAtMaxLeverage);
    if (!Number.isFinite(avail) || avail < 0) return 0;
    if (!Number.isFinite(maxAtMax) || maxAtMax <= 0) return Math.max(0, avail);
    if (!Number.isFinite(L) || L <= 0) return Math.max(0, avail);
    if (!Number.isFinite(M) || M <= 1) return Math.max(0, Math.min(maxAtMax, avail));
    if (L >= M) return Math.max(0, maxAtMax);
    if (L <= 1) return Math.max(0, avail);

    const borrowable = Math.max(0, maxAtMax - avail);
    return Math.max(0, avail + borrowable * ((L - 1) / (M - 1)));
  };

  const quoteMax = isCross && (coinBalance?.buy?.max != null || coinBalance?.buy_max != null)
    ? crossMarginMaxAtLeverage(quoteAvailable, Number(coinBalance?.buy?.max ?? coinBalance?.buy_max))
    : localQuoteMax;

  const precision = isBuy 
    ? (currencyData?.quote_asset_precision ?? 6) 
    : (currencyData?.base_asset_precision ?? 8);

  const fmt = (val) => {
    if (val == null || !Number.isFinite(Number(val))) return "0";
    const res = parseFloat(Number(val).toFixed(precision)).toString();
    return res === "NaN" ? "0" : res;
  };

  const inputQty = parseFloat(amount) || 0;
  const inputPx = parseFloat(price) || parseFloat(buy_price) || 0;

  const grossSellMax = inputPx > 0 ? grossQuoteMax / inputPx : 0;
  const localBaseMax = bCap != null && Number.isFinite(bCap) ? Math.min(grossSellMax, bCap) : grossSellMax;

  const baseMax = isCross && (coinBalance?.sell?.max != null || coinBalance?.sell_max != null)
    ? crossMarginMaxAtLeverage(baseAvailable, Number(coinBalance?.sell?.max ?? coinBalance?.sell_max))
    : localBaseMax;

  let borrowingVal = 0;
  if (isBuy) {
    const parsedTotal = parseFloat(formatTotal) || 0;
    const V = parsedTotal > 0 ? parsedTotal : (amountIsQuote ? inputQty : inputQty * inputPx);
    if (isCross) {
      borrowingVal = V > 0 ? Math.max(0, V - quoteAvailable) : 0;
    } else {
      borrowingVal = V > 0 ? Math.max(0, V * (1 - 1 / L)) : 0;
    }
  } else {
    const parsedTotal = parseFloat(formatTotal) || 0;
    const baseQty = parsedTotal > 0 && inputPx > 0 ? parsedTotal / inputPx : (amountIsQuote ? (inputPx > 0 ? inputQty / inputPx : 0) : inputQty);
    if (isCross) {
      borrowingVal = baseQty > 0 ? Math.max(0, baseQty - baseAvailable) : 0;
    } else {
      borrowingVal = baseQty > 0 ? Math.max(0, baseQty * (1 - 1 / L)) : 0;
    }
  }

  const availValue = isBuy ? quoteAvailable : baseAvailable;
  const availSymbol = isBuy ? quote_currency : base_currency;

  const maxVal = isBuy ? Math.max(0, quoteMax) : Math.max(0, baseMax);
  const maxSymbol = isBuy ? quote_currency : base_currency;

  const borrowingSymbol = isBuy ? quote_currency : base_currency;

  return (
    <View style={{ marginTop: 8 }}>
      {/* Available / Max / Borrowable */}
      <View style={{ marginBottom: 16, gap: 6 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <AppText style={{ fontSize: 13, color: colors.placeholderColor }}>Available</AppText>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <AppText style={{ fontSize: 13, color: themeColors.text, fontWeight: "600" }}>
              {`${fmt(availValue)} ${availSymbol}`}
            </AppText>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onBorrowPress}
              style={{ marginLeft: 6 }}
            >
              <FastImage source={add} style={{ width: 14, height: 14 }} tintColor={themeColors.text} resizeMode="contain" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <AppText style={{ fontSize: 13, color: colors.placeholderColor }}>Max</AppText>
          <AppText style={{ fontSize: 13, color: themeColors.text, fontWeight: "600" }}>
            {`${fmt(maxVal)} ${maxSymbol}`}
          </AppText>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <AppText style={{ fontSize: 13, color: colors.placeholderColor }}>Borrowable</AppText>
          <AppText style={{ fontSize: 13, color: themeColors.text, fontWeight: "600" }}>
            {`${fmt(borrowingVal)} ${borrowingSymbol}`}
          </AppText>
        </View>
      </View>

      {/* Submit Button */}
      <View style={styles.spotOrderSubmitWrap}>
        <Button
          children={`${isBuy ? "Buy" : "Sell"} ${base_currency}`}
          disabled={loading || !amount || parseFloat(amount) <= 0}
          loading={loading}
          activeOpacity={(loading || !amount || parseFloat(amount) <= 0) ? 1 : 0.75}
          containerStyle={[
            styles.spotOrderSubmitBtn,
            {
              backgroundColor: (amount && parseFloat(amount) > 0)
                ? (isBuy
                  ? (themeColors.spotTradeBuy ?? colors.spotTradeBuy)
                  : (themeColors.spotTradeSell ?? colors.spotTradeSell))
                : (isBuy
                  ? (themeColors.isDark ? "#19402E" : "#A7E2C6")
                  : (themeColors.isDark ? "#4A1D20" : "#F2B2B4")),
            },
          ]}
          onPress={() => {
            if (amount && parseFloat(amount) > 0) {
              onSubmit();
            }
          }}
          titleStyle={styles.spotOrderSubmitTitle}
        />
      </View>
    </View>
  );
};

export default MarginBottomSection;
