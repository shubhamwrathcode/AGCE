import React, { useMemo, useCallback } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import FastImage from "react-native-fast-image";
import { useDispatch } from "react-redux";

import { AppText, Button, FOURTEEN, TWELVE } from "../../shared";
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

  const renderFavoriteRow = useCallback(({ item }) => {
    const isSelected = favouriteCoins.includes(item._id);

    return (
      <TouchableOpacity
        style={[styles.row, { borderColor: theme !== "Dark" ? "#eee" : "#595959" }]}
        onPress={() => handleUnselectCoin(item._id)}
        activeOpacity={0.7}
      >
        <View style={{ width: "50%" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <FastImage
              source={isSelected ? coinActive : coinInActive}
              resizeMode="contain"
              style={{ width: 16, height: 16 }}
            />
            <AppText style={[theme !== 'Dark' ? styles.cell : styles.cellDark]}>
              {item?.base_currency}
              <Text style={{ fontWeight: "400", color: "#9D9D9D", fontSize: 12 }}>
                /{item?.quote_currency}
              </Text>
            </AppText>
          </View>
          <Text style={styles.vol}>{toFixedThree(item?.volume)}</Text>
        </View>

        <View style={{ flex: 1, width: "50%", alignItems: "flex-end" }}>
          <Text style={[theme !== 'Dark' ? styles.cell : styles.cellDark, { fontSize: 12, fontWeight: "bold" }]}>
            {toFixedFive(item.buy_price)}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: item?.change_percentage < 0 ? colors.red : colors.green,
            }}
          >
            {item?.change_percentage > 0 && '+'}{toFixedFive(item?.change_percentage)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }, [favouriteCoins, theme, handleUnselectCoin]);

  const ListHeaderComponent = useMemo(() => (
    <View style={styles.tableHeader}>
      <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>Pairs/Vol</Text>
      <Text style={[styles.tableHeaderText]}>
        Price / 24h Change
      </Text>
    </View>
  ), []);

  if (!isLoggedIn) {
    return (
      <View style={[style, styles.emptyWrap]}>
        <AppText type={FOURTEEN} style={{ color: colors.disabledText, textAlign: "center" }}>
          No results.... Go to{" "}
          <AppText
            type={FOURTEEN}
            weight="bold"
            color={colors.buttonBg}
            onPress={() => NavigationService.navigate(LOGIN_SCREEN)}
          >
            Sign in
          </AppText>
          {" "}and add your favorite coins from Spot.
        </AppText>
      </View>
    );
  }

  // Removed the !favoriteArrayLoaded check so that the Favourites list or empty state shows instantly without a loading skeleton delay

  return (
    <View style={style}>
      {(!favoriteArray || favoriteArray?.length === 0) ? (
        <>
          <View style={from === "home" ? { padding: 0 } : { padding: 16 }}>
            <FlatList
              data={(filterPairData?.slice(0, 5) || []).filter((item) => item?._id)}
              keyExtractor={(item) => item._id}
              renderItem={renderFavoriteRow}
              ListHeaderComponent={ListHeaderComponent}
              scrollEnabled={false}
            />
          </View>
          <Button
            children="+ Add to Favourites"
            containerStyle={{ marginVertical: 12 }}
            disabled={favouriteCoins.length === 0}
            onPress={() => {
              favouriteCoins.forEach((id) => {
                dispatch(addToFavorites({ pair_id: id }));
              });
            }}
          />
        </>
      ) : (
        <MarketList
          filterData={from === "home" ? favFilteredData?.slice(0, 5) : favFilteredData}
          style={from === "home" ? { width: "100%", padding: 0 } : { flex: 1, width: "100%", paddingVertical: 8, paddingHorizontal: 12 }}
          onPress={handleNavigate}
          scrollEnabled={from !== "home"}
        />
      )}
    </View>
  );
};

export default Favourites;

const styles = StyleSheet.create({
  tableHeader: {
    flexDirection: "row",
    borderColor: "#ccc",
    paddingBottom: 6,
    marginBottom: 6,
  },
  tableHeaderText: {
    fontWeight: "bold",
    color: "#9D9D9D",
    fontSize: 12,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    justifyContent: "space-between",
    minHeight: 46,
  },
  cell: {
    fontSize: 12,
    color: "#000",
    fontWeight: "700",
  },
  cellDark: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "700",
  },
  vol: {
    fontSize: 13,
    color: "#9D9D9D",
    marginLeft: 20,
    marginTop: 2,
  },
  emptyWrap: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
});
