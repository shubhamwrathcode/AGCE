import React, { useMemo, useState } from "react";
import { Linking, StyleSheet, View } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useRoute } from "@react-navigation/native";
import { AppSafeAreaView, AppText, BOLD, Button, ELEVEN, FOURTEEN, Input, SEMI_BOLD, SIXTEEN, THIRTEEN, TWELVE, TWENTY_SIX } from "../../shared";
import { AuthHeader } from "../../shared/components";
import NavigationService from "../../navigation/NavigationService";
import { showError } from "../../helper/logger";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { register, registerWithPhone } from "../../actions/authActions";
import { validatePasswordStrict } from "../../helper/utility";
import { useTheme } from "../../hooks/useTheme";
import FastImage from "react-native-fast-image";
import { checkIc, closeIcon, minus } from "../../helper/ImageAssets";
import { colors } from "../../theme/colors";

const RuleItem = ({ state, label, doneColor }) => {
  const isOk = state === "ok";
  const isBad = state === "bad";
  const isPending = state === "pending";
  return (
    <View style={styles.ruleRow}>
      <View
        style={[
          styles.ruleDot,
          {
            borderColor: isOk ? null : "#B8BDC7",
            backgroundColor: isOk ? doneColor : "transparent",
          },
        ]}
      >
        {isOk ? (
          <FastImage source={checkIc} style={{ width: 8, height: 8 }} tintColor="#FFFFFF" resizeMode="contain" />
        ) : null}
        {isBad ? <FastImage source={closeIcon} style={{ width: 7, height: 7 }} tintColor={colors.red} resizeMode="contain" /> : null}
        {isPending ? <FastImage source={minus} style={{ width: 12, height: 12 }} resizeMode="contain" /> : null}
      </View>
      <AppText type={THIRTEEN} style={{ color: "#9AA3AF" }}>
        {label}
      </AppText>
    </View>
  );
};

const SetPassword = () => {
  const route = useRoute();
  const dispatch = useAppDispatch();
  const { colors: themeColors } = useTheme();
  const languages = useAppSelector((state) => state.account.languages);
  const showButtonLoading = useAppSelector((state) => state.auth.isLoading && state.auth.loadingFor !== "otp");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(true);
  const [passwordError, setPasswordError] = useState(false);

  const params = route?.params || {};
  const {
    signupType = "email",
    signUpId = "",
    countryCode = ["91"],
    referCode = "",
  } = params;

  const usernamePart = useMemo(() => {
    if (signupType === "email") {
      const id = String(signUpId || "");
      return id.includes("@") ? id.split("@")[0] : id;
    }
    return String(signUpId || "");
  }, [signupType, signUpId]);

  const up = String(usernamePart || "").trim();
  const signupPasswordRules = useMemo(
    () => [
      {
        id: "notAllNumbers",
        label: "Cannot be all numbers",
        passes: (p) => p.length > 0 && !/^\d+$/.test(p),
        error: "Password cannot be only numbers.",
      },
      {
        id: "notAllLetters",
        label: "Cannot be all letters (case-sensitive)",
        passes: (p) => p.length > 0 && !/^[a-zA-Z]+$/.test(p),
        error: "Password cannot be only letters.",
      },
      {
        id: "minLength",
        label: "Minimum 8 characters required",
        passes: (p) => p.length >= 8,
        error: "Password must be at least 8 characters.",
      },
      {
        id: "notContainsUsername",
        label: "Cannot contain username",
        passes: (p) => !up || up.length < 2 || !p.toLowerCase().includes(up.toLowerCase()),
        error: "Password cannot contain your email username or phone number.",
      },
      {
        id: "complexity",
        label: "Uppercase, lowercase, number, and a special character (#?!@$%^&*-)",
        passes: (p) => validatePasswordStrict(p),
        error: "Use at least 8 characters with uppercase, lowercase, a number, and a special character (#?!@$%^&*-).",
      },
    ],
    [up]
  );

  const passwordRuleRowStates = useMemo(() => {
    const p = String(password || "");
    if (!p.trim()) return signupPasswordRules.map(() => "idle");
    const results = signupPasswordRules.map((r) => r.passes(p));
    const firstFail = results.findIndex((ok) => !ok);
    if (firstFail === -1) return signupPasswordRules.map(() => "ok");
    return signupPasswordRules.map((_, i) => {
      if (i < firstFail) return "ok";
      if (i === firstFail) return "bad";
      return "pending";
    });
  }, [password, signupPasswordRules]);

  const isReady = useMemo(() => {
    const p = String(password || "");
    if (!p.trim()) return false;
    return signupPasswordRules.every((r) => r.passes(p));
  }, [password, signupPasswordRules]);

  const onSubmit = () => {
    if (!isReady) {
      return;
    }

    setPasswordError(false);

    if (signupType === "email") {
      dispatch(
        register(
          {
            email: String(signUpId).trim(),
            password,
            referral_code: referCode || "",
            token: "",
          },
          () => { },
          () => { },
          () => { }
        )
      );
      return;
    }

    dispatch(
      registerWithPhone(
        {
          country_code: countryCode?.[0] ? `+${countryCode[0]}` : "+91",
          phone: +signUpId,
          password,
          referral_code: referCode || "",
          token: "",
        },
        () => { },
        () => { },
        () => { }
      )
    );
  };

  return (
    <AppSafeAreaView style={{ backgroundColor: themeColors.background }}>
      <View style={styles.wrap}>
        <AuthHeader
          onSupportPress={() => Linking.openURL("https://zillion.wrathcode.com/").catch(() => { })}
          onClosePress={() => NavigationService.goBack()}
        />

        <AppText weight={BOLD} type={TWENTY_SIX} style={{ color: themeColors.text, marginTop: 8 }}>
          Set Your Password
        </AppText>
        <AppText type={THIRTEEN} style={{ color: "#9AA3AF", marginTop: 6 }}>
          Set the password to complete the signup
        </AppText>
        <AppText color={themeColors.text} type={FOURTEEN} weight={SEMI_BOLD} style={{ marginTop: 10 }}>Password</AppText>
        <Input
          placeholder={"Enter a password"}
          value={password}
          onChangeText={(v) => {
            if (passwordError) setPasswordError(false);
            setPassword(v);
          }}
          secureTextEntry={isPasswordVisible}
          isSecure
          onPressVisible={() => setIsPasswordVisible(!isPasswordVisible)}
          autoCapitalize="none"
          containerStyle={styles.passwordInput}
          hasError={passwordError}
        />

        <View style={styles.rulesBox}>
          {signupPasswordRules.map((rule, idx) => (
            <RuleItem
              key={rule.id}
              state={passwordRuleRowStates[idx]}
              label={rule.label}
              doneColor={themeColors.button}
            />
          ))}
        </View>

        <Button
          children={"Confirm"}
          onPress={isReady ? onSubmit : undefined}
          activeOpacity={isReady ? 0.2 : 1}
          disabled={false}
          loading={showButtonLoading}
          containerStyle={{ marginTop: 28 }}
        />
      </View>
    </AppSafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  passwordInput: {
    marginTop: 8,
  },
  rulesBox: {
    marginTop: 6,
    gap: 8,
  },
  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ruleDot: {
    width: 15,
    height: 15,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
});

export default SetPassword;
