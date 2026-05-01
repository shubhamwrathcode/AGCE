import React, { useEffect, useMemo, useRef, useState } from "react";
import FastImage from "react-native-fast-image";
import { ActivityIndicator, Keyboard, Linking, Platform, ScrollView, StyleSheet, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { isValidPhoneNumber } from "libphonenumber-js";
import { Passkey } from "react-native-passkey";
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import { FORGOT_PASSWORD_SCREEN, REGISTER_SCREEN, WELCOME_SCREEN } from "../../navigation/routes";
import { AppSafeAreaView, AppText, Button, ELEVEN, FOURTEEN, Input, MEDIUM, TEN } from "../../shared";
import KeyBoardAware from "../../shared/components/KeyboardAware";
import { authStyles } from "./authStyles";
import { showError } from "../../helper/logger";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  googleLogin,
  login,
  passkeyDiscoverableLogin,
  verifyPasskeyLogin,
  type LoginThunkResult,
} from "../../actions/authActions";
import TouchableOpacityView from "../../shared/components/TouchableOpacityView";
import { getEmailDomainSuggestions } from "../../helper/emailDomainSuggest";
import { checkValue, validateEmail } from "../../helper/utility";
import { useTheme } from "../../hooks/useTheme";
import { setLoading } from "../../slices/authSlice";
import { apple, googleIcon, passkey_login } from "../../helper/ImageAssets";
import { AuthEmailPhoneTabBar, AuthHeader, AuthPhoneInput } from "../../shared/components";
import NavigationService from "../../navigation/NavigationService";
import Checkbox from "../../shared/components/Checkbox";

const Login = (): JSX.Element => {
  const dispatch = useAppDispatch();
  const { colors: themeColors, isDark } = useTheme();
  const isLoading = useAppSelector((state) => state.auth.isLoading);
  const showButtonLoading = useAppSelector((state) => state.auth.isLoading && state.auth.loadingFor !== 'otp');
  const languages = useAppSelector((state) => state.account.languages);
  const passwordInput = useRef<any>(null);
  const [signUpId, setSignUpId] = useState("");
  const [password, setPassword] = useState<string>("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(true);
  const [index, setIndex] = useState(0);
  const [showPassField, setShowPassField] = useState(false);
  const [bindIp, setBindIp] = useState(false);
  const [countryCode, setCountryCode] = useState(["91"]);
  const [country, setCountry] = useState("IN");
  const [isValid, setIsValid] = useState(false);
  const [identifierError, setIdentifierError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [isGoogleSignInInProgress, setIsGoogleSignInInProgress] =
    useState(false);
  const [isPasskeySignInInProgress, setIsPasskeySignInInProgress] = useState(false);
  const [isAppleSignInInProgress, setIsAppleSignInInProgress] = useState(false);
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [hasPasskey, setHasPasskey] = useState(false);
  const [emailSuggestListVisible, setEmailSuggestListVisible] = useState(false);
  const emailSuggestBlurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    return () => clearEmailSuggestBlurTimer();
  }, []);

  useEffect(() => {
    setSignUpId("");
    setPassword("");
    setIdentifierError(false);
    setPasswordError(false);
    setEmailSuggestListVisible(false);
  }, [index]);

  useEffect(() => {
    const checkPasskey = async () => {
      try {
        const supported = !!Passkey.isSupported();
        setPasskeySupported(supported);
        if (supported) {
          const locallyHas = await AsyncStorage.getItem('hasPasskey');
          setHasPasskey(locallyHas === 'true');
        }
      } catch {
        setPasskeySupported(false);
        setHasPasskey(false);
      }
    };
    checkPasskey();
  }, []);

  // Configure native Google Sign-In once
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

  const signInWithGoogle = async () => {
    // Prevent multiple simultaneous calls
    if (isGoogleSignInInProgress) {
      console.log(
        "Google Sign-In already in progress, ignoring duplicate call"
      );
      return;
    }

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
      };

      dispatch(googleLogin(data));
      // await api.post('/login', userData);
    } catch (error: any) {
      console.error("Google Sign In Error:", error?.code, error?.message, error);

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
        (error as { code?: string })?.code ===
        statusCodes.PLAY_SERVICES_NOT_AVAILABLE
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

  const signInWithPasskey = () => {
    setIsPasskeySignInInProgress(true);
    Promise.resolve(dispatch(passkeyDiscoverableLogin() as any)).finally(() => {
      setIsPasskeySignInInProgress(false);
    });
  };

  const signInWithApple = async () => {
    setIsAppleSignInInProgress(true);
    try {
      showError("Apple sign-in is not available yet. Please use email, Google, or Passkey.");
    } finally {
      setTimeout(() => setIsAppleSignInInProgress(false), 300);
    }
  };

  const onSubmit = () => {
    if (!password) {
      setPasswordError(true);
      showError(checkValue("Please Enter Password"));
      return;
    }
    setPasswordError(false);
    Keyboard.dismiss();
    onLogin();
  };

  const getNormalizedLoginId = () => {
    if (index === 0) {
      return String(signUpId || "").trim();
    }
    return String(signUpId || "").replace(/\D/g, "").replace(/^0+/, "") || "";
  };

  const onLogin = async () => {
    const normalizedId = getNormalizedLoginId();
    const result = (await dispatch(
      login({
        email_or_phone: normalizedId,
        password,
        token: "",
      })
    )) as LoginThunkResult;
    setPasswordError(false);
    setIdentifierError(false);
    if (!result?.success) {
      if (result.highlightPasswordField) setPasswordError(true);
      if (result.highlightIdentifierField) setIdentifierError(true);
    }
  };

  const validateEmailOrUsername = (raw: string) => {
    const id = String(raw || "").trim();
    if (!id) {
      setIdentifierError(true);
      showError("Please enter your email or username");
      return false;
    }
    setIdentifierError(false);
    if (id.includes("@")) {
      if (!validateEmail(id)) {
        setIdentifierError(true);
        showError("Please enter a valid email address");
        return false;
      }
      return true;
    }
    if (id.length < 3) {
      setIdentifierError(true);
      showError("Username must be at least 3 characters");
      return false;
    }
    if (!/^[a-zA-Z0-9._-]+$/.test(id)) {
      setIdentifierError(true);
      showError("Username contains invalid characters");
      return false;
    }
    return true;
  };

  const changeInput = (val: any) => {
    setSignUpId(val);
    if (identifierError) setIdentifierError(false);
    if (index === 0) {
      const raw = String(val || "").trim();
      if (!raw) {
        setIsValid(false);
        return;
      }
      if (raw.includes("@")) {
        setIsValid(validateEmail(raw));
      } else {
        setIsValid(raw.length >= 3 && /^[a-zA-Z0-9._-]+$/.test(raw));
      }
    } else if (index === 1) {
      // Mobile tab (second)
      const digits = String(val || "").replace(/\D/g, "").replace(/^0+/, "");
      const fullPhone = `${countryCode?.[0] ? `+${countryCode[0]}` : "+91"}${digits}`;
      const valid = isValidPhoneNumber(fullPhone);
      setIsValid(valid);
    }
  };

  const applyEmailDomain = (domain: string) => {
    clearEmailSuggestBlurTimer();
    const s = String(signUpId || "");
    const at = s.indexOf("@");
    if (at < 0) return;
    changeInput(`${s.slice(0, at)}@${domain}`);
    setEmailSuggestListVisible(false);
  };

  const onNext = async () => {
    if (index === 0) {
      if (!validateEmailOrUsername(signUpId)) return;
    } else {
      const digits = String(signUpId || "").replace(/\D/g, "").replace(/^0+/, "");
      if (!digits) {
        setIdentifierError(true);
        showError("Please enter your phone number");
        return;
      }
      setIdentifierError(false);
      const fullPhone = `${countryCode?.[0] ? `+${countryCode[0]}` : "+91"}${digits}`;
      if (!isValidPhoneNumber(fullPhone)) {
        setIdentifierError(true);
        showError("Please enter a valid phone number for the selected country");
        return;
      }
      if (digits !== signUpId) {
        setSignUpId(digits);
      }
    }

    const normalizedId = getNormalizedLoginId();
    if (passkeySupported && hasPasskey && normalizedId) {
      setIsPasskeySignInInProgress(true);
      try {
        console.log("[Passkey][Login] attempting passkey login", { normalizedId });
        const didLogin = await dispatch(verifyPasskeyLogin(normalizedId) as any);
        console.log("[Passkey][Login] passkey login result", { didLogin });
        if (didLogin) return;
      } catch (e: any) {
        console.error("[Passkey][Login] passkey login threw", {
          message: e?.message,
          code: e?.code,
          name: e?.name,
          raw: e,
        });
      } finally {
        setIsPasskeySignInInProgress(false);
      }
    }
    setShowPassField(true);
  };

  const openSupport = () => {
    Linking.openURL("https://zillion.wrathcode.com/").catch(() => {});
  };

  return (
    <AppSafeAreaView style={{ backgroundColor: themeColors.background }}>
      <KeyBoardAware style={{ paddingHorizontal: 20 }}>
        <AuthHeader
          onSupportPress={openSupport}
          onClosePress={() => NavigationService.navigate(WELCOME_SCREEN)}
          title="Log In"
        />
        <View style={{ marginTop: 16 }}>
          <AuthEmailPhoneTabBar
            tabs={["Email/Username", "Phone"]}
            index={index}
            onChange={(i: number) => {
              setIndex(i);
              setShowPassField(false);
            }}
          />

          {index === 1 ? (
            <AuthPhoneInput
              value={signUpId}
              onChangeText={(text: string) => changeInput(text)}
              placeholder={checkValue(languages?.place_userName) || "Enter phone number"}
              hasError={identifierError}
              onSelectCountry={setCountryCode}
              onCountry={setCountry}
              country={country}
              countryCode={countryCode}
              maxLength={15}
              onFocus={() => {}}
              onBlur={() => {}}
              onSubmitEditing={() => {}}
              onEndEditing={() => {}}
            />
          ) : (
            <View style={[authStyles.mobileContainer, styles.emailSuggestWrap]}>
              <Input
                placeholder={"Enter email or username"}
                value={signUpId}
                onChangeText={(text) => changeInput(text)}
                keyboardType={"default"}
                autoCapitalize="none"
                returnKeyType="next"
                onfocus={() => {
                  clearEmailSuggestBlurTimer();
                  setShowPassField(false);
                  setEmailSuggestListVisible(true);
                }}
                onBlur={() => {
                  clearEmailSuggestBlurTimer();
                  emailSuggestBlurTimer.current = setTimeout(() => {
                    setEmailSuggestListVisible(false);
                    emailSuggestBlurTimer.current = null;
                  }, 200);
                }}
                onSubmitEditing={() => {}}
                onEndEditing={() => {}}
                hasError={identifierError}
                mainContainer={[authStyles.mobileInput, styles.emailFieldMain]}
                maxLength={100}
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

          {/* Web parity: Bind IP + Forgot Password row (identifier step). */}
          {!showPassField ? (
            <View style={styles.bindRow}>
              <TouchableOpacityView
                style={styles.bindLeft}
                onPress={() => setBindIp((v) => !v)}
              >
                <Checkbox
                  value={bindIp}
                  onPress={() => setBindIp((v) => !v)}
                  disabled={false}
                  type={1}
                  style={undefined}
                  innerStyle={undefined}
                  theme={undefined}
                  containerStyle={undefined}
                />
                <AppText type={ELEVEN} weight={MEDIUM} style={{ color: themeColors.text }}>
                  Bind IP (Security option)
                </AppText>
              </TouchableOpacityView>

              <AppText
                type={ELEVEN} weight={MEDIUM}
                style={{ color: themeColors.text, textDecorationLine: "underline" }}
                onPress={() => NavigationService.navigate(FORGOT_PASSWORD_SCREEN)}
              >
                Forgot Password?
              </AppText>
            </View>
          ) : null}

          {!showPassField && (
            <Button
              children={"Next"}
              disabled={false}
              onPress={onNext}
              loading={showButtonLoading && !isGoogleSignInInProgress && !isPasskeySignInInProgress}
              containerStyle={{ marginTop: 18, backgroundColor: themeColors.button }}
            />
          )}

          {showPassField && (
            <>
              <Input
                placeholder={"Enter password"}
                value={password}
                onChangeText={(text) => {
                  if (passwordError) setPasswordError(false);
                  setPassword(text);
                }}
                autoCapitalize="none"
                secureTextEntry={isPasswordVisible}
                assignRef={(input: any) => {
                  passwordInput.current = input;
                }}
                returnKeyType="next"
                isSecure
                hasError={passwordError}
                // onSubmitEditing={() => confirmPasswordInput?.current?.focus()}
                onPressVisible={() => setIsPasswordVisible(!isPasswordVisible)}
              />

              {/* Web parity: Bind IP + Forgot Password row (password step). */}
              <View style={styles.bindRow}>
                <TouchableOpacityView
                  style={styles.bindLeft}
                  onPress={() => setBindIp((v) => !v)}
                >
                  <Checkbox
                    value={bindIp}
                    onPress={() => setBindIp((v) => !v)}
                    disabled={false}
                    type={1}
                    style={undefined}
                    innerStyle={undefined}
                    theme={undefined}
                    containerStyle={undefined}
                  />
                  <AppText type={ELEVEN} weight={MEDIUM} style={{ color: themeColors.text }}>
                    Bind IP (Security option)
                  </AppText>
                </TouchableOpacityView>

                <AppText
                  type={ELEVEN}
                  weight={MEDIUM}
                  style={{ color: themeColors.text, textDecorationLine: "underline" }}
                  onPress={() => NavigationService.navigate(FORGOT_PASSWORD_SCREEN)}
                >
                  Forgot Password?
                </AppText>
              </View>

              <Button
                children={"Login"}
                disabled={false}
                onPress={onSubmit}
                loading={showButtonLoading && !isGoogleSignInInProgress && !isPasskeySignInInProgress}
                containerStyle={{ marginTop: 30, backgroundColor: themeColors.button }}
                titleStyle={{ color: themeColors.buttonText }}
              />
            </>
          )}
        </View>
        <View style={styles.socialSection}>
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: themeColors.border }]} />
              <AppText type={TEN} style={{ color: themeColors.secondaryText }}>
                Or login with
              </AppText>
              <View style={[styles.dividerLine, { backgroundColor: themeColors.border }]} />
            </View>

            <TouchableOpacityView
              style={[styles.socialPill, { borderColor: themeColors.border }]}
              onPress={signInWithGoogle}
              disabled={isGoogleSignInInProgress || isPasskeySignInInProgress || isAppleSignInInProgress || isLoading}
            >
              {isGoogleSignInInProgress ? (
                <ActivityIndicator size={"small"} color={themeColors.text} />
              ) : (
                <FastImage source={googleIcon} resizeMode="contain" style={styles.socialBrandIcon} />
              )}
              <AppText type={FOURTEEN} style={{ color: themeColors.secondaryText }}>
                Continue with Google
              </AppText>
            </TouchableOpacityView>

            <TouchableOpacityView
              style={[styles.socialPill, { borderColor: themeColors.border }]}
              onPress={signInWithPasskey}
              disabled={isGoogleSignInInProgress || isPasskeySignInInProgress || isAppleSignInInProgress || isLoading}
            >
              {isPasskeySignInInProgress ? (
                <ActivityIndicator size={"small"} color={themeColors.text} />
              ) : (
                <FastImage
                  source={passkey_login}
                  resizeMode="contain"
                  style={styles.socialBrandIcon}
                  tintColor={themeColors.text}
                />
              )}
              <AppText type={FOURTEEN} style={{ color: themeColors.secondaryText }}>
                Continue with Passkey
              </AppText>
            </TouchableOpacityView>

            {Platform.OS === "ios" ? (
              <TouchableOpacityView
                style={[styles.socialPill, { borderColor: themeColors.border }]}
                onPress={signInWithApple}
                disabled={isGoogleSignInInProgress || isPasskeySignInInProgress || isAppleSignInInProgress || isLoading}
              >
                {isAppleSignInInProgress ? (
                  <ActivityIndicator size={"small"} color={themeColors.text} />
                ) : (
                  <FastImage source={apple} resizeMode="contain" style={styles.socialBrandIcon} />
                )}
                <AppText type={FOURTEEN} style={{ color: themeColors.secondaryText }}>
                  Continue with Apple
                </AppText>
              </TouchableOpacityView>
            ) : null}

            <TouchableOpacityView
              style={styles.createAccountWrap}
              onPress={() => NavigationService.navigate(REGISTER_SCREEN)}
            >
              <AppText type={FOURTEEN} style={{ color: themeColors.text, textDecorationLine: "underline" }}>
                Create a AGCE Account
              </AppText>
            </TouchableOpacityView>
          </View>
      </KeyBoardAware>
    </AppSafeAreaView>
  );
};

const styles = StyleSheet.create({
  socialSection: {
    marginTop: 18,
    paddingBottom: 24,
    gap: 14,
  },
  bindRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bindLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  socialPill: {
    borderWidth: 1,
    borderRadius: 999,
    minHeight: 50,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  socialBrandIcon: {
    width: 24,
    height: 24,
  },
  createAccountWrap: {
    marginTop: 2,
    alignItems: "center",
  },
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
});

export default Login;
