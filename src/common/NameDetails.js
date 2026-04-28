import React from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import {
  AppText,
  SEMI_BOLD,
  SIXTEEN,
  TEN,
  FOURTEEN,
  WHITE,
} from "./AppText";
import { Input } from "./Input";
import { Button } from "./Button";
import { colors } from "../theme/colors";
import { useDispatch } from "react-redux";
import {
  editName,
} from "../actions/accountActions";
import FastImage from "react-native-fast-image";
import { closeIcon, defaultPic, editImageIcon } from "../helper/ImageAssets";
import { IMAGE_BASE_URL } from "../helper/Constants";
import KeyBoardAware from "./KeyboardAware";

const NameDetails = ({
  userData,
  onCloseNominee,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  onPressAvatar,
}) => {
  const dispatch = useDispatch();

  const handleUpdate = () => {
    let data = {
      firstName: firstName,
      lastName: lastName,
    };
    dispatch(editName(data, onCloseNominee));
  };

  return (
    <View style={styles.sheetContainer}>
      <KeyBoardAware
        style={styles.keyboardAware}
        containerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <AppText weight={SEMI_BOLD} type={SIXTEEN} style={{ color: colors.white }}>Edit Profile</AppText>
          <TouchableOpacity onPress={onCloseNominee} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <FastImage source={closeIcon} style={styles.closeBtn} tintColor={colors.white} resizeMode="contain" />
          </TouchableOpacity>
        </View>

        <AppText type={TEN} style={styles.description}>
          Avatar and nickname will also be applied to your profile. Abusing them might lead to community penalties.
        </AppText>

        {/* Avatar Section */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.avatarSection}
          onPress={onPressAvatar}
        >
          <View style={styles.avatarFrame}>
            <FastImage
              source={userData?.profilepicture ? { uri: IMAGE_BASE_URL + userData?.profilepicture } : defaultPic}
              style={styles.fullImage}
              resizeMode="cover"
            />
          </View>
          <View style={styles.editBadge}>
            <FastImage source={editImageIcon} style={styles.editIconMini} tintColor={colors.black} resizeMode="contain" />
          </View>
        </TouchableOpacity>

        {/* Inputs */}
        <View style={styles.formContent}>
          <Input
            title="First Name"
            placeholder="Enter first name"
            mainContainer={styles.inputMain}
            containerStyle={styles.inputContainer}
            value={firstName}
            onChangeText={setFirstName}
          />
          <Input
            title="Last Name"
            placeholder="Enter last name"
            mainContainer={styles.inputMain}
            containerStyle={styles.inputContainer}
            value={lastName}
            onChangeText={setLastName}
          />
        </View>

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleUpdate}
          activeOpacity={0.8}
        >
          <AppText weight={SEMI_BOLD} type={FOURTEEN} style={{ color: colors.black }}>Submit</AppText>
        </TouchableOpacity>
      </KeyBoardAware>
    </View>
  );
};

const styles = StyleSheet.create({
  sheetContainer: {
    flex: 1,
    backgroundColor: colors.newThemeColor,
  },
  keyboardAware: {
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  closeBtn: {
    width: 20,
    height: 20,
    resizeMode: "contain",
    right: 10
  },
  description: {
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 25,
    lineHeight: 16,
  },
  avatarSection: {
    alignSelf: 'center',
    marginBottom: 30,
    position: 'relative',
  },
  avatarFrame: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.buttonBg,
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  editBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(255,255,255,1)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1a1a1a',
  },
  editIconMini: {
    width: 12,
    height: 12,
  },
  formContent: {
    marginBottom: 10,
  },
  inputMain: {
    marginBottom: 20,
  },
  inputContainer: {
    backgroundColor: '#2b3139',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
  },
  submitBtn: {
    marginTop: 10,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default NameDetails;
