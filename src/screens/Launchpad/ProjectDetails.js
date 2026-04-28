import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Dimensions,
  Linking,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import FastImage from "react-native-fast-image";
import moment from "moment";
import { LOGIN_SCREEN } from "../../navigation/routes";
import { CUSTOMER_TYPE } from "../../appOperation/types";
import RBSheet from "react-native-raw-bottom-sheet";
import {
  AppSafeAreaView,
  AppText,
  BOLD,
  EIGHT,
  EIGHTEEN,
  ELEVEN,
  FIFTEEN,
  FOURTEEN,
  NORMAL,
  SECOND,
  SEMI_BOLD,
  TEN,
  THIRTEEN,
  TWELVE,
  TWENTY,
  WHITE,
  BLACK,
  YELLOW,
  Button,
  Input,
  SIXTEEN,
} from "../../shared";
import TouchableOpacityView from "../../shared/components/TouchableOpacityView";
import { colors } from "../../theme/colors";
import { back_ic, defaultPic, externalLinkIcon, linkIcon, NO_NOTIFICATION_ICON, NO_NOTIFICATION_ICON_LIGHT, tick } from "../../helper/ImageAssets";
import { IMAGE_BASE_URL } from "../../helper/Constants";
import { showError } from "../../helper/logger";
import { appOperation } from "../../appOperation";
import { useTheme } from "../../hooks/useTheme";
import NavigationService from "../../navigation/NavigationService";

const { width } = Dimensions.get("window");

const ProjectDetails = () => {
  const { colors: themeColors, isDark } = useTheme();
  const route = useRoute();
  const navigation = useNavigation();
  const projectFromParams = route?.params?.project || {};
  // Start with the project passed from listing, then update if fetch succeeds
  const [project, setProject] = useState(projectFromParams);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [purchasing, setPurchasing] = useState(false);
  const buySheetRef = useRef(null);
  const subscriptionSheetRef = useRef(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false);

  const fetchProjectDetails = useCallback(async (projectId) => {
    if (!projectId) return;

    // Optional: If we already have full data from params, we can skip initial loading spinner
    // but we still fetch in background to get latest stats
    setLoading(true);
    setError(null);
    try {
      // Use appOperation for correct base URL and authentication
      const result = await appOperation.get(`launchpad/get-launchpads`, undefined, undefined, 'GUEST');
      if (result?.success) {
        const list = Array.isArray(result.data) ? result.data : [];
        const found = list.find(x => String(x?._id) === String(projectId));
        if (found) {
          setProject(found);
        } else {
          // Fallback to project list again if needed, or throw error
          throw new Error("Project not found in current inventory.");
        }
      } else {
        throw new Error(result?.message || "Unable to fetch launchpad listings.");
      }
    } catch (fetchError) {
      // If we have data from params, don't show block-level error, just log it
      if (Object.keys(projectFromParams).length > 2) {
        console.warn("Fetch failed, using cached params:", fetchError);
      } else {
        setError(fetchError?.message || "Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  }, [projectFromParams]);

  useEffect(() => {
    const projectId = projectFromParams?._id || project?._id;
    if (projectId) {
      fetchProjectDetails(projectId);
    }
  }, [fetchProjectDetails, projectFromParams?._id]);

  // Format helpers
  const formatListing = (value) => {
    if (!value) return "--";
    const date = moment(value);
    if (!date.isValid()) return "--";
    return date.utc().format("DD/MM/YYYY HH:mm:ss");
  };

  const formatNumber = (value) => {
    if (value === null || value === undefined) return "--";
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) return "--";
    return numericValue.toLocaleString("en-US");
  };

  const formatTokenPrice = (value, symbol) => {
    if (value === null || value === undefined) return "--";
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) return "--";
    // Extract just the symbol part if it contains "Token" or spaces
    const cleanSymbol = (symbol || "ENL").split(" ")[0];
    return `1 ${cleanSymbol}=${numericValue.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    })} USDT`;
  };

  const formatUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return `https://${url}`;
  };

  const handleWebsitePress = () => {
    const url = formatUrl(project?.website);
    if (url) {
      Linking.openURL(url).catch((err) =>
        console.error("Failed to open URL:", err)
      );
    }
  };

  const handleWhitepaperPress = () => {
    const url = formatUrl(project?.whitepaper);
    if (url) {
      Linking.openURL(url).catch((err) =>
        console.error("Failed to open URL:", err)
      );
    }
  };

  const tokenLogoSource = (() => {
    let path = project?.logo || project?.base_currency_id?.icon_path || project?.logoUrl;
    if (!path) return null;
    if (path.startsWith("http")) return { uri: path };
    const base = IMAGE_BASE_URL.endsWith("/") ? IMAGE_BASE_URL.slice(0, -1) : IMAGE_BASE_URL;
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return { uri: `${base}${cleanPath}` };
  })();

  // Determine status
  const status = project?.status?.toUpperCase() || "ENDED";
  const statusColor =
    status === "ENDED"
      ? colors.inactiveDot || "#666666"
      : status === "UPCOMING"
        ? colors.buttonBg
        : status === "LIVE" || status === "ONGOING"
          ? "#4CAF50"
          : colors.inactiveDot || "#666666";

  // Determine subscription currency (default to USDT)
  const subscriptionCurrency = "USDT";

  // Extract clean token symbol (remove "Token" suffix if present)
  const tokenSymbol = project?.tokenSymbol
    ? project.tokenSymbol.split(" ")[0]
    : project?.tokenName || "ENL";

  // Map API fields to component fields
  // Map API fields to component fields for parity with web platform
  const minSubscription = project?.minBuy ?? project?.minPurchase ?? project?.minSubscription ?? 10;
  const maxSubscription = project?.maxBuy ?? project?.maxPurchase ?? project?.maxSubscription ?? 15000;
  const tokenPrice = project?.tokenPrice ?? project?.subscription_price ?? project?.price ?? 0;
  const totalAllocation = project?.availableTokens ?? project?.tokensForSale ?? project?.totalDistribution ?? project?.totalAllocation ?? 0;
  const quoteSymbol = project?.acceptedCurrency || project?.quoteSymbol || ((typeof project?.quote_currency_id === "object") ? project?.quote_currency_id?.short_name : "USDT");

  // Calculate tokens to receive
  const tokensToReceive = purchaseAmount && project?.tokenPrice
    ? (parseFloat(purchaseAmount) / parseFloat(project.tokenPrice)).toFixed(2)
    : "0.00";

  const handleOpenBuySheet = () => {
    if (!appOperation.customerToken) {
      showError("Please login to participate.");
      navigation.navigate(LOGIN_SCREEN);
      return;
    }
    buySheetRef.current?.open();
  };

  const handleCloseBuySheet = () => {
    buySheetRef.current?.close();
    setPurchaseAmount("");
  };

  const fetchSubscriptionHistory = useCallback(async () => {
    setSubscriptionsLoading(true);
    const lpId = project?._id || route?.params?.projectId;
    // Check for token parity with web platform
    if (!lpId || !appOperation.customerToken) {
      setSubscriptions([]);
      setSubscriptionsLoading(false);
      return;
    }
    try {
      const historyRes = await appOperation.get(`launchpad/transactions/${lpId}`, undefined, undefined, CUSTOMER_TYPE);
      if (historyRes?.success) {
        setSubscriptions(Array.isArray(historyRes?.data) ? historyRes.data : []);
      } else {
        setSubscriptions([]);
      }
    } catch (fetchError) {
      console.warn("History fetch error:", fetchError);
      setSubscriptions([]);
    } finally {
      setSubscriptionsLoading(false);
    }
  }, [project?._id, route?.params?.projectId]);

  const handleOpenSubscriptionSheet = async () => {
    if (!appOperation.customerToken) {
      showError("Please login to view history.");
      navigation.navigate(LOGIN_SCREEN);
      return;
    }
    subscriptionSheetRef.current?.open();
    fetchSubscriptionHistory();
  };

  const handleCloseSubscriptionSheet = () => {
    subscriptionSheetRef.current?.close();
  };

  const handleConfirmPurchase = async () => {
    if (!project?._id) {
      showError("Launchpad information not available.");
      return;
    }

    if (!purchaseAmount || parseFloat(purchaseAmount) <= 0) {
      showError("Please enter a valid amount.");
      return;
    }

    // Validate min/max limits
    const amount = parseFloat(purchaseAmount);
    const minAmount = parseFloat(minSubscription || 10);
    const maxAmount = parseFloat(maxSubscription || 15000);

    if (amount < minAmount) {
      showError(`Minimum purchase amount is ${minAmount} ${quoteSymbol}.`);
      return;
    }

    if (amount > maxAmount) {
      showError(`Maximum purchase amount is ${maxAmount} ${quoteSymbol}.`);
      return;
    }

    // Call API to purchase tokens via appOperation (replaces hardcoded IP)
    setPurchasing(true);
    try {
      const result = await appOperation.post("launchpad/buy-token", {
        amount: amount,
        launchpadId: project._id,
      }, CUSTOMER_TYPE);

      if (result?.success) {
        showError(result?.message || "Purchase successful!");
        handleCloseBuySheet();
        fetchProjectDetails(project._id);
      } else {
        showError(result?.message || "Something went wrong.");
      }
    } catch (purchaseError) {
      showError(purchaseError?.message || "Error processing purchase.");
    } finally {
      setPurchasing(false);
    }
  };

  // Use theme colors for text consistency
  const textColor = isDark ? themeColors.text : "#000000";
  const secondaryTextColor = isDark ? themeColors.secondaryText : "#666666";
  const cardBg = themeColors.card;
  const subCardBg = isDark ? "rgba(255, 255, 255, 0.03)" : "#F5F5F3";
  const borderColor = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0,0,0,0.05)";
  const dividerColor = isDark ? "rgba(255, 255, 255, 0.1)" : "#EEE";

  if (loading && !project?._id) {
    return (
      <AppSafeAreaView style={[styles.areaWrapper, { backgroundColor: themeColors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.buttonBg} size="large" />
          <AppText type={FOURTEEN} color={SECOND} style={styles.loadingText}>
            Loading project details...
          </AppText>
        </View>
      </AppSafeAreaView>
    );
  }

  if (error) {
    return (
      <AppSafeAreaView style={[styles.areaWrapper, { backgroundColor: themeColors.background }]}>
        <View style={styles.errorContainer}>
          <AppText type={FOURTEEN} color={SECOND} style={styles.errorText}>
            {error}
          </AppText>
          <TouchableOpacityView
            style={styles.retryButton}
            onPress={() => {
              const projectId = projectFromParams?._id || project?._id;
              if (projectId) {
                fetchProjectDetails(projectId);
              }
            }}
          >
            <AppText type={TWELVE} weight={SEMI_BOLD} color={WHITE}>
              Retry
            </AppText>
          </TouchableOpacityView>
        </View>
      </AppSafeAreaView>
    );
  }

  return (
    <AppSafeAreaView style={[styles.areaWrapper, { backgroundColor: themeColors.background }]}>
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <TouchableOpacityView
            onPress={() => NavigationService.goBack()}
            style={styles.backButton}
          >
            <FastImage
              source={back_ic}
              style={styles.backIcon}
              resizeMode="contain"
              tintColor={textColor}
            />
          </TouchableOpacityView>
          <AppText
            type={EIGHTEEN}
            weight={SEMI_BOLD}
            style={[styles.headerTitle, { color: textColor }]}
          >
            {project?.tokenSymbol || "ZTC"}
          </AppText>
          <View style={[styles.statusBadge, { backgroundColor: statusColor, marginRight: 8 }]}>
            <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: colors.white }}>
              {status}
            </AppText>
          </View>
        </View>

        {/* Timeline Horizontal */}
        <View style={styles.horizontalTimeline}>
          {[
            { label: "Subscription Starts", date: project?.startTime },
            { label: "Subscription Ends", date: project?.endTime },
            { label: "Allocation Starts", date: project?.endTime },
          ].map((item, index) => (
            <View key={index} style={[styles.timelineItemHoriz, {
              borderLeftWidth: index === 0 ? 0 : 2, borderLeftColor: isDark ? "rgba(255,255,255,0.05)" : colors.secondBorder, width: "35%",
              paddingHorizontal: 8,
            }]}>
              {/* <View style={styles.timelinePointRow}>
                <View style={[styles.timelinePoint, { backgroundColor: colors.buttonBg, shadowColor: colors.buttonBg, shadowOpacity: 0.8, shadowRadius: 6, elevation: 5 }]} />
                {index < 2 && <View style={[styles.timelineLineHoriz, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#DDD" }]} />}
              </View> */}
              <AppText style={[styles.timelineLabelHoriz, {
                color: secondaryTextColor,
                // textAlign: 'left',
                fontSize: 11
              }]}>
                {item.label}
              </AppText>
              <AppText type={TEN} weight={SEMI_BOLD} style={[styles.timelineDateHoriz, { color: textColor, }]}>
                {moment(item.date).format("YYYY-MM-DD\nHH:mm")}
              </AppText>
            </View>
          ))}
        </View>

        {/* Top Distribution Card */}
        <View style={[styles.summaryCard, { backgroundColor: cardBg, borderWidth: 1, borderColor: borderColor }]}>
          <View style={styles.summaryCol}>
            <AppText type={TWELVE} style={{ color: secondaryTextColor }}>Total Distribution</AppText>
            <AppText type={SIXTEEN} weight={BOLD} style={{ color: textColor, marginTop: 4 }}>
              {formatNumber(project?.tokensForSale || 0)} {tokenSymbol}
            </AppText>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: dividerColor }]} />
          <View style={styles.summaryCol}>
            <AppText type={TWELVE} style={{ color: secondaryTextColor }}>Participants</AppText>
            <AppText type={SIXTEEN} weight={BOLD} style={{ color: textColor, marginTop: 4 }}>
              {project?.participantsCount || 0}
            </AppText>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: dividerColor }]} />
          <View style={[styles.summaryCol, { justifyContent: 'center' }]}>
            {(status === "LIVE" || status === "ONGOING") ? (
              <TouchableOpacityView
                onPress={handleOpenBuySheet}
                style={[styles.subscribeButton, { paddingVertical: 10, paddingHorizontal: 16, marginTop: 0, minWidth: 70 }]}
              >
                <AppText weight={BOLD} style={{ color: "#FFFFFF" }} type={THIRTEEN}>Trade</AppText>
              </TouchableOpacityView>
            ) : (
              <View style={[styles.subscribeButton, { backgroundColor: "#DDD", opacity: 0.5, paddingVertical: 10, paddingHorizontal: 16, marginTop: 0, minWidth: 70 }]}>
                <AppText weight={BOLD} style={{ color: "#FFFFFF" }} type={THIRTEEN}>Trade</AppText>
              </View>
            )}
          </View>
        </View>

        {/* Subscription Main Section */}
        <View style={[styles.commitSection, { backgroundColor: cardBg, borderWidth: 1, borderColor: borderColor }]}>
          <AppText type={SIXTEEN} weight={BOLD} style={{ color: textColor, marginBottom: 20 }}>
            Commit {subscriptionCurrency} to Subscribe {tokenSymbol}
          </AppText>

          <View style={styles.badgesRow}>
            <View style={[styles.badge, { backgroundColor: subCardBg, flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
              <FastImage source={defaultPic}
                resizeMode="contain"
                style={{ width: 25, height: 25 }} tintColor={isDark ? "#AAA" : "#666"} />
              <AppText type={TEN} weight={BOLD} style={{ color: isDark ? "#CCC" : "#333" }}>New User Exclusive</AppText>
            </View>
            <View style={[styles.badge, { backgroundColor: subCardBg, flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
              <FastImage source={tick} style={{ width: 10, height: 10 }} tintColor={isDark ? "#AAA" : "#666"} />
              <AppText type={TEN} weight={BOLD} style={{ color: isDark ? "#CCC" : "#333" }}>60% Off</AppText>
            </View>
            <View style={[styles.badge, { backgroundColor: subCardBg, flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
              <FastImage source={externalLinkIcon} style={{ width: 10, height: 10 }} tintColor={isDark ? "#AAA" : "#666"} />
              <AppText type={TEN} weight={BOLD} style={{ color: isDark ? "#CCC" : "#333" }}>Raise Limit</AppText>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <AppText type={ELEVEN} style={{ color: secondaryTextColor }}>Exclusive Subscription Price</AppText>
              <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: textColor, marginTop: 6 }}>
                1 {tokenSymbol} = {tokenPrice} {quoteSymbol}
              </AppText>
              <AppText type={TEN} style={{ color: secondaryTextColor, marginTop: 4 }}>
                Sell Price: {project?.sellPrice ?? project?.listingPrice ?? tokenPrice} {quoteSymbol}
              </AppText>
            </View>
            <View style={styles.statBox}>
              <AppText type={ELEVEN} style={{ color: secondaryTextColor }}>Total Allocation</AppText>
              <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: textColor, marginTop: 6 }}>
                {formatNumber(totalAllocation)} {tokenSymbol}
              </AppText>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <AppText type={ELEVEN} style={{ color: secondaryTextColor }}>Total Committed</AppText>
              <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: textColor, marginTop: 6 }}>
                {formatNumber(project?.totalRaised ?? project?.totalInvested ?? 0)} {quoteSymbol}
              </AppText>
            </View>
            <View style={styles.statBox}>
              <AppText type={ELEVEN} style={{ color: secondaryTextColor }}>Subscribed</AppText>
              <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: textColor, marginTop: 6 }}>
                {project?.subscribed != null ? formatNumber(project.subscribed) : "---"}
              </AppText>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <AppText type={ELEVEN} style={{ color: secondaryTextColor }}>Allocated</AppText>
              <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: textColor, marginTop: 6 }}>
                {project?.allocated != null ? formatNumber(project.allocated) : "---"}
              </AppText>
            </View>
            <View style={styles.statBox}>
              <AppText type={ELEVEN} style={{ color: secondaryTextColor }}>Refunded</AppText>
              <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: textColor, marginTop: 6 }}>
                {project?.refunded != null ? formatNumber(project.refunded) : "---"}
              </AppText>
            </View>
          </View>



        </View>
        <TouchableOpacityView onPress={handleOpenSubscriptionSheet} style={{ alignSelf: 'flex-end', marginVertical: 5, marginRight: 10 }}>
          <AppText type={THIRTEEN} style={{ color: colors.buttonBg }}>My Subscription &rarr;</AppText>
        </TouchableOpacityView>

        {/* Project Summary */}
        <View style={styles.section}>
          <AppText type={SIXTEEN} weight={BOLD} style={{ color: textColor, marginBottom: 16 }}>Project Summary</AppText>
          <View style={[styles.summaryBox, { backgroundColor: cardBg, borderWidth: 1, borderColor: borderColor }]}>
            <AppText type={TWELVE} style={{ color: secondaryTextColor, lineHeight: 18 }}>
              {project?.description || "No description available."}
            </AppText>
          </View>
        </View>

        {/* Key Highlight */}
        <View style={styles.section}>
          <AppText type={SIXTEEN} weight={BOLD} style={{ color: textColor, marginBottom: 16 }}>Details</AppText>
          <View style={styles.highlightTable}>
            <View style={[styles.tableRow, { backgroundColor: cardBg, borderTopLeftRadius: 10, borderTopRightRadius: 10 }]}>
              <AppText type={TWELVE} style={{ color: secondaryTextColor }}>Exclusive Subscription Price</AppText>
              <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: textColor }}>
                1 {tokenSymbol} = {tokenPrice} {quoteSymbol}
              </AppText>
            </View>
            <View style={[styles.tableRow, { backgroundColor: subCardBg }]}>
              <AppText type={TWELVE} style={{ color: textColor }}>Launchpad Total Allocation</AppText>
              <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: textColor }}>
                {formatNumber(totalAllocation)} {tokenSymbol}
              </AppText>
            </View>
            <View style={[styles.tableRow, { backgroundColor: cardBg, borderBottomLeftRadius: 10, borderBottomRightRadius: 10 }]}>
              <AppText type={TWELVE} style={{ color: secondaryTextColor }}>Individual Subscription Limit</AppText>
              <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: textColor }}>
                {formatNumber(minSubscription)} - {formatNumber(maxSubscription)} {quoteSymbol}
              </AppText>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Buy Token Bottom Sheet */}
      <RBSheet
        ref={buySheetRef}
        closeOnDragDown={true}
        closeOnPressMask={true}
        height={340}
        animationType="slide"
        customStyles={{
          container: {
            backgroundColor: isDark ? themeColors.card : themeColors.background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 40,
          },
          wrapper: {
            backgroundColor: "#0006",
          },
          draggableIcon: {
            backgroundColor: isDark ? colors.whiteShadow || "#666" : "#CCCCCC",
            width: 40,
          },
        }}
      >
        <View style={styles.bottomSheetContent}>
          <View style={styles.bottomSheetHeader}>
            <AppText type={EIGHTEEN} weight={SEMI_BOLD} color={textColor}>
              Enter Purchase Amount
            </AppText>
            <TouchableOpacityView onPress={handleCloseBuySheet}>
              <AppText type={TWENTY} weight={BOLD} color={textColor}>
                ✖
              </AppText>
            </TouchableOpacityView>
          </View>

          <Input
            placeholder="Enter amount"
            keyboardType="decimal-pad"
            value={purchaseAmount}
            onChangeText={setPurchaseAmount}
            mainContainer={styles.buyInputMainContainer}
            containerStyle={[styles.buyInputContainer, { backgroundColor: subCardBg, borderColor: borderColor }]}
            inputStyle={[styles.buyInput, { color: textColor }]}
          />

          {purchaseAmount && project?.tokenPrice && (
            <View style={styles.tokensInfo}>
              <AppText type={FOURTEEN} weight={SEMI_BOLD} style={styles.tokensInfoText}>
                You will receive: {tokensToReceive} {tokenSymbol}
              </AppText>
            </View>
          )}

          <AppText type={TWELVE} style={[styles.limitText, { color: secondaryTextColor }]}>
            Min: {formatNumber(minSubscription || 10)} USDT | Max: {formatNumber(maxSubscription || 15000)} USDT
          </AppText>

          <View style={styles.bottomSheetButtons}>
            <Button
              children="Confirm"
              onPress={handleConfirmPurchase}
              loading={purchasing}
              containerStyle={[
                styles.confirmButton,
                ((!purchaseAmount || parseFloat(purchaseAmount) <= 0) || purchasing) && styles.disabledButton,
              ]}
              disabled={!purchaseAmount || parseFloat(purchaseAmount) <= 0 || purchasing}
            />
            {/* <Button
              children="Cancel"
              onPress={handleCloseBuySheet}
              containerStyle={styles.cancelButton}
            /> */}
          </View>
        </View>
      </RBSheet>

      {/* Subscription History Bottom Sheet */}
      <RBSheet
        ref={subscriptionSheetRef}
        closeOnDragDown={true}
        closeOnPressMask={true}
        height={Dimensions.get("window").height * 0.85}
        animationType="slide"
        customStyles={{
          container: {
            backgroundColor: isDark ? themeColors.card : themeColors.background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 40,
          },
          wrapper: {
            backgroundColor: "#0006",
          },
          draggableIcon: {
            backgroundColor: isDark ? colors.whiteShadow || "#666" : "#CCCCCC",
            width: 40,
          },
        }}
      >
        <View style={styles.subscriptionSheetContent}>
          <View style={styles.subscriptionSheetHeader}>
            <AppText type={EIGHTEEN} weight={SEMI_BOLD} style={[styles.subscriptionSheetTitle, { color: textColor }]}>
              My Subscription
            </AppText>
            <TouchableOpacityView onPress={handleCloseSubscriptionSheet}>
              <AppText type={TWENTY} weight={BOLD} style={[styles.closeButton, { color: textColor }]}>
                ✖
              </AppText>
            </TouchableOpacityView>
          </View>

          {subscriptionsLoading ? (
            <View style={styles.subscriptionLoadingContainer}>
              <ActivityIndicator color={colors.buttonBg} size="large" />
              <AppText type={FOURTEEN} color={SECOND} style={styles.subscriptionLoadingText}>
                Loading subscription history...
              </AppText>
            </View>
          ) : subscriptions && subscriptions.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.subscriptionTableScroll}
              nestedScrollEnabled={true}
              scrollEventThrottle={16}
              decelerationRate="fast"
            >
              <View style={styles.subscriptionTableWrapper}>
                <ScrollView
                  stickyHeaderIndices={[0]}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Table Header */}
                  {subscriptions.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subscriptionTableHeader}>
                      <AppText type={TWELVE} weight={SEMI_BOLD} style={[styles.subscriptionTableCell, styles.subscriptionTableHeaderCell, { width: 40 }]}>
                        #
                      </AppText>
                      <AppText type={TWELVE} weight={SEMI_BOLD} style={[styles.subscriptionTableCell, styles.subscriptionTableHeaderCell, { width: 100 }]}>
                        Token Name
                      </AppText>
                      <AppText type={TWELVE} weight={SEMI_BOLD} style={[styles.subscriptionTableCell, styles.subscriptionTableHeaderCell, { width: 80 }]}>
                        Symbol
                      </AppText>
                      <AppText type={TWELVE} weight={SEMI_BOLD} style={[styles.subscriptionTableCell, styles.subscriptionTableHeaderCell, { width: 80 }]}>
                        Amount
                      </AppText>
                      <AppText type={TWELVE} weight={SEMI_BOLD} style={[styles.subscriptionTableCell, styles.subscriptionTableHeaderCell, { width: 80 }]}>
                        Tokens
                      </AppText>
                      <AppText type={TWELVE} weight={SEMI_BOLD} style={[styles.subscriptionTableCell, styles.subscriptionTableHeaderCell, { width: 80 }]}>
                        Quote
                      </AppText>
                      <AppText type={TWELVE} weight={SEMI_BOLD} style={[styles.subscriptionTableCell, styles.subscriptionTableHeaderCell, { width: 100 }]}>
                        Date
                      </AppText>
                      <AppText type={TWELVE} weight={SEMI_BOLD} style={[styles.subscriptionTableCell, styles.subscriptionTableHeaderCell, { width: 80 }]}>
                        Status
                      </AppText>
                    </ScrollView>
                  )}

                  {/* Table Body */}
                  {subscriptions.length > 0 ? (
                    subscriptions.map((sub, index) => {
                      const lp = sub.launchpadId && typeof sub.launchpadId === "object" ? sub.launchpadId : {};

                      const rawInvested = sub.amount ?? (sub.totalInvested?.$numberDecimal ? parseFloat(sub.totalInvested.$numberDecimal) : 0);
                      const totalInvested = Number(rawInvested).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      });

                      const tokensReceived = sub.tokens ?? sub.totalTokensReceived ?? "0";
                      const purchaseDate = sub.createdAt ?? sub.lastPurchase;

                      const statusColor =
                        sub.status === "LIVE" || sub.status === "ONGOING" || sub.status === "COMPLETED"
                          ? "#4CAF50"
                          : sub.status === "ENDED" || sub.status === "CANCELLED"
                            ? "#F44336"
                            : "#555";

                      return (
                        <View
                          key={index}
                          style={[
                            styles.subscriptionTableRow,
                            {
                              backgroundColor: index % 2 === 0
                                ? (isDark ? "#191919" : "#F9F9F9")
                                : (isDark ? "#1F1F1F" : "#FFFFFF")
                            }
                          ]}
                        >
                          <AppText type={TWELVE} style={[styles.subscriptionTableCell, { color: textColor, width: 40 }]}>
                            {index + 1}
                          </AppText>
                          <AppText type={TWELVE} style={[styles.subscriptionTableCell, { color: textColor, width: 100 }]}>
                            {lp.tokenName || sub.tokenName || "--"}
                          </AppText>
                          <AppText type={TWELVE} style={[styles.subscriptionTableCell, { color: textColor, width: 80 }]}>
                            {lp.tokenSymbol || sub.tokenSymbol || "--"}
                          </AppText>
                          <AppText type={TWELVE} style={[styles.subscriptionTableCell, { color: textColor, width: 80 }]}>
                            {totalInvested}
                          </AppText>
                          <AppText type={TWELVE} style={[styles.subscriptionTableCell, { color: textColor, width: 80 }]}>
                            {tokensReceived}
                          </AppText>
                          <AppText type={TWELVE} style={[styles.subscriptionTableCell, { color: textColor, width: 80 }]}>
                            {sub.acceptedCurrencyName || sub.currency || quoteSymbol || "USDT"}
                          </AppText>
                          <AppText type={TWELVE} style={[styles.subscriptionTableCell, { color: textColor, width: 100 }]}>
                            {purchaseDate
                              ? moment(purchaseDate).format("DD/MM/YYYY LT")
                              : "--"}
                          </AppText>
                          <AppText
                            type={TWELVE}
                            weight={SEMI_BOLD}
                            style={[styles.subscriptionTableCell, { color: statusColor, width: 80 }]}
                          >
                            {sub.status ? sub.status.charAt(0) + sub.status.slice(1).toLowerCase() : "--"}
                          </AppText>
                        </View>
                      );
                    })
                  ) : null}
                </ScrollView>
              </View>
            </ScrollView>
          ) : (
            <View style={styles.subscriptionEmptyContainer}>
              <FastImage
                source={isDark ? NO_NOTIFICATION_ICON : NO_NOTIFICATION_ICON_LIGHT}
                style={styles.subscriptionEmptyImage}
                resizeMode="contain"
              />
              <AppText type={FOURTEEN} color={SECOND} style={styles.subscriptionEmptyText}>
                No subscription data found for this project.
              </AppText>
            </View>
          )}

          {/* <View style={[styles.subscriptionSheetFooter, { borderTopColor: isDark ? "#1F1F1F" : "#EEE" }]}>
            <Button
              children="Close"
              onPress={handleCloseSubscriptionSheet}
              containerStyle={styles.subscriptionCloseButton}
            />
          </View> */}
        </View>
      </RBSheet>
    </AppSafeAreaView>
  );
};

export default ProjectDetails;

const styles = StyleSheet.create({
  areaWrapper: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 12,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  backButton: {
    padding: 4,
  },
  backIcon: {
    width: 18,
    height: 18,
  },
  headerTitle: {
    color: colors.white,
    flex: 1,
    textAlign: "center",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: "#666666",
  },
  projectOverview: {
    marginTop: 8,
    marginBottom: 24,
  },
  projectIdentity: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  projectLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  projectLogoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.buttonBg,
    alignItems: "center",
    justifyContent: "center",
  },
  projectName: {
    color: colors.white,
  },
  externalLinks: {
    flexDirection: "row",
    gap: 12,
  },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  linkIcon: {
    width: 14,
    height: 14,
  },
  linkText: {
    color: colors.whiteShadow || "#999",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.white,
    marginBottom: 12,
  },
  subscriptionLink: {
    marginBottom: 12,
  },
  detailsList: {
    gap: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  detailLabel: {
    color: colors.whiteShadow || "#999",
    flex: 1,
  },
  detailValue: {
    color: colors.white,
    flex: 1,
    textAlign: "right",
  },
  timeline: {
    marginTop: 8,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  timelineCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.buttonBg || "#FEBA00",
    alignItems: "center",
    justifyContent: "center",
  },
  timelineContent: {
    flex: 1,
    paddingTop: 2,
  },
  timelineTitle: {
    color: colors.white,
    marginBottom: 0,
  },
  timelineDate: {
    color: colors.whiteShadow || "#999",
  },
  timelineLine: {
    width: 2,
    height: 30,
    backgroundColor: colors.buttonBg || "#FEBA00",
    marginLeft: 13,
    marginVertical: 6,
  },
  highlightTable: {
    borderRadius: 12,
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  tableLabel: {
    flex: 1,
  },
  tableValue: {
    flex: 2,
    textAlign: "right",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 16,
  },
  errorText: {
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: colors.buttonBg,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  buyNowButton: {
    marginBottom: 24,
    backgroundColor: colors.buttonBg,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 6,
  },
  bottomSheetContent: {
    flex: 1,
  },
  bottomSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  bottomSheetTitle: {
    color: colors.white,
  },
  closeButton: {
    color: colors.white,
    fontSize: 24,
    lineHeight: 24,
  },
  buyInputMainContainer: {
    marginBottom: 20,
  },
  buyInputContainer: {
    backgroundColor: "#1F1F1F",
    borderColor: "#29313D",
    borderWidth: 1,
    borderRadius: 8,
  },
  buyInput: {
    fontSize: 16,
  },
  tokensInfo: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: "rgba(243, 187, 43, 0.1)",
    borderRadius: 8,
  },
  tokensInfoText: {
    color: colors.buttonBg || "#F3BB2B",
  },
  limitText: {
    color: colors.whiteShadow || "#4D5B6F",
    marginBottom: 20,
  },
  bottomSheetButtons: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
  },
  confirmButton: {
    flex: 1,
    backgroundColor: colors.buttonBg,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.red_fifty,
    paddingVertical: 12,
    borderRadius: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  subscriptionSheetContent: {
    flex: 1,
  },
  subscriptionSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  subscriptionSheetTitle: {
    color: colors.white,
  },
  subscriptionLoadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 40,
  },
  subscriptionLoadingText: {
    marginTop: 12,
  },
  subscriptionTableScroll: {
    flex: 1,
    marginBottom: 20,
  },
  subscriptionTableWrapper: {
    borderRadius: 10,
    overflow: "hidden",
    width: 700,
  },
  subscriptionTableRow: {
    flexDirection: "row",
    flexShrink: 0,
  },
  subscriptionTableHeaderRow: {
    borderBottomWidth: 2,
    borderBottomColor: colors.buttonBg || "#FEBA00",
  },
  subscriptionTableEvenRow: {
    backgroundColor: "#191919",
  },
  subscriptionTableOddRow: {
    backgroundColor: "#1F1F1F",
  },
  subscriptionTableCell: {
    width: 100,
    paddingVertical: 10,
    paddingHorizontal: 10,
    fontSize: 12,
    textAlign: "center",
    color: colors.white,
    flexShrink: 0,
  },
  subscriptionTableHeaderCell: {
    fontWeight: "bold",
    fontSize: 13,
    color: colors.white,
  },
  subscriptionEmptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  subscriptionEmptyImage: {
    width: 64,
    height: 64,
    marginBottom: 16,
    opacity: 0.5,
  },
  subscriptionEmptyText: {
    textAlign: "center",
  },
  subscriptionSheetFooter: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#1F1F1F",
  },
  subscriptionCloseButton: {
    backgroundColor: colors.buttonBg,
    paddingVertical: 12,
    borderRadius: 8,
  },
  horizontalTimeline: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
    marginBottom: 35,
    alignSelf: "center"
  },
  timelineItemHoriz: {
  },
  timelinePointRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    justifyContent: "center",
    marginBottom: 12,
  },
  timelinePoint: {
    width: 10,
    height: 10,
    borderRadius: 5,
    zIndex: 2,
  },
  timelineLineHoriz: {
    height: 1,
    flex: 1,
    position: "absolute",
    left: "50%",
    right: -10,
    zIndex: 1,
  },
  timelineLabelHoriz: {
    textAlign: "center",
    fontSize: 9,
  },
  timelineDateHoriz: {
    textAlign: "center",
    marginTop: 4,
    fontSize: 9,
  },
  summaryCard: {
    flexDirection: "row",
    marginHorizontal: 0,
    borderRadius: 15,
    paddingVertical: 25,
    paddingHorizontal: 16,
    marginBottom: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  summaryCol: {
    flex: 1,
    alignItems: "center",
  },
  summaryDivider: {
    width: 1,
    height: 40,
    marginHorizontal: 10,
  },
  commitSection: {
    marginHorizontal: 0,
    borderRadius: 15,
    padding: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  badgesRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
  },
  subscribeButton: {
    backgroundColor: colors.buttonBg,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 25,
  },
  summaryBox: {
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
});
