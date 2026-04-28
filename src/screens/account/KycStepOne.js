import React, { useEffect, useRef, useState } from "react";
import {
  AppSafeAreaView,
  AppText,
  Button,
  FOURTEEN,
  RED,
  SEMI_BOLD,
  TWELVE,
} from "../../shared";
import KeyBoardAware from "../../shared/components/KeyboardAware";
import { StyleSheet, View, ScrollView, FlatList, TouchableOpacity } from "react-native";
import { colors } from "../../theme/colors";
import PickerSelect from "../../shared/components/PickerSelect";
import { useKycForm, getDocTypeName } from "../../context/KycFormContext";
import NavigationService from "../../navigation/NavigationService";
import { KYC_STEP_TWO_SCREEN } from "../../navigation/routes";
import { useDispatch } from "react-redux";
import { getKycStatus } from "../../actions/accountActions";
import { kycStepStyles } from "./kycStepStyles";
import FastImage from "react-native-fast-image";
import { appBg } from "../../helper/ImageAssets";
import KycStepHeader from "./KycStepHeader";
import { useTheme } from "../../hooks/useTheme";

const KycStepOne = ({ route }) => {
  const dispatch = useDispatch();
  const resubmitFetchedRef = useRef(false);
  const [resubmitLoading, setResubmitLoading] = useState(false);
  const {
    theme,
    pickerCountries,
    modalCountry,
    setModalCountry,
    modalIdType,
    setModalIdType,
    kycConfig,
    loadingConfig,
    validateStep0,
    resetForm,
    setInitialFromResubmit,
    setDocumentsToResubmit,
    setNeedsResubmission,
  } = useKycForm();

  const { colors: themeColors, isDark } = useTheme();
  const accentColor = isDark ? colors.white : (colors.buttonBg || "#F3BB2B");
  const cardBg = themeColors.card;
  const borderClr = themeColors.border;
  const textClr = themeColors.text;

  useEffect(() => {
    if (route.params?.resetForm) {
      resubmitFetchedRef.current = false;
      resetForm();
    }
    if (route.params?.isResubmit) {
      if (!resubmitFetchedRef.current) {
        resubmitFetchedRef.current = true;
        setResubmitLoading(true);
        dispatch(getKycStatus()).then((data) => {
          if (data) {
            const kyc = data.kyc_data || {};
            setInitialFromResubmit({
              existingKycData: kyc,
              existingCountryCode: kyc.country_code || "",
              submittedIdDocType: kyc.id_document_type || null,
              submittedTaxDocType: kyc.tax_document_type || null,
              resubmitIdNumber: kyc.id_document_number ?? "",
              resubmitTaxNumber: kyc.tax_document_number ?? "",
            });
            setDocumentsToResubmit(data.documents_needing_resubmission || []);
            setNeedsResubmission(!!data.needs_resubmission);
          } else {
            setInitialFromResubmit(route.params);
            setDocumentsToResubmit(route.params?.documentsToResubmit || []);
            setNeedsResubmission(!!route.params?.needsResubmission);
          }
          setResubmitLoading(false);
        });
      }
    }
  }, [route.params?.resetForm, route.params?.isResubmit, dispatch, setInitialFromResubmit, setDocumentsToResubmit, setNeedsResubmission, resetForm]);

  const onNext = () => {
    if (!validateStep0()) return;
    NavigationService.navigate(KYC_STEP_TWO_SCREEN);
  };

  return (
    <AppSafeAreaView style={{ backgroundColor: themeColors.background, flex: 1 }}>
      <KeyBoardAware style={{ flex: 1 }}>
        <KycStepHeader title="Select Country and ID Type" theme={theme} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={[styles.stepBadge, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)" }]}>
            <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: accentColor }}>Step 1 of 6</AppText>
          </View>
          <AppText type={FOURTEEN} weight={SEMI_BOLD} style={[kycStepStyles.modalLabel, { color: textClr }]}>Country/Region <AppText color={RED}>*</AppText></AppText>
          <PickerSelect data={pickerCountries} selected={modalCountry} onSelect={setModalCountry} theme={theme} placeholder="Select Country" style={kycStepStyles.dropdown} flag={true} />
          {loadingConfig && <AppText type={TWELVE} style={{ color: textClr, marginTop: 8 }}>Loading document options...</AppText>}
          {kycConfig && (
            <>
              <AppText type={FOURTEEN} weight={SEMI_BOLD} style={[kycStepStyles.modalLabel, { color: textClr, marginTop: 20 }]}>ID Type <AppText color={RED}>*</AppText></AppText>
              <FlatList
                data={kycConfig.id_documents || []}
                numColumns={2}
                keyExtractor={(d) => d.code}
                scrollEnabled={false}
                columnWrapperStyle={kycStepStyles.idTypeRow}
                renderItem={({ item: doc }) => {
                  const isSelected = modalIdType === doc.code;
                  return (
                    <TouchableOpacity
                      style={[
                        kycStepStyles.idTypeCard,
                        { backgroundColor: cardBg, borderColor: isSelected ? colors.buttonBg : themeColors.border },
                        isSelected && kycStepStyles.idTypeCardSelected,
                      ]}
                      onPress={() => setModalIdType(doc.code)}
                      activeOpacity={0.7}
                    >
                      <View style={[kycStepStyles.idTypeRadioOuter, {
                        borderColor: isSelected ? (colors.buttonBg || "#F3BB2B") : themeColors.border,
                      }]}>
                        {isSelected && <View style={[kycStepStyles.idTypeRadioInner, { backgroundColor: colors.buttonBg, }]} />}
                      </View>
                      <AppText type={TWELVE} weight={isSelected ? SEMI_BOLD : "normal"} style={[kycStepStyles.idTypeLabel, { color: isSelected ? textClr : themeColors.secondaryText }]} numberOfLines={1}>{doc.label || getDocTypeName(doc.code)}</AppText>
                    </TouchableOpacity>
                  );
                }}
              />
            </>
          )}
        </ScrollView>
        <View style={styles.footer}>
          {resubmitLoading ? (
            <AppText type={FOURTEEN} style={{ color: textClr, textAlign: "center", marginBottom: 12 }}>Loading your details...</AppText>
          ) : null}
          <Button children="Next" onPress={onNext} disabled={resubmitLoading} containerStyle={[kycStepStyles.modalBtnPrimary, { backgroundColor: themeColors.button }]} />
        </View>
      </KeyBoardAware>
    </AppSafeAreaView>
  );
};

export default KycStepOne;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 24 },
  stepBadge: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 16 },
  footer: { paddingHorizontal: 20, paddingBottom: 24 },
});
