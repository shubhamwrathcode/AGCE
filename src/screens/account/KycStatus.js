import React, { useCallback, useEffect, useState, useRef } from "react";
import { Animated, Dimensions, StyleSheet, TouchableOpacity, View, ScrollView, FlatList, useWindowDimensions } from "react-native";
import {
  AppSafeAreaView,
  AppText,
  Button,
  RED,
  SEMI_BOLD,
  FOURTEEN,
  FIFTEEN,
  THIRD,
  NORMAL,
  TWELVE,
  THIRTEEN,
} from "../../shared";
import FastImage from "react-native-fast-image";
import {
  appBg,
  kyc_completed,
  kyc_pending,
  kyc_rejected,
  kyc_success_vector,
  NEW_STAR,
  KYC_THEME,
  closeIcon,
  checkIc,
  downIcon,
  upIcon,
  kyc_ic,
  kyc_verification_vector,
} from "../../helper/ImageAssets";
import KeyBoardAware from "../../shared/components/KeyboardAware";
import { borderWidth, universalPaddingHorizontal, universalPaddingHorizontalHigh } from "../../theme/dimens";
import { colors } from "../../theme/colors";
import { commonStyles } from "../../theme/commonStyles";
import NavigationService from "../../navigation/NavigationService";
import { KYC_STEP_ONE_SCREEN, KYC_RESUBMIT_SCREEN, TRADE_SCREEN, NAVIGATION_BOTTOM_TAB_STACK, NAVIGATION_TRADE_STACK } from "../../navigation/routes";
import { useFocusEffect } from "@react-navigation/native";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { setLoading } from "../../slices/authSlice";
import { getUserProfile, getKycStatus } from "../../actions/accountActions";
import KycStepHeader from "./KycStepHeader";
import { useTheme } from "../../hooks/useTheme";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SHIMMER_STRIP = 180;
const SIDE_PAD = 16;
const CARD_W = SCREEN_WIDTH - SIDE_PAD * 2;

// ─── Shimmer cell ────────────────────────────────────────────────────────────
const ShimmerCell = ({ width: w, height, borderRadius = 6, style }) => {
  const { colors: themeColors, isDark } = useTheme();
  const shimmerX = useRef(new Animated.Value(-SHIMMER_STRIP)).current;
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    const run = () => {
      if (!mounted.current) return;
      shimmerX.setValue(-SHIMMER_STRIP);
      Animated.timing(shimmerX, {
        toValue: Math.max(w, 1) + SHIMMER_STRIP,
        duration: 1100,
        useNativeDriver: true,
      }).start(({ finished }) => { if (mounted.current && finished) run(); });
    };
    const t = setTimeout(run, 50);
    return () => { mounted.current = false; clearTimeout(t); shimmerX.stopAnimation(); };
  }, [shimmerX, w]);
  return (
    <View style={[{ width: w, height, borderRadius, overflow: "hidden", backgroundColor: themeColors.themeElevationColor }, style]}>
      <Animated.View
        pointerEvents="none"
        style={{ position: "absolute", top: 0, bottom: 0, width: SHIMMER_STRIP, transform: [{ translateX: shimmerX }], backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)" }}
      />
    </View>
  );
};

// ─── KYC Status card skeleton (only the dynamic top card) ────────────────────
const KycStatusSkeleton = () => {
  const { colors: themeColors } = useTheme();
  return (
    <View style={[styles.kycSectionCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]}>
      {/* Title */}
      <ShimmerCell width={160} height={16} borderRadius={5} style={{ marginBottom: 12 }} />
      {/* Description lines */}
      <ShimmerCell width={CARD_W - 40} height={11} borderRadius={4} style={{ marginBottom: 6 }} />
      <ShimmerCell width={CARD_W * 0.75} height={11} borderRadius={4} style={{ marginBottom: 16 }} />
      {/* Sub-heading */}
      <ShimmerCell width={120} height={13} borderRadius={4} style={{ marginBottom: 10 }} />
      {/* Doc status rows × 3 */}
      {[1, 2, 3].map((i) => (
        <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <ShimmerCell width={22} height={22} borderRadius={11} />
          <ShimmerCell width={CARD_W * 0.55} height={11} borderRadius={4} />
        </View>
      ))}
    </View>
  );
};

const getDocStatusDisplay = (status) => {
  switch (status) {
    case "approved": return { icon: "✅", text: "Approved" };
    case "rejected": return { icon: "❌", text: "Rejected" };
    case "resubmit_required": return { icon: "⚠️", text: "Resubmission Required" };
    case "pending":
    default: return { icon: "⏳", text: "Under Review" };
  }
};

const getDocTypeName = (code) => {
  const names = { AADHAAR: "Aadhaar Card", PAN: "PAN Card", TAX_ID: "TAX ID", PASSPORT: "Passport", NATIONAL_ID: "National ID Card", DRIVING_LICENSE: "Driving License", RESIDENCE_PERMIT: "Residence Permit", SSN: "SSN", TIN: "TIN", NIN: "NIN", TFN: "TFN", NRIC: "NRIC", EMIRATES_ID: "Emirates ID", VOTER_ID: "Voter ID" };
  return names[code] || code || "ID Document";
};

const KycPending = ({ idDocStatus, taxDocStatus, selfieStatus, submittedIdDocType, submittedTaxDocType, showResubmitButton, onResubmitPress }) => {
  const { colors: themeColors } = useTheme();
  const idD = getDocStatusDisplay(idDocStatus);
  const taxD = getDocStatusDisplay(taxDocStatus);
  const selfD = getDocStatusDisplay(selfieStatus);

  const docItems = [
    { label: submittedIdDocType ? getDocTypeName(submittedIdDocType) : "Identity Document", status: idD.text, icon: idD.icon },
    { label: submittedTaxDocType ? getDocTypeName(submittedTaxDocType) : "Tax Document", status: taxD.text, icon: taxD.icon },
    { label: "Live Selfie", status: selfD.text, icon: selfD.icon },
  ];

  return (
    <View style={[styles.kycSectionCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]}>
      <AppText type={FIFTEEN} weight={SEMI_BOLD} style={[styles.kycSectionCardTitle, { color: themeColors.text }]}>
        KYC Pending
      </AppText>
      <AppText type={FOURTEEN} weight={NORMAL} style={[styles.kycPendingDesc, { color: themeColors.secondaryText }]}>
        Your KYC application has been submitted and is currently under review. You will be notified once the verification is complete.
      </AppText>
      <View style={styles.kycPendingDocsHeaderRow}>
        <AppText type={FOURTEEN} weight={SEMI_BOLD} style={[styles.kycPendingDocsTitle, { color: themeColors.text }]}>
          Documents Submitted
        </AppText>
      </View>
      <View style={styles.kycPendingDocList}>
        <View style={styles.kycPendingDocListContent}>
          {docItems.map((item, index) => (
            <View key={index} style={styles.kycPendingDocRow}>
              <AppText type={FOURTEEN} style={styles.kycPendingDocIconText}>{item.icon}</AppText>
              <AppText type={FOURTEEN} style={{ color: themeColors.secondaryText, flex: 1 }}>
                {item.label} - {item.status}
              </AppText>
            </View>
          ))}
        </View>
        <FastImage source={kyc_verification_vector} resizeMode="contain" style={styles.kycPendingIllustrationSide} />
      </View>
      {showResubmitButton && onResubmitPress ? (
        <Button children="Resubmit Documents" onPress={onResubmitPress} containerStyle={styles.kycPendingResubmitButton} />
      ) : null}
    </View>
  );
};

const KycRejected = ({ onVerifyPress }) => {
  const dispatch = useAppDispatch();
  const userData = useAppSelector((state) => state.auth.userData);
  const { colors: themeColors } = useTheme();
  useEffect(() => {
    dispatch(getUserProfile());
  }, [dispatch]);
  const kyc_reject_reason = userData?.kyc_reject_reason;
  return (
    <View>
      <FastImage
        source={kyc_rejected}
        resizeMode="contain"
        style={styles.icon}
      />
      <AppText
        weight={SEMI_BOLD}
        style={[styles.title, { color: themeColors.text }]}
      >
        Your Account KYC is rejected. Please complete your KYC again.
      </AppText>
      {kyc_reject_reason ? (
        <View style={[styles.reasonContainer, { borderColor: themeColors.red, backgroundColor: `${themeColors.red}10` }]}>
          <AppText style={commonStyles.centerText} color={themeColors.red}>
            Reason: {kyc_reject_reason}
          </AppText>
        </View>
      ) : null}
      <Button
        children="Verify Again"
        onPress={onVerifyPress}
        containerStyle={styles.button}
      />
    </View>
  );
};



const KycDue = ({ onVerifyPress, screenWidth }) => {
  const { colors: themeColors } = useTheme();
  const isSmallScreen = screenWidth < 380;
  return (
    <View style={[styles.kycCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]}>
      <AppText type={FIFTEEN} weight={SEMI_BOLD} style={[styles.kycCardTitle, { color: themeColors.text }]}>KYC</AppText>
      <AppText type={TWELVE} weight={NORMAL} style={[styles.kycCardDesc, { color: themeColors.secondaryText }]}>
        Finish your KYC in just a few minutes and enjoy a seamless experience. Submit your basic details once and get instant access to withdrawals, rewards, and every feature without any delays or limitations.
      </AppText>
      <AppText type={THIRTEEN} weight={SEMI_BOLD} style={[styles.kycRequirementsSubtitle, { color: themeColors.text }]}>KYC Verification Requirements</AppText>
      <View style={[styles.kycRequirementsRow, isSmallScreen && styles.kycRequirementsRowColumn]}>
        <View style={styles.kycRequirementsList}>
          <View style={styles.requirementItem}>
            <FastImage source={NEW_STAR} resizeMode="contain" style={styles.starIcon} tintColor={colors.starColor} />
            <AppText type={THIRTEEN} weight={NORMAL} style={[styles.requirementText, { color: themeColors.secondaryText }]}>ID Document</AppText>
          </View>
          <View style={styles.requirementItem}>
            <FastImage source={NEW_STAR} resizeMode="contain" style={styles.starIcon} tintColor={colors.starColor} />
            <AppText type={THIRTEEN} weight={NORMAL} style={[styles.requirementText, { color: themeColors.secondaryText }]}>Tax Document</AppText>
          </View>
          <View style={styles.requirementItem}>
            <FastImage source={NEW_STAR} resizeMode="contain" style={styles.starIcon} tintColor={colors.starColor} />
            <AppText type={THIRTEEN} weight={NORMAL} style={[styles.requirementText, { color: themeColors.secondaryText }]}>Live Selfie (Camera Required)</AppText>
          </View>
        </View>
        {!isSmallScreen && (
          <FastImage source={KYC_THEME} resizeMode="contain" style={styles.kycThemeIcon} />
        )}
      </View>
      <Button children="Verify" onPress={onVerifyPress} containerStyle={styles.verifyButton} />
      {isSmallScreen && (
        <FastImage source={KYC_THEME} resizeMode="contain" style={styles.kycThemeIconSmall} />
      )}
    </View>
  );
};

const YOUR_BENEFITS = [
  "Deposit & Withdraw Without Limit",
  "Spot & Futures Trading Unlock",
  "100% Secure Trading with Verified KYC",
];

const KycCompleted = () => {
  const { colors: themeColors } = useTheme();
  return (
    <View style={[styles.kycSectionCard, styles.kycCompletedCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]}>
      <AppText type={FOURTEEN} style={[styles.kycCompletedCongrats, { color: themeColors.secondaryText }]}>
        Congratulations! Your KYC verification has been approved. You now have full access to all platform features.
      </AppText>
      <AppText type={FIFTEEN} weight={SEMI_BOLD} style={[styles.kycCompletedBenefitsTitle, { color: themeColors.text }]}>
        Your Benefits
      </AppText>
      <View style={styles.kycCompletedBenefitsRow}>
        <View style={styles.kycCompletedBenefitsList}>
          {YOUR_BENEFITS.map((text, i) => (
            <View key={i} style={styles.kycCompletedBenefitRow}>
              <FastImage source={checkIc} resizeMode="contain" style={styles.kycCompletedCheck} tintColor={themeColors.green} />
              <AppText type={FOURTEEN} style={[styles.kycCompletedBenefitText, { color: themeColors.text }]} numberOfLines={2}>{text}</AppText>
            </View>
          ))}
        </View>
        <FastImage
          source={kyc_success_vector}
          resizeMode="contain"
          style={styles.kycSuccessVector}
        />
      </View>
    </View>
  );
};

const faqData = [
  { q: "How long does KYC take?", a: "KYC verification usually takes 24-48 hours after submission." },
  { q: "What documents do I need for KYC?", a: "A valid government-issued ID and tax document are required." },
  { q: "Can I use the app without completing KYC?", a: "Limited features are available, but full access requires KYC." },
  { q: "Is my personal information secure in the KYC process?", a: "Your data is encrypted and handled according to strict security standards." },
  { q: "Can I resubmit my KYC if it gets rejected?", a: "Yes, if your KYC is rejected or partially rejected, you can reupload the requested documents and resubmit." },
  { q: "Do I need to upload both front and back of my ID?", a: "Some ID documents require both front and back images. The upload fields will appear based on the selected document type." },
  { q: "Is live selfie mandatory for KYC?", a: "Yes, a live selfie captured through your device camera is required to complete KYC verification." },
];

const KycStatus = () => {
  const { colors: themeColors, isDark } = useTheme();
  const userData = useAppSelector((state) => state.auth.userData);
  const dispatch = useAppDispatch();
  const { width: screenWidth } = useWindowDimensions();
  const kycVerified = userData?.kycVerified != null ? Number(userData.kycVerified) : 0;

  const [idDocStatus, setIdDocStatus] = useState(null);
  const [taxDocStatus, setTaxDocStatus] = useState(null);
  const [selfieStatus, setSelfieStatus] = useState(null);
  const [submittedIdDocType, setSubmittedIdDocType] = useState(null);
  const [submittedTaxDocType, setSubmittedTaxDocType] = useState(null);
  const [documentsToResubmit, setDocumentsToResubmit] = useState([]);
  const [existingIdDocNumber, setExistingIdDocNumber] = useState("");
  const [existingTaxDocNumber, setExistingTaxDocNumber] = useState("");
  const [existingCountryCode, setExistingCountryCode] = useState("");
  const [faqActiveIndex, setFaqActiveIndex] = useState(null);
  const [contentLoading, setContentLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      dispatch(setLoading(true));
      return () => {
        dispatch(setLoading(false));
      };
    }, [dispatch])
  );

  useEffect(() => {
    dispatch(getUserProfile());
  }, [dispatch]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const data = await dispatch(getKycStatus());
      if (!mounted) return;
      dispatch(setLoading(false));
      setContentLoading(false);
      if (!data) return;
      setIdDocStatus(data.id_document_status ?? null);
      setTaxDocStatus(data.tax_document_status ?? null);
      setSelfieStatus(data.selfie_status ?? null);
      if (data.kyc_data) {
        setSubmittedIdDocType(data.kyc_data.id_document_type ?? null);
        setSubmittedTaxDocType(data.kyc_data.tax_document_type ?? null);
        setExistingCountryCode(data.kyc_data.country_code ?? "");
        if (data.kyc_data.id_document_number) setExistingIdDocNumber(data.kyc_data.id_document_number);
        if (data.kyc_data.tax_document_number) setExistingTaxDocNumber(data.kyc_data.tax_document_number);
      }
      if (data.needs_resubmission) {
        setDocumentsToResubmit(data.documents_needing_resubmission || []);
      }
    })();
    return () => { mounted = false; };
  }, [dispatch, userData?.kycVerified]);

  const getRejectReason = (docType) => {
    const doc = documentsToResubmit.find((d) => d.type === docType);
    return doc?.reason || "";
  };

  const openVerifyModal = () => {
    NavigationService.navigate(KYC_STEP_ONE_SCREEN, { resetForm: true });
  };

  const openResubmitModal = () => {
    NavigationService.navigate(KYC_RESUBMIT_SCREEN, {
      documentsToResubmit: documentsToResubmit || [],
      existingCountryCode: existingCountryCode || "",
      submittedIdDocType: submittedIdDocType || null,
      submittedTaxDocType: submittedTaxDocType || null,
      resubmitIdNumber: existingIdDocNumber || "",
      resubmitTaxNumber: existingTaxDocNumber || "",
    });
  };

  const benefitsTableRows = [
    { level: "KYC Level", unverified: "Unlimited", advanced: "Unlimited" },
    { level: "Crypto Deposit", unverified: "1 BTC per day", advanced: "100 BTC per day*" },
    { level: "Crypto Withdrawal", unverified: null, unverifiedAvailable: false, advanced: "30,000 USD per day*" },
    { level: "Crypto Swap", unverified: null, unverifiedAvailable: false, advanced: null, advancedAvailable: true },
    { level: "Spot/Futures", unverified: null, unverifiedAvailable: false, advanced: null, advancedAvailable: true },
    { level: "Platform Events", unverified: null, unverifiedAvailable: true, advanced: null, advancedAvailable: true },
  ];

  const renderBenefitsTable = () => (
    <View style={styles.benefitsTableWrap}>
      <View style={[styles.benefitsTableHeader, { borderBottomColor: themeColors.border }]}>
        <AppText type={TWELVE} weight={SEMI_BOLD} style={[styles.benefitsTableHeaderCell, styles.benefitsColLevel, { color: themeColors.text }]}>Level</AppText>
        <AppText type={TWELVE} weight={SEMI_BOLD} style={[styles.benefitsTableHeaderCell, { color: themeColors.text }]}>Unverified</AppText>
        <AppText type={TWELVE} weight={SEMI_BOLD} style={[styles.benefitsTableHeaderCell, { color: themeColors.text }]}>Advanced KYC</AppText>
      </View>
      {benefitsTableRows.map((row, i) => (
        <View key={i} style={[styles.benefitsTableRow, { borderBottomColor: themeColors.border }]}>
          <View style={styles.benefitsTableLevelCell}>
            <FastImage source={NEW_STAR} resizeMode="contain" style={styles.benefitsStar} tintColor={colors.starColor} />
            <AppText type={TWELVE} weight={NORMAL} style={{ color: themeColors.secondaryText, flex: 1 }} numberOfLines={1}>{row.level}</AppText>
          </View>
          <View style={styles.benefitsTableDataCell}>
            {row.unverified != null ? (
              <AppText type={TWELVE} style={{ color: themeColors.secondaryText }}>{row.unverified}</AppText>
            ) : row.unverifiedAvailable ? (
              <FastImage source={checkIc} resizeMode="contain" style={styles.benefitsIconSmall} tintColor={themeColors.green} />
            ) : (
              <FastImage source={closeIcon} resizeMode="contain" style={styles.benefitsIconSmall} tintColor={themeColors.red} />
            )}
          </View>
          <View style={styles.benefitsTableDataCell}>
            {row.advanced != null ? (
              <AppText type={TWELVE} style={{ color: themeColors.secondaryText }}>{row.advanced}</AppText>
            ) : row.advancedAvailable ? (
              <FastImage source={checkIc} resizeMode="contain" style={styles.benefitsIconSmall} tintColor={themeColors.green} />
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );

  const kycStatusView = () => {
    switch (kycVerified) {
      case 0: return <KycDue onVerifyPress={openVerifyModal} screenWidth={screenWidth} />;
      case 1: return <KycPending idDocStatus={idDocStatus} taxDocStatus={taxDocStatus} selfieStatus={selfieStatus} submittedIdDocType={submittedIdDocType} submittedTaxDocType={submittedTaxDocType} />;
      case 2: return <KycCompleted />;
      case 3: return <KycRejected onVerifyPress={openVerifyModal} />;
      case 4: return <KycPending idDocStatus={idDocStatus} taxDocStatus={taxDocStatus} selfieStatus={selfieStatus} submittedIdDocType={submittedIdDocType} submittedTaxDocType={submittedTaxDocType} showResubmitButton onResubmitPress={openResubmitModal} />;
      default: return <KycDue onVerifyPress={openVerifyModal} screenWidth={screenWidth} />;
    }
  };

  return (
    <AppSafeAreaView style={{ backgroundColor: themeColors.background, flex: 1 }}>
      <KeyBoardAware style={{ flex: 1 }}>
        <ScrollView style={styles.mainScroll} contentContainerStyle={styles.mainScrollContent} showsVerticalScrollIndicator={false} bounces={false}>
          <KycStepHeader title={kycVerified === 2 ? "KYC Verified" : "KYC Verification"} theme={isDark ? "Dark" : "Light"} />
          <View style={styles.sectionWrapper}>
            {contentLoading ? <KycStatusSkeleton /> : kycStatusView()}
            <View style={[styles.kycSectionCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]}>
              <AppText type={FIFTEEN} weight={SEMI_BOLD} style={[styles.kycSectionCardTitle, { color: themeColors.text }]}>Account Benefits</AppText>
              {renderBenefitsTable()}
            </View>
            <View style={[styles.kycSectionCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]}>
              <AppText type={FIFTEEN} weight={SEMI_BOLD} style={[styles.kycSectionCardTitle, { color: themeColors.text }]}>FAQ</AppText>
              <FlatList
                data={faqData}
                keyExtractor={(_, index) => String(index)}
                style={styles.faqListWrap}
                scrollEnabled={false}
                renderItem={({ item, index }) => (
                  <View style={[styles.faqItemInner, { borderBottomColor: themeColors.border }, index === faqData.length - 1 && styles.faqItemInnerLast]}>
                    <TouchableOpacity style={styles.faqQuestionRow} onPress={() => setFaqActiveIndex(faqActiveIndex === index ? null : index)} activeOpacity={0.7}>
                      <AppText type={THIRTEEN} weight={SEMI_BOLD} style={[styles.faqQuestion, { color: themeColors.secondaryText }]}>{item.q}</AppText>
                      <FastImage source={faqActiveIndex === index ? upIcon : downIcon} resizeMode="contain" style={styles.faqArrow} tintColor={themeColors.secondaryText} />
                    </TouchableOpacity>
                    {faqActiveIndex === index && (
                      <View style={[styles.faqAnswer, { borderTopColor: themeColors.border }]}>
                        <AppText type={TWELVE} style={{ color: themeColors.secondaryText, lineHeight: 18 }}>{item.a}</AppText>
                      </View>
                    )}
                  </View>
                )}
              />
            </View>
          </View>
        </ScrollView>
      </KeyBoardAware>
    </AppSafeAreaView>
  );
};

export default KycStatus;

const styles = StyleSheet.create({
  mainScroll: { flex: 1 },
  mainScrollContent: { paddingBottom: 40, flexGrow: 1 },
  sectionWrapper: { paddingHorizontal: 16, flex: 1 },
  kycCard: { borderRadius: 16, padding: 18, marginBottom: 20 },
  kycCardTitle: { marginBottom: 10 },
  kycCardDesc: { lineHeight: 18, marginBottom: 14 },
  kycRequirementsSubtitle: { marginBottom: 12 },
  kycRequirementsRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  kycRequirementsRowColumn: { flexDirection: "column" },
  kycRequirementsList: { flex: 1, marginBottom: 16 },
  kycThemeIcon: { width: 100, height: 76, marginLeft: 12 },
  kycThemeIconSmall: { width: 120, height: 90, alignSelf: "center", marginTop: 12 },
  kycSectionCard: { borderRadius: 16, padding: 14, marginBottom: 14 },
  kycSectionCardTitle: { marginBottom: 8 },
  benefitsTableWrap: {},
  benefitsTableHeader: { flexDirection: "row", marginBottom: 10, paddingBottom: 8, borderBottomWidth: 1 },
  benefitsTableHeaderCell: { flex: 1, textAlign: "left" },
  benefitsColLevel: { flex: 1.4 },
  benefitsTableRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 0.5 },
  benefitsTableLevelCell: { flex: 1.4, flexDirection: "row", alignItems: "center" },
  benefitsTableDataCell: { flex: 1, alignItems: "flex-start", justifyContent: "center" },
  benefitsIconSmall: { width: 14, height: 14 },
  icon: { height: 170, width: 200, alignSelf: "center", marginTop: 50 },
  title: { textAlign: "center", marginHorizontal: universalPaddingHorizontalHigh, marginTop: 20 },
  button: { marginTop: 60, width: "80%", alignSelf: "center" },
  reasonContainer: { borderWidth: 1, padding: universalPaddingHorizontal, borderRadius: 10, marginTop: 10, width: "80%", alignSelf: "center" },
  requirementsTitle: { marginBottom: 16, marginTop: 10 },
  requirementItem: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  kycPendingDesc: { lineHeight: 20, marginTop: 4 },
  kycPendingDocsHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10, marginBottom: 8 },
  kycPendingDocsTitle: { flex: 1, marginBottom: 0 },
  kycPendingDocList: { flexDirection: "row", alignItems: "center", marginBottom: 0 },
  kycPendingDocListContent: { flex: 1 },
  kycPendingDocRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  kycPendingDocIconText: { marginRight: 10 },
  kycPendingIllustrationSide: { width: 72, height: 72, marginLeft: 12 },
  kycPendingResubmitButton: { marginTop: 16, width: "100%" },
  starIcon: { width: 14, height: 14, marginRight: 8 },
  requirementText: { flex: 1 },
  verifyButton: { width: "100%", marginTop: 4 },
  benefitsStar: { width: 10, height: 10, marginRight: 6 },
  faqListWrap: {},
  faqItemInner: { paddingVertical: 12, borderBottomWidth: 0.5 },
  faqItemInnerLast: { borderBottomWidth: 0 },
  faqQuestionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  faqQuestion: { flex: 1 },
  faqArrow: { width: 10, height: 10, marginLeft: 8 },
  faqAnswer: { marginTop: 10, paddingTop: 10, borderTopWidth: 1 },
  kycCompletedCongrats: { marginHorizontal: 0, marginTop: 0, lineHeight: 20 },
  kycCompletedBenefitsTitle: { marginTop: 16, marginBottom: 12 },
  kycCompletedBenefitsRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  kycCompletedBenefitsList: { flex: 1 },
  kycCompletedBenefitRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  kycCompletedCheck: { width: 18, height: 18, marginRight: 10 },
  kycCompletedBenefitText: { flex: 1 },
  kycSuccessVector: { width: 100, height: 90 },
});
