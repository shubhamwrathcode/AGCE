import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import FastImage from "react-native-fast-image";
import Clipboard from "@react-native-clipboard/clipboard";
import Toast from "react-native-simple-toast";
import Svg, { Path, Rect } from "react-native-svg";
import { useTheme } from "../../hooks/useTheme";
import { useAppSelector } from "../../store/hooks";
import { colors } from "../../theme/colors";
import { appOperation } from "../../appOperation";
import NavigationService from "../../navigation/NavigationService";
import {
  KYC_STATUS_SCREEN,
  SELECT_COIN_SCREEN,
  DEPOSIT_COIN_SCREEN,
  DEPOSIT_FIAT_HISTORY_SCREEN,
  WITHDRAW_FIAT_SCREEN,
} from "../../navigation/routes";
import {
  back_ic,
  checkIc,
  historyIcon,
  INFO,
  upIcon,
  downIcon,
  closeIcon,
} from "../../helper/ImageAssets";
import RBSheet from "react-native-raw-bottom-sheet";
import AnimatedBottomSheet from "../../common/AnimatedBottomSheet/AnimatedBottomSheet";
import {
  AppSafeAreaView,
  AppText,
  BOLD,
  SEMI_BOLD,
  MEDIUM,
  TWENTY,
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

function buildFiatFaq(minLabel) {
  return [
    {
      title: "How do I deposit Fiat (AED) on AGCX?",
      content: `Create your AGCX IBAN and add a withdrawal account in your own name. Then transfer at least ${minLabel} AED from your UAE bank to that IBAN. The fee is taken from the transfer. Amounts below ${minLabel} AED are held for refund and are not credited.`,
    },
    {
      title: "Deposit fiat — step by step",
      content: `• Complete KYC — Make sure your account is identity-verified.\n• Create your AGCX IBAN — One virtual account linked to your verified identity.\n• Add a withdrawal account — It must be registered in your name before you deposit.\n• Copy details — Copy the AGCX IBAN and account name.\n• Transfer from bank — Send at least ${minLabel} AED from your UAE bank.\n• Spot credit — Wait for AED to credit in your spot wallet after the bank processes the transfer.`,
    },
    {
      title: "Important deposit rules & guidelines",
      content: `• Same-name transfer — You must transfer from a bank account in your own name matching your AGCX KYC.\n• Withdrawal account first — Add your withdrawal account before you deposit.\n• Third-party deposits — Transfers from third-party or unauthorized accounts may be rejected and refunded.\n• Fee — Taken from the bank transfer automatically. Do not add it in the app.\n• Below minimum — Amounts under ${minLabel} AED are held for refund, not credited.\n• Currency — Only AED is accepted on this IBAN.`,
    },
    {
      title: "My fiat deposit hasn't arrived — what should I do?",
      content: `• Verify IBAN — Check that you transferred to your exact AGCX IBAN.\n• Bank confirmation — Ensure the transaction was marked successful in your banking app.\n• Amount — Confirm you sent at least ${minLabel} AED. Smaller transfers are held for refund.\n• Processing time — UAE transfers can take from a few minutes to a few hours on banking business days.`,
    },
  ];
}

// Web SVG Icon Components with exact web paths & styling
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

const TransferBuildingIcon = ({ size = 20, color = "#D1AA67" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 21V5C19 3.89617 18.1038 3 17 3H7C5.89617 3 5 3.89617 5 5V21M19 21H21M19 21H14M5 21H3M5 21H10M9 7H10M9 11H10M14 7H15M14 11H15M10 21V16C10 15.4481 10.4481 15 11 15H13C13.5519 15 14 15.4481 14 16V21M10 21H14"
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

const CopyIcon = ({ size = 15, color = "#D1AA67" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M9 3h11v13h-3V6H9V3zM4 8v13h11V8.02L4 8z"
      fill={color}
    />
  </Svg>
);

const CopiedCheckIcon = ({ size = 15, color = "#10B981" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 6L9 17L4 12"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const EyeIcon = ({ size = 15, color = "#D1AA67" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
      stroke={color}
      strokeWidth="2"
    />
  </Svg>
);

const EyeOffIcon = ({ size = 15, color = "#D1AA67" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 3l18 18M10.6 10.6A3 3 0 0 0 12 15a3 3 0 0 0 2.4-1.2M9.9 5.1A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a18.2 18.2 0 0 1-4.1 4.8M6.1 6.1C3.8 7.8 2 12 2 12s3.5 7 10 7a10.6 10.6 0 0 0 4.1-.8"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const HOW_STEPS = [
  {
    n: "1",
    title: "Complete KYC",
    body: "Verify your identity so we can open a virtual IBAN in your name.",
    IconComponent: SecurityShieldIcon,
  },
  {
    n: "2",
    title: "Create your AGCX IBAN",
    body: "One tap creates your virtual account. Copy the IBAN and account name from this page.",
    IconComponent: BankPillarsIcon,
  },
  {
    n: "3",
    title: "Whitelist your account",
    body: "Add a withdrawal account in your own name before you deposit.",
    IconComponent: TransferBuildingIcon,
  },
  {
    n: "4",
    title: "Transfer AED",
    body: "Send at least the minimum from your UAE bank. The fee is taken from the transfer.",
    IconComponent: InstantBoltIcon,
  },
];

function formatCreatedDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function vaStatusChip(status) {
  const raw = String(status || "ACTIVE").toUpperCase();
  if (raw === "ACTIVE") return { text: "Active", pending: false };
  const text = raw.charAt(0) + raw.slice(1).toLowerCase();
  return { text: text || "Pending", pending: true };
}

function vaPayInIban(account) {
  const full = String(account?.iban || "").replace(/\s+/g, "").trim();
  if (full) return { text: full, copy: full, complete: true };
  const last4 = String(account?.iban_last4 || "").trim();
  if (last4) return { text: `•••• ${last4}`, copy: "", complete: false };
  return { text: "—", copy: "", complete: false };
}

function isKycVerifiedCheck(userData) {
  return (
    Number(userData?.kycVerified) === 2 ||
    userData?.is_kyc_verify === 1 ||
    String(userData?.kyc_status || "").toUpperCase() === "APPROVED" ||
    String(userData?.kycStatus || "").toUpperCase() === "APPROVED"
  );
}

function formatAedAmount(value) {
  const n = Number.parseFloat(String(value ?? "0").replace(/,/g, ""));
  if (!Number.isFinite(n)) return "0.00";
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function numOrNull(value) {
  if (value == null || value === "") return null;
  if (typeof value === "object") return null;
  const n = Number.parseFloat(String(value).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function firstNum(...vals) {
  for (const v of vals) {
    const n = numOrNull(v);
    if (n != null) return n;
  }
  return null;
}

function firstStr(...vals) {
  for (const v of vals) {
    if (v == null || v === "") continue;
    if (typeof v === "object") continue;
    return String(v);
  }
  return null;
}

function unwrapLimitsRoot(limits) {
  if (!limits || typeof limits !== "object") return {};
  if (limits.withdraw || limits.withdrawal || limits.deposit) return limits;
  if (limits.limits && typeof limits.limits === "object") return unwrapLimitsRoot(limits.limits);
  if (limits.data && typeof limits.data === "object" && !Array.isArray(limits.data)) {
    return unwrapLimitsRoot(limits.data);
  }
  return limits;
}

function periodFrom(bucket, period) {
  const nested = bucket?.[period] && typeof bucket[period] === "object" ? bucket[period] : null;
  const used = firstNum(
    nested?.used,
    nested?.used_amount,
    nested?.consumed,
    bucket?.[`${period}_used`],
    bucket?.[`${period}Used`],
    bucket?.[`used_${period}`]
  );
  const limit = firstNum(
    nested?.limit,
    nested?.cap,
    nested?.max,
    nested?.amount,
    bucket?.[`${period}_limit`],
    bucket?.[`${period}_max`],
    bucket?.[`max_${period}`],
    bucket?.[period] != null && typeof bucket[period] !== "object" ? bucket[period] : null
  );
  const remaining = firstNum(
    nested?.remaining,
    nested?.left,
    nested?.available,
    bucket?.[`${period}_remaining`],
    bucket?.[`${period}Remaining`]
  );
  return {
    used: used != null ? used : limit != null && remaining != null ? Math.max(0, limit - remaining) : null,
    limit,
    remaining: remaining != null ? remaining : limit != null && used != null ? Math.max(0, limit - used) : null,
  };
}

function parseLimitSide(bucket, root, prefix) {
  const src = bucket && typeof bucket === "object" ? bucket : {};
  const daily = periodFrom(src, "daily");
  const monthly = periodFrom(src, "monthly");
  return {
    dailyLimit: daily.limit,
    dailyRemaining: daily.remaining,
    dailyUsed: daily.used,
    monthlyLimit: monthly.limit,
    monthlyRemaining: monthly.remaining,
    monthlyUsed: monthly.used,
    minPerTx: firstNum(
      src.min_per_tx,
      src.min,
      src.min_amount,
      prefix === "deposit" ? src.min_deposit : src.min_withdrawal
    ),
    maxPerTx: firstNum(
      src.max_per_tx,
      src.max,
      src.max_amount,
      prefix === "deposit" ? src.max_deposit : src.max_withdrawal
    ),
  };
}

function parseFiatDepositLimits(limits) {
  const root = unwrapLimitsRoot(limits);
  const bucket = root.deposit && typeof root.deposit === "object" ? root.deposit : {};
  const parsed = parseLimitSide(bucket, root, "deposit");
  const empty =
    parsed.dailyLimit == null &&
    parsed.monthlyLimit == null &&
    parsed.dailyUsed == null &&
    parsed.dailyRemaining == null &&
    parsed.monthlyRemaining == null &&
    parsed.minPerTx == null &&
    parsed.maxPerTx == null;
  const base = empty ? parseLimitSide(root, root, "deposit") : parsed;
  const src = empty ? root : bucket;
  return {
    ...base,
    depositsToday: firstNum(src.deposits_today, src.depositsToday),
    freeDepositsRemaining: firstNum(src.free_deposits_remaining, src.freeDepositsRemaining),
    nextDepositFeeAed: firstStr(src.next_deposit_fee_aed, src.nextDepositFeeAed),
    depositFeeTz: firstStr(src.deposit_fee_tz, src.depositFeeTz) || "Asia/Dubai",
  };
}

function depositFeeModel(limits) {
  const minN = Number(limits?.minPerTx != null ? limits.minPerTx : 100);
  const feeN = Number.parseFloat(String(limits?.nextDepositFeeAed ?? "10"));
  const fee = Number.isFinite(feeN) ? feeN : 10;
  const min = Number.isFinite(minN) ? minN : 100;
  const freeLeft = Number(limits?.freeDepositsRemaining);
  const feeIsFree = Number.isFinite(freeLeft) && freeLeft > 0;
  return {
    minLabel: formatAedAmount(min),
    netLabel: formatAedAmount(Math.max(0, min - fee)),
    freeLeft,
    feeIsFree,
  };
}

function listedWhitelistEntries(items) {
  return (items || []).filter((b) => b && b.status && b.status !== "DISABLED");
}

function maskWithAsterisks(val, fallbackLast4) {
  if (!val || val === "—") {
    if (fallbackLast4) {
      const l4 = String(fallbackLast4).trim();
      return l4 ? `********${l4.slice(-4)}` : "—";
    }
    return "—";
  }
  const clean = String(val).replace(/\s+/g, "").trim();
  const last4 = clean.includes("•")
    ? (fallbackLast4 || clean.replace(/\D/g, "").slice(-4))
    : clean.slice(-4);
  if (!last4) return "—";
  return `********${last4}`;
}

const DepositFiatScreen = () => {
  const { colors: themeColors, isDark } = useTheme();
  const userData = useAppSelector((state) => state.auth?.userData || state.user?.userData || {});

  const [vaLoading, setVaLoading] = useState(true);
  const [account, setAccount] = useState(null);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [depositLimits, setDepositLimits] = useState(null);
  const [creating, setCreating] = useState(false);
  const [widgetError, setWidgetError] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);
  const [fiatHeld, setFiatHeld] = useState(false);
  const [holdMessage, setHoldMessage] = useState("");
  const [copiedField, setCopiedField] = useState("");
  const [showAccountNo, setShowAccountNo] = useState(false);
  const [showIban, setShowIban] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [kycReason, setKycReason] = useState("required");
  const [faqActiveIndex, setFaqActiveIndex] = useState(null);

  // Bottom Sheet Refs
  const kycModalRef = useRef(null);
  const fiatFaqSheetRef = useRef(null);
  const beneficiariesPromiseRef = useRef(null);

  const isKycVerified = useMemo(() => isKycVerifiedCheck(userData), [userData]);

  const openKycModal = useCallback((reason = "required") => {
    setKycReason(reason === "incomplete" ? "incomplete" : "required");
    kycModalRef.current?.open?.();
  }, []);

  const noteHold = useCallback((res) => {
    const code = res?.code || res?.error?.code;
    if (code !== "FIAT_SERVICE_HELD") return false;
    const data = res?.data && typeof res.data === "object" ? res.data : res?.error?.data;
    setFiatHeld(true);
    setHoldMessage(
      res?.message ||
        res?.error?.message ||
        (data?.hold_reason ? String(data.hold_reason) : "") ||
        "Fiat service is temporarily unavailable"
    );
    return true;
  }, []);

  const loadDepositLimits = useCallback(async () => {
    try {
      const res = await appOperation.customer.fiat_limits().catch((err) => err);
      noteHold(res);
      if (res?.success) {
        setDepositLimits(parseFiatDepositLimits(res.data || null));
      }
    } catch {
      /* limits stay at last value; fee card falls back to 100 / 10 */
    }
  }, [noteHold]);

  const loadBeneficiaries = useCallback(async () => {
    try {
      const p = appOperation.customer.fiat_whitelist_list().catch((err) => err);
      beneficiariesPromiseRef.current = p;
      const res = await p;
      noteHold(res);
      if (res?.success && res?.data) {
        const list = Array.isArray(res.data) ? res.data : res.data.items || [];
        const items = listedWhitelistEntries(list);
        setBeneficiaries(items);
        return { ok: true, items };
      }
      setBeneficiaries([]);
      return { ok: false, items: [] };
    } catch {
      setBeneficiaries([]);
      return null;
    } finally {
      beneficiariesPromiseRef.current = null;
    }
  }, [noteHold]);

  const validateBeneficiary = useCallback(async () => {
    let currentBeneficiaries = beneficiaries;
    if (beneficiariesPromiseRef.current) {
      try {
        const res = await beneficiariesPromiseRef.current;
        if (res?.success && res?.data) {
          const list = Array.isArray(res.data) ? res.data : res.data.items || [];
          currentBeneficiaries = listedWhitelistEntries(list);
        }
      } catch {
        /* ignore */
      }
    }
    if (!currentBeneficiaries || currentBeneficiaries.length === 0) {
      try {
        const freshRes = await appOperation.customer.fiat_whitelist_list().catch((err) => err);
        if (freshRes?.success && freshRes?.data) {
          const list = Array.isArray(freshRes.data) ? freshRes.data : freshRes.data.items || [];
          const items = listedWhitelistEntries(list);
          if (items.length > 0) {
            setBeneficiaries(items);
            return true;
          }
        }
      } catch {
        /* ignore */
      }
      Toast.showWithGravity("Please add beneficiary account before deposit.", Toast.LONG, Toast.BOTTOM);
      return false;
    }
    return true;
  }, [beneficiaries]);

  // Fetch Virtual Account (web logic parity)
  const fetchVirtualAccount = useCallback(async ({ silent } = {}) => {
    if (!silent) {
      setVaLoading(true);
      setWidgetError("");
      setLoadFailed(false);
    }
    try {
      const res = await appOperation.customer.fiat_virtual_account_me().catch((err) => err);
      noteHold(res);
      if (res?.success && res?.data) {
        setAccount(res.data);
        setLoadFailed(false);
        setWidgetError("");
      } else if (res?.code === "VA_NOT_FOUND" || res?.notFound || String(res?.message || "").toLowerCase().includes("not found")) {
        setAccount(null);
        setLoadFailed(false);
        setWidgetError("");
      } else {
        setAccount(null);
        setLoadFailed(true);
        setWidgetError(res?.message || res?.error?.message || "Could not check fiat account status.");
      }
    } catch {
      setAccount(null);
      setLoadFailed(true);
      setWidgetError("Could not check fiat account status.");
    } finally {
      setVaLoading(false);
    }
  }, [noteHold]);

  useEffect(() => {
    fetchVirtualAccount();
  }, [fetchVirtualAccount]);

  useEffect(() => {
    setShowAccountNo(false);
    setShowIban(false);
  }, [account?.account_id, account?.iban]);

  useFocusEffect(
    useCallback(() => {
      loadDepositLimits();
      loadBeneficiaries();
    }, [loadDepositLimits, loadBeneficiaries])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchVirtualAccount({ silent: true }),
      loadDepositLimits(),
      loadBeneficiaries(),
    ]);
    setRefreshing(false);
  };

  // Copy to clipboard with instant feedback
  const handleCopy = (text, fieldName, label) => {
    if (!text) return;
    Clipboard.setString(String(text));
    setCopiedField(fieldName);
    Toast.showWithGravity(`${label} copied`, Toast.SHORT, Toast.BOTTOM);
    setTimeout(() => {
      setCopiedField((cur) => (cur === fieldName ? "" : cur));
    }, 2000);
  };

  // Create Virtual Account Handler (exact web logic)
  const handleCreateAccount = useCallback(async () => {
    if (fiatHeld || creating) return;

    if (!isKycVerified) {
      openKycModal("required");
      return;
    }

    setCreating(true);
    setWidgetError("");
    try {
      const key = `va_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const res = await appOperation.customer
        .fiat_virtual_account_create({}, { "Idempotency-Key": key })
        .catch((err) => err);

      if (res?.success && res?.data) {
        setAccount(res.data);
        setLoadFailed(false);
        const created = String(res?.message || "").toLowerCase().includes("created");
        Toast.showWithGravity(
          created ? "Bank account created." : "Your virtual account is ready.",
          Toast.LONG,
          Toast.BOTTOM
        );
        return;
      }

      const code = res?.code || res?.error?.code;
      if (noteHold(res) || code === "FIAT_SERVICE_HELD") {
        return;
      }
      if (code === "KYC_REQUIRED") {
        openKycModal("required");
        return;
      }
      if (code === "KYC_PROFILE_INCOMPLETE") {
        openKycModal("incomplete");
        return;
      }
      const msg = res?.message || res?.error?.message || "Could not create virtual account. Please try again.";
      setWidgetError(msg);
      Toast.showWithGravity(msg, Toast.LONG, Toast.BOTTOM);
    } catch {
      setWidgetError("Could not create virtual account. Please try again.");
    } finally {
      setCreating(false);
    }
  }, [creating, fiatHeld, isKycVerified, noteHold, openKycModal]);

  // Color tokens
  const bgColor = themeColors.background;
  const cardBg = isDark ? "rgba(255,255,255,0.05)" : "#FFFFFF";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB";
  const textColor = isDark ? "#FFFFFF" : "#111827";
  const subTextColor = isDark ? "rgba(255,255,255,0.55)" : "#6B7280";
  const badgeBg = isDark ? "rgba(255,255,255,0.08)" : "#EDF2F7";

  const payIn = vaPayInIban(account);
  const statusChip = vaStatusChip(account?.status);
  const accountNo = String(account?.account_id || "").trim();
  const feeModel = depositFeeModel(depositLimits);
  const fiatFaq = useMemo(() => buildFiatFaq(feeModel.minLabel), [feeModel.minLabel]);

  const displayAccountNo = accountNo
    ? showAccountNo
      ? accountNo
      : maskWithAsterisks(accountNo)
    : "—";

  const displayIban =
    payIn.text !== "—"
      ? showIban
        ? payIn.text
        : maskWithAsterisks(payIn.copy || payIn.text, account?.iban_last4)
      : "—";

  const onCopyIban = async () => {
    if (!(await validateBeneficiary())) return;
    if (!payIn.copy) return;
    handleCopy(payIn.copy, "iban", "IBAN");
  };

  const onCopyAccountNo = async () => {
    if (!(await validateBeneficiary())) return;
    if (!accountNo) return;
    handleCopy(accountNo, "account_no", "Account no");
  };

  const onToggleShowAccountNo = async () => {
    if (!showAccountNo && !(await validateBeneficiary())) return;
    setShowAccountNo((prev) => !prev);
  };

  const onToggleShowIban = async () => {
    if (!showIban && !(await validateBeneficiary())) return;
    setShowIban((prev) => !prev);
  };

  const activeBadgeBg = statusChip.pending
    ? (isDark ? "rgba(209, 170, 103, 0.15)" : "#FEF3C7")
    : (isDark ? "rgba(34, 197, 94, 0.18)" : "#DCFCE7");

  const activeBadgeText = statusChip.pending
    ? (isDark ? "#D1AA67" : "#D97706")
    : (isDark ? "#22C55E" : "#15803D");

  const activeBadgeBorder = statusChip.pending
    ? (isDark ? "rgba(209, 170, 103, 0.3)" : "rgba(217, 119, 6, 0.3)")
    : (isDark ? "rgba(34, 197, 94, 0.3)" : "rgba(22, 163, 74, 0.3)");

  // Create card button label & action logic
  let primaryBtnLabel = "Create bank account";
  if (vaLoading) primaryBtnLabel = "Checking account…";
  else if (creating) primaryBtnLabel = "Creating bank account…";
  else if (fiatHeld) primaryBtnLabel = "Fiat is paused";
  else if (loadFailed) primaryBtnLabel = "Try again";

  const handlePrimaryBtnPress = loadFailed && !fiatHeld ? () => fetchVirtualAccount() : handleCreateAccount;

  return (
    <AppSafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
      {/* Top Header with History Icon */}
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
          Deposit Fiat
        </AppText>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <TouchableOpacity
            onPress={() => {
              setFaqActiveIndex(null);
              fiatFaqSheetRef.current?.open?.();
            }}
            style={styles.headerBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <FastImage
              source={INFO}
              style={styles.headerInfoIcon}
              resizeMode={FastImage.resizeMode.contain}
              tintColor={textColor}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => NavigationService.navigate(DEPOSIT_FIAT_HISTORY_SCREEN)}
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
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.orangeTheme }/>}
      >
        {/* Hero Banner Section (Compact Sleek Layout) */}
        <View style={[styles.heroCard, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.gatewayPill}>
            <AppText type={TEN} weight={BOLD} style={styles.gatewayPillText} color={colors.orangeTheme}>
              FIAT GATEWAY
            </AppText>
          </View>

          <AppText type={EIGHTEEN} weight={BOLD} style={styles.heroHeading} color={textColor}>
            Deposit Fiat.{" "}
            <AppText type={EIGHTEEN} weight={BOLD} color={colors.orangeTheme}>Buy Crypto Seamlessly.</AppText>
          </AppText>

          <AppText type={TWELVE} style={styles.heroSub} color={subTextColor}>
            Add funds to your AGCX account using bank transfer and start trading in minutes. Fast, secure and hassle-free.
          </AppText>

          {/* 3 Features with exact Web SVG Icons */}
          <View style={styles.featureList}>
            <View style={styles.featureRow}>
              <View style={styles.featureIconBadge}>
                <SecurityShieldIcon size={15} color="#D1AA67" />
              </View>
              <View style={styles.featureTextWrap}>
                <AppText type={THIRTEEN} weight={BOLD} style={styles.featureTitle} color={textColor}>
                  Bank-level security
                </AppText>
                <AppText type={ELEVEN} style={styles.featureDesc} color={subTextColor}>
                  Protected with advanced security systems.
                </AppText>
              </View>
            </View>

            <View style={styles.featureRow}>
              <View style={styles.featureIconBadge}>
                <InstantBoltIcon size={15} color="#D1AA67" />
              </View>
              <View style={styles.featureTextWrap}>
                <AppText type={THIRTEEN} weight={BOLD} style={styles.featureTitle} color={textColor}>
                  Fast processing
                </AppText>
                <AppText type={ELEVEN} style={styles.featureDesc} color={subTextColor}>
                  Start trading as soon as Spot credits.
                </AppText>
              </View>
            </View>

            <View style={styles.featureRow}>
              <View style={styles.featureIconBadge}>
                <GlobalGlobeIcon size={15} color="#D1AA67" />
              </View>
              <View style={styles.featureTextWrap}>
                <AppText type={THIRTEEN} weight={BOLD} style={styles.featureTitle} color={textColor}>
                  UAE AED Rail
                </AppText>
                <AppText type={ELEVEN} style={styles.featureDesc} color={subTextColor}>
                  Dedicated AGCX virtual IBAN.
                </AppText>
              </View>
            </View>
          </View>
        </View>

        {fiatHeld ? (
          <View style={[styles.holdBanner, { backgroundColor: isDark ? "rgba(239,68,68,0.12)" : "#FEF2F2", borderColor: isDark ? "rgba(239,68,68,0.35)" : "#FECACA" }]}>
            <AppText type={THIRTEEN} weight={BOLD} color={textColor}>
              Fiat paused.
            </AppText>
            <AppText type={TWELVE} style={{ marginTop: 4, lineHeight: 18 }} color={subTextColor}>
              {holdMessage || "Fiat service is temporarily unavailable"}
            </AppText>
          </View>
        ) : null}

        <View style={[styles.card, { backgroundColor: cardBg, borderColor, marginBottom: 14 }]}>
          <AppText type={THIRTEEN} weight={BOLD} color={textColor}>
            Fee details
          </AppText>
          <View style={styles.feeRow}>
            <AppText type={TWELVE} color={subTextColor}>Send at least</AppText>
            <AppText type={THIRTEEN} weight={BOLD} color={textColor}>{feeModel.minLabel} AED</AppText>
          </View>
          <View style={styles.feeRow}>
            <AppText type={TWELVE} color={subTextColor}>You receive</AppText>
            <AppText type={THIRTEEN} weight={BOLD} color={textColor}>
              {feeModel.feeIsFree ? `${feeModel.minLabel} AED` : `${feeModel.netLabel} AED`}
            </AppText>
          </View>
          <AppText type={TWELVE} style={styles.feeNote} color={subTextColor}>
            {feeModel.feeIsFree
              ? `${feeModel.freeLeft} free deposit${feeModel.freeLeft === 1 ? "" : "s"} left today. Fee is taken from the bank transfer.`
              : `Example if you send the minimum. Fee is taken from the transfer automatically — do not add it in the app. Below ${feeModel.minLabel} AED is held for refund, not credited.`}
          </AppText>

          <AppText type={THIRTEEN} weight={BOLD} color={textColor} style={{ marginTop: 16 }}>
            How to deposit
          </AppText>
          <View style={styles.howList}>
            <AppText type={TWELVE} style={styles.howLine} color={subTextColor}>
              1. Copy the AGCX IBAN and account name from the bank card.
            </AppText>
            <AppText type={TWELVE} style={styles.howLine} color={subTextColor}>
              2. Transfer at least {feeModel.minLabel} AED from your UAE bank.
            </AppText>
            <AppText type={TWELVE} style={styles.howLine} color={subTextColor}>
              3. Wait for AED to credit in your spot wallet.
            </AppText>
          </View>
        </View>

        {/* Dynamic Widget: Virtual Account VS Create Bank Account */}
        {vaLoading ? (
          <View style={[styles.loadingBox, { backgroundColor: cardBg, borderColor }]}>
            <ActivityIndicator size="small" color={colors.orangeTheme} />
            <AppText type={THIRTEEN} style={styles.loadingText} color={subTextColor}>
              Checking virtual account…
            </AppText>
          </View>
        ) : account ? (
          /* Case A: Virtual Account Info Card */
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.vaHeader}>
              <View>
                <AppText type={TWELVE} weight={MEDIUM} style={styles.vaKicker} color={subTextColor}>
                  Your AGCX IBAN
                </AppText>
                <View style={styles.vaBadgeRow}>
                  <View
                    style={[
                      styles.activePill,
                      {
                        backgroundColor: activeBadgeBg,
                        borderColor: activeBadgeBorder,
                      },
                    ]}
                  >
                    <AppText type={TWELVE} weight={BOLD} color={activeBadgeText}>
                      {statusChip.text}
                    </AppText>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => NavigationService.navigate(WITHDRAW_FIAT_SCREEN)}
                style={styles.withdrawLink}
                activeOpacity={0.7}
              >
                <AppText type={TWELVE} weight={SEMI_BOLD} color={colors.orangeTheme}>
                  Fiat Withdrawal ›
                </AppText>
              </TouchableOpacity>
            </View>

            {/* Account Name */}
            <View style={[styles.kvRow, { alignItems: "flex-start" }]}>
              <AppText type={THIRTEEN} weight={MEDIUM} color={subTextColor} style={styles.kvLabel}>
                Account name
              </AppText>
              <AppText type={FOURTEEN} weight={BOLD} color={textColor} style={styles.kvValueText}>
                {account.account_name || "—"}
              </AppText>
            </View>

            {/* Bank */}
            <View style={styles.kvRow}>
              <AppText type={THIRTEEN} weight={MEDIUM} color={subTextColor} style={styles.kvLabel}>
                Bank
              </AppText>
              <AppText type={FOURTEEN} weight={BOLD} color={textColor} style={styles.kvValueText}>
                AGCX Bank
              </AppText>
            </View>

            {/* Account Number */}
            <View style={styles.kvRow}>
              <AppText type={THIRTEEN} weight={MEDIUM} color={subTextColor} style={styles.kvLabel}>
                Account no
              </AppText>
              <View style={styles.copyableValueRow}>
                <AppText type={FOURTEEN} weight={BOLD} color={textColor} style={styles.copyableText}>
                  {displayAccountNo}
                </AppText>
                {accountNo ? (
                  <View style={styles.vaActions}>
                    <TouchableOpacity
                      onPress={onToggleShowAccountNo}
                      style={[styles.copyIconButton, { backgroundColor: badgeBg }]}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      activeOpacity={0.7}
                    >
                      {showAccountNo ? (
                        <EyeOffIcon size={14} color={isDark ? "#D1AA67" : "#B45309"} />
                      ) : (
                        <EyeIcon size={14} color={isDark ? "#D1AA67" : "#B45309"} />
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={onCopyAccountNo}
                      style={[
                        styles.copyIconButton,
                        { backgroundColor: copiedField === "account_no" ? "rgba(16,185,129,0.15)" : badgeBg },
                      ]}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      activeOpacity={0.7}
                    >
                      {copiedField === "account_no" ? (
                        <CopiedCheckIcon size={14} color="#10B981" />
                      ) : (
                        <CopyIcon size={14} color={isDark ? "#D1AA67" : "#B45309"} />
                      )}
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            </View>

            {/* IBAN */}
            <View style={styles.kvRow}>
              <AppText type={THIRTEEN} weight={MEDIUM} color={subTextColor} style={styles.kvLabel}>
                IBAN
              </AppText>
              <View style={styles.copyableValueRow}>
                <AppText
                  type={FOURTEEN}
                  weight={BOLD}
                  color={textColor}
                  style={styles.copyableText}
                >
                  {displayIban}
                </AppText>
                {payIn.copy ? (
                  <View style={styles.vaActions}>
                    <TouchableOpacity
                      onPress={onToggleShowIban}
                      style={[styles.copyIconButton, { backgroundColor: badgeBg }]}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      activeOpacity={0.7}
                    >
                      {showIban ? (
                        <EyeOffIcon size={14} color={isDark ? "#D1AA67" : "#B45309"} />
                      ) : (
                        <EyeIcon size={14} color={isDark ? "#D1AA67" : "#B45309"} />
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={onCopyIban}
                      style={[
                        styles.copyIconButton,
                        { backgroundColor: copiedField === "iban" ? "rgba(16,185,129,0.15)" : badgeBg },
                      ]}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      activeOpacity={0.7}
                    >
                      {copiedField === "iban" ? (
                        <CopiedCheckIcon size={14} color="#10B981" />
                      ) : (
                        <CopyIcon size={14} color={isDark ? "#D1AA67" : "#B45309"} />
                      )}
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            </View>

            {!payIn.complete && payIn.text !== "—" ? (
              <AppText type={ELEVEN} color="#F59E0B" style={{ marginVertical: 6 }}>
                Full IBAN is not available. Use last4 above and contact support if your bank needs the complete number.
              </AppText>
            ) : null}

            {/* Created At */}
            <View style={styles.kvRow}>
              <AppText type={THIRTEEN} weight={MEDIUM} color={subTextColor} style={styles.kvLabel}>
                Created
              </AppText>
              <AppText type={FOURTEEN} weight={BOLD} color={textColor} style={styles.kvValueText}>
                {formatCreatedDate(account.created_at)}
              </AppText>
            </View>

            {depositLimits?.minPerTx != null || depositLimits?.freeDepositsRemaining != null ? (
              <View style={[styles.limitBox, { borderTopColor: borderColor }]}>
                <AppText type={TWELVE} weight={BOLD} color={textColor} style={{ marginBottom: 8 }}>
                  Deposit limits
                </AppText>
                {depositLimits?.minPerTx != null ? (
                  <View style={styles.limitRow}>
                    <AppText type={TWELVE} color={subTextColor}>Minimum</AppText>
                    <AppText type={TWELVE} weight={BOLD} color={textColor}>
                      {formatAedAmount(depositLimits.minPerTx)} AED
                    </AppText>
                  </View>
                ) : null}
                {depositLimits?.freeDepositsRemaining != null ? (
                  <View style={styles.limitRow}>
                    <AppText type={TWELVE} color={subTextColor}>Free transfers per 24 hours</AppText>
                    <AppText type={TWELVE} weight={BOLD} color={textColor}>
                      {String(depositLimits.freeDepositsRemaining)}
                    </AppText>
                  </View>
                ) : null}
              </View>
            ) : null}

            <View style={[styles.instructionBox, { backgroundColor: isDark ? "rgba(212,175,55,0.08)" : "#FFF9E6", borderColor: isDark ? "rgba(212,175,55,0.25)" : "#FDE68A" }]}>
              <AppText type={TWELVE} style={styles.instructionText} color={isDark ? "#F3E8B6" : "#92400E"}>
                Add your withdrawal account before you deposit. It must be registered in your name. Deposits from third-party or unauthorized accounts may be rejected and refunded. Use only your own bank account.
              </AppText>
            </View>
            <TouchableOpacity
              onPress={() => NavigationService.navigate(WITHDRAW_FIAT_SCREEN, { openAdd: true })}
              activeOpacity={0.85}
              style={[styles.primaryBtn, { backgroundColor: colors.orangeTheme, marginTop: 12 }]}
            >
              <AppText type={FIFTEEN} weight={BOLD} color="#000000">
                Add withdrawal account
              </AppText>
            </TouchableOpacity>
          </View>
        ) : (
          /* Case B: Create Bank Account Card */
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.cardHeaderRow}>
              <AppText type={EIGHTEEN} weight={BOLD} style={styles.cardTitle} color={textColor}>
                Deposit Fiat
              </AppText>
              <TouchableOpacity
                onPress={() => NavigationService.navigate(WITHDRAW_FIAT_SCREEN)}
                style={styles.withdrawLink}
                activeOpacity={0.7}
              >
                <AppText type={TWELVE} weight={SEMI_BOLD} color={colors.orangeTheme}>
                  Fiat Withdrawal ›
                </AppText>
              </TouchableOpacity>
            </View>

            {widgetError ? (
              <View style={styles.errorBanner}>
                <AppText type={THIRTEEN} color="#EF4444">{widgetError}</AppText>
              </View>
            ) : null}

            {!isKycVerified ? (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => NavigationService.navigate(KYC_STATUS_SCREEN)}
                style={[
                  styles.kycPrompt,
                  {
                    backgroundColor: isDark ? "rgba(209,170,103,0.12)" : "#FFF9E6",
                    borderColor: isDark ? "rgba(209,170,103,0.35)" : "#FDE68A",
                  },
                ]}
              >
                <View style={styles.kycPromptIcon}>
                  <SecurityShieldIcon size={22} color="#D1AA67" />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText type={THIRTEEN} weight={BOLD} color={textColor}>
                    Your KYC is not verified. Complete the KYC first.
                  </AppText>
                  <AppText type={TWELVE} weight={SEMI_BOLD} color={colors.orangeTheme} style={{ marginTop: 6 }}>
                    Complete KYC ›
                  </AppText>
                </View>
              </TouchableOpacity>
            ) : null}

            {/* Currency Input Box */}
            <AppText type={THIRTEEN} weight={SEMI_BOLD} style={styles.fieldLabel} color={subTextColor}>
              Currency
            </AppText>
            <View style={[styles.currencySelectorBox, { backgroundColor: badgeBg, borderColor }]}>
              <View style={styles.currencyFlag}>
                <UaeFlagIcon width={24} height={16} />
              </View>
              <AppText type={SIXTEEN} weight={BOLD} style={styles.currencyCode} color={textColor}>
                AED
              </AppText>
              <View style={styles.currencyPill}>
                <AppText type={ELEVEN} weight={SEMI_BOLD} color="#8A94A6">
                  UAE Dirham
                </AppText>
              </View>
            </View>

            {/* Payment Method Card */}
            <AppText type={THIRTEEN} weight={SEMI_BOLD} style={[styles.fieldLabel, { marginTop: 16 }]} color={subTextColor}>
              Payment Method
            </AppText>
            <View style={[styles.methodCard, { backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#F9FAFB", borderColor }]}>
              <View style={styles.methodHeader}>
                <View style={styles.methodTitleRow}>
                  <AppText type={FIFTEEN} weight={BOLD} color={textColor}>
                    Bank Transfer (UAE)
                  </AppText>
                  <View style={styles.recommendedBadge}>
                    <AppText type={TEN} weight={BOLD} color={colors.orangeTheme}>
                      Recommended
                    </AppText>
                  </View>
                </View>
                <View style={{width:25,height:25,borderRadius:15,backgroundColor:isDark? colors.white: themeColors.background,
                  alignItems:"center",justifyContent:"center"
                }}>
                <FastImage source={checkIc} style={styles.checkIcon} resizeMode="contain" tintColor={isDark? colors.black: colors.white} />
              </View></View>

              <AppText type={TWELVE} weight={SEMI_BOLD} style={styles.methodSub} color={colors.orangeTheme}>
                Your Personal AGCX Virtual IBAN
              </AppText>
              <AppText type={TWELVE} style={styles.methodDesc} color={subTextColor}>
                Create your Virtual IBAN that will be linked to your verified identity. This VIBAN can be used to deposit funds from your verified bank account to your AGCX account.
              </AppText>
            </View>

            {depositLimits?.minPerTx != null || depositLimits?.freeDepositsRemaining != null ? (
              <View style={[styles.limitBox, { borderTopColor: borderColor, marginTop: 0 }]}>
                <AppText type={TWELVE} weight={BOLD} color={textColor} style={{ marginBottom: 8 }}>
                  Deposit limits
                </AppText>
                {depositLimits?.minPerTx != null ? (
                  <View style={styles.limitRow}>
                    <AppText type={TWELVE} color={subTextColor}>Minimum</AppText>
                    <AppText type={TWELVE} weight={BOLD} color={textColor}>
                      {formatAedAmount(depositLimits.minPerTx)} AED
                    </AppText>
                  </View>
                ) : null}
                {depositLimits?.freeDepositsRemaining != null ? (
                  <View style={styles.limitRow}>
                    <AppText type={TWELVE} color={subTextColor}>Free transfers per 24 hours</AppText>
                    <AppText type={TWELVE} weight={BOLD} color={textColor}>
                      {String(depositLimits.freeDepositsRemaining)}
                    </AppText>
                  </View>
                ) : null}
              </View>
            ) : null}

            {/* Primary Action Button */}
            <TouchableOpacity
              onPress={handlePrimaryBtnPress}
              disabled={creating || vaLoading || fiatHeld}
              activeOpacity={0.85}
              style={[
                styles.primaryBtn,
                { backgroundColor: colors.orangeTheme, opacity: creating || vaLoading || fiatHeld ? 0.55 : 1 },
              ]}
            >
              {creating ? (
                <ActivityIndicator color={"#000000"} size="small" />
              ) : (
                <AppText type={FIFTEEN} weight={BOLD} color="#000000">
                  {primaryBtnLabel}
                </AppText>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.sectionWrap}>
          <AppText type={EIGHTEEN} weight={BOLD} style={styles.sectionHeading} color={textColor}>
            How to deposit Fiat?
          </AppText>
          {HOW_STEPS.map((step) => {
            const StepIcon = step.IconComponent;
            return (
              <View key={step.n} style={[styles.howStepRow, { backgroundColor: cardBg, borderColor }]}>
                <View style={[styles.stepCircleIcon, styles.howStepIcon]}>
                  <StepIcon size={20} color="#D1AA67" />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText type={FOURTEEN} weight={BOLD} color={textColor}>
                    {step.n}. {step.title}
                  </AppText>
                  <AppText type={TWELVE} style={{ marginTop: 4, lineHeight: 18 }} color={subTextColor}>
                    {step.body}
                  </AppText>
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* KYC Required Modal (Exact web parity) */}
      <AnimatedBottomSheet
        ref={kycModalRef}
        sheetHeight={340}
        isDark={isDark}
      >
        <View style={styles.kycModalInner}>
          <View style={styles.kycModalIconBadge}>
            <SecurityShieldIcon size={32} color="#D1AA67" />
          </View>
          <AppText type={EIGHTEEN} weight={BOLD} style={styles.kycModalTitle} color={textColor}>
            {kycReason === "incomplete" ? "KYC details incomplete" : "Identity verification required"}
          </AppText>
          <AppText type={THIRTEEN} style={styles.kycModalDesc} color={subTextColor}>
            {kycReason === "incomplete"
              ? "Your verified profile is missing details the bank needs (name, date of birth, document number, nationality, or expiry). Open KYC to update your documents — creating another virtual account will not fix this."
              : "Complete KYC before creating a virtual IBAN. After verification you can deposit AED via bank transfer."}
          </AppText>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              kycModalRef.current?.close?.();
              NavigationService.navigate(KYC_STATUS_SCREEN);
            }}
            style={[styles.primaryBtn, { backgroundColor: colors.orangeTheme, width: "100%", marginTop: 24 }]}
          >
            <AppText type={FIFTEEN} weight={BOLD} color="#000000">
              {kycReason === "incomplete" ? "Update KYC" : "Verify now"}
            </AppText>
          </TouchableOpacity>
        </View>
      </AnimatedBottomSheet>

      {/* Fiat Deposit Help / FAQ Bottom Sheet (Exact UI parity with DepositCoin.tsx) */}
      {/* @ts-ignore */}
      <RBSheet
        customModalProps={{ statusBarTranslucent: true }}
        ref={fiatFaqSheetRef}
        height={Math.round(Dimensions.get("window").height * 0.72) - 200}
        closeOnDragDown
        closeOnPressMask
        customStyles={{
          container: {
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            backgroundColor: themeColors.background,
          },
          wrapper: { backgroundColor: "rgba(0,0,0,0.6)" },
          draggableIcon: { backgroundColor: colors.textGray },
        }}
      >
        <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 }}>
          <View style={styles.modalHeader}>
            <AppText weight={SEMI_BOLD} type={SIXTEEN} style={{ color: themeColors.text }}>
              Deposit Fiat Help
            </AppText>
            <TouchableOpacity
              onPress={() => fiatFaqSheetRef.current?.close()}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <AppText type={TWENTY} style={{ color: themeColors.text }}>
                ×
              </AppText>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalList}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {fiatFaq.map((item, index) => (
              <View
                key={String(index)}
                style={[
                  styles.faqItemInner,
                  index === fiatFaq.length - 1 && styles.faqItemInnerLast,
                  { borderColor: colors.inputBorder },
                ]}
              >
                <TouchableOpacity
                  style={styles.faqQuestionRow}
                  onPress={() =>
                    setFaqActiveIndex(faqActiveIndex === index ? null : index)
                  }
                  activeOpacity={0.7}
                >
                  <AppText
                    type={THIRTEEN}
                    weight={SEMI_BOLD}
                    style={[styles.faqQuestion, { color: themeColors.secondaryText }]}
                  >
                    {item.title}
                  </AppText>
                  <FastImage
                    source={faqActiveIndex === index ? upIcon : downIcon}
                    resizeMode="contain"
                    style={styles.faqArrow}
                    tintColor={themeColors.secondaryText}
                  />
                </TouchableOpacity>
                {faqActiveIndex === index && (
                  <View style={styles.faqAnswer}>
                    {item.content.split("\n").map((line, lineIndex) => (
                      <AppText
                        key={lineIndex}
                        type={TWELVE}
                        style={{ color: themeColors.secondaryText, lineHeight: 18 }}
                      >
                        {line}
                      </AppText>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </ScrollView>

          {/* Bottom Note & Deposit Crypto Link */}
          <View style={{ borderTopWidth: 1, borderTopColor: isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0", paddingTop: 14, marginTop: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-start", flexWrap: "wrap" }}>
              <AppText type={TWELVE} style={{ color: themeColors.secondaryText }}>
                Looking to deposit crypto assets instead?{" "}
              </AppText>
              <TouchableOpacity
                onPress={() => {
                  fiatFaqSheetRef.current?.close();
                  NavigationService.navigate(DEPOSIT_COIN_SCREEN);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.7}
              >
                <AppText type={TWELVE} weight={BOLD} color={colors.orangeTheme}>
                  Deposit Crypto ›
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </RBSheet>
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
  headerInfoIcon: {
    width: 18,
    height: 18,
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
  loadingBox: {
    padding: 30,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 10,
  },
  card: {
    padding: 20,
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
  cardTitle: {
    marginBottom: 0,
  },
  withdrawLink: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  vaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  vaKicker: {
    marginBottom: 4,
  },
  vaBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  activePill: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  kvRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
  },
  kvLabel: {
    width: 100,
  },
  kvValueText: {
    flex: 1,
    textAlign: "right",
    lineHeight: 20,
  },
  copyableValueRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },
  copyableText: {
    flexShrink: 1,
    textAlign: "right",
  },
  copyIconButton: {
    width: 30,
    height: 30,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  vaActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  holdBanner: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  feeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  feeNote: {
    marginTop: 10,
    lineHeight: 18,
  },
  howList: {
    marginTop: 8,
    gap: 6,
  },
  howLine: {
    lineHeight: 18,
  },
  limitBox: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  limitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
    gap: 12,
  },
  howStepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  howStepIcon: {
    marginBottom: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  instructionBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 14,
  },
  instructionText: {
    lineHeight: 18,
  },
  errorBanner: {
    backgroundColor: "rgba(239,68,68,0.12)",
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  kycPrompt: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  kycPromptIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(209, 170, 103, 0.15)",
  },
  fieldLabel: {
    marginBottom: 8,
  },
  currencySelectorBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  currencyFlag: {
    marginRight: 10,
  },
  currencyCode: {
    marginRight: 10,
  },
  currencyPill: {
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  methodCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 18,
  },
  methodHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  methodTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  recommendedBadge: {
    backgroundColor: "rgba(212,175,55,0.15)",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  checkIcon: {
    width: 12,
    height: 12,
  },
  methodSub: {
    marginBottom: 6,
  },
  methodDesc: {
    lineHeight: 16,
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
  kycModalInner: {
    flex: 1,
    padding: 24,
    alignItems: "center",
  },
  kycModalIconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(209, 170, 103, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(209, 170, 103, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  kycModalTitle: {
    marginBottom: 8,
    textAlign: "center",
  },
  kycModalDesc: {
    lineHeight: 18,
    textAlign: "center",
  },
  faqSectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalList: {
    flex: 1,
  },
  faqItemInner: {
    paddingVertical: 12,
    borderBottomWidth: 0.7,
    borderBottomColor: colors.iconBgColor,
  },
  faqItemInnerLast: {
    borderBottomWidth: 0,
  },
  faqQuestionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  faqQuestion: {
    flex: 1,
  },
  faqArrow: {
    width: 10,
    height: 10,
    marginLeft: 8,
  },
  faqAnswer: {
    marginTop: 10,
    paddingTop: 10,
  },
});

export default DepositFiatScreen;
