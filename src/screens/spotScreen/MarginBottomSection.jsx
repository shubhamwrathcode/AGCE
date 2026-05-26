import React from "react";
import { View, TouchableOpacity, TextInput } from "react-native";
import FastImage from "react-native-fast-image";
import { AppText, SEMI_BOLD, Button } from "../../shared";
import { colors, lightTheme } from "../../theme/colors";
import { checkIc, add } from "../../helper/ImageAssets";

const MarginBottomSection = ({
  tpSlEnabled,
  setTpSlEnabled,
  tpPrice,
  setTpPrice,
  slPrice,
  setSlPrice,
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
}) => {
  return (
    <View style={{ marginTop: 8 }}>
      {/* TP/SL & Advanced row */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingHorizontal: 4 }}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setTpSlEnabled((v) => !v)}
          style={{ flexDirection: "row", alignItems: "center" }}
        >
          <View style={{
            borderColor: tpSlEnabled ? colors.black : themeColors.themeBorderColor,
            backgroundColor: tpSlEnabled ? colors.black : "transparent",
            marginRight: 8,
            width: 18,
            height: 18,
            borderWidth: 1.5,
            borderRadius: 3,
            alignItems: "center",
            justifyContent: "center"
          }}>
            {tpSlEnabled ? (
              <FastImage source={checkIc} style={{ width: 11, height: 11 }} resizeMode="contain" tintColor={colors.white} />
            ) : null}
          </View>
          <View style={{ borderBottomWidth: 1, borderBottomColor: themeColors.text, borderStyle: "dotted", paddingBottom: 1 }}>
            <AppText style={{ fontSize: 13, color: themeColors.text }}>TP/SL</AppText>
          </View>
        </TouchableOpacity>
        <AppText style={{ fontSize: 13, color: themeColors.secondaryText }}>Advanced</AppText>
      </View>

      {/* TP Price & SL Price Input Fields */}
      {tpSlEnabled && (
        <View style={{ gap: 8, marginBottom: 12 }}>
          {/* TP Price Input */}
          <View style={styles.spotOrderInputBlock}>
            <View style={[styles.spotOrderFieldCard, { backgroundColor: lightTheme.input, borderWidth: 0, minHeight: 44 }]}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <TextInput
                  placeholder="TP Price"
                  placeholderTextColor="#8E8E93"
                  selectionColor={inputSelectionColor}
                  value={tpPrice}
                  onChangeText={setTpPrice}
                  keyboardType="numeric"
                  style={{
                    flex: 1,
                    color: themeColors.text,
                    fontSize: 13,
                    paddingVertical: 6,
                    fontFamily: fontFamilySemiBold
                  }}
                />
                <AppText weight={SEMI_BOLD} style={{ color: themeColors.text, fontSize: 13 }}>
                  {quote_currency}
                </AppText>
              </View>
            </View>
          </View>

          {/* SL Price Input */}
          <View style={styles.spotOrderInputBlock}>
            <View style={[styles.spotOrderFieldCard, { backgroundColor: lightTheme.input, borderWidth: 0, minHeight: 44 }]}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <TextInput
                  placeholder="SL Price"
                  placeholderTextColor="#8E8E93"
                  selectionColor={inputSelectionColor}
                  value={slPrice}
                  onChangeText={setSlPrice}
                  keyboardType="numeric"
                  style={{
                    flex: 1,
                    color: themeColors.text,
                    fontSize: 13,
                    fontFamily: fontFamilySemiBold,
                    paddingVertical: 6,
                  }}
                />
                <AppText weight={SEMI_BOLD} style={{ color: themeColors.text, fontSize: 13 }}>
                  {quote_currency}
                </AppText>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Available / Max / Borrowing */}
      <View style={{ marginBottom: 16, gap: 6 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <AppText style={{ fontSize: 13, color: colors.placeholderColor }}>Available</AppText>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <AppText style={{ fontSize: 13, color: themeColors.text, fontWeight: "600" }}>
              {isBuy
                ? `${coinBalance?.quote_currency_balance != null ? coinBalance.quote_currency_balance : "--"} ${quote_currency}`
                : `${coinBalance?.base_currency_balance != null ? coinBalance.base_currency_balance : "--"} ${base_currency}`}
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
            {isBuy
              ? `0 ${quote_currency}`
              : `0 ${base_currency}`}
          </AppText>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <AppText style={{ fontSize: 13, color: colors.placeholderColor }}>Borrowing</AppText>
          <AppText style={{ fontSize: 13, color: themeColors.text, fontWeight: "600" }}>
            {isBuy
              ? `0 ${quote_currency}`
              : `0 ${base_currency}`}
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
