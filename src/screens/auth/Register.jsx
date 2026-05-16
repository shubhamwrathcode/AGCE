import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AppSafeAreaView,
  AppText,
  Button,
  ELEVEN,
  FIFTEEN,
  FOURTEEN,
  Input,
  MEDIUM,
  TEN,
  THIRTEEN,
  TWELVE,
} from "../../shared";
import KeyBoardAware from "../../shared/components/KeyboardAware";
import { ActivityIndicator, Linking, Platform, ScrollView, StyleSheet, View } from "react-native";
import { AuthHeader, AuthEmailPhoneTabBar, AuthPhoneInput } from "../../shared/components";
import { authStyles } from "./authStyles";
import { BASE_URL } from "../../helper/Constants";
import { showError } from "../../helper/logger";
import Toast from "react-native-simple-toast";
import { appOperation } from "../../appOperation";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { googleRegister } from "../../actions/authActions";
import {
  downIcon,
  upIcon,
  googleIcon,
  apple,
} from "../../helper/ImageAssets";
import {
  checkValue,
  validateEmail,
} from "../../helper/utility";
import { getEmailDomainSuggestions } from "../../helper/emailDomainSuggest";
import NavigationService from "../../navigation/NavigationService";
import { CMS_SCREEN, SET_PASSWORD_SCREEN } from "../../navigation/routes";
import Checkbox from "../../shared/components/Checkbox";
import FastImage from "react-native-fast-image";
import { useRoute } from "@react-navigation/native";
import { colors } from "../../theme/colors";
import TouchableOpacityView from "../../shared/components/TouchableOpacityView";
import { isValidPhoneNumber } from "libphonenumber-js";
import { setLoading } from "../../slices/authSlice";
import { useTheme } from "../../hooks/useTheme";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";


/** Matches AppOperation.send(): only `api/*` skips the `v1/` prefix. */
const guestPostUrl = (path) => {
  if (path.startsWith("api/")) {
    return `${BASE_URL}${path}`;
  }
  return `${BASE_URL}v1/${path}`;
};

const logRegisterPayload = (label, path, data) => {
  const safe =
    data && typeof data === "object"
      ? {
        ...data,
        password: data.password != null ? "[redacted]" : undefined,
        Token: data.Token != null ? "[redacted]" : undefined,
      }
      : data;

};

const parseSignupEmailCheckResponse = (res) => {
  if (res == null) return { ok: false, message: "" };
  if (res.success === false) {
    return { ok: false, message: res.message || res?.data?.message || "" };
  }
  const d = res.data != null && typeof res.data === "object" ? res.data : res;
  if (typeof d === "object" && d) {
    if (d.exists === true || d.emailExists === true || d.isRegistered === true || d.alreadyExists === true) {
      return { ok: false, message: res.message || d.message || "" };
    }
    if (d.available === false || d.canRegister === false) {
      return { ok: false, message: res.message || d.message || "" };
    }
    if (d.available === true || d.exists === false || d.canRegister === true) {
      return { ok: true };
    }
  }
  return { ok: true };
};

const parseSignupReferralResponse = (res) => {
  if (res == null) return { ok: false, message: "" };
  if (res.success === false) {
    return { ok: false, message: res.message || res?.data?.message || "" };
  }
  const d = res.data != null && typeof res.data === "object" ? res.data : res;
  if (typeof d === "object" && d) {
    if (d.valid === false || d.isValid === false || d.is_valid === false) {
      return { ok: false, message: res.message || d.message || "" };
    }
    if (d.exhausted === true || d.fullyUsed === true || d.noUsesLeft === true) {
      return { ok: false, message: res.message || d.message || "" };
    }
  }
  return { ok: true };
};

const isSkippablePrecheckError = (err) => {
  const code = Number(err?.code ?? err?.status ?? 0);
  const message = String(err?.message || "").toLowerCase();
  return code === 404 || message.includes("html error page") || message.includes("html instead of json");
};

const Register = () => {
  const route = useRoute();
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.auth.theme);
  const languages = useAppSelector((state) => {
    return state.account.languages;
  });
  const isLoading = useAppSelector((state) => state.auth.isLoading);
  const showButtonLoading = useAppSelector((state) => state.auth.isLoading && state.auth.loadingFor !== 'otp');
  const [signUpId, setSignUpId] = useState("");
  const [showRefer, setShowRefer] = useState(false);
  const refFromParams = route?.params?.reffcode || route?.params?.referCode || route?.params?.emailId || "";
  const [referCode, setReferCode] = useState(refFromParams);
  const [index, setIndex] = useState(0);
  const [countryCode, setCountryCode] = useState(["91"]);
  const [country, setCountry] = useState("IN");
  const [isGoogleSignInInProgress, setIsGoogleSignInInProgress] = useState(false);
  const [isAppleSignInInProgress, setIsAppleSignInInProgress] = useState(false);
  const [step1Submitting, setStep1Submitting] = useState(false);
  const [checkTermsEmail, setCheckTermsEmail] = useState(true);
  const [checkTermsPhone, setCheckTermsPhone] = useState(true);
  const [signUpIdError, setSignUpIdError] = useState(false);
  const [emailSuggestListVisible, setEmailSuggestListVisible] = useState(false);
  const emailSuggestBlurTimer = useRef(null);
  const { colors: themeColors, isDark } = useTheme();

  const clearEmailSuggestBlurTimer = () => {
    if (emailSuggestBlurTimer.current) {
      clearTimeout(emailSuggestBlurTimer.current);
      emailSuggestBlurTimer.current = null;
    }
  };

  const emailDomainSuggestions = useMemo(
    () => (index === 0 ? getEmailDomainSuggestions(signUpId) : []),
    [index, signUpId]
  );
  const tabTitle = (value, fallback) =>
    value != null && value !== "" ? checkValue(value) : fallback;
  const authTabs = [
    tabTitle(languages?.email, "Email"),
    tabTitle(languages?.phone, "Phone"),
  ];

  useEffect(() => {
    setSignUpId("");
    setReferCode(refFromParams || "");
    setSignUpIdError(false);
    setEmailSuggestListVisible(false);
  }, [index]);

  useEffect(() => {
    return () => clearEmailSuggestBlurTimer();
  }, []);

  const handleClearCaptcha = () => { };

  useEffect(() => {
    try {
      GoogleSignin.configure({
        webClientId:
          "181209853085-4biots3iul9k7ag9qudhirgj3olapj4n.apps.googleusercontent.com",
        offlineAccess: true,
        forceCodeForRefreshToken: true,
      });
    } catch (e) {
      console.warn("GoogleSignin.configure error", e);
    }

    // Cleanup function to handle component unmounting
    return () => {
      // Reset Google Sign-In state when component unmounts
      setIsGoogleSignInInProgress(false);
    };
  }, []);

  const onSubmit = async () => {
    if (index === 0) {
      if (!signUpId) {
        setSignUpIdError(true);
        showError("Please enter your email");
        return;
      }
      if (!validateEmail(signUpId)) {
        setSignUpIdError(true);
        showError(checkValue(languages?.error_email) || "Please enter a valid email address");
        return;
      }
      setSignUpIdError(false);
    } else if (index === 1) {
      const fullPhone = `${countryCode[0] ? `+${countryCode[0]}` : "+91"}${signUpId}`;
      if (!isValidPhoneNumber(fullPhone)) {
        setSignUpIdError(true);
        showError(checkValue(languages?.error_userName) || "Please enter a valid phone number for the selected country");
        return;
      }
      setSignUpIdError(false);
    }
    if (index === 0 && !checkTermsEmail) {
      showError("Please agree to AGCE Terms and Use");
      return;
    }
    if (index === 1 && !checkTermsPhone) {
      showError("Please agree to AGCE Terms and Use");
      return;
    }

    if (index === 0) {
      try {
        setStep1Submitting(true);
        const emailRes = await appOperation.guest.check_signup_email(signUpId.trim());
        const emailCheck = parseSignupEmailCheckResponse(emailRes);
        if (!emailCheck.ok) {
          showError(emailCheck.message || "Request failed");
          return;
        }
      } catch (e) {
        if (isSkippablePrecheckError(e)) {
          console.warn("[Register] check-signup-email unavailable, skipping pre-check", e?.code || e?.message);
        } else {
          showError(e?.message || e?.response?.data?.message || "Request failed");
          return;
        }
      } finally {
        setStep1Submitting(false);
      }
    }

    const ref = String(referCode || "").trim();
    const shouldValidateReferral = ref.length > 0 && (showRefer || Boolean(refFromParams));
    if (shouldValidateReferral) {
      try {
        setStep1Submitting(true);
        const refRes = await appOperation.guest.validate_signup_referral(ref);
        const refCheck = parseSignupReferralResponse(refRes);
        if (!refCheck.ok) {
          showError(refCheck.message || "Request failed");
          return;
        }
      } catch (e) {
        if (isSkippablePrecheckError(e)) {
          console.warn("[Register] validate-signup-referral unavailable, skipping pre-check", e?.code || e?.message);
        } else {
          showError(e?.message || e?.response?.data?.message || "Request failed");
          return;
        }
      } finally {
        setStep1Submitting(false);
      }
    }

    NavigationService.navigate(SET_PASSWORD_SCREEN, {
      signupType: index === 0 ? "email" : "phone",
      signUpId,
      countryCode,
      referCode,
    });
  };

  const signupWithGoogle = async () => {
    // Prevent multiple simultaneous calls
    if (isGoogleSignInInProgress) {
      console.log(
        "Google Sign-In already in progress, ignoring duplicate call"
      );
      return;
    }

    Toast.showWithGravity("Coming soon", Toast.SHORT, Toast.BOTTOM);
    return;

    try {
      console.log("Starting Google Sign-In...");
      setIsGoogleSignInInProgress(true);
      dispatch(setLoading(true));
      // Prefer native Google sign-in (no external browser)
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      const account = await GoogleSignin.signIn();
      console.log("Native Google account:", account);

      // Fetch short-lived OAuth access token (Android only; iOS returns null)
      const tokens = await GoogleSignin.getTokens();
      console.log("Google tokens:", tokens);

      let data = {
        Token: tokens?.accessToken || account?.data?.idToken,
        type: 'google',
        referral_code: referCode || '',
      };

      logRegisterPayload("Google signup", "user/third-party-signup", data);
      dispatch(googleRegister(data, () => { }, () => { }, handleClearCaptcha));
      // await api.post('/login', userData);
    } catch (error) {
      console.error("Google Sign In Error:", error);

      // Handle specific error types
      if (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof error.message === "string" &&
        error.message.includes("User cancelled flow")
      ) {
        showError("Google Sign-In was cancelled");
      } else if (error.message && error.message.includes("Network error")) {
        showError("Network error. Please check your internet connection.");
      } else if (error.message && error.message.includes("Invalid client")) {
        showError(
          "Google Sign-In configuration error. Please contact support."
        );
      } else if (error?.code === statusCodes.SIGN_IN_CANCELLED) {
        showError("Google Sign-In was cancelled");
      } else if (error?.code === statusCodes.IN_PROGRESS) {
        showError("Google Sign-In already in progress");
      } else if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE
      ) {
        showError("Google Play Services not available or outdated");
      } else {
        const fallbackMessage =
          (typeof error === "string" && error) ||
          error?.message ||
          error?.error ||
          error?.error_description ||
          "Google Sign-In failed. Please try again.";
        showError(fallbackMessage);
      }
    } finally {
      setIsGoogleSignInInProgress(false);
      dispatch(setLoading(false));
    }
  };

  const signupWithApple = async () => {
    setIsAppleSignInInProgress(true);
    try {
      showError("Apple sign-in is not available yet. Please use email or Google.");
    } finally {
      setTimeout(() => setIsAppleSignInInProgress(false), 300);
    }
  };

  const openSupport = () => {
    Linking.openURL("https://agce.wrathcode.com/help_center").catch(() => { });
  };

  // Captcha commented out – flow matches web.

  const send = async () => {
    await onSubmit();
  };

  const changeEmailInput = (text) => {
    if (signUpIdError) setSignUpIdError(false);
    setSignUpId(text);
  };

  const applyEmailDomain = (domain) => {
    clearEmailSuggestBlurTimer();
    const s = String(signUpId || "");
    const at = s.indexOf("@");
    if (at < 0) return;
    changeEmailInput(`${s.slice(0, at)}@${domain}`);
    setEmailSuggestListVisible(false);
  };

  const socialPillBorder = themeColors.border;
  const socialPillBg = isDark ? themeColors.card : "#FFFFFF";

  return (
    <AppSafeAreaView style={{ backgroundColor: themeColors.background }}>
      <KeyBoardAware style={{ paddingHorizontal: 20 }}>
        <AuthHeader
          onSupportPress={openSupport}
          onClosePress={() => NavigationService.goBack()}
          title="Create Account"
        />

        <View
          style={theme !== "Dark" ? authStyles.card : authStyles.cardDark}
        >
          <AuthEmailPhoneTabBar tabs={authTabs} index={index} onChange={setIndex} />

          {index === 1 ? (
            <AuthPhoneInput
              value={signUpId}
              onChangeText={(text) => {
                if (signUpIdError) setSignUpIdError(false);
                setSignUpId(text);
              }}
              placeholder={"Enter phone number"}
              hasError={signUpIdError}
              onSelectCountry={setCountryCode}
              onCountry={setCountry}
              country={country}
              countryCode={countryCode}
              maxLength={15}
              onFocus={() => { }}
              onBlur={() => { }}
              onSubmitEditing={() => { }}
              onEndEditing={() => { }}
            />
          ) : (
            <View style={[authStyles.mobileContainer, styles.emailSuggestWrap]}>
              <Input
                placeholder={"Enter email address"}
                value={signUpId}
                onChangeText={(text) => changeEmailInput(text)}
                keyboardType={"email-address"}
                autoCapitalize="none"
                returnKeyType="next"
                onfocus={() => {
                  clearEmailSuggestBlurTimer();
                  setEmailSuggestListVisible(true);
                }}
                onBlur={() => {
                  clearEmailSuggestBlurTimer();
                  emailSuggestBlurTimer.current = setTimeout(() => {
                    setEmailSuggestListVisible(false);
                    emailSuggestBlurTimer.current = null;
                  }, 200);
                }}
                mainContainer={[authStyles.mobileInput, styles.emailFieldMain]}
                maxLength={100}
                hasError={signUpIdError}
              />
              {emailSuggestListVisible && emailDomainSuggestions.length > 0 ? (
                <View
                  style={[
                    styles.emailSuggestList,
                    {
                      backgroundColor: themeColors.input,
                      borderColor: themeColors.border,
                    },
                  ]}
                >
                  <ScrollView
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled
                    style={styles.emailSuggestScroll}
                  >
                    {emailDomainSuggestions.map((domain) => (
                      <TouchableOpacityView
                        key={domain}
                        style={styles.emailSuggestRow}
                        onPress={() => applyEmailDomain(domain)}
                      >
                        <AppText type={FOURTEEN} style={{ color: themeColors.text }}>
                          @{domain}
                        </AppText>
                      </TouchableOpacityView>
                    ))}
                  </ScrollView>
                </View>
              ) : null}
            </View>
          )}

          <TouchableOpacityView
            style={{
              marginTop: 5,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
            onPress={() => setShowRefer(!showRefer)}
          >
            <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: themeColors.text }}>Referral code</AppText>
            <FastImage
              source={!showRefer ? downIcon : upIcon}
              resizeMode="contain"
              style={{ width: 10, height: 10 }}
              tintColor={themeColors.text}
            />
          </TouchableOpacityView>

          {showRefer && (
            <Input
              placeholder={"Referral code (Optional)"}
              value={referCode}
              onChangeText={(text) => setReferCode(text)}
              autoCapitalize="none"
              returnKeyType="next"
              editable={!refFromParams}
            />
          )}

          <TouchableOpacityView
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginVertical: 12,
              gap: 8,
            }}
            onPress={() => {
              if (index === 0) setCheckTermsEmail((c) => !c);
              else setCheckTermsPhone((c) => !c);
            }}
          >
            <Checkbox
              value={index === 0 ? checkTermsEmail : checkTermsPhone}
              onPress={() => {
                if (index === 0) setCheckTermsEmail((c) => !c);
                else setCheckTermsPhone((c) => !c);
              }}
            />
            <AppText type={TWELVE} weight={MEDIUM} style={{ color: themeColors.text }}>
              I agree to AGCE{" "}
              <AppText
                type={TWELVE} weight={MEDIUM}
                style={{ color: colors.buttonBg, textDecorationLine: "underline" }}
                onPress={() =>
                  NavigationService.navigate(CMS_SCREEN, {
                    id: "https://agce.wrathcode.com/terms_conditions",
                  })
                }
              >
                Terms and Use
              </AppText>
            </AppText>
          </TouchableOpacityView>


          <Button
            children={"Next"}
            disabled={
              step1Submitting
            }
            onPress={() => send()}
            loading={(showButtonLoading && !isGoogleSignInInProgress && !isAppleSignInInProgress) || step1Submitting}
            containerStyle={[styles.primaryCTA, { marginTop: 10 }]}
          />
        </View>
        <View style={styles.socialSection}>
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: themeColors.border }]} />
            <AppText type={THIRTEEN} style={{ color: themeColors.secondaryText }}>
              Or log in with
            </AppText>
            <View style={[styles.dividerLine, { backgroundColor: themeColors.border }]} />
          </View>

          <TouchableOpacityView
            style={[styles.socialPill, { borderColor: socialPillBorder, }]}
            onPress={signupWithGoogle}
            disabled={isGoogleSignInInProgress || isAppleSignInInProgress || isLoading}
          >
            {isGoogleSignInInProgress ? (
              <ActivityIndicator size={"small"} color={themeColors.text} />
            ) : (
              <FastImage source={googleIcon} resizeMode="contain" style={styles.socialBrandIcon} />
            )}
            <AppText type={FIFTEEN} weight={MEDIUM} style={{ color: themeColors.secondaryText }}>
              Continue with Google
            </AppText>
          </TouchableOpacityView>

          {Platform.OS === "ios" ? (
            <TouchableOpacityView
              style={[styles.socialPill, { borderColor: socialPillBorder, backgroundColor: "transparent" }]}
              onPress={signupWithApple}
              disabled={isGoogleSignInInProgress || isAppleSignInInProgress || isLoading}
            >
              {isAppleSignInInProgress ? (
                <ActivityIndicator size={"small"} color={themeColors.text} />
              ) : (
                <FastImage source={apple} resizeMode="contain" style={styles.socialBrandIcon} />
              )}
              <AppText type={FIFTEEN} weight={MEDIUM} style={{ color: themeColors.secondaryText }}>
                Continue with Apple
              </AppText>
            </TouchableOpacityView>
          ) : null}

          <AppText type={ELEVEN} style={{ color: themeColors.secondaryText, marginTop: 4, marginLeft: 5 }}>
            By signing up, I agree to AGCE Exchange user{" "}
            <AppText
              style={{ color: colors.buttonBg, textDecorationLine: "underline" }}
              type={TEN}
              onPress={() => {
                NavigationService.navigate(CMS_SCREEN, {
                  id: "https://agce.wrathcode.com/terms_conditions",
                });
              }}
            >
              Terms and Conditions
            </AppText>
          </AppText>
        </View>
      </KeyBoardAware>

    </AppSafeAreaView>
  );
};

const styles = StyleSheet.create({
  emailFieldMain: {
    flex: 0,
    alignSelf: "stretch",
    width: "100%",
    marginBottom: 0,
  },
  emailSuggestWrap: {
    zIndex: 10,
    flexDirection: "column",
    alignItems: "stretch",
    alignSelf: "stretch",
    width: "100%",
    justifyContent: "flex-start",
    marginBottom: 12,
  },
  emailSuggestList: {
    marginTop: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    maxHeight: 220,
    overflow: "hidden",
  },
  emailSuggestScroll: {
    maxHeight: 220,
  },
  emailSuggestRow: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  primaryCTA: {
    alignSelf: "stretch",
  },
  socialSection: {
    paddingBottom: 24,
    gap: 12,
    marginTop: 10
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  socialPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    gap: 10,
    minHeight: 53,
  },
  socialBrandIcon: {
    width: 28,
    height: 28,
  },
  appleIcon: {
    marginRight: 0,
  },
});

export default Register;
