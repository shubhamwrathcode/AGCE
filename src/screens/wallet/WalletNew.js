import {
  Alert,
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  View,
  RefreshControl,
} from "react-native";
import {
  AppSafeAreaView,
  AppText,
  BLACK,
  DISCLAIMTEXT,
  FIFTEEN,
  FOURTEEN,
  SEMI_BOLD,
} from "../../shared";
import KeyBoardAware from "../../shared/components/KeyboardAware";
import WalletHeader from "./WalletHeader";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  appBg,
  loginDarkBg,
  back_ic,
  eye_close_icon,
  eye_open_icon,
  linkIcon,
  externalLinkIcon,
} from "../../helper/ImageAssets";
import FastImage from "react-native-fast-image";
import { colors } from "../../theme/colors";
import WalletMenu from "./WalletMenu";
import WalletList from "./WalletList";
import NavigationService from "../../navigation/NavigationService";
import { useDispatch } from "react-redux";
import {
  getUserArbitrageWallet,
  getUserEarningWallet,
  getUserFuturesWallet,
  getUserMainWallet,
  getUserOptionsWallet,
  getAllWalletsPortfolio,
  getUserPortfolioArbitrage,
  getUserPortfolioEarning,
  getUserPortfolioFutures,
  getUserPortfolioMain,
  getUserPortfolioOptions,
  getUserPortfolioSpot,
  getUserPortfolioSwap,
  getUserSpotWallet,
  getUserSwapWallet,
  getUserWallet,
} from "../../actions/walletActions";
import { useAppSelector } from "../../store/hooks";
import { getUserBankDetails } from "../../actions/accountActions";
import { toFixedFive } from "../../helper/utility";
import { CURRENCY_PREFERENCE_SCREEN, DEPOSIT_COIN_SCREEN, WALLET_WITHDRAW_SCREEN } from "../../navigation/routes";
import WalletSkeleton from "./WalletSkeleton";
import RBSheet from "react-native-raw-bottom-sheet";
import DepositSheet from "../../shared/components/DepositSheet";
import WithdrawSheet from "../../shared/components/WithdrawSheet";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../../hooks/useTheme";

const WalletNew = () => {
  const dispatch = useDispatch();
  const depsoitSheet = useRef(null);
  const withdrawSheet = useRef(null);
  const { colors: themeColors, theme, isDark } = useTheme();
  const userData = useAppSelector((state) => state.auth.userData);
  const walletBalance = useAppSelector((state) => {
    return state.wallet.walletBalance;
  });
  const walletBalanceMain = useAppSelector((state) => {
    return state.wallet.walletBalanceMain;
  });
  const walletBalanceSpot = useAppSelector((state) => {
    return state.wallet.walletBalanceSpot;
  });
  const walletBalanceSwap = useAppSelector((state) => {
    return state.wallet.walletBalanceSwap;
  });
  const walletBalanceEarning = useAppSelector((state) => {
    return state.wallet.walletBalanceEarning;
  });
  const walletBalanceArbitrage = useAppSelector((state) => {
    return state.wallet.walletBalanceArbitrage;
  });
  const walletBalanceFutures = useAppSelector((state) => {
    return state.wallet.walletBalanceFutures;
  });
  const walletBalanceOptions = useAppSelector((state) => {
    return state.wallet.walletBalanceOptions;
  });
  const userWallet = useAppSelector((state) => {
    return state.wallet.userWallet;
  });
  const userMainWallet = useAppSelector((state) => {
    return state.wallet.userMainWallet;
  });
  const userSpotWallet = useAppSelector((state) => {
    return state.wallet.userSpotWallet;
  });
  const userSwapWallet = useAppSelector((state) => {
    return state.wallet.userSwapWallet;
  });
  const userEarningWallet = useAppSelector((state) => {
    return state.wallet.userEarningWallet;
  });
  const userArbitrageWallet = useAppSelector((state) => {
    return state.wallet.userArbitrageWallet;
  });
  const userFuturesWallet = useAppSelector((state) => {
    return state.wallet.userFuturesWallet;
  });
  const userOptionsWallet = useAppSelector((state) => {
    return state.wallet.userOptionsWallet;
  });
  const [activeTab, setActiveTab] = useState("Overview");
  const [showBalance, setShowBalance] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);

  const currentBalance = useMemo(() => {
    switch (activeTab) {
      case "Overview": return walletBalance;
      case "Main": return walletBalanceMain;
      case "Spot": return walletBalanceSpot;
      case "Swap": return walletBalanceSwap;
      case "Earning": return walletBalanceEarning;
      case "Futures": return walletBalanceFutures;
      // case "Options": return walletBalanceOptions;
      default: return walletBalanceArbitrage;
    }
  }, [activeTab, walletBalance, walletBalanceMain, walletBalanceSpot, walletBalanceSwap, walletBalanceEarning, walletBalanceFutures, walletBalanceOptions, walletBalanceArbitrage]);

  const isBalanceLoaded = useMemo(() => {
    const b = currentBalance;
    return b != null && typeof b === "object" && (b?.currencyPrice !== undefined || b?.Currency !== undefined);
  }, [currentBalance]);

  const handleSheetOpen = () => {
    depsoitSheet.current?.open();
  };
  const handleWSheetOpen = () => {
    withdrawSheet.current?.open();
  };

  const noGlobalLoader = useMemo(() => ({ useGlobalLoader: false }), []);
  const [refreshing, setRefreshing] = useState(false);
  const isFirstLoad = useRef(true);

  const fetchWalletData = useCallback(() => {
    dispatch(getAllWalletsPortfolio(noGlobalLoader));
    dispatch(getUserPortfolioMain("main", noGlobalLoader));
    dispatch(getUserPortfolioSpot("spot", noGlobalLoader));
    dispatch(getUserPortfolioSwap("swap", noGlobalLoader));
    dispatch(getUserPortfolioEarning("earning", noGlobalLoader));
    dispatch(getUserPortfolioArbitrage("arbitrage", noGlobalLoader));
    dispatch(getUserPortfolioFutures("futures", noGlobalLoader));
    dispatch(getUserPortfolioOptions("options", noGlobalLoader));
    dispatch(getUserWallet(""));
    dispatch(getUserMainWallet("main"));
    dispatch(getUserSpotWallet("spot"));
    dispatch(getUserSwapWallet("swap"));
    dispatch(getUserEarningWallet("earning"));
    dispatch(getUserArbitrageWallet("arbitrage"));
    dispatch(getUserFuturesWallet("futures"));
    dispatch(getUserOptionsWallet("options"));
  }, [dispatch, noGlobalLoader]);

  useFocusEffect(
    useCallback(() => {
      if (isFirstLoad.current) {
        setContentLoading(true);
        fetchWalletData();
        const t = setTimeout(() => setContentLoading(false), 300);
        isFirstLoad.current = false;
        return () => clearTimeout(t);
      }
    }, [fetchWalletData])
  );

  const onRefresh = useCallback(() => {
    console.log("Pull to refresh triggered! Fetching latest data...");
    setRefreshing(true);
    fetchWalletData();
    setTimeout(() => {
      setRefreshing(false);
      console.log("Refresh Complete.");
    }, 1000); // Give 1s for refresh UI experience
  }, [fetchWalletData]);

  return (
    <AppSafeAreaView style={{ backgroundColor: themeColors.background }}>
      <KeyBoardAware refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeColors.text} />}>
        <WalletHeader
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          theme={theme}
        />
        {contentLoading ? (
          <WalletSkeleton />
        ) : (
          <>
            <View style={{ marginVertical: 20, paddingHorizontal: 20 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <AppText weight={SEMI_BOLD}>
                  {activeTab === "Overview"
                    ? "Total Equity"
                    : activeTab === "Main"
                      ? "Estimated Main Wallet Assets"
                      : activeTab === "Spot"
                        ? "Estimated Spot Wallet Assets"
                        : activeTab === "Swap"
                          ? "Estimated Swap Wallet Assets"
                          : activeTab === "Earning"
                            ? "Estimated Earning Wallet"
                            :
                            activeTab === "Futures"
                              ? "Estimated Futures Wallet Assets"
                              : activeTab === "Options"
                                ? "Estimated Options Wallet Assets"
                                :
                                ""}
                </AppText>

                <TouchableOpacity onPress={() => setShowBalance(!showBalance)}>
                  <FastImage
                    source={showBalance ? eye_close_icon : eye_open_icon}
                    resizeMode="contain"
                    style={{ width: 20, height: 20 }}
                    tintColor={
                      theme !== "Dark"
                        ? colors.disclaimText
                        : colors.disclaimDarText
                    }
                  />
                </TouchableOpacity>
              </View>
              <View style={{ marginTop: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}>
                  <AppText type={FIFTEEN} weight={SEMI_BOLD}>
                    {!showBalance
                      ? "********"
                      : !isBalanceLoaded
                        ? "..."
                        : toFixedFive(
                          activeTab === "Overview"
                            ? walletBalance?.currencyPrice
                            : activeTab === "Main"
                              ? walletBalanceMain?.currencyPrice
                              : activeTab === "Spot"
                                ? walletBalanceSpot?.currencyPrice
                                : activeTab === "Swap"
                                  ? walletBalanceSwap?.currencyPrice
                                  : activeTab === "Earning"
                                    ? walletBalanceEarning?.currencyPrice
                                    : activeTab === "Futures"
                                      ? walletBalanceFutures?.currencyPrice
                                      : activeTab === "Options"
                                        ? walletBalanceOptions?.currencyPrice
                                        : walletBalanceArbitrage?.currencyPrice
                        )}{" "}
                  </AppText>
                  <TouchableOpacity
                    onPress={() =>
                      NavigationService.navigate(CURRENCY_PREFERENCE_SCREEN)
                    }
                    style={{ flexDirection: "row", alignItems: "center" }}
                  >
                    <AppText color={DISCLAIMTEXT}>
                      {isBalanceLoaded ? (walletBalance?.Currency || "") : "..."}{" "}
                    </AppText>
                    <FastImage
                      source={externalLinkIcon}
                      resizeMode="contain"
                      style={{ width: 10, height: 10 }}
                      tintColor={theme === "Dark" ? colors.white : colors.black}
                    />
                  </TouchableOpacity>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
                  <AppText type={FIFTEEN} weight={SEMI_BOLD}>
                    {!showBalance
                      ? "********"
                      : !isBalanceLoaded
                        ? "..."
                        : toFixedFive(
                          activeTab === "Overview"
                            ? walletBalance?.dollarPrice || 0
                            : activeTab === "Main"
                              ? walletBalanceMain?.dollarPrice || 0
                              : activeTab === "Spot"
                                ? walletBalanceSpot?.dollarPrice || 0
                                : activeTab === "Swap"
                                  ? walletBalanceSwap?.dollarPrice || 0
                                  : activeTab === "Earning"
                                    ? walletBalanceEarning?.dollarPrice || 0
                                    : activeTab === "Futures"
                                      ? walletBalanceFutures?.dollarPrice || 0
                                      : activeTab === "Options"
                                        ? walletBalanceOptions?.dollarPrice || 0
                                        : 0
                        )}{" "}
                  </AppText>
                  <AppText color={DISCLAIMTEXT}>USDT</AppText>
                </View>
              </View>
            </View>
            <WalletMenu
              theme={theme}
              onDeposit={() => {
                NavigationService.navigate(DEPOSIT_COIN_SCREEN)
              }}
              onWithdraw={() => {
                NavigationService.navigate(WALLET_WITHDRAW_SCREEN)
              }}
            />
            <View style={{ marginVertical: 20, paddingHorizontal: 20 }}>
              {activeTab === "Overview" && (
                <>
                  <AppText weight={SEMI_BOLD} type={FIFTEEN}>
                    Portfolio
                  </AppText>
                  <View style={{ marginTop: 10 }}>
                    <TouchableOpacity
                      style={{
                        flexDirection: "row",
                        borderWidth: 1,
                        borderColor: themeColors.border,
                        borderRadius: 10,
                        padding: 15,
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: 10,
                        backgroundColor: themeColors.themeElevationColor,
                      }}
                      onPress={() => setActiveTab("Main")}
                    >
                      <View>
                        <AppText
                          style={{
                            color: theme !== "Dark" ? "#404040" : "#A8A7A7",
                            fontWeight: SEMI_BOLD,
                            marginBottom: 5,
                          }}
                          type={FOURTEEN}
                        >
                          Main Wallet
                        </AppText>

                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 5,
                          }}
                        >
                          <AppText weight={SEMI_BOLD} type={FOURTEEN}>
                            {toFixedFive(walletBalanceMain?.currencyPrice) || 0}
                          </AppText>
                          <AppText>{walletBalance?.Currency}</AppText>
                        </View>
                      </View>
                      <FastImage
                        source={back_ic}
                        resizeMode="contain"
                        style={{
                          width: 20,
                          height: 20,
                          transform: [{ rotateX: "180deg" }, { rotateZ: "3.2rad" }],
                        }}
                        tintColor={theme !== "Dark" ? colors.black : colors.white}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        flexDirection: "row",
                        borderWidth: 1,
                        borderColor: themeColors.border,
                        borderRadius: 10,
                        padding: 15,
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: 10,
                        backgroundColor: themeColors.themeElevationColor,
                      }}
                      onPress={() => setActiveTab("Spot")}
                    >
                      <View>
                        <AppText
                          style={{
                            color: theme !== "Dark" ? "#404040" : "#A8A7A7",
                            fontWeight: SEMI_BOLD,
                            marginBottom: 5,
                          }}
                          type={FOURTEEN}
                        >
                          Spot Wallet
                        </AppText>

                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 5,
                          }}
                        >
                          <AppText weight={SEMI_BOLD} type={FOURTEEN}>
                            {toFixedFive(walletBalanceSpot?.currencyPrice) || 0}
                          </AppText>
                          <AppText>{walletBalance?.Currency}</AppText>
                        </View>
                      </View>
                      <FastImage
                        source={back_ic}
                        resizeMode="contain"
                        style={{
                          width: 20,
                          height: 20,
                          transform: [{ rotateX: "180deg" }, { rotateZ: "3.2rad" }],
                        }}
                        tintColor={theme !== "Dark" ? colors.black : colors.white}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={{
                        flexDirection: "row",
                        borderWidth: 1,
                        borderColor: themeColors.border,
                        borderRadius: 10,
                        padding: 15,
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: 10,
                        backgroundColor: themeColors.themeElevationColor,
                      }}
                      onPress={() => setActiveTab("Earning")}
                    >
                      <View>
                        <AppText
                          style={{
                            color: theme !== "Dark" ? "#404040" : "#A8A7A7",
                            fontWeight: SEMI_BOLD,
                            marginBottom: 5,
                          }}
                          type={FOURTEEN}
                        >
                          Earning Wallet
                        </AppText>

                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 5,
                          }}
                        >
                          <AppText weight={SEMI_BOLD} type={FOURTEEN}>
                            {toFixedFive(walletBalanceEarning?.currencyPrice) || 0}
                          </AppText>
                          <AppText>{walletBalance?.Currency}</AppText>
                        </View>
                      </View>
                      <FastImage
                        source={back_ic}
                        resizeMode="contain"
                        style={{
                          width: 20,
                          height: 20,
                          transform: [{ rotateX: "180deg" }, { rotateZ: "3.2rad" }],
                        }}
                        tintColor={theme !== "Dark" ? colors.black : colors.white}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        flexDirection: "row",
                        borderWidth: 1,
                        borderColor: themeColors.border,
                        borderRadius: 10,
                        padding: 15,
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: 10,
                        backgroundColor: themeColors.themeElevationColor,
                      }}
                      onPress={() => setActiveTab("Futures")}
                    >
                      <View>
                        <AppText
                          style={{
                            color: theme !== "Dark" ? "#404040" : "#A8A7A7",
                            fontWeight: SEMI_BOLD,
                            marginBottom: 5,
                          }}
                          type={FOURTEEN}
                        >
                          Futures Wallet
                        </AppText>

                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 5,
                          }}
                        >
                          <AppText weight={SEMI_BOLD} type={FOURTEEN}>
                            {toFixedFive(walletBalanceFutures?.currencyPrice) || 0}
                          </AppText>
                          <AppText>{walletBalance?.Currency}</AppText>
                        </View>
                      </View>
                      <FastImage
                        source={back_ic}
                        resizeMode="contain"
                        style={{
                          width: 20,
                          height: 20,
                          transform: [{ rotateX: "180deg" }, { rotateZ: "3.2rad" }],
                        }}
                        tintColor={theme !== "Dark" ? colors.black : colors.white}
                      />
                    </TouchableOpacity>

                  </View>
                </>
              )}

              <WalletList
                userWallet={
                  activeTab === "Overview"
                    ? userWallet
                    : activeTab === "Main"
                      ? userMainWallet
                      : activeTab === "Spot"
                        ? userSpotWallet
                        : activeTab === "Swap"
                          ? userSwapWallet
                          : activeTab === "Earning"
                            ? userEarningWallet
                            : activeTab === "Futures"
                              ? userFuturesWallet
                              : // activeTab === "Options" ? userOptionsWallet
                              ""
                }
                onSheetOpen={handleSheetOpen}
                theme={theme}
              />
            </View>
          </>
        )}
        {/* </ImageBackground> */}
      </KeyBoardAware>
      <RBSheet
        ref={depsoitSheet}
        closeOnDragDown={true}
        closeOnPressMask={true}
        height={250}
        animationType="none"
        customStyles={{
          container: {
            backgroundColor: themeColors.background,
            height: 250,
            borderTopRightRadius: 40,
            borderTopLeftRadius: 40,
          },
          wrapper: {
            backgroundColor: "#0006",
          },
          draggableIcon: {
            backgroundColor: "transparent",
          },
        }}
      >
        <DepositSheet theme={theme} />
      </RBSheet>
      <RBSheet
        ref={withdrawSheet}
        closeOnDragDown={true}
        closeOnPressMask={true}
        height={260}
        animationType="fade"
        customStyles={{
          container: {
            backgroundColor: themeColors.background,
            height: 250,
            borderTopRightRadius: 40,
            borderTopLeftRadius: 40,
          },
          wrapper: {
            backgroundColor: "#0006",
          },
          draggableIcon: {
            backgroundColor: "transparent",
          },
        }}
      >
        <WithdrawSheet theme={theme} />
      </RBSheet>
    </AppSafeAreaView>
  );
};

export default WalletNew;
