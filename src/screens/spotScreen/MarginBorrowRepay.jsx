import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Platform,
  SafeAreaView,
  Modal
} from "react-native";
import FastImage from "react-native-fast-image";
import { AppText, SEMI_BOLD, MEDIUM } from "../../shared";
import { useTheme } from "../../hooks/useTheme";
import { colors, lightTheme } from "../../theme/colors";
import {
  back_ic,
  historyIcon,
  downIcon,
  tick,
  usdtIcon,
  swap,
  borrowcheckic
} from "../../helper/ImageAssets";
import NavigationService from "../../navigation/NavigationService";
import SimpleToast from "react-native-simple-toast";
import { TRANSFER_SCREEN } from "../../navigation/routes";

const MarginBorrowRepay = () => {
  const { colors: themeColors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState("Borrow"); // "Borrow" or "Repay"
  const [selectedAsset, setSelectedAsset] = useState("BTC"); // "BTC" or "USDT"
  const [amount, setAmount] = useState("");
  const [sliderPercentage, setSliderPercentage] = useState(25); // default 25% like screenshot
  const [isReminderVisible, setIsReminderVisible] = useState(false);

  // Mock Caps and Available Balances
  const caps = {
    BTC: 77.14214,
    USDT: 50000.0,
  };
  const hourlyRates = {
    BTC: "0.000058% / 0.5%",
    USDT: "0.000231% / 2.0%",
  };

  const handlePercentageSelect = (pct) => {
    setSliderPercentage(pct);
    const cap = caps[selectedAsset];
    const calcVal = ((cap * pct) / 100).toFixed(selectedAsset === "BTC" ? 5 : 2);
    setAmount(String(calcVal));
  };

  const handleConfirm = () => {
    if (!amount || Number(amount) <= 0) {
      SimpleToast.show("Please enter a valid amount");
      return;
    }
    // Available is always 0.00 in mock, so show transfer reminder popup
    setIsReminderVisible(true);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: themeColors.themeBorderColor }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 24 }}>
          <TouchableOpacity
            onPress={() => NavigationService.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <FastImage
              source={back_ic}
              style={{ width: 22, height: 22 }}
              resizeMode="contain"
              tintColor={themeColors.text}
            />
          </TouchableOpacity>

          {/* Tabs next to back arrow */}
          <View style={styles.headerTabsContainer}>
            <TouchableOpacity
              onPress={() => setActiveTab("Borrow")}
              style={styles.headerTabBtn}
            >
              <AppText
                weight={SEMI_BOLD}
                style={{
                  fontSize: 18,
                  color: activeTab === "Borrow" ? themeColors.text : themeColors.secondaryText,
                }}
              >
                Borrow
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab("Repay")}
              style={styles.headerTabBtn}
            >
              <AppText
                weight={SEMI_BOLD}
                style={{
                  fontSize: 18,
                  color: activeTab === "Repay" ? themeColors.text : themeColors.secondaryText,
                }}
              >
                Repay
              </AppText>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => SimpleToast.show("History coming soon")}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <FastImage
            source={historyIcon}
            style={{ width: 22, height: 22 }}
            resizeMode="contain"
            tintColor={themeColors.text}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 }}
      >
        {/* Pair row */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <AppText weight={MEDIUM} style={{ fontSize: 14, color: themeColors.text }}>Pair</AppText>
          <TouchableOpacity onPress={() => SimpleToast.show("Borrowing info screen coming soon")}>
            <AppText style={{ fontSize: 13, color: themeColors.secondaryText }}>Borrowing Info &gt;</AppText>
          </TouchableOpacity>
        </View>

        {/* Dropdown BTC/USDT */}
        <View style={[styles.cardDropdown, { backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7" }]}>
          <AppText weight={SEMI_BOLD} style={{ color: themeColors.text, fontSize: 15 }}>BTC/USDT</AppText>
          <FastImage
            source={downIcon}
            style={{ width: 12, height: 12 }}
            tintColor={themeColors.secondaryText}
            resizeMode="contain"
          />
        </View>

        {/* Asset Boxes Row */}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 24, marginTop: 12 }}>
          {/* BTC Box */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setSelectedAsset("BTC");
              setAmount("");
            }}
            style={[
              styles.assetBox,
              {
                borderColor: selectedAsset === "BTC" ? '#D1AA67' : themeColors.themeBorderColor,
                backgroundColor: '#FCF2E1',
                borderWidth: 1,
              },
            ]}
          >
            <View style={styles.assetInner}>
              <View style={[styles.coinIconPlaceholder, { backgroundColor: "#F7931A" }]}>
                <AppText weight={SEMI_BOLD} style={{ color: colors.white, fontSize: 15 }}>B</AppText>
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <AppText weight={SEMI_BOLD} style={{ color: themeColors.text, fontSize: 14 }}>BTC</AppText>
                <AppText style={{ color: themeColors.secondaryText, fontSize: 12 }}>Bitcoin</AppText>
              </View>
              {selectedAsset === 'BTC' && <FastImage source={borrowcheckic} style={{ width: 20, height: 20 }} resizeMode="contain" />}
            </View>
          </TouchableOpacity>

          {/* USDT Box */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              setSelectedAsset("USDT");
              setAmount("");
            }}
            style={[
              styles.assetBox,
              {
                borderColor: selectedAsset === "USDT" ? "#26A17B" : themeColors.themeBorderColor,
                backgroundColor: isDark ? themeColors.themeElevationColor : "#FCFCFC",
                borderWidth: selectedAsset === "USDT" ? 1.5 : 1,
              },
            ]}
          >
            <View style={styles.assetInner}>
              <FastImage source={usdtIcon} style={{ width: 32, height: 32 }} resizeMode="contain" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <AppText weight={SEMI_BOLD} style={{ color: themeColors.text, fontSize: 14 }}>USDT</AppText>
                <AppText style={{ color: themeColors.secondaryText, fontSize: 12 }}>Tether</AppText>
              </View>
              <View
                style={[
                  styles.checkCircle,
                  {
                    borderColor: selectedAsset === "USDT" ? "#26A17B" : themeColors.themeBorderColor,
                    backgroundColor: selectedAsset === "USDT" ? "#26A17B" : "transparent",
                  },
                ]}
              >
                {selectedAsset === "USDT" && (
                  <FastImage source={tick} style={{ width: 8, height: 8 }} tintColor={colors.white} resizeMode="contain" />
                )}
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Input Block */}
        <AppText weight={MEDIUM} style={{ fontSize: 14, color: themeColors.text, marginBottom: 8 }}>
          {activeTab}
        </AppText>
        <View style={[styles.inputContainer, { backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7" }]}>
          <TextInput
            placeholder={selectedAsset === "BTC" ? "Min 0.00001" : "Min 1"}
            placeholderTextColor="#8E8E93"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            style={{
              flex: 1,
              color: themeColors.text,
              fontSize: 15,
              fontWeight: "600",
              paddingVertical: Platform.OS === "ios" ? 8 : 4,
            }}
          />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <AppText weight={SEMI_BOLD} style={{ color: themeColors.text, fontSize: 14 }}>{selectedAsset}</AppText>
            <View style={{ width: 1, height: 16, backgroundColor: themeColors.themeBorderColor }} />
            <TouchableOpacity onPress={() => handlePercentageSelect(100)}>
              <AppText weight={SEMI_BOLD} style={{ color: "#F7931A", fontSize: 13 }}>MAX</AppText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Custom Slider */}
        <View style={{ marginVertical: 24 }}>
          {/* Slider track line */}
          <View style={{ height: 2, backgroundColor: "#E5E5EA", position: "relative", justifyContent: "center" }}>
            <View
              style={{
                height: 2,
                backgroundColor: colors.black,
                width: `${sliderPercentage}%`,
                position: "absolute",
                left: 0,
              }}
            />
            {/* Dots */}
            {[0, 25, 50, 75, 100].map((pct) => (
              <TouchableOpacity
                key={pct}
                onPress={() => handlePercentageSelect(pct)}
                style={{
                  position: "absolute",
                  left: `${pct}%`,
                  transform: [{ translateX: -6 }],
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  borderWidth: 2,
                  borderColor: colors.black,
                  backgroundColor: sliderPercentage >= pct ? colors.black : colors.white,
                }}
              />
            ))}
          </View>
          {/* Labels */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
            {[0, 25, 50, 75, 100].map((pct) => (
              <TouchableOpacity key={pct} onPress={() => handlePercentageSelect(pct)}>
                <AppText
                  weight={MEDIUM}
                  style={{
                    fontSize: 11,
                    color: sliderPercentage === pct ? themeColors.text : themeColors.secondaryText,
                  }}
                >
                  {pct}%
                </AppText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Detailed Rows */}
        <View style={{ gap: 12, marginBottom: 24 }}>
          <View style={styles.detailRow}>
            <View style={{ borderBottomWidth: 1, borderBottomColor: themeColors.secondaryText, borderStyle: "dotted", paddingBottom: 1 }}>
              <AppText style={{ fontSize: 13, color: themeColors.secondaryText }}>Borrowing Info</AppText>
            </View>
            <AppText weight={SEMI_BOLD} style={{ fontSize: 13, color: themeColors.text }}>
              {selectedAsset === "BTC" ? "0 BTC" : "0 USDT"}
            </AppText>
          </View>

          <View style={styles.detailRow}>
            <AppText style={{ fontSize: 13, color: themeColors.secondaryText }}>Available</AppText>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <AppText weight={SEMI_BOLD} style={{ fontSize: 13, color: themeColors.text }}>
                {selectedAsset === "BTC" ? "0.00000000 BTC" : "0.00 USDT"}
              </AppText>
              <TouchableOpacity
                onPress={() => setIsReminderVisible(true)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <FastImage source={swap} style={{ width: 14, height: 14 }} tintColor={themeColors.text} resizeMode="contain" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.detailRow}>
            <AppText style={{ fontSize: 13, color: themeColors.secondaryText }}>Borrowed</AppText>
            <AppText weight={SEMI_BOLD} style={{ fontSize: 13, color: themeColors.text }}>
              {selectedAsset === "BTC" ? "0 BTC" : "0 USDT"}
            </AppText>
          </View>

          <View style={styles.detailRow}>
            <AppText style={{ fontSize: 13, color: themeColors.secondaryText }}>Hourly Rate/APR</AppText>
            <AppText weight={SEMI_BOLD} style={{ fontSize: 13, color: themeColors.text }}>
              {hourlyRates[selectedAsset]}
            </AppText>
          </View>

          <View style={styles.detailRow}>
            <View style={{ borderBottomWidth: 1, borderBottomColor: themeColors.secondaryText, borderStyle: "dotted", paddingBottom: 1 }}>
              <AppText style={{ fontSize: 13, color: themeColors.secondaryText }}>Loan Cap</AppText>
            </View>
            <TouchableOpacity onPress={() => SimpleToast.show("Loan cap request submitted")}>
              <AppText weight={SEMI_BOLD} style={{ fontSize: 13, color: themeColors.text }}>
                {selectedAsset === "BTC" ? `${caps.BTC} BTC / Increase >` : `${caps.USDT} USDT / Increase >`}
              </AppText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Warning Note */}
        <View style={{ flexDirection: "row", gap: 8, alignItems: "center", marginBottom: 32 }}>
          <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: "#E67E22", alignItems: "center", justifyContent: "center" }}>
            <AppText weight={SEMI_BOLD} style={{ color: colors.white, fontSize: 11 }}>!</AppText>
          </View>
          <AppText style={{ flex: 1, fontSize: 12, color: "#E67E22" }}>
            Interest is calculated and deducted every hour on the hour.
          </AppText>
        </View>
      </ScrollView>

      {/* Button at the Bottom */}
      <View style={[styles.bottomBtnWrap, { borderTopColor: themeColors.themeBorderColor }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleConfirm}
          style={[styles.confirmBtn, { backgroundColor: isDark ? "#4E4E50" : "#B2B2B2" }]}
        >
          <AppText weight={SEMI_BOLD} style={{ color: colors.white, fontSize: 16 }}>Confirm</AppText>
        </TouchableOpacity>
      </View>

      {/* Reminder Modal */}
      <Modal
        visible={isReminderVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsReminderVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? "#1C1C1E" : colors.white }]}>
            <AppText
              weight={SEMI_BOLD}
              style={[styles.modalTitle, { color: themeColors.text }]}
            >
              Reminder
            </AppText>
            <AppText
              style={[styles.modalMessage, { color: isDark ? "#AEAEB2" : "#3A3A3C" }]}
            >
              {"no assets in the margin account.\nPlease transfer"}
            </AppText>
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                onPress={() => setIsReminderVisible(false)}
                style={[
                  styles.modalBtnCancel,
                  { backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7" }
                ]}
              >
                <AppText
                  weight={SEMI_BOLD}
                  style={{ color: themeColors.text, fontSize: 16 }}
                >
                  Cancel
                </AppText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setIsReminderVisible(false);
                  NavigationService.navigate(TRANSFER_SCREEN, {
                    fromWalletType: "spot",
                    toWalletType: "margin",
                    coin: selectedAsset
                  });
                }}
                style={[
                  styles.modalBtnTransfer,
                  { backgroundColor: isDark ? colors.white : "#2C2C2E" }
                ]}
              >
                <AppText
                  weight={SEMI_BOLD}
                  style={{ color: isDark ? colors.black : colors.white, fontSize: 16 }}
                >
                  Transfer
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default MarginBorrowRepay;

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTabsContainer: {
    flexDirection: "row",
    gap: 16,
  },
  headerTabBtn: {
    paddingVertical: 8,
  },
  cardDropdown: {
    height: 48,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
  },
  assetBox: {
    flex: 1,
    height: 60,
    borderRadius: 8,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  assetInner: {
    flexDirection: "row",
    alignItems: "center",
  },
  coinIconPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  inputContainer: {
    height: 48,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bottomBtnWrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    backgroundColor: "transparent",
  },
  confirmBtn: {
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  modalContent: {
    width: "100%",
    borderRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  modalButtonsRow: {
    flexDirection: "row",
    gap: 12,
  },
  modalBtnCancel: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnTransfer: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
});
