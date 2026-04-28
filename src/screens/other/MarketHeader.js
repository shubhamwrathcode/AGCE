import React from "react";
import {
  View,
  TextInput,
  StyleSheet,
  ScrollView,
  Dimensions,
} from "react-native";
import { searchIcon } from "../../helper/ImageAssets";
import { TouchableOpacity } from "react-native-gesture-handler";
import { AppText, FOURTEEN, SEMI_BOLD } from "../../shared";
import FastImage from "react-native-fast-image";
import { colors } from "../../theme/colors";
import NavigationService from "../../navigation/NavigationService";
import { SEARCH_SCREEN } from "../../navigation/routes";
import { useTheme } from "../../hooks/useTheme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const H_PAD = Math.max(14, SCREEN_WIDTH * 0.04);

const TABS = [
  { key: "Favourite", label: "Favourite" },
  { key: "Spot", label: "Spot" },
  { key: "Futures", label: "Futures" },
  { key: "Discover", label: "Discover" },
  { key: "MemeX", label: "MemeX" },
];

const MarketHeader = ({ activeTab, setActiveTab, search, onSearchChange, showSearch }) => {
  const { colors: themeColors } = useTheme();

  const textColor = themeColors.text;
  const placeholderColor = themeColors.secondaryText;
  const tabInactiveColor = themeColors.secondaryText;

  return (
    <View style={[styles.wrapper, { backgroundColor: themeColors.background }]}>
      {/* Search bar - full width, reference style */}
      {showSearch && (
        <View style={[styles.searchBar, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 0.8 }]}>
          <FastImage
            source={searchIcon}
            resizeMode="contain"
            style={styles.searchIcon}
            tintColor={placeholderColor}
          />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Search Coin Pairs"
            placeholderTextColor={placeholderColor}
            value={search}
            onChangeText={onSearchChange}
            returnKeyType="search"
          />
        </View>
      )}

      {!showSearch && (
        <TouchableOpacity
          onPress={() => NavigationService.navigate(SEARCH_SCREEN)}
          style={[styles.searchBar, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 0.8 }]}
        >
          <FastImage source={searchIcon} resizeMode="contain" style={styles.searchIcon} tintColor={placeholderColor} />
          <AppText style={[styles.searchPlaceholder, { color: placeholderColor }]}>Search Coin Pairs</AppText>
        </TouchableOpacity>
      )}

      {/* Primary tabs - yellow underline for selected */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsScroll}
        style={styles.tabsRow}
      >
        {TABS.map(({ key, label }) => {
          const isActive = activeTab === key;
          return (
            <TouchableOpacity
              key={key}
              onPress={() => setActiveTab(key)}
              style={[styles.tab, isActive && styles.tabActive]}
              activeOpacity={0.8}
            >
              <AppText
                type={FOURTEEN}
                weight={SEMI_BOLD}
                style={[
                  styles.tabLabel,
                  { color: isActive ? textColor : tabInactiveColor },
                  isActive && styles.tabLabelActive,
                ]}
              >
                {label}
              </AppText>
              {isActive && <View style={[styles.tabUnderline, { backgroundColor: themeColors.button }]} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: H_PAD,
    paddingTop: 12,
    paddingBottom: 0,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  searchIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  searchPlaceholder: {
    fontSize: 14,
  },
  tabsRow: {
    maxHeight: 44,
  },
  tabsScroll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    paddingRight: 24,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 2,
  },
  tabActive: {},
  tabLabel: {
    fontSize: 14,
  },
  tabLabelActive: {
    fontWeight: "700",
  },
  tabUnderline: {
    position: "absolute",
    bottom: 0,
    left: "20%",
    right: "20%",
    height: 2,
    borderRadius: 1,
  },
});

export default MarketHeader;
