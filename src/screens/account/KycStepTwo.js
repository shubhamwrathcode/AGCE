import React from "react";
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
import { Platform, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { colors } from "../../theme/colors";
import PickerSelect from "../../shared/components/PickerSelect";
import { useKycForm } from "../../context/KycFormContext";
import NavigationService from "../../navigation/NavigationService";
import { KYC_STEP_THREE_SCREEN } from "../../navigation/routes";
import KycStepHeader from "./KycStepHeader";
import { useTheme } from "../../hooks/useTheme";
import DateTimePickerModal from "react-native-modal-datetime-picker";

const KycStepTwo = () => {
  const { colors: themeColors, isDark } = useTheme();
  const accentColor = isDark ? colors.white : (colors.buttonBg || "#F3BB2B");

  const {
    theme,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    infoDob,
    setInfoDob,
    showDobPicker,
    setShowDobPicker,
    dobPickerClosedAt,
    gender,
    setGender,
    address,
    setAddress,
    city,
    setCity,
    infoState,
    setInfoState,
    zipCode,
    setZipCode,
    validateStep1,
  } = useKycForm();

  const cardBg = themeColors.card;
  const borderClr = themeColors.border;
  const textClr = themeColors.text;
  const inputWrap = { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)", borderColor: borderClr };
  const genderOptions = [{ value: "male", label: "Male" }, { value: "female", label: "Female" }, { value: "other", label: "Other" }];

  const onNext = () => {
    if (!validateStep1()) return;
    NavigationService.navigate(KYC_STEP_THREE_SCREEN);
  };

  return (
    <AppSafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <KeyBoardAware style={{ flex: 1 }}>
        <KycStepHeader title="Personal Details" theme={theme} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={[styles.stepBadge, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)" }]}>
            <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: accentColor }}>Step 2 of 6</AppText>
          </View>

          {/* Personal Info Section */}
          <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: borderClr, borderWidth: 1 }]}>
            <AppText type={TWELVE} weight={SEMI_BOLD} style={[styles.sectionTitle, { color: themeColors.secondaryText }]}>Personal information</AppText>
            <AppText type={FOURTEEN} weight={SEMI_BOLD} style={[styles.fieldLabel, { color: textClr }]}>First Name <AppText color={RED}>*</AppText></AppText>
            <Input placeholder="First Name" value={firstName} onChangeText={setFirstName} containerStyle={[styles.input, inputWrap]} inputStyle={{ color: textClr }} placeholderTextColor={themeColors.secondaryText} />
            <AppText type={FOURTEEN} weight={SEMI_BOLD} style={[styles.fieldLabel, { color: textClr }]}>Last Name <AppText color={RED}>*</AppText></AppText>
            <Input placeholder="Last Name" value={lastName} onChangeText={setLastName} containerStyle={[styles.input, inputWrap]} inputStyle={{ color: textClr }} placeholderTextColor={themeColors.secondaryText} />
            <AppText type={FOURTEEN} weight={SEMI_BOLD} style={[styles.fieldLabel, { color: textClr }]}>Date of Birth <AppText color={RED}>*</AppText></AppText>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => {
                if (Date.now() - dobPickerClosedAt.current < 500) return;
                setShowDobPicker(true);
              }}
            >
              <Input
                placeholder="DD/MM/YYYY"
                value={infoDob}
                editable={false}
                containerStyle={[styles.input, inputWrap]}
                inputStyle={{ color: textClr }}
                placeholderTextColor={themeColors.secondaryText}
              />
            </TouchableOpacity>
            <DateTimePickerModal
              isVisible={showDobPicker}
              mode="date"
              date={infoDob && infoDob.includes("/") ? (() => {
                const parts = infoDob.split("/");
                return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
              })() : (infoDob ? new Date(infoDob) : (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 18); return d; })())}
              maximumDate={(() => { const d = new Date(); d.setFullYear(d.getFullYear() - 18); return d; })()}
              minimumDate={(() => { const d = new Date(); d.setFullYear(d.getFullYear() - 100); return d; })()}
              onConfirm={(date) => {
                const y = date.getFullYear();
                const m = String(date.getMonth() + 1).padStart(2, "0");
                const day = String(date.getDate()).padStart(2, "0");
                setInfoDob(`${day}/${m}/${y}`);
                dobPickerClosedAt.current = Date.now();
                setShowDobPicker(false);
              }}
              onCancel={() => {
                dobPickerClosedAt.current = Date.now();
                setShowDobPicker(false);
              }}
              isDarkModeEnabled={isDark}
            />
            <AppText type={FOURTEEN} weight={SEMI_BOLD} style={[styles.fieldLabel, { color: textClr }]}>Gender <AppText color={RED}>*</AppText></AppText>
            <PickerSelect
              data={genderOptions}
              selected={gender}
              onSelect={(item) => setGender(item?.value ?? item)}
              theme={theme}
              placeholder="Select Gender"
              style={[styles.input, inputWrap]}
            />
          </View>

          {/* Address Section */}
          <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: borderClr, borderWidth: 1 }]}>
            <AppText type={TWELVE} weight={SEMI_BOLD} style={[styles.sectionTitle, { color: themeColors.secondaryText }]}>Address</AppText>
            <AppText type={FOURTEEN} weight={SEMI_BOLD} style={[styles.fieldLabel, { color: textClr }]}>Address <AppText color={RED}>*</AppText></AppText>
            <Input placeholder="Full address (min 10 characters)" value={address} onChangeText={setAddress} containerStyle={[styles.input, inputWrap]} inputStyle={{ color: textClr }} placeholderTextColor={themeColors.secondaryText} />
            <AppText type={FOURTEEN} weight={SEMI_BOLD} style={[styles.fieldLabel, { color: textClr }]}>City <AppText color={RED}>*</AppText></AppText>
            <Input placeholder="City" value={city} onChangeText={setCity} containerStyle={[styles.input, inputWrap]} inputStyle={{ color: textClr }} placeholderTextColor={themeColors.secondaryText} />
            <View style={styles.row2}>
              <View style={styles.halfField}>
                <AppText type={FOURTEEN} weight={SEMI_BOLD} style={[styles.fieldLabel, { color: textClr }]}>State <AppText color={RED}>*</AppText></AppText>
                <Input placeholder="State" value={infoState} onChangeText={setInfoState} containerStyle={[styles.input, inputWrap]} inputStyle={{ color: textClr }} placeholderTextColor={themeColors.secondaryText} />
              </View>
              <View style={styles.halfField}>
                <AppText type={FOURTEEN} weight={SEMI_BOLD} style={[styles.fieldLabel, { color: textClr }]}>Zip <AppText color={RED}>*</AppText></AppText>
                <Input placeholder="Zip Code" value={zipCode} onChangeText={setZipCode} containerStyle={[styles.input, inputWrap]} inputStyle={{ color: textClr }} placeholderTextColor={themeColors.secondaryText} />
              </View>
            </View>
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <Button children="Next" onPress={onNext} containerStyle={[styles.nextBtn, { backgroundColor: themeColors.button }]} />
        </View>
      </KeyBoardAware>
    </AppSafeAreaView>
  );
};

export default KycStepTwo;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32 },
  stepBadge: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 20 },
  sectionCard: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: { elevation: 1.5 },
    }),
  },
  sectionTitle: { marginBottom: 16, textTransform: "uppercase", letterSpacing: 0.8 },
  fieldLabel: { marginBottom: 6, letterSpacing: 0.2 },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 48, marginBottom: 14, },
  row2: { flexDirection: "row", gap: 12 },
  halfField: { flex: 1 },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    backgroundColor: "transparent",
  },
  nextBtn: {
    borderRadius: 28,
    ...Platform.select({
      ios: {
        shadowColor: "rgba(0,0,0,0.35)",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
});
