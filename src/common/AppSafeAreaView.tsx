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
import {SafeAreaView} from 'react-native-safe-area-context';
import {appBg, HomeBg} from '../helper/ImageAssets';
import {commonStyles} from '../theme/commonStyles';
import { colors } from '../theme/colors';

import { useTheme } from '../hooks/useTheme';

interface AppSafeAreaViewProps {
  children: ReactNode;
  style?: ViewStyle;
  source?: any;
  backgroundColor?: any;
  isfrom?: any;
}

const AppSafeAreaView = ({children, style, source, backgroundColor, isfrom}: AppSafeAreaViewProps) => {
  const { colors: themeColors, isDark } = useTheme();
  
  return Platform.OS === 'ios' ? (
    <SafeAreaView
      edges={['right', 'left']}
      style={[
        {
          flex: 1,
          backgroundColor: themeColors.background,
        },
        style,
      ]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDark ? "light-content" : "dark-content"}
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
    </SafeAreaView>
  ) : (
    <View style={[{flex: 1, backgroundColor: themeColors.background}, style]}>
      <StatusBar
        translucent={false}
        backgroundColor={themeColors.background}
        barStyle={isDark ? "light-content" : "dark-content"}
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
