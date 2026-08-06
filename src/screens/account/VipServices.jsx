import React, { useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, Modal, ImageBackground, Dimensions } from "react-native";
import FastImage from "react-native-fast-image";
import { AppSafeAreaView, AppText, NORMAL, TWENTY_SIX, TWENTY_TWO } from "../../shared";
import { EIGHTEEN, FOURTEEN, SIXTEEN, TWELVE, TWENTY, TEN } from "../../helper/Constants";
import { BOLD, MEDIUM, REGULAR, SEMI_BOLD } from "../../helper/Constants";
import NavigationService from "../../navigation/NavigationService";
import {
  vip_hero_img, vip_servies_herobg, vipserviceBanner, back_ic,
  feeNegotiation, higherLimits, slaSupport, subAccounts,
  apiLimits, autoTier, earlyAccess,
  vipOverride,
  vip0, vip1, vip2, vip3, vip4
} from "../../helper/ImageAssets";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { fontFamilyBold, fontFamilyMedium, fontFamilySemiBold } from "../../theme/typography";

const { width } = Dimensions.get("window");

const GOLD = "#D1AA67";
const DARK_BG = "#000000";
const CARD_BG = "#111111";
const BORDER = "#222222";
const TEXT_WHITE = "#FFFFFF";
const TEXT_GRAY = "rgba(255, 255, 255, 0.6)";

const vipTiers = [
  { id: 'VIP0', volume: '< $50,000', makerFee: '0.10%', takerFee: '0.15%', benefits: 'Standard access', iconColor: '#A0A0A0', image: vip0 },
  { id: 'VIP1', volume: '$50k – $500k', makerFee: '0.08%', takerFee: '0.08% / 0.12%', benefits: 'Priority support', iconColor: '#CD7F32', image: vip1 },
  { id: 'VIP2', volume: '$500k – $2M', makerFee: '0.06%', takerFee: '0.10%', benefits: 'Higher API limits', iconColor: '#50C878', image: vip2 },
  { id: 'VIP3', volume: '$2M – $10M', makerFee: '0.04%', takerFee: '0.08%', benefits: 'Dedicated manager', iconColor: '#4169E1', image: vip3 },
  { id: 'VIP4', volume: '> $10M', makerFee: 'Negotiated', takerFee: 'Negotiated', benefits: 'OTC desk access', iconColor: '#9370DB', image: vip4 },
];

const vipFeatures = [
  { title: "Auto Tier Upgrade", desc: "Based on rolling 30-day volume — calculated nightly.", image: autoTier },
  { title: "API & WS Limits", desc: "Higher rate limits and more WebSocket connection slots.", image: apiLimits },
  { title: "VIP Override", desc: "For institutional onboarding and custom support.", image: vipOverride },
  { title: "Early Access", desc: "Get early access to new product launches and token listings.", image: earlyAccess },
  { title: "Higher Limits", desc: "Enjoy higher withdrawal limits per 24h period.", image: higherLimits },
  { title: "Fee Negotiation", desc: "Tailored fee structure for VIP 4+ accounts.", image: feeNegotiation },
  { title: "SLA Support", desc: "Access a dedicated support queue with SLA response times.", image: slaSupport },
  { title: "Sub- Accounts", desc: "Operate up to 20 sub-accounts under one master account.", image: subAccounts },
];

const SectionTitle = ({ title }) => (
  <View style={styles.sectionTitleContainer}>
    <AppText style={{ color: TEXT_WHITE, marginBottom: 8, fontSize: 20, fontFamily: fontFamilySemiBold }}>
      {title}
    </AppText>
    <View style={styles.titleUnderlineContainer}>
      <View style={styles.titleLine} />
      <FastImage source={vipOverride} style={{ width: 20, height: 20 }} resizeMode="contain" />
      <View style={styles.titleLine} />
    </View>
  </View>
);

const VipServices = () => {
  const [selectedTier, setSelectedTier] = useState(null);

  const renderTierModal = () => {
    if (!selectedTier) return null;
    return (
      <Modal transparent visible animationType="fade" onRequestClose={() => setSelectedTier(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <AppText type={EIGHTEEN} weight={SEMI_BOLD} style={{ color: TEXT_WHITE }}>
                {selectedTier.id} Details
              </AppText>
              <TouchableOpacity onPress={() => setSelectedTier(null)}>
                <AppText type={TWENTY} style={{ color: TEXT_WHITE }}>×</AppText>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <DetailRow label="Tier" value={selectedTier.id} />
              <DetailRow label="30d Volume (USD)" value={selectedTier.volume} />
              <DetailRow label="Maker Fee" value={selectedTier.makerFee} />
              <DetailRow label="Taker Fee" value={selectedTier.takerFee} />
              <DetailRow label="Benefits" value={selectedTier.benefits} />
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <AppSafeAreaView style={{ backgroundColor: DARK_BG, flex: 1 }}>
      <View style={styles.customHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => NavigationService.goBack()}>
          <FastImage source={back_ic} style={styles.backIcon} tintColor={TEXT_WHITE} resizeMode="contain" />
        </TouchableOpacity>
        <AppText weight={SEMI_BOLD} style={{ color: TEXT_WHITE, fontSize: 20 }}>
          VIP Services
        </AppText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Hero Section */}
        <ImageBackground
          source={vip_servies_herobg}
          style={styles.heroSection}
          imageStyle={styles.heroBgImage}
        >
          <View style={styles.heroOverlay}>
            <FastImage
              source={vip_hero_img}
              style={styles.heroImage}
              resizeMode="contain"
            />
            <AppText style={{
              color: GOLD, marginTop: 16, marginBottom: 4, fontSize: 22,
              fontFamily: fontFamilySemiBold
            }}>
              AGCE VIP Services
            </AppText>
            <AppText style={{ color: TEXT_WHITE, fontSize: 14 }}>
              Enjoy Exclusive Privileges
            </AppText>
          </View>
        </ImageBackground>

        {/* VIP Tier Structure */}
        <View style={styles.section}>
          <SectionTitle title="VIP Tier Structure" />

          <View style={styles.tierList}>
            {vipTiers.map((tier, index) => (
              <TouchableOpacity
                disabled
                key={tier.id}
                style={styles.tierCard}
              // onPress={() => setSelectedTier(tier)}
              >
                {/* Left Side: Tier Badge */}
                <View style={[styles.tierCardLeft, { justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 8 }]}>
                  <FastImage source={tier.image} style={{ width: '100%', height: 40 }} resizeMode="contain" />
                </View>

                {/* Right Side: Details */}
                <View style={styles.tierCardRight}>
                  <View style={styles.feeColumn}>
                    <AppText style={{ color: TEXT_GRAY, fontSize: 9, marginBottom: 4 }}>Maker Fee</AppText>
                    <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: TEXT_WHITE }}>{tier.makerFee}</AppText>
                  </View>

                  <View style={styles.feeColumn}>
                    <AppText style={{ color: TEXT_GRAY, fontSize: 9, marginBottom: 4 }}>Taker Fee</AppText>
                    <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: TEXT_WHITE }}>{tier.takerFee}</AppText>
                  </View>

                  <View style={styles.benefitBadge}>
                    <AppText style={{ color: TEXT_WHITE, fontSize: 9, flex: 1 }} numberOfLines={2}>
                      {tier.benefits}
                    </AppText>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          <AppText style={{ color: TEXT_GRAY, fontSize: 9, marginTop: 8 }}>
            * 30D Volume (USD)
          </AppText>
        </View>

        {/* VIP Features */}
        <View style={styles.section}>
          <SectionTitle title="VIP Features" />

          <View style={styles.featuresContainer}>
            {vipFeatures.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <View style={styles.featureIconContainer}>
                  {feature.image ? (
                    <FastImage source={feature.image} style={{ width: 30, height: 30 }} resizeMode="contain" />
                  ) : (
                    <Icon name={feature.icon} size={28} color={GOLD} />
                  )}
                </View>
                <View style={styles.featureTextContainer}>
                  <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: GOLD, marginBottom: 4 }}>
                    {feature.title}
                  </AppText>
                  <AppText style={{ color: TEXT_GRAY, fontSize: 9, lineHeight: 12 }}>
                    {feature.desc}
                  </AppText>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Coming Soon */}
        <View style={styles.section}>
          <SectionTitle title="Coming Soon" />
          <View style={styles.vipCardContainer}>
            <FastImage
              source={vipserviceBanner}
              style={styles.vipCardImage}
              resizeMode="cover"
            />
          </View>
        </View>
        {/* <View style={{ marginTop: 20 }}></View> */}

      </ScrollView>
      {renderTierModal()}
    </AppSafeAreaView>
  );
};

const DetailRow = ({ label, value }) => (
  <View style={styles.detailRow}>
    <AppText type={FOURTEEN} style={{ color: TEXT_GRAY, flex: 1 }}>{label}</AppText>
    <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: TEXT_WHITE, flex: 1, textAlign: 'right' }}>{value}</AppText>
  </View>
);

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 40,
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: DARK_BG,
  },
  backBtn: {
  },
  backIcon: {
    width: 18,
    height: 18,
  },
  headerSpacer: {
    width: 26,
  },
  heroSection: {
    width: width,
    minHeight: 180,
    justifyContent: "center",
    alignItems: "center",
  },
  heroBgImage: {
    opacity: 0.6,
  },
  heroOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  heroImage: {
    width: 100,
    height: 100,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitleContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  titleUnderlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  titleLine: {
    height: 1,
    width: 50,
    backgroundColor: GOLD,
  },
  tierList: {
    gap: 8,
  },
  tierCard: {
    flexDirection: 'row',
    // backgroundColor: CARD_BG,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
  },
  tierCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: '#161616', // slightly lighter for distinction
    paddingVertical: 12,
    paddingHorizontal: 12,
    width: '32%',
  },
  tierCardRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  feeColumn: {
    flex: 1,
  },
  benefitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 6,
    width: '38%',
  },
  featuresContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  featureCard: {
    width: "48%",
    flexDirection: "row",
    // alignItems: "center",
    backgroundColor: CARD_BG,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(209, 170, 103, 0.2)", // Subtle gold border
    padding: 12,
  },
  featureIconContainer: {
    marginRight: 10,
  },
  featureTextContainer: {
    flex: 1,
  },
  vipCardContainer: {
    alignItems: 'center',
    width: "100%",
  },
  vipCardImage: {
    width: "100%",
    height: 180,
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    borderRadius: 16,
    padding: 20,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalBody: {
    gap: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  }
});

export default VipServices;
