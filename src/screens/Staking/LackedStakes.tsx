import React, {useEffect, useState} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import {
  AppSafeAreaView,
  AppText,
  Button,
  FIFTEEN,
  FOURTEEN,
  TWELVE,
  Toolbar,
} from '../../shared';
import {colors} from '../../theme/colors';
import {useSelector} from 'react-redux';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {BREAK_STAKING, Laked_staking_income} from '../../actions/homeActions';
import {Screen} from '../../theme/dimens';
import SpaceBetweenView from '../../shared/components/SpaceBetweenView';
import { twoFixedTwo } from '../../helper/utility';
import { useTheme } from '../../hooks/useTheme';

const LackedStakes = () => {
  const { colors: themeColors, theme, isDark } = useTheme();
  const dispatch = useAppDispatch();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState('');
  const [calculationData, setCalculationData] = useState('');

  useEffect(() => {
    dispatch(Laked_staking_income());
  }, []);

  const lakedStakeData = useAppSelector(state => state.home.lakedHistory);

  const onBreak = () => {
    const data = {
      transaction_id: modalData?._id,
    };
    dispatch(BREAK_STAKING(data));
    setModalVisible(false);
  };

  function daysToMonths(days) {
    const daysInMonth = 30; // Average number of days in a month
    if(Number.isInteger(days / daysInMonth)) {
      return days / daysInMonth;
    }else {
      return twoFixedTwo(days / daysInMonth);
    }    
};

  return (
    <AppSafeAreaView style={{ backgroundColor: themeColors.background }}>
      <Toolbar isLogo={false} isSecond title="Locked Staking" />
      <ScrollView style={{flex: 1, backgroundColor: themeColors.background }}>
        {lakedStakeData?.length > 0 ? (
          <ScrollView horizontal>
            <Modal
              animationType="fade"
              transparent={true}
              visible={modalVisible}
              onRequestClose={() => setModalVisible(false)}>
              <TouchableOpacity
                style={styles.modalBackground}
                activeOpacity={1}
                onPressOut={() => setModalVisible(false)}>
                <View style={[styles.modalContent, { backgroundColor: themeColors.themeElevationColor }]}>
                  <AppText type={FOURTEEN}>
                    Do you want to break staking?
                  </AppText>
                  <View
                    style={{
                      width: Screen.Width - 50,
                      height: 0.5,
                      backgroundColor: themeColors.border,
                      marginVertical: 10,
                    }}></View>
                  <View style={{width: Screen.Width - 50}}>
                    <SpaceBetweenView
                      firstText={'Breaking Rewards (From Reward) :'}
                      secondText={`${modalData?.breaking_percentages}%`}
                    />

                    <SpaceBetweenView
                      firstText={'Reward Gained :'}
                      secondText={`${calculationData?.reward} ${modalData?.short_name}`}
                    />

                    <SpaceBetweenView
                      firstText={'Breaking Deduction :'}
                      secondText={`${calculationData?.breakingDedcution} ${modalData?.short_name}`}
                    />

                    <SpaceBetweenView
                      firstText={'You Will Get'}
                      secondText={calculationData?.disbursalAmount}
                    />

                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        paddingHorizontal: 20,
                        marginTop: 15,
                      }}>
                      <Button
                        children="Break"
                        titleStyle={{color: 'white'}}
                        containerStyle={{
                          backgroundColor: colors.buttonBg,
                          width: Screen.Width / 2 - 50,
                        }}
                        onPress={() => {
                          onBreak();
                        }}
                      />
                      <Button
                        titleStyle={{color: 'white'}}
                        children="Cancel"
                        containerStyle={{
                          backgroundColor: themeColors.border,
                          width: Screen.Width / 2 - 50,
                        }}
                        onPress={() => {
                          setModalVisible(false);
                        }}
                      />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </Modal>
            <View style={styles.tableContainer}>
              <View style={[styles.tableHeader, styles.row]}>
                <AppText type={FIFTEEN} style={styles.headerCell}>
                  Sr.No
                </AppText>
                <AppText type={FIFTEEN} style={styles.headerCell}>
                  Assets
                </AppText>
                <AppText type={FIFTEEN} style={styles.headerCell}>
                  Staking Ammount
                </AppText>
                <AppText type={FIFTEEN} style={styles.headerCell}>
                  Running Days
                </AppText>
                <AppText type={FIFTEEN} style={styles.headerCell}>
                  Running Reward Price
                </AppText>
                <AppText type={FIFTEEN} style={styles.headerCell}>
                  Staking Reward Rate
                </AppText>
                <AppText type={FIFTEEN} style={styles.headerCell}>
                  Staking Duration
                </AppText>
                <AppText type={FIFTEEN} style={styles.headerCell}>
                  Status
                </AppText>
                <AppText type={FIFTEEN} style={styles.headerCell}>
                  Action
                </AppText>
              </View>
              {lakedStakeData?.map((item, index) => {
                let rewardGained =
                  (+item.currency_Amount / 100 + item.month_percentage) / 30 +
                  item.running_days;
                let parseRewardGained = parseFloat(rewardGained.toFixed(5));
                let rewardDedcuted =
                  (rewardGained / 100) * +item.breaking_percentages;
                let parseRewardDedcuted = parseFloat(rewardDedcuted.toFixed(5));
                let disbursalAmount =
                  item?.currency_Amount +
                  parseRewardGained -
                  parseRewardDedcuted;
                let parseDisbursalAmount = parseFloat(
                  disbursalAmount.toFixed(5),
                );

                return (
                  <View key={index} style={[styles.row]}>
                    <AppText type={TWELVE} style={styles.cell}>
                      {index + 1}
                    </AppText>
                    <AppText type={TWELVE} style={styles.cell}>
                      {item.short_name}
                    </AppText>
                    <AppText type={TWELVE} style={styles.cell}>
                      {item.currency_Amount}
                    </AppText>
                    <AppText type={TWELVE} style={styles.cell}>
                      {item.running_days}
                    </AppText>
                    <AppText type={TWELVE} style={styles.cell}>
                      {twoFixedTwo(item.running_reward_price)}
                    </AppText>
                    <AppText type={TWELVE} style={styles.cell}>
                      {`${item?.month_percentage}%/Month`}
                    </AppText>
                    <AppText type={TWELVE} style={styles.cell}>
                      {item?.selected_day >= 30 ? `${daysToMonths(item?.selected_day)}/Month` : `${item?.selected_day}/Days`}
                    </AppText>
                    <AppText type={TWELVE} style={styles.cell}>
                      {'Locked'}
                    </AppText>
                    <TouchableOpacity
                      style={styles.button}
                      onPress={() => {
                        setModalData(item);
                        setCalculationData({
                          reward: parseRewardGained,
                          breakingDedcution: parseRewardDedcuted,
                          disbursalAmount: parseDisbursalAmount,
                        });
                        setModalVisible(true);
                      }}>
                      <AppText type={TWELVE} style={styles.buttonText}>
                        Break Staking
                      </AppText>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        ) : (
          <View
            style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
            <AppText style={{}}>Nothing to show.</AppText>
          </View>
        )}
      </ScrollView>
    </AppSafeAreaView>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#191f208f',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: Screen.Width - 50,
  },
  button: {
    backgroundColor: colors.buttonBg,
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 5,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
  },
  tableContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  tableHeader: {
    borderBottomWidth: 1,
    borderColor: '#000',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerCell: {
    width: 120,
    textAlign: 'center',
    padding: 10,
    color: colors.textGray,
  },
  cell: {
    textAlign: 'center',
    width: 120,
    padding: 10,
  },
});

export default LackedStakes;
