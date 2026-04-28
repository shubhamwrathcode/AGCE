import React, {useEffect, useRef, useState} from 'react';
import {
  AppSafeAreaView,
  AppText,
  FOURTEEN,
  MEDIUM,
  SIXTEEN,
  THIRD,
  THIRTY,
  Toolbar,
} from '../../shared';
import {SUCCESS_IMG, welcomeBg} from '../../helper/ImageAssets';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {colors} from '../../theme/colors';
import {Screen} from '../../theme/dimens';
import FastImage from 'react-native-fast-image';
import NavigationService from '../../navigation/NavigationService';
import { LAKED_STAKING } from '../../navigation/routes';
import { useRoute } from '@react-navigation/native';

const StakingSuccess = (): JSX.Element => {
  const route = useRoute();
  console.log(route?.params?.stakeCurrency)
  return (
    <AppSafeAreaView>
      <View style={{flex: 1}}>
        <Toolbar isLogo={false} title="Staking" isSecond />

        <View style={styles.tabConatiner}>
          <View style={styles.firstTab}>
            <AppText weight={MEDIUM} type={FOURTEEN} style={styles.numberStyle}>
              1
            </AppText>
          </View>
          <View style={styles.border}></View>
          <View style={styles.otherTab}>
            <AppText
              weight={MEDIUM}
              color={FOURTEEN}
              type={FOURTEEN}
              style={styles.numberStyle}>
              2
            </AppText>
          </View>
          <View style={styles.border}></View>
          <View style={styles.otherTab}>
            <AppText
              weight={MEDIUM}
              color={FOURTEEN}
              type={FOURTEEN}
              style={styles.numberStyle}>
              3
            </AppText>
          </View>
        </View>

        <View style={styles.successImgContain}>
          <FastImage
            source={SUCCESS_IMG}
            resizeMode="contain"
            style={styles.successImg}
          />
          <View style={styles.textContain}>
            <AppText type={SIXTEEN} weight={MEDIUM}>
              You Have
            </AppText>
            <AppText type={THIRTY} weight={MEDIUM}>
              successfully
            </AppText>
            <AppText type={SIXTEEN} weight={MEDIUM}>
              staked 1 {route?.params?.stakeCurrency}
            </AppText>
          </View>
        </View>
       
      </View>
    </AppSafeAreaView>
  );
};

export default StakingSuccess;
const styles = StyleSheet.create({
  textContain: {
    width: Screen.Width,
    padding: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  successImg: {
    width: 200,
    height: 200,
  },
  successImgContain: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    bottom: 50,
  },
  tabConatiner: {
    flexDirection: 'row',
    alignItems: 'center',
    width: Screen.Width / 2,
    padding: 5,
    alignSelf: 'center',
    marginVertical: 25,
    justifyContent: 'center',
  },
  firstTab: {
    backgroundColor: colors.buttonBg,
    width: 25,
    height: 25,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberStyle: {
    top: 1,
  },
  border: {
    width: 50,
    height: 1,
    backgroundColor: colors.buttonBg,
  },
  otherTab: {
    width: 25,
    height: 25,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.buttonBg,
  },
});
