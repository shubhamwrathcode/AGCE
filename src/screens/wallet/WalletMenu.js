import { TouchableOpacity, View } from "react-native";
import { AppText, BLACK, FOURTEEN, SEMI_BOLD } from "../../shared";
import FastImage from "react-native-fast-image";
import {
  arbitary,
  buySellDarkIcon,
  buySellIcon,
  convertIcon,
  convertIconDark,
  newDepositDarkIcon,
  newDepositIcon,
  newWidthrawDarkIcon,
  newWidthrawIcon,
  transferDarkIcon,
  transferIcon,
  walletIcon,
} from "../../helper/ImageAssets";
import NavigationService from "../../navigation/NavigationService";
import {
  ARBITORY_SCREEN,
  CONVERT_SCREEN,
  DEPOSIT_WALLET_SCREEN,
  TRANSFER_SCREEN,
  WALLET_WITHDRAW_SCREEN,
  WITHDRAW_Coin_SCREEN,
} from "../../navigation/routes";
import { useRef } from "react";
import DepositSheet from "../../shared/components/DepositSheet";
import RBSheet from "react-native-raw-bottom-sheet";
import { colors } from "../../theme/colors";
import WithdrawSheet from "../../shared/components/WithdrawSheet";

import { useTheme } from "../../hooks/useTheme";

const WalletMenu = ({ onDeposit, onWithdraw }) => {
  const { colors: themeColors, theme } = useTheme();

  return (
    <View
      style={{
        marginTop: 8,
        backgroundColor: theme !== "Dark" ? themeColors.themeElevationColor : "transparent",
        paddingVertical: 10,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          // justifyContent: "space-around",
          justifyContent: "space-between",
          // gap: 20,
          marginTop: 10,
          paddingHorizontal: 20,
        }}
      >
        <TouchableOpacity
          style={{ alignItems: "center" }}
          onPress={onDeposit}
        >
          <FastImage
            source={theme !== 'Dark' ? newDepositIcon : newDepositDarkIcon}
            resizeMode="contain"
            style={{ width: 25, height: 25 }}
          />
          <AppText style={{ marginTop: 5 }}>
            Deposit
          </AppText>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ alignItems: "center" }}
          onPress={onWithdraw}
        >
          <FastImage
            source={theme !== 'Dark' ? newWidthrawIcon : newWidthrawDarkIcon}
            resizeMode="contain"
            style={{ width: 25, height: 25 }}
          />
          <AppText style={{ marginTop: 5 }}>
            Withdraw
          </AppText>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ alignItems: "center" }}
          onPress={() => NavigationService.navigate(CONVERT_SCREEN)}
        >
          <FastImage
            source={theme !== "Dark" ? convertIconDark : convertIcon}
            resizeMode="contain"
            style={{ width: 25, height: 25 }}
          />
          <AppText style={{ marginTop: 5 }}>
            Swap
          </AppText>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ alignItems: "center" }}
          onPress={() => NavigationService.navigate(TRANSFER_SCREEN)}
        >
          <FastImage
            source={theme !== 'Dark' ? transferDarkIcon : transferIcon}
            tintColor={theme !== 'Dark' ? colors.black : colors.white}
            resizeMode="contain"
            style={{ width: 25, height: 25 }}
          />
          <AppText style={{ marginTop: 5 }}>
            Transfer
          </AppText>
        </TouchableOpacity>
      </View>

    </View>
  );
};

export default WalletMenu;
