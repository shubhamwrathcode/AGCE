import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  AppSafeAreaView,
  AppText,
  BOLD,
  Button,
  FIFTEEN,
  MEDIUM,
  SECOND,
  SEMI_BOLD,
  THIRTEEN,
  TWELVE,
  Toolbar,
  WHITE,
  YELLOW,
} from '../../shared';
import {FlatList, ScrollView, StyleSheet, TextInput, View} from 'react-native';
import FastImage from 'react-native-fast-image';
import {
  INFO,
  LikeButton,
  SUCCESS_IMG,
  YELLOW_DONE,
  customUserImg,
  doneIcon,
  ruppeIcon,
  stroke,
} from '../../helper/ImageAssets';
import {colors} from '../../theme/colors';
import {Screen} from '../../theme/dimens';
import TouchableOpacityView from '../../shared/components/TouchableOpacityView';
import { ToolbarP2p } from '../../shared/components/ToolbarP2p';
import NavigationService from '../../navigation/NavigationService';
import { ORDER_CREATED } from '../../navigation/routes';

const BuyByCrypto = ({}) => {
  const [selectedOption, setSelectedOption] = useState('Fiat');
  const [selectedTab, setSelectedTab] = useState('Terms');
  const [selectedStatus, setSelectedStatus] = useState('Positive');
  const scrollViewRef = useRef(null);
  const termSectionRef = useRef(null);
  const feedbackSectionRef = useRef(null);
  const dataSectionRef = useRef(null);

  const scrollToTermSection = () => {
    var SCROLL_OFFSET = 350;
    termSectionRef.current.measureLayout(scrollViewRef.current, (x, y) => {
      const yOffset = Math.max(0, y - SCROLL_OFFSET);
      scrollViewRef.current.scrollTo({y: yOffset, animated: true});
    });
  };
  const scrollToFeedbackSection = () => {
    var SCROLL_OFFSET = 150;
    feedbackSectionRef.current.measureLayout(scrollViewRef.current, (x, y) => {
      const yOffset = Math.max(0, y - SCROLL_OFFSET);
      scrollViewRef.current.scrollTo({y: yOffset, animated: true});
    });
  };

  const scrollToDataSection = () => {
    var SCROLL_OFFSET = 250;
    dataSectionRef.current.measureLayout(scrollViewRef.current, (x, y) => {
      const yOffset = Math.max(0, y - SCROLL_OFFSET);
      scrollViewRef.current.scrollTo({y: yOffset, animated: true});
    });
  };

  const onSelectTab = key => {
    setSelectedTab(key);
  };

  const _statusRenderItem = useMemo(() => {
    const _renderItem = ({item, index}) => {
      return (
        <View style={styles.statusListContainer}>
          <View style={styles.listRow}>
            <View style={styles.customUserImage}>
              <FastImage
                source={customUserImg}
                resizeMode="contain"
                style={styles.customImg}
              />
              <View>
                <AppText style={styles.statusText}>ABC*****.com</AppText>

                <View>
                  <AppText style={styles.statusText}>
                    2024-04-05 DigitaleRupee
                  </AppText>
                  <AppText style={styles.statusText}>
                    Lorem Ipsum is simply dummy text of the printing and
                    typesetting industry.{' '}
                  </AppText>
                </View>
              </View>
            </View>

            <View style={styles.likeBtnContain}>
              <FastImage
                source={LikeButton}
                resizeMode="contain"
                tintColor={colors.secondaryText}
                style={styles.likeButton}
              />
            </View>
          </View>
        </View>
      );
    };
    return _renderItem;
  }, []);
  return (
    <AppSafeAreaView>
      <ToolbarP2p isSecond title="Buy USDT" isLogo={false} />
      <ScrollView ref={scrollViewRef} style={{flex: 1}}>
        <View style={styles.priceText}>
          <AppText
            type={FIFTEEN}
            weight={MEDIUM}
            style={{color: colors.secondaryText}}>
            Price<AppText style={{color: colors.buyBtnGreen}}> 90.50</AppText>
          </AppText>
          <FastImage
            source={stroke}
            resizeMode="contain"
            style={styles.strokeIcon}
          />
        </View>
        <View style={[styles.optionContain,]}>
          <View style={styles.optionstyle}>
            <TouchableOpacityView
              onPress={() => {
                setSelectedOption('Fiat');
              }}
              style={[
                styles.optionBtnStyle,
                {borderBottomWidth: selectedOption == 'Fiat' ? 1 : 0},
              ]}>
              <AppText type={THIRTEEN} weight={SEMI_BOLD}>
                By Fiat
              </AppText>
            </TouchableOpacityView>
            <TouchableOpacityView
              onPress={() => {
                setSelectedOption('Crypto');
              }}
              style={[
                styles.optionBtnStyle,
                {borderBottomWidth: selectedOption == 'Crypto' ? 1 : 0},
              ]}>
              <AppText type={THIRTEEN} weight={SEMI_BOLD}>
                By Crypto
              </AppText>
            </TouchableOpacityView>
          </View>
          <View style={styles.amountinputContain}>
            <View style={styles.containerRupeeImg}>
              <FastImage
                source={ruppeIcon}
                resizeMode="contain"
                style={styles.rupeeimgstyle}
              />
            </View>
            <TextInput
              placeholder="Enter Amount"
              placeholderTextColor={colors.white}
              keyboardType="decimal-pad"
              onChangeText={e => {}}
              style={styles.inputAmount}></TextInput>
            <View
              style={{
                width: '20%',
                alignItems: 'center',
              }}>
              <AppText color={YELLOW}>All</AppText>
            </View>
          </View>
          <AppText style={{alignSelf: 'center'}} color={SECOND}>
            Limit<AppText>{'   '}INR 1,000.00 - INR 4,474.45</AppText>
          </AppText>
          <View style={styles.digitalContain}>
            <View style={styles.heightBorder}></View>
            <TextInput
              placeholder="Digital eRupee"
              placeholderTextColor={colors.white}
              keyboardType="decimal-pad"
              onChangeText={e => {}}
              style={[
                styles.inputAmount,
                {width: '95%', paddingHorizontal: 10},
              ]}></TextInput>
          </View>
          <View style={styles.rowStyle}>
            <AppText color={SECOND}>Receive Quantity</AppText>
            <AppText>0.00 USDT</AppText>
          </View>
          <View style={styles.rowStyle}>
            <AppText color={SECOND}>Payment Method</AppText>
            <AppText>INR 0.00</AppText>
          </View>

          <Button
            containerStyle={styles.buyBtn}
            titleStyle={{color: colors.white}}
            children="Buy USDT"
            onPress={()=>{
              NavigationService.navigate(ORDER_CREATED)
            }}
          />

          <View style={styles.contentBox}>
            <View style={styles.contentView}>
              <AppText color={SECOND}>Receive Quantity</AppText>
              <FastImage
                source={INFO}
                resizeMode="contain"
                style={[styles.rupeeimgstyle, {marginHorizontal: 5}]}
              />
              <AppText> 15 Min</AppText>
            </View>
            <View style={[styles.contentView, {marginTop: 5}]}>
              <AppText color={SECOND}>Payment Method</AppText>
              <AppText color={SECOND} style={{color: colors.buttonBg}}>
                {' '}
                |
              </AppText>
              <AppText style={{}}> Digital eRupee</AppText>
            </View>
          </View>
          <View
            style={[
              styles.contentBox,
              {
                flexDirection: 'row',
                justifyContent: 'center',
                borderWidth: 0,
              },
            ]}>
            <TouchableOpacityView
              onPress={() => {
                onSelectTab('Terms');
                scrollToTermSection();
              }}
              style={[
                styles.tabBtnStyle,
                {backgroundColor: selectedTab == 'Terms' ? '#757575' : null},
              ]}>
              <AppText weight={SEMI_BOLD} color={WHITE}>
                Terms
              </AppText>
            </TouchableOpacityView>
            <TouchableOpacityView
              onPress={() => {
                onSelectTab('Feedback');
                scrollToFeedbackSection();
              }}
              style={[
                styles.tabBtnStyle,
                {backgroundColor: selectedTab == 'Feedback' ? '#757575' : null},
              ]}>
              <AppText weight={SEMI_BOLD} color={WHITE}>
                Feedback
              </AppText>
            </TouchableOpacityView>
            <TouchableOpacityView
              onPress={() => {
                onSelectTab('Data');
                scrollToDataSection();
              }}
              style={[
                styles.tabBtnStyle,
                {backgroundColor: selectedTab == 'Data' ? '#757575' : null},
              ]}>
              <AppText weight={SEMI_BOLD} color={WHITE}>
                Data
              </AppText>
            </TouchableOpacityView>
          </View>
          {/* Term OPTION CONTENT */}
          <View ref={termSectionRef}>
            <>
              <AppText
                type={THIRTEEN}
                weight={BOLD}
                color={SECOND}
                style={styles.adsText}>
                Advertiser’s Terms
              </AppText>
              <View style={styles.infoBoxContain}>
                <FastImage
                  source={INFO}
                  resizeMode="contain"
                  tintColor={colors.infoBoxTextColor}
                  style={styles.infoIcon}
                />
                <AppText style={styles.infoBoxTextColor}>
                  Lorem Ipsum is simply dummy text of the printing and
                  typesetting industry.
                </AppText>
              </View>
              <View style={styles.content}>
                <AppText color={WHITE}>No third party payment</AppText>

                <AppText color={WHITE}>Only digital e rupees payment</AppText>

                <AppText color={WHITE}>Other wise cancel order</AppText>
              </View>
            </>
          </View>
          <View style={styles.divider}></View>
          {/* Feedback OPTION CONTENT */}
          <View style={{flex: 1}} ref={feedbackSectionRef}>
            <>
              <AppText
                type={THIRTEEN}
                weight={BOLD}
                color={SECOND}
                style={styles.adsText}>
                Feedback
              </AppText>

              <View style={styles.feedBackText}>
                <FastImage
                  source={INFO}
                  tintColor={colors.buyBtnGreen}
                  style={styles.infoImg}
                  resizeMode="contain"
                />
                <AppText
                  type={THIRTEEN}
                  weight={BOLD}
                  style={styles.percentText}>
                  93.55%
                </AppText>
                <AppText
                  type={THIRTEEN}
                  color={SECOND}
                  style={{marginHorizontal: 5}}>
                  |
                </AppText>
                <AppText
                  type={THIRTEEN}
                  color={WHITE}
                  style={{marginHorizontal: 5}}>
                  (993) Review(s)
                </AppText>
              </View>
              <View style={styles.statusContain}>
                <TouchableOpacityView
                  onPress={() => {
                    setSelectedStatus('Positive');
                  }}
                  style={[
                    styles.positiveBtn,
                    {
                      backgroundColor:
                        selectedStatus === 'Positive'
                          ? colors.secondaryText
                          : null,
                    },
                  ]}>
                  <AppText>Positive (929)</AppText>
                </TouchableOpacityView>

                <TouchableOpacityView
                  onPress={() => {
                    setSelectedStatus('Negative');
                  }}
                  style={[
                    styles.positiveBtn,
                    {
                      backgroundColor:
                        selectedStatus === 'Negative'
                          ? colors.secondaryText
                          : null,
                    },
                  ]}>
                  <AppText>Negative (64)</AppText>
                </TouchableOpacityView>
              </View>

              <FlatList data={[1, 2, 3]} renderItem={_statusRenderItem} />
              <TouchableOpacityView>
                <AppText
                  color={YELLOW}
                  style={{
                    textDecorationLine: 'underline',
                    alignSelf: 'center',
                  }}>
                  View all
                </AppText>
              </TouchableOpacityView>
              <View style={styles.divider}></View>
            </>
          </View>
          {/* DATA OPTION CONTENT */}
          <View ref={dataSectionRef} style={{minHeight: '100%'}}>
            <>
              <View style={styles.dataRow}>
                <AppText weight={BOLD} color={SECOND} type={THIRTEEN}>
                  DATA
                </AppText>
                <TouchableOpacityView style={{flexDirection: 'row'}}>
                  <AppText
                    color={YELLOW}
                    style={{textDecorationLine: 'underline'}}>
                    {'View Profile'}
                    <AppText
                      type={THIRTEEN}
                      color={YELLOW}
                      style={{textDecorationLine: 'underline'}}>
                      {' >'}
                    </AppText>
                  </AppText>
                </TouchableOpacityView>
              </View>
              <View style={styles.dataContentView}>
                <View style={styles.customImgView}>
                  <FastImage
                    source={customUserImg}
                    style={{width: 20, height: 20}}
                    resizeMode="contain"
                  />
                  <View>
                    <AppText
                      type={THIRTEEN}
                      color={WHITE}
                      style={{marginHorizontal: 10}}>
                      ABCDEF
                    </AppText>
                  </View>
                  <FastImage
                    source={YELLOW_DONE}
                    style={styles.sameStyleImg}
                    resizeMode="contain"
                  />
                </View>

                <View style={styles.successImage}>
                  <FastImage
                    tintColor={colors.green}
                    source={SUCCESS_IMG}
                    style={styles.onlineImg}
                    resizeMode="contain"
                  />
                  <AppText color={SECOND} style={{marginHorizontal: 10}}>
                    {'online'}
                  </AppText>
                </View>

                <View style={styles.onlineBelowContent}>
                  <View style={styles.yellowDownImg}>
                    <FastImage
                      source={YELLOW_DONE}
                      style={styles.sameStyleImg}
                      resizeMode="contain"
                    />
                    <AppText color={WHITE} style={styles.contactLeft}>
                      {'Verified Merchant'}
                    </AppText>
                  </View>

                  <View style={styles.depositeSection}>
                    <FastImage
                      source={INFO}
                      style={styles.sameStyleImg}
                      resizeMode="contain"
                    />
                    <AppText color={WHITE} style={styles.contactLeft}>
                      {'Deposit 2000 USDT'}
                    </AppText>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <View style={styles.contactView}>
                    <AppText color={WHITE} style={styles.contactLeft}>
                      {'Email'}
                    </AppText>
                    <FastImage
                      source={doneIcon}
                      style={styles.contactImg}
                      resizeMode="contain"
                    />
                  </View>

                  <View style={styles.contactView}>
                    <AppText color={WHITE} style={styles.contactLeft}>
                      {'SMS'}
                    </AppText>
                    <FastImage
                      source={doneIcon}
                      style={styles.contactImg}
                      resizeMode="contain"
                    />
                  </View>

                  <View style={styles.contactView}>
                    <AppText color={WHITE} style={styles.contactLeft}>
                      {'KYC'}
                    </AppText>
                    <FastImage
                      source={doneIcon}
                      style={styles.contactImg}
                      resizeMode="contain"
                    />
                  </View>

                  <View style={styles.contactView}>
                    <AppText color={WHITE} style={styles.contactLeft}>
                      {'Address'}
                    </AppText>
                    <FastImage
                      source={doneIcon}
                      style={styles.contactImg}
                      resizeMode="contain"
                    />
                  </View>
                </View>

                <View style={styles.tradeView}>
                  <View>
                    <AppText type={THIRTEEN} color={WHITE}>
                      {'852'}
                    </AppText>

                    <AppText type={TWELVE} color={SECOND}>
                      {'30d Trades [time(s)]'}
                    </AppText>
                  </View>

                  <View>
                    <AppText type={THIRTEEN} color={WHITE}>
                      {'94.28%'}
                    </AppText>

                    <AppText type={TWELVE} color={SECOND}>
                      {'30d Completion Rate'}
                    </AppText>
                  </View>
                </View>

                <View style={styles.datalastView}>
                  <View style={styles.spaceBetween}>
                    <AppText color={SECOND}>{'Avg. Release Time'}</AppText>

                    <AppText color={WHITE}>{'10.17 Minutes(s)'}</AppText>
                  </View>
                </View>

                <View style={styles.datalastView}>
                  <View style={styles.spaceBetween}>
                    <AppText color={SECOND}>{'Avg. Pay Time'}</AppText>

                    <AppText color={WHITE}>{'9.73 Minutes(s)'}</AppText>
                  </View>
                </View>
              </View>
            </>
          </View>
          <View style={{height: 30}}></View>
        </View>
      </ScrollView>
    </AppSafeAreaView>
  );
};
export default BuyByCrypto;

const styles = StyleSheet.create({
  spaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  datalastView: {
    padding: 5,
    width: Screen.Width - 100,
    alignSelf: 'center',
  },
  tradeView: {
    flexDirection: 'row',
    marginVertical: 15,
    justifyContent: 'space-between',
  },
  contactLeft: {
    marginHorizontal: 5,
  },
  contactImg: {
    width: 13,
    height: 13,
  },
  contactView: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 30,
    justifyContent: 'space-between',
  },
  sameStyleImg: {
    width: 15,
    height: 15,
  },
  depositeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 5,
  },
  yellowDownImg: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineBelowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 30,
  },
  onlineImg: {
    width: 10,
    position: 'absolute',
    top: 2,
    height: 10,
  },
  successImage: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 30,
  },
  customImgView: {
    flexDirection: 'row',
    width: '100%',
    alignSelf: 'center',
    alignItems: 'center',
  },
  dataContentView: {
    width: Screen.Width - 30,
    padding: 5,
    alignSelf: 'center',
  },
  dataRow: {
    flexDirection: 'row',
    width: Screen.Width - 30,
    justifyContent: 'space-between',
    padding: 5,
    alignSelf: 'center',
  },
  likeButton: {
    width: 20,
    height: 20,
  },
  likeBtnContain: {
    width: '20%',
    alignItems: 'flex-end',
  },
  statusText: {
    marginLeft: 10,
  },
  customImg: {
    width: 25,
    height: 25,
  },
  customUserImage: {
    flexDirection: 'row',
    width: '80%',
  },
  listRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusListContainer: {
    width: '95%',
    padding: 5,
    alignSelf: 'center',
    marginVertical: 10,
  },
  positiveBtn: {
    width: '35%',

    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
  },
  statusContain: {
    flexDirection: 'row',
    width: '95%',
    padding: 5,
    marginLeft: 12,
  },
  percentText: {
    marginHorizontal: 5,
    color: colors.buyBtnGreen,
  },
  infoImg: {
    width: 15,
    height: 15,
    top: 2,
  },
  feedBackText: {
    width: '90%',
    alignSelf: 'center',
    padding: 5,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  divider: {
    width: Screen.Width,
    height: 0.5,
    backgroundColor: colors.white,
    marginVertical: 10,
  },
  content: {
    marginHorizontal: 15,
    marginVertical: 10,
  },
  adsText: {
    marginHorizontal: 15,
  },
  infoBoxContain: {
    width: '85%',
    backgroundColor: colors.infoBox,
    padding: 5,
    alignSelf: 'center',
    borderRadius: 5,
    marginVertical: 10,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  infoIcon: {
    width: 15,
    height: 15,
  },
  infoBoxTextColor: {
    color: colors.infoBoxTextColor,
    marginHorizontal: 10,
  },
  tabBtnStyle: {
    width: '30%',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: 5,
  },
  contentView: {
    alignItems: 'center',
    flexDirection: 'row',
    marginHorizontal: 2,
  },
  contentBox: {
    width: Screen.Width - 50,
    borderWidth: 0.7,
    borderColor: colors.secondaryText,
    borderRadius: 5,
    alignSelf: 'center',
    padding: 10,
    marginVertical: 10,
  },
  buyBtn: {
    width: Screen.Width - 50,
    marginVertical: 10,
    alignSelf: 'center',
    backgroundColor: colors.buyBtnGreen,
  },
  rowStyle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: Screen.Width - 20,
    alignSelf: 'center',
    paddingHorizontal: 18,
    marginTop: 10,
  },
  digitalRupeeText: {
    alignSelf: 'center',
    marginLeft: 5,
  },
  heightBorder: {
    height: 15,
    backgroundColor: colors.buttonBg,
    width: 1,
    marginLeft: 10,
  },
  digitalContain: {
    marginTop: 5,
    width: '90%',
    height: 50,
    borderRadius: 10,
    borderColor: colors.blackFive,
    borderWidth: 1,
    alignSelf: 'center',
    flexDirection: 'row',
    backgroundColor: '#757575',
    alignItems: 'center',
  },
  amountinputContain: {
    width: Screen.Width - 45,
    backgroundColor: '#757575',
    height: 45,
    alignSelf: 'center',
    marginVertical: 20,
    flexDirection: 'row',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  containerRupeeImg: {
    width: '10%',
    alignItems: 'center',
  },
  inputAmount: {
    width: '70%',
    color: colors.white,
    fontSize: 13,
  },
  rupeeimgstyle: {
    width: 12,
    height: 12,
  },
  coin: {
    position: 'absolute',
    left: -50,
  },
  contain: {
    width: '20%',
    height: 50,
    // backgroundColor: "transparent",
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    //  zIndex: 9999
  },
  currencyBoxInput: {
    width: '100%',
    height: 50,
    borderColor: '#343434',
    paddingHorizontal: 25,
    backgroundColor: '#757575',
    borderRadius: 10,
    color: 'white',
  },
  currencyBox: {
    marginTop: 5,
    width: '90%',
    height: 50,
    borderRadius: 10,
    borderColor: colors.blackFive,
    borderWidth: 1,
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceText: {
    flexDirection: 'row',
    alignItems: 'center',
    width: Screen.Width - 30,
    marginVertical: 5,
    alignSelf: 'center',
    padding: 5,
  },
  strokeIcon: {
    width: 16,
    height: 16,
    marginHorizontal: 5,
  },
  optionContain: {
    flex: 1,
    alignSelf: 'center',
    backgroundColor: colors.sheetInput,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  optionstyle: {
    height: 45,

    borderBottomWidth: 0.5,
    borderBottomColor: colors.white,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
  },
  optionBtnStyle: {
    width: Screen.Width / 2 - 100,
    height: 45,
    borderColor: colors.buttonBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
