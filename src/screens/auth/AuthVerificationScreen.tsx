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
} from "react-native";
import RBSheet from "react-native-raw-bottom-sheet";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { clearPending2FA } from "../../slices/authSlice";
import { sendLoginOtp, verifyUser, verifyPasskeyLogin } from "../../actions/authActions";
import NavigationService from "../../navigation/NavigationService";
import { LOGIN_SCREEN } from "../../navigation/routes";
import { AppText, AppSafeAreaView, Button, BOLD, FOURTEEN as FOURTEEN_CONST, SEMI_BOLD, THIRTEEN, EIGHTEEN, SIXTEEN } from "../../shared";
import { colors } from "../../theme/colors";
import FastImage from "react-native-fast-image";
import { back_ic, closeIcon, EMAIL, FINGERPRINT, PHONE, KEY_ICON, SHARE_NEW_ICON } from "../../helper/ImageAssets";
import TouchableOpacityView from "../../shared/components/TouchableOpacityView";
import { OtpInput6Digit } from "../../shared";
import { showError } from "../../helper/logger";
import QRCode from "react-native-qrcode-svg";
import { BASE_URL } from "../../helper/Constants";
import { SpinnerSecond } from "../../shared/components/SpinnerSecond";
import { useTheme } from "../../hooks/useTheme";

const getMethodIcon = (type: number) => {
  switch (type) {
    case 1: return EMAIL;
    case 2: return "";
    case 3: return PHONE;
    case 4: return FINGERPRINT;
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
    const baseMethods = pending2FA.availableMethods ?? [];
    const hasPasskey = baseMethods.some((m: any) => m.type === 4) || !!pending2FA?.data?.hasPasskey;
    const hasAuth = baseMethods.some((m: any) => m.type === 2);
    const hasEmail = baseMethods.some((m: any) => m.type === 1);
    const hasPhone = baseMethods.some((m: any) => m.type === 3);
    const loginSignId = (pending2FA.loginSignId ?? "").trim();
    const loggedInWithEmail = loginSignId.includes("@");
    let firstMethod = pending2FA.defaultMethod ?? 1;
    if (hasPasskey) firstMethod = 4;
    else if (hasAuth) firstMethod = 2;
    else if (loggedInWithEmail && hasEmail) firstMethod = 1;
    else if (!loggedInWithEmail && hasPhone) firstMethod = 3;
    else if (hasEmail) firstMethod = 1;
    else if (hasPhone) firstMethod = 3;
    return firstMethod;
  };

  const initialMethod = getFirstMethod();
  const [selectedAuthMethod, setSelectedAuthMethod] = useState(initialMethod);
  const [otpCode, setOtpCode] = useState("");
  const [resendTimer, setResendTimer] = useState((initialMethod === 1 || initialMethod === 3) ? 60 : 0);
  const [passkeyCancelledOrFailed, setPasskeyCancelledOrFailed] = useState(false);
  const [passkeyVerifying, setPasskeyVerifying] = useState(false);
  const optionsSheetRef = useRef<any>(null);
  const passkeyQRSheetRef = useRef<any>(null);

  const lastAutoSentForMethod = useRef<number | null>(null);
  const { height: winHeight } = useWindowDimensions();
  const passkeyQRSheetHeight = Math.min(winHeight * 0.9, 450);
  
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
      if (firstMethod !== 1 && firstMethod !== 3) {
        setResendTimer(0);
      }
      setPasskeyCancelledOrFailed(false);

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
    if (selectedAuthMethod === 4) return "Use your registered passkey to verify.";
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
    dispatch(sendLoginOtp(getVerifySignId(), sendTo, setResendTimer));
  };

  const handleSubmit = () => {
    if (otpCode.length < 6) {
      showError("Please enter a valid 6-digit code");
      return;
    }
    Keyboard.dismiss();
    dispatch(verifyUser({ email_or_phone: getVerifySignId(), otp: otpCode, type: selectedAuthMethod }));
  };

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

  const baseMethods = pending2FA?.availableMethods ?? [];
  const hasPasskeyInList = baseMethods.some((m: any) => m.type === 4);
  const methodsForOptions =
    pending2FA?.data?.hasPasskey && !hasPasskeyInList
      ? [{ type: 4, label: "Passkey", description: "Use Face ID, Touch ID, or Windows Hello" }, ...baseMethods]
      : baseMethods;
  
  const alternativeMethods = (methodsForOptions ?? []).filter((m: any) => m.type !== selectedAuthMethod);
  const hasAlternative = alternativeMethods.length > 0;
  
  const optionsSheetHeight = Math.min(
    Math.max(180, 124 + 56 * alternativeMethods.length),
    winHeight * 0.6
  );

  const hasAutoTriggeredPasskey = useRef(false);
  useEffect(() => {
    if (selectedAuthMethod !== 4) hasAutoTriggeredPasskey.current = false;
  }, [selectedAuthMethod]);

  useEffect(() => {
    if (!pending2FA || selectedAuthMethod !== 4 || passkeyCancelledOrFailed || passkeyVerifying || hasAutoTriggeredPasskey.current) return;
    hasAutoTriggeredPasskey.current = true;
    setPasskeyVerifying(true);
    dispatch(verifyPasskeyLogin(getVerifySignId()) as any)
      .then((ok: boolean) => {
        setPasskeyVerifying(false);
        if (!ok) setPasskeyCancelledOrFailed(true);
      })
      .catch(() => {
        setPasskeyVerifying(false);
        setPasskeyCancelledOrFailed(true);
      });
  }, [pending2FA, selectedAuthMethod, passkeyCancelledOrFailed, passkeyVerifying]);

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
          <View style={styles.navRow}>
            <TouchableOpacity onPress={onClose} style={styles.navBtn}>
              <FastImage source={back_ic} resizeMode="contain" style={styles.navIcon} tintColor={themeColors.text} />
            </TouchableOpacity>
          </View>

          {selectedAuthMethod !== 4 && (
            <>
              <AppText weight={BOLD} type={EIGHTEEN} style={[styles.title, { color: themeColors.text }]}>
                {getVerificationTitle()}
              </AppText>
              <AppText type={THIRTEEN} style={[styles.description, { color: themeColors.secondaryText }]}>
                {getVerificationDescription()}
              </AppText>
            </>
          )}

          {selectedAuthMethod === 4 ? (
            <View style={styles.passkeyPageWrap}>
              {passkeyCancelledOrFailed ? (
                <>
                  <AppText weight={BOLD} type={EIGHTEEN} style={[styles.passkeyPageTitle, { color: themeColors.text }]}>
                    Verify with passkey
                  </AppText>
                  {getMaskedEmail() ? (
                    <AppText type={THIRTEEN} style={[styles.passkeyPageEmail, { color: themeColors.secondaryText }]}>
                      {getMaskedEmail()}
                    </AppText>
                  ) : null}
                  <View style={styles.passkeyPageIconWrap}>
                    <FastImage
                      source={FINGERPRINT}
                      resizeMode="contain"
                      style={styles.passkeyPageIcon}
                      tintColor={themeColors.button}
                    />
                  </View>
                  <AppText type={THIRTEEN} style={[styles.passkeyPageMessage, { color: themeColors.secondaryText }]}>
                    Verification cancelled. Please try again or switch to another verification method.
                  </AppText>
                  <Button
                    children="Verify Again"
                    loading={passkeyVerifying}
                    disabled={passkeyVerifying}
                    onPress={async () => {
                      setPasskeyCancelledOrFailed(false);
                      setPasskeyVerifying(true);
                      const ok = await dispatch(verifyPasskeyLogin(getVerifySignId()));
                      setPasskeyVerifying(false);
                      if (!ok) setPasskeyCancelledOrFailed(true);
                    }}
                    containerStyle={StyleSheet.flatten([styles.passkeyBtn, { backgroundColor: themeColors.button }])}
                  />
                  {hasAlternative && (
                    <TouchableOpacityView onPress={() => optionsSheetRef.current?.open()} style={styles.passkeyPageSwitchRow}>
                      <AppText type={FOURTEEN_CONST} style={{ color: themeColors.button }}>
                        Switch to Another Verification Method{'  '}
                      </AppText>
                      <FastImage source={SHARE_NEW_ICON} style={{ width: 15, height: 15 }} tintColor={themeColors.button} resizeMode="contain" />
                    </TouchableOpacityView>
                  )}
                </>
              ) : (
                <>
                  <AppText weight={BOLD} type={EIGHTEEN} style={[styles.passkeyPageTitle, { color: themeColors.text }]}>
                    Verify with passkey
                  </AppText>
                  {getMaskedEmail() ? (
                    <AppText type={THIRTEEN} style={[styles.passkeyPageEmail, { color: themeColors.secondaryText }]}>
                      {getMaskedEmail()}
                    </AppText>
                  ) : null}
                  <View style={styles.passkeyPageIconWrap}>
                    <FastImage
                      source={FINGERPRINT}
                      resizeMode="contain"
                      style={styles.passkeyPageIcon}
                      tintColor={themeColors.button}
                    />
                  </View>
                  <AppText type={THIRTEEN} style={[styles.passkeyPageMessage, { color: themeColors.secondaryText }]}>
                    Use your fingerprint or face to sign in on this device.
                  </AppText>
                  <Button
                    children="Use fingerprint / Face"
                    loading={passkeyVerifying}
                    disabled={passkeyVerifying}
                    onPress={async () => {
                      setPasskeyVerifying(true);
                      const ok = await dispatch(verifyPasskeyLogin(getVerifySignId()));
                      setPasskeyVerifying(false);
                      if (!ok) setPasskeyCancelledOrFailed(true);
                    }}
                    containerStyle={StyleSheet.flatten([styles.passkeyBtn, { backgroundColor: themeColors.button }])}
                  />
                  {hasAlternative && (
                    <TouchableOpacityView onPress={() => optionsSheetRef.current?.open()} style={styles.passkeyPageSwitchRow}>
                      <AppText type={FOURTEEN_CONST} style={{ color: themeColors.button }}>
                        Switch to Another Verification Method{'  '}
                      </AppText>
                      <FastImage source={SHARE_NEW_ICON} style={{ width: 15, height: 15 }} tintColor={themeColors.button} resizeMode="contain" />
                    </TouchableOpacityView>
                  )}
                </>
              )}
            </View>
          ) : (
            <>
              <OtpInput6Digit
                label={getInputLabel()}
                value={otpCode}
                onChangeText={setOtpCode}
                isDark={isDark}
              />
              {selectedAuthMethod !== 2 && (
                <View style={styles.resendRow}>
                  {resendTimer > 0 ? (
                    <View style={{ alignItems: "flex-end", width: "100%" }}>
                      <AppText type={THIRTEEN} style={{ color: themeColors.secondaryText }}>
                        Resend ({resendTimer}s)
                      </AppText>
                    </View>
                  ) : (
                    <TouchableOpacityView onPress={handleGetOtp} style={{ alignItems: "flex-end", width: "100%" }}>
                      <AppText type={FOURTEEN_CONST} weight={SEMI_BOLD} style={{
                        color: themeColors.text,
                      }}>
                        Get OTP
                      </AppText>
                    </TouchableOpacityView>
                  )}
                </View>
              )}
              <Button
                children="Submit"
                disabled={otpCode.length < 6}
                onPress={handleSubmit}
                loading={showButtonLoading}
                containerStyle={styles.submitBtn}
              />
            </>
          )}

          {hasAlternative && selectedAuthMethod !== 4 && (
            <TouchableOpacityView onPress={() => optionsSheetRef.current?.open()} style={styles.linkRow}>
              <AppText type={FOURTEEN_CONST} style={{ color: themeColors.button }}>
                Switch to Another Verification Method{'  '}
              </AppText>
              <FastImage source={SHARE_NEW_ICON} style={{ width: 15, height: 15 }} tintColor={themeColors.button} resizeMode="contain" />
            </TouchableOpacityView>
          )}
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

      <RBSheet
        ref={passkeyQRSheetRef}
        height={passkeyQRSheetHeight}
        closeOnDragDown={false}
        closeOnPressMask={true}
        onClose={() => selectedAuthMethod === 4 && setPasskeyCancelledOrFailed(true)}
        customStyles={sheetCustomStyles}
      >
        <View style={[sheetStyles.wrap, styles.passkeyQRSheetContent]}>
          <View style={sheetStyles.header}>
            <AppText weight={BOLD} type={EIGHTEEN} style={{ color: themeColors.text }}>
              Passkeys
            </AppText>
            <TouchableOpacity onPress={() => passkeyQRSheetRef.current?.close()} style={[sheetStyles.closeBtn, { borderColor: themeColors.border }]}>
              <FastImage source={closeIcon} resizeMode="contain" tintColor={themeColors.text} style={{ width: 10, height: 10 }} />
            </TouchableOpacity>
          </View>
          <AppText type={FOURTEEN_CONST} style={{ marginBottom: 12, color: themeColors.text }}>
            Scan this QR code with the device that has your passkey
          </AppText>
          <View style={{ alignItems: "center", marginVertical: 16 }}>
            <QRCode
              value={`${BASE_URL.replace(/\/$/, "")}/v1/security/passkey/auth?signId=${encodeURIComponent(getVerifySignId())}`}
              size={200}
              backgroundColor={isDark ? "#fff" : "#000"}
              color={isDark ? "#000" : "#fff"}
            />
          </View>
          <TouchableOpacity onPress={() => passkeyQRSheetRef.current?.close()} style={{ paddingVertical: 12 }}>
            <AppText type={FOURTEEN_CONST} weight={SEMI_BOLD} style={{ color: themeColors.button }}>Cancel</AppText>
          </TouchableOpacity>
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
    paddingBottom: 40,
  },
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  navBtn: {
    padding: 5,
  },
  navIcon: {
    width: 20,
    height: 20,
  },
  title: {
    marginBottom: 8,
    marginLeft: 5
  },
  description: {
    marginBottom: 24,
    marginLeft: 5
  },
  resendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  submitBtn: {
    marginTop: 8,
    marginBottom: 24,
  },
  linkRow: {
    marginBottom: 12,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
  },
  passkeyPageWrap: {
    marginVertical: 24,
  },
  passkeyPageTitle: {
    marginBottom: 6,
    marginLeft: 5,
  },
  passkeyPageEmail: {
    marginBottom: 24,
    marginLeft: 5,
  },
  passkeyPageIconWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 28,
  },
  passkeyPageIcon: {
    width: 72,
    height: 72,
  },
  passkeyPageMessage: {
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  passkeyPageSwitchRow: {
    marginTop: 20,
    alignItems: "center",
    flexDirection: "row",
  },
  passkeyBtn: {
    width: "100%",
  },
  passkeyQRSheetContent: {
    paddingBottom: 44,
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
