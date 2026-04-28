import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ImageBackground, Linking, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import FastImage from "react-native-fast-image";
import LinearGradient from "react-native-linear-gradient";
import { useTheme } from "../../hooks/useTheme";
import { appOperation } from "../../appOperation";
import NavigationService from "../../navigation/NavigationService";
import { LOGIN_SCREEN, REGISTER_SCREEN } from "../../navigation/routes";
import {
  AppSafeAreaView,
  AppText,
  ELEVEN,
  FOURTEEN,
  MEDIUM,
  SEMI_BOLD,
  SIXTEEN,
  TEN,
  TWELVE,
  YELLOW,
} from "../../shared";
import KeyBoardAware from "../../shared/components/KeyboardAware";
import { airdrop_bnr_img, airdrop_stats_icon, airdrop_stats_icon2, airdrop_stats_icon3, airdrop_stats_icon4, back_ic, bonusbg, giftIc, instaIcon, LOCK_ICON, telegramIcon, tokenlock, twitterIcon } from "../../helper/ImageAssets";
import { colors } from "../../theme/colors";
import { showError, showSuccess } from "../../helper/logger";
import { USER_TOKEN_KEY } from "../../helper/Constants";

const SOCIAL_DEFAULT_LABELS: Record<number, string> = {
  1: "Open X",
  2: "Open Telegram",
  3: "Open Instagram",
};

const SOCIAL_LINK_FALLBACK: Record<number, string> = {
  1: "https://x.com",
  2: "https://t.me/+VD32TwJiXQMyY2E1",
  3: "https://www.instagram.com",
};

const stepNumBg = ["#FF4FA3", "#3FA9FF", "#36D399"];

const GUEST_STEPS = [
  {
    n: 1,
    title: "Follow on Social Media",
    body: "Follow our official pages and stay updated with campaign tasks and announcements.",
  },
  {
    n: 2,
    title: "Join Telegram",
    body: "Join our community and complete simple tasks to unlock higher reward tiers.",
  },
  {
    n: 3,
    title: "Connect & Claim Tokens",
    body: "Connect your account, verify tasks, and claim your token rewards instantly.",
  },
];

const normalizeSocialUrl = (v: any) => {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s || s === "null" || s === "undefined") return null;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("www.")) return `https://${s}`;
  return null;
};

function getSocialUrlFromOtherSettings(settings: any, taskNum: number) {
  if (!settings) return null;
  const n = String(taskNum);
  const i = taskNum - 1;

  for (const name of ["socialLinks", "social_links", "airdropSocialLinks"]) {
    const arr = settings[name];
    if (Array.isArray(arr) && arr[i] != null) {
      const u = normalizeSocialUrl(arr[i]);
      if (u) return u;
    }
  }

  const keyCandidates = [
    `socialTask${n}Link`,
    `socialTask${n}`,
    `socialLink${n}`,
    `social_link_${n}`,
    `social_task_${n}_url`,
    `social_task_${n}_link`,
    `social_task_${n}`,
    `url${n}`,
    `link${n}`,
  ];
  for (const k of keyCandidates) {
    const u = normalizeSocialUrl(settings[k]);
    if (u) return u;
  }

  if (n === "1") {
    const u = normalizeSocialUrl(settings.twitterUrl) || normalizeSocialUrl(settings.xUrl);
    if (u) return u;
  }
  if (n === "2") {
    const u = normalizeSocialUrl(settings.telegramUrl) || normalizeSocialUrl(settings.telegram);
    if (u) return u;
  }
  if (n === "3") {
    const u = normalizeSocialUrl(settings.instagramUrl) || normalizeSocialUrl(settings.instagram);
    if (u) return u;
  }
  return null;
}

const formatRewardAmount = (value: any, currencyShortName?: any) => {
  if (value == null || Number.isNaN(Number(value))) return "—";
  const n = Number(value);
  const ccy =
    currencyShortName != null && String(currencyShortName).trim() !== ""
      ? ` ${String(currencyShortName).trim()}`
      : "";
  return `${n.toLocaleString()}${ccy}`;
};

const AirDropScreen = () => {
  const { colors: themeColors, isDark } = useTheme();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [taskSubmitting, setTaskSubmitting] = useState<number | null>(null);
  const [otherSettings, setOtherSettings] = useState<any>(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [rewardStatusLoading, setRewardStatusLoading] = useState(false);
  const [referralRewardStatus, setReferralRewardStatus] = useState<any>(null);

  const syncLogin = useCallback(async () => {
    try {
      const t = await AsyncStorage.getItem(USER_TOKEN_KEY);
      setIsLoggedIn(!!t);
    } catch {
      setIsLoggedIn(false);
    }
  }, []);

  const fetchOtherSettings = useCallback(async () => {
    try {
      const res: any = await appOperation.customer.get_other_settings();
      if (res?.success && res?.data) setOtherSettings(res.data);
    } catch {
      // ignore
    } finally {
      setSettingsLoaded(true);
    }
  }, []);

  const fetchReferralRewardStatus = useCallback(async () => {
    try {
      setRewardStatusLoading(true);
      const res: any = await appOperation.customer.get_referral_reward_status();
      if (res?.success && res?.data) setReferralRewardStatus(res.data);
    } catch {
      // ignore
    } finally {
      setRewardStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    syncLogin();
  }, [syncLogin]);

  useEffect(() => {
    fetchOtherSettings();
  }, [fetchOtherSettings]);

  useEffect(() => {
    if (!isLoggedIn) return;
    fetchReferralRewardStatus();
  }, [isLoggedIn, fetchReferralRewardStatus]);

  const ccy = otherSettings?.currencyShortName;

  const signupDisplay = useMemo(
    () => formatRewardAmount(otherSettings?.signupBonus, ccy),
    [otherSettings?.signupBonus, ccy]
  );

  const referralTotal = useMemo(() => {
    if (!otherSettings) return null;
    const a = otherSettings.level1Reward;
    const b = otherSettings.level2Reward;
    const c = otherSettings.level3Reward;
    if (a == null && b == null && c == null) return null;
    const s = (Number(a) || 0) + (Number(b) || 0) + (Number(c) || 0);
    return s;
  }, [otherSettings]);

  const referralTotalDisplay = useMemo(
    () => formatRewardAmount(referralTotal, ccy),
    [referralTotal, ccy]
  );

  const level1Display = useMemo(
    () => formatRewardAmount(otherSettings?.level1Reward, ccy),
    [otherSettings?.level1Reward, ccy]
  );
  const level2Display = useMemo(
    () => formatRewardAmount(otherSettings?.level2Reward, ccy),
    [otherSettings?.level2Reward, ccy]
  );
  const level3Display = useMemo(
    () => formatRewardAmount(otherSettings?.level3Reward, ccy),
    [otherSettings?.level3Reward, ccy]
  );

  const isTaskComplete = useCallback(
    (taskNum: number) => {
      if (referralRewardStatus?.socialTasksCompleted) return true;
      const done = referralRewardStatus?.referral_social_tasks;
      if (!Array.isArray(done)) return false;
      return done.map(Number).includes(Number(taskNum));
    },
    [referralRewardStatus]
  );

  const socialProgress = useMemo(() => {
    if (referralRewardStatus?.socialTasksCompleted) {
      return { done: 3, total: 3, pct: 100 };
    }
    const list = referralRewardStatus?.referral_social_tasks;
    const done = Array.isArray(list) ? list.length : 0;
    const total = 3;
    return {
      done,
      total,
      pct: total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0,
    };
  }, [referralRewardStatus]);

  const getLinkForTask = useCallback(
    (taskNum: number) => {
      const fromApi = getSocialUrlFromOtherSettings(otherSettings, taskNum);
      const href = fromApi || SOCIAL_LINK_FALLBACK[taskNum] || "#";
      return {
        href,
        label: SOCIAL_DEFAULT_LABELS[taskNum] || "Open link",
      };
    },
    [otherSettings]
  );

  const buildPreferredAppUrls = useCallback((normalizedHttpsUrl: string) => {
    try {
      const u = new URL(normalizedHttpsUrl);
      const host = (u.hostname || "").replace(/^www\./, "").toLowerCase();
      const path = (u.pathname || "").replace(/^\/+/, "");
      const seg1 = path.split("/")[0] || "";

      // Telegram
      if (host === "t.me" || host === "telegram.me") {
        // join links: https://t.me/+INVITE or https://t.me/joinchat/INVITE
        if (seg1 === "joinchat") {
          const invite = (path.split("/")[1] || "").trim();
          if (invite) return [`tg://join?invite=${invite}`, normalizedHttpsUrl];
        }
        if (seg1.startsWith("+")) {
          const invite = seg1.slice(1).trim();
          if (invite) return [`tg://join?invite=${invite}`, normalizedHttpsUrl];
        }
        if (seg1) return [`tg://resolve?domain=${seg1}`, normalizedHttpsUrl];
      }

      // X / Twitter
      if (host === "x.com" || host === "twitter.com") {
        // Try to open profile in app if URL looks like /username
        if (seg1 && !["home", "i", "share", "intent", "search", "explore"].includes(seg1)) {
          return [`twitter://user?screen_name=${seg1}`, normalizedHttpsUrl];
        }
      }

      // Instagram
      if (host === "instagram.com") {
        if (seg1 && !["p", "reel", "tv", "explore"].includes(seg1)) {
          return [`instagram://user?username=${seg1}`, normalizedHttpsUrl];
        }
      }
    } catch {
      // ignore
    }
    return [normalizedHttpsUrl];
  }, []);

  const openLink = useCallback(async (href: string) => {
    if (!href || href === "#") return;
    try {
      const trimmed = String(href).trim();
      const normalized =
        trimmed.startsWith("http://") || trimmed.startsWith("https://")
          ? trimmed
          : `https://${trimmed.replace(/^\/+/, "")}`;

      const candidates = buildPreferredAppUrls(normalized);
      let lastErr: any = null;
      for (const url of candidates) {
        try {
          await Linking.openURL(url);
          return;
        } catch (e) {
          lastErr = e;
        }
      }
      throw lastErr;
    } catch {
      showError("Could not open link");
    }
  }, [buildPreferredAppUrls]);

  const handleCompleteTask = useCallback(
    async (taskNum: number) => {
      if (!isLoggedIn) return;
      setTaskSubmitting(taskNum);
      try {
        const res: any = await appOperation.customer.complete_referral_social_task(taskNum);
        if (res?.success) {
          showSuccess(res?.message || "Task recorded");
          await fetchReferralRewardStatus();
        } else {
          showError(res?.message || "Could not update task");
        }
      } catch (e: any) {
        showError(e?.message || "Could not update task. Try again.");
      } finally {
        setTaskSubmitting(null);
      }
    },
    [isLoggedIn, fetchReferralRewardStatus]
  );

  const SocialIcon = ({ n }: { n: number }) => {
    const src = n === 1 ? twitterIcon : n === 2 ? telegramIcon : instaIcon;
    return <FastImage source={src} style={{ width: 18, height: 18 }} resizeMode="contain" />;
  };

  const rewardText = useMemo(() => {
    if (isDark) {
      return {
        cardBg: "#1C2230",
        title: "#FFFFFF",
        desc: "rgba(255,255,255,0.70)",
        level: "rgba(255,255,255,0.80)",
        amount: "#7DB3FF",
        tick: "#22C55E",
      };
    }
    return {
      cardBg: "#FFFFFF",
      title: "#0B0F1A",
      desc: "rgba(0,0,0,0.55)",
      level: "rgba(0,0,0,0.70)",
      amount: "#5AA8FF",
      tick: "#22C55E",
    };
  }, [isDark]);

  const releaseText = useMemo(() => {
    if (isDark) {
      return {
        title: "rgba(255,255,255,0.75)",
        strong: "#FFFFFF",
        sub: "rgba(255,255,255,0.72)",
        sub2: "rgba(255,255,255,0.48)",
      };
    }
    return {
      title: "rgba(0,0,0,0.55)",
      strong: "#0B0F1A",
      sub: "rgba(0,0,0,0.55)",
      sub2: "rgba(0,0,0,0.35)",
    };
  }, [isDark]);

  const stepCardGradient = useCallback(
    (n: number, done?: boolean) => {
      if (isDark) {
        return done
          ? ["#16241B", "#0F1712"]
          : n === 1
            ? ["#1A1730", "#10121B"]
            : n === 2
              ? ["#10233D", "#0C1624"]
              : ["#10261A", "#0B140F"];
      }
      // Light (match website mobile): task 1 = purple tint, task 2/3 = mint tint
      if (done) return ["#EAF6EE", "#F7FBF8"];
      if (n === 1) return ["#EEF2FF", "#FFFFFF"];
      if (n === 2) return ["#EAF6EE", "#FFFFFF"];
      return ["#EAF6EE", "#FFFFFF"];
    },
    [isDark]
  );

  return (
    <AppSafeAreaView style={{ backgroundColor: isDark ? "#000000" : themeColors.background, flex: 1 }}>
      <KeyBoardAware>
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
            Airdrop
          </AppText>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <LinearGradient
            colors={
              isDark
                ? ["#0B1020", colors.black, colors.black]
                : ["#FFFFFF", "#E6D5FF", "#CFE3FF"]
            }
            start={{ x: 0.15, y: 0 }}
            end={{ x: 0.85, y: 1 }}
            style={[
              styles.hero,
              { borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)" },
            ]}
          >
            <View style={styles.heroOverlay}>
              <AppText weight={SEMI_BOLD} style={styles.heroTitle} color={themeColors.text}>
                1000 TOKEN AIRDROP
              </AppText>
              <AppText type={TWELVE} color={themeColors.secondaryText} style={styles.heroSub}>
                Join early. Earn more. Be part of the future.
              </AppText>
              <AppText type={TWELVE} color={themeColors.secondaryText} style={styles.heroBody}>
                Complete simple tasks, follow our social channels, and earn up to 1000 tokens in our exclusive airdrop campaign.
              </AppText>

              {/* <View style={styles.heroActions}>
                <TouchableOpacity
                  style={[styles.heroPillBtn, { backgroundColor: colors.buttonBg, opacity: isLoggedIn ? 0.7 : 1 }]}
                  onPress={() => (isLoggedIn ? null : NavigationService.navigate(REGISTER_SCREEN))}
                  disabled={isLoggedIn}
                >
                  <AppText weight={SEMI_BOLD} type={TWELVE} style={{ color: colors.white }}>
                    Join Airdrop Now
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.heroPillBtn,
                    {
                      backgroundColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.04)",
                      borderWidth: 1,
                      borderColor: isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.08)",
                    },
                  ]}
                  onPress={() => (isLoggedIn ? null : NavigationService.navigate(LOGIN_SCREEN))}
                  disabled={isLoggedIn}
                >
                  <AppText weight={SEMI_BOLD} type={TWELVE} color={themeColors.text}>
                    How It Works
                  </AppText>
                </TouchableOpacity>
              </View> */}

              <View style={styles.joinedRow}>
                <View style={styles.joinedAvatars}>
                  <View style={[styles.joinedAvatar, { backgroundColor: "#8B5CF6" }]}><AppText type={TEN} weight={SEMI_BOLD} style={{ color: colors.white }}>A</AppText></View>
                  <View style={[styles.joinedAvatar, { backgroundColor: "#EC4899", marginLeft: -8 }]}><AppText type={TEN} weight={SEMI_BOLD} style={{ color: colors.white }}>B</AppText></View>
                  <View style={[styles.joinedAvatar, { backgroundColor: "#3B82F6", marginLeft: -8 }]}><AppText type={TEN} weight={SEMI_BOLD} style={{ color: colors.white }}>C</AppText></View>
                </View>
                <AppText type={TWELVE} color={themeColors.text} style={{ marginLeft: 10 }}>
                  <AppText type={TWELVE} weight={SEMI_BOLD} color={themeColors.text}>150+</AppText> people joined
                </AppText>
              </View>

              <FastImage source={airdrop_bnr_img} style={styles.heroImage} resizeMode="contain" />
            </View>
          </LinearGradient>

          {/* Stats (2x2 gradient cards like web mobile) */}
          <View style={styles.sectionPad}>
            <View style={styles.statsRow}>
              <LinearGradient colors={["#1B003A", "#1A1433"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statCardGrad}>
                <View style={styles.statIconMini}>
                  <FastImage source={airdrop_stats_icon} style={styles.statsIconImg} resizeMode="contain" />
                </View>
                <AppText weight={SEMI_BOLD} style={[styles.statValue, { color: "#B794F4" }]}>
                  {!settingsLoaded ? "…" : signupDisplay}
                </AppText>
                <AppText type={TEN} style={{ color: "rgba(255,255,255,0.75)" }}>
                  Signup Bonus
                </AppText>
              </LinearGradient>

              <LinearGradient colors={["#071A3A", "#061023"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statCardGrad}>
                <View style={styles.statIconMini}>
                  <FastImage source={airdrop_stats_icon2} style={styles.statsIconImg} resizeMode="contain" />
                </View>
                <AppText weight={SEMI_BOLD} style={[styles.statValue, { color: "#60A5FA" }]}>
                  50K+
                </AppText>
                <AppText type={TEN} style={{ color: "rgba(255,255,255,0.75)" }}>
                  Participants
                </AppText>
              </LinearGradient>
            </View>

            <View style={[styles.statsRow, { marginTop: 12 }]}>
              <LinearGradient colors={["#022A22", "#01221C"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statCardGrad}>
                <View style={styles.statIconMini}>
                  <FastImage source={airdrop_stats_icon3} style={styles.statsIconImg} resizeMode="contain" />
                </View>
                <AppText weight={SEMI_BOLD} style={[styles.statValue, { color: "#34D399" }]}>
                  Verified
                </AppText>
                <AppText type={TEN} style={{ color: "rgba(255,255,255,0.75)" }}>
                  Task System
                </AppText>
              </LinearGradient>

              <LinearGradient colors={["#2B1600", "#1E1200"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statCardGrad}>
                <View style={styles.statIconMini}>
                  <FastImage source={airdrop_stats_icon4} style={styles.statsIconImg} resizeMode="contain" />
                </View>
                <AppText weight={SEMI_BOLD} style={[styles.statValue, { color: "#F59E0B" }]}>
                  Free
                </AppText>
                <AppText type={TEN} style={{ color: "rgba(255,255,255,0.75)" }}>
                  Join in seconds
                </AppText>
              </LinearGradient>
            </View>
          </View>

          {/* Steps */}
          <View style={styles.sectionPad}>
            <AppText weight={SEMI_BOLD} type={FOURTEEN} color={themeColors.text} style={styles.sectionTitleCenter}>
              How To Join In <AppText weight={SEMI_BOLD} type={FOURTEEN} color={YELLOW}> 3 Easy Steps!</AppText>
            </AppText>

            {!isLoggedIn ? (
              <View style={{ marginTop: 12 }}>
                {GUEST_STEPS.map((s) => (
                  <LinearGradient
                    key={s.n}
                    colors={stepCardGradient(s.n, false)}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                      styles.stepCard,
                      { borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)" },
                    ]}
                  >
                    <View style={[styles.stepNum, { backgroundColor: stepNumBg[s.n - 1] || stepNumBg[0] }]}>
                      <AppText weight={SEMI_BOLD} type={TWELVE} style={{ color: colors.white }}>
                        {s.n}
                      </AppText>
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText weight={SEMI_BOLD} type={TWELVE} color={themeColors.text}>
                        {s.title}
                      </AppText>
                      <AppText type={ELEVEN} color={themeColors.secondaryText} style={{ marginTop: 4 }}>
                        {s.body}
                      </AppText>
                    </View>
                  </LinearGradient>
                ))}
              </View>
            ) : (
              <>
                <AppText type={ELEVEN} color={themeColors.secondaryText} style={[styles.sectionSubCenter, { marginTop: 10 }]}>
                  Open each link, then mark the task complete when you are done. Progress syncs to your account.
                </AppText>

                <LinearGradient
                  colors={isDark ? ["#1B2330", "#10151D"] : ["#F3F4F6", "#FFFFFF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.progressCard, { borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)" }]}
                >
                  <View style={styles.progressTop}>
                    <AppText type={TWELVE} weight={MEDIUM} color={themeColors.text}>
                      Task progress
                    </AppText>
                    <AppText type={TWELVE} color={themeColors.secondaryText}>
                      {socialProgress.done} / {socialProgress.total} completed{rewardStatusLoading ? " (updating…)" : ""}
                    </AppText>
                  </View>
                  <View style={[styles.progressTrack, { backgroundColor: isDark ? "#0F1116" : "#EEF1F8" }]}>
                    <View style={[styles.progressFill, { width: `${socialProgress.pct}%` }]}>
                      <LinearGradient
                        colors={["#1e56f5", "#22c55e"]}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={styles.progressFillGradient}
                      />
                    </View>
                  </View>

                  <View style={styles.progressTasks}>
                    {[1, 2, 3].map((n) => (
                      <View key={n} style={styles.progressTaskRow}>
                        <View style={styles.progressDotOuter}>
                          <View style={styles.progressDotInner} />
                        </View>
                        <AppText type={TWELVE} weight={MEDIUM} style={{ color: isDark ? "rgba(255,255,255,0.80)" : "#2E7D32" }}>
                          Task {n}
                        </AppText>
                      </View>
                    ))}
                  </View>
                </LinearGradient>

                <View style={{ marginTop: 10 }}>
                  {GUEST_STEPS.map((s) => {
                    const n = s.n;
                    const link = getLinkForTask(n);
                    const done = isTaskComplete(n);
                    return (
                      <LinearGradient
                        key={n}
                        colors={stepCardGradient(n, done)}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[
                          styles.taskCard,
                          { borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)" },
                        ]}
                      >
                        <View style={styles.taskHead}>
                          <View style={[styles.stepNum, { backgroundColor: stepNumBg[n - 1] || stepNumBg[0] }]}>
                            <AppText weight={SEMI_BOLD} type={TWELVE} style={{ color: colors.white }}>
                              {n}
                            </AppText>
                          </View>
                          <View style={{ flex: 1 }}>
                            <AppText weight={SEMI_BOLD} type={TWELVE} color={themeColors.text}>
                              {s.title}
                            </AppText>
                            {done && (
                              <AppText type={TEN} color={colors.buttonBg} style={{ marginTop: 2 }}>
                                Completed
                              </AppText>
                            )}
                          </View>
                        </View>

                        <View style={styles.taskActions}>
                          <TouchableOpacity
                            style={[
                              styles.linkOutBtn,
                              {
                                borderColor: isDark ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.08)",
                                backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(30,86,245,0.10)",
                              },
                            ]}
                            onPress={() => openLink(link.href)}
                          >
                            <SocialIcon n={n} />
                            <AppText type={TWELVE} color={themeColors.text} style={{ marginLeft: 8 }}>
                              {link.label}
                            </AppText>
                          </TouchableOpacity>

                          {!done && (
                            <TouchableOpacity
                              style={[
                                styles.markDoneBtn,
                                { backgroundColor: colors.buttonBg, opacity: taskSubmitting || rewardStatusLoading ? 0.6 : 1 },
                              ]}
                              disabled={!!taskSubmitting || rewardStatusLoading}
                              onPress={() => handleCompleteTask(n)}
                            >
                              <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: colors.white }}>
                                {taskSubmitting === n ? "Saving…" : "Mark as done"}
                              </AppText>
                            </TouchableOpacity>
                          )}
                        </View>
                      </LinearGradient>
                    );
                  })}
                </View>
              </>
            )}
          </View>

          {/* Rewards */}
          <View style={styles.sectionPad}>
            <AppText weight={SEMI_BOLD} style={styles.rewardsTitle} color={themeColors.text}>
              Token &amp; Rewards
            </AppText>
            <AppText type={TWELVE} color={themeColors.secondaryText} style={styles.rewardsSub}>
              Your rewards unlocked over time.
            </AppText>

            <View style={{ marginTop: 12 }}>
              <ImageBackground
                source={bonusbg}
                resizeMode="cover"
                style={[
                  styles.rewardCardBg,
                  { backgroundColor: rewardText.cardBg, borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(30,86,245,0.22)" },
                ]}
                imageStyle={[styles.rewardCardBgImage, { opacity: isDark ? 0.76 : 0.45 }]}
              >
                <View style={styles.rewardInner}>
                  <AppText weight={SEMI_BOLD} style={[styles.rewardHeaderText, { color: rewardText.title }]}>
                    Signup Bonus
                  </AppText>

                  <AppText weight={SEMI_BOLD} style={[styles.rewardBigValue, { color: rewardText.amount }]}>
                    {!settingsLoaded ? "…" : signupDisplay}
                  </AppText>

                  <AppText type={TWELVE} style={[styles.rewardDesc, { color: rewardText.desc }]}>
                    Sign up and complete your first steps to receive your instant airdrop reward.
                  </AppText>

                  <View style={styles.rewardLevels}>
                    {["Level 1", "Level 2", "Level 3"].map((t) => (
                      <View key={t} style={styles.rewardLevelRow}>
                        <AppText style={[styles.rewardTick, { color: rewardText.tick }]}>✓</AppText>
                        <AppText type={TWELVE} style={[styles.rewardLevelText, { color: rewardText.level }]}>
                          {t}
                        </AppText>
                      </View>
                    ))}
                  </View>
                </View>
              </ImageBackground>

              <ImageBackground
                source={bonusbg}
                resizeMode="cover"
                style={[
                  styles.rewardCardBg,
                  { marginTop: 14, backgroundColor: rewardText.cardBg, borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(30,86,245,0.22)" },
                ]}
                imageStyle={[styles.rewardCardBgImage, { opacity: isDark ? 0.76 : 0.45 }]}
              >
                <View style={styles.rewardInner}>
                  <AppText weight={SEMI_BOLD} style={[styles.rewardHeaderText, { color: rewardText.title }]}>
                    Referral Bonus (Unlimited)
                  </AppText>

                  <AppText weight={SEMI_BOLD} style={[styles.rewardBigValue, { color: rewardText.amount }]}>
                    {!settingsLoaded ? "…" : referralTotalDisplay}
                  </AppText>

                  <AppText type={TWELVE} style={[styles.rewardDesc, { color: rewardText.desc }]}>
                    Earn token rewards for each friend you refer — scale your earnings with your network.
                  </AppText>

                  <View style={styles.rewardRefLevels}>
                    {[
                      { label: "Level 1", value: !settingsLoaded ? "…" : level1Display },
                      { label: "Level 2", value: !settingsLoaded ? "…" : level2Display },
                      { label: "Level 3", value: !settingsLoaded ? "…" : level3Display },
                    ].map((x) => (
                      <View key={x.label} style={styles.rewardRefRow}>
                        <View style={styles.rewardRefLeft}>
                          <AppText style={[styles.rewardTick, { color: rewardText.tick }]}>✓</AppText>
                          <AppText type={TWELVE} style={[styles.rewardLevelText, { color: rewardText.level }]}>
                            {x.label}
                          </AppText>
                        </View>
                        <AppText type={TWELVE} weight={SEMI_BOLD} style={[styles.rewardAmountRight, { color: rewardText.amount }]}>
                          {x.value}
                        </AppText>
                      </View>
                    ))}
                  </View>
                </View>
              </ImageBackground>
            </View>
          </View>

          {/* Release plan */}
          <View style={[styles.sectionPad, { paddingBottom: 24 }]}>
            <AppText weight={SEMI_BOLD} type={FOURTEEN} color={themeColors.text} style={styles.sectionTitleCenter}>
              Best of <AppText weight={SEMI_BOLD} type={FOURTEEN} color={YELLOW}>Release Plan</AppText>
            </AppText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.releaseScroll}
              style={{ marginTop: 12 }}
            >
              {[
                { title: "Round 1", pct: "10%", sub: "Token Distribution", time: "1–2 Weeks" },
                { title: "Round 2", pct: "15%", sub: "Token Distribution", time: "3–4 Weeks" },
                { title: "Round 3", pct: "25%", sub: "Token Distribution", time: "5–6 Weeks" },
                { title: "Round 4", pct: "50%", sub: "Token Distribution", time: "7–8 Weeks" },
              ].map((x) => (
                <LinearGradient
                  key={x.title}
                  colors={isDark ? ["#101b3a", "#172d64", "#1d347b"] : ["#e9f0ff", "#d1deff", "#baccff"]}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={[
                    styles.releaseCardNew,
                    { borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)" },
                  ]}
                >
                  <View style={styles.releaseBadge}>
                    <AppText type={TEN} weight={SEMI_BOLD} style={{ color: colors.white }}>
                      {x.title}
                    </AppText>
                  </View>

                  <FastImage source={tokenlock} style={styles.releaseIcon} resizeMode="contain" />

                  <AppText type={TEN} weight={SEMI_BOLD} style={{ color: releaseText.title, letterSpacing: 0.6, marginTop: 8 }}>
                    AVAILABLE REWARDS:
                  </AppText>

                  <AppText weight={SEMI_BOLD} style={[styles.releasePct, { color: releaseText.strong }]}>
                    {x.pct}
                  </AppText>

                  <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: releaseText.strong, marginTop: 2 }}>
                    Token Distribution
                  </AppText>

                  <AppText type={TEN} style={{ color: releaseText.sub, marginTop: 10 }}>
                    {x.time}
                  </AppText>
                  <AppText type={TEN} style={{ color: releaseText.sub2, marginTop: 6 }}>
                    Early bird special allocation
                  </AppText>
                </LinearGradient>
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      </KeyBoardAware>
    </AppSafeAreaView>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    marginTop: 20,
    gap: 14,
    marginHorizontal: 16,
    alignItems: "center",
  },
  backIcon: { width: 20, height: 20 },
  scrollContent: { paddingBottom: 30 },

  hero: {
    marginTop: 12,
    marginHorizontal: 0,
    width: "100%",
    alignSelf: "stretch",
    borderRadius: 0,
    alignItems: "center",
    overflow: "hidden",
    borderColor: "rgba(0,0,0,0.06)",
  },
  heroOverlay: {
    width: "100%",
    paddingTop: 30,
    paddingHorizontal: 18,
    paddingBottom: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: { fontSize: 22, lineHeight: 28, textAlign: "center", marginTop: 0 },
  heroSub: { marginTop: 8, textAlign: "center" },
  heroBody: {
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 6,
    width: "85%",
    maxWidth: 340,
  },
  heroActions: { flexDirection: "row", gap: 12, marginTop: 14 },
  heroPillBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 999,
    minWidth: 140,
    alignItems: "center",
  },
  joinedRow: { flexDirection: "row", alignItems: "center", marginTop: 14 },
  joinedAvatars: { flexDirection: "row", alignItems: "center" },
  joinedAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  heroImage: {
    width: "100%",
    height: 260,
    marginTop: 10,
  },

  sectionPad: { marginTop: 18, paddingHorizontal: 16 },

  statsRow: { flexDirection: "row", gap: 14 },
  statCardGrad: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    minHeight: 120,
    justifyContent: "flex-end",
  },
  statIconMini: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  statsIconImg: { width: 32, height: 32 },
  statValue: { fontSize: 20, lineHeight: 24, marginBottom: 2 },

  sectionTitleCenter: { textAlign: "center", fontSize: 18 },
  sectionSubCenter: { textAlign: "center" },

  rewardsTitle: { fontSize: 17, textAlign: "center" },
  rewardsSub: { marginTop: 6, textAlign: "center" },
  rewardCardBg: {
    borderRadius: 16,
    overflow: "hidden",
    minHeight: 200,
    justifyContent: "flex-start",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(30,86,245,0.22)",
  },
  rewardCardBgImage: {
    borderRadius: 16,
    // opacity: 0.60,
  },
  rewardInner: {
    padding: 14,
  },
  rewardHeaderText: {
    fontSize: 13,
    color: "#0B0F1A",
  },
  rewardBigValue: {
    fontSize: 24,
    lineHeight: 30,
    marginTop: 8,
    color: "#5AA8FF",
  },
  rewardDesc: {
    marginTop: 8,
    color: "rgba(0,0,0,0.55)",
    lineHeight: 17,
  },
  rewardLevels: { marginTop: 12, gap: 10 },
  rewardLevelRow: { flexDirection: "row", alignItems: "center" },
  rewardTick: { color: "#22C55E", marginRight: 8, fontSize: 14 },
  rewardLevelText: { color: "rgba(0,0,0,0.70)" },

  rewardRefLevels: { marginTop: 12, gap: 10 },
  rewardRefRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rewardRefLeft: { flexDirection: "row", alignItems: "center" },
  rewardAmountRight: { color: "#5AA8FF" },

  stepCard: {
    flexDirection: "row",
    gap: 10,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    marginBottom: 10,
    alignItems: "flex-start",
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },

  progressCard: {
    marginTop: 12,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  progressTop: { flexDirection: "row", justifyContent: "space-between" },
  progressTrack: {
    height: 10,
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 10,
  },
  progressFill: { height: 10, borderRadius: 10, overflow: "hidden" },
  progressFillGradient: { width: "100%", height: "100%" },
  progressTasks: { marginTop: 14, gap: 10 },
  progressTaskRow: { flexDirection: "row", alignItems: "center" },
  progressDotOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(34,197,94,0.20)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  progressDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#22c55e",
  },

  taskCard: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  taskHead: { flexDirection: "row", gap: 10, alignItems: "center" },
  taskActions: { marginTop: 12, gap: 10 },
  linkOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  markDoneBtn: {
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
  },

  rewardCard: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  rewardTop: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  levelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },

  releaseCard: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  releaseRow: { flexDirection: "row", justifyContent: "space-between" },

  releaseScroll: {
    paddingRight: 16,
  },
  releaseCardNew: {
    width: 240,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    marginRight: 14,
    alignItems: "center",
    overflow: "hidden",
  },
  releaseBadge: {
    position: "absolute",
    left: 0,
    top: 0,
    backgroundColor: colors.buttonBg,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderTopLeftRadius: 14,
    borderBottomRightRadius: 12,
  },
  releaseIcon: { width: 56, height: 56, marginTop: 10 },
  releasePct: { fontSize: 26, lineHeight: 30, marginTop: 8 },
});

export default AirDropScreen;

