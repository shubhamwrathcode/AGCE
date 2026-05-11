import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Keyboard,
  ScrollView,
  RefreshControl,
  Modal,
  Dimensions,
} from "react-native";
import RBSheet from "react-native-raw-bottom-sheet";
import {
  AppSafeAreaView,
  AppText,
  BLACK,
  Button,
  DISCLAIMTEXT,
  EIGHT,
  ELEVEN,
  FOURTEEN,
  THIRTEEN,
  Input,
  NINE,
  SEMI_BOLD,
  SIXTEEN,
  TEN,
  TWELVE,
  TWENTY,
  YELLOW,
} from "../../shared";
import KeyBoardAware from "../../shared/components/KeyboardAware";
import WithdrawCoinPickerPanel from "./WithdrawCoinPickerPanel";
import Accordion from "react-native-collapsible/Accordion";
import {
  loginDarkBg,
  back_ic,
  BACK_ICON,
  bitcoinIcon,
  copyIcon,
  disclaimerIcon,
  moreOption,
  printIcon,
  INFO,
  swapNetwork,
  qrCodeIcon,
  rectangleIcon,
  upIcon,
  downIcon,
  searchIcon,
  checkIc,
  user_withdarwal,
} from "../../helper/ImageAssets";
import NavigationService from "../../navigation/NavigationService";
import FastImage from "react-native-fast-image";
import { colors, lightTheme } from "../../theme/colors";
import { useTheme } from "../../hooks/useTheme";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useDispatch } from "react-redux";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { buildCoinImageUri } from "../../helper/coinIconUrl";
import { SETTING_SCREEN_New, SETTINGS_SCREEN, WITHDRAW_SCREEN, NOTIFICATION_SCREEN } from "../../navigation/routes";
import { useAppSelector } from "../../store/hooks";
import {
  getWithdrawActiveCoins,
  getUserMainWallet,
  withdrawCoin,
} from "../../actions/walletActions";
import { forgotOtp } from "../../actions/authActions";
import { showError } from "../../helper/logger";
import {
  getActiveWithdrawChainKeys,
  networkKeysFromChain,
  parseNum,
  valueForChain,
} from "../../helper/walletChainHelpers";
import { getNotificationList } from "../../actions/homeActions";
import moment from "moment";

const SHEET_HEIGHT = Math.round(Dimensions.get("window").height * 0.9);
const AGCE_COUNTRY_SHEET_HEIGHT = Math.round(Dimensions.get("window").height * 0.48);

/** Web `WithdrawPageSteps12` — country codes for AGCE User → Phone. */
const AGCE_PHONE_COUNTRIES = [
  { flag: "🇮🇳", code: "+91", label: "India" },
  { flag: "🇦🇪", code: "+971", label: "UAE" },
  { flag: "🇸🇦", code: "+966", label: "Saudi Arabia" },
  { flag: "🇺🇸", code: "+1", label: "United States" },
  { flag: "🇬🇧", code: "+44", label: "United Kingdom" },
];

const WithdrawWallet = () => {
  const dispatch = useDispatch();
  const route = useRoute();
  const { colors: themeColors, isDark } = useTheme();
  const routeCoin = route?.params?.data;
  const userData = useAppSelector((state) => state.auth.userData);
  const userMainWallet = useAppSelector((state) => state.wallet.userMainWallet);
  const withdrawActiveCoins = useAppSelector((state) => state.wallet.withdrawActiveCoins);

  const withdrawCoinsList = useMemo(
    () => (Array.isArray(withdrawActiveCoins) ? withdrawActiveCoins : []),
    [withdrawActiveCoins]
  );

  const { emailId } = userData ?? "";

  const [selectedCurrency, setSelectedCurrency] = useState({});
  /** Web parity: `WithdrawPageSteps12` — Address vs AGCE User under “Withdraw to”. */
  const [withdrawToTab, setWithdrawToTab] = useState("address");
  /** Web `agceRecipientTab`: email | phone | agce */
  const [agceRecipientTab, setAgceRecipientTab] = useState("email");
  const [agceRecipientEmail, setAgceRecipientEmail] = useState("");
  const [agceRecipientPhoneLocal, setAgceRecipientPhoneLocal] = useState("");
  const [agcePhoneCountry, setAgcePhoneCountry] = useState(() => AGCE_PHONE_COUNTRIES[0]);
  const [agceRecipientId, setAgceRecipientId] = useState("");

  const selectedCurrencyIconSource = useMemo(() => {
    const u = buildCoinImageUri(selectedCurrency);
    return u ? { uri: u } : bitcoinIcon;
  }, [selectedCurrency]);
  const [network, setNetwork] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [availableBalance, setAvailableBalance] = useState("");
  const [isValidWalletAddress, setIsValidWalletAddress] = useState(true);
  const [otp, setOtp] = useState("");
  const [otpText, setOtpText] = useState("Get OTP");
  const [disableBtn, setDisableBtn] = useState(false);
  const [timer, setTimer] = useState(0);
  const [faqActiveIndex, setFaqActiveIndex] = useState(null);
  const networkSheetRef = useRef(null);
  const coinSheetRef = useRef(null);
  const agceCountrySheetRef = useRef(null);
  const [showWithdrawFaqModal, setShowWithdrawFaqModal] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [activeAnnouncementSections, setActiveAnnouncementSections] = useState([]);
  const notificationList = useAppSelector((state) => state.home.notificationList);

  const [withdrawCoinsLoading, setWithdrawCoinsLoading] = useState(() => {
    if (routeCoin && typeof routeCoin === "object" && Object.keys(routeCoin).length > 0) return false;
    return !(withdrawActiveCoins && withdrawActiveCoins.length > 0);
  });

  const isFirstLoad = useRef(true);
  const [refreshing, setRefreshing] = useState(false);
  /** After user picks a coin from sheet, do not overwrite with default USDT. */
  const userPickedCoinRef = useRef(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([dispatch(getWithdrawActiveCoins()), dispatch(getUserMainWallet("main"))]);
    } catch (e) {
      console.warn("Withdraw refresh failed", e);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  const activeWithdrawChains = useMemo(
    () => getActiveWithdrawChainKeys(selectedCurrency),
    [selectedCurrency]
  );

  const sheetWithdrawChains = useMemo(
    () => getActiveWithdrawChainKeys(selectedCurrency),
    [selectedCurrency]
  );

  const withdrawNetworkDisplay = useMemo(() => {
    if (!network) return "";
    const full = String(
      selectedCurrency?.chain_full_names?.[network] ||
      selectedCurrency?._chain_full_name?.[network] ||
      ""
    ).trim();
    if (full) return full;
    return network;
  }, [selectedCurrency, network]);

  const openWithdrawNetworkSheet = useCallback(() => {
    if (!selectedCurrency || Object.keys(selectedCurrency).length === 0) return;
    const keys = getActiveWithdrawChainKeys(selectedCurrency);
    if (keys.length === 0) {
      const raw = networkKeysFromChain(selectedCurrency?.chain).length;
      const hasChains = Array.isArray(selectedCurrency?.chains) && selectedCurrency.chains.length > 0;
      if (raw === 0 && !hasChains) {
        showError("No withdrawal network available for this coin");
      } else {
        showError("No active withdrawal network for this coin");
      }
      return;
    }
    setTimeout(() => networkSheetRef.current?.open(), 0);
  }, [selectedCurrency]);

  const handleNetworkChosenFromSheet = useCallback((chainKey) => {
    setNetwork(chainKey);
    networkSheetRef.current?.close();
  }, []);

  const chainWithdrawalFee = useMemo(
    () => parseNum(valueForChain(selectedCurrency, "withdrawal_fee", network), 0),
    [selectedCurrency, network]
  );

  const chainMinWithdrawal = useMemo(
    () => parseNum(valueForChain(selectedCurrency, "min_withdrawal", network), 0),
    [selectedCurrency, network]
  );

  const chainMaxWithdrawal = useMemo(
    () => valueForChain(selectedCurrency, "max_withdrawal", network),
    [selectedCurrency, network]
  );

  const faqData = [
    {
      title: "How to Withdraw Crypto?",
      content: "To withdraw crypto, go to the withdrawal section, select your cryptocurrency, enter the recipient wallet address, choose the correct network, and specify the amount. Review the details carefully before confirming the withdrawal. Processing time may vary based on network congestion and withdrawal policies."
    },
    {
      title: "How to Withdraw Crypto Step-by-step Guide",
      content: "• Go to the Withdrawal Section – Navigate to the withdrawal page.\n• Select Your Crypto – Choose the cryptocurrency you want to withdraw.\n• Enter the Wallet Address – Make sure the address is correct and belongs to the selected blockchain network.\n• Choose the Network – Select the correct blockchain network (e.g., BEP20, ERC20, TRC20, Polygon).\n• Enter the Amount – Specify the amount you want to withdraw, ensuring it meets the minimum withdrawal limit.\n• Confirm & Submit – Review all details carefully and confirm the withdrawal.\n• Wait for Processing – Withdrawals are processed based on network congestion and request approval."
    },
    {
      title: "Withdrawal hasn't arrived?",
      content: "• Check Transaction Status – Use a blockchain explorer to track the transaction.\n• Verify the Wallet Address – Ensure the recipient address is correct.\n• Confirm Network Selection – The chosen network should match the recipient's wallet.\n• Check for Pending Processing – Some withdrawals require manual approval."
    }
  ];

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        if (isFirstLoad.current) {
          setWithdrawCoinsLoading(true);
        }
        try {
          await dispatch(getWithdrawActiveCoins());
        } finally {
          if (!cancelled) {
            setWithdrawCoinsLoading(false);
            isFirstLoad.current = false;
          }
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [dispatch])
  );

  useEffect(() => {
    dispatch(getWithdrawActiveCoins());
    dispatch(getUserMainWallet("main"));
    dispatch(getNotificationList());

    if (routeCoin && typeof routeCoin === "object" && Object.keys(routeCoin).length > 0) {
      userPickedCoinRef.current = true;
      setSelectedCurrency(routeCoin);
      setWithdrawToTab("address");
    }
  }, []);

  /** Default coin: USDT (web-style), else first asset with an active withdraw network. */
  useEffect(() => {
    if (userPickedCoinRef.current) return;
    if (!withdrawCoinsList.length) return;
    if (selectedCurrency && Object.keys(selectedCurrency).length > 0) return;
    const upper = (s) => String(s || "").toUpperCase();
    const usable = (c) => getActiveWithdrawChainKeys(c).length > 0;
    const usdt = withdrawCoinsList.find((c) => upper(c?.short_name) === "USDT" && usable(c));
    const fallback = withdrawCoinsList.find((c) => usable(c));
    const pick = usdt || fallback;
    if (pick) {
      setSelectedCurrency(pick);
      dispatch(getUserMainWallet("main"));
    }
  }, [withdrawCoinsList, selectedCurrency, dispatch]);

  useEffect(() => {
    if (notificationList?.length > 0) {
      let announcement = notificationList?.filter((item) => item?.type === "announcement");
      if (announcement?.length === 1) {
        setAnnouncements([...announcement, ...announcement]);
      } else if (announcement?.length > 1) {
        setAnnouncements(announcement?.reverse());
      } else {
        setAnnouncements(announcement);
      }
    }
  }, [notificationList]);

  // Format announcements for accordion
  const formattedAnnouncements = announcements?.map((item) => ({
    title: item?.title,
    date: moment(item?.updatedAt).format("DD-MM-YYYY  hh:mm A"),
    content: item?.message || item?.description || item?.title,
    fullData: item
  })) || [];

  useEffect(() => {
    if (userMainWallet?.length > 0 && Object.keys(selectedCurrency).length > 0) {
      let filteredData = userMainWallet?.filter((item) => item?.currency_id === selectedCurrency?._id)[0];
      if (filteredData) {
        setAvailableBalance(filteredData?.balance || "0");
      }
    }
  }, [userMainWallet, selectedCurrency]);

  useEffect(() => {
    const keys = getActiveWithdrawChainKeys(selectedCurrency);
    if (network && (keys.length === 0 || !keys.includes(network))) {
      setNetwork("");
    }
  }, [selectedCurrency, network]);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setDisableBtn(false);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleHeaderBack = () => {
    NavigationService.goBack();
  };

  const openCoinPickerSheet = useCallback(() => {
    setTimeout(() => coinSheetRef.current?.open(), 0);
  }, []);

  const openAgceCountrySheet = useCallback(() => {
    setTimeout(() => agceCountrySheetRef.current?.open(), 0);
  }, []);

  const handleSelectCurrency = (coin) => {
    if (!coin || typeof coin !== "object") return;
    const keys = getActiveWithdrawChainKeys(coin);
    if (keys.length === 0) {
      const rawLen = networkKeysFromChain(coin?.chain).length;
      const hasChainsArr = Array.isArray(coin?.chains) && coin.chains.length > 0;
      if (rawLen === 0 && !hasChainsArr) {
        showError("No withdrawal network available for this coin");
      } else {
        showError("No active withdrawal network for this coin");
      }
      return;
    }
    userPickedCoinRef.current = true;
    setSelectedCurrency(coin);
    setNetwork("");
    setWithdrawAmount("");
    setWithdrawAddress("");
    setOtp("");
    setIsValidWalletAddress(true);
    setWithdrawToTab("address");
    dispatch(getUserMainWallet("main"));
    coinSheetRef.current?.close();
  };

  const handleWithdrawalAddress = (value) => {
    const address = value;
    setWithdrawAddress(address);
    let isValid = false;
    let regexPattern = /^$/;

    if (network === "BEP20" || network === "ERC20" || network === "POLYGON") {
      regexPattern = /^0x[a-fA-F0-9]{40}$/;
    } else if (network === "TRC20") {
      regexPattern = /^T[a-zA-Z0-9]{33}$/;
    }

    isValid = regexPattern.test(address);

    if (!isValid && address.length > 0) {
      setIsValidWalletAddress(false);
    } else {
      setIsValidWalletAddress(true);
    }
  };

  const handleMaxWithdrawal = () => {
    setWithdrawAmount(availableBalance || "0");
  };

  const handleGetOtp = () => {
    if (!selectedCurrency || Object.keys(selectedCurrency).length === 0) {
      showError("Please select a coin first");
      return;
    }
    if (!network) {
      showError("Please select a network first");
      return;
    }
    if (!withdrawAddress || !isValidWalletAddress) {
      showError("Please enter a valid wallet address");
      return;
    }
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      showError("Please enter withdrawal amount");
      return;
    }
    const fee = parseNum(valueForChain(selectedCurrency, "withdrawal_fee", network), 0);
    if (parseFloat(availableBalance) < fee || parseFloat(withdrawAmount) > parseFloat(availableBalance)) {
      showError("Insufficient funds");
      return;
    }
    if (parseFloat(withdrawAmount) - fee < 0) {
      showError("Withdrawal amount must be greater than withdrawal fee");
      return;
    }
    if (!emailId || emailId === "") {
      showError("Please update email in profile section");
      return;
    }

    let data = {
      email_or_phone: emailId,
      resend: disableBtn,
      type: false,
    };
    dispatch(forgotOtp(data));
    setOtpText("Resend OTP");
    setDisableBtn(true);
    setTimer(60);
    Keyboard.dismiss();
  };

  const handleWithdraw = () => {
    if (!selectedCurrency || Object.keys(selectedCurrency).length === 0 || !withdrawAddress || !network || !withdrawAmount || !otp || !isValidWalletAddress) {
      showError("Please fill all required fields");
      return;
    }
    const fee = parseNum(valueForChain(selectedCurrency, "withdrawal_fee", network), 0);
    if (parseFloat(availableBalance) < fee || parseFloat(withdrawAmount) > parseFloat(availableBalance)) {
      showError("Insufficient funds");
      return;
    }

    let data = {
      verification_code: +otp,
      withdrawal_address: withdrawAddress,
      amount: withdrawAmount,
      email_or_phone: emailId,
      chain: network,
      coinName: selectedCurrency?.short_name,
      usdt_balance: availableBalance
    };
    Keyboard.dismiss();
    dispatch(withdrawCoin(data));
  };

  const _updateAnnouncementSections = (activeSections) => {
    setActiveAnnouncementSections(activeSections);
  };

  const _renderAnnouncementHeader = (section, index, isActive) => {
    return (
      <View
        style={[
          styles.faqHeader,
          styles.withdrawAnnouncementHeaderInner,
          {
            backgroundColor: isDark ? "#1A1A1A" : "#F5F5F5",
            borderColor: isDark ? themeColors.border : "#EEE",
          },
        ]}
      >
        <View style={{ flex: 1 }}>
          <AppText weight={SEMI_BOLD} type={THIRTEEN} style={{ marginBottom: 2, color: themeColors.text }}>
            {section.title}
          </AppText>
          <AppText color={DISCLAIMTEXT} type={TEN}>
            {section.date}
          </AppText>
        </View>
        <AppText weight={SEMI_BOLD} color={themeColors.text} type={FOURTEEN}>
          {isActive ? "−" : "+"}
        </AppText>
      </View>
    );
  };

  const _renderAnnouncementContent = (section) => {
    return (
      <View
        style={[
          styles.faqContent,
          styles.withdrawAnnouncementContentInner,
          {
            backgroundColor: isDark ? themeColors.background : "#FFFFFF",
            borderColor: isDark ? themeColors.border : "#EEE",
          },
        ]}
      >
        <AppText color={themeColors.secondaryText} type={TEN} style={[styles.faqText, { lineHeight: 18 }]}>
          {section.content}
        </AppText>
      </View>
    );
  };

  const withdrawFormHeaderTitle =
    selectedCurrency?.short_name != null && String(selectedCurrency.short_name || "").length > 0
      ? `Withdraw ${selectedCurrency.short_name}`
      : "Withdraw";

  const hasSelectedCoin = selectedCurrency && Object.keys(selectedCurrency).length > 0;
  const networkFeeDisplay = valueForChain(selectedCurrency, "withdrawal_fee", network) ?? "—";

  const withdrawNetworkSheetOnly = (
    <RBSheet
      ref={networkSheetRef}
      height={SHEET_HEIGHT}
      closeOnDragDown
      closeOnPressMask
      customStyles={{
        container: {
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          backgroundColor: themeColors.background,
        },
        wrapper: { backgroundColor: "rgba(0,0,0,0.6)" },
        draggableIcon: { backgroundColor: colors.textGray },
      }}
    >
      <View style={styles.networkSheetInner}>
        <AppText weight={SEMI_BOLD} type={SIXTEEN} style={[styles.networkSheetTitle, { color: themeColors.text }]}>
          Choose Network
        </AppText>
        <ScrollView style={styles.networkSheetScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {sheetWithdrawChains.map((chainKey, idx) => {
            const src = selectedCurrency;
            const minW = valueForChain(src, "min_withdrawal", chainKey);
            const maxW = valueForChain(src, "max_withdrawal", chainKey);
            const feeW = valueForChain(src, "withdrawal_fee", chainKey);
            const fullName = String(
              src?.chain_full_names?.[chainKey] || src?._chain_full_name?.[chainKey] || ""
            ).trim();
            return (
              <TouchableOpacity
                key={`${chainKey}-${idx}`}
                style={[styles.networkCard, { borderColor: isDark ? themeColors.border : "#EEE" }]}
                onPress={() => handleNetworkChosenFromSheet(chainKey)}
                activeOpacity={0.75}
              >
                <View style={styles.networkCardTitleRow}>
                  <AppText weight={SEMI_BOLD} type={FOURTEEN} style={{ color: themeColors.text }}>
                    {chainKey}
                  </AppText>
                  <AppText type={TWELVE} color={colors.textGray} style={{ flex: 1, marginLeft: 8 }}>
                    {src?.name || src?.short_name} · {fullName || chainKey}
                  </AppText>
                </View>
                <AppText type={TEN} color={colors.textGray} style={styles.networkCardLine}>
                  Min. withdrawal: {minW ?? "—"} {src?.short_name}
                </AppText>
                <AppText type={TEN} color={colors.textGray} style={styles.networkCardLine}>
                  Max. withdrawal: {maxW ?? "—"} {src?.short_name}
                </AppText>
                <AppText type={TEN} color={colors.textGray} style={styles.networkCardLine}>
                  Withdrawal fee: {feeW ?? "—"} {src?.short_name}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <View style={[styles.networkSheetNotice, { backgroundColor: isDark ? "#2A2418" : "#fff5ea" }]}>
          <FastImage source={INFO} style={styles.networkSheetNoticeIcon} resizeMode="contain" tintColor={colors.textGray} />
          <AppText type={TEN} color={colors.textGray} style={{ flex: 1, lineHeight: 16 }}>
            The withdrawal address must support the network you pick. Wrong network can lead to permanent loss if the destination cannot recover funds.
          </AppText>
        </View>
      </View>
    </RBSheet>
  );

  const withdrawCoinSheetOnly = (
    <RBSheet
      ref={coinSheetRef}
      height={SHEET_HEIGHT}
      closeOnDragDown
      closeOnPressMask
      customStyles={{
        container: {
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          backgroundColor: themeColors.background,
        },
        wrapper: { backgroundColor: "rgba(0,0,0,0.6)" },
        draggableIcon: { backgroundColor: colors.textGray },
      }}
    >
      <View style={{ flex: 1, minHeight: 0 }}>
        <AppText weight={SEMI_BOLD} type={SIXTEEN} style={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 2, color: themeColors.text }}>
          Select coin
        </AppText>
        <WithdrawCoinPickerPanel
          coins={withdrawCoinsList}
          onSelect={handleSelectCurrency}
          loading={withdrawCoinsLoading}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      </View>
    </RBSheet>
  );

  const withdrawAgceCountrySheetOnly = (
    <RBSheet
      ref={agceCountrySheetRef}
      height={AGCE_COUNTRY_SHEET_HEIGHT}
      closeOnDragDown
      closeOnPressMask
      customStyles={{
        container: {
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          backgroundColor: themeColors.background,
        },
        wrapper: { backgroundColor: "rgba(0,0,0,0.6)" },
        draggableIcon: { backgroundColor: colors.textGray },
      }}
    >
      <View style={styles.agceCountrySheetInner}>
        <AppText weight={SEMI_BOLD} type={SIXTEEN} style={{ color: themeColors.text, marginBottom: 12 }}>
          Select country
        </AppText>
        <ScrollView style={styles.agceCountrySheetScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {AGCE_PHONE_COUNTRIES.map((c, idx) => {
            const selected = agcePhoneCountry.code === c.code;
            return (
              <TouchableOpacity
                key={c.code}
                style={[
                  styles.agceCountrySheetRow,
                  {
                    borderBottomWidth: idx < AGCE_PHONE_COUNTRIES.length - 1 ? StyleSheet.hairlineWidth : 0,
                    borderBottomColor: isDark ? themeColors.border : "#00000018",
                  },
                ]}
                onPress={() => {
                  setAgcePhoneCountry(c);
                  agceCountrySheetRef.current?.close();
                }}
                activeOpacity={0.75}
              >
                <AppText type={FOURTEEN}>{c.flag}</AppText>
                <AppText type={THIRTEEN} weight={SEMI_BOLD} style={{ marginLeft: 10, color: themeColors.text, minWidth: 44 }}>
                  {c.code}
                </AppText>
                <AppText type={TWELVE} color={themeColors.secondaryText} style={{ marginLeft: 8, flex: 1 }}>
                  {c.label}
                </AppText>
                {selected ? (
                 <FastImage source={checkIc} style={{width:12,height:12,right:5}} resizeMode="contain"/>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </RBSheet>
  );

  return (
    <AppSafeAreaView style={{ flex: 1, backgroundColor: themeColors.background }}>
      <View style={[styles.headerView, { paddingHorizontal: 16 }]}>
        <TouchableOpacity onPress={handleHeaderBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <FastImage source={back_ic} resizeMode="contain" style={{ width: 16, height: 16 }} tintColor={themeColors.text} />
        </TouchableOpacity>
        <AppText color={themeColors.text} weight={SEMI_BOLD} type={SIXTEEN}>
          {withdrawFormHeaderTitle}
        </AppText>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <TouchableOpacity
            onPress={() => {
              setFaqActiveIndex(null);
              setShowWithdrawFaqModal(true);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <FastImage source={INFO} resizeMode="contain" style={{ width: 18, height: 18 }} tintColor={themeColors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => NavigationService.navigate("Wallet_History")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <FastImage source={printIcon} resizeMode="contain" style={{ width: 20, height: 17 }} tintColor={themeColors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyBoardAware
        style={{ flex: 1 }}
        containerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeColors.text} />}
      >
        <AppText type={FOURTEEN} weight={SEMI_BOLD} style={[styles.withdrawPageTitle, { color: themeColors.text }]}>
          Withdraw Crypto
        </AppText>

        {/* Web `WithdrawPageSteps12`: step badges + sections — no vertical rail (per product request). */}
        <View style={styles.wdStepBlock}>
          <View style={[styles.wdStepHeaderRow, { marginTop: 10 }]}>

            <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text }}>
              Select Coin
            </AppText>
          </View>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={openCoinPickerSheet}
            style={[
              styles.wdCoinPickerRow,
              {
                borderColor: isDark ? themeColors.border : "#EEE",
                backgroundColor: hasSelectedCoin
                  ? (isDark ? themeColors.card : themeColors.background)
                  : (isDark ? themeColors.card : "#F0F0F0"),
              },
            ]}
          >
            <FastImage
              source={searchIcon}
              style={{ width: 16, height: 16, marginRight: 8 }}
              resizeMode="contain"
              tintColor={colors.textGray}
            />
            {hasSelectedCoin ? (
              <View style={{ flex: 1, flexDirection: "row", alignItems: "center", minWidth: 0 }}>
                <View style={{ borderRadius: 50, overflow: "hidden", marginRight: 10 }}>
                  <FastImage source={selectedCurrencyIconSource} style={{ width: 25, height: 25 }} resizeMode="contain" />
                </View>
                <View style={{ flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center" }}>
                  <AppText weight={SEMI_BOLD} type={TWELVE} numberOfLines={1} style={{ color: themeColors.text }}>
                    {selectedCurrency?.short_name || "—"}
                  </AppText>
                  <AppText type={TEN} color={DISCLAIMTEXT} numberOfLines={1} style={{ marginLeft: 8, flexShrink: 1 }}>
                    {selectedCurrency?.name}
                  </AppText>
                </View>
              </View>
            ) : (
              <AppText type={FOURTEEN} color={themeColors.secondaryText} style={{ flex: 1 }}>
                Select a coin
              </AppText>
            )}
            <FastImage source={downIcon} style={{ width: 12, height: 12, marginLeft: 8 }} resizeMode="contain" tintColor={themeColors.secondaryText} />
          </TouchableOpacity>
          {withdrawCoinsList.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.wdChipsRow}>
              {withdrawCoinsList.slice(0, 10).map((coin, ix) => {
                const chipIconUri = buildCoinImageUri(coin);
                const isSel =
                  (selectedCurrency?._id != null && coin?._id != null && String(selectedCurrency._id) === String(coin._id)) ||
                  String(selectedCurrency?.short_name || "").toUpperCase() === String(coin?.short_name || "").toUpperCase();
                return (
                  <TouchableOpacity
                    key={String(coin?._id ?? coin?.id ?? coin?.currency_id ?? coin?.short_name ?? ix)}
                    style={[
                      styles.wdChip,
                      {
                        borderColor: isSel ? colors.buttonBg : (isDark ? themeColors.border : "#EEE"),
                        backgroundColor: isSel ? (isDark ? "#2A2A2A" : "#FFF9E6") : "transparent",
                      },
                    ]}
                    onPress={() => handleSelectCurrency(coin)}
                  >
                    <FastImage
                      source={chipIconUri ? { uri: chipIconUri } : bitcoinIcon}
                      style={{ width: 18, height: 18, borderRadius: 9 }}
                      resizeMode="cover"
                    />
                    <AppText type={TEN} weight={SEMI_BOLD} style={{ color: themeColors.text, marginLeft: 6 }}>
                      {coin?.short_name}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : null}
        </View>

        <View style={styles.wdStepBlock}>
          <View style={styles.wdStepHeaderRow}>
            {/* <View style={[styles.wdStepBadge, { borderColor: isDark ? themeColors.border : "#CCC" }]}>
                <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: themeColors.text }}>
                  2
                </AppText>
              </View> */}
            <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text }}>
              Withdraw to
            </AppText>
          </View>

          <View style={[styles.wdTabsRow, { borderBottomColor: isDark ? themeColors.border : "#EEE", marginTop: 5 }]}>
            <TouchableOpacity
              onPress={() => {
                setWithdrawToTab("address");
                agceCountrySheetRef.current?.close();
              }}
              style={styles.wdTabWrap}
            >
              <AppText
                type={THIRTEEN}
                weight={withdrawToTab === "address" ? SEMI_BOLD : undefined}
                style={{ color: withdrawToTab === "address" ? themeColors.text : themeColors.secondaryText }}
              >
                Address
              </AppText>
              {withdrawToTab === "address" ? <View style={[styles.wdTabUnderline, { backgroundColor: colors.buttonBg }]} /> : null}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setWithdrawToTab("agce_user");
                setAgceRecipientTab("email");
              }}
              style={styles.wdTabWrap}
            >
              <AppText
                type={THIRTEEN}
                weight={withdrawToTab === "agce_user" ? SEMI_BOLD : undefined}
                style={{ color: withdrawToTab === "agce_user" ? themeColors.text : themeColors.secondaryText }}
              >
                AGCE User
              </AppText>
              {withdrawToTab === "agce_user" ? <View style={[styles.wdTabUnderline, { backgroundColor: colors.buttonBg }]} /> : null}
            </TouchableOpacity>
          </View>

          {withdrawToTab === "address" ? (
            <>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={openWithdrawNetworkSheet}
                disabled={activeWithdrawChains.length === 0}
                style={[
                  styles.wdNetworkPickerRow,
                  {
                    borderColor: isDark ? themeColors.border : "#EEE",
                    backgroundColor: isDark ? themeColors.card : themeColors.background,
                    opacity: activeWithdrawChains.length === 0 ? 0.55 : 1,
                  },
                ]}
              >
                <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: themeColors.text, flex: 1 }}>
                  {network ? String(network).toUpperCase() : "Select Network"}
                </AppText>
                <FastImage source={downIcon} style={{ width: 12, height: 12 }} resizeMode="contain" tintColor={themeColors.secondaryText} />
              </TouchableOpacity>

              {Object.keys(selectedCurrency).length > 0 && activeWithdrawChains.length === 0 ? (
                <AppText type={TEN} color={DISCLAIMTEXT} style={{ marginTop: 8 }}>
                  No active withdrawal networks for this asset.
                </AppText>
              ) : null}

              {Object.keys(selectedCurrency).length > 0 && !network && activeWithdrawChains.length > 0 ? (
                <AppText type={TWELVE} color={themeColors.secondaryText} style={{ marginTop: 8, lineHeight: 17 }}>
                  Select a network, then enter the withdrawal address.
                </AppText>
              ) : null}

              {!!network && (
                <>
                  <View
                    style={[
                      styles.wdAddressComposite,
                      {
                        borderColor: isDark ? themeColors.border : "#EEE",
                        backgroundColor: isDark ? themeColors.card : themeColors.input,
                      },
                    ]}
                  >
                    <TextInput
                      style={[styles.wdAddressField, { color: themeColors.text,fontSize:12 }]}
                      placeholder="Enter Address"
                      placeholderTextColor={themeColors.secondaryText}
                      value={withdrawAddress}
                      onChangeText={(value) => handleWithdrawalAddress(value)}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      onPress={() => NavigationService.navigate("Wallet_History")}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={styles.wdAddressBookHit}
                      accessibilityLabel="Withdrawal history"
                    >
                      <FastImage source={user_withdarwal} style={{ width: 16, height: 16 }} resizeMode="contain" tintColor={themeColors.secondaryText} />
                    </TouchableOpacity>
                  </View>
                  {!isValidWalletAddress && String(withdrawAddress || "").trim().length > 0 ? (
                    <AppText weight={SEMI_BOLD} type={TEN} style={{ color: "#DE7520", marginTop: 4 }}>
                      Invalid wallet address for the selected network!
                    </AppText>
                  ) : null}

                  {Object.keys(selectedCurrency).length > 0 ? (
                    <>
                      <AppText style={[styles.withdrawSectionTitle, { marginTop: 12 }]} type={FOURTEEN} weight={SEMI_BOLD} color={themeColors.text}>
                        Withdrawal Amount
                      </AppText>
                      <Input
                        placeholder={`Minimal ${chainMinWithdrawal ?? 0}`}
                        keyboardType="numeric"
                        value={withdrawAmount}
                        onChangeText={(value) => setWithdrawAmount(value)}
                        max
                        onMax={handleMaxWithdrawal}
                        currency={selectedCurrency?.short_name}
                        inputStyle={{fontSize:12}}
                      />
                      {!!withdrawAmount &&
                        parseNum(withdrawAmount, 0) > 0 &&
                        (parseNum(availableBalance, 0) < chainWithdrawalFee ||
                          parseNum(withdrawAmount, 0) > parseNum(availableBalance, 0)) && (
                          <AppText weight={SEMI_BOLD} type={TEN} style={{ color: "red", marginTop: 4 }}>
                            Insufficient funds
                          </AppText>
                        )}

                      <View style={[styles.withdrawSummaryCard, { borderColor: isDark ? themeColors.border : "#EEE", marginTop: 8 }]}>
                        <View style={styles.withdrawSummaryRow}>
                          <AppText type={TWELVE} style={{ color: themeColors.secondaryText }}>Available withdraw</AppText>
                          <AppText weight={SEMI_BOLD} type={THIRTEEN} style={{ color: themeColors.text }}>
                            {availableBalance} {selectedCurrency?.short_name}
                          </AppText>
                        </View>
                        <View style={styles.withdrawSummaryRow}>
                          <AppText type={TWELVE} style={{ color: themeColors.secondaryText }}>24h remaining limit</AppText>
                          <AppText weight={SEMI_BOLD} type={THIRTEEN} style={{ color: themeColors.text }}>
                            {String(network || "").toUpperCase()} · — / —
                          </AppText>
                        </View>
                        <View style={styles.withdrawSummaryRow}>
                          <AppText type={TWELVE} style={{ color: themeColors.secondaryText }}>Fee</AppText>
                          <AppText weight={SEMI_BOLD} type={THIRTEEN} style={{ color: themeColors.text }}>
                            {networkFeeDisplay} {selectedCurrency?.short_name}
                          </AppText>
                        </View>
                        <View style={styles.withdrawSummaryRow}>
                          <AppText type={TWELVE} style={{ color: themeColors.secondaryText }}>Max withdraw</AppText>
                          <AppText weight={SEMI_BOLD} type={THIRTEEN} style={{ color: themeColors.text }}>
                            {chainMaxWithdrawal ?? "—"} {selectedCurrency?.short_name}
                          </AppText>
                        </View>
                        <View style={[styles.withdrawSummaryRow, styles.withdrawSummaryRowLast]}>
                          <AppText type={TWELVE} style={{ color: themeColors.secondaryText }}>Receive amount</AppText>
                          <AppText weight={SEMI_BOLD} type={THIRTEEN} style={{ color: themeColors.text }}>
                            {withdrawAmount && parseNum(withdrawAmount, 0) > 0 && isValidWalletAddress
                              ? `${parseFloat(withdrawAmount) - chainWithdrawalFee < 0 ? 0 : parseFloat(withdrawAmount) - chainWithdrawalFee || "—"} ${selectedCurrency?.short_name || ""}`.trim()
                              : `-- ${selectedCurrency?.short_name || ""}`.trim()}
                          </AppText>
                        </View>
                      </View>
                      <TouchableOpacity activeOpacity={0.7} style={{ alignSelf: "flex-end", marginTop: 6 }} onPress={() => {}}>
                        <AppText type={TEN} color={YELLOW} weight={SEMI_BOLD}>
                          Network fee {networkFeeDisplay} {selectedCurrency?.short_name} &gt;
                        </AppText>
                      </TouchableOpacity>
                    </>
                  ) : null}

                  {Object.keys(selectedCurrency).length > 0 && isValidWalletAddress && withdrawAddress && withdrawAmount ? (
                    <>
                      <AppText style={styles.withdrawSectionTitle} type={FOURTEEN} weight={SEMI_BOLD} color={themeColors.text}>
                        OTP Verification
                      </AppText>
                      <Input
                        placeholder="Get Code"
                        value={otp}
                        onChangeText={(text) => setOtp(text)}
                        keyboardType="numeric"
                        isOtp
                        onSendOtp={handleGetOtp}
                        otpText={disableBtn ? `Resend OTP (${timer}s)` : otpText}
                      />
                    </>
                  ) : null}

                  {Object.keys(selectedCurrency).length > 0 &&
                    isValidWalletAddress &&
                    withdrawAddress &&
                    withdrawAmount &&
                    !emailId ? (
                      <AppText
                        weight={SEMI_BOLD}
                        type={TEN}
                        style={{ color: "#DE7520", marginTop: 6 }}
                        onPress={() => NavigationService.navigate(SETTING_SCREEN_New)}
                      >
                        Please Update Email ID first &gt;
                      </AppText>
                    ) : null}

                  <View
                    style={[
                      styles.wdWebScamNotice,
                      {
                        backgroundColor: isDark ? themeColors.card : "#F5F5F5",
                        borderColor: isDark ? themeColors.border : "#E8E8E8",
                      },
                    ]}
                  >
                    <AppText type={TEN} color={themeColors.secondaryText} style={{ lineHeight: 16 }}>
                      * Beware of scams! AGCE will never ask for personal information or private transfers. To protect your assets, do not click unknown links.
                    </AppText>
                  </View>

                  <Button
                    children="Withdrawal"
                    containerStyle={{ marginVertical: 12 }}
                    disabled={
                      !hasSelectedCoin ||
                      withdrawToTab !== "address" ||
                      !network ||
                      !withdrawAddress ||
                      !isValidWalletAddress ||
                      !emailId ||
                      !withdrawAmount ||
                      !otp ||
                      parseFloat(withdrawAmount) > parseFloat(availableBalance) ||
                      parseFloat(availableBalance) < chainWithdrawalFee
                    }
                    onPress={handleWithdraw}
                  />
                </>
              )}
            </>
          ) : (
            <View style={{ marginTop: 4 }}>
              <View style={styles.wdAgcePillsRow}>
                {[
                  { key: "email", label: "Email" },
                  { key: "phone", label: "Phone" },
                  { key: "agce", label: "AGCE User" },
                ].map(({ key, label }) => {
                  const active = agceRecipientTab === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      onPress={() => {
                        setAgceRecipientTab(key);
                        agceCountrySheetRef.current?.close();
                      }}
                      activeOpacity={0.75}
                      style={[
                        styles.wdAgcePill,
                        {
                          // borderColor: active ? colors.buttonBg : (isDark ? themeColors.border : "#E0E0E0"),
                          backgroundColor: active ? lightTheme.input : null,
                        },
                      ]}
                    >
                      <AppText type={TWELVE} weight={active ? SEMI_BOLD : undefined} style={{ color: active ? themeColors.text : themeColors.secondaryText }}>
                        {label}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {agceRecipientTab === "email" ? (
                <View style={{ marginTop: 10 }}>
                  <Input
                    placeholder="Recipient's email"
                    value={agceRecipientEmail}
                    onChangeText={setAgceRecipientEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    inputStyle={{ fontSize: 12 }}
                  />
                </View>
              ) : null}

              {agceRecipientTab === "phone" ? (
                <View style={[styles.wdAgcePhoneWrap, { marginTop: 10 }]}>
                  <View style={[styles.wdAgcePhoneRow, { borderColor: isDark ? themeColors.border : "#EEE", backgroundColor: lightTheme.input }]}>
                    <TouchableOpacity
                      onPress={openAgceCountrySheet}
                      style={[styles.wdAgceCountryBtn, { borderColor: isDark ? themeColors.border : "#EEE" }]}
                    >
                      <AppText type={TWELVE}>{agcePhoneCountry.flag}</AppText>
                      <AppText type={TWELVE} weight={SEMI_BOLD} style={{ marginLeft: 6, color: themeColors.text }}>
                        {agcePhoneCountry.code}
                      </AppText>
                      <FastImage source={downIcon} style={{ width: 12, height: 12, marginLeft: 4 }} resizeMode="contain" tintColor={themeColors.secondaryText} />
                    </TouchableOpacity>
                    <TextInput
                      style={[
                        styles.wdAgcePhoneInput,
                        { color: themeColors.text, backgroundColor: lightTheme.input, fontSize: 12 },
                      ]}
                      placeholder="Recipient's phone number"
                      placeholderTextColor={themeColors.secondaryText}
                      value={agceRecipientPhoneLocal}
                      onChangeText={setAgceRecipientPhoneLocal}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>
              ) : null}

              {agceRecipientTab === "agce" ? (
                <View style={{ marginTop: 10 }}>
                  <Input
                    placeholder="Recipient's AGCE username or UID"
                    value={agceRecipientId}
                    onChangeText={setAgceRecipientId}
                    autoCapitalize="none"
                    autoCorrect={false}
                    inputStyle={{fontSize:12}}
                  />
                  {/* <AppText type={TEN} color={themeColors.secondaryText} style={{ marginTop: 8, lineHeight: 16 }}>
                    Payee can find AGCE ID under Top-right Avatar → Dashboard.
                  </AppText> */}
                </View>
              ) : null}

              {/* <AppText type={TEN} color={DISCLAIMTEXT} style={{ marginTop: 14, lineHeight: 16 }}>
                AGCE User transfers are completed on the web app. On mobile, use the Address tab for on-chain withdrawal.
              </AppText> */}
            </View>
          )}
        </View>

        {formattedAnnouncements?.length > 0 && (
          <View style={styles.withdrawAnnouncementsBlock}>
            <View style={styles.withdrawAnnouncementsHeader}>
              <AppText type={FOURTEEN} weight={SEMI_BOLD} color={themeColors.text}>
                Announcements
              </AppText>
              <TouchableOpacity onPress={() => NavigationService.navigate(NOTIFICATION_SCREEN)} hitSlop={8}>
                <AppText type={THIRTEEN} color={YELLOW}>More &gt;</AppText>
              </TouchableOpacity>
            </View>
            <Accordion
              sections={formattedAnnouncements}
              activeSections={activeAnnouncementSections}
              renderHeader={_renderAnnouncementHeader}
              renderContent={_renderAnnouncementContent}
              onChange={_updateAnnouncementSections}
              underlayColor={colors.transparent}
              containerStyle={{ gap: 8 }}
            />
          </View>
        )}

      </KeyBoardAware>

      {withdrawNetworkSheetOnly}
      {withdrawCoinSheetOnly}
      {withdrawAgceCountrySheetOnly}

      <Modal visible={showWithdrawFaqModal} animationType="slide" transparent onRequestClose={() => setShowWithdrawFaqModal(false)}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: themeColors.background, borderColor: isDark ? themeColors.border : "#EEE", borderWidth: 1 },
            ]}
          >
            <View style={styles.modalHeader}>
              <AppText weight={SEMI_BOLD} type={SIXTEEN} style={{ color: themeColors.text }}>
                Withdraw help
              </AppText>
              <TouchableOpacity onPress={() => setShowWithdrawFaqModal(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <AppText type={TWENTY} style={{ color: themeColors.text }}>
                  ×
                </AppText>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {faqData.map((item, index) => (
                <View
                  key={String(index)}
                  style={[
                    styles.faqItemInner,
                    index === faqData.length - 1 && styles.faqItemInnerLast,
                    { borderColor: isDark ? themeColors.border : colors.inputBorder },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.faqQuestionRow}
                    onPress={() => setFaqActiveIndex(faqActiveIndex === index ? null : index)}
                    activeOpacity={0.7}
                  >
                    <AppText type={THIRTEEN} weight={SEMI_BOLD} style={[styles.faqQuestion, { color: themeColors.secondaryText }]}>
                      {item.title}
                    </AppText>
                    <FastImage
                      source={faqActiveIndex === index ? upIcon : downIcon}
                      resizeMode="contain"
                      style={styles.faqArrow}
                      tintColor={themeColors.secondaryText}
                    />
                  </TouchableOpacity>
                  {faqActiveIndex === index && (
                    <View style={styles.faqAnswer}>
                      {item.content.split("\n").map((line, lineIndex) => (
                        <AppText key={lineIndex} type={TWELVE} style={{ color: themeColors.secondaryText, lineHeight: 18 }}>
                          {line}
                        </AppText>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </AppSafeAreaView>
  );
};

export default WithdrawWallet;

const styles = StyleSheet.create({
  headerView: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  withdrawPageTitle: {
    marginTop: 8,
    marginBottom: 8,
  },
  wdStepBlock: {
    marginBottom: 14,
  },
  wdStepHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 10,

  },
  wdStepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  wdStepBadgeDone: {},
  wdCoinPickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  wdTabsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
    gap: 20,
  },
  wdTabWrap: {
    paddingBottom: 8,
    minWidth: 72,
    position: "relative",
  },
  wdTabUnderline: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
    borderRadius: 1,
  },
  wdNetworkPickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  wdChipsRow: {
    paddingTop: 10,
    paddingBottom: 4,
    alignItems: "center",
    paddingRight: 8,
  },
  wdChip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 8,
  },
  wdAddressComposite: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    minHeight: 48,
    marginTop: 10,
    overflow: "hidden",
  },
  wdAddressField: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  wdAddressBookHit: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  wdWebScamNotice: {
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  wdAgcePillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  wdAgcePill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    // borderWidth: 1,
  },
  wdAgcePhoneWrap: {
    position: "relative",
  },
  wdAgcePhoneRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden",
    minHeight: 48,
  },
  wdAgceCountryBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "#00000022",
  },
  wdAgcePhoneInput: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
  },
  agceCountrySheetInner: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  agceCountrySheetScroll: {
    flexGrow: 0,
  },
  agceCountrySheetRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  withdrawAssetCard: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden",
  },
  withdrawNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "transparent",
  },
  withdrawCardDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 0,
  },
  withdrawNetworkBlock: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  withdrawSectionTitle: {
    marginTop: 14,
    marginBottom: 6,
  },
  withdrawNoticeBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 2,
  },
  withdrawNoticeIcon: {
    width: 18,
    height: 18,
    marginTop: 1,
  },
  withdrawSummaryCard: {
    borderWidth: 1,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  withdrawSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(128,128,128,0.2)",
  },
  withdrawSummaryRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 2,
  },
  withdrawAnnouncementsBlock: {
    marginTop: 18,
    marginBottom: 12,
  },
  withdrawAnnouncementsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  withdrawAnnouncementHeaderInner: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 0,
    borderRadius: 8,
  },
  withdrawAnnouncementContentInner: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalList: {
    maxHeight: 400,
  },
  networkSheetInner: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  networkSheetTitle: {
    marginBottom: 12,
  },
  networkSheetScroll: {
    maxHeight: SHEET_HEIGHT - 168,
  },
  networkCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  networkCardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  networkCardLine: {
    marginTop: 4,
  },
  networkSheetNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 10,
    marginTop: 4,
    marginBottom: 20,
  },
  networkSheetNoticeIcon: {
    width: 18,
    height: 18,
    marginRight: 10,
    marginTop: 2,
  },
  searchView: {
    flexDirection: "row",
    // justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EEE",
    width: "100%",
    borderRadius: 10,
    height: 58,
    marginRight: 10
  },
  networkView: {
    borderWidth: 1,
    borderColor: "#EEE",
    marginTop: 20,
    padding: 15,
    borderRadius: 10,
  },
  chainView: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    overflow: "hidden"
  },
  addressView: {
    borderWidth: 1,
    borderColor: "#EEE",
    padding: 12,
    borderRadius: 10,
    marginTop: 10
  },
  nameView: {
    // borderColor: "#D4D4D4",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    // padding: 20,
    padding: 15,
    borderRadius: 10,
    backgroundColor: "transparent",
    // gap: 10
  },
  faqSectionWrap: {
    marginTop: 30,
    marginBottom: 20,
  },
  faqSectionCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    overflow: "hidden",
  },
  faqSectionCardTitle: {
    marginBottom: 8,
  },
  faqListWrap: {},
  faqScrollContent: { paddingBottom: 8 },
  faqItemInner: {
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(128,128,128,0.15)",
  },
  faqItemInnerLast: { borderBottomWidth: 0 },
  faqQuestionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  faqQuestion: { flex: 1 },
  faqArrow: { width: 10, height: 10, marginLeft: 8 },
  faqAnswer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(128,128,128,0.2)",
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderRadius: 8,
    marginBottom: 5,
  },
  faqContent: {
    padding: 15,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    marginBottom: 10,
  },
  faqText: {
    lineHeight: 20,
  },
  announcementsContainer: {
    maxHeight: 200,
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
  },
  announcementItem: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
});
