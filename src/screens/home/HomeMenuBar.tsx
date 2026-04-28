import React from "react";
import { Dimensions, FlatList, StyleSheet, View } from "react-native";
import FastImage from "react-native-fast-image";
import TouchableOpacityView from "../../shared/components/TouchableOpacityView";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { AppText, ELEVEN } from "../../shared";
import { useTheme } from "../../hooks/useTheme";
const Width = Dimensions.get("window").width;
import {
  memeXProfile,
  memeXProfileDark,
  giftIc,
  moreOption,
  newHubIcon,
  newHubIconLight,
  swap,
  swapLight,
  airdropLight,
  airdropDark,
} from "../../helper/ImageAssets";
import NavigationService from "../../navigation/NavigationService";
import {
  ACCOUNT_SCREEN,
  AIRDROP_SCREEN,
  CONVERT_SCREEN,
  INVITE_AND_EARN_SCREEN,
  MARKET_SCREEN,
  MORE_MENU_SCREEN,
} from "../../navigation/routes";
import { useAppSelector } from "../../store/hooks";
import { checkValue } from "../../helper/utility";

// ✅ Separate component for menu item to use hooks properly
const MenuItem = React.memo(({ item, index }: any) => {
  const { colors: themeColors, isDark } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  return (
    <Animated.View
      style={animatedStyle}
    >
      <TouchableOpacityView
        onPress={item?.onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.singleItem}
        key={item?.id}
        activeOpacity={0.8}
      >
        <View
          style={[
            item?.id === "6" ? styles.iconWrapMore : styles.iconWrap,
            {
              backgroundColor: isDark
                ? themeColors.themeSelection
                : "#F6F6F6",
            },
          ]}
        >
          <FastImage
            resizeMode="contain"
            source={item.icon}
            tintColor={item?.id === "6" ? themeColors.text : undefined}
            style={item?.id === "6" ? styles.iconMore : styles.icon}
          />
        </View>
        <AppText style={{ color: themeColors.text }} type={ELEVEN}>
          {item?.title}
        </AppText>
      </TouchableOpacityView>
    </Animated.View>
  );
});

const HomeMenuBar = () => {
  const theme = useAppSelector((state) => state.auth.theme);
  const languages = useAppSelector((state) => {
    return state.account.languages;
  });
  const Data = [
    {
      id: "1",
      title: checkValue(languages?.memex),
      icon: theme == "Dark" ? memeXProfileDark : memeXProfile,
      onPress: () =>
        NavigationService.navigate(MARKET_SCREEN, {
          from: "home",
          tab: "MemeX",
        }),
    },
    {
      id: "2",
      title: "Airdrop",
      icon: theme == "Dark" ? airdropLight : airdropDark,
      onPress: () =>
        NavigationService.navigate(AIRDROP_SCREEN, { from: "home" }),
    },
    {
      id: "4",
      title: checkValue("Swap"),
      icon: theme == "Dark" ? swapLight : swap,
      onPress: () => {
        NavigationService.navigate(CONVERT_SCREEN);
      },
    },
    {
      id: "5",
      title: checkValue(languages?.reward),
      icon: theme == "Dark" ? newHubIcon : newHubIconLight,
      onPress: () => NavigationService.navigate(INVITE_AND_EARN_SCREEN),
    },
    {
      id: "6",
      title: checkValue(languages?.more),
      icon: moreOption,
      onPress: () => NavigationService.navigate(MORE_MENU_SCREEN),
    },
  ];

  const renderItem = ({ item, index }: any) => {
    return <MenuItem item={item} index={index} />;
  };

  return (
    <View style={[styles.container, { justifyContent: "space-around", paddingHorizontal: 10 }]}>
      {Data.map((item, index) => (
        <React.Fragment key={item.id}>
          {renderItem({ item, index })}
        </React.Fragment>
      ))}

    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    marginBottom: 10,
  },
  icon: {
    height: 18,
    width: 18,
  },
  iconMore: {
    height: 18,
    width: 18,
  },
  iconWrap: {
    height: 36,
    width: 36,
    borderRadius: 5,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  iconWrapMore: {
    height: 36,
    width: 36,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  singleItem: {
    alignItems: "center",
    width: (Width - 40) / 5, // Split screen width among 5 items evenly
  },
  itemSeparator: {
    width: 8,
  },
});
export default HomeMenuBar;
