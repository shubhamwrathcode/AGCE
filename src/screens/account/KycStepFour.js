import React, { useState } from "react";
import {
  AppSafeAreaView,
  AppText,
  Button,
  FIFTEEN,
  FOURTEEN,
  Input,
  RED,
  SEMI_BOLD,
  TWELVE,
} from "../../shared";
import KeyBoardAware from "../../shared/components/KeyboardAware";
import { StyleSheet, View, ScrollView, FlatList, TouchableOpacity, Platform } from "react-native";
import FastImage from "react-native-fast-image";
import { colors } from "../../theme/colors";
import { useKycForm } from "../../context/KycFormContext";
import NavigationService from "../../navigation/NavigationService";
import { KYC_STEP_FIVE_SCREEN, KYC_VERIFICATION_SCREEN } from "../../navigation/routes";
import { appBg, uploadIcon, checkIc, DEMO_USER, CAMERA_IMG } from "../../helper/ImageAssets";
import KycStepHeader from "./KycStepHeader";
import TouchableOpacityView from "../../shared/components/TouchableOpacityView";
import { PictureModal } from "../../shared/components/PictureModal";
import ImageCropPicker from "react-native-image-crop-picker";
import { showError } from "../../helper/logger";
import { useTheme } from "../../hooks/useTheme";

const TaxTypeCard = ({ item, isSelected, onPress, isDark, themeColors, accentColor }) => (
  <TouchableOpacity
    style={[
      styles.taxTypeCard,
      {
        backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
        borderColor: isSelected ? accentColor : themeColors.border,
        borderWidth: isSelected ? 1 : 1,
      },
    ]}
    onPress={() => onPress(item.code)}
    activeOpacity={0.8}
  >
    <View style={[styles.radioOuter, { borderColor: isSelected ? accentColor : themeColors.border }]}>
      {isSelected && <View style={[styles.radioInner, { backgroundColor: accentColor }]} />}
    </View>
    <AppText type={FOURTEEN} weight={isSelected ? SEMI_BOLD : "normal"} style={{ color: isSelected ? themeColors.text : themeColors.secondaryText }} numberOfLines={1}>
      {item.label}
    </AppText>
  </TouchableOpacity>
);

const KycStepFour = () => {
  const { colors: themeColors, isDark, theme } = useTheme();
  const [pictureModalVisible, setPictureModalVisible] = useState(false);
  const [pictureType, setPictureType] = useState("pan");

  const {
    kycConfig,
    modalTaxType,
    setModalTaxType,
    taxDocumentError,
    setTaxDocumentError,
    getTaxDocConfig,
    panCard,
    handlePanCardChange,
    panCardImage,
    setPanCardImage,
    selfieImage,
    setSelfieImage,
    validateStep3,
  } = useKycForm();

  const accentColor = isDark ? colors.white : (colors.buttonBg || "#F3BB2B");
  const taxDocs = kycConfig?.tax_documents || [];
  const cardBg = themeColors.card;
  const borderClr = themeColors.border;
  const textClr = themeColors.text;

  const handleImagePick = (type) => {
    setPictureType(type);
    setPictureModalVisible(true);
  };

  const applyPickedImage = (image) => {
    if (image?.size < 5000000 && ["image/png", "image/jpeg", "image/jpg"].includes(image?.mime)) {
      const mime = image?.mime?.split("/");
      const name = pictureType === "pan" ? `pan_${image.modificationDate}.${mime[1]}` : `selfie_${image.modificationDate}.${mime[1]}`;
      const photo = { uri: image.path, name, type: image.mime };
      if (pictureType === "pan") setPanCardImage(photo);
      else setSelfieImage(photo);
    } else {
      showError("Only JPEG, PNG & JPG formats and file size upto 5MB are supported");
    }
    setPictureModalVisible(false);
  };

  const onPressCamera = () => {
    ImageCropPicker.openCamera({ multiple: false, mediaType: "photo", cropping: true, compressImageQuality: 0.8 })
      .then(applyPickedImage)
      .catch(() => setPictureModalVisible(false));
  };

  const onPressGallery = () => {
    ImageCropPicker.openPicker({ multiple: false, mediaType: "photo", cropping: true, compressImageQuality: 0.8 })
      .then(applyPickedImage)
      .catch(() => setPictureModalVisible(false));
  };

  const handleStartSelfieCamera = () => {
    ImageCropPicker.openCamera({ multiple: false, mediaType: "photo", cropping: true, compressImageQuality: 0.8 })
      .then((image) => {
        if (image?.size < 5000000 && ["image/png", "image/jpeg", "image/jpg"].includes(image?.mime)) {
          const mime = image?.mime?.split("/");
          const photo = { uri: image.path, name: `selfie_${image.modificationDate}.${mime[1]}`, type: image.mime };
          setSelfieImage(photo);
        } else {
          showError("Only JPEG, PNG & JPG formats and file size upto 5MB are supported");
        }
      })
      .catch(() => { });
  };

  const onNext = () => {
    if (!validateStep3()) return;
    NavigationService.navigate(KYC_STEP_FIVE_SCREEN);
  };

  return (
    <AppSafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <KeyBoardAware style={{ flex: 1 }}>
        <KycStepHeader title="Income Tax & Selfie" theme={theme} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={[styles.stepBadge, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)" }]}>
            <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: accentColor }}>Step 4 of 6</AppText>
          </View>

          {/* Tax Document Type */}
          <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: borderClr, borderWidth: 1 }]}>
            <AppText type={TWELVE} weight={SEMI_BOLD} style={[styles.sectionTitle, { color: themeColors.secondaryText }]}>Tax document type</AppText>
            <AppText type={FOURTEEN} weight={SEMI_BOLD} style={[styles.fieldLabel, { color: textClr }]}>Document Type <AppText color={RED}>*</AppText></AppText>
            {taxDocs.length > 0 && (
              <FlatList
                data={taxDocs}
                numColumns={2}
                keyExtractor={(d) => d.code}
                scrollEnabled={false}
                columnWrapperStyle={styles.taxTypeRow}
                renderItem={({ item }) => (
                  <TaxTypeCard
                    item={item}
                    isSelected={modalTaxType === item.code}
                    onPress={(code) => { setModalTaxType(code); setTaxDocumentError(""); }}
                    isDark={isDark}
                    themeColors={themeColors}
                    accentColor={accentColor}
                  />
                )}
              />
            )}
          </View>

          {/* Tax ID Number & Upload */}
          {modalTaxType && (
            <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: borderClr, borderWidth: 1 }]}>
              <AppText type={TWELVE} weight={SEMI_BOLD} style={[styles.sectionTitle, { color: themeColors.secondaryText }]}>Document details</AppText>
              <AppText type={FOURTEEN} weight={SEMI_BOLD} style={[styles.fieldLabel, { color: textClr }]}>{getTaxDocConfig()?.label || "Tax ID"} Number <AppText color={RED}>*</AppText></AppText>
              <Input
                placeholder={"Enter " + (getTaxDocConfig()?.label || "Tax ID") + " Number"}
                value={panCard}
                onChangeText={handlePanCardChange}
                autoCapitalize="characters"
                containerStyle={[styles.input, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)", borderColor: borderClr }]}
                inputStyle={{ color: textClr }}
                placeholderTextColor={themeColors.secondaryText}
              />
              {taxDocumentError ? <AppText type={TWELVE} color={RED} style={{ marginBottom: 8 }}>{taxDocumentError}</AppText> : null}
              <AppText type={FOURTEEN} weight={SEMI_BOLD} style={[styles.fieldLabel, { color: textClr, marginTop: 4 }]}>Upload document <AppText color={RED}>*</AppText></AppText>
              <AppText type={TWELVE} style={[styles.helperText, { color: themeColors.secondaryText }]}>JPEG, PNG or JPG up to 5MB</AppText>
              {panCardImage ? (
                <View style={[styles.previewBox, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)", borderColor: borderClr, borderWidth: 1, marginTop: 10 }]}>
                  <View style={styles.previewWrap}>
                    <FastImage source={{ uri: panCardImage.uri }} style={styles.previewImg} resizeMode="cover" />
                    <View style={[styles.badgeOverlay, { backgroundColor: colors.white }]}>
                      <FastImage source={checkIc} resizeMode="contain" style={styles.badgeIcon} tintColor={colors.blueThemeColor} />
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => handleImagePick("pan")} style={styles.changeBtn} activeOpacity={0.8}>
                    <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: accentColor }}>Change file</AppText>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacityView onPress={() => handleImagePick("pan")} style={[styles.uploadTaxBox, { borderColor: borderClr, backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.01)" }]}>
                  <FastImage source={uploadIcon} tintColor={accentColor} resizeMode="contain" style={styles.uploadTaxIcon} />
                  <AppText type={FIFTEEN} weight={SEMI_BOLD} style={{ color: textClr, marginTop: 8 }}>Choose a file</AppText>
                  <AppText type={TWELVE} style={{ color: themeColors.secondaryText, marginTop: 4 }}>Tap to upload</AppText>
                </TouchableOpacityView>
              )}
            </View>
          )}

          {/* Live Selfie */}
          <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: borderClr, borderWidth: 1 }]}>
            <AppText type={TWELVE} weight={SEMI_BOLD} style={[styles.sectionTitle, { color: themeColors.secondaryText }]}>Live selfie</AppText>
            <AppText type={FOURTEEN} weight={SEMI_BOLD} style={[styles.fieldLabel, { color: textClr }]}>Selfie capture <AppText color={RED}>*</AppText></AppText>
            <AppText type={TWELVE} style={[styles.helperText, { color: themeColors.secondaryText, marginBottom: 12 }]}>Camera required — allow access to capture live selfie</AppText>
            <View style={[styles.selfieBox, selfieImage ? styles.selfieBoxFilled : styles.selfieBoxEmpty, { backgroundColor: selfieImage ? (isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)") : "transparent", borderColor: borderClr }]}>
              {selfieImage ? (
                <View style={styles.selfieCaptured}>
                  <View style={styles.selfieWrap}>
                    <FastImage source={{ uri: selfieImage.uri }} style={styles.selfieImg} resizeMode="cover" />
                    <View style={[styles.badgeOverlay, { backgroundColor: colors.white }]}>
                      <FastImage source={checkIc} resizeMode="contain" style={styles.badgeIcon} tintColor={colors.blueThemeColor} />
                    </View>
                  </View>
                  <TouchableOpacity onPress={handleStartSelfieCamera} style={styles.changeBtn}>
                    <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: accentColor }}>Retake with camera</AppText>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.selfiePlaceholder}>
                  <View style={[styles.selfieCircle, { borderColor: borderClr }]}>
                    <FastImage source={DEMO_USER} resizeMode="contain" style={styles.selfieCircleImg} />
                  </View>
                  <TouchableOpacity onPress={handleStartSelfieCamera} style={[styles.cameraBtn, { backgroundColor: themeColors.button }]}>
                    <FastImage source={CAMERA_IMG} style={styles.cameraIcon} resizeMode="contain" tintColor={colors.white} />
                    <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: colors.white }}>Start camera</AppText>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleImagePick("selfie")} style={{ marginTop: 12 }}>
                    <AppText type={TWELVE} style={{ color: themeColors.secondaryText }}>Or choose from gallery</AppText>
                  </TouchableOpacity>
                </View>
              )}
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

export default KycStepFour;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32 },
  stepBadge: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 16 },
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
  fieldLabel: { marginBottom: 6, letterSpacing: 0.2 },
  helperText: { marginBottom: 4, lineHeight: 18 },
  taxTypeRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  taxTypeCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, alignItems: "center", justifyContent: "center", marginRight: 12 },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 48, marginBottom: 4 },
  uploadTaxBox: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: "dashed",
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  uploadTaxIcon: { width: 36, height: 36 },
  badgeOverlay: { position: "absolute", width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", bottom: 0, right: 0, borderWidth: 1.5, borderColor: "#FFF" },
  badgeIcon: { width: 12, height: 12 },
  changeBtn: { marginTop: 12 },
  previewBox: { borderRadius: 14, padding: 16, alignItems: "center" },
  previewWrap: { position: "relative" },
  previewImg: { width: 100, height: 100, borderRadius: 12 },
  selfieBox: {
    borderRadius: 14,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: "center",
    marginTop: 4,
    borderWidth: 1,
  },
  selfieBoxEmpty: { borderStyle: "dashed" },
  selfieBoxFilled: { borderStyle: "solid" },
  selfiePlaceholder: { alignItems: "center" },
  selfieCircle: { width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderStyle: "dashed", alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: 14 },
  selfieCircleImg: { width: 50, height: 50 },
  cameraBtn: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, gap: 10 },
  cameraIcon: { width: 20, height: 20 },
  selfieCaptured: { alignItems: "center" },
  selfieWrap: { position: "relative" },
  selfieImg: { width: 110, height: 110, borderRadius: 55 },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    backgroundColor: "transparent",
  },
  nextBtn: { borderRadius: 28 },
});
