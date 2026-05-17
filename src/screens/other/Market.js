import { StyleSheet, View, Dimensions, Animated, RefreshControl } from "react-native";
import { AppSafeAreaView } from "../../shared";
import KeyBoardAware from "../../shared/components/KeyboardAware";
import MarketHeader from "./MarketHeader";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import Favourites from "./Favourites";
import SpotMarket from "./SpotMarket";
import FuturesMarket from "./FuturesMarket";
import CryptosMarket from "./CryptosMarket";
import AlphaMarket from "./AlphaMarket";
import MarketList from "./MarketList";
import MarketPlaceholder from "./MarketPlaceholder";
import { useAppSelector } from "../../store/hooks";
import { useDispatch } from "react-redux";
import { universalPaddingHorizontal } from "../../theme/dimens";
import { useRoute, useIsFocused } from "@react-navigation/native";
import { SocketContext } from "../../SocketProvider";
import { getFavoriteArray, addToFavorites } from "../../actions/homeActions";
import NavigationService from "../../navigation/NavigationService";
import { TRADE_SCREEN, WALLET_SCREEN } from "../../navigation/routes";
import MarketSkeleton from "./MarketSkeleton";
import { futureSocketService } from "../../services/socket/FutureSocketService";
import { setFuturesPairs } from "../../slices/homeSlice";
import { colors } from "../../theme/colors";
import { useTheme } from "../../hooks/useTheme";

const SIDE_SPACE = 20;
const HOT_BASE_ORDER = ["BTC", "ETH", "BNB", "SOL", "XRP", "DOGE", "MATIC"];
const SHIMMER_STRIP = 120;

// Reusable shimmer box shared by TabListSkeleton
const ShimmerCell = ({ width: w, height, borderRadius = 5, style }) => {
  const { colors: themeColors } = useTheme();
  const shimmerX = useRef(new Animated.Value(-SHIMMER_STRIP)).current;
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    const run = () => {
      if (!mounted.current) return;
      shimmerX.setValue(-SHIMMER_STRIP);
      Animated.timing(shimmerX, {
        toValue: Math.max(w, 1) + SHIMMER_STRIP,
        duration: 1100,
        useNativeDriver: true,
      }).start(({ finished }) => { if (mounted.current && finished) run(); });
    };
    const t = setTimeout(run, 50);
    return () => { mounted.current = false; clearTimeout(t); shimmerX.stopAnimation(); };
  }, [shimmerX, w]);
  return (
    <Animated.View
      style={[{
        width: w, height, borderRadius, overflow: "hidden",
        backgroundColor: themeColors.card,
      }, style]}
    >
      <Animated.View
        pointerEvents="none"
        style={[{
          position: "absolute", top: 0, bottom: 0,
          width: SHIMMER_STRIP, left: 0,
          transform: [{ translateX: shimmerX }],
          backgroundColor: "transparent",
        }]}
      />
    </Animated.View>
  );
};

// Skeleton that mimics MarketList row layout (icon + name/vol + price + pill)
const TabListSkeleton = ({ rows = 8 }) => {
  const { colors: themeColors } = useTheme();
  return (
    <Animated.View style={{ paddingHorizontal: SIDE_SPACE, paddingTop: 8 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <Animated.View
          key={i}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingVertical: 12,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: themeColors.border,
          }}
        >
          {/* left: icon + name/vol */}
          <Animated.View style={{ flexDirection: "row", alignItems: "center", flex: 1, gap: 8 }}>
            <ShimmerCell width={28} height={28} borderRadius={14} />
            <Animated.View style={{ gap: 4 }}>
              <ShimmerCell width={52} height={12} />
              <ShimmerCell width={38} height={10} />
            </Animated.View>
          </Animated.View>
          {/* centre: price */}
          <ShimmerCell width={56} height={12} style={{ marginHorizontal: 8 }} />
          {/* right: % pill */}
          <ShimmerCell width={64} height={24} borderRadius={6} />
        </Animated.View>
      ))}
    </Animated.View>
  );
};

const Market = () => {
  const { colors: themeColors } = useTheme();
  const route = useRoute();
  const isFocused = useIsFocused();
  const socketContextVars = useContext(SocketContext) || {};
  const { subscribeToMarket, unsubscribeFromMarket } = socketContextVars;
  const coinPairs = useAppSelector((state) => state.home.coinPairs);
  const hotPairsChart = useAppSelector((state) => state.home.hotPairsChart) ?? {};
  const futuresPairs = useAppSelector((state) => state.home.futuresPairs ?? []);
  const userData = useAppSelector((state) => state.auth.userData);
  const isLoggedIn = useAppSelector((state) => state.auth.isLoggedIn);
  const favoriteArray = useAppSelector((state) => state.home.favoriteArray);
  const dispatch = useDispatch();

  const [activeTab, setActiveTab] = useState("Spot");
  const [spotSubCategory, setSpotSubCategory] = useState("All");
  const [alphaSubTab, setAlphaSubTab] = useState("ALL_CHAIN");
  const TAB_KEYS = useMemo(
    () => ["Favorites", "Spot", "Cryptos", "USD_M_FUTURES", "COIN_M_FUTURES", "OPTIONS", "ALPHA"],
    []
  );
  const activeTabIndex = useMemo(() => Math.max(0, TAB_KEYS.indexOf(activeTab)), [TAB_KEYS, activeTab]);
  const prevTabIndexRef = useRef(activeTabIndex);

  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const contentSlideX = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const prev = prevTabIndexRef.current;
    const next = activeTabIndex;
    const dir = next > prev ? 1 : -1;
    prevTabIndexRef.current = next;

    contentSlideX.setValue(dir * 24);
    contentOpacity.setValue(0.6);
    Animated.parallel([
      Animated.timing(contentSlideX, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(contentOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
  }, [activeTabIndex, contentOpacity, contentSlideX]);

  const onRefresh = useCallback(() => {
    console.log("Pull to refresh triggered! Fetching latest market data...");
    setRefreshing(true);
    if (isLoggedIn) {
      dispatch(getFavoriteArray());
    }
    if (subscribeToMarket) {
      if (unsubscribeFromMarket) unsubscribeFromMarket();
      subscribeToMarket();
    }
    if (activeTab === "USD_M_FUTURES" && futureSocketService.getIsConnected()) {
      futureSocketService.emit("message", { message: "futures", userId: userData?._id ?? "" });
    }
    setTimeout(() => {
      setRefreshing(false);
      console.log("Refresh Complete.");
    }, 1000);
  }, [isLoggedIn, dispatch, subscribeToMarket, unsubscribeFromMarket, activeTab, userData?._id]);

  useEffect(() => {
    if (route?.params?.tab) {
      const t = route.params.tab;
      if (["Favorites", "Spot", "Cryptos", "USD_M_FUTURES", "COIN_M_FUTURES", "OPTIONS", "ALPHA"].includes(t)) setActiveTab(t);
      else if (t === "Favourite") setActiveTab("Favorites");
      else if (t === "Futures") setActiveTab("USD_M_FUTURES");
      else if (t === "Alpha") setActiveTab("ALPHA");
    }
  }, [route?.params?.tab]);

  useEffect(() => {
    if (isLoggedIn) dispatch(getFavoriteArray());
  }, [isLoggedIn, dispatch]);

  // Subscribe to market data only when Market screen is focused
  useEffect(() => {
    if (isFocused) {
      if (subscribeToMarket) subscribeToMarket();
    } else {
      if (unsubscribeFromMarket) unsubscribeFromMarket();
    }
  }, [isFocused, subscribeToMarket, unsubscribeFromMarket]);

  // Fallback: if market:update didn't send futures_pairs, request from futures socket (same as Futures trading screen)
  useEffect(() => {
    if (activeTab !== "USD_M_FUTURES" || (futuresPairs && futuresPairs.length > 0)) return;

    futureSocketService.connect();
    const payload = { message: "futures", userId: userData?._id ?? "" };

    const requestFutures = () => {
      futureSocketService.emit("message", payload);
    };
    if (futureSocketService.getIsConnected()) {
      requestFutures();
    } else {
      futureSocketService.onConnect(requestFutures);
    }

    const handleMessage = (data) => {
      const list = data?.pairs ?? data?.futures_pairs ?? data?.futuresPairs;
      if (Array.isArray(list) && list.length > 0) {
        dispatch(setFuturesPairs(list));
      }
    };
    futureSocketService.on("message", handleMessage);

    return () => {
      futureSocketService.off("message", handleMessage);
      futureSocketService.offConnect(requestFutures);
    };
  }, [activeTab, dispatch, userData?._id, futuresPairs?.length]);

  const showSearch = true;

  const showSubTabs = activeTab === "Spot" || activeTab === "Cryptos" || activeTab === "ALPHA";

  const alphaSubTabs = useMemo(
    () => [
      { key: "ALL_CHAIN", label: "All Chain" },
      { key: "PUMP", label: "Pump" },
      { key: "TOP_SEARCHES", label: "Top Searches" },
      { key: "NEW", label: "New" },
      { key: "THEMES", label: "Themes" },
    ],
    []
  );

  const spotSubCategories = useMemo(() => {
    const list = Array.isArray(coinPairs) ? coinPairs : [];
    if (!list.length) return [];
    const s = new Set();
    for (const p of list) {
      const sc = p?.sub_category;
      if (sc != null && String(sc).trim() !== "") s.add(String(sc).trim());
    }
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [coinPairs]);

  useEffect(() => {
    if (spotSubCategory !== "All" && !spotSubCategories.includes(spotSubCategory)) {
      setSpotSubCategory("All");
    }
  }, [spotSubCategory, spotSubCategories]);

  const [carouselIndex, setCarouselIndex] = useState(0);
  const hasMarketData = (coinPairs?.length ?? 0) > 0;
  const contentLoading = !hasMarketData;

  // Preferred coins only: BTC, ETH, BNB (3 cards)
  const featuredCoins = useMemo(() => {
    if (!coinPairs || coinPairs.length === 0) return [];
    const preferred = ["BTC", "ETH", "BNB"];
    const out = [];
    for (const sym of preferred) {
      const found = coinPairs.find(
        (p) => p?.base_currency?.toUpperCase() === sym && p?.quote_currency?.toUpperCase() === "USDT"
      );
      if (found) {
        out.push({
          ...found,
          chart_data: hotPairsChart[sym] ?? [],
        });
      }
    }
    return out;
  }, [coinPairs, hotPairsChart]);



  return (
    <AppSafeAreaView style={{ backgroundColor: colors.white }}>
      <KeyBoardAware refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeColors.text} />}>
        {/* Featured cards – Carousel (same as Home CoinSlider) */}
        <MarketHeader
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          search={search}
          onSearchChange={setSearch}
          showSearch={showSearch}
          showSubTabs={showSubTabs}
          subTabItems={activeTab === "ALPHA" ? alphaSubTabs : undefined}
          subCategories={activeTab === "ALPHA" ? [] : spotSubCategories}
          activeSubCategory={activeTab === "ALPHA" ? alphaSubTab : spotSubCategory}
          onSubCategoryChange={activeTab === "ALPHA" ? setAlphaSubTab : setSpotSubCategory}
        />
        {/* {featuredCoins?.length > 0 && (
          <View style={styles.carouselWrap}>
            <Carousel
              loop
              width={ITEM_WIDTH}
              height={150}
              autoPlay
              data={featuredCoins}
              scrollAnimationDuration={1000}
              onSnapToItem={(index) => setCarouselIndex(index)}
              renderItem={({ item, index }) => (
                <View style={styles.cardWrapper}>
                  <MarketFeaturedCard data={item} chartData={item?.chart_data} chartId={`market-${index}`} onPress={handleFeaturedPress} />
                </View>
              )}
              mode="parallax"
              modeConfig={{
                parallaxScrollingScale: 1,
                parallaxScrollingOffset: 0,
              }}
              panGestureHandlerProps={{
                activeOffsetX: [-10, 10],
              }}
              style={styles.carousel}
            />
            <View style={styles.dotContainer}>
              {featuredCoins.map((_, index) => (
                <CustomDots key={index} index={index} activeIndex={carouselIndex} />
              ))}
            </View>
          </View>
        )} */}
        {contentLoading ? (
          <MarketSkeleton />
        ) : (
          <>


            <Animated.View style={{ flex: 1, transform: [{ translateX: contentSlideX }], opacity: contentOpacity }}>
              {activeTab === "Favorites" && (
                <View style={styles.tabContent}>
                  {!hasMarketData ? (
                    <TabListSkeleton rows={7} />
                  ) : favoriteArray?.length > 0 ? (
                    <MarketList
                      filterData={coinPairs.filter(p => favoriteArray.includes(p._id))}
                      onPress={(item) => NavigationService.navigate(TRADE_SCREEN, { coinDetail: item })}
                      onToggleFavorite={(id) => dispatch(addToFavorites({ pair_id: id }))}
                      favoriteArray={favoriteArray}
                      hideStar={false}
                    />
                  ) : (
                    <Favourites
                      coinPairs={coinPairs}
                      onPress={(item) => NavigationService.navigate(TRADE_SCREEN, { coinDetail: item })}
                      from="home"
                    />
                  )}
                </View>
              )}
              {activeTab === "Spot" && (
                <View style={styles.tabContent}>
                  {!hasMarketData ? <TabListSkeleton rows={8} /> : <SpotMarket coinPairs={coinPairs} search={search} subCategory={spotSubCategory} hideStar={false} favoriteArray={favoriteArray} onToggleFavorite={(id) => dispatch(addToFavorites({ pair_id: id }))} />}
                </View>
              )}
              {activeTab === "Cryptos" && (
                <View style={styles.tabContent}>
                  {!hasMarketData ? <TabListSkeleton rows={8} /> : <CryptosMarket coinPairs={coinPairs} search={search} subCategory={spotSubCategory} hideStar={false} favoriteArray={favoriteArray} onToggleFavorite={(id) => dispatch(addToFavorites({ pair_id: id }))} />}
                </View>
              )}
              {activeTab === "USD_M_FUTURES" && (
                <View style={styles.tabContent}>
                  {futuresPairs.length === 0 ? (
                    <MarketPlaceholder message="No futures data at the moment." />
                  ) : (
                    <FuturesMarket search={search} />
                  )}
                </View>
              )}

              {activeTab === "COIN_M_FUTURES" && (
                <View style={styles.tabContent}>
                  <MarketPlaceholder message="COIN-M futures markets are not available yet." />
                </View>
              )}

              {activeTab === "OPTIONS" && (
                <View style={styles.tabContent}>
                  <MarketPlaceholder message="Options markets are not available yet." />
                </View>
              )}

              {activeTab === "ALPHA" && (
                <View style={styles.tabContent}>
                  {!hasMarketData ? <TabListSkeleton rows={8} /> : <AlphaMarket coinPairs={coinPairs} search={search} hideStar={false} favoriteArray={favoriteArray} onToggleFavorite={(id) => dispatch(addToFavorites({ pair_id: id }))} />}
                </View>
              )}
            </Animated.View>
          </>
        )}
      </KeyBoardAware>
    </AppSafeAreaView>
  );
};

const styles = StyleSheet.create({
  carouselWrap: {
    paddingHorizontal: SIDE_SPACE,
    marginTop: 10,
    marginBottom: 4,
  },
  carousel: { width: "100%" },
  cardWrapper: { marginHorizontal: 5 },
  dotContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: universalPaddingHorizontal,
    marginTop: 4,
    minHeight: 0,
  },
});

export default Market;
