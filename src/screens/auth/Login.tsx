import React, { useEffect, useRef, useState } from "react";
import NavigationService from "../../navigation/NavigationService";
import FastImage from "react-native-fast-image";
import {
  CMS_SCREEN,
  FORGOT_PASSWORD_SCREEN,
  REGISTER_SCREEN,
  WELCOME_SCREEN,
} from "../../navigation/routes";
import {
  AppSafeAreaView,
  AppText,
  MEDIUM,
  Button,
  Input,
  TWENTY,
  TWENTY_SIX,
  Toolbar,
  WHITE,
  YELLOW,
  BLACK,
  BOLD,
  LIGHTGREY,
  TEN,
  THIRTEEN,
  EIGHTEEN,
  ELEVEN,
  TWELVE,
} from "../../shared";
import {
  welcomeBg,
  welcomeBg2,
  Logo,
  back_ic,
  googleIcon,
  closeIcon,
  PASSKEY_VERIFY,
  passkey_login,
} from "../../helper/ImageAssets";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal as RNModal,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { authStyles } from "./authStyles";
import KeyBoardAware from "../../shared/components/KeyboardAware";
import { showError } from "../../helper/logger";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { googleLogin, login, passkeyDiscoverableLogin } from "../../actions/authActions";
import TouchableOpacityView from "../../shared/components/TouchableOpacityView";
import {
  checkValue,
  validateEmail,
  validatePasswordStrict,
} from "../../helper/utility";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { useTheme } from "../../hooks/useTheme";
import { colors } from "../../theme/colors";
import { isValidPhoneNumber } from "libphonenumber-js";
import { setLoading } from "../../slices/authSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SpinnerSecond } from "../../shared/components/SpinnerSecond";
import { AuthEmailPhoneTabBar, AuthPhoneInput } from "../../shared/components";
import { Passkey } from "react-native-passkey";

const Login = (): JSX.Element => {
  const dispatch = useAppDispatch();
  const { colors: themeColors, isDark } = useTheme();
  const isLoading = useAppSelector((state) => state.auth.isLoading);
  const showButtonLoading = useAppSelector((state) => state.auth.isLoading && state.auth.loadingFor !== 'otp');
  const languages = useAppSelector((state) => state.account.languages);
  const tabTitle = (value: string | undefined, fallback: string) =>
    value != null && value !== "" ? checkValue(value) : fallback;
  const loc = languages as typeof languages & { phone?: string };
  const authTabs = [tabTitle(loc?.email, "Email"), tabTitle(loc?.phone, "Phone")];
  const passwordInput = useRef(null);
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
    dispatch(passkeyDiscoverableLogin() as any);
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
      const phone = Number(val);
      const valid = isValidPhoneNumber(`+${countryCode}${phone}`);
      setIsValid(valid);
    }
  };

  return (
    <AppSafeAreaView style={{ backgroundColor: themeColors.background }}>
      <KeyBoardAware style={{ paddingHorizontal: 20 }}>
        <View style={{ marginVertical: 20 }}>
          <TouchableOpacityView
            onPress={() => NavigationService.navigate(WELCOME_SCREEN)}
          >
            <FastImage
              source={back_ic}
              resizeMode="contain"
              style={{ width: 15, height: 15 }}
              tintColor={themeColors.text}
            />
          </TouchableOpacityView>
        </View>
        <AppText
          weight={BOLD}
          type={TWENTY_SIX}
          style={{ marginHorizontal: 10, color: themeColors.text }}
        >
          Login
        </AppText>
        <View style={{ marginTop: 20 }}>
          <AuthEmailPhoneTabBar
            tabs={authTabs}
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
                placeholder={checkValue(languages?.place_login_userName)}
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
              containerStyle={{ marginTop: 30, backgroundColor: themeColors.button }}
              titleStyle={{ color: themeColors.buttonText }}
            />
          )}

          {showPassField && (
            <>
              <Input
                placeholder={checkValue(languages?.place_signUpPassword)}
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
                loading={showButtonLoading}
                containerStyle={{ marginTop: 30, backgroundColor: themeColors.button }}
                titleStyle={{ color: themeColors.buttonText }}
              />
            </>
          )}
        </View>
      </KeyBoardAware>
      {!isKeyboardVisible && (
        <View
          style={{
            alignSelf: "center",
            alignItems: "center",
            gap: 10,
            marginBottom: 20,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View
              style={{
                backgroundColor: themeColors.border,
                width: 100,
                height: StyleSheet.hairlineWidth,
              }}
            ></View>
            <AppText type={TEN} style={{ color: themeColors.secondaryText }}>
              Or login with
            </AppText>
            <View
              style={{
                backgroundColor: themeColors.border,
                width: 100,
                height: StyleSheet.hairlineWidth,
              }}
            ></View>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <TouchableOpacityView
              style={{
                borderWidth: 1,
                borderColor: themeColors.border,
                borderRadius: 40,
                width: 35, height: 35,
                alignItems: "center",
                justifyContent: "center",
              }}
              onPress={signInWithGoogle}
              disabled={isLoading}
            >
              <FastImage
                source={googleIcon}
                resizeMode="contain"
                style={{ width: 22, height: 22 }}
              />
            </TouchableOpacityView>
            {passkeySupported && hasPasskey && (
              <TouchableOpacityView
                style={{
                  borderWidth: 1,
                  borderColor: themeColors.border,
                  borderRadius: 40,
                  width: 35, height: 35,
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onPress={signInWithPasskey}
                disabled={isLoading}
              >
                <FastImage
                  source={passkey_login}
                  resizeMode="contain"
                  style={{ width: 20, height: 20 }}
                  tintColor={themeColors.text}
                />
              </TouchableOpacityView>
            )}
          </View>
          <AppText type={TEN} style={{ color: themeColors.secondaryText, textAlign: 'center', paddingHorizontal: 20 }}>
            By signing in, I agree to AGCE Exchange user{" "}
            <AppText
              style={{ color: themeColors.button, textDecorationLine: "underline" }}
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
      )}

    </AppSafeAreaView>
  );
};

export default Login;
