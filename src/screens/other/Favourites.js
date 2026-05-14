import React, { useMemo, useCallback } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import FastImage from "react-native-fast-image";
import { useDispatch } from "react-redux";

import { AppText, BOLD, Button, FOURTEEN, SEMI_BOLD, TWELVE } from "../../shared";
import { coinActive, coinInActive } from "../../helper/ImageAssets";
import { addToFavorites } from "../../actions/homeActions";
import { useAppSelector } from "../../store/hooks";
import MarketList from "./MarketList";
import { WALLET_SCREEN, LOGIN_SCREEN } from "../../navigation/routes";
import NavigationService from "../../navigation/NavigationService";
import { colors } from "../../theme/colors";
import { toFixedFive, toFixedThree } from "../../helper/utility";

const Favourites = ({ coinPairs, style, from, search = "", isLoggedIn = true, subCategory = "All" }) => {
  const dispatch = useDispatch();
  const theme = useAppSelector((state) => state.auth.theme);
  const favoriteArray = useAppSelector((state) => state.home.favoriteArray);
  const favoriteArrayLoaded = useAppSelector((state) => state.home.favoriteArrayLoaded);

  const [favouriteCoins, setFavouriteCoins] = React.useState(
    (!favoriteArray || favoriteArray?.length === 0) ? (coinPairs?.slice(0, 6)?.map((item) => item._id) || []) : favoriteArray
  );

  const handleUnselectCoin = (coinId) => {
    if (favouriteCoins.includes(coinId)) {
      setFavouriteCoins(favouriteCoins.filter((id) => id !== coinId));
    } else {
      setFavouriteCoins([...favouriteCoins, coinId]);
    }
  };

  const handleNavigate = (item) => {
    NavigationService.navigate(WALLET_SCREEN, { coinDetail: item });
  };

  const filterPairData = useMemo(() => {
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
    return data;
  }, [coinPairs, search, subCategory]);

  const favFilteredData = useMemo(() => {
    if (!isLoggedIn || !favoriteArray?.length) return [];
    return filterPairData.filter((item) => favoriteArray.includes(item?._id));
  }, [isLoggedIn, favoriteArray, filterPairData]);

  const homeTabTypo = from === "home";

  const renderFavoriteRow = useCallback(({ item }) => {
    const isSelected = favouriteCoins.includes(item._id);
    const cellStyle = theme !== "Dark" ? styles.cell : styles.cellDark;
    const pairBaseStyle = homeTabTypo
      ? theme !== "Dark"
        ? styles.cellHomeTab
        : styles.cellHomeTabDark
      : cellStyle;
    const quoteSize = homeTabTypo ? 10 : 12;
    const priceSize = homeTabTypo ? 13 : 12;
    const chgSize = homeTabTypo ? 11 : 12;

    return (
      <TouchableOpacity
        style={[styles.row, { borderBottomColor: theme !== "Dark" ? "#F3F4F6" : "#2A2E39", borderBottomWidth: 1 }]}
        onPress={() => handleUnselectCoin(item._id)}
        activeOpacity={0.7}
      >
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
          <FastImage
            source={isSelected ? coinActive : coinInActive}
            resizeMode="contain"
            style={{ width: 20, height: 20, marginRight: 12 }}
          />
          <View>
            <AppText weight={SEMI_BOLD} style={[pairBaseStyle, { fontSize: 13 }]}>
              {item?.base_currency_fullname || item?.base_currency_name || item?.base_currency}
            </AppText>
            <AppText style={styles.vol}>
              {item?.base_currency}
            </AppText>
          </View>
        </View>

        <View style={{ alignItems: "flex-end" }}>
          <AppText weight="bold" style={[cellStyle, { fontSize: priceSize }]}>
            {toFixedFive(item.buy_price)}
          </AppText>
          <AppText
            weight="medium"
            style={{
              fontSize: chgSize,
              marginTop: 2,
              color: item?.change_percentage < 0 ? colors.red : colors.green,
            }}
          >
            {item?.change_percentage > 0 && '+'}{toFixedThree(item?.change_percentage)}%
          </AppText>
        </View>
      </TouchableOpacity>
    );
  }, [favouriteCoins, theme, handleUnselectCoin, homeTabTypo]);

  const ListHeaderComponent = useMemo(
    () => (
      <View style={styles.tableHeader}>
        <AppText style={[styles.tableHeaderText, homeTabTypo && styles.tableHeaderTextHomeTab, { flex: 1 }]}>
          Pairs/Vol
        </AppText>
        <AppText style={[styles.tableHeaderText, homeTabTypo && styles.tableHeaderTextHomeTab, { textAlign: 'right' }]}>Price / 24h Change</AppText>
      </View>
    ),
    [homeTabTypo]
  );

  if (!isLoggedIn) {
    return (
      <View style={[style, styles.emptyWrap]}>
        <AppText type={FOURTEEN} style={{ color: colors.disabledText, textAlign: "center", lineHeight: 22 }}>
          No results found. Please{" "}
          <AppText
            type={FOURTEEN}
            weight="bold"
            style={{ color: colors.buttonBg }}
            onPress={() => NavigationService.navigate(LOGIN_SCREEN)}
          >
            Sign in
          </AppText>
          {" "}to manage and view your favorite coins from Spot.
        </AppText>
      </View>
    );
  }

  // Removed the !favoriteArrayLoaded check so that the Favourites list or empty state shows instantly without a loading skeleton delay

  return (
    <View style={style}>
      {(!favoriteArray || favoriteArray?.length === 0) ? (
        <View style={{ paddingHorizontal: from === "home" ? 4 : 16 }}>
          <FlatList
            data={(filterPairData?.slice(0, 5) || []).filter((item) => item?._id)}
            keyExtractor={(item) => item._id}
            renderItem={renderFavoriteRow}
            ListHeaderComponent={ListHeaderComponent}
            scrollEnabled={false}
            contentContainerStyle={{ paddingBottom: 10 }}
          />
          <Button
            children="+ Add to Favourites"
            containerStyle={{ marginVertical: 16, height: 50, borderRadius: 25 }}
            disabled={favouriteCoins.length === 0}
            onPress={() => {
              favouriteCoins.forEach((id) => {
                dispatch(addToFavorites({ pair_id: id }));
              });
            }}
          />
        </View>
      ) : (
        <MarketList
          filterData={from === "home" ? favFilteredData?.slice(0, 5) : favFilteredData}
          style={from === "home" ? { width: "100%", padding: 0 } : { flex: 1, width: "100%", paddingVertical: 8, paddingHorizontal: 12 }}
          onPress={handleNavigate}
          scrollEnabled={from !== "home"}
          pairTypography={from === "home" ? "homeTab" : undefined}
          hideStar={from === "home" ? false : false}
        />
      )}
    </View>
  );
};

export default Favourites;

const styles = StyleSheet.create({
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 0,
    paddingHorizontal: 5
  },
  tableHeaderText: {
    color: "#9CA3AF",
    fontSize: 11,
    fontWeight: "500",
  },
  tableHeaderTextHomeTab: {
    fontSize: 11,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 12,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 5
  },
  cell: {
    fontSize: 13,
    color: "#000",
  },
  cellDark: {
    fontSize: 13,
    color: "#fff",
  },
  cellHomeTab: {
    fontSize: 13,
    color: "#000",
  },
  cellHomeTabDark: {
    fontSize: 13,
    color: "#fff",
  },
  vol: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
  },
  emptyWrap: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
});
