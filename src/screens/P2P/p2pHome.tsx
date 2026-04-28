import {FlatList, ScrollView, StyleSheet, TextInput, View} from 'react-native';
import {P2pHeader} from '../../shared/components/P2pHeader';
import {Screen, borderWidth} from '../../theme/dimens';
import {P2pbuySell} from './P2pbuySell';
import {P2pSheet} from '../../shared/components/P2pSheet';
import {colors} from '../../theme/colors';
import {useMemo, useRef, useState} from 'react';
import FastImage from 'react-native-fast-image';
import {
  INR_CURRENCY,
  LikeButton,
  REMOVE,
  customUserImg,
  doneIcon,
  searchIcon,
  watch,
} from '../../helper/ImageAssets';
import {
  AppText,
  BOLD,
  Button,
  FOURTEEN,
  MEDIUM,
  SECOND,
  SEMI_BOLD,
  SearchInput,
  THIRTEEN,
  TWELVE,
  TWENTY_TWO,
  WHITE,
} from '../../shared';
import RBSheet from 'react-native-raw-bottom-sheet';
import TouchableOpacityView from '../../shared/components/TouchableOpacityView';
import NavigationService from '../../navigation/NavigationService';
import {BUY_CRYPTO, p2pFilter} from '../../navigation/routes';    

const p2pHome: React.FC = () => {
  const amountRef = useRef(null);
  const paymentRef = useRef(null);
  const availableCurrenciesRef = useRef(null);
  const [currencySearch, setCurrencySearch] = useState('');
  const [buyList, setBuyList] = useState([1, 2, 3]);
  const [amountList, setAmountList] = useState([1, 2, 3]);
  const [availableCurrencies, setAvailableCurrencies] = useState([
    1, 2, 3, 4, 5, 6, 7, 889, 9, 9, 90, 99, 6, 656, 4545, 4534534, 345345, 3,
  ]);
  const [paymentList, setPaymentList] = useState([
    {
      id: 0,
      text: 'All',
    },
    {
      id: 0,
      text: 'UPI',
    },
    {
      id: 0,
      text: 'IMPS',
    },
    {
      id: 0,
      text: 'PhonePe',
    },
  ]);
  const _BuyRenderItem = useMemo(() => {
    const _renderItem = ({item, index}) => {
      return (
        <View style={styles.listMainContainer}>
          <View style={styles.userContain}>
            <FastImage
              source={customUserImg}
              style={styles.customUserImage}
              resizeMode="contain"
            />
            <AppText
              type={FOURTEEN}
              weight={SEMI_BOLD}
              style={styles.horizontal}>
              ABC User
            </AppText>
            <FastImage
              source={doneIcon}
              style={styles.listImgStyle}
              resizeMode="contain"
            />
          </View>

          <View style={{marginTop: 10}}>
            <AppText
              type={TWELVE}
              weight={MEDIUM}
              color={SECOND}
              style={styles.horizontal}>
              Trade(S) : 1234 | Completion : 95.4%
            </AppText>
          </View>

          <View style={{flexDirection: 'row'}}>
            <View style={styles.sameStyle}>
              <FastImage
                source={LikeButton}
                style={styles.listImgStyle}
                resizeMode="contain"
              />
              <AppText
                type={TWELVE}
                weight={MEDIUM}
                color={SECOND}
                style={styles.horizontal}>
                95.95%
              </AppText>
            </View>
            <View style={styles.sameStyle}>
              <FastImage
                source={watch}
                style={styles.listImgStyle}
                resizeMode="contain"
              />
              <AppText
                type={TWELVE}
                weight={MEDIUM}
                color={SECOND}
                style={styles.horizontal}>
                95.95%
              </AppText>
            </View>
          </View>
          <View style={styles.currencyTextBox}>
            <View style={styles.alignItem}>
              <FastImage
                source={INR_CURRENCY}
                style={styles.currencyImg}
                resizeMode="contain"
              />
              <AppText
                type={TWENTY_TWO}
                weight={MEDIUM}
                color={WHITE}
                style={styles.horizontal}>
                95.50%
              </AppText>
            </View>
            <View>
              <View style={styles.alignItem}>
                <AppText
                  type={TWELVE}
                  weight={MEDIUM}
                  color={SECOND}
                  style={styles.horizontal}>
                  Bank Transfer
                </AppText>
                <AppText
                  type={TWELVE}
                  weight={MEDIUM}
                  style={{color: colors.pink}}>
                  |
                </AppText>
              </View>
              <View style={styles.cornerStyle}>
                <AppText type={TWELVE} weight={MEDIUM} color={SECOND}>
                  IMPS{' '}
                  <AppText
                    type={TWELVE}
                    weight={MEDIUM}
                    style={{color: colors.pink}}>
                    |
                  </AppText>
                </AppText>
              </View>
            </View>
          </View>
          <View style={styles.quantityBox}>
            <AppText type={TWELVE} weight={MEDIUM} color={SECOND}>
              Quantity 381.18 USDT
            </AppText>
            <AppText type={TWELVE} weight={MEDIUM} color={SECOND}>
              UPI{' '}
              <AppText
                type={TWELVE}
                weight={MEDIUM}
                style={{color: colors.pink}}>
                |
              </AppText>
            </AppText>
          </View>
          <View style={styles.buttonContain}>
            <AppText type={TWELVE} weight={MEDIUM} color={SECOND}>
              INR 7,500.00 - INR 6.499.00
            </AppText>

            <Button
              children="Buy"
              titleStyle={{color: colors.white}}
              containerStyle={styles.buyBtn}
               onPress={()=>{NavigationService.navigate(BUY_CRYPTO)}}
           />
          </View>
          {buyList?.length - 1 == index ? (
            <></>
          ) : (
            <View style={styles.divider} />
          )}
        </View>
      );
    };

    return _renderItem;
  }, []);

  return (
    <P2pHeader isLogo={false} isSecond currencyText="INR" title="P2P" isThird>
      <P2pbuySell
        onKeyPressChange={e => {
          console.log(e);
        }}
      />
      <P2pSheet
        onFilterPress={() => {
          NavigationService.navigate(p2pFilter);
        }}
        onCurrencyPress={() => {
          availableCurrenciesRef?.current?.open();
        }}
        onPaymentPress={() => {
          paymentRef?.current?.open();
        }}
        onAmountPress={() => {
          amountRef?.current?.open();
        }}
      />
      <View style={styles.divider} />
      <FlatList data={buyList} renderItem={_BuyRenderItem} />

      <RBSheet
        ref={availableCurrenciesRef}
        animationType="none"
        customStyles={{
          container: [styles.sheetContainer, {height: Screen.Height / 1.2}],
          wrapper: {
            backgroundColor: '#0005',
          },
          draggableIcon: {
            backgroundColor: 'transparent',
          },
        }}>
        <View style={[styles.cryptoSheetContainer]}>
          <SearchInput
            value={currencySearch}
            sheetDownButton={true}
            sheetDownPress={() => {
              availableCurrenciesRef?.current?.close();
            }}
            onChangeText={setCurrencySearch}
            placeholder={'Please enter currency'}
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={() => {}}
            onFocus={true}
            searchContainStyle={{
              marginTop: 0,
              backgroundColor: colors.sheetInput,
            }}
          />

          <View style={[styles.paymentListContainer]}>
            <AppText color={SECOND} type={TWELVE} weight={MEDIUM}>
              Available Currency
            </AppText>
            <View
              style={{
                width: Screen.Width,
                height: 0.3,
                backgroundColor: '#757575',
                alignSelf: 'center',
                marginTop: 5,
              }}></View>

            <View style={{height: Screen.Width / 1.4}}>
              <FlatList
                showsVerticalScrollIndicator={false}
                data={availableCurrencies}
                renderItem={({item, index}) => {
                  return (
                    <AppText
                      color={WHITE}
                      type={THIRTEEN}
                      weight={BOLD}
                      style={{marginTop: 10, marginLeft: 15}}>
                      {'AED'}
                    </AppText>
                  );
                }}
              />
            </View>
          </View>
          <View style={[styles.paymentListContainer]}>
            <AppText color={SECOND} type={TWELVE} weight={MEDIUM}>
              All currencies
            </AppText>
            <View
              style={{
                width: Screen.Width,
                height: 0.3,
                backgroundColor: '#757575',
                alignSelf: 'center',
                marginTop: 5,
              }}></View>

            <View style={{height: Screen.Height / 5.1}}>
              <FlatList
                showsVerticalScrollIndicator={false}
                data={availableCurrencies}
                renderItem={({item, index}) => {
                  return (
                    <AppText
                      color={WHITE}
                      type={THIRTEEN}
                      weight={BOLD}
                      style={{marginTop: 10, marginLeft: 15}}>
                      {'AED'}
                    </AppText>
                  );
                }}
              />
            </View>
          </View>
          <View style={[styles.buttonContainer, {}]}>
            <Button
              children="Reset"
              titleStyle={{color: colors.white}}
              containerStyle={styles.resetButton}
            />
            <Button
              children="Confirm"
              titleStyle={{color: colors.black}}
              containerStyle={{width: '48%'}}
            />
          </View>

          <View style={{height: 10}}></View>
        </View>
      </RBSheet>

      <RBSheet
        ref={amountRef}
        height={200}
        animationType="none"
        customStyles={{
          container: styles.sheetContainer,
          wrapper: {
            backgroundColor: '#0005',
          },
          draggableIcon: {
            backgroundColor: 'transparent',
          },
        }}>
        <View style={styles.currencyHeader}>
          <AppText type={FOURTEEN} weight={SEMI_BOLD}>
            Amount
          </AppText>
          <TouchableOpacityView
            style={styles.removeBtn}
            onPress={() => {
              amountRef?.current?.close();
            }}>
            <FastImage
              source={REMOVE}
              tintColor={colors.black}
              style={styles.removeImg}
            />
          </TouchableOpacityView>
        </View>
        <View style={[styles.cryptoSheetContainer]}>
          <View style={styles.currencyBox}>
            <TextInput
              editable={false}
              placeholder="e.g. 100"
              placeholderTextColor={'#7E7E7E'}
              keyboardType="decimal-pad"
              onChangeText={e => {}}
              style={styles.currencyBoxInput}></TextInput>
            <View style={styles.contain}>
              <AppText color={WHITE} weight={SEMI_BOLD} style={styles.coin}>
                {'INR'}
              </AppText>
            </View>
          </View>
          <View style={{marginTop: 10}}>
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
          <View style={styles.buttonContainer}>
            <Button
              children="Reset"
              titleStyle={{color: colors.white}}
              containerStyle={styles.resetButton}
            />
            <Button
              children="Confirm"
              titleStyle={{color: colors.black}}
              containerStyle={{width: '48%'}}
            />
          </View>
          <View style={{height: 10}}></View>
        </View>
      </RBSheet>

      <RBSheet
        ref={paymentRef}
        animationType="none"
        customStyles={{
          container: [styles.sheetContainer, {height: Screen.Height / 1.7}],
          wrapper: {
            backgroundColor: '#0005',
          },
          draggableIcon: {
            backgroundColor: 'transparent',
          },
        }}>
        <View style={styles.currencyHeader}>
          <AppText type={FOURTEEN} weight={SEMI_BOLD}>
            Payment Methods
          </AppText>
          <TouchableOpacityView
            style={styles.removeBtn}
            onPress={() => {
              paymentRef?.current?.close();
            }}>
            <FastImage
              source={REMOVE}
              tintColor={colors.black}
              style={styles.removeImg}
            />
          </TouchableOpacityView>
        </View>
        <View style={[styles.cryptoSheetContainer]}>
          <View style={styles.currencyBox}>
            <FastImage
              source={searchIcon}
              tintColor={'#7E7E7E'}
              resizeMode="contain"
              style={styles.searchIcon}
            />
            <TextInput
              placeholder="Search payment method"
              placeholderTextColor={'#7E7E7E'}
              onChangeText={e => {}}
              style={styles.searchInput}></TextInput>
          </View>
          <View style={styles.paymentListContainer}>
            <FlatList
              data={paymentList}
              numColumns={2}
              showsHorizontalScrollIndicator={false}
              renderItem={({item, index}) => {
                return (
                  <View style={styles.paymentSheetList}>
                    <AppText weight={SEMI_BOLD}>{item?.text}</AppText>
                  </View>
                );
              }}
            />
          </View>
          <View style={styles.buttonContainer}>
            <Button
              children="Reset"
              titleStyle={{color: colors.white}}
              containerStyle={styles.resetButton}
            />
            <Button
              children="Confirm"
              titleStyle={{color: colors.black}}
              containerStyle={{width: '48%'}}
            />
          </View>

          <View style={{height: 10}}></View>
        </View>
      </RBSheet>
    </P2pHeader>
  );
};

export default p2pHome;

const styles = StyleSheet.create({
  searchIcon: {
    width: 25,
    height: 25,
    position: 'absolute',
    bottom: 13,
    left: 10,
  },
  paymentListContainer: {
    marginTop: 10,
    width: Screen.Width - 30,
    alignSelf: 'center',
  },
  searchInput: {
    width: '100%',
    zIndex: 9999,
    paddingHorizontal: 50,
    color: colors.white,
  },
  removeBtn: {
    width: 25,
    height: 25,
    backgroundColor: colors.white,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    bottom: 15,
    right: 10,
  },
  resetButton: {
    width: '48%',
    borderWidth: 1,
    backgroundColor: 'transparent',
    borderColor: colors.buttonBg,
  },
  paymentSheetList: {
    width: '45%',
    marginEnd: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.buttonBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
  },
  coin: {
    position: 'absolute',
    left: -35,
  },
  contain: {
    width: '20%',
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  currencyBoxInput: {
    width: '100%',
    height: 50,
    paddingHorizontal: 10,
    // color: 'white',
    backgroundColor: colors.sheetInput,
    borderRadius: 10,
  },
  currencyBox: {
    marginTop: 20,
    width: Screen.Width / 1.09,
    height: 50,
    borderRadius: 5,
    borderColor: colors.blackFive,
    // borderWidth: 1,
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.sheetInput,
  },
  divider: {
    height: borderWidth,
    backgroundColor: colors.dividerColor,
    marginVertical: 15,
  },
  listMainContainer: {
    width: Screen.Width - 15,
    alignSelf: 'center',
    padding: 5,
    marginVertical: 5,
  },
  userContain: {
    width: '100%',
    alignItems: 'center',
    flexDirection: 'row',
  },
  listImgStyle: {
    height: 15,
    width: 15,
  },
  customUserImage: {
    height: 25,
    width: 25,
  },
  horizontal: {
    marginHorizontal: 5,
  },
  sameStyle: {
    flexDirection: 'row',
    marginLeft: 5,
  },
  currencyTextBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  alignItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyImg: {
    height: 10,
    width: 10,
  },
  cornerStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  quantityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  buttonContain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  buyBtn: {
    backgroundColor: colors.green,
    width: '25%',
    height: 30,
  },
  sheetContainer: {
    backgroundColor: colors.p2pbgColor,
    height: Screen.Height / 3,
    borderRadius: 10,
  },
  currencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: colors.p2pbgColor,
    position: 'absolute',
    width: Screen.Width,
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  emptyView: {
    height: 25,
    width: 25,
  },
  removeImg: {
    height: 25,
    width: 25,
  },
  cryptoSheetContainer: {
    padding: 5,
    width: Screen.Width,
    marginTop: 25,
    flex: 1,
  },
  currencyListView: {
    width: 50,
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
});
