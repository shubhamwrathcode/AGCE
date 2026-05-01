import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  AppSafeAreaView,
  AppText,
  Button,
  EIGHTEEN,
  ELEVEN,
  Header,
  TWELVE,
  WHITE,
  YELLOW,
} from "../../shared";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  Linking,
  Alert,
  ImageBackground,
  View,
  StatusBar,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from "react-native";
import HomeSlider from "./HomeSlider";
import HomeSliderSkeleton from "./HomeSliderSkeleton";
import CoinSlider from "./CoinSlider";
import HomeMenuBar from "./HomeMenuBar";
import KeyBoardAware from "../../shared/components/KeyboardAware";
import { commonStyles } from "../../theme/commonStyles";
import CoinList from "./CoinList";
import CoinSliderSkeleton from "./CoinSliderSkeleton";
import CoinListSkeleton from "./CoinListSkeleton";
import {
  appBg,
  loginDarkBg,
  HomeBg,
  verificationImage,
  trade_btn,
  searchIcon,
} from "../../helper/ImageAssets";
import {
  getBannerList,
  getCoinList,
  getFavoriteArray,
  getFavorites,
  getNotificationList,
} from "../../actions/homeActions";
import {
  getAdminBankDetails,
  getTradeHistory,
  getUserArbitrageWallet,
  getUserEarningWallet,
  getUserFuturesWallet,
  getUserMainWallet,
  getUserOptionsWallet,
  getUserPortfolio,
  getUserSpotWallet,
  getUserSwapWallet,
  getUserWallet,
  getWalletHistory,
  getWalletType,
} from "../../actions/walletActions";
import { getVersion } from "react-native-device-info";
import { setLoading } from "../../slices/authSlice";
import HeaderTop from "../../shared/components/HeaderTop";
import FastImage from "react-native-fast-image";
import { KYC_STATUS_SCREEN, SEARCH_SCREEN, WALLET_SCREEN } from "../../navigation/routes";
import NavigationService from "../../navigation/NavigationService";
import { colors, lightTheme } from "../../theme/colors";
import { SocketContext } from "../../SocketProvider";

import { useTheme } from "../../hooks/useTheme";

const Home = () => {
  const dispatch = useAppDispatch();
  const { colors: themeColors, isDark } = useTheme();
  const theme = useAppSelector((state) => state.auth.theme);
  const loading = useAppSelector((state) => state.auth.isLoading);
  const coinPairs = useAppSelector((state) => state.home.coinPairs);
  const userData = useAppSelector((state) => state.auth.userData);
  const { kycVerified } = userData ?? "";
  const [CheckCurrent, setCheckCurrent] = useState(getVersion());

  const socketContextVars = useContext(SocketContext) || {};
  const { subscribeToMarket, unsubscribeFromMarket } = socketContextVars;

  // Subscribe to market as soon as Home mounts so data can start flowing immediately
  useEffect(() => {
    if (subscribeToMarket) subscribeToMarket();
  }, [subscribeToMarket]);

  useFocusEffect(
    useCallback(() => {
      dispatch(setLoading(false));
      if (subscribeToMarket) subscribeToMarket();
      return () => {
        if (unsubscribeFromMarket) unsubscribeFromMarket();
      };
    }, [dispatch, subscribeToMarket, unsubscribeFromMarket])
  );

  const hasMarketData = (coinPairs?.length ?? 0) > 0;
  const [sliderReady, setSliderReady] = useState(false);
  const showCoinSkeleton = !hasMarketData;

  useEffect(() => {
    const t = setTimeout(() => setSliderReady(true), 500);
    return () => clearTimeout(t);
  }, []);

  const fetchHomeData = useCallback(() => {
    dispatch(getCoinList());
    dispatch(getWalletType());
    dispatch(getUserWallet(""));
    dispatch(getUserMainWallet("main"));
    dispatch(getUserSpotWallet("spot"));
    dispatch(getUserSwapWallet("swap"));
    dispatch(getUserEarningWallet("earning"));
    dispatch(getUserArbitrageWallet("arbitrage"));
    dispatch(getUserFuturesWallet("futures"));
    dispatch(getUserOptionsWallet("options"));
    dispatch(getFavoriteArray());
    dispatch(getNotificationList());
  }, [dispatch]);

  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    console.log("Pull to refresh triggered! Fetching latest home data...");
    setRefreshing(true);
    fetchHomeData();
    setTimeout(() => {
      setRefreshing(false);
      console.log("Refresh Complete.");
    }, 1000);
  }, [fetchHomeData]);

  // useEffect(() => {
  //   console.log(CheckCurrent,userData?.version, "version");
  //   if(CheckCurrent != userData?.version) {
  //     // InstallAPK();
  //   }
  // }, [userData?.version]);


  return (
    <AppSafeAreaView style={{ backgroundColor: themeColors.background }}>
      <KeyBoardAware style={commonStyles.zeroPadding} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeColors.text} />}>
        <View>
          <HeaderTop />
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => NavigationService.navigate(SEARCH_SCREEN)}
            style={[
              styles.homeSearchBar,
              {
                backgroundColor: isDark ? themeColors.input : lightTheme.input,
                borderWidth: isDark ? StyleSheet.hairlineWidth : 0,
                borderColor: themeColors.border,
              },
            ]}
          >
            <FastImage
              source={searchIcon}
              style={styles.homeSearchIcon}
              resizeMode="contain"
              tintColor={themeColors.secondaryText}
            />
            <AppText
              numberOfLines={1}
              style={[styles.homeSearchPlaceholder, { color: themeColors.secondaryText }]}
            >
              🔥 Trade Smart. Grow Faster.
            </AppText>
          </TouchableOpacity>
        </View>

        {(kycVerified === 0 || kycVerified === 3) && (
        <View
          style={{
            backgroundColor: themeColors.card,
            marginHorizontal: 12,
            height: 160,
            padding: 10,
            borderRadius: 6,
            marginVertical: 10,
            borderWidth: 1,
            borderColor: themeColors.border,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginVertical: 10,
            }}
          >
            <FastImage
              source={verificationImage}
              style={{ width: 70, height: 70 }}
              resizeMode="contain"
            />
            <View style={{ width: "70%" }}>
              <AppText style={{ color: themeColors.button }} type={EIGHTEEN}>
                Verification
              </AppText>
              <AppText style={{ color: themeColors.secondaryText }} type={ELEVEN}>
                Verify your identity to secure your
                account and unlock deposit/trading
                access.
              </AppText>
            </View>
          </View>
          <Button
            onPress={() => NavigationService.navigate(KYC_STATUS_SCREEN)}
            children="Verify Now"
            containerStyle={{ width: "90%", height: 40, alignSelf: "center", backgroundColor: themeColors.button }}
          />
        </View>
        )}

        <View>
          <HomeMenuBar />
        </View>

        <View>
          {sliderReady ? <HomeSlider theme={theme} /> : <HomeSliderSkeleton />}
        </View>

        <View>
          {showCoinSkeleton ? <CoinSliderSkeleton /> : <CoinSlider />}
        </View>

        <View>
          {showCoinSkeleton ? <CoinListSkeleton /> : <CoinList />}
        </View>
      </KeyBoardAware>
    </AppSafeAreaView>
  );
};

const styles = StyleSheet.create({
  homeSearchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  homeSearchIcon: {
    width: 18,
    height: 18,
    marginRight: 10,
  },
  homeSearchPlaceholder: {
    flex: 1,
    fontSize: 14,
  },
});

export default Home;
