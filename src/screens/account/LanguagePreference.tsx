import React, {useState} from 'react';
import {
  AppSafeAreaView,
  AppText,
  Button,
  SEMI_BOLD,
  Toolbar,
} from '../../shared';
import {checkIcon} from '../../helper/ImageAssets';
import KeyBoardAware from '../../shared/components/KeyboardAware';
import TouchableOpacityView from '../../shared/components/TouchableOpacityView';
import {StyleSheet, View} from 'react-native';
import {colors} from '../../theme/colors';
import {
  borderWidth,
  universalPaddingHorizontal,
  universalPaddingHorizontalHigh,
  universalPaddingTop,
} from '../../theme/dimens';
import FastImage from 'react-native-fast-image';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {SpinnerSecond} from '../../shared/components/SpinnerSecond';
import {SELECTED_LANGUAGE} from '../../helper/Constants';
import {translate} from 'google-translate-api-x';
import {setLanguages, setSelectedLanguage} from '../../slices/accountSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {languages} from '../../helper/languages';
import {showError} from '../../helper/logger';
import NavigationService from '../../navigation/NavigationService';

const LanguagePreference = () => {
  const dispatch = useAppDispatch();
  const selectedLanguage = useAppSelector(state => {
    return state.account.selectedLanguage;
  });
  const [currency, setCurrency] = useState(selectedLanguage);
  const [isLoading, setIsLoading] = useState(false);
  const data = [
    {
      title: 'English',
      key: 1,
      name: 'en',
    },
    {
      title: 'Hindi',
      key: 2,
      name: 'hi',
    },
    {
      title: 'Chinese',
      key: 3,
      name: 'zh-CN',
    },
    {
      title: 'Arabic',
      key: 4,
      name: 'ar',
    },
    {
      title: 'French',
      key: 5,
      name: 'fr',
    },
  ];
  const onSubmit = async () => {
    setIsLoading(true);
    try {
      const res = await translate(languages, {
        from: 'auto',
        to: currency,
      });
      dispatch(setLanguages(res));
      dispatch(setSelectedLanguage(currency));
      await AsyncStorage.setItem(SELECTED_LANGUAGE, currency);
      showError('Language Update Successfully');
      NavigationService.goBack();
    } catch (error) {
      console.error('An error occurred:', error);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <AppSafeAreaView>
      <Toolbar isSecond title={'Change Language'} />
      <KeyBoardAware style={styles.container}>
        {data?.map(e => {
          return (
            <TouchableOpacityView
              onPress={() => setCurrency(e.name)}
              style={[styles.singleBox, e.name === currency && styles.selected]}
              key={e.key?.toString()}>
              <View style={styles.singleBoxSecond}>
                <AppText weight={SEMI_BOLD}>{e?.title}</AppText>
              </View>
              {e.name === currency && (
                <View style={styles.rightIcContainer}>
                  <FastImage
                    source={checkIcon}
                    resizeMode="contain"
                    style={styles.rightIc}
                  />
                </View>
              )}
            </TouchableOpacityView>
          );
        })}
        <Button
          children="Save Changes"
          onPress={() => onSubmit()}
          containerStyle={styles.button}
        />
      </KeyBoardAware>
      <SpinnerSecond loading={isLoading} />
    </AppSafeAreaView>
  );
};

export default LanguagePreference;
const styles = StyleSheet.create({
  singleBox: {
    backgroundColor: colors.inputBackground,
    paddingHorizontal: universalPaddingHorizontalHigh,
    marginVertical: universalPaddingHorizontal,
    paddingVertical: universalPaddingHorizontal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: borderWidth,
    borderColor: colors.inputBorder,
    borderRadius: 10,
    marginHorizontal: universalPaddingHorizontalHigh,
  },
  selected: {borderColor: colors.buttonBg},
  container: {
    paddingTop: universalPaddingTop,
    paddingHorizontal: 0,
  },
  icon: {
    height: 22,
    width: 22,
    marginEnd: 10,
  },
  singleBoxSecond: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {marginTop: 50, marginHorizontal: universalPaddingHorizontalHigh},
  rightIc: {
    height: 20,
    width: 20,
  },
  rightIcContainer: {
    height: 20,
    width: 20,
    position: 'absolute',
    right: -5,
    top: -8,
  },
});
