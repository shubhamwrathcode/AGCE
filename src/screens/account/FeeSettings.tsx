import React, { useState } from 'react';
import {
  AppSafeAreaView,
  AppText,
  FOURTEEN,
  SEMI_BOLD,
  SIXTEEN,
  TEN,
  Toolbar,
} from '../../shared';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import KeyBoardAware from '../../shared/components/KeyboardAware';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';
import {
  borderWidth,
  universalPaddingHorizontal,
  universalPaddingTop,
  universalPaddingVertical,
} from '../../theme/dimens';
import { Switch } from 'react-native-switch';
import { setFeeSetting } from '../../actions/accountActions';

const FeeSettings = () => {
  const dispatch = useAppDispatch();
  const userData = useAppSelector(state => state.auth.userData);

  const { fee_setting } = userData ?? '';
  const [isEnabled, setIsEnabled] = useState(fee_setting);
  const onChangeFeeSetting = (value: boolean) => {
    setIsEnabled(value);
    let data = { type: value };
    dispatch(setFeeSetting(data));
  };
  return (
    <AppSafeAreaView>
      <Toolbar isSecond title={'FEE Settings'} />
      <KeyBoardAware>
        <AppText type={SIXTEEN} weight={SEMI_BOLD} style={styles.title}>
          Pay trading fees with Zillion Exchange
        </AppText>
        <View style={styles.divider} />
        <View style={styles.container}>
          <View style={styles.headingContainer}>
            <AppText>Enable this option to pay trading fee with :</AppText>
            <Switch
              value={isEnabled}
              onValueChange={val => onChangeFeeSetting(val)}
              circleSize={18}
              barHeight={22}
              circleBorderWidth={0}
              backgroundActive={colors.buttonBg}
              backgroundInactive={colors.radio_in_active}
              circleActiveColor={colors.white}
              circleInActiveColor={colors.white}
              changeValueImmediately={true} // if rendering inside circle, change state immediately or wait for animation to complete
              renderActiveText={false}
              renderInActiveText={false}
              innerCircleStyle={{}}
              switchLeftPx={3}
              switchRightPx={3}
            />
          </View>
          <View style={styles.infoContainer}>
            <View style={styles.indicator} />
            <AppText type={TEN}>Zillion Exchange buy from the exchange</AppText>
          </View>
          <View style={styles.infoContainer}>
            <View style={styles.indicator} />
            <AppText type={TEN}>
              Unlocked Zillion Exchange balance reserved for trading fees
            </AppText>
          </View>
          <AppText style={styles.note}>
            Note : Enabling this feature allows you to pay trading fees with K
            Exchange, BTC , ETH markets
          </AppText>
        </View>
        <View style={[styles.container, styles.note]}>
          <AppText>
            Based on your Zillion Exchange holdings at the time of the trade, your
            trading fee rate will be determined as follows :
          </AppText>
          <View style={styles.fillContainer}>
            <View style={styles.fillHeading}>
              <AppText type={FOURTEEN}>Zillion Exchange holdings</AppText>
            </View>
            <View style={styles.fillHeading}>
              <AppText type={FOURTEEN}>Trading Fee Payable</AppText>
            </View>
          </View>
          <View style={styles.rowViewSettings}>
            <View style={styles.flexview}>
              <AppText type={FOURTEEN} style={styles.title1}>
                TRADE
              </AppText>
            </View>
            <View style={styles.flexview}>
              <AppText type={FOURTEEN} style={styles.title1}>
                0.2%
              </AppText>
            </View>
          </View>
          <View style={styles.rowViewSettings}>
            <View style={styles.flexview}>
              <AppText type={FOURTEEN} style={styles.title1}>
                DEPOSIT CRYPTO
              </AppText>
            </View>
            <View style={styles.flexview}>
              <AppText type={FOURTEEN} style={styles.title1}>
                0.15%
              </AppText>
            </View>
          </View>
          <View style={styles.rowViewSettings}>
            <View style={styles.flexview}>
              <AppText type={FOURTEEN} style={styles.title1}>
                DEPOSIT INR
              </AppText>
            </View>
            <View style={styles.flexview}>
              <AppText type={FOURTEEN} style={styles.title1}>
                0.19%
              </AppText>
            </View>
          </View>
        </View>
      </KeyBoardAware>
    </AppSafeAreaView>
  );
};

export default FeeSettings;
const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white_fifteen,
    padding: universalPaddingHorizontal,
    borderWidth: borderWidth,
    borderColor: colors.inputBorder,
    borderRadius: 10,
  },
  title: {
    marginTop: universalPaddingTop,
  },
  divider: {
    height: borderWidth,
    backgroundColor: colors.inputBorder,
    marginVertical: 15,
  },
  headingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  indicator: {
    height: 3,
    width: 15,
    backgroundColor: colors.buttonBg,
    borderRadius: 2,
    marginEnd: 5,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  note: {
    marginTop: 15,
  },
  rowViewSettings: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  title1: {
    marginStart: 10,
  },
  flexview: {
    height: 40,
    flex: 0.5,
    borderWidth: 0.5,
    borderColor: colors.thirdBg,
    justifyContent: 'center',
  },
  fillContainer: {
    flexDirection: 'row',
    backgroundColor: colors.thirdBg,
    padding: universalPaddingVertical,
  },
  fillHeading: {
    flex: 1,
  },
});
