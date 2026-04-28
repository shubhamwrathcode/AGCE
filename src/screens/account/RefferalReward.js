import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  ActivityIndicator,
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  Dimensions,
} from "react-native";
import Carousel from "react-native-reanimated-carousel";
import {
  AppSafeAreaView,
  AppText,
  DISCLAIMTEXT,
  SEMI_BOLD,
  SIXTEEN,
  TWELVE,
  YELLOW,
} from "../../shared";
import KeyBoardAware from "../../shared/components/KeyboardAware";
import { useAppSelector } from "../../store/hooks";
import FastImage from "react-native-fast-image";
import {
  back_ic,
  copyIcon,
  earngift_vector,
  earngift_vector1,
  giftIc,
  invite_ic,
  linkIcon,
  NO_NOTIFICATION_ICON,
  NO_NOTIFICATION_ICON_LIGHT,
  peopleIcon,
  searchIcon,
  usdtearn_vector,
} from "../../helper/ImageAssets";
import { colors } from "../../theme/colors";
import { useTheme } from "../../hooks/useTheme";
import NavigationService from "../../navigation/NavigationService";
import { TouchableOpacity } from "react-native-gesture-handler";
import { useDispatch } from "react-redux";
import { getUserReferCode } from "../../actions/accountActions";
import { getReferralList } from "../../actions/homeActions";
import { copyText } from "../../helper/utility";
import moment from "moment";
import RefferalRewardSkeleton from "./RefferalRewardSkeleton";
import { appOperation } from "../../appOperation";

const SIGNUP_BASE_URL = "https://zillion.wrathcode.com";
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CONTENT_PADDING = 16;
const CONTENT_WIDTH = SCREEN_WIDTH - CONTENT_PADDING * 2;

const referralEvents = [
  {
    title: "Earn Exciting Rewards!",
    description: "Invite friends to join and start earning benefits",
    image: earngift_vector1,
  },
  {
    title: "Invite & Get Rewarded",
    description: "Unlock special bonuses with every successful referral",
    image: usdtearn_vector,
  },
  {
    title: "More Referrals, More Rewards",
    description: "Grow your network and enjoy bigger reward opportunities",
    image: earngift_vector1,
  },
];

const howToReferSteps = [
  {
    icon: invite_ic,
    title: "Invite Friends to Join",
    desc: "Share your referral code and invite your friends to create an account and get started.",
  },
  {
    icon: linkIcon,
    title: "Instant Referral Linking",
    desc: "When your friends sign up using your referral, their account is automatically linked to you.",
  },
  {
    icon: giftIc,
    title: "Earn Exciting Rewards",
    desc: "As your referrals stay active and trade, you receive attractive reward benefits automatically.",
  },
];

const referralRowKey = (item) => item?.user?._id ?? item?._id ?? item?.masked_id ?? item?.uuid;

const RefferalReward = () => {
  const dispatch = useDispatch();
  const { colors: themeColors, isDark } = useTheme();
  const referCode = useAppSelector((state) => state.home.referCode);
  const referralList = useAppSelector((state) => state.home.referralList);

  const [isCopied, setIsCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [contentLoading, setContentLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState(null);

  const [expandedNodeIds, setExpandedNodeIds] = useState(new Set());
  const [downlineByParent, setDownlineByParent] = useState({});
  const [downlineLoading, setDownlineLoading] = useState({});
  const [downlineError, setDownlineError] = useState({});

  const [referralEarningsState, setReferralEarningsState] = useState({
    items: [],
    totalEarned: null,
    earningsShortName: "USDT",
  });

  const referralLink = referCode
    ? `${SIGNUP_BASE_URL}/signup?reffcode=${referCode}`
    : "";

  const copyToClipboard = useCallback((text) => {
    if (!text) return;
    copyText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }, []);

  useEffect(() => {
    dispatch(getUserReferCode());
    dispatch(getReferralList());
  }, [dispatch]);

  useEffect(() => {
    // mirror web behavior: clear expand state when root list changes
    setExpandedNodeIds(new Set());
    setDownlineByParent({});
    setDownlineError({});
    setDownlineLoading({});
  }, [referralList]);

  useEffect(() => {
    if (referCode != null || Array.isArray(referralList)) {
      setContentLoading(false);
    }
  }, [referCode, referralList]);

  const getUserObj = (item) => {
    const u =
      item?.user ??
      item?.fromUser ??
      item?.toUser ??
      item?.refUser ??
      item?.ref_user ??
      item?.referral_user ??
      item?.referredUser ??
      item?.userDetails ??
      item?.user_details ??
      item?.profile ??
      null;
    return u && typeof u === "object" ? u : null;
  };

  const filteredList = (referralList ?? []).filter((item) => {
    if (!searchTerm?.trim()) return true;
    const q = searchTerm.trim().toLowerCase();
    const u = getUserObj(item);
    if (u) {
      const blob = [u.referralCode, u.uuid, u.emailId, u.email, u.firstName, u.lastName, u._id]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    }
    const maskedId = item?.masked_id ?? item?.uuid ?? "";
    const fullName = item?.full_name_masked ?? `${item?.firstName ?? ""} ${item?.lastName ?? ""}`.trim();
    return maskedId?.toLowerCase().includes(q) || fullName?.toLowerCase().includes(q);
  });

  const getDisplayName = (item) => {
    // Match web logic first (but support more nesting keys)
    const u = getUserObj(item);
    if (u) {
      const n = `${String(u.firstName || "").trim()} ${String(u.lastName || "").trim()}`.trim();
      if (n) return n;
      const e = String(u.emailId || u.email || item?.emailId || item?.email || "").trim();
      if (e) {
        const at = e.indexOf("@");
        return at > 0 ? e.slice(0, at) : e;
      }
      if (u.referralCode) return u.referralCode;
      return u.uuid || u._id || "—";
    }

    const rawMasked = (item?.full_name_masked ?? item?.fullNameMasked ?? "").toString().trim();
    const isOnlyMask = !!rawMasked && rawMasked.replace(/\*/g, "").replace(/\s+/g, "").length === 0;

    const candidates = [
      !isOnlyMask ? rawMasked : null,
      item?.username,
      item?.user_name,
      item?.name,
      item?.full_name,
      item?.fullName,
      item?.emailId,
      item?.email,
      `${item?.firstName ?? ""} ${item?.lastName ?? ""}`.trim(),
    ]
      .map((v) => (v == null ? "" : String(v).trim()))
      .filter(Boolean);

    return candidates[0] || "—";
  };
  const getDisplayId = (item) => {
    const u = getUserObj(item);
    const isMasked = (v) => {
      const s = String(v ?? "").trim();
      if (!s) return true;
      return s.replace(/\*/g, "").replace(/\s+/g, "").length === 0;
    };

    const fromUser = u?.uuid || u?.referralCode || u?._id;
    if (fromUser && !isMasked(fromUser)) return String(fromUser);

    const fromItem =
      item?.uuid ??
      item?.userId ??
      item?.user_id ??
      item?.referralCode ??
      item?._id ??
      item?.masked_id;
    if (fromItem && !isMasked(fromItem)) return String(fromItem);

    // last resort (even if masked)
    return String(fromUser ?? fromItem ?? "—");
  };
  const getJoinDateTime = (item) => {
    const d = item?.signup_date ?? item?.createdAt;
    return d ? moment(d).format("DD/MM/YYYY hh:mm A") : "—";
  };
  const getJoinDate = (item) => {
    const u = getUserObj(item);
    const d = item?.signup_date ?? u?.createdAt ?? item?.createdAt;
    return d ? moment(d).format("DD/MM/YYYY") : "—";
  };
  const getKycStatus = (item) => {
    if (item?.kycStatus) return item.kycStatus;
    if (item?.kyc_status) return item.kyc_status;
    const kv = item?.kycVerified ?? getUserObj(item)?.kycVerified;
    if (kv === 2) return "Verified";
    if (kv === 1) return "Pending";
    if (kv === 0) return "Not Verified";
    return "Not Verified";
  };
  const isKycVerifiedUser = (item) => {
    const s = String(getKycStatus(item) ?? "").toLowerCase();
    if (!s) return false;
    return s.includes("verified") && !s.includes("not");
  };
  const getInitials = (item) => {
    const name = String(getDisplayName(item) ?? "").trim();
    if (!name || name === "—") return "U";
    const parts = name.split(" ").filter(Boolean);
    const a = parts[0]?.[0] ?? "U";
    const b = parts[1]?.[0] ?? parts[0]?.[1] ?? "";
    return `${a}${b}`.toUpperCase();
  };
  const getEarnedValue = (item) => {
    const candidates = [
      item?.earned,
      item?.total_earned,
      item?.totalEarned,
      item?.earning,
      item?.earnings,
      item?.commission,
      item?.reward,
      item?.rewardAmount,
      item?.amount,
    ];
    for (const v of candidates) {
      const n = Number(v);
      if (!Number.isNaN(n) && Number.isFinite(n)) return n;
    }
    return 0;
  };

  const loadReferralEarnings = useCallback(async () => {
    try {
      const res = await appOperation.customer.get_my_referral_earnings();
      if (res?.success && res?.data != null) {
        const d = res.data;
        const items = Array.isArray(d.items) ? d.items : [];
        const first = items[0];
        setReferralEarningsState({
          items,
          totalEarned: d.totalEarned != null ? Number(d.totalEarned) : null,
          earningsShortName: (first?.shortName && String(first.shortName).trim()) || "USDT",
        });
      } else {
        setReferralEarningsState({ items: [], totalEarned: null, earningsShortName: "USDT" });
      }
    } catch {
      setReferralEarningsState({ items: [], totalEarned: null, earningsShortName: "USDT" });
    }
  }, []);

  useEffect(() => {
    loadReferralEarnings();
  }, [loadReferralEarnings]);

  const earningsByFromUserId = useMemo(() => {
    const map = {};
    for (const it of referralEarningsState.items || []) {
      const key = it?.fromUserId ?? it?.userId ?? it?._id ?? it?.uuid;
      if (key == null) continue;
      map[String(key)] = it;
    }
    return map;
  }, [referralEarningsState.items]);

  const earningsMetaForKey = useCallback(
    (rowKey) => {
      const em = earningsByFromUserId[String(rowKey)];
      const maxLevel = Number(em?.maxLevel ?? em?.level ?? 0);
      const earned = Number(em?.earned ?? em?.totalEarned ?? em?.amount ?? 0);
      const shortName = String(em?.shortName ?? referralEarningsState.earningsShortName ?? "USDT");
      return { maxLevel: Number.isFinite(maxLevel) ? maxLevel : 0, earned, shortName };
    },
    [earningsByFromUserId, referralEarningsState.earningsShortName]
  );

  const formatEarningForRow = useCallback(
    (rowKey) => {
      const em = earningsMetaForKey(rowKey);
      if (!em?.earned || em.earned <= 0) return "—";
      const v = Math.round(em.earned * 100) / 100;
      return `${v} ${em.shortName}`;
    },
    [earningsMetaForKey]
  );

  const parentIdForDownline = useCallback((item) => {
    const u = getUserObj(item);
    return u?._id ?? u?.uuid ?? item?._id ?? item?.uuid ?? null;
  }, []);

  const canExpandNode = useCallback((item) => {
    const id = parentIdForDownline(item);
    if (id == null) return false;
    const key = String(id);
    const ch = downlineByParent?.[key];
    if (Array.isArray(ch) && ch.length > 0) return true;
    return item?.hasMore !== false;
  }, [parentIdForDownline]);

  const loadReferralDownline = useCallback(async (parentId) => {
    if (parentId == null || parentId === "") return;
    const pid = String(parentId);
    setDownlineLoading((p) => ({ ...p, [pid]: true }));
    setDownlineError((p) => ({ ...p, [pid]: null }));
    try {
      const res = await appOperation.customer.get_referral_children(pid);
      if (res?.success) {
        const d = res?.data;
        const items = Array.isArray(d?.items) ? d.items : Array.isArray(d) ? d : [];
        setDownlineByParent((p) => ({ ...p, [pid]: items }));
      } else {
        setDownlineError((p) => ({ ...p, [pid]: res?.message || "Failed to load downline" }));
      }
    } catch (e) {
      setDownlineError((p) => ({ ...p, [pid]: e?.message || "Something went wrong" }));
    } finally {
      setDownlineLoading((p) => ({ ...p, [pid]: false }));
    }
  }, []);

  const toggleNodeExpanded = useCallback(
    (item) => {
      const pid = parentIdForDownline(item);
      if (pid == null) return;
      const id = String(pid);
      setExpandedNodeIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
      if (!downlineByParent?.[id] && !downlineLoading?.[id]) {
        loadReferralDownline(id);
      }
    },
    [parentIdForDownline, downlineByParent, downlineLoading, loadReferralDownline]
  );

  const flattenTree = useCallback(
    (list, depth = 0) => {
      const out = [];
      for (const item of list || []) {
        const rk = referralRowKey(item) ?? parentIdForDownline(item) ?? `${depth}-${Math.random()}`;
        out.push({ item, depth, rowKey: String(rk) });
        const pid = parentIdForDownline(item);
        const pidStr = pid != null ? String(pid) : null;
        if (pidStr && expandedNodeIds.has(pidStr)) {
          const children = downlineByParent?.[pidStr] || [];
          out.push(...flattenTree(children, depth + 1));
        }
      }
      return out;
    },
    [expandedNodeIds, downlineByParent, parentIdForDownline]
  );

  const displayedReferralRows = useMemo(() => flattenTree(filteredList, 0), [filteredList, flattenTree]);

  const summaryStats = useMemo(() => {
    const list = Array.isArray(referralList) ? referralList : [];
    const totalReferrals = list.length;
    const verifiedUsers = list.filter((x) => isKycVerifiedUser(x)).length;
    const pendingKyc = Math.max(0, totalReferrals - verifiedUsers);
    const earnSymbol = referralEarningsState.earningsShortName || "USDT";
    const totalEarned =
      referralEarningsState.totalEarned != null
        ? `${Math.round(Number(referralEarningsState.totalEarned) * 100) / 100}`
        : "0";
    return { totalReferrals, verifiedUsers, pendingKyc, totalEarned, earnSymbol };
  }, [referralList, isKycVerifiedUser, referralEarningsState.totalEarned, referralEarningsState.earningsShortName]);
  const getKycStatusColor = (item) => {
    const status = getKycStatus(item);
    if (status?.toLowerCase().includes("verified") && !status?.toLowerCase().includes("not"))
      return colors.buttonBg;
    if (
      status?.toLowerCase().includes("submitted") ||
      status?.toLowerCase().includes("pending")
    )
      return colors.buttonBg;
    return colors.descText;
  };

  return (
    <AppSafeAreaView style={{ backgroundColor: themeColors.background }}>
      <KeyBoardAware>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => NavigationService.goBack()}>
            <FastImage
              source={back_ic}
              resizeMode="contain"
              style={styles.backIcon}
              tintColor={themeColors.text}
            />
          </TouchableOpacity>
          <AppText weight={SEMI_BOLD} type={SIXTEEN} color={themeColors.text}>
            Referral/Rewards Hub
          </AppText>
        </View>

        {contentLoading ? (
          <RefferalRewardSkeleton />
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.contentBlock}>
              <AppText style={styles.cardTitle} color={YELLOW} weight={SEMI_BOLD}>
                Exciting Referral Reward
              </AppText>
              <AppText style={[styles.cardSubtitle, { color: themeColors.text }]} weight={SEMI_BOLD}>
                Invite your friends and earn amazing rewards!
              </AppText>
              <AppText style={styles.cardDesc} color={themeColors.secondaryText}>
                Get rewarded when they sign up and unlock additional bonuses after
                they complete verification.
              </AppText>
            </View>
            <View style={[styles.card, { backgroundColor: themeColors.background, borderColor: isDark ? themeColors.border : "#EEE", borderWidth: 1 }]}>

              {/* Referral link row */}
              <View style={styles.refRow}>
                <View style={styles.refLabelRow}>
                  <FastImage
                    tintColor={themeColors.secondaryText}
                    source={linkIcon}
                    style={styles.refIconImg}
                    resizeMode="contain"
                  />
                  <AppText type={TWELVE} style={{ color: themeColors.secondaryText }}>
                    Referral link:
                  </AppText>
                </View>
                <View style={styles.refValueRow}>
                  <AppText type={TWELVE} color={themeColors.text} numberOfLines={1} style={styles.refValue}>
                    {referralLink || "—"}
                  </AppText>
                  <TouchableOpacity
                    onPress={() => copyToClipboard(referralLink)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <FastImage source={copyIcon} style={styles.copyIconImg} resizeMode="contain" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Referral code row */}
              <View style={styles.refRow}>
                <View style={styles.refLabelRow}>
                  <FastImage
                    source={peopleIcon}
                    style={styles.refIconImg}
                    tintColor={themeColors.secondaryText}
                    resizeMode="contain"
                  />
                  <AppText type={TWELVE} style={{ color: themeColors.secondaryText }}>
                    Referral code:
                  </AppText>
                </View>
                <View style={styles.refValueRow}>
                  <AppText type={TWELVE} color={themeColors.text}>
                    {referCode || "—"}
                  </AppText>
                  <TouchableOpacity
                    onPress={() => copyToClipboard(referCode)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <FastImage source={copyIcon} style={styles.copyIconImg} resizeMode="contain" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Code input + Copy button */}
              <View style={styles.copyFieldWrap}>
                <TextInput
                  style={[styles.copyFieldInput, { color: themeColors.text }]}
                  value={referCode ?? ""}
                  editable={false}
                  placeholder="Referral code"
                  placeholderTextColor={themeColors.secondaryText}
                />
                <TouchableOpacity
                  style={[styles.copyBtn, { backgroundColor: isDark ? colors.overlayColor : "#EEE" }]}
                  onPress={() => copyToClipboard(referCode)}
                >
                  <AppText type={TWELVE} weight={SEMI_BOLD} color={isDark ? colors.white : colors.black}>
                    {isCopied ? "Copied!" : "Copy"}
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>
           

            {/* More Referral Events */}
            <View style={styles.eventsSection}>

              <Carousel
                loop
                width={CONTENT_WIDTH}
                height={250}
                autoPlay
                autoPlayInterval={3500}
                data={referralEvents}
                scrollAnimationDuration={400}
                onSnapToItem={(index) => setCurrentSlide(index)}
                renderItem={({ item: event }) => (
                  <View style={[styles.eventCard, { width: CONTENT_WIDTH }]}>
                    <View style={[styles.eventCardInner, { backgroundColor: isDark ? 'transparent' : "#FFFFFF", borderColor: isDark ? themeColors.border : "#EEE", borderWidth: 1 }]}>
                      <FastImage
                        source={event.image}
                        resizeMode="contain"
                        style={styles.eventCardImage}
                      />
                      <AppText style={[styles.eventCardTitle, { color: themeColors.text }]} weight={SEMI_BOLD}>
                        {event.title}
                      </AppText>
                      <AppText
                        type={TWELVE}
                        color={themeColors.secondaryText}
                        style={styles.eventCardDesc}
                      >
                        {event.description}
                      </AppText>
                      <TouchableOpacity
                        style={[styles.inviteNowBtn, { backgroundColor: colors.buttonBg }]}
                        onPress={() => copyToClipboard(referralLink)}
                      >
                        <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: colors.white }}>
                          Invite Now
                        </AppText>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                style={styles.eventsCarousel}
              />
              <View style={styles.dotsRow}>
                {referralEvents.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      currentSlide === index && [styles.dotActive, { backgroundColor: isDark ? colors.white : colors.buttonBg }],
                    ]}
                  />
                ))}
              </View>
            </View>
            {/* How to Refer and Earn Rewards */}

            <View style={styles.howToSection}>
              <AppText style={[styles.sectionTitle, { color: themeColors.text }]} weight={SEMI_BOLD}>
                How to Refer and Earn Rewards
              </AppText>
              {howToReferSteps.map((step, index) => (
                <View key={index} style={styles.howToItem}>
                  <FastImage
                    tintColor={themeColors.secondaryText}
                    source={step.icon}
                    style={styles.howToIconImg}
                    resizeMode="contain"
                  />
                  <View style={styles.howToContent}>
                    <AppText style={[styles.howToTitle, { color: themeColors.text }]} weight={SEMI_BOLD}>
                      {step.title}
                    </AppText>
                    <AppText type={TWELVE} color={themeColors.secondaryText}>
                      {step.desc}
                    </AppText>
                  </View>
                </View>
              ))}
            </View>



            {/* Referral History (new web-like UI) */}
            <View style={styles.historySection}>
              <View style={styles.rhHeaderRow}>
                <View style={styles.rhIntro}>
                  <AppText style={[styles.rhTitle, { color: isDark ? colors.white : themeColors.text }]} weight={SEMI_BOLD}>
                    Referral History
                  </AppText>
                  <AppText type={TWELVE} style={{ color: isDark ? "rgba(255,255,255,0.65)" : themeColors.secondaryText }}>
                    Explore your referral network, track earnings and view levels.
                  </AppText>
                </View>

                <View style={styles.rhControls}>
                  <View style={[styles.rhSearchBar, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#F3F4F6", borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)" }]}>
                    <FastImage
                      tintColor={isDark ? "rgba(255,255,255,0.70)" : "rgba(0,0,0,0.55)"}
                      source={searchIcon}
                      style={styles.rhSearchIcon}
                      resizeMode="contain"
                    />
                    <TextInput
                      style={[styles.rhSearchInput, { color: isDark ? colors.white : colors.black }]}
                      placeholder="Search name or ID"
                      placeholderTextColor={isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)"}
                      value={searchTerm}
                      onChangeText={setSearchTerm}
                    />
                  </View>
                </View>
              </View>

              {filteredList?.length > 0 && (
                <View style={styles.rhSummaryGrid}>
                  <View style={[styles.rhStatCard, { backgroundColor: isDark ? themeColors.themeElevationColor : "#FFFFFF" }]}>
                    <AppText
                      type={TWELVE}
                      style={[styles.rhStatLabel, { color: isDark ? "rgba(255,255,255,0.60)" : "rgba(0,0,0,0.55)" }]}
                    >
                      TOTAL REFERRALS
                    </AppText>
                    <AppText weight={SEMI_BOLD} style={[styles.rhStatValue, { color: isDark ? colors.white : "#111827" }]}>
                      {summaryStats.totalReferrals}
                    </AppText>
                    <AppText
                      type={TWELVE}
                      style={[styles.rhStatHint, { color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)" }]}
                    >
                      Direct from your code
                    </AppText>
                  </View>
                  <View style={[styles.rhStatCard, { backgroundColor: isDark ? themeColors.themeElevationColor : "#FFFFFF" }]}>
                    <AppText
                      type={TWELVE}
                      style={[styles.rhStatLabel, { color: isDark ? "rgba(255,255,255,0.60)" : "rgba(0,0,0,0.55)" }]}
                    >
                      VERIFIED USERS
                    </AppText>
                    <AppText weight={SEMI_BOLD} style={[styles.rhStatValue, { color: "#22C55E" }]}>{summaryStats.verifiedUsers}</AppText>
                    <AppText
                      type={TWELVE}
                      style={[styles.rhStatHint, { color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)" }]}
                    >
                      KYC completed
                    </AppText>
                  </View>
                  <View style={[styles.rhStatCard, { backgroundColor: isDark ? themeColors.themeElevationColor : "#FFFFFF" }]}>
                    <AppText
                      type={TWELVE}
                      style={[styles.rhStatLabel, { color: isDark ? "rgba(255,255,255,0.60)" : "rgba(0,0,0,0.55)" }]}
                    >
                      TOTAL EARNINGS
                    </AppText>
                    <AppText weight={SEMI_BOLD} style={[styles.rhStatValue, { color: "#22C55E" }]}>
                      {summaryStats.totalEarned} {summaryStats.earnSymbol}
                    </AppText>
                    <AppText
                      type={TWELVE}
                      style={[styles.rhStatHint, { color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)" }]}
                    >
                      From all levels
                    </AppText>
                  </View>
                  <View style={[styles.rhStatCard, { backgroundColor: isDark ? themeColors.themeElevationColor : "#FFFFFF" }]}>
                    <AppText
                      type={TWELVE}
                      style={[styles.rhStatLabel, { color: isDark ? "rgba(255,255,255,0.60)" : "rgba(0,0,0,0.55)" }]}
                    >
                      PENDING REWARDS
                    </AppText>
                    <AppText weight={SEMI_BOLD} style={[styles.rhStatValue, { color: "#F59E0B" }]}>{summaryStats.pendingKyc}</AppText>
                    <AppText
                      type={TWELVE}
                      style={[styles.rhStatHint, { color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)" }]}
                    >
                      Direct refs awaiting KYC
                    </AppText>
                  </View>
                </View>
              )}

              {filteredList?.length > 0 ? (
                <View style={styles.rhListShell}>
                  {filteredList.map((rootItem, rootIndex) => {
                    const rk = referralRowKey(rootItem) ?? `${rootIndex}`;
                    const pid = parentIdForDownline(rootItem);
                    const pidStr = pid != null ? String(pid) : null;
                    const showCh = canExpandNode(rootItem);
                    const isEx = pidStr ? expandedNodeIds.has(pidStr) : false;
                    const dLoad = pidStr ? !!downlineLoading?.[pidStr] : false;
                    const dErr = pidStr ? downlineError?.[pidStr] : null;
                    const rootBodyIndent = 14 + 6 + (showCh ? 26 + 6 : 0) + 34 + 6;

                    const renderChildRows = (items, depth = 1) => {
                      return (items || []).map((child, childIdx) => {
                        const crk = referralRowKey(child) ?? `${rk}-c-${childIdx}`;
                        const cpid = parentIdForDownline(child);
                        const cpidStr = cpid != null ? String(cpid) : null;
                        const cShowCh = canExpandNode(child);
                        const cIsEx = cpidStr ? expandedNodeIds.has(cpidStr) : false;
                        const cLoad = cpidStr ? !!downlineLoading?.[cpidStr] : false;
                        const cErr = cpidStr ? downlineError?.[cpidStr] : null;
                        const displayName = getDisplayName(child);
                        const displayId = getDisplayId(child);
                        const joinDate = getJoinDate(child);
                        const kyc = getKycStatus(child);
                        const kycOk = isKycVerifiedUser(child);
                        const earnedStr = formatEarningForRow(crk);
                        const hasEarned = earnedStr !== "—";
                        const em = earningsMetaForKey(crk);
                        const levelNum = em.maxLevel > 0 ? em.maxLevel : Math.min(12, depth + 1);

                        const childChildren = cpidStr ? downlineByParent?.[cpidStr] : null;

                        return (
                          <View
                            key={`sub-${crk}-${depth}-${childIdx}`}
                            style={[styles.rhChildRowCard, { marginLeft: Math.min(depth * 18, 54) }]}
                          >
                            <View style={styles.rhChildTopRow}>
                              {cShowCh ? (
                                <TouchableOpacity
                                  onPress={() => toggleNodeExpanded(child)}
                                  disabled={cLoad}
                                  style={[
                                    styles.rhExpandBtn,
                                    { backgroundColor: isDark ? "rgba(0,0,0,0.04)" : "rgba(0,0,0,0.03)" },
                                  ]}
                                >
                                  {cLoad ? (
                                    <ActivityIndicator
                                      size="small"
                                      color={isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.55)"}
                                    />
                                  ) : (
                                    <AppText
                                      style={[
                                        styles.rhExpandIcon,
                                        { color: isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.55)" },
                                        cIsEx && { transform: [{ rotate: "90deg" }] },
                                      ]}
                                    >
                                      ›
                                    </AppText>
                                  )}
                                </TouchableOpacity>
                              ) : (
                                <View style={{ width: 26 }} />
                              )}

                              <View style={styles.rhAvatar}>
                                <AppText weight={SEMI_BOLD} type={TWELVE} style={{ color: colors.white }}>
                                  {getInitials(child)}
                                </AppText>
                              </View>

                              <View style={styles.rhRowMain}>
                                <AppText
                                  weight={SEMI_BOLD}
                                  style={[styles.rhName, { color: isDark ? colors.white : "#111827" }]}
                                  numberOfLines={1}
                                >
                                   {displayName}
                                </AppText>
                                <AppText
                                  type={TWELVE}
                                  style={[
                                    styles.rhMeta,
                                    { color: isDark ? "rgba(255,255,255,0.60)" : "rgba(0,0,0,0.55)" },
                                  ]}
                                  numberOfLines={1}
                                >
                                  ID {displayId}
                                </AppText>
                              </View>

                              {hasEarned ? (
                                <View style={{ marginRight:20 }}>
                                  <View
                                    style={[
                                      styles.rhEarnPill,
                                      { backgroundColor: "rgba(34,197,94,0.10)", borderColor: "rgba(34,197,94,0.22)" },
                                    ]}
                                  >
                                    <AppText type={TWELVE} numberOfLines={1} style={{ color: "#16A34A" }}>
                                      +{earnedStr}
                                    </AppText>
                                  </View>
                                </View>
                              ) : null}
                            </View>

                            <View style={styles.rhChildBody}>
                              <AppText
                                type={TWELVE}
                                style={{ color: isDark ? "rgba(255,255,255,0.60)" : "rgba(0,0,0,0.55)" }}
                              >
                                Joined {joinDate}
                              </AppText>

                              <View style={styles.rhChildBadgesRow}>
                                <View style={[styles.rhBadge, kycOk ? styles.rhBadgeVerified : styles.rhBadgeKycPending]}>
                                  <AppText
                                    type={TWELVE}
                                    style={kycOk ? styles.rhBadgeTextVerified : styles.rhBadgeTextPending}
                                  >
                                    {kycOk ? "Verified" : `KYC ${String(kyc).toUpperCase()}`}
                                  </AppText>
                                </View>
                                <View style={[styles.rhBadge, styles.rhBadgeLvl]}>
                                  <AppText type={TWELVE} style={styles.rhBadgeTextLvl}>
                                    L{Number(levelNum) || 1}
                                  </AppText>
                                </View>
                              </View>
                            </View>

                            {cErr ? (
                              <AppText type={TWELVE} style={{ color: "#DC2626", marginTop: 6 }}>
                                {cErr}
                              </AppText>
                            ) : null}

                            {cIsEx && Array.isArray(childChildren) && childChildren.length > 0 ? (
                              <View style={{ width: "100%", marginTop: 8 }}>
                                {renderChildRows(childChildren, depth + 1)}
                              </View>
                            ) : null}
                          </View>
                        );
                      });
                    };

                    const rootDisplayName = getDisplayName(rootItem);
                    const rootDisplayId = getDisplayId(rootItem);
                    const rootJoinDate = getJoinDate(rootItem);
                    const rootKyc = getKycStatus(rootItem);
                    const rootKycOk = isKycVerifiedUser(rootItem);
                    const rootEarnedStr = formatEarningForRow(rk);
                    const rootHasEarned = rootEarnedStr !== "—";
                    const rem = earningsMetaForKey(rk);
                    const rootLevelNum = rem.maxLevel > 0 ? rem.maxLevel : 1;
                    const rootChildren = pidStr ? downlineByParent?.[pidStr] : null;

                    return (
                      <View
                        key={`root-${rk}-${rootIndex}`}
                        style={[
                          styles.rhRowCard,
                          {
                            borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)",
                            backgroundColor: isDark ? themeColors.themeElevationColor : "#FFFFFF",
                          },
                        ]}
                      >
                        <View style={styles.rhRowLeftBar} />
                        <View style={styles.rhRowInner}>
                          <View style={styles.rhTopRow}>
                            <AppText
                              type={TWELVE}
                              style={[
                                styles.rhRowSno,
                                { color: isDark ? "rgba(255,255,255,0.60)" : "rgba(0,0,0,0.45)" },
                              ]}
                            >
                              {rootIndex + 1}
                            </AppText>
                            {showCh ? (
                              <TouchableOpacity
                                onPress={() => toggleNodeExpanded(rootItem)}
                                disabled={dLoad}
                                style={[
                                  styles.rhExpandBtn,
                                  { backgroundColor: isDark ? "rgba(0,0,0,0.04)" : "rgba(0,0,0,0.03)" },
                                ]}
                              >
                                {dLoad ? (
                                  <ActivityIndicator size="small" color={isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.55)"} />
                                ) : (
                                  <AppText
                                    style={[
                                      styles.rhExpandIcon,
                                      { color: isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.55)" },
                                      isEx && { transform: [{ rotate: "90deg" }] },
                                    ]}
                                  >
                                    ›
                                  </AppText>
                                )}
                              </TouchableOpacity>
                            ) : null}
                            <View style={styles.rhAvatar}>
                              <AppText weight={SEMI_BOLD} type={TWELVE} style={{ color: colors.white }}>
                                {getInitials(rootItem)}
                              </AppText>
                            </View>
                            <View style={styles.rhRowMain}>
                              <AppText
                                weight={SEMI_BOLD}
                                style={[styles.rhName, { color: isDark ? colors.white : "#111827" }]}
                                numberOfLines={2}
                              >
                                {rootDisplayName}
                              </AppText>
                              <AppText
                                type={TWELVE}
                                style={[styles.rhMeta, { color: isDark ? "rgba(255,255,255,0.60)" : "rgba(0,0,0,0.55)" }]}
                                numberOfLines={2}
                              >
                                ID {rootDisplayId}
                              </AppText>
                            </View>
                            {rootHasEarned ? (
                              <View style={{ marginLeft: "auto", flexShrink: 0 }}>
                                <View style={[styles.rhEarnPill, { backgroundColor: "rgba(34,197,94,0.10)", borderColor: "rgba(34,197,94,0.22)" }]}>
                                  <AppText type={TWELVE} numberOfLines={1} style={{ color: "#16A34A" }}>
                                    +{rootEarnedStr}
                                  </AppText>
                                </View>
                              </View>
                            ) : null}
                          </View>

                          <View style={[styles.rhBody, { paddingLeft: rootBodyIndent }]}>
                            <AppText
                              type={TWELVE}
                              style={[styles.rhMeta2, { color: isDark ? "rgba(255,255,255,0.60)" : "rgba(0,0,0,0.55)" }]}
                            >
                              Joined {rootJoinDate}
                            </AppText>
                            <View style={styles.rhBadgesRow}>
                              <View style={[styles.rhBadge, rootKycOk ? styles.rhBadgeVerified : styles.rhBadgeKycPending]}>
                                <AppText
                                  type={TWELVE}
                                  style={rootKycOk ? styles.rhBadgeTextVerified : styles.rhBadgeTextPending}
                                >
                                  {rootKycOk ? "Verified" : `KYC ${String(rootKyc).toUpperCase()}`}
                                </AppText>
                              </View>
                              <View style={[styles.rhBadge, styles.rhBadgeLvl]}>
                                <AppText type={TWELVE} style={styles.rhBadgeTextLvl}>
                                  L{Number(rootLevelNum) || 1}
                                </AppText>
                              </View>
                            </View>
                          </View>
                          {dErr ? (
                            <AppText type={TWELVE} style={{ color: "#DC2626", marginTop: 6 }}>
                              {dErr}
                            </AppText>
                          ) : null}

                          {isEx ? (
                            <View style={styles.rhChildrenWrap}>
                              {Array.isArray(rootChildren) && rootChildren.length > 0 ? (
                                renderChildRows(rootChildren, 1)
                              ) : dLoad ? (
                                <View style={{ paddingVertical: 10 }}>
                                  <ActivityIndicator color={isDark ? "rgba(255,255,255,0.70)" : "rgba(0,0,0,0.45)"} />
                                </View>
                              ) : null}
                            </View>
                          ) : null}
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.noDataWrap}>
                  <FastImage source={isDark ? NO_NOTIFICATION_ICON : NO_NOTIFICATION_ICON_LIGHT} style={{ width: 80, height: 80 }} resizeMode="contain" />
               
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </KeyBoardAware>
    </AppSafeAreaView>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    marginTop: 20,
    gap: 20,
    marginHorizontal: CONTENT_PADDING,
    alignItems: "center",
  },
  backIcon: { width: 20, height: 20 },
  tabsRow: {
    flexDirection: "row",
    marginTop: 20,
    marginHorizontal: CONTENT_PADDING,
    gap: 20,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  contentBlock: {
    marginHorizontal: CONTENT_PADDING,
    paddingTop: 4,
    paddingBottom: 0,
    marginTop: 10
  },
  card: {
    marginHorizontal: CONTENT_PADDING,
    marginTop: 4,
    padding: 16,
    backgroundColor: "transparent",
    borderRadius: 12,
  },
  cardTitle: { fontSize: 14, marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: colors.white, marginBottom: 2 },
  cardDesc: { fontSize: 12, marginBottom: 12 },
  refRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  refLabelRow: { flexDirection: "row", alignItems: "center", flex: 0.4 },
  refIconImg: { width: 13, height: 13, marginRight: 6, tintColor: colors.secondaryText },
  copyIconImg: { width: 15, height: 15, },
  refValueRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 0.6,
    gap: 8,
  },
  refValue: { flex: 1 },
  copyFieldWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.dividerColor,
    borderRadius: 10,
    marginTop: 8,
    overflow: "hidden",
  },
  copyFieldInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: colors.white,
    fontSize: 12,
  },
  copyBtn: {
    backgroundColor: "transparent",
    paddingVertical: 12,
    paddingHorizontal: 20,
    right: 5,
    borderRadius: 5
  },
  bannerWrap: {
    marginHorizontal: CONTENT_PADDING,
    marginTop: 16,
    backgroundColor: "transparent",
    borderRadius: 12,
  },
  bannerImage: {
    width: CONTENT_WIDTH,
    height: Math.round(CONTENT_WIDTH * 0.55),
  },
  howToSection: {
    marginHorizontal: CONTENT_PADDING,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    color: colors.white,
    marginBottom: 12,
  },
  howToItem: {
    flexDirection: "row",
    marginBottom: 14,
  },
  howToIconImg: { width: 20, height: 20, marginRight: 10 },
  howToContent: { flex: 1 },
  howToTitle: { fontSize: 12, color: colors.white, marginBottom: 2 },
  eventsSection: { marginTop: 24, marginHorizontal: CONTENT_PADDING },
  eventsCarousel: { width: CONTENT_WIDTH, marginTop: 8 },
  eventCard: {
    paddingHorizontal: 0,
    backgroundColor: "transparent",
    justifyContent: "center",

  },
  eventCardInner: {
    borderRadius: 12,
    padding: 16,
  },
  eventCardImage: {
    width: "100%",
    height: 100,
    marginBottom: 12,
  },
  eventCardTitle: { fontSize: 13, color: colors.white, marginBottom: 4 },
  eventCardDesc: { fontSize: 12, marginBottom: 8 },
  inviteNowBtn: {
    alignSelf: "flex-start",
    backgroundColor: "transparent",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  dotActive: { backgroundColor: colors.white },
  historySection: { marginHorizontal: CONTENT_PADDING, marginTop: 24, paddingBottom: 24 },
  rhHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 14,
  },
  rhIntro: { flexGrow: 1, flexShrink: 1, minWidth: 220 },
  rhTitle: { fontSize: 18, marginBottom: 4 },
  rhControls: { flexShrink: 0 },
  rhSearchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 42,
    width: 190,
  },
  rhSearchIcon: { width: 18, height: 18, marginRight: 8 },
  rhSearchInput: { flex: 1, fontSize: 12, paddingVertical: 0 },

  rhSummaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 14,
  },
  rhStatCard: {
    width: (CONTENT_WIDTH - 12) / 2,
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  rhStatLabel: { fontSize: 11, color: "rgba(0,0,0,0.55)", letterSpacing: 0.8 },
  rhStatValue: { fontSize: 22, marginTop: 8, color: "#111827" },
  rhStatHint: { marginTop: 6, fontSize: 11, color: "rgba(0,0,0,0.45)" },

  rhListShell: {
    gap: 10,
  },
  rhRowCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    flexDirection: "row",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  rhRowCardChild: {
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  rhRowInner: {
    flex: 1,
    flexDirection: "column",
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 6,
  },
  rhTopRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  rhRowLeftBar: {
    width: 3,
    height: "100%",
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    backgroundColor: "#2563EB",
  },
  rhRowLeftBarChild: { backgroundColor: "rgba(37,99,235,0.30)" },
  rhRowSno: { width: 14, textAlign: "center", color: "rgba(0,0,0,0.45)" },
  rhRowSnoSpacer: { width: 14 },
  rhAvatar: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#1D4ED8",
    alignItems: "center",
    justifyContent: "center",
  },
  rhRowMain: { flex: 1, minWidth: 0 },
  rhName: { color: "#111827" },
  rhMeta: { marginTop: 2, color: "rgba(0,0,0,0.55)" },
  // Secondary lines indentation is set per-row (depends on expand arrow)
  rhMeta2: { color: "rgba(0,0,0,0.55)" },
  rhBody: { gap: 6, marginTop: 6 },
  rhBadgesRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
  rhBadges: { flexDirection: "row", alignItems: "center", gap: 8 },
  rhBadge: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1 },
  rhBadgeVerified: { backgroundColor: "rgba(34,197,94,0.12)", borderColor: "rgba(34,197,94,0.22)" },
  rhBadgeTextVerified: { color: "#16A34A" },
  rhBadgeKycPending: { backgroundColor: "rgba(245,158,11,0.14)", borderColor: "rgba(245,158,11,0.26)" },
  rhBadgeTextPending: { color: "#B45309" },
  rhBadgeLvl: { backgroundColor: "rgba(37,99,235,0.10)", borderColor: "rgba(37,99,235,0.20)" },
  rhBadgeTextLvl: { color: "#2563EB" },
  rhExpandBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  rhExpandIcon: { fontSize: 18, color: "rgba(0,0,0,0.55)", lineHeight: 18 },
  rhEarnPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    maxWidth: 120,
    alignSelf: "flex-start",
  },
  rhChildrenWrap: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
  },
  rhChildRowCard: {
    width: "100%",
    paddingVertical: 8,
  },
  rhChildTopRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  rhChildBody: { paddingLeft: 26 + 6 + 34 + 6, gap: 6, marginTop: 6 },
  rhChildBadgesRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  noDataWrap: {
    paddingVertical: 24,
    alignItems: "center",
  },
});

export default RefferalReward;
