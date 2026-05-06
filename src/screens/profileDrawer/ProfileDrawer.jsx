import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  FlatList,
  Animated,
  Easing,
  Platform,
  Modal,
} from "react-native";
import FastImage from "react-native-fast-image";
// import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons'; // or use react-native-vector-icons
// import MaterialIcons from 'react-native-vector-icon/MaterialIcons'
const screenWidth = Dimensions.get("window").width;
import Feather from "react-native-vector-icons/Feather";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import LottieView from "lottie-react-native";
import {
  alarm,
  arbitary,
  back_ic,
  bank_ic,
  contact,
  currencyPreferIcon,
  depositIcon,
  userPic,
  depositImage,
  earning,
  earningMenuIcon,
  externalLinkIcon,
  helpicon,
  kycixon,
  lock,
  logoutIcon,
  memexIcon,
  Mode,
  moreOption,
  newDepositDarkIcon,
  newDepositIcon,
  newWidthrawDarkIcon,
  newWidthrawIcon,
  notification_bell_ic,
  orderIcon,
  profile_placeholder_ic,
  rewardHubIcon,
  right,
  settings,
  settings_ic,
  spottradingIcon,
  swap,
  swapHistory,
  tradehistory,
  transactionhis,
  walletIcon,
  walletTransferIcon,
  withdrawImage,
  copyIcon,
  INFERNAL_TRANSFER,
  DISPLAY_PIC,
  defaultPic,
  withdrawImageDark,
  depositImageDark,
  memeXProfile,
  memeXProfileDark,
  stakingDrawer,
  stakingDrawerDark,
  walletDrawerDark,
  settingsDark,
  alarmDark,
  kycixonLight,
  lockLight,
  helpiconLight,
  currencyPreferLight,
  orderIconLight,
  walletTransferIconLight,
  tradehistoryLight,
  swapHistoryLight,
  infernalTransferLight,
  bonusHistoryLight,
  INFERNAL_TRANSFER_Light,
  airdropDark,
  airdropLight,
} from "../../helper/ImageAssets";
import AntDesign from "react-native-vector-icons/AntDesign";
import { AppText, BLACK, DISCLAIMTEXT, ELEVEN, THIRTEEN, TWELVE, YELLOW } from "../../shared";
import TouchableOpacityView from "../../shared/components/TouchableOpacityView";
import NavigationService from "../../navigation/NavigationService";
import { languages } from "../../helper/languages";
import { checkValue, copyText } from "../../helper/utility";
import {
  ACCOUNT_SCREEN,
  ARBITORY_SCREEN,
  CONVERT_SCREEN,
  CURRENCY_PREFERENCE_SCREEN,
  DEPOSIT_COIN_SCREEN,
  DEPOSIT_WALLET_SCREEN,
  EARING_SCREEN,
  kyc_Details,
  KYC_STATUS_SCREEN,
  MARKET_SCREEN,
  OPEN_ORDER_SCREEN,
  NOTIFICATION_SCREEN,
  PAYMENT_OPTIONS_SCREEN,
  SECURITY,
  SETTING_SCREEN_New,
  TWO_FACTOR_AUTHENTICATION,
  AIRDROP_HISTORY_SCREEN,
  WALLET_WITHDRAW_SCREEN,
  WITHDRAW_Coin_SCREEN,
} from "../../navigation/routes";
import { useAppSelector } from "../../store/hooks";
import { colors, darkTheme } from "../../theme/colors";
import { useTheme } from "../../hooks/useTheme";
import { useDispatch } from "react-redux";
import { getUserProfile } from "../../actions/accountActions";
import { logoutAction } from "../../actions/authActions";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setTheme } from "../../slices/authSlice";
import { IMAGE_BASE_URL } from "../../helper/Constants";

const Width = Dimensions.get("window").width;

const getGeneralFeaturesData = (theme) => [
  {
    id: "1",
    title: checkValue(languages?.memex),
    icon: theme !== "Dark" ? memeXProfile : memeXProfileDark,
    onPress: () =>
      NavigationService.navigate(MARKET_SCREEN, { from: "home", tab: "MemeX" }),
  },

  // {
  //   id: '2',
  //   title: 'FIT Bot',
  //   icon: arbitary,
  //   onPress: () => NavigationService.navigate(ARBITORY_SCREEN),
  // },
  {
    id: "4",
    title: "Staking",
    icon: theme !== "Dark" ? stakingDrawer : stakingDrawerDark,
    onPress: () => NavigationService.navigate(ACCOUNT_SCREEN),
  },
  {
    id: "5",
    title: "Wallet",
    icon: theme !== "Dark" ? walletDrawerDark : walletIcon,
    onPress: () => NavigationService.navigate(EARING_SCREEN),
  },
  {
    id: "6",
    title: "Settings",
    icon: theme !== "Dark" ? settings : settingsDark,
    onPress: () => {
      NavigationService.navigate(SETTING_SCREEN_New);
    },
  },
];

const getSupportToolsData = (theme) => [
  {
    id: "1",
    title: "Notification",
    icon: theme == "Dark" ? alarmDark : alarm,
    onPress: () => NavigationService.navigate(NOTIFICATION_SCREEN),
  },

  {
    id: "2",
    title: "Verification",
    icon: theme !== "Dark" ? kycixonLight : kycixon,
    onPress: () =>
      NavigationService.navigate(KYC_STATUS_SCREEN, { from: "home" }),
  },

  {
    id: "4",
    title: "Security",
    icon: theme !== "Dark" ? lockLight : lock,
    onPress: () =>
      NavigationService.navigate(TWO_FACTOR_AUTHENTICATION, { from: "home" }),
  },
  // {
  //   id: '5',
  //   title: "Bank Account",
  //   icon: bank_ic,
  //   onPress: () => NavigationService.navigate(PAYMENT_OPTIONS_SCREEN),
  // },
  {
    id: "6",
    title: "Help Center",
    icon: theme !== "Dark" ? helpiconLight : helpicon,
    onPress: () => NavigationService.navigate("Support"),
  },
  // {
  //   id: "7",
  //   title: "Currency Preference",
  //   icon:  theme !== "Dark" ? currencyPreferLight : currencyPreferIcon,
  //   onPress: () => NavigationService.navigate(CURRENCY_PREFERENCE_SCREEN),
  // },
];
const getHistoryData = (theme) => [
  {
    id: "1",
    title: "Open Orders",
    icon: theme == "Dark" ? orderIcon : orderIconLight,
    onPress: () => NavigationService.navigate(OPEN_ORDER_SCREEN),
  },

  {
    id: "2",
    title: "Transaction History",
    icon: theme !== "Dark" ? walletTransferIconLight : walletTransferIcon,
    onPress: () => NavigationService.navigate("Wallet_History"),
  },
  {
    id: "3",
    title: "Spot Order",
    icon: theme == "Dark" ? tradehistoryLight : tradehistory,
    onPress: () => {
      NavigationService.navigate("Trade_History");
    },
  },
  {
    id: "4",
    title: "Swap History",
    icon: theme !== "Dark" ? swapHistoryLight : swapHistory,
    onPress: () => NavigationService.navigate("Swap_History"),
  },
  {
    id: "4",
    title: "Interal Transfer",
    icon: theme !== "Dark" ? INFERNAL_TRANSFER_Light : INFERNAL_TRANSFER,
    onPress: () => NavigationService.navigate("Interanl_Trade_History"),
  },
  {
    id: "5",
    title: "Bonus History",
    icon: theme !== "Dark" ? bonusHistoryLight : transactionhis,
    onPress: () => NavigationService.navigate("Admin_Trade"),
  },
  {
    id: "6",
    title: "Airdrop History",
    icon: theme !== "Dark" ? airdropDark : airdropLight,
    onPress: () => NavigationService.navigate(AIRDROP_HISTORY_SCREEN),
  },
];

const STAGGER_DELAY = 45;
const ENTRANCE_DURATION = 380;

const AnimatedIconBox = ({ theme, children, themeColors }) => {
  return (
    <View
      style={{
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme !== "Dark" ? themeColors.themeElevationColor : themeColors.themeSelection,
        borderRadius: 5,
      }}
    >
      {children}
    </View>
  );
};

const IconAndLabel = ({ theme, themeColors, iconSource, title, textStyle = {} }) => {
  return (
    <>
      <View
        style={{
          width: 40,
          height: 40,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme !== "Dark" ? "#F2F2F2" : "#2f313b",
          borderRadius: 5,
        }}
      >
        <FastImage
          source={iconSource}
          resizeMode="contain"
          style={styles.icon}
        // tintColor={theme !== "Dark" ? colors.black : colors.white}
        />
      </View>
      <View style={{ alignItems: "center" }}>
        <AppText
          style={[
            { fontWeight: "700", fontSize: 10, textAlign: "center", color: themeColors.text },
            textStyle,
          ]}
          type={THIRTEEN}
        >
          {title}
        </AppText>
      </View>
    </>
  );
};

const DepositWithdrawCard = ({ theme, bigImage, smallIcon, label }) => {
  const isLight = theme !== "Dark";
  return (
    <>
      <View
        style={{
          height: 60,
          width: 60,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <FastImage
          source={bigImage}
          style={{ height: 60, width: 60 }}
          resizeMode="contain"
        />
      </View>
      <View style={{ alignItems: "center" }}>
        <FastImage
          source={smallIcon}
          style={{ height: 24, width: 24, marginBottom: 6 }}
          resizeMode="contain"
        />
        <AppText style={{ fontWeight: "500", color: theme == "Dark" ? colors.white : colors.black }}>{label}</AppText>
      </View>
    </>
  );
};

const AnimatedMenuItem = ({ index, onPress, style, theme, children }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: ENTRANCE_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: ENTRANCE_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    }, index * STAGGER_DELAY);
    return () => clearTimeout(timer);
  }, []);

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.92,
      useNativeDriver: true,
      speed: 200,
    }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 200,
    }).start();
  };

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
        style={{ alignItems: "center", }}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};



const AnimatedCard = ({ onPress, theme, delay, children }) => {
  const { colors: themeColors, isDark } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 420,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 420,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  const onPressIn = () => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 200 }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 200 }).start();
  };

  return (
    <Animated.View
      style={{
        flex: 1,
        opacity,
        transform: [{ translateY }, { scale }],
      }}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
        style={{
          flex: 1,
          flexDirection: "row",
          borderWidth: 1,
          borderColor: themeColors.border,
          borderRadius: 10,
          padding: 10,
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: isDark ? '#23242a' : themeColors.themeElevationColor,
        }}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

const ProfileDrawer = () => {
  const dispatch = useDispatch();
  const { colors: themeColors, theme, isDark } = useTheme();
  const drawerColors = themeColors;
  const effectiveTheme = theme ?? (isDark ? "Dark" : "Light");
  const userData = useAppSelector((state) => state.auth.userData);
  const Data = getGeneralFeaturesData(effectiveTheme);
  const Data2 = getSupportToolsData(effectiveTheme);
  const Data3 = getHistoryData(effectiveTheme);
  const [refresh, setRefresh] = useState(true);
  const emailTextOpacity = useRef(new Animated.Value(0)).current;
  const emailTextTranslateY = useRef(new Animated.Value(10)).current;

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const logoutAnim = useRef(new Animated.Value(0)).current; // 0 closed → 1 open

  const openLogoutModal = () => {
    setShowLogoutModal(true);
    logoutAnim.setValue(0);
    Animated.timing(logoutAnim, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const closeLogoutModal = (afterClose) => {
    Animated.timing(logoutAnim, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setShowLogoutModal(false);
        if (typeof afterClose === "function") afterClose();
      }
    });
  };

  const confirmLogout = () => {
    closeLogoutModal(() => dispatch(logoutAction()));
  };

  useEffect(() => {
    dispatch(getUserProfile());
  }, [refresh]);

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(emailTextOpacity, {
          toValue: 1,
          duration: 480,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(emailTextTranslateY, {
          toValue: 0,
          duration: 480,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }, 180);
    return () => clearTimeout(timer);
  }, []);



  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.newThemeColor : themeColors.background }]}>
      <View
        style={{ marginTop: 20, marginHorizontal: 16, marginBottom: "10%" }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <TouchableOpacity onPress={() => NavigationService.goBack()}>
            <FastImage
              source={back_ic}
              resizeMode="contain"
              style={{ width: 20, height: 20 }}
              tintColor={themeColors.text}
            />
          </TouchableOpacity>
          <View style={{ flexDirection: "row", gap: 10, alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => {
                const nextTheme = theme === "Dark" ? "Light" : "Dark";
                dispatch(setTheme(nextTheme));
                AsyncStorage.setItem('theme', nextTheme);
              }}
            >
              <FastImage
                source={DISPLAY_PIC}
                resizeMode="contain"
                style={{
                  width: 35,
                  height: 35,
                }}
                tintColor={themeColors.text}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={{ marginRight: 10 }}
              onPress={openLogoutModal}
            >
              <FastImage
                source={logoutIcon}
                resizeMode="contain"
                style={{
                  width: 25,
                  height: 25,
                }}
                tintColor={themeColors.text}
              />
            </TouchableOpacity>
          </View>
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 20,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                borderRadius: 50,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: colors.disclaimDarText,
              }}
            >
              <FastImage
                source={
                  userData?.profilepicture
                    ? { uri: IMAGE_BASE_URL + userData?.profilepicture }
                    : defaultPic
                }
                style={{ height: 40, width: 40 }}
                resizeMode="cover"
              />
            </View>
            <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
              <View style={{ marginLeft: 15 }}>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <View>
                    <Animated.View
                      style={{
                        opacity: emailTextOpacity,
                        transform: [{ translateY: emailTextTranslateY }],
                      }}
                    >
                      <AppText
                        style={{ color: themeColors.text, fontSize: 15, fontWeight: "600" }}
                      >
                        {userData?.emailId ||
                          `${userData?.country_code} ${userData?.mobileNumber}`}
                      </AppText>
                    </Animated.View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                      <AppText color={DISCLAIMTEXT} type={ELEVEN}>UID: {userData?.uuid}</AppText>
                      <TouchableOpacity onPress={() => copyText(userData?.uuid)}><FastImage source={copyIcon} resizeMode="contain" style={{ width: 10, height: 10 }} tintColor={colors.disabledText} /></TouchableOpacity>

                    </View>

                  </View>

                  {userData?.kycVerified === 2 ? (
                    <FastImage
                      source={right}
                      style={{ height: 20, width: 20, marginTop: 4 }}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={{ gap: 10, marginTop: 5 }}>
                      <TouchableOpacity
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 5,
                        }}
                        onPress={() =>
                          NavigationService.navigate(KYC_STATUS_SCREEN)
                        }
                      >
                        <AppText type={TWELVE} color={YELLOW}>
                          Verify Now
                        </AppText>
                        <FastImage
                          source={externalLinkIcon}
                          resizeMode="contain"
                          style={{ width: 10, height: 10 }}
                          tintColor={colors.buttonBg}
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
      <View
        style={{
          flex: 1,
          backgroundColor: isDark ? '#23242a' : themeColors.themeElevationColor,
          borderTopLeftRadius: 50,
          borderTopRightRadius: 50,
          overflow: "hidden",
        }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: 8,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{
              marginTop: "10%",
              marginHorizontal: 20,
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 20,
              gap: 12,
            }}
          >
            <AnimatedCard
              theme={effectiveTheme}
              delay={0}
              onPress={() => NavigationService.navigate(DEPOSIT_COIN_SCREEN)}
            >
              <DepositWithdrawCard
                theme={effectiveTheme}
                bigImage={effectiveTheme !== "Dark" ? depositImage : depositImageDark}
                smallIcon={
                  effectiveTheme !== "Dark" ? newDepositIcon : newDepositDarkIcon
                }
                label="Deposit"
              />
            </AnimatedCard>

            <AnimatedCard
              theme={effectiveTheme}
              delay={80}
              onPress={() => NavigationService.navigate(WALLET_WITHDRAW_SCREEN)}
            >
              <DepositWithdrawCard
                theme={effectiveTheme}
                bigImage={effectiveTheme !== "Dark" ? withdrawImage : withdrawImageDark}
                smallIcon={
                  effectiveTheme !== "Dark" ? newWidthrawIcon : newWidthrawDarkIcon
                }
                label="Withdrawal"
              />
            </AnimatedCard>
          </View>
          <AppText
            style={{
              fontSize: 17,
              fontWeight: "700",
              marginHorizontal: 20,
              marginTop: 10,
              color: drawerColors.text,
            }}
          >
            General Features
          </AppText>
          <View style={styles.secondcontainer}>
            {Data?.map((item, index) => (
              <AnimatedMenuItem
                key={item.id}
                index={index}
                theme={effectiveTheme}
                onPress={item?.onPress}
                style={styles.singleItem}
              >
                <IconAndLabel
                  theme={effectiveTheme}
                  themeColors={drawerColors}
                  iconSource={item.icon}
                  title={item.title}
                />
              </AnimatedMenuItem>
            ))}
          </View>

          <AppText
            style={{
              fontSize: 17,
              fontWeight: "700",
              marginHorizontal: 20,
              marginTop: 10,
              color: drawerColors.text,
            }}
          >
            Support Tools
          </AppText>
          <View style={styles.secondcontainer}>
            {Data2.map((item, index) => (
              <AnimatedMenuItem
                key={item.id}
                index={index}
                theme={effectiveTheme}
                onPress={item.onPress}
                style={styles.singleItem}
              >
                <IconAndLabel
                  theme={effectiveTheme}
                  themeColors={drawerColors}
                  iconSource={item.icon}
                  title={item.title}
                />
              </AnimatedMenuItem>
            ))}
          </View>
          <AppText
            style={{
              fontSize: 17,
              fontWeight: "700",
              marginHorizontal: 20,
              marginTop: 10,
              color: drawerColors.text,
            }}
          >
            History
          </AppText>
          <View style={styles.secondcontainer}>
            {Data3.map((item, index) => (
              <AnimatedMenuItem
                key={item.id}
                index={index}
                theme={effectiveTheme}
                onPress={item.onPress}
                style={styles.singleItem}
              >
                <IconAndLabel
                  theme={effectiveTheme}
                  themeColors={drawerColors}
                  iconSource={item.icon}
                  title={item.title}
                  textStyle={{ width: 60 }}
                />
              </AnimatedMenuItem>
            ))}
          </View>
        </ScrollView>
      </View>

      <Modal
        visible={showLogoutModal}
        transparent
        statusBarTranslucent
        animationType="none"
        onRequestClose={() => closeLogoutModal()}
      >
        <Animated.View
          style={[
            styles.logoutModalBackdrop,
            {
              opacity: logoutAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              }),
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={StyleSheet.absoluteFill}
            onPress={() => closeLogoutModal()}
          />

          <Animated.View
            style={[
              styles.logoutModalCard,
              {
                backgroundColor: themeColors.themeElevationColor,
                borderColor: themeColors.border,
                transform: [
                  {
                    translateY: logoutAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [12, 0],
                    }),
                  },
                  {
                    scale: logoutAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.96, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.logoutLottieWrap}>
              <LottieView
                source={require("../../../assets/lottie/logout.json")}
                autoPlay
                loop
                style={styles.logoutLottie}
              />
            </View>

            <AppText style={[styles.logoutTitle, { color: themeColors.text }]}>Confirm Logout</AppText>
            <AppText style={[styles.logoutDesc, { color: themeColors.text }]}>
              Are you sure you want to log out of your account?
            </AppText>

            <View style={styles.logoutActionsRow}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={[
                  styles.logoutBtn,
                  styles.logoutBtnSecondary,

                  {
                    borderColor: isDark ? "transparent" : colors.inputBorder,
                    backgroundColor: isDark ? "rgba(255,255,255,0.06)" : colors.inputBackground,
                  },
                ]}
                onPress={() => closeLogoutModal()}
              >
                <AppText style={[styles.logoutBtnSecondaryText, { color: themeColors.text }]}>Cancel</AppText>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.logoutBtn, styles.logoutBtnPrimary]}
                onPress={confirmLogout}
              >
                <AppText style={[styles.logoutBtnPrimaryText, { color: "#fff" }]}>Logout</AppText>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </View>
  );
};

export default ProfileDrawer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.newThemeColor,
    width: screenWidth,
  },
  logoutModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.62)",
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
  },
  logoutModalCard: {

    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
    width: "100%",
    maxWidth: 360,
  },
  logoutLottieWrap: {
    width: 120,
    height: 120,
    borderRadius: 24,
    alignSelf: "center",
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutLottie: {
    width: 140,
    height: 140,
  },
  logoutTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
  },
  logoutDesc: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
    textAlign: "center",
  },
  logoutActionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  logoutBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutBtnSecondary: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
  },
  logoutBtnSecondaryText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "600",
  },
  logoutBtnPrimary: {
    backgroundColor: colors.buttonBg,
  },
  logoutBtnPrimaryText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
  secondcontainer: {
    // width: Width*0.92,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-start",
    paddingVertical: 10,
    marginHorizontal: 15,
  },

  icon: {
    height: 18,
    width: 18,
    // marginBottom: 10,
  },
  singleItem: {
    width: "20%",
    gap: 8,
    alignItems: "center",
    marginTop: 20,
    height: 60,
  },
});
