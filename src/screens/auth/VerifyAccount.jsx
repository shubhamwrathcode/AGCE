import React, { useEffect, useRef, useState } from "react";
import Clipboard from "@react-native-community/clipboard";
import Ionicons from "react-native-vector-icons/Ionicons";
import { Linking, StyleSheet, View } from "react-native";
import {
  AppSafeAreaView,
  AppText,
  BOLD,
  Button,
  FOURTEEN,
  MEDIUM,
  SEMI_BOLD,
  TEN,
  THIRTEEN,
  TWENTY_SIX,
} from "../../shared";
import { AuthHeader } from "../../shared/components";
import { showError } from "../../helper/logger";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { sendOtp, verifyOtp } from "../../actions/authActions";
import { registerVerifyToken } from "../../actions/accountActions";
import NavigationService from "../../navigation/NavigationService";
import { ACCOUNT_ACTIVATED_SCREEN, LOGIN_SCREEN, NAVIGATION_AUTH_STACK } from "../../navigation/routes";
import OtpInput6Digit from "../../shared/components/OtpInput6Digit";
import TouchableOpacityView from "../../shared/components/TouchableOpacityView";
import { useTheme } from "../../hooks/useTheme";
import FastImage from "react-native-fast-image";
import { pasteImg } from "../../helper/ImageAssets";
import { SpinnerSecond } from "../../shared/components/SpinnerSecond";

const VerifyAccount = () => {
  const dispatch = useAppDispatch();
  const { colors: themeColors } = useTheme();
  const showButtonLoading = useAppSelector((state) => state.auth.isLoading && state.auth.loadingFor === 'otp');

  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState(false);
  const [disableBtn, setDisbaleBtn] = useState(false);
  const [timer, setTimer] = useState(0);
  const [attemptLeft, setAttemptLeft] = useState("");
  const [userData, setUserData] = useState({ signId: "", registeredBy: "" });
  const [resendLoading, setResendLoading] = useState(false);
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const hasAutoSent = useRef(false);
  const isNoOtpAttemptsLeft = (msg = "") =>
    String(msg).toLowerCase().includes("no otp attempt left");

  useEffect(() => {
    dispatch(registerVerifyToken(setUserData));
  }, [dispatch]);

  useEffect(() => {
    if (!userData?.signId || hasAutoSent.current) return;
    hasAutoSent.current = true;
    onGetOtp(false);
  }, [userData?.signId]);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else if (timer === 0) {
      setDisbaleBtn(false);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerifyOtp = async () => {
    const raw = otp || '';
    const codeStr = String(raw ?? "").replace(/\D/g, "").slice(0, 6);
    const verificationCode = parseInt(codeStr, 10);

    if (codeStr.length !== 6) {
      setOtpError(true);
      showError("Please Enter The 6-Digit Verification Code.");
      return;
    }

    const data = {
      signId: userData?.signId,
      verification_code: verificationCode,
      registeredBy: userData?.registeredBy,
      token: "",
    };
    setOtpSubmitting(true);
    try {
      await dispatch(
        verifyOtp(data, setOtp, setOtpError, () =>
          NavigationService.navigate(NAVIGATION_AUTH_STACK, {
            screen: ACCOUNT_ACTIVATED_SCREEN,
            params: { mode: "blocked" },
          })
        )
      );
    } finally {
      setOtpSubmitting(false);
    }
  };

  const onGetOtp = async (showLoader = true) => {
    if (!userData?.signId) return;
    const data = {
      signId: userData.signId,
      registeredBy: userData?.registeredBy,
    };
    if (showLoader) setResendLoading(true);
    try {
      const result = await dispatch(sendOtp(data, setDisbaleBtn, setTimer, setAttemptLeft));
      if (isNoOtpAttemptsLeft(result?.message)) {
        NavigationService.navigate(NAVIGATION_AUTH_STACK, {
          screen: ACCOUNT_ACTIVATED_SCREEN,
          params: { mode: "blocked" },
        });
      }
    } finally {
      if (showLoader) setResendLoading(false);
    }
  };

  const onPasteOtp = async () => {
    try {
      const text = await Clipboard.getString();
      const parsed = String(text || "").replace(/\D/g, "").slice(0, 6);
      if (!parsed) {
        showError("Clipboard does not contain a valid code.");
        return;
      }
      setOtp(parsed);
    } catch {
      showError("Unable to read clipboard.");
    }
  };

  const getMaskedSignId = () => {
    const signId = String(userData?.signId || "").trim();
    if (!signId) return "";
    if (userData?.registeredBy === "email" && signId.includes("@")) {
      const [local, domain] = signId.split("@");
      if (!local?.length) return signId;
      return `${local[0]}***@${domain || ""}`;
    }
    // Mobile format: +91 78***87
    let countryPrefix = "+91";
    let mobilePart = signId;
    const prefixMatch = signId.match(/^(\+\d{1,4})\s*(.*)$/);
    if (prefixMatch) {
      countryPrefix = prefixMatch[1];
      mobilePart = prefixMatch[2] || "";
    }
    const digits = mobilePart.replace(/\D/g, "");
    if (!digits) return `${countryPrefix} `;
    if (digits.length <= 4) return `${countryPrefix} ${digits}`;
    return `${countryPrefix} ${digits.slice(0, 2)}***${digits.slice(-2)}`;
  };

  const verifyLabel = userData?.registeredBy === "email" ? "Verify Your Email" : "Verify Your Phone";

  return (
    <AppSafeAreaView style={{ backgroundColor: themeColors.background }}>
      <View style={styles.wrap}>
        <AuthHeader
          onSupportPress={() => Linking.openURL("https://zillion.wrathcode.com/").catch(() => { })}
          onClosePress={() => NavigationService.goBack()}
        />

        <AppText weight={BOLD} type={TWENTY_SIX} style={{ color: themeColors.text, marginTop: 10 }}>
          {verifyLabel}
        </AppText>

        <AppText type={THIRTEEN} style={{ color: themeColors.secondaryText, marginTop: 10 }}>
          The verification code has been sent to your{" "}
          {userData?.registeredBy === "email" ? "email " : "phone "}
          <AppText type={THIRTEEN} style={{ color: themeColors.secondaryText }}>
            {getMaskedSignId()}
          </AppText>
          {", valid for 10 minutes."}
        </AppText>

        <OtpInput6Digit
          value={otp}
          onChangeText={(val) => {
            if (otpError) setOtpError(false);
            setOtp(val);
          }}
          hasError={otpError}
          containerStyle={{ marginTop: 18 }}
        />
        {attemptLeft !== "" && attemptLeft != null && (
          <AppText type={THIRTEEN} style={{ color: themeColors.secondaryText, marginTop: 6 }}>
            Attempts left: {attemptLeft}
          </AppText>
        )}

        <View style={styles.linkRow}>
          <TouchableOpacityView onPress={() => onGetOtp(true)} disabled={disableBtn}>
            <AppText
              type={FOURTEEN}
              weight={MEDIUM}
              style={[
                styles.underlineText,
                { color: disableBtn ? themeColors.secondaryText : themeColors.text },
              ]}
            >
              {disableBtn ? `Resend (${timer}s)` : "Resend"}
            </AppText>
          </TouchableOpacityView>

          <TouchableOpacityView onPress={onPasteOtp} style={styles.pasteBtn}>
            <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: themeColors.text }}>
              Paste
            </AppText>
            <FastImage source={pasteImg} style={{ width: 15, height: 15 }} resizeMode="contain" />
          </TouchableOpacityView>
        </View>

        <Button
          children={"Next"}
          onPress={handleVerifyOtp}
          loading={showButtonLoading || otpSubmitting}
          containerStyle={{ marginTop: 28, width: "100%" }}
        />

        <TouchableOpacityView
          style={{ alignSelf: "center", marginTop: 22 }}
          onPress={() => onGetOtp(true)}
          disabled={disableBtn}
        >
          <AppText
            type={FOURTEEN}
            weight={SEMI_BOLD}
            style={[
              styles.underlineText,
              { color: disableBtn ? themeColors.secondaryText : themeColors.text },
            ]}
          >
            {disableBtn ? `Didn't receive the code?` : "Didn't receive the code?"}
          </AppText>
        </TouchableOpacityView>


      </View>

      <SpinnerSecond loading={resendLoading} localOnly />
    </AppSafeAreaView>
  );
};

export default VerifyAccount;

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  linkRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pasteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  underlineText: {
    textDecorationLine: "underline",
  },
});
