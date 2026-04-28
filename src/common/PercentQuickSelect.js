import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { AppText, TEN } from "./AppText";
import { colors } from "../theme/colors";

const DEFAULT_OPTIONS = [0, 25, 50, 75, 100];
const TRACK_HEIGHT = 2;
const TRACK_WRAPPER_HEIGHT = 44;
const LABEL_COLOR = "#FFFFFF";
const MARKER_SIZE = 12;
const MARKER_SIZE_SELECTED = 14;
// Inset so bar stays inside first/last rhombus (rhombus is rotated square, so horizontal extent > size/2)
const BAR_INSET = Math.ceil(MARKER_SIZE_SELECTED / 2 + (MARKER_SIZE_SELECTED - 1) / Math.sqrt(2));

/**
 * Percentage quick-select: thin bar + custom rhombus (diamond) markers + labels.
 * Bar/rhombus borders: secondaryText by default; white for selected range (0 to active %).
 * Background: themeElevationColor everywhere.
 */
const PercentQuickSelect = ({
  options = DEFAULT_OPTIONS,
  activeValue,
  onSelect,
  theme = "Dark",
}) => {
  const [trackWidth, setTrackWidth] = useState(0);

  const handleTrackLayout = (e) => {
    const { width } = e.nativeEvent.layout;
    setTrackWidth(width);
  };

  const borderColorDefault = colors.secondaryText;
  const borderColorSelected = colors.white;
  const bgColor = colors.themeElevationColor;
  const labelColor = theme === "Dark" ? LABEL_COLOR : "#222";
  const effectiveActive =
    activeValue !== undefined && activeValue !== null && activeValue !== ""
      ? Number(activeValue)
      : 0;

  const barLength = Math.max(0, (trackWidth || 0) - 2 * BAR_INSET);
  const fillWidth =
    trackWidth &&
      !Number.isNaN(effectiveActive) &&
      effectiveActive >= 0 &&
      effectiveActive <= 100
      ? (effectiveActive / 100) * barLength
      : 0;

  return (
    <View style={styles.sliderContainer}>
      <View
        style={styles.trackWrapper}
        onLayout={handleTrackLayout}
      >
        <View
          style={[
            styles.track,
            {
              left: BAR_INSET,
              right: BAR_INSET,
              backgroundColor: bgColor,
              borderWidth: 1,
              borderColor: borderColorDefault,
            },
          ]}
        />
        <View
          style={[
            styles.activeTrack,
            {
              left: BAR_INSET,
              width: Math.max(fillWidth, 0),
              backgroundColor: bgColor,
              borderWidth: 1,
              borderColor: borderColorSelected,
            },
          ]}
        />
        <View style={styles.markersAndLabelsRow}>
          {options.map((value) => {
            const isSelected = effectiveActive === value;
            const isInFilledRange = effectiveActive >= value;
            const size = MARKER_SIZE;
            return (
              <TouchableOpacity
                key={value}
                onPress={() => onSelect(value)}
                activeOpacity={0.8}
                style={styles.column}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <View
                  style={[
                    styles.rhombusOuter,
                    { width: size, height: size },
                  ]}
                >
                  <View
                    style={[
                      styles.rhombus,
                      {
                        width: size - 1,
                        height: size - 1,
                        backgroundColor: bgColor,
                        borderWidth: 1,
                        borderColor: isInFilledRange
                          ? borderColorSelected
                          : borderColorDefault,
                      },
                    ]}
                  />
                </View>
                <AppText
                  type={TEN}
                  style={[
                    styles.labelText,
                    { color: labelColor },
                    isSelected && styles.labelTextActive,
                  ]}
                >
                  {value}%
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sliderContainer: {
    width: "100%",
    marginTop: 4,
    marginBottom: 6,
  },
  trackWrapper: {
    minHeight: TRACK_WRAPPER_HEIGHT,
    paddingHorizontal: MARKER_SIZE_SELECTED / 2,
  },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    position: "absolute",
    top: 2 + MARKER_SIZE_SELECTED / 2 - TRACK_HEIGHT / 2,
  },
  activeTrack: {
    position: "absolute",
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    top: 2 + MARKER_SIZE_SELECTED / 2 - TRACK_HEIGHT / 2,
  },
  markersAndLabelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: 2,
  },
  column: {
    alignItems: "center",
    justifyContent: "flex-start",
  },
  rhombusOuter: {
    alignItems: "center",
    justifyContent: "center",
  },
  rhombus: {
    transform: [{ rotate: "45deg" }],
  },
  labelText: {
    marginTop: 4,
  },
  labelTextActive: {
    fontWeight: "600",
  },
});

export default PercentQuickSelect;
