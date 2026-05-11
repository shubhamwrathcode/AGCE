import React, { useEffect } from "react";
import { Linking, StatusBar } from "react-native";
import SplashScreen from "react-native-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { onAppStart } from "./helper/utility";
import store from "./store/store";
import { Provider } from "react-redux";
import Navigator from "./navigation/Navigator";
import { SocketProvider } from "./SocketProvider";
import { ChartProvider } from "./ChartProvider";
import FutureSocketContextProvider from "./screens/Futures/FutureSocket";
import { OptionsContextProvider } from "./screens/Options/OptionsContext";
import { useTheme } from "./hooks/useTheme";
import { getUserProfile } from "./actions/accountActions";
import NavigationService from "./navigation/NavigationService";
import { KYC_STATUS_SCREEN } from "./navigation/routes";
import { CHART_WEB_BASE_URL } from "./helper/Constants";

/** `returnUrl` from `createKycSession` is `agce://kyc_return`. Also accept web success path if OS delivers it via universal links. */
function isKycFlowReturnUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  const lower = trimmed.toLowerCase();
  if (lower.startsWith("agce://")) {
    const path = lower.replace(/^[^:]+:\/\/?/i, "").split("?")[0];
    return (
      path === "kyc_return" ||
      path.startsWith("kyc_return/") ||
      path.includes("kyc_return") ||
      path.includes("kyc-return")
    );
  }
  try {
    const u = new URL(trimmed);
    const host = u.hostname.toLowerCase();
    const path = u.pathname.toLowerCase();
    const chartHost = CHART_WEB_BASE_URL.replace(/^https?:\/\//i, "").replace(/\/$/, "").toLowerCase();
    if (host === chartHost || host.endsWith(".wrathcode.com")) {
      if (path.includes("kyc/submitted") || path.includes("kyc_return") || path.includes("kyc-return")) {
        return true;
      }
    }
  } catch {
    /* ignore */
  }
  return false;
}

/** Didit / third-party KYC completes with redirect to `returnUrl` from createKycSession (`agce://kyc_return`). */
async function handleAgceKycReturnUrl(url: string | null | undefined) {
  if (!isKycFlowReturnUrl(url)) return;
  try {
    await store.dispatch(getUserProfile(false, false, true) as any);
  } catch {
    /* ignore */
  }
  const go = () => {
    try {
      NavigationService.navigate(KYC_STATUS_SCREEN, { fromDidit: true });
    } catch {
      /* navigator not ready */
    }
  };
  go();
  setTimeout(go, 600);
}

const MainApp = () => {
  const { colors: themeColors, isDark } = useTheme();

  useEffect(() => {
    onAppStart(store);
    SplashScreen.hide();
  }, []);

  useEffect(() => {
    const sub = Linking.addEventListener("url", ({ url }) => {
      if (__DEV__) console.log("[KYC] deep link url:", url);
      void handleAgceKycReturnUrl(url);
    });
    void Linking.getInitialURL().then((url) => {
      void handleAgceKycReturnUrl(url);
    });
    return () => sub.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar
        backgroundColor={themeColors.background}
        barStyle={isDark ? "light-content" : "dark-content"}
        translucent={false}
      />
      <SocketProvider>
        <FutureSocketContextProvider>
          <OptionsContextProvider>
            <ChartProvider>
              <Navigator />
            </ChartProvider>
          </OptionsContextProvider>
        </FutureSocketContextProvider>
      </SocketProvider>
    </SafeAreaProvider>
  );
};

function App(): JSX.Element {
  return (
    <Provider store={store}>
      <MainApp />
    </Provider>
  );
}

export default App;
