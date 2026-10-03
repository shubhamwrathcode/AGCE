import React, { useEffect, useRef } from "react";
import { View, Animated, Dimensions } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useTheme } from "../../../hooks/useTheme";

const { width: Width } = Dimensions.get("window");

export const SHIMMER_STRIP_WIDTH_DEFAULT = 100;
export const ShimmerBox = ({
  width, height, borderRadius = 8, style,
  shimmerStripWidth = SHIMMER_STRIP_WIDTH_DEFAULT,
  shimmerDuration = 700,
  shimmerToValue,
  shimmerColorsOverride
}) => {
  const { colors: themeColors, isDark } = useTheme();
  const stripW = typeof shimmerStripWidth === "number" ? shimmerStripWidth : SHIMMER_STRIP_WIDTH_DEFAULT;
  /** Match Spot order inputs (`theme.input`) so skeleton reads as the same surface; shimmer sits on top. */
  const boneColor =
    themeColors?.input ??
    themeColors?.card ??
    (isDark ? "rgba(100, 130, 180, 0.22)" : "rgba(160, 185, 220, 0.35)");
  const shimmerColors =
    shimmerColorsOverride ||
    (isDark
      ? ["transparent", "rgba(255,255,255,0.26)", "transparent"]
      : ["transparent", "rgba(255,255,255,0.72)", "transparent"]);
  const shimmerX = useRef(new Animated.Value(-stripW)).current;
  const travelTo =
    shimmerToValue !== undefined
      ? shimmerToValue
      : typeof width === "number"
        ? width + stripW * 2
        : Width + stripW;
  useEffect(() => {
    shimmerX.setValue(-stripW);
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerX, {
          toValue: travelTo,
          duration: shimmerDuration,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerX, {
          toValue: -stripW,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerX, stripW, shimmerDuration, travelTo]);
  return (
    <View style={[{ width, height, borderRadius, overflow: "hidden", backgroundColor: boneColor }, style]}>
      <Animated.View
        pointerEvents="none"
        style={[
          { position: "absolute", top: 0, bottom: 0, width: stripW, left: 0 },
          { transform: [{ translateX: shimmerX }] },
        ]}
      >
        <LinearGradient
          colors={shimmerColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1, width: stripW }}
        />
      </Animated.View>
    </View>
  );
};
