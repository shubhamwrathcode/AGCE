import React from "react";
import {
  AppSafeAreaView,
  AppText,
  BOLD,
  Button,
  EIGHTEEN,
  FOURTEEN,
  NORMAL,
  SEMI_BOLD,
} from "../../shared";
import { StyleSheet, View } from "react-native";
import { TIGER } from "../../helper/ImageAssets";
import FastImage from "react-native-fast-image";
import NavigationService from "../../navigation/NavigationService";
import { LOGIN_SCREEN, NAVIGATION_AUTH_STACK } from "../../navigation/routes";
import { colors } from "../../theme/colors";
import { useTheme } from "../../hooks/useTheme";
import { useRoute } from "@react-navigation/native";

const AccountActivated = () => {
  const { colors: themeColors } = useTheme();
  const route = useRoute();
  const isBlocked = route?.params?.mode === "blocked";

  return (
    <AppSafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <View style={styles.content}>
        <View style={styles.tigerWrapper}>
          <FastImage
            source={TIGER}
            resizeMode="contain"
            style={styles.tigerImage}
          />
        </View>
        <AppText
          type={EIGHTEEN}
          weight={BOLD}
          color={isBlocked ? "#9E4E5F" : themeColors.button}
          style={styles.welcomeTitle}
        >
          {isBlocked ? "Account Temporarily Blocked" : "Welcome to Zillion"}
        </AppText>
        {isBlocked ? (
          <>
            <AppText type={FOURTEEN} weight={SEMI_BOLD} style={[styles.bodyText, { color: "#8A8464" }]}>
              Your account has been blocked due to suspicious activity.
            </AppText>
            <AppText type={FOURTEEN} weight={SEMI_BOLD} style={[styles.bodyText, { color: "#9E4E5F" }]}>
              For security reasons, we have temporarily restricted access.
            </AppText>
            <AppText type={FOURTEEN} weight={SEMI_BOLD} style={[styles.bodyText, { color: "#C2A04A" }]}>
              If you believe this was done by mistake, please contact us at{" "}
              <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: "#2C6CB4" }}>
                support@wrathcode.com
              </AppText>
              .
            </AppText>
          </>
        ) : (
          <>
            <AppText
              type={FOURTEEN}
              weight={NORMAL}
              color={themeColors.text}
              style={styles.bodyText}
            >
              Thank you for choosing us !
            </AppText>
            <AppText
              type={FOURTEEN}
              weight={NORMAL}
              color={themeColors.text}
              style={styles.bodyText}
            >
              {`Your account has been successfully activated.\nPlease login with your credentials to access your account.`}
            </AppText>
            <AppText
              type={FOURTEEN}
              weight={SEMI_BOLD}
              style={[styles.happyTrading, { color: themeColors.button }]}
            >
              Happy Trading !!!
            </AppText>
          </>
        )}
        <Button
          children={isBlocked ? "Back to Login" : "Log In with Us"}
          onPress={() =>
            NavigationService.navigate(NAVIGATION_AUTH_STACK, {
              screen: LOGIN_SCREEN,
            })
          }
          containerStyle={[styles.loginButton, { backgroundColor: themeColors.button }]}
        />
      </View>
    </AppSafeAreaView>
  );
};

export default AccountActivated;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  tigerWrapper: {
    width: 350,
    height: 270,
    marginBottom: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  tigerImage: {
    width: 350,
    height: 270,
  },
  welcomeTitle: {
    textAlign: "center",
    marginBottom: 12,
    fontSize: 22,
  },
  bodyText: {
    textAlign: "center",
    marginBottom: 5,
    opacity: 0.95,
  },
  happyTrading: {
    textAlign: "center",
    marginTop: 5,
    marginBottom: 12,
    fontSize: 16,
  },
  loginButton: {
    width: "100%",
    marginTop: 16,
  },
});
