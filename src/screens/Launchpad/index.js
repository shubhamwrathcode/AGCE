import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  View,
  Dimensions,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import {
  AppSafeAreaView,
  AppText,
  ELEVEN,
  FOURTEEN,
  NORMAL,
  SEMI_BOLD,
  SIXTEEN,
  THIRTEEN,
  TWELVE,
  TWENTY,
  YELLOW,
  SECOND,
  WHITE,
  TEN,
  BLACK,
  Button,
  BOLD,
} from "../../shared";
import TouchableOpacityView from "../../shared/components/TouchableOpacityView";
import { colors } from "../../theme/colors";
import { launchpad_hero_img, tetherIcon, peopleIcon, defaultPic, NO_NOTIFICATION_ICON, NO_NOTIFICATION_ICON_LIGHT } from "../../helper/ImageAssets";
import FastImage from "react-native-fast-image";
import moment from "moment";
import { IMAGE_BASE_URL } from "../../helper/Constants";
import NavigationService from "../../navigation/NavigationService";
import { appOperation } from "../../appOperation";
import { useTheme } from "../../hooks/useTheme";

const { width } = Dimensions.get("window");

const getTokenIcon = (item) => {
  if (!item) return null;
  let path = "";
  if (item?.logo) {
    path = item.logo;
  } else if (item?.base_currency_id?.icon_path) {
    path = item.base_currency_id.icon_path;
  } else if (item?.tokenIcon || item?.token_icon) {
    path = item.tokenIcon || item.token_icon;
  }

  if (!path) return "https://zillion-exchange.s3.ap-south-1.amazonaws.com/uploads/1690454652-USDT.png";
  if (path.startsWith("http")) return path;
  const cleanBase = IMAGE_BASE_URL.endsWith("/") ? IMAGE_BASE_URL.slice(0, -1) : IMAGE_BASE_URL;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
};

const getTokenName = (item) =>
  item?.tokenName || item?.base_currency_id?.name || item?.base_currency_id?.short_name || "Token";

const getTokenSymbol = (item) =>
  item?.tokenSymbol || item?.base_currency_id?.short_name || "N/A";

const getQuoteSymbol = (item) => item?.acceptedCurrency || item?.quote_currency_id?.short_name || "USDT";

const getTokensForSale = (item) => item?.availableTokens ?? item?.tokensForSale ?? 0;

const getParticipants = (item) => item?.totalParticipants ?? item?.participantsCount ?? 0;

const Launchpad = () => {
  const { colors: themeColors, isDark } = useTheme();
  const [timestamp, setTimestamp] = useState(Date.now());
  const [categorizedProjects, setCategorizedProjects] = useState({
    ongoing: [],
    upcoming: [],
    ended: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("live");
  const [heroStats, setHeroStats] = useState({
    totalRaised: 0,
    totalParticipants: 0,
    listedProjects: 0,
  });

  useEffect(() => {
    const interval = setInterval(() => setTimestamp(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchLaunchpads = useCallback(async (options = {}) => {
    const { signal } = options;
    setLoading(true);
    setError(null);
    try {
      const result = await appOperation.get('launchpad/get-launchpads', undefined, undefined, 'GUEST');
      if (!result?.success) {
        throw new Error(result?.message || "Unable to fetch launchpad listings.");
      }
      const raw = result?.data;
      const data = Array.isArray(raw) ? raw : [];
      setCategorizedProjects(categorizeProjects(data));
      setHeroStats({
        totalRaised: data.reduce((a, i) => a + (parseFloat(i.totalRaised) || 0), 0),
        totalParticipants: data.reduce((a, i) => a + (parseFloat(i.totalParticipants) || 0), 0),
        listedProjects: data.length,
      });
    } catch (fetchError) {
      if (fetchError?.name !== "AbortError") setError(fetchError?.message || "Something went wrong.");
    } finally {
      if (!signal || !signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchLaunchpads({ signal: controller.signal });
    return () => controller.abort();
  }, [fetchLaunchpads]);

  const filteredProjects = useMemo(() => {
    return categorizedProjects[activeTab === 'live' ? 'ongoing' : activeTab] || [];
  }, [categorizedProjects, activeTab]);

  const renderProjectCard = (project) => {
    if (!project) return null;

    const status = String(project?.status || "N/A").toUpperCase();
    const isLive = status === "LIVE" || status === "ONGOING";
    const isUpcoming = status === "UPCOMING";
    const isEnded = status === "ENDED" || status === "CANCELLED";

    const endsIn = isLive ? formatLiveEndsIn(project, timestamp) : null;
    const startsIn = isUpcoming ? formatUpcomingStartsIn(project, timestamp) : null;
    const tokenIcon = getTokenIcon(project);

    const textColor = isDark ? themeColors.text : "#000000";
    const secondaryTextColor = isDark ? themeColors.secondaryText : "#666666";

    return (
      <View style={[styles.webCard, { backgroundColor: themeColors.card }]}>
        <View style={styles.webCardTop}>
          <View style={styles.webCardTopLeft}>
            <View style={styles.webTokenIconContainer}>
              {tokenIcon ? (
                <FastImage source={{ uri: tokenIcon }} style={styles.webTokenLogo} resizeMode="contain" />
              ) : (
                <View style={[styles.webTokenPlaceholder, { backgroundColor: themeColors.background }]}>
                  <AppText type={SIXTEEN} color={textColor}>{getTokenSymbol(project).charAt(0)}</AppText>
                </View>
              )}
            </View>
            <View style={styles.webTokenMeta}>
              <View style={styles.webTokenTitleRow}>
                <AppText type={SIXTEEN} weight={BOLD} color={textColor}>{getTokenSymbol(project)}</AppText>
                <View style={[styles.webStatusBadge, isLive ? styles.bgLive : isUpcoming ? styles.bgUpcoming : styles.bgEnded]}>
                  <AppText type={TEN} weight={BOLD} style={{ color: "#FFFFFF" }}>{status}</AppText>
                </View>
              </View>
              <AppText type={TWELVE} color={secondaryTextColor}>{getTokenName(project)}</AppText>
            </View>
          </View>
          <View style={styles.webCardTopRight}>
            <View style={styles.webStatCol}>
              <AppText type={TEN} style={{ color: secondaryTextColor }}>Total Distribution</AppText>
              <AppText type={TWELVE} weight={BOLD} color={textColor}>{getTokensForSale(project).toLocaleString()} {getTokenSymbol(project)}</AppText>
            </View>

            <View style={[styles.statSeparator, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }]} />

            {isLive && (
              <>
                <View style={styles.webStatCol}>
                  <AppText type={TEN} style={{ color: secondaryTextColor }}>End Time</AppText>
                  <AppText type={TWELVE} weight={BOLD} color={textColor}>{formatFixedDateOnly(project?.endTime)}, {formatFixedClockOnly(project?.endTime)}</AppText>
                </View>
                <View style={[styles.statSeparator, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }]} />
                <View style={[styles.webStatCol, { alignItems: 'flex-end' }]}>
                  <AppText type={TEN} style={{ color: secondaryTextColor }}>Ends in</AppText>
                  <AppText type={TWELVE} weight={BOLD} style={{ color: colors.buttonBg }}>{endsIn}</AppText>
                </View>
              </>
            )}
            {isUpcoming && (
              <>
                <View style={styles.webStatCol}>
                  <AppText type={TEN} style={{ color: secondaryTextColor }}>Start Time</AppText>
                  <AppText type={TWELVE} weight={BOLD} color={textColor}>{formatFixedDateOnly(project?.startTime)}, {formatFixedClockOnly(project?.startTime)}</AppText>
                </View>
                <View style={[styles.statSeparator, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }]} />
                <View style={[styles.webStatCol, { alignItems: 'flex-end' }]}>
                  <AppText type={TEN} style={{ color: secondaryTextColor }}>Starts in</AppText>
                  <AppText type={TWELVE} weight={BOLD} style={{ color: colors.buttonBg }}>{startsIn}</AppText>
                </View>
              </>
            )}
            {isEnded && (
              <>
                <View style={styles.webStatCol}>
                  <AppText type={TEN} style={{ color: secondaryTextColor }}>Start Time</AppText>
                  <AppText type={TWELVE} weight={BOLD} color={textColor}>{formatFixedDateOnly(project?.startTime)}, {formatFixedClockOnly(project?.startTime)}</AppText>
                </View>
                <View style={[styles.statSeparator, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }]} />
                <View style={[styles.webStatCol, { alignItems: 'flex-end' }]}>
                  <AppText type={TEN} style={{ color: secondaryTextColor }}>End Time</AppText>
                  <AppText type={TWELVE} weight={BOLD} color={textColor}>{formatFixedDateOnly(project?.endTime)}, {formatFixedClockOnly(project?.endTime)}</AppText>
                </View>
              </>
            )}
          </View>
        </View>

        <View style={[styles.webInnerBox, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }]}>
          <View style={styles.webInnerTop}>
            <View style={styles.webInnerLft}>
              <View style={styles.webQuoteIcon}>
                <FastImage
                  source={(() => {
                    const quote = project?.quote_currency_id || project?.quote_currency;
                    const path = quote?.icon_path || project?.quote_icon || project?.accepted_currency_icon;
                    if (!path) return tetherIcon;
                    if (path.startsWith("http")) return { uri: path };
                    // Fix double slashes and ensure valid URL
                    const base = IMAGE_BASE_URL.endsWith("/") ? IMAGE_BASE_URL.slice(0, -1) : IMAGE_BASE_URL;
                    const cleanPath = path.startsWith("/") ? path : `/${path}`;
                    return { uri: `${base}${cleanPath}` };
                  })()}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="contain"
                />
              </View>
              <View>
                <AppText type={FOURTEEN} weight={BOLD} color={textColor}>{getQuoteSymbol(project)}</AppText>
                <AppText type={TEN} color={secondaryTextColor}>Commit {getQuoteSymbol(project)} to Subscribe {getTokenSymbol(project)}</AppText>
              </View>
            </View>
            <View style={styles.webParticipants}>
              <FastImage
                source={defaultPic}
                style={{ width: 25, height: 25, tintColor: secondaryTextColor }}
                resizeMode="contain"
              />
              <AppText type={TWELVE} color={secondaryTextColor}>{getParticipants(project)}</AppText>
            </View>
          </View>

          <View style={styles.webInnerList}>
            <View style={styles.webInnerRow}>
              <AppText type={TEN} color={secondaryTextColor}>Token Price</AppText>
              <AppText type={TEN} color={textColor}>1 {getTokenSymbol(project)} = <AppText type={TEN} style={{ color: colors.buttonBg }}>{project?.tokenPrice || 0} {getQuoteSymbol(project)}</AppText></AppText>
            </View>
            <View style={styles.webInnerRow}>
              <AppText type={TEN} color={secondaryTextColor}>Total Allocation</AppText>
              <AppText type={TEN} color={textColor}>{getTokensForSale(project).toLocaleString()} {getTokenSymbol(project)}</AppText>
            </View>
            <View style={styles.webInnerRow}>
              <AppText type={TEN} color={secondaryTextColor}>Total Committed</AppText>
              <AppText type={TEN} color={textColor}>{(project?.totalRaised || project?.totalInvested || 0).toLocaleString()} {getQuoteSymbol(project)}</AppText>
            </View>
          </View>

          <Button
            children="View Details"
            titleStyle={{ color: textColor, fontWeight: '700' }}
            containerStyle={[styles.webCTA, {
              borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)',
              backgroundColor: isDark ? 'transparent' : 'rgba(0,0,0,0.02)'
            }]}
            onPress={() => NavigationService.navigate("ProjectDetails", { project })}
          />
        </View>
      </View>
    );
  };

  const renderEmptyState = (tab) => (
    <View style={styles.stateWrapper}>

      <FastImage source={isDark ? NO_NOTIFICATION_ICON : NO_NOTIFICATION_ICON_LIGHT} style={{ width: 80, height: 80, }} resizeMode="contain" />
      <AppText type={FOURTEEN} color={isDark ? themeColors.secondaryText : "#333"} style={styles.stateMessage}>No {tab} projects found.</AppText>
    </View>
  );

  const renderTabSwitcher = () => (
    <View style={styles.tabContainer}>
      <AppText type={TWENTY} weight={BOLD} color={isDark ? themeColors.text : "#000"} style={styles.tabHeading}>Projects</AppText>
      <View style={styles.tabRow}>
        {['live', 'upcoming', 'ended'].map(tab => (
          <TouchableOpacityView
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tabBtn, activeTab === tab && { backgroundColor: colors.buttonBg, borderColor: colors.buttonBg }]}
          >
            <AppText
              type={FOURTEEN}
              weight={activeTab === tab ? SEMI_BOLD : NORMAL}
              color={activeTab === tab ? WHITE : (isDark ? SECOND : "#666")}
              style={{ textTransform: 'capitalize', color: isDark ? "#FFFFFF" : (activeTab === tab ? "#FFFFFF" : undefined) }}
            >{tab}</AppText>
          </TouchableOpacityView>
        ))}
      </View>
    </View>
  );

  const heroTextColor = isDark ? themeColors.text : "#000";
  const heroSecondaryTextColor = isDark ? themeColors.secondaryText : "#555";

  return (
    <AppSafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
      <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
        <View style={styles.heroCard}>
          <LinearGradient
            colors={[isDark ? colors.newThemeColor : colors.white, isDark ? colors.newThemeColor : colors.white]}
            style={styles.heroGradient}
          >
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.heroTextContainer}>
                  <AppText type={TWENTY} weight={SEMI_BOLD} color={heroTextColor} style={styles.heroTitle}>Launchpad</AppText>
                  <AppText type={TWELVE} weight={NORMAL} style={[styles.heroSubtitle, { color: heroSecondaryTextColor }]}>Your Easiest Way to Top Tokens — Early or at a Discount</AppText>
                </View>
                <View style={styles.heroArtContainer}>
                  <FastImage source={launchpad_hero_img} resizeMode="contain" style={styles.heroImage} />
                </View>
              </View>

              <View style={styles.heroStatsRow}>
                <View style={styles.heroStatItem}>
                  <AppText type={ELEVEN} style={{ color: heroSecondaryTextColor }}>Total Raised (USDT)</AppText>
                  <AppText type={FOURTEEN} weight={BOLD} color={heroTextColor}>{heroStats.totalRaised?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || "0"}</AppText>
                </View>
                <View style={[styles.statSeparator, { height: 30, backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }]} />
                <View style={styles.heroStatItem}>
                  <AppText type={ELEVEN} style={{ color: heroSecondaryTextColor }}>Total Participants</AppText>
                  <AppText type={FOURTEEN} weight={BOLD} color={heroTextColor}>{heroStats.totalParticipants?.toLocaleString() || "0"}</AppText>
                </View>
                <View style={[styles.statSeparator, { height: 30, backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }]} />
                <View style={styles.heroStatItem}>
                  <AppText type={ELEVEN} style={{ color: heroSecondaryTextColor }}>Listed Projects</AppText>
                  <AppText type={FOURTEEN} weight={BOLD} color={heroTextColor}>{heroStats.listedProjects || "0"}</AppText>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {loading ? (
          <View style={styles.stateWrapper}>
            <ActivityIndicator color={colors.buttonBg} />
            <AppText type={THIRTEEN} color={isDark ? themeColors.secondaryText : "#333"} style={styles.stateMessage}>Fetching launchpad listings...</AppText>
          </View>
        ) : error ? (
          <View style={styles.stateWrapper}>
            <AppText type={FOURTEEN} color={isDark ? themeColors.secondaryText : "#333"} style={styles.stateMessage}>{error}</AppText>
            <TouchableOpacityView style={styles.retryButton} onPress={() => fetchLaunchpads()}>
              <AppText type={TWELVE} weight={SEMI_BOLD} color={WHITE}>Retry</AppText>
            </TouchableOpacityView>
          </View>
        ) : (
          <>
            {renderTabSwitcher()}
            <View style={styles.projectListContainer}>
              {filteredProjects.length > 0 ? (
                filteredProjects.map((item) => (
                  <View key={item?._id || item?.id} style={{ marginBottom: 20 }}>
                    {renderProjectCard(item)}
                  </View>
                ))
              ) : (
                renderEmptyState(activeTab)
              )}
            </View>
          </>
        )}
      </ScrollView>
    </AppSafeAreaView >
  );
};

// --- Helper Functions ---
const categorizeProjects = (projects) => {
  const categorized = { ongoing: [], upcoming: [], ended: [] };
  projects.forEach((project) => {
    const s = String(project?.status || "").toUpperCase();
    if (s === "LIVE" || s === "ONGOING") categorized.ongoing.push(project);
    else if (s === "UPCOMING") categorized.upcoming.push(project);
    else if (s === "ENDED" || s === "CANCELLED") categorized.ended.push(project);
    else {
      const now = moment();
      const start = moment(project?.startTime);
      const end = moment(project?.endTime);
      if (start.isValid() && now.isBefore(start)) categorized.upcoming.push(project);
      else if (end.isValid() && now.isAfter(end)) categorized.ended.push(project);
      else categorized.ongoing.push(project);
    }
  });
  return categorized;
};

const formatLiveEndsIn = (item, timestamp) => {
  const t = item?.endTime ? new Date(item.endTime).getTime() : NaN;
  return formatHmsCountdown(t, "Sale ended", timestamp);
};

const formatUpcomingStartsIn = (item, timestamp) => {
  const t = item?.startTime ? new Date(item.startTime).getTime() : NaN;
  return formatHmsCountdown(t, "Started", timestamp);
};

const formatHmsCountdown = (targetMs, pastLabel, timestamp) => {
  if (!targetMs || Number.isNaN(targetMs)) return "—";
  let ms = targetMs - timestamp;
  if (ms <= 0) return pastLabel;
  const days = Math.floor(ms / 86400000);
  ms -= days * 86400000;
  const hours = Math.floor(ms / 3600000);
  ms -= hours * 3600000;
  const minutes = Math.floor(ms / 60000);
  ms -= minutes * 60000;
  const seconds = Math.floor(ms / 1000);
  const padNum = (n) => String(n).padStart(2, "0");
  if (days > 0) return `${days}d ${padNum(hours)}:${padNum(minutes)}:${padNum(seconds)}`;
  return `${padNum(hours)}:${padNum(minutes)}:${padNum(seconds)}`;
};

const formatFixedDateOnly = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const formatFixedClockOnly = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
};

const getScheduleTimeRows = (item) => {
  const start = item?.startTime;
  const end = item?.endTime;
  return [
    { label: "Start Time", value: start ? new Date(start).toLocaleString() : "--" },
    { label: "End Time", value: end ? new Date(end).toLocaleString() : "--" },
  ];
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  contentContainer: { paddingBottom: 40 },
  heroCard: { width: "100%", height: 220, overflow: "hidden" },
  heroGradient: { flex: 1, paddingHorizontal: 24, paddingVertical: 14 },
  heroTextContainer: { flex: 1, justifyContent: "center" },
  heroTitle: { marginBottom: 4 },
  heroSubtitle: { lineHeight: 18, marginBottom: 8, width: "95%" },
  heroStatsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  heroStatItem: { flex: 1, alignItems: "center" },
  heroArtContainer: { width: 110, height: 100 },
  heroImage: { width: "100%", height: "100%" },
  tabContainer: { paddingHorizontal: 20, marginBottom: 10 },
  tabHeading: { marginBottom: 16 },
  tabRow: { flexDirection: 'row', gap: 12 },
  tabBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#EEEEEE' },
  projectListContainer: { paddingHorizontal: 20, paddingTop: 10 },
  webCard: { borderRadius: 16, padding: 16, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, width: '100%' },
  webCardTop: { flexDirection: 'column', gap: 16, marginBottom: 16 },
  webCardTopLeft: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  webTokenIconContainer: { width: 48, height: 48, borderRadius: 8, overflow: 'hidden' },
  webTokenLogo: { width: '100%', height: '100%' },
  webTokenPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  webTokenMeta: { flex: 1 },
  webTokenTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  webStatusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  bgLive: { backgroundColor: '#4CAF50' },
  bgUpcoming: { backgroundColor: '#FEBA00' },
  bgEnded: { backgroundColor: '#F44336' },
  webCardTopRight: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  webStatCol: { flex: 1, alignItems: 'flex-start' },
  statSeparator: { width: 1, height: 24, backgroundColor: 'rgba(0,0,0,0.1)', marginHorizontal: 12 },
  webInnerBox: { borderRadius: 12, padding: 16, gap: 16 },
  webInnerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  webInnerLft: { flexDirection: 'row', gap: 8, alignItems: 'center', flex: 1 },
  webQuoteIcon: { width: 28, height: 28, borderRadius: 14, overflow: 'hidden' },
  webParticipants: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  userIcon: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#6E6E6E' },
  webInnerList: { gap: 10, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 12 },
  webInnerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  webCTA: { marginTop: 8, height: 44, borderRadius: 22, backgroundColor: 'transparent', borderWidth: 1, borderColor: '#EEEEEE' },
  stateWrapper: { marginTop: 40, alignItems: 'center', gap: 12 },
  stateMessage: { textAlign: 'center', paddingHorizontal: 40 },
  retryButton: { marginTop: 10, backgroundColor: colors.buttonBg, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
});

export default Launchpad;
