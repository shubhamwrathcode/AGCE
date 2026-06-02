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
  isBuy,
  onSubmit,
  themeColors,
  isDark,
  inputSelectionColor,
  fontFamilySemiBold,
  styles,
  onBorrowPress,
  marginLeverage,
  price,
  amount,
  buy_price,
  formatTotal,
}) => {
  const leverage = parseInt(marginLeverage, 10) || 5;

  const quoteAvailable = Number(coinBalance?.quote_currency_balance) || 0;
  const quoteLocked = Number(coinBalance?.quote_currency_locked) || 0;
  const quoteBorrowed = Number(coinBalance?.quote_currency_borrowed) || 0;

  const baseAvailable = Number(coinBalance?.base_currency_balance) || 0;
  const baseLocked = Number(coinBalance?.base_currency_locked) || 0;
  const baseBorrowed = Number(coinBalance?.base_currency_borrowed) || 0;

  const fmt = (val) => {
    if (formatTotal) {
      const res = formatTotal(val);
      if (res === "" || res == null) return "0";
      return res;
    }
    return val.toFixed(8).replace(/\.?0+$/, "") || "0";
  };

  const availValue = isBuy ? quoteAvailable : baseAvailable;
  const availSymbol = isBuy ? quote_currency : base_currency;

  const maxVal = isBuy
    ? Math.max(0, (quoteAvailable + quoteLocked - quoteBorrowed) * leverage)
    : Math.max(0, (baseAvailable + baseLocked - baseBorrowed) * leverage);
  const maxSymbol = isBuy ? quote_currency : base_currency;

  const inputQty = parseFloat(amount) || 0;
  const inputPx = parseFloat(price) || parseFloat(buy_price) || 0;
  const cost = isBuy ? inputQty * inputPx : inputQty;
  const borrowingVal = Math.max(0, cost - (isBuy ? quoteAvailable : baseAvailable));
  const borrowingSymbol = isBuy ? quote_currency : base_currency;

  return (
    <View style={{ marginTop: 8 }}>
      {/* Available / Max / Borrowing */}
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
          <AppText style={{ fontSize: 13, color: colors.placeholderColor }}>Borrowing</AppText>
          <AppText style={{ fontSize: 13, color: themeColors.text, fontWeight: "600" }}>
            {`${fmt(borrowingVal)} ${borrowingSymbol}`}
          </AppText>
        </View>
      </View>

      {/* Submit Button */}
      <View style={styles.spotOrderSubmitWrap}>
        <Button
          children={`Margin ${base_currency}`}
          disabled={false}
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
