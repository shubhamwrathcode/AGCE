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
import AuthVerificationScreen from "../screens/auth/AuthVerificationScreen";
import FastImage from "react-native-fast-image";
import { commonStyles } from "../theme/commonStyles";
import { colors } from "../theme/colors";
import {
  earningIcon,
  futuresActiveIcon,
  futuresIcon,
  homeIcon,
  market_ic,
  marketIcon,
  tradeImg,
  wallet_ic,
} from "../helper/ImageAssets";
import Home from "../features/home/screens/HomeDashboardScreen";
import EditProfile from "../screens/account/EditProfile";
import Notification from "../screens/other/Notification";
import NotificationSettings from "../screens/account/NotificationSettings";
import Settings from "../screens/account/Settings";
import KycStatus from "../screens/account/KycStatus";
import ChangePassword from "../screens/settings/ChangePassword";
import AntiPhishingStatus from "../screens/Security/AntiPhishing/AntiPhishingStatus";
import CreateAntiPhishingScreen from "../screens/Security/AntiPhishing/CreateAntiPhishingScreen";
import RemoveAntiPhishingScreen from "../screens/Security/AntiPhishing/RemoveAntiPhishingScreen";
import EditAntiPhishingScreen from "../screens/Security/AntiPhishing/EditAntiPhishingScreen";
import DisableAntiPhishingScreen from "../screens/Security/AntiPhishing/DisableAntiPhishingScreen";
import ResetPassword from "../screens/settings/ResetPassword";
import CurrencyPreference from "../screens/account/CurrencyPreference";
import CoinDetails from "../screens/trades/CoinDetails";
import WalletDetails from "../features/wallet/screens/WalletDetailsScreen";
import WalletHistoryDetails from "../screens/wallet/WalletHistoryDetails";
import TradeHistoryDetails from "../screens/wallet/TradeHistoryDetails";
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
import AddPhoneNumberScreen from "../screens/Security/PhoneVerification/AddPhoneNumberScreen";
import ChangePhoneNumberScreen from "../screens/Security/PhoneVerification/ChangePhoneNumberScreen";
import UnlinkPhoneNumberScreen from "../screens/Security/PhoneVerification/UnlinkPhoneNumberScreen";
import UnlinkSuccessScreen from "../screens/Security/PhoneVerification/UnlinkSuccessScreen";
import LoginTwoStepVerificationScreen from "../screens/Security/LoginTwoStepVerificationScreen";
import WithdrawalSettingsScreen from "../screens/Security/WithdrawalSettings/WithdrawalSettingsScreen";
import WithdrawalVerifyEmailScreen from "../screens/Security/WithdrawalSettings/WithdrawalVerifyEmailScreen";
import WithdrawalVerifyPhoneScreen from "../screens/Security/WithdrawalSettings/WithdrawalVerifyPhoneScreen";
import AddEmailScreen from "../screens/Security/AddEmailScreen";
import SetupTwoFactorScreen from "../screens/account/SetupTwoFactorScreen";
import VerifyAuthenticatorCodeScreen from "../screens/account/VerifyAuthenticatorCodeScreen";
import AddPasskeyScreen from "../screens/account/AddPasskeyScreen";
import ViewPasskeysScreen from "../screens/account/ViewPasskeysScreen";
import EnablePasskey from "../screens/Security/Passkey/EnablePasskey";
import PasskeyAddPhone from "../screens/Security/Passkey/PasskeyAddPhone";
import SecurityVerification from "../screens/Security/Passkey/SecurityVerification";
import DownloadAuthenticator from "../screens/Security/Passkey/DownloadAuthenticator";
import SetupAuthenticator from "../screens/Security/Passkey/SetupAuthenticator";
import EmergencyContactMain from "../screens/Security/EmergencyContact/EmergencyContactMain";
import AddEmergencyContact from "../screens/Security/EmergencyContact/AddEmergencyContact";
import ConfirmEmergencyContact from "../screens/Security/EmergencyContact/ConfirmEmergencyContact";
import AccountConnections from "../screens/Security/AccountConnections";
import FundPasswordMain from "../screens/Security/FundPassword/FundPasswordMain";
import ChangeFundPassword from "../screens/Security/FundPassword/ChangeFundPassword";
import ResetFundPassword from "../screens/Security/FundPassword/ResetFundPassword";
import ResetSuccess from "../screens/Security/FundPassword/ResetSuccess";
import ChangeLoginPasswordScreen from "../screens/Security/LoginPassword/ChangeLoginPasswordScreen";
import ResetYourPasswordScreen from "../screens/Security/LoginPassword/ResetYourPasswordScreen";
import AuthorizedDevicesScreen from "../screens/Security/AuthorizedDevicesScreen";
import SecurityLogsScreen from "../screens/Security/SecurityLogsScreen";
import DisableAccountScreen from "../screens/Security/AccountManagement/DisableAccountScreen";
import DisableAccountVerifyScreen from "../screens/Security/AccountManagement/DisableAccountVerifyScreen";
import ThirdPartyAccountAccessScreen from "../screens/Security/AccountManagement/ThirdPartyAccountAccessScreen";
import CloseAccountReasonScreen from "../screens/Security/AccountManagement/CloseAccount/CloseAccountReasonScreen";
import EmergencyContactVerification from "../screens/Security/EmergencyContact/EmergencyContactVerification";
import DisableTwoFactorScreen from "../screens/account/DisableTwoFactorScreen";
import EnterOtp from "../screens/account/EnterOtp";
import ConvertHistory from "../screens/home/ConvertHistory";
import LanguagePreference from "../screens/account/LanguagePreference";
import Search from "../features/trades/screens/MarketSearchScreen";
import {
  AppText,
  BLACK,
  BOLD,
  MEDIUM,
  TEN,
  YELLOW,
} from "../shared";
import { Platform, StyleSheet, TouchableOpacity, View, Keyboard } from "react-native";
import Toast from "react-native-simple-toast";
import StakingSuccess from "../screens/Staking/StakingSuccess";
import QsTransaction from "../screens/QuickBuySell/qsTransaction";
import LackedStakes from "../screens/Staking/LackedStakes";
import StakingHistory from "../screens/Staking/StakingHistory";
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
import WalletHistory from "../features/wallet/screens/WalletHistoryScreen";
import Market from "../screens/other/Market";
import SpotMarket from "../screens/other/SpotMarket";
import MoreMenu from "../features/home/screens/MoreOptionsScreen";
import WalletNew from "../features/wallet/screens/WalletOverviewScreen";
import Transfer from "../features/wallet/screens/SendFundsScreen";
import ConvertNew from "../screens/wallet/ConvertNew";
import DepositWallet from "../screens/wallet/DepositWallet";
import DepositCoin from "../screens/wallet/DepositCoin";
import Earning from "../screens/other/Earning";
import DashboardInner from "../screens/dashboardInner/DashboardInner";
import Spot from "../screens/spotScreen/Spot";
import SpotChartScreen from "../screens/spotScreen/SpotChartScreen";
import ProfileDrawer from "../screens/profileDrawer/ProfileDrawer";
import { createDrawerNavigator } from "@react-navigation/drawer";
import SupportIssueList from "../screens/supportSreen/SupportIssueList";
import CreateTicket from "../screens/supportSreen/CreateTicket";
import kycDetails from "../screens/kycScrrens/kycDetails";
import PanVerify from "../screens/kycScrrens/PanVerify";
import AadharVerify from "../screens/kycScrrens/AadharVerify";
import UploadSelfie from "../screens/kycScrrens/UploadSelfie";
import CurrencyPrefer from "../screens/currencyPrefer/CurrencyPrefer";
import Security from "../screens/supportSreen/Security";
import SettingsScreen from "../screens/settings/Settings";
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
import DepositHistoryDetailScreen from "../screens/account/DepositHistoryDetailScreen";
import WithdrawalHistory from "../screens/wallet/WithdrawalHistory";
import WithdrawalDetailPage from "../screens/wallet/WithdrawalDetailPage";
import SelectCoin from "../screens/wallet/Withdrawal/SelectCoin";
import WithdrawForm from "../screens/wallet/Withdrawal/WithdrawForm";
import AddFavouriteScreen from "../screens/other/AddFavouriteScreen";
import AccountDetails from "../screens/Security/AccountDetails";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const P2PTab = createBottomTabNavigator();
const P2PStack = createStackNavigator();

const CustomBottomTabBar = ({ state, descriptors, navigation }: any) => {
  const [visible, setVisible] = React.useState(true);
  const { colors: themeColors, isDark } = useTheme();

  React.useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setVisible(false)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setVisible(true)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  if (!visible) return null;

  return (
    <View style={customTabBarStyles.container}>
      {state.routes.map((route: any, index: number) => {
        const isFocused = state.index === index;
        const onPress = () => {
          if (route.name === routes.FUTURES_SCREEN) {
            Toast.showWithGravity("Coming soon", Toast.SHORT, Toast.BOTTOM);
            return;
          }
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        const iconByRoute: any = {
          [routes.HOME_SCREEN]: homeIcon,
          [routes.MARKET_SCREEN]: marketIcon,
          [routes.TRADE_SCREEN]: tradeImg,
          [routes.FUTURES_SCREEN]: futuresActiveIcon,
          [routes.WALLET_SCREEN]: wallet_ic,
        };

        const labelByRoute: any = {
          [routes.HOME_SCREEN]: "Home",
          [routes.MARKET_SCREEN]: "Market",
          [routes.TRADE_SCREEN]: "Trade",
          [routes.FUTURES_SCREEN]: "Future",
          [routes.WALLET_SCREEN]: "Wallet",
        };

        const tint = isFocused ? (isDark ? colors.white : colors.black) : "#8E8E93";
        const icon = iconByRoute[route.name];
        const label = labelByRoute[route.name] ?? route.name;

        const bg = isDark ? "rgba(24, 26, 32, 0.95)" : "rgba(255, 255, 255, 0.95)";

        return (
          <View key={route.key} style={[customTabBarStyles.itemWrap, { backgroundColor: bg }]}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={descriptors[route.key]?.options?.tabBarAccessibilityLabel}
              testID={descriptors[route.key]?.options?.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={customTabBarStyles.item}
              activeOpacity={0.8}
            >
              <FastImage source={icon} style={customTabBarStyles.icon} resizeMode="contain" tintColor={tint} />
              <AppText weight={isFocused ? BOLD : MEDIUM} type={TEN} style={[customTabBarStyles.label, { color: tint }]}>
                {label}
              </AppText>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
};

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
      <Stack.Screen name={routes.ACCOUNT_SCREEN} component={AccountDetails} />
      <Stack.Screen name={routes.EDIT_PROFILE_SCREEN} component={EditProfile} />
      <Stack.Screen
        name={routes.NOTIFICATION_SCREEN}
        component={Notification}
      />
      <Stack.Screen name={routes.SEARCH_SCREEN} component={Search} />
      <Stack.Screen name={routes.MARKET_SCREEN} component={Market} />

      <Stack.Screen
        name={routes.NOTIFICATION_SETTINGS_SCREEN}
        component={NotificationSettings}
      />
      <Stack.Screen name={routes.SETTINGS_SCREEN} component={Settings} />
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
        name={routes.CHANGE_PASSWORD_SCREEN}
        component={ChangePassword}
      />

      <Stack.Screen
        name={routes.CURRENCY_PREFERENCE_SCREEN}
        component={CurrencyPreference}
      />
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
        name={routes.DEPOSIT_HISTORY_DETAIL_SCREEN}
        component={DepositHistoryDetailScreen}
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
      <Stack.Screen
        name={routes.TWO_FACTOR_QR_SCREEN}
        component={TwoFactorQr}
      />
      <Stack.Screen
        name={routes.ADD_PHONE_NUMBER_SCREEN}
        component={AddPhoneNumberScreen}
      />
      <Stack.Screen
        name={routes.UNLINK_PHONE_NUMBER_SCREEN}
        component={UnlinkPhoneNumberScreen}
      />
      <Stack.Screen
        name={routes.UNLINK_SUCCESS_SCREEN}
        component={UnlinkSuccessScreen}
      />
      <Stack.Screen
        name={routes.CHANGE_PHONE_NUMBER_SCREEN}
        component={ChangePhoneNumberScreen}
      />
      <Stack.Screen
        name={routes.LOGIN_TWO_STEP_VERIFICATION_SCREEN}
        component={LoginTwoStepVerificationScreen}
      />
      <Stack.Screen
        name={routes.WITHDRAWAL_SETTINGS_SCREEN}
        component={WithdrawalSettingsScreen}
      />
      <Stack.Screen
        name={routes.WITHDRAWAL_VERIFY_EMAIL_SCREEN}
        component={WithdrawalVerifyEmailScreen}
      />
      <Stack.Screen
        name={routes.WITHDRAWAL_VERIFY_PHONE_SCREEN}
        component={WithdrawalVerifyPhoneScreen}
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
        name={routes.VIEW_PASSKEYS_SCREEN}
        component={ViewPasskeysScreen}
      />
      <Stack.Screen
        name={routes.PASSKEY_SCREEN}
        component={EnablePasskey}
      />
      <Stack.Screen
        name={routes.PASSKEY_ADD_PHONE_SCREEN}
        component={PasskeyAddPhone}
      />
      <Stack.Screen
        name={routes.PASSKEY_SECURITY_VERIFICATION_SCREEN}
        component={SecurityVerification}
      />
      <Stack.Screen
        name={routes.DOWNLOAD_AUTHENTICATOR_SCREEN}
        component={DownloadAuthenticator}
      />
      <Stack.Screen
        name={routes.PASSKEY_SETUP_AUTHENTICATOR_SCREEN}
        component={SetupAuthenticator}
      />
      <Stack.Screen
        name={routes.EMERGENCY_CONTACT_SCREEN}
        component={EmergencyContactMain}
      />
      <Stack.Screen
        name={routes.ADD_EMERGENCY_CONTACT_SCREEN}
        component={AddEmergencyContact}
      />
      <Stack.Screen
        name={routes.CONFIRM_EMERGENCY_CONTACT_SCREEN}
        component={ConfirmEmergencyContact}
      />
      <Stack.Screen
        name={routes.ACCOUNT_CONNECTIONS_SCREEN}
        component={AccountConnections}
      />
      <Stack.Screen
        name={routes.FUND_PASSWORD_MAIN_SCREEN}
        component={FundPasswordMain}
      />
      <Stack.Screen
        name={routes.CHANGE_FUND_PASSWORD_SCREEN}
        component={ChangeFundPassword}
      />
      <Stack.Screen
        name={routes.RESET_FUND_PASSWORD_SCREEN}
        component={ResetFundPassword}
      />
      <Stack.Screen
        name={routes.FUND_PASSWORD_RESET_SUCCESS_SCREEN}
        component={ResetSuccess}
      />
      <Stack.Screen
        name={routes.CHANGE_LOGIN_PASSWORD_SCREEN}
        component={ChangeLoginPasswordScreen}
      />
      <Stack.Screen
        name={routes.RESET_YOUR_PASSWORD_SCREEN}
        component={ResetYourPasswordScreen}
      />
      <Stack.Screen
        name={routes.EMERGENCY_CONTACT_VERIFICATION_SCREEN}
        component={EmergencyContactVerification}
      />
      <Stack.Screen
        name={routes.DISABLE_2FA_SCREEN}
        component={DisableTwoFactorScreen}
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
      <Stack.Screen name={routes.REFERRAL_LIST} component={ReferralList} />
      <Stack.Screen
        name={routes.WALLET_HISTORY_SCREEN}
        component={WalletHistory}
      />
      <Stack.Screen name={routes.SPOT_MARKET_SCREEN} component={SpotMarket as any} />
      <Stack.Screen name={routes.SPOT_CHART_SCREEN} component={SpotChartScreen} />
      <Stack.Screen name={routes.MORE_MENU_SCREEN} component={MoreMenu} />
      <Stack.Screen name={routes.TRANSFER_SCREEN} component={Transfer} />
      <Stack.Screen
        name={routes.DEPOSIT_WALLET_SCREEN}
        component={DepositWallet}
      />
      <Stack.Screen name={routes.DEPOSIT_COIN_SCREEN} component={DepositCoin} />
      <Stack.Screen name={routes.SELECT_COIN_SCREEN} component={SelectCoin} options={options} />
      <Stack.Screen name={routes.WITHDRAW_FORM_SCREEN} component={WithdrawForm} options={options} />
      <Stack.Screen
        name={routes.WALLET_WITHDRAW_SCREEN}
        component={SelectCoin}
        options={options}
      />
      <Stack.Screen name={routes.Dashboard_Inner} component={DashboardInner} />

      <Stack.Screen name={"Support"} component={SupportIssueList} />
      <Stack.Screen name={routes.CREATE_TICKET_SCREEN} component={CreateTicket} />
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
      <Stack.Screen name={'Trade_History'} component={TradeHistory} />
      <Stack.Screen name={'Interanl_Trade_History'} component={InternalWalletHistory} />
      <Stack.Screen name={routes.OPEN_ORDER_SCREEN} component={OpenOrder} />
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
        name={routes.AUTHORIZED_DEVICES_SCREEN}
        component={AuthorizedDevicesScreen}
      />
      <Stack.Screen
        name={routes.SECURITY_LOGS_SCREEN}
        component={SecurityLogsScreen}
      />
      <Stack.Screen
        name={routes.DISABLE_ACCOUNT_SCREEN}
        component={DisableAccountScreen}
      />
      <Stack.Screen
        name={routes.DISABLE_ACCOUNT_VERIFY_SCREEN}
        component={DisableAccountVerifyScreen}
      />
      <Stack.Screen
        name={routes.THIRD_PARTY_ACCOUNT_ACCESS_SCREEN}
        component={ThirdPartyAccountAccessScreen}
      />
      <Stack.Screen
        name={routes.CLOSE_ACCOUNT_REASON_SCREEN}
        component={CloseAccountReasonScreen}
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
        component={AntiPhishingStatus}
      />
      <Stack.Screen
        name={routes.CREATE_ANTI_PHISHING_SCREEN}
        component={CreateAntiPhishingScreen}
      />
      <Stack.Screen
        name={routes.REMOVE_ANTI_PHISHING_SCREEN}
        component={RemoveAntiPhishingScreen}
      />
      <Stack.Screen
        name={routes.EDIT_ANTI_PHISHING_SCREEN}
        component={EditAntiPhishingScreen}
      />
      <Stack.Screen
        name={routes.DISABLE_ANTI_PHISHING_SCREEN}
        component={DisableAntiPhishingScreen}
      />
      <Stack.Screen
        name={routes.FORGOT_PASSWORD_SCREEN}
        component={ForgotPassword}
      />
      <Stack.Screen
        name={routes.RESET_PASSWORD_FROM_CHANGE}
        component={ResetPassword}
      />
      <Stack.Screen
        name={routes.WITHDRAW_HISTORY_SCREEN}
        component={WithdrawalHistory}
      />
      <Stack.Screen
        name={routes.WITHDRAW_DETAIL_SCREEN}
        component={WithdrawalDetailPage}
      />
      <Stack.Screen
        name={routes.ADD_FAVOURITE_SCREEN}
        component={AddFavouriteScreen}
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
  const tabBarBg = "#FFFFFF";
  const tabBorder = isDark ? themeColors.border : "#E5E7EB";
  const activeIcon = colors.black;
  const inactive = themeColors.inactiveTab;

  const tabBarHeight = Platform.OS === "ios" ? 74 : 62;

  return (
    <ChartPreloaderProvider>
      <Tab.Navigator
        initialRouteName={routes.HOME_SCREEN}
        backBehavior={"history"}
        detachInactiveScreens={false}
        sceneContainerStyle={{ backgroundColor: "#FFFFFF" }}
        tabBar={(props) => <CustomBottomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarShowLabel: false,
          tabBarActiveTintColor: activeIcon,
          tabBarInactiveTintColor: inactive,
          tabBarStyle: {
            // Real UI handled by CustomBottomTabBar
            height: tabBarHeight,
            backgroundColor: "transparent",
            borderTopWidth: 0,
          },
          tabBarItemStyle: {
            paddingTop: 0,
            paddingBottom: 0,
          },
        }}
      >
        <Tab.Screen
          name={routes.HOME_SCREEN}
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={bottomTabStyles.tabColumn}>
                <View
                  style={[
                    bottomTabStyles.iconWrap,
                    { backgroundColor: "transparent" },
                  ]}
                >
                  <FastImage
                    source={homeIcon}
                    style={bottomTabStyles.tabIcon}
                    resizeMode="contain"
                    tintColor={focused ? activeIcon : inactive}
                  />
                </View>
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
          name={routes.MARKET_SCREEN}
          options={{
            freezeOnBlur: true,
            unmountOnBlur: false,
            tabBarIcon: ({ focused }) => (
              <View style={bottomTabStyles.tabColumn}>
                <View
                  style={[
                    bottomTabStyles.iconWrap,
                    { backgroundColor: "transparent" },
                  ]}
                >
                  <FastImage
                    source={marketIcon}
                    style={bottomTabStyles.tabIconMd}
                    resizeMode="contain"
                    tintColor={focused ? activeIcon : inactive}
                  />
                </View>
                <AppText
                  weight={focused ? BOLD : MEDIUM}
                  type={TEN}
                  style={[bottomTabStyles.tabLabel, { color: focused ? activeIcon : inactive }]}
                >
                  Market
                </AppText>
              </View>
            ),
          }}
          component={Market}
        />
        <Tab.Screen
          name={routes.TRADE_SCREEN}
          options={{
            freezeOnBlur: true,
            unmountOnBlur: false,
            tabBarIcon: ({ focused }) => (
              <View style={bottomTabStyles.tabColumn}>
                <View
                  style={[
                    bottomTabStyles.iconWrap,
                    { backgroundColor: "transparent" },
                  ]}
                >
                  <FastImage
                    source={tradeImg}
                    style={bottomTabStyles.tabIconMd}
                    resizeMode="contain"
                    tintColor={focused ? activeIcon : inactive}
                  />
                </View>
                <AppText
                  weight={focused ? BOLD : MEDIUM}
                  type={TEN}
                  style={[bottomTabStyles.tabLabel, { color: focused ? activeIcon : inactive }]}
                >
                  Trade
                </AppText>
              </View>
            ),
          }}
          initialParams={__DEV__ ? { historyOnly: true } : undefined}
          component={Spot}
        />
        <Tab.Screen
          name={routes.FUTURES_SCREEN}
          options={{
            freezeOnBlur: true,
            unmountOnBlur: false,
            tabBarIcon: ({ focused }) => (
              <View style={bottomTabStyles.tabColumn}>
                <View
                  style={[
                    bottomTabStyles.iconWrap,
                    { backgroundColor: "transparent" },
                  ]}
                >
                  <FastImage
                    source={futuresActiveIcon}
                    style={bottomTabStyles.tabIconMd}
                    resizeMode="contain"
                    tintColor={focused ? activeIcon : inactive}
                  />
                </View>
                <AppText
                  weight={focused ? BOLD : MEDIUM}
                  type={TEN}
                  style={[bottomTabStyles.tabLabel, { color: focused ? activeIcon : inactive }]}
                >
                  Future
                </AppText>
              </View>
            ),
          }}
          component={Futures}
        />
        <Tab.Screen
          name={routes.WALLET_SCREEN}
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={bottomTabStyles.tabColumn}>
                <View
                  style={[
                    bottomTabStyles.iconWrap,
                    { backgroundColor: "transparent" },
                  ]}
                >
                  <FastImage
                    source={wallet_ic}
                    style={bottomTabStyles.tabIcon}
                    resizeMode="contain"
                    tintColor={focused ? activeIcon : inactive}
                  />
                </View>
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
    justifyContent: "center",
    minHeight: 50,
  },
  iconWrap: {
    width: 42,
    height: 28,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 0,
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
    marginTop: 1,
  },
});

const customTabBarStyles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === "ios" ? 68 : 56,
    backgroundColor: "transparent",
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
  },
  itemWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  item: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  icon: {
    width: 22,
    height: 22,
  },
  label: {
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
