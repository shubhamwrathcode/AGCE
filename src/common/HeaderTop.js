import React, { useMemo } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import FastImage from "react-native-fast-image";
import {
  APP_LOGO,
  bell_ic,
  defaultPic,
  headPhoneIcon,
} from "../helper/ImageAssets";
import NavigationService from "../navigation/NavigationService";
import { NOTIFICATION_SCREEN } from "../navigation/routes";
import { useAppSelector } from "../store/hooks";
import { IMAGE_BASE_URL } from "../helper/Constants";
import { useTheme } from "../hooks/useTheme";
import { AppText, BOLD, EIGHTEEN, SIXTEEN } from "./AppText";
import { colors, lightTheme } from "../theme/colors";

/** Resolves profile path from API (relative path, full URL, or alternate field names). */
function resolveProfileSource(userData, fallback) {
  const raw =
    userData?.profilepicture ??
    userData?.profilePicture ??
    userData?.avatar ??
    userData?.profile_image;
  if (raw == null || typeof raw !== "string") return fallback;
  const trimmed = raw.trim();
  if (!trimmed) return fallback;
  if (/^https?:\/\//i.test(trimmed)) {
    return { uri: trimmed };
  }
  const base = IMAGE_BASE_URL.endsWith("/")
    ? IMAGE_BASE_URL.slice(0, -1)
    : IMAGE_BASE_URL;
  const path = trimmed.replace(/^\//, "");
  return { uri: `${base}/${path}` };
}

const HeaderTop = () => {
  const { colors: themeColors, isDark } = useTheme();
  const userData = useAppSelector((state) => state.auth.userData);
  const iconTint = isDark ? themeColors.text : "#000000";
  const titleColor = isDark ? themeColors.text : "#000000";

  const avatarSource = useMemo(
    () => resolveProfileSource(userData, defaultPic),
    [userData],
  );
  

  return (
    <View style={[styles.headerBar, ]}>
      <View style={styles.sideSlot}>
        <TouchableOpacity
          onPress={() => NavigationService.navigate("ProfileDrawer")}
          style={[styles.avatarContainer, { borderColor: themeColors.border }]}
        >
          <FastImage
            source={avatarSource}
            defaultSource={defaultPic}
            resizeMode="cover"
            style={styles.avatar}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.brandCenter}>
        <FastImage
          source={APP_LOGO}
          resizeMode="contain"
          style={styles.brandLogo}
        />
        <AppText
          weight={BOLD}
          type={SIXTEEN}
          style={[styles.brandTitle, { color: titleColor }]}
        >
          AGCE
        </AppText>
      </View>

      <View style={[styles.sideSlot, styles.sideRight]}>
        <TouchableOpacity
          onPress={() => NavigationService.navigate("Support")}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <FastImage
            source={headPhoneIcon}
            tintColor={iconTint}
            resizeMode="contain"
            style={styles.actionIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => NavigationService.navigate(NOTIFICATION_SCREEN)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
            <FastImage
            source={bell_ic}
            tintColor={iconTint}
            resizeMode="contain"
            style={styles.actionIcon}
          />
          
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default HeaderTop;

const styles = StyleSheet.create({
  headerBar: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 5,
    marginBottom: 8,
  },
  sideSlot: {
    width: 96,
    flexDirection: "row",
    alignItems: "center",
  },
  sideRight: {
    justifyContent: "flex-end",
    gap: 18,
  },
  avatarContainer: {
    width: 30,
    height: 30,
    borderRadius: 20,
    overflow: "hidden",
    alignItems:"center",
    justifyContent:"center",
    backgroundColor:lightTheme.input
  },
  avatar: {
    width: 40,
    height: 40,
  },
  brandCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    right:10
  },
  brandLogo: {
    width: 28,
    height: 28,
  },
  brandTitle: {
    letterSpacing: 0.5,
  },
  actionIcon: {
    width: 18,
    height: 18,
  },
});
