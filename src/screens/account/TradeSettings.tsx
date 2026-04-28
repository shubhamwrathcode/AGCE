import React, {useState} from 'react';
import {AppSafeAreaView, Toolbar} from '../../shared';
import KeyBoardAware from '../../shared/components/KeyboardAware';
import {StyleSheet} from 'react-native';
import {universalPaddingTop} from '../../theme/dimens';
import {SingleBoxNotificationSettings} from './NotificationSettings';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {setTradeSetting} from '../../actions/accountActions';

const TradeSettings = () => {
  const dispatch = useAppDispatch();
  const userData = useAppSelector(state => state.auth.userData);

  const {skip_buy_sell} = userData ?? '';
  const [isConfirm, setIsConfirm] = useState(skip_buy_sell);
  const onChangeTradeSettings = (value: boolean) => {
    setIsConfirm(value);
    let data = {type: value};
    dispatch(setTradeSetting(data));
  };
  return (
    <AppSafeAreaView>
      <Toolbar isSecond title={'Trade Settings'} />
      <KeyBoardAware style={styles.container}>
        <SingleBoxNotificationSettings
          title={'Skip buy / sell confirmation'}
          state={isConfirm}
          setState={onChangeTradeSettings}
        />
      </KeyBoardAware>
    </AppSafeAreaView>
  );
};

export default TradeSettings;
const styles = StyleSheet.create({
  container: {
    paddingTop: universalPaddingTop,
  },
});
