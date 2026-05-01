/* eslint-disable react/no-unstable-nested-components */
import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import "react-native-gesture-handler";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import NavigationService from "./NavigationService";
import * as routes from "./routes";
import * as React from "react";
import AuthLoading from "../screens/other/AuthLoading";
import Welcome from "../screens/auth/Welcome";
import Login from "../screens/auth/Login";
import ForgotPassword from "../screens/auth/ForgotPassword";
import Register from "../screens/auth/Register";
import SetPassword from "../screens/auth/SetPassword";
import VerifyAccount from "../screens/auth/VerifyAccount";
import AccountActivated from "../screens/auth/AccountActivated";
import OtpVerify from "../screens/auth/OtpVerify";
import ResetPassword from "../screens/auth/ResetPassword";
import AuthVerificationScreen from "../screens/auth/AuthVerificationScreen";
import FastImage from "react-native-fast-image";
import { commonStyles } from "../theme/commonStyles";
import { colors } from "../theme/colors";
import {
  earningIcon,
  futuresActiveIcon,
  futuresIcon,
  homeIcon,
  tradeImg,
  wallet_ic,
} from "../helper/ImageAssets";
import Home from "../features/home/screens/HomeDashboardScreen";
import Trades from "../features/trades/screens/TradingHubScreen";
import EditProfile from "../screens/account/EditProfile";
import Notification from "../screens/other/Notification";
import NotificationSettings from "../screens/account/NotificationSettings";
import Settings from "../screens/account/Settings";
import KycStepOne from "../screens/account/KycStepOne";
import KycStatus from "../screens/account/KycStatus";
import CmsPages from "../screens/account/CmsPages";
import BankingSettings from "../screens/account/BankingSettings";
import ChangePassword from "../screens/settings/ChangePassword";
import AntiPhishingCode from "../screens/settings/AntiPhishingCode";
import CurrencyPreference from "../screens/account/CurrencyPreference";
import CoinDetails from "../screens/trades/CoinDetails";
import Withdraw from "../screens/other/Withdraw";
import WalletDetails from "../features/wallet/screens/WalletDetailsScreen";
import WalletHistoryDetails from "../screens/wallet/WalletHistoryDetails";
import TradeHistoryDetails from "../screens/wallet/TradeHistoryDetails";
import KycStepTwo from "../screens/account/KycStepTwo";
import KycStepThree from "../screens/account/KycStepThree";
import KycStepFour from "../screens/account/KycStepFour";
import KycStepFive from "../screens/account/KycStepFive";
import KycStepReview from "../screens/account/KycStepReview";
import KycVerificationScreen from "../screens/account/KycVerificationScreen";
import KycResubmitScreen from "../screens/account/KycResubmitScreen";
import { KycFormProvider } from "../context/KycFormContext";
import TradeSettings from "../screens/account/TradeSettings";
import FeeSettings from "../screens/account/FeeSettings";
import DownloadReport from "../screens/account/DownloadReport";
import CoinDetailChart from "../screens/home/CoinDetailChart";
import CoinTransactionHistory from "../screens/home/CoinTransactionHistory";
import TwoFactor from "../screens/account/TwoFactor";
import TwoFactorQr from "../screens/account/TwoFactorQr";
import AddPhoneNumberScreen from "../screens/account/AddPhoneNumberScreen";
import AddEmailScreen from "../screens/account/AddEmailScreen";
import SetupTwoFactorScreen from "../screens/account/SetupTwoFactorScreen";
import VerifyAuthenticatorCodeScreen from "../screens/account/VerifyAuthenticatorCodeScreen";
import AddPasskeyScreen from "../screens/account/AddPasskeyScreen";
import ChangeEmailScreen from "../screens/account/ChangeEmailScreen";
import ChangeMobileScreen from "../screens/account/ChangeMobileScreen";
import ViewPasskeysScreen from "../screens/account/ViewPasskeysScreen";
import Disable2FAScreen from "../screens/account/Disable2FAScreen";
import EnterOtp from "../screens/account/EnterOtp";
import ConvertHistory from "../screens/home/ConvertHistory";
import LanguagePreference from "../screens/account/LanguagePreference";
import Search from "../features/trades/screens/MarketSearchScreen";
import SwapNEXBCoin from "../screens/trades/SwapNEXBCoin";
import {
  AppText,
  BLACK,
  BOLD,
  MEDIUM,
  TEN,
  YELLOW,
} from "../shared";
import { Platform, StyleSheet, View } from "react-native";
import StakingSuccess from "../screens/Staking/StakingSuccess";
import QsTransaction from "../screens/QuickBuySell/qsTransaction";
import LackedStakes from "../screens/Staking/LackedStakes";
import StakingHistory from "../screens/Staking/StakingHistory";
import BtcCoinDetails from "../screens/trades/BtcCoinDetails";
import { useAppSelector } from "../store/hooks";
import { ChartPreloaderProvider } from "../context/ChartPreloaderContext";
import BuyByCrypto from "../screens/P2P/BuyByCrypto";
import P2pFilter from "../screens/P2P/P2pFilter";
import OrderCreated from "../screens/P2P/OrderCreated";
import OrderHistory from "../screens/trades/OrderHistory";
import SpotOrderHistoryDetail from "../screens/spotScreen/SpotOrderHistoryDetail";
import CommitDetails from "../screens/trades/CommitDetails";
import ActivityLogs from "../features/account/screens/ActivityLogsScreen";
import ReferralList from "../features/account/screens/ReferralListScreen";
import PaymentOptions from "../features/account/screens/PaymentOptionsScreen";
import AddNewBank from "../screens/account/AddNewBank";
import WalletHistory from "../features/wallet/screens/WalletHistoryScreen";
import Market from "../screens/other/Market";
import SpotMarket from "../screens/other/SpotMarket";
import MoreMenu from "../features/home/screens/MoreOptionsScreen";
import WalletNew from "../features/wallet/screens/WalletOverviewScreen";
import Transfer from "../features/wallet/screens/SendFundsScreen";
import ConvertNew from "../screens/wallet/ConvertNew";
import DepositWallet from "../screens/wallet/DepositWallet";
import DepositCoin from "../screens/wallet/DepositCoin";
import WithdrawWallet from "../screens/wallet/WithdrawWallet";
import Earning from "../screens/other/Earning";
import DashboardInner from "../screens/dashboardInner/DashboardInner";
import Spot from "../screens/spotScreen/Spot";
import ProfileDrawer from "../screens/profileDrawer/ProfileDrawer";
import { createDrawerNavigator } from "@react-navigation/drawer";
import Support from "../screens/supportSreen/Support";
import kycDetails from "../screens/kycScrrens/kycDetails";
import PanVerify from "../screens/kycScrrens/PanVerify";
import AadharVerify from "../screens/kycScrrens/AadharVerify";
import UploadSelfie from "../screens/kycScrrens/UploadSelfie";
import CurrencyPrefer from "../screens/currencyPrefer/CurrencyPrefer";
import Security from "../screens/supportSreen/Security";
import SettingsScreen from "../screens/settings/Settings";
import WithdrawCoin from "../screens/wallet/WithdrawCoin";
import WithdrawInr from "../screens/other/WithdrawInr";
import WebLink from "../screens/account/WebLink";
import RefferalReward from "../screens/account/RefferalReward";
import ReferralTree from "../screens/account/ReferralTree";
import TradeHistory from "../screens/account/TradeHistory";
import OpenOrder from "../screens/account/OpenOrder";
import NewWalletHistory from "../screens/account/NewWalletHistory";
import NewSwapHistory from "../screens/account/NewSwapHistory";
import AdminTradeHistory from "../screens/account/AdminTradeHistory";
import InternalWalletHistory from "../screens/account/InternalWalletHistory";
import BuyPackage from "../screens/other/BuyPackage";
import EarningPortfolio from "../screens/other/EarningPortfolio";
import Futures from "../screens/Futures/index";
import Launchpad from "../screens/Launchpad";
import AllLiveProjects from "../screens/Launchpad/AllLiveProjects";
import AllUpcomingProjects from "../screens/Launchpad/AllUpcomingProjects";
import FutureOrderHistory from "../screens/Futures/FutureOrderHistory";
import ProjectDetails from "../screens/Launchpad/ProjectDetails";
import OptionsScreen from "../screens/Options";
import BuyOptions from "../screens/Options/BuyOptions";
import OptionsHistory from "../screens/Options/OptionsHistory";
import AllEndedProjects from "../screens/Launchpad/AllEndedProjects";
import TicketScreen from "../screens/supportSreen/TicketScreen";
import { useTheme } from "../hooks/useTheme";
import AirDropScreen from "../screens/airdrop/AirDropScreen";
import AirdropHistoryScreen from "../screens/airdrop/AirdropHistoryScreen";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const P2PTab = createBottomTabNavigator();
const P2PStack = createStackNavigator();

const options: any = {
  headerShown: false,
  cardStyle: { backgroundColor: colors.newThemeColor },
  contentStyle: { backgroundColor: colors.newThemeColor },
};

const TabIcon = React.memo(({ focused, icon, color }: any) => (
  <FastImage
    source={icon}
    style={commonStyles.tabIcon}
    tintColor={focused ? color : colors.black}
    resizeMode="contain"
  />
));

const MyAuthLoadingStack = () => {
  const p2p = useAppSelector((state) => state.home.p2p);
  return (
    <Stack.Navigator screenOptions={options}>
      <Stack.Screen
        name={routes.NAVIGATION_AUTH_LOADING_SCREEN}
        component={AuthLoading}
      />
      <Stack.Screen name={routes.NAVIGATION_AUTH_STACK} component={AuthStack} />
      {/* <Stack.Screen
        name={'ProfileDrawer'}
        component={DrawerNavigation}
        /> */}
      <Stack.Screen name="ProfileDrawer" component={ProfileDrawer} />
      <Stack.Screen
        name={routes.NAVIGATION_BOTTOM_TAB_STACK}
        component={BottomNavigation}
      />
      <Stack.Screen name={routes.EDIT_PROFILE_SCREEN} component={EditProfile} />
      <Stack.Screen
        name={routes.NOTIFICATION_SCREEN}
        component={Notification}
      />
      <Stack.Screen name={routes.SEARCH_SCREEN} component={Search} />
      <Stack.Screen name={routes.MARKET_SCREEN} component={Market} />
      <Stack.Screen name={routes.AIRDROP_HISTORY_SCREEN} component={AirdropHistoryScreen} />

      <Stack.Screen
        name={routes.NOTIFICATION_SETTINGS_SCREEN}
        component={NotificationSettings}
      />
      <Stack.Screen name={routes.SETTINGS_SCREEN} component={Settings} />
      <Stack.Screen name={routes.KYC_STEP_ONE_SCREEN} component={KycStepOne} />
      <Stack.Screen name={routes.KYC_STEP_TWO_SCREEN} component={KycStepTwo} />
      <Stack.Screen
        name={routes.KYC_STEP_THREE_SCREEN}
        component={KycStepThree}
      />
      <Stack.Screen
        name={routes.KYC_STEP_FOUR_SCREEN}
        component={KycStepFour}
      />
      <Stack.Screen
        name={routes.KYC_STEP_FIVE_SCREEN}
        component={KycStepFive}
      />
      <Stack.Screen
        name={routes.KYC_STEP_SIX_SCREEN}
        component={KycStepReview}
      />
      <Stack.Screen
        name={routes.KYC_VERIFICATION_SCREEN}
        component={KycVerificationScreen}
      />
      <Stack.Screen
        name={routes.KYC_RESUBMIT_SCREEN}
        component={KycResubmitScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name={routes.KYC_STATUS_SCREEN} component={KycStatus} />
      <Stack.Screen
        name={routes.BANKING_AND_TRADE_SETTINGS_SCREEN}
        component={BankingSettings}
      />

      <Stack.Screen name={routes.CMS_SCREEN} component={CmsPages} />
      <Stack.Screen
        name={routes.CHANGE_PASSWORD_SCREEN}
        component={ChangePassword}
      />

      <Stack.Screen
        name={routes.CURRENCY_PREFERENCE_SCREEN}
        component={CurrencyPreference}
      />
      <Stack.Screen name={routes.WITHDRAW_SCREEN} component={Withdraw} />
      <Stack.Screen name={routes.CONVERT_SCREEN} component={ConvertNew} />
      <Stack.Screen name={routes.COIN_DETAILS_SCREEN} component={CoinDetails} />
      <Stack.Screen
        name={routes.WALLET_DETAIL_SCREEN}
        component={WalletDetails}
      />
      {/* <Stack.Screen name={routes.DEPOSIT_INR_SCREEN} component={DepositInr} /> */}
      <Stack.Screen name={routes.WITHDRAW_INR_SCREEN} component={WithdrawInr} />
      <Stack.Screen
        name={routes.WALLET_HISTORY_DETAILS_SCREEN}
        component={WalletHistoryDetails}
      />
      <Stack.Screen
        name={routes.TRADE_HISTORY_DETAILS_SCREEN}
        component={TradeHistoryDetails}
      />
      <Stack.Screen
        name={routes.PAYMENT_OPTIONS_SCREEN}
        component={PaymentOptions}
      />
      <Stack.Screen
        name={routes.TRADE_SETTINGS_SCREEN}
        component={TradeSettings}
      />
      <Stack.Screen name={routes.FEE_SETTINGS_SCREEN} component={FeeSettings} />
      <Stack.Screen
        name={routes.DOWNLOAD_TRADE_REPORT_SCREEN}
        component={DownloadReport}
      />
      <Stack.Screen name={routes.ADD_NEW_BANK_SCREEN} component={AddNewBank} />
      <Stack.Screen
        name={routes.COIN_DETAILS_CHART_SCREEN}
        component={CoinDetailChart}
      />
      <Stack.Screen
        name={routes.COIN_TRANSACTION_HISTORY_SCREEN}
        component={CoinTransactionHistory}
      />
      <Stack.Screen
        name={routes.TWO_FACTOR_AUTHENTICATION}
        component={TwoFactor}
      />
      <Stack.Screen name={routes.TRADE} component={BtcCoinDetails as any} />
      <Stack.Screen
        name={routes.TWO_FACTOR_QR_SCREEN}
        component={TwoFactorQr}
      />
      <Stack.Screen
        name={routes.ADD_PHONE_NUMBER_SCREEN}
        component={AddPhoneNumberScreen}
      />
      <Stack.Screen
        name={routes.ADD_EMAIL_SCREEN}
        component={AddEmailScreen}
      />
      <Stack.Screen
        name={routes.SETUP_TWO_FACTOR_SCREEN}
        component={SetupTwoFactorScreen}
      />
      <Stack.Screen
        name={routes.VERIFY_AUTHENTICATOR_CODE_SCREEN}
        component={VerifyAuthenticatorCodeScreen}
      />
      <Stack.Screen
        name={routes.ADD_PASSKEY_SCREEN}
        component={AddPasskeyScreen}
      />
      <Stack.Screen
        name={routes.CHANGE_EMAIL_SCREEN}
        component={ChangeEmailScreen}
      />
      <Stack.Screen
        name={routes.CHANGE_MOBILE_SCREEN}
        component={ChangeMobileScreen}
      />
      <Stack.Screen
        name={routes.VIEW_PASSKEYS_SCREEN}
        component={ViewPasskeysScreen}
      />
      <Stack.Screen
        name={routes.DISABLE_2FA_SCREEN}
        component={Disable2FAScreen}
      />
      <Stack.Screen name={routes.ENTER_OTP_SCREEN} component={EnterOtp} />

      <Stack.Screen
        name={routes.CONVERT_HISTORY_SCREEN}
        component={ConvertHistory}
      />
      <Stack.Screen
        name={routes.LANGUAGE_PREFERENCE_SCREEN}
        component={LanguagePreference}
      />

      <Stack.Screen name={routes.QS_TRANSACTION} component={QsTransaction} />


      <Stack.Screen name={routes.STAKING_SUCCESS} component={StakingSuccess} />
      <Stack.Screen name={routes.LAKED_STAKING} component={LackedStakes} />
      <Stack.Screen name={routes.STAKING_HISTORY} component={StakingHistory} />
      <Stack.Screen name={routes.p2pFilter} component={P2pFilter} />
      <Stack.Screen name={routes.BUY_CRYPTO} component={BuyByCrypto} />
      <Stack.Screen name={routes.ORDER_CREATED} component={OrderCreated} />
      <Stack.Screen name={routes.ORDER_HISTORY} component={OrderHistory} />
      <Stack.Screen name={routes.SPOT_ORDER_HISTORY_DETAIL} component={SpotOrderHistoryDetail} />
      <Stack.Screen name={routes.COMMIT_DETAIL} component={CommitDetails} />
      <Stack.Screen name={routes.ACTIVITY_LOGS} component={ActivityLogs} />
      <Stack.Screen name={routes.REFERRAL_LIST} component={ReferralList} />
      <Stack.Screen
        name={routes.WALLET_HISTORY_SCREEN}
        component={WalletHistory}
      />
      <Stack.Screen name={routes.SPOT_MARKET_SCREEN} component={SpotMarket as any} />
      <Stack.Screen name={routes.MORE_MENU_SCREEN} component={MoreMenu} />
      <Stack.Screen name={routes.TRANSFER_SCREEN} component={Transfer} />
      <Stack.Screen
        name={routes.DEPOSIT_WALLET_SCREEN}
        component={DepositWallet}
      />
      <Stack.Screen name={routes.DEPOSIT_COIN_SCREEN} component={DepositCoin} />
      <Stack.Screen
        name={routes.WALLET_WITHDRAW_SCREEN}
        component={WithdrawWallet}
      />
      <Stack.Screen
        name={routes.WITHDRAW_Coin_SCREEN}
        component={WithdrawCoin}
      />
      <Stack.Screen name={routes.Dashboard_Inner} component={DashboardInner} />

      <Stack.Screen name={"Support"} component={Support} />
      <Stack.Screen name={routes.kyc_Details} component={kycDetails} />
      <Stack.Screen name={"PanVerify"} component={PanVerify} />
      <Stack.Screen name={"AadharVerify"} component={AadharVerify} />
      <Stack.Screen name={"UploadSelfie"} component={UploadSelfie} />
      <Stack.Screen name={"CurrencyPrefer"} component={CurrencyPrefer} />
      <Stack.Screen name={routes.SECURITY} component={Security} />
      <Stack.Screen
        name={routes.SETTING_SCREEN_New}
        component={SettingsScreen}
      />
      <Stack.Screen name={"WebLink"} component={WebLink} />
      <Stack.Screen name={routes.INVITE_AND_EARN_SCREEN} component={RefferalReward} />
      <Stack.Screen name={routes.REFFERAL_TREE} component={ReferralTree} />
      <Stack.Screen name={routes.AIRDROP_SCREEN} component={AirDropScreen} />
      <Stack.Screen name={'Trade_History'} component={TradeHistory} />
      <Stack.Screen name={'Interanl_Trade_History'} component={InternalWalletHistory} />
      <Stack.Screen name={'Open_Order'} component={OpenOrder} />
      <Stack.Screen name={'Wallet_History'} component={NewWalletHistory} />
      <Stack.Screen name={'Swap_History'} component={NewSwapHistory} />
      <Stack.Screen name={'Admin_Trade'} component={AdminTradeHistory} />
      <Stack.Screen name={'Ticket_Screen'} component={TicketScreen} />
      <Stack.Screen name={'BuyPackage'} component={BuyPackage} />
      {/* <Stack.Screen name={'EarningHistory'} component={EarningHistory} /> */}
      <Stack.Screen name={'EarningPortfolio'} component={EarningPortfolio} />
      <Stack.Screen name={'Launchpad'} component={Launchpad} />
      <Stack.Screen name={'AllLiveProjects'} component={AllLiveProjects} />
      <Stack.Screen name={'AllUpcomingProjects'} component={AllUpcomingProjects} />
      <Stack.Screen name={'AllEndedProjects'} component={AllEndedProjects} />
      <Stack.Screen
        name={routes.FUTURE_ORDER_HISTORY}
        component={FutureOrderHistory}
      />
      <Stack.Screen name={'ProjectDetails'} component={ProjectDetails} />
      <Stack.Screen
        name={routes.OPTIONS_SCREEN}
        component={OptionsScreen}
      />
      <Stack.Screen
        name={routes.BUY_OPTIONS_SCREEN}
        component={BuyOptions}
      />
      <Stack.Screen
        name={routes.OPTIONS_HISTORY_SCREEN}
        component={OptionsHistory}
      />

      <Stack.Screen
        name={routes.ANTI_PHISHING_CODE_SCREEN}
        component={AntiPhishingCode}
      />
    </Stack.Navigator>
  );
};
const AuthStack = () => (
  <Stack.Navigator screenOptions={options}>
    <Stack.Screen name={routes.WELCOME_SCREEN} component={Welcome} />
    <Stack.Screen name={routes.LOGIN_SCREEN} component={Login} />
    <Stack.Screen
      name={routes.FORGOT_PASSWORD_SCREEN}
      component={ForgotPassword}
    />
    <Stack.Screen name={routes.REGISTER_SCREEN} component={Register} />
    <Stack.Screen name={routes.SET_PASSWORD_SCREEN} component={SetPassword} />
    <Stack.Screen name={routes.VERIFY_ACCOUNT_SCREEN} component={VerifyAccount} />
    <Stack.Screen name={routes.ACCOUNT_ACTIVATED_SCREEN} component={AccountActivated} />
    <Stack.Screen name={routes.OTP_VERIFY_SCREEN} component={OtpVerify} />
    <Stack.Screen
      name={routes.AUTH_VERIFICATION_SCREEN}
      component={AuthVerificationScreen}
      options={{
        cardStyleInterpolator: ({ current }) => ({
          cardStyle: { opacity: current.progress },
        }),
        transitionSpec: {
          open: { animation: 'timing' as const, config: { duration: 350 } },
          close: { animation: 'timing' as const, config: { duration: 300 } },
        },
      }}
    />
    <Stack.Screen
      name={routes.RESET_PASSWORD_SCREEN}
      component={ResetPassword}
    />
  </Stack.Navigator>
);



function BottomNavigation() {
  const { colors: themeColors, isDark } = useTheme();
  const tabBarBg = isDark ? themeColors.tabBar : "#FFFFFF";
  const tabBorder = isDark ? themeColors.border : "#E5E7EB";
  const activeIcon = isDark ? themeColors.button : colors.black;
  const inactive = themeColors.inactiveTab;

  const tabBarHeight = Platform.OS === "ios" ? 68 : 56;

  return (
    <ChartPreloaderProvider>
      <Tab.Navigator
        initialRouteName={routes.HOME_SCREEN}
        backBehavior={"history"}
        detachInactiveScreens={false}
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarShowLabel: false,
          tabBarActiveTintColor: activeIcon,
          tabBarInactiveTintColor: inactive,
          tabBarStyle: {
            backgroundColor: tabBarBg,
            height: tabBarHeight,
            paddingTop: 0,
            paddingBottom: Platform.OS === "ios" ? 16 : 8,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: tabBorder,
            elevation: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.08,
            shadowRadius: 6,
          },
          tabBarItemStyle: {
            paddingTop: 2,
          },
        }}
      >
        <Tab.Screen
          name={routes.HOME_SCREEN}
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={bottomTabStyles.tabColumn}>
                {focused ? (
                  <View
                    style={[
                      bottomTabStyles.activeIndicator,
                      { backgroundColor: activeIcon },
                    ]}
                  />
                ) : (
                  <View style={bottomTabStyles.activeIndicatorPlaceholder} />
                )}
                <FastImage
                  source={homeIcon}
                  style={bottomTabStyles.tabIcon}
                  resizeMode="contain"
                  tintColor={focused ? activeIcon : inactive}
                />
                <AppText
                  weight={focused ? BOLD : MEDIUM}
                  type={TEN}
                  style={[bottomTabStyles.tabLabel, { color: focused ? activeIcon : inactive }]}
                >
                  Home
                </AppText>
              </View>
            ),
          }}
          component={Home}
        />
        <Tab.Screen
          name={routes.FUTURES_SCREEN}
          options={{
            freezeOnBlur: true,
            unmountOnBlur: false,
            tabBarIcon: ({ focused }) => (
              <View style={bottomTabStyles.tabColumn}>
                <View style={bottomTabStyles.activeIndicatorPlaceholder} />
                <FastImage
                  source={focused ? futuresActiveIcon : futuresActiveIcon}
                  style={bottomTabStyles.tabIconMd}
                  resizeMode="contain"
                  tintColor={focused ? activeIcon : inactive}
                />
                <AppText
                  weight={focused ? BOLD : MEDIUM}
                  type={TEN}
                  style={[bottomTabStyles.tabLabel, { color: focused ? activeIcon : inactive }]}
                >
                  Futures
                </AppText>
              </View>
            ),
          }}
          component={Futures}
        />
        <Tab.Screen
          name={routes.WALLET_SCREEN}
          options={{
            tabBarLabel: "Trade",
            freezeOnBlur: true,
            unmountOnBlur: false,
            tabBarIcon: ({ focused }) => (
              <View style={bottomTabStyles.tradeColumn}>
                <FastImage
                  source={tradeImg}
                  style={bottomTabStyles.tradeAssetImg}
                  resizeMode="contain"
                />
                <AppText
                  weight={focused ? BOLD : MEDIUM}
                  type={TEN}
                  style={[bottomTabStyles.tradeLabel, { color: focused ? activeIcon : inactive }]}
                >
                  Trade
                </AppText>
              </View>
            ),
          }}
          component={Spot}
        />
        <Tab.Screen
          name={routes.ACCOUNT_SCREEN}
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={bottomTabStyles.tabColumn}>
                <View style={bottomTabStyles.activeIndicatorPlaceholder} />
                <FastImage
                  source={earningIcon}
                  style={bottomTabStyles.tabIcon}
                  resizeMode="contain"
                  tintColor={focused ? activeIcon : inactive}
                />
                <AppText
                  weight={focused ? BOLD : MEDIUM}
                  type={TEN}
                  style={[bottomTabStyles.tabLabel, { color: focused ? activeIcon : inactive }]}
                >
                  Earn
                </AppText>
              </View>
            ),
          }}
          component={Earning}
        />
        <Tab.Screen
          name={routes.EARING_SCREEN}
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={bottomTabStyles.tabColumn}>
                <View style={bottomTabStyles.activeIndicatorPlaceholder} />
                <FastImage
                  source={wallet_ic}
                  style={bottomTabStyles.tabIcon}
                  resizeMode="contain"
                  tintColor={focused ? activeIcon : inactive}
                />
                <AppText
                  weight={focused ? BOLD : MEDIUM}
                  type={TEN}
                  style={[bottomTabStyles.tabLabel, { color: focused ? activeIcon : inactive }]}
                >
                  Wallet
                </AppText>
              </View>
            ),
          }}
          component={WalletNew}
        />
      </Tab.Navigator>
    </ChartPreloaderProvider>
  );
}

const bottomTabStyles = StyleSheet.create({
  tabColumn: {
    alignItems: "center",
    justifyContent: "flex-end",
    minHeight: 46,
    paddingBottom: 0,
  },
  activeIndicator: {
    width: 28,
    height: 3,
    borderRadius: 2,
    marginBottom: 6,
  },
  activeIndicatorPlaceholder: {
    height: 3,
    marginBottom: 6,
    width: 28,
    opacity: 0,
  },
  tabIcon: {
    width: 22,
    height: 22,
  },
  tabIconMd: {
    width: 22,
    height: 22,
  },
  tabLabel: {
    marginTop: 4,
  },
  tradeColumn: {
    alignItems: "center",
    justifyContent: "flex-end",
    minHeight: 46,
    paddingBottom: 0,
  },
  /** Full-bleed trade asset (circle + arrows in PNG); no extra colored wrapper. */
  tradeAssetImg: {
    width: 52,
    height: 52,
    marginTop: -26,
    marginBottom: 0,
  },
  tradeLabel: {
    marginTop: 2,
  },
});

const RootStackScreen = () => (
  <Stack.Navigator
    screenOptions={options}
  >
    <Stack.Screen
      name={routes.NAVIGATION_AUTH_LOADING_STACK}
      component={MyAuthLoadingStack}
    />
  </Stack.Navigator>
);

const appTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.newThemeColor,
    card: colors.newThemeColor,
  },
};

const Navigator = () => {
  return (
    <NavigationContainer
      theme={appTheme}
      ref={(navigationRef) => {
        NavigationService.setTopLevelNavigator(navigationRef);
      }}
    >
      <KycFormProvider>
        <RootStackScreen />
      </KycFormProvider>
    </NavigationContainer>
  );
};

export default Navigator;
