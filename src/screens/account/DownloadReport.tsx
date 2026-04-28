import React, {useState} from 'react';
import {
  AppSafeAreaView,
  AppText,
  Button,
  FOURTEEN,
  SEMI_BOLD,
  SIXTEEN,
  Toolbar,
} from '../../shared';
import KeyBoardAware from '../../shared/components/KeyboardAware';
import {StyleSheet, View} from 'react-native';
import {colors} from '../../theme/colors';
import {
  borderWidth,
  universalPaddingHorizontal,
  universalPaddingHorizontalHigh,
  universalPaddingTop,
} from '../../theme/dimens';
import {PickerSelect} from '../../shared/components/PickerSelect';
import {errorText, placeHolderText} from '../../helper/Constants';
import {dateRange} from '../../helper/dummydata';
import FastImage from 'react-native-fast-image';
import {arrowRightIcon} from '../../helper/ImageAssets';
import {showError} from '../../helper/logger';
import {useAppDispatch} from '../../store/hooks';
import {downLoadTradeReport} from '../../actions/accountActions';

const DownloadReport = () => {
  const dispatch = useAppDispatch();
  const [date, setDate] = useState('');
  const Data = [
    {
      key: 1,
      title: 'Exchange Trades',
    },
    {
      key: 2,

      title: 'STF Trades',
    },
    {
      key: 3,

      title: 'Current Coin Balance',
    },
    {
      key: 4,

      title: 'Deposit and Withdrawals',
    },
    {
      key: 5,

      title: 'Ledger History',
    },
    {
      key: 6,

      title: 'Airdrops and other distributions',
    },
  ];
  const onSubmit = () => {
    if (!date) {
      showError(errorText.tradeReport);
      return;
    }
    let data = {range: date};
    dispatch(downLoadTradeReport(data));
  };
  return (
    <AppSafeAreaView>
      <Toolbar isSecond title={'Download Trade Report'} />
      <KeyBoardAware>
        <AppText type={SIXTEEN} weight={SEMI_BOLD} style={styles.title}>
          Get your trading report on your email.
        </AppText>
        <View style={styles.divider} />
        <View style={styles.container}>
          <PickerSelect
            data={dateRange}
            value={date}
            onChange={setDate}
            placeholder={{label: placeHolderText.dateRange, value: ''}}
          />
          <AppText style={styles.title2} type={FOURTEEN}>
            The report will include:
          </AppText>
          {Data.map(e => {
            return (
              <View style={styles.singleContainer} key={e.key}>
                <FastImage
                  source={arrowRightIcon}
                  resizeMode="contain"
                  style={styles.arrow}
                />
                <AppText type={FOURTEEN}>{e.title}</AppText>
              </View>
            );
          })}
          <Button
            children="Request Trading Report"
            onPress={() => onSubmit()}
            containerStyle={styles.button}
          />
        </View>
      </KeyBoardAware>
    </AppSafeAreaView>
  );
};

export default DownloadReport;
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
  title2: {
    marginVertical: 15,
  },
  arrow: {
    height: 15,
    width: 15,
    marginEnd: 10,
  },
  singleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  button: {
    marginVertical: universalPaddingHorizontalHigh,
  },
});
