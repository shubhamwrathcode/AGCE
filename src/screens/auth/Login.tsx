import React, { useEffect, useRef, useState } from "react";
import FastImage from "react-native-fast-image";
import { ActivityIndicator, Keyboard, Linking, StyleSheet, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { isValidPhoneNumber } from "libphonenumber-js";
import { Passkey } from "react-native-passkey";
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import { FORGOT_PASSWORD_SCREEN, REGISTER_SCREEN, WELCOME_SCREEN } from "../../navigation/routes";
import { AppSafeAreaView, AppText, BOLD, Button, FOURTEEN, Input, TEN, TWENTY_SIX } from "../../shared";
import KeyBoardAware from "../../shared/components/KeyboardAware";
import { authStyles } from "./authStyles";
import { showError } from "../../helper/logger";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { googleLogin, login, passkeyDiscoverableLogin } from "../../actions/authActions";
import TouchableOpacityView from "../../shared/components/TouchableOpacityView";
import { checkValue, validateEmail, validatePasswordStrict } from "../../helper/utility";
import { useTheme } from "../../hooks/useTheme";
import { setLoading } from "../../slices/authSlice";
import { googleIcon, passkey_login } from "../../helper/ImageAssets";
import { AuthEmailPhoneTabBar, AuthHeader, AuthPhoneInput } from "../../shared/components";
import NavigationService from "../../navigation/NavigationService";

const Login = (): JSX.Element => {
  const dispatch = useAppDispatch();
  const { colors: themeColors } = useTheme();
  const isLoading = useAppSelector((state) => state.auth.isLoading);
  const showButtonLoading = useAppSelector((state) => state.auth.isLoading && state.auth.loadingFor !== 'otp');
  const languages = useAppSelector((state) => state.account.languages);
  const passwordInput = useRef<any>(null);
  const [signUpId, setSignUpId] = useState("");
  const [password, setPassword] = useState<string>("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(true);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [index, setIndex] = useState(0);
  const [showPassField, setShowPassField] = useState(false);
  const [countryCode, setCountryCode] = useState(["91"]);
  const [country, setCountry] = useState("IN");
  const [isValid, setIsValid] = useState(false);
  const [isGoogleSignInInProgress, setIsGoogleSignInInProgress] =
    useState(false);
  const [isPasskeySignInInProgress, setIsPasskeySignInInProgress] = useState(false);
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [hasPasskey, setHasPasskey] = useState(false);

  useEffect(() => {
    setSignUpId("");
    setPassword("");
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

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      (e) => {
        setKeyboardVisible(true); // or some other action
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false); // or some other action
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  const onSubmit = () => {
    if (!password) {
      showError(checkValue("Please Enter Password"));
      return;
    }
    if (!validatePasswordStrict(password)) {
      showError(checkValue(languages?.error_passwordRegex));
      return;
    }
    Keyboard.dismiss();
    onLogin();
  };

  const onLogin = () => {
    dispatch(
      login({
        email_or_phone: signUpId,
        password,
        token: "",
      })
    );
  };

  const changeInput = (val: any) => {
    setSignUpId(val);
    if (index === 0) {
      // Email tab (first)
      setIsValid(validateEmail(val));
    } else if (index === 1) {
      // Mobile tab (second)
      const fullPhone = `${countryCode?.[0] ? `+${countryCode[0]}` : "+91"}${String(val || "")}`;
      const valid = isValidPhoneNumber(fullPhone);
      setIsValid(valid);
    }
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
              onSelectCountry={setCountryCode}
              onCountry={setCountry}
              country={country}
              countryCode={countryCode}
              maxLength={15}
              onFocus={() => setShowPassField(true)}
              onBlur={() => {}}
              onSubmitEditing={() => passwordInput?.current?.focus()}
              onEndEditing={() => passwordInput?.current?.focus()}
            />
          ) : (
            <View style={authStyles.mobileContainer}>
              <Input
                placeholder={"Enter email address"}
                value={signUpId}
                onChangeText={(text) => changeInput(text)}
                keyboardType={"email-address"}
                autoCapitalize="none"
                returnKeyType="next"
                onfocus={() => setShowPassField(false)}
                onSubmitEditing={() => passwordInput?.current?.focus()}
                onEndEditing={() => passwordInput?.current?.focus()}
                onFocus={() => setShowPassField(true)}
                mainContainer={authStyles.mobileInput}
                maxLength={100}
              />
            </View>
          )}
          {!showPassField && (
            <Button
              children={"Next"}
              disabled={!isValid}
              onPress={() => setShowPassField(true)}
              loading={showButtonLoading && !isGoogleSignInInProgress && !isPasskeySignInInProgress}
              containerStyle={{ marginTop: 18, backgroundColor: themeColors.button }}
            />
          )}

          {showPassField && (
            <>
              <Input
                placeholder={"Enter password"}
                value={password}
                onChangeText={(text) => setPassword(text)}
                autoCapitalize="none"
                secureTextEntry={isPasswordVisible}
                assignRef={(input: any) => {
                  passwordInput.current = input;
                }}
                returnKeyType="next"
                isSecure
                // onSubmitEditing={() => confirmPasswordInput?.current?.focus()}
                onPressVisible={() => setIsPasswordVisible(!isPasswordVisible)}
              />
              <AppText
                style={{ alignSelf: "flex-end", marginTop: 5, color: themeColors.text }}
                onPress={() =>
                  NavigationService.navigate(FORGOT_PASSWORD_SCREEN)
                }
              >
                Forgot Password?
              </AppText>

              <Button
                children={"Login"}
                disabled={!password}
                onPress={onSubmit}
                loading={showButtonLoading && !isGoogleSignInInProgress && !isPasskeySignInInProgress}
                containerStyle={{ marginTop: 30, backgroundColor: themeColors.button }}
                titleStyle={{ color: themeColors.buttonText }}
              />
            </>
          )}
        </View>
        {!isKeyboardVisible && (
          <View style={styles.socialSection}>
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: themeColors.border }]} />
              <AppText type={TEN} style={{ color: themeColors.secondaryText }}>
                Or
              </AppText>
              <View style={[styles.dividerLine, { backgroundColor: themeColors.border }]} />
            </View>

            <TouchableOpacityView
              style={[styles.socialPill, { borderColor: themeColors.border }]}
              onPress={signInWithGoogle}
              disabled={isGoogleSignInInProgress || isPasskeySignInInProgress || isLoading}
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

            {passkeySupported && hasPasskey ? (
              <TouchableOpacityView
                style={[styles.socialPill, { borderColor: themeColors.border }]}
                onPress={signInWithPasskey}
                disabled={isGoogleSignInInProgress || isPasskeySignInInProgress || isLoading}
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
        )}
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
});

export default Login;
