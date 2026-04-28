import React, { useEffect, useRef, useState } from "react";
import {
  AppSafeAreaView,
  AppText,
  BLACK,
  Button,
  Input,
  PictureModal,
  SECOND,
  SEMI_BOLD,
  SIXTEEN,
  TEN,
  Toolbar,
} from "../../shared";
import KeyBoardAware from "../../shared/components/KeyboardAware";
import { StyleSheet, View } from "react-native";
import {
  borderWidth,
  universalPaddingHorizontal,
  universalPaddingHorizontalHigh,
  universalPaddingTop,
} from "../../theme/dimens";
import { colors } from "../../theme/colors";
import { PickerSelect } from "../../shared/components/PickerSelect";
import { accountTypes } from "../../helper/dummydata";
import { errorText, placeHolderText, titleText } from "../../helper/Constants";
import TouchableOpacityView from "../../shared/components/TouchableOpacityView";
import FastImage from "react-native-fast-image";
import {
  loginDarkBg,
  BACK_ICON,
  doneIcon,
  HomeBg,
  uploadIcon,
} from "../../helper/ImageAssets";
import ImageCropPicker from "react-native-image-crop-picker";
import { SpinnerSecond } from "../../shared/components/SpinnerSecond";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  addNewBakAccount,
  updateBankAccount,
} from "../../actions/accountActions";
import { showError } from "../../helper/logger";
import { useRoute } from "@react-navigation/native";
import { TouchableOpacity } from "react-native-gesture-handler";
import NavigationService from "../../navigation/NavigationService";
import CustomDropdown from "../../shared/components/CustomDropdown";

const AddNewBank = () => {
  const dispatch = useAppDispatch();
  const route = useRoute();
  const userBankData = route?.params?.userBankData;
  const from = route?.params?.from;
  const theme = useAppSelector(state => state.auth.theme);
  const depositFiatCoins = useAppSelector((state) => {
    return state.wallet.depositFiatCoins;
  });

  const [accountType, setAccountType] = useState('');
  const [bankName, setBankName] = useState("");
  const [holderName, setHolderName] = useState("");
  const [accountNo, setAccountNo] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [branch, setBranch] = useState("");
  const [passbook, setPassbook] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  const holderNameInput = useRef(null);
  const accountNoInput = useRef(null);
  const ifscInput = useRef(null);
  const branchInput = useRef(null);

  useEffect(() => {
    if (userBankData && userBankData.length !== 0) {
      setAccountType(userBankData[0]?.fiatType);
      setBankName(userBankData[0]?.bank_name);
      setHolderName(userBankData[0]?.account_holder_name);
      setAccountNo(userBankData[0]?.account_number);
      setIfsc(userBankData[0]?.ifsc_code);
      setBranch(userBankData[0]?.branch_address);
      // setPassbook(userBankData[0]?.passbook_picture);
    }
  }, []);

  const onPressCamera = () => {
    ImageCropPicker.openCamera({
      multiple: false,
      mediaType: "photo",
      cropping: true,
      compressImageQuality: 1,
    })
      .then((image) => {
        if (
          image?.size < 2000000 &&
          (image?.mime === "image/png" ||
            image?.mime === "image/jpeg" ||
            image?.mime === "image/jpg")
        ) {
          let mime = image?.mime?.split("/");
          let tempphoto = {
            uri: image.path,
            name: "passbook_image" + image.modificationDate + "." + mime[1],
            type: image.mime,
          };
          setPassbook(tempphoto);
        } else {
          setPassbook("");
          showError(
            "Only JPEG, PNG & JPG formats and file size upto 2MB are supported"
          );
          return;
        }
      })

      .catch((error) => {
        console.log(error);
      });
  };
  // const onPressGallery = () => {
  //   ImageCropPicker.openPicker({
  //     multiple: false,
  //     mediaType: "photo",
  //     cropping: true,
  //   })
  //     .then((image) => {
  //       let mime = image?.mime?.split("/");

  //       let tempphoto = {
  //         uri: image.path,
  //         name: "passbook_image" + image.modificationDate + "." + mime[1],
  //         type: image.mime,
  //       };
  //       setPassbook(tempphoto);
  //     })
  //     .catch((error) => {
  //       console.log(error);
  //     });
  // };

  const onPressGallery = () => {
    ImageCropPicker.openPicker({
      multiple: false,
      mediaType: "photo",
      cropping: true,
      compressImageQuality: 1,
    })
      .then((image) => {
        if (
          image?.size < 2000000 &&
          (image?.mime === "image/png" ||
            image?.mime === "image/jpeg" ||
            image?.mime === "image/jpg")
        ) {
          let mime = image?.mime?.split("/");
          let tempphoto = {
            uri: image.path,
            name: "pan_image" + image.modificationDate + "." + mime[1],
            type: image.mime,
          };
          setPassbook(tempphoto);
        } else {
          setPassbook("");
          showError(
            "Only JPEG, PNG & JPG formats and file size upto 2MB are supported"
          );
        }
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const isValidBankCode = (code) => {
    const value = code?.toUpperCase() || '';
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    const swiftRegex = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
    return ifscRegex.test(value) || swiftRegex.test(value);
  };

  const onSave = () => {
    if (!passbook) {
      showError(errorText.passbook);
      return;
    }
    if (!bankName) {
      showError(errorText.bank);
      return;
    }
    if (!accountType) {
      showError(errorText.accountType);
      return;
    }
    if (!/^\d{9,18}$/.test(accountNo)) {
      showError("Account number must be 9 to 18 digits.");
      return;
    }
    if (!holderName) {
      showError(errorText.holder);
      return;
    }
    if (!accountNo) {
      showError(errorText.number);
      return;
    }
    // if (!isValidBankCode(ifsc)) {
    //    showError("Invalid IFSC or SWIFT code format.");
    //    return;
    // }
    if (!ifsc) {
      showError(errorText.ifsc);
      return;
    }
    if (!branch) {
      showError(errorText.branch);
      return;
    }
    let data = new FormData();
    data.append('fiatType', accountType);
    data.append("account_holder_name", holderName);
    data.append("account_number", accountNo);
    data.append("ifsc_code", ifsc);
    data.append("branch_address", branch);
    data.append("bank_name", bankName);
    data.append("bank_proof", passbook);
    
    dispatch(updateBankAccount(data));
    // if (userBankData && userBankData.length !== 0) {
    //   data.append("_id", userBankData[0]?._id);
    //   dispatch(updateBankAccount(data));
    //   // console.log('json', JSON.stringify(data));
    // } else {
    //   dispatch(updateBankAccount(data));
    // }
  };
  console.log(depositFiatCoins, "depositFiatCoins");
  return (
    <AppSafeAreaView source={theme === 'Dark' && loginDarkBg}>
      <KeyBoardAware>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            width: "75%",
            marginTop: 10,
            paddingHorizontal: 20,
          }}
        >
          <TouchableOpacity onPress={() => NavigationService.goBack()}>
            <FastImage
              source={BACK_ICON}
              resizeMode="contain"
              style={{ width: 20, height: 20 }}
              tintColor={theme === 'Dark'? colors.white : colors.black}
            />
          </TouchableOpacity>
          <AppText type={SIXTEEN} weight={SEMI_BOLD} style={styles.title}>
            Enter Your Bank Details
          </AppText>
        </View>

        {/* <View style={styles.divider} /> */}
        <View style={styles.container}>
         <AppText style={{ marginVertical: 10 }}>Select Fiat Type</AppText>
         <CustomDropdown
            data={['INR', "USD", "AED", "EURO"]}
            selected={accountType}
            theme={theme}
            onSelect={(value) => setAccountType(value)} />
       
          <Input
            title={titleText.bank}
            placeholder={placeHolderText.bank}
            value={bankName}
            onChangeText={(text) => setBankName(text)}
            autoCapitalize="none"
            returnKeyType="next"
            onSubmitEditing={() => holderNameInput?.current?.focus()}
          />
          <Input
            title={titleText.holder}
            placeholder={placeHolderText.holder}
            value={holderName}
            onChangeText={(text) => setHolderName(text)}
            autoCapitalize="none"
            assignRef={(input) => {
              holderNameInput.current = input;
            }}
            returnKeyType="next"
            onSubmitEditing={() => accountNoInput?.current?.focus()}
          />
          <Input
            title={titleText.number}
            placeholder={placeHolderText.number}
            value={accountNo}
            onChangeText={(text) => setAccountNo(text)}
            autoCapitalize="none"
            assignRef={(input) => {
              accountNoInput.current = input;
            }}
            returnKeyType="next"
            keyboardType="numeric"
            onSubmitEditing={() => ifscInput?.current?.focus()}
          />
          <Input
            title={titleText.ifsc}
            placeholder={placeHolderText.ifsc}
            value={ifsc}
            onChangeText={(text) => setIfsc(text)}
            autoCapitalize="none"
            assignRef={(input) => {
              ifscInput.current = input;
            }}
            returnKeyType="next"
            onSubmitEditing={() => branchInput?.current?.focus()}
          />
          <Input
            title={titleText.branch}
            placeholder={placeHolderText.branch}
            value={branch}
            onChangeText={(text) => setBranch(text)}
            autoCapitalize="none"
            assignRef={(input) => {
              branchInput.current = input;
            }}
            returnKeyType="done"
          />
          <AppText style={styles.gender}>
            {"Upload Bank Details Proof "}
          </AppText>
          <AppText color={BLACK} type={TEN}>
            (Only JPEG, PNG & JPG formats and file size upto 5MB are supported)
          </AppText>
          <TouchableOpacityView
            onPress={() => setIsVisible(true)}
            style={styles.fileContainer}
          >
            <FastImage
              source={passbook ? doneIcon : uploadIcon}
              style={styles.uploadIcon}
              resizeMode="contain"
            />
            <AppText color={BLACK}>
              {passbook ? "File Uploaded" : "Choose a File"}
            </AppText>
          </TouchableOpacityView>
        </View>
      </KeyBoardAware>
      <Button
        children="Save"
        onPress={() => onSave()}
        containerStyle={styles.button}
      />
      <PictureModal
        isVisible={isVisible}
        onBackButtonPress={() => setIsVisible(false)}
        onPressGallery={() => {
          onPressGallery();
        }}
        onPressCamera={() => {
          onPressCamera();
        }}
      />
      <SpinnerSecond />
    </AppSafeAreaView>
  );
};
export default AddNewBank;

const styles = StyleSheet.create({
  title: {
    // marginTop: universalPaddingTop,
    // alignSelf: "center"
  },
  divider: {
    height: borderWidth,
    backgroundColor: colors.inputBorder,
    marginVertical: 15,
  },
  container: {
    // backgroundColor: colors.white_fifteen,
    padding: 20,
    // borderWidth: borderWidth,
    // borderColor: colors.inputBorder,
    borderRadius: 10,
  },
  fileContainer: {
    alignItems: "center",
    justifyContent: "center",
    height: 150,
    borderWidth: borderWidth,
    borderColor: colors.buttonBg,
    borderStyle: "dashed",
    borderRadius: 10,
    marginTop: 20,
  },
  uploadIcon: {
    height: 50,
    width: 50,
  },
  gender: {
    marginTop: 15,
  },
  button: {
    margin: universalPaddingHorizontalHigh,
  },
});
