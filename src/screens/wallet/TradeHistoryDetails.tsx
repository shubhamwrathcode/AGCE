import React from 'react';
import {
  AppSafeAreaView,
  AppText,
  NORMAL,
  SECOND,
  SEMI_BOLD,
  TEN,
  Toolbar,
} from '../../shared';
import {useAppSelector} from '../../store/hooks';
import KeyBoardAware from '../../shared/components/KeyboardAware';
import {StyleSheet, View} from 'react-native';
import {colors} from '../../theme/colors';
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

const TradeHistoryDetails = () => {
  const selectedTradeHistory = useAppSelector(
    state => state.wallet.selectedTradeHistory,
  );
  const {
    amount,
    createdAt,
    currency,
    currency_id,
    fee,
    fee_type,
    order_type,
    price,
    quantity,
    side,
    tds,
    transaction_type,
    order_id,
  } = selectedTradeHistory ?? '';

  const data = [
    {
      id: '1',
      title: 'Amount',
      value: toFixedThree(amount),
    },
    {
      id: '3',
      title: 'Date & Time',
      value: dateFormatter(createdAt),
    },
    {
      id: '4',
      title: 'Currency',
      value: currency,
    },
    {
      id: '5',
      title: 'Currency ID',
      value: currency_id,
    },
    {
      id: '6',
      title: 'Transaction Fee',
      value: toFixedThree(fee),
    },
    {
      id: '7',
      title: 'Fee Type',
      value: fee_type,
    },
    {
      id: '8',
      title: 'Order Type',
      value: order_type,
    },
    {
      id: '9',
      title: 'Price',
      value: toFixedThree(price),
    },
    {
      id: '10',
      title: 'Quantity',
      value: toFixedThree(quantity),
    },
    {
      id: '11',
      title: 'Side',
      value: side,
    },
    {
      id: '12',
      title: 'TDS',
      value: toFixedThree(tds),
    },
    {
      id: '13',
      title: 'Transaction Type',
      value: transaction_type,
    },
    {
      id: '2',
      title: 'Transaction ID',
      value: order_id,
    },
    // {
    //   id: '14',
    //   title: 'Remarks',
    //   value: description,
    // },
  ];

  return (
    <AppSafeAreaView>
      <Toolbar isSecond title={''} />
      <KeyBoardAware>
        <View style={styles.container}>
          {data.map(e => {
            return e.value ? (
              <View style={styles.itemContainer} key={e.id}>
                <AppText type={TEN} color={SECOND}>
                  {e.title}
                </AppText>
                <AppText
                  weight={e.id === '1' ? SEMI_BOLD : NORMAL}
                  color={depositWithdrawColor(e.value)}>
                  {e.value}
                </AppText>
              </View>
            ) : (
              <></>
            );
          })}
        </View>
      </KeyBoardAware>
    </AppSafeAreaView>
  );
};

export default TradeHistoryDetails;
const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white_fifteen,
    marginTop: universalPaddingTop,
    padding: universalPaddingHorizontal,
    borderWidth: borderWidth,
    borderColor: colors.inputBorder,
    borderRadius: 10,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  statusContainer: {
    borderRadius: 5,
    height: 25,
  },
});
