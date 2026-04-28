import React, {useState} from 'react';
import {FlatList, ScrollView, StyleSheet, TextInput, View} from 'react-native';
import {colors} from '../../theme/colors';
import {
  AppText,
  Button,
  ELEVEN,
  FOURTEEN,
  SECOND,
  SEMI_BOLD,
  TEN,
  TWELVE,
  Toolbar,
  WHITE,
  YELLOW,
} from '../../shared';
import TouchableOpacityView from '../../shared/components/TouchableOpacityView';
import FastImage from 'react-native-fast-image';
import {BACK_ICON, RADIO_OFF, RADIO_ON} from '../../helper/ImageAssets';
import NavigationService from '../../navigation/NavigationService';
import {Screen} from '../../theme/dimens';
import {Switch} from 'react-native-switch';


const P2pFilter = ({}) => {
  const [switchVerifiedStatus, setSwitchVerifiedStatus] = useState(false);
  const [switchAdsStatus, setSwitchAdsStatus] = useState(false);
  const [amountList, setAmountList] = useState([1, 2, 3, 4, 5, 6]);
  const [paymentLimitArr, setPaymentLimitArr] = useState([
    1, 2, 3, 4, 5, 6, 7, 8, 9, 1, 2, 3, 4,
  ]);
  const [paymentMethodArr, setPaymentMethodArr] = useState([
    'All',
    'UPI',
    'IMPS',
    'PAYTM',
    'PhonePe',
    'BankTransfer',
    'Google Pay (GPay)',
  ]);
  const [country, setCountry] = useState([
    'All',
    'INDIA',
    'NEPAL',
    'RUSSIA',
    'USA',
    'BankTransfer',
  ]);
  const [sortingData, setSortingData] = useState([
    'Price',
    'Trade',
    'Completion',
  ]);
  const [sortStatus, setSortStatus] = useState(0);
  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={[styles.mainContainer]}>
        <TouchableOpacityView
          onPress={() => {
            NavigationService.goBack();
          }}
          style={styles.backBtn}>
          <FastImage
            source={BACK_ICON}
            tintColor={colors.white}
            resizeMode="contain"
            style={styles.backBtnStyle}
          />
        </TouchableOpacityView>
        <AppText type={FOURTEEN} style={styles.filterText} weight={SEMI_BOLD}>
          Filters
        </AppText>
        <AppText type={ELEVEN} color={SECOND} style={{}} weight={SEMI_BOLD}>
          Ad Type
        </AppText>
        <View style={styles.toggleContain}>
          <AppText type={TWELVE} style={styles.filterText} weight={SEMI_BOLD}>
            Verified Merchant Ads Only
          </AppText>
          <Switch
            value={switchVerifiedStatus}
            onValueChange={val => setSwitchVerifiedStatus(val)}
            circleSize={18}
            barHeight={22}
            circleBorderWidth={0}
            backgroundActive={colors.lightYellow}
            backgroundInactive={colors.radio_in_active}
            circleActiveColor={colors.white}
            circleInActiveColor={colors.white}
            changeValueImmediately={true}
            renderActiveText={false}
            renderInActiveText={false}
            innerCircleStyle={{}}
            switchLeftPx={3}
            switchRightPx={3}
          />
        </View>

        <View style={styles.toggleContain}>
          <AppText
            type={TWELVE}
            style={[styles.filterText, {marginVertical: 5}]}
            weight={SEMI_BOLD}>
            Ads With No Verification Required
          </AppText>
          <Switch
            value={switchAdsStatus}
            onValueChange={val => setSwitchAdsStatus(val)}
            circleSize={18}
            barHeight={22}
            circleBorderWidth={0}
            backgroundActive={colors.lightYellow}
            backgroundInactive={colors.radio_in_active}
            circleActiveColor={colors.white}
            circleInActiveColor={colors.white}
            changeValueImmediately={true}
            renderActiveText={false}
            renderInActiveText={false}
            innerCircleStyle={{}}
            switchLeftPx={3}
            switchRightPx={3}
          />
        </View>

        <View style={styles.divider}></View>
        <AppText color={SECOND} weight={SEMI_BOLD}>
          Amount
        </AppText>

        <View style={styles.inputContainer}>
          <TextInput
            placeholder="e.g. 100"
            placeholderTextColor={colors.white}
            keyboardType="decimal-pad"
            onChangeText={e => {}}
            style={styles.inputStyle}></TextInput>
          <View style={styles.getCurrencyContain}>
            <AppText color={WHITE}>INR</AppText>
          </View>
        </View>
        <View>
          <FlatList
            data={amountList}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({item, index}) => {
              return (
                <View style={[styles.currencyListView]}>
                  <AppText weight={SEMI_BOLD}>5X</AppText>
                </View>
              );
            }}
          />
        </View>
        <View style={styles.divider}></View>

        <View style={styles.divider}></View>
        <AppText color={SECOND} weight={SEMI_BOLD}>
          Payment Time Limit (minutes)
        </AppText>
        <View>
          <FlatList
            data={paymentLimitArr}
            numColumns={6}
            showsHorizontalScrollIndicator={false}
            renderItem={({item, index}) => {
              return (
                <View style={[styles.currencyListView]}>
                  <AppText weight={SEMI_BOLD}>5X</AppText>
                </View>
              );
            }}
          />
        </View>
        <View style={styles.divider}></View>
        <AppText color={SECOND} weight={SEMI_BOLD}>
          Payment Method(s)
        </AppText>
        <View>
          <FlatList
            data={paymentMethodArr}
            numColumns={2}
            showsHorizontalScrollIndicator={false}
            renderItem={({item, index}) => {
              return (
                <View
                  style={[
                    styles.currencyListView,
                    {marginEnd: 15, width: 155},
                  ]}>
                  <AppText weight={SEMI_BOLD}>{item}</AppText>
                </View>
              );
            }}
          />
        </View>
        <View style={styles.divider}></View>
        <AppText color={SECOND} weight={SEMI_BOLD}>
          Country / Region
        </AppText>
        <View>
          <FlatList
            data={country}
            numColumns={2}
            showsHorizontalScrollIndicator={false}
            renderItem={({item, index}) => {
              return (
                <View
                  style={[
                    styles.currencyListView,
                    {marginEnd: 15, width: 155},
                  ]}>
                  <AppText weight={SEMI_BOLD}>{item}</AppText>
                </View>
              );
            }}
          />
        </View>
        <View style={styles.divider}></View>
        <AppText color={YELLOW} weight={SEMI_BOLD}>
          Sort by
        </AppText>

        <FlatList
          data={sortingData}
          renderItem={({item, index}) => {
            return (
              <TouchableOpacityView
                onPress={() => {
                  setSortStatus(index);
                }}
                style={styles.sortingStyle}>
                <AppText color={YELLOW} weight={SEMI_BOLD}>
                  {item}
                </AppText>
                <FastImage
                  source={sortStatus === index ? RADIO_ON : RADIO_OFF}
                  resizeMode="contain"
                  style={styles.radioBtnStyle}
                />
              </TouchableOpacityView>
            );
          }}
        />
        <View
          style={[styles.divider, {backgroundColor: colors.buttonBg}]}></View>
        <View style={styles.btnContainer}>
          <Button
            containerStyle={styles.resetBtn}
            titleStyle={{color: colors.white}}
            children="RESET"
          />
          <Button
            containerStyle={styles.confirmBtn}
            titleStyle={{color: colors.white}}
            children="CONFIRM"
          />
        </View>
        <View style={styles.emptyView}></View>
      </ScrollView>
    </View>
  );
};

export default P2pFilter;
const styles = StyleSheet.create({
  confirmBtn: {
    width: '48%',
  },
  resetBtn: {
    width: '48%',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.buttonBg,
  },
  btnContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  radioBtnStyle: {
    width: 15,
    height: 15,
  },
  sortingStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  emptyView: {
    height: 20,
  },
  currencyListView: {
    width: 49,
    marginLeft: 10,
    padding: 5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.buttonBg,
    backgroundColor: 'transparent',
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  getCurrencyContain: {
    width: '20%',
    height: 50,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  inputStyle: {
    width: '80%',
    height: 50,
    paddingHorizontal: 10,
    color: colors.white,
    fontSize: 12,
  },
  inputContainer: {
    marginTop: 5,
    width: Screen.Width / 1.09,
    height: 50,
    borderRadius: 5,
    backgroundColor: colors.sheetInput,
    // borderWidth: 1,
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  divider: {
    width: Screen.Width - 25,
    height: 0.5,
    backgroundColor: colors.white,
    alignSelf: 'center',
    marginVertical: 15,
  },
  toggleContain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterText: {
    marginVertical: 15,
  },
  container: {
    backgroundColor: colors.textGray,
    flex: 1,
  },
  mainContainer: {
    width: Screen.Width - 25,
    alignSelf: 'center',
    height: Screen.Height,
  },
  backBtn: {
    marginTop: 10,
  },
  backBtnStyle: {
    width: 18,
    height: 18,
  },
});
