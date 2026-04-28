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
import {Laked_staking_income, getCommitDetails} from '../../actions/homeActions';
import {Screen} from '../../theme/dimens';
import SpaceBetweenView from '../../shared/components/SpaceBetweenView';
import { twoFixedTwo, toFixedFive, dateFormatter } from '../../helper/utility';
import { useRoute } from '@react-navigation/native';

const CommitDetails = () => {
    const route = useRoute();
    const details = route?.params?.detail;
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(getCommitDetails(details?._id));
  }, []);
  const commitDetail = useAppSelector(state => state.home.commitDetails);
  function daysToMonths(days) {
    const daysInMonth = 30; // Average number of days in a month
    if(Number.isInteger(days / daysInMonth)) {
      return days / daysInMonth;
    }else {
      return twoFixedTwo(days / daysInMonth);
    }
    
}
    console.log(commitDetail, "commitDetail");
  return (
    <AppSafeAreaView>
      {/* <Header /> */}
      <Toolbar isLogo={false} isSecond title="Commit Details" isCommit={true}/>
      <ScrollView style={{flex:1}}>
        {commitDetail?.length > 0 ? (
          <ScrollView horizontal>
            <View style={styles.tableContainer}>
              <View style={[styles.tableHeader, styles.row]}>
                <AppText type={FIFTEEN} style={styles.headerCell}>
                  Sr.No
                </AppText>
                <AppText type={FIFTEEN} style={styles.headerCell}>
                  Commit Date
                </AppText>
                <AppText type={FIFTEEN} style={styles.headerCell}>
                 Project Name
                </AppText>
                <AppText type={FIFTEEN} style={styles.headerCell}>
                  Commited Currency
                </AppText>
                <AppText type={FIFTEEN} style={styles.headerCell}>
                  Commited Quantity
                </AppText>
                <AppText type={FIFTEEN} style={styles.headerCell}>
                 Estimated Reward
                </AppText>
                <AppText type={FIFTEEN} style={styles.headerCell}>
                 Valid Quantity
                </AppText>
              </View>
              {commitDetail?.map((item, index) => {
                return (
                  <View key={index} style={[styles.row]}>
                    <AppText type={TWELVE} style={styles.cell}>
                      {index + 1}
                    </AppText>
                    <AppText type={TWELVE} style={styles.cell}>
                      {dateFormatter(item?.commitDate)}
                    </AppText>
                    <AppText type={TWELVE} style={styles.cell}>
                      {item?.projectName}
                    </AppText>
                    <AppText type={TWELVE} style={styles.cell}>
                      {item?.commitCurrency}
                    </AppText>
                    <AppText type={TWELVE} style={styles.cell}>
                      {item?.committedQuantity}
                    </AppText>
                    <AppText type={TWELVE} style={styles.cell}>
                      {item?.estimatedRewards}
                    </AppText>
                    <AppText type={TWELVE} style={styles.cell}>
                      {item?.validQuantity}
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

export default CommitDetails;
