import React, {useEffect, useState} from 'react';
import {
  AppSafeAreaView,
  AppText,
  BLACK,
  Button,
  CommonModal,
  FOURTEEN,
  RED,
  SECOND,
  SEMI_BOLD,
  SIXTEEN,
  TEN,
  Toolbar,
  WHITE,
  YELLOW,
} from '../../shared';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {StyleSheet, View} from 'react-native';
import KeyBoardAware from '../../shared/components/KeyboardAware';
import {
  borderWidth,
  universalPaddingHorizontal,
  universalPaddingHorizontalHigh,
  universalPaddingTop,
} from '../../theme/dimens';
import {colors} from '../../theme/colors';
import TouchableOpacityView from '../../shared/components/TouchableOpacityView';
import NavigationService from '../../navigation/NavigationService';
import {ADD_NEW_BANK_SCREEN} from '../../navigation/routes';
import Accordion from 'react-native-collapsible/Accordion';
import {SpinnerSecond} from '../../shared/components/SpinnerSecond';
import {bankStatus, getLastFour} from '../../helper/utility';
import FastImage from 'react-native-fast-image';
import {loginDarkBg, BACK_ICON, downIcon, editIcon, HomeBg, upIcon} from '../../helper/ImageAssets';
import {commonStyles} from '../../theme/commonStyles';
import {deleteBankAccount, getUserBankDetails} from '../../actions/accountActions';
import { TouchableOpacity } from 'react-native-gesture-handler';

const PaymentOptions = () => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(state => state.auth.theme);
  const userBankData = useAppSelector(state => state.account.userBankData);
  const [activeSections, setActiveSections] = useState([]);
  const [isDelete, setIsDelete] = useState(false);
  const [isDeleteId, setIsDeleteId] = useState(0);

  useEffect(() => {
    dispatch(getUserBankDetails());
  }, []);

  const _updateSections = (_activeSections) => {
    setActiveSections(_activeSections);
  };

  const onDelete = index => {
    setIsDelete(true);
    setIsDeleteId(index);
  };

  const _renderHeader = (section, index, isActive) => {
    const {status, bank_name, account_number, fiatType} = section ?? '';
    console.log(status, "status");
    return (
      <View
        style={[
          styles.singleContainer,
          isActive && styles.singleContainerHeader,
        ]}>
        <View style={commonStyles.flex}>
          <View style={styles.headerNameContainer}>
            <AppText
              type={FOURTEEN}
              weight={SEMI_BOLD}>{`${bank_name} - ${account_number}`}</AppText>
            {status === "Rejected" && <TouchableOpacityView
              onPress={() =>
                NavigationService.navigate(ADD_NEW_BANK_SCREEN, {
                  userBankData: [section],
                })
              }>
              <FastImage
                source={editIcon}
                resizeMode="contain"
                style={styles.editIcon}
                tintColor={theme === "Dark" ? colors.white : colors.black}
              />
            </TouchableOpacityView>}
          </View>
          <View style={styles.headerNameContainer}>
            <AppText style={styles.default} color={WHITE}>
              {fiatType}
            </AppText>
            <AppText
              style={[
                styles.status,
                {backgroundColor: bankStatus(status).backgroundColor},
              ]}
              color={bankStatus(status).textColor}>
              {bankStatus(status).status}
            </AppText>
          </View>
        </View>
        <FastImage
          source={isActive ? upIcon : downIcon}
          resizeMode="contain"
          style={styles.arrow}
          tintColor={theme === 'Dark' ?  colors.white  :colors.black}
        />
      </View>
    );
  };
  const _renderContent = (section, index, isActive) => {
    const {
      status,
      bank_name,
      account_number,
      account_holder_name,
      account_type,
      branch_address,
      ifsc_code,
      fiatType,
      _id,
    } = section ?? '';
    const validation = bankStatus(status);

    const Data = [
      {
        id: '1',
        title: 'Bank Name',
        value: bank_name,
      },
      {
        id: '2',
        title: 'Account Holder Name',
        value: account_holder_name,
      },
      {
        id: '3',
        title: 'Fiat Type',
        value: fiatType,
      },
      {
        id: '4',
        title: 'Account Number',
        value: account_number,
      },
      {
        id: '5',
        title: 'IFSC Code',
        value: ifsc_code,
      },
      {
        id: '6',
        title: 'Branch Name',
        value: branch_address,
      },
    ];

    return (
      <View style={[styles.singleContainerBody, { backgroundColor: theme !== "Dark" && colors.white,}]}>
        <View
          style={{
            // backgroundColor: validation.backgroundColor,
            paddingHorizontal: universalPaddingHorizontal,
            paddingVertical: universalPaddingHorizontal,
            marginTop: universalPaddingHorizontalHigh,
          }}>
          <AppText color={validation.textColor} weight={SEMI_BOLD}>{validation.title}</AppText>
          <AppText>{validation.subtitle}</AppText>
        </View>
        <View style={styles.singleContainerBodySecond}>
          {/* <AppText>Your bank account details for IMPS payments</AppText> */}
          {Data.map(e => {
            return (
              <View key={e.id} style={styles.singleItem}>
                <AppText type={TEN} color={BLACK}>
                  {e.title}
                </AppText>
                <AppText>{e.value}</AppText>
              </View>
            );
          })}
          {/* <Button
            children="Remove"
            onPress={() => onDelete(index)}
            containerStyle={styles.button}
            isSecond
          /> */}
        </View>
      </View>
    );
  };
  return (
    <AppSafeAreaView source={theme === 'Dark' && loginDarkBg}>
      <KeyBoardAware>
      <View style={{flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "75%", marginTop: 10, paddingHorizontal: 20}}>
        <TouchableOpacity onPress={() => NavigationService.goBack()}>
              <FastImage
                source={BACK_ICON}
                resizeMode="contain"
                style={{ width: 20, height: 20 }}
                tintColor={theme === 'Dark'? colors.white : colors.black}
              />
            </TouchableOpacity>
            <AppText type={SIXTEEN} weight={SEMI_BOLD} style={styles.title}>
          BANK ACCOUNT
        </AppText>
        </View>
        
        {/* <View style={styles.divider} /> */}
        <Accordion
          sections={userBankData}
          activeSections={activeSections}
          renderHeader={_renderHeader}
          renderContent={_renderContent}
          onChange={_updateSections}
          underlayColor={colors.transparent}
        />
        <TouchableOpacityView
          onPress={() => NavigationService.navigate(ADD_NEW_BANK_SCREEN)}
          style={styles.new}>
          <AppText color={YELLOW}>ADD A NEW BANK ACCOUNT</AppText>
        </TouchableOpacityView>
      </KeyBoardAware>
      <CommonModal
        isVisible={isDelete}
        onBackButtonPress={() => setIsDelete(false)}
        title={'Are you sure you want to delete\nyou account details?'}
        onPressNo={() => setIsDelete(false)}
        onPressYes={() => {
          setIsDelete(false);
          dispatch(deleteBankAccount(userBankData[isDeleteId]?._id));
        }}
      />
      <SpinnerSecond />
    </AppSafeAreaView>
  );
};

export default PaymentOptions;
const styles = StyleSheet.create({
  title: {
    // marginTop: universalPaddingTop,
  },
  divider: {
    height: borderWidth,
    backgroundColor: colors.inputBorder,
    marginVertical: 15,
  },
  new: {
    backgroundColor: colors.white_fifteen,
    padding: universalPaddingHorizontal,
    marginHorizontal: 20,
    borderWidth: borderWidth,
    borderColor: colors.inputBorder,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 20,
  },
  singleContainer: {
    // backgroundColor: '#D7D7D7',
    padding: universalPaddingHorizontal,
    borderWidth: borderWidth,
    borderColor: colors.inputBorder,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    margin: 10,
  },
  singleContainerBody: {
   
    borderWidth: borderWidth,
    borderColor: colors.inputBorder,
    borderRadius: 10,
    borderTopEndRadius: 0,
    borderTopStartRadius: 0,
    borderTopWidth: 0,
  },

  headerNameContainer: {
    flexDirection: 'row',
  },
  editIcon: {
    height: 12,
    width: 12,
    marginStart: 10,
  },
  default: {
    backgroundColor: colors.buttonBg,
    paddingHorizontal: 15,
    borderRadius: 25,
  },
  status: {
    paddingHorizontal: 15,
    borderRadius: 25,
    marginStart: 10,
  },
  arrow: {
    height: 12,
    width: 12,
  },
  singleContainerBodySecond: {
    padding: universalPaddingHorizontal,
  },
  singleItem: {
    marginVertical: 5,
  },
  button: {
    marginVertical: universalPaddingHorizontal,
    backgroundColor: colors.red,
  },
  singleContainerHeader: {
    borderBottomEndRadius: 0,
    borderBottomStartRadius: 0,
  },
});
