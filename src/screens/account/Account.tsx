import React, { useState } from 'react';
import {
  AppSafeAreaView,
  AppText,
  BLACK,
  BOLD,
  Button,
  CommonModal,
  FOURTEEN,
  Header,
  Input,
  RED,
  SECOND,
  SEMI_BOLD,
  SIXTEEN,
  TEN,
  TWELVE,
  WHITE,
} from '../../shared';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import TouchableOpacityView from '../../shared/components/TouchableOpacityView';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';
import {
  borderWidth,
  universalPaddingHorizontal,
  universalPaddingHorizontalHigh,
} from '../../theme/dimens';
import {
  about_us_ic,
  bank_ic,
  contact_ic,
  invite_ic,
  kyc_ic,
  notification_bell_ic,
  profile_bg,
  profile_placeholder_ic,
  rate_ic,
  right_ic,
  settings_ic,
  lock_ic,
  MAINHOME_BG,
  HomeBg
} from '../../helper/ImageAssets';
import FastImage from 'react-native-fast-image';
import NavigationService from '../../navigation/NavigationService';
import {
  ACTIVITY_LOGS,
  PAYMENT_OPTIONS_SCREEN,
  CMS_SCREEN,
  CONTACT_US_SCREEN,
  EDIT_PROFILE_SCREEN,
  INVITE_AND_EARN_SCREEN,
  KYC_STATUS_SCREEN,
  NOTIFICATION_SETTINGS_SCREEN,
  SETTINGS_SCREEN,
  TWO_FACTOR_AUTHENTICATION,
  UPDATE_KGIN_SCREEN,
} from '../../navigation/routes';
import KeyBoardAware from '../../shared/components/KeyboardAware';
import { logoutAction } from '../../actions/authActions';
import { BASE_URL, placeHolderText } from '../../helper/Constants';
import ReactNativeModal from 'react-native-modal';
import { commonStyles } from '../../theme/commonStyles';
import StarRating from 'react-native-star-svg-rating';
import { SpinnerSecond } from '../../shared/components/SpinnerSecond';
import { updateRating } from '../../actions/accountActions';
import { LogoutModal } from '../../shared/components/LogoutModal';
import { checkValue } from '../../helper/utility';

const ProfileBox = () => {
  const languages = useAppSelector(state => {
    return state.account.languages;
  });
  const userData = useAppSelector(state => state.auth.userData);
  const { firstName, lastName, emailId, mobileNumber, profilepicture } =
    userData ?? '';
  return (
    <TouchableOpacityView
      onPress={() => NavigationService.navigate(EDIT_PROFILE_SCREEN)}
      style={styles.profileBoxContainer}>
      <View style={styles.profileBoxContainerSecond}>
        <ImageBackground
          source={profile_bg}
          resizeMode="contain"
          style={styles.profileBg}>
          <FastImage
            source={
              profilepicture
                ? { uri: `${BASE_URL}${profilepicture}` }
                : profile_placeholder_ic
            }
            resizeMode="contain"
            style={styles.profileImage}
          />
        </ImageBackground>
        <View>
          <AppText
            color={firstName ? WHITE : SECOND}
            type={firstName ? TWELVE : TEN}>
            {firstName
              ? `${firstName} ${lastName}`
              : checkValue(languages?.profile_one)}
          </AppText>
          <AppText>{`${mobileNumber ?? ''}`}</AppText>
        </View>
      </View>
      <FastImage
        source={right_ic}
        resizeMode="contain"
        style={styles.rightIc}
      />
    </TouchableOpacityView>
  );
};

const RenderBox = ({ title, data, onPressAction }) => {
  return (
    <View>
      <View style={styles.singleContainerTitle}>
        <AppText color={SECOND} type={FOURTEEN}>
          {title}
        </AppText>
      </View>
      {data?.map(e => {
        return (
          <TouchableOpacityView
            onPress={() => onPressAction(e.id)}
            key={e.id}
            style={styles.singleContainerFill}>
            <View style={styles.singleContainerFillSecond}>
              <FastImage
                source={e.icon}
                resizeMode="contain"
                style={styles.icon}
              />
              <AppText weight={SEMI_BOLD} type={FOURTEEN}>
                {e.title}
              </AppText>
            </View>
            <FastImage
              source={right_ic}
              resizeMode="contain"
              style={styles.rightIc}
            />
          </TouchableOpacityView>
        );
      })}
    </View>
  );
};

const RatingModal = ({ isVisible, setIsVisible }) => {
  const dispatch = useAppDispatch();
  const [rating, setRating] = useState(3);
  const [message, setMessage] = useState('');

  const onSend = () => {
    let data = { rating: rating, message: message };
    dispatch(updateRating(data));
    setIsVisible();
  };

  return (
    <ReactNativeModal
      animationOut={'slideOutDown'}
      isVisible={isVisible}
      backdropOpacity={1}
      onBackdropPress={setIsVisible}
      onBackButtonPress={setIsVisible}>
      <View style={styles.ratingContainer}>
        <View style={styles.ratingHeader}>
          <AppText color={BLACK} weight={BOLD} type={SIXTEEN}>
            Rate Zillion Exchange
          </AppText>
        </View>
        <View style={styles.ratingBody}>
          <AppText style={commonStyles.centerText}>
            How much you would like to rate us from{'\n'}your experience
          </AppText>
          <View style={styles.starContainer}>
            <StarRating
              rating={rating}
              onChange={setRating}
              maxStars={5}
              starSize={28}
              emptyColor={'#A3A3A3'}
            />
          </View>
          <Input
            value={message}
            placeholder={placeHolderText.message}
            multiline
            containerStyle={styles.inputMainContainer}
            onChangeText={setMessage}
          />
          <View style={styles.buttonContainer}>
            <Button
              children="Cancel"
              onPress={setIsVisible}
              containerStyle={styles.noButton}
              titleStyle={styles.buttonTitle}
            />
            <Button
              children="Send"
              onPress={() => onSend()}
              containerStyle={styles.yesButton}
              titleStyle={styles.buttonTitle2}
            />
          </View>
        </View>
      </View>
    </ReactNativeModal>
  );
};

const Account = () => {
  const dispatch = useAppDispatch();
  const [isLogout, setIsLogout] = useState(false);
  // const [isRating, setIsRating] = useState(false);
  const languages = useAppSelector(state => {
    return state.account.languages;
  });
  const DATA_1 = [
    // {
    //   icon: notification_bell_ic,
    //   title: checkValue(languages?.account_one),
    //   id: '1',
    // },
    {
      icon: rate_ic,
      title: checkValue(languages?.account_fourteen),
      id: '1',
    },
    {
      icon: settings_ic,
      title: checkValue(languages?.account_two),
      id: '2',
    },


  ];
  const DATA_2 = [
    {
      icon: kyc_ic,
      title: checkValue(languages?.account_four),
      id: '3',
    },

    {
      icon: lock_ic,
      title: checkValue(languages?.account_three),
      id: '10',
    },
    {
      icon: bank_ic,
      title: checkValue(languages?.account_five),
      id: '4',
    },
    {
      icon: invite_ic,
      title: checkValue(languages?.account_six),
      id: '5',
    },
    {
      icon: contact_ic,
      title: checkValue(languages?.account_seven),
      id: '6',
    },

    // {
    //   icon: about_us_ic,
    //   title: checkValue(languages?.account_eight),
    //   id: '8',
    // },
  ];
  const onPressAction = (id: string) => {
    switch (id) {
      // case '1':
      //   NavigationService.navigate(NOTIFICATION_SETTINGS_SCREEN);
      //   break;
      case '1':
        NavigationService.navigate(ACTIVITY_LOGS);
        break;
      case '2':
        NavigationService.navigate(SETTINGS_SCREEN);
        break;
      case '3':
        NavigationService.navigate(KYC_STATUS_SCREEN);
        break;
      case '4':
        NavigationService.navigate(PAYMENT_OPTIONS_SCREEN);
        break;
      case '5':
        NavigationService.navigate(INVITE_AND_EARN_SCREEN);
        break;
      case '6':
        NavigationService.navigate(CONTACT_US_SCREEN);
        break;
      // case '7':
      //   setIsRating(true);
      //   break;
      case '8':
        NavigationService.navigate(CMS_SCREEN, {
          id: 'http://103.175.163.162:5117//mobAboutUs',
        });
        break;
      case '9':
        NavigationService.navigate(UPDATE_KGIN_SCREEN);
        break;
      case '10':
        NavigationService.navigate(TWO_FACTOR_AUTHENTICATION);
        break;
      default:
        break;
    }
  };

  const onLogout = () => {
    setIsLogout(true);
  };
  return (
    <AppSafeAreaView source={HomeBg}>
      <Header />
      <ProfileBox />
      <KeyBoardAware style={styles.container}>
        <RenderBox
          onPressAction={(id: string) => onPressAction(id)}
          title={checkValue(languages?.account_nine)}
          data={DATA_1}
        />
        <RenderBox
          onPressAction={(id: string) => onPressAction(id)}
          title={checkValue(languages?.account_ten)}
          data={DATA_2}
        />
        <TouchableOpacityView
          onPress={() => onLogout()}
          style={styles.logOutButton}>
          <AppText color={RED} type={FOURTEEN}>
            {checkValue(languages?.account_eleven)}
          </AppText>
        </TouchableOpacityView>
      </KeyBoardAware>
      <LogoutModal
        isVisible={isLogout}
        onBackButtonPress={() => setIsLogout(false)}
        title={`${checkValue(languages?.account_twelve)}\n${checkValue(
          languages?.account_thirteen,
        )}`}
        onPressNo={() => setIsLogout(false)}
        onPressYes={() => {
          setIsLogout(false);
          dispatch(logoutAction());
        }}
      />
      {/* <RatingModal
        isVisible={isRating}
        setIsVisible={() => setIsRating(false)}
      /> */}
    </AppSafeAreaView>
  );
};

export default Account;
const styles = StyleSheet.create({
  profileBoxContainer: {
    backgroundColor: colors.inputBackground,
    padding: universalPaddingHorizontal,
    marginHorizontal: universalPaddingHorizontalHigh,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10
  },
  profileBg: {
    height: 80,
    width: 80,
    marginEnd: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 150,
  },
  profileBoxContainerSecond: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightIc: {
    height: 15,
    width: 15,
  },
  profileImage: {
    height: 55,
    width: 55,
    borderRadius: 100,
  },
  icon: {
    height: 22,
    width: 22,
    marginEnd: 10,
  },
  singleContainerTitle: {
    paddingHorizontal: universalPaddingHorizontalHigh,
    marginTop: universalPaddingHorizontalHigh,
  },
  singleContainerFill: {
    backgroundColor: colors.inputBackground,
    paddingHorizontal: universalPaddingHorizontalHigh,
    marginVertical: 5,
    paddingVertical: universalPaddingHorizontal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  singleContainerFillSecond: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  container: {
    paddingHorizontal: 0,
  },
  logOutButton: {
    backgroundColor: colors.inputBackground,
    paddingHorizontal: universalPaddingHorizontalHigh,
    marginVertical: 5,
    paddingVertical: universalPaddingHorizontal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: universalPaddingHorizontalHigh,
  },
  ratingContainer: {
    backgroundColor: colors.secondaryText,
    borderWidth: borderWidth,
    borderColor: colors.inputBorder,
    borderRadius: 10,
  },
  ratingHeader: {
    backgroundColor: colors.buttonBg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: universalPaddingHorizontal,
    borderTopEndRadius: 10,
    borderTopStartRadius: 10,
  },
  ratingBody: {
    padding: universalPaddingHorizontal,
  },
  starContainer: {
    alignItems: 'center',
    marginVertical: universalPaddingHorizontal,
  },
  inputMainContainer: {
    width: '100%',
    height: 80,
    borderRadius: 20,
    marginTop: 0,
    alignItems: 'flex-start',
  },
  noButton: {
    flex: 1,
    backgroundColor: colors.secondaryText,
    borderColor: colors.buttonBg,
    borderWidth: borderWidth,
    marginEnd: 10,
  },
  yesButton: {
    flex: 1,
    backgroundColor: colors.buttonBg,
    marginStart: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 10,
  },
  buttonTitle: {
    color: colors.white,
    fontSize: 14,
  },
  buttonTitle2: {
    color: colors.black,
    fontSize: 14,
  },
});
