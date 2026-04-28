import React from 'react';
import {AppSafeAreaView, Toolbar} from '../../shared';
import {StyleSheet} from 'react-native';
import {
  download_report_ic,
  fee_setting_ic,
  payment_options_ic,
  trade_setting_ic,
} from '../../helper/ImageAssets';
import KeyBoardAware from '../../shared/components/KeyboardAware';
import {SingleBox} from './Settings';
import {universalPaddingTop} from '../../theme/dimens';
import NavigationService from '../../navigation/NavigationService';
import {
  DOWNLOAD_TRADE_REPORT_SCREEN,
  FEE_SETTINGS_SCREEN,
  PAYMENT_OPTIONS_SCREEN,
  TRADE_SETTINGS_SCREEN,
} from '../../navigation/routes';
import {useAppSelector} from '../../store/hooks';
import {checkValue} from '../../helper/utility';

const BankingSettings = () => {
  const languages = useAppSelector(state => {
    return state.account.languages;
  });
  const DATA = [
    {
      id: '1',
      title: 'Payment Options',
      icon: payment_options_ic,
      onPress: () => NavigationService.navigate(PAYMENT_OPTIONS_SCREEN),
    },
    {
      id: '2',
      title: checkValue(languages?.bank_one),
      icon: trade_setting_ic,
      onPress: () => NavigationService.navigate(TRADE_SETTINGS_SCREEN),
    },
    {
      id: '3',
      title: checkValue(languages?.bank_two),
      icon: fee_setting_ic,
      onPress: () => NavigationService.navigate(FEE_SETTINGS_SCREEN),
    },
    {
      id: '4',
      title: checkValue(languages?.bank_three),
      icon: download_report_ic,
      onPress: () => NavigationService.navigate(DOWNLOAD_TRADE_REPORT_SCREEN),
    },
  ];
  return (
    <AppSafeAreaView>
      <Toolbar isSecond title={checkValue(languages?.bank_four)} />
      <KeyBoardAware style={styles.container}>
        {DATA?.map(e => {
          return <SingleBox key={e.id} item={e} />;
        })}
      </KeyBoardAware>
    </AppSafeAreaView>
  );
};

export default BankingSettings;
const styles = StyleSheet.create({
  container: {
    paddingTop: universalPaddingTop,
  },
});
