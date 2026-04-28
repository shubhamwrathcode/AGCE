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
  BOLD,
} from "../../shared";
import { colors } from "../../theme/colors";
import { IMAGE_BASE_URL } from "../../helper/Constants";
import TouchableOpacityView from "../../shared/components/TouchableOpacityView";
import { back_ic } from "../../helper/ImageAssets";
import NavigationService from "../../navigation/NavigationService";

const { width } = Dimensions.get("window");

const AllUpcomingProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      const upcomingProjects = (payload?.data || []).filter((item) =>
        isUpcomingProject(item)
      );
      setProjects(upcomingProjects);
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
          <TouchableOpacityView
            onPress={() => {
              NavigationService.goBack();
            }}
          >
            <FastImage
              source={back_ic}
              style={{ width: 18, height: 18 }}
              resizeMode="contain"
              tintColor={colors.white}
            />
          </TouchableOpacityView>
          <AppText type={EIGHTEEN} weight={SEMI_BOLD} color={BLACK}>
            Upcoming Projects
          </AppText>
        </View>

        {loading ? (
          <View style={styles.stateWrapper}>
            <ActivityIndicator color={colors.buttonBg} />
            <AppText type={TWELVE} color={SECOND} style={styles.stateMessage}>
              Fetching upcoming projects...
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
              No upcoming projects currently available.
            </AppText>
          </View>
        ) : (
          projects.map((project) => (
            <UpcomingProjectCard key={project._id} project={project} />
          ))
        )}
      </ScrollView>
    </AppSafeAreaView>
  );
};

const UpcomingProjectCard = ({ project }) => {
  const bannerSource = project?.bannerImage
    ? {
        uri: `${IMAGE_BASE_URL}${project.bannerImage}`,
        priority: FastImage.priority.high,
      }
    : null;

  const listingDate = project?.startTime
    ? formatListing(project.startTime)
    : "--";

  const tokenLogoSource = project?.logoUrl
    ? {
        uri: `${IMAGE_BASE_URL}${project.logoUrl}`,
        priority: FastImage.priority.normal,
      }
    : null;

  return (
    <View style={styles.upcomingCard}>
      <LinearGradient
        colors={["#FEE28A", "#F4B91E"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.upcomingTop}
      >
        {bannerSource ? (
          <FastImage
            source={bannerSource}
            resizeMode={FastImage.resizeMode.stretch}
            style={styles.upcomingBannerImage}
          />
        ) : tokenLogoSource ? (
          <FastImage
            source={tokenLogoSource}
            resizeMode={FastImage.resizeMode.stretch}
            style={styles.upcomingBannerImage}
          />
        ) : (
          <View style={styles.upcomingBannerPlaceholder} />
        )}
      </LinearGradient>

      <View style={styles.upcomingBottom}>
        <View style={styles.ongoingTokenRow}>
          <View style={styles.ongoingTokenIcon}>
            {tokenLogoSource ? (
              <FastImage
                source={tokenLogoSource}
                resizeMode={FastImage.resizeMode.cover}
                style={styles.tokenLogo}
              />
            ) : (
              <AppText type={SIXTEEN} weight={SEMI_BOLD} color={BLACK}>
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

        <View style={styles.upcomingStatsBox}>
          <View style={styles.upcomingStatsColumn}>
            <AppText type={TEN} style={{ color: colors.whiteShadow }}>
              Total Raised
            </AppText>
            <AppText type={TEN} style={{ color: colors.whiteShadow }}>
              Token Price
            </AppText>
            <AppText type={TEN} style={{ color: colors.whiteShadow }}>
              Token Sale
            </AppText>  
          </View>
          <View style={styles.upcomingCenterColumn}>
            <View style={styles.upcomingStatusBadge}>
              <AppText type={TWELVE} weight={SEMI_BOLD} color={BLACK}>
                Upcoming
              </AppText>
            </View>
            <AppText
              type={TWELVE}
              style={{ color: colors.whiteShadow, padding: 2 }}
            >
              Start on: {formatUpcoming(project?.startTime)}
            </AppText>
          </View>
          <View style={styles.upcomingStatsColumnRight}>
            <AppText type={TEN} weight={SEMI_BOLD} color={BLACK}>
              {formatRaised(project)}
            </AppText>
            <AppText type={TEN} weight={SEMI_BOLD} color={BLACK}>
              {formatTokenPrice(project?.tokenPrice, project?.tokenSymbol)}
            </AppText>
            <AppText type={TEN} weight={SEMI_BOLD} color={BLACK}>
              {project?.tokensForSale}
            </AppText>
          </View>
        </View>

        <Button
          children="View"
          containerStyle={styles.ongoingCTA}
          onPress={() =>
            NavigationService.navigate("ProjectDetails", { project })
          }
        />
      </View>
    </View>
  );
};

const isUpcomingProject = (project) => {
  const status = (project?.status || "").toUpperCase();
  if (status === "UPCOMING") {
    return true;
  }
  const now = moment();
  const start = project?.startTime ? moment(project.startTime) : null;
  const end = project?.endTime ? moment(project.endTime) : null;

  if (start?.isValid() && now.isBefore(start)) {
    return true;
  }
  return false;
};

const formatListing = (value) => {
  if (!value) {
    return "--";
  }
  const date = moment(value);
  if (!date.isValid()) {
    return "--";
  }
  return date.utc().format("YYYY.MM.DD HH:mm (UTC)");
};

const formatUpcoming = (value) => {
  if (!value) {
    return "--";
  }
  const date = moment(value);
  if (!date.isValid()) {
    return "--";
  }
  return date.utc().format("DD/MM/YYYY");
};

const formatPercent = (value) => {
  if (value === null || value === undefined) {
    return "--";
  }
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return "--";
  }
  return `${numericValue.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })}%`;
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
  const cleanSymbol = symbol ? symbol.split(" ")[0] : "";
  return `${numericValue.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  })} ${cleanSymbol}`.trim();
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0A0A0A",
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
    paddingBottom: 12,
    width: "75%",
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
  upcomingCard: {
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#4F3B10",
    overflow: "hidden",
    backgroundColor: "#0C0C0C",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  upcomingTop: {
    width: "100%",
    height: 170,
    overflow: "hidden",
  },
  upcomingBannerImage: {
    width: "100%",
    height: "100%",
  },
  upcomingBannerPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(255, 214, 94, 0.2)",
  },
  upcomingBottom: {
    backgroundColor: "#111111",
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 18,
  },
  ongoingTokenRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  ongoingTokenIcon: {
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
  upcomingStatsBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  upcomingStatsColumn: {
    gap: 10,
  },
  upcomingCenterColumn: {
    width: "40%",
    height: "75%",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#FEBA00",
    borderRadius: 2,
  },
  upcomingStatusBadge: {
    paddingHorizontal: 15,
    paddingVertical: 4,
    backgroundColor: "#FEBA00",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  upcomingStatsColumnRight: {
    alignItems: "flex-end",
    gap: 10,
  },
  ongoingCTA: {
    marginTop: 4,
    backgroundColor: colors.buttonBg,
    height: 44,
    borderRadius: 5,
  },
});

export default AllUpcomingProjects;
