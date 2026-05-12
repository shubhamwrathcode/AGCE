import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Keyboard,
  ScrollView,
  RefreshControl,
  Modal,
  Pressable,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import RBSheet from "react-native-raw-bottom-sheet";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

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
  MEDIUM,
  BOLD,
  EIGHTEEN,
} from "../../shared";
import KeyBoardAware from "../../shared/components/KeyboardAware";
import WithdrawRecentHistory from "./WithdrawRecentHistory";
import Accordion from "react-native-collapsible/Accordion";
import {
  back_ic,
  moreOption,
  printIcon,
  INFO,
  upIcon,
  downIcon,
  searchIcon,
  checkIc,
  user_withdarwal,
  SECURITY_SHEIELD,
  EMAIL_VERIFY,
  PHONE_VERIFY,
  GOOGLE_VERIFY,
  PASSKEY_VERIFY,
  LOCKED,
  bitcoinIcon,
  email_vector,
  editIcon,
  binIcon,
  REMOVE,
} from "../../helper/ImageAssets";
import * as routes from '../../navigation/routes';
import NavigationService from "../../navigation/NavigationService";
import FastImage from "react-native-fast-image";
import { colors, lightTheme } from "../../theme/colors";
import AddWithdrawalAddressBasics from "./components/WithdrawAddress/AddWithdrawalAddressBasics";
import AddWithdrawalAddressVerification from "./components/WithdrawAddress/AddWithdrawalAddressVerification";
import { useTheme } from "../../hooks/useTheme";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useDispatch } from "react-redux";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { buildCoinImageUri } from "../../helper/coinIconUrl";
import { SETTING_SCREEN_New, NOTIFICATION_SCREEN } from "../../navigation/routes";
import { useAppSelector } from "../../store/hooks";
import {
  getWithdrawActiveCoins,
  getUserMainWallet,
  withdrawCoin,
  verifyWithdraw,
  getInteralWalletHistory,
} from "../../actions/walletActions";
import { showError, showSuccess } from "../../helper/logger";
import {
  getActiveWithdrawChainKeys,
  networkKeysFromChain,
  parseNum,
  valueForChain,
  canonicalWithdrawalChainForValidateAddress,
  formatWithdrawAmountDisplay,
  formatFundAvailableFromRow,
  totalSpendableFromFundRow,
  CHAIN_FULL_NAMES,
  WITHDRAW_NETWORK_LABELS
} from "../../helper/walletChainHelpers";
import { appOperation } from "../../appOperation";
import { CUSTOMER_TYPE } from "../../appOperation/types";
import { getNotificationList } from "../../actions/homeActions";
import moment from "moment";
import { countriesList } from "../../helper/CountriesList";
import WithdrawCoinPickerPanel from "./WithdrawCoinPickerPanel";

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

const ADDRESS_BOOK_TOP_EXCHANGES = [
  { value: "BINANCE", label: "Binance" },
  { value: "COINBASE", label: "Coinbase" },
  { value: "KRAKEN", label: "Kraken" },
  { value: "OKX", label: "OKX" },
  { value: "BYBIT", label: "Bybit" },
  { value: "KUCOIN", label: "KuCoin" },
  { value: "BITFINEX", label: "Bitfinex" },
  { value: "CRYPTOCOM", label: "Crypto.com" },
];

const ADDRESS_BOOK_EXCHANGE_OTHER = "__OTHER__";



const TRENDING_COIN_SYMBOLS = [
  "BTC",
  "ETH",
  "BNB",
  "USDT",
  "USDC",
  "XRP",
  "SOL",
  "DOGE",
  "MATIC",
  "DOT",
  "LTC",
  "TRX",
  "SHIB",
  "ADA",
  "BUSD",
];

function coinSymbol(coin) {
  return String(
    coin?.short_name || coin?.symbol || coin?.name || coin?.coin || coin?.currency || coin?.token || ""
  ).trim() || "—";
}

function isWithdrawChainActive(coin, code) {
  const statusMap = coin.withdrawal_status || coin.withdraw_status || coin.withdrawStatus || null;
  const w = statusMap && statusMap[code];
  if (w != null && String(w).trim() !== "") {
    return String(w).toUpperCase() === "ACTIVE";
  }
  return true;
}

function getWithdrawNetworks(coin) {
  if (!coin?.chain?.length) return [];
  const minW = coin.min_withdrawal || coin.min_withdraw || {};
  const maxW = coin.max_withdrawal || coin.max_withdraw || {};
  return coin.chain
    .filter((c) => isWithdrawChainActive(coin, c))
    .map((code) => {
      const tokenAssetId = coin.token_asset_ids?.[code] || "";
      return {
        code,
        label: CHAIN_FULL_NAMES[code] || WITHDRAW_NETWORK_LABELS[code] || code,
        min: minW[code] != null ? String(minW[code]) : "—",
        max: maxW[code] != null ? String(maxW[code]) : "—",
        tokenAssetId,
      };
    });
}

function getWithdrawNetworksOrStaticFallback(coin) {
  if (!coin) return [];
  return getWithdrawNetworks(coin);
}


/** Same stable key as web `withdrawalAddressValidationKey` (useWithdrawPageController). */
function withdrawalAddressValidationKey(net, addr, tokenAssetId) {
  const a = String(addr || "").trim();
  const n = net != null && String(net).trim() ? String(net).trim() : "";
  const t = tokenAssetId != null && String(tokenAssetId).trim() ? String(tokenAssetId).trim() : "";
  if (!n || !a) return "";
  return `${n}::${a}::${t}`;
}

/** Web `withdrawPageShared.jsx` — digits + optional single decimal (withdraw amount field). */
function sanitizeWithdrawAmountRaw(raw) {
  let v = String(raw ?? "").replace(/[^\d.]/g, "");
  const firstDot = v.indexOf(".");
  if (firstDot !== -1) {
    v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, "");
  }
  return v;
}

const WithdrawWallet = () => {
  const dispatch = useDispatch();
  const route = useRoute();
  const { colors: themeColors, isDark } = useTheme();
  const scrollViewRef = useRef(null);
  const routeCoin = route?.params?.data;
  const userData = useAppSelector((state) => state.auth.userData);
  const userMainWallet = useAppSelector((state) => state.wallet.userMainWallet);
  const withdrawActiveCoins = useAppSelector((state) => state.wallet.withdrawActiveCoins);
  const withdrawHistory = useAppSelector((state) => state.wallet.withdrawHistory);
  const interalWalletHistory = useAppSelector((state) => state.wallet.interalWalletHistory);

  const [recentWithdrawTab, setRecentWithdrawTab] = useState("address"); // "address" | "agce"

  useFocusEffect(
    useCallback(() => {
      dispatch(verifyWithdraw({}));
      dispatch(getInteralWalletHistory(0, 10));
    }, [dispatch])
  );

  const withdrawCoinsList = useMemo(
    () => (Array.isArray(withdrawActiveCoins) ? withdrawActiveCoins : []),
    [withdrawActiveCoins]
  );

  /** Web parity: `trendingWithdrawCoins` (useWithdrawPageController). */
  const trendingWithdrawCoins = useMemo(() => {
    if (!withdrawCoinsList.length) return [];
    const bySym = new Map();
    for (const c of withdrawCoinsList) {
      const sym = coinSymbol(c).toUpperCase();
      if (!sym || sym === "—") continue;
      if (!bySym.has(sym)) bySym.set(sym, c);
    }
    const list = [];
    for (const sym of TRENDING_COIN_SYMBOLS) {
      const c = bySym.get(sym);
      if (c) list.push(c);
    }
    return list;
  }, [withdrawCoinsList]);

  /** Web parity: `coinModalDisplay` (useWithdrawPageController). */
  const coinModalDisplay = useMemo(() => {
    if (!trendingWithdrawCoins.length) return withdrawCoinsList;
    const trendSet = new Set(
      trendingWithdrawCoins.map((c) => coinSymbol(c).toUpperCase()).filter(Boolean)
    );
    return [
      ...trendingWithdrawCoins,
      ...withdrawCoinsList.filter((c) => !trendSet.has(coinSymbol(c).toUpperCase())),
    ];
  }, [withdrawCoinsList, trendingWithdrawCoins]);

  /** Web parity: `coinQuickPickDisplay` (useWithdrawPageController ~856-862). */
  const coinQuickPickDisplay = useMemo(() => {
    if (!withdrawCoinsList.length) return [];
    // Mobile main screen has no active search query for this list.
    return coinModalDisplay.slice(0, 5);
  }, [withdrawCoinsList, coinModalDisplay]);


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
  const [agceTouched, setAgceTouched] = useState({ email: false, phone: false });

  const agceErrors = useMemo(() => {
    const err = { email: "", phone: "" };
    const email = agceRecipientEmail.trim();
    if (agceTouched.email) {
      if (!email) err.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) err.email = "Invalid email format";
    }
    const phone = agceRecipientPhoneLocal.trim();
    if (agceTouched.phone) {
      if (!phone) err.phone = "Phone number is required";
      else if (!/^\d+$/.test(phone)) err.phone = "Invalid phone number";
    }
    return err;
  }, [agceRecipientEmail, agceRecipientPhoneLocal, agceTouched]);

  const isAgceFormValid = useMemo(() => {
    if (agceRecipientTab === "email") {
      const email = agceRecipientEmail.trim();
      return email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    if (agceRecipientTab === "phone") {
      const digits = agceRecipientPhoneLocal.trim().replace(/\D/g, "");
      return digits.length >= 6;
    }
    if (agceRecipientTab === "agce") {
      return agceRecipientId.trim().length > 0;
    }
    return false;
  }, [agceRecipientTab, agceRecipientEmail, agceRecipientPhoneLocal, agceRecipientId]);

  const selectedCurrencyIconSource = useMemo(() => {
    const u = buildCoinImageUri(selectedCurrency);
    return u ? { uri: u } : bitcoinIcon;
  }, [selectedCurrency]);
  const [network, setNetwork] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  /** Web `withdrawAmountTouched` — inline errors only after user interacts with amount field. */
  const [withdrawAmountTouched, setWithdrawAmountTouched] = useState(false);
  const [availableBalance, setAvailableBalance] = useState("");
  /** Web parity: `validate-address` API + `withdrawAddressValidatedKey`. */
  const [withdrawAddressValidError, setWithdrawAddressValidError] = useState("");
  const [withdrawAddressValidatedKey, setWithdrawAddressValidatedKey] = useState("");
  /** After an API validate attempt for current input (avoids “invalid” flash during debounce). */
  const [withdrawAddressCheckDone, setWithdrawAddressCheckDone] = useState(false);
  const [isWithdrawAddressValidating, setIsWithdrawAddressValidating] = useState(false);
  const withdrawAddressValidationReqIdRef = useRef(0);

  const [isAddressVerificationReminderOpen, setIsAddressVerificationReminderOpen] = useState(false);
  const saveAddressSheetRef = useRef(null);
  const [saveAddrLabel, setSaveAddrLabel] = useState("");
  const [saveAddrAddress, setSaveAddrAddress] = useState("");
  const [saveAddrMemo, setSaveAddrMemo] = useState("");
  const [saveAddrCoin, setSaveAddrCoin] = useState("USDT");
  const [saveAddrBusy, setSaveAddrBusy] = useState(false);
  const [saveAddrStep, setSaveAddrStep] = useState("form"); // "form" | "owner" | "wallet_type" | "exchange" | "verify_method" | "otp" | "satoshi" | "metamask"
  const [saveAddrOwnership, setSaveAddrOwnership] = useState("SELF"); // "SELF" | "OTHER"
  const [saveAddrWalletType, setSaveAddrWalletType] = useState("SELF_HOSTED"); // "SELF_HOSTED" | "EXCHANGE"
  const [saveAddrExchange, setSaveAddrExchange] = useState("");
  const [saveAddrExchangeSearch, setSaveAddrExchangeSearch] = useState("");
  const [saveAddrExchangeOpen, setSaveAddrExchangeOpen] = useState(false);
  const [saveAddrProofMethod, setSaveAddrProofMethod] = useState("satoshi"); // "satoshi" | "metamask"
  const [saveAddrSatoshiPolling, setSaveAddrSatoshiPolling] = useState(false);
  const [satoshiWhitelistAwaitingProof, setSatoshiWhitelistAwaitingProof] = useState(false);
  const [satoshiDepositLoading, setSatoshiDepositLoading] = useState(false);
  const [satoshiDepositError, setSatoshiDepositError] = useState("");
  const [satoshiResumeMode, setSatoshiResumeMode] = useState(false);
  const [saveAddrVerifyOptions, setSaveAddrVerifyOptions] = useState([]);
  const [selectedSaveAddrVerifyMethod, setSelectedSaveAddrVerifyMethod] = useState("");
  const [saveAddrWhitelistData, setSaveAddrWhitelistData] = useState(null);
  const [saveAddrBenFullName, setSaveAddrBenFullName] = useState("");
  const [saveAddrBenPan, setSaveAddrBenPan] = useState("");
  const [saveAddrBenCountry, setSaveAddrBenCountry] = useState("");
  const [saveAddrBenPin, setSaveAddrBenPin] = useState("");
  const [saveAddrBenAddress, setSaveAddrBenAddress] = useState("");
  const [saveAddrOtp, setSaveAddrOtp] = useState("");
  const [saveAddrVerificationLoading, setSaveAddrVerificationLoading] = useState(false);
  const [saveAddrNetwork, setSaveAddrNetwork] = useState("");
  const [saveAddrCoinOpen, setSaveAddrCoinOpen] = useState(false);
  const [saveAddrNetworkOpen, setSaveAddrNetworkOpen] = useState(false);

  const saveAddrCoinObj = useMemo(() => {
    return withdrawCoinsList.find((c) => {
      const sym = c.coin || c.short_name || c.symbol || "";
      return sym.toUpperCase() === String(saveAddrCoin).toUpperCase();
    });
  }, [withdrawCoinsList, saveAddrCoin]);

  const saveAddrNetworkOptions = useMemo(() => {
    return getWithdrawNetworksOrStaticFallback(saveAddrCoinObj);
  }, [saveAddrCoinObj]);
  const [addressBookEntries, setAddressBookEntries] = useState([]);
  const [addressBookLoading, setAddressBookLoading] = useState(false);
  const withdrawAddrValidateDebounceTimerRef = useRef(null);
  const [saveAddrOtpTimer, setSaveAddrOtpTimer] = useState(0);
  const [saveAddrResendActive, setSaveAddrResendActive] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpText, setOtpText] = useState("Get OTP");
  const [disableBtn, setDisableBtn] = useState(false);
  const [timer, setTimer] = useState(0);
  /** Web: OTP is not on the amount step; it appears after tapping Withdrawal (confirm / verify flow). */
  const [withdrawOtpPhaseActive, setWithdrawOtpPhaseActive] = useState(false);
  const [faqActiveIndex, setFaqActiveIndex] = useState(null);
  const networkSheetRef = useRef(null);
  const coinSheetRef = useRef(null);
  const saveAddrCountrySheetRef = useRef(null);
  const [isWithdrawConfirmOpen, setIsWithdrawConfirmOpen] = useState(false);
  const [isWithdrawSummaryOpen, setIsWithdrawSummaryOpen] = useState(false);
  const withdrawConfirmSheetRef = useRef(null);
  const withdrawSummarySheetRef = useRef(null);
  const withdrawSecuritySheetRef = useRef(null);
  const [showAddressBook, setShowAddressBook] = useState(false);
  const [addressBookSubTab, setAddressBookSubTab] = useState("recent");
  const [recentAddresses, setRecentAddresses] = useState([]);
  const [recentAddressesLoading, setRecentAddressesLoading] = useState(false);
  const [withdrawSummaryContinueBusy, setWithdrawSummaryContinueBusy] = useState(false);
  const [isSecurityVerificationOpen, setIsSecurityVerificationOpen] = useState(false);
  const [withdrawConfirmBusy, setWithdrawConfirmBusy] = useState(false);
  const agceCountrySheetRef = useRef(null);
  const [showWithdrawFaqModal, setShowWithdrawFaqModal] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [activeAnnouncementSections, setActiveAnnouncementSections] = useState([]);
  const notificationList = useAppSelector((state) => state.home.notificationList);

  const [isWithdrawMetaRefreshing, setIsWithdrawMetaRefreshing] = useState(false);
  /** Web `withdraw24hUsage` from `GET /api/v1/wallet/withdrawal-24h-usage?coinName=`. */
  const [withdraw24hUsage, setWithdraw24hUsage] = useState(null);
  const [withdrawAvailSourceOpen, setWithdrawAvailSourceOpen] = useState(false);
  const withdrawLimitInfoSheetRef = useRef(null);
  const networkFeeInfoSheetRef = useRef(null);

  const [withdrawCoinsLoading, setWithdrawCoinsLoading] = useState(() => {
    if (routeCoin && typeof routeCoin === "object" && Object.keys(routeCoin).length > 0) return false;
    return !(withdrawActiveCoins && withdrawActiveCoins.length > 0);
  });

  const addressDeleteSheetRef = useRef(null);
  const [addressToDelete, setAddressToDelete] = useState(null);
  const [addressDeleteBusy, setAddressDeleteBusy] = useState(false);
  const isFirstLoad = useRef(true);
  const [refreshing, setRefreshing] = useState(false);
  /** After user picks a coin from sheet, do not overwrite with default USDT. */
  const userPickedCoinRef = useRef(false);

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

  const openWithdrawCoinSheet = useCallback(() => {
    setTimeout(() => coinSheetRef.current?.open(), 0);
  }, []);

  const handleNetworkChosenFromSheet = useCallback((chainKey) => {
    setNetwork(chainKey);
    setWithdrawAmountTouched(false);
    setWithdrawOtpPhaseActive(false);
    setOtp("");
    setWithdrawAddressValidError("");
    setWithdrawAddressValidatedKey("");
    setWithdrawAddressCheckDone(false);
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

  const mainWalletFundRow = useMemo(() => {
    if (!Array.isArray(userMainWallet) || !selectedCurrency) return null;
    const cid = selectedCurrency._id;
    const sym = String(selectedCurrency.short_name || "").toUpperCase();
    return (
      userMainWallet.find((row) => {
        if (cid && row?.currency_id === cid) return true;
        if (sym && String(row?.short_name || row?.currency || "").toUpperCase() === sym) return true;
        return false;
      }) || null
    );
  }, [userMainWallet, selectedCurrency]);

  /** Web `withdrawStep3Preview` (useWithdrawPageController) — meta row + fee / receive. */
  const withdrawStep3Preview = useMemo(() => {
    const sym = selectedCurrency?.short_name || "—";
    const netCode =
      network && String(network).trim() !== "" ? String(network).toUpperCase() : "—";
    const feeNum = Number.isFinite(chainWithdrawalFee) ? chainWithdrawalFee : null;
    const amt = parseFloat(String(withdrawAmount || "").replace(/,/g, ""));
    const receiveNum =
      feeNum != null && Number.isFinite(amt) && amt > 0 ? Math.max(0, amt - feeNum) : null;
    const netMax = parseNum(valueForChain(selectedCurrency, "max_withdrawal", network), NaN);
    const remaining = Number(withdraw24hUsage?.remaining);
    const limitU = Number(withdraw24hUsage?.limit);
    const usageLine =
      Number.isFinite(remaining) && Number.isFinite(limitU)
        ? `${formatWithdrawAmountDisplay(remaining)} / ${formatWithdrawAmountDisplay(limitU)}`
        : "— / —";
    const fallbackLine =
      Number.isFinite(netMax)
        ? `${formatWithdrawAmountDisplay(netMax)} / ${formatWithdrawAmountDisplay(netMax)}`
        : "— / —";
    const limit24hLine = usageLine !== "— / —" ? usageLine : fallbackLine;
    const parts = String(limit24hLine || "— / —").split("/");
    const limitLeft = (parts[0] || "—").trim();
    const limitRight = (parts.slice(1).join("/") || "—").trim();
    return { networkCode: netCode, limitLeft, limitRight, feeNum, receiveNum, sym, limit24hLine };
  }, [selectedCurrency, network, withdrawAmount, chainWithdrawalFee, withdraw24hUsage]);

  const selectedTokenAssetId = useMemo(() => {
    if (!selectedCurrency || Object.keys(selectedCurrency).length === 0 || !network) return "";
    const fromMap = selectedCurrency?.token_asset_ids?.[network];
    if (fromMap != null && String(fromMap).trim()) return String(fromMap).trim();
    return "";
  }, [selectedCurrency, network]);

  const currentWithdrawAddressValidationKey = useMemo(() => {
    const a = String(withdrawAddress || "").trim();
    const n = String(network || "").trim();
    if (!a || !n) return "";
    return withdrawalAddressValidationKey(n, a, selectedTokenAssetId);
  }, [withdrawAddress, network, selectedTokenAssetId]);

  const isWithdrawAddressValid = useMemo(() => {
    if (!currentWithdrawAddressValidationKey) return true;
    return withdrawAddressValidatedKey === currentWithdrawAddressValidationKey && !withdrawAddressValidError;
  }, [currentWithdrawAddressValidationKey, withdrawAddressValidatedKey, withdrawAddressValidError]);

  /**
   * Amount / OTP / button — only when address+network validated successfully by API.
   * Hide while verifying, on any validation error, or before a completed check (checkDone).
   */
  const showWithdrawContentAfterValidatedAddress = useMemo(() => {
    if (!currentWithdrawAddressValidationKey) return false;
    if (isWithdrawAddressValidating) return false;
    if (!withdrawAddressCheckDone) return false;
    if (String(withdrawAddressValidError || "").trim().length > 0) return false;
    if (withdrawAddressValidatedKey !== currentWithdrawAddressValidationKey) return false;
    return true;
  }, [
    currentWithdrawAddressValidationKey,
    withdrawAddressValidatedKey,
    withdrawAddressValidError,
    isWithdrawAddressValidating,
    withdrawAddressCheckDone,
  ]);

  useEffect(() => {
    if (!showWithdrawContentAfterValidatedAddress) {
      setWithdrawOtpPhaseActive(false);
      setOtp("");
    }
  }, [showWithdrawContentAfterValidatedAddress]);

  useEffect(() => {
    const raw = String(withdrawAmount ?? "").trim();
    if (!raw) {
      setWithdrawOtpPhaseActive(false);
      setOtp("");
    }
  }, [withdrawAmount]);

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
    try {
      dispatch(getUserMainWallet("main"));
    } catch (e) {
      console.warn("Initial wallet fetch failed:", e);
    }
    dispatch(getUserMainWallet("spot")); // Backup check for balance
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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        dispatch(getWithdrawActiveCoins()),
        dispatch(getNotificationList()),
        refetchAddressBook(),
        fetchRecentAddresses(),
        reloadWithdrawal24hUsage?.()
      ]);
      // Attempt to fetch wallet, but don't let it crash the whole refresh if it returns 400
      try {
        await dispatch(getUserMainWallet("main"));
      } catch (e) {
        console.warn("Withdraw Wallet Fetch Error:", e);
      }
    } catch (e) {
      console.warn("Withdrawal Refresh Error:", e);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch, reloadWithdrawal24hUsage]);

  useEffect(() => {
    setAvailableBalance(String(totalSpendableFromFundRow(mainWalletFundRow)));
  }, [mainWalletFundRow]);

  useEffect(() => {
    const keys = getActiveWithdrawChainKeys(selectedCurrency);
    if (network && (keys.length === 0 || !keys.includes(network))) {
      setNetwork("");
    }
  }, [selectedCurrency, network]);

  useEffect(() => {
    let cancelled = false;
    const fetchAddressBook = async () => {
      try {
        setAddressBookLoading(true);
        const res = await appOperation.customer.get_wallet_address_book();
        if (!cancelled && res?.success && res?.data) {
          const list = Array.isArray(res.data) ? res.data : (res.data.rows || res.data.addresses || []);
          setAddressBookEntries(list);
        }
      } catch (err) {
        // ignore
      } finally {
        if (!cancelled) setAddressBookLoading(false);
      }
    };
    fetchAddressBook();
    return () => { cancelled = true; };
  }, []);

  const refetchAddressBook = async () => {
    try {
      setAddressBookLoading(true);
      const res = await appOperation.customer.get_wallet_address_book();
      if (res?.success && res?.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data.rows || res.data.addresses || []);
        setAddressBookEntries(list);
      }
    } catch (err) {
      // ignore
    } finally {
      setAddressBookLoading(false);
    }
  };

  const handleWithdrawAgainFromHistory = useCallback(
    (item) => {
      if (!item) return;
      const isAddress = recentWithdrawTab === "address";
      const coinSym = isAddress ? item.currency : item.short_name || item.currency;
      const coinObj = withdrawCoinsList.find(
        (c) => coinSymbol(c).toUpperCase() === String(coinSym).toUpperCase()
      );

      if (coinObj) {
        handleSelectCurrency(coinObj);
        if (isAddress) {
          setWithdrawToTab("address");
          setWithdrawAddress(item.addressFull || item.address || "");
          const net = item.network || item.chain;
          if (net) {
            setNetwork(net);
          }
        } else {
          setWithdrawToTab("agce_user");
          // Pre-fill AGCE recipient if possible
          if (item.to_user_id) {
            setAgceUserId(item.to_user_id);
          }
        }
      }
      scrollViewRef.current?.scrollToPosition(0, 0, true);
    },
    [recentWithdrawTab, withdrawCoinsList, handleSelectCurrency]
  );

  const handleConfirmDeleteAddress = async () => {
    if (!addressToDelete) return;
    try {
      setAddressDeleteBusy(true);
      const id = addressToDelete._id || addressToDelete.id;
      const res = await appOperation.customer.delete_wallet_address_book(id);
      if (res?.success) {
        addressDeleteSheetRef.current?.close();
        setAddressToDelete(null);
        void refetchAddressBook();
      } else {
        showError(res?.message || "Could not remove address");
      }
    } catch (err) {
      showError("An error occurred while removing the address");
    } finally {
      setAddressDeleteBusy(false);
    }
  };

  const getDeleteModalTitle = (entry) => {
    if (!entry) return "Remove address?";
    const st = String(entry.status || "").toUpperCase();
    if (st === "APPROVED" || st === "ACTIVE") return "Remove whitelisted address?";
    if (st.startsWith("PENDING")) return "Remove pending address?";
    return "Remove saved address?";
  };

  const getDeleteModalMessage = (entry) => {
    if (!entry) return "";
    const label = entry.name || entry.label || "Address";
    const coin = entry.coin || "";
    const network = entry.network || entry.chain || "";
    const addr = entry.address || "";
    const shortAddr = addr ? `${addr.slice(0, 8)}...${addr.slice(-6)}` : "";

    const parts = [coin, network].filter(Boolean);
    const meta = parts.length ? parts.join(" · ") : "";
    const head = meta ? `${label} — ${meta} — ${shortAddr}` : `${label} (${shortAddr})`;

    const st = String(entry.status || "").toUpperCase();
    if (st === "APPROVED" || st === "ACTIVE") {
      return `You are about to remove ${head}. You will need to verify this address again before you can withdraw to it.`;
    }
    if (st.startsWith("PENDING")) {
      return `You are about to remove ${head}. Any in-progress verification will be cancelled.`;
    }
    return `Remove ${head} from your saved addresses?`;
  };

  /** Web parity: addressBookEntryPendingSatoshiDeposit */
  const isPendingSatoshiDeposit = (entry) => {
    if (!entry) return false;
    const st = String(entry.status || "").toUpperCase().replace(/-/g, "_").trim();
    if (!st || st === "APPROVED" || st === "REJECTED" || st === "EXPIRED") return false;
    // Not MetaMask pending
    const method = String(entry.whitelist_method || entry.whitelistMethod || "").toUpperCase();
    if (method === "METAMASK") return false;
    // Must have a pending satoshi/proof amount
    const amt = entry.satoshi_amount ?? entry.proof_amount ?? entry.satoshiAmount ?? entry.proofAmount;
    if (amt == null || String(amt).trim() === "") return false;
    return true;
  };

  /** Resume satoshi whitelist flow from an existing address book entry */
  const handleResumeSatoshiFromAddressBook = async (entry) => {
    if (!isPendingSatoshiDeposit(entry)) return;
    const eid = entry._id || entry.id;
    const proofAmount = String(entry.satoshi_amount ?? entry.proof_amount ?? entry.satoshiAmount ?? entry.proofAmount ?? "").trim();
    const proofAsset = String(entry.satoshi_asset ?? entry.proof_asset ?? entry.coin ?? entry.short_name ?? "").trim().toUpperCase();
    const proofChain = String(entry.satoshi_chain ?? entry.proof_chain ?? entry.chain ?? "").trim().toUpperCase();
    const shortName = String(entry.coin ?? entry.short_name ?? proofAsset ?? "").trim().toUpperCase();

    // Resolve tokenAssetId
    const coinObj = withdrawCoinsList.find(c => String(c.short_name || c.coin || "").toUpperCase() === shortName);
    let tokenAssetId = String(entry.token_asset_id ?? entry.tokenAssetId ?? "").trim();
    if (!tokenAssetId && coinObj) {
      if (coinObj.token_asset_ids && proofChain) {
        tokenAssetId = coinObj.token_asset_ids[proofChain] || coinObj.token_asset_ids[proofChain.toLowerCase()] || "";
        if (!tokenAssetId) {
          const fuzzyKey = Object.keys(coinObj.token_asset_ids).find(k =>
            k.toUpperCase().includes(proofChain) || proofChain.includes(k.toUpperCase())
          );
          if (fuzzyKey) tokenAssetId = coinObj.token_asset_ids[fuzzyKey];
        }
      }
      if (!tokenAssetId) {
        const net = coinObj.networks?.find(n =>
          String(n.code).toUpperCase() === proofChain ||
          String(n.short_name || "").toUpperCase() === proofChain
        );
        if (net) tokenAssetId = net.tokenAssetId || net.assetId || net.id || "";
      }
    }
    if (!tokenAssetId) tokenAssetId = proofChain || shortName;

    // Set whitelist data and open satoshi step
    const flowData = {
      id: eid,
      proof_amount: proofAmount,
      proof_asset: proofAsset || shortName,
      proof_chain: proofChain,
      tokenAssetId,
      shortName: shortName || proofAsset,
    };
    setSaveAddrWhitelistData(flowData);
    setSaveAddrStep("satoshi");
    setSatoshiDepositLoading(true);
    setSatoshiWhitelistAwaitingProof(false);
    setSatoshiResumeMode(true);
    setSaveAddrLabel(entry.name || entry.label || "");
    setSaveAddrCoin(shortName);
    setSaveAddrAddress(entry.address || "");
    setSaveAddrNetwork(entry.network || entry.chain || "");
    saveAddressSheetRef.current?.open();

    // Fetch deposit address
    setSatoshiDepositError("");
    try {
      const addrRes = await appOperation.customer.get_and_generate_address({
        assetId: tokenAssetId,
        tokenAssetId: tokenAssetId,
        short_name: shortName,
        generate: true
      });
      if (addrRes?.success === false) {
        setSatoshiDepositError(addrRes?.message || "Could not load deposit address.");
      } else if (addrRes?.success) {
        const dr = addrRes.data?.data || addrRes.data || {};
        const raw = dr.deposit_address || dr.address || dr.wallet_address || dr.walletAddress || dr.depositAddress || "";
        const mem = dr.memo || dr.tag || dr.destinationTag || dr.memoTag || "";
        if (raw) {
          setSaveAddrWhitelistData(prev => ({
            ...prev,
            deposit_address: String(raw),
            address: String(raw),
            memo: String(mem)
          }));
        } else {
          setSatoshiDepositError("No deposit address returned.");
        }
      } else {
        setSatoshiDepositError("Could not load deposit address.");
      }
    } catch (e) {
      console.warn("Resume satoshi fetch failed", e);
      setSatoshiDepositError(e?.message || "Could not load deposit address.");
    } finally {
      setSatoshiDepositLoading(false);
    }
  };

  const fetchRecentAddresses = useCallback(async (cancelledVal = { val: false }) => {
    try {
      setRecentAddressesLoading(true);
      const res = await appOperation.customer.withdrawal_address_history();
      if (!cancelledVal.val && res?.success && res?.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data.data || []);
        const mapped = list.map(item => ({
          address: item.address,
          network: item.chain || item.network,
          coin: item.coin,
          last_used: item.last_used_at,
          times_used: item.times_used
        }));
        setRecentAddresses(mapped);
      }
    } catch (err) {
      // ignore
    } finally {
      if (!cancelledVal.val) setRecentAddressesLoading(false);
    }
  }, []);

  useEffect(() => {
    const cv = { val: false };
    fetchRecentAddresses(cv);
    return () => { cv.val = true; };
  }, [fetchRecentAddresses]);

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

  const handleOpenSaveAddressSheet = (item = null) => {
    if (item && typeof item === "object") {
      setSaveAddrLabel(item.name || item.label || "");
      setSaveAddrCoin(item.coin || "");
      setSaveAddrAddress(item.address || "");
      setSaveAddrNetwork(item.network || item.chain || "");
      // Optional: Set memo if present
      if (item.memo) setSaveAddrMemo(item.memo);
    } else {
      const coinSym = selectedCurrency?.short_name || "USDT";
      setSaveAddrCoin(coinSym);
      setSaveAddrAddress("");

      // Pre-fill network if it's valid for this coin
      const keys = getActiveWithdrawChainKeys(selectedCurrency);
      if (network && keys.includes(network)) {
        setSaveAddrNetwork(network);
      } else if (keys.length === 1) {
        setSaveAddrNetwork(keys[0]);
      } else {
        setSaveAddrNetwork("");
      }
    }

    saveAddressSheetRef.current?.open();
  };

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
    setWithdrawAmountTouched(false);
    setWithdrawOtpPhaseActive(false);
    setOtp("");
    setWithdrawAddress("");
    setWithdrawAddressValidError("");
    setWithdrawAddressValidatedKey("");
    setWithdrawAddressCheckDone(false);
    setIsWithdrawAddressValidating(false);
    setWithdrawToTab("address");
    dispatch(getUserMainWallet("main"));
    coinSheetRef.current?.close();
  };

  const handleWithdrawalAddress = (value) => {
    setWithdrawAddress(value);
    setWithdrawOtpPhaseActive(false);
    setOtp("");
    setWithdrawAddressValidError("");
    setWithdrawAddressValidatedKey("");
    setWithdrawAddressCheckDone(false);
  };

  const validateWithdrawAddressApi = useCallback(async () => {
    const addr = String(withdrawAddress || "").trim();
    const net = String(network || "").trim();
    if (!addr || !net) return false;
    const validatedKey = withdrawalAddressValidationKey(net, addr, selectedTokenAssetId);
    if (validatedKey && withdrawAddressValidatedKey === validatedKey) {
      setWithdrawAddressValidError("");
      setWithdrawAddressCheckDone(true);
      return true;
    }
    const reqId = ++withdrawAddressValidationReqIdRef.current;
    setIsWithdrawAddressValidating(true);
    try {
      const chainCanon = canonicalWithdrawalChainForValidateAddress(net) || net.toUpperCase();
      const body = { address: addr, chain: chainCanon };
      if (selectedTokenAssetId) body.tokenAssetId = selectedTokenAssetId;
      let r;
      try {
        r = await appOperation.customer.validate_withdraw_address(body);
      } catch {
        r = await appOperation.post("wallet/validate-address", body, CUSTOMER_TYPE);
      }
      if (reqId !== withdrawAddressValidationReqIdRef.current) return false;

      const root = r && typeof r === "object" ? r : {};
      const inner = root.data != null && typeof root.data === "object" && !Array.isArray(root.data) ? root.data : null;
      const data = inner || root;

      const validTrue =
        root.valid === true ||
        data.valid === true ||
        (typeof data.valid === "string" && String(data.valid).toLowerCase() === "true");
      const validFalse =
        root.valid === false ||
        data.valid === false ||
        (typeof data.valid === "string" && String(data.valid).toLowerCase() === "false");

      if (validFalse) {
        setWithdrawAddressValidatedKey("");
        const msg = String(data?.message || root?.message || "").trim();
        setWithdrawAddressValidError(msg && msg.toLowerCase() !== "ok" ? msg : `Invalid address for ${net}`);
        return false;
      }

      const successFlag = root.success === true || data.success === true;
      const msg = String(data?.message || root?.message || "").trim();
      const isAlreadyWhitelisted = msg.toLowerCase().includes("already whitelisted");

      const ok = (successFlag && validTrue) || validTrue === true || isAlreadyWhitelisted;

      if (ok) {
        setWithdrawAddressValidError("");
        setWithdrawAddressValidatedKey(validatedKey);
        return true;
      }
      setWithdrawAddressValidatedKey("");
      setWithdrawAddressValidError(msg && msg.toLowerCase() !== "ok" ? msg : `Invalid address for ${net}`);
      return false;
    } catch (e) {
      if (reqId !== withdrawAddressValidationReqIdRef.current) return false;
      setWithdrawAddressValidatedKey("");
      const msg = String(e?.message || e?.msg || "").trim();
      setWithdrawAddressValidError(msg || `Invalid address for ${net}`);
      return false;
    } finally {
      if (reqId === withdrawAddressValidationReqIdRef.current) {
        setIsWithdrawAddressValidating(false);
        setWithdrawAddressCheckDone(true);
      }
    }
  }, [withdrawAddress, network, selectedTokenAssetId, withdrawAddressValidatedKey]);

  const validateWithdrawAddressApiRef = useRef(validateWithdrawAddressApi);
  validateWithdrawAddressApiRef.current = validateWithdrawAddressApi;

  useEffect(() => {
    if (withdrawToTab !== "address") {
      withdrawAddressValidationReqIdRef.current += 1;
      if (withdrawAddrValidateDebounceTimerRef.current) {
        clearTimeout(withdrawAddrValidateDebounceTimerRef.current);
        withdrawAddrValidateDebounceTimerRef.current = null;
      }
      setWithdrawAddressValidError("");
      setWithdrawAddressValidatedKey("");
      setWithdrawAddressCheckDone(false);
      setIsWithdrawAddressValidating(false);
    }
  }, [withdrawToTab]);

  useEffect(() => {
    if (withdrawToTab !== "address") return undefined;
    const addr = String(withdrawAddress || "").trim();
    const net = String(network || "").trim();
    if (!addr || !net) {
      if (withdrawAddrValidateDebounceTimerRef.current) {
        clearTimeout(withdrawAddrValidateDebounceTimerRef.current);
        withdrawAddrValidateDebounceTimerRef.current = null;
      }
      setWithdrawAddressValidError("");
      setWithdrawAddressValidatedKey("");
      setWithdrawAddressCheckDone(false);
      setIsWithdrawAddressValidating(false);
      return undefined;
    }

    const validatedKey = withdrawalAddressValidationKey(net, addr, selectedTokenAssetId);
    if (validatedKey && withdrawAddressValidatedKey === validatedKey) {
      setIsWithdrawAddressValidating(false);
      return undefined;
    }

    if (withdrawAddrValidateDebounceTimerRef.current) {
      clearTimeout(withdrawAddrValidateDebounceTimerRef.current);
      withdrawAddrValidateDebounceTimerRef.current = null;
    }
    withdrawAddrValidateDebounceTimerRef.current = setTimeout(() => {
      withdrawAddrValidateDebounceTimerRef.current = null;
      void validateWithdrawAddressApiRef.current?.();
    }, 500);

    return () => {
      if (withdrawAddrValidateDebounceTimerRef.current) {
        clearTimeout(withdrawAddrValidateDebounceTimerRef.current);
        withdrawAddrValidateDebounceTimerRef.current = null;
      }
    };
  }, [withdrawToTab, withdrawAddress, network, selectedTokenAssetId, withdrawAddressValidatedKey]);

  const reloadWithdrawal24hUsage = useCallback(async () => {
    const coin = String(selectedCurrency?.short_name || "").trim();
    if (!coin) {
      setWithdraw24hUsage(null);
      return;
    }
    try {
      const r = await appOperation.customer.withdrawal_24h_usage(coin);
      const root = r && typeof r === "object" ? r : {};
      const inner = root.data != null && typeof root.data === "object" && !Array.isArray(root.data) ? root.data : null;
      const data = inner || root;
      const ok = root.success === true || (data && (data.remaining != null || data.limit != null));
      if (ok && data && typeof data === "object") {
        setWithdraw24hUsage({
          remaining: data.remaining,
          limit: data.limit,
          used: data.used,
        });
      } else {
        setWithdraw24hUsage(null);
      }
    } catch {
      setWithdraw24hUsage(null);
    }
  }, [selectedCurrency?.short_name]);

  useEffect(() => {
    void reloadWithdrawal24hUsage();
  }, [reloadWithdrawal24hUsage]);

  /** Web `effectiveAvailable` + `handleWithdrawMaxClick` (useWithdrawPageController). */
  const effectiveWithdrawAvailable = useMemo(
    () => parseFloat(formatFundAvailableFromRow(mainWalletFundRow)) || 0,
    [mainWalletFundRow]
  );

  /** Web `withdrawAmountInlineError` (useWithdrawPageController ~1007–1019). */
  const withdrawAmountInlineError = useMemo(() => {
    if (!withdrawAmountTouched) return "";
    const raw = String(withdrawAmount || "").trim();
    const amt = Number.parseFloat(raw.replace(/,/g, ""));
    if (!raw) return "";
    if (!Number.isFinite(amt) || amt <= 0) {
      return `Minimum withdrawal limit is ${formatWithdrawAmountDisplay(chainMinWithdrawal)}.`;
    }
    if (chainMinWithdrawal > 0 && amt < chainMinWithdrawal) {
      return `Minimum withdrawal limit is ${formatWithdrawAmountDisplay(chainMinWithdrawal)}.`;
    }
    if (effectiveWithdrawAvailable > 0 && amt > effectiveWithdrawAvailable) return "Insufficient funds";
    return "";
  }, [
    withdrawAmount,
    withdrawAmountTouched,
    effectiveWithdrawAvailable,
    chainMinWithdrawal,
  ]);

  /** Web `isWithdrawFormValid` amount part (~953–959) + amount must cover fee (app / existing checks). */
  const withdrawAmountOkForSubmit = useMemo(() => {
    const raw = String(withdrawAmount || "").trim();
    const amtNum = Number.parseFloat(raw.replace(/,/g, ""));
    if (!raw || !Number.isFinite(amtNum) || amtNum <= 0) return false;
    if (chainMinWithdrawal > 0 && amtNum < chainMinWithdrawal) return false;
    if (effectiveWithdrawAvailable > 0 && amtNum > effectiveWithdrawAvailable) return false;
    const fee = parseNum(valueForChain(selectedCurrency, "withdrawal_fee", network), 0);
    if (fee > 0 && amtNum < fee) return false;
    return true;
  }, [withdrawAmount, chainMinWithdrawal, effectiveWithdrawAvailable, selectedCurrency, network]);

  const handleMaxWithdrawal = useCallback(() => {
    if (!selectedCurrency || Object.keys(selectedCurrency).length === 0) return;
    if (effectiveWithdrawAvailable <= 0) return;
    setWithdrawAmount(sanitizeWithdrawAmountRaw(String(effectiveWithdrawAvailable)));
    setWithdrawAmountTouched(true);
  }, [selectedCurrency, effectiveWithdrawAvailable]);

  const onWithdrawMetaRefresh = useCallback(async () => {
    if (isWithdrawMetaRefreshing) return;
    setIsWithdrawMetaRefreshing(true);
    try {
      await Promise.all([
        dispatch(getWithdrawActiveCoins()),
        dispatch(getUserMainWallet("main")),
        reloadWithdrawal24hUsage(),
      ]);
    } finally {
      setIsWithdrawMetaRefreshing(false);
    }
  }, [dispatch, isWithdrawMetaRefreshing, reloadWithdrawal24hUsage]);

  const handleGetOtp = async () => {
    if (!selectedCurrency || Object.keys(selectedCurrency).length === 0) {
      showError("Please select a coin first");
      return;
    }
    if (!network) {
      showError("Please select a network first");
      return;
    }
    if (isWithdrawAddressValidating) {
      showError("Please wait while the address is being verified");
      return;
    }
    if (!withdrawAddress || !isWithdrawAddressValid) {
      showError("Please enter a valid wallet address");
      return;
    }
    if (!withdrawAmount || String(withdrawAmount).trim() === "") {
      showError("Please enter withdrawal amount");
      return;
    }
    if (withdrawAmountInlineError) {
      showError(withdrawAmountInlineError);
      return;
    }
    if (!withdrawAmountOkForSubmit) {
      showError(withdrawAmountInlineError || "Please check withdrawal amount");
      return;
    }
    if (!emailId || emailId === "") {
      showError("Please update email in profile section");
      return;
    }

    setDisableBtn(true);
    setTimer(60);
    setOtpText("Resend OTP");
    Keyboard.dismiss();

    /** Web: `sendWithdrawalVerificationOtp` then `sendWithdrawOtp` fallback (`withdrawService.js`). */
    let ok = false;
    let message = "";
    try {
      const r = await appOperation.customer.withdrawal_verification_otp({ method: "email" });
      const root = r && typeof r === "object" ? r : {};
      if (root.success === true || root.success === 1) {
        ok = true;
        message = String(root.message || "").trim();
      }
    } catch {
      /* try fallback */
    }
    if (!ok) {
      try {
        const r2 = await appOperation.customer.user_send_otp_withdrawal({
          email_or_phone: emailId,
          resend: true, // we are already in resend mode if timer is active or triggered
        });
        const root2 = r2 && typeof r2 === "object" ? r2 : {};
        if (root2.success === true || root2.success === 1) {
          ok = true;
          message = String(root2.message || "").trim();
        } else {
          message = String(root2.message || "Could not send verification code").trim();
        }
      } catch (e) {
        message = String(e?.message || "Could not send verification code");
      }
    }

    if (ok) {
      showSuccess(message || "Verification code sent");
    } else {
      showError(message || "Could not send verification code");
      // If it failed immediately, maybe we should give the user another chance?
      // But usually, 60s wait is fine.
    }
  };

  useEffect(() => {
    if (withdrawOtpPhaseActive) {
      handleGetOtp();
    }
  }, [withdrawOtpPhaseActive]);

  const handleSatoshiWhitelistSent = async () => {
    if (!saveAddrWhitelistData?.id || saveAddrSatoshiPolling) return;
    setSaveAddrSatoshiPolling(true);
    try {
      console.warn("[API] Confirming Satoshi with ID:", saveAddrWhitelistData.id);
      const res = await appOperation.customer.confirm_satoshi_address_book(saveAddrWhitelistData.id);
      console.warn("[API] Satoshi Confirmation Response:", JSON.stringify(res, null, 2));
      if (res?.success) {
        if (res.data?.status === "APPROVED") {
          showSuccess(res.message || "Address ownership verified successfully!");
          // Reload address book
          const res2 = await appOperation.customer.get_wallet_address_book();
          if (res2?.success && res2?.data) {
            const list = Array.isArray(res2.data) ? res2.data : (res2.data.rows || res2.data.addresses || []);
            setAddressBookEntries(list);
          }
          saveAddressSheetRef.current?.close();
        } else {
          // If not approved but success is true, it means it's still pending
          setSatoshiWhitelistAwaitingProof(true);
          showSuccess(res.message || "Verification is still pending. Please wait for the payment to be detected.");
        }
      } else {
        showError(res?.message || "Verification not confirmed yet.");
      }
    } catch (e) {
      showError(e?.message || "Verification failed");
    } finally {
      setSaveAddrSatoshiPolling(false);
    }
  };

  const handleResendSaveAddrOtp = async () => {
    if (!saveAddrResendActive || saveAddrBusy) return;

    const method = "email";
    setSaveAddrBusy(true);
    try {
      // Try primary endpoint first (Web parity)
      let res = await appOperation.customer.send_address_book_verification_otp({ method });

      // If primary fails, try fallback endpoint (Security OTP)
      if (!res?.success) {
        res = await appOperation.customer.withdrawal_verification_otp({ method });
      }

      if (res?.success) {
        setSaveAddrOtpTimer(60);
        setSaveAddrResendActive(false);
        showSuccess(res.message || "Verification code resent");
      } else {
        showError(res?.message || "Could not resend code");
      }
    } catch (e) {
      showError("Error resending verification code");
    } finally {
      setSaveAddrBusy(false);
    }
  };

  const handleFinalWithdraw = () => {
    withdrawConfirmSheetRef.current?.close();
    // Transition to the summary sheet as per mobile UX
    setTimeout(() => {
      withdrawSummarySheetRef.current?.open();
    }, 450);
  };
  /** Web `WithdrawPageStep3Overlays`: first Withdrawal opens verify; OTP is not required to enable the first tap. */
  const handleWithdrawPrimaryPress = () => {
    if (!withdrawOtpPhaseActive) {
      setWithdrawAmountTouched(true);
      if (!selectedCurrency || Object.keys(selectedCurrency).length === 0) {
        showError("Please select a coin first");
        return;
      }
      if (withdrawToTab === "address") {
        if (!network) {
          showError("Please select a network first");
          return;
        }
        if (isWithdrawAddressValidating) {
          showError("Please wait while the address is being verified");
          return;
        }

        const isWhitelistedLocally = (withdrawAddressValidError && withdrawAddressValidError.toLowerCase().includes("whitelisted"));
        if (!withdrawAddress || (!isWithdrawAddressValid && !isWhitelistedLocally)) {
          showError(withdrawAddressValidError || "Please enter a valid wallet address");
          return;
        }

        // Address book validation check parity
        const normalizedInputAddr = String(withdrawAddress || "").toLowerCase().trim();
        const withdrawalAddressIsApprovedInBook = (addressBookEntries || []).some((e) => {
          const entryAddr = String(e.address || "").toLowerCase().trim();
          const isMatch = entryAddr === normalizedInputAddr;
          const status = String(e.status || "").toLowerCase();
          const isApproved = status === "approved" || status === "active" || status === "verified";
          return isMatch && isApproved;
        });

        if (!withdrawalAddressIsApprovedInBook && !addressBookLoading) {
          setIsAddressVerificationReminderOpen(true);
          return;
        }
      } else if (withdrawToTab === "agce_user") {
        if (!isAgceFormValid) {
          showError("Please fill in valid recipient details");
          return;
        }
      }

      if (!withdrawAmount || String(withdrawAmount).trim() === "") {
        showError("Please enter withdrawal amount");
        return;
      }

      if (withdrawAmountInlineError) {
        showError(withdrawAmountInlineError);
        return;
      }
      if (!withdrawAmountOkForSubmit) {
        showError(withdrawAmountInlineError || "Please check withdrawal amount");
        return;
      }
      if (!emailId || emailId === "") {
        showError("Please update email in profile section");
        return;
      }

      if (withdrawToTab === "address") {
        withdrawConfirmSheetRef.current?.open();
        setWithdrawConfirmBusy(true);
        setTimeout(() => setWithdrawConfirmBusy(false), 3000);
      } else {
        setWithdrawOtpPhaseActive(true);
      }
      Keyboard.dismiss();
      return;
    }
    handleWithdraw();
  };

  const handleWithdraw = () => {
    if (withdrawToTab !== "address") {
      showError("AGCE User withdrawal logic not fully available yet");
      return;
    }
    if (!selectedCurrency || Object.keys(selectedCurrency).length === 0 || !withdrawAddress || !network || !withdrawAmount || !otp || !isWithdrawAddressValid) {
      showError("Please fill all required fields");
      return;
    }
    const fee = parseNum(valueForChain(selectedCurrency, "withdrawal_fee", network), 0);
    const rawAmt = String(withdrawAmount || "").trim();
    const amtNum = Number.parseFloat(rawAmt.replace(/,/g, ""));
    if (
      !rawAmt ||
      !Number.isFinite(amtNum) ||
      amtNum <= 0 ||
      (chainMinWithdrawal > 0 && amtNum < chainMinWithdrawal) ||
      (effectiveWithdrawAvailable > 0 && amtNum > effectiveWithdrawAvailable)
    ) {
      setWithdrawAmountTouched(true);
      if (effectiveWithdrawAvailable > 0 && amtNum > effectiveWithdrawAvailable) {
        showError("Insufficient funds");
      } else {
        showError(`Minimum withdrawal limit is ${formatWithdrawAmountDisplay(chainMinWithdrawal)}.`);
      }
      return;
    }
    if (fee > 0 && amtNum < fee) {
      showError("Withdrawal amount must be greater than withdrawal fee");
      return;
    }
    if (parseFloat(availableBalance) < fee) {
      showError("Insufficient funds");
      return;
    }

    const addr = String(withdrawAddress || "").trim();
    const chainForSubmit = canonicalWithdrawalChainForValidateAddress(network) || String(network || "").trim();
    const idempotency_key = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    const tokenFromMap = selectedCurrency?.token_asset_ids?.[network];
    const tokenAssetId = tokenFromMap != null && String(tokenFromMap).trim() ? String(tokenFromMap).trim() : "";

    /** Web `submitWithdrawal` body (`withdrawService.js`): string OTP, address mirror, idempotency, optional tokenAssetId. */
    let data = {
      verification_code: String(otp ?? "").trim(),
      withdrawal_address: addr,
      address: addr,
      amount: withdrawAmount,
      email_or_phone: emailId,
      chain: chainForSubmit,
      coinName: selectedCurrency?.short_name,
      usdt_balance: availableBalance,
      idempotency_key,
    };
    if (tokenAssetId) {
      data.tokenAssetId = tokenAssetId;
    }
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
                  <FastImage source={checkIc} style={{ width: 12, height: 12, right: 5 }} resizeMode="contain" />
                ) : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </RBSheet>
  );
  const saveAddrBeneficiaryCountrySheetOnly = (
    <RBSheet
      ref={saveAddrCountrySheetRef}
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
          {countriesList.map((c, idx) => {
            const countryName = c.label.split("(")[0].trim();
            const selected = saveAddrBenCountry === countryName;
            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.agceCountrySheetRow,
                  {
                    borderBottomWidth: idx < countriesList.length - 1 ? StyleSheet.hairlineWidth : 0,
                    borderBottomColor: isDark ? themeColors.border : "#00000018",
                  },
                ]}
                onPress={() => {
                  setSaveAddrBenCountry(countryName);
                  saveAddrCountrySheetRef.current?.close();
                }}
                activeOpacity={0.75}
              >
                <AppText type={FOURTEEN}>{c.flag}</AppText>
                <AppText type={TWELVE} color={themeColors.text} style={{ marginLeft: 12, flex: 1 }}>
                  {countryName}
                </AppText>
                {selected ? (
                  <FastImage source={checkIc} style={{ width: 12, height: 12, right: 5 }} resizeMode="contain" />
                ) : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </RBSheet>
  );

  const withdrawLimitInfoSheetOnly = (
    <RBSheet
      ref={withdrawLimitInfoSheetRef}
      height={210}
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
      <Pressable
        style={{ paddingHorizontal: 20, paddingBottom: 28, paddingTop: 4 }}
        onPress={() => withdrawLimitInfoSheetRef.current?.close()}
      >
        <AppText weight={SEMI_BOLD} type={SIXTEEN} style={{ color: themeColors.text, marginBottom: 10 }}>
          24h withdrawal limit
        </AppText>
        <AppText type={TWELVE} style={{ color: themeColors.secondaryText, lineHeight: 18 }}>
          {withdrawStep3Preview.limitLeft} {selectedCurrency?.short_name} 24 Hour withdrawal limit.
        </AppText>
      </Pressable>
    </RBSheet>
  );

  const NETWORK_FEE_INFO_SHEET_HEIGHT = Math.round(Dimensions.get("window").height * 0.35);

  const networkFeeInfoSheetOnly = (
    <RBSheet
      ref={networkFeeInfoSheetRef}
      height={NETWORK_FEE_INFO_SHEET_HEIGHT}
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
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28, paddingTop: 4 }}
      >
        <AppText weight={SEMI_BOLD} type={SIXTEEN} style={{ color: themeColors.text, marginBottom: 10 }}>
          About Network Fee
        </AppText>
        <AppText weight={SEMI_BOLD} type={THIRTEEN} style={{ color: themeColors.text, marginBottom: 8 }}>
          The address you entered is an external wallet address.
        </AppText>
        <AppText type={TWELVE} style={{ color: themeColors.secondaryText, lineHeight: 18 }}>
          Withdrawals to external wallet addresses are securely processed via on-chain transactions. Each transaction
          generates a unique TXID for tracking and transparency, while a network fee is applied based on the selected
          blockchain to ensure smooth processing.
        </AppText>
      </ScrollView>
    </RBSheet>
  );

  useEffect(() => {
    fetchRecentAddresses();
  }, [fetchRecentAddresses]);

  useEffect(() => {
    if (saveAddrCoin && withdrawCoinsList.length > 0) {
      const coinObj = withdrawCoinsList.find(c => String(c.short_name).toUpperCase() === String(saveAddrCoin).toUpperCase());
      if (coinObj) {
        const nets = getWithdrawNetworksOrStaticFallback(coinObj);
        if (nets.length > 0 && !saveAddrNetwork) {
          setSaveAddrNetwork(nets[0].value);
        }
      }
    }
  }, [saveAddrCoin, withdrawCoinsList, saveAddrNetwork]);

  const resetAddAddressForm = () => {
    setSaveAddrStep("form");
    setSaveAddrLabel("");
    setSaveAddrCoin("USDT");
    setWithdrawAddress("");
    setSaveAddrNetwork("");
    setSaveAddrMemo("");
    setSaveAddrOwnership("SELF");
    setSaveAddrWalletType("SELF_HOSTED");
    setSaveAddrExchange("");
    setSaveAddrOtp("");
    setSaveAddrWhitelistData(null);
    setSaveAddrVerifyOptions([]);
    setSelectedSaveAddrVerifyMethod("");
    setSaveAddrOtpTimer(0);
    setSaveAddrResendActive(false);
  };

  // Timer for Address Book OTP
  useEffect(() => {
    let interval = null;
    if (saveAddrOtpTimer > 0) {
      interval = setInterval(() => {
        setSaveAddrOtpTimer((prev) => prev - 1);
      }, 1000);
    } else if (saveAddrOtpTimer === 0) {
      setSaveAddrResendActive(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [saveAddrOtpTimer]);

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
          <TouchableOpacity onPress={() => NavigationService.navigate(routes.WITHDRAW_HISTORY_SCREEN)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <FastImage source={printIcon} resizeMode="contain" style={{ width: 20, height: 17 }} tintColor={themeColors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyBoardAware
        ref={scrollViewRef}
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
            <FastImage source={downIcon} style={{ width: 10, height: 10, marginLeft: 8 }} resizeMode="contain" tintColor={themeColors.secondaryText} />
          </TouchableOpacity>
          {coinQuickPickDisplay.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.wdChipsRow}>
              {coinQuickPickDisplay.map((coin, ix) => {
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
                        borderColor: lightTheme.input,
                        backgroundColor: isSel ? lightTheme.input : "transparent",
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

          {/* Top Tabs */}
          <View style={{ flexDirection: "row", gap: 30, marginBottom: 24, paddingHorizontal: 4 }}>
            <TouchableOpacity onPress={() => setWithdrawToTab("address")}>
              <AppText
                type={FOURTEEN}
                weight={withdrawToTab === "address" ? SEMI_BOLD : MEDIUM}
                style={{ color: withdrawToTab === "address" ? themeColors.text : themeColors.secondaryText }}
              >
                Address
              </AppText>
              {withdrawToTab === "address" && <View style={{ height: 2, backgroundColor: themeColors.text, width: "100%", marginTop: 6, borderRadius: 1 }} />}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setWithdrawToTab("agce_user")}>
              <AppText
                type={FOURTEEN}
                weight={withdrawToTab === "agce_user" ? SEMI_BOLD : MEDIUM}
                style={{ color: withdrawToTab === "agce_user" ? themeColors.text : themeColors.secondaryText }}
              >
                AGCE User
              </AppText>
              {withdrawToTab === "agce_user" && <View style={{ height: 2, backgroundColor: themeColors.text, width: "100%", marginTop: 6, borderRadius: 1 }} />}
            </TouchableOpacity>
          </View>

          {withdrawToTab === "address" ? (
            <View style={{ gap: 12 }}>
              {/* Network Selector */}
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={openWithdrawNetworkSheet}
                disabled={activeWithdrawChains.length === 0}
                style={{
                  height: 52,
                  borderRadius: 16,
                  paddingHorizontal: 20,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: isDark ? "#1E222D" : "#F3F4F6",
                  borderWidth: 1,
                  borderColor: isDark ? "#2A2E39" : "#E5E7EB",
                  opacity: activeWithdrawChains.length === 0 ? 0.6 : 1
                }}
              >
                <AppText weight={MEDIUM} type={FOURTEEN} style={{ color: network ? colors.black : colors.placeholderColor }}>
                  {network ? String(network).toUpperCase() : "Select Network"}
                </AppText>
                <FastImage source={downIcon} style={{ width: 10, height: 10 }} resizeMode="contain" tintColor={themeColors.secondaryText} />
              </TouchableOpacity>

              {/* Address Input */}
              <View
                style={{
                  height: 52,
                  borderRadius: 16,
                  paddingHorizontal: 20,
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: isDark ? "#1E222D" : "#F3F4F6",
                  borderWidth: 1,
                  borderColor: isDark ? "#2A2E39" : "#E5E7EB",
                }}
              >
                <TextInput
                  style={{ flex: 1, color: themeColors.text, fontSize: 14, fontWeight: "400", padding: 0, marginRight: 10 }}
                  placeholder="Enter Address"
                  placeholderTextColor={themeColors.secondaryText}
                  value={withdrawAddress}
                  onChangeText={(value) => handleWithdrawalAddress(value)}
                  onBlur={() => void validateWithdrawAddressApiRef.current?.()}
                />
                <TouchableOpacity onPress={() => {
                  const next = !showAddressBook;
                  setShowAddressBook(next);
                  if (next) {
                    void fetchRecentAddresses();
                    void refetchAddressBook();
                  }
                }}>
                  <FastImage source={user_withdarwal} style={{ width: 20, height: 20 }} resizeMode="contain" tintColor={themeColors.secondaryText} />
                </TouchableOpacity>
              </View>

              {showAddressBook && (
                <View style={{
                  backgroundColor: "transparent",
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: isDark ? "#2A2E39" : "#E5E7EB",
                  padding: 12,
                  marginTop: 10,
                }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <View style={{ flexDirection: "row", gap: 12 }}>
                      <TouchableOpacity
                        onPress={() => setAddressBookSubTab("recent")}
                        style={{
                          paddingHorizontal: 20,
                          paddingVertical: 10,
                          borderRadius: 100,
                          backgroundColor: addressBookSubTab === "recent" ? (isDark ? "#2A2E39" : "#F3F4F6") : "transparent"
                        }}
                      >
                        <AppText weight={SEMI_BOLD} type={FOURTEEN} style={{ color: addressBookSubTab === "recent" ? themeColors.text : themeColors.secondaryText }}>Recent</AppText>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setAddressBookSubTab("saved")}
                        style={{
                          paddingHorizontal: 20,
                          paddingVertical: 10,
                          borderRadius: 100,
                          backgroundColor: addressBookSubTab === "saved" ? (isDark ? "#2A2E39" : "#F3F4F6") : "transparent"
                        }}
                      >
                        <AppText weight={SEMI_BOLD} type={FOURTEEN} style={{ color: addressBookSubTab === "saved" ? themeColors.text : themeColors.secondaryText }}>My Address</AppText>
                      </TouchableOpacity>
                    </View>

                    {addressBookSubTab === "saved" && (
                      <TouchableOpacity
                        onPress={() => handleOpenSaveAddressSheet()}
                        style={{
                          padding: 8,
                          borderRadius: 100,
                          backgroundColor: isDark ? "#2A2E39" : "#F3F4F6",
                        }}
                      >
                        <FastImage source={editIcon} style={{ width: 14, height: 14 }} tintColor={themeColors.text} />
                      </TouchableOpacity>
                    )}
                  </View>

                  {addressBookSubTab === "recent" && (
                    <View style={{ marginBottom: 10 }}>
                      <AppText type={TWELVE} style={{ color: themeColors.secondaryText, lineHeight: 20 }}>
                        Addresses you have withdrawn to before. Select one to fill the address field.
                      </AppText>
                      <TouchableOpacity onPress={handleOpenSaveAddressSheet} style={{ marginTop: 10 }}>
                        <AppText weight={SEMI_BOLD} type={TWELVE} style={{ color: "#E2B24C", textDecorationLine: "underline" }}>Save address</AppText>
                      </TouchableOpacity>
                    </View>
                  )}

                  {addressBookSubTab === "recent" ? (
                    <View style={{ gap: 10 }}>
                      {recentAddressesLoading ? (
                        <ActivityIndicator color="#E2B24C" />
                      ) : recentAddresses.length > 0 ? (
                        recentAddresses.map((item, idx) => (
                          <TouchableOpacity
                            key={idx}
                            onPress={() => {
                              setWithdrawAddress(item.address);
                              if (item.network) setNetwork(item.network);
                              setShowAddressBook(false);
                            }}
                            style={{
                              padding: 12,
                              borderRadius: 12,
                              borderWidth: 1,
                              borderColor: isDark ? "#2A2E39" : "#E5E7EB",
                              backgroundColor: "transparent"
                            }}
                          >
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                              <AppText weight={BOLD} type={FOURTEEN} style={{ color: themeColors.text }}>{item.coin}</AppText>
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <AppText type={TEN} weight={MEDIUM} style={{ color: themeColors.secondaryText }}>{item.network}</AppText>
                                <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 100, borderWidth: 1, borderColor: isDark ? "#2D4B37" : "#E1F2E8" }}>
                                  <AppText weight={BOLD} type={EIGHT} style={{ color: "#228B22" }}>COMPLETED</AppText>
                                </View>
                              </View>
                            </View>
                            <AppText type={TWELVE} weight={MEDIUM} style={{ color: themeColors.text, marginBottom: 4 }}>
                              {item.address.slice(0, 12)}...{item.address.slice(-10)}
                            </AppText>
                            <AppText type={TEN} style={{ color: themeColors.secondaryText }}>
                              Used {item.times_used || 1}x · Last: {item.last_used ? moment(item.last_used).format("DD/MM/YYYY") : "N/A"}
                            </AppText>
                          </TouchableOpacity>
                        ))
                      ) : (
                        <AppText type={TWELVE} style={{ color: themeColors.secondaryText }}>No recent withdrawal addresses.</AppText>
                      )}
                    </View>
                  ) : (
                    <View style={{ gap: 10 }}>

                      {addressBookLoading ? (
                        <ActivityIndicator color="#E2B24C" />
                      ) : addressBookEntries.length > 0 ? (
                        addressBookEntries.map((item, idx) => {
                          const statusRaw = String(item.status || "").toUpperCase();
                          const isApproved = /(APPROVED|ACTIVE|CONFIRMED)/.test(statusRaw);
                          return (
                            <TouchableOpacity
                              key={idx}
                              onPress={() => {
                                setWithdrawAddress(item.address);
                                if (item.network) setNetwork(item.network);
                                setShowAddressBook(false);
                              }}
                              style={{
                                padding: 12,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: isDark ? "#2A2E39" : "#E5E7EB",
                                backgroundColor: "transparent"
                              }}
                            >
                              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                <AppText weight={BOLD} type={FOURTEEN} style={{ color: themeColors.text }}>{item.name || item.label || "Saved"}</AppText>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                  <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 100, borderWidth: 1, borderColor: isApproved ? (isDark ? "#2D4B37" : "#E1F2E8") : (isDark ? "#4B3D2D" : "#FCEBD0") }}>
                                    <AppText weight={BOLD} type={EIGHT} style={{ color: isApproved ? "#228B22" : "#DE7520" }}>{statusRaw || "APPROVED"}</AppText>
                                  </View>
                                  <TouchableOpacity onPress={() => {
                                    setAddressToDelete(item);
                                    setTimeout(() => addressDeleteSheetRef.current?.open(), 0);
                                  }}>
                                    <FastImage source={REMOVE} style={{ width: 16, height: 16 }} tintColor={themeColors.secondaryText} />
                                  </TouchableOpacity>
                                </View>
                              </View>
                              <AppText type={TWELVE} weight={MEDIUM} style={{ color: themeColors.text }}>
                                {item.address.slice(0, 12)}...{item.address.slice(-10)}
                              </AppText>
                              {isPendingSatoshiDeposit(item) && (
                                <TouchableOpacity
                                  onPress={(e) => {
                                    e.stopPropagation && e.stopPropagation();
                                    handleResumeSatoshiFromAddressBook(item);
                                  }}
                                  style={{
                                    marginTop: 8,
                                    paddingHorizontal: 12,
                                    paddingVertical: 6,
                                    borderRadius: 8,
                                    borderWidth: 1,
                                    borderColor: isDark ? "#2A2E39" : "#E5E7EB",
                                    backgroundColor: isDark ? "#1E222D" : "#F9FAFB",
                                    alignSelf: "flex-start",
                                  }}
                                >
                                  <AppText type={TEN} weight={SEMI_BOLD} style={{ color: themeColors.text }}>Show deposit QR & amount</AppText>
                                </TouchableOpacity>
                              )}
                            </TouchableOpacity>
                          );
                        })
                      ) : (
                        <AppText type={TWELVE} style={{ color: themeColors.secondaryText }}>No saved addresses found.</AppText>
                      )}
                    </View>
                  )}
                </View>
              )}
            </View>
          ) : (
            <View style={{ gap: 16 }}>
              {/* AGCE User Sub-Tabs */}
              <View style={{ flexDirection: "row", gap: 12 }}>
                {[
                  { key: "email", label: "Email" },
                  { key: "phone", label: "Phone" },
                  { key: "agce", label: "AGCE User" },
                ].map((t) => {
                  const active = agceRecipientTab === t.key;
                  return (
                    <TouchableOpacity
                      key={t.key}
                      onPress={() => setAgceRecipientTab(t.key)}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 100,
                        backgroundColor: active ? (isDark ? "#2A2E39" : "#F3F4F6") : "transparent"
                      }}
                    >
                      <AppText weight={SEMI_BOLD} type={TWELVE} style={{ color: active ? themeColors.text : themeColors.secondaryText }}>{t.label}</AppText>
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
                    inputStyle={{ fontSize: 12 }}
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

          {/* Amount and Final Summary Section */}
          {(showWithdrawContentAfterValidatedAddress || withdrawToTab === "agce_user") && Object.keys(selectedCurrency).length > 0 && (
            <View style={{ marginTop: 12, gap: 16 }}>
              <AppText weight={SEMI_BOLD} type={FOURTEEN} style={{ color: themeColors.text }}>Withdrawal Amount</AppText>

              <View style={{
                height: 42,
                borderRadius: 16,
                paddingHorizontal: 16,
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: isDark ? "#1E222D" : "#F3F4F6",
                borderWidth: 1.5,
                borderColor: isDark ? "#2A2E39" : "#E5E7EB"
              }}>
                <TextInput
                  style={{ flex: 1, color: themeColors.text, fontSize: 13, fontWeight: "400", padding: 0 }}
                  placeholder={`Min ${chainMinWithdrawal || 0}`}
                  placeholderTextColor={themeColors.secondaryText}
                  value={withdrawAmount}
                  onChangeText={setWithdrawAmount}
                  keyboardType="numeric"
                />
                <TouchableOpacity style={{ marginRight: 8 }} onPress={handleMaxWithdrawal} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <AppText weight={<AppText weight={MEDIUM} type={FOURTEEN} style={{ color: themeColors.text, marginLeft: 12 }}>{selectedCurrency.short_name}</AppText>
                  } type={TWELVE} style={{ color: "#E2B24C" }}>MAX</AppText>
                </TouchableOpacity>
                <View style={{ width: 1, height: 18, backgroundColor: isDark ? "#2A2E39" : "#E5E7EB" }} />
                <AppText weight={MEDIUM} type={FOURTEEN} style={{ color: themeColors.text, marginLeft: 12 }}>{selectedCurrency.short_name}</AppText>
              </View>


              {withdrawAmountInlineError && (
                <AppText weight={SEMI_BOLD} type={TEN} style={{ color: "red" }}>{withdrawAmountInlineError}</AppText>
              )}

              <View style={{ padding: 10, borderRadius: 16, backgroundColor: 'transparent', borderWidth: 1, borderColor: isDark ? "#2A2E39" : "#EEE" }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                  <View>
                    <AppText type={TWELVE} style={{ color: themeColors.text, marginBottom: 4 }}>Available Withdraw</AppText>
                    <AppText weight={MEDIUM} type={TWELVE} style={{ color: themeColors.text }}>{formatFundAvailableFromRow(mainWalletFundRow)} {selectedCurrency.short_name}</AppText>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <AppText type={TWELVE} style={{ color: themeColors.text }}>24h remaining limit</AppText>
                      <TouchableOpacity onPress={() => withdrawLimitInfoSheetRef.current?.open()}>
                        <View style={{ width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: themeColors.secondaryText, alignItems: "center", justifyContent: "center" }}>
                          <AppText type={TEN} style={{ color: themeColors.secondaryText, fontSize: 8 }}>i</AppText>
                        </View>
                      </TouchableOpacity>
                    </View>
                    <AppText weight={MEDIUM} type={TWELVE} style={{ color: themeColors.text }}>{withdrawStep3Preview.limitLeft} / {withdrawStep3Preview.limitRight}</AppText>
                  </View>
                </View>

                <View style={{ height: 1, backgroundColor: isDark ? "#2A2E39" : "#EEE", marginBottom: 10 }} />

                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                  <AppText type={TWELVE} style={{ color: themeColors.text }}>Network Fee</AppText>
                  <AppText weight={MEDIUM} type={TWELVE} style={{ color: themeColors.text }}>{withdrawStep3Preview.feeNum || 0} {selectedCurrency.short_name}</AppText>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <AppText type={TWELVE} style={{ color: themeColors.text }}>You will receive</AppText>
                  <AppText weight={MEDIUM} type={TWELVE} style={{ color: "#E2B24C" }}>{withdrawStep3Preview.receiveNum || 0} {selectedCurrency.short_name}</AppText>
                </View>
              </View>

              <Button
                children="Withdrawal"
                containerStyle={{ backgroundColor: (!withdrawAmount || !!withdrawAmountInlineError) ? (isDark ? "#1E222D" : "#D1D5DB") : colors.black }}
                textStyle={{ color: (!withdrawAmount || !!withdrawAmountInlineError) ? (isDark ? "#555" : "#9CA3AF") : "black", fontWeight: "500" }}
                disabled={!withdrawAmount || !!withdrawAmountInlineError}
                onPress={handleWithdrawPrimaryPress}
              />

              <View style={{ padding: 10, borderRadius: 12, backgroundColor: isDark ? "#161922" : "#F5F5F5" }}>
                <AppText type={TEN} style={{ color: themeColors.secondaryText, lineHeight: 16 }}>
                  * Beware of scams! AGCE will never ask for personal information or private transfers via SMS or email.
                </AppText>
              </View>
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

        <WithdrawRecentHistory
          activeTab={recentWithdrawTab}
          onTabChange={setRecentWithdrawTab}
          history={withdrawHistory}
          internalHistory={interalWalletHistory}
          onViewMore={() => NavigationService.navigate(routes.WITHDRAW_HISTORY_SCREEN, { activeTab: 1 })}
          onWithdrawAgain={handleWithdrawAgainFromHistory}
          withdrawCoinsList={withdrawCoinsList}
        />

      </KeyBoardAware>

      {/* Remove Address Confirmation Sheet */}
      <RBSheet
        ref={addressDeleteSheetRef}
        closeOnDragDown
        closeOnPressMask
        height={300}
        customStyles={{
          container: {
            backgroundColor: themeColors.background,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 20,
          },
          draggableIcon: {
            backgroundColor: isDark ? "#333" : "#DDD"
          }
        }}
      >
        <View style={{ flex: 1 }}>
          <View style={{ alignItems: "center", marginBottom: 16 }}>
            <View style={{
              width: 80,
              height: 80,
              backgroundColor: isDark ? "#2A2E39" : "#F3F4F6",
              borderRadius: 40,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 12
            }}>
              <FastImage
                source={email_vector}
                style={{ width: 80, height: 48 }}
                resizeMode="cover"
              />
              <View style={{
                position: "absolute",
                top: 20,
                backgroundColor: "#E2B24C",
                width: 18,
                height: 18,
                borderRadius: 9,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 2,
                borderColor: isDark ? "#2A2E39" : "#F3F4F6"
              }}>
                <AppText weight={BOLD} style={{ color: "#FFF", fontSize: 10 }}>!</AppText>
              </View>
            </View>

            <AppText weight={BOLD} type={SIXTEEN} style={{ color: themeColors.text, textAlign: "center", marginBottom: 8 }}>
              {getDeleteModalTitle(addressToDelete)}
            </AppText>

            <AppText type={TWELVE} style={{ color: themeColors.secondaryText, textAlign: "center", lineHeight: 18 }}>
              {getDeleteModalMessage(addressToDelete)}
            </AppText>
          </View>

          <View style={{ flexDirection: "row", gap: 12, marginBottom: 10 }}>
            <TouchableOpacity
              onPress={() => addressDeleteSheetRef.current?.close()}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 100,
                backgroundColor: "transparent",
                borderWidth: 1,
                borderColor: isDark ? "#2A2E39" : "#E5E7EB",
                alignItems: "center"
              }}
            >
              <AppText weight={SEMI_BOLD} type={FOURTEEN} style={{ color: themeColors.text }}>Cancel</AppText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleConfirmDeleteAddress}
              disabled={addressDeleteBusy}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 100,
                backgroundColor: "#1E222D",
                alignItems: "center"
              }}
            >
              {addressDeleteBusy ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <AppText weight={SEMI_BOLD} type={FOURTEEN} style={{ color: "#FFF" }}>Remove</AppText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </RBSheet>
      {withdrawNetworkSheetOnly}
      {withdrawCoinSheetOnly}
      {withdrawAgceCountrySheetOnly}
      {saveAddrBeneficiaryCountrySheetOnly}
      <RBSheet
        ref={withdrawConfirmSheetRef}
        closeOnDragDown
        closeOnPressMask
        height={420}
        customStyles={{
          container: {
            backgroundColor: themeColors.background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          },
          draggableIcon: { backgroundColor: isDark ? themeColors.border : "#DDD" },
        }}
      >
        <View style={{ padding: 24 }}>
          <View style={{ alignItems: "center", marginBottom: 24 }}>
            <View style={{
              width: 70,
              height: 70,
              borderRadius: 35,
              backgroundColor: isDark ? "#2A2E39" : "#F3F4F6",
              justifyContent: "center",
              alignItems: "center"
            }}>
              <FastImage
                source={email_vector}
                style={{ width: 130, height: 130 }}
                resizeMode="contain"
              />
            </View>
          </View>

          <AppText
            type={FOURTEEN}
            style={{
              color: themeColors.text,
              textAlign: "center",
              lineHeight: 22,
              marginBottom: 32,
              paddingHorizontal: 10
            }}
          >
            You have chosen the <AppText type={TWELVE} weight={BOLD} style={{ color: colors.orangeTheme }}>{saveAddrNetwork || network || "—"}</AppText> network. Kindly verify that your withdrawal address is compatible with this network, as unsupported transfers may result in loss of funds.
          </AppText>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              onPress={() => withdrawConfirmSheetRef.current?.close()}
              style={{
                flex: 1,
                height: 48,
                borderRadius: 100,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 1,
                borderColor: isDark ? themeColors.border : "#E5E7EB"
              }}
            >
              <AppText weight={SEMI_BOLD} style={{ color: themeColors.text }}>Cancel</AppText>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={withdrawConfirmBusy}
              onPress={handleFinalWithdraw}
              style={{
                flex: 1,
                height: 48,
                borderRadius: 100,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#111827"
              }}
            >
              <AppText weight={SEMI_BOLD} style={{ color: "#FFF" }}>
                {withdrawConfirmBusy ? "..." : "Confirm"}
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </RBSheet>

      <RBSheet
        ref={withdrawSummarySheetRef}
        closeOnDragDown
        closeOnPressMask
        height={580}
        customStyles={{
          container: {
            backgroundColor: themeColors.background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          },
          draggableIcon: { backgroundColor: isDark ? themeColors.border : "#DDD" },
        }}
      >
        <View style={{ padding: 24 }}>
          <AppText weight={BOLD} type={SIXTEEN} style={{ color: themeColors.text, marginBottom: 24 }}>Withdrawal</AppText>

          <View style={{ marginBottom: 24 }}>
            {[
              { label: "Address", value: withdrawAddress || "—" },
              { label: "Network", value: WITHDRAW_NETWORK_LABELS[network] || network || "—" },
              { label: "Amount", value: `${withdrawAmount || "0"} ${coinSymbol(selectedCurrency)}` },
              { label: "Receive", value: `${formatWithdrawAmountDisplay(parseNum(withdrawAmount, 0) - parseNum(valueForChain(selectedCurrency, "withdrawal_fee", network), 0))} ${coinSymbol(selectedCurrency)}` },
              { label: "Fee", value: `${formatWithdrawAmountDisplay(parseNum(valueForChain(selectedCurrency, "withdrawal_fee", network), 0))} ${coinSymbol(selectedCurrency)}` }
            ].map((item, idx) => (
              <View key={idx} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: idx < 4 ? 0.5 : 0, borderBottomColor: isDark ? themeColors.border : "#F3F4F6" }}>
                <AppText type={TWELVE} style={{ color: themeColors.secondaryText, flex: 1 }}>{item.label}</AppText>
                <AppText type={TWELVE} weight={MEDIUM} style={{ color: themeColors.text, flex: 2, textAlign: "right" }} numberOfLines={2}>{item.value}</AppText>
              </View>
            ))}
          </View>

          <View style={{ marginBottom: 32 }}>
            <View style={{ flexDirection: "row", marginBottom: 8 }}>
              <AppText style={{ color: themeColors.secondaryText, marginRight: 8 }}>•</AppText>
              <AppText type={TEN} style={{ color: themeColors.secondaryText, flex: 1 }}>Make Sure The Address Is Accurate And Matches The Selected Network.</AppText>
            </View>
            <View style={{ flexDirection: "row" }}>
              <AppText style={{ color: themeColors.secondaryText, marginRight: 8 }}>•</AppText>
              <AppText type={TEN} style={{ color: themeColors.secondaryText, flex: 1 }}>Once Submitted, Transactions Cannot Be Reversed.</AppText>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => {
              withdrawSummarySheetRef.current?.close();
              setTimeout(() => {
                withdrawSecuritySheetRef.current?.open();
              }, 450);
            }}
            style={{
              height: 48,
              borderRadius: 100,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "#111827"
            }}
          >
            <AppText weight={SEMI_BOLD} style={{ color: "#FFF" }}>Continue</AppText>
          </TouchableOpacity>
        </View>
      </RBSheet>

      <RBSheet
        ref={withdrawSecuritySheetRef}
        closeOnDragDown
        closeOnPressMask
        height={480}
        customStyles={{
          container: {
            backgroundColor: themeColors.background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          },
          draggableIcon: { backgroundColor: isDark ? themeColors.border : "#DDD" },
        }}
      >
        <View style={{ padding: 24 }}>
          <AppText weight={BOLD} type={SIXTEEN} style={{ color: themeColors.text, marginBottom: 12 }}>Security verification</AppText>
          <AppText type={TWELVE} style={{ color: themeColors.secondaryText, lineHeight: 18, marginBottom: 24 }}>
            Complete all required steps. For email or SMS, tap Send code to receive your OTP, then enter it below.
          </AppText>

          <View style={{ marginBottom: 32 }}>
            <AppText weight={MEDIUM} type={TWELVE} style={{ color: themeColors.text, marginBottom: 12 }}>Email verification code</AppText>
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: isDark ? themeColors.card : "#FFF",
              borderWidth: 1,
              borderColor: isDark ? themeColors.border : "#E5E7EB",
              borderRadius: 12,
              height: 52,
              paddingHorizontal: 16
            }}>
              <TextInput
                placeholder="Enter email code"
                placeholderTextColor={themeColors.secondaryText}
                value={otp}
                onChangeText={setOtp}
                keyboardType="numeric"
                style={{ flex: 1, color: themeColors.text, fontSize: 14 }}
              />
              <TouchableOpacity
                onPress={handleGetOtp}
                disabled={disableBtn}
                style={{ paddingLeft: 12 }}
              >
                <AppText weight={MEDIUM} type={TWELVE} style={{ color: disableBtn ? themeColors.secondaryText : "#C5A161" }}>
                  {disableBtn ? `Resend (${timer}s)` : "Send code"}
                </AppText>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => {
              withdrawSecuritySheetRef.current?.close();
              handleWithdraw();
            }}
            style={{
              height: 52,
              borderRadius: 100,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "#777",
              marginBottom: 24
            }}
          >
            <AppText weight={SEMI_BOLD} style={{ color: "#FFF" }}>Confirm withdrawal</AppText>
          </TouchableOpacity>

          <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
            <FastImage
              source={SECURITY_SHEIELD}
              style={{ width: 16, height: 16, marginRight: 8 }}
              resizeMode="contain"
              tintColor={themeColors.secondaryText}
            />
            <AppText type={TEN} style={{ color: themeColors.secondaryText }}>Protected by Advanced Encryption</AppText>
          </View>
        </View>
      </RBSheet>
      {withdrawLimitInfoSheetOnly}
      {networkFeeInfoSheetOnly}

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

      <Modal visible={withdrawAvailSourceOpen} animationType="fade" transparent onRequestClose={() => setWithdrawAvailSourceOpen(false)}>
        <View style={[styles.modalOverlay, { justifyContent: "center", paddingBottom: 24 }]}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: themeColors.background,
                borderColor: isDark ? themeColors.border : "#EEE",
                borderWidth: 1,
                maxWidth: 400,
                alignSelf: "center",
                width: "100%",
                marginHorizontal: 20,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <AppText weight={SEMI_BOLD} type={SIXTEEN} style={{ color: themeColors.text }}>
                Main Wallet
              </AppText>
              <TouchableOpacity onPress={() => setWithdrawAvailSourceOpen(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <AppText type={TWENTY} style={{ color: themeColors.text }}>×</AppText>
              </TouchableOpacity>
            </View>
            <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
              <AppText weight={SEMI_BOLD} type={THIRTEEN} style={{ color: themeColors.text, marginBottom: 8 }}>
                {formatFundAvailableFromRow(mainWalletFundRow)} {selectedCurrency?.short_name}
              </AppText>
              <AppText type={TWELVE} style={{ color: themeColors.secondaryText, lineHeight: 18 }}>
                • Withdrawals use your Main Wallet balance only.
              </AppText>
              <Button
                children="OK"
                containerStyle={{ marginTop: 16, borderRadius: 10 }}
                onPress={() => setWithdrawAvailSourceOpen(false)}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Verification Reminder Modal */}
      <Modal visible={isAddressVerificationReminderOpen} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 20 }}>
          <View style={{ backgroundColor: isDark ? themeColors.card : "#FFF", padding: 24, borderRadius: 12, width: "100%", maxWidth: 400 }}>
            <AppText type={SIXTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text, marginBottom: 16 }}>Verification Reminder</AppText>
            <AppText type={TWELVE} style={{ color: themeColors.secondaryText, marginBottom: 24, lineHeight: 18 }}>
              In line with compliance and travel rule obligations, we need you to register and verify this destination once before we can send funds. Complete the address certification flow a single time; approved addresses are stored in your address book and will not require repeat verification for future withdrawals to the same destination.
            </AppText>
            <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
              <Button
                children="Cancel"
                containerStyle={{ marginRight: 12, backgroundColor: "transparent", borderWidth: 1, borderColor: themeColors.border, width: 100, height: 40 }}
                titleStyle={{ color: themeColors.text }}
                onPress={() => setIsAddressVerificationReminderOpen(false)}
              />
              <Button
                children="Verify Now"
                containerStyle={{ width: 120, height: 40 }}
                onPress={() => {
                  setIsAddressVerificationReminderOpen(false);
                  setTimeout(() => {
                    setSaveAddrCoin(selectedCurrency?.short_name || "");
                    setSaveAddrNetwork(network || "");
                    setSaveAddrCoinOpen(false);
                    setSaveAddrNetworkOpen(false);
                    saveAddressSheetRef.current?.open();
                  }, 300);
                }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Withdrawal Address Form Sheet */}
      <RBSheet
        ref={saveAddressSheetRef}
        closeOnDragDown={false}
        closeOnPressBack={false}
        closeOnPressMask={false}
        onClose={resetAddAddressForm} // Clear form on close
        height={Dimensions.get("window").height * 0.85}
        customStyles={{
          container: {
            backgroundColor: themeColors.background,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: 24,
            paddingBottom: 24,
          },
          wrapper: { backgroundColor: "rgba(0,0,0,0.6)" },
        }}
      >
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingTop: 10 }}>
            <AppText type={SIXTEEN} weight={BOLD} style={{ color: themeColors.text }}>
              {saveAddrStep === "form"
                ? "Add withdrawal address"
                : (saveAddrStep === "verify_method" || saveAddrStep === "otp")
                  ? "Verify your identity"
                  : saveAddrStep === "satoshi"
                    ? "Verify withdrawal address"
                    : "Address confirmation"}
            </AppText>
            <TouchableOpacity onPress={() => saveAddressSheetRef.current?.close()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <AppText type={TWENTY} style={{ color: themeColors.text, fontWeight: "300" }}>✕</AppText>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            <AddWithdrawalAddressBasics
              saveAddrCountrySheetRef={saveAddrCountrySheetRef}
              isDark={isDark}
              themeColors={themeColors}
              userData={userData}
              saveAddrStep={saveAddrStep}
              saveAddrLabel={saveAddrLabel}
              setSaveAddrLabel={setSaveAddrLabel}
              saveAddrCoin={saveAddrCoin}
              setSaveAddrCoin={setSaveAddrCoin}
              withdrawCoins={withdrawCoinsList}
              saveAddrCoinOpen={saveAddrCoinOpen}
              setSaveAddrCoinOpen={setSaveAddrCoinOpen}
              withdrawAddress={saveAddrAddress}
              setWithdrawAddress={setSaveAddrAddress}
              saveAddrNetwork={saveAddrNetwork}
              setSaveAddrNetwork={setSaveAddrNetwork}
              saveAddrNetworkOpen={saveAddrNetworkOpen}
              setSaveAddrNetworkOpen={setSaveAddrNetworkOpen}
              CHAIN_FULL_NAMES={CHAIN_FULL_NAMES}
              saveAddrMemo={saveAddrMemo}
              setSaveAddrMemo={setSaveAddrMemo}
              saveAddrProofMethod={saveAddrProofMethod}
              setSaveAddrProofMethod={setSaveAddrProofMethod}
              saveAddrBenFullName={saveAddrBenFullName}
              setSaveAddrBenFullName={setSaveAddrBenFullName}
              saveAddrBenPan={saveAddrBenPan}
              setSaveAddrBenPan={setSaveAddrBenPan}
              saveAddrBenCountry={saveAddrBenCountry}
              setSaveAddrBenCountry={setSaveAddrBenCountry}
              saveAddrBenPin={saveAddrBenPin}
              setSaveAddrBenPin={setSaveAddrBenPin}
              saveAddrBenAddress={saveAddrBenAddress}
              setSaveAddrBenAddress={setSaveAddrBenAddress}
              saveAddrVerifyOptions={saveAddrVerifyOptions}
              selectedSaveAddrVerifyMethod={selectedSaveAddrVerifyMethod}
              setSelectedSaveAddrVerifyMethod={setSelectedSaveAddrVerifyMethod}
              getWithdrawNetworksOrStaticFallback={getWithdrawNetworksOrStaticFallback}
              saveAddrOwnership={saveAddrOwnership}
              setSaveAddrOwnership={setSaveAddrOwnership}
              saveAddrWalletType={saveAddrWalletType}
              setSaveAddrWalletType={setSaveAddrWalletType}
              saveAddrExchange={saveAddrExchange}
              setSaveAddrExchange={setSaveAddrExchange}
              saveAddrExchangeSearch={saveAddrExchangeSearch}
              setSaveAddrExchangeSearch={setSaveAddrExchangeSearch}
              saveAddrExchangeOpen={saveAddrExchangeOpen}
              setSaveAddrExchangeOpen={setSaveAddrExchangeOpen}
              ADDRESS_BOOK_TOP_EXCHANGES={ADDRESS_BOOK_TOP_EXCHANGES}
              ADDRESS_BOOK_EXCHANGE_OTHER={ADDRESS_BOOK_EXCHANGE_OTHER}
              upIcon={upIcon}
              downIcon={downIcon}
              checkIc={checkIc}
              SECURITY_SHEIELD={SECURITY_SHEIELD}
              EMAIL_VERIFY={EMAIL_VERIFY}
              PHONE_VERIFY={PHONE_VERIFY}
              GOOGLE_VERIFY={GOOGLE_VERIFY}
              PASSKEY_VERIFY={PASSKEY_VERIFY}
            />

            <AddWithdrawalAddressVerification
              isDark={isDark}
              themeColors={themeColors}
              saveAddrStep={saveAddrStep}
              selectedSaveAddrVerifyMethod={selectedSaveAddrVerifyMethod}
              saveAddrOtp={saveAddrOtp}
              setSaveAddrOtp={setSaveAddrOtp}
              saveAddrWhitelistData={saveAddrWhitelistData}
              userData={userData}
              saveAddrOtpTimer={saveAddrOtpTimer}
              saveAddrResendActive={saveAddrResendActive}
              handleResendSaveAddrOtp={handleResendSaveAddrOtp}
              saveAddrSatoshiPolling={saveAddrSatoshiPolling}
              satoshiWhitelistAwaitingProof={satoshiWhitelistAwaitingProof}
              setSatoshiDepositLoading={setSatoshiDepositLoading}
              setSaveAddrStep={setSaveAddrStep}
              satoshiDepositLoading={satoshiDepositLoading}
              satoshiDepositError={satoshiDepositError}
              handleSatoshiWhitelistSent={handleSatoshiWhitelistSent}
              SECURITY_SHEIELD={SECURITY_SHEIELD}
              LOCKED={LOCKED}
              bitcoinIcon={bitcoinIcon}
            />
          </ScrollView>

          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 20, paddingBottom: 10 }}>
            <Button
              children={saveAddrStep === "form" ? "Cancel" : "Back"}
              containerStyle={{
                flex: 1,
                marginRight: 10,
                backgroundColor: isDark ? "#333" : "#E5E7EB",
                borderRadius: 100,
                height: 50
              }}
              titleStyle={{ color: isDark ? "#FFF" : "#374151", fontWeight: "600" }}
              onPress={() => {
                if (saveAddrStep === "form") {
                  saveAddressSheetRef.current?.close();
                } else if (saveAddrStep === "owner") {
                  setSaveAddrStep("form");
                } else if (saveAddrStep === "other_identity") {
                  setSaveAddrStep("owner");
                } else if (saveAddrStep === "wallet_type") {
                  if (saveAddrOwnership === "SELF") setSaveAddrStep("owner");
                  else setSaveAddrStep("other_identity");
                } else if (saveAddrStep === "exchange") {
                  setSaveAddrStep("wallet_type");
                } else if (saveAddrStep === "proof_select") {
                  setSaveAddrStep("wallet_type");
                } else if (saveAddrStep === "verify_method") {
                  if (saveAddrWalletType === "EXCHANGE") setSaveAddrStep("exchange");
                  else {
                    if (saveAddrOwnership === "SELF") setSaveAddrStep("proof_select");
                    else setSaveAddrStep("wallet_type");
                  }
                } else if (saveAddrStep === "otp") {
                  setSaveAddrStep("verify_method");
                } else if (saveAddrStep === "satoshi" || saveAddrStep === "metamask") {
                  if (satoshiResumeMode) {
                    setSatoshiResumeMode(false);
                    saveAddressSheetRef.current?.close();
                  } else {
                    setSaveAddrStep("otp");
                  }
                }
              }}
            />
            {(() => {
              const isNextDisabled = saveAddrBusy || (
                (saveAddrStep === "form" && (saveAddrLabel.trim().length < 4 || !saveAddrCoin || !saveAddrNetwork || !withdrawAddress.trim())) ||
                (saveAddrStep === "owner" && !saveAddrOwnership) ||
                (saveAddrStep === "wallet_type" && !saveAddrWalletType) ||
                (saveAddrStep === "proof_select" && !saveAddrProofMethod) ||
                (saveAddrStep === "other_identity" && (!saveAddrBenFullName || !saveAddrBenPan || !saveAddrBenCountry || !saveAddrBenPin || !saveAddrBenAddress)) ||
                (saveAddrStep === "exchange" && !saveAddrExchange) ||
                (saveAddrStep === "verify_method" && !selectedSaveAddrVerifyMethod) ||
                (saveAddrStep === "otp" && saveAddrOtp.length < 6)
              );

              let buttonText = "Next";
              if (saveAddrStep === "verify_method" || saveAddrStep === "proof_select" || saveAddrStep === "other_identity") buttonText = "Continue";
              else if (saveAddrStep === "otp") buttonText = "Verify";
              else if (saveAddrStep === "satoshi") {
                if (saveAddrSatoshiPolling) buttonText = "Checking...";
                else if (satoshiWhitelistAwaitingProof) buttonText = "Check again";
                else buttonText = "I've sent the payment";
              }
              else if (saveAddrStep === "metamask") buttonText = "Close";

              return (
                <Button
                  children={saveAddrBusy ? "..." : buttonText}
                  disabled={isNextDisabled}
                  containerStyle={{
                    flex: 2,
                    marginLeft: 10,
                    backgroundColor: isNextDisabled ? (isDark ? "#222" : "#ccc") : "#111827",
                    borderRadius: 100,
                    height: 50,
                    opacity: isNextDisabled ? 0.6 : 1
                  }}
                  titleStyle={{ color: isNextDisabled ? (isDark ? "#555" : "#666") : "#FFF", fontWeight: "600" }}
                  onPress={async () => {
                    if (saveAddrStep === "satoshi") {
                      handleSatoshiWhitelistSent();
                      return;
                    }
                    if (saveAddrStep === "form") {
                      setSaveAddrStep("owner");
                      return;
                    }

                    if (saveAddrStep === "owner") {
                      if (saveAddrOwnership === "SELF") setSaveAddrStep("wallet_type");
                      else setSaveAddrStep("other_identity");
                      return;
                    }

                    if (saveAddrStep === "other_identity") {
                      setSaveAddrStep("wallet_type");
                      return;
                    }

                    if (saveAddrStep === "wallet_type") {
                      if (saveAddrWalletType === "EXCHANGE") {
                        setSaveAddrStep("exchange");
                      } else {
                        if (saveAddrOwnership === "SELF") setSaveAddrStep("proof_select");
                        else {
                          // For OTHER, self-hosted goes directly to verify_account in web?
                          // Actually, web goes to VERIFY_ACCOUNT.
                          setSaveAddrBusy(true);
                          try {
                            const res = await appOperation.customer.fetch_address_book_verification_options();
                            if (res?.success) {
                              const rawMethods = res?.data?.available_methods || [];
                              const methods = rawMethods.map(m => String(m).toLowerCase());
                              const rec = String(res?.data?.recommended || "").toLowerCase();

                              setSaveAddrVerifyOptions(methods);
                              setSaveAddrStep("verify_method");
                              if (methods.includes("email")) {
                                setSelectedSaveAddrVerifyMethod("email");
                              } else if (rec && methods.includes(rec)) {
                                setSelectedSaveAddrVerifyMethod(rec);
                              } else if (methods.length > 0) {
                                setSelectedSaveAddrVerifyMethod(methods[0]);
                              }
                              setSaveAddrResendActive(false);
                            } else {
                              showError(res?.message || "Could not load verification options");
                            }
                          } catch (e) {
                            showError("Error loading verification options");
                          } finally {
                            setSaveAddrBusy(false);
                          }
                        }
                      }
                      return;
                    }

                    if (saveAddrStep === "proof_select") {
                      setSaveAddrBusy(true);
                      try {
                        const res = await appOperation.customer.fetch_address_book_verification_options();
                        if (res?.success) {
                          const methods = res.data?.available_methods || [];
                          const rec = res.data?.recommended;
                          setSaveAddrVerifyOptions(methods);
                          setSaveAddrStep("verify_method");
                          if (methods.includes("email")) {
                            setSelectedSaveAddrVerifyMethod("email");
                          } else if (rec && methods.includes(rec)) {
                            setSelectedSaveAddrVerifyMethod(rec);
                          } else if (methods.length > 0) {
                            setSelectedSaveAddrVerifyMethod(methods[0]);
                          }
                        } else {
                          showError(res?.message || "Could not load verification options");
                        }
                      } catch (e) {
                        showError("Error loading verification options");
                      } finally {
                        setSaveAddrBusy(false);
                      }
                      return;
                    }

                    if (saveAddrStep === "exchange") {
                      if (!saveAddrExchange) {
                        showError("Please select an exchange");
                        return;
                      }
                      setSaveAddrBusy(true);
                      try {
                        const res = await appOperation.customer.fetch_address_book_verification_options();
                        if (res?.success) {
                          const methods = res.data?.available_methods || [];
                          const rec = res.data?.recommended;
                          setSaveAddrVerifyOptions(methods);
                          setSaveAddrStep("verify_method");
                          if (methods.includes("email")) {
                            setSelectedSaveAddrVerifyMethod("email");
                          } else if (rec && methods.includes(rec)) {
                            setSelectedSaveAddrVerifyMethod(rec);
                          } else if (methods.length > 0) {
                            setSelectedSaveAddrVerifyMethod(methods[0]);
                          }
                        } else {
                          showError(res?.message || "Could not load verification options");
                        }
                      } catch (e) {
                        showError("Error loading verification options");
                      } finally {
                        setSaveAddrBusy(false);
                      }
                      return;
                    }

                    if (saveAddrStep === "verify_method") {
                      let method = selectedSaveAddrVerifyMethod || (saveAddrVerifyOptions.includes("email") ? "email" : (saveAddrVerifyOptions.includes("mobile") ? "mobile" : saveAddrVerifyOptions[0]));
                      if (!method) method = "email"; // Hard fallback

                      if (method === "email" || method === "mobile") {
                        setSaveAddrBusy(true);
                        setSaveAddrOtpTimer(60);
                        setSaveAddrResendActive(false);
                        try {
                          // Try primary endpoint first (Web parity)
                          let res = await appOperation.customer.send_address_book_verification_otp({ method });

                          // Fallback to security OTP if primary fails
                          if (!res?.success) {
                            res = await appOperation.customer.withdrawal_verification_otp({ method });
                          }

                          if (res?.success) {
                            showSuccess(res.message || "Verification code sent");
                            setSaveAddrStep("otp");
                          } else {
                            showError(res?.message || "Could not send verification code");
                          }
                        } catch (e) {
                          showError("Error sending verification code");
                        } finally {
                          setSaveAddrBusy(false);
                        }
                      } else {
                        setSaveAddrStep("otp");
                      }
                      return;
                    }

                    if (saveAddrStep === "otp") {
                      if (!saveAddrOtp.trim()) {
                        showError("Please enter verification code");
                        return;
                      }
                      setSaveAddrBusy(true);
                      try {
                        const method = selectedSaveAddrVerifyMethod || (saveAddrVerifyOptions.includes("email") ? "email" : (saveAddrVerifyOptions.includes("mobile") ? "mobile" : saveAddrVerifyOptions[0])) || "email";
                        const coinObj = withdrawCoinsList.find(c => String(c.short_name).toUpperCase() === String(saveAddrCoin).toUpperCase());

                        let tId = "";
                        if (coinObj?.networks) {
                          // Find the network object that matches the selected chain (saveAddrNetwork)
                          const net = coinObj.networks.find(n =>
                            String(n.code).toUpperCase() === String(saveAddrNetwork).toUpperCase() ||
                            String(n.short_name).toUpperCase() === String(saveAddrNetwork).toUpperCase()
                          );
                          if (net) {
                            tId = net.tokenAssetId || net.assetId || net.id;
                          }
                        }

                        // Fallback to token_asset_ids if networks list doesn't yield an ID
                        if (!tId && coinObj?.token_asset_ids) {
                          const targetNet = String(saveAddrNetwork).toUpperCase();
                          tId = coinObj.token_asset_ids[saveAddrNetwork] || coinObj.token_asset_ids[targetNet];
                          if (!tId) {
                            const fuzzyKey = Object.keys(coinObj.token_asset_ids).find(k =>
                              k.toUpperCase().includes(targetNet) || targetNet.includes(k.toUpperCase())
                            );
                            if (fuzzyKey) tId = coinObj.token_asset_ids[fuzzyKey];
                          }
                        }
                        const resolvedAssetId = tId || saveAddrNetwork;

                        const payload = {
                          label: saveAddrLabel,
                          coin: saveAddrCoin,
                          chain: canonicalWithdrawalChainForValidateAddress(saveAddrNetwork),
                          address: saveAddrAddress,
                          memo: saveAddrMemo,
                          ownership: saveAddrOwnership === "SELF" ? "SELF" : "OTHER",
                          wallet_type: saveAddrWalletType === "SELF_HOSTED" ? "NON_CUSTODIAL" : "CUSTODIAL",
                          exchange: saveAddrExchange,
                          ...(saveAddrOwnership === "OTHER" ? {
                            other_person: {
                              full_name: saveAddrBenFullName.trim(),
                              national_id: saveAddrBenPan.trim(),
                              country: saveAddrBenCountry.trim(),
                              pincode: saveAddrBenPin.trim(),
                              full_address: saveAddrBenAddress.trim(),
                            }
                          } : {}),
                          verification_method: method,
                          method: saveAddrProofMethod || "SATOSHI",
                          verification_code: String(saveAddrOtp).trim(),
                          tokenAssetId: resolvedAssetId
                        };
                        console.warn("[API] Initiate Whitelist Payload:", JSON.stringify(payload, null, 2));
                        const res = await appOperation.customer.initiate_address_book_whitelist(payload);
                        console.warn("[API] Whitelist Response:", JSON.stringify(res, null, 2));
                        if (res?.success) {
                          const d = res.data?.data || res.data || {};
                          if (d.status?.toUpperCase() === "APPROVED") {
                            showSuccess("Address added and verified successfully.");
                            saveAddressSheetRef.current?.close();
                            const res2 = await appOperation.customer.get_wallet_address_book();
                            if (res2?.success && res2?.data) {
                              const list = Array.isArray(res2.data) ? res2.data : (res2.data.rows || res2.data.addresses || []);
                              setAddressBookEntries(list);
                            }
                          } else {
                            // Web Parity: Attach resolvedAssetId and shortName manually
                            const flowData = {
                              ...d,
                              tokenAssetId: resolvedAssetId,
                              shortName: saveAddrCoin
                            };
                            setSaveAddrWhitelistData(flowData);

                            const method = String(d.method || "").toUpperCase();
                            if (method === "SATOSHI") {
                              setSaveAddrStep("satoshi");
                              setSatoshiDepositLoading(true);

                              const coinObj = withdrawCoinsList.find(c => (c.coin || c.short_name || "").toUpperCase() === String(saveAddrCoin).toUpperCase());
                              let finalId = resolvedAssetId;

                              if (coinObj && d.proof_chain) {
                                const targetNet = String(d.proof_chain).toUpperCase();
                                // Priority 1: Check networks array for exact match or fuzzy match
                                const net = coinObj.networks?.find(n =>
                                  String(n.code).toUpperCase() === targetNet ||
                                  String(n.short_name).toUpperCase() === targetNet ||
                                  String(n.tokenAssetId || "").toUpperCase().includes(targetNet)
                                );

                                if (net?.tokenAssetId || net?.assetId) {
                                  finalId = net.tokenAssetId || net.assetId;
                                } else if (coinObj.token_asset_ids?.[d.proof_chain]) {
                                  finalId = coinObj.token_asset_ids[d.proof_chain];
                                } else {
                                  finalId = coinObj.coin || coinObj.short_name || targetNet;
                                }
                              }

                              (async () => {
                                try {
                                  console.warn("[DEBUG] Fetching address for:", finalId);
                                  const addrRes = await appOperation.customer.get_and_generate_address({
                                    assetId: finalId,
                                    tokenAssetId: finalId,
                                    short_name: saveAddrCoin,
                                    generate: true
                                  });
                                  console.warn("[API] Satoshi Address Response:", JSON.stringify(addrRes, null, 2));
                                  if (addrRes?.success) {
                                    const dr = addrRes.data?.data || addrRes.data || {};
                                    const raw = dr.deposit_address || dr.address || dr.wallet_address || dr.walletAddress || dr.depositAddress || "";
                                    const mem = dr.memo || dr.tag || dr.destinationTag || dr.memoTag || "";
                                    if (raw) {
                                      setSaveAddrWhitelistData(prev => ({
                                        ...prev,
                                        deposit_address: String(raw),
                                        address: String(raw),
                                        memo: String(mem)
                                      }));
                                    }
                                  }
                                } catch (e) {
                                  console.warn("Satoshi fetch failed", e);
                                } finally {
                                  setSatoshiDepositLoading(false);
                                }
                              })();
                            } else if (method === "METAMASK") {
                              setSaveAddrStep("metamask");
                            } else {
                              showSuccess("Address verification initiated.");
                              saveAddressSheetRef.current?.close();
                            }
                          }
                        } else {
                          showError(res?.message || "Verification failed");
                        }
                      } catch (e) {
                        showError(e?.message || "Error saving address");
                      } finally {
                        setSaveAddrBusy(false);
                      }
                    }
                  }}
                />
              );
            })()}
          </View>
        </View>
      </RBSheet>

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
  /** Web `withdraw_amt_meta_row` — available + network / refresh / 24h limits. */
  wdWithdrawMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
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
