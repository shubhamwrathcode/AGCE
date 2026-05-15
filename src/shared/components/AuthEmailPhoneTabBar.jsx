import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { AppText, BOLD, FOURTEEN, MEDIUM, SEMI_BOLD } from "..";
import TouchableOpacityView from "./TouchableOpacityView";
import { useTheme } from "../../hooks/useTheme";
import { colors } from "../../theme/colors";

/** Short centered dash under the active label (~design width), slides on change */
const INDICATOR_WIDTH = 28;
/** Underline thickness (4px felt heavy; 2px thinner → use 2) */
const INDICATOR_HEIGHT = 3;

const AuthEmailPhoneTabBar = ({ tabs, index, onChange }) => {
  const { colors: themeColors, isDark } = useTheme();
  const underlineColor = isDark ? colors.white : themeColors.text;
  const indicatorX = useRef(new Animated.Value(0)).current;
  const [layouts, setLayouts] = useState([]);
  const hasAnimatedOnce = useRef(false);

  const handleTabLayout = (i) => (e) => {
    const { x, width } = e.nativeEvent.layout;
    setLayouts((prev) => {
      const next = [...prev];
      next[i] = { x, width };
      return next;
    });
  };

  useEffect(() => {
    const L = layouts[index];
    if (!L || L.width == null) return;
    const target = L.x + L.width / 2 - INDICATOR_WIDTH / 2;

    if (!hasAnimatedOnce.current) {
      indicatorX.setValue(target);
      hasAnimatedOnce.current = true;
      return;
    }

    Animated.spring(indicatorX, {
      toValue: target,
      useNativeDriver: true,
      friction: 9,
      tension: 78,
    }).start();
  }, [index, layouts, indicatorX]);

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {tabs.map((title, i) => {
          const active = i === index;
          return (
            <TouchableOpacityView
              key={`${title}-${i}`}
              onLayout={handleTabLayout(i)}
              onPress={() => onChange(i)}
              style={styles.tabHit}
            >
              <AppText
                type={FOURTEEN}
                weight={MEDIUM}
                style={{
                  color: active
                    ? isDark
                      ? colors.white
                      : themeColors.text
                    : themeColors.secondaryText,
                }}
              >
                {title}
              </AppText>
            </TouchableOpacityView>
          );
        })}
      </View>
      {layouts[index]?.width != null ? (
        <View style={styles.indicatorSlot} pointerEvents="none">
          <Animated.View
            style={[
              styles.indicator,
              {
                backgroundColor: underlineColor,
                transform: [{ translateX: indicatorX }],
              },
            ]}
          />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: "relative",
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },
  tabHit: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  indicatorSlot: {
    height: INDICATOR_HEIGHT,
    position: "relative",
  },
  indicator: {
    position: "absolute",
    left: 0,
    bottom: 0,
    width: INDICATOR_WIDTH,
    height: INDICATOR_HEIGHT,
    borderRadius: INDICATOR_HEIGHT / 2,
  },
});

export default AuthEmailPhoneTabBar;
