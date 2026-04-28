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

const AccountActivated = () => {
  const { colors: themeColors } = useTheme();

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
          color={themeColors.button}
          style={styles.welcomeTitle}
        >
          Welcome to Zillion
        </AppText>
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
        <Button
          children={"Log In with Us"}
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
