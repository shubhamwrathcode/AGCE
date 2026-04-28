import React from "react";
import { AppSafeAreaView, AppText, Button, SEMI_BOLD, SIXTEEN, TWELVE } from "../../shared";
import KeyBoardAware from "../../shared/components/KeyboardAware";
import { StyleSheet, View, ScrollView, Platform } from "react-native";
import FastImage from "react-native-fast-image";
import { colors } from "../../theme/colors";
import { useKycForm } from "../../context/KycFormContext";
import NavigationService from "../../navigation/NavigationService";
import { KYC_STEP_SIX_SCREEN } from "../../navigation/routes";
import { appBg, DEMO_USER, checkIc } from "../../helper/ImageAssets";
import KycStepHeader from "./KycStepHeader";
import { useTheme } from "../../hooks/useTheme";

const KycStepFive = () => {
  const { colors: themeColors, isDark, theme } = useTheme();
  const { selfieImage } = useKycForm();
  const accentColor = isDark ? colors.white : (colors.buttonBg || "#F3BB2B");

  const onNext = () => {
    NavigationService.navigate(KYC_STEP_SIX_SCREEN);
  };

  const cardBg = themeColors.card;
  const textClr = themeColors.text;
  const borderClr = themeColors.border;

  return (
    <AppSafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <KeyBoardAware style={{ flex: 1 }}>
        <KycStepHeader title="Face Verification" theme={theme} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={[styles.stepBadge, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)" }]}>
            <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: accentColor }}>Step 5 of 6</AppText>
          </View>

          <View style={[styles.successCard, { backgroundColor: cardBg, borderColor: borderClr, borderWidth: 1 }]}>
            <View style={styles.faceWrap}>
              <View style={[styles.faceCircle, { borderColor: accentColor }]}>
                <FastImage source={selfieImage ? { uri: selfieImage.uri } : DEMO_USER} resizeMode="cover" style={styles.faceImg} />
              </View>
              <View style={[styles.successBadge, { backgroundColor: accentColor, borderColor: colors.white }]}>
                <FastImage source={checkIc} resizeMode="contain" style={styles.successBadgeIcon} tintColor={isDark ? colors.blueThemeColor : colors.white} />
              </View>
            </View>
            <AppText type={SIXTEEN} weight={SEMI_BOLD} style={[styles.successTitle, { color: textClr }]}>
              Face captured successfully
            </AppText>
            <AppText type={TWELVE} style={[styles.successSubtitle, { color: themeColors.secondaryText }]}>
              Your selfie has been verified. Tap Next to review your submission.
            </AppText>
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <Button children="Next" onPress={onNext} containerStyle={[styles.nextBtn, { backgroundColor: themeColors.button }]} />
        </View>
      </KeyBoardAware>
    </AppSafeAreaView>
  );
};

export default KycStepFive;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32, alignItems: "center" },
  stepBadge: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 20 },
  successCard: {
    width: "100%",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12 },
      android: { elevation: 1.5 },
    }),
  },
  faceWrap: { position: "relative", marginBottom: 20 },
  faceCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    overflow: "hidden",
    borderWidth: 3,
  },
  faceImg: { width: "100%", height: "100%" },
  successBadge: {
    position: "absolute",
    bottom: 10,
    right: -0,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  successBadgeIcon: { width: 20, height: 20 },
  successTitle: { textAlign: "center", marginBottom: 8 },
  successSubtitle: { textAlign: "center", lineHeight: 20, maxWidth: 260 },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    backgroundColor: "transparent",
  },
  nextBtn: { borderRadius: 28 },
});
