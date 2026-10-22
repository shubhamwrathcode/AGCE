import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
  Linking,
  Platform,
} from "react-native";
import FastImage from "react-native-fast-image";
import LinearGradient from "react-native-linear-gradient";
import { AppSafeAreaView, AppText } from "../../shared";
import { BOLD, SEMI_BOLD } from "../../helper/Constants";
import NavigationService from "../../navigation/NavigationService";
import {
  vip_hero_img,
  vip_servies_herobg,
  vip_servies_herobg_light,
  back_ic,
} from "../../helper/ImageAssets";
import { fontFamilySemiBold } from "../../theme/typography";
import { useTheme } from "../../hooks/useTheme";
import { appOperation } from "../../appOperation";
import { LOGIN_SCREEN, NAVIGATION_AUTH_STACK } from "../../navigation/routes";
import {
  VIP_GUEST_MARKETS,
  VIP_VOLUME_BANDS,
  futuresVipRowsFromApi,
  formatVipUsdt,
  formatVipVolumeNumber,
  isYourVipTier,
  optionsVipRowsFromApi,
  progressFromVipStatus,
  spotVipRowsFromApi,
} from "../../helper/vipTradeFees";

import VipTag0 from "../../../assets/images/vip-services-img/vip_tag_img.svg";
import VipTag1 from "../../../assets/images/vip-services-img/vip_tag_img2.svg";
import VipTag2 from "../../../assets/images/vip-services-img/vip_tag_img3.svg";
import VipTag3 from "../../../assets/images/vip-services-img/vip_tag_img4.svg";
import VipTag4 from "../../../assets/images/vip-services-img/vip_tag_img5.svg";
import VipTag5 from "../../../assets/images/vip-services-img/vip_tag_img6.svg";
import VipFeatIcon1 from "../../../assets/images/vip-services-img/vip_features_icon.svg";
import VipFeatIcon2 from "../../../assets/images/vip-services-img/vip_features_icon3.svg";
import VipFeatIcon3 from "../../../assets/images/vip-services-img/vip_features_icon5.svg";
import VipFeatIcon4 from "../../../assets/images/vip-services-img/vip_features_icon2.svg";
import VipFeatIcon5 from "../../../assets/images/vip-services-img/vip_features_icon7.svg";

const { width } = Dimensions.get("window");

const GOLD = "#D1AA67";
const GOLD_SOFT = "#F5D186";
const GOLD_BORDER = "#D7B46A";
const PAGE_BG_DARK = "#181A20";
const PAGE_BG_LIGHT = "#F7F5F0";
const CARD_BG_DARK = "#1b1d24";
const TRACK_DARK = "#2c303a";
const TRACK_LIGHT = "#efe8da";
const SCALE_DARK = "#b5b5b5";
const MUTED = "#9a9a9a";

const VIP_TAGS = [VipTag0, VipTag1, VipTag2, VipTag3, VipTag4, VipTag5];

const BENEFITS = [
  {
    title: "Priority Support",
    text: "Get faster responses and priority handling from our support team whenever you need help, with personalised guidance as you move up the tiers.",
    Icon: VipFeatIcon1,
    variant: "gold",
  },
  {
    title: "Lower Trading Fees",
    text: "Reduced maker and taker fees that keep getting better with every tier you unlock.",
    Icon: VipFeatIcon2,
    variant: "emerald",
  },
  {
    title: "Automatic Upgrades",
    text: "No application needed. Reach 50K USDT to unlock VIP 1 and climb to VIP 5 at 25M USDT.",
    Icon: VipFeatIcon3,
    variant: "purple",
  },
  {
    title: "Rolling 30-Day Volume",
    text: "Your tier follows your last 30 days of trading, so active traders are always rewarded.",
    Icon: VipFeatIcon4,
    variant: "blue",
  },
  {
    title: "Every Market",
    text: "Spot & margin, Futures and Options each have their own VIP fee schedule.",
    Icon: VipFeatIcon5,
    variant: "copper",
  },
];

function VipVolumeCard({ title, progress, loading, signedIn, error, styles, isDark, onLogin }) {
  // Web screenshot: remain CTA is gold; loading/login/error stay light grey.
  const remainCtaColor = isDark ? GOLD_SOFT : "#8a6a32";
  const remainMutedColor = isDark ? "#fcfcfc" : "#5c5c5c";
  const marketColor = isDark ? "#fff" : "#1a1a1a";
  const scaleColor = isDark ? SCALE_DARK : "#666";
  const pct = progress ? Math.max(0, Math.min(100, progress.percent)) : 0;

  return (
    <View style={[styles.progressCard, !isDark && styles.progressCardLight]}>
      <LinearGradient
        colors={["#A67C33", "#F5D186", "#A67C33"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.progressCardTopAccent}
      />
      <View style={styles.progressHead}>
        <AppText weight={SEMI_BOLD} style={[styles.progressMarket, { color: marketColor }]}>
          {title}
        </AppText>
        {progress ? (
          <View style={styles.progressTier}>
            <Text style={styles.progressTierText} numberOfLines={1}>
              {progress.label}
            </Text>
          </View>
        ) : null}
      </View>

      {loading ? (
        <AppText style={[styles.progressRemain, { color: remainMutedColor }]}>
          Loading your VIP progress…
        </AppText>
      ) : null}

      {!loading && !signedIn ? (
        <>
          <AppText style={[styles.progressRemain, { color: remainMutedColor }]}>
            Log in to view your 30-day volume and your progress to the next VIP tier.
          </AppText>
          <TouchableOpacity onPress={onLogin} style={styles.loginLink}>
            <AppText weight={SEMI_BOLD} style={styles.loginLinkText}>
              Log in ›
            </AppText>
          </TouchableOpacity>
        </>
      ) : null}

      {!loading && signedIn && error && !progress ? (
        <AppText style={[styles.progressRemain, { color: remainMutedColor }]}>{error}</AppText>
      ) : null}

      {progress ? (
        <>
          <View style={[styles.progressTrack, { backgroundColor: isDark ? TRACK_DARK : TRACK_LIGHT }]}>
            {pct > 0 ? (
              <LinearGradient
                colors={["#8d6a2f", "#F5D186"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.progressFill,
                  {
                    width: `${pct}%`,
                    // Low % still reads as the web gold “nub”
                    minWidth: 10,
                  },
                ]}
              />
            ) : null}
          </View>
          <View style={styles.progressScale}>
            <AppText style={{ color: scaleColor, fontSize: 12 }}>
              {formatVipVolumeNumber(progress.volume)}
            </AppText>
            <AppText style={{ color: scaleColor, fontSize: 12, textAlign: "right" }}>
              {progress.nextMin == null
                ? progress.atTop
                  ? "Top tier"
                  : ""
                : formatVipVolumeNumber(progress.nextMin)}
            </AppText>
          </View>
          {progress.hasSchedule ? (
            <AppText style={[styles.progressRemain, { color: remainCtaColor }]}>
              {progress.atTop
                ? "You have reached our top VIP tier"
                : progress.qualifies
                  ? `You have qualified for ${progress.nextLabel}. Your upgrade will be applied shortly.`
                  : `Trade ${formatVipUsdt(progress.remaining)} more to reach ${progress.nextLabel}`}
            </AppText>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

function BenefitCard({ item, styles, isDark }) {
  const Icon = item.Icon;
  return (
    <View style={[styles.benefitCard, styles[`benefit_${item.variant}`], !isDark && styles.benefitCardLight]}>
      <View style={styles.benefitTopRow}>
        <Icon width={28} height={28} />
        <AppText weight={SEMI_BOLD} style={[styles.benefitTitle, !isDark && { color: "#1a1a1a" }]}>
          {item.title}
        </AppText>
      </View>
      <AppText style={[styles.benefitText, !isDark && { color: "#555" }]}>{item.text}</AppText>
    </View>
  );
}

const VipServices = () => {
  const { isDark } = useTheme();
  const styles = useMemo(() => getStyles(isDark), [isDark]);
  const signedIn = Boolean(appOperation.customerToken);
  const tiersRef = useRef(null);
  const scrollRef = useRef(null);
  const [tiersY, setTiersY] = useState(0);
  const [marketKey, setMarketKey] = useState("spot");
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [spotStatus, setSpotStatus] = useState(null);
  const [futuresStatus, setFuturesStatus] = useState(null);
  const [optionsStatus, setOptionsStatus] = useState(null);
  const [loading, setLoading] = useState(signedIn);
  const [spotError, setSpotError] = useState("");
  const [futuresError, setFuturesError] = useState("");
  const [optionsError, setOptionsError] = useState("");

  useEffect(() => {
    if (!signedIn) {
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    const apply = (res, setStatus, setError) => {
      if (cancelled) return;
      if (res?.success && res.data && !Array.isArray(res.data)) {
        setStatus(res.data);
        setError("");
      } else {
        setError(res?.message || "We couldn't load your VIP status right now. Please try again later.");
      }
    };
    Promise.all([
      appOperation.customer.getMyVip("spot").then((res) => apply(res, setSpotStatus, setSpotError)),
      appOperation.customer.getMyVip("futures").then((res) => apply(res, setFuturesStatus, setFuturesError)),
      appOperation.customer.getMyVip("options").then((res) => apply(res, setOptionsStatus, setOptionsError)),
    ])
      .catch(() => {
        if (!cancelled) {
          const msg = "We couldn't load your VIP status right now. Please try again later.";
          setSpotError(msg);
          setFuturesError(msg);
          setOptionsError(msg);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [signedIn]);

  const goLogin = () => {
    NavigationService.navigate(NAVIGATION_AUTH_STACK, { screen: LOGIN_SCREEN });
  };

  const goContact = () => {
    Linking.openURL("https://arabglobal.ae/contact").catch(() => {});
  };

  const scrollToTiers = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ y: Math.max(0, tiersY - 8), animated: true });
    }
  };

  const market = VIP_GUEST_MARKETS.find((item) => item.key === marketKey) || VIP_GUEST_MARKETS[0];
  const apiRows =
    market.key === "spot"
      ? spotVipRowsFromApi(spotStatus)
      : market.key === "futures"
        ? futuresVipRowsFromApi(futuresStatus)
        : optionsVipRowsFromApi(optionsStatus);
  const rows = apiRows || market.rows;
  const activeStatus =
    market.key === "futures" ? futuresStatus : market.key === "options" ? optionsStatus : spotStatus;
  const spotProgress = spotStatus ? progressFromVipStatus(spotStatus) : null;
  const futuresProgress = futuresStatus ? progressFromVipStatus(futuresStatus) : null;
  const optionsProgress = optionsStatus ? progressFromVipStatus(optionsStatus) : null;

  const pageBg = isDark ? PAGE_BG_DARK : PAGE_BG_LIGHT;
  const heroBg = isDark ? vip_servies_herobg : vip_servies_herobg_light;

  return (
    <AppSafeAreaView style={{ backgroundColor: pageBg, flex: 1 }}>
      <View style={[styles.customHeader, { backgroundColor: pageBg }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => NavigationService.goBack()}>
          <FastImage
            source={back_ic}
            style={styles.backIcon}
            tintColor={isDark ? "#fff" : "#1a1a1a"}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <AppText weight={SEMI_BOLD} style={{ color: isDark ? "#fff" : "#1a1a1a", fontSize: 18 }}>
          VIP Services
        </AppText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: pageBg }}
      >
        <ImageBackground source={heroBg} style={styles.heroSection} imageStyle={styles.heroBgImage}>
          <LinearGradient
            colors={isDark ? ["rgba(4,4,4,0)", PAGE_BG_DARK] : ["rgba(247,245,240,0)", PAGE_BG_LIGHT]}
            style={styles.heroFade}
          />
          <View style={styles.heroOverlay}>
            <FastImage source={vip_hero_img} style={styles.heroImage} resizeMode="contain" />
            <AppText
              weight={BOLD}
              style={[
                styles.heroTitle,
                { color: isDark ? GOLD_SOFT : "#9D7A3F", fontFamily: fontFamilySemiBold },
              ]}
            >
              AGCX VIP Program
            </AppText>
            <AppText style={[styles.heroSubtitle, { color: isDark ? GOLD_SOFT : "#8a6a32" }]}>
              Trade more, unlock more. Move up the VIP tiers to enjoy lower trading fees, priority
              support and exclusive member benefits.
            </AppText>
            <View style={styles.heroActions}>
              {/* <TouchableOpacity style={styles.heroSecondaryBtn} onPress={goContact}>
                <AppText weight={SEMI_BOLD} style={styles.heroSecondaryText}>
                  Get in Touch
                </AppText>
              </TouchableOpacity> */}
              <TouchableOpacity style={styles.heroPrimaryBtn} onPress={scrollToTiers}>
                <AppText weight={SEMI_BOLD} style={styles.heroPrimaryText}>
                  Explore VIP Tiers
                </AppText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.heroSecondaryBtn} onPress={goContact}>
                <AppText weight={SEMI_BOLD} style={styles.heroSecondaryText}>
                  Contact Us
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>

        <View
          ref={tiersRef}
          onLayout={(e) => setTiersY(e.nativeEvent.layout.y)}
          style={styles.tierSection}
        >
          <View style={styles.tierTitleWrap}>
            <AppText weight={SEMI_BOLD} style={[styles.tierTitle, { color: isDark ? "#fff" : "#1a1a1a" }]}>
              VIP Tiers & Fees
            </AppText>
            <View style={styles.tierTitleUnderline} />
          </View>
          <AppText style={[styles.tierLead, { color: isDark ? MUTED : "#555" }]}>
            Your tier is based on your trading volume over the last 30 days. Spot, isolated margin and
            cross margin count together, while Futures and Options have their own tiers.
          </AppText>

          <VipVolumeCard
            title="Spot & margin"
            progress={spotProgress}
            loading={loading}
            signedIn={signedIn}
            error={spotError}
            styles={styles}
            isDark={isDark}
            onLogin={goLogin}
          />
          <VipVolumeCard
            title="Futures"
            progress={futuresProgress}
            loading={loading}
            signedIn={signedIn}
            error={futuresError}
            styles={styles}
            isDark={isDark}
            onLogin={goLogin}
          />
          <VipVolumeCard
            title="Options"
            progress={optionsProgress}
            loading={loading}
            signedIn={signedIn}
            error={optionsError}
            styles={styles}
            isDark={isDark}
            onLogin={goLogin}
          />

          <View style={styles.marketTabs}>
            {VIP_GUEST_MARKETS.map((item) => {
              const active = item.key === market.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.marketTab, active && styles.marketTabActive]}
                  onPress={() => setMarketKey(item.key)}
                >
                  <AppText
                    weight={SEMI_BOLD}
                    style={{
                      color: active ? "#111" : isDark ? GOLD_SOFT : "#8a6a32",
                      fontSize: 13,
                    }}
                  >
                    {item.label}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.tierGrid}>
            {rows.map((tier, index) => {
              const band =
                VIP_VOLUME_BANDS[Math.min(tier.tagIndex ?? index, VIP_VOLUME_BANDS.length - 1)];
              const accent = tier.accent || band.accent;
              const TagIcon = VIP_TAGS[Math.min(tier.tagIndex ?? index, VIP_TAGS.length - 1)];
              const tierKey = tier.code || tier.id;
              const mine = signedIn && apiRows ? isYourVipTier(tier, activeStatus) : false;
              const isMe = mine || selectedCardId === tierKey;
              return (
                <TouchableOpacity
                  key={`${tierKey}-${index}`}
                  activeOpacity={0.9}
                  onPress={() => setSelectedCardId(selectedCardId === tierKey ? null : tierKey)}
                  style={[
                    styles.tierCard,
                    { borderTopColor: accent },
                    isMe && { borderColor: accent },
                    !isDark && styles.tierCardLight,
                  ]}
                >
                  {mine ? (
                    <View style={[styles.yourTierTag, { backgroundColor: accent }]}>
                      <Text style={styles.yourTierTagText} numberOfLines={1}>
                        Your tier
                      </Text>
                    </View>
                  ) : null}
                  <View style={styles.tierHead}>
                    <View style={styles.tierHex}>
                      <TagIcon width={32} height={32} />
                    </View>
                    <AppText
                      weight={BOLD}
                      style={[styles.tierName, { color: isDark ? "#eee" : "#1a1a1a" }]}
                    >
                      {tier.id}
                    </AppText>
                  </View>
                  <AppText style={[styles.tierVolLabel, { color: isDark ? "#9a9aa3" : "#666" }]}>
                    30-day volume (USDT)
                  </AppText>
                  <AppText
                    weight={SEMI_BOLD}
                    style={[styles.tierVolValue, { color: isDark ? "#fff" : "#1a1a1a" }]}
                  >
                    {tier.volume}
                  </AppText>
                  <View style={styles.tierFees}>
                    <View style={[styles.tierFee, !isDark && styles.tierFeeLight]}>
                      <AppText style={styles.tierFeeLabel}>Maker fee</AppText>
                      <AppText
                        weight={BOLD}
                        style={[styles.tierFeeValue, { color: isDark ? "#fff" : "#1a1a1a" }]}
                      >
                        {tier.makerFee}
                      </AppText>
                    </View>
                    <View style={[styles.tierFee, !isDark && styles.tierFeeLight]}>
                      <AppText style={styles.tierFeeLabel}>Taker fee</AppText>
                      <AppText
                        weight={BOLD}
                        style={[styles.tierFeeValue, { color: isDark ? "#fff" : "#1a1a1a" }]}
                      >
                        {tier.takerFee}
                      </AppText>
                    </View>
                  </View>
                  <AppText weight={SEMI_BOLD} style={[styles.tierSave, { color: accent }]}>
                    {tier.benefits}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.benefitsSection}>
          <AppText weight={BOLD} style={[styles.benefitsHeading, { color: isDark ? "#fff" : "#1a1a1a" }]}>
            Why Become a <AppText weight={BOLD} style={{ color: "#d9b26a", fontSize: 20 }}>VIP</AppText>
          </AppText>
          <View style={styles.benefitGrid}>
            {BENEFITS.map((item) => (
              <BenefitCard key={item.title} item={item} styles={styles} isDark={isDark} />
            ))}
          </View>
        </View>
      </ScrollView>
    </AppSafeAreaView>
  );
};

const getStyles = (isDark) =>
  StyleSheet.create({
    scrollContent: { paddingBottom: 28 },
    customHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    backBtn: { padding: 4 },
    backIcon: { width: 18, height: 18 },
    headerSpacer: { width: 26 },
    heroSection: {
      width,
      minHeight: 360,
      justifyContent: "flex-end",
      alignItems: "center",
      paddingBottom: 28,
    },
    heroBgImage: { resizeMode: "cover" },
    heroFade: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: 120,
    },
    heroOverlay: {
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 20,
      zIndex: 2,
    },
    heroImage: { width: 160, height: 160 },
    heroTitle: {
      marginTop: 12,
      fontSize: 26,
      letterSpacing: 0.8,
      textAlign: "center",
    },
    heroSubtitle: {
      marginTop: 10,
      fontSize: 14,
      lineHeight: 21,
      textAlign: "center",
      paddingHorizontal: 8,
    },
    heroActions: {
      marginTop: 18,
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 10,
    },
    heroPrimaryBtn: {
      backgroundColor: GOLD,
      borderColor: GOLD,
      borderWidth: 1,
      borderRadius: 100,
      paddingHorizontal: 18,
      paddingVertical: 10,
    },
    heroPrimaryText: { color: "#000", fontSize: 13 },
    heroSecondaryBtn: {
      backgroundColor: "transparent",
      borderColor: GOLD_BORDER,
      borderWidth: 1,
      borderRadius: 100,
      paddingHorizontal: 18,
      paddingVertical: 10,
    },
    heroSecondaryText: { color: GOLD_SOFT, fontSize: 13 },
    tierSection: {
      paddingHorizontal: 16,
      paddingTop: 28,
      backgroundColor: isDark ? PAGE_BG_DARK : PAGE_BG_LIGHT,
    },
    tierTitleWrap: { alignItems: "center", marginBottom: 12 },
    tierTitle: {
      fontSize: 26,
      lineHeight: 34,
      letterSpacing: 0.4,
      paddingTop: 4,
      paddingBottom: 6,
      textAlign: "center",
    },
    tierTitleUnderline: {
      marginTop: 0,
      height: 4,
      width: 168,
      backgroundColor: GOLD,
      borderRadius: 2,
      alignSelf: "center",
    },
    tierLead: {
      fontSize: 13,
      lineHeight: 19,
      textAlign: "center",
      marginBottom: 20,
      paddingHorizontal: 4,
      color: MUTED,
    },
    progressCard: {
      position: "relative",
      backgroundColor: CARD_BG_DARK,
      borderWidth: 1,
      borderColor: "rgba(209, 170, 103, 0.35)",
      borderRadius: 16,
      padding: 20,
      marginBottom: 14,
    },
    progressCardLight: {
      backgroundColor: "#fff",
      borderColor: "rgba(209, 170, 103, 0.45)",
    },
    progressCardTopAccent: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 2,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
    },
    progressHead: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      marginBottom: 14,
    },
    progressMarket: { fontSize: 17, flexShrink: 1, paddingRight: 8 },
    progressTier: {
      flexShrink: 0,
      backgroundColor: GOLD_SOFT,
      borderRadius: 100,
      paddingHorizontal: 12,
      paddingTop: Platform.OS === "ios" ? 5 : 4,
      paddingBottom: Platform.OS === "ios" ? 5 : 4,
    },
    progressTierText: {
      color: "#1a1408",
      fontSize: 12,
      lineHeight: 16,
      fontFamily: fontFamilySemiBold,
      letterSpacing: 0.3,
      includeFontPadding: false,
    },
    progressTrack: {
      height: 8,
      borderRadius: 100,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      borderRadius: 100,
    },
    progressScale: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 8,
      gap: 8,
    },
    progressRemain: {
      marginTop: 12,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "400",
    },
    loginLink: { marginTop: 12 },
    loginLinkText: { color: GOLD, fontSize: 14 },
    marketTabs: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 8,
      marginTop: 16,
      marginBottom: 12,
    },
    marketTab: {
      borderWidth: 1,
      borderColor: GOLD_BORDER,
      backgroundColor: "transparent",
      borderRadius: 100,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    marketTabActive: {
      backgroundColor: GOLD,
      borderColor: GOLD,
    },
    tierGrid: { gap: 10 },
    tierCard: {
      backgroundColor: isDark ? "#141417" : "#fff",
      borderWidth: 2,
      borderColor: isDark ? "#26262b" : "#e8e4da",
      borderTopWidth: 3,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      position: "relative",
    },
    tierCardLight: {
      backgroundColor: "#fff",
    },
    yourTierTag: {
      position: "absolute",
      top: 10,
      right: 10,
      borderRadius: 20,
      paddingHorizontal: 8,
      paddingTop: Platform.OS === "ios" ? 4 : 3,
      paddingBottom: Platform.OS === "ios" ? 4 : 3,
      zIndex: 2,
    },
    yourTierTagText: {
      color: "#111",
      fontSize: 10,
      lineHeight: 13,
      fontFamily: fontFamilySemiBold,
      includeFontPadding: false,
    },
    tierHead: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 2,
      paddingRight: 64,
    },
    tierHex: {
      width: 32,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
    },
    tierName: { fontSize: 16 },
    tierVolLabel: { fontSize: 11, marginTop: 8 },
    tierVolValue: { fontSize: 13, marginTop: 2, marginBottom: 8 },
    tierFees: { flexDirection: "row", gap: 8 },
    tierFee: {
      flex: 1,
      backgroundColor: "#0b0b0d",
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    tierFeeLight: {
      backgroundColor: "#f4f1ea",
    },
    tierFeeLabel: { color: "#80808a", fontSize: 10, marginBottom: 2 },
    tierFeeValue: { fontSize: 13 },
    tierSave: { marginTop: 8, fontSize: 12 },
    benefitsSection: {
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 12,
      backgroundColor: isDark ? PAGE_BG_DARK : PAGE_BG_LIGHT,
    },
    benefitsHeading: {
      textAlign: "center",
      fontSize: 20,
      lineHeight: 26,
      marginBottom: 12,
    },
    benefitGrid: { gap: 10 },
    benefitCard: {
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderWidth: 1,
    },
    benefitCardLight: {
      backgroundColor: "#fff",
    },
    benefit_gold: {
      backgroundColor: isDark ? "#1a1610" : "#fffaf0",
      borderColor: "rgba(217, 178, 106, 0.32)",
    },
    benefit_emerald: {
      backgroundColor: isDark ? "#0f1a15" : "#f0faf5",
      borderColor: "rgba(62, 207, 142, 0.28)",
    },
    benefit_purple: {
      backgroundColor: isDark ? "#16101f" : "#f7f2ff",
      borderColor: "rgba(167, 107, 255, 0.28)",
    },
    benefit_blue: {
      backgroundColor: isDark ? "#0f1524" : "#f1f5ff",
      borderColor: "rgba(79, 140, 255, 0.28)",
    },
    benefit_copper: {
      backgroundColor: isDark ? "#1c130f" : "#fff5f0",
      borderColor: "rgba(243, 138, 94, 0.28)",
    },
    benefitTopRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 6,
    },
    benefitTitle: { color: "#fff", fontSize: 14, flex: 1 },
    benefitText: { color: "#b5b5b5", fontSize: 12, lineHeight: 17 },
  });

export default VipServices;
