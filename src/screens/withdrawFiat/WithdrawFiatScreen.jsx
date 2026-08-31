import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import FastImage from "react-native-fast-image";
import Toast from "react-native-simple-toast";
import Svg, { Path, Rect } from "react-native-svg";
import { useTheme } from "../../hooks/useTheme";
import { useAppSelector } from "../../store/hooks";
import { appOperation } from "../../appOperation";
import NavigationService from "../../navigation/NavigationService";
import {
  WITHDRAW_FIAT_HISTORY_SCREEN,
  DEPOSIT_FIAT_SCREEN,
} from "../../navigation/routes";
import {
  back_ic,
  closeIcon,
  checkIc,
  historyIcon,
} from "../../helper/ImageAssets";
import AnimatedBottomSheet from "../../common/AnimatedBottomSheet/AnimatedBottomSheet";
import {
  AppSafeAreaView,
  AppText,
  BOLD,
  SEMI_BOLD,
  MEDIUM,
  TWENTY_FOUR,
  EIGHTEEN,
  SIXTEEN,
  FIFTEEN,
  FOURTEEN,
  THIRTEEN,
  TWELVE,
  ELEVEN,
  TEN,
} from "../../shared";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Web SVG Vector Icons
const SecurityShieldIcon = ({ size = 20, color = "#D1AA67" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 12L11 14L15 10M20.618 5.984C17.4561 6.15192 14.3567 5.05861 12 2.944C9.64327 5.05861 6.5439 6.15192 3.382 5.984C3.12754 6.96911 2.99918 7.98255 3 9C3 14.591 6.824 19.29 12 20.622C17.176 19.29 21 14.592 21 9C21 7.958 20.867 6.948 20.618 5.984Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const InstantBoltIcon = ({ size = 20, color = "#D1AA67" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M13 10V3L4 14H11V21L20 10H13V10" fill={color} />
  </Svg>
);

const GlobalGlobeIcon = ({ size = 20, color = "#D1AA67" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 12C21 16.9672 16.9672 21 12 21M21 12C21 7.03276 16.9672 3 12 3M21 12H3M12 21C7.03276 21 3 16.9672 3 12M12 21C13.657 21 15 16.97 15 12C15 7.03 13.657 3 12 3M12 21C10.343 21 9 16.97 9 12C9 7.03 10.343 3 12 3M3 12C3 7.03276 7.03276 3 12 3"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const BankPillarsIcon = ({ size = 24, color = "#D1AA67" }) => (
  <Svg width={size} height={size} viewBox="0 0 29 29" fill="none">
    <Path
      d="M8.55078 14.5527V17.5527M12.5508 14.5527V17.5527M16.5508 14.5527V17.5527M3.55078 21.5527H21.5508M3.55078 10.5527H21.5508M3.55078 7.55273L12.5508 3.55273L21.5508 7.55273M4.55078 10.5527H20.5508V21.5527H4.55078V10.5527Z"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const RatesGraphIcon = ({ size = 20, color = "#D1AA67" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 3V21H21M7 16L12 11L16 15L21 9"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const UaeFlagIcon = ({ width = 24, height = 16 }) => (
  <Svg width={width} height={height} viewBox="0 0 24 16" fill="none" style={{ borderRadius: 2, overflow: "hidden" }}>
    <Rect width="24" height="5.33" fill="#00732F" />
    <Rect y="5.33" width="24" height="5.33" fill="#FFFFFF" />
    <Rect y="10.66" width="24" height="5.34" fill="#000000" />
    <Rect width="6" height="16" fill="#FF0000" />
  </Svg>
);

const HOW_STEPS = [
  {
    n: "1",
    title: "Add bank account",
    body: "Save the UAE IBAN where you want to receive AED. Only the masked account is shown after save.",
    IconComponent: BankPillarsIcon,
  },
  {
    n: "2",
    title: "Verify email",
    body: "Confirm the IBAN with the email OTP. Zand whitelist is created after a successful verify.",
    IconComponent: SecurityShieldIcon,
  },
  {
    n: "3",
    title: "Enter amount",
    body: "Withdraw from spot AED. Daily and per-transaction limits are shown before you confirm.",
    IconComponent: RatesGraphIcon,
  },
  {
    n: "4",
    title: "AED sent to bank",
    body: "Payouts go through Zand Bank domestic rails to your verified IBAN.",
    IconComponent: InstantBoltIcon,
  },
];

const EMPTY_LIMITS = {
  dailyRemaining: null,
  dailyLimit: null,
  dailyUsed: null,
  monthlyRemaining: null,
  monthlyLimit: null,
  monthlyUsed: null,
  minPerTx: null,
  maxPerTx: null,
};

function sanitizeAedAmount(raw) {
  const cleaned = String(raw || "").replace(/[^\d.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot === -1) return cleaned;
  const intPart = cleaned.slice(0, firstDot) || "0";
  const frac = cleaned.slice(firstDot + 1).replace(/\./g, "").slice(0, 2);
  return frac.length ? `${intPart}.${frac}` : `${intPart}.`;
}

function formatAedAmount(val) {
  const n = Number(val);
  if (!Number.isFinite(n)) return String(val || "0.00");
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseLimitSide(bucket, root, prefix) {
  const src = bucket && typeof bucket === "object" ? bucket : {};
  const daily = src.daily || {};
  const monthly = src.monthly || {};
  return {
    dailyLimit: daily.limit ?? root.withdraw_daily_limit ?? null,
    dailyRemaining: daily.remaining ?? root.withdraw_daily_remaining ?? null,
    dailyUsed: daily.used ?? root.withdraw_daily_used ?? null,
    monthlyLimit: monthly.limit ?? root.withdraw_monthly_limit ?? null,
    monthlyRemaining: monthly.remaining ?? root.withdraw_monthly_remaining ?? null,
    monthlyUsed: monthly.used ?? root.withdraw_monthly_used ?? null,
    minPerTx: src.min_per_tx ?? src.min_amount ?? src.min ?? 10,
    maxPerTx: src.max_per_tx ?? src.max_amount ?? src.max ?? null,
  };
}

function beneficiaryIbanLabel(ben) {
  if (!ben) return "••••";
  if (ben.iban_masked) return ben.iban_masked;
  if (ben.iban_last4) return `•••• ${ben.iban_last4}`;
  return "••••";
}

const WithdrawFiatScreen = () => {
  const { colors: themeColors, isDark } = useTheme();
  const userData = useAppSelector((state) => state.auth?.userData || state.user?.userData || {});

  // Main page states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [spotBalance, setSpotBalance] = useState("0");
  const [withdrawLimits, setWithdrawLimits] = useState(EMPTY_LIMITS);
  const [vaAccount, setVaAccount] = useState(null);

  // Form & Preview states
  const [amount, setAmount] = useState("");
  const [preview, setPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [pageError, setPageError] = useState("");

  // Add Beneficiary State
  const [newIban, setNewIban] = useState("");
  const [newAccountName, setNewAccountName] = useState("");
  const [newBankName, setNewBankName] = useState("");
  const [addingBank, setAddingBank] = useState(false);
  const [addBankError, setAddBankError] = useState("");

  // Verify OTP State for new Beneficiary
  const [pendingBenId, setPendingBenId] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Remove Beneficiary State
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removingBank, setRemovingBank] = useState(false);

  // Security Verification Modal State (Withdrawal Submit)
  const [securitySettings, setSecuritySettings] = useState({
    email: true,
    mobile: false,
    google_authenticator: false,
    fund_password: false,
  });
  const [emailVerifyCode, setEmailVerifyCode] = useState("");
  const [mobileVerifyCode, setMobileVerifyCode] = useState("");
  const [authAppCode, setAuthAppCode] = useState("");
  const [fundPassword, setFundPassword] = useState("");
  const [fundVisible, setFundVisible] = useState(false);
  const [otpSending, setOtpSending] = useState({ email: false, mobile: false });
  const [otpResend, setOtpResend] = useState({ email: 0, mobile: 0 });
  const [submittingWithdrawal, setSubmittingWithdrawal] = useState(false);
  const [verifyFieldErrors, setVerifyFieldErrors] = useState({});

  // Bottom Sheet Refs
  const addBankSheetRef = useRef(null);
  const verifyEmailOtpSheetRef = useRef(null);
  const securityVerifySheetRef = useRef(null);
  const removeBankSheetRef = useRef(null);

  // Load Beneficiaries & Limits & Spot AED Balance
  const loadPageData = useCallback(async () => {
    setLoading(true);
    setPageError("");
    try {
      const [bRes, lRes, wRes, vaRes] = await Promise.all([
        appOperation.customer.fiat_whitelist_list().catch(() => null),
        appOperation.customer.fiat_limits().catch(() => null),
        appOperation.customer.user_wallet("spot").catch(() => null),
        appOperation.customer.fiat_virtual_account_me().catch(() => null),
      ]);

      // Beneficiaries
      if (bRes?.success && bRes?.data) {
        const list = Array.isArray(bRes.data) ? bRes.data : bRes.data.items || [];
        const activeList = list.filter((b) => b && b.status !== "DISABLED");
        setBeneficiaries(activeList);
        const verified = activeList.find((b) => b.status === "VERIFIED");
        if (verified) setSelectedId(verified.id || verified._id);
        else if (activeList.length > 0) setSelectedId(activeList[0].id || activeList[0]._id);
      }

      // Limits
      if (lRes?.success && lRes?.data) {
        const root = lRes.data;
        const parsed = parseLimitSide(root.withdraw || root.withdrawal || {}, root, "withdraw");
        setWithdrawLimits(parsed);
      }

      // Spot AED Balance
      if (wRes?.success && Array.isArray(wRes?.data)) {
        const aedRow = wRes.data.find(
          (r) =>
            String(r?.short_name || "").toUpperCase() === "AED" ||
            String(r?.currency || "").toUpperCase() === "AED"
        );
        if (aedRow) {
          setSpotBalance(String(aedRow.balance ?? "0"));
        } else {
          setSpotBalance("0");
        }
      }

      // Virtual Account / Name info
      if (vaRes?.success && vaRes?.data) {
        setVaAccount(vaRes.data);
        if (vaRes.data.account_name && !newAccountName) {
          setNewAccountName(vaRes.data.account_name);
        }
      }
    } catch {
      setPageError("Could not load withdrawal details.");
    } finally {
      setLoading(false);
    }
  }, [newAccountName]);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPageData();
    setRefreshing(false);
  };

  // Currently selected beneficiary object
  const selectedBeneficiary = useMemo(() => {
    return beneficiaries.find((b) => (b.id || b._id) === selectedId) || null;
  }, [beneficiaries, selectedId]);

  // Real-time Preview Quote
  useEffect(() => {
    const amtNum = parseFloat(amount);
    if (!amount || isNaN(amtNum) || amtNum <= 0 || !selectedId) {
      setPreview(null);
      setPreviewError("");
      return;
    }

    let active = true;
    const fetchPreview = async () => {
      setPreviewing(true);
      setPreviewError("");
      try {
        const query = `amount=${encodeURIComponent(amount)}&whitelist_id=${encodeURIComponent(selectedId)}`;
        const res = await appOperation.customer.fiat_withdrawals_preview(query).catch((e) => e);
        if (!active) return;
        if (res?.success && res?.data) {
          setPreview(res.data);
        } else {
          setPreview(null);
          setPreviewError(res?.message || res?.error?.message || "Could not calculate fee quote");
        }
      } catch {
        if (active) {
          setPreview(null);
          setPreviewError("Could not calculate fee quote");
        }
      } finally {
        if (active) setPreviewing(false);
      }
    };

    const timer = setTimeout(fetchPreview, 350);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [amount, selectedId]);

  // Resend OTP Countdown Effect
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Handle Max Amount Tap
  const handleMaxAmount = () => {
    const balNum = parseFloat(spotBalance) || 0;
    if (balNum <= 0) {
      Toast.showWithGravity("Insufficient AED balance", Toast.SHORT, Toast.BOTTOM);
      return;
    }
    const maxVal = withdrawLimits.dailyRemaining
      ? Math.min(balNum, withdrawLimits.dailyRemaining)
      : balNum;
    setAmount(maxVal.toFixed(2));
  };

  // Open Add Bank Sheet
  const handleOpenAddBank = () => {
    setNewIban("");
    const kycName =
      vaAccount?.account_name ||
      `${userData?.firstName || userData?.first_name || ""} ${userData?.lastName || userData?.last_name || ""}`.trim();
    setNewAccountName(kycName);
    setNewBankName("");
    setAddBankError("");
    addBankSheetRef.current?.open?.();
  };

  // Submit Add Bank
  const handleSubmitAddBank = async () => {
    const cleanIban = newIban.replace(/\s+/g, "").toUpperCase();
    if (!cleanIban || cleanIban.length < 15) {
      setAddBankError("Please enter a valid IBAN (e.g. AE...)");
      return;
    }
    if (!newAccountName.trim()) {
      setAddBankError("Account name is required");
      return;
    }

    setAddingBank(true);
    setAddBankError("");
    try {
      const payload = {
        iban: cleanIban,
        account_name: newAccountName.trim(),
        bank_name: newBankName.trim() || "UAE Bank",
        currency: "AED",
      };
      const res = await appOperation.customer.fiat_whitelist_create(payload).catch((e) => e);
      if (res?.success && res?.data) {
        addBankSheetRef.current?.close?.();
        const created = res.data;
        setPendingBenId(created.id || created._id);
        setEmailOtp("");
        setOtpError("");
        setResendCooldown(60);
        Toast.showWithGravity("Verification code sent to your email", Toast.LONG, Toast.BOTTOM);
        verifyEmailOtpSheetRef.current?.open?.();
      } else {
        setAddBankError(res?.message || res?.error?.message || "Could not add bank account");
      }
    } catch {
      setAddBankError("Could not add bank account. Please try again.");
    } finally {
      setAddingBank(false);
    }
  };

  // Verify Email OTP for Beneficiary
  const handleVerifyEmailOtp = async () => {
    if (!emailOtp || emailOtp.length < 6) {
      setOtpError("Please enter the 6-digit email OTP");
      return;
    }

    setVerifyingOtp(true);
    setOtpError("");
    try {
      const res = await appOperation.customer
        .fiat_whitelist_verify(pendingBenId, { otp: emailOtp })
        .catch((e) => e);
      if (res?.success) {
        verifyEmailOtpSheetRef.current?.close?.();
        Toast.showWithGravity("Bank account verified successfully!", Toast.LONG, Toast.BOTTOM);
        await loadPageData();
      } else {
        setOtpError(res?.message || res?.error?.message || "Invalid OTP. Please try again.");
      }
    } catch {
      setOtpError("Verification failed. Please try again.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Resend Beneficiary OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || !pendingBenId) return;
    try {
      const res = await appOperation.customer.fiat_whitelist_resend_otp(pendingBenId).catch((e) => e);
      if (res?.success) {
        setResendCooldown(60);
        Toast.showWithGravity("New verification code sent", Toast.SHORT, Toast.BOTTOM);
      } else {
        Toast.showWithGravity(res?.message || "Could not resend OTP", Toast.SHORT, Toast.BOTTOM);
      }
    } catch {
      Toast.showWithGravity("Could not resend OTP", Toast.SHORT, Toast.BOTTOM);
    }
  };

  // Remove Beneficiary
  const handleConfirmRemoveBank = async () => {
    if (!removeTarget) return;
    setRemovingBank(true);
    try {
      const targetId = removeTarget.id || removeTarget._id;
      const res = await appOperation.customer.fiat_whitelist_delete(targetId).catch((e) => e);
      if (res?.success) {
        removeBankSheetRef.current?.close?.();
        Toast.showWithGravity("Bank account removed", Toast.SHORT, Toast.BOTTOM);
        setRemoveTarget(null);
        await loadPageData();
      } else {
        Toast.showWithGravity(res?.message || "Could not remove account", Toast.SHORT, Toast.BOTTOM);
      }
    } catch {
      Toast.showWithGravity("Could not remove account", Toast.SHORT, Toast.BOTTOM);
    } finally {
      setRemovingBank(false);
    }
  };

  // Open Security Verification Modal before Submit
  const handleProceedWithdrawal = () => {
    const amtNum = parseFloat(amount);
    if (!selectedBeneficiary || selectedBeneficiary.status !== "VERIFIED") {
      Toast.showWithGravity("Please select a verified bank account", Toast.SHORT, Toast.BOTTOM);
      return;
    }
    if (!amtNum || amtNum <= 0) {
      Toast.showWithGravity("Please enter a valid withdrawal amount", Toast.SHORT, Toast.BOTTOM);
      return;
    }
    if (amtNum > parseFloat(spotBalance)) {
      Toast.showWithGravity("Amount exceeds spot AED balance", Toast.SHORT, Toast.BOTTOM);
      return;
    }

    setEmailVerifyCode("");
    setMobileVerifyCode("");
    setAuthAppCode("");
    setFundPassword("");
    setVerifyFieldErrors({});
    securityVerifySheetRef.current?.open?.();
  };

  // Submit Final Withdrawal
  const handleFinalSubmitWithdrawal = async () => {
    setSubmittingWithdrawal(true);
    setVerifyFieldErrors({});
    try {
      const key = `wd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const payload = {
        whitelist_id: selectedBeneficiary?.id || selectedBeneficiary?._id,
        amount: String(amount).trim(),
        currency: "AED",
        email_code: emailVerifyCode.trim(),
        mobile_code: mobileVerifyCode.trim(),
        google_authenticator_code: authAppCode.trim(),
        fund_password: fundPassword.trim(),
      };

      const res = await appOperation.customer
        .fiat_withdrawals_submit(payload, { "Idempotency-Key": key })
        .catch((e) => e);

      if (res?.success) {
        securityVerifySheetRef.current?.close?.();
        Toast.showWithGravity(res.message || "Withdrawal submitted successfully!", Toast.LONG, Toast.BOTTOM);
        setAmount("");
        setPreview(null);
        NavigationService.navigate(WITHDRAW_FIAT_HISTORY_SCREEN);
      } else {
        const msg = res?.message || res?.error?.message || "Withdrawal request failed";
        Toast.showWithGravity(msg, Toast.LONG, Toast.BOTTOM);
      }
    } catch {
      Toast.showWithGravity("Withdrawal request failed. Please try again.", Toast.LONG, Toast.BOTTOM);
    } finally {
      setSubmittingWithdrawal(false);
    }
  };

  // Color tokens
  const bgColor = themeColors.background;
  const cardBg = isDark ? "rgba(255,255,255,0.05)" : "#FFFFFF";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB";
  const textColor = isDark ? "#FFFFFF" : "#111827";
  const subTextColor = isDark ? "rgba(255,255,255,0.55)" : "#6B7280";
  const badgeBg = isDark ? "rgba(255,255,255,0.08)" : "#EDF2F7";

  return (
    <AppSafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <TouchableOpacity
          onPress={() => NavigationService.goBack()}
          style={styles.headerBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <FastImage
            source={back_ic}
            style={styles.backIcon}
            resizeMode={FastImage.resizeMode.contain}
            tintColor={textColor}
          />
        </TouchableOpacity>

        <AppText type={EIGHTEEN} weight={BOLD} color={textColor}>
          Withdraw Fiat
        </AppText>

        <TouchableOpacity
          onPress={() => NavigationService.navigate(WITHDRAW_FIAT_HISTORY_SCREEN)}
          style={styles.headerBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <FastImage
            source={historyIcon}
            style={styles.historyHeaderIcon}
            resizeMode={FastImage.resizeMode.contain}
            tintColor={textColor}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" />}
      >
        {/* Hero Banner Section (Compact Sleek Layout) */}
        <View style={[styles.heroCard, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.gatewayPill}>
            <AppText type={TEN} weight={BOLD} style={styles.gatewayPillText} color="#D4AF37">
              FIAT PAYOUT
            </AppText>
          </View>

          <AppText type={EIGHTEEN} weight={BOLD} style={styles.heroHeading} color={textColor}>
            Withdraw Fiat.{" "}
            <AppText type={EIGHTEEN} weight={BOLD} color="#D4AF37">Direct to UAE Bank.</AppText>
          </AppText>

          <AppText type={TWELVE} style={styles.heroSub} color={subTextColor}>
            Withdraw AED from your spot wallet directly to your verified UAE bank account.
          </AppText>

          {/* 3 Value Props */}
          <View style={styles.featureList}>
            <View style={styles.featureRow}>
              <View style={styles.featureIconBadge}>
                <SecurityShieldIcon size={15} color="#D1AA67" />
              </View>
              <View style={styles.featureTextWrap}>
                <AppText type={THIRTEEN} weight={BOLD} style={styles.featureTitle} color={textColor}>
                  Bank-Level Security
                </AppText>
                <AppText type={ELEVEN} style={styles.featureDesc} color={subTextColor}>
                  2FA protection and whitelist verification on every withdrawal.
                </AppText>
              </View>
            </View>

            <View style={styles.featureRow}>
              <View style={styles.featureIconBadge}>
                <InstantBoltIcon size={15} color="#D1AA67" />
              </View>
              <View style={styles.featureTextWrap}>
                <AppText type={THIRTEEN} weight={BOLD} style={styles.featureTitle} color={textColor}>
                  Domestic UAE Rails
                </AppText>
                <AppText type={ELEVEN} style={styles.featureDesc} color={subTextColor}>
                  Processed through Zand Bank domestic clearing network.
                </AppText>
              </View>
            </View>

            <View style={styles.featureRow}>
              <View style={styles.featureIconBadge}>
                <RatesGraphIcon size={15} color="#D1AA67" />
              </View>
              <View style={styles.featureTextWrap}>
                <AppText type={THIRTEEN} weight={BOLD} style={styles.featureTitle} color={textColor}>
                  Transparent Limits
                </AppText>
                <AppText type={ELEVEN} style={styles.featureDesc} color={subTextColor}>
                  Real-time fee quotes with daily and monthly limit tracking.
                </AppText>
              </View>
            </View>
          </View>
        </View>

        {/* Withdrawal Form Card */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.cardHeaderRow}>
            <AppText type={EIGHTEEN} weight={BOLD} color={textColor}>
              Withdrawal Details
            </AppText>
            <TouchableOpacity
              onPress={() => NavigationService.navigate(DEPOSIT_FIAT_SCREEN)}
              style={styles.depositLink}
              activeOpacity={0.7}
            >
              <AppText type={TWELVE} weight={SEMI_BOLD} color="#D4AF37">
                Fiat Deposit ›
              </AppText>
            </TouchableOpacity>
          </View>

          {/* Spot Balance & Limits Strip */}
          <View style={[styles.balanceStrip, { backgroundColor: badgeBg, borderColor }]}>
            <View style={styles.balanceInfo}>
              <AppText type={TWELVE} color={subTextColor}>Spot AED Available</AppText>
              <AppText type={SIXTEEN} weight={BOLD} color={textColor}>
                {formatAedAmount(spotBalance)} AED
              </AppText>
            </View>
            {withdrawLimits.dailyRemaining != null ? (
              <View style={styles.limitInfo}>
                <AppText type={TWELVE} color={subTextColor}>Daily Left</AppText>
                <AppText type={FOURTEEN} weight={SEMI_BOLD} color="#D4AF37">
                  {formatAedAmount(withdrawLimits.dailyRemaining)} AED
                </AppText>
              </View>
            ) : null}
          </View>

          {/* Destination Bank Account Section */}
          <AppText type={THIRTEEN} weight={SEMI_BOLD} style={styles.fieldLabel} color={subTextColor}>
            Destination Bank Account
          </AppText>

          {beneficiaries.length === 0 ? (
            /* No bank account added */
            <TouchableOpacity
              onPress={handleOpenAddBank}
              activeOpacity={0.75}
              style={[styles.addBankBtn, { borderColor: "#D4AF37", backgroundColor: isDark ? "rgba(212,175,55,0.08)" : "#FFF9E6" }]}
            >
              <BankPillarsIcon size={20} color="#D4AF37" />
              <AppText type={FOURTEEN} weight={BOLD} color="#D4AF37">
                + Add Bank Account (IBAN)
              </AppText>
            </TouchableOpacity>
          ) : selectedBeneficiary ? (
            /* Selected Bank Account Card */
            <View style={[styles.selectedBankCard, { backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#F9FAFB", borderColor }]}>
              <View style={styles.bankCardTop}>
                <View style={styles.bankTitleRow}>
                  <BankPillarsIcon size={20} color="#D1AA67" />
                  <View style={{ flex: 1 }}>
                    <AppText type={FOURTEEN} weight={BOLD} color={textColor}>
                      {selectedBeneficiary.bank_name || "UAE Bank"}
                    </AppText>
                    <AppText type={TWELVE} color={subTextColor}>
                      {beneficiaryIbanLabel(selectedBeneficiary)}
                    </AppText>
                  </View>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: selectedBeneficiary.status === "VERIFIED" ? (isDark ? "rgba(34,197,94,0.18)" : "#DCFCE7") : (isDark ? "rgba(245,158,11,0.18)" : "#FEF3C7"),
                    },
                  ]}
                >
                  <AppText
                    type={ELEVEN}
                    weight={BOLD}
                    color={selectedBeneficiary.status === "VERIFIED" ? (isDark ? "#22C55E" : "#15803D") : (isDark ? "#D1AA67" : "#D97706")}
                  >
                    {selectedBeneficiary.status === "VERIFIED" ? "Verified" : "Pending OTP"}
                  </AppText>
                </View>
              </View>

              <View style={styles.bankCardActions}>
                <TouchableOpacity
                  onPress={handleOpenAddBank}
                  style={styles.bankActionBtn}
                  activeOpacity={0.7}
                >
                  <AppText type={TWELVE} weight={SEMI_BOLD} color="#D4AF37">
                    + Add another
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setRemoveTarget(selectedBeneficiary);
                    removeBankSheetRef.current?.open?.();
                  }}
                  style={styles.bankActionBtn}
                  activeOpacity={0.7}
                >
                  <AppText type={TWELVE} weight={SEMI_BOLD} color="#EF4444">
                    Remove
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {/* Withdrawal Amount Input */}
          <AppText type={THIRTEEN} weight={SEMI_BOLD} style={[styles.fieldLabel, { marginTop: 18 }]} color={subTextColor}>
            Withdrawal Amount
          </AppText>
          <View style={[styles.amountInputWrap, { backgroundColor: badgeBg, borderColor }]}>
            <View style={styles.currencyPrefix}>
              <UaeFlagIcon width={22} height={15} />
              <AppText type={FOURTEEN} weight={BOLD} color={textColor} style={{ marginLeft: 6 }}>
                AED
              </AppText>
            </View>

            <TextInput
              style={[styles.amountInput, { color: textColor }]}
              placeholder="0.00"
              placeholderTextColor={subTextColor}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={(text) => setAmount(sanitizeAedAmount(text))}
            />

            <TouchableOpacity
              onPress={handleMaxAmount}
              style={[styles.maxBtn, { backgroundColor: isDark ? "rgba(212,175,55,0.18)" : "#FFF9E6" }]}
              activeOpacity={0.7}
            >
              <AppText type={ELEVEN} weight={BOLD} color="#D4AF37">
                MAX
              </AppText>
            </TouchableOpacity>
          </View>

          {/* Fee & Payout Quote Preview */}
          {preview ? (
            <View style={[styles.previewBreakdown, { backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#F9FAFB", borderColor }]}>
              <View style={styles.previewRow}>
                <AppText type={THIRTEEN} color={subTextColor}>Withdrawal Amount</AppText>
                <AppText type={FOURTEEN} weight={BOLD} color={textColor}>
                  {formatAedAmount(preview.amount || amount)} AED
                </AppText>
              </View>

              <View style={styles.previewRow}>
                <AppText type={THIRTEEN} color={subTextColor}>Network Fee</AppText>
                <AppText type={FOURTEEN} weight={BOLD} color="#D4AF37">
                  {formatAedAmount(preview.fee_aed || preview.fee || 0)} AED
                </AppText>
              </View>

              <View style={[styles.previewRow, styles.previewTotalRow, { borderTopColor: borderColor }]}>
                <AppText type={FOURTEEN} weight={BOLD} color={textColor}>You will receive</AppText>
                <AppText type={SIXTEEN} weight={BOLD} color="#10B981">
                  {formatAedAmount(preview.net_aed || preview.net || amount)} AED
                </AppText>
              </View>
            </View>
          ) : previewError ? (
            <View style={styles.previewErrorWrap}>
              <AppText type={TWELVE} color="#EF4444">{previewError}</AppText>
            </View>
          ) : null}

          {/* Withdraw Action CTA */}
          <TouchableOpacity
            onPress={handleProceedWithdrawal}
            disabled={!selectedBeneficiary || selectedBeneficiary.status !== "VERIFIED" || !amount || previewing}
            activeOpacity={0.85}
            style={[
              styles.primaryBtn,
              {
                backgroundColor: !selectedBeneficiary || selectedBeneficiary.status !== "VERIFIED" || !amount ? (isDark ? "rgba(212,175,55,0.3)" : "#F3E8B6") : "#D4AF37",
                marginTop: 20,
              },
            ]}
          >
            {previewing ? (
              <ActivityIndicator color="#000000" size="small" />
            ) : (
              <AppText type={FIFTEEN} weight={BOLD} color="#000000">
                Confirm Withdrawal
              </AppText>
            )}
          </TouchableOpacity>
        </View>

        {/* "How to withdraw Fiat?" Steps Carousel */}
        <View style={styles.sectionWrap}>
          <AppText type={EIGHTEEN} weight={BOLD} style={styles.sectionHeading} color={textColor}>
            How to withdraw <AppText type={EIGHTEEN} weight={BOLD} color="#D4AF37">Fiat</AppText>?
          </AppText>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.stepsScroll}
          >
            {HOW_STEPS.map((step) => {
              const StepIcon = step.IconComponent;
              return (
                <View
                  key={step.n}
                  style={[
                    styles.stepCard,
                    {
                      backgroundColor: isDark ? "rgba(255, 255, 255, 0.04)" : "#FFFFFF",
                      borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E5E7EB",
                    },
                  ]}
                >
                  <View style={styles.stepCircleIcon}>
                    <StepIcon size={18} color="#D1AA67" />
                  </View>
                  <AppText type={FIFTEEN} weight={BOLD} style={styles.stepTitle} color={textColor}>
                    {step.n}. {step.title}
                  </AppText>
                  <AppText type={TWELVE} style={styles.stepDesc} color={subTextColor}>
                    {step.body}
                  </AppText>
                </View>
              );
            })}
          </ScrollView>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add Bank Account Bottom Sheet */}
      <AnimatedBottomSheet
        ref={addBankSheetRef}
        sheetHeight={460}
        isDark={isDark}
      >
        <View style={styles.sheetInner}>
          <View style={styles.sheetHeader}>
            <AppText type={EIGHTEEN} weight={BOLD} color={textColor}>
              Add Bank Account
            </AppText>
            <TouchableOpacity
              onPress={() => addBankSheetRef.current?.close?.()}
              style={[styles.closeCircle, { backgroundColor: badgeBg }]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <FastImage source={closeIcon} style={styles.closeIconSmall} resizeMode="contain" tintColor={subTextColor} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {addBankError ? (
              <View style={styles.errorBox}>
                <AppText type={TWELVE} color="#EF4444">{addBankError}</AppText>
              </View>
            ) : null}

            {/* IBAN Input */}
            <AppText type={THIRTEEN} weight={SEMI_BOLD} style={styles.modalFieldLabel} color={subTextColor}>
              UAE IBAN Number
            </AppText>
            <View style={[styles.modalInputWrap, { backgroundColor: badgeBg, borderColor }]}>
              <TextInput
                style={[styles.modalTextInput, { color: textColor }]}
                placeholder="AE..."
                placeholderTextColor={subTextColor}
                autoCapitalize="characters"
                value={newIban}
                onChangeText={(t) => setNewIban(t.toUpperCase())}
              />
            </View>

            {/* Account Name */}
            <AppText type={THIRTEEN} weight={SEMI_BOLD} style={styles.modalFieldLabel} color={subTextColor}>
              Account Holder Name
            </AppText>
            <View style={[styles.modalInputWrap, { backgroundColor: badgeBg, borderColor }]}>
              <TextInput
                style={[styles.modalTextInput, { color: textColor }]}
                placeholder="Beneficiary Name"
                placeholderTextColor={subTextColor}
                value={newAccountName}
                onChangeText={setNewAccountName}
              />
            </View>

            {/* Bank Name */}
            <AppText type={THIRTEEN} weight={SEMI_BOLD} style={styles.modalFieldLabel} color={subTextColor}>
              Bank Name (Optional)
            </AppText>
            <View style={[styles.modalInputWrap, { backgroundColor: badgeBg, borderColor }]}>
              <TextInput
                style={[styles.modalTextInput, { color: textColor }]}
                placeholder="e.g. Emirates NBD, ENBD, ADCB"
                placeholderTextColor={subTextColor}
                value={newBankName}
                onChangeText={setNewBankName}
              />
            </View>

            <TouchableOpacity
              onPress={handleSubmitAddBank}
              disabled={addingBank}
              activeOpacity={0.85}
              style={[styles.primaryBtn, { backgroundColor: "#D4AF37", marginTop: 20 }]}
            >
              {addingBank ? (
                <ActivityIndicator color="#000000" size="small" />
              ) : (
                <AppText type={FIFTEEN} weight={BOLD} color="#000000">
                  Save & Verify Email
                </AppText>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </AnimatedBottomSheet>

      {/* Verify Email OTP Bottom Sheet */}
      <AnimatedBottomSheet
        ref={verifyEmailOtpSheetRef}
        sheetHeight={350}
        isDark={isDark}
      >
        <View style={styles.sheetInner}>
          <View style={styles.sheetHeader}>
            <AppText type={EIGHTEEN} weight={BOLD} color={textColor}>
              Verify Bank Account
            </AppText>
            <TouchableOpacity
              onPress={() => verifyEmailOtpSheetRef.current?.close?.()}
              style={[styles.closeCircle, { backgroundColor: badgeBg }]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <FastImage source={closeIcon} style={styles.closeIconSmall} resizeMode="contain" tintColor={subTextColor} />
            </TouchableOpacity>
          </View>

          <AppText type={THIRTEEN} style={{ marginBottom: 14 }} color={subTextColor}>
            Enter the 6-digit verification code sent to your registered email to whitelist this IBAN.
          </AppText>

          {otpError ? (
            <View style={styles.errorBox}>
              <AppText type={TWELVE} color="#EF4444">{otpError}</AppText>
            </View>
          ) : null}

          <View style={[styles.modalInputWrap, { backgroundColor: badgeBg, borderColor }]}>
            <TextInput
              style={[styles.modalTextInput, { color: textColor, letterSpacing: 4, textAlign: "center" }]}
              placeholder="000000"
              placeholderTextColor={subTextColor}
              keyboardType="number-pad"
              maxLength={6}
              value={emailOtp}
              onChangeText={setEmailOtp}
            />
          </View>

          <View style={styles.resendRow}>
            <TouchableOpacity
              onPress={handleResendOtp}
              disabled={resendCooldown > 0}
              activeOpacity={0.7}
            >
              <AppText type={TWELVE} weight={SEMI_BOLD} color={resendCooldown > 0 ? subTextColor : "#D4AF37"}>
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
              </AppText>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleVerifyEmailOtp}
            disabled={verifyingOtp || emailOtp.length < 6}
            activeOpacity={0.85}
            style={[styles.primaryBtn, { backgroundColor: emailOtp.length === 6 ? "#D4AF37" : (isDark ? "rgba(212,175,55,0.3)" : "#F3E8B6"), marginTop: 14 }]}
          >
            {verifyingOtp ? (
              <ActivityIndicator color="#000000" size="small" />
            ) : (
              <AppText type={FIFTEEN} weight={BOLD} color="#000000">
                Confirm & Whitelist
              </AppText>
            )}
          </TouchableOpacity>
        </View>
      </AnimatedBottomSheet>

      {/* Remove Bank Confirmation Sheet */}
      <AnimatedBottomSheet
        ref={removeBankSheetRef}
        sheetHeight={260}
        isDark={isDark}
      >
        <View style={styles.sheetInner}>
          <AppText type={EIGHTEEN} weight={BOLD} style={{ marginBottom: 8 }} color={textColor}>
            Remove bank account?
          </AppText>
          <AppText type={THIRTEEN} style={{ marginBottom: 20 }} color={subTextColor}>
            Remove {beneficiaryIbanLabel(removeTarget)}? You can add this IBAN again later.
          </AppText>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              onPress={() => removeBankSheetRef.current?.close?.()}
              style={[styles.modalSecondaryBtn, { borderColor }]}
              activeOpacity={0.7}
            >
              <AppText type={FOURTEEN} weight={SEMI_BOLD} color={textColor}>Cancel</AppText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleConfirmRemoveBank}
              disabled={removingBank}
              style={[styles.modalDangerBtn, { backgroundColor: "#EF4444" }]}
              activeOpacity={0.85}
            >
              {removingBank ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <AppText type={FOURTEEN} weight={BOLD} color="#FFFFFF">Remove</AppText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </AnimatedBottomSheet>

      {/* 2FA Security Verification & Submit Sheet */}
      <AnimatedBottomSheet
        ref={securityVerifySheetRef}
        sheetHeight={380}
        isDark={isDark}
      >
        <View style={styles.sheetInner}>
          <View style={styles.sheetHeader}>
            <AppText type={EIGHTEEN} weight={BOLD} color={textColor}>
              Security Verification
            </AppText>
            <TouchableOpacity
              onPress={() => securityVerifySheetRef.current?.close?.()}
              style={[styles.closeCircle, { backgroundColor: badgeBg }]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <FastImage source={closeIcon} style={styles.closeIconSmall} resizeMode="contain" tintColor={subTextColor} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <AppText type={THIRTEEN} style={{ marginBottom: 14 }} color={subTextColor}>
              Confirm your withdrawal of {formatAedAmount(amount)} AED to {beneficiaryIbanLabel(selectedBeneficiary)}.
            </AppText>

            {/* Email OTP Field */}
            <AppText type={THIRTEEN} weight={SEMI_BOLD} style={styles.modalFieldLabel} color={subTextColor}>
              Email Verification Code
            </AppText>
            <View style={[styles.modalInputWrap, { backgroundColor: badgeBg, borderColor }]}>
              <TextInput
                style={[styles.modalTextInput, { color: textColor }]}
                placeholder="Enter 6-digit code"
                placeholderTextColor={subTextColor}
                keyboardType="number-pad"
                maxLength={6}
                value={emailVerifyCode}
                onChangeText={setEmailVerifyCode}
              />
            </View>

            {/* Fund Password Field */}
            <AppText type={THIRTEEN} weight={SEMI_BOLD} style={styles.modalFieldLabel} color={subTextColor}>
              Fund Password (if enabled)
            </AppText>
            <View style={[styles.modalInputWrap, { backgroundColor: badgeBg, borderColor }]}>
              <TextInput
                style={[styles.modalTextInput, { color: textColor }]}
                placeholder="Enter fund password"
                placeholderTextColor={subTextColor}
                secureTextEntry={!fundVisible}
                value={fundPassword}
                onChangeText={setFundPassword}
              />
            </View>

            <TouchableOpacity
              onPress={handleFinalSubmitWithdrawal}
              disabled={submittingWithdrawal}
              activeOpacity={0.85}
              style={[styles.primaryBtn, { backgroundColor: "#D4AF37", marginTop: 20 }]}
            >
              {submittingWithdrawal ? (
                <ActivityIndicator color="#000000" size="small" />
              ) : (
                <AppText type={FIFTEEN} weight={BOLD} color="#000000">
                  Submit Withdrawal
                </AppText>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </AnimatedBottomSheet>
    </AppSafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    padding: 6,
  },
  backIcon: {
    width: 18,
    height: 18,
  },
  historyHeaderIcon: {
    width: 22,
    height: 22,
  },
  scrollContent: {
    padding: 16,
  },
  heroCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  gatewayPill: {
    backgroundColor: "rgba(212,175,55,0.15)",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  gatewayPillText: {
    letterSpacing: 0.5,
  },
  heroHeading: {
    lineHeight: 24,
    marginBottom: 6,
  },
  heroSub: {
    lineHeight: 16,
    marginBottom: 14,
  },
  featureList: {
    gap: 10,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  featureIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "rgba(209, 170, 103, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(209, 170, 103, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    marginBottom: 1,
  },
  featureDesc: {
    lineHeight: 15,
  },
  card: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  depositLink: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  balanceStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  balanceInfo: {
    gap: 2,
  },
  limitInfo: {
    alignItems: "flex-end",
    gap: 2,
  },
  fieldLabel: {
    marginBottom: 8,
  },
  addBankBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    marginBottom: 10,
  },
  selectedBankCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  bankCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bankTitleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statusPill: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  bankCardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 14,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  bankActionBtn: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  amountInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 52,
  },
  currencyPrefix: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 10,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "rgba(255,255,255,0.12)",
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "bold",
    paddingHorizontal: 12,
  },
  maxBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  previewBreakdown: {
    marginTop: 14,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  previewTotalRow: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  previewErrorWrap: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "rgba(239,68,68,0.1)",
  },
  primaryBtn: {
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionWrap: {
    marginTop: 10,
    marginBottom: 16,
  },
  sectionHeading: {
    marginBottom: 12,
  },
  stepsScroll: {
    gap: 12,
    paddingRight: 16,
    paddingVertical: 4,
  },
  stepCard: {
    width: 210,
    minHeight: 185,
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  stepCircleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(209, 170, 103, 0.4)",
    backgroundColor: "rgba(209, 170, 103, 0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  stepTitle: {
    textAlign: "center",
    marginBottom: 8,
  },
  stepDesc: {
    textAlign: "center",
    lineHeight: 18,
  },
  sheetInner: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  closeCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  closeIconSmall: {
    width: 14,
    height: 14,
  },
  errorBox: {
    backgroundColor: "rgba(239,68,68,0.12)",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  modalFieldLabel: {
    marginBottom: 6,
    marginTop: 10,
  },
  modalInputWrap: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 46,
    justifyContent: "center",
  },
  modalTextInput: {
    fontSize: 14,
    fontWeight: "600",
  },
  resendRow: {
    alignItems: "center",
    marginTop: 12,
  },
  modalSecondaryBtn: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalDangerBtn: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default WithdrawFiatScreen;
