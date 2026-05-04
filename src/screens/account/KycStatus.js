import React, { useCallback, useEffect, useState, useRef } from "react";
import { Animated, Dimensions, StyleSheet, TouchableOpacity, View, ScrollView, FlatList, useWindowDimensions, Linking } from "react-native";
import {
  AppSafeAreaView,
  AppText,
  Button,
  RED,
  SEMI_BOLD,
  FOURTEEN,
  FIFTEEN,
  SIXTEEN,
  TWELVE,
  THIRTEEN,
} from "../../shared";
import FastImage from "react-native-fast-image";
import {
  kyc_pending,
  closeIcon,
  checkIc,
  downIcon,
  upIcon,
  kyc_verification_vector,
  lock_ic,
  withdrawIcon,
  depositIcon,
  p2p_Icon,
  verification_kyc,
  withdrawal_icon2,
  deposit_icon2,
  Trade_ic,
  p2pIcon2,
  tradeIcon,
  progress_icon_pending,
  verification_reject,
  giftIc,
} from "../../helper/ImageAssets";
import KeyBoardAware from "../../shared/components/KeyboardAware";
import { borderWidth, universalPaddingHorizontal, universalPaddingHorizontalHigh } from "../../theme/dimens";
import NavigationService from "../../navigation/NavigationService";
import { KYC_STEP_ONE_SCREEN, KYC_RESUBMIT_SCREEN, TRADE_SCREEN, NAVIGATION_BOTTOM_TAB_STACK, NAVIGATION_TRADE_STACK, CONTACT_US_SCREEN } from "../../navigation/routes";
import { useFocusEffect } from "@react-navigation/native";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { setLoading } from "../../slices/authSlice";
import { getUserProfile, getKycStatus, createKycSession } from "../../actions/accountActions";
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

const LockedFeatures = () => {
  const { colors: themeColors } = useTheme();
  return (
    <View style={{ marginTop: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
        <FastImage source={lock_ic} style={{ width: 18, height: 18, marginRight: 10 }} tintColor={themeColors.text} />
        <AppText type={FIFTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text }}>
          Locked Features - Verify to Unlock
        </AppText>
      </View>

      {[
        { title: "Withdrawal", desc: "Locked to prevent fraud until identity is verified.", icon: withdrawal_icon2 },
        { title: "Deposit", desc: "Locked to prevent fraud until identity is verified.", icon: deposit_icon2 },
        { title: "Trading", desc: "Verification ensures safe and legitimate transactions.", icon: tradeIcon },
        { title: "P2P", desc: "Requires verification for secure transactions.", icon: p2pIcon2 }
      ].map((item, index) => (
        <View key={index} style={[styles.kycSectionCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1, flexDirection: "row", alignItems: "center", paddingVertical: 18, paddingHorizontal: 16 }]}>
          <FastImage source={item.icon} style={{ width: 24, height: 24, marginRight: 16 }} tintColor={themeColors.text} />
          <View style={{ flex: 1 }}>
            <AppText type={FOURTEEN} style={{ color: themeColors.text, marginBottom: 4 }}>{item.title}</AppText>
            <AppText type={TWELVE} style={{ color: themeColors.secondaryText }}>{item.desc}</AppText>
          </View>
          <FastImage source={lock_ic} style={{ width: 16, height: 16 }} tintColor={themeColors.secondaryText} />
        </View>
      ))}
    </View>
  );
};

const UnlockedFeatures = () => {
  const { colors: themeColors } = useTheme();
  return (
    <View style={{ marginTop: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
        <AppText type={FIFTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text }}>
          Unlocked Features
        </AppText>
      </View>

      {[
        { title: "Withdrawal", desc: "Locked to prevent fraud until identity is verified.", icon: withdrawIcon },
        { title: "Deposit", desc: "Locked to prevent fraud until identity is verified.", icon: depositIcon },
        { title: "Trading", desc: "Verification ensures safe and legitimate transactions.", icon: tradeIcon },
        { title: "P2P", desc: "Requires verification for secure transactions.", icon: p2p_Icon }
      ].map((item, index) => (
        <View key={index} style={[styles.kycSectionCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1, flexDirection: "row", alignItems: "center", paddingVertical: 18, paddingHorizontal: 16 }]}>
          <FastImage source={item.icon} style={{ width: 24, height: 24, marginRight: 16 }} tintColor={themeColors.text} />
          <View style={{ flex: 1 }}>
            <AppText type={FOURTEEN} style={{ color: themeColors.text, marginBottom: 4 }}>{item.title}</AppText>
            <AppText type={TWELVE} style={{ color: themeColors.secondaryText }}>{item.desc}</AppText>
          </View>
          <FastImage source={checkIc} style={{ width: 16, height: 16 }} tintColor={themeColors.green} />
        </View>
      ))}
    </View>
  );
};

const KycPending = ({ showResubmitButton, onResubmitPress }) => {
  const { colors: themeColors } = useTheme();

  return (
    <View style={{ flex: 1, marginTop: 8 }}>
      <AppText type={THIRTEEN} style={{ color: themeColors.secondaryText, marginBottom: 20 }}>
        Manage your identity verification and unlock platform features
      </AppText>
      <View style={[styles.kycSectionCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1, padding: 16 }]}>
        <AppText type={SIXTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text, marginBottom: 12 }}>
          Standard Identity Verification
        </AppText>

        <View style={{
          backgroundColor: themeColors.themeElevationColor,
          borderRadius: 8,
        }}>
          <FastImage source={progress_icon_pending} style={{ width: 40, height: 40, marginBottom: 12 }} resizeMode="contain" />
          <AppText type={SIXTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text, marginBottom: 8 }}>Verification In Review</AppText>
          <AppText type={FOURTEEN} style={{ color: themeColors.secondaryText, lineHeight: 20 }}>
            Your verification is being processed and is currently under review. This may take a few moments. We’ll notify you once it’s approved or if any additional information is required.
          </AppText>
        </View>
      </View>
      <LockedFeatures />
    </View>
  );
};

const KycRejected = ({ onVerifyPress }) => {
  const { colors: themeColors, isDark } = useTheme();
  const userData = useAppSelector((state) => state.auth.userData);
  const isLoading = useAppSelector((state) => state.auth.isLoading);
  const kyc_reject_reason = userData?.kyc_reject_reason;

  const displayName = userData?.email ? `User-${userData.email.split('@')[0].slice(0, 8)}` : "AGCE User";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <View style={{ flex: 1, marginTop: 8 }}>
      <AppText type={THIRTEEN} style={{ color: themeColors.secondaryText, marginBottom: 16 }}>
        Manage your identity verification and unlock platform features
      </AppText>

      <View style={{ marginBottom: 24, paddingHorizontal: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
          <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#8B5CF6', alignItems: "center", justifyContent: "center", marginRight: 16 }}>
            <AppText type={SIXTEEN} weight={SEMI_BOLD} style={{ color: '#FFFFFF' }}>{initials}</AppText>
          </View>
          <View style={{ flex: 1 }}>
            <AppText type={SIXTEEN} style={{ color: themeColors.text, marginBottom: 4 }}>{displayName}</AppText>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: themeColors.red, marginRight: 6 }} />
              <AppText type={TWELVE} style={{ color: themeColors.red }}>Verification Failed</AppText>
            </View>
          </View>
        </View>

        <View style={{
          backgroundColor: themeColors.themeElevationColor,
          padding: 16,
          borderRadius: 8,
          borderLeftWidth: 4,
          borderLeftColor: themeColors.red,
          flexDirection: "row",
          marginBottom: 24
        }}>
          <FastImage source={verification_reject} style={{ width: 22, height: 22, marginRight: 12, marginTop: 2 }} resizeMode="contain" />
          <View style={{ flex: 1 }}>
            <AppText type={FIFTEEN} style={{ color: themeColors.text, marginBottom: 8 }}>Verification Incomplete</AppText>
            <AppText type={FOURTEEN} style={{ color: themeColors.secondaryText, lineHeight: 22 }}>
              {kyc_reject_reason || "Your identity verification is currently incomplete. To complete the process, please submit the required information and finish facial recognition."}
            </AppText>
          </View>
        </View>

        <View style={{ gap: 12 }}>
          <Button
            children="Try Again"
            onPress={onVerifyPress}
            loading={isLoading}
            containerStyle={{ width: '100%', height: 48, backgroundColor: isDark ? themeColors.text : '#28282D', borderRadius: 24 }}
            titleStyle={{ fontSize: 14, color: isDark ? themeColors.background : '#FFFFFF' }}
          />
          <TouchableOpacity
            style={{ width: '100%', height: 48, borderRadius: 24, borderWidth: 1, borderColor: themeColors.border, alignItems: 'center', justifyContent: 'center' }}
            onPress={() => NavigationService.navigate(CONTACT_US_SCREEN)}
          >
            <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text }}>Need Help?</AppText>
          </TouchableOpacity>
        </View>
      </View>
      <LockedFeatures />
    </View>
  );
};

const KycDue = ({ onVerifyPress }) => {
  const { colors: themeColors } = useTheme();
  const isLoading = useAppSelector((state) => state.auth.isLoading);

  return (
    <View style={{ flex: 1, marginTop: 8 }}>
      <AppText type={THIRTEEN} style={{ color: themeColors.secondaryText, marginBottom: 20 }}>
        Manage your identity verification and unlock platform features
      </AppText>

      <View style={[styles.kycSectionCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1, padding: 20 }]}>

        <FastImage
          source={verification_kyc}
          resizeMode="contain"
          style={{ width: 150, height: 140, alignSelf: "center" }}
        />
        <AppText type={SIXTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text, marginTop: 10 }}>
          Standard Identity Verification
        </AppText>
        <AppText type={THIRTEEN} style={{ color: themeColors.secondaryText, marginTop: 5, }}>
          It takes only 2-5 minutes to verify your account.
        </AppText>

        <Button
          children="Verify Now"
          onPress={onVerifyPress}
          loading={isLoading}
          containerStyle={{ width: '100%', padding: 10, alignSelf: "center", backgroundColor: themeColors.button, borderRadius: 24, marginTop: 10 }}
          titleStyle={{ fontSize: 13, color: themeColors.buttonText }}
        />
      </View>

      <LockedFeatures />
    </View>
  );
};

const KycCompleted = () => {
  const { colors: themeColors } = useTheme();
  const userData = useAppSelector((state) => state.auth.userData);
  const displayName = userData?.email ? `User-${userData.email.split('@')[0].slice(0, 8)}` : "AGCE User";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <View style={{ flex: 1, marginTop: 8 }}>
      <AppText type={THIRTEEN} style={{ color: themeColors.secondaryText, marginBottom: 20 }}>
        Manage your identity verification and unlock platform features
      </AppText>

      <View style={[styles.kycSectionCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1, padding: 20 }]}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: themeColors.button, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
            <AppText type={SIXTEEN} weight={SEMI_BOLD} style={{ color: themeColors.buttonText }}>{initials}</AppText>
          </View>
          <View style={{ flex: 1 }}>
            <AppText type={SIXTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text }}>{displayName}</AppText>
            <AppText type={TWELVE} style={{ color: themeColors.green, marginTop: 2 }}>Verified</AppText>
          </View>
          <FastImage source={giftIc} style={{ width: 40, height: 40 }} resizeMode="contain" />
        </View>

        <View style={{ backgroundColor: themeColors.themeElevationColor, padding: 16, borderRadius: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <FastImage source={checkIc} tintColor={themeColors.green} style={{ width: 20, height: 20, marginRight: 8 }} resizeMode="contain" />
            <AppText type={FIFTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text }}>Verification Successful</AppText>
          </View>
          <AppText type={THIRTEEN} style={{ color: themeColors.secondaryText, lineHeight: 20 }}>
            Congratulations! Your identity has been successfully verified. You now have full access to all platform features and services.
          </AppText>
        </View>
      </View>

      <UnlockedFeatures />

      <View style={{ alignItems: "center", marginTop: 24, marginBottom: 10 }}>
        <AppText type={SIXTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text, marginBottom: 6 }}>Ready to Start Trading?</AppText>
        <AppText type={THIRTEEN} style={{ color: themeColors.secondaryText, marginBottom: 20 }}>Access all markets and start trading with the best rates</AppText>
        <Button
          children="Start Trading Now"
          onPress={() => NavigationService.navigate(NAVIGATION_BOTTOM_TAB_STACK, { screen: TRADE_SCREEN })}
          containerStyle={{ width: "100%", height: 42, backgroundColor: themeColors.button, borderRadius: 24, marginBottom: 16 }}
          titleStyle={{ fontSize: 13, color: themeColors.buttonText }}
        />
        <AppText type={TWELVE} style={{ color: themeColors.secondaryText }}>🛡️ Bank-level encryption • Fully secured</AppText>
      </View>
    </View>
  );
};

const faqData = [
  { q: "How to complete individual KYC?", a: "Upload a valid government-issued ID, complete the liveness check when prompted, and submit your details in the Verification Center. This usually takes 2–5 minutes." },
  { q: "How to complete business KYC?", a: "Provide business registration documents, beneficial owner information, and any extra forms requested. Our team may review submissions as part of compliance checks." },
  { q: "Why is KYC verification required?", a: "To protect your assets and promote a secure, compliant crypto environment, AGCE requires all users to complete KYC (Know Your Customer) verification. This helps prevent fraud, money laundering, and other illicit activities. Once your KYC is verified, you'll gain access to key platform features including crypto deposits and withdrawals, P2P trading, and participation in events like Launchpool." },
  { q: "Why is an advanced verification necessary?", a: "Advanced verification unlocks higher limits. Rewards Hub with exclusive beginner rewards, and gain access to more platform features, including deposits, buy crypto, trade, and more." },
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

  // Initial Fetch & Polling
  useEffect(() => {
    let mounted = true;

    const fetchStatus = async () => {
      const data = await dispatch(getKycStatus());
      if (!mounted) return;

      setContentLoading(false);
      dispatch(setLoading(false));

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
    };

    fetchStatus(); // initial fetch

    // Poll every 3 seconds if not Approved (2) or Rejected (3)
    let intervalId = null;
    if (kycVerified !== 2 && kycVerified !== 3) {
      intervalId = setInterval(() => {
        dispatch(getUserProfile(false, false, true)); // Skip global loading
        fetchStatus();
      }, 3000);
    }

    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [dispatch, kycVerified]);

  const getRejectReason = (docType) => {
    const doc = documentsToResubmit.find((d) => d.type === docType);
    return doc?.reason || "";
  };

  const openVerifyModal = async () => {
    const sessionResponse = await dispatch(createKycSession(userData));
    if (sessionResponse?.diditUrl) {
      Linking.openURL(sessionResponse.diditUrl).catch(() => {
        NavigationService.navigate(KYC_STEP_ONE_SCREEN, { resetForm: true });
      });
    } else {
      NavigationService.navigate(KYC_STEP_ONE_SCREEN, { resetForm: true });
    }
  };

  const openResubmitModal = async () => {
    const sessionResponse = await dispatch(createKycSession(userData));
    if (sessionResponse?.diditUrl) {
      Linking.openURL(sessionResponse.diditUrl).catch(() => {
        NavigationService.navigate(KYC_RESUBMIT_SCREEN, {
          documentsToResubmit: documentsToResubmit || [],
          existingCountryCode: existingCountryCode || "",
          submittedIdDocType: submittedIdDocType || null,
          submittedTaxDocType: submittedTaxDocType || null,
          resubmitIdNumber: existingIdDocNumber || "",
          resubmitTaxNumber: existingTaxDocNumber || "",
        });
      });
    } else {
      NavigationService.navigate(KYC_RESUBMIT_SCREEN, {
        documentsToResubmit: documentsToResubmit || [],
        existingCountryCode: existingCountryCode || "",
        submittedIdDocType: submittedIdDocType || null,
        submittedTaxDocType: submittedTaxDocType || null,
        resubmitIdNumber: existingIdDocNumber || "",
        resubmitTaxNumber: existingTaxDocNumber || "",
      });
    }
  };



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
          <KycStepHeader title={"Verification Center"} theme={isDark ? "Dark" : "Light"} />
          <View style={styles.sectionWrapper}>
            {contentLoading ? <KycStatusSkeleton /> : kycStatusView()}
            <View style={[styles.kycSectionCard, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1, marginTop: 10 }]}>
              <AppText type={FIFTEEN} weight={SEMI_BOLD} style={[styles.kycSectionCardTitle, { color: themeColors.text }]}>Frequently Asked Questions</AppText>
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
