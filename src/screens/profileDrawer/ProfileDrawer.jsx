import React, { useEffect, useState, useRef, useMemo } from "react";
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
import Toast from "react-native-simple-toast";

const showComingSoonToast = () =>
  Toast.showWithGravity("Coming soon", Toast.LONG, Toast.BOTTOM);

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
  giftIc,
  inviteIcon,
  editIcon,
  p2p_Icon,
  buyCrypto,
  convertIcon,
  convertIconDark,
  graphIcon,
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
  contact_ic,
  contact_us,
  headPhoneIcon,
  scanner,
  setting_icon,
  referralProfile,
  bots_ic,
  newsicon,
  p2pIcon,
  spottradingIconNew,
  checkIcon,
} from "../../helper/ImageAssets";
import AntDesign from "react-native-vector-icons/AntDesign";
import { AppText, BLACK, DISCLAIMTEXT, ELEVEN, FOURTEEN, SEMI_BOLD, SIXTEEN, THIRTEEN, TWELVE, YELLOW } from "../../shared";
import TouchableOpacityView from "../../shared/components/TouchableOpacityView";
import NavigationService from "../../navigation/NavigationService";
import { languages } from "../../helper/languages";
import { checkValue, copyText } from "../../helper/utility";
import {
  ACCOUNT_SCREEN,
  ARBITORY_SCREEN,
  CURRENCY_PREFERENCE_SCREEN,
  DEPOSIT_COIN_SCREEN,
  EARING_SCREEN,
  KYC_STATUS_SCREEN,
  MARKET_SCREEN,
  OPEN_ORDER_SCREEN,
  NOTIFICATION_SCREEN,
  PAYMENT_OPTIONS_SCREEN,
  SETTING_SCREEN_New,
  TWO_FACTOR_AUTHENTICATION,
  AIRDROP_HISTORY_SCREEN,
  WALLET_WITHDRAW_SCREEN,
  SELECT_COIN_SCREEN,
  REFERRAL_LIST,
  NAVIGATION_BOTTOM_TAB_STACK,
  TRADE_SCREEN,
} from "../../navigation/routes";
import { useAppSelector } from "../../store/hooks";
import { colors, darkTheme } from "../../theme/colors";
import { fontFamilySemiBold } from "../../theme/typography";
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

const GRID_COLUMNS = 4;
const gridSpacing = 10;
const gridItemWidth = (Width - 32 - gridSpacing * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

const getShortcutMenuItems = (theme) => [
  {
    id: "sh1",
    title: "Rewards Hub",
    icon: rewardHubIcon,
    onPress: showComingSoonToast,
  },
  {
    id: "sh2",
    title: "Invite Friends",
    icon: inviteIcon,
    onPress: showComingSoonToast,
  },
  {
    id: "sh3",
    title: "Bots",
    icon: bots_ic,
    onPress: showComingSoonToast,
  },
  {
    id: "sh4",
    title: "Copy Trading",
    icon: spottradingIcon,
    onPress: showComingSoonToast,
  },
  {
    id: "sh5",
    title: "Edit",
    icon: editIcon,
    onPress: showComingSoonToast,
  },
  {
    id: "sh6",
    title: "News",
    icon: newsicon,
    onPress: showComingSoonToast,
  },
];

const getPopularMenuItems = (theme) => [
  {
    id: "p1",
    title: "Deposit",
    icon: newDepositIcon,
    onPress: () => NavigationService.navigate(DEPOSIT_COIN_SCREEN),
  },
  {
    id: "p2",
    title: "P2P",
    icon: p2pIcon,
    onPress: showComingSoonToast,
  },
  {
    id: "p3",
    title: "Withdrawal",
    icon: newWidthrawIcon,
    onPress: () => NavigationService.navigate(SELECT_COIN_SCREEN),
  },
  {
    id: "p4",
    title: "Convert",
    icon: convertIcon,
    onPress: showComingSoonToast,
  },
  {
    id: "p5",
    title: "Spot",
    icon: spottradingIconNew,
    onPress: () =>
      NavigationService.navigate(NAVIGATION_BOTTOM_TAB_STACK, { screen: TRADE_SCREEN }),
  },
  {
    id: "p6",
    title: "Buy Crypto",
    icon: buyCrypto,
    onPress: showComingSoonToast,
  },
  {
    id: "p7",
    title: "Soft Staking",
    icon: stakingDrawer,
    onPress: showComingSoonToast,
  },
];

const getSecurityVerificationItems = (theme) => [
  {
    id: "sv2",
    title: "Identification",
    icon: theme !== "Dark" ? kycixonLight : kycixon,
    onPress: () => NavigationService.navigate(KYC_STATUS_SCREEN),
  },
  {
    id: "sv1",
    title: "Security",
    icon: theme !== "Dark" ? lockLight : lock,
    onPress: showComingSoonToast,
    // onPress: () => NavigationService.navigate(TWO_FACTOR_AUTHENTICATION),
  },
];

/**
 * Same 0–4 meaning as KycStatus.js. Only accept plain integers (no parseInt("3abc") === 3).
 */
function normalizeKycTierFromProfile(raw) {
  if (raw === null || raw === undefined || raw === "" || raw === false) return 0;
  if (raw === true) return 1;
  const s = typeof raw === "string" ? raw.trim() : raw;
  const n = Number(s);
  if (!Number.isFinite(n)) return 0;
  const t = Math.trunc(n);
  if (t !== n) return 0;
  if (t < 0 || t > 4) return 0;
  return t;
}

/**
 * KYC pill: 0/1/4 → orange pending, 2 → green verified, 3 → red failed.
 * If profile has kyc_status hint "pending/review" but tier is still 3, treat as in-review (orange).
 */
function getKycTierBadge(userData, isDark) {
  const raw = userData?.kycVerified ?? userData?.kyc_verified;
  let tier = normalizeKycTierFromProfile(raw);
  const hint = String(userData?.kyc_status ?? userData?.kycStatus ?? "").toLowerCase();
  if (
    tier === 3 &&
    hint &&
    /pending|review|process|submit|progress|under/.test(hint) &&
    !/reject|fail|declin|denied/.test(hint)
  ) {
    tier = 1;
  }

  if (tier === 2) {
    return {
      label: "Verified",
      borderColor: "#22C55E",
      fg: isDark ? "#86EFAC" : "#166534",
      bg: isDark ? "rgba(34, 197, 94, 0.14)" : "#DCFCE7",
    };
  }
  if (tier === 3) {
    return {
      label: "Failed",
      borderColor: "#EF4444",
      fg: isDark ? "#FCA5A5" : "#B91C1C",
      bg: isDark ? "rgba(239, 68, 68, 0.14)" : "#FEE2E2",
    };
  }
  if (tier === 0) {
    return {
      label: "Unverified",
      borderColor: colors.orangeTheme,
      fg: isDark ? "#FDBA74" : "#C2410C",
      bg: isDark ? "rgba(249, 115, 22, 0.16)" : "#FFEDD5",
    };
  }
  return {
    label: "Pending",
    borderColor: "#F97316",
    fg: isDark ? "#FDBA74" : "#C2410C",
    bg: isDark ? "rgba(249, 115, 22, 0.16)" : "#FFEDD5",
  };
}

function maskProfileEmail(email) {
  if (!email || typeof email !== "string") return "";
  const at = email.indexOf("@");
  if (at < 1) return email;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const head = local.slice(0, Math.min(3, local.length));
  const dom = domain.slice(0, Math.min(5, domain.length));
  return `${head}*@${dom}**`;
}

const PROFILE_GRID_ICON_WRAP = 38;
const PROFILE_GRID_ICON_INNER = 16;

const ProfileGridItem = ({ title, iconSource, onPress, themeColors, isDark, itemWidth, iconTintColor }) => (
  <TouchableOpacity
    style={{ width: itemWidth, alignItems: "center", marginBottom: 8 }}
    onPress={onPress}
    activeOpacity={0.78}
  >
    <View
      style={{
        width: PROFILE_GRID_ICON_WRAP,
        height: PROFILE_GRID_ICON_WRAP,
        borderRadius: PROFILE_GRID_ICON_WRAP / 2,
        backgroundColor: '#F7F7F7',
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <FastImage
        source={iconSource}
        style={{ width: PROFILE_GRID_ICON_INNER, height: PROFILE_GRID_ICON_INNER }}
        resizeMode="contain"
        {...(iconTintColor != null ? { tintColor: iconTintColor } : {})}
      />
    </View>
    <AppText
      weight={SEMI_BOLD}
      numberOfLines={2}
      style={{
        marginTop: 8,
        fontSize: 11,
        textAlign: "center",
        color: themeColors.text,
        lineHeight: 14,
      }}
    >
      {title}
    </AppText>
  </TouchableOpacity>
);

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
  const [showAllServicesModal, setShowAllServicesModal] = useState(false);
  const [addToHome, setAddToHome] = useState(true);
  const logoutAnim = useRef(new Animated.Value(0)).current; // 0 closed → 1 open

  const shortcutItems = useMemo(() => getShortcutMenuItems(effectiveTheme), [effectiveTheme]);
  const popularItems = useMemo(() => getPopularMenuItems(effectiveTheme), [effectiveTheme]);
  const securityVerificationItems = useMemo(
    () => getSecurityVerificationItems(effectiveTheme),
    [effectiveTheme]
  );
  const kycBadge = useMemo(
    () => getKycTierBadge(userData, isDark),
    [userData?.kycVerified, userData?.kyc_verified, userData?.kyc_status, userData?.kycStatus, isDark]
  );
  const vipLevel = userData?.vipLevel ?? userData?.vip ?? 0;
  const displayAccountLine = userData?.emailId
    ? maskProfileEmail(userData.emailId)
    : `${userData?.country_code || ""} ${userData?.mobileNumber || ""}`.trim();

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



  const paperBg = isDark ? colors.newThemeColor : "#FFFFFF";
  const allServicesList = [
    ...Data.map((item, i) => ({ ...item, rowKey: `g-${item.id}-${i}` })),
    ...Data2.map((item, i) => ({ ...item, rowKey: `s-${item.id}-${i}` })),
    ...Data3.map((item, i) => ({ ...item, rowKey: `h-${item.id}-${i}` })),
  ];

  return (
    <View style={[styles.container, { backgroundColor: 'white' }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: Platform.OS === "ios" ? 12 : 20,
          paddingBottom: 100,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <TouchableOpacity onPress={() => NavigationService.goBack()} hitSlop={12}>
            <FastImage source={back_ic} resizeMode="contain" style={{ width: 20, height: 20 }} tintColor={themeColors.text} />
          </TouchableOpacity>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <TouchableOpacity
              onPress={() => Toast.showWithGravity("Coming soon", Toast.LONG, Toast.BOTTOM)}
              hitSlop={8}
            >
              <FastImage source={scanner} resizeMode="contain" style={{ width: 20, height: 20 }} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => NavigationService.navigate(SETTING_SCREEN_New)} hitSlop={8}>
              <FastImage source={setting_icon} resizeMode="contain" style={{ width: 20, height: 20 }} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => NavigationService.navigate("Support")} hitSlop={8}>
              <FastImage source={headPhoneIcon} resizeMode="contain" style={{ width: 20, height: 20 }} />
            </TouchableOpacity>
          </View>
        </View>

        <View
          // onPress={() => NavigationService.navigate(ACCOUNT_SCREEN)}
          style={{ flexDirection: "row", alignItems: "center" }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: colors.disclaimDarText,
              bottom: 5
            }}
          >
            <FastImage
              // source={
              //   userData?.profilepicture
              //     ? { uri: IMAGE_BASE_URL + userData.profilepicture }
              //     : defaultPic
              // }
              source={defaultPic}
              style={{ width: 56, height: 56 }}
              resizeMode="cover"
            />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Animated.View style={{ opacity: emailTextOpacity, transform: [{ translateY: emailTextTranslateY }] }}>
              <AppText style={{ color: themeColors.text, fontSize: 16, fontWeight: "700" }} numberOfLines={1}>
                {displayAccountLine}
              </AppText>
            </Animated.View>
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4, gap: 6 }}>
              <AppText type={TWELVE} color={DISCLAIMTEXT}>
                UID: {userData?.uuid || "—"}
              </AppText>
              {userData?.uuid ? (
                <TouchableOpacity onPress={() => copyText(userData.uuid)} hitSlop={8}>
                  <FastImage source={copyIcon} resizeMode="contain" style={{ width: 12, height: 12 }} tintColor={colors.disabledText} />
                </TouchableOpacity>
              ) : null}
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
              <View style={[styles.profileBadge, { backgroundColor: isDark ? "#2F3138" : "#F3F4F6" }]}>
                <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: themeColors.secondaryText }}>
                  VIP {vipLevel}
                </AppText>
              </View>
              <View
                style={[
                  styles.profileBadge,
                  {
                    backgroundColor: kycBadge.bg,
                    borderWidth: 1,
                    borderColor: kycBadge.borderColor,
                  },
                ]}
              >
                <Text
                  allowFontScaling={false}
                  style={{
                    fontSize: 12,
                    fontFamily: fontFamilySemiBold,
                    color: kycBadge.fg,
                  }}
                >
                  {kycBadge.label}
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            onPress={openLogoutModal}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ flexShrink: 0, justifyContent: "center", paddingLeft: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Log out"
          >
            <FastImage source={logoutIcon} style={{ width: 22, height: 22, right: 15 }} resizeMode="contain" />
          </TouchableOpacity>
        </View>



        <TouchableOpacity
          activeOpacity={0.9}
          style={[
            styles.referralCard,
            {
              backgroundColor: isDark ? "#2A2A2E" : "#F4F4F6",
              borderColor: isDark ? themeColors.border : "#E8E8E8",
            },
          ]}
        >
          <View style={{ flex: 1, paddingRight: 8 }}>
            <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text }}>
              Referral Program
            </AppText>
            <AppText type={TWELVE} color={themeColors.secondaryText} style={{ marginTop: 6, lineHeight: 18 }}>
              {`Refer friends to earn a 35% \n commission`}
            </AppText>
          </View>
          <View style={styles.referralArtWrap}>
            <FastImage source={referralProfile} style={{ width: 56, height: 56 }} resizeMode="contain" />
          </View>
        </TouchableOpacity>

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 22 }}>
          <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text }}>
            Security & verification
          </AppText>
        </View>
        <View style={[styles.profileIconGrid, { marginTop: 14 }]}>
          {securityVerificationItems.map((item) => (
            <ProfileGridItem
              key={item.id}
              title={item.title}
              iconSource={item.icon}
              onPress={item.onPress}
              themeColors={drawerColors}
              isDark={isDark}
              itemWidth={gridItemWidth}
              iconTintColor={colors.black}
            />
          ))}
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 26 }}>
          <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text }}>
            Shortcut
          </AppText>

        </View>

        <View style={[styles.profileIconGrid, { marginTop: 14 }]}>
          {shortcutItems.map((item) => (
            <ProfileGridItem
              key={item.id}
              title={item.title}
              iconSource={item.icon}
              onPress={item.onPress}
              themeColors={drawerColors}
              isDark={isDark}
              itemWidth={gridItemWidth}
            />
          ))}
        </View>

        <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text, marginTop: 22 }}>
          Popular
        </AppText>
        <View style={[styles.profileIconGrid, { marginTop: 14 }]}>
          {popularItems.map((item) => (
            <ProfileGridItem
              key={item.id}
              title={item.title}
              iconSource={item.icon}
              onPress={item.onPress}
              themeColors={drawerColors}
              isDark={isDark}
              itemWidth={gridItemWidth}
            />
          ))}
        </View>
      </ScrollView>

      {/* <View
        style={[
          styles.allServicesBar,
          {
            backgroundColor: paperBg,
            borderTopColor: isDark ? themeColors.border : "#E8E8E8",
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.allServicesBtn, { backgroundColor: isDark ? "#2B2D33" : "#EFEFF1" }]}
          onPress={() => setShowAllServicesModal(true)}
        >
          <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text }}>
            All Services
          </AppText>
        </TouchableOpacity>
      </View> */}

      <Modal visible={showAllServicesModal} transparent animationType="fade" onRequestClose={() => setShowAllServicesModal(false)}>
        <View style={styles.allServicesModalRoot}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShowAllServicesModal(false)} />
          <View
            style={[
              styles.allServicesCard,
              { backgroundColor: themeColors.background, borderColor: themeColors.border, zIndex: 2, alignSelf: "center", width: "100%", maxWidth: 400 },
            ]}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <AppText type={SIXTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text }}>
                All Services
              </AppText>
              <TouchableOpacity onPress={() => setShowAllServicesModal(false)} hitSlop={10}>
                <MaterialIcons name="close" size={20} color={themeColors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: Dimensions.get("window").height * 0.55 }} showsVerticalScrollIndicator={false}>
              {allServicesList.map((item) => (
                <TouchableOpacity
                  key={item.rowKey}
                  style={[styles.allServicesRow, { borderBottomColor: isDark ? "#333" : "#EEE" }]}
                  onPress={() => {
                    setShowAllServicesModal(false);
                    item.onPress?.();
                  }}
                >
                  <FastImage source={item.icon} style={{ width: 18, height: 18 }} resizeMode="contain" />
                  <AppText type={THIRTEEN} style={{ marginLeft: 12, color: themeColors.text, flex: 1 }}>
                    {item.title}
                  </AppText>
                  <MaterialIcons name="chevron-right" size={18} color={themeColors.secondaryText} />
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.allServicesRow, { borderBottomWidth: 0 }]}
                onPress={() => {
                  setShowAllServicesModal(false);
                  openLogoutModal();
                }}
              >
                <FastImage source={logoutIcon} style={{ width: 18, height: 18 }} resizeMode="contain" tintColor="#C62828" />
                <AppText type={THIRTEEN} weight={SEMI_BOLD} style={{ marginLeft: 12, color: "#C62828", flex: 1 }}>
                  Logout
                </AppText>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

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
  profileBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  referralCard: {
    marginTop: 20,
    padding: 10,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  referralArtWrap: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  profileIconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: gridSpacing,
  },
  homeCheckOuter: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  allServicesBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 28 : 16,
  },
  allServicesBtn: {
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  allServicesModalRoot: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  allServicesCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    maxHeight: "80%",
  },
  allServicesRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
