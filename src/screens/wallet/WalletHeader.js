import { View, ScrollView, TouchableOpacity as RNTouchableOpacity, Image } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { AppText, BLACK, BOLD, SEMI_BOLD, THIRTEEN, TWELVE, YELLOW } from "../../shared";
import { colors } from "../../theme/colors";
import { useState, useRef } from "react";
import { back_ic } from "../../helper/ImageAssets";
import FastImage from "react-native-fast-image";
import { useTheme } from "../../hooks/useTheme";

const WalletHeader = ({ activeTab, setActiveTab }) => {
  const { colors: themeColors, theme } = useTheme();
  const scrollRef = useRef(null);
  const [layoutWidth, setLayoutWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [scrollX, setScrollX] = useState(0);

  const maxOffset = Math.max(contentWidth - layoutWidth, 0);
  const threshold = 5;
  const canScrollLeft = scrollX > threshold;
  const canScrollRight =
    maxOffset > threshold && scrollX < maxOffset - threshold;

  const handleScroll = (e) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    setScrollX(offsetX);
  };

  const handleLayout = (e) => {
    const width = e.nativeEvent.layout.width;
    setLayoutWidth(width);
  };

  const handleContentSizeChange = (w) => {
    setContentWidth(w);
  };

  const scrollToEdge = (direction) => {
    if (!scrollRef.current) return;
    const x = direction === "right" ? maxOffset : 0;
    scrollRef.current.scrollTo({ x, animated: true });
  };

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
      }}
    >
      {/* Left scroll icon (show when can scroll left) */}
      {canScrollLeft && (
        <RNTouchableOpacity
          activeOpacity={0.7}
          style={{
            paddingHorizontal: 8,
            paddingVertical: 4,
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => scrollToEdge("left")}
        >
         <FastImage
                source={back_ic}
                resizeMode="contain"
                style={{
                  width: 15,
                  height: 15,
                  // transform: [{ rotateX: "180deg" }, { rotateZ: "3.2rad" }],
                }}
                tintColor={theme !== "Dark" ? colors.black : colors.white}
              />
        </RNTouchableOpacity>
      )}

      {/* Horizontal scrollable tabs */}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 4,
          alignItems: "center",
        }}
        style={{ flex: 1 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onLayout={handleLayout}
        onContentSizeChange={(w) => handleContentSizeChange(w)}
      >
        <TouchableOpacity
          onPress={() => setActiveTab("Overview")}
          style={{ marginHorizontal: 14 }}
        >
          <AppText
            weight={BOLD}
            type={THIRTEEN}
            style={{ color: activeTab === "Overview" ? colors.buttonBg : themeColors.secondaryText }}
          >
            Overview
          </AppText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("Main")}
          style={{ marginHorizontal: 14 }}
        >
          <AppText
            weight={BOLD}
            type={THIRTEEN}
            style={{ color: activeTab === "Main" ? colors.buttonBg : themeColors.secondaryText }}
          >
            Main
          </AppText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("Spot")}
          style={{ marginHorizontal: 14 }}
        >
          <AppText
            weight={BOLD}
            type={THIRTEEN}
            style={{ color: activeTab === "Spot" ? colors.buttonBg : themeColors.secondaryText }}
          >
            Spot
          </AppText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("Swap")}
          style={{ marginHorizontal: 14 }}
        >
          <AppText
            weight={BOLD}
            type={THIRTEEN}
            style={{ color: activeTab === "Swap" ? colors.buttonBg : themeColors.secondaryText }}
          >
            Swap
          </AppText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("Earning")}
          style={{ marginHorizontal: 14 }}
        >
          <AppText
            weight={BOLD}
            type={THIRTEEN}
            style={{ color: activeTab === "Earning" ? colors.buttonBg : themeColors.secondaryText }}
          >
            Earning
          </AppText>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("Futures")}
          style={{ marginHorizontal: 14 }}
        >
          <AppText
            weight={BOLD}
            type={THIRTEEN}
            style={{ color: activeTab === "Futures" ? colors.buttonBg : themeColors.secondaryText }}
          >
            Futures
          </AppText>
        </TouchableOpacity>
        {/* <TouchableOpacity
          onPress={() => setActiveTab("Options")}
          style={{ marginHorizontal: 14 }}
        >
          <AppText
            weight={BOLD}
            type={THIRTEEN}
            color={activeTab === "Options" ? YELLOW : BLACK}
          >
            Options
          </AppText>
        </TouchableOpacity> */}
      </ScrollView>

      {/* Right scroll icon (show when can scroll right) */}
      {canScrollRight && (
        <RNTouchableOpacity
          activeOpacity={0.7}
          style={{
            paddingHorizontal: 8,
            paddingVertical: 4,
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => scrollToEdge("right")}
        >
          <FastImage
                source={back_ic}
                resizeMode="contain"
                style={{
                  width: 15,
                  height: 15,
                  transform: [{ rotateX: "180deg" }, { rotateZ: "3.2rad" }],
                }}
                tintColor={theme !== "Dark" ? colors.black : colors.white}
              />
        </RNTouchableOpacity>
      )}
    </View>
  );
};

export default WalletHeader;
