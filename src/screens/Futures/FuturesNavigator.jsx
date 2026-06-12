import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';

import { useTheme } from '../../hooks/useTheme';
import { BOLD, MEDIUM, SEMI_BOLD } from '../../theme/typography';
import { back_ic } from '../../helper/ImageAssets';

import FuturesTrade from './FuturesTrade';
import TradFiTrade from './TradFiTrade';
import OptionsTrade from './OptionsTrade/OptionsTrade';
import { AppText } from '../../common';

const Tab = createMaterialTopTabNavigator();
const { width } = Dimensions.get('window');

const CustomTabBar = ({ state, descriptors, navigation, position, themeColors, isDark }) => {
  return (
    <View style={[styles.tabBarContainer, { backgroundColor: themeColors.background }]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <FastImage
          source={back_ic}
          style={styles.backIcon}
          tintColor={themeColors.text}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <View style={styles.tabsWrapper}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
                ? options.title
                : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate({ name: route.name, merge: true });
            }
          };

          return (
            <TouchableOpacity
              key={index}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              style={styles.tabItem}
            >
              <AppText
                weight={isFocused ? BOLD : MEDIUM}
                style={{
                  color: isFocused ? themeColors.text : themeColors.secondaryText,
                  fontSize: 16,
                  textAlign: 'center',
                }}
              >
                {label}
              </AppText>
              {isFocused && (
                <View style={[styles.activeIndicator, { backgroundColor: themeColors.text }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const FuturesNavigator = () => {
  const { colors: themeColors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: themeColors.background, paddingTop: insets.top }}>
      <Tab.Navigator
        tabBar={props => <CustomTabBar {...props} themeColors={themeColors} isDark={isDark} />}
        screenOptions={{
          swipeEnabled: false,
        }}
      >
        <Tab.Screen name="Futures" component={FuturesTrade} />
        <Tab.Screen name="TradFi" component={TradFiTrade} />
        <Tab.Screen name="Options" component={OptionsTrade} />
      </Tab.Navigator>
    </View>
  );
};

export default FuturesNavigator;

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    marginRight: 16,
  },
  backIcon: {
    width: 20,
    height: 20,
  },
  tabsWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  tabItem: {
    position: 'relative',
    paddingVertical: 4,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -6,
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 2,
  },
});
