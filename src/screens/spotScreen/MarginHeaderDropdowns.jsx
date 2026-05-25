import React, { useRef } from "react";
import { View, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import FastImage from "react-native-fast-image";
import RBSheet from "react-native-raw-bottom-sheet";
import { AppText, SEMI_BOLD, MEDIUM } from "../../shared";
import { colors, lightTheme } from "../../theme/colors";
import { downIcon, tick } from "../../helper/ImageAssets";

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
        height={200}
        animationType="slide"
        customStyles={{
          container: {
            backgroundColor: themeColors.themeElevationColor,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingHorizontal: universalPaddingHorizontal,
            paddingTop: 12,
            paddingBottom: 8,
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
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: themeColors.themeBorderColor }}>
            <AppText weight={SEMI_BOLD} style={{ fontSize: 16, color: themeColors.text }}>Margin Mode</AppText>
            <TouchableOpacity onPress={() => rbSheetMarginMode?.current?.close()}>
              <AppText style={{ color: themeColors.secondaryText, fontSize: 14 }}>Close</AppText>
            </TouchableOpacity>
          </View>
          {["Isolated", "Cross"].map((mode) => (
            <TouchableOpacity
              key={mode}
              onPress={() => {
                setMarginMode(mode);
                rbSheetMarginMode?.current?.close();
              }}
              style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: themeColors.themeBorderColor }}
            >
              <AppText weight={SEMI_BOLD} style={{ color: themeColors.text, fontSize: 14, flex: 1 }}>{mode}</AppText>
              {marginMode === mode && (
                <View style={{ width: 16, height: 16, borderRadius: 10, backgroundColor: colors.black, alignItems: "center", justifyContent: "center" }}>
                  <FastImage source={tick} tintColor={colors.white} style={{ width: 8, height: 8 }} resizeMode="contain" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </RBSheet>

      {/* Margin Leverage Sheet */}
      <RBSheet
        ref={rbSheetMarginLeverage}
        closeOnDragDown={true}
        closeOnPressMask={true}
        height={320}
        animationType="slide"
        customStyles={{
          container: {
            backgroundColor: themeColors.themeElevationColor,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingHorizontal: universalPaddingHorizontal,
            paddingTop: 12,
            paddingBottom: 8,
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
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: themeColors.themeBorderColor }}>
            <AppText weight={SEMI_BOLD} style={{ fontSize: 16, color: themeColors.text }}>Leverage</AppText>
            <TouchableOpacity onPress={() => rbSheetMarginLeverage?.current?.close()}>
              <AppText style={{ color: themeColors.secondaryText, fontSize: 14 }}>Close</AppText>
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {["1x", "2x", "3x", "5x", "10x", "20x"].map((lev) => (
              <TouchableOpacity
                key={lev}
                onPress={() => {
                  setMarginLeverage(lev);
                  rbSheetMarginLeverage?.current?.close();
                }}
                style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: themeColors.themeBorderColor }}
              >
                <AppText weight={SEMI_BOLD} style={{ color: themeColors.text, fontSize: 14, flex: 1 }}>{lev}</AppText>
                {marginLeverage === lev && (
                  <View style={{ width: 16, height: 16, borderRadius: 10, backgroundColor: colors.black, alignItems: "center", justifyContent: "center" }}>
                    <FastImage source={tick} tintColor={colors.white} style={{ width: 8, height: 8 }} resizeMode="contain" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </RBSheet>
    </View>
  );
};

export default MarginHeaderDropdowns;
