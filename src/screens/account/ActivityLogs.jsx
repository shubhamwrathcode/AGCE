import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity, Platform } from 'react-native';
import { AppSafeAreaView, AppText, Button, Toolbar } from '../../shared';
import { getActivityLogs } from '../../actions/homeActions';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { colors } from '../../theme/colors';
import { twoFixedTwo, dateFormatter } from '../../helper/utility';
import KeyBoardAware from '../../shared/components/KeyboardAware';
import { HomeBg } from '../../helper/ImageAssets';

const ActivityLogs = () => {
  const dispatch = useAppDispatch();
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    fetchTransactionHistory(skip);
  }, [skip]);

  const fetchTransactionHistory = (skip) => {
    setIsLoading(true);
    dispatch(getActivityLogs(skip, limit)) 
      .then(response => {
        setIsLoading(false);
      })
      .catch(error => {
        setIsLoading(false);
        console.error('Error fetching transaction history:', error);
      });
  };

  const activityLogs = useAppSelector(state => state.home.activityLogs);

  const handleListStakingHistory = (type) => {
    setSkip(prevSkip => prevSkip + (type === "Next" ? 10 : -10)); 
    setSerialNumber(type === "Next" ? serialNumber + 10 : serialNumber - 10);
  };

  console.log(skip, limit, 'handleListStakingHistory');
  console.log(activityLogs?.length, "transaction");
  const [serialNumber, setSerialNumber] = useState(1);
  const _RenderList = ({ item, index }) => {
    const currentSerialNumber = serialNumber + index;
    return (
      <View style={styles.row}>
        {/* <AppText style={styles.cell}>{currentSerialNumber}</AppText> */}
        <AppText style={[styles.cell, {marginRight: 20}]}>{dateFormatter(item?.createdAt)}</AppText>
        <AppText style={styles.cell}>{item?.page}</AppText>
        <AppText style={styles.cell}>{item?.ipAddress}</AppText>
      </View>
    );
  };

  return (
    <AppSafeAreaView source={HomeBg}>
      <Toolbar isLogo={false} title='Activity Logs' isSecond  />
      <KeyBoardAware>
      <View>
        {activityLogs?.length > 0 ? 
        <>
        <View style={[styles.row,{paddingHorizontal:10,marginLeft:10}]}>
        {/* <AppText style={styles.header}>S.No.</AppText> */}
        <AppText style={styles.header}>Date/Time</AppText>
        <AppText style={styles.header}>Activity</AppText>
        <AppText style={styles.header}>IP Address</AppText>
      </View>
      <FlatList
        ref={flatListRef}
        data={activityLogs}
        renderItem={_RenderList}
        keyExtractor={(item, index) => index.toString()}
        // onScroll={({ nativeEvent }) => {
        //   handleScroll({ nativeEvent })
        //   handleStartReached({ nativeEvent });
        // }}
        contentContainerStyle={{ marginBottom: Platform.OS === "ios" ? 50 : 0, }}
        style={styles.flatList}
      />
      <View style={{flexDirection: "row", justifyContent: "space-around", alignItems: "center",
    marginVertical:10}}>
        <Button children='Previous' disabled={serialNumber<10? true:false} containerStyle={{paddingHorizontal: 10}} onPress={() => handleListStakingHistory('Previous')}/>
        <Button children='Next'  disabled={activityLogs?.length < 10} containerStyle={{paddingHorizontal: 30}} onPress={() => handleListStakingHistory('Next')}/>
      </View>
        </>
        : <AppText>Nothing to show</AppText>}
      
      {isLoading && <ActivityIndicator color={colors.buttonBg} size={'large'}/>}
      </View>
      </KeyBoardAware>
    </AppSafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flex: 1,
    fontWeight: 'bold',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    padding: 5,
    alignItems: 'center', 
    justifyContent: 'center',
    marginTop:15,
    paddingHorizontal:18,
    // backgroundColor: "blue"
  },
  cell: {
    flex: 1,
    alignSelf: 'center',
  },
  button: {
    borderRadius: 25,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flatList: {
    // flexGrow: 1,
  },
});

export default ActivityLogs;
