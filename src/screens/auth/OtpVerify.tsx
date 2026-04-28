import React, {useState} from 'react';
import {
  AppSafeAreaView,
  AppText,
  Button,
  FOURTEEN,
  SEMI_BOLD,
  TWENTY,
  TWENTY_SIX,
  Toolbar,
  YELLOW,
} from '../../shared';
import KeyBoardAware from '../../shared/components/KeyboardAware';
import {View} from 'react-native';
import {authStyles} from './authStyles';
import OTPInputView from '@twotalltotems/react-native-otp-input';
import {commonStyles} from '../../theme/commonStyles';
import {showError} from '../../helper/logger';
import NavigationService from '../../navigation/NavigationService';
import {RESET_PASSWORD_SCREEN} from '../../navigation/routes';
import {useRoute} from '@react-navigation/native';
import {useAppSelector} from '../../store/hooks';
import {checkValue} from '../../helper/utility';
import {MAINHOME_BG} from '../../helper/ImageAssets';

const OtpVerify = (): JSX.Element => {
  const route = useRoute();
  const data = route?.params?.data ?? '';
  const [otp, setOtp] = useState<string>();
  const languages = useAppSelector(state => {
    return state.account.languages;
  });

  const onSubmit = () => {
    // if (!otp) {
    //   showError(checkValue(languages?.error_E_otp));
    //   return;
    // }
    data['otp'] = otp;
    NavigationService.navigate(RESET_PASSWORD_SCREEN, {data});
  };
  return (
    <AppSafeAreaView  source={MAINHOME_BG}>
      <Toolbar />
      <KeyBoardAware>
        <View style={authStyles.forgotContainer}>
          <AppText type={TWENTY} style={{alignSelf: "center"}}>
            {checkValue(languages?.otp_one)}
            <AppText type={TWENTY_SIX} weight={SEMI_BOLD} color={YELLOW}>
              {checkValue(languages?.otp_two)}
            </AppText>
          </AppText>
          <AppText type={FOURTEEN} style={{alignSelf: "center"}}>
            {checkValue(languages?.otp_three)}
            {/* {'\n'} */}
            {checkValue(languages?.otp_four)}
          </AppText>
          <OTPInputView
            style={commonStyles.flexRow}
            onCodeChanged={code => {
              setOtp(code);
            }}
            pinCount={6}
            autoFocusOnLoad={false}
            codeInputFieldStyle={authStyles.underlineStyleBase}
            codeInputHighlightStyle={authStyles.underlineStyleHighLighted}
            placeholderCharacter="-"
            editable={true}
          />
          <Button
            children={checkValue(languages?.otp_five)}
            onPress={() => onSubmit()}
            containerStyle={authStyles.marginTop}
          />
        </View>
      </KeyBoardAware>
    </AppSafeAreaView>
  );
};

export default OtpVerify;
