import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  Modal,
} from "react-native";
import FastImage from "react-native-fast-image";
import LottieView from "lottie-react-native";
import LinearGradient from "react-native-linear-gradient";
import Toast from "react-native-simple-toast";
import { useDispatch } from "react-redux";
import {
  AppSafeAreaView,
  AppText,
  BOLD,
  FOURTEEN,
  SEMI_BOLD,
  SIXTEEN,
  THIRTEEN,
  TWELVE,
  TWENTY,
  MEDIUM,
  TWENTY_FOUR,
  FIFTEEN,
  EIGHTEEN,
} from "../../shared";
import { colors } from "../../theme/colors";
import { useTheme } from "../../hooks/useTheme";
import { useAppSelector } from "../../store/hooks";
import NavigationService from "../../navigation/NavigationService";
import * as routes from "../../navigation/routes";
import { back_ic, copyIcon, editIcon, right_arrow, right_ic } from "../../helper/ImageAssets";
import { logoutAction } from "../../actions/authActions";
import { getFundPasswordStatusAction } from "../../actions/accountActions";
import KycStepHeader from "./KycStepHeader";
import { copyText } from "../../helper/utility";
import { useFocusEffect } from "@react-navigation/native";
import { appOperation } from "../../appOperation";

const KYC_AVATAR_GRADIENT = ["#a684ff", "#ad46ff", "#4f39f6"];
const KYC_AVATAR_GRADIENT_LOCATIONS = [0, 0.5, 1];

const showComingSoonToast = () =>
  Toast.showWithGravity("Coming soon", Toast.LONG, Toast.BOTTOM);

const AccountDetails = () => {
  const dispatch = useDispatch();
  const { colors: themeColors, isDark } = useTheme();
  const userData = useAppSelector((state) => state.auth.userData);
  const [fundPasswordStatus, setFundPasswordStatus] = useState(null);
  const hasFundPassword = fundPasswordStatus ?? !!(userData?.fundPassword || userData?.payPin || userData?.isFundPasswordSet);
  const [activeTab, setActiveTab] = useState("Profile");
  const [securityMethods, setSecurityMethods] = useState({
    passkey: false,
    totp: false,
    email: false,
    mobile: false,
  });

  const fetchMethods = React.useCallback(async () => {
    try {
      const res = await appOperation.customer.get_security_methods_list();
      if (res?.success) {
        const raw =
          res?.data?.security_methods ||
          res?.data?.data?.security_methods ||
          res?.security_methods ||
          res?.data?.securityMethods ||
          {};
        setSecurityMethods({
          passkey: !!raw.passkey,
          totp: !!raw.totp,
          email: !!raw.email,
          mobile: !!(raw.mobile ?? raw.phone ?? raw.sms),
        });
      }
      const fundRes = await dispatch(getFundPasswordStatusAction());
      setFundPasswordStatus(!!fundRes);
    } catch (err) {
      console.log("Error fetching security methods:", err);
    }
  }, [dispatch]);

  useFocusEffect(
    React.useCallback(() => {
      fetchMethods();
    }, [fetchMethods])
  );
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const logoutAnim = React.useRef(new Animated.Value(0)).current;

  const openLogoutModal = () => {
    setShowLogoutModal(true);
    Animated.timing(logoutAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.back(1)),
      useNativeDriver: true,
    }).start();
  };

  const closeLogoutModal = () => {
    Animated.timing(logoutAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setShowLogoutModal(false));
  };

  const confirmLogout = () => {
    closeLogoutModal();
    dispatch(logoutAction());
  };


  const getResolvedName = () => {
    if (userData?.firstName && userData?.lastName) return `${userData.firstName} ${userData.lastName}`;
    if (userData?.first_name && userData?.last_name) return `${userData.first_name} ${userData.last_name}`;
    return userData?.firstName || userData?.first_name || userData?.display_name || userData?.userName || userData?.user_login || userData?.user_nicename || "User";
  };


  const displayName = getResolvedName();


  function getInitials(userData) {
    const name = userData?.display_name || userData?.user_login || userData?.user_nicename || userData?.first_name || userData?.firstName || "User";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  const initials = getInitials(userData);

  const maskProfileEmail = (email) => {
    if (!email || typeof email !== "string") return "";
    const at = email.indexOf("@");
    if (at < 1) return email;
    const local = email.slice(0, at);
    const domain = email.slice(at + 1);
    const head = local.slice(0, Math.min(3, local.length));
    const dom = domain.slice(0, Math.min(5, domain.length));
    return `${head}*@${dom}**`;
  };

  const maskProfilePhone = (phone) => {
    if (!phone) return "+91*****3";
    const cleaned = String(phone).replace(/\s+/g, '');
    const isIndia = cleaned.startsWith("+91") || cleaned.startsWith("91");
    const prefix = isIndia ? "+91" : "";
    const digitsOnly = cleaned.replace(/^\+91|^91/, '');
    if (digitsOnly.length < 2) return "+91*****3";
    return `${prefix}*****${digitsOnly.slice(-1)}`;
  };

  const MenuItem = ({ label, value, badge, badgeBgColor, badgeTextColor, showArrow = true, onPress, isLogout }) => (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress || showComingSoonToast}
      activeOpacity={0.7}
    >
      <View style={{ flex: 1 }}>
        <AppText
          type={FIFTEEN}
          style={{ color: isLogout ? colors.red : colors.black }}
        >
          {label}
        </AppText>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {badge && (
          <View style={[styles.badge, { backgroundColor: badgeBgColor ? badgeBgColor : (isDark ? "#2A2A2E" : "#F3F4F6") }]}>
            <AppText type={TWELVE} style={{ color: badgeTextColor ? badgeTextColor : themeColors.secondaryText }}>{badge}</AppText>
          </View>
        )}
        {value && (
          <AppText type={FOURTEEN} style={{ color: themeColors.secondaryText, marginRight: 8 }}>
            {value}
          </AppText>
        )}
        {showArrow && (
          <FastImage
            source={right_ic}
            style={{ width: 13, height: 13 }}
            tintColor={"#C1C1C1"}
            resizeMode="contain"
          />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <AppSafeAreaView style={{ backgroundColor: colors.white, flex: 1 }}>
      <KycStepHeader title="" onBackPress={() => NavigationService.goBack()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <LinearGradient
          colors={isDark ? ["#23242a", "#1a1b21"] : ["#FFFFFF", "#FFFFFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.userSection, {
            marginHorizontal: 16,
            borderRadius: 16,
            marginTop: 10,
            borderWidth: isDark ? 1 : 0,
            borderColor: isDark ? "#2A2A2E" : "transparent"
          }]}
        >
          <View style={styles.avatarContainer}>
            {/* Forcing gradient for now as URL is not ready */}
            <LinearGradient
              colors={KYC_AVATAR_GRADIENT}
              locations={KYC_AVATAR_GRADIENT_LOCATIONS}
              style={styles.avatar}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <AppText weight={BOLD} style={{ color: "#FFFFFF", fontSize: 20 }}>
                {initials}
              </AppText>
            </LinearGradient>
            {/* <TouchableOpacity style={styles.editBadge}>
              <FastImage source={editIcon} style={{ width: 12, height: 12 }} tintColor={colors.black} />
            </TouchableOpacity> */}
          </View>
          <View style={{ bottom: 8 }}>
            <AppText type={TWENTY} weight={SEMI_BOLD} style={{ color: themeColors.text }}>
              {userData?.emailId ? maskProfileEmail(userData.emailId) : displayName}
            </AppText>
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4, gap: 6 }}>
              <AppText type={TWELVE} style={{ color: themeColors.secondaryText }}>
                UID: {userData?.uuid || "—"}
              </AppText>
              {userData?.uuid ? (
                <TouchableOpacity onPress={() => copyText(userData.uuid)} hitSlop={8}>
                  <FastImage source={copyIcon} style={{ width: 12, height: 12 }} tintColor={themeColors.secondaryText} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </LinearGradient>

        {/* Tabs */}
        <View style={styles.tabBar}>
          {["Profile", "Security"].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[
                styles.tab,
                activeTab === tab && { borderBottomWidth: 2, borderBottomColor: themeColors.button }
              ]}
            >
              <AppText
                weight={SEMI_BOLD}
                type={SIXTEEN}
                style={{ color: activeTab === tab ? themeColors.text : themeColors.secondaryText }}
              >
                {tab}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Menu Items */}
        <View style={{ marginTop: 20 }}>
          {activeTab === "Profile" ? (
            <>
              <MenuItem label="Identity Verification" badge="Unverified" />
              <MenuItem label="VIP Privilege" badge={`VIP ${userData?.vipLevel || 0}`} />
              <MenuItem label="Personal Page" />
              <MenuItem label="Nickname" value={displayName} />
              <MenuItem label="Username" value={displayName} />
              <MenuItem label="Referral" badge="40% commission" badgeBgColor="rgba(209, 170, 103, 0.15)" badgeTextColor="#D1AA67" />
              <MenuItem label="Affiliate" badge="Exclusive Commissions" badgeBgColor="rgba(209, 170, 103, 0.15)" badgeTextColor="#D1AA67" />
              <MenuItem label="Switch Account" />
              <MenuItem
                label="Log Out"
                isLogout
                onPress={openLogoutModal}
              />
            </>
          ) : (
            <>
              {/* Two-Factor Authentication (2FA) */}
              <View style={styles.sectionHeader}>
                <AppText weight={SEMI_BOLD} type={EIGHTEEN} style={{ color: themeColors.text }}>
                  Two-Factor Authentication (2FA)
                </AppText>
              </View>
              <MenuItem label="Passkey" value={securityMethods.passkey ? "Manage" : "Not enabled"} onPress={() => NavigationService.navigate(routes.PASSKEY_SCREEN)} />
              <MenuItem label="Authenticator App" value={securityMethods.totp ? "Disable" : "Not enabled"} onPress={() => NavigationService.navigate(routes.DOWNLOAD_AUTHENTICATOR_SCREEN)} />
              <MenuItem
                label="Email Verification"
                value={userData?.emailId ? maskProfileEmail(userData.emailId) : "Not enabled"}
                onPress={() => NavigationService.navigate(routes.ADD_EMAIL_SCREEN)}
              />
              <MenuItem
                label="Phone Number"
                value={userData?.mobileNumber || userData?.mobile_number ? maskProfilePhone(userData.mobileNumber || userData.mobile_number) : "+91*****3"}
                onPress={() => NavigationService.navigate(routes.ADD_PHONE_NUMBER_SCREEN)}
              />

              {/* Advanced Security Section */}
              <View style={[styles.sectionHeader, { marginTop: 20 }]}>
                <AppText weight={SEMI_BOLD} type={EIGHTEEN} style={{ color: themeColors.text }}>
                  Advanced Security
                </AppText>
              </View>
              <MenuItem
                label="Login 2-Step Verification"
                value="Not configured"
                onPress={() => NavigationService.navigate(routes.LOGIN_TWO_STEP_VERIFICATION_SCREEN)}
              />
              <MenuItem
                label="Anti-Phishing Code"
                value="Not enabled"
                onPress={() => NavigationService.navigate(routes.ANTI_PHISHING_CODE_SCREEN)}
              />
              <MenuItem
                label="Withdrawal Settings"
                value="Not configured"
                onPress={() => NavigationService.navigate(routes.WITHDRAWAL_SETTINGS_SCREEN)}
              />
              <MenuItem
                label="Emergency Contact"
                value="Not enabled"
                onPress={() => NavigationService.navigate(routes.EMERGENCY_CONTACT_SCREEN)}
              />
              <MenuItem
                label="Account Connections"
                value="Not configured"
                onPress={() => NavigationService.navigate(routes.ACCOUNT_CONNECTIONS_SCREEN)}
              />

              {/* Password Management */}
              <View style={[styles.sectionHeader, { marginTop: 20 }]}>
                <AppText weight={SEMI_BOLD} type={EIGHTEEN} style={{ color: themeColors.text }}>
                  Password Management
                </AppText>
              </View>
              <MenuItem
                label="Password"
                value="Change"
                onPress={() => NavigationService.navigate(routes.CHANGE_LOGIN_PASSWORD_SCREEN)}
              />
              <MenuItem
                label="Fund Password"
                value={hasFundPassword ? "Change" : "Not enabled"}
                onPress={() => NavigationService.navigate(routes.FUND_PASSWORD_MAIN_SCREEN)}
              />

              {/* Security Logs */}
              <View style={[styles.sectionHeader, { marginTop: 20 }]}>
                <AppText weight={SEMI_BOLD} type={EIGHTEEN} style={{ color: themeColors.text }}>
                  Devices & activity
                </AppText>
              </View>
              <MenuItem
                label="Authorized Devices"
                value="Not configured"
                onPress={() => NavigationService.navigate(routes.AUTHORIZED_DEVICES_SCREEN)}
              />
              <MenuItem
                label="Security Logs"
                onPress={() => NavigationService.navigate(routes.SECURITY_LOGS_SCREEN)}
              />

              {/* Security Logs (Account Management) */}
              <View style={[styles.sectionHeader, { marginTop: 20 }]}>
                <AppText weight={SEMI_BOLD} type={EIGHTEEN} style={{ color: themeColors.text }}>
                  Account Management
                </AppText>
              </View>
              <MenuItem 
                label="Disable Account" 
                value="Not configured" 
                onPress={() => NavigationService.navigate(routes.DISABLE_ACCOUNT_SCREEN)} 
              />
              <MenuItem 
                label="Close Account" 
                onPress={() => NavigationService.navigate(routes.CLOSE_ACCOUNT_REASON_SCREEN)} 
              />

              {/* Other Settings */}
              <View style={[styles.sectionHeader, { marginTop: 20 }]}>
                <AppText weight={SEMI_BOLD} type={EIGHTEEN} style={{ color: themeColors.text }}>
                  Other Settings
                </AppText>
              </View>
              <MenuItem 
                label="Third Party Account Access Management" 
                onPress={() => NavigationService.navigate(routes.THIRD_PARTY_ACCOUNT_ACCESS_SCREEN)} 
              />
            </>
          )}
        </View>
      </ScrollView>


      <Modal
        visible={showLogoutModal}
        transparent
        statusBarTranslucent
        animationType="none"
        onRequestClose={() => closeLogoutModal()}
      >
        <Animated.View
          style={[
            styles.logoutModalBackdrop,
            {
              opacity: logoutAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              }),
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={StyleSheet.absoluteFill}
            onPress={() => closeLogoutModal()}
          />

          <Animated.View
            style={[
              styles.logoutModalCard,
              {
                backgroundColor: isDark ? "#1E1E22" : "#FFFFFF",
                borderColor: themeColors.border,
                transform: [
                  {
                    translateY: logoutAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                  {
                    scale: logoutAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.95, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.logoutLottieWrap}>
              <LottieView
                source={require("../../../assets/lottie/logout.json")}
                autoPlay
                loop
                style={styles.logoutLottie}
              />
            </View>

            <AppText style={[styles.logoutTitle, { color: themeColors.text }]}>Confirm Logout</AppText>
            <AppText style={[styles.logoutDesc, { color: themeColors.secondaryText }]}>
              Are you sure you want to log out of your account?
            </AppText>

            <View style={styles.logoutActionsRow}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={[
                  styles.logoutBtn,
                  styles.logoutBtnSecondary,
                  {
                    borderColor: isDark ? "transparent" : colors.inputBorder,
                    backgroundColor: isDark ? "rgba(255,255,255,0.06)" : colors.inputBackground,
                  },
                ]}
                onPress={() => closeLogoutModal()}
              >
                <AppText style={[styles.logoutBtnSecondaryText, { color: themeColors.text }]}>Cancel</AppText>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.logoutBtn, styles.logoutBtnPrimary]}
                onPress={confirmLogout}
              >
                <AppText style={[styles.logoutBtnPrimaryText, { color: "#fff" }]}>Logout</AppText>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>

    </AppSafeAreaView>
  );
};

export default AccountDetails;

const styles = StyleSheet.create({
  userSection: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    position: "relative",
  },
  avatar: {
    width: 65,
    height: 65,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",

    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  modalRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 6,
    alignItems: "center",
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 30,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  tab: {
    paddingBottom: 10,
    marginRight: 30,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  logoutModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.62)",
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
  },
  logoutModalCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    width: "100%",
    maxWidth: 340,
    overflow: "hidden",
  },
  logoutLottieWrap: {
    width: 100,
    height: 100,
    borderRadius: 20,
    alignSelf: "center",
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.04)",
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutLottie: {
    width: 120,
    height: 120,
  },
  logoutTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  logoutDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
    textAlign: "center",
  },
  logoutActionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  logoutBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutBtnSecondary: {
    borderWidth: 1,
  },
  logoutBtnSecondaryText: {
    fontSize: 14,
    fontWeight: "600",
  },
  logoutBtnPrimary: {
    backgroundColor: colors.buttonBg,
  },
  logoutBtnPrimaryText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
