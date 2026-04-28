import React, {useEffect, useState} from 'react';
import {
  View,
  ScrollView,
  Text,
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
  Header,
  THIRTEEN,
  TWELVE,
  Toolbar,
} from '../../shared';
import {colors} from '../../theme/colors';
import {useSelector} from 'react-redux';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {Laked_staking_income, staking_history} from '../../actions/homeActions';
import {Screen} from '../../theme/dimens';
import SpaceBetweenView from '../../shared/components/SpaceBetweenView';
import { twoFixedTwo, toFixedFive } from '../../helper/utility';

const StakingHistory = () => {
  const dispatch = useAppDispatch();
  const [modalVisible, setModalVisible] = useState(false);
  useEffect(() => {
    dispatch(staking_history());
  }, []);
  const stakeHistoryData = useAppSelector(state => state.home.stakingHistory);
  function daysToMonths(days) {
    const daysInMonth = 30; // Average number of days in a month
    if(Number.isInteger(days / daysInMonth)) {
      return days / daysInMonth;
    }else {
      return twoFixedTwo(days / daysInMonth);
    }
    
}
  return (
    <AppSafeAreaView>
      {/* <Header /> */}
      <Toolbar isLogo={false} isSecond title="Staking History" />
      <ScrollView style={{flex:1}}>
        {stakeHistoryData?.length > 0 ? (
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
                <View style={styles.modalContent}>
                  <AppText type={FOURTEEN}>
                    Do you want to break staking?
                  </AppText>
                  <View
                    style={{
                      width: Screen.Width - 50,
                      height: 0.5,
                      backgroundColor: colors.white,
                      marginVertical: 10,
                    }}></View>
                  <View style={{width: Screen.Width - 50}}>
                    <SpaceBetweenView
                      firstText={'Breaking Rewards (From Reward) :'}
                      secondText={'2%'}
                    />

                    <SpaceBetweenView
                      firstText={'Reward Gained :'}
                      secondText={'2%'}
                    />

                    <SpaceBetweenView
                      firstText={'Breaking Deduction :'}
                      secondText={'2%'}
                    />

                    <SpaceBetweenView
                      firstText={'You Will Get'}
                      secondText={'2%'}
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
                        onPress={() => {}}
                      />
                      <Button
                        titleStyle={{color: 'white'}}
                        children="Cancel"
                        containerStyle={{
                          backgroundColor: '#3b4041a1',
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
                  Staking Days
                </AppText>
                <AppText type={FIFTEEN} style={styles.headerCell}>
                  Reward Price
                </AppText>
                <AppText type={FIFTEEN} style={styles.headerCell}>
                  Breaking Charge
                </AppText>
                <AppText type={FIFTEEN} style={styles.headerCell}>
                  Disbursal Amount
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
              </View>
              {stakeHistoryData?.map((item, index) => {
                // let rewardGained =
                //   (+item.currency_Amount / 100 + item.month_percentage) / 30 +
                //   item.running_days;
                //   rewardGained = parseFloat(rewardGained?.toFixed(5))

                // let rewardDedcuted =
                //   (rewardGained / 100) * +item.breaking_percentages;
                //   rewardDedcuted = parseFloat(rewardDedcuted?.toFixed(5))

                // let disbursalAmount =
                //   item?.currency_Amount +
                //   rewardGained -
                //   rewardDedcuted;
                // let parseDisbursalAmount = parseFloat(
                //   disbursalAmount.toFixed(5),
                // );
                console.log(item, "item");

                let rewardGained = (((+item?.currency_Amount / 100) * +item?.month_percentage) / 30) * +item?.running_days;
                rewardGained = parseFloat(rewardGained?.toFixed(5));
                let rewardDedcuted = (rewardGained / 100) * +item?.breaking_percentages;
                rewardDedcuted = parseFloat(rewardDedcuted?.toFixed(5));
                let disbursalAmount = item?.currency_Amount + rewardGained - rewardDedcuted;
                disbursalAmount = parseFloat(disbursalAmount?.toFixed(5));

                // console.log(rewardGained, rewardDedcuted,disbursalAmount,"disbursalAmount");
                return (
                  <View key={index} style={[styles.row]}>
                    <AppText type={TWELVE} style={styles.cell}>
                      {index + 1}
                    </AppText>
                    <AppText type={TWELVE} style={styles.cell}>
                      {item?.short_name}
                    </AppText>
                    <AppText type={TWELVE} style={styles.cell}>
                      {item?.currency_Amount}
                    </AppText>
                    <AppText type={TWELVE} style={styles.cell}>
                      {item?.running_days}
                    </AppText>
                    <AppText type={TWELVE} style={styles.cell}>
                      {twoFixedTwo(item?.running_reward_price)}
                    </AppText>
                    <AppText type={TWELVE} style={styles.cell}>
                      {rewardDedcuted}
                    </AppText>
                    <AppText type={TWELVE} style={styles.cell}>
                      {disbursalAmount}
                    </AppText>
                    <AppText type={TWELVE} style={styles.cell}>
                      {`${item?.month_percentage}%/Month`}
                    </AppText>
                    <AppText type={TWELVE} style={styles.cell}>
                      {item?.selected_day >= 30 ? `${daysToMonths(item?.selected_day)}/Month` : `${item?.selected_day}/Days`}
                    </AppText>
                    <AppText type={TWELVE} style={styles.cell}>
                      {item?.status}
                    </AppText>
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
    color: colors.white,
  },
});

export default StakingHistory;
