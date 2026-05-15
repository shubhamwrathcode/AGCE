import React, { useCallback, useEffect, useState, useRef } from "react";
import { Animated, AppState, Dimensions, StyleSheet, TouchableOpacity, View, ScrollView, FlatList, useWindowDimensions, Modal, Linking } from "react-native";
import {
  AppSafeAreaView,
  AppText,
  Button,
  RED,
  SEMI_BOLD,
  FOURTEEN,
  SIXTEEN,
  TWELVE,
  THIRTEEN,
  ELEVEN,
  EIGHTEEN,
  BOLD,
  TEN,
  TWENTY_TWO,
  MEDIUM,
  TWENTY,
  FIFTEEN,
} from "../../shared";
import FastImage from "react-native-fast-image";
import {
  kyc_pending,
  closeIcon,
  checkIc,
  downIcon,
  upIcon,
  kyc_verification_vector,
  withdrawIcon,
  depositIcon,
  p2p_Icon,
  tradeIcon,
  giftIc,
  verification_gift,
  identity_verification,
  newLock,
  failed,
  bonus_image,
  verify_lock,
  pending_kyc,
  kyc_success_vector,
  kyc_complete,
  verified_kyc,
  back_ic,
} from "../../helper/ImageAssets";
import KeyBoardAware from "../../shared/components/KeyboardAware";
import NavigationService from "../../navigation/NavigationService";
import { KYC_STEP_ONE_SCREEN, KYC_RESUBMIT_SCREEN, TRADE_SCREEN, NAVIGATION_BOTTOM_TAB_STACK, CREATE_TICKET_SCREEN } from "../../navigation/routes";
import { useFocusEffect } from "@react-navigation/native";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { setLoading } from "../../slices/authSlice";
import { getUserProfile, getKycStatus, createKycSession } from "../../actions/accountActions";
import KycStepHeader from "./KycStepHeader";
import { useTheme } from "../../hooks/useTheme";
import WebView from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import RBSheet from "react-native-raw-bottom-sheet";
import { colors, lightTheme } from "../../theme/colors";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SHIMMER_STRIP = 180;
const SIDE_PAD = 16;
const CARD_W = SCREEN_WIDTH - SIDE_PAD * 2;

// ─── Shimmer cell ────────────────────────────────────────────────────────────
const ShimmerCell = ({ width: w, height, borderRadius = 6, style }) => {
  const { colors: themeColors, isDark } = useTheme();
  const shimmerX = useRef(new Animated.Value(-SHIMMER_STRIP)).current;
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    const run = () => {
      if (!mounted.current) return;
      shimmerX.setValue(-SHIMMER_STRIP);
      Animated.timing(shimmerX, {
        toValue: Math.max(w, 1) + SHIMMER_STRIP,
        duration: 1100,
        useNativeDriver: true,
      }).start(({ finished }) => { if (mounted.current && finished) run(); });
    };
    const t = setTimeout(run, 50);
    return () => { mounted.current = false; clearTimeout(t); shimmerX.stopAnimation(); };
  }, [shimmerX, w]);
  return (
    <View style={[{ width: w, height, borderRadius, overflow: "hidden", backgroundColor: themeColors.themeElevationColor }, style]}>
      <Animated.View
        pointerEvents="none"
        style={{ position: "absolute", top: 0, bottom: 0, width: SHIMMER_STRIP, transform: [{ translateX: shimmerX }], backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)" }}
      />
    </View>
  );
};

// ─── KYC Status card skeleton (only the dynamic top card) ────────────────────
const KycStatusSkeleton = () => {
  const { colors: themeColors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: "center", paddingTop: 10 }}>
      {/* Avatar Skeleton */}
      <ShimmerCell width={70} height={70} borderRadius={35} style={{ marginBottom: 16 }} />

      {/* Name & Badge Skeleton */}
      <ShimmerCell width={180} height={18} borderRadius={4} style={{ marginBottom: 10 }} />
      <ShimmerCell width={100} height={26} borderRadius={8} style={{ marginBottom: 25 }} />

      {/* Message Box Skeleton */}
      <ShimmerCell width={CARD_W} height={80} borderRadius={12} style={{ marginBottom: 25 }} />

      {/* Button Skeleton */}
      <ShimmerCell width={CARD_W} height={48} borderRadius={12} style={{ marginBottom: 20 }} />
      <ShimmerCell width={80} height={14} borderRadius={4} style={{ marginBottom: 30 }} />

      {/* Reward Card Skeleton */}
      <ShimmerCell width={CARD_W} height={70} borderRadius={16} style={{ marginBottom: 25 }} />

      {/* Table Skeleton */}
      <View style={{ width: "100%", marginTop: 10 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 15 }}>
          <ShimmerCell width={80} height={12} borderRadius={4} />
          <ShimmerCell width={60} height={12} borderRadius={4} />
          <ShimmerCell width={60} height={12} borderRadius={4} />
        </View>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.03)" }}>
            <ShimmerCell width={100} height={14} borderRadius={4} />
            <ShimmerCell width={30} height={14} borderRadius={4} />
            <ShimmerCell width={16} height={16} borderRadius={8} />
          </View>
        ))}
      </View>
    </View>
  );
};

/** Matches `arab_global_exchange` KycPage `displayName` useMemo + `ViewComplete` / `ViewFailed` initials. */
const KYC_AVATAR_GRADIENT = ["#a684ff", "#ad46ff", "#4f39f6"];
const KYC_AVATAR_GRADIENT_LOCATIONS = [0, 0.5, 1];

function kycWebAlignedDisplayName(userData) {
  const name = userData?.display_name || userData?.user_login || userData?.user_nicename;
  if (name) return `AGCE ${name}`;

  const e = userData?.emailId ?? userData?.email;
  if (!e) return "AGCE User";
  const local = String(e).split("@")[0];
  return `AGCE User-${local.slice(0, 8)}`;
}

function kycWebAlignedInitials(userData) {
  const name = userData?.display_name || userData?.user_login || userData?.user_nicename || "User";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function KycAvatarInitialsRing({ initials }) {
  return (
    <LinearGradient
      colors={KYC_AVATAR_GRADIENT}
      locations={KYC_AVATAR_GRADIENT_LOCATIONS}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: 64,
        height: 64,
        borderRadius: 36,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <AppText type={FIFTEEN} style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "400", letterSpacing: -0.45 }}>
        {initials}
      </AppText>
    </LinearGradient>
  );
}
const UnlockedFeatures = () => {
  const { colors: themeColors, isDark } = useTheme();
  return (
    <View style={{ marginTop: 24 }}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
        <View style={{ width: 4, height: 16, backgroundColor: themeColors.green, borderRadius: 2, marginRight: 10 }} />
        <AppText type={SIXTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text }}>
          Benefits Unlocked
        </AppText>
      </View>

      <View style={{ gap: 12 }}>
        {[
          { title: "Unlimited Withdrawals", desc: "Send crypto anywhere, anytime.", icon: withdrawIcon },
          { title: "Full Deposit Access", desc: "Add funds with maximum limits.", icon: depositIcon },
          { title: "Spot & Futures", desc: "Trade over 200+ pairs instantly.", icon: tradeIcon },
          { title: "P2P Trading", desc: "Secure peer-to-peer exchanges.", icon: p2p_Icon }
        ].map((item, index) => (
          <View key={index} style={[styles.featureCard, { backgroundColor: isDark ? "#1E222D" : "#F9FAFB", borderColor: themeColors.border }]}>
            <View style={[styles.featureIconWrap, { backgroundColor: "rgba(16, 185, 129, 0.1)" }]}>
              <FastImage source={item.icon} style={{ width: 22, height: 22 }} tintColor={themeColors.green} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text, marginBottom: 2 }}>{item.title}</AppText>
              <AppText type={TWELVE} style={{ color: themeColors.secondaryText }}>{item.desc}</AppText>
            </View>
            <FastImage source={checkIc} style={{ width: 16, height: 16 }} tintColor={themeColors.green} />
          </View>
        ))}
      </View>
    </View>
  );
};

const KycPending = ({ showResubmitButton, onResubmitPress }) => {
  const { colors: themeColors, isDark } = useTheme();
  const userData = useAppSelector((state) => state.auth.userData);
  const isLoading = useAppSelector((state) => state.auth.isLoading);

  const displayName = kycWebAlignedDisplayName(userData);
  const initials = kycWebAlignedInitials(userData);
  const orangeColor = "#F59E0B";

  return (
    <View style={{ flex: 1, alignItems: "center", paddingTop: 10 }}>
      {/* Profile Header */}
      <View style={{ alignItems: "center", marginBottom: 20 }}>
        <KycAvatarInitialsRing initials={initials} size={70} />
        <AppText type={EIGHTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text, marginTop: 16, marginBottom: 8 }}>
          {displayName}
        </AppText>
        <View style={[styles.statusBadge, { backgroundColor: "rgba(245, 158, 11, 0.1)" }]}>
          <FastImage source={pending_kyc} style={{ width: 18, height: 18, marginRight: 6 }} tintColor={orangeColor} />
          <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: orangeColor }}>Pending</AppText>
        </View>
      </View>

      {/* Info Message Box */}
      <View style={[styles.statusMessageBox, { borderLeftColor: orangeColor, borderLeftWidth: 4 }]}>
        <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
          <View style={[styles.statusIconWrap, { backgroundColor: "rgba(245, 158, 11, 0.1)" }]}>
            <FastImage source={pending_kyc} style={{ width: 24, height: 24 }} tintColor={orangeColor} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <AppText type={TWELVE} style={{ color: themeColors.text, lineHeight: 20 }}>
              Your KYC verification is currently under review. Please ensure that the uploaded document is a clear photo of your original ID. Scanned or copied documents are not accepted.
            </AppText>
          </View>
        </View>
      </View>

      {/* Actions (if resubmit allowed) */}
      <View style={{ width: "100%", marginVertical: 20 }}>
        <Button
          children={showResubmitButton ? "Update Information" : "Under Review"}
          onPress={showResubmitButton ? onResubmitPress : null}
          loading={isLoading}
          disabled={!showResubmitButton}
          containerStyle={styles.primaryActionBtn}
          titleStyle={styles.primaryActionBtnText}
        />
        <TouchableOpacity
          onPress={() => NavigationService.navigate(CREATE_TICKET_SCREEN)}
          style={{ alignSelf: "center", marginTop: 12 }}
        >
          <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text, textDecorationLine: "underline" }}>
            Need Help?
          </AppText>
        </TouchableOpacity>
      </View>

      {/* Reward Banner */}
      <View style={[styles.kycRewardCard, { backgroundColor: isDark ? "#1E222D" : "#F9FAFB" }]}>
        <FastImage source={bonus_image} style={{ width: 64, height: 50, marginRight: 16 }} resizeMode="contain" />
        <View style={{ flex: 1 }}>
          <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: themeColors.text }}>
            Complete verification to receive{" "}
            <AppText style={{ color: colors.orangeTheme }} weight={MEDIUM}>10 USDT</AppText>
          </AppText>
        </View>
      </View>

      {/* Privileges Table */}
      <View style={{ width: "100%", marginTop: 10 }}>
        <View style={styles.tableHeaderRow}>
          <AppText type={THIRTEEN} weight={MEDIUM} style={{ flex: 1.5, color: "#9CA3AF" }}>Privileges</AppText>
          <AppText type={THIRTEEN} weight={MEDIUM} style={{ flex: 1, color: "#9CA3AF", textAlign: "center" }}>Not Verified</AppText>
          <AppText type={THIRTEEN} weight={MEDIUM} style={{ flex: 1, color: "#9CA3AF", textAlign: "right" }}>Verified</AppText>
        </View>
        {[
          { label: "Withdrawal", value: "--", locked: true },
          { label: "Deposit", value: "--", locked: true },
          { label: "Trading", value: "--", locked: true },
          { label: "P2P", value: "--", locked: true },
        ].map((item, idx) => (
          <View key={idx} style={styles.tableDataRow}>
            <AppText type={FOURTEEN} weight={MEDIUM} style={{ flex: 1.5, color: themeColors.text }}>{item.label}</AppText>
            <AppText type={FOURTEEN} weight={MEDIUM} style={{ flex: 1, color: themeColors.text, textAlign: "center" }}>{item.value}</AppText>
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <FastImage source={verify_lock} style={{ width: 16, height: 16 }} tintColor="#9CA3AF" />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const KycRejected = ({ onVerifyPress }) => {
  const { colors: themeColors, isDark } = useTheme();
  const userData = useAppSelector((state) => state.auth.userData);
  const isLoading = useAppSelector((state) => state.auth.isLoading);
  const kyc_reject_reason = userData?.kyc_reject_reason;

  const displayName = kycWebAlignedDisplayName(userData);
  const initials = kycWebAlignedInitials(userData);
  const userId = userData?.user_id || "User-ID";

  return (
    <View style={{ flex: 1, alignItems: "center", paddingTop: 10 }}>
      {/* Profile Header */}
      <View style={{ alignItems: "center", marginBottom: 20 }}>
        <KycAvatarInitialsRing initials={initials} size={70} />
        <AppText type={EIGHTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text, marginTop: 16, marginBottom: 8 }}>
          {displayName}
        </AppText>
        <View style={[styles.statusBadge, { backgroundColor: "rgba(239, 68, 68, 0.1)" }]}>
          <FastImage source={failed} style={{ width: 18, height: 18, marginRight: 6 }} tintColor={themeColors.red} />
          <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: themeColors.red }}>Failed</AppText>
        </View>
      </View>

      {/* Error Message Box */}
      <View style={[styles.statusMessageBox, { borderLeftColor: themeColors.red, borderLeftWidth: 4 }]}>
        <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
          <View style={[styles.statusIconWrap, { backgroundColor: 'transparent' }]}>
            <FastImage source={failed} style={{ width: 24, height: 24 }} tintColor={themeColors.red} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <AppText type={TWELVE} style={{ color: themeColors.text, lineHeight: 20 }}>
              {kyc_reject_reason || "Your verification is incomplete. Please submit the required details and complete facial recognition."}
            </AppText>
          </View>
        </View>
      </View>

      {/* Primary Actions */}
      <View style={{ width: "100%", marginVertical: 20 }}>
        <Button
          children="Try Again"
          onPress={onVerifyPress}
          loading={isLoading}
          containerStyle={styles.primaryActionBtn}
          titleStyle={styles.primaryActionBtnText}
        />
        <TouchableOpacity
          onPress={() => NavigationService.navigate(CREATE_TICKET_SCREEN)}
          style={{ alignSelf: "center", marginTop: 12 }}
        >
          <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: themeColors.text, textDecorationLine: "underline" }}>
            Need Help?
          </AppText>
        </TouchableOpacity>
      </View>

      {/* Reward Banner */}
      <View style={[styles.kycRewardCard, { backgroundColor: isDark ? "#1E222D" : "#F9FAFB" }]}>
        <FastImage source={bonus_image} style={{ width: 64, height: 50, marginRight: 16 }} resizeMode="contain" />
        <View style={{ flex: 1 }}>
          <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: themeColors.text }}>
            Complete verification to receive{" "}
            <AppText style={{ color: colors.orangeTheme }} weight={MEDIUM}>10 USDT</AppText>
          </AppText>
        </View>
      </View>

      {/* Privileges Table */}
      <View style={{ width: "100%", marginTop: 10 }}>
        <View style={styles.tableHeaderRow}>
          <AppText type={THIRTEEN} weight={MEDIUM} style={{ flex: 1.5, color: "#9CA3AF" }}>Privileges</AppText>
          <AppText type={THIRTEEN} weight={MEDIUM} style={{ flex: 1, color: "#9CA3AF", textAlign: "center" }}>Not Verified</AppText>
          <AppText type={THIRTEEN} weight={MEDIUM} style={{ flex: 1, color: "#9CA3AF", textAlign: "right" }}>Verified</AppText>
        </View>
        {[
          { label: "Withdrawal", value: "--", locked: true },
          { label: "Deposit", value: "--", locked: true },
          { label: "Trading", value: "--", locked: true },
          { label: "P2P", value: "--", locked: true },
        ].map((item, idx) => (
          <View key={idx} style={styles.tableDataRow}>
            <AppText type={FOURTEEN} weight={MEDIUM} style={{ flex: 1.5, color: themeColors.text }}>{item.label}</AppText>
            <AppText type={FOURTEEN} weight={MEDIUM} style={{ flex: 1, color: themeColors.text, textAlign: "center" }}>{item.value}</AppText>
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <FastImage source={verify_lock} style={{ width: 16, height: 16 }} tintColor="#9CA3AF" />
            </View>
          </View>
        ))}
      </View>

      {/* Business Verification Footer */}
      {/* <TouchableOpacity style={{ marginTop: 30, marginBottom: 20 }}>
        <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text, textDecorationLine: "underline" }}>
          Business Verification
        </AppText>
      </TouchableOpacity> */}
    </View>
  );
};

const KycDue = ({ onVerifyPress }) => {
  const { colors: themeColors, isDark } = useTheme();
  const isLoading = useAppSelector((state) => state.auth.isLoading);

  return (
    <View style={{ flex: 1, alignItems: "center", paddingTop: 20, justifyContent: 'space-between' }}>
      <View style={{ alignItems: 'center', width: '100%' }}>
        {/* Main Illustration */}
        <FastImage
          source={identity_verification}
          resizeMode="contain"
          style={{ width: 250, height: 180, marginBottom: 10 }}
        />

        {/* Title & Subtitle */}
        <AppText type={TWENTY_TWO} weight={SEMI_BOLD} style={{ color: "#111827", textAlign: "center", marginBottom: 10 }}>
          Complete Identity Verification
        </AppText>
        <AppText type={FOURTEEN} style={{ color: "#6B7280", textAlign: "center", paddingHorizontal: 30, marginBottom: 12 }}>
          Unlock deposits, trading, and payments by verifying your account.
        </AppText>

        {/* Reward & Info Box */}
        <View style={[styles.rewardBox, { borderColor: lightTheme.input, borderWidth: 1, padding: 0, overflow: 'hidden' }]}>
          {/* Top Section with Background */}
          <View style={{ backgroundColor: isDark ? "#2A2E39" : lightTheme.input, padding: 12 }}>
            <View style={styles.rewardHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                <FastImage source={newLock} style={{ width: 22, height: 22, marginRight: 10 }} tintColor="#B47D16" />
                <AppText type={FOURTEEN} style={{ color: themeColors.text }}>
                  Verify to claim <AppText style={{ color: "#D1AA67" }} weight={SEMI_BOLD}>15 USDT</AppText>
                </AppText>
              </View>
              {/* Mock Timer */}
              <View style={{ flexDirection: "row", gap: 4 }}>
                {["3D", "02", "23", "22"].map((t, i) => (
                  <View key={i} style={styles.timerBlock}>
                    <AppText type={TEN} weight={BOLD} style={{ color: "#FFF" }}>{t}</AppText>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Bottom Section (Transparent) */}
          <View style={{ padding: 16 }}>
            <View style={styles.checkStep}>
              <View style={styles.bullet} />
              <AppText type={THIRTEEN} style={{ color: colors.black }}>Submit your basic details</AppText>
            </View>
            <View style={styles.checkStep}>
              <View style={styles.bullet} />
              <AppText type={THIRTEEN} style={{ color: colors.black }}>Complete document & facial verification</AppText>
            </View>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={{ width: "100%", position: "absolute", bottom: 0 }}>
        <Button
          children="Verify Now"
          onPress={onVerifyPress}
          loading={isLoading}
          containerStyle={styles.primaryActionBtn}
          titleStyle={styles.primaryActionBtnText}
        />
      </View>
    </View>
  );
};

const KycCompleted = () => {
  const { colors: themeColors, isDark } = useTheme();
  const userData = useAppSelector((state) => state.auth.userData);

  const displayName = kycWebAlignedDisplayName(userData);
  const initials = kycWebAlignedInitials(userData);
  const greenColor = themeColors.green || "#10B981";

  return (
    <View style={{ flex: 1, alignItems: "center", paddingTop: 10 }}>
      {/* Success Header */}
      <View style={{ alignItems: "center", marginBottom: 20 }}>
        <FastImage
          source={kyc_success_vector}
          style={{ width: 120, height: 120, marginBottom: 10 }}
          resizeMode="contain"
        />
        <AppText type={EIGHTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text, marginTop: 10, marginBottom: 8 }}>
          {displayName}
        </AppText>
        <View style={[styles.statusBadge, { backgroundColor: "rgba(16, 185, 129, 0.1)" }]}>
          <FastImage source={kyc_complete} style={{ width: 18, height: 18, marginRight: 6 }} tintColor={greenColor} />
          <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: greenColor }}>Successful</AppText>
        </View>
      </View>

      {/* Info Message Box */}
      <View style={[styles.statusMessageBox, { borderLeftColor: greenColor, borderLeftWidth: 4 }]}>
        <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
          <View style={[styles.statusIconWrap, {}]}>
            <FastImage source={kyc_complete} style={{ width: 24, height: 24 }} tintColor={greenColor} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <AppText type={TWELVE} style={{ color: themeColors.text, lineHeight: 20 }}>
              Your identity verification is complete. You now have full access to all features, including higher limits and P2P trading.
            </AppText>
          </View>
        </View>
      </View>

      {/* Primary Actions */}
      <View style={{ width: "100%", marginVertical: 20 }}>
        <Button
          children="Go to Dashboard"
          onPress={() => NavigationService.navigate(NAVIGATION_BOTTOM_TAB_STACK)}
          containerStyle={styles.primaryActionBtn}
          titleStyle={styles.primaryActionBtnText}
        />
        <TouchableOpacity
          onPress={() => NavigationService.navigate(CREATE_TICKET_SCREEN)}
          style={{ alignSelf: "center", marginTop: 12 }}
        >
          <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: themeColors.text, textDecorationLine: "underline" }}>
            Need Help?
          </AppText>
        </TouchableOpacity>
      </View>

      {/* Reward Banner */}
      <View style={[styles.kycRewardCard, { backgroundColor: isDark ? "#1E222D" : "#F9FAFB" }]}>
        <FastImage source={bonus_image} style={{ width: 64, height: 50, marginRight: 16 }} resizeMode="contain" />
        <View style={{ flex: 1 }}>
          <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: themeColors.text }}>
            Verification complete! You've received{" "}
            <AppText style={{ color: colors.orangeTheme }} weight={MEDIUM}>10 USDT</AppText>
          </AppText>
        </View>
      </View>

      {/* Privileges Table */}
      <View style={{ width: "100%", marginTop: 10 }}>
        <View style={styles.tableHeaderRow}>
          <AppText type={THIRTEEN} weight={MEDIUM} style={{ flex: 1.5, color: "#9CA3AF" }}>Privileges</AppText>
          <AppText type={THIRTEEN} weight={MEDIUM} style={{ flex: 1, color: "#9CA3AF", textAlign: "center" }}>Not Verified</AppText>
          <AppText type={THIRTEEN} weight={MEDIUM} style={{ flex: 1, color: "#9CA3AF", textAlign: "right" }}>Verified</AppText>
        </View>
        {[
          { label: "Withdrawal", value: "--" },
          { label: "Deposit", value: "--" },
          { label: "Trading", value: "--" },
          { label: "P2P", value: "--" },
        ].map((item, idx) => (
          <View key={idx} style={styles.tableDataRow}>
            <AppText type={FOURTEEN} weight={MEDIUM} style={{ flex: 1.5, color: themeColors.text }}>{item.label}</AppText>
            <AppText type={FOURTEEN} weight={MEDIUM} style={{ flex: 1, color: themeColors.text, textAlign: "center" }}>{item.value}</AppText>
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <FastImage source={verified_kyc} style={{ width: 16, height: 16 }} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

/** Didit return: custom scheme from web `KycSubmittedPage`, or HTTPS success page from `createKycSession` `returnUrl`. */
function shouldCloseDiditKycWebView(url) {
  if (!url || typeof url !== "string") return false;
  const u = url.toLowerCase();
  if (u.startsWith("agce://") && u.includes("kyc")) return true;
  if (u.includes("/kyc/submitted")) return true;
  return false;
}

const faqData = [
  { q: "How to complete individual KYC?", a: "Upload a valid government-issued ID, complete the liveness check when prompted, and submit your details in the Verification Center. This usually takes 2–5 minutes." },
  { q: "How to complete business KYC?", a: "Provide business registration documents, beneficial owner information, and any extra forms requested. Our team may review submissions as part of compliance checks." },
  { q: "Why is KYC verification required?", a: "To protect your assets and promote a secure, compliant crypto environment, AGCE requires all users to complete KYC (Know Your Customer) verification. This helps prevent fraud, money laundering, and other illicit activities. Once your KYC is verified, you'll gain access to key platform features including crypto deposits and withdrawals, P2P trading, and participation in events like Launchpool." },
  { q: "Why is an advanced verification necessary?", a: "Advanced verification unlocks higher limits. Rewards Hub with exclusive beginner rewards, and gain access to more platform features, including deposits, buy crypto, trade, and more." },
];

const KycStatus = () => {
  const { colors: themeColors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const userData = useAppSelector((state) => state.auth.userData);
  const dispatch = useAppDispatch();
  const { width: screenWidth } = useWindowDimensions();
  const kycVerified = userData?.kycVerified != null ? Number(userData.kycVerified) : 0;

  const [idDocStatus, setIdDocStatus] = useState(null);
  const [taxDocStatus, setTaxDocStatus] = useState(null);
  const [selfieStatus, setSelfieStatus] = useState(null);
  const [submittedIdDocType, setSubmittedIdDocType] = useState(null);
  const [submittedTaxDocType, setSubmittedTaxDocType] = useState(null);
  const [documentsToResubmit, setDocumentsToResubmit] = useState([]);
  const [existingIdDocNumber, setExistingIdDocNumber] = useState("");
  const [existingTaxDocNumber, setExistingTaxDocNumber] = useState("");
  const [existingCountryCode, setExistingCountryCode] = useState("");
  const [faqActiveIndex, setFaqActiveIndex] = useState(null);
  const [contentLoading, setContentLoading] = useState(true);
  const [diditWebviewUrl, setDiditWebviewUrl] = useState(null);
  /** After opening Didit (in-app WebView or external browser), refresh when user returns / flow completes. */
  const diditExternalOpenedRef = useRef(false);
  const diditWebCompleteOnceRef = useRef(false);

  const faqSheetRef = useRef(null);

  const applyKycStatusData = useCallback((data) => {
    if (!data) return;
    setIdDocStatus(data.id_document_status ?? null);
    setTaxDocStatus(data.tax_document_status ?? null);
    setSelfieStatus(data.selfie_status ?? null);
    if (data.kyc_data) {
      setSubmittedIdDocType(data.kyc_data.id_document_type ?? null);
      setSubmittedTaxDocType(data.kyc_data.tax_document_type ?? null);
      setExistingCountryCode(data.kyc_data.country_code ?? "");
      if (data.kyc_data.id_document_number) setExistingIdDocNumber(data.kyc_data.id_document_number);
      if (data.kyc_data.tax_document_number) setExistingTaxDocNumber(data.kyc_data.tax_document_number);
    }
    if (data.needs_resubmission) {
      setDocumentsToResubmit(data.documents_needing_resubmission || []);
    }
  }, []);

  const refreshAfterDiditFlow = useCallback(() => {
    diditExternalOpenedRef.current = false;
    dispatch(getUserProfile(false, false, true));
    void dispatch(getKycStatus()).then((data) => {
      applyKycStatusData(data);
    });
  }, [dispatch, applyKycStatusData]);

  const closeDiditWebview = useCallback(() => {
    diditWebCompleteOnceRef.current = false;
    setDiditWebviewUrl(null);
    diditExternalOpenedRef.current = false;
  }, []);

  const tryFinishDiditFromUrl = useCallback(
    (url) => {
      if (!shouldCloseDiditKycWebView(url) || diditWebCompleteOnceRef.current) return;
      diditWebCompleteOnceRef.current = true;
      setDiditWebviewUrl(null);
      diditExternalOpenedRef.current = false;
      refreshAfterDiditFlow();
    },
    [refreshAfterDiditFlow]
  );

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active" && diditExternalOpenedRef.current && !diditWebviewUrl) {
        refreshAfterDiditFlow();
      }
    });
    return () => sub.remove();
  }, [diditWebviewUrl, refreshAfterDiditFlow]);

  useFocusEffect(
    useCallback(() => {
      dispatch(setLoading(true));
      return () => {
        dispatch(setLoading(false));
      };
    }, [dispatch])
  );

  useEffect(() => {
    dispatch(getUserProfile());
  }, [dispatch]);

  // Initial Fetch & Polling
  useEffect(() => {
    let mounted = true;

    const fetchStatus = async () => {
      const data = await dispatch(getKycStatus());
      if (!mounted) return;

      setContentLoading(false);
      dispatch(setLoading(false));

      if (!data) return;
      applyKycStatusData(data);
    };

    fetchStatus(); // initial fetch

    // Poll every 3 seconds if not Approved (2) or Rejected (3)
    let intervalId = null;
    if (kycVerified !== 2 && kycVerified !== 3) {
      intervalId = setInterval(() => {
        dispatch(getUserProfile(false, false, true)); // Skip global loading
        fetchStatus();
      }, 3000);
    }

    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [dispatch, kycVerified, applyKycStatusData]);

  const getRejectReason = (docType) => {
    const doc = documentsToResubmit.find((d) => d.type === docType);
    return doc?.reason || "";
  };

  const openVerifyModal = async () => {
    const sessionResponse = await dispatch(createKycSession(userData));
    const diditOpenUrl = sessionResponse?.diditUrl || sessionResponse?.url;
    if (diditOpenUrl) {
      diditExternalOpenedRef.current = true;
      diditWebCompleteOnceRef.current = false;
      setDiditWebviewUrl(diditOpenUrl);
    } else {
      NavigationService.navigate(KYC_STEP_ONE_SCREEN, { resetForm: true });
    }
  };

  const openResubmitModal = async () => {
    const sessionResponse = await dispatch(createKycSession(userData));
    const diditOpenUrl = sessionResponse?.diditUrl || sessionResponse?.url;
    if (diditOpenUrl) {
      diditExternalOpenedRef.current = true;
      diditWebCompleteOnceRef.current = false;
      setDiditWebviewUrl(diditOpenUrl);
    } else {
      NavigationService.navigate(KYC_RESUBMIT_SCREEN, {
        documentsToResubmit: documentsToResubmit || [],
        existingCountryCode: existingCountryCode || "",
        submittedIdDocType: submittedIdDocType || null,
        submittedTaxDocType: submittedTaxDocType || null,
        resubmitIdNumber: existingIdDocNumber || "",
        resubmitTaxNumber: existingTaxDocNumber || "",
      });
    }
  };



  const kycStatusView = () => {
    switch (1) {
      case 0: return <KycDue onVerifyPress={openVerifyModal} screenWidth={screenWidth} />;
      case 1: return <KycPending idDocStatus={idDocStatus} taxDocStatus={taxDocStatus} selfieStatus={selfieStatus} submittedIdDocType={submittedIdDocType} submittedTaxDocType={submittedTaxDocType} />;
      case 2: return <KycCompleted />;
      case 3: return <KycRejected onVerifyPress={openVerifyModal} />;
      case 4: return <KycPending idDocStatus={idDocStatus} taxDocStatus={taxDocStatus} selfieStatus={selfieStatus} submittedIdDocType={submittedIdDocType} submittedTaxDocType={submittedTaxDocType} showResubmitButton onResubmitPress={openResubmitModal} />;
      default: return <KycDue onVerifyPress={openVerifyModal} screenWidth={screenWidth} />;
    }
  };

  return (
    <AppSafeAreaView style={{ backgroundColor: colors.white, flex: 1 }}>
      <KeyBoardAware style={{ flex: 1 }}>
        <ScrollView style={styles.mainScroll} contentContainerStyle={styles.mainScrollContent} showsVerticalScrollIndicator={false} bounces={false}>
          <KycStepHeader
            title={"Verification Center"}
            theme={isDark ? "Dark" : "Light"}
            onInfoPress={() => faqSheetRef.current?.open()}
            onSupportPress={() => Linking.openURL("https://agce.wrathcode.com/help_center").catch(() => { })}
          />
          <View style={styles.sectionWrapper}>
            {contentLoading ? <KycStatusSkeleton /> : kycStatusView()}
          </View>
        </ScrollView>
      </KeyBoardAware>

      <RBSheet
        ref={faqSheetRef}
        closeOnDragDown
        closeOnPressMask
        height={350}
        customStyles={{
          container: {
            backgroundColor: themeColors.background,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
          },
          draggableIcon: { backgroundColor: isDark ? "#374151" : "#E5E7EB", width: 40 },
        }}
      >
        <View style={{ flex: 1, paddingHorizontal: 20, paddingBottom: 20 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <AppText type={EIGHTEEN} weight={BOLD} style={{ color: themeColors.text }}>Frequently Asked Questions</AppText>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {faqData.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.faqItemInner,
                  { borderBottomColor: themeColors.border },
                  index === faqData.length - 1 && { borderBottomWidth: 0 }
                ]}
              >
                <TouchableOpacity
                  style={styles.faqQuestionRow}
                  onPress={() => setFaqActiveIndex(faqActiveIndex === index ? null : index)}
                  activeOpacity={0.7}
                >
                  <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text, flex: 1 }}>{item.q}</AppText>
                  <FastImage
                    source={faqActiveIndex === index ? upIcon : downIcon}
                    resizeMode="contain"
                    style={{ width: 12, height: 12 }}
                    tintColor={themeColors.secondaryText}
                  />
                </TouchableOpacity>
                {faqActiveIndex === index && (
                  <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.05)" }}>
                    <AppText type={THIRTEEN} style={{ color: themeColors.secondaryText, lineHeight: 20 }}>{item.a}</AppText>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      </RBSheet>

      <Modal visible={!!diditWebviewUrl} animationType="slide" presentationStyle="fullScreen" onRequestClose={closeDiditWebview}>
        <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: colors.white }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 12,
              paddingVertical: 10,
              // borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: themeColors.border,
            }}
          >
            <TouchableOpacity onPress={closeDiditWebview} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} accessibilityRole="button" accessibilityLabel="Close verification">
              <FastImage source={back_ic} style={{ width: 18, height: 18 }} resizeMode="contain" tintColor={themeColors.text} />
            </TouchableOpacity>
            <AppText type={EIGHTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text }}>
              Identity verification
            </AppText>
            <View style={{ width: 16 }} />
          </View>
          {diditWebviewUrl ? (
            <WebView
              source={{ uri: diditWebviewUrl }}
              style={{ flex: 1, backgroundColor: themeColors.background }}
              javaScriptEnabled
              domStorageEnabled
              sharedCookiesEnabled
              startInLoadingState
              setSupportMultipleWindows={true}
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              onShouldStartLoadWithRequest={(req) => {
                const url = req?.url || "";
                if (shouldCloseDiditKycWebView(url)) {
                  tryFinishDiditFromUrl(url);
                  return false;
                }
                return true;
              }}
              onNavigationStateChange={(nav) => {
                tryFinishDiditFromUrl(nav?.url);
              }}
            />
          ) : null}
        </View>
      </Modal>
    </AppSafeAreaView>
  );
};

export default KycStatus;

const styles = StyleSheet.create({
  mainScroll: { flex: 1 },
  mainScrollContent: { paddingBottom: 40, flexGrow: 1 },
  sectionWrapper: { paddingHorizontal: 16, flex: 1, paddingTop: 4 },

  mainStatusCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusMessageBox: {
    width: "100%",
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  statusIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  kycRewardCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 16,
  },
  tableHeaderRow: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  tableDataRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.03)",
  },
  rewardBox: {
    width: "100%",
    borderRadius: 16,
    padding: 16,
    marginBottom: 30,
  },
  rewardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timerBlock: {
    backgroundColor: "#000",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
    minWidth: 28,
    alignItems: "center",
  },
  rewardDivider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.05)",
    marginBottom: 12,
  },
  checkStep: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#000",
    marginRight: 12,
  },
  statusHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  statusIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  infoBox: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  errorBox: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  successBox: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },

  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  featureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  primaryActionBtn: {
    width: "100%",
    height: 54,
    backgroundColor: "#1E222D",
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryActionBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  secondaryActionBtn: {
    width: "100%",
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: "rgba(128, 128, 128, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  kycSectionCard: { borderRadius: 16, padding: 16 },
  kycSectionCardTitle: { marginBottom: 12 },
  faqListWrap: { marginTop: 4 },
  faqItemInner: {
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  faqItemInnerLast: { borderBottomWidth: 0 },
  faqQuestionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  faqQuestion: { flex: 1, lineHeight: 20 },
  faqArrow: { width: 10, height: 10, marginLeft: 8 },
  faqAnswer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
});
