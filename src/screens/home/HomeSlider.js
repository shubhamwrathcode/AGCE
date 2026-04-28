import React, { useState } from "react";
import {
  View,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import Carousel from "react-native-reanimated-carousel";
import CustomDots from "./CustomDots";
import { useAppSelector } from "../../store/hooks";
import { Screen } from "../../theme/dimens";
import {
  BACK_ICON,
  homeImage1,
  homeImage1Dark,
  homeImage2,
  homeImage2Dark,
  homeImage3,
  homeImage3Dark,
  homeImage4,
  homeImage4Dark,
} from "../../helper/ImageAssets";
import FastImage from "react-native-fast-image";
import { AppText, TWELVE } from "../../shared";
import { colors } from "../../theme/colors";
import NavigationService from "../../navigation/NavigationService";
import {
  DEPOSIT_COIN_SCREEN,
  KYC_STEP_ONE_SCREEN,
  WALLET_SCREEN,
} from "../../navigation/routes";
import { useTheme } from "../../hooks/useTheme";

const baseOptions = {
  vertical: false,
  width: Screen.Width,
  height: 110,
};

const HomeSlider = () => {
  const { colors: themeColors, theme } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const userData = useAppSelector((state) => state.auth.userData);
  const kycVerified = userData?.kycVerified != null ? Number(userData.kycVerified) : 0;

  const banners = [
    {
      index: 0,
      banner_path: theme == "Dark" ? homeImage1 : homeImage1Dark,
      title: `Complete your KYC verification to unlock all account features and ensure a seamless trading experience.`,
      onPress: () => NavigationService.navigate(KYC_STEP_ONE_SCREEN),
      isKyc: true,
    },
    {
      index: 1,
      banner_path: theme == "Dark" ? homeImage2 : homeImage2Dark,
      title: `Start trading directly—buy and sell with full market access, real-time prices, and a smooth trading experience.`,
      onPress: () => NavigationService.navigate(WALLET_SCREEN),
    },
    {
      index: 2,
      banner_path: theme == "Dark" ? homeImage3 : homeImage3Dark,
      title: `Add funds to your wallet quickly and securely to begin trading without any delays.`,
      onPress: () => NavigationService.navigate(DEPOSIT_COIN_SCREEN),
    },
    {
      index: 3,
      banner_path: theme == "Dark" ? homeImage4 : homeImage4Dark,
      title: `Have a question or need help? Get quick assistance from our support team for any queries or concerns.`,
      onPress: () => NavigationService.navigate('Support'),
    },
  ];

  const bannerList = banners.filter((banner) => {
    if (banner.isKyc) {
      return kycVerified === 0 || kycVerified === 3;
    }
    return true;
  });

  const renderItem = ({ item }) => {
    return (
      <View style={{ flex: 1 }}>
        <TouchableOpacity
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-around",
          }}
          onPress={item?.onPress}
          activeOpacity={0.9}
        >
          <FastImage
            source={item?.banner_path}
            style={{
              width: item?.isKyc ? 80 : 70,
              height: item?.isKyc ? 80 : 70,
            }}
            resizeMode="contain"
          />
          <AppText style={{ width: "50%", right: 20, color: themeColors.text }} type={TWELVE}>
            {item?.title}
          </AppText>
          <FastImage
            source={BACK_ICON}
            style={{
              width: 16,
              height: 16,
              transform: [{ rotateX: "45deg" }, { rotateZ: "3.1rad" }],
            }}
            resizeMode="contain"
            tintColor={themeColors.text}
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <>
      <View
        style={{
          flex: 1,
          borderTopWidth: 0.5,
          borderTopColor: themeColors.border,
          borderBottomWidth: 1,
          borderBottomColor: themeColors.border,
          marginBottom: 5,
          height: 110,
        }}
      >
        <View
          style={{
            width: "100%",
            alignSelf: "center",
            justifyContent: "center",
            marginHorizontal: 20,
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
        </View>
      </View>
      <View style={styles.dotContainer}>
        {bannerList?.map((data, index) => {
          return (
            <CustomDots
              key={index}
              index={index}
              activeIndex={activeIndex}
            />
          );
        })}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  dotContainer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
  },
});

export default HomeSlider;
