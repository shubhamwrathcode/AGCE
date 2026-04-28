import React, {useEffect} from 'react';
import {FlatList, StyleSheet, View} from 'react-native';
import {
  AppText,
  FIFTEEN,
  FOURTEEN,
  MEDIUM,
  SECOND,
  SEMI_BOLD,
  TEN,
  THIRD,
} from '../../shared';
import {getStaking} from '../../actions/homeActions';
import {colors} from '../../theme/colors';
import {CoinCardProps} from '../../helper/types';
import TouchableOpacityView from '../../shared/components/TouchableOpacityView';
import NavigationService from '../../navigation/NavigationService';
import FastImage from 'react-native-fast-image';
import {toFixedThree} from '../../helper/utility';
import {useAppSelector, useAppDispatch} from '../../store/hooks';
import {BASE_URL} from '../../helper/Constants';
import {Screen} from '../../theme/dimens';
import {STAKING} from '../../navigation/routes';
import { useTheme } from '../../hooks/useTheme';

const StakingTrade: React.FC = () => {
  const { colors: themeColors, theme, isDark } = useTheme();
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(getStaking());
  }, []);
  const stakingData = useAppSelector(state => state.home.stakingHome);
  
  const stakingRenderItem = ({item}: CoinCardProps) => {
    let url = `${BASE_URL}${item?.icon_path}`;
    return (
      <TouchableOpacityView
        style={styles.container}
        onPress={() =>
          NavigationService.navigate(STAKING, {stakingCoinDetail: item})
        }>
        <View style={styles.containerSecond}>
          <FastImage
            source={{uri: url}}
            resizeMode="contain"
            style={styles.icon}
          />
          <View>
            <AppText>{item?.name ? item?.name : item?.short_name}</AppText>
            <AppText type={TEN} color={SECOND}>
              {item?.short_name}
            </AppText>
          </View>
        </View>
        <View style={styles.containerThird}>
          <AppText weight={SEMI_BOLD}>{toFixedThree(item?.balance)}</AppText>
        </View>
      </TouchableOpacityView>
    );
  };

  return (
    <>
      <View style={styles.tabConatiner}>
        <View style={styles.firstTab}>
          <AppText weight={MEDIUM} type={FOURTEEN} style={styles.numberStyle}>
            1
          </AppText>
        </View>
        <View
          style={[styles.border, {backgroundColor: colors.buttonBg}]}></View>
        <View style={styles.otherTab}>
          <AppText
            weight={MEDIUM}
            color={THIRD}
            type={FOURTEEN}
            style={styles.numberStyle}>
            2
          </AppText>
        </View>
        <View style={[styles.border, {backgroundColor: isDark ? colors.white : colors.black}]}></View>
        <View style={styles.otherTab}>
          <AppText
            weight={MEDIUM}
            color={THIRD}
            type={FOURTEEN}
            style={styles.numberStyle}>
            3
          </AppText>
        </View>
      </View>
      <AppText weight={MEDIUM} type={FIFTEEN} style={styles.heading}>
        Available to stake
      </AppText>
      <View style={{marginTop: 10}}></View>
      <FlatList data={stakingData} renderItem={stakingRenderItem} />
    </>
  );
};

export default StakingTrade;
const styles = StyleSheet.create({
  heading: {
    marginHorizontal: 15,
  },
  containerSecond: {flex: 1, flexDirection: 'row'},
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    width: Screen.Width - 20,
    alignSelf: 'center',
    marginTop: 5,
  },
  imgBg: {
    width: Screen.Width,
    height: Screen.Height,
  },
  listView: {
    width: Screen.Width,
    borderBottomWidth: 1,
    borderColor: colors.textGray,
    paddingBottom: 5,
  },
  emptySpace: {
    height: 40,
  },
  listItemStyle: {
    marginHorizontal: 12,
  },
  bedge: {
    height: 25,
    borderRadius: 5,
    backgroundColor: colors.green,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 10,
  },
  arrow: {
    height: 8,
    width: 8,
    marginEnd: 5,
    marginBottom: 2,
  },
  containerThird: {flex: 1, alignItems: 'flex-end'},
  icon: {
    height: 30,
    width: 30,
    marginEnd: 10,
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
  },
  otherTab: {
    backgroundColor: colors.transparent,
    width: 25,
    height: 25,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.grey,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
