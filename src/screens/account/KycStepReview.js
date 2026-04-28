import React from "react";
import {
  AppSafeAreaView,
  AppText,
  FOURTEEN,
  SEMI_BOLD,
  SIXTEEN,
  TWELVE,
} from "../../shared";
import KeyBoardAware from "../../shared/components/KeyboardAware";
import { StyleSheet, View, ScrollView, TouchableOpacity, Platform } from "react-native";
import FastImage from "react-native-fast-image";
import { colors } from "../../theme/colors";
import { useKycForm } from "../../context/KycFormContext";
import NavigationService from "../../navigation/NavigationService";
import { KYC_VERIFICATION_SCREEN } from "../../navigation/routes";
import { appBg, DEMO_USER } from "../../helper/ImageAssets";
import KycStepHeader from "./KycStepHeader";
import { useTheme } from "../../hooks/useTheme";

const KycStepReview = () => {
  const { colors: themeColors, isDark } = useTheme();
  const accentColor = isDark ? colors.white : (colors.buttonBg || "#F3BB2B");

  const {
    theme,
    userData,
    firstName,
    lastName,
    aadhar,
    panCard,
    docFront,
    docBack,
    panCardImage,
    selfieImage,
    getIdDocConfig,
    getTaxDocConfig,
  } = useKycForm();

  const cardBg = themeColors.card;
  const innerBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)";
  const borderClr = themeColors.border;
  const textClr = themeColors.text;
  const mutedClr = themeColors.secondaryText;
  const docLast4 = (aadhar && aadhar.length >= 4) ? aadhar.slice(-4) : "****";
  const taxLast4 = (panCard && panCard.length >= 4) ? panCard.slice(-4) : "****";
  const fullName = `${(firstName || userData?.firstName) || ""} ${(lastName || userData?.lastName) || ""}`.trim() || "—";
  const mobileStr = userData?.country_code && userData?.mobileNumber ? `${userData.country_code} ${userData.mobileNumber}` : (userData?.mobileNumber || "—");

  const onSubmitPress = () => NavigationService.navigate(KYC_VERIFICATION_SCREEN);

  const InfoRow = ({ label, value }) => (
    <View style={styles.infoRow}>
      <AppText type={TWELVE} style={[styles.infoLabel, { color: mutedClr }]}>{label}</AppText>
      <AppText type={TWELVE} weight={SEMI_BOLD} style={[styles.infoValue, { color: textClr }]} numberOfLines={1}>{value}</AppText>
    </View>
  );

  const DocCard = ({ title, image }) => (
    <View style={[styles.docCard, { backgroundColor: innerBg }]}>
      <AppText type={TWELVE} weight={SEMI_BOLD} style={[styles.docCardTitle, { color: textClr }]}>{title}</AppText>
      <View style={[styles.docImgWrap, { borderColor: borderClr }]}>
        {image ? <FastImage source={{ uri: image.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : <AppText type={TWELVE} style={{ color: mutedClr }}>—</AppText>}
      </View>
    </View>
  );

  return (
    <AppSafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <KeyBoardAware style={{ flex: 1 }}>
        <KycStepHeader title="Review Your Information" theme={theme} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={[styles.stepBadge, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)" }]}>
            <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: accentColor }}>Step 6 of 6</AppText>
          </View>

          {/* Profile & Personal Info */}
          <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: borderClr, borderWidth: 1 }]}>
            <AppText type={TWELVE} weight={SEMI_BOLD} style={[styles.sectionTitle, { color: mutedClr }]}>Personal details</AppText>
            <View style={styles.profileRow}>
              <View style={[styles.avatarWrap, { borderColor: borderClr }]}>
                <FastImage source={selfieImage ? { uri: selfieImage.uri } : DEMO_USER} style={styles.avatarImg} resizeMode="cover" />
              </View>
              <View style={styles.profileInfo}>
                <AppText type={SIXTEEN} weight={SEMI_BOLD} style={{ color: textClr }} numberOfLines={2}>{fullName}</AppText>
                <AppText type={TWELVE} style={{ color: mutedClr, marginTop: 2 }} numberOfLines={1}>{userData?.emailId || "—"}</AppText>
              </View>
            </View>
            <View style={[styles.infoBlock, { backgroundColor: innerBg }]}>
              <InfoRow label="Full Name" value={fullName} />
              <InfoRow label="Email" value={userData?.emailId || "—"} />
              <InfoRow label="Mobile" value={mobileStr} />
              <InfoRow label="Document No." value={`****${docLast4}`} />
              <InfoRow label="Tax ID" value={`****${taxLast4}`} />
            </View>
          </View>

          {/* ID Documents */}
          <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: borderClr, borderWidth: 1 }]}>
            <AppText type={TWELVE} weight={SEMI_BOLD} style={[styles.sectionTitle, { color: mutedClr }]}>{getIdDocConfig()?.label || "ID"} document</AppText>
            <View style={[styles.idNumberRow, { backgroundColor: innerBg }]}>
              <AppText type={TWELVE} style={{ color: mutedClr }}>{getIdDocConfig()?.label || "ID"} Number:</AppText>
              <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: textClr, marginLeft: 8 }}>****{docLast4}</AppText>
            </View>
            <View style={styles.docGrid}>
              <DocCard title="Front" image={docFront} />
              <DocCard title="Back" image={docBack} />
            </View>
          </View>

          {/* Tax & Selfie */}
          <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: borderClr, borderWidth: 1 }]}>
            <AppText type={TWELVE} weight={SEMI_BOLD} style={[styles.sectionTitle, { color: mutedClr }]}>{getTaxDocConfig()?.label || "Tax"} & selfie</AppText>
            <View style={[styles.idNumberRow, { backgroundColor: innerBg }]}>
              <AppText type={TWELVE} style={{ color: mutedClr }}>{getTaxDocConfig()?.label || "Tax ID"}:</AppText>
              <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: textClr, marginLeft: 8 }}>****{taxLast4}</AppText>
            </View>
            <View style={styles.docGrid}>
              <DocCard title="Tax Document" image={panCardImage} />
              <DocCard title="Selfie" image={selfieImage} />
            </View>
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <TouchableOpacity onPress={onSubmitPress} style={[styles.submitBtn, { backgroundColor: themeColors.button }]} activeOpacity={0.85}>
            <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: isDark ? colors.black : colors.white }}>Submit KYC</AppText>
          </TouchableOpacity>
        </View>
      </KeyBoardAware>
    </AppSafeAreaView>
  );
};

export default KycStepReview;

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
  profileRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  avatarWrap: { width: 64, height: 64, borderRadius: 32, overflow: "hidden", borderWidth: 2, marginRight: 14 },
  avatarImg: { width: "100%", height: "100%" },
  profileInfo: { flex: 1, minWidth: 0 },
  infoBlock: { borderRadius: 12, padding: 14 },
  infoRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  infoLabel: { flexShrink: 0 },
  infoValue: { flex: 1, textAlign: "right", marginLeft: 12 },
  idNumberRow: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 12, marginBottom: 12 },
  docGrid: { flexDirection: "row", gap: 10 },
  docCard: { flex: 1, borderRadius: 12, padding: 12 },
  docCardTitle: { marginBottom: 8 },
  docImgWrap: { height: 100, borderRadius: 10, overflow: "hidden", borderWidth: 1, alignItems: "center", justifyContent: "center" },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    backgroundColor: "transparent",
  },
  submitBtn: {
    backgroundColor: colors.buttonBg,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: "center",
    ...Platform.select({
      ios: { shadowColor: colors.buttonBg, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
});
