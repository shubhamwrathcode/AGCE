import React, { useRef } from "react";
import { View, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import FastImage from "react-native-fast-image";
import RBSheet from "react-native-raw-bottom-sheet";
import { AppText, SEMI_BOLD, MEDIUM, Button } from "../../shared";
import { colors, lightTheme } from "../../theme/colors";
import { checkIc, downIcon, tick, closeIcon, add, minus, right_ic } from "../../helper/ImageAssets";

const MarginHeaderDropdowns = ({
  marginMode,
  setMarginMode,
  marginLeverage,
  setMarginLeverage,
  themeColors,
  isDark,
  universalPaddingHorizontal,
  styles,
}) => {
  const rbSheetMarginMode = useRef();
  const rbSheetMarginLeverage = useRef();

  const leverageList = ["1x", "2x", "3x", "5x", "10x", "20x"];

  const handleDecrement = () => {
    const num = parseInt(marginLeverage, 10) || 1;
    if (num > 1) {
      setMarginLeverage(`${num - 1}x`);
    }
  };

  const handleIncrement = () => {
    const num = parseInt(marginLeverage, 10) || 1;
    if (num < 20) {
      setMarginLeverage(`${num + 1}x`);
    }
  };

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => rbSheetMarginMode.current.open()}
        style={[
          styles.dropdown,
          {
            backgroundColor: lightTheme.input,
            flex: 1,
            borderRadius: 10,
            borderWidth: 0,
            paddingVertical: 6,
            paddingHorizontal: 12,
            marginBottom: 0,
            flexDirection: "row",
            alignItems: "center",
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
            backgroundColor: lightTheme.input,
            width: 75,
            borderRadius: 10,
            borderWidth: 0,
            paddingVertical: 6,
            paddingHorizontal: 12,
            marginBottom: 0,
            flexDirection: "row",
            alignItems: "center",
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
        closeOnDragDown={true}
        closeOnPressMask={true}
        height={330}
        animationType="slide"
        customStyles={{
          container: {
            backgroundColor: themeColors.themeElevationColor,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingHorizontal: universalPaddingHorizontal,
          },
          wrapper: {
            backgroundColor: "#0006",
          },
          draggableIcon: {
            backgroundColor: themeColors.themeBorderColor,
            width: 40,
          },
        }}
      >
        <View style={{ flex: 1 }}>
          <View style={{ paddingVertical: 15 }}>
            <AppText weight={SEMI_BOLD} style={{ fontSize: 18, color: themeColors.text, marginLeft: 5 }}>
              Margin Trading
            </AppText>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {[
              {
                name: "Isolated",
                description:
                  "Margin and PnL of different trading pairs are calculated separately. Liquidation in one market will not affect positions in other markets.",
              },
              {
                name: "Cross",
                description:
                  "All positions share margin and PnL are offset. In the event of liquidation, all margin could be sold and all positions liquidated.",
              },
            ].map((item) => {
              const isSelected = marginMode === item.name;
              return (
                <TouchableOpacity
                  key={item.name}
                  activeOpacity={0.8}
                  onPress={() => {
                    setMarginMode(item.name);
                    rbSheetMarginMode?.current?.close();
                  }}
                  style={{
                    backgroundColor: 'transprent',
                    borderWidth: 1,
                    borderColor: isSelected
                      ? themeColors.text
                      : themeColors.themeBorderColor,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                  }}
                >
                  <AppText
                    weight={MEDIUM}
                    style={{
                      color: themeColors.text,
                      fontSize: 16,
                      marginBottom: 2,
                    }}
                  >
                    {item.name}
                  </AppText>
                  <AppText
                    style={{
                      color: themeColors.secondaryText,
                      fontSize: 13,
                    }}
                  >
                    {item.description}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </RBSheet>


      {/* Margin Leverage Sheet */}
      <RBSheet
        ref={rbSheetMarginLeverage}
        closeOnDragDown={false}
        closeOnPressMask={true}
        height={430}
        animationType="slide"
        customStyles={{
          container: {
            backgroundColor: themeColors.themeElevationColor,
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
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 4, paddingBottom: 20 }}>
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
            {/* Stepper */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "#F2F2F7",
                borderRadius: 10,
                paddingHorizontal: 16,
                paddingVertical: 10,
                marginBottom: 12,
              }}
            >
              <TouchableOpacity onPress={handleDecrement} style={{ padding: 4 }}>
                <FastImage
                  source={minus}
                  resizeMode="contain"
                  style={{ width: 14, height: 14 }}
                  tintColor={themeColors.secondaryText}
                />
              </TouchableOpacity>
              <AppText weight={SEMI_BOLD} style={{ fontSize: 16, color: themeColors.text }}>
                {marginLeverage}
              </AppText>
              <TouchableOpacity onPress={handleIncrement} style={{ padding: 4 }}>
                <FastImage
                  source={add}
                  resizeMode="contain"
                  style={{ width: 14, height: 14 }}
                  tintColor={themeColors.secondaryText}
                />
              </TouchableOpacity>
            </View>

            {/* Quick selector row */}
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
              {leverageList.map((lev) => {
                const isSelected = marginLeverage === lev;
                return (
                  <TouchableOpacity
                    key={lev}
                    onPress={() => setMarginLeverage(lev)}
                    style={{
                      flex: 1,
                      alignItems: "center",
                      justifyContent: "center",
                      paddingVertical: 6,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: isSelected ? themeColors.text : "transparent",
                      backgroundColor: "#F2F2F7"
                    }}
                  >
                    <AppText weight={SEMI_BOLD} style={{ color: themeColors.text, fontSize: 12 }}>
                      {lev}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Details List */}
            <View style={{ marginBottom: 8, marginTop: 10 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 }}>
                <AppText style={{ color: themeColors.secondaryText, fontSize: 12 }}>Allow to Open</AppText>
                <AppText weight={MEDIUM} style={{ color: themeColors.text, fontSize: 12 }}>0 USDT</AppText>
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 }}>
                <AppText style={{ color: themeColors.secondaryText, fontSize: 12 }}>Maximum Borrowable</AppText>
                <AppText weight={MEDIUM} style={{ color: themeColors.text, fontSize: 12 }}>0 USDT</AppText>
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 }}>
                <AppText style={{ color: themeColors.secondaryText, fontSize: 12 }}>Maximum Leverage</AppText>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <AppText weight={MEDIUM} style={{ color: themeColors.text, fontSize: 12 }}>{marginLeverage}</AppText>
                  <FastImage
                    source={right_ic}
                    resizeMode="contain"
                    style={{ width: 10, height: 10 }}
                    tintColor={themeColors.secondaryText}
                  />
                </View>
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 }}>
                <AppText style={{ color: themeColors.secondaryText, fontSize: 12 }}>Current Loan Limit</AppText>
                <AppText weight={MEDIUM} style={{ color: themeColors.text, fontSize: 12 }}>0 USDT</AppText>
              </View>
            </View>

            {/* Warning Message */}
            <AppText weight={MEDIUM} style={{ color: colors.orangeTheme, fontSize: 11, marginTop: 4, lineHeight: 14 }}>
              The current available margin ≤ 0. You can increase the leverage or add margin.
            </AppText>
          </ScrollView>

          {/* Confirm Button */}
          <Button
            onPress={() => rbSheetMarginLeverage?.current?.close()}
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
