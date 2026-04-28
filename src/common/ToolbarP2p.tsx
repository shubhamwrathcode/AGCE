import React from 'react';
import {StyleSheet, View} from 'react-native';
import TouchableOpacityView from './TouchableOpacityView';
import FastImage from 'react-native-fast-image';
import {
  BACK_ICON,
  LOCKED,
  back_ic,
  history,
  logo,
  logoTwo,
  starFillIcon,
  starIcon,
} from '../helper/ImageAssets';
import {universalPaddingHorizontalHigh} from '../theme/dimens';
import NavigationService from '../navigation/NavigationService';
import {AppText, SEMI_BOLD, SIXTEEN, WHITE} from './AppText';
import {
  CONVERT_HISTORY_SCREEN,
  HOME_SCREEN,
  LAKED_STAKING,
  NAVIGATION_BOTTOM_TAB_STACK,
} from '../navigation/routes';
import {useAppDispatch, useAppSelector} from '../store/hooks';
import {setP2P} from '../slices/homeSlice';
import { colors } from '../theme/colors';

interface ToolbarProps {
  isLogo?: boolean;
  isSecond?: boolean;
  title?: string;
  isThird?: boolean;
  isFavorite?: boolean;
  onAdd?: () => void;
  isFourth?: boolean;
  isFifth?: boolean;
  onFifthPress?: () => void;
  isLock?: boolean;
}

const ToolbarP2p = ({
  isLogo = true,
  isSecond,
  title,
  isThird,
  isFavorite,
  onAdd,
  isFourth,
  isFifth,
  onFifthPress,
  isLock = false,
}: ToolbarProps) => {
  const p2p = useAppSelector(state => state.home.p2p);
  
  const dispatch = useAppDispatch();
  return (
    <View
      style={[
        styles.container,
        {justifyContent: isLogo || isSecond ? 'center' : 'flex-start'},
      ]}>
      <TouchableOpacityView
        style={
          isLogo || isSecond ? styles.backContainer : styles.backContainer2
        }
        onPress={() => {
            NavigationService.goBack();
        }}>
        <FastImage
          source={BACK_ICON}
          tintColor={colors.white}
          style={styles.backIcon}
          resizeMode="contain"
        />
      </TouchableOpacityView>
      {isLogo && !isSecond && (
        <FastImage
          source={logoTwo}
          style={styles.mainLogo}
          resizeMode="contain"
        />
      )}
      {isSecond && (
        <AppText type={SIXTEEN} weight={SEMI_BOLD} style={styles.title}>
          {title}
        </AppText>
      )}

      {isThird && (
        <TouchableOpacityView onPress={onAdd} style={styles.starContainer}>
          <FastImage
            source={isFavorite ? starFillIcon : starIcon}
            resizeMode="contain"
            style={styles.star}
          />
        </TouchableOpacityView>
      )}
      {isFourth && (
        <TouchableOpacityView
          activeOpacity={0.5}
          style={styles.starContainer}
          onPress={() => NavigationService.navigate(CONVERT_HISTORY_SCREEN)}>
          <FastImage
            resizeMode="contain"
            source={history}
            style={styles.star}
          />
        </TouchableOpacityView>
      )}
      {isLock && (
        <TouchableOpacityView
          activeOpacity={0.5}
          style={styles.starContainer}
          onPress={() => NavigationService.navigate(LAKED_STAKING)}>
          <FastImage
            resizeMode="contain"
            source={LOCKED}
            style={{right: 35, width: 25, height: 25}}
          />
        </TouchableOpacityView>
      )}
      {isFifth && (
        <TouchableOpacityView
          activeOpacity={0.5}
          style={styles.starContainer}
          onPress={onFifthPress}>
          <FastImage
            resizeMode="contain"
            source={history}
            style={styles.star}
          />
        </TouchableOpacityView>
      )}
    </View>
  );
};

export {ToolbarP2p};
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
  },
  backContainer: {
    position: 'absolute',
    top: 22,
    padding: universalPaddingHorizontalHigh,
    left: 0,
  },
  backContainer2: {
    padding: universalPaddingHorizontalHigh,
  },
  backIcon: {
    height: 16,
    width: 16,
  },
  mainLogo: {
    height: 50,
    width: 120,
    marginTop: 4,
  },
  title: {
    marginTop: 18,
  },
  star: {
    height: 25,
    width: 25,
  },
  starContainer: {
    position: 'absolute',
    top: 15,
    padding: universalPaddingHorizontalHigh,
    right: 0,
  },
});
