import React, { useEffect } from "react";
import { StatusBar } from "react-native";
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
import { colors } from "./theme/colors";
import { useTheme } from "./hooks/useTheme";

const MainApp = () => {
  const { colors: themeColors, isDark } = useTheme();

  useEffect(() => {
    onAppStart(store);
    SplashScreen.hide();
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
