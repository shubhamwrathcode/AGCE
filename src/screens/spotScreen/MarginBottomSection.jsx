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
  crossAccount,
  crossBorrowable,
  isBuy,
  onSubmit,
  themeColors,
  styles,
  onBorrowPress,
  marginLeverage,
  price,
  amount,
  buy_price,
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

  const quoteAvailable = isCross && coinBalance?.buy_available != null ? Number(coinBalance.buy_available) : netEquity;
  const baseAvailable = isCross && coinBalance?.sell_available != null ? Number(coinBalance.sell_available) : baseEquity;

  const grossQuoteMax = netEquity * leverage;
  const quoteMax = qCap != null && Number.isFinite(qCap) ? Math.min(grossQuoteMax, qCap + Qf) : grossQuoteMax;

  const fmt = (val) => {
    if (val == null || !Number.isFinite(Number(val))) return "0";
    const res = parseFloat(Number(val).toFixed(5)).toString();
    return res === "NaN" ? "0" : res;
  };

  const inputQty = parseFloat(amount) || 0;
  const inputPx = parseFloat(price) || parseFloat(buy_price) || 0;

  const grossSellMax = inputPx > 0 ? grossQuoteMax / inputPx : 0;
  const baseMax = bCap != null && Number.isFinite(bCap) ? Math.min(grossSellMax, bCap) : grossSellMax;

  let borrowingVal = 0;
  if (isBuy) {
    const V = inputQty * inputPx;
    borrowingVal = V > 0 ? Math.max(0, V * (1 - 1 / leverage)) : 0;
  } else {
    borrowingVal = inputQty > 0 ? Math.max(0, inputQty - baseAvailable) : 0;
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
          disabled={loading}
          loading={loading}
          activeOpacity={0.75}
          containerStyle={[
            styles.spotOrderSubmitBtn,
            {
              backgroundColor: isBuy
                ? (themeColors.spotTradeBuy ?? colors.spotTradeBuy)
                : (themeColors.spotTradeSell ?? colors.spotTradeSell),
            },
          ]}
          onPress={onSubmit}
          titleStyle={styles.spotOrderSubmitTitle}
        />
      </View>
    </View>
  );
};

export default MarginBottomSection;
