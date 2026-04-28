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
  ELEVEN,
  NORMAL,
  SEMI_BOLD,
  TEN,
  SECOND,
  WHITE,
  BLACK,
  EIGHTEEN,
} from "../../shared";
import { colors } from "../../theme/colors";
import { IMAGE_BASE_URL } from "../../helper/Constants";
import TouchableOpacityView from "../../shared/components/TouchableOpacityView";
import { back_ic } from "../../helper/ImageAssets";
import NavigationService from "../../navigation/NavigationService";

const { width } = Dimensions.get("window");

const AllEndedProjects = () => {
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
      const endedProjects = (payload?.data || []).filter((item) =>
        isEndedProject(item)
      );
      setProjects(endedProjects);
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
            Ended Projects
          </AppText>
        </View>

        {loading ? (
          <View style={styles.stateWrapper}>
            <ActivityIndicator color={colors.buttonBg} />
            <AppText type={TWELVE} color={SECOND} style={styles.stateMessage}>
              Fetching ended projects...
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
              No ended projects currently available.
            </AppText>
          </View>
        ) : (
          projects.map((project) => (
            <EndedProjectCard key={project._id} project={project} />
          ))
        )}
      </ScrollView>
    </AppSafeAreaView>
  );
};

const EndedProjectCard = ({ project }) => {
  const bannerSource = project?.bannerImage
    ? {
        uri: `${IMAGE_BASE_URL}${project.bannerImage}`,
        priority: FastImage.priority.high,
      }
    : null;

  const tokenLogoSource = project?.logoUrl
    ? {
        uri: `${IMAGE_BASE_URL}${project.logoUrl}`,
        priority: FastImage.priority.normal,
      }
    : null;

  const tradingDate = project?.endTime
    ? formatTrading(project.endTime)
    : "--";

  const totalRaised = formatRaised(project);
  const totalSale = formatNumber(project?.tokensForSale);
  const tokenPrice = formatTokenPrice(project?.tokenPrice, project?.tokenSymbol);

  return (
    <LinearGradient
      colors={["#23160B", "#120805"]}
      start={{ x: 1, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.endedCard}
    >
      {bannerSource ? (
        <FastImage
          source={bannerSource}
          resizeMode={FastImage.resizeMode.cover}
          style={styles.endedBanner}
        />
      ) : null}
      <View style={styles.endedBody}>
        <View style={styles.endedHeader}>
          <AppText type={SIXTEEN} weight={SEMI_BOLD} style={styles.endedTitle}>
            {project?.tokenName}
          </AppText>
          <View style={styles.statusEndedBadge}>
            <AppText type={ELEVEN} weight={SEMI_BOLD} color={WHITE}>
              ENDED
            </AppText>
          </View>
        </View>
        <AppText
          type={FOURTEEN}
          weight={NORMAL}
          color={SECOND}
          style={styles.endedSubtitle}
        >
          Trading: {tradingDate}
        </AppText>
        <View style={styles.tokenRow}>
          <View style={styles.tokenIcon}>
            {tokenLogoSource ? (
              <FastImage
                source={tokenLogoSource}
                style={styles.tokenLogo}
                resizeMode={FastImage.resizeMode.cover}
              />
            ) : (
              <AppText type={SIXTEEN} weight={SEMI_BOLD} color={WHITE}>
                {(project?.tokenSymbol || project?.tokenName || "?")
                  ?.toString()
                  .charAt(0)}
              </AppText>
            )}
          </View>
          <View style={styles.tokenMeta}>
            <AppText type={SIXTEEN} weight={SEMI_BOLD} color={WHITE}>
              {project?.tokenSymbol}
            </AppText>
            <AppText type={TWELVE} weight={NORMAL} color={SECOND}>
              {project?.network || "Network"}
            </AppText>
          </View>
        </View>
        <View style={styles.detailsSection}>
          <View style={styles.detailRow}>
            <AppText type={ELEVEN} color={SECOND}>
              Total Raised
            </AppText>
            <AppText type={ELEVEN} weight={SEMI_BOLD} color={WHITE}>
              {totalRaised}
            </AppText>
          </View>
          <View style={styles.detailRow}>
            <AppText type={ELEVEN} color={SECOND}>
              Token Price
            </AppText>
            <AppText type={ELEVEN} weight={SEMI_BOLD} color={WHITE}>
              {tokenPrice}
            </AppText>
          </View>
          <View style={styles.detailRow}>
            <AppText type={ELEVEN} color={SECOND}>
              Token Sale
            </AppText>
            <AppText type={ELEVEN} weight={SEMI_BOLD} color={WHITE}>
              {totalSale}
            </AppText>
          </View>
        </View>
        <TouchableOpacityView
          style={styles.endedButton}
          onPress={() =>
            NavigationService.navigate("ProjectDetails", { project })
          }
        >
          <AppText type={FOURTEEN} weight={SEMI_BOLD} color={WHITE}>
            View
          </AppText>
        </TouchableOpacityView>
      </View>
    </LinearGradient>
  );
};

const isEndedProject = (project) => {
  const status = (project?.status || "").toUpperCase();
  if (status === "ENDED") {
    return true;
  }
  const now = moment();
  const end = project?.endTime ? moment(project.endTime) : null;

  if (end?.isValid() && now.isAfter(end)) {
    return true;
  }
  return false;
};

const formatTrading = (value) => {
  if (!value) {
    return "--";
  }
  const date = moment(value);
  if (!date.isValid()) {
    return "--";
  }
  return date.utc().format("YYYY.MM.DD HH:mm (UTC)");
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
  endedCard: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#403013",
  },
  endedBanner: {
    width: "100%",
    height: 180,
  },
  endedBody: {
    padding: 20,
    gap: 12,
  },
  endedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  endedTitle: {
    color: WHITE,
    flex: 1,
  },
  statusEndedBadge: {
    backgroundColor: colors.inactiveDot || "#666666",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  endedSubtitle: {
    marginTop: -4,
  },
  tokenRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  tokenIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1D1D1D",
    borderWidth: 1,
    borderColor: "#2E2E2E",
    alignItems: "center",
    justifyContent: "center",
  },
  tokenLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  tokenMeta: {
    flex: 1,
    gap: 2,
  },
  detailsSection: {
    marginTop: 8,
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  endedButton: {
    marginTop: 8,
    backgroundColor: "#2E2E2E",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default AllEndedProjects;

