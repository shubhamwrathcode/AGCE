/* eslint-disable react-native/no-inline-styles */
import React, {ReactNode} from 'react';
import {
  ImageBackground,
  Platform,
  ScrollView,
  StatusBar,
  View,
  ViewStyle,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {appBg, HomeBg} from '../helper/ImageAssets';
import {commonStyles} from '../theme/commonStyles';
import { colors } from '../theme/colors';

import { useTheme } from '../hooks/useTheme';

/** Status bar strip when using a light splash image (dark bar + light icons). */
const SPLASH_STATUS_BAR_BG = '#0A0A0A';
const SPLASH_BODY_BG = '#FFFFFF';

interface AppSafeAreaViewProps {
  children: ReactNode;
  style?: ViewStyle;
  source?: any;
  backgroundColor?: any;
  isfrom?: any;
  /** Light splash: dark status bar area; rest of screen stays light (image + body). */
  darkStatusBarOnLightSplash?: boolean;
}

const AppSafeAreaView = ({
  children,
  style,
  source,
  backgroundColor,
  isfrom,
  darkStatusBarOnLightSplash,
}: AppSafeAreaViewProps) => {
  const { colors: themeColors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const splashLight = Boolean(darkStatusBarOnLightSplash && source);
  const shellBg = splashLight ? SPLASH_BODY_BG : themeColors.background;
  const barStyle = splashLight ? 'light-content' : isDark ? 'light-content' : 'dark-content';
  const androidStatusBg = splashLight ? SPLASH_STATUS_BAR_BG : themeColors.background;

  const splashTopOverlay =
    splashLight && Platform.OS === 'ios' ? (
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: insets.top,
          backgroundColor: SPLASH_STATUS_BAR_BG,
          zIndex: 2,
        }}
      />
    ) : null;

  return Platform.OS === 'ios' ? (
    <SafeAreaView
      edges={['right', 'left']}
      style={[
        {
          flex: 1,
          backgroundColor: shellBg,
        },
        style,
      ]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={barStyle}
      />
      {source ? (
        <ImageBackground
          source={source}
          style={commonStyles.screenSize}
          resizeMode="cover">
          {splashTopOverlay}
          {children}
        </ImageBackground>
      ) : (
        children
      )}
    </SafeAreaView>
  ) : (
    <View style={[{flex: 1, backgroundColor: shellBg}, style]}>
      <StatusBar
        translucent={false}
        backgroundColor={androidStatusBg}
        barStyle={barStyle}
      />
      {source ? (
        <ImageBackground
          source={source}
          style={commonStyles.screenSize}
          resizeMode="cover">
          {children}
        </ImageBackground>
      ) : (
        children
      )}
    </View>
  );
};
export {AppSafeAreaView};
