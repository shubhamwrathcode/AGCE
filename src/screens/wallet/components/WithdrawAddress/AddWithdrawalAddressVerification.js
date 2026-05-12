import React from "react";
import { View, TextInput, TouchableOpacity, Clipboard, ScrollView } from "react-native";
import { AppText, FOURTEEN, SIXTEEN, SEMI_BOLD, TWENTY, BOLD, TWELVE, MEDIUM, TEN } from "../../../../shared";
import { colors } from "../../../../theme/colors";
import FastImage from "react-native-fast-image";
import { pasteImg, bitcoinIcon } from "../../../../helper/ImageAssets";
import QRCode from "react-native-qrcode-svg";
import { showSuccess } from "../../../../helper/logger";
import moment from "moment";

const AddWithdrawalAddressVerification = ({
  isDark,
  themeColors,
  saveAddrStep,
  selectedSaveAddrVerifyMethod,
  saveAddrOtp,
  setSaveAddrOtp,
  saveAddrWhitelistData,
  userData,
  saveAddrOtpTimer,
  saveAddrResendActive,
  handleResendSaveAddrOtp,
}) => {
  if (saveAddrStep !== "otp" && saveAddrStep !== "satoshi" && saveAddrStep !== "metamask") return null;

  const email = userData?.emailId || "";
  const [local, domain] = email.split("@");
  const maskedEmail = email ? `${local.slice(0, 2)}***@${domain}` : "";

  const handlePaste = async () => {
    try {
      const content = await Clipboard.getString();
      if (content && content.length <= 6 && /^\d+$/.test(content)) {
        setSaveAddrOtp(content);
      }
    } catch (e) {
      console.warn("Paste failed", e);
    }
  };

  const handleCopyAddress = () => {
    Clipboard.setString(saveAddrWhitelistData?.deposit_address || "");
    showSuccess("Address copied to clipboard");
  };

  return (
    <View style={{ flex: 1 }}>
      {saveAddrStep === "otp" && (
        <View style={{ paddingVertical: 10 }}>
          <View style={{ marginBottom: 24 }}>
            <AppText type={TWENTY} weight={BOLD} style={{ color: themeColors.text, marginBottom: 12 }}>
              Verify Your Email
            </AppText>
            <AppText type={FOURTEEN} style={{ color: themeColors.secondaryText, lineHeight: 20 }}>
              The verification code has been sent to your email {maskedEmail}, valid for 10 minutes.
            </AppText>
          </View>

          {/* OTP Boxes Row */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 20 }}>
            {[0, 1, 2, 3, 4, 5].map((index) => {
              const char = saveAddrOtp[index] || "";
              const isFocused = saveAddrOtp.length === index;
              return (
                <View
                  key={index}
                  style={{
                    width: 48,
                    height: 56,
                    borderRadius: 12,
                    backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F5F6F8",
                    justifyContent: "center",
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: isFocused ? (isDark ? "#FFF" : "#000") : (isDark ? "rgba(255,255,255,0.1)" : "#E8EAEF"),
                  }}
                >
                  <AppText type={TWENTY} weight={SEMI_BOLD} style={{ color: themeColors.text }}>
                    {char}
                  </AppText>
                </View>
              );
            })}
            <TextInput
              value={saveAddrOtp}
              onChangeText={setSaveAddrOtp}
              maxLength={6}
              keyboardType="number-pad"
              autoFocus
              style={{ position: "absolute", width: "100%", height: "100%", opacity: 0 }}
            />
          </View>

          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
            <TouchableOpacity onPress={handleResendSaveAddrOtp} disabled={!saveAddrResendActive}>
              <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: saveAddrResendActive ? (isDark ? "#FFF" : "#000") : themeColors.secondaryText }}>
                {saveAddrOtpTimer > 0 ? `Resend in ${saveAddrOtpTimer}s` : "Resend Code"}
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity onPress={handlePaste} style={{ flexDirection: "row", alignItems: "center" }}>
              <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: themeColors.text, marginRight: 6 }}>Paste</AppText>
              <FastImage source={pasteImg} style={{ width: 16, height: 16 }} resizeMode="contain" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {saveAddrStep === "satoshi" && (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={{ marginBottom: 20 }}>
            <AppText type={TWELVE} style={{ color: themeColors.secondaryText, marginBottom: 8 }}>
              To verify ownership of this address, send exactly:
            </AppText>
            <AppText type={SIXTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text, marginBottom: 16 }}>
              {saveAddrWhitelistData?.proof_amount} {saveAddrWhitelistData?.proof_asset} ({saveAddrWhitelistData?.proof_chain})
            </AppText>
            <AppText type={TWELVE} style={{ color: themeColors.secondaryText, lineHeight: 18 }}>
              The deposit must come from the address you are whitelisting. Send this micro-amount to your AGCE deposit address for {saveAddrWhitelistData?.proof_asset} ({saveAddrWhitelistData?.proof_chain}). Scan the QR code below or copy the address.
            </AppText>
          </View>

          {/* QR Code Section */}
          <View style={{
            backgroundColor: isDark ? "#1A1D23" : "#F9FAFB",
            borderRadius: 16,
            padding: 16,
            alignItems: "center",
            borderWidth: 1,
            borderColor: themeColors.border,
            marginBottom: 12
          }}>
            <View style={{ backgroundColor: "#FFF", padding: 8, borderRadius: 12, marginBottom: 8 }}>
              <QRCode value={saveAddrWhitelistData?.deposit_address || "0x..."} size={120} color="#000" backgroundColor="#FFF" />
            </View>
            <AppText type={TEN} style={{ color: themeColors.secondaryText }}>Scan to deposit</AppText>

            <View style={{ marginTop: 16, width: "100%" }}>
              <AppText type={TEN} weight={SEMI_BOLD} style={{ color: themeColors.secondaryText, textAlign: "center", marginBottom: 8, letterSpacing: 1 }}>
                YOUR AGCE DEPOSIT ADDRESS
              </AppText>
              <View style={{
                flexDirection: "row",
                backgroundColor: isDark ? "#262A33" : "#F3F4F6",
                borderRadius: 12,
                padding: 8,
                alignItems: "center"
              }}>
                <AppText type={TWELVE} style={{ color: themeColors.text, flex: 1, paddingHorizontal: 8 }} numberOfLines={1}>
                  {saveAddrWhitelistData?.deposit_address}
                </AppText>
                <TouchableOpacity
                  onPress={handleCopyAddress}
                  style={{
                    backgroundColor: "#FFF",
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: "#E5E7EB"
                  }}
                >
                  <AppText type={TWELVE} weight={MEDIUM} style={{ color: "#111827" }}>Copy</AppText>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Expiry Bar */}
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: isDark ? "#262A33" : "#F3F4F6",
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 8,
            marginBottom: 24
          }}>
            <AppText type={TEN} style={{ color: themeColors.secondaryText }}>
              🕒 You have 24 hours. Expires: {saveAddrWhitelistData?.expires_at ? moment(saveAddrWhitelistData.expires_at).format("DD MMM YYYY, HH:mm") : "—"}
            </AppText>
          </View>
        </ScrollView>
      )}

      {saveAddrStep === "metamask" && (
        <View>
          <View style={{ alignItems: "center", marginBottom: 24 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: isDark ? "#333" : "#F5F6F8", justifyContent: "center", alignItems: "center", marginBottom: 16 }}>
              <FastImage source={bitcoinIcon} style={{ width: 40, height: 40 }} resizeMode="contain" />
            </View>
            <AppText type={SIXTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text, textAlign: "center", marginBottom: 8 }}>MetaMask Signature Required</AppText>
            <AppText type={FOURTEEN} style={{ color: themeColors.secondaryText, textAlign: "center" }}>
              This network requires a MetaMask signature to prove ownership. Please use the web platform to complete this step if MetaMask is not available on your device.
            </AppText>
          </View>
        </View>
      )}
    </View>
  );
};

export default AddWithdrawalAddressVerification;
