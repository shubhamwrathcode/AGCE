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

const SpotMarket = ({ coinPairs, search = "", subCategory = "All" }) => {
  const { colors: themeColors } = useTheme();
  const [spotQuoteCurrency, setSpotQuoteCurrency] = useState("USDT");

  const filterData = useMemo(() => {
    if (!coinPairs || !Array.isArray(coinPairs)) return [];
    let data = [...coinPairs];
    if (subCategory && subCategory !== "All") {
      data = data.filter((item) => String(item?.sub_category ?? "").trim() === String(subCategory).trim());
    }
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
    return data;
  }, [coinPairs, search, spotQuoteCurrency, subCategory]);

  const handleNavigate = (item) => {
    NavigationService.navigate(WALLET_SCREEN, { coinDetail: item });
  };

  const chipBg = (selected) => (selected ? themeColors.card : "transparent");
  const chipTextColor = (selected) => (selected ? themeColors.text : themeColors.secondaryText);
  const chipBorder = (selected) => (selected ? themeColors.border : "transparent");

  return (
    <View style={styles.container}>
      {/* Quote Currency */}
      {/* <ScrollView
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
      </ScrollView> */}

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
