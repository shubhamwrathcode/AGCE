import React, { useCallback, useState, useMemo, useRef, useEffect } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Vibration,
  Dimensions,
  Pressable,
  Modal,
} from "react-native";
import RBSheet from "react-native-raw-bottom-sheet";
import {
  AppSafeAreaView,
  AppText,
  FOURTEEN,
  SEMI_BOLD,
  TWELVE,
  TWENTY,
  TEN,
  BOLD,
  THIRTEEN,
  ELEVEN,
  FIFTEEN,
  MEDIUM,
  SIXTEEN,
  Input,
  Button,
} from "../../../shared";
import { ActivityIndicator, TextInput as RNTextInput } from "react-native";
import FastImage from "react-native-fast-image";
import {
  back_ic,
  searchIcon,
  bitcoinIcon,
  info_ic,
  printIcon,
  INFO,
  upIcon,
  downIcon,
  user_withdarwal,
  checkIc,
  down_arrow,
} from "../../../helper/ImageAssets";
import { buildCoinImageUri } from "../../../helper/coinIconUrl";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import NavigationService from "../../../navigation/NavigationService";
import { useAppSelector } from "../../../store/hooks";
import { useDispatch } from "react-redux";
import {
  getWithdrawActiveCoins,
  getUserMainWallet,
  withdrawCoin,
  verifyWithdraw
} from "../../../actions/walletActions";
import { colors } from "../../../theme/colors";
import {
  getActiveWithdrawChainKeys,
  isWithdrawCoinDisabled,
  networkKeysFromChain,
  parseNum,
  valueForChain,
  formatWithdrawAmountDisplay,
  totalSpendableFromFundRow,
  WITHDRAW_NETWORK_LABELS,
  canonicalWithdrawalChainForValidateAddress,
} from "../../../helper/walletChainHelpers";
import { showError, showSuccess } from "../../../helper/logger";
import { appOperation } from "../../../appOperation";

const { width, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = Math.round(SCREEN_HEIGHT * 0.8);

const AGCE_PHONE_COUNTRIES = [
  { flag: "🇮🇳", code: "+91", label: "India" },
  { flag: "🇦🇪", code: "+971", label: "UAE" },
  { flag: "🇸🇦", code: "+966", label: "Saudi Arabia" },
  { flag: "🇺🇸", code: "+1", label: "United States" },
  { flag: "🇬🇧", code: "+44", label: "United Kingdom" },
];

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

const WithdrawForm = () => {
  const dispatch = useDispatch();
  const route = useRoute();
  const theme = useAppSelector((state) => state.auth.theme);
  const isDark = theme === "Dark";
  const selectedCoin = route?.params?.data;

  const userMainWallet = useAppSelector((state) => state.wallet.userMainWallet || []);
  const [withdrawToTab, setWithdrawToTab] = useState("address"); // "address" | "agce"
  const [network, setNetwork] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdraw24hUsage, setWithdraw24hUsage] = useState(null);

  // States from WithdrawWallet.js logic
  const [isWithdrawAddressValidating, setIsWithdrawAddressValidating] = useState(false);
  const [withdrawAddressValidError, setWithdrawAddressValidError] = useState("");
  const [showWithdrawFaqModal, setShowWithdrawFaqModal] = useState(false);
  const [faqActiveIndex, setFaqActiveIndex] = useState(null);
  const [withdrawAmountTouched, setWithdrawAmountTouched] = useState(false);

  // AGCE User states
  const [agceRecipientTab, setAgceRecipientTab] = useState("email");
  const [agceRecipientEmail, setAgceRecipientEmail] = useState("");
  const [agceRecipientPhoneLocal, setAgceRecipientPhoneLocal] = useState("");
  const [agcePhoneCountry, setAgcePhoneCountry] = useState(() => AGCE_PHONE_COUNTRIES[0]);
  const [agceRecipientId, setAgceRecipientId] = useState("");
  const [agceTouched, setAgceTouched] = useState({ email: false, phone: false });

  // Address Book states
  const [showAddressBook, setShowAddressBook] = useState(false);
  const [addressBookSubTab, setAddressBookSubTab] = useState("recent");
  const [recentAddresses, setRecentAddresses] = useState([]);
  const [recentAddressesLoading, setRecentAddressesLoading] = useState(false);
  const [addressBookEntries, setAddressBookEntries] = useState([]);
  const [addressBookLoading, setAddressBookLoading] = useState(false);
  const [withdrawAddressTouched, setWithdrawAddressTouched] = useState(false);

  const withdrawAddressTouchedRef = useRef(false);
  const withdrawAddressValidationReqIdRef = useRef(0);
  const withdrawAddrValidateDebounceTimerRef = useRef(null);
  const validateWithdrawAddressApiRef = useRef(null);
  const withdrawLimitInfoSheetRef = useRef(null);
  const networkSheetRef = useRef(null);
  const agceCountrySheetRef = useRef(null);

  const coinIcon = useMemo(() => {
    const u = buildCoinImageUri(selectedCoin);
    return u ? { uri: u } : bitcoinIcon;
  }, [selectedCoin]);

  const mainWalletFundRow = useMemo(() => {
    if (!Array.isArray(userMainWallet) || !selectedCoin) return null;
    const cid = selectedCoin._id;
    const sym = String(selectedCoin.short_name || "").toUpperCase();
    return (
      userMainWallet.find((row) => {
        if (cid && row?.currency_id === cid) return true;
        if (sym && String(row?.short_name || row?.currency || "").toUpperCase() === sym) return true;
        return false;
      }) || null
    );
  }, [userMainWallet, selectedCoin]);

  const availableBalance = useMemo(() => {
    return totalSpendableFromFundRow(mainWalletFundRow);
  }, [mainWalletFundRow]);

  const activeNetworks = useMemo(() => {
    return getActiveWithdrawChainKeys(selectedCoin);
  }, [selectedCoin]);

  const selectedTokenAssetId = useMemo(() => {
    if (!selectedCoin || !network) return "";
    const fromMap = selectedCoin?.token_asset_ids?.[network];
    if (fromMap != null && String(fromMap).trim()) return String(fromMap).trim();
    return "";
  }, [selectedCoin, network]);

  const chainWithdrawalFee = useMemo(() => {
    if (!selectedCoin || !network) return 0;
    const raw = selectedCoin.withdrawal_fee || selectedCoin.withdraw_fee || {};
    const val = raw[network] ?? raw[String(network).toLowerCase()] ?? raw[String(network).toUpperCase()] ?? valueForChain(selectedCoin, "withdrawal_fee", network);
    return parseNum(val, 0);
  }, [selectedCoin, network]);

  const chainMinWithdrawal = useMemo(() => {
    if (!selectedCoin || !network) return 0;
    const raw = selectedCoin.min_withdrawal || selectedCoin.min_withdraw || {};
    const val = raw[network] ?? raw[String(network).toLowerCase()] ?? raw[String(network).toUpperCase()] ?? valueForChain(selectedCoin, "min_withdrawal", network);
    return parseNum(val, 0);
  }, [selectedCoin, network]);

  const withdrawStep3Preview = useMemo(() => {
    const isAgce = withdrawToTab === "agce";
    const sym = selectedCoin?.short_name || "—";
    if (!selectedCoin || (!isAgce && (!network || network === ""))) {
      return { networkCode: "—", limitLeft: "—", limitRight: "—", feeNum: null, receiveNum: null, sym };
    }
    const netCode = !isAgce ? String(network).toUpperCase() : "Internal";
    const feeNum = isAgce ? 0 : (Number.isFinite(chainWithdrawalFee) ? chainWithdrawalFee : null);
    const amt = parseFloat(String(withdrawAmount || "").replace(/,/g, ""));
    const receiveNum = isAgce
      ? (Number.isFinite(amt) && amt > 0 ? amt : null)
      : (feeNum != null && Number.isFinite(amt) && amt > 0 ? Math.max(0, amt - feeNum) : null);

    const remaining = Number(withdraw24hUsage?.remaining);
    const limitU = Number(withdraw24hUsage?.limit);
    const usageLine = Number.isFinite(remaining) && Number.isFinite(limitU) ? `${formatWithdrawAmountDisplay(remaining)} / ${formatWithdrawAmountDisplay(limitU)}` : "— / —";
    const parts = usageLine.split("/");
    return { networkCode: netCode, limitLeft: (parts[0] || "—").trim(), limitRight: (parts[1] || "—").trim(), feeNum, receiveNum, sym };
  }, [withdrawToTab, selectedCoin, network, withdrawAmount, chainWithdrawalFee, withdraw24hUsage]);

  const isAgceFormValid = useMemo(() => {
    if (agceRecipientTab === "email") return agceRecipientEmail.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(agceRecipientEmail);
    if (agceRecipientTab === "phone") return agceRecipientPhoneLocal.trim().length >= 6;
    if (agceRecipientTab === "agce") return agceRecipientId.trim().length > 0;
    return false;
  }, [agceRecipientTab, agceRecipientEmail, agceRecipientPhoneLocal, agceRecipientId]);

  const withdrawAddressInlineError = useMemo(() => {
    if (withdrawToTab !== "address") return "";
    if (!withdrawAddressTouched) return "";
    if (withdrawAddress.trim().length > 0) return "";
    return "Please enter Recipient's Address";
  }, [withdrawAddress, withdrawAddressTouched, withdrawToTab]);

  const fetchRecentAddresses = useCallback(async () => {
    try {
      setRecentAddressesLoading(true);
      const res = await appOperation.customer.withdrawal_address_history();
      if (res?.success && res?.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data.data || []);
        setRecentAddresses(list.map(item => ({
          address: item.address,
          network: item.chain || item.network,
          coin: item.coin,
        })));
      }
    } catch (err) {
      // ignore
    } finally {
      setRecentAddressesLoading(false);
    }
  }, []);

  const refetchAddressBook = useCallback(async () => {
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
  }, []);

  const handleWithdrawalAddress = (value) => {
    setWithdrawAddress(value);
    setWithdrawAddressValidError("");
    
    if (withdrawAddrValidateDebounceTimerRef.current) {
      clearTimeout(withdrawAddrValidateDebounceTimerRef.current);
    }
    
    withdrawAddrValidateDebounceTimerRef.current = setTimeout(() => {
      validateWithdrawAddressApiRef.current?.();
    }, 800);
  };

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
    if (availableBalance > 0 && amt > availableBalance) return "Insufficient funds";
    return "";
  }, [withdrawAmount, withdrawAmountTouched, availableBalance, chainMinWithdrawal]);

  const handleWithdrawalAmount = (val) => {
    setWithdrawAmount(val);
    if (!withdrawAmountTouched) setWithdrawAmountTouched(true);
  };

  useFocusEffect(
    useCallback(() => {
      dispatch(getUserMainWallet("main"));
      if (selectedCoin?.short_name) {
        // Fetch 24h usage for this specific coin
        appOperation.customer.withdrawal_24h_usage(selectedCoin.short_name).then(res => {
          if (res?.success) setWithdraw24hUsage(res.data);
        });
      }
    }, [dispatch, selectedCoin])
  );

  // Address Validation Logic
  useEffect(() => {
    if (withdrawAddress.length > 5 && network && withdrawToTab === "address") {
      const validate = async () => {
        setIsWithdrawAddressValidating(true);
        setWithdrawAddressValidError("");
        try {
          const chainCanon = canonicalWithdrawalChainForValidateAddress(network) || network.toUpperCase();
          const body = { address: withdrawAddress, chain: chainCanon };
          if (selectedTokenAssetId) body.tokenAssetId = selectedTokenAssetId;

          const r = await appOperation.customer.validate_withdraw_address(body);

          const root = r && typeof r === "object" ? r : {};
          const inner = root.data != null && typeof root.data === "object" && !Array.isArray(root.data) ? root.data : null;
          const data = inner || root;

          const validTrue = root.valid === true || data.valid === true || (typeof data.valid === "string" && String(data.valid).toLowerCase() === "true");
          const validFalse = root.valid === false || data.valid === false || (typeof data.valid === "string" && String(data.valid).toLowerCase() === "false");

          if (validFalse) {
            const msg = String(data?.message || root?.message || "").trim();
            setWithdrawAddressValidError(msg && msg.toLowerCase() !== "ok" ? msg : `Invalid address for ${network}`);
          } else {
            const successFlag = root.success === true || data.success === true;
            const msg = String(data?.message || root?.message || "").trim();
            const isAlreadyWhitelisted = msg.toLowerCase().includes("already whitelisted");
            const ok = (successFlag && validTrue) || validTrue === true || isAlreadyWhitelisted;
            if (!ok) {
              setWithdrawAddressValidError(msg && msg.toLowerCase() !== "ok" ? msg : `Invalid address for ${network}`);
            }
          }
        } catch (e) {
          // ignore network errors for validation
        } finally {
          setIsWithdrawAddressValidating(false);
        }
      };
      const timer = setTimeout(validate, 500);
      return () => clearTimeout(timer);
    }
  }, [withdrawAddress, network, withdrawToTab, selectedTokenAssetId]);

  const handleMax = () => {
    setWithdrawAmount(String(availableBalance));
  };

  return (
    <AppSafeAreaView style={{ backgroundColor: isDark ? colors.background : colors.white }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => NavigationService.goBack()} style={styles.headerIconBtn}>
          <FastImage source={back_ic} style={styles.backIcon} tintColor={isDark ? colors.white : colors.black} resizeMode="contain" />
        </TouchableOpacity>

        <View style={styles.headerCoinInfo}>
          <FastImage source={coinIcon} style={styles.headerCoinIcon} />
          <AppText weight={BOLD} type={SIXTEEN} style={{ color: isDark ? colors.white : colors.black }}>{selectedCoin?.short_name || "Withdrawal"}</AppText>
        </View>

        <View style={styles.headerRightIcons}>
          <TouchableOpacity onPress={() => setShowWithdrawFaqModal(true)} style={styles.headerIconBtn}>
            <FastImage source={INFO} style={[styles.headerRightIcon, { tintColor: isDark ? colors.white : colors.black }]} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => NavigationService.navigate("WITHDRAW_HISTORY_SCREEN")} style={styles.headerIconBtn}>
            <FastImage source={printIcon} style={[styles.headerRightIcon, { tintColor: isDark ? colors.white : colors.black }]} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            onPress={() => setWithdrawToTab("address")}
            style={[styles.tabBtn, withdrawToTab === "address" && styles.activeTabBtn]}
          >
            <AppText
              weight={SEMI_BOLD}
              type={SIXTEEN}
              style={{ color: withdrawToTab === "address" ? (isDark ? colors.white : colors.black) : colors.textGray }}
            >
              Address
            </AppText>
            {withdrawToTab === "address" && <View style={[styles.activeTabIndicator, { backgroundColor: isDark ? colors.white : colors.black }]} />}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setWithdrawToTab("agce")}
            style={[styles.tabBtn, withdrawToTab === "agce" && styles.activeTabBtn]}
          >
            <AppText
              weight={SEMI_BOLD}
              type={SIXTEEN}
              style={{ color: withdrawToTab === "agce" ? (isDark ? colors.white : colors.black) : colors.textGray }}
            >
              AGCE User
            </AppText>
            {withdrawToTab === "agce" && <View style={[styles.activeTabIndicator, { backgroundColor: isDark ? colors.white : colors.black }]} />}
          </TouchableOpacity>
        </View>

        {withdrawToTab === "address" ? (
          <View style={styles.formContainer}>
            {/* Address Field */}
            <View style={styles.inputGroup}>
              <AppText weight={SEMI_BOLD} type={FOURTEEN} style={styles.inputLabel}>Address</AppText>
              <View style={[styles.inputWrapper, { backgroundColor: isDark ? "#1E1E1E" : "#F8F9FA" }]}>
                <TextInput
                  placeholder="Enter Address"
                  placeholderTextColor={colors.textGray}
                  value={withdrawAddress}
                  onChangeText={handleWithdrawalAddress}
                  onBlur={() => setWithdrawAddressTouched(true)}
                  style={[styles.textInput, { color: isDark ? colors.white : colors.black }]}
                />
                <TouchableOpacity onPress={() => {
                  const next = !showAddressBook;
                  setShowAddressBook(next);
                  if (next) {
                    fetchRecentAddresses();
                    refetchAddressBook();
                  }
                }}>
                  <FastImage source={user_withdarwal} style={styles.innerIcon} tintColor={colors.textGray} />
                </TouchableOpacity>
              </View>

              {/* Validation Feedback */}
              {isWithdrawAddressValidating ? (
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6, gap: 6 }}>
                  <ActivityIndicator size="small" color={colors.orangeTheme} />
                  <AppText type={TWELVE} style={{ color: colors.orangeTheme }}>Validating address...</AppText>
                </View>
              ) : withdrawAddressValidError ? (
                <AppText type={TWELVE} style={{ color: colors.red, marginTop: 6 }}>
                  {withdrawAddressValidError}
                </AppText>
              ) : null}

              {/* Address Book Panel */}
              {showAddressBook && (
                <View style={[styles.addressBookPanel, { borderColor: isDark ? "#333" : "#EEE" }]}>
                  <View style={styles.addressBookTabs}>
                    <TouchableOpacity
                      onPress={() => setAddressBookSubTab("recent")}
                      style={[styles.addressBookTab, addressBookSubTab === "recent" && { backgroundColor: isDark ? "#333" : "#F3F4F6" }]}
                    >
                      <AppText weight={SEMI_BOLD} type={TWELVE} style={{ color: addressBookSubTab === "recent" ? (isDark ? colors.white : colors.black) : colors.textGray }}>Recent</AppText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setAddressBookSubTab("saved")}
                      style={[styles.addressBookTab, addressBookSubTab === "saved" && { backgroundColor: isDark ? "#333" : "#F3F4F6" }]}
                    >
                      <AppText weight={SEMI_BOLD} type={TWELVE} style={{ color: addressBookSubTab === "saved" ? (isDark ? colors.white : colors.black) : colors.textGray }}>My Address</AppText>
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                    {addressBookSubTab === "recent" ? (
                      recentAddressesLoading ? (
                        <ActivityIndicator color={colors.yellow} style={{ marginVertical: 20 }} />
                      ) : recentAddresses.length > 0 ? (
                        recentAddresses.map((item, idx) => (
                          <TouchableOpacity
                            key={idx}
                            onPress={() => {
                              setWithdrawAddress(item.address);
                              if (item.network) setNetwork(item.network);
                              setShowAddressBook(false);
                            }}
                            style={[styles.addressItem, { borderColor: isDark ? "#333" : "#F0F0F0" }]}
                          >
                            <AppText weight={SEMI_BOLD} type={TWELVE} style={{ color: isDark ? colors.white : colors.black }}>{item.coin} ({item.network})</AppText>
                            <AppText type={TEN} style={{ color: colors.textGray, marginTop: 4 }}>{item.address}</AppText>
                          </TouchableOpacity>
                        ))
                      ) : (
                        <AppText type={TEN} style={{ color: colors.textGray, textAlign: "center", marginVertical: 20 }}>No recent addresses</AppText>
                      )
                    ) : (
                      addressBookLoading ? (
                        <ActivityIndicator color={colors.yellow} style={{ marginVertical: 20 }} />
                      ) : addressBookEntries.length > 0 ? (
                        addressBookEntries.map((item, idx) => (
                          <TouchableOpacity
                            key={idx}
                            onPress={() => {
                              setWithdrawAddress(item.address);
                              if (item.network || item.chain) setNetwork(item.network || item.chain);
                              setShowAddressBook(false);
                            }}
                            style={[styles.addressItem, { borderColor: isDark ? "#333" : "#F0F0F0" }]}
                          >
                            <AppText weight={SEMI_BOLD} type={TWELVE} style={{ color: isDark ? colors.white : colors.black }}>{item.name || item.label || "Saved Address"}</AppText>
                            <AppText type={TEN} style={{ color: colors.textGray, marginTop: 4 }}>{item.address}</AppText>
                          </TouchableOpacity>
                        ))
                      ) : (
                        <AppText type={TEN} style={{ color: colors.textGray, textAlign: "center", marginVertical: 20 }}>No saved addresses</AppText>
                      )
                    )}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Network Field */}
            <View style={styles.inputGroup}>
              <AppText weight={SEMI_BOLD} type={FOURTEEN} style={styles.inputLabel}>Network</AppText>
              <TouchableOpacity
                onPress={() => networkSheetRef.current?.open()}
                activeOpacity={0.7}
                style={[styles.inputWrapper, { backgroundColor: isDark ? "#1E1E1E" : "#F8F9FA" }]}
              >
                <AppText weight={MEDIUM} type={FOURTEEN} style={{ flex: 1, color: network ? (isDark ? colors.white : colors.black) : colors.textGray }}>
                  {WITHDRAW_NETWORK_LABELS[network] || network || "Select Network"}
                </AppText>
                <FastImage source={down_arrow} style={{ width: 14, height: 14 }} resizeMode="contain" tintColor={colors.textGray} />
              </TouchableOpacity>
              {withdrawAddress.length > 0 && !network && activeNetworks.length > 0 && (
                <AppText type={TEN} style={{ color: colors.red, marginTop: 4 }}>Please select a network</AppText>
              )}
            </View>

            {/* Amount Field */}
            <View style={styles.inputGroup}>
              <AppText weight={SEMI_BOLD} type={FOURTEEN} style={styles.inputLabel}>Withdrawal Amount</AppText>
              <View style={[styles.inputWrapper, { backgroundColor: isDark ? "#1E1E1E" : "#F8F9FA" }]}>
                <RNTextInput
                  placeholder={`Min ${chainMinWithdrawal || 0}`}
                  placeholderTextColor={colors.textGray}
                  value={withdrawAmount}
                  onChangeText={handleWithdrawalAmount}
                  onBlur={() => setWithdrawAmountTouched(true)}
                  keyboardType="numeric"
                  style={[styles.textInput, { color: isDark ? colors.white : colors.black }]}
                />
                <View style={styles.amountRightWrap}>
                  <AppText weight={SEMI_BOLD} type={TWELVE} style={{ color: isDark ? colors.white : colors.black }}>{selectedCoin?.short_name}</AppText>
                  <View style={styles.verticalDivider} />
                  <TouchableOpacity onPress={handleMax}>
                    <AppText weight={SEMI_BOLD} type={TWELVE} style={{ color: colors.orangeTheme }}>MAX</AppText>
                  </TouchableOpacity>
                </View>
              </View>

              {withdrawAmountInlineError ? (
                <AppText weight={SEMI_BOLD} type={TEN} style={{ color: colors.red, marginTop: 4 }}>{withdrawAmountInlineError}</AppText>
              ) : null}

              <View style={styles.balanceInfoRow}>
                <AppText type={TWELVE} style={{ color: colors.textGray }}>Available Balance</AppText>
                <View style={styles.balanceRight}>
                  <AppText weight={SEMI_BOLD} type={TWELVE} style={{ color: isDark ? colors.white : colors.black }}>{availableBalance} {selectedCoin?.short_name}</AppText>
                </View>
              </View>
            </View>

            {/* Error Message */}

            {/* Warning Section */}
            <View style={styles.warningBox}>
              <AppText type={ELEVEN} style={{ color: colors.textGray, lineHeight: 18 }}>
                <AppText weight={SEMI_BOLD} style={{ color: colors.textGray }}>* Beware of scams!</AppText>{"\n"}
                Never share your passwords, OTPs, recovery phrases, or private keys with anyone. Always verify wallet addresses before confirming transactions.
              </AppText>
            </View>
          </View>
        ) : (
          <View style={styles.formContainer}>
            {/* AGCE User Sub-Tabs */}
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
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
                      backgroundColor: active ? (isDark ? "#333" : "#F3F4F6") : "transparent"
                    }}
                  >
                    <AppText weight={SEMI_BOLD} type={TWELVE} style={{ color: active ? (isDark ? colors.white : colors.black) : colors.textGray }}>
                      {t.label}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>

            {agceRecipientTab === "email" && (
              <View style={styles.inputGroup}>
                <AppText weight={SEMI_BOLD} type={FOURTEEN} style={styles.inputLabel}>Recipient's email</AppText>
                <View style={[styles.inputWrapper, { backgroundColor: isDark ? "#1E1E1E" : "#F8F9FA" }]}>
                  <TextInput
                    placeholder="Enter recipient's email"
                    placeholderTextColor={colors.textGray}
                    value={agceRecipientEmail}
                    onChangeText={setAgceRecipientEmail}
                    style={[styles.textInput, { color: isDark ? colors.white : colors.black }]}
                    autoCapitalize="none"
                  />
                </View>
              </View>
            )}

            {agceRecipientTab === "phone" && (
              <View style={styles.inputGroup}>
                <AppText weight={SEMI_BOLD} type={FOURTEEN} style={styles.inputLabel}>Recipient's phone</AppText>
                <View style={[styles.inputWrapper, { backgroundColor: isDark ? "#1E1E1E" : "#F8F9FA", paddingLeft: 0 }]}>
                  <TouchableOpacity
                    onPress={() => agceCountrySheetRef.current?.open()}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 12,
                      borderRightWidth: 1,
                      borderRightColor: isDark ? "#333" : "#EEE",
                      height: "100%"
                    }}
                  >
                    <AppText type={TWELVE}>{agcePhoneCountry.flag}</AppText>
                    <AppText type={TWELVE} weight={SEMI_BOLD} style={{ marginLeft: 4, color: isDark ? colors.white : colors.black }}>
                      {agcePhoneCountry.code}
                    </AppText>
                    <FastImage source={downIcon} style={{ width: 10, height: 10, marginLeft: 4 }} tintColor={colors.textGray} />
                  </TouchableOpacity>
                  <TextInput
                    placeholder="Phone number"
                    placeholderTextColor={colors.textGray}
                    value={agceRecipientPhoneLocal}
                    onChangeText={setAgceRecipientPhoneLocal}
                    style={[styles.textInput, { color: isDark ? colors.white : colors.black, marginLeft: 12 }]}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
            )}

            {agceRecipientTab === "agce" && (
              <View style={styles.inputGroup}>
                <AppText weight={SEMI_BOLD} type={FOURTEEN} style={styles.inputLabel}>Username or UID</AppText>
                <View style={[styles.inputWrapper, { backgroundColor: isDark ? "#1E1E1E" : "#F8F9FA" }]}>
                  <TextInput
                    placeholder="Enter AGCE username or UID"
                    placeholderTextColor={colors.textGray}
                    value={agceRecipientId}
                    onChangeText={setAgceRecipientId}
                    style={[styles.textInput, { color: isDark ? colors.white : colors.black }]}
                    autoCapitalize="none"
                  />
                </View>
                <AppText type={TEN} style={{ color: colors.textGray, marginTop: 8 }}>
                  Payee can find AGCE ID under Avatar → Dashboard.
                </AppText>
              </View>
            )}

            {/* Common Amount Field for AGCE User */}
            <View style={styles.inputGroup}>
              <AppText weight={SEMI_BOLD} type={FOURTEEN} style={styles.inputLabel}>Amount</AppText>
              <View style={[styles.inputWrapper, { backgroundColor: isDark ? "#1E1E1E" : "#F8F9FA" }]}>
                <RNTextInput
                  placeholder={`Min ${chainMinWithdrawal || 0}`}
                  placeholderTextColor={colors.textGray}
                  value={withdrawAmount}
                  onChangeText={handleWithdrawalAmount}
                  onBlur={() => setWithdrawAmountTouched(true)}
                  style={[styles.textInput, { color: isDark ? colors.white : colors.black }]}
                  keyboardType="numeric"
                />
                <TouchableOpacity onPress={handleMax}>
                  <AppText weight={BOLD} type={FOURTEEN} style={{ color: colors.orangeTheme, marginRight: 8 }}>MAX</AppText>
                </TouchableOpacity>
                <View style={{ width: 1, height: 20, backgroundColor: isDark ? "#333" : "#EEE", marginRight: 12 }} />
                <AppText weight={MEDIUM} type={FOURTEEN} style={{ color: isDark ? colors.white : colors.black }}>
                  {selectedCoin?.short_name}
                </AppText>
              </View>
            </View>

            {withdrawAmountInlineError ? (
              <AppText weight={SEMI_BOLD} type={TEN} style={{ color: colors.red, marginTop: 4 }}>{withdrawAmountInlineError}</AppText>
            ) : null}

            {/* Summary Block for AGCE */}
            <View style={[styles.summaryBlock, { backgroundColor: isDark ? "#1A1A1A" : "#F8F9FA", borderColor: isDark ? "#333" : "#EEE" }]}>
              <View style={styles.summaryRow}>
                <AppText type={TWELVE} style={{ color: colors.textGray }}>Available</AppText>
                <AppText weight={MEDIUM} type={TWELVE} style={{ color: isDark ? colors.white : colors.black }}>
                  {availableBalance} {selectedCoin?.short_name}
                </AppText>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <AppText type={TWELVE} style={{ color: colors.textGray }}>Transfer Type</AppText>
                <AppText weight={MEDIUM} type={TWELVE} style={{ color: isDark ? colors.white : colors.black }}>Internal Transfer</AppText>
              </View>
              <View style={styles.summaryRow}>
                <AppText type={TWELVE} style={{ color: colors.textGray }}>You will receive</AppText>
                <AppText weight={BOLD} type={FOURTEEN} style={{ color: colors.orangeTheme }}>
                  {withdrawStep3Preview.receiveNum || 0} {selectedCoin?.short_name}
                </AppText>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: isDark ? "#333" : "#EEE", backgroundColor: colors.white }]}>
        <View style={styles.footerRow}>
          <AppText type={TWELVE} style={{ color: colors.textGray }}>Network Fee</AppText>
          <AppText weight={SEMI_BOLD} type={THIRTEEN} style={{ color: isDark ? colors.white : colors.black }}>{chainWithdrawalFee} {selectedCoin?.short_name}</AppText>
        </View>
        <View style={styles.footerRow}>
          <AppText type={TWELVE} style={{ color: colors.textGray }}>Receive Amount</AppText>
          <View style={styles.footerReceiveWrap}>
            <AppText weight={SEMI_BOLD} type={THIRTEEN} style={{ color: isDark ? colors.white : colors.black }}>{withdrawStep3Preview.receiveNum || 0} {selectedCoin?.short_name}</AppText>
          </View>
        </View>
        <Button
          onPress={() => NavigationService.navigate("WITHDRAW_VERIFY_SCREEN", {
            data: {
              address: withdrawToTab === "address" ? withdrawAddress : (agceRecipientTab === "email" ? agceRecipientEmail : agceRecipientTab === "phone" ? (agcePhoneCountry.code + agceRecipientPhoneLocal) : agceRecipientId),
              amount: withdrawAmount,
              coin: selectedCoin?.short_name,
              network: withdrawToTab === "address" ? network : "Internal",
              type: withdrawToTab
            }
          })}
          containerStyle={[styles.withdrawBtn, { backgroundColor: colors.black }]}
          disabled={withdrawToTab === "address" ? (!withdrawAmount || !withdrawAddress || !network) : (!withdrawAmount || !isAgceFormValid)}
        >
          Withdraw
        </Button>
      </View>

      <RBSheet
        ref={withdrawLimitInfoSheetRef}
        height={210}
        closeOnDragDown
        closeOnPressMask
        customStyles={{
          container: {
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            backgroundColor: isDark ? "#1E1E1E" : colors.white,
          },
          wrapper: { backgroundColor: "rgba(0,0,0,0.6)" },
          draggableIcon: { backgroundColor: colors.textGray },
        }}
      >
        <Pressable
          style={{ paddingHorizontal: 20, paddingBottom: 28, paddingTop: 4 }}
          onPress={() => withdrawLimitInfoSheetRef.current?.close()}
        >
          <AppText weight={SEMI_BOLD} type={SIXTEEN} style={{ color: isDark ? colors.white : colors.black, marginBottom: 10 }}>
            24h withdrawal limit
          </AppText>
          <AppText type={TWELVE} style={{ color: colors.textGray, lineHeight: 18 }}>
            {withdraw24hUsage?.limit_left ?? "0"} {selectedCoin?.short_name} 24 Hour withdrawal limit.
          </AppText>
        </Pressable>
      </RBSheet>

      <RBSheet
        ref={networkSheetRef}
        height={SHEET_HEIGHT}
        closeOnDragDown
        closeOnPressMask
        customStyles={{
          container: { borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: isDark ? "#1E1E1E" : colors.white },
          wrapper: { backgroundColor: "rgba(0,0,0,0.6)" },
          draggableIcon: { backgroundColor: colors.textGray },
        }}
      >
        <View style={{ flex: 1, padding: 20 }}>
          <AppText weight={SEMI_BOLD} type={SIXTEEN} style={{ color: isDark ? colors.white : colors.black, marginBottom: 20 }}>
            Choose Network
          </AppText>
          <ScrollView showsVerticalScrollIndicator={false}>
            {activeNetworks.map((chainKey, idx) => {
              const fullName = selectedCoin?.chain_full_names?.[chainKey] || chainKey;
              const minW = valueForChain(selectedCoin, "min_withdrawal", chainKey);
              const feeW = valueForChain(selectedCoin, "withdrawal_fee", chainKey);
              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => {
                    setNetwork(chainKey);
                    networkSheetRef.current?.close();
                  }}
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: isDark ? "#333" : "#EEE",
                    marginBottom: 12,
                  }}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                    <AppText weight={SEMI_BOLD} type={FOURTEEN} style={{ color: isDark ? colors.white : colors.black }}>{chainKey}</AppText>
                    <AppText type={TWELVE} style={{ color: colors.textGray }}>{fullName}</AppText>
                  </View>
                  <AppText type={TEN} style={{ color: colors.textGray }}>Min. withdrawal: {minW || 0} {selectedCoin?.short_name}</AppText>
                  <AppText type={TEN} style={{ color: colors.textGray }}>Fee: {feeW || 0} {selectedCoin?.short_name}</AppText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </RBSheet>

      <RBSheet
        ref={agceCountrySheetRef}
        height={Math.round(SCREEN_HEIGHT * 0.5)}
        closeOnDragDown
        closeOnPressMask
        customStyles={{
          container: { borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: isDark ? "#1E1E1E" : colors.white },
          wrapper: { backgroundColor: "rgba(0,0,0,0.6)" },
          draggableIcon: { backgroundColor: colors.textGray },
        }}
      >
        <View style={{ flex: 1, padding: 20 }}>
          <AppText weight={SEMI_BOLD} type={SIXTEEN} style={{ color: isDark ? colors.white : colors.black, marginBottom: 12 }}>
            Select country
          </AppText>
          <ScrollView showsVerticalScrollIndicator={false}>
            {AGCE_PHONE_COUNTRIES.map((c, idx) => (
              <TouchableOpacity
                key={c.code}
                onPress={() => {
                  setAgcePhoneCountry(c);
                  agceCountrySheetRef.current?.close();
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 14,
                  borderBottomWidth: idx < AGCE_PHONE_COUNTRIES.length - 1 ? 1 : 0,
                  borderBottomColor: isDark ? "#333" : "#F0F0F0"
                }}
              >
                <AppText type={FOURTEEN}>{c.flag}</AppText>
                <AppText weight={SEMI_BOLD} type={THIRTEEN} style={{ color: isDark ? colors.white : colors.black, marginLeft: 12, minWidth: 40 }}>
                  {c.code}
                </AppText>
                <AppText type={TWELVE} style={{ color: colors.textGray, flex: 1 }}>{c.label}</AppText>
                {agcePhoneCountry.code === c.code && <FastImage source={checkIc} style={{ width: 12, height: 12 }} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </RBSheet>

      <Modal visible={showWithdrawFaqModal} animationType="slide" transparent onRequestClose={() => setShowWithdrawFaqModal(false)}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: isDark ? "#1E1E1E" : colors.white, borderColor: isDark ? "#333" : "#EEE", borderWidth: 1 },
            ]}
          >
            <View style={styles.modalHeader}>
              <AppText weight={SEMI_BOLD} type={SIXTEEN} style={{ color: isDark ? colors.white : colors.black }}>
                Withdraw help
              </AppText>
              <TouchableOpacity onPress={() => setShowWithdrawFaqModal(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <AppText type={TWENTY} style={{ color: isDark ? colors.white : colors.black }}>
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
                    { borderColor: isDark ? "#333" : "#F0F0F0" },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.faqQuestionRow}
                    onPress={() => setFaqActiveIndex(faqActiveIndex === index ? null : index)}
                    activeOpacity={0.7}
                  >
                    <AppText type={THIRTEEN} weight={SEMI_BOLD} style={[styles.faqQuestion, { color: isDark ? colors.white : colors.black }]}>
                      {item.title}
                    </AppText>
                    <FastImage
                      source={faqActiveIndex === index ? upIcon : downIcon}
                      resizeMode="contain"
                      style={styles.faqArrow}
                      tintColor={colors.textGray}
                    />
                  </TouchableOpacity>
                  {faqActiveIndex === index && (
                    <View style={styles.faqAnswer}>
                      {item.content.split("\n").map((line, lineIndex) => (
                        <AppText key={lineIndex} type={TWELVE} style={{ color: colors.textGray, lineHeight: 18 }}>
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

export default WithdrawForm;

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, height: 56, justifyContent: "space-between" },
  headerIconBtn: { padding: 8 },
  backIcon: { width: 20, height: 20 },
  headerCoinInfo: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerCoinIcon: { width: 32, height: 32, borderRadius: 16 },
  headerRightIcons: { flexDirection: "row", alignItems: "center" },
  headerRightIcon: { width: 20, height: 20, tintColor: colors.black },

  scrollContent: { paddingBottom: 120 },
  tabsContainer: { flexDirection: "row", paddingHorizontal: 16, marginTop: 12, gap: 24 },
  tabBtn: { paddingBottom: 6, position: "relative" },
  activeTabIndicator: { position: "absolute", bottom: 0, left: 0, right: 0, height: 2, borderRadius: 2 },

  formContainer: { paddingHorizontal: 16, marginTop: 16 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { color: colors.textGray, marginBottom: 6 },
  inputWrapper: { flexDirection: "row", alignItems: "center", height: 50, borderRadius: 12, paddingHorizontal: 16 },
  textInput: { flex: 1, fontSize: 14, fontWeight: "500" },
  innerIcon: { width: 20, height: 20 },

  amountRightWrap: { flexDirection: "row", alignItems: "center", gap: 12 },
  verticalDivider: { width: 1, height: 20, backgroundColor: colors.textGray, opacity: 0.3 },
  balanceInfoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8, paddingHorizontal: 5 },
  balanceRight: { flexDirection: "row", alignItems: "center", gap: 4 },
  switchIcon: { width: 14, height: 14, transform: [{ rotate: "90deg" }] },

  warningBox: { marginTop: 8 },

  footer: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 16, borderTopWidth: 1 },
  footerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  footerReceiveWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  refreshIcon: { width: 14, height: 14, transform: [{ rotate: "0deg" }] },
  withdrawBtn: { marginTop: 8, borderRadius: 12, height: 48 },

  networkScroll: { gap: 12, paddingRight: 16 },
  networkChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, minWidth: 80, alignItems: "center", justifyContent: "center" },
  activeNetworkChip: { borderWidth: 1, borderColor: colors.orangeTheme },

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
  faqItemInner: {
    paddingVertical: 12,
    borderBottomWidth: 0.5,
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
    borderTopColor: "rgba(128,128,128,0.1)",
  },

  summaryBlock: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "rgba(128,128,128,0.1)",
    marginVertical: 8,
  },

  addressBookPanel: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
  },
  addressBookTabs: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  addressBookTab: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 100,
  },
  addressItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
});
