import React, {useState} from 'react';
import {AppSafeAreaView, AppText, SEMI_BOLD, Toolbar} from '../../shared';
import {StyleSheet, View} from 'react-native';
import KeyBoardAware from '../../shared/components/KeyboardAware';
import {colors} from '../../theme/colors';
import {
  borderWidth,
  universalPaddingHorizontal,
  universalPaddingHorizontalHigh,
  universalPaddingTop,
} from '../../theme/dimens';
import {Switch} from 'react-native-switch';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {setCommissionAlert, setPriceAlert} from '../../actions/accountActions';
import {checkValue} from '../../helper/utility';

export const SingleBoxNotificationSettings = ({title, state, setState}) => {
  return (
    <View style={styles.singleBox}>
      <AppText weight={SEMI_BOLD}>{title}</AppText>
      <Switch
        value={state}
        onValueChange={val => setState(val)}
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
  );
};

const NotificationSettings = () => {
  const dispatch = useAppDispatch();
  const userData = useAppSelector(state => state.auth.userData);
  const languages = useAppSelector(state => {
    return state.account.languages;
  });
  const {price_alert, commission_alert} = userData ?? '';
  const [isPrice, setIsPrice] = useState(price_alert);
  const [isCommission, setCommission] = useState(commission_alert);

  const onChangePriceAlert = (value: boolean) => {
    setIsPrice(value);
    let data = {type: value};
    dispatch(setPriceAlert(data));
  };

  const onChangeCommissionAlert = (value: boolean) => {
    setCommission(value);
    let data = {type: value};
    dispatch(setCommissionAlert(data));
  };
  return (
    <AppSafeAreaView>
      <Toolbar
        isSecond
        title={checkValue(languages?.notification_setting_one)}
      />
      <KeyBoardAware style={styles.container}>
        <SingleBoxNotificationSettings
          title={checkValue(languages?.notification_setting_two)}
          state={isPrice}
          setState={onChangePriceAlert}
        />
        <SingleBoxNotificationSettings
          title={checkValue(languages?.notification_setting_three)}
          state={isCommission}
          setState={onChangeCommissionAlert}
        />
      </KeyBoardAware>
    </AppSafeAreaView>
  );
};

export default NotificationSettings;
const styles = StyleSheet.create({
  singleBox: {
    backgroundColor: colors.inputBackground,
    paddingHorizontal: universalPaddingHorizontalHigh,
    marginVertical: 5,
    paddingVertical: universalPaddingHorizontal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: borderWidth,
    borderColor: colors.inputBorder,
    borderRadius: 10,
  },
  container: {
    paddingTop: universalPaddingTop,
  },
});
