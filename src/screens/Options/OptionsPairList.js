import React, { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import FastImage from "react-native-fast-image";
import { AppText, ELEVEN, FOURTEEN, SEMI_BOLD, MEDIUM } from "../../shared";
import { colors } from "../../theme/colors";
import { closeIcon, NO_NOTIFICATION_ICON, searchIcon } from "../../helper/ImageAssets";
import { IMAGE_BASE_URL } from '../../helper/Constants';
import { useTheme } from '../../hooks/useTheme';

const OptionsPairList = ({
  pairs = [],
  selectedPair,
  onSelectPair,
  searchTerm = "",
  onSearchChange,
  theme = "Dark",
  onClose,
}) => {
  const { colors: themeColors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState("USDT");

  const handleSelect = (pair) => {
    if (typeof onSelectPair === "function") {
      onSelectPair(pair);
    }
  };

  const formatNumber = (data, decimal = 2) => {
    const num = typeof data === "string" ? Number(data) : data;
    if (typeof num === "number" && !isNaN(num)) {
      return num.toLocaleString('en-US', { minimumFractionDigits: decimal, maximumFractionDigits: decimal });
    }
    return "0.00";
  };

  const filteredByTab = pairs.filter(p => p?.quote_currency?.toUpperCase() === activeTab);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: themeColors.background },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <AppText
          type={FOURTEEN}
          weight={SEMI_BOLD}
          style={[styles.title, { color: themeColors.text, fontSize: 18 }]}
        >
          Select Asset
        </AppText>

      </View>

      <View style={[styles.divider, { backgroundColor: themeColors.themeBorderColor || '#EAEAEA' }]} />

      {/* Search Bar */}
      <View
        style={[
          styles.searchWrapper,
          { backgroundColor: isDark ? colors.themeElevationColor : '#fff', borderWidth: 0 },
        ]}
      >
        <FastImage source={searchIcon} style={{ width: 16, height: 16, marginRight: 8 }} tintColor={themeColors.secondaryText} resizeMode="contain" />
        <TextInput
          value={searchTerm}
          onChangeText={onSearchChange}
          placeholder="Search"
          placeholderTextColor={themeColors.secondaryText}
          cursorColor={isDark ? colors.white : colors.black}
          style={[
            styles.searchInput,
            { color: themeColors.text },
          ]}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {["USDT", "USDC"].map((tab) => (
          <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={styles.tabItem}>
            <AppText
              style={{
                fontFamily: SEMI_BOLD,
                fontSize: 15,
                color: activeTab === tab ? themeColors.text : themeColors.secondaryText
              }}
            >
              {tab}
            </AppText>
            {activeTab === tab && <View style={[styles.activeIndicator,
            { backgroundColor: themeColors.text }]} />}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.columnsHeader}>
        <AppText style={[styles.columnText, { flex: 1, textAlign: 'left', color: themeColors.secondaryText }]}>Pair</AppText>
        <AppText style={[styles.columnText, { flex: 1.5, textAlign: 'right', color: themeColors.secondaryText }]}>Price</AppText>
        <AppText style={[styles.columnText, { flex: 1, textAlign: 'right', color: themeColors.secondaryText }]}>Change</AppText>
      </View>

      <FlatList
        data={filteredByTab}
        keyExtractor={(item) =>
          item?._id ?? `${item?.base_currency}-${item?.quote_currency}`
        }
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <FastImage source={NO_NOTIFICATION_ICON} style={{ width: 70, height: 70 }} resizeMode='contain' />
          </View>
        }
        renderItem={({ item }) => {
          const isSelected =
            selectedPair?.base_currency === item?.base_currency &&
            selectedPair?.quote_currency === item?.quote_currency;

          return (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleSelect(item)}
              style={[
                styles.row,
                {
                  backgroundColor: isSelected
                    ? (isDark ? "#2A2A2E" : "#F7F7F7")
                    : "transparent",
                },
              ]}
            >
              {/* Pair Info */}
              <View style={[styles.cell, { flex: 1, flexDirection: 'row', alignItems: 'center' }]}>
                {item?.iconPath ? (
                  <FastImage source={{ uri: item.iconPath }} style={styles.coinIcon} resizeMode="contain" />
                ) : (
                  <View style={[styles.coinIcon, { backgroundColor: '#E0E0E0', borderRadius: 12 }]} />
                )}
                <View style={{ marginLeft: 8 }}>
                  <AppText
                    weight={SEMI_BOLD}
                    style={{ color: themeColors.text, fontSize: 15 }}
                  >
                    {item?.base_currency}/{item?.quote_currency}
                  </AppText>
                  <AppText
                    weight={MEDIUM}
                    style={{ color: themeColors.secondaryText, fontSize: 13, marginTop: 2 }}
                  >
                    {item?.base_currency}
                  </AppText>
                </View>
              </View>

              {/* Price Info */}
              <View style={[styles.cell, { flex: 1.5, alignItems: 'flex-end', justifyContent: 'center' }]}>
                <AppText
                  weight={SEMI_BOLD}
                  style={{ color: themeColors.text, fontSize: 14 }}
                >
                  {formatNumber(item?.price)}
                </AppText>
                <AppText style={{ color: themeColors.secondaryText, fontSize: 12, marginTop: 2 }}>
                  ${formatNumber(item?.price)}
                </AppText>
              </View>

              {/* Change Info */}
              <View style={[styles.cell, { flex: 1, alignItems: 'flex-end', justifyContent: 'center' }]}>
                <AppText style={{ color: themeColors.secondaryText, fontSize: 14 }}>
                  —
                </AppText>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    textAlign: "left",
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    width: '100%',
    marginBottom: 16,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  searchInput: {
    fontSize: 15,
    flex: 1,
    padding: 0,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 20,
  },
  tabItem: {
    paddingBottom: 6,
    position: 'relative',
    alignItems: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 20,
    height: 3,
    borderRadius: 1.5,
  },
  columnsHeader: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  columnText: {
    fontSize: 12,
    color: '#9D9D9D',
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  cell: {
    justifyContent: 'center',
  },
  coinIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default OptionsPairList;
