import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  View,
  Dimensions,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import FastImage from "react-native-fast-image";
import moment from "moment";
import {
  AppSafeAreaView,
  AppText,
  Button,
  TWELVE,
  FOURTEEN,
  SIXTEEN,
  TWENTY,
  NORMAL,
  SEMI_BOLD,
  TEN,
  SECOND,
  WHITE,
  BLACK,
  EIGHT,
  EIGHTEEN,
} from "../../shared";
import { colors } from "../../theme/colors";
import { IMAGE_BASE_URL } from "../../helper/Constants";
import TouchableOpacityView from "../../shared/components/TouchableOpacityView";
import { back_ic, BACK_ICON } from "../../helper/ImageAssets";
import NavigationService from "../../navigation/NavigationService";

const { width } = Dimensions.get("window");

const AllLiveProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timestamp, setTimestamp] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setTimestamp(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);


  const fetchLaunchpads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        "http://159.195.23.93:5001/v1/user/user-launchpad-listing",
        {
          headers: {
            Accept: "application/json",
          },
        }
      );
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(
          payload?.message || "Unable to fetch launchpad listings."
        );
      }
      console.log(payload?.data, "payload?.data");
      const liveProjects = (payload?.data || []).filter((item) =>
        item.status === "LIVE"
      );
      setProjects(liveProjects);
    } catch (fetchError) {
      setError(fetchError?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLaunchpads();
  }, [fetchLaunchpads]);

  return (
    <AppSafeAreaView style={styles.safeArea}>
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacityView onPress={() => {
            NavigationService.goBack();
          }}>
            <FastImage source={back_ic} style={{width: 18, height: 18}} resizeMode="contain" tintColor={colors.white} />
          </TouchableOpacityView>
          <AppText
          type={EIGHTEEN}
          weight={SEMI_BOLD}
          color={BLACK}
        >
         Ongoing Projects
        </AppText>
        </View>
        

        {loading ? (
          <View style={styles.stateWrapper}>
            <ActivityIndicator color={colors.buttonBg} />
            <AppText type={TWELVE} color={SECOND} style={styles.stateMessage}>
              Fetching live projects...
            </AppText>
          </View>
        ) : error ? (
          <View style={styles.stateWrapper}>
            <AppText type={FOURTEEN} color={SECOND} style={styles.stateMessage}>
              {error}
            </AppText>
            <Button
              onPress={fetchLaunchpads}
              children="Retry"
              containerStyle={styles.retryButton}
            />
          </View>
        ) : projects.length === 0 ? (
          <View style={styles.stateWrapper}>
            <AppText type={FOURTEEN} color={SECOND} style={styles.stateMessage}>
              No live projects currently available.
            </AppText>
          </View>
        ) : (
          projects.map((project) => (
            <OngoingProjectCard key={project._id} project={project} timestamp={timestamp} />
          ))
        )}
      </ScrollView>
    </AppSafeAreaView>
  );
};

const OngoingProjectCard = ({ project, timestamp }) => {
  const countdownLabel = getCountdownLabel(project, timestamp);

  const bannerSource = project?.bannerImage
    ? {
        uri: `${IMAGE_BASE_URL}${project.bannerImage}`,
        priority: FastImage.priority.high,
      }
    : null;

  const headline =
    project?.headline ||
    project?.description?.split(".")?.[0] ||
    `${project?.tokenName ?? ""} Launchpad`;

  const subHeadline =
    project?.subHeadline ||
    project?.description?.replace(headline, "").trim() ||
    `Participate with ${project?.tokenSymbol ?? project?.tokenName ?? "token"}`;

  const tokenLogoSource = project?.logoUrl
    ? {
        uri: `${IMAGE_BASE_URL}${project.logoUrl}`,
        priority: FastImage.priority.normal,
      }
    : null;

  const totalRaised = formatRaised(project);
  const totalSale = formatNumber(project?.tokensForSale);
  const tokenPrice = formatTokenPrice(project?.tokenPrice, project?.tokenSymbol);

  return (
    <View style={styles.ongoingCard}>
      <View style={styles.ongoingTop}>
        {bannerSource ? (
          <FastImage
            source={bannerSource}
            resizeMode={FastImage.resizeMode.cover}
            style={styles.ongoingBanner}
          />
        ) : null}
        <LinearGradient
          colors={["rgba(0, 0, 0, 0.45)", "rgba(0, 0, 0, 0.75)"]}
          style={styles.ongoingTopOverlay}
        />
        {countdownLabel ? (
          <LinearGradient
            style={styles.ongoingTimer}
            colors={["#FEBA00", "#F9DC8E", "#FEBA00"]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            <AppText
              type={TWELVE}
              weight={SEMI_BOLD}
              style={styles.ongoingTimerText}
            >
              {countdownLabel}
            </AppText>
          </LinearGradient>
        ) : null}
        <View style={styles.ongoingTopContent}>
        
          <View style={styles.ongoingBadgeContainer}>
            <FastImage
              source={tokenLogoSource}
              resizeMode={FastImage.resizeMode.cover}
              style={styles.ongoingBadgeImage}
            />
          </View>
        </View>
      </View>
      <LinearGradient
        colors={["#FFFFFF00", "#FEBA00", "#FFFFFF00"]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.ongoingBadgeGlow}
      />
      <View style={styles.ongoingBottom}>
        <View style={styles.ongoingTokenRow}>
          <View style={styles.ongoingTokenIcon}>
            {tokenLogoSource ? (
              <FastImage
                source={tokenLogoSource}
                resizeMode={FastImage.resizeMode.cover}
                style={styles.tokenLogo}
              />
            ) : (
              <AppText type={SIXTEEN} weight={SEMI_BOLD} color={WHITE}>
                {(project?.tokenSymbol || project?.tokenName || "?")
                  ?.toString()
                  .charAt(0)}
              </AppText>
            )}
          </View>
          <View style={styles.ongoingTokenMeta}>
            <AppText type={SIXTEEN} weight={SEMI_BOLD} color={BLACK}>
              {project?.tokenSymbol}
            </AppText>
          </View>
        </View>

        <View style={styles.ongoingStats}>
          <View style={styles.ongoingStatRow}>
            <AppText type={TEN} color={SECOND}>
              Total Raised
            </AppText>
            <AppText type={TEN} weight={SEMI_BOLD} color={BLACK}>
              {totalRaised}
            </AppText>
          </View>
            <View style={styles.ongoingStatRow}>
            <AppText type={TEN} color={SECOND}>
              Token Price
            </AppText>
            <AppText type={TEN} weight={SEMI_BOLD} color={BLACK}>
              {tokenPrice}
            </AppText>
          </View>
            <View style={styles.ongoingStatRow}>
            <AppText type={TEN} color={SECOND}>
              Token Sale
            </AppText>
            <AppText type={TEN} weight={SEMI_BOLD} color={BLACK}>
              {totalSale}
            </AppText>
          </View>
        </View>

        <Button
          children="Trade"
          containerStyle={styles.ongoingCTA}
          onPress={() => NavigationService.navigate("ProjectDetails", { project })}
        />
      </View>
    </View>
  );
};

const isLiveProject = (project) => {
  const status = (project?.status || "").toUpperCase();
  if (status === "LIVE") {
    return true;
  }
  const now = moment();
  const start = project?.startTime ? moment(project.startTime) : null;
  const end = project?.endTime ? moment(project.endTime) : null;

  if (start?.isValid() && now.isBefore(start)) {
    return false;
  }
  if (end?.isValid() && now.isAfter(end)) {
    return false;
  }
  return true;
};

const getCountdownLabel = (project, timestamp) => {
  if (!project?.endTime) {
    return null;
  }

  const now = moment(timestamp);
  const start = project?.startTime ? moment(project.startTime) : null;
  const end = moment(project.endTime);

  if (!end.isValid()) {
    return null;
  }

  let diffMs;
  let prefix = "";

  if (start?.isValid() && now.isBefore(start)) {
    diffMs = start.diff(now);
    prefix = "Starts in ";
  } else if (now.isSameOrAfter(end)) {
    return null;
  } else {
    diffMs = end.diff(now);
  }

  if (diffMs <= 0) {
    return null;
  }

  return prefix + formatDurationFromMs(diffMs);
};

const formatDurationFromMs = (diffMs) => {
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  if (days > 0) {
    return `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  }
  return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
};

const formatRaised = (project) => {
  if (!project) {
    return "--";
  }
  const amount = formatNumber(project.totalRaised);
  if (amount === "--") {
    return "--";
  }
  const symbol = project.raiseCurrency || project.tokenSymbol || "";
  return `${amount} ${symbol}`.trim();
};

const formatTokenPrice = (value, symbol) => {
  if (value === null || value === undefined) {
    return "--";
  }
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return "--";
  }
  return `${numericValue.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  })} ${symbol ?? ""}`.trim();
};

const formatNumber = (value) => {
  if (value === null || value === undefined) {
    return "--";
  }
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return "--";
  }
  return numericValue.toLocaleString("en-US");
};

const pad = (input) => String(Math.max(0, input)).padStart(2, "0");


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.newThemeColor,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    // paddingHorizontal: 20,
    // paddingTop: 24,
    paddingBottom: 12,
    width: "75%",
  },
  headerTitle: {
    // textAlign: "center",
    // marginBottom: 4,
    // color: WHITE,
  },
  stateWrapper: {
    alignItems: "center",
    gap: 12,
  },
  stateMessage: {
    textAlign: "center",
    width: width * 0.8,
  },
  retryButton: {
    width: 120,
    height: 40,
    borderRadius: 16,
    backgroundColor: colors.buttonBg,
  },
  ongoingCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#403013",
    overflow: "hidden",
    backgroundColor: colors.themeElevationColor,
  },
  ongoingTop: {
    height: 170,
    position: "relative",
    justifyContent: "flex-end",
  },
  ongoingBanner: {
    ...StyleSheet.absoluteFillObject,
  },
  ongoingTopOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  ongoingTimer: {
    position: "absolute",
    top: 0,
    alignSelf: "center",
    backgroundColor: colors.buttonBg,
    paddingHorizontal: 22,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#F8D04A",
    shadowColor: "#000000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  ongoingTimerText: {
    color: "#2B1600",
    letterSpacing: 0.5,
    backgroundColor: colors.themeElevationColor,
  },
  ongoingTopContent: {
    paddingHorizontal: 24,
    paddingBottom: 26,
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.themeElevationColor,
  },
  ongoingHeadline: {
    color: "#FFF8D8",
    letterSpacing: 0.3,
    width: "60%",
    textAlign: "justify",
  },
  ongoingBadgeContainer: {
    width: "32%",
    aspectRatio: 1,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#604210",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  ongoingBadgeImage: {
    width: "100%",
    height: "100%",
  },
  ongoingBadgeGlow: {
    width: "100%",
    height: StyleSheet.hairlineWidth,
  },
  ongoingBottom: {
    backgroundColor: colors.themeElevationColor,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 5,
  },
  ongoingTokenRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  ongoingTokenIcon: {
    // height: 48,
    // width: 48,
    // borderRadius: 24,
    // borderWidth: 1,
    // borderColor: "#2E2E2E",
    // backgroundColor: "#1D1D1D",
    alignItems: "center",
    justifyContent: "center",
  },
  ongoingTokenMeta: {
    flex: 1,
    gap: 4,
  },
  tokenLogo: {
    width: 30,
    height: 30,
    borderRadius: 20,
  },
  ongoingStats: {
    gap: 5,
  },
  ongoingStatRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ongoingCTA: {
    marginTop: 5,
    borderRadius: 4,
    height: 35,
  },
});

export default AllLiveProjects;