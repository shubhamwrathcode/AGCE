import { AppText, ELEVEN, SEMI_BOLD } from "../../shared";
import { StyleSheet, TouchableOpacity, View, ScrollView } from "react-native";
import { useMemo, useState } from "react";
import FastImage from "react-native-fast-image";
import MarketList from "./MarketList";
import { useAppSelector } from "../../store/hooks";
import NavigationService from "../../navigation/NavigationService";
import { WALLET_SCREEN } from "../../navigation/routes";
import { colors } from "../../theme/colors";
import { Coin, tetherIcon, bitcoinIcon, bnbIcon } from "../../helper/ImageAssets";
import { useTheme } from "../../hooks/useTheme";

const QUOTE_OPTIONS = [
  { key: "All", label: "All", icon: Coin },
  { key: "USDT", label: "USDT", icon: tetherIcon },
  { key: "BTC", label: "BTC", icon: bitcoinIcon },
  { key: "ETH", label: "ETH", icon: Coin },
  { key: "BNB", label: "BNB", icon: bnbIcon },
];
const TYPE_OPTIONS = [
  { key: "All", label: "All" },
  { key: "Gainers", label: "Gainers" },
  { key: "Losers", label: "Losers" },
  { key: "Trending", label: "Trending" },
];

const SpotMarket = ({ coinPairs, search = "" }) => {
  const { colors: themeColors } = useTheme();
  const [spotQuoteCurrency, setSpotQuoteCurrency] = useState("USDT");
  const [spotFilterType, setSpotFilterType] = useState("All");

  const filterData = useMemo(() => {
    if (!coinPairs || !Array.isArray(coinPairs)) return [];
    let data = [...coinPairs];
    if (search) {
      const s = search.toLowerCase();
      data = data.filter(
        (item) =>
          item?.base_currency?.toLowerCase()?.includes(s) ||
          item?.quote_currency?.toLowerCase()?.includes(s)
      );
    }
    if (spotQuoteCurrency !== "All") {
      data = data.filter(
        (item) =>
          item?.quote_currency?.toUpperCase() === spotQuoteCurrency ||
          item?.base_currency?.toUpperCase() === spotQuoteCurrency
      );
    }
    if (spotFilterType === "Gainers") {
      data = data
        .filter((item) => Number(item?.change_percentage) > 0)
        .sort((a, b) => Number(b?.change_percentage) - Number(a?.change_percentage));
    } else if (spotFilterType === "Losers") {
      data = data
        .filter((item) => Number(item?.change_percentage) < 0)
        .sort((a, b) => Number(a?.change_percentage) - Number(b?.change_percentage));
    } else if (spotFilterType === "Trending") {
      data = data.sort((a, b) => Number(b?.volume) - Number(a?.volume));
    }
    return data;
  }, [coinPairs, search, spotQuoteCurrency, spotFilterType]);

  const handleNavigate = (item) => {
    NavigationService.navigate(WALLET_SCREEN, { coinDetail: item });
  };

  const chipBg = (selected) => (selected ? themeColors.card : "transparent");
  const chipTextColor = (selected) => (selected ? themeColors.text : themeColors.secondaryText);
  const chipBorder = (selected) => (selected ? themeColors.border : "transparent");

  return (
    <View style={styles.container}>
      {/* Row 1: Filter Type */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.filterScroll, styles.filterScrollType]}
        style={styles.filterRow}
      >
        {TYPE_OPTIONS.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            onPress={() => setSpotFilterType(key)}
            style={[
              styles.chip, 
              { 
                backgroundColor: chipBg(spotFilterType === key),
                borderColor: chipBorder(spotFilterType === key),
                borderWidth: 1
              }
            ]}
            activeOpacity={0.8}
          >
            <AppText type={ELEVEN} weight={SEMI_BOLD} style={{ color: chipTextColor(spotFilterType === key) }}>
              {label}
            </AppText>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Row 2: Quote Currency */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.filterScroll, styles.filterScrollType]}
        style={styles.filterRow}
      >
        {QUOTE_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            onPress={() => setSpotQuoteCurrency(opt.key)}
            style={[
              styles.chip, 
              styles.chipWithIcon, 
              { 
                backgroundColor: chipBg(spotQuoteCurrency === opt.key),
                borderColor: chipBorder(spotQuoteCurrency === opt.key),
                borderWidth: 1
              }
            ]}
            activeOpacity={0.8}
          >
            {opt.key !== "All" && (
              <FastImage
                source={opt.icon}
                resizeMode="contain"
                style={styles.chipIcon}
              />
            )}
            <AppText type={ELEVEN} weight={SEMI_BOLD} style={{ color: chipTextColor(spotQuoteCurrency === opt.key) }}>
              {opt.label}
            </AppText>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <MarketList filterData={filterData} onPress={handleNavigate} />
    </View>
  );
};

export default SpotMarket;

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 0, marginTop: 4, paddingBottom: 12 },
  filterRow: { marginBottom: 4, maxHeight: 36 },
  filterScroll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 2,
  },
  filterScrollType: {
    gap: 3,
    paddingHorizontal: 12,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  chipWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  chipIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
});
