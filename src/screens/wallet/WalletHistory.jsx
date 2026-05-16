import React from 'react';
import {
  AppSafeAreaView,
  AppText,
  GREEN,
  NORMAL,
  SECOND,
  SEMI_BOLD,
  TEN,
  Toolbar,
} from '../../shared';
import { useTheme } from '../../hooks/useTheme';
import { useAppSelector } from '../../store/hooks';
import KeyBoardAware from '../../shared/components/KeyboardAware';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';
import {
  borderWidth,
  universalPaddingHorizontal,
  universalPaddingTop,
} from '../../theme/dimens';
import {
  dateFormatter,
  depositWithdrawColor,
  statusColor,
  toFixedThree,
} from '../../helper/utility';
import { bitcoin_ic, HomeBg } from '../../helper/ImageAssets';
import FastImage from 'react-native-fast-image';

const WalletHistory = () => {
  const { colors: themeColors, isDark } = useTheme();

  return (
    <AppSafeAreaView style={{ backgroundColor: themeColors.background }}>
      <Toolbar isSecond title={'Wallet History'} />
      <KeyBoardAware>
        <View style={styles.container}>
          <View style={{ marginTop: 10 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                // marginBottom: 20,
                borderBottomColor: colors.textGray,
                borderBottomWidth: 0.5,
                paddingBottom: 10
              }}

            >
              <View style={{ flex: 1, flexDirection: 'row' }}>
                <FastImage
                  source={bitcoin_ic}
                  resizeMode="contain"
                  style={{
                    height: 30,
                    width: 30,
                    marginEnd: 10,
                  }}
                />
                <View>
                  <AppText>{'BTC'}</AppText>
                  <AppText type={TEN} color={SECOND}>
                    {'11 Nov, 2022  04:23'}
                  </AppText>
                </View>
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <AppText weight={SEMI_BOLD} color={GREEN}>
                  Deposit
                </AppText>
                <AppText numberOfLines={1} color={SECOND}>
                  ${545}
                </AppText>
              </View>
            </View>
          </View>
          <View style={{ marginTop: 10 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                // marginBottom: 20,
                borderBottomColor: colors.textGray,
                borderBottomWidth: 0.5,
                paddingBottom: 10
              }}

            >
              <View style={{ flex: 1, flexDirection: 'row' }}>
                <FastImage
                  source={bitcoin_ic}
                  resizeMode="contain"
                  style={{
                    height: 30,
                    width: 30,
                    marginEnd: 10,
                  }}
                />
                <View>
                  <AppText>{'BTC'}</AppText>
                  <AppText type={TEN} color={SECOND}>
                    {'11 Nov, 2022  04:23'}
                  </AppText>
                </View>
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <AppText weight={SEMI_BOLD} color={GREEN}>
                  Deposit
                </AppText>
                <AppText numberOfLines={1} color={SECOND}>
                  ${545}
                </AppText>
              </View>
            </View>
          </View>

        </View>
      </KeyBoardAware>
    </AppSafeAreaView>
  );
};

export default WalletHistory;
const styles = StyleSheet.create({
  container: {
    // backgroundColor: colors.white_fifteen,
    marginTop: universalPaddingTop,
  },
  //   itemContainer: {
  //     flexDirection: 'row',
  //     justifyContent: 'space-between',
  //     marginVertical: 10,
  //   },
  //   statusContainer: {
  //     borderRadius: 5,
  //     height: 25,
  //   },
});
