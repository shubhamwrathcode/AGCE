import React, { useState, useMemo } from "react";
import {
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions
} from "react-native";
import FastImage from "react-native-fast-image";
import { AppText, ELEVEN, FOURTEEN, SEMI_BOLD, TWELVE, MEDIUM, SIXTEEN, TWENTY } from "../../shared";
import { colors } from "../../theme/colors";
import { toFixedFive } from "../../helper/utility";
import { useTheme } from "../../hooks/useTheme";
import { IMAGE_BASE_URL } from "../../helper/Constants";
import { searchIcon, closeIcon, starIcon, starFillIcon, NO_NOTIFICATION_ICON } from "../../helper/ImageAssets";
import { useAppSelector } from "../../store/hooks";
import { useDispatch } from "react-redux";
import { addToFavorites } from "../../actions/homeActions";

const { width } = Dimensions.get("window");

const FuturePairList = ({
  pairs = [],
  selectedPair,
  onSelectPair,
  searchTerm = "",
  onSearchChange,
  onClose,
}) => {
  const { isDark, colors: themeColors } = useTheme();
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("USDT");

  const cardBg = themeColors.background;
  const inputBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
  const divider = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  const tabs = ["Favourites", "USDT", "BTC", "BNB", "ETH"];

  const handleSelect = (pair) => {
    if (typeof onSelectPair === "function") {
      onSelectPair(pair);
    }
  };

  const toggleFavorite = (item) => {
    if (!item || !item._id) return;
    dispatch(addToFavorites({ pair_id: item._id }));
  };

  const favoriteArray = useAppSelector((state) => state.home.favoriteArray);

  const filteredData = useMemo(() => {
    return pairs.filter(pair => {
      let tabMatch = false;
      if (activeTab === "Favourites") {
        tabMatch = favoriteArray?.includes(pair?._id);
      } else {
        tabMatch = (pair?.margin_asset || "").toLowerCase() === activeTab.toLowerCase() || 
                   (pair?.quote_asset || "").toLowerCase() === activeTab.toLowerCase() ||
                   (pair?.base_asset || "").toLowerCase() === activeTab.toLowerCase() ||
                   (pair?.short_name || "").toLowerCase() === activeTab.toLowerCase();
      }

      let searchMatch = true;
      if (searchTerm && searchTerm.trim() !== "") {
        const term = searchTerm.toLowerCase().trim();
        const symbol = (pair?.symbol || "").toLowerCase();
        const base = (pair?.base_asset || pair?.short_name || "").toLowerCase();
        const quote = (pair?.quote_asset || pair?.margin_asset || "").toLowerCase();
        searchMatch = symbol.includes(term) || base.includes(term) || quote.includes(term);
      }

      return tabMatch && searchMatch;
    });
  }, [pairs, activeTab, searchTerm, favoriteArray]);

  return (
    <View style={[styles.container, { backgroundColor: cardBg }]}>
      {/* Header */}
      <View style={styles.header}>
        <AppText type={TWENTY} weight={SEMI_BOLD} style={{ color: themeColors.text }}>
          Select Pair
        </AppText>

      </View>

      {/* Search Bar */}
      <View style={[styles.searchWrapper, { backgroundColor: inputBg, borderColor: divider }]}>
        <FastImage source={searchIcon} style={styles.searchIcon} tintColor={isDark ? "#6F6F6F" : "#9D9D9D"} />
        <TextInput
          value={searchTerm}
          onChangeText={onSearchChange}
          placeholder="Search"
          placeholderTextColor={isDark ? "#6F6F6F" : "#9D9D9D"}
          style={[styles.searchInput, { color: themeColors.text }]}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={styles.tabBtn}>
              <AppText
                type={FOURTEEN}
                weight={isActive ? SEMI_BOLD : MEDIUM}
                style={{ color: isActive ? themeColors.text : themeColors.secondaryText }}
              >
                {tab}
              </AppText>
              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Table Header */}
      <View style={styles.tableHeader}>
        <AppText type={TWELVE} style={{ color: themeColors.secondaryText, flex: 1 }}>Pair</AppText>
        <AppText type={TWELVE} style={{ color: themeColors.secondaryText, flex: 1, textAlign: 'right' }}>Price</AppText>
        <AppText type={TWELVE} style={{ color: themeColors.secondaryText, flex: 1, textAlign: 'right' }}>Change</AppText>
      </View>

      {/* List */}
      <FlatList
        data={filteredData}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item) => item?._id ?? `${item?.base_asset}-${item?.margin_asset}`}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <FastImage source={NO_NOTIFICATION_ICON} style={{ width: 70, height: 70, alignSelf: "center", marginTop: 50 }} resizeMode="contain" />

        }
        renderItem={({ item }) => {
          const changeVal = parseFloat(item?.change_percentage || 0);
          const isPositive = changeVal >= 0;
          const changeColor = isPositive ? colors.green : colors.red;
          const sign = isPositive ? "+" : "";
          const isFavorite = favoriteArray?.includes(item?._id);

          const iconUrl = item?.icon_path ? { uri: `${IMAGE_BASE_URL}${item.icon_path}` } : null;

          return (
            <TouchableOpacity activeOpacity={0.7} onPress={() => handleSelect(item)} style={styles.row}>
              {/* Pair Info */}
              <View style={[styles.cell, { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' }]}>
                <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={{ marginRight: 8 }} onPress={() => toggleFavorite(item)}>
                  <FastImage source={isFavorite ? starFillIcon : starIcon} style={styles.starIconLeft} tintColor={isFavorite ? colors.starColor : themeColors.secondaryText} />
                </TouchableOpacity>
                {iconUrl ? (
                  <FastImage source={iconUrl} style={styles.coinIcon} />
                ) : (
                  <View style={[styles.coinIcon, { backgroundColor: divider, borderRadius: 12 }]} />
                )}
                <View>
                  <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text }}>
                    {item?.base_asset || item?.short_name}
                    {item?.margin_asset ? `/${item?.margin_asset}` : ""}
                  </AppText>
                </View>
              </View>

              {/* Price Info */}
              <View style={[styles.cell, { alignItems: 'flex-end' }]}>
                <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text }}>
                  {toFixedFive(item?.last_price || item?.buy_price)}
                </AppText>
                <AppText type={ELEVEN} style={{ color: themeColors.secondaryText }}>
                  ${toFixedFive(item?.last_price || item?.buy_price)}
                </AppText>
              </View>

              {/* Change Info */}
              <View style={[styles.cell, { alignItems: 'flex-end', justifyContent: 'center' }]}>
                <AppText type={TWELVE} style={{ color: changeColor }}>
                  {sign}{changeVal}%
                </AppText>
                <AppText type={ELEVEN} style={{ color: themeColors.secondaryText }}>
                  {item?.price_change_24h || "0.00"}
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
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
  },
  searchIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: 40,
    paddingVertical: 0,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 16,
  },
  tabBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 4,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 20,
    height: 3,
    backgroundColor: '#F3BB2B',
    borderRadius: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  listContent: {
    paddingBottom: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  cell: {
    flex: 1,
  },
  coinIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  starIconLeft: {
    width: 14,
    height: 14,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default FuturePairList;
