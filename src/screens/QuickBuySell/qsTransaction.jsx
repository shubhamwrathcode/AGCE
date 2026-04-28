import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { AppSafeAreaView, AppText, Button, Toolbar } from '../../shared';
import { getTransactionHistory } from '../../actions/homeActions';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { colors } from '../../theme/colors';
import { dateFormatter, twoFixedTwo } from '../../helper/utility';
import KeyBoardAware from '../../shared/components/KeyboardAware';

const qsTransaction = () => {
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
    dispatch(getTransactionHistory(skip, limit)) 
      .then(response => {
        setIsLoading(false);
      })
      .catch(error => {
        setIsLoading(false);
        console.error('Error fetching transaction history:', error);
      });
  };

  const transaction = useAppSelector(state => state.home.qbsHistory);

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

  const handleListStakingHistory = (type: any) => {
    setSkip(prevSkip => prevSkip + (type === "Next" ? 10 : -10));
  };
  console.log(skip, limit, 'handleListStakingHistory');
  console.log(transaction?.length, "transaction");

  const _RenderList = ({ item, index }) => {
    return (
      <ScrollView contentContainerStyle={styles.row}>
        <AppText style={styles.cell}>{dateFormatter(item?.createdAt)}</AppText>
        <AppText style={styles.cell}>{item?.from}</AppText>
        <AppText style={styles.cell}>{item?.to}</AppText>
        <AppText style={styles.cell}>{twoFixedTwo(item?.pay_amount)}</AppText>
        <AppText style={styles.cell}>{twoFixedTwo(item?.get_amount)}</AppText>
       <AppText style={styles.cell}>{item?.side}</AppText>
      </ScrollView>
    );
  };

  return (
    <AppSafeAreaView>
      <Toolbar isLogo={false} title='Quick BUY/SELL History' isSecond  />
      <KeyBoardAware>
      <View>
        {transaction?.length > 0 ? 
        <>
        <View style={[styles.row,{paddingHorizontal:5,marginLeft:10}]}>
        <AppText style={styles.header}>Date</AppText>
        <AppText style={styles.header}>From</AppText>
        <AppText style={styles.header}>To</AppText>
        <AppText style={styles.header}>Pay Amt.</AppText>
        <AppText style={styles.header}>Get Amt.</AppText>
        <AppText style={styles.header}>Side</AppText>
      </View>
      <FlatList
        ref={flatListRef}
        data={transaction}
        renderItem={_RenderList}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={{ marginBottom: Platform.OS === "ios" ? 50 : 0, }}
        style={styles.flatList}
      />
      <View style={{flexDirection: "row", justifyContent: "space-around", alignItems: "center",
    marginVertical:10}}>
        <Button children='Previous'  disabled={skip <= 0} containerStyle={{paddingHorizontal: 10}} onPress={() => handleListStakingHistory('Previous')}/>
        <Button children='Next' disabled={transaction?.length < 10} containerStyle={{paddingHorizontal: 30}} onPress={() => handleListStakingHistory('Next')}/>
      </View>
        </>
        : <View style={ {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          height: 300,
        }}><AppText>Nothing to show</AppText></View>}
      
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
    paddingHorizontal:5,
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

export default qsTransaction;
