/* eslint-disable react-native/no-inline-styles */
import React, { useMemo, useState, useCallback } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { colors } from "../../theme/colors";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { universalPaddingHorizontal } from "../../theme/dimens";
import HomeCoinTabs from "./HomeCoinTabs";
import { useAppSelector } from "../../store/hooks";
import Favourites from "../other/Favourites";
import MarketList from "../other/MarketList";
import { FuturesList } from "../other/FuturesMarket";
import HomeCoinList from "./HomeCoinList";
import NavigationService from "../../navigation/NavigationService";
import { WALLET_SCREEN, MARKET_SCREEN, FUTURES_SCREEN } from "../../navigation/routes";
import TouchableOpacityView from "../../shared/components/TouchableOpacityView";
import FastImage from "react-native-fast-image";
import { AppText } from "../../shared";
import { back_ic } from "../../helper/ImageAssets";
import { useDispatch } from "react-redux";
import { setBuyOrders, setSellOrders, setSpotSelectedPair, setFuturesSelectedPair } from "../../slices/homeSlice";
import { useTheme } from "../../hooks/useTheme";

const CoinList = React.memo(() => {
  const { colors: themeColors } = useTheme();
  const coinPairs = useAppSelector((state) => state.home.coinPairs);
  const futuresPairs = useAppSelector((state) => state.home.futuresPairs ?? []);
  const theme = useAppSelector((state) => state.auth.theme);
  const dispatch = useDispatch();
  const [activeTabList, setActiveTabList] = useState(1);

  const handleTabChange = useCallback((tab) => {
    setActiveTabList(tab);
  }, []);

  // 0=Favourite, 1=Spot, 2=Gainer, 3=Loser, 4=Futures
  const filterData = useMemo(() => {
    if (activeTabList === 4) return [];
    if (!coinPairs || coinPairs.length === 0) return [];

    if (activeTabList === 2) {
      return [...coinPairs]
        .sort((a, b) => Number(b?.change_percentage) - Number(a?.change_percentage));
    }
    if (activeTabList === 3) {
      return [...coinPairs]
        .sort((a, b) => Number(a?.change_percentage) - Number(b?.change_percentage));
    }
    return [...coinPairs];
  }, [coinPairs, activeTabList]);

  const fourItems = useMemo(
    () => (Array.isArray(filterData) ? filterData.slice(0, 5) : []),
    [filterData]
  );

  const futuresFive = useMemo(
    () => (Array.isArray(futuresPairs) ? futuresPairs.slice(0, 5) : []),
    [futuresPairs]
  );

  const handleNavigate = useCallback((item) => {
    // Pre-set the selected pair and clear old order book in Redux BEFORE navigating.
    // This prevents the race condition where Spot's useFocusEffect re-subscribes
    // to the old pair's socket during the async gap before route.params takes effect.
    dispatch(setSpotSelectedPair(item));
    dispatch(setBuyOrders([]));
    dispatch(setSellOrders([]));
    NavigationService.navigate(WALLET_SCREEN, { coinDetail: item });
  }, [dispatch]);

  const handleViewMore = useCallback(() => {
    const tab =
      activeTabList === 0
        ? "Favourite"
        : activeTabList === 1
          ? "Spots"
          : activeTabList === 2 || activeTabList === 3
            ? "Discover"
            : activeTabList === 4
              ? "Futures"
              : "";
    NavigationService.navigate(MARKET_SCREEN, { tab });
  }, [activeTabList]);

  const handleFuturesNavigate = useCallback((item) => {
    // Pre-set the selected pair in Redux BEFORE navigating.
    // Same pattern as Spot: prevents the async gap where the old pair
    // would still be restored from Redux when Futures screen focuses.
    dispatch(setFuturesSelectedPair(item));
    NavigationService.navigate(FUTURES_SCREEN, { pair: item });
  }, [dispatch]);

  return (
    <Animated.View
      entering={FadeIn.duration(600)}
      style={[styles.container, { marginBottom: 50 }]}
    >
      {/* Single elevated card: Tabs + 4 items list (no scroll) + View More */}
      <View style={[styles.elevatedCard, { backgroundColor: themeColors.card }]}>
        <Animated.View entering={FadeInDown.duration(400)}>
          <HomeCoinTabs activeTab={activeTabList} setActiveTab={handleTabChange} />
        </Animated.View>

        <View style={styles.listWrap}>
          {activeTabList === 0 ? (
            <Favourites
              coinPairs={filterData}
              onPress={handleNavigate}
              from="home"
            />
          ) : activeTabList === 4 ? (
            <FuturesList
              data={futuresFive}
              onPress={handleFuturesNavigate}
              theme={theme}
            />
          ) : (
            <MarketList
              filterData={fourItems}
              style={styles.marketListFixed}
              onPress={handleNavigate}
              scrollEnabled={false}
            />
          )}
        </View>

        <TouchableOpacityView
          style={styles.viewMoreRow}
          onPress={handleViewMore}
          activeOpacity={0.7}
        >
          <AppText style={[styles.viewMoreText, { color: themeColors.secondaryText }]}>
            View More{" "}
          </AppText>
          <FastImage
            source={back_ic}
            resizeMode="contain"
            style={styles.viewMoreArrow}
            tintColor={themeColors.text}
          />
        </TouchableOpacityView>
      </View>

      <Animated.View entering={FadeIn.duration(600).delay(200)}>
        <HomeCoinList activeTabList={activeTabList} hideViewMore />
      </Animated.View>
    </Animated.View>
  );
});

CoinList.displayName = "CoinList";

const HOME_HORIZONTAL_PADDING = 12;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: HOME_HORIZONTAL_PADDING,
    paddingVertical: universalPaddingHorizontal,
  },
  elevatedCard: {
    borderRadius: 12,
    padding: 10,
    ...Platform.select({
      android: { elevation: 1.5 },
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
    }),
  },
  listWrap: {
    marginTop: 6,
    minHeight: 275, // Stabilize height to prevent the "felta hua" shadow expansion artifact on load
  },
  marketListFixed: {
    width: "100%",
    padding: 0,
  },
  viewMoreRow: {
    flexDirection: "row",
    alignSelf: "center",
    alignItems: "center",
  },
  viewMoreText: {
    fontSize: 13,
  },
  viewMoreArrow: {
    width: 8,
    height: 8,
    transform: [{ rotateX: "360deg" }, { rotateZ: "180deg" }],
  },
});

export default CoinList;
