import React, { useMemo, useCallback } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View, Dimensions, ActivityIndicator } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import FastImage from "react-native-fast-image";
import { useDispatch } from "react-redux";

import { AppText, BOLD, Button, FOURTEEN, MEDIUM, SEMI_BOLD, TWELVE } from "../../shared";
import { coinActive, coinInActive, favCheck } from "../../helper/ImageAssets";
import { addToFavorites } from "../../actions/homeActions";
import { useAppSelector } from "../../store/hooks";
import MarketList from "./MarketList";
import { ADD_FAVOURITE_SCREEN, LOGIN_SCREEN, WALLET_SCREEN } from "../../navigation/routes";
import { NO_NOTIFICATION_ICON, NO_NOTIFICATION_ICON_LIGHT } from "../../helper/ImageAssets";
import NavigationService from "../../navigation/NavigationService";
import { colors } from "../../theme/colors";
import { toFixedFive, toFixedThree } from "../../helper/utility";
import { useTheme } from "../../hooks/useTheme";
import { IMAGE_BASE_URL } from "../../helper/Constants";

const Favourites = ({ style, from, coinPairs: propsCoinPairs, search: propsSearch = "", isLoggedIn = true, isSelectionModeForce = false, subCategory = "All" }) => {
  const dispatch = useDispatch();
  const { colors: themeColors, isDark } = useTheme();
  const theme = isDark ? "Dark" : "Light";
  const favoriteArray = useAppSelector((state) => state.home.favoriteArray);
  const favoriteArrayLoaded = useAppSelector((state) => state.home.favoriteArrayLoaded);
  const [processingId, setProcessingId] = React.useState(null);

  const [favouriteCoins, setFavouriteCoins] = React.useState(
    (!favoriteArray || favoriteArray?.length === 0) ? (coinPairs?.slice(0, 6)?.map((item) => item._id) || []) : favoriteArray
  );

  const handleUnselectCoin = (coinId) => {
    setFavouriteCoins((prev) => {
      if (prev.includes(coinId)) {
        return prev.filter((id) => id !== coinId);
      } else {
        return [...prev, coinId];
      }
    });
  };

  React.useEffect(() => {
    if (favoriteArray) {
      setFavouriteCoins(favoriteArray);
    }
  }, [favoriteArray]);

  const [stabilizedList, setStabilizedList] = React.useState([]);

  const isFocused = useIsFocused();

  React.useEffect(() => {
    if (isFocused) {
      setStabilizedList(displayData);
    }
  }, [isFocused, displayData]);

  React.useEffect(() => {
    // While on screen, only add new items, don't remove
    setStabilizedList((prev) => {
      const newItems = displayData.filter((item) => !prev.find((p) => p._id === item._id));
      if (newItems.length === 0) return prev;
      return [...prev, ...newItems];
    });
  }, [displayData]);

  const handleNavigate = (item) => {
    NavigationService.navigate(WALLET_SCREEN, { coinDetail: item });
  };

  const search = propsSearch || "";
  const coinPairs = propsCoinPairs || useAppSelector((state) => state.home.coinPairs);

  const filterPairData = useMemo(() => {
    let data = [...(coinPairs || [])];
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


  const renderFavoriteRow = useCallback(({ item, index }) => {
    const isSelected = favouriteCoins.includes(item._id);
    const sym = String(item?.base_currency || '').toUpperCase();
    const quote = String(item?.quote_currency || '').toUpperCase();
    const change = Number(item?.change_percentage) || 0;
    const isPositive = change >= 0;
    const pctStr = `${isPositive ? '+' : ''}${change.toFixed(2)}%`;
    const iconUri = item?.icon_path ? IMAGE_BASE_URL + item.icon_path : null;

    return (
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: theme === "Dark" ? "#1E2329" : "#F7F7F7",
            marginRight: index % 2 === 0 ? 5 : 0,
            marginLeft: index % 2 === 0 ? 0 : 5,
          }
        ]}
        onPress={() => handleUnselectCoin(item._id)}
        activeOpacity={0.8}
      >
        <View style={styles.cardTop}>
          <View style={styles.cardInfo}>
            {iconUri ? (
              <FastImage source={{ uri: iconUri }} style={styles.cardIcon} resizeMode="contain" />
            ) : (
              <View style={[styles.cardIcon, { backgroundColor: '#ddd', borderRadius: 10 }]} />
            )}
            <AppText weight={MEDIUM} style={[styles.cardSym, { color: themeColors.text }]}>
              {sym}<AppText style={{ color: '#9CA3AF', fontSize: 10 }}>/{quote}</AppText>
            </AppText>
          </View>
          {processingId === item._id ? (
            <ActivityIndicator size="small" color={isDark ? "#fff" : "#000"} />
          ) : isSelected ? (
            <FastImage
              source={favCheck}
              style={styles.cardCheck}
              resizeMode="contain"
            />
          ) : (
            <View style={[styles.cardCheckEmpty, { borderColor: isDark ? '#555' : '#D1D5DB' }]} />
          )}
        </View>
        <AppText
          weight={MEDIUM}
          style={[
            styles.cardPct,
            { color: isPositive ? colors.green : colors.red }
          ]}
        >
          {pctStr}
        </AppText>
      </TouchableOpacity>
    );
  }, [favouriteCoins, theme, themeColors, handleUnselectCoin]);



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


  const isSelectionMode = isSelectionModeForce || !favoriteArray || favoriteArray?.length === 0;

  if (isSelectionMode && !isSelectionModeForce && from !== "home") {
    return (
      <View style={styles.emptyContainer}>
        <FastImage
          source={isDark ? NO_NOTIFICATION_ICON : NO_NOTIFICATION_ICON_LIGHT}
          style={styles.emptyIcon}
          resizeMode="contain"
        />
        <AppText style={[styles.emptyText, { color: themeColors.secondaryText }]}>
          You haven't added any favorites yet.
        </AppText>
        <Button
          children="Add Favourites"
          containerStyle={styles.emptyBtn}
          onPress={() => NavigationService.navigate(ADD_FAVOURITE_SCREEN)}
        />
      </View>
    );
  }

  const displayData = isSelectionMode
    ? (from === "home" ? filterPairData?.slice(0, 6) : filterPairData)
    : (from === "home" ? favFilteredData?.slice(0, 6) : favFilteredData);

  // Use stabilized list for rendering to prevent items from disappearing
  const renderData = isSelectionMode ? displayData : stabilizedList;

  return (
    <View style={style}>
      <View style={{ paddingHorizontal: from === "home" ? 0 : 5, marginTop: from === "home" ? 0 : 15, }}>
        <FlatList
          data={(renderData || []).filter((item) => item?._id)}
          keyExtractor={(item) => item._id}
          renderItem={renderFavoriteRow}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          scrollEnabled={from !== "home" || isSelectionModeForce}
          contentContainerStyle={{ paddingBottom: from === "home" ? 0 : 20 }}
          ListFooterComponent={
            <View style={{ paddingBottom: from === "home" ? 0 : 20 }}>
              <Button
                children="Add Favourites"
                containerStyle={[
                  styles.mainBtn,
                  from === "home" && { marginTop: 10, marginBottom: 5 }
                ]}
                onPress={() => {
                  if (isSelectionModeForce) {
                    const added = favouriteCoins.filter(id => !favoriteArray.includes(id));
                    const removed = favoriteArray.filter(id => !favouriteCoins.includes(id));
                    const changes = [...added, ...removed];

                    if (changes.length === 0) {
                      NavigationService.navigate(MARKET_SCREEN);
                      return;
                    }

                    changes.forEach((id) => {
                      dispatch(addToFavorites({ pair_id: id }));
                    });

                    setTimeout(() => {
                      NavigationService.navigate(MARKET_SCREEN);
                    }, 500);
                  } else {
                    NavigationService.navigate(ADD_FAVOURITE_SCREEN);
                  }
                }}
              />
            </View>
          }
        />
      </View>
    </View>
  );
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default Favourites;

const styles = StyleSheet.create({
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 10,
  },
  card: {
    flex: 1,
    borderRadius: 8,
    padding: 8,
    minHeight: 64,
    justifyContent: "space-between",
    maxWidth: (SCREEN_WIDTH - 34) / 2,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardIcon: {
    width: 33,
    height: 33,
    borderRadius: 16.5,
    overflow: "hidden",
  },
  cardSym: {
    fontSize: 12,
  },
  cardCheck: {
    width: 12,
    height: 12,
  },
  cardCheckEmpty: {
    width: 12,
    height: 12,
    borderRadius: 4,
    borderWidth: 1
  },
  cardPct: {
    fontSize: 10,
    marginTop: 4,
  },
  mainBtn: {
    marginTop: 20,
    marginBottom: 12,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#2B2F36",
  },
  addOtherBtn: {
    alignSelf: "center",
    paddingVertical: 10,
  },
  addOtherText: {
    fontSize: 13,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
  emptyWrap: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 100,
    bottom: 50
  },
  emptyIcon: {
    width: 100,
    height: 100,
    marginBottom: 20,
    opacity: 0.8,
  },
  emptyText: {
    marginBottom: 30,
    textAlign: "center",
    fontSize: 14,
  },
  emptyBtn: {
    width: "60%",
    height: 45,
  },
});
