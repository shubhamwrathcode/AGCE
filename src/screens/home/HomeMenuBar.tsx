import React from "react";
import { Dimensions, ScrollView, StyleSheet, View } from "react-native";
import FastImage from "react-native-fast-image";
import TouchableOpacityView from "../../shared/components/TouchableOpacityView";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { AppText, ELEVEN, TEN } from "../../shared";
import { useTheme } from "../../hooks/useTheme";
const Width = Dimensions.get("window").width;
import Toast from "react-native-simple-toast";
import {
  moreOption,
  newHubIcon,
  swap,
  margin,
  wallet_ic,
  spotIcon,
  earningAsset1,
} from "../../helper/ImageAssets";
import NavigationService from "../../navigation/NavigationService";
import { MORE_MENU_SCREEN, TRADE_SCREEN, WALLET_SCREEN } from "../../navigation/routes";
import { useAppSelector } from "../../store/hooks";
import { checkValue } from "../../helper/utility";
import { colors } from "../../theme/colors";

const showComingSoonToast = () =>
  Toast.showWithGravity("Coming soon", Toast.SHORT, Toast.BOTTOM);

/** Grey tile behind each menu icon (square behind icon only). */
const ICON_TILE_GREY_LIGHT = "#EAEDF0";
const ICON_TILE_GREY_DARK = "#EAEDF0";

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
              backgroundColor: colors.iconBgColor,
              borderRadius: 20,
            },
          ]}
        >
          <FastImage
            resizeMode="contain"
            source={item.icon}
            tintColor={item?.id === "6" ? themeColors.text : item?.id === "7" ? "#000" : undefined}
            style={item?.id === "6" ? styles.iconMore : styles.icon}
          />
        </View>
        <AppText style={{ color: themeColors.text }} type={TEN}>
          {item?.title}
        </AppText>
      </TouchableOpacityView>
    </Animated.View>
  );
});

const HomeMenuBar = () => {
  const languages = useAppSelector((state) => {
    return state.account.languages;
  });
  const Data = [
    {
      id: "1",
      title: checkValue(languages?.spot),
      icon: spotIcon,
      onPress: () => NavigationService.navigate(TRADE_SCREEN),
    },
    {
      id: "2",
      title: "Margin",
      icon: margin,
      onPress: showComingSoonToast,
    },
    {
      id: "3",
      title: "Wallet",
      icon: wallet_ic,
      onPress: () => NavigationService.navigate(WALLET_SCREEN),
    },
    {
      id: "4",
      title: checkValue("Swap"),
      icon: swap,
      onPress: showComingSoonToast,
    },
    {
      id: "5",
      title: "Earning",
      icon: earningAsset1,
      onPress: showComingSoonToast,
    },
    // {
    //   id: "7",
    //   title: "Referral",
    //   icon: newHubIcon,
    //   onPress: showComingSoonToast,
    // },
    // {
    //   id: "6",
    //   title: checkValue(languages?.more),
    //   icon: moreOption,
    //   onPress: () => NavigationService.navigate(MORE_MENU_SCREEN),
    // },

  ];

  const renderItem = ({ item, index }: any) => {
    return <MenuItem item={item} index={index} />;
  };

  return (
    <View style={styles.menuBarBackground}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {Data?.map((item, index) => (
          <React.Fragment key={item.id}>{renderItem({ item, index })}</React.Fragment>
        ))}
      </ScrollView>
    </View>
  );
};


const styles = StyleSheet.create({
  menuBarBackground: {
    width: "100%",
    borderRadius: 8,
    paddingTop: 8,
    paddingBottom: 4,
    marginBottom: 0,
  },
  container: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
  },
  scrollContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  icon: {
    height: 20,
    width: 20,
  },
  iconMore: {
    height: 20,
    width: 20,
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
    width: (Width - 40) / 4.6,

  },
  itemSeparator: {
    width: 8,
  },
});
export default HomeMenuBar;
