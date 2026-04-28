import React, { useState } from "react";
import {
  AppSafeAreaView,
  AppText,
  Button,
  FOURTEEN,
  Input,
  RED,
  SEMI_BOLD,
  TWELVE,
} from "../../shared";
import KeyBoardAware from "../../shared/components/KeyboardAware";
import { StyleSheet, View, ScrollView, Platform } from "react-native";
import FastImage from "react-native-fast-image";
import { colors } from "../../theme/colors";
import { useKycForm } from "../../context/KycFormContext";
import NavigationService from "../../navigation/NavigationService";
import { KYC_STEP_FOUR_SCREEN } from "../../navigation/routes";
import { appBg, uploadIcon, checkIc, PHOTO_ID_MINI_ICON1, PHOTO_ID_MINI_ICON2, PHOTO_ID_MINI_ICON3, PHOTO_ID_VECTOR, KYC_IDENTITY } from "../../helper/ImageAssets";
import KycStepHeader from "./KycStepHeader";
import TouchableOpacityView from "../../shared/components/TouchableOpacityView";
import { PictureModal } from "../../shared/components/PictureModal";
import ImageCropPicker from "react-native-image-crop-picker";
import { showError } from "../../helper/logger";
import { useTheme } from "../../hooks/useTheme";

const KycStepThree = () => {
  const [pictureModalVisible, setPictureModalVisible] = useState(false);
  const [pictureType, setPictureType] = useState("doc_front");
  const { colors: themeColors, isDark } = useTheme();
  const accentColor = isDark ? colors.white : (colors.buttonBg || "#F3BB2B");

  const {
    theme,
    selectedCountry,
    modalCountry,
    getIdDocConfig,
    aadhar,
    handleDocumentNumberChange,
    documentNumberError,
    docFront,
    setDocFront,
    docBack,
    setDocBack,
    validateStep2,
  } = useKycForm();

  const cardBg = themeColors.card;
  const borderClr = themeColors.border;
  const textClr = themeColors.text;

  const handleImagePick = (type) => {
    setPictureType(type);
    setPictureModalVisible(true);
  };

  const onPressCamera = () => {
    ImageCropPicker.openCamera({ multiple: false, mediaType: "photo", cropping: true, compressImageQuality: 0.8 })
      .then((image) => {
        if (image?.size < 5000000 && ["image/png", "image/jpeg", "image/jpg"].includes(image?.mime)) {
          const mime = image?.mime?.split("/");
          const photo = { uri: image.path, name: `${pictureType}_${image.modificationDate}.${mime[1]}`, type: image.mime };
          if (pictureType === "doc_front") setDocFront(photo);
          else if (pictureType === "doc_back") setDocBack(photo);
        } else {
          showError("Only JPEG, PNG & JPG formats and file size upto 5MB are supported");
        }
        setPictureModalVisible(false);
      })
      .catch(() => setPictureModalVisible(false));
  };

  const onPressGallery = () => {
    ImageCropPicker.openPicker({ multiple: false, mediaType: "photo", cropping: true, compressImageQuality: 0.8 })
      .then((image) => {
        if (image?.size < 5000000 && ["image/png", "image/jpeg", "image/jpg"].includes(image?.mime)) {
          const mime = image?.mime?.split("/");
          const photo = { uri: image.path, name: `${pictureType}_${image.modificationDate}.${mime[1]}`, type: image.mime };
          if (pictureType === "doc_front") setDocFront(photo);
          else if (pictureType === "doc_back") setDocBack(photo);
        } else {
          showError("Only JPEG, PNG & JPG formats and file size upto 5MB are supported");
        }
        setPictureModalVisible(false);
      })
      .catch(() => setPictureModalVisible(false));
  };

  const guidanceItems = [
    { title: "Align flat & centered", key: "align", image: PHOTO_ID_MINI_ICON1 },
    { title: "Hold steady, no blur", key: "blur", image: PHOTO_ID_MINI_ICON2 },
    { title: "Avoid glare & reflections", key: "glare", image: PHOTO_ID_MINI_ICON3 },
  ];

  const onNext = () => {
    if (!validateStep2()) return;
    NavigationService.navigate(KYC_STEP_FOUR_SCREEN);
  };

  return (
    <AppSafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <KeyBoardAware style={{ flex: 1 }}>
        <KycStepHeader title="Take a Photo of Your ID Card" theme={theme} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={[styles.stepBadge, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)" }]}>
            <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: accentColor }}>Step 3 of 6</AppText>
          </View>

          {/* Hero / Preview */}
          <View style={[styles.heroCard, { backgroundColor: cardBg, borderColor: borderClr, borderWidth: 1 }]}>
            <FastImage source={PHOTO_ID_VECTOR} resizeMode="contain" style={styles.heroImage} />
          </View>

          {/* Photo Tips */}
          <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: borderClr, borderWidth: 1 }]}>
            <AppText type={TWELVE} weight={SEMI_BOLD} style={[styles.sectionTitle, { color: themeColors.secondaryText }]}>Photo tips</AppText>
            <View style={styles.guidanceRow}>
              {guidanceItems.map((item) => (
                <View key={item.key} style={[styles.guidanceBox, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }]}>
                  <FastImage source={item.image} resizeMode="contain" style={styles.guidanceImage} />
                  <AppText type={TWELVE} style={[styles.guidanceLabel, { color: themeColors.secondaryText }]}>{item.title}</AppText>
                </View>
              ))}
            </View>
          </View>

          {/* Your Selection */}
          <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: borderClr, borderWidth: 1 }]}>
            <AppText type={TWELVE} weight={SEMI_BOLD} style={[styles.sectionTitle, { color: themeColors.secondaryText }]}>Your selection</AppText>
            <View style={[styles.selectionRow, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }]}>
              <AppText type={FOURTEEN} style={{ color: textClr }}>{selectedCountry?.flag || "🏳"} {selectedCountry?.label || modalCountry || "—"}</AppText>
              <View style={[styles.selectionDivider, { backgroundColor: borderClr }]} />
              <View style={styles.selectionRight}>
                <FastImage source={KYC_IDENTITY} resizeMode="contain" style={styles.idIcon} />
                <AppText type={FOURTEEN} style={{ color: textClr, marginLeft: 6 }}>{getIdDocConfig()?.label || "ID"}</AppText>
              </View>
            </View>
            <AppText type={TWELVE} style={[styles.helperText, { color: themeColors.secondaryText }]}>
              Upload a valid ID matching your selection to avoid verification failure.
            </AppText>
          </View>

          {/* ID Number & Upload */}
          <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: borderClr, borderWidth: 1 }]}>
            <AppText type={TWELVE} weight={SEMI_BOLD} style={[styles.sectionTitle, { color: themeColors.secondaryText }]}>Document details</AppText>
            <AppText type={FOURTEEN} weight={SEMI_BOLD} style={[styles.fieldLabel, { color: textClr }]}>{getIdDocConfig()?.label || "ID"} Number <AppText color={RED}>*</AppText></AppText>
            <Input
              placeholder={(getIdDocConfig()?.label || "ID") + " Number"}
              value={aadhar}
              onChangeText={handleDocumentNumberChange}
              autoCapitalize="characters"
              containerStyle={[styles.input, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)", borderColor: borderClr }]}
              inputStyle={{ color: textClr }}
              placeholderTextColor={themeColors.secondaryText}
            />
            {documentNumberError ? <AppText type={TWELVE} color={RED} style={{ marginBottom: 8 }}>{documentNumberError}</AppText> : null}
            <AppText type={FOURTEEN} weight={SEMI_BOLD} style={[styles.fieldLabel, { color: textClr, marginTop: 4 }]}>Upload photos</AppText>
            <View style={styles.uploadRow}>
              <TouchableOpacityView onPress={() => handleImagePick("doc_front")} style={[styles.uploadBox, docFront ? styles.uploadBoxFilled : styles.uploadBoxEmpty, { backgroundColor: docFront ? themeColors.card : "transparent", borderColor: docFront ? accentColor : borderClr }]}>
                {docFront ? (
                  <>
                    <FastImage source={{ uri: docFront.uri }} style={styles.uploadedImg} resizeMode="cover" />
                    <View style={[styles.uploadBadge, { backgroundColor: colors.white }]}>
                      <FastImage source={checkIc} resizeMode="contain" style={styles.uploadBadgeIcon} tintColor={colors.blueThemeColor} />
                    </View>
                  </>
                ) : (
                  <>
                    <FastImage source={PHOTO_ID_VECTOR} resizeMode="cover" style={styles.uploadPlaceholderBg} tintColor={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"} />
                    <View style={styles.uploadContent}>
                      <FastImage source={uploadIcon} tintColor={accentColor} resizeMode="contain" style={styles.uploadIcon} />
                      <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: textClr }}>Front Side</AppText>
                      <AppText type={TWELVE} style={{ color: themeColors.secondaryText, marginTop: 2 }}>Tap to upload</AppText>
                    </View>
                  </>
                )}
              </TouchableOpacityView>
              <TouchableOpacityView onPress={() => handleImagePick("doc_back")} style={[styles.uploadBox, docBack ? styles.uploadBoxFilled : styles.uploadBoxEmpty, { backgroundColor: docBack ? themeColors.card : "transparent", borderColor: docBack ? accentColor : borderClr }]}>
                {docBack ? (
                  <>
                    <FastImage source={{ uri: docBack.uri }} style={styles.uploadedImg} resizeMode="cover" />
                    <View style={[styles.uploadBadge, { backgroundColor: colors.white }]}>
                      <FastImage source={checkIc} resizeMode="contain" style={styles.uploadBadgeIcon} tintColor={colors.blueThemeColor} />
                    </View>
                  </>
                ) : (
                  <>
                    <FastImage source={PHOTO_ID_VECTOR} resizeMode="cover" style={styles.uploadPlaceholderBg} tintColor={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"} />
                    <View style={styles.uploadContent}>
                      <FastImage source={uploadIcon} tintColor={accentColor} resizeMode="contain" style={styles.uploadIcon} />
                      <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: textClr }}>Back Side</AppText>
                      <AppText type={TWELVE} style={{ color: themeColors.secondaryText, marginTop: 2 }}>{getIdDocConfig()?.requires_back_image ? "Required" : "Optional"}</AppText>
                    </View>
                  </>
                )}
              </TouchableOpacityView>
            </View>
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <Button children="Next" onPress={onNext} containerStyle={[styles.nextBtn, { backgroundColor: themeColors.button }]} />
        </View>
      </KeyBoardAware>
      <PictureModal isVisible={pictureModalVisible} onBackButtonPress={() => setPictureModalVisible(false)} onPressCamera={onPressCamera} onPressGallery={onPressGallery} isFront={false} />
    </AppSafeAreaView>
  );
};

export default KycStepThree;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32 },
  stepBadge: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 16 },
  heroCard: { borderRadius: 16, padding: 20, alignItems: "center", marginBottom: 16 },
  heroImage: { width: "100%", minHeight: 100 },
  sectionCard: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 1.5 },
    }),
  },
  sectionTitle: { marginBottom: 14, textTransform: "uppercase", letterSpacing: 0.8 },
  guidanceRow: { flexDirection: "row", gap: 8 },
  guidanceBox: { flex: 1, borderRadius: 12, padding: 10, alignItems: "center", justifyContent: "center" },
  guidanceImage: { width: 32, height: 32, marginBottom: 8 },
  guidanceLabel: { textAlign: "center", lineHeight: 14 },
  selectionRow: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 12, marginBottom: 10 },
  selectionDivider: { width: 1, height: 20, marginHorizontal: 12 },
  selectionRight: { flexDirection: "row", alignItems: "center" },
  idIcon: { width: 20, height: 20 },
  helperText: { lineHeight: 18 },
  fieldLabel: { marginBottom: 6, letterSpacing: 0.2 },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 48, marginBottom: 4 },
  uploadRow: { flexDirection: "row", gap: 12, marginTop: 4 },
  uploadBox: { flex: 1, height: 140, borderRadius: 14, borderWidth: 1, overflow: "hidden", position: "relative" },
  uploadBoxEmpty: { borderStyle: "dashed" },
  uploadBoxFilled: { borderStyle: "solid" },
  uploadPlaceholderBg: { ...StyleSheet.absoluteFillObject },
  uploadContent: { flex: 1, alignItems: "center", justifyContent: "center", padding: 10 },
  uploadIcon: { width: 32, height: 32, marginBottom: 8 },
  uploadedImg: { ...StyleSheet.absoluteFillObject },
  uploadBadge: { position: "absolute", top: 10, right: 10, width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "#FFF" },
  uploadBadgeIcon: { width: 12, height: 12 },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    backgroundColor: "transparent",
  },
  nextBtn: { borderRadius: 28 },
});
