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
  bitcoin_ic,
  coinActive,
  moreOption,
  searchIcon,
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
import { ACCOUNT_SCREEN, CONVERT_SCREEN, CURRENCY_PREFERENCE_SCREEN, DEPOSIT_COIN_SCREEN, EARING_SCREEN, TRANSFER_SCREEN, WALLET_SCREEN, WALLET_WITHDRAW_SCREEN } from "../../navigation/routes";
import WalletSkeleton from "./WalletSkeleton";
import RBSheet from "react-native-raw-bottom-sheet";
import DepositSheet from "../../shared/components/DepositSheet";
import WithdrawSheet from "../../shared/components/WithdrawSheet";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../../hooks/useTheme";
import { IMAGE_BASE_URL } from "../../helper/Constants";
import { TabView } from "react-native-tab-view";
import { ScrollView } from "react-native-gesture-handler";
import { routes } from "../../helper/dummydata";
import Toast from "react-native-simple-toast";
import SpotWalletTab from "./tabs/SpotWalletTab";
import CoinDetailSheet from "./sheets/CoinDetailSheet";
import AccountDetailSheet from "./sheets/AccountDetailSheet";
import MainWalletTab from "./tabs/MainWalletTab";
import P2PWalletTab from "./tabs/P2PWalletTab";
import SwapWalletTab from "./tabs/SwapWalletTab";
import EarningWalletTab from "./tabs/EarningWalletTab";
import FuturesWalletTab from "./tabs/FuturesWalletTab";
import WalletTabQuickActions from "./WalletTabQuickActions";

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
  const [selectedCoinSheetWalletType, setSelectedCoinSheetWalletType] = useState("spot");
  const [selectedAccountForSheet, setSelectedAccountForSheet] = useState(null);
  const accountDetailSheet = useRef(null);
  const [accountSheetHeight, setAccountSheetHeight] = useState(340);

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

  // Spot tab UI moved to `SpotWalletTab`

  const accountRows = useMemo(() => {
    const prefCurrency =
      walletBalance?.Currency ||
      walletBalanceMain?.Currency ||
      walletBalanceSpot?.Currency ||
      walletBalanceSwap?.Currency ||
      walletBalanceEarning?.Currency ||
      walletBalanceFutures?.Currency ||
      "USD";

    const balancesByKey = {
      main: walletBalanceMain,
      spot: walletBalanceSpot,
      p2p: null,
      swap: walletBalanceSwap,
      earning: walletBalanceEarning,
      futures: walletBalanceFutures,
    };

    const usdFor = (bal) => safeNum(portfolioUsdtEstimate(bal));
    const prefFor = (bal) => safeNum(portfolioPreferredAmount(bal));
    const curFor = (bal) => (bal ? portfolioPreferredCurrency(bal) : prefCurrency);

    const totalUsd = Object.keys(balancesByKey).reduce((acc, k) => {
      const b = balancesByKey[k];
      return acc + usdFor(b);
    }, 0);

    const mk = (key, label, bal) => {
      const usd = usdFor(bal);
      const pref = prefFor(bal);
      const cur = curFor(bal);
      const ratio = totalUsd > 0 ? ((usd / totalUsd) * 100).toFixed(2) : "0.00";
      return { key, label, usd, pref, cur, ratio };
    };

    return [
      mk("main", "Main", balancesByKey.main),
      mk("spot", "Spot", balancesByKey.spot),
      mk("p2p", "P2P", balancesByKey.p2p),
      mk("swap", "Swap", balancesByKey.swap),
      mk("earning", "Earning", balancesByKey.earning),
      mk("futures", "Futures", balancesByKey.futures),
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

  const isPortfolioLoaded = useCallback((p) => {
    if (!p || typeof p !== "object") return false;
    // treat as loaded if we have any core numeric + currency fields
    return (
      p?.currencyPrice !== undefined ||
      p?.dollarPrice !== undefined ||
      p?.Currency !== undefined ||
      p?.currency_preference !== undefined ||
      p?.currency_prefrence !== undefined
    );
  }, []);

  const isWalletDataLoaded = useMemo(() => {
    // Keep this minimal + reliable: once the main portfolio is present,
    // we can render the screen and allow remaining slices to fill in.
    return isPortfolioLoaded(walletBalance);
  }, [
    isPortfolioLoaded,
    walletBalance,
  ]);

  const fetchWalletData = useCallback(() => {
    dispatch(getAllWalletsPortfolio(noGlobalLoader));
    dispatch(getUserPortfolioMain("main", noGlobalLoader));
    dispatch(getUserPortfolioSpot("spot", noGlobalLoader));
    dispatch(getUserPortfolioSwap("swap", noGlobalLoader));
    dispatch(getUserPortfolioEarning("earning", noGlobalLoader));
    // app uses "arbitrage" slice as P2P tab backing store
    dispatch(getUserPortfolioArbitrage("p2p", noGlobalLoader));
    dispatch(getUserPortfolioFutures("futures", noGlobalLoader));
    dispatch(getUserPortfolioOptions("options", noGlobalLoader));
    dispatch(getUserWallet(""));
    dispatch(getUserMainWallet("main"));
    dispatch(getUserSpotWallet("spot"));
    dispatch(getUserSwapWallet("swap"));
    dispatch(getUserEarningWallet("earning"));
    dispatch(getUserArbitrageWallet("p2p"));
    dispatch(getUserFuturesWallet("futures"));
    dispatch(getUserOptionsWallet("options"));
  }, [dispatch, noGlobalLoader]);

  useFocusEffect(
    useCallback(() => {
      if (isFirstLoad.current) {
        setContentLoading(true);
        fetchWalletData();
        isFirstLoad.current = false;
      }
    }, [fetchWalletData])
  );

  useEffect(() => {
    if (!contentLoading) return;
    if (!isWalletDataLoaded) return;
    setContentLoading(false);
  }, [contentLoading, isWalletDataLoaded]);

  const onRefresh = useCallback(() => {
    console.log("Pull to refresh triggered! Fetching latest data...");
    setRefreshing(true);
    fetchWalletData();
    setTimeout(() => {
      setRefreshing(false);
      console.log("Refresh Complete.");
    }, 1000); // Give 1s for refresh UI experience
  }, [fetchWalletData]);

  const accountDotColor = useCallback(
    (key) => {
      switch (key) {
        case "main":
          return "#E91E63"; // pink
        case "spot":
          return "#3F51B5"; // indigo/blue
        case "p2p":
          return "#9E9E9E"; // grey
        case "swap":
          return "#8BC34A"; // green
        case "earning":
          return "#FF9800"; // orange
        case "futures":
          return "#F44336"; // red
        default:
          return themeColors.text;
      }
    },
    [themeColors.text]
  );

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

                      <WalletTabQuickActions
                        theme={theme}
                        themeColors={themeColors}
                        items={[
                          { key: "deposit", label: "Deposit", variant: "deposit", onPress: () => NavigationService.navigate(DEPOSIT_COIN_SCREEN) },
                          { key: "withdraw", label: "Withdraw", variant: "withdraw", onPress: () => NavigationService.navigate(WALLET_WITHDRAW_SCREEN) },
                          { key: "transfer", label: "Transfer", variant: "transfer", onPress: () => NavigationService.navigate(TRANSFER_SCREEN) },
                        ]}
                      />

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
                                  <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
                                    <View
                                      style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: 8,
                                        backgroundColor: accountDotColor(item.key),
                                        marginRight: 10,
                                      }}
                                    />
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
                                  <TouchableOpacity
                                    style={{ paddingLeft: 10, paddingVertical: 6 }}
                                    onPress={() => {
                                      setSelectedAccountForSheet(item);
                                      accountDetailSheet.current?.open?.();
                                    }}
                                  >
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

              if (route.key === "Spot") {
                return (
                  <SpotWalletTab
                    theme={theme}
                    themeColors={themeColors}
                    showBalance={showBalance}
                    setShowBalance={setShowBalance}
                    walletBalanceSpot={walletBalanceSpot}
                    portfolioPreferredAmount={portfolioPreferredAmount}
                    portfolioPreferredCurrency={portfolioPreferredCurrency}
                    portfolioUsdtEstimate={portfolioUsdtEstimate}
                    formatEstimateHeader={formatEstimateHeader}
                    safeRound={safeRound}
                    safeNum={safeNum}
                    totalWalletQty={totalWalletQty}
                    approxUsdLine={approxUsdLine}
                    buildCoinIconUri={buildCoinIconUri}
                    failedIconMap={failedIconMap}
                    setFailedIconMap={setFailedIconMap}
                    userSpotWallet={userSpotWallet}
                    onDeposit={() => NavigationService.navigate(DEPOSIT_COIN_SCREEN)}
                    onBuyCrypto={() => NavigationService.navigate(DEPOSIT_COIN_SCREEN)}
                    onTransfer={() =>
                      NavigationService.navigate(TRANSFER_SCREEN, { fromWalletType: "spot", toWalletType: "main" })
                    }
                    onWithdraw={() => NavigationService.navigate(WALLET_WITHDRAW_SCREEN)}
                    onOpenCoinSheet={(coin) => {
                      setSelectedCoinForSheet(coin);
                      setSelectedCoinSheetWalletType("spot");
                      coinDetailSheet.current?.open?.();
                    }}
                    eyeCloseIcon={eye_close_icon}
                    eyeOpenIcon={eye_open_icon}
                  />
                );
              }

              if (route.key === "Main") {
                return (
                  <MainWalletTab
                    theme={theme}
                    themeColors={themeColors}
                    showBalance={showBalance}
                    setShowBalance={setShowBalance}
                    walletBalance={walletBalanceMain}
                    portfolioPreferredAmount={portfolioPreferredAmount}
                    portfolioPreferredCurrency={portfolioPreferredCurrency}
                    portfolioUsdtEstimate={portfolioUsdtEstimate}
                    formatEstimateHeader={formatEstimateHeader}
                    safeRound={safeRound}
                    safeNum={safeNum}
                    totalWalletQty={totalWalletQty}
                    approxUsdLine={approxUsdLine}
                    buildCoinIconUri={buildCoinIconUri}
                    failedIconMap={failedIconMap}
                    setFailedIconMap={setFailedIconMap}
                    userWalletRows={userMainWallet}
                    actions={[
                      { key: "deposit", label: "Deposit", onPress: () => NavigationService.navigate(DEPOSIT_COIN_SCREEN) },
                      { key: "withdraw", label: "Withdraw", onPress: () => NavigationService.navigate(WALLET_WITHDRAW_SCREEN) },
                      {
                        key: "transfer",
                        label: "Transfer",
                        onPress: () => NavigationService.navigate(TRANSFER_SCREEN, { fromWalletType: "main", toWalletType: "spot" }),
                      },
                    ]}
                    eyeCloseIcon={eye_close_icon}
                    eyeOpenIcon={eye_open_icon}
                    onOpenCoinSheet={(coin) => {
                      setSelectedCoinForSheet(coin);
                      setSelectedCoinSheetWalletType("main");
                      coinDetailSheet.current?.open?.();
                    }}
                  />
                );
              }

              if (route.key === "P2P") {
                return (
                  <P2PWalletTab
                    theme={theme}
                    themeColors={themeColors}
                    showBalance={showBalance}
                    setShowBalance={setShowBalance}
                    walletBalance={walletBalanceArbitrage}
                    portfolioPreferredAmount={portfolioPreferredAmount}
                    portfolioPreferredCurrency={portfolioPreferredCurrency}
                    portfolioUsdtEstimate={portfolioUsdtEstimate}
                    formatEstimateHeader={formatEstimateHeader}
                    safeRound={safeRound}
                    safeNum={safeNum}
                    totalWalletQty={totalWalletQty}
                    approxUsdLine={approxUsdLine}
                    buildCoinIconUri={buildCoinIconUri}
                    failedIconMap={failedIconMap}
                    setFailedIconMap={setFailedIconMap}
                    userWalletRows={userArbitrageWallet}
                    actions={[
                      { key: "p2p", label: "P2P Trade", onPress: () => Toast.showWithGravity("Coming soon", Toast.LONG, Toast.BOTTOM) },
                      {
                        key: "transfer",
                        label: "Transfer",
                        onPress: () => NavigationService.navigate(TRANSFER_SCREEN, { fromWalletType: "p2p", toWalletType: "main" }),
                      },
                    ]}
                    eyeCloseIcon={eye_close_icon}
                    eyeOpenIcon={eye_open_icon}
                    onOpenCoinSheet={(coin) => {
                      setSelectedCoinForSheet(coin);
                      setSelectedCoinSheetWalletType("p2p");
                      coinDetailSheet.current?.open?.();
                    }}
                  />
                );
              }

              if (route.key === "Swap") {
                return (
                  <SwapWalletTab
                    theme={theme}
                    themeColors={themeColors}
                    showBalance={showBalance}
                    setShowBalance={setShowBalance}
                    walletBalance={walletBalanceSwap}
                    portfolioPreferredAmount={portfolioPreferredAmount}
                    portfolioPreferredCurrency={portfolioPreferredCurrency}
                    portfolioUsdtEstimate={portfolioUsdtEstimate}
                    formatEstimateHeader={formatEstimateHeader}
                    safeRound={safeRound}
                    safeNum={safeNum}
                    totalWalletQty={totalWalletQty}
                    approxUsdLine={approxUsdLine}
                    buildCoinIconUri={buildCoinIconUri}
                    failedIconMap={failedIconMap}
                    setFailedIconMap={setFailedIconMap}
                    userWalletRows={userSwapWallet}
                    actions={[
                      { key: "swap", label: "Swap", onPress: () => Toast.showWithGravity("Coming soon", Toast.LONG, Toast.BOTTOM) },
                      {
                        key: "transfer",
                        label: "Transfer",
                        onPress: () => NavigationService.navigate(TRANSFER_SCREEN, { fromWalletType: "swap", toWalletType: "main" }),
                      },
                    ]}
                    eyeCloseIcon={eye_close_icon}
                    eyeOpenIcon={eye_open_icon}
                    onOpenCoinSheet={(coin) => {
                      setSelectedCoinForSheet(coin);
                      setSelectedCoinSheetWalletType("swap");
                      coinDetailSheet.current?.open?.();
                    }}
                  />
                );
              }

              if (route.key === "Earning") {
                return (
                  <EarningWalletTab
                    theme={theme}
                    themeColors={themeColors}
                    showBalance={showBalance}
                    setShowBalance={setShowBalance}
                    walletBalance={walletBalanceEarning}
                    portfolioPreferredAmount={portfolioPreferredAmount}
                    portfolioPreferredCurrency={portfolioPreferredCurrency}
                    portfolioUsdtEstimate={portfolioUsdtEstimate}
                    formatEstimateHeader={formatEstimateHeader}
                    safeRound={safeRound}
                    safeNum={safeNum}
                    totalWalletQty={totalWalletQty}
                    approxUsdLine={approxUsdLine}
                    buildCoinIconUri={buildCoinIconUri}
                    failedIconMap={failedIconMap}
                    setFailedIconMap={setFailedIconMap}
                    userWalletRows={userEarningWallet}
                    actions={[
                      { key: "earning", label: "Earning", onPress: () => NavigationService.navigate(ACCOUNT_SCREEN) },
                      {
                        key: "transfer",
                        label: "Transfer",
                        onPress: () => NavigationService.navigate(TRANSFER_SCREEN, { fromWalletType: "earning", toWalletType: "main" }),
                      },
                    ]}
                    eyeCloseIcon={eye_close_icon}
                    eyeOpenIcon={eye_open_icon}
                    onOpenCoinSheet={(coin) => {
                      setSelectedCoinForSheet(coin);
                      setSelectedCoinSheetWalletType("earning");
                      coinDetailSheet.current?.open?.();
                    }}
                  />
                );
              }

              if (route.key === "Futures") {
                return (
                  <FuturesWalletTab
                    theme={theme}
                    themeColors={themeColors}
                    showBalance={showBalance}
                    setShowBalance={setShowBalance}
                    walletBalance={walletBalanceFutures}
                    portfolioPreferredAmount={portfolioPreferredAmount}
                    portfolioPreferredCurrency={portfolioPreferredCurrency}
                    portfolioUsdtEstimate={portfolioUsdtEstimate}
                    formatEstimateHeader={formatEstimateHeader}
                    safeRound={safeRound}
                    safeNum={safeNum}
                    totalWalletQty={totalWalletQty}
                    approxUsdLine={approxUsdLine}
                    buildCoinIconUri={buildCoinIconUri}
                    failedIconMap={failedIconMap}
                    setFailedIconMap={setFailedIconMap}
                    userWalletRows={userFuturesWallet}
                    actions={[
                      { key: "futures", label: "Futures", onPress: () => Toast.showWithGravity("Coming soon", Toast.LONG, Toast.BOTTOM) },
                      {
                        key: "transfer",
                        label: "Transfer",
                        onPress: () => NavigationService.navigate(TRANSFER_SCREEN, { fromWalletType: "futures", toWalletType: "main" }),
                      },
                    ]}
                    eyeCloseIcon={eye_close_icon}
                    eyeOpenIcon={eye_open_icon}
                    onOpenCoinSheet={(coin) => {
                      setSelectedCoinForSheet(coin);
                      setSelectedCoinSheetWalletType("futures");
                      coinDetailSheet.current?.open?.();
                    }}
                  />
                );
              }

              return (
                <View>
                  {renderWalletTypeScene(route.key)}
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

      <CoinDetailSheet
        sheetRef={coinDetailSheet}
        themeColors={themeColors}
        walletType={selectedCoinSheetWalletType}
        selectedCoin={selectedCoinForSheet}
        failedIconMap={failedIconMap}
        buildCoinIconUri={buildCoinIconUri}
        safeRound={safeRound}
        totalWalletQty={totalWalletQty}
        approxUsdLine={approxUsdLine}
        usdApproxFromPrice={usdApproxFromPrice}
        spotUsdPriceLabel={spotUsdPriceLabel}
        onTrade={(coin) => NavigationService.navigate(WALLET_SCREEN, { coin })}
        onTransfer={(coin) => NavigationService.navigate(TRANSFER_SCREEN, { coin })}
        onDeposit={() => NavigationService.navigate(DEPOSIT_COIN_SCREEN)}
        onWithdraw={() => NavigationService.navigate(WALLET_WITHDRAW_SCREEN)}
        onP2PTrade={() => Toast.showWithGravity("Coming soon", Toast.LONG, Toast.BOTTOM)}
        onSwap={() => Toast.showWithGravity("Coming soon", Toast.LONG, Toast.BOTTOM)}
        onEarning={() => Toast.showWithGravity("Coming soon", Toast.LONG, Toast.BOTTOM)}
        onFutures={() => Toast.showWithGravity("Coming soon", Toast.LONG, Toast.BOTTOM)}
      />

      <AccountDetailSheet
        sheetRef={accountDetailSheet}
        themeColors={themeColors}
        theme={theme}
        selectedAccount={selectedAccountForSheet}
        showBalance={showBalance}
        safeRound={safeRound}
        accountSheetHeight={accountSheetHeight}
        setAccountSheetHeight={setAccountSheetHeight}
        onTransfer={(acc) => {
          const from = acc?.key === "main" ? "main" : acc?.key;
          const to = acc?.key === "main" ? "spot" : "main";
          NavigationService.navigate(TRANSFER_SCREEN, { fromWalletType: from, toWalletType: to });
        }}
      />

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