import React, { useEffect, useState } from "react";
import {
  AppSafeAreaView,
  AppText,
  BLACK,
  BOLD,
  Button,
  DISCLAIMTEXT,
  EIGHTEEN,
  ELEVEN,
  FOURTEEN,
  MEDIUM,
  NORMAL,
  SEMI_BOLD,
  TEN,
  TWELVE,
  YELLOW,
} from "../../shared";
import KeyBoardAware from "../../shared/components/KeyboardAware";
import { StyleSheet, View } from "react-native";
import { authStyles } from "./authStyles";
import { showError } from "../../helper/logger";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { sendOtp, verifyOtp } from "../../actions/authActions";
import { registerVerifyToken } from "../../actions/accountActions";
import { back_ic, SECURITY_SHEIELD } from "../../helper/ImageAssets";
import NavigationService from "../../navigation/NavigationService";
import { LOGIN_SCREEN, NAVIGATION_AUTH_STACK } from "../../navigation/routes";
import FastImage from "react-native-fast-image";
import OtpInput6Digit from "../../shared/components/OtpInput6Digit";
import TouchableOpacityView from "../../shared/components/TouchableOpacityView";
import { SpinnerSecond } from "../../shared/components/SpinnerSecond";
import { colors } from "../../theme/colors";

import { useTheme } from "../../hooks/useTheme";

const VerifyAccount = () => {
  const dispatch = useAppDispatch();
  const { colors: themeColors, isDark } = useTheme();
  const isLoading = useAppSelector((state) => state.auth.isLoading);
  const showButtonLoading = useAppSelector((state) => state.auth.isLoading && state.auth.loadingFor === 'otp');

  const [otp, setOtp] = useState("");
  const [disableBtn, setDisbaleBtn] = useState(false);
  const [timer, setTimer] = useState(0);
  const [userData, setUserData] = useState({ signId: "", registeredBy: "" });

  useEffect(() => {
    dispatch(registerVerifyToken(setUserData));
  }, [dispatch]);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else if (timer === 0) {
      setDisbaleBtn(false);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerifyOtp = () => {
    const raw = otp||'';
    const codeStr = String(raw ?? "").replace(/\D/g, "").slice(0, 6);
    const verificationCode = parseInt(codeStr, 10);

    if (codeStr.length !== 6) return;

    const data = {
      signId: userData?.signId,
      verification_code: verificationCode,
      registeredBy: userData?.registeredBy,
      token: "",
    };
    dispatch(verifyOtp(data, setOtp));
  };

  const onGetOtp = () => {
    if (!userData?.signId) return;
    const data = {
      signId: userData.signId,
      registeredBy: userData?.registeredBy,
    };
    dispatch(sendOtp(data, setDisbaleBtn, setTimer));
  };

  return (
    <AppSafeAreaView style={{ backgroundColor: themeColors.background }}>
      <KeyBoardAware style={{ paddingHorizontal: 20 }}>
        <View style={{ marginVertical: 20 }}>
          <TouchableOpacityView onPress={() => NavigationService.goBack()}>
            <FastImage
              source={back_ic}
              resizeMode="contain"
              style={{ width: 15, height: 15 }}
              tintColor={themeColors.text}
            />
          </TouchableOpacityView>
        </View>

        <View
          style={[
            isDark ? authStyles.cardDark : authStyles.card,
            { backgroundColor: themeColors.card, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: themeColors.border }
          ]}
        >
          <FastImage
            source={SECURITY_SHEIELD}
            resizeMode="contain"
            style={styles.securityShield}
          />
          <AppText
            color={themeColors.text}
            type={EIGHTEEN}
            weight={SEMI_BOLD}
          >
            Verify Your Account
          </AppText>
          <AppText
            color={themeColors.secondaryText}
            type={ELEVEN}
            weight={MEDIUM}
            style={{ marginTop: 8 }}
          >
            Make your account 100% secure against unauthorized logins.
          </AppText>
          <AppText
            color={themeColors.secondaryText}
            type={ELEVEN}
            weight={MEDIUM}
            style={{ marginTop: 16 }}
          >
            Registered {userData?.registeredBy === "email" ? "email" : "mobile"}: <AppText type={ELEVEN} color={themeColors.button} weight={NORMAL} style={{ marginTop: 4 }}>
            {userData?.signId || "---"}
          </AppText>
          </AppText>
          
          <AppText
            type={TWELVE}
            weight={MEDIUM}
            style={{ marginTop: 16, color: themeColors.text }}
          >
            {userData?.registeredBy === "email" ? "Email" : "Mobile"} Verification Code
          </AppText>

          <OtpInput6Digit
            value={otp}
            onChangeText={setOtp}
            isDark={isDark}
            containerStyle={{ marginTop: 8 }}
          />

          <View style={{ marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "flex-end" }}>
            {!disableBtn ? (
              <TouchableOpacityView onPress={onGetOtp}>
                <AppText color={themeColors.button} weight={SEMI_BOLD}>
                  Get OTP
                </AppText>
              </TouchableOpacityView>
            ) : (
              <AppText color={themeColors.secondaryText}>Resend OTP in {timer}s</AppText>
            )}
          </View>
          <Button
            children={"Verify Account"}
            disabled={!(otp?.toString()?.length === 6)}
            onPress={handleVerifyOtp}
            loading={showButtonLoading}
            containerStyle={{ marginTop: 20, width: "100%", backgroundColor: themeColors.button }}
          />

          <View style={{ alignSelf: "center", marginTop: 24 }}>
            <AppText color={themeColors.secondaryText} type={TEN}>
              Already have an account?{" "}
              <AppText
                color={themeColors.button}
                type={TEN}
                weight={BOLD}
                onPress={() => NavigationService.navigate(NAVIGATION_AUTH_STACK, { screen: LOGIN_SCREEN })}
              >
                Login
              </AppText>
            </AppText>
          </View>
        </View>
      </KeyBoardAware>

      <SpinnerSecond />
    </AppSafeAreaView>
  );
};

export default VerifyAccount;

const styles = StyleSheet.create({
  securityShield: {
    width: 150,
    height: 150,
    marginTop: 8,
    alignSelf: "center",
  },
});
