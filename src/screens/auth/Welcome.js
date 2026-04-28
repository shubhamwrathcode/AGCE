import React, { useState } from "react";
import {
  AppSafeAreaView,
  AppText,
  BOLD,
  Button,
  DESC,
  FOURTEEN,
  SECOND,
  THIRTY_FOUR,
  YELLOW,
  NORMAL,
  BLACK,
  FIFTEEN,
  SEMI_BOLD,
} from "../../shared";
import Carousel from "react-native-reanimated-carousel";
import {
  banner1,
  HOME_BG,
  introImage1,
  introImage2,
  introImage3,
  introImageBlack1,
  introImageBlack2,
  introImageBlack3,
  Logo,
} from "../../helper/ImageAssets";
import {
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { authStyles } from "./authStyles";
import FastImage from "react-native-fast-image";
import NavigationService from "../../navigation/NavigationService";
import { LOGIN_SCREEN, REGISTER_SCREEN } from "../../navigation/routes";
import KeyBoardAware from "../../shared/components/KeyboardAware";
import { useAppSelector } from "../../store/hooks";
import { checkValue } from "../../helper/utility";
import { Screen, universalPaddingHorizontalHigh } from "../../theme/dimens";
import CustomDots from "../home/CustomDots";
import { colors } from "../../theme/colors";
import { useTheme } from "../../hooks/useTheme";

const baseOptions = {
  vertical: false,
  width: Screen.Width - 35,
  height: 300,
};

const Welcome = () => {
  const { colors: themeColors, isDark } = useTheme();

  const theme = useAppSelector((state) => state.auth.theme);
  const [activeIndex, setActiveIndex] = useState(0);
  const bannerList = [
    {
      index: 0,
      banner_path: theme == "Dark" ?  introImage1:introImageBlack1,
      desc: "Exciting Welcome Rewards Waiting for You!",
      style: { height: "81%", width: "100%" },
    },
    {
      index: 1,
      banner_path: theme == "Dark" ?  introImage2:introImageBlack2,
      desc: "Fast, secure, and reliable crypto trading platform supporting spot and futures markets.",
      style: { height: "78%", width: "100%" },
    },
    {
      index: 2,
      banner_path: theme == "Dark" ?  introImage3 : introImageBlack3,
      desc: "The exchange where futures, security, speed, and opportunity meet for everyone.",
      style: { height: "75%", width: "100%" },
    },
  ];

  const renderItem = ({ item, index }) => {
    // const imageUrl = `${BASE_URL}${item?.banner_path}`;
    const imageUrl = `${item?.banner_path}`;
    return (
      <View style={{ alignItems: "center", marginHorizontal: 15 }}>
        <ImageBackground
          style={item?.style}
          resizeMode={"contain"}
          source={imageUrl}
          key={index?.toString()}
          imageStyle={{ borderRadius: 20 }}
        />
        <AppText
          style={{ textAlign: "center", color: themeColors.text }}
          type={FIFTEEN}
          weight={SEMI_BOLD}
        >
          {item?.desc}
        </AppText>
      </View>
    );
  };

  const onLogin = () => {
    NavigationService.navigate(LOGIN_SCREEN);
  };

  const onRegister = () => {
    NavigationService.navigate(REGISTER_SCREEN);
  };

  return (
    <AppSafeAreaView style={{ backgroundColor: themeColors.background }}>
      <KeyBoardAware>
        <View
          style={[
            authStyles.welcomeSecondContainer,
            { justifyContent: "space-around" },
          ]}
        >
          <View
            style={{
              width: "100%",
              alignItems: "center",
            }}
          >
            <Carousel
              {...baseOptions}
              data={bannerList}
              renderItem={renderItem}
              onSnapToItem={(index) => setActiveIndex(index)}
              autoPlay={true}
              pagingEnabled={true}
              autoPlayInterval={2500}
            />
            <View style={styles.dotContainer}>
              {bannerList?.map((data, index) => {
                return (
                  <CustomDots
                    key={index}
                    index={index}
                    activeIndex={activeIndex}
                    activeColor={themeColors.button}
                    inactiveColor={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)"}
                  />
                );
              })}
            </View>
          </View>

          <View style={{ alignItems: "center", width: "100%", gap: 15 }}>
            <Button
              children="Create an Account"
              containerStyle={{ width: "80%", backgroundColor: themeColors.button }}
              onPress={onRegister}
              titleStyle={{ color: themeColors.buttonText }}
            />
            <TouchableOpacity onPress={onLogin}>
              <AppText weight={SEMI_BOLD} type={FIFTEEN} style={{ color: themeColors.text }}>
                Log in
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </KeyBoardAware>
    </AppSafeAreaView>
  );
};

export default Welcome;

const styles = StyleSheet.create({
  dotContainer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    // marginVertical: 10,
  },
  bannerContainer: {
    height: "81%",
    width: "100%",
  },
  container: {
    paddingHorizontal: universalPaddingHorizontalHigh,
  },
});
