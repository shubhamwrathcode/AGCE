import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet,ScrollView } from 'react-native';
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
import { getReferralList } from '../../actions/homeActions';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { colors } from '../../theme/colors';
import { twoFixedTwo, dateFormatter } from '../../helper/utility';
import KeyBoardAware from '../../shared/components/KeyboardAware';
import { useRoute } from '@react-navigation/native';
import {Screen} from '../../theme/dimens';
import { HomeBg } from '../../helper/ImageAssets';

const ReferralList = () => {
    const route = useRoute();
    const code = route?.params?.referCode;
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef(null);
  const referralList = useAppSelector(state => state.home.referralList);
  const coinData = useAppSelector(state => state.home.coinPairs);
  let rewardTokenPrice = coinData?.filter((pair) => pair?.base_currency === 'USDT' && pair?.quote_currency === 'FIP')[0]?.buy_price;

  useEffect(() => {
    fetchReferralList(code);
  }, []);

  const fetchReferralList = (code) => {
    setIsLoading(true);
    dispatch(getReferralList(code)) 
      .then(response => {
        setIsLoading(false);
      })
      .catch(error => {
        setIsLoading(false);
        console.error('Error fetching Referral List:', error);
      });
  };

 

  // const handleStartReached = ({ nativeEvent }) => {
  //   const offsetY = nativeEvent.contentOffset.y;
  //   const isStartReached = offsetY <= 0;

  //   if (!isLoading && isStartReached && skip > 0) {
  //     setSkip(skip - limit);
  //   }
  // };

  // const handleScroll = ({ nativeEvent }) => {
  //   const offsetY = nativeEvent.contentOffset.y;
  //   const contentHeight = nativeEvent.contentSize.height;
  //   const height = nativeEvent.layoutMeasurement.height;
  //   const isEndReached = offsetY >= contentHeight - height;

  //   if (!isLoading && isEndReached) {
  //     setSkip(skip + limit);
  //   }
  // };


  console.log(referralList?.length,code, "referralList");

  return (
    <AppSafeAreaView source={HomeBg}>
      <Toolbar isLogo  />
      <ScrollView style={{flex:1}}>
        {referralList?.length > 0 ? (
          <ScrollView horizontal>
            <View style={styles.tableContainer}>
              <View style={[styles.tableHeader, styles.row]}>
                <AppText type={FIFTEEN} style={styles.headerCell}>
                  Sr.No
                </AppText>
                <AppText type={FIFTEEN} style={styles.headerCell}>
                 Date/Time
                </AppText>
                <AppText type={FIFTEEN} style={styles.headerCell}>
                  Name
                </AppText>
                <AppText type={FIFTEEN} style={styles.headerCell}>
                Email
                </AppText>
                <AppText type={FIFTEEN} style={styles.headerCell}>
                  Reward
                </AppText>
              </View>
              {referralList?.map((item, index) => {
                return (
                  <View key={index} style={[styles.row]}>
                    <AppText type={TWELVE} style={styles.cell}>
                      {index + 1}
                    </AppText>
                    <AppText type={TWELVE} style={styles.cell}>
                     {dateFormatter(item?.createdAt)}
                    </AppText>
                    <AppText type={TWELVE} style={styles.cell}>
                    {item?.firstName} {item?.lastName}
                    </AppText>
                    <AppText type={TWELVE} style={styles.cell}>
                      {item?.emailId}
                    </AppText>
                    <AppText type={TWELVE} style={styles.cell}>
                    {item?.fip_reward == "true" ? rewardTokenPrice * 2 : 0} WRATH
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

export default ReferralList;
