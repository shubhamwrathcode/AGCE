import {
  Alert,
  FlatList,
  ImageBackground,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  RefreshControl,
  useWindowDimensions,
} from "react-native";
import {
  AppSafeAreaView,
  AppText,
  BLACK,
  DISCLAIMTEXT,
  EIGHTEEN,
  FIFTEEN,
  FOURTEEN,
  SEMI_BOLD,
  TWELVE,
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
  checkIc,
  NO_NOTIFICATION_ICON,
  shareIcon,
  share_ic,
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
import { CURRENCY_PREFERENCE_SCREEN, DEPOSIT_COIN_SCREEN, TRANSFER_SCREEN, WALLET_SCREEN, WALLET_WITHDRAW_SCREEN } from "../../navigation/routes";
import WalletSkeleton from "./WalletSkeleton";
import RBSheet from "react-native-raw-bottom-sheet";
import DepositSheet from "../../shared/components/DepositSheet";
import WithdrawSheet from "../../shared/components/WithdrawSheet";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../../hooks/useTheme";
import { IMAGE_BASE_URL } from "../../helper/Constants";
import { bitcoin_ic, coinActive, moreOption, searchIcon } from "../../helper/ImageAssets";
import { TabView } from "react-native-tab-view";
import { ScrollView } from "react-native-gesture-handler";
import { routes } from "../../helper/dummydata";

const WalletNew = () => {
  const dispatch = useDispatch();
  const depsoitSheet = useRef(null);
  const withdrawSheet = useRef(null);
  const coinDetailSheet = useRef(null);
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
  const topRoutes = useMemo(
    () => [
      { key: "Overview", title: "Overview" },
      { key: "Spot", title: "Spot" },
      { key: "Main", title: "Main" },
      { key: "P2P", title: "P2P" },
      { key: "Futures", title: "Futures" },
      { key: "Swap", title: "Swap" },
      { key: "Earning", title: "Earning" },
    ],
    []
  );
  const [topIndex, setTopIndex] = useState(0);
  const activeTab = topRoutes[topIndex]?.key || "Overview";
  const setActiveTab = useCallback(
    (key) => {
      const idx = topRoutes.findIndex((r) => r.key === key);
      if (idx >= 0) setTopIndex(idx);
    },
    [topRoutes]
  );

  const layout = useWindowDimensions();
  const [showBalance, setShowBalance] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const innerRoutes = useMemo(
    () => [
      { key: "crypto", title: "Crypto" },
      { key: "account", title: "Account" },
    ],
    []
  );
  const [innerIndex, setInnerIndex] = useState(0);
  const overviewInnerTab = innerRoutes[innerIndex]?.key || "crypto";
  const [hideZeroBalance, setHideZeroBalance] = useState(false);
  const [search, setSearch] = useState("");
  const [failedIconMap, setFailedIconMap] = useState({});
  const searchInputRef = useRef(null);
  const [selectedCoinForSheet, setSelectedCoinForSheet] = useState(null);

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

  const safeNum = useCallback((v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }, []);

  const safeRound = useCallback((value, decimals = 8) => {
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) return "0.00";
    return String(parseFloat(num.toFixed(decimals)));
  }, []);

  const formatEstimateHeader = useCallback((value, decimals = 2) => {
    if (value === undefined || value === null || value === "") return "—";
    const num = Number(value);
    if (!Number.isFinite(num)) return "—";
    return String(parseFloat(num.toFixed(decimals)));
  }, []);

  const spotUsdPriceLabel = useCallback(
    (item) => {
      const rawStr = item?.price === undefined || item?.price === null ? "" : String(item.price).trim();
      if (rawStr !== "" && rawStr.toUpperCase() !== "N/A") {
        const p = parseFloat(rawStr);
        if (!Number.isNaN(p) && p > 0) return `$${safeRound(p, 5)}`;
      }
      const sym = String(item?.short_name || "").trim().toUpperCase();
      const cur = String(item?.currency || "").trim().toUpperCase();
      if (sym === "USDT" || cur === "USDT") return `$${safeRound(1, 2)}`;
      return "N/A";
    },
    [safeRound]
  );


  const portfolioUsdtEstimate = useCallback((p) => {
    if (!p || typeof p !== "object") return undefined;
    return (
      p.estimated_total_usdt ??
      p.dollarPrice ??
      p.estimatedTotalUsdt ??
      p.estimated_total ??
      p.total_usdt
    );
  }, []);

  const portfolioPreferredCurrency = useCallback((p) => {
    if (!p || typeof p !== "object") return "USD";
    return (
      p.currency_prefrence ??
      p.currency_preference ??
      p.preferred_currency ??
      p.Currency ??
      "USD"
    );
  }, []);

  const portfolioPreferredAmount = useCallback((p) => {
    if (!p || typeof p !== "object") return undefined;
    // app parity: some responses store preferred amount under the currency code key
    const cur = portfolioPreferredCurrency(p);
    const byKey = cur && Object.prototype.hasOwnProperty.call(p, cur) ? p[cur] : undefined;
    const pref =
      p.estimated_total_preferred ??
      p.estimatedTotalPreferred ??
      p.currencyPrice ??
      byKey;
    return pref != null && pref !== "" ? pref : portfolioUsdtEstimate(p);
  }, [portfolioPreferredCurrency, portfolioUsdtEstimate]);

  const buildCoinIconUri = useCallback((iconPath) => {
    const raw = iconPath === undefined || iconPath === null ? "" : String(iconPath).trim();
    if (!raw) return null;
    if (/^https?:\/\//i.test(raw)) return raw;
    const base = String(IMAGE_BASE_URL || "").replace(/\/+$/, "");
    const path = raw.startsWith("/") ? raw : `/${raw}`;
    return `${base}${path}`;
  }, []);

  useEffect(() => {
    // if an icon failed earlier due to a transient URL issue, retry on next wallet refresh
    setFailedIconMap({});
  }, [userWallet]);

  const totalWalletQty = useCallback((item) => {
    return safeNum(item?.balance) + safeNum(item?.locked_balance);
  }, [safeNum]);

  const visibleCryptoRowsForCount = useMemo(() => {
    const rows = Array.isArray(userWallet) ? userWallet : [];
    if (!hideZeroBalance) return rows;
    return rows.filter((it) => totalWalletQty(it) > 0);
  }, [userWallet, hideZeroBalance, totalWalletQty]);

  const shouldShowCryptoSearch = useMemo(() => {
    return overviewInnerTab === "crypto" && visibleCryptoRowsForCount.length > 5;
  }, [overviewInnerTab, visibleCryptoRowsForCount.length]);

  useEffect(() => {
    if (shouldShowCryptoSearch) return;
    if (search !== "") setSearch("");
  }, [shouldShowCryptoSearch, search]);

  const renderWalletTypeScene = useCallback(
    (tabKey) => {
      return (
        <>
          <View style={{ marginVertical: 20, paddingHorizontal: 20 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <AppText weight={SEMI_BOLD}>
                {tabKey === "Main"
                  ? "Estimated Main Wallet Assets"
                  : tabKey === "Spot"
                    ? "Estimated Spot Wallet Assets"
                    : tabKey === "Swap"
                      ? "Estimated Swap Wallet Assets"
                      : tabKey === "Earning"
                        ? "Estimated Earning Wallet"
                        : tabKey === "Futures"
                          ? "Estimated Futures Wallet Assets"
                          : ""}
              </AppText>

              <TouchableOpacity onPress={() => setShowBalance(!showBalance)}>
                <FastImage
                  source={showBalance ? eye_close_icon : eye_open_icon}
                  resizeMode="contain"
                  style={{ width: 20, height: 20 }}
                  tintColor={theme !== "Dark" ? colors.disclaimText : colors.disclaimDarText}
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
                        tabKey === "Main"
                          ? walletBalanceMain?.currencyPrice
                          : tabKey === "Spot"
                            ? walletBalanceSpot?.currencyPrice
                            : tabKey === "Swap"
                              ? walletBalanceSwap?.currencyPrice
                              : tabKey === "Earning"
                                ? walletBalanceEarning?.currencyPrice
                                : tabKey === "Futures"
                                  ? walletBalanceFutures?.currencyPrice
                                  : walletBalanceArbitrage?.currencyPrice
                      )}{" "}
                </AppText>
                <TouchableOpacity
                  onPress={() => NavigationService.navigate(CURRENCY_PREFERENCE_SCREEN)}
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
                        tabKey === "Main"
                          ? walletBalanceMain?.dollarPrice || 0
                          : tabKey === "Spot"
                            ? walletBalanceSpot?.dollarPrice || 0
                            : tabKey === "Swap"
                              ? walletBalanceSwap?.dollarPrice || 0
                              : tabKey === "Earning"
                                ? walletBalanceEarning?.dollarPrice || 0
                                : tabKey === "Futures"
                                  ? walletBalanceFutures?.dollarPrice || 0
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
              NavigationService.navigate(DEPOSIT_COIN_SCREEN);
            }}
            onWithdraw={() => {
              NavigationService.navigate(WALLET_WITHDRAW_SCREEN);
            }}
          />
          <View style={{ marginVertical: 20, paddingHorizontal: 20 }}>
            <WalletList
              userWallet={
                tabKey === "Main"
                  ? userMainWallet
                  : tabKey === "Spot"
                    ? userSpotWallet
                    : tabKey === "Swap"
                      ? userSwapWallet
                      : tabKey === "Earning"
                        ? userEarningWallet
                        : tabKey === "Futures"
                          ? userFuturesWallet
                          : ""
              }
              onSheetOpen={handleSheetOpen}
              theme={theme}
            />
          </View>
        </>
      );
    },
    [
      handleSheetOpen,
      isBalanceLoaded,
      showBalance,
      theme,
      userEarningWallet,
      userFuturesWallet,
      userMainWallet,
      userSpotWallet,
      userSwapWallet,
      walletBalance,
      walletBalanceArbitrage,
      walletBalanceEarning,
      walletBalanceFutures,
      walletBalanceMain,
      walletBalanceSpot,
      walletBalanceSwap,
    ]
  );

  const approxUsdDisplay = useCallback((item) => {
    const raw = item?.dollar_price ?? item?.dollarPrice ?? item?.usd_value ?? item?.estimated_usd;
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 0) return safeRound(n, 2);
    const sym = String(item?.short_name || "").toUpperCase();
    const stable = ["USDT", "USDC", "BUSD", "DAI", "TUSD", "USDP"].includes(sym);
    const t = totalWalletQty(item);
    if (stable && t >= 0) return safeRound(t, 2);
    return null;
  }, [safeRound, totalWalletQty]);

  const usdApproxFromPrice = useCallback((amount, item) => {
    const sym = String(item?.short_name || "").trim().toUpperCase();
    const cur = String(item?.currency || "").trim().toUpperCase();
    if (sym === "USDT" || cur === "USDT") {
      const amt = Number(amount) || 0;
      return `≈ $${safeRound(amt, 2)}`;
    }
    const raw = item?.price;
    const rawStr = raw === undefined || raw === null ? "" : String(raw).trim();
    if (rawStr === "" || rawStr.toUpperCase() === "N/A") return "≈ —";
    const p = Number(rawStr);
    if (!Number.isFinite(p) || p <= 0) return "≈ —";
    const amt = Number(amount) || 0;
    return `≈ $${safeRound(amt * p, 2)}`;
  }, [safeRound]);

  const approxUsdLine = useCallback((item) => {
    const v = approxUsdDisplay(item);
    if (v != null) return `≈ $${v}`;
    return usdApproxFromPrice(totalWalletQty(item), item);
  }, [approxUsdDisplay, totalWalletQty, usdApproxFromPrice]);

  const overviewCryptoRows = useMemo(() => {
    const rows = Array.isArray(userWallet) ? [...userWallet] : [];
    // web parity: non-zero wallets first
    rows.sort((a, b) => {
      const ta = safeNum(a?.balance) + safeNum(a?.locked_balance) + safeNum(a?.bonus);
      const tb = safeNum(b?.balance) + safeNum(b?.locked_balance) + safeNum(b?.bonus);
      if (ta > 0 && tb === 0) return -1;
      if (ta === 0 && tb > 0) return 1;
      return tb - ta;
    });
    const s = search.trim().toLowerCase();
    let out = rows;
    if (s) {
      out = out.filter((it) => String(it?.short_name || "").toLowerCase().includes(s) || String(it?.currency || "").toLowerCase().includes(s));
    }
    if (hideZeroBalance) {
      out = out.filter((it) => totalWalletQty(it) > 0);
    }
    return out;
  }, [userWallet, safeNum, search, hideZeroBalance, totalWalletQty]);

  const accountRows = useMemo(() => {
    const totalUsd = safeNum(walletBalance?.dollarPrice);
    const prefCurrency = walletBalance?.Currency || "USD";
    const mk = (key, label, bal) => {
      const usd = safeNum(bal?.dollarPrice);
      const pref = safeNum(bal?.currencyPrice);
      const cur = bal?.Currency || prefCurrency;
      const ratio = totalUsd > 0 ? ((usd / totalUsd) * 100).toFixed(2) : "0.00";
      return { key, label, usd, pref, cur, ratio };
    };
    return [
      mk("main", "Main", walletBalanceMain),
      mk("spot", "Spot", walletBalanceSpot),
      mk("p2p", "P2P", null),
      mk("swap", "Swap", walletBalanceSwap),
      mk("earning", "Earning", walletBalanceEarning),
      mk("futures", "Futures", walletBalanceFutures),
    ];
  }, [walletBalance, walletBalanceMain, walletBalanceSpot, walletBalanceSwap, walletBalanceEarning, walletBalanceFutures, safeNum]);

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
        {contentLoading ? (
          <WalletSkeleton />
        ) : (
          <TabView
            navigationState={{ index: topIndex, routes: topRoutes }}
            onIndexChange={setTopIndex}
            initialLayout={{ width: layout.width }}
            renderTabBar={() => (
              <WalletHeader routes={topRoutes} activeTab={activeTab} setActiveTab={setActiveTab} />
            )}
            renderScene={({ route }) => {
              if (route.key === "Overview") {
                return (
                  <View style={{ marginVertical: 10, paddingHorizontal: 20 }}>
                    <View>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <AppText weight={SEMI_BOLD} type={EIGHTEEN}>Assets Overview</AppText>
                      </View>

                      <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                        <TouchableOpacity
                          onPress={() => NavigationService.navigate(DEPOSIT_COIN_SCREEN)}
                          style={{
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            borderRadius: 18,
                            borderWidth: 1,
                            borderColor: themeColors.border,
                            backgroundColor: themeColors.themeElevationColor,
                          }}
                        >
                          <AppText type={TWELVE} weight={SEMI_BOLD}>Deposit</AppText>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => NavigationService.navigate(WALLET_WITHDRAW_SCREEN)}
                          style={{
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            borderRadius: 18,
                            borderWidth: 1,
                            borderColor: themeColors.border,
                            backgroundColor: themeColors.themeElevationColor,
                          }}
                        >
                          <AppText type={TWELVE} weight={SEMI_BOLD}>Withdraw</AppText>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => NavigationService.navigate(TRANSFER_SCREEN)}
                          style={{
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            borderRadius: 18,
                            borderWidth: 1,
                            borderColor: themeColors.border,
                            backgroundColor: themeColors.themeElevationColor,
                          }}
                        >
                          <AppText type={TWELVE} weight={SEMI_BOLD}>Transfer</AppText>
                        </TouchableOpacity>
                      </View>

                      <View
                        style={{
                          marginTop: 12,
                          paddingVertical: 14,
                          paddingHorizontal: 14,
                          borderWidth: 1,
                          borderColor: themeColors.border,
                          borderRadius: 14,
                          backgroundColor: themeColors.themeElevationColor,
                        }}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                          <AppText color={DISCLAIMTEXT}>Estimated Balance</AppText>
                          <TouchableOpacity onPress={() => setShowBalance(!showBalance)}>
                            <FastImage
                              source={showBalance ? eye_close_icon : eye_open_icon}
                              resizeMode="contain"
                              style={{ width: 18, height: 18 }}
                              tintColor={theme !== "Dark" ? colors.disclaimText : colors.disclaimDarText}
                            />
                          </TouchableOpacity>
                        </View>

                        <View style={{ marginTop: 10 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}>
                            <AppText type={FIFTEEN} weight={SEMI_BOLD}>
                              {!showBalance ? "****" : formatEstimateHeader(portfolioPreferredAmount(walletBalance), 5)}{" "}
                            </AppText>
                            <AppText color={DISCLAIMTEXT}>
                              {portfolioPreferredCurrency(walletBalance)}
                            </AppText>
                          </View>
                          <View style={{ marginTop: 6 }}>
                            <AppText color={DISCLAIMTEXT}>
                              ≈ {!showBalance ? "****" : formatEstimateHeader(portfolioUsdtEstimate(walletBalance), 5)} USD
                            </AppText>
                          </View>
                          <TouchableOpacity
                            onPress={() => NavigationService.navigate(DEPOSIT_COIN_SCREEN)}
                            style={{ marginTop: 10 }}
                          >
                            <AppText color={DISCLAIMTEXT}>
                              Deposit crypto instantly with one-click {"›"}
                            </AppText>
                          </TouchableOpacity>
                        </View>
                      </View>

                      <TabView
                        navigationState={{ index: innerIndex, routes: innerRoutes }}
                        onIndexChange={setInnerIndex}
                        initialLayout={{ width: layout.width }}
                        swipeEnabled
                        renderTabBar={() => (
                          <View style={{ marginTop: 18 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                              <View style={{ flexDirection: "row", gap: 18, alignItems: "flex-end" }}>
                                <TouchableOpacity onPress={() => setInnerIndex(0)} style={{ alignItems: "center" }}>
                                  <AppText
                                    weight={SEMI_BOLD}
                                    color={overviewInnerTab === "crypto" ? (theme === "Dark" ? colors.white : colors.black) : DISCLAIMTEXT}
                                  >
                                    Crypto
                                  </AppText>
                                  <View
                                    style={{
                                      marginTop: 6,
                                      height: 3,
                                      width: 22,
                                      borderRadius: 2,
                                      backgroundColor: overviewInnerTab === "crypto" ? colors.buttonBg : "transparent",
                                    }}
                                  />
                                </TouchableOpacity>

                                <TouchableOpacity onPress={() => setInnerIndex(1)} style={{ alignItems: "center" }}>
                                  <AppText
                                    weight={SEMI_BOLD}
                                    color={overviewInnerTab === "account" ? (theme === "Dark" ? colors.white : colors.black) : DISCLAIMTEXT}
                                  >
                                    Account
                                  </AppText>
                                  <View
                                    style={{
                                      marginTop: 6,
                                      height: 3,
                                      width: 22,
                                      borderRadius: 2,
                                      backgroundColor: overviewInnerTab === "account" ? colors.buttonBg : "transparent",
                                    }}
                                  />
                                </TouchableOpacity>
                              </View>

                              {overviewInnerTab === "crypto" ? (
                                <TouchableOpacity
                                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                                  onPress={() => setHideZeroBalance((v) => !v)}
                                >
                                  <View
                                    style={{
                                      width: 15,
                                      height: 15,
                                      borderWidth: 1,
                                      borderColor: colors.grey,
                                      borderRadius: 2,
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    {hideZeroBalance ? (
                                      <FastImage
                                        source={checkIc}
                                        style={{ width: 8, height: 8 }}
                                        resizeMode="contain"
                                        tintColor={colors.buttonBg}
                                      />
                                    ) : null}
                                  </View>
                                  <AppText type={TWELVE} color={DISCLAIMTEXT}>Hide 0 Balance</AppText>
                                </TouchableOpacity>
                              ) : null}
                            </View>

                            {shouldShowCryptoSearch ? (
                              <View style={[styles.aoCryptoSearchRow, { borderColor: themeColors.border, backgroundColor: themeColors.themeElevationColor }]}>
                                <FastImage
                                  source={searchIcon}
                                  resizeMode="contain"
                                  style={{ width: 14, height: 14 }}
                                  tintColor={"#787878"}
                                />
                                <TextInput
                                  ref={searchInputRef}
                                  value={search}
                                  onChangeText={setSearch}
                                  placeholder="Search Crypto"
                                  placeholderTextColor={"#787878"}
                                  style={{ flex: 1, height: 38, fontSize: 13, color: theme !== "Dark" ? "#000" : "#FFF" }}
                                  returnKeyType="search"
                                />
                              </View>
                            ) : null}
                          </View>
                        )}
                        renderScene={({ route: innerRoute }) => {
                          if (innerRoute.key === "crypto") {
                            return (
                              <FlatList
                                data={overviewCryptoRows}
                                keyExtractor={(item, idx) => String(item?.currency_id || idx)}
                                style={{ marginTop: 14 }}
                                renderItem={({ item }) => {
                                  const total = totalWalletQty(item);
                                  return (
                                    <View style={styles.aoRow}>
                                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                                        <View style={{ borderRadius: 16, overflow: "hidden" }}>
                                          <FastImage
                                            source={
                                              failedIconMap?.[String(item?.currency_id)]
                                                ? bitcoin_ic
                                                : (buildCoinIconUri(item?.icon_path)
                                                  ? { uri: buildCoinIconUri(item?.icon_path) }
                                                  : bitcoin_ic)
                                            }
                                            style={{ width: 28, height: 28 }}
                                            resizeMode="cover"
                                            onError={() => {
                                              const id = String(item?.currency_id ?? "");
                                              if (!id) return;
                                              setFailedIconMap((prev) => (prev?.[id] ? prev : { ...(prev || {}), [id]: true }));
                                            }}
                                          />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                          <AppText weight={SEMI_BOLD}>{item?.short_name}</AppText>
                                          <AppText type={TWELVE} color={DISCLAIMTEXT}>{item?.currency}</AppText>
                                        </View>
                                      </View>
                                      <View style={{ alignItems: "flex-end" }}>
                                        <AppText weight={SEMI_BOLD}>{safeRound(total, 8)}</AppText>
                                        <AppText type={TWELVE} color={DISCLAIMTEXT}>{approxUsdLine(item)}</AppText>
                                      </View>
                                      <TouchableOpacity
                                        style={{ paddingLeft: 10, paddingVertical: 6 }}
                                        onPress={() => {
                                          setSelectedCoinForSheet(item);
                                          coinDetailSheet.current?.open?.();
                                        }}
                                      >
                                        <FastImage source={moreOption} style={{ width: 18, height: 18, transform: [{ rotate: "90deg" }] }} resizeMode="contain" tintColor={DISCLAIMTEXT} />
                                      </TouchableOpacity>
                                    </View>
                                  );
                                }}
                                ListEmptyComponent={() => (
                                  <View style={{ alignItems: "center", marginTop: 60, gap: 10 }}>
                                    <FastImage source={NO_NOTIFICATION_ICON} style={{width:80,height:80}} resizeMode="contain"/>
                                    <View style={{flexDirection:'row',marginTop:10,alignItems:"center"}}>
                                    <AppText type={TWELVE} weight={SEMI_BOLD} style={{}} color={colors.buttonBg} onPress={() => NavigationService.navigate(DEPOSIT_COIN_SCREEN)}>
                                      Deposit Now{' '}
                                    </AppText>
                                    <FastImage source={share_ic} style={{width:10,height:10,bottom:1}} resizeMode="contain" tintColor={colors.black}/>
                                    </View>
                                  </View>
                                )}
                              />
                            );
                          }

                          return (
                            <FlatList
                              data={accountRows}
                              keyExtractor={(it) => it.key}
                              style={{ marginTop: 14 }}
                              renderItem={({ item }) => (
                                <View style={styles.aoRow}>
                                  <View style={{ flex: 1 }}>
                                    <AppText weight={SEMI_BOLD}>{item.label}</AppText>
                                  </View>
                                  <View style={{ alignItems: "flex-end" }}>
                                    <AppText weight={SEMI_BOLD}>
                                      {showBalance ? `${safeRound(item.pref, 8)} ${item.cur}` : "****"}
                                    </AppText>
                                    <AppText type={TWELVE} color={DISCLAIMTEXT}>
                                      {showBalance ? `$${safeRound(item.usd, 2)}` : "****"}
                                    </AppText>
                                  </View>
                                  <View style={{ width: 70, alignItems: "flex-end" }}>
                                    <AppText type={TWELVE} color={DISCLAIMTEXT}>{showBalance ? `${item.ratio}%` : "****"}</AppText>
                                  </View>
                                  <TouchableOpacity style={{ paddingLeft: 10, paddingVertical: 6 }}>
                                    <FastImage source={moreOption} style={{ width: 18, height: 18, transform: [{ rotate: "90deg" }] }} resizeMode="contain" tintColor={DISCLAIMTEXT} />
                                  </TouchableOpacity>
                                </View>
                              )}
                            />
                          );
                        }}
                      />
                    </View>
                  </View>
                );
              }

              return (
                <View>
                  {route.key === "P2P" ? (
                    <View style={{ marginVertical: 20, paddingHorizontal: 20 }}>
                      <AppText weight={SEMI_BOLD}>P2P Wallet</AppText>
                      <AppText color={DISCLAIMTEXT} style={{ marginTop: 8 }}>
                        Coming soon
                      </AppText>
                    </View>
                  ) : (
                    renderWalletTypeScene(route.key)
                  )}
                </View>
              );
            }}
          />
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

      <RBSheet
        ref={coinDetailSheet}
        closeOnDragDown={true}
        closeOnPressMask={true}
        height={420}
        animationType="fade"
        customStyles={{
          container: {
            backgroundColor: themeColors.background,
            height: 420,
            borderTopRightRadius: 26,
            borderTopLeftRadius: 26,
            paddingHorizontal: 18,
            paddingTop: 14,
          },
          wrapper: {
            backgroundColor: "#0006",
          },
          draggableIcon: {
            backgroundColor: "transparent",
          },
        }}
      >
        {selectedCoinForSheet ? (
          <View style={{ flex: 1 }}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 14 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View style={{ borderRadius: 20, overflow: "hidden" }}>
                    <FastImage
                      source={
                        failedIconMap?.[String(selectedCoinForSheet?.currency_id)]
                          ? bitcoin_ic
                          : (buildCoinIconUri(selectedCoinForSheet?.icon_path)
                            ? { uri: buildCoinIconUri(selectedCoinForSheet?.icon_path) }
                            : bitcoin_ic)
                      }
                      style={{ width: 40, height: 40 }}
                      resizeMode="cover"
                    />
                  </View>
                  <View>
                    <AppText weight={SEMI_BOLD} type={FOURTEEN}>{selectedCoinForSheet?.short_name}</AppText>
                    <AppText type={TWELVE} color={DISCLAIMTEXT}>{selectedCoinForSheet?.currency}</AppText>
                  </View>
                </View>
               
              </View>

              <View style={{ marginTop: 14 }}>
                <AppText weight={SEMI_BOLD} style={{ fontSize: 22 }}>
                  {safeRound(totalWalletQty(selectedCoinForSheet), 8)}
                </AppText>
                <AppText type={TWELVE} color={DISCLAIMTEXT} style={{ marginTop: 2 }}>
                  {approxUsdLine(selectedCoinForSheet)}
                </AppText>
              </View>

              <View style={{ marginTop: 16, gap: 14 }}>
                <View style={styles.sheetRow}>
                  <AppText type={TWELVE} color={DISCLAIMTEXT}>Available</AppText>
                  <View style={{ alignItems: "flex-end" }}>
                    <AppText weight={SEMI_BOLD}>{safeRound(selectedCoinForSheet?.balance, 8)}</AppText>
                    <AppText type={TWELVE} color={DISCLAIMTEXT}>{usdApproxFromPrice(selectedCoinForSheet?.balance, selectedCoinForSheet)}</AppText>
                  </View>
                </View>
                <View style={styles.sheetRow}>
                  <AppText type={TWELVE} color={DISCLAIMTEXT}>In-Order</AppText>
                  <View style={{ alignItems: "flex-end" }}>
                    <AppText weight={SEMI_BOLD}>{safeRound(selectedCoinForSheet?.locked_balance, 8)}</AppText>
                    <AppText type={TWELVE} color={DISCLAIMTEXT}>{usdApproxFromPrice(selectedCoinForSheet?.locked_balance, selectedCoinForSheet)}</AppText>
                  </View>
                </View>
                <View style={styles.sheetRow}>
                  <AppText type={TWELVE} color={DISCLAIMTEXT}>Avg. Cost Price (USD)</AppText>
                  <AppText weight={SEMI_BOLD}>{spotUsdPriceLabel(selectedCoinForSheet)}</AppText>
                </View>
                <View style={styles.sheetRow}>
                  <AppText type={TWELVE} color={DISCLAIMTEXT}>Total Balance</AppText>
                  <AppText weight={SEMI_BOLD}>{safeRound(totalWalletQty(selectedCoinForSheet), 8)}</AppText>
                </View>
              </View>

              <View style={{ height: 1, backgroundColor: themeColors.border, marginTop: 14 }} />

              <View style={{ flexDirection: "row", gap: 12, marginTop: 14 }}>
              <TouchableOpacity
                onPress={() => {
                  coinDetailSheet.current?.close?.();
                  NavigationService.navigate(TRANSFER_SCREEN, { coin: selectedCoinForSheet });
                }}
                style={[styles.sheetBtn, { backgroundColor: themeColors.themeElevationColor, borderColor: themeColors.border }]}
              >
                <AppText weight={SEMI_BOLD} type={FOURTEEN}>Transfer</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  coinDetailSheet.current?.close?.();
                  NavigationService.navigate(WALLET_SCREEN, { coin: selectedCoinForSheet });
                }}
                style={[styles.sheetBtn, { backgroundColor: themeColors.themeElevationColor, borderColor: themeColors.border }]}
              >
                <AppText weight={SEMI_BOLD} type={FOURTEEN}>Trade</AppText>
              </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        ) : (
          <View />
        )}
      </RBSheet>

    </AppSafeAreaView>
  );
};

export default WalletNew;

const styles = StyleSheet.create({
  aoSearch: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 18,
    height: 32,
    width: 140,
  },
  aoCryptoSearchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 42,
    marginTop: 10,
  },
  aoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#00000014",
  },
  sheetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sheetBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});