import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import Carousel from "react-native-reanimated-carousel";
// import CustomDots from "./CustomDots";
import { useAppSelector } from "../../store/hooks";
import { Screen } from "../../theme/dimens";
import {
  BACK_ICON,
  connectwallet,
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
import { AppText, ELEVEN, FIFTEEN, FOURTEEN, MEDIUM, SEMI_BOLD, TEN, THIRTEEN, TWELVE } from "../../shared";
import { colors, lightTheme } from "../../theme/colors";
import NavigationService from "../../navigation/NavigationService";
import {
  DEPOSIT_COIN_SCREEN,
  KYC_STEP_ONE_SCREEN,
  WALLET_SCREEN,
} from "../../navigation/routes";
import { useTheme } from "../../hooks/useTheme";

const baseOptions = {
  vertical: false,
  width: Screen.Width - 32,
  height: 110,
};

const HomeSlider = () => {
  const { colors: themeColors, theme } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselRef = useRef(null);
  const userData = useAppSelector((state) => state.auth.userData);
  const kycVerified = userData?.kycVerified != null ? Number(userData.kycVerified) : 0;

  const bannerList = useMemo(() => {
    const banners = [
      {
        index: 0,
        banner_path: connectwallet,
        title: `Complete your KYC verification to unlock all account features and ensure a seamless trading experience.`,
        onPress: () => NavigationService.navigate(KYC_STEP_ONE_SCREEN),
        isKyc: true,
      },
      {
        index: 1,
        banner_path: connectwallet,
        title: `Start trading directly—buy and sell with full market access, real-time prices, and a smooth trading experience.`,
        onPress: () => NavigationService.navigate(WALLET_SCREEN),
      },
      {
        index: 2,
        banner_path: connectwallet,
        title: `Add funds to your wallet quickly and securely to begin trading without any delays.`,
        onPress: () => NavigationService.navigate(DEPOSIT_COIN_SCREEN),
      },
      {
        index: 3,
        banner_path: connectwallet,
        title: `Have a question or need help? Get quick assistance from our support team for any queries or concerns.`,
        onPress: () => NavigationService.navigate("Support"),
      },
    ];
    return banners
      .filter((banner) => {
        if (banner.isKyc) {
          return kycVerified === 0 || kycVerified === 3;
        }
        return true;
      })
      .slice(0, 3);
  }, [kycVerified]);

  const slideCount = bannerList.length;

  useEffect(() => {
    if (slideCount <= 1) return undefined;
    const ms = 3000;
    const id = setInterval(() => {
      try {
        carouselRef.current?.next?.({ animated: true });
      } catch {
        /* ignore */
      }
    }, ms);
    return () => clearInterval(id);
  }, [slideCount]);

  const renderItem = ({ item }) => {
    return (
      <View style={{ flex: 1, paddingRight: 10 }}>
        <TouchableOpacity
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 12,
            overflow: "hidden",
            position: "relative",
          }}
          onPress={item?.onPress}
          activeOpacity={0.9}
        >
          <FastImage
            source={item?.banner_path}
            style={{
              width: 80,
              height: 80,
            }}
            resizeMode="contain"
          />
         
         <View style={{ flex: 1, paddingHorizontal: 10, minWidth: 0 }}>
           <AppText type={ELEVEN} style={{ color: colors.lightGrey }} numberOfLines={1}>
             Events
           </AppText>
           <AppText weight={SEMI_BOLD} type={TWELVE} numberOfLines={2} style={{ flexShrink: 1 }}>
             Connect Wallet & Unlock Crypto Trading.
           </AppText>
           <AppText type={TEN} numberOfLines={1}>
             Explore now →
           </AppText>


         </View>

         <View
           style={{
             position: "absolute",
             right: 12,
             bottom: 10,
             minWidth: 40,
             borderRadius: 5,
             backgroundColor: "#E5E7EB",
             paddingVertical: 2,
             paddingHorizontal: 5,
             alignItems: "center",
             flexShrink: 0,
           }}
         >
           {(() => {
             const total = slideCount || 1;
             const current = Math.min(activeIndex + 1, total);
             const totalColor = current === total ? "#000" : "#9CA3AF";
             return (
               <Text numberOfLines={1}>
                 <Text style={{fontSize:11, color: "#000", fontWeight: "600" }}>{current}</Text>
                 <Text style={{fontSize:11, color: totalColor, fontWeight: "600" }}>{`/${total}`}</Text>
               </Text>
             );
           })()}
         </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <>
      <View
        style={{
          width: Screen.Width - 32,
          alignSelf: "center",
          marginBottom: 5,
          height: 110,
          backgroundColor: lightTheme.input,
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            width: "100%",
            alignSelf: "center",
            justifyContent: "center",
          }}
        >
          <Carousel
            ref={carouselRef}
            {...baseOptions}
            data={bannerList}
            renderItem={renderItem}
            onSnapToItem={(index) => setActiveIndex(index)}
            loop={slideCount > 1}
            enabled
            pagingEnabled
            autoPlay={false}
            scrollAnimationDuration={600}
          />
        </View>
      </View>
      {/* Dots hidden — use corner counter on slide instead
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
      */}
    </>
  );
};

const styles = StyleSheet.create({
  // dotContainer: {
  //   alignItems: "center",
  //   flexDirection: "row",
  //   justifyContent: "center",
  //   marginBottom: 10,
  // },
});

export default HomeSlider;
