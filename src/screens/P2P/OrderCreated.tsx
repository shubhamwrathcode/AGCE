import React from 'react';
import {
  AppSafeAreaView,
  AppText,
  BOLD,
  FOURTEEN,
  GREEN,
  MEDIUM,
  SECOND,
  THIRTEEN,
  TWELVE,
  WHITE,
} from '../../shared';
import {ToolbarP2p} from '../../shared/components/ToolbarP2p';
import {StyleSheet, View} from 'react-native';
import {Screen} from '../../theme/dimens';
import FastImage from 'react-native-fast-image';
import {
  CHAT_IMG,
  DOWN_ARROW,
  Down_Imgs,
  arrowRightIcon,
  customUserImg,
  downIcon,
  right_ic,
  rupeeIcon,
  ruppeIcon,
} from '../../helper/ImageAssets';
import TouchableOpacityView from '../../shared/components/TouchableOpacityView';
import {colors} from '../../theme/colors';
import SpaceBetweenView from '../../shared/components/SpaceBetweenView';

const OrderCreated = () => {
  return (
    <AppSafeAreaView>
      <ToolbarP2p isSecond title="" />

      <View style={styles.headingView}>
        <AppText type={FOURTEEN} weight={BOLD}>
          Order Created
        </AppText>
        <AppText type={THIRTEEN} color={SECOND} weight={MEDIUM}>
          Pay seller within <AppText>14:58</AppText>
        </AppText>
      </View>
      <View style={[styles.headingView, {flexDirection: 'row'}]}>
        <View style={styles.userImgContain}>
          <FastImage
            source={customUserImg}
            resizeMode="contain"
            style={styles.customerImg}
          />
          <View style={styles.nameContainer}>
            <View>
              <AppText type={THIRTEEN} style={{marginHorizontal: 10}}>
                ABCDEF
              </AppText>
              <AppText type={THIRTEEN} style={styles.textContain}>
                Seller’s Crypto is escrowed by Zillion
              </AppText>
            </View>
            <FastImage
              source={right_ic}
              resizeMode="contain"
              style={styles.rightIcon}
            />
          </View>
          <View></View>
        </View>
        <TouchableOpacityView style={styles.chatImgContain}>
          <FastImage
            source={CHAT_IMG}
            resizeMode="contain"
            style={styles.chatIcon}
          />
        </TouchableOpacityView>
      </View>
      <View
        style={[
          styles.headingView,
          {borderWidth: 1, borderColor: colors.textGray, borderRadius: 5},
        ]}>
        <AppText type={FOURTEEN} weight={BOLD} style={styles.buyText}>
          Buy
          <AppText weight={BOLD} type={FOURTEEN}>
            {' '}
            USDT
          </AppText>
        </AppText>

        <View style={styles.rowContent}>
          <AppText type={THIRTEEN} color={SECOND}>
            Fiat Amount
          </AppText>
          <View style={styles.iconView}>
            <FastImage
              source={ruppeIcon}
              resizeMode="contain"
              style={styles.rupeeImg}
            />
            <AppText type={THIRTEEN} color={WHITE}>
              1,000.00
            </AppText>
          </View>
        </View>

        <View style={styles.rowContent}>
          <AppText type={THIRTEEN} color={SECOND}>
            Price
          </AppText>
          <View style={styles.iconView}>
            <FastImage
              source={ruppeIcon}
              resizeMode="contain"
              style={styles.rupeeImg}
            />
            <AppText type={THIRTEEN} color={WHITE}>
              91.39
            </AppText>
          </View>
        </View>

        <View style={styles.rowContent}>
          <AppText type={THIRTEEN} color={SECOND}>
            Receive Quantity
          </AppText>
          <View style={styles.iconView}>
            <AppText type={THIRTEEN} color={WHITE}>
              10.94 USDT
            </AppText>
          </View>
        </View>
        <FastImage
          source={DOWN_ARROW}
          resizeMode="contain"
          style={styles.downIcon}
        />
      </View>

      <SpaceBetweenView
        firstText={'Payment Method'}
        secondText={'Digital eRupee'}
        Firststyle={{color: colors.white}}
      />

      <View
        style={[
          styles.headingView,
          {
            flexDirection: 'row',
            marginVertical: 0,
            justifyContent: 'space-between',
          },
        ]}>
        <AppText type={TWELVE}>Advertiser’s Terms</AppText>
        <FastImage
          source={Down_Imgs}
          resizeMode="contain"
          style={styles.downIcon}
        />
      </View>
    </AppSafeAreaView>
  );
};

export default OrderCreated;
const styles = StyleSheet.create({
  downIcon: {
    alignSelf: 'center',
    marginVertical: 3,
    width: 12,
    height: 12,
  },
  rupeeImg: {
    width: 10,
    height: 10,
    bottom: 1,
    right: 3,
  },
  iconView: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
    marginVertical: 5,
  },
  buyText: {
    marginHorizontal: 5,
    color: colors.buyBtnGreen,
    marginTop: 10,
  },
  rightIcon: {
    width: 10,
    height: 10,
    position: 'absolute',
    left: 70,
    top: 5,
  },
  textContain: {
    marginHorizontal: 10,
    marginTop: 5,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerImg: {
    width: 25,
    height: 25,
  },
  userImgContain: {
    flexDirection: 'row',
    width: '80%',
  },
  chatImgContain: {
    alignItems: 'flex-end',
    width: '20%',
  },
  chatIcon: {
    width: 30,
    height: 30,
  },
  headingView: {
    width: Screen.Width - 30,
    padding: 5,
    alignSelf: 'center',
    marginVertical: 10,
  },
});
