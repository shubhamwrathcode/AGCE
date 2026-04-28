import React, { useEffect, useState } from "react";
import {
  AppSafeAreaView,
  AppText,
  BOLD,
  Button,
  FOURTEEN,
  Input,
  MEDIUM,
  SEMI_BOLD,
  TWENTY_SIX,
} from "../../shared";
import KeyBoardAware from "../../shared/components/KeyboardAware";
import { Keyboard, View } from "react-native";
import { authStyles } from "./authStyles";
import { showError } from "../../helper/logger";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { forgotOtp, forgotPassword } from "../../actions/authActions";
import { SpinnerSecond } from "../../shared/components/SpinnerSecond";
import {
  back_ic,
} from "../../helper/ImageAssets";
import {
  checkValue,
  validateEmail,
  validatePassword,
} from "../../helper/utility";
import FastImage from "react-native-fast-image";
import NavigationService from "../../navigation/NavigationService";
import { LOGIN_SCREEN } from "../../navigation/routes";
import TouchableOpacityView from "../../shared/components/TouchableOpacityView";
import { CountrySelector } from "../../shared/components/CountrySelector";
import { isValidPhoneNumber } from "libphonenumber-js";
import { colors } from "../../theme/colors";
import { useTheme } from "../../hooks/useTheme";

const RenderTabBarAuth = (props) => {
  const { colors: themeColors, isDark } = useTheme();
  const languages = useAppSelector((state) => {
    return state.account.languages;
  });
  const routes = [
    { key: "first", title: checkValue(languages?.mobile) },
    { key: "second", title: checkValue(languages?.email) },
  ];
  return (
    <View style={authStyles.tabBarMain}>
      {routes.map((route, i) => {
        return (
          <TouchableOpacityView
            key={i}
            onPress={() => {
              props?.setIndex(i);
            }}
            style={[
              i === props?.index
                ? [authStyles.tabBarActive, { borderBottomColor: themeColors.button, borderBottomWidth: 2 }]
                : authStyles.tabBarInActive
            ]}
          >
            <AppText
              type={FOURTEEN}
              weight={SEMI_BOLD}
              style={{ color: i === props?.index ? (isDark ? colors.white : themeColors.button) : themeColors.secondaryText }}
            >
              {route.title}
            </AppText>
          </TouchableOpacityView>
        );
      })}
    </View>
  );
};

const ForgotPassword = () => {
  const dispatch = useAppDispatch();
  const { colors: themeColors, isDark } = useTheme();
  const languages = useAppSelector((state) => {
    return state.account.languages;
  });

  const [userName, setUserName] = useState("");
  const [index, setIndex] = useState(0);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(true);
  const [otpText, setOtpText] = useState(checkValue(languages?.register_nine));
  const [countryCode, setCountryCode] = useState(["91"]);
  const [country, setCountry] = useState("IN");

  useEffect(() => {
    setUserName("");
  }, [index]);

  const onGetOtp = () => {
    let data;
    if (index === 0) {
      data = {
        email_or_phone: `+${countryCode} ${userName}`,
        resend: true,
        type: "forgot",
      };
    } else {
      data = {
        email_or_phone: userName,
        resend: true,
        type: "forgot",
      };
    }

    Keyboard.dismiss();
    dispatch(forgotOtp(data, true));
  };

  const onLogin = () => {
    NavigationService.navigate(LOGIN_SCREEN);
  };

  const onSubmit = () => {
    if (index === 1) {
      if (!validateEmail(userName)) {
        showError(checkValue(languages?.error_email));
        return;
      }
    } else if (index === 0) {
      let phone = Number(userName);
      if (!isValidPhoneNumber(`+${countryCode}${phone}`)) {
        showError(checkValue(languages?.error_userName));
        return;
      }
    }
    if (!validatePassword(password)) {
      showError(checkValue(languages?.error_passwordRegex));
      return;
    }
    let data;
    if (index === 0) {
      data = {
        email_or_phone: `+${countryCode} ${userName}`,
        new_password: password,
        verification_code: +otp,
      };
    } else {
      data = {
        email_or_phone: userName,
        new_password: password,
        verification_code: +otp,
      };
    }
    dispatch(forgotPassword(data));
  };

  return (
    <AppSafeAreaView style={{ backgroundColor: themeColors.background }}>
      <View style={{ marginVertical: 20, marginHorizontal: 20 }}>
        <TouchableOpacityView
          onPress={() => NavigationService.navigate(LOGIN_SCREEN)}
        >
          <FastImage
            source={back_ic}
            resizeMode="contain"
            style={{ width: 15, height: 15 }}
            tintColor={themeColors.text}
          />
        </TouchableOpacityView>
      </View>
      <KeyBoardAware>
        <AppText
          weight={BOLD}
          type={TWENTY_SIX}
          style={{ marginHorizontal: 20, color: themeColors.text }}
        >
          Forgot Password
        </AppText>
        <View style={authStyles.forgotContainer}>
          <View style={[authStyles.card, { marginTop: "10%" }]}>
            <RenderTabBarAuth index={index} setIndex={setIndex} />
            <View style={authStyles.mobileContainer}>
              {index === 0 && (
                <CountrySelector
                  onSelectCountry={setCountryCode}
                  onCountry={setCountry}
                  country={country}
                />
              )}
              <Input
                placeholder={
                  index === 0
                    ? checkValue(languages?.place_userName)
                    : checkValue(languages?.place_email)
                }
                value={userName}
                onChangeText={(text) => setUserName(text)}
                keyboardType={index === 0 ? "numeric" : "email-address"}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={() => onGetOtp()}
                mainContainer={authStyles.mobileInput}
                isOtp
                onSendOtp={() => onGetOtp(userName)}
                otpText={otpText}
              />
            </View>
            <Input
              placeholder={checkValue(languages?.place_otp)}
              value={otp}
              onChangeText={(text) => setOtp(text)}
              keyboardType="numeric"
              autoCapitalize="none"
              returnKeyType="next"
            />
            <Input
              placeholder={checkValue(languages?.place_signUpPassword)}
              value={password}
              onChangeText={(text) => setPassword(text)}
              autoCapitalize="none"
              secureTextEntry={isPasswordVisible}
              returnKeyType="next"
              isSecure
              onPressVisible={() => setIsPasswordVisible(!isPasswordVisible)}
            />

            <Button
              children={"Forgot Password"}
              onPress={() => onSubmit()}
              disabled={!otp || !userName || !password}
              containerStyle={authStyles.marginTop}
            />
            <AppText
              weight={MEDIUM}
              style={[authStyles.bottomTextLogin, { color: themeColors.text }]}
            >
              {"Back to  "}
              <AppText
                weight={SEMI_BOLD}
                style={[authStyles.termsText, { color: colors.buttonBg }]}
                onPress={() => onLogin()}
              >
                {checkValue(languages?.register_eight)}
              </AppText>
            </AppText>
          </View>
        </View>
      </KeyBoardAware>
      <SpinnerSecond />
    </AppSafeAreaView>
  );
};

export default ForgotPassword;
