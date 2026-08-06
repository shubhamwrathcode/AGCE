import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  useWindowDimensions,
  Linking,
  Alert,
} from "react-native";
import RBSheet from "react-native-raw-bottom-sheet";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { clearPending2FA } from "../../slices/authSlice";
import { sendLoginOtp, verifyUser, verifyPasskeyLogin } from "../../actions/authActions";
import NavigationService from "../../navigation/NavigationService";
import { LOGIN_SCREEN } from "../../navigation/routes";
import { AppText, AppSafeAreaView, Button, BOLD, FOURTEEN as FOURTEEN_CONST, SEMI_BOLD, THIRTEEN, EIGHTEEN, SIXTEEN, MEDIUM, TWENTY_SIX, TWELVE, FOURTEEN } from "../../shared";
import { colors } from "../../theme/colors";
import FastImage from "react-native-fast-image";
import { closeIcon, EMAIL, PHONE, KEY_ICON, pasteImg, SHARE_NEW_ICON, passkey_login, right_ic, checkIc } from "../../helper/ImageAssets";
import TouchableOpacityView from "../../shared/components/TouchableOpacityView";
import { OtpInput6Digit } from "../../shared";
import { showError } from "../../helper/logger";
import { SpinnerSecond } from "../../shared/components/SpinnerSecond";
import { useTheme } from "../../hooks/useTheme";
import Clipboard from "@react-native-community/clipboard";
import { AuthHeader } from "../../shared/components";

const getMethodIcon = (type: number) => {
  switch (type) {
    case 1: return EMAIL;
    case 2: return KEY_ICON;
    case 3: return PHONE;
    case 4: return passkey_login;
    default: return "";
  }
};

export interface AuthVerificationContentProps {
  onClose: () => void;
}

/** 2FA verification content – use inside full screen or inside RBSheet on Login. */
export const AuthVerificationContent = ({ onClose }: AuthVerificationContentProps) => {
  const dispatch = useAppDispatch();
  const { colors: themeColors, isDark } = useTheme();
  const pending2FA = useAppSelector((state) => state.auth.pending2FA);
  const isLoading = useAppSelector((state) => state.auth.isLoading);
  const loadingFor = useAppSelector((state) => state.auth.loadingFor);
  const showButtonLoading = isLoading && loadingFor === 'otp';
  const passkeyCancelled = useAppSelector((state) => state.auth.passkeyCancelled);

  const getFirstMethod = () => {
    if (!pending2FA) return 1;
    const baseMethods = pending2FA.availableMethods ?? [];
    const has = (t: number) => baseMethods.some((m: any) => m.type === t);

    if (has(4) && !passkeyCancelled) return 4;
    if (has(2)) return 2;

    const signIdStr = String(pending2FA?.loginSignId || '').trim();
    if (signIdStr) {
      if (signIdStr.includes('@')) {
        return 1;
      } else if (/^[\+\d\s\-\(\)]+$/.test(signIdStr)) {
        return 3;
      }
    }

    if (pending2FA?.defaultMethod && has(pending2FA.defaultMethod)) {
      return pending2FA.defaultMethod;
    }
    if (has(1)) return 1;
    if (has(3)) return 3;

    return baseMethods[0]?.type ?? 1;
  };

  const initialMethod = getFirstMethod();
  const [selectedAuthMethod, setSelectedAuthMethod] = useState(initialMethod);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState(false);
  const [resendTimer, setResendTimer] = useState((initialMethod === 1 || initialMethod === 3) ? 60 : 0);
  const optionsSheetRef = useRef<any>(null);
  const otpInputRef = useRef<any>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      otpInputRef.current?.focus();
    }, 500);
    return () => clearTimeout(t);
  }, []);

  const isVerifyingRef = useRef(false);
  const prevSelectedMethod = useRef<number>(initialMethod);
  const autoSubmitEnabled = useRef<boolean>(true);
  const { height: winHeight } = useWindowDimensions();

  const sheetCustomStyles = {
    container: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      backgroundColor: themeColors.card,
    },
    wrapper: { backgroundColor: "rgba(0,0,0,0.5)" },
    draggableIcon: { backgroundColor: "transparent" as const },
  };

  // const onVerify = async () => {
  //   if (!pending2FA) return;
  //   if (selectedAuthMethod === 1 || selectedAuthMethod === 3) {
  //     // Email or Mobile OTP flow
  //     await dispatch(sendLoginOtp(pending2FA.loginSignId, selectedAuthMethod, otpCode, true));
  //   } else if (selectedAuthMethod === 2) {
  //     // Google Authenticator flow
  //     await dispatch(verifyUser(pending2FA.loginSignId, selectedAuthMethod, true));
  //   } else if (selectedAuthMethod === 4) {
  //     // Passkey flow – allowed only via switch method after cancellation
  //     await dispatch(verifyPasskeyLogin(pending2FA.loginSignId, false));
  //   }
  // };

  useEffect(() => {
    console.log("[AuthVerification] Hook 1 triggered. pending2FA:", !!pending2FA);
    if (!pending2FA) return;

    const firstMethod = getFirstMethod();

    setSelectedAuthMethod(firstMethod);
    setOtpCode("");
    setOtpError(false);
    prevSelectedMethod.current = firstMethod;
    autoSubmitEnabled.current = true;
    if (firstMethod === 1 || firstMethod === 3) {
      setResendTimer(60);
    } else {
      setResendTimer(0);
    }
  }, [pending2FA]);

  // Auto-send OTP when user switches between Email/Phone methods (no need to press Resend).
  useEffect(() => {
    console.log(`[AuthVerification] Hook 2 triggered. selectedAuthMethod: ${selectedAuthMethod}, prevSelectedMethod: ${prevSelectedMethod.current}`);
    if (!pending2FA) return;
    if (prevSelectedMethod.current === selectedAuthMethod) {
      console.log("[AuthVerification] Hook 2 - Skip because method is unchanged");
      return;
    }

    // Reset input when switching methods
    setOtpCode("");
    setOtpError(false);

    // Re-enable auto-submit on a fresh method switch
    autoSubmitEnabled.current = true;

    if (selectedAuthMethod === 1 || selectedAuthMethod === 3) {
      console.log(`[AuthVerification] Hook 2 - Auto-sending OTP for switched method: ${selectedAuthMethod}`);
      prevSelectedMethod.current = selectedAuthMethod;
      handleGetOtp();
      return;
    }

    prevSelectedMethod.current = selectedAuthMethod;
    if (selectedAuthMethod === 1 || selectedAuthMethod === 2 || selectedAuthMethod === 3) {
      setTimeout(() => otpInputRef.current?.focus(), 300);
    }
  }, [pending2FA, selectedAuthMethod]);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer((r) => r - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  useEffect(() => {
    if (selectedAuthMethod === 4 && pending2FA?.loginSignId) {
      const triggerPasskey = async () => {
        await dispatch(verifyPasskeyLogin(pending2FA.loginSignId, false));
      };
      triggerPasskey();
    }
  }, [selectedAuthMethod, pending2FA]);

  const getVerifySignId = (): string => {
    if (!pending2FA) return "";
    const { loginSignId: signId, availableMethods: methods } = pending2FA;
    if (selectedAuthMethod === 3) {
      const m = methods?.find((x: any) => x.type === 3);
      return m?.value ?? signId;
    }
    if (selectedAuthMethod === 1) {
      const m = methods?.find((x: any) => x.type === 1);
      return m?.value ?? signId;
    }
    return signId;
  };

  const getVerificationTitle = (): string => {
    switch (selectedAuthMethod) {
      case 1: return "Email Verification";
      case 2: return "Authenticator Verification";
      case 3: return "Phone Verification";
      case 4: return "Passkey Authentication";
      default: return "Verification";
    }
  };

  const getVerificationDescription = (): string => {
    const method = pending2FA?.availableMethods?.find((m: any) => m.type === selectedAuthMethod);
    const masked = method?.maskedValue;
    if (selectedAuthMethod === 1) return `Enter the 6-digit verification code sent to ${masked || "your email"}.`;
    if (selectedAuthMethod === 2) return "Enter the 6-digit code from your authenticator app.";
    if (selectedAuthMethod === 3) return `Enter the 6-digit verification code sent to ${masked || "your phone"}.`;
    if (selectedAuthMethod === 4) return "Authenticate using Face ID, Touch ID, or your device biometrics.";
    return "Enter your verification code.";
  };

  const getInputLabel = (): string => {
    switch (selectedAuthMethod) {
      case 1: return "Email Verification Code";
      case 2: return "Authenticator Code";
      case 3: return "Phone Verification Code";
      case 4: return "Passkey Authentication";
      default: return "Verification Code";
    }
  };

  const handleGetOtp = () => {
    const isPhone = pending2FA?.loginSignId && !String(pending2FA.loginSignId).includes('@') && /^[\+\d\s\-\(\)]+$/.test(String(pending2FA.loginSignId));
    const sendTo = (selectedAuthMethod === 3 || isPhone) ? "mobile" : "email";
    console.log(`[AuthVerification] handleGetOtp called. method: ${selectedAuthMethod}, sendTo: ${sendTo}`);
    setResendTimer(60);
    autoSubmitEnabled.current = true;
    dispatch(sendLoginOtp(getVerifySignId(), sendTo, setResendTimer));
  };

  const handlePasteOtp = async () => {
    try {
      const text = await Clipboard.getString();
      const digits = String(text || "").replace(/\D/g, "").slice(0, 6);
      if (digits.length) {
        setOtpError(false);
        setOtpCode(digits);
      }
    } catch {
      // ignore
    }
  };

  const handleSubmit = async () => {
    if (isVerifyingRef.current) return false;
    if (otpCode.length < 6) {
      setOtpError(true);
      showError("Please enter a valid 6-digit code");
      return false;
    }
    setOtpError(false);
    Keyboard.dismiss();
    isVerifyingRef.current = true;
    try {
      const res: any = await dispatch(
        verifyUser({ email_or_phone: getVerifySignId(), otp: otpCode, type: selectedAuthMethod }) as any
      );
      if (res && res.success === false) {
        setOtpError(true);
        // After a wrong OTP once, require user to press Next for subsequent attempts
        autoSubmitEnabled.current = false;
        return false;
      }
      return true;
    } finally {
      isVerifyingRef.current = false;
    }
  };

  // Auto-submit on 6th digit for first attempt only.
  useEffect(() => {
    if (!pending2FA) return;
    if (!autoSubmitEnabled.current) return;
    if (showButtonLoading || isVerifyingRef.current) return;
    if (otpCode.length !== 6) return;

    (async () => {
      await handleSubmit();
    })();
  }, [otpCode, selectedAuthMethod, pending2FA, showButtonLoading]);

  const getMaskedEmail = (): string => {
    const signId = getVerifySignId() || "";
    if (!signId) return "";
    if (signId.includes("@")) {
      const [local, domain] = signId.split("@");
      if (!local?.length) return signId;
      return `${local[0]}****@${domain || ""}`;
    }
    if (signId.length >= 4) return `${signId.slice(0, 2)}****${signId.slice(-2)}`;
    return "****";
  };

  // All methods for the options sheet (including the currently selected one)
  const methodsForOptions = pending2FA?.availableMethods ?? [];

  // Show all methods, but we still need a flag if there are others besides the selected
  const hasAlternative = methodsForOptions.length > 1;

  const optionsSheetHeight = Math.min(
    Math.max(180, 124 + 56 * methodsForOptions.length),
    winHeight * 0.6
  );

  if (!pending2FA) return null;

  return (
    <AppSafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AuthHeader
            onSupportPress={() => Linking.openURL("https://agce.wrathcode.com/help_center").catch(() => { })}
            onClosePress={onClose}
            title={""}
          />

          <>
            <AppText weight={SEMI_BOLD} type={TWENTY_SIX} style={[styles.title, { color: themeColors.text }]}>
              {selectedAuthMethod === 4 ? "Passkey Authentication"
                : selectedAuthMethod === 2 ? "Authenticator Verification"
                  : (pending2FA?.loginSignId && !String(pending2FA.loginSignId).includes('@') && /^[\+\d\s\-\(\)]+$/.test(String(pending2FA.loginSignId)))
                    ? "Verify Your Phone"
                    : "Verify Your Email"}
            </AppText>
            <AppText type={TWELVE} style={[styles.description, { color: themeColors.secondaryText }]}>
              {selectedAuthMethod === 4
                ? "Authenticate using Face ID, Touch ID, or your device biometrics."
                : selectedAuthMethod === 2
                  ? "Enter the 6-digit code from your authenticator app."
                  : `The verification code has been sent to your ${(pending2FA?.loginSignId && !String(pending2FA.loginSignId).includes('@') && /^[\+\d\s\-\(\)]+$/.test(String(pending2FA.loginSignId))) ? "phone" : "email"} ${getMaskedEmail()}, valid for 10 minutes.`}
            </AppText>
          </>

          {selectedAuthMethod === 4 ? (
            <View style={styles.passkeyContainer}>
              <FastImage
                source={passkey_login}
                style={styles.passkeyIcon}
                resizeMode="contain"
                tintColor={themeColors.text}
              />
              <AppText type={FOURTEEN} style={[styles.passkeyHint, { color: themeColors.secondaryText }]}>
                Use your registered biometrics (Face ID, Touch ID, or fingerprint) to authenticate.
              </AppText>
              <Button
                children="Authenticate with Passkey"
                disabled={isLoading}
                onPress={() => dispatch(verifyPasskeyLogin(pending2FA.loginSignId, false))}
                loading={isLoading}
                containerStyle={styles.submitBtn}
              />
            </View>
          ) : (
            <>
              <OtpInput6Digit
                ref={otpInputRef}
                value={otpCode}
                onChangeText={(v: string) => {
                  if (otpError) setOtpError(false);
                  setOtpCode(v);
                }}
                isDark={isDark}
                hasError={otpError}
              />
              {selectedAuthMethod === 1 || selectedAuthMethod === 2 || selectedAuthMethod === 3 ? (
                <View
                  style={[
                    styles.otpLinksRow,
                    selectedAuthMethod === 2 && { justifyContent: "flex-end" },
                  ]}
                >
                  {(selectedAuthMethod === 1 || selectedAuthMethod === 3) && (
                    <TouchableOpacityView
                      onPress={resendTimer > 0 ? undefined : handleGetOtp}
                      disabled={resendTimer > 0}
                    >
                      <AppText
                        type={FOURTEEN}
                        weight={MEDIUM}
                        style={[
                          { color: resendTimer > 0 ? themeColors.secondaryText : themeColors.text },
                        ]}
                      >
                        {resendTimer > 0 ? `Resend (${resendTimer}s)` : "Resend"}
                      </AppText>
                    </TouchableOpacityView>
                  )}

                  <TouchableOpacityView onPress={handlePasteOtp} style={styles.pasteBtn}>
                    <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: themeColors.text }}>
                      Paste
                    </AppText>
                    <FastImage
                      source={pasteImg}
                      resizeMode="contain"
                      style={{ width: 16, height: 16 }}
                      tintColor={themeColors.text}
                    />
                  </TouchableOpacityView>
                </View>
              ) : null}
              <Button
                children="Next"
                disabled={false}
                onPress={handleSubmit}
                loading={showButtonLoading}
                containerStyle={styles.submitBtn}
              />
            </>
          )}

          {hasAlternative ? (
            <TouchableOpacityView onPress={() => optionsSheetRef.current?.open()} style={styles.switchRow}>
              <AppText type={FOURTEEN_CONST} weight={SEMI_BOLD} style={[styles.underlineText, { color: themeColors.text }]}>
                Switch verification method{' '}
              </AppText>
              <FastImage source={SHARE_NEW_ICON} style={{ width: 15, height: 15 }} tintColor={themeColors.text} resizeMode="contain" />
            </TouchableOpacityView>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <RBSheet
        ref={optionsSheetRef}
        height={optionsSheetHeight}
        closeOnDragDown={false}
        closeOnPressMask={true}
        customStyles={sheetCustomStyles}
      >
        <View style={sheetStyles.wrap}>
          <View style={sheetStyles.header}>
            <View>
              <AppText weight={BOLD} type={SIXTEEN} style={{ color: themeColors.text }}>
                Select a Verification Option
              </AppText>
              <AppText type={THIRTEEN} style={{ marginTop: 4, color: themeColors.secondaryText }}>
                Choose how you want to verify your identity
              </AppText>
            </View>
            <TouchableOpacity onPress={() => optionsSheetRef.current?.close()} style={[sheetStyles.closeBtn, { borderColor: themeColors.border }]}>
              <FastImage source={closeIcon} resizeMode="contain" tintColor={themeColors.text} style={{ width: 10, height: 10 }} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} style={sheetStyles.scroll}>
            {methodsForOptions?.map((method: any) => (
              <TouchableOpacityView
                key={method?.type}
                onPress={() => {
                  // If the user selects the already active method, just close the sheet
                  if (method.type !== selectedAuthMethod) {
                    setSelectedAuthMethod(method.type);
                    setOtpCode("");
                    setResendTimer(0);
                  }
                  optionsSheetRef.current?.close();
                }}
                style={[sheetStyles.optionRow, { borderBottomColor: themeColors.border }]}
              >
                <View style={{ flexDirection: "row", justifyContent: 'space-between', alignItems: 'center', }}>
                  <View style={[sheetStyles.optionLeft, { flex: 1 }]}>
                    {method.type === 2 ? (
                      <FastImage source={KEY_ICON} style={{ width: 20, height: 20 }}
                        tintColor={themeColors.text}
                        resizeMode="contain" />
                    ) : typeof getMethodIcon(method.type) === "string" && getMethodIcon(method.type) !== "" ? (
                      <FastImage source={getMethodIcon(method.type) as any} style={{ width: 20, height: 20 }} resizeMode="contain" />
                    ) : (
                      <FastImage source={getMethodIcon(method.type)} resizeMode="contain" style={{ width: 20, height: 20 }} tintColor={themeColors.text} />
                    )}
                    <View style={{ marginLeft: 10 }}>
                      <AppText weight={SEMI_BOLD} type={FOURTEEN_CONST} style={{ color: themeColors.text }}>
                        {method.label || (method.type === 1 ? "Email OTP" : method.type === 2 ? "Authenticator" : method.type === 3 ? "Mobile OTP" : "Passkey")}
                      </AppText>
                      <AppText type={THIRTEEN} style={{ marginTop: 2, color: themeColors.secondaryText }}>
                        {method.description || (method.type === 1 ? "Receive verification codes via email" : method.type === 2 ? "Use Google Authenticator app" : method.type === 3 ? "Receive verification codes via SMS" : "Use Face ID, Touch ID, or Windows Hello")}
                      </AppText>
                    </View>
                  </View>
                  {method.type === selectedAuthMethod && (
                    <FastImage source={checkIc} style={{ width: 16, height: 16, right: 10 }} tintColor={themeColors.text} resizeMode="contain" />
                  )}
                </View>

              </TouchableOpacityView>
            ))}

          </ScrollView>
        </View>
      </RBSheet>

      <SpinnerSecond />
    </AppSafeAreaView>
  );
};

const AuthVerificationScreen = () => {
  const { colors: themeColors } = useTheme();
  const dispatch = useAppDispatch();
  const pending2FA = useAppSelector((state) => state.auth.pending2FA);

  useEffect(() => {
    if (!pending2FA) {
      NavigationService.navigate(LOGIN_SCREEN);
    }
  }, []);

  if (!pending2FA) return null;

  const handleClose = () => {
    dispatch(clearPending2FA());
    NavigationService.navigate(LOGIN_SCREEN);
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <AuthVerificationContent onClose={handleClose} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  title: {
    marginBottom: 8,
    marginTop: 10,
  },
  description: {
    marginBottom: 24,
  },
  submitBtn: {
    marginTop: 26,
    marginBottom: 0,
    width: "100%",
  },
  otpLinksRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  underlineText: {
    textDecorationLine: "underline",
  },
  pasteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  didntReceiveWrap: {
    alignSelf: "center",
    marginTop: 22,
  },
  switchRow: {
    marginTop: 26,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
  },
  passkeyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    width: "100%",
  },
  passkeyIcon: {
    width: 80,
    height: 80,
    marginBottom: 20,
  },
  passkeyHint: {
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 10,
  },
});

const sheetStyles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    marginVertical: 10
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  scroll: { flex: 1 },
  optionRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  optionLeft: {
    flexDirection: "row",
  },
});

export default AuthVerificationScreen;
