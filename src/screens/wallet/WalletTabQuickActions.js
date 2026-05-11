import React from "react";
import { TouchableOpacity, View } from "react-native";
import FastImage from "react-native-fast-image";
import { AppText, MEDIUM, SEMI_BOLD, TWELVE } from "../../shared";
import { colors } from "../../theme/colors";
import {
  buyCrypto,
  earningMenuDarkIcon,
  earningMenuIcon,
  futuresIcon,
  history,
  historyIcon,
  newDepositDarkIcon,
  newDepositIcon,
  newWidthrawDarkIcon,
  newWidthrawIcon,
  p2pIcon,
  swapHistory,
  swap as swapIconDark,
  swapLight as swapIconLight,
  walletTransferIcon,
  walletTransferIconLight,
} from "../../helper/ImageAssets";

/**
 * Resolve icon for wallet tab quick actions (ProfileDrawer-style assets).
 * `variant` can be explicit or falls back to `key` when it matches a known name.
 */
function iconSourceForVariant(variant, theme) {
  const isDark = theme === "Dark";
  switch (variant) {
    case "deposit":
      return isDark ? newDepositDarkIcon : newDepositIcon;
    case "withdraw":
      return isDark ? newWidthrawDarkIcon : newWidthrawIcon;
    case "transfer":
      return theme !== "Dark" ? swapIconLight : swapIconLight;
    case "history":
      return history;
    case "buyCrypto":
      return buyCrypto;
    case "p2p":
      return p2pIcon;
    case "swap":
      return theme !== "Dark" ? swapIconLight : swapIconDark;
    case "earning":
      return isDark ? earningMenuDarkIcon : earningMenuIcon;
    case "futures":
      return futuresIcon;
    default:
      return null;
  }
}

/**
 * Icon + label row (left-aligned), same layout as Wallet Overview quick actions.
 * @param {{ theme: string, themeColors: object, items: Array<{ key: string, label: string, onPress: () => void, variant?: string }> }} props
 */
const WalletTabQuickActions = ({ theme, themeColors, items }) => {
  if (!Array.isArray(items) || items.length === 0) return null;
  const isDark = theme === "Dark";
// console.log(items,'==items');

   

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "flex-start",
        flexWrap: "wrap",
        marginTop: 12,
        gap: 18,
      }}
    >
      {items.map((item) => {
        const variant = item.variant || item.key;
        const src = iconSourceForVariant(variant, theme);
        if (!src) return null;
        return (
          <TouchableOpacity
            key={item.key}
            onPress={item.onPress}
            activeOpacity={0.78}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            style={{ alignItems: "center", width: 64, paddingHorizontal: 2 ,}}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: isDark ? "#2B2D33" : "#EFEFF1",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FastImage
                source={src}
                style={{ width:24, height: 24 }}
                resizeMode="contain"
                tintColor={colors.black}
              />
            </View>
            <AppText
              type={TWELVE}
              weight={MEDIUM}
              numberOfLines={2}
              style={{
                marginTop: 6,
                textAlign: "center",
                color: themeColors.text,
                width: "100%",
              }}
            >
              {item.label}
            </AppText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default WalletTabQuickActions;
