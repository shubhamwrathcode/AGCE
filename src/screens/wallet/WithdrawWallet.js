import { StyleSheet, View, TextInput, TouchableOpacity, FlatList, Keyboard, ScrollView, RefreshControl } from "react-native";
import {
  AppSafeAreaView,
  AppText,
  BLACK,
  Button,
  DISCLAIMTEXT,
  EIGHT,
  EIGHTEEN,
  ELEVEN,
  FOURTEEN,
  FIFTEEN,
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
  moonIcon,
  moreOption,
  printIcon,
  qrCodeIcon,
  rectangleIcon,
  upIcon,
  downIcon,
} from "../../helper/ImageAssets";
import NavigationService from "../../navigation/NavigationService";
import FastImage from "react-native-fast-image";
import { colors } from "../../theme/colors";
import { useTheme } from "../../hooks/useTheme";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useDispatch } from "react-redux";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { BASE_URL } from "../../helper/Constants";
import { SETTING_SCREEN_New, SETTINGS_SCREEN, WITHDRAW_SCREEN, NOTIFICATION_SCREEN } from "../../navigation/routes";
import { useAppSelector } from "../../store/hooks";
import {
  getWithdrawActiveCoins,
  getUserMainWallet,
  withdrawCoin,
  getAllCoins
} from "../../actions/walletActions";
import { forgotOtp } from "../../actions/authActions";
import { showError } from "../../helper/logger";
import {
  getActiveWithdrawChainKeys,
  parseNum,
  valueForChain,
} from "../../helper/walletChainHelpers";
import { getNotificationList } from "../../actions/homeActions";
import moment from "moment";

const WithdrawWallet = () => {
  const dispatch = useDispatch();
  const route = useRoute();
  const { colors: themeColors, isDark } = useTheme();
  const routeCoin = route?.params?.data;
  const userData = useAppSelector((state) => state.auth.userData);
  const userMainWallet = useAppSelector((state) => state.wallet.userMainWallet);
  const withdrawActiveCoins = useAppSelector((state) => state.wallet.withdrawActiveCoins);

  const { emailId } = userData ?? "";

  const [withdrawFlowPhase, setWithdrawFlowPhase] = useState(() =>
    routeCoin && typeof routeCoin === "object" && Object.keys(routeCoin).length > 0
      ? "withdraw"
      : "selectCoin"
  );
  const [selectedCurrency, setSelectedCurrency] = useState(routeCoin || {});
  const [network, setNetwork] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [availableBalance, setAvailableBalance] = useState("");
  const [isValidWalletAddress, setIsValidWalletAddress] = useState(true);
  const [otp, setOtp] = useState("");
  const [otpText, setOtpText] = useState("Get OTP");
  const [disableBtn, setDisableBtn] = useState(false);
  const [timer, setTimer] = useState(0);
  const [allCoinData, setAllCoinData] = useState([]);
  const [faqActiveIndex, setFaqActiveIndex] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [activeAnnouncementSections, setActiveAnnouncementSections] = useState([]);
  const notificationList = useAppSelector((state) => state.home.notificationList);

  const [withdrawCoinsLoading, setWithdrawCoinsLoading] = useState(() => {
    if (routeCoin && typeof routeCoin === "object" && Object.keys(routeCoin).length > 0) return false;
    return !(withdrawActiveCoins && withdrawActiveCoins.length > 0);
  });

  const isFirstLoad = useRef(true);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    console.log("Pull to refresh triggered! Fetching latest withdraw data...");
    setRefreshing(true);
    if (withdrawFlowPhase === "selectCoin") {
      await dispatch(getWithdrawActiveCoins());
    } else {
      await Promise.all([
        dispatch(getWithdrawActiveCoins()),
        dispatch(getUserMainWallet('main')),
        getAllCoinsData()
      ]);
    }
    setRefreshing(false);
    console.log("Refresh Complete.");
  }, [dispatch, withdrawFlowPhase]);

  const activeWithdrawChains = useMemo(
    () => getActiveWithdrawChainKeys(selectedCurrency),
    [selectedCurrency]
  );

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
      const onSelectStep = withdrawFlowPhase === "selectCoin";
      if (onSelectStep && isFirstLoad.current) {
        if (!withdrawActiveCoins || withdrawActiveCoins.length === 0) {
          setWithdrawCoinsLoading(true);
        }
      }
      (async () => {
        await dispatch(getWithdrawActiveCoins());
        if (!cancelled && onSelectStep) {
          setWithdrawCoinsLoading(false);
          isFirstLoad.current = false;
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [dispatch, withdrawFlowPhase])
  );

  useEffect(() => {
    if (routeCoin && Object.keys(routeCoin).length > 0) {
      setSelectedCurrency(routeCoin);
      setWithdrawFlowPhase("withdraw");
    }
    dispatch(getUserMainWallet('main'));
    getAllCoinsData();
    dispatch(getNotificationList());
  }, []);

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

  const getAllCoinsData = async () => {
    const coins = await dispatch(getAllCoins());
    if (coins) {
      setAllCoinData(coins);
    }
  };

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

  const goToSelectCoinPhase = () => {
    setWithdrawFlowPhase("selectCoin");
    setSelectedCurrency({});
    setNetwork("");
    setWithdrawAddress("");
    setWithdrawAmount("");
    setOtp("");
    setIsValidWalletAddress(true);
  };

  const handleHeaderBack = () => {
    if (withdrawFlowPhase === "withdraw") {
      goToSelectCoinPhase();
    } else {
      NavigationService.goBack();
    }
  };

  const handleSelectCurrency = (coin) => {
    setSelectedCurrency(coin);
    setNetwork("");
    setWithdrawAmount("");
    setWithdrawAddress("");
    setWithdrawFlowPhase("withdraw");
    dispatch(getUserMainWallet('main'));
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
      <View style={[styles.faqHeader, {
        backgroundColor: isDark ? "#1A1A1A" : "#F5F5F5",
        borderColor: isDark ? themeColors.border : "#EEE"
      }]}>
        <View style={{ flex: 1 }}>
          <AppText weight={SEMI_BOLD} type={FOURTEEN} style={{ marginBottom: 3 }}>
            {section.title}
          </AppText>
          <AppText color={DISCLAIMTEXT} type={TEN}>
            {section.date}
          </AppText>
        </View>
        <AppText weight={SEMI_BOLD} color={themeColors.text} type={EIGHTEEN}>
          {isActive ? "−" : "+"}
        </AppText>
      </View>
    );
  };

  const _renderAnnouncementContent = (section) => {
    return (
      <View style={[styles.faqContent, {
        backgroundColor: isDark ? themeColors.background : "#FFFFFF",
        borderColor: isDark ? themeColors.border : "#EEE"
      }]}>
        <AppText color={themeColors.secondaryText} type={TEN} style={styles.faqText}>
          {section.content}
        </AppText>
      </View>
    );
  };

  const withdrawFormHeaderTitle =
    selectedCurrency?.short_name != null && String(selectedCurrency.short_name || "").length > 0
      ? `Withdraw ${selectedCurrency.short_name}`
      : "Withdraw";

  if (withdrawFlowPhase === "selectCoin") {
    return (
      <AppSafeAreaView style={{ flex: 1, backgroundColor: themeColors.background }}>
        <View style={[styles.headerView, { paddingHorizontal: 25 }]}>
          <TouchableOpacity onPress={() => NavigationService.goBack()}>
            <FastImage
              source={BACK_ICON}
              resizeMode="contain"
              style={{ width: 20, height: 20 }}
              tintColor={themeColors.text}
            />
          </TouchableOpacity>
          <AppText color={themeColors.text} weight={SEMI_BOLD} type={EIGHTEEN}>
            Select Coin
          </AppText>
          <TouchableOpacity
            style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            onPress={() => NavigationService.navigate("Wallet_History")}
          >
            <FastImage
              source={printIcon}
              resizeMode="contain"
              style={{ width: 24, height: 20 }}
              tintColor={themeColors.text}
            />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, minHeight: 0 }}>
          <WithdrawCoinPickerPanel
            coins={withdrawActiveCoins || []}
            isDark={isDark}
            onSelect={handleSelectCurrency}
            loading={withdrawCoinsLoading}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        </View>
      </AppSafeAreaView>
    );
  }

  return (
    <AppSafeAreaView style={{ flex: 1, backgroundColor: themeColors.background }}>
      <KeyBoardAware refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeColors.text} />}>
        <View style={{ paddingHorizontal: 20 }}>
          <View style={styles.headerView}>
            <TouchableOpacity onPress={handleHeaderBack}>
              <FastImage
                source={BACK_ICON}
                resizeMode="contain"
                style={{ width: 20, height: 20 }}
                tintColor={themeColors.text}
              />
            </TouchableOpacity>
            <AppText color={themeColors.text} weight={SEMI_BOLD} type={EIGHTEEN}>
              {withdrawFormHeaderTitle}
            </AppText>
            <TouchableOpacity
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
              onPress={() => NavigationService.navigate("Wallet_History")}
            >
              <FastImage
                source={printIcon}
                resizeMode="contain"
                style={{ width: 24, height: 20 }}
                tintColor={themeColors.text}
              />
            </TouchableOpacity>
          </View>

          <View style={{ marginBottom: 20 }}>
            <AppText type={EIGHTEEN} weight={SEMI_BOLD} style={{ marginTop: 20, marginBottom: 10 }}>
              Selected Coin
            </AppText>
            <View style={[styles.nameView, { backgroundColor: themeColors.background, borderColor: isDark ? themeColors.border : "#EEE", borderWidth: 1 }]}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  flex: 1,
                }}
              >
                <View style={{ borderRadius: 50, overflow: "hidden" }}>
                  <FastImage
                    source={{ uri: BASE_URL + selectedCurrency?.icon_path }}
                    style={{ width: 40, height: 40 }}
                    resizeMode="cover"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText weight={SEMI_BOLD} type={SIXTEEN}>
                    {selectedCurrency?.short_name}{" "}
                    <AppText type={TWELVE} color={DISCLAIMTEXT}>
                      {selectedCurrency?.name}
                    </AppText>
                  </AppText>
                  {!!network && (
                    <AppText type={TWELVE} color={themeColors.secondaryText} style={{ marginTop: 4 }}>
                      Network: {network}
                    </AppText>
                  )}
                </View>
              </View>
              <TouchableOpacity onPress={goToSelectCoinPhase} hitSlop={8}>
                <AppText type={FOURTEEN} color={YELLOW} weight={SEMI_BOLD}>
                  Change
                </AppText>
              </TouchableOpacity>
            </View>
            {Object.keys(selectedCurrency).length > 0 && (
              <View style={{ flexDirection: "row", gap: 5, marginTop: 10, flexWrap: "wrap" }}>
                {withdrawActiveCoins?.slice(0, 4)?.map((coin) => (
                  <TouchableOpacity
                    key={coin._id}
                    style={[styles.chainView, {
                      borderColor: selectedCurrency?._id === coin._id ? colors.buttonBg : (isDark ? themeColors.border : "#EEE"),
                      backgroundColor: selectedCurrency?._id === coin._id ? (isDark ? "#2A2A2A" : "#FFF9E6") : "transparent",
                    }]}
                    onPress={() => handleSelectCurrency(coin)}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                      <FastImage
                        source={{ uri: BASE_URL + coin?.icon_path }}
                        style={{ width: 20, height: 20 }}
                        resizeMode="cover"
                      />
                      <AppText weight={SEMI_BOLD} color={themeColors.text}>
                        {coin?.short_name}
                      </AppText>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          {/* Network Selection */}
          {Object.keys(selectedCurrency).length > 0 && (
            <View style={[styles.networkView, { borderColor: isDark ? themeColors.border : "#EEE" }]}>
              <AppText type={SIXTEEN} weight={SEMI_BOLD}>
                Select network
              </AppText>
              <FlatList
                data={activeWithdrawChains}
                keyExtractor={(item) => String(item)}
                numColumns={4}
                columnWrapperStyle={{
                  flexDirection: "row",
                  justifyContent: "flex-start",
                  marginTop: 8,
                  gap: 5,
                  alignItems: "center",
                }}
                renderItem={({ item: chainKey }) => (
                  <TouchableOpacity
                    style={[
                      styles.chainView,
                      {
                        borderColor: network === chainKey ? (isDark ? colors.buttonBg : colors.buttonBg) : (isDark ? themeColors.border : "#EEE"),
                      },
                    ]}
                    onPress={() => setNetwork(chainKey)}
                  >
                    {network === chainKey && (
                      <FastImage
                        source={moonIcon}
                        style={{
                          height: 20,
                          width: 20,
                          position: "absolute",
                          right: -2,
                          top: -1,
                        }}
                        resizeMode="contain"
                        tintColor={colors.buttonBg}
                      />
                    )}
                    <AppText
                      weight={SEMI_BOLD}
                      color={themeColors.text}
                    >
                      {chainKey}
                    </AppText>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <AppText type={TEN} color={DISCLAIMTEXT} style={{ marginTop: 8 }}>
                    No active withdrawal networks for this coin.
                  </AppText>
                }
              />
            </View>
          )}

          {/* Withdraw To */}
          {Object.keys(selectedCurrency).length > 0 && (
            <>
              <AppText style={{ marginVertical: 20 }} type={EIGHTEEN} weight={SEMI_BOLD}>Withdraw To</AppText>
              <View style={{ height: 55, width: "100%", backgroundColor: themeColors.background, borderColor: isDark ? themeColors.border : "#EEE", borderWidth: 1, justifyContent: "center", borderRadius: 8, paddingHorizontal: 20, marginBottom: 10 }}>
                <AppText style={{ color: isDark ? colors.white : "#5E6272", fontSize: 14 }}>{network ? network : 'Select Network'}</AppText>
              </View>
            </>
          )}
          {network && (
            <View
              style={{
                marginVertical: 10,
                flexDirection: "row",
                backgroundColor: isDark ? "#1A1A1A" : "#FFF9E6",
                borderColor: isDark ? themeColors.border : colors.buttonBg,
                borderWidth: 1,
                borderRadius: 8,
                padding: 15,
                alignItems: "center",
                gap: 10
              }}
            >
              <FastImage
                source={disclaimerIcon}
                style={{ width: 20, height: 20 }}
                resizeMode="contain"
              />
              <View style={{ paddingHorizontal: 10, flex: 1 }} >
                <AppText weight={SEMI_BOLD} type={NINE} style={{ color: "#DE7520" }}>Please enter valid wallet address for the selected network!</AppText>
                <AppText color={themeColors.secondaryText} type={NINE} style={{ marginRight: 10, marginTop: 5 }}>The network you selected is <AppText weight={SEMI_BOLD} style={{ color: colors.buttonBg }} type={NINE}>{network}</AppText>, please ensure that the withdrawal address supports the {network} network. You will potentially lose your assets if the chosen platform does not support refunds of wrongfully deposited assets.</AppText>
              </View>
            </View>
          )}
          <Input
            placeholder="Enter Wallet Address"
            value={withdrawAddress}
            onChangeText={(value) => handleWithdrawalAddress(value)}
            editable={!!network}
          />
          {!isValidWalletAddress && <AppText weight={SEMI_BOLD} type={TEN} style={{ color: "#DE7520", marginTop: 5 }}>Invalid wallet address for the selected network!</AppText>}

          {/* Withdraw Amount */}
          {Object.keys(selectedCurrency).length > 0 && network && (
            <>
              <AppText style={{ marginVertical: 20 }} type={EIGHTEEN} weight={SEMI_BOLD}>Withdraw Amount</AppText>
              <Input
                placeholder={`Minimal ${chainMinWithdrawal ?? 0}`}
                keyboardType="numeric"
                value={withdrawAmount}
                onChangeText={(value) => setWithdrawAmount(value)}
                max
                onMax={handleMaxWithdrawal}
              />
              {!!withdrawAmount &&
                parseNum(withdrawAmount, 0) > 0 &&
                (parseNum(availableBalance, 0) < chainWithdrawalFee ||
                  parseNum(withdrawAmount, 0) > parseNum(availableBalance, 0)) && (
                  <AppText
                    weight={SEMI_BOLD}
                    type={TEN}
                    style={{ color: 'red', marginTop: 5 }}
                  >
                    Insufficient funds
                  </AppText>
                )}

              {/* Balance and Fee Info */}
              <View style={[styles.networkView, { borderColor: isDark ? themeColors.border : "#EEE" }]}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                  <AppText weight={SEMI_BOLD}>Available Balance</AppText>
                  <AppText weight={SEMI_BOLD}>{availableBalance} {selectedCurrency?.short_name}</AppText>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                  <AppText weight={SEMI_BOLD}>Withdrawal Fee</AppText>
                  <AppText weight={SEMI_BOLD}>
                    {valueForChain(selectedCurrency, "withdrawal_fee", network) ?? "—"}{" "}
                    {selectedCurrency?.short_name}
                  </AppText>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                  <AppText weight={SEMI_BOLD}>Maximum Withdrawal</AppText>
                  <AppText weight={SEMI_BOLD}>
                    {chainMaxWithdrawal ?? "—"} {selectedCurrency?.short_name}
                  </AppText>
                </View>
                {/* Receive Amount */}
                {withdrawAmount && Object.keys(selectedCurrency).length > 0 && (
                  <View style={{ marginTop: 10, flexDirection: "row", gap: 20, alignItems: "center", justifyContent: "space-between" }}>
                    <AppText weight={SEMI_BOLD}>Receive Amount: </AppText>
                    <AppText weight={SEMI_BOLD}>
                      {parseFloat(withdrawAmount) - chainWithdrawalFee < 0
                        ? 0
                        : (parseFloat(withdrawAmount) - chainWithdrawalFee || "---")} {selectedCurrency?.short_name}
                    </AppText>
                  </View>
                )}
              </View>
            </>
          )}

          {/* OTP Verification */}
          {Object.keys(selectedCurrency).length > 0 && network && isValidWalletAddress && withdrawAddress && withdrawAmount && (
            <>
              <AppText style={{ marginVertical: 20 }} type={EIGHTEEN} weight={SEMI_BOLD}>OTP Verification</AppText>
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
          )}



          {Object.keys(selectedCurrency).length > 0 &&
            network &&
            isValidWalletAddress &&
            withdrawAddress &&
            withdrawAmount &&
            !emailId && (
              <AppText
                weight={SEMI_BOLD}
                type={TEN}
                style={{ color: "#DE7520", marginTop: 5 }}
                onPress={() =>
                  NavigationService.navigate(SETTING_SCREEN_New)
                }>
                Please Update Email ID first &gt;
              </AppText>
            )}

          <Button
            children="Withdraw"
            containerStyle={{ marginVertical: 15 }}
            disabled={!network || !withdrawAddress || !isValidWalletAddress || !emailId || !withdrawAmount || !otp || parseFloat(withdrawAmount) > parseFloat(availableBalance) || parseFloat(availableBalance) < chainWithdrawalFee}
            onPress={handleWithdraw}
          />

          {/* Announcements Section */}
          {formattedAnnouncements?.length > 0 && (
            <View style={{ marginTop: 30, marginBottom: 20 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
                <AppText type={EIGHTEEN} weight={SEMI_BOLD}>Announcements</AppText>
                <TouchableOpacity onPress={() => NavigationService.navigate(NOTIFICATION_SCREEN)}>
                  <AppText type={FOURTEEN} color={YELLOW}>More &gt;</AppText>
                </TouchableOpacity>
              </View>
              <Accordion
                sections={formattedAnnouncements}
                activeSections={activeAnnouncementSections}
                renderHeader={_renderAnnouncementHeader}
                renderContent={_renderAnnouncementContent}
                onChange={_updateAnnouncementSections}
                underlayColor={colors.transparent}
                containerStyle={{ gap: 10 }}
              />
            </View>
          )}

          {/* FAQ Section - same card UI as KycStatus */}
          <View style={styles.faqSectionWrap}>
            <View style={[styles.faqSectionCard, { backgroundColor: themeColors.background, borderColor: isDark ? themeColors.border : "#EEE", borderWidth: 1 }]}>
              <AppText type={FIFTEEN} weight={SEMI_BOLD} style={[styles.faqSectionCardTitle, { color: themeColors.text }]}>
                FAQ
              </AppText>
              <FlatList
                data={faqData}
                keyExtractor={(_, index) => String(index)}
                style={styles.faqListWrap}
                contentContainerStyle={styles.faqScrollContent}
                scrollEnabled={false}
                renderItem={({ item, index }) => (
                  <View style={[styles.faqItemInner, index === faqData.length - 1 && styles.faqItemInnerLast]}>
                    <TouchableOpacity
                      style={styles.faqQuestionRow}
                      onPress={() => setFaqActiveIndex(faqActiveIndex === index ? null : index)}
                      activeOpacity={0.7}
                    >
                      <AppText type={THIRTEEN} weight={SEMI_BOLD} style={[styles.faqQuestion, { color: themeColors.text }]}>
                        {item.title}
                      </AppText>
                      <FastImage
                        source={faqActiveIndex === index ? upIcon : downIcon}
                        resizeMode="contain"
                        style={styles.faqArrow}
                        tintColor={themeColors.text}
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
                )}
              />
            </View>
          </View>
        </View>
      </KeyBoardAware>
    </AppSafeAreaView>
  );
};

export default WithdrawWallet;

const styles = StyleSheet.create({
  headerView: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
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
