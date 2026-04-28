import { StyleSheet, View, Dimensions, Animated, RefreshControl } from "react-native";
import { AppSafeAreaView } from "../../shared";
import KeyBoardAware from "../../shared/components/KeyboardAware";
import MarketHeader from "./MarketHeader";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import Favourites from "./Favourites";
import SpotMarket from "./SpotMarket";
import FuturesMarket from "./FuturesMarket";
import DiscoverMarket from "./DiscoverMarket";
import Memex from "./Memex";
import { useAppSelector } from "../../store/hooks";
import { useDispatch } from "react-redux";
import { universalPaddingHorizontal } from "../../theme/dimens";
import { useRoute, useIsFocused } from "@react-navigation/native";
import { SocketContext } from "../../SocketProvider";
import { getFavoriteArray } from "../../actions/homeActions";
import NavigationService from "../../navigation/NavigationService";
import { WALLET_SCREEN } from "../../navigation/routes";
import Carousel from "react-native-reanimated-carousel";
import MarketFeaturedCard from "./MarketFeaturedCard";
import CustomDots from "../home/CustomDots";
import MarketSkeleton from "./MarketSkeleton";
import { futureSocketService } from "../../services/socket/FutureSocketService";
import { setFuturesPairs } from "../../slices/homeSlice";
import { colors } from "../../theme/colors";
import { useTheme } from "../../hooks/useTheme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const H_PAD = universalPaddingHorizontal;
const ITEM_WIDTH = SCREEN_WIDTH / 2 - 22;
const SIDE_SPACE = 20;
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
  const dispatch = useDispatch();
  const socketContextVars = useContext(SocketContext) || {};
  const { subscribeToMarket, unsubscribeFromMarket } = socketContextVars;
  const coinPairs = useAppSelector((state) => state.home.coinPairs);
  const hotPairsChart = useAppSelector((state) => state.home.hotPairsChart) ?? {};
  const futuresPairs = useAppSelector((state) => state.home.futuresPairs ?? []);
  const userData = useAppSelector((state) => state.auth.userData);
  const isLoggedIn = !!userData;

  const [activeTab, setActiveTab] = useState("Spot");
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

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
    if (activeTab === "Futures" && futureSocketService.getIsConnected()) {
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
      if (["Favourite", "Spot", "Futures", "Discover", "MemeX"].includes(t)) setActiveTab(t);
      else if (t === "Spots") setActiveTab("Spot");
      else if (t === "memex") setActiveTab("MemeX");
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
    if (activeTab !== "Futures" || (futuresPairs && futuresPairs.length > 0)) return;

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

  const showSearch = activeTab === "Favourite" || activeTab === "Spot" || activeTab === "Futures";

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

  const handleFeaturedPress = useCallback((item) => {
    if (item?.base_currency && item?.quote_currency) {
      NavigationService.navigate(WALLET_SCREEN, { coinDetail: item });
    }
  }, []);

  return (
    <AppSafeAreaView style={{ backgroundColor: themeColors.background }}>
      <KeyBoardAware refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeColors.text} />}>
        <MarketHeader
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          search={search}
          onSearchChange={setSearch}
          showSearch={showSearch}
        />
        {contentLoading ? (
          <MarketSkeleton />
        ) : (
          <>
            {/* Featured cards – Carousel (same as Home CoinSlider) */}
            {featuredCoins.length > 0 && (activeTab === "Spot" || activeTab === "Favourite" || activeTab === "Futures") && (
              <View style={styles.carouselWrap}>
                <Carousel
                  loop
                  width={ITEM_WIDTH}
                  height={230}
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
            )}

            {activeTab === "Favourite" && (
              <View style={styles.tabContent}>
                {!hasMarketData
                  ? <TabListSkeleton rows={7} />
                  : <Favourites coinPairs={coinPairs} search={search} isLoggedIn={isLoggedIn} />}
              </View>
            )}
            {activeTab === "Spot" && (
              <View style={styles.tabContent}>
                {!hasMarketData ? <TabListSkeleton rows={8} /> : <SpotMarket coinPairs={coinPairs} search={search} />}
              </View>
            )}
            {activeTab === "Futures" && (
              <View style={styles.tabContent}>
                {futuresPairs.length === 0 ? <TabListSkeleton rows={8} /> : <FuturesMarket search={search} />}
              </View>
            )}
            {activeTab === "Discover" && (
              !hasMarketData ? <TabListSkeleton rows={8} /> : <DiscoverMarket coinPairs={coinPairs} />
            )}
            {activeTab === "MemeX" && <Memex />}
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
