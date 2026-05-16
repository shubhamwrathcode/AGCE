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
} from "react-native";
import RBSheet from "react-native-raw-bottom-sheet";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { clearPending2FA } from "../../slices/authSlice";
import { sendLoginOtp, verifyUser } from "../../actions/authActions";
import NavigationService from "../../navigation/NavigationService";
import { LOGIN_SCREEN } from "../../navigation/routes";
import { AppText, AppSafeAreaView, Button, BOLD, FOURTEEN as FOURTEEN_CONST, SEMI_BOLD, THIRTEEN, EIGHTEEN, SIXTEEN, MEDIUM, TWENTY_SIX, TWELVE, FOURTEEN } from "../../shared";
import { colors } from "../../theme/colors";
import FastImage from "react-native-fast-image";
import { closeIcon, EMAIL, PHONE, KEY_ICON, pasteImg, SHARE_NEW_ICON } from "../../helper/ImageAssets";
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
    case 2: return "";
    case 3: return PHONE;
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

  const getFirstMethod = () => {
    if (!pending2FA) return 1;
    const baseMethods = (pending2FA.availableMethods ?? []).filter((m: any) => m.type !== 4);
    const has = (t: number) => baseMethods.some((m: any) => m.type === t);
    const loginSignId = (pending2FA.loginSignId ?? "").trim();
    const loggedInWithEmail = loginSignId.includes("@");

    if (loggedInWithEmail && has(1)) return 1;
    if (!loggedInWithEmail && loginSignId && has(3)) return 3;

    const dm = Number(pending2FA.defaultMethod);
    if (Number.isFinite(dm) && dm !== 4 && has(dm)) return dm;

    if (has(1)) return 1;
    if (has(3)) return 3;
    if (has(2)) return 2;
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

  const lastAutoSentForMethod = useRef<number | null>(null);
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

  useEffect(() => {
    if (pending2FA) {
      const firstMethod = getFirstMethod();
      const baseMethods = pending2FA.availableMethods ?? [];

      setSelectedAuthMethod(firstMethod);
      setOtpCode("");
      setOtpError(false);
      prevSelectedMethod.current = firstMethod;
      autoSubmitEnabled.current = true;
      if (firstMethod !== 1 && firstMethod !== 3) {
        setResendTimer(0);
      }

      if ((firstMethod === 1 || firstMethod === 3) && lastAutoSentForMethod.current !== firstMethod) {
        const signId = pending2FA.loginSignId ?? "";
        const m = baseMethods?.find((x: any) => x.type === firstMethod);
        const identifier = m?.value ?? signId;
        if (identifier) {
          lastAutoSentForMethod.current = firstMethod;
          const sendTo = firstMethod === 3 ? "mobile" : "email";
          setResendTimer(60);
          dispatch(sendLoginOtp(identifier, sendTo, setResendTimer));
        }
      }
    }
  }, [pending2FA]);

  // Auto-send OTP when user switches between Email/Phone methods (no need to press Resend).
  useEffect(() => {
    if (!pending2FA) return;
    if (prevSelectedMethod.current === selectedAuthMethod) return;

    // Reset input when switching methods
    setOtpCode("");
    setOtpError(false);

    // Allow re-auto-send when switching back later
    lastAutoSentForMethod.current = null;
    // Re-enable auto-submit on a fresh method switch
    autoSubmitEnabled.current = true;

    if (selectedAuthMethod === 1 || selectedAuthMethod === 3) {
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
      default: return "Verification";
    }
  };

  const getVerificationDescription = (): string => {
    const method = pending2FA?.availableMethods?.find((m: any) => m.type === selectedAuthMethod);
    const masked = method?.maskedValue;
    if (selectedAuthMethod === 1) return `Enter the 6-digit verification code sent to ${masked || "your email"}.`;
    if (selectedAuthMethod === 2) return "Enter the 6-digit code from your authenticator app.";
    if (selectedAuthMethod === 3) return `Enter the 6-digit verification code sent to ${masked || "your phone"}.`;
    return "Enter your verification code.";
  };

  const getInputLabel = (): string => {
    switch (selectedAuthMethod) {
      case 1: return "Email Verification Code";
      case 2: return "Authenticator Code";
      case 3: return "Phone Verification Code";
      default: return "Verification Code";
    }
  };

  const handleGetOtp = () => {
    const sendTo = selectedAuthMethod === 3 ? "mobile" : "email";
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

  const methodsForOptions = (pending2FA?.availableMethods ?? []).filter((m: any) => m.type !== 4);

  const alternativeMethods = (methodsForOptions ?? []).filter((m: any) => m.type !== selectedAuthMethod);
  const hasAlternative = alternativeMethods.length > 0;

  const optionsSheetHeight = Math.min(
    Math.max(180, 124 + 56 * alternativeMethods.length),
    winHeight * 0.6
  );

  if (!pending2FA) return null;

  return (
    <AppSafeAreaView style={{ flex: 1, backgroundColor: themeColors.background }}>
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
              {selectedAuthMethod === 1 ? "Verify Your Email" : selectedAuthMethod === 3 ? "Verify Your Phone" : getVerificationTitle()}
            </AppText>
            <AppText type={TWELVE} style={[styles.description, { color: themeColors.secondaryText }]}>
              {selectedAuthMethod === 1 || selectedAuthMethod === 3
                ? `The verification code has been sent to your ${selectedAuthMethod === 1 ? "email" : "phone"} ${getMaskedEmail()}, valid for 10 minutes.`
                : getVerificationDescription()}
            </AppText>
          </>

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
            {selectedAuthMethod !== 2 ? (
              <View style={styles.otpLinksRow}>
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

            {/* {selectedAuthMethod !== 2 ? (
              <TouchableOpacityView
                style={styles.didntReceiveWrap}
                onPress={resendTimer > 0 ? undefined : handleGetOtp}
                disabled={resendTimer > 0}
              >
                <AppText
                  type={FOURTEEN_CONST}
                  weight={SEMI_BOLD}
                  style={[
                    styles.underlineText,
                    { color: resendTimer > 0 ? themeColors.secondaryText : themeColors.text },
                  ]}
                >
                  Didn't receive the code?
                </AppText>
              </TouchableOpacityView>
            ) : null} */}
          </>

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
            {alternativeMethods?.map((method: any) => (
              <TouchableOpacityView
                key={method?.type}
                onPress={() => {
                  setSelectedAuthMethod(method.type);
                  optionsSheetRef.current?.close();
                  setOtpCode("");
                  setResendTimer(0);
                }}
                style={[sheetStyles.optionRow, { borderBottomColor: themeColors.border }]}
              >
                <View style={sheetStyles.optionLeft}>
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
