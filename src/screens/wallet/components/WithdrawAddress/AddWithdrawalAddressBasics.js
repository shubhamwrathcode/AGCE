import React from "react";
import { View, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { AppText, FOURTEEN, TWELVE, MEDIUM, SIXTEEN, SEMI_BOLD, THIRTEEN, BOLD } from "../../../../shared";
import { colors } from "../../../../theme/colors";
import FastImage from "react-native-fast-image";
import { EMAIL, security_vector2 } from "../../../../helper/ImageAssets";

const AddWithdrawalAddressBasics = ({
  isDark,
  themeColors,
  userData,
  saveAddrStep,
  saveAddrLabel,
  setSaveAddrLabel,
  saveAddrCoin,
  setSaveAddrCoin,
  withdrawCoins,
  saveAddrCoinOpen,
  setSaveAddrCoinOpen,
  withdrawAddress,
  setWithdrawAddress,
  saveAddrNetwork,
  setSaveAddrNetwork,
  saveAddrNetworkOpen,
  setSaveAddrNetworkOpen,
  CHAIN_FULL_NAMES,
  saveAddrMemo,
  setSaveAddrMemo,
  saveAddrProofMethod,
  setSaveAddrProofMethod,
  saveAddrBenFullName,
  setSaveAddrBenFullName,
  saveAddrBenPan,
  setSaveAddrBenPan,
  saveAddrBenCountry,
  setSaveAddrBenCountry,
  saveAddrBenPin,
  setSaveAddrBenPin,
  saveAddrBenAddress,
  saveAddrCountrySheetRef,
  setSaveAddrBenAddress,
  saveAddrVerifyOptions,
  selectedSaveAddrVerifyMethod,
  setSelectedSaveAddrVerifyMethod,
  getWithdrawNetworksOrStaticFallback,
  saveAddrOwnership,
  setSaveAddrOwnership,
  saveAddrWalletType,
  setSaveAddrWalletType,
  saveAddrExchange,
  setSaveAddrExchange,
  saveAddrExchangeSearch,
  setSaveAddrExchangeSearch,
  saveAddrExchangeOpen,
  setSaveAddrExchangeOpen,
  ADDRESS_BOOK_TOP_EXCHANGES,
  ADDRESS_BOOK_EXCHANGE_OTHER,
  upIcon,
  downIcon,
  checkIc,
  SECURITY_SHEIELD,
  EMAIL_VERIFY,
  PHONE_VERIFY,
  GOOGLE_VERIFY,
  PASSKEY_VERIFY,
}) => {
  if (saveAddrStep !== "form" && saveAddrStep !== "owner" && saveAddrStep !== "other_identity" && saveAddrStep !== "wallet_type" && saveAddrStep !== "proof_select" && saveAddrStep !== "exchange" && saveAddrStep !== "verify_method") return null;

  return (
    <View style={{ flex: 1 }}>
      {saveAddrStep === "form" && (
        <View>
          <View style={{ marginBottom: 16 }}>
            <AppText type={TWELVE} style={{ color: themeColors.secondaryText, marginBottom: 8 }}>Label</AppText>
            <View style={{ backgroundColor: isDark ? themeColors.card : "#F5F6F8", borderRadius: 8, paddingHorizontal: 16, height: 48, justifyContent: "center", borderWidth: 1, borderColor: isDark ? themeColors.border : "#E8EAEF" }}>
              <TextInput
                placeholder="4-20 characters"
                placeholderTextColor={themeColors.secondaryText}
                style={{ color: themeColors.text, fontSize: 14, padding: 0 }}
                value={saveAddrLabel}
                onChangeText={setSaveAddrLabel}
              />
            </View>
          </View>

          <View style={{ marginBottom: 16 }}>
            <AppText type={TWELVE} style={{ color: themeColors.secondaryText, marginBottom: 8 }}>Coin</AppText>
            <TouchableOpacity
              onPress={() => {
                setSaveAddrNetworkOpen(false);
                setSaveAddrCoinOpen(!saveAddrCoinOpen);
              }}
              style={{
                backgroundColor: isDark ? themeColors.card : "#F5F6F8", borderRadius: 8, paddingHorizontal: 16,
                height: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: isDark ? themeColors.border : "#E8EAEF"
              }}
            >
              <AppText type={FOURTEEN} style={{ color: saveAddrCoin ? themeColors.text : themeColors.secondaryText }}>
                {saveAddrCoin ? saveAddrCoin : "Select Coin"}
              </AppText>
              <FastImage
                source={saveAddrCoinOpen ? upIcon : downIcon}
                style={{ width: 12, height: 12 }}
                tintColor={themeColors.secondaryText}
                resizeMode="contain"
              />
            </TouchableOpacity>
            {saveAddrCoinOpen && (
              <View style={{
                marginTop: 8, backgroundColor: isDark ? "#1A1A1A" : "#F5F6F8", borderRadius: 8,
                overflow: "hidden", borderWidth: 1, borderColor: isDark ? themeColors.border : "#E8EAEF", maxHeight: 180, minHeight: 100
              }}>
                <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                  {withdrawCoins.map((item) => (
                    <TouchableOpacity
                      key={item.short_name}
                      style={{
                        paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1,
                        borderBottomColor: isDark ? "#333" : "#EEE", flexDirection: "row", justifyContent: "space-between", alignItems: "center"
                      }}
                      onPress={() => {
                        setSaveAddrCoin(item.short_name);
                        setSaveAddrCoinOpen(false);
                        const nets = getWithdrawNetworksOrStaticFallback(item);
                        if (nets.length === 1) setSaveAddrNetwork(nets[0].code);
                        else setSaveAddrNetwork("");
                      }}
                    >
                      <AppText type={FOURTEEN} style={{ color: themeColors.text }}>{item.short_name}</AppText>
                      {saveAddrCoin === item.short_name && (
                        <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.primary, justifyContent: "center", alignItems: "center" }}>
                          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary }} />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          <View style={{ marginBottom: 16 }}>
            <AppText type={TWELVE} style={{ color: themeColors.secondaryText, marginBottom: 8 }}>Address</AppText>
            <View style={{
              backgroundColor: isDark ? themeColors.card : "#F5F6F8", borderRadius: 8, paddingHorizontal: 16,
              height: 48, justifyContent: "center", borderWidth: 1, borderColor: isDark ? themeColors.border : "#E8EAEF"
            }}>
              <TextInput
                placeholder="Enter or paste address"
                placeholderTextColor={themeColors.secondaryText}
                style={{ color: themeColors.text, fontSize: 14, padding: 0 }}
                value={withdrawAddress}
                onChangeText={setWithdrawAddress}
              />
            </View>
          </View>

          <View style={{ marginBottom: 16 }}>
            <AppText type={TWELVE} style={{ color: themeColors.secondaryText, marginBottom: 8 }}>Network</AppText>
            <TouchableOpacity
              onPress={() => {
                setSaveAddrCoinOpen(false);
                setSaveAddrNetworkOpen(!saveAddrNetworkOpen);
              }}
              style={{ backgroundColor: isDark ? themeColors.card : "#F5F6F8", borderRadius: 8, paddingHorizontal: 16, height: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: isDark ? themeColors.border : "#E8EAEF" }}
            >
              <AppText type={FOURTEEN} style={{ color: saveAddrNetwork ? themeColors.text : themeColors.secondaryText }}>
                {saveAddrNetwork ? (CHAIN_FULL_NAMES[saveAddrNetwork] || saveAddrNetwork) : "Select Network"}
              </AppText>
              <FastImage
                source={saveAddrNetworkOpen ? upIcon : downIcon}
                style={{ width: 14, height: 14 }}
                tintColor={themeColors.secondaryText}
                resizeMode="contain"
              />
            </TouchableOpacity>
            {saveAddrNetworkOpen && (
              <View style={{ marginTop: 8, backgroundColor: isDark ? "#1A1A1A" : "#F5F6F8", borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: isDark ? themeColors.border : "#E8EAEF", maxHeight: 240 }}>
                <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                  {(() => {
                    const coin = withdrawCoins.find(c => c.short_name === saveAddrCoin);
                    const nets = coin ? getWithdrawNetworksOrStaticFallback(coin) : [];
                    return nets.map((net) => {
                      const isSelected = saveAddrNetwork === net.code;
                      const fee = net.withdrawal_fee || "0";
                      const arrival = net.arrival_time || "10 mins";

                      return (
                        <TouchableOpacity
                          key={net.code}
                          style={{
                            paddingVertical: 14,
                            paddingHorizontal: 16,
                            borderBottomWidth: 1,
                            borderBottomColor: isDark ? "#333" : "#EEE",
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                            backgroundColor: isSelected ? (isDark ? "#222" : "#FFF9E6") : "transparent"
                          }}
                          onPress={() => {
                            setSaveAddrNetwork(net.code);
                            setSaveAddrNetworkOpen(false);
                          }}
                        >
                          <View style={{ flex: 1 }}>
                            <AppText weight={BOLD} type={FOURTEEN} style={{ color: themeColors.text }}>
                              {CHAIN_FULL_NAMES[net.code] || net.code}
                            </AppText>
                            <View style={{ flexDirection: "row", marginTop: 4 }}>
                              <AppText type={TEN} style={{ color: themeColors.secondaryText }}>Fee: </AppText>
                              <AppText type={TEN} weight={MEDIUM} style={{ color: themeColors.text }}>{fee} {saveAddrCoin}</AppText>
                              <AppText type={TEN} style={{ color: themeColors.secondaryText, marginLeft: 12 }}>Arrival: </AppText>
                              <AppText type={TEN} weight={MEDIUM} style={{ color: themeColors.text }}>{arrival}</AppText>
                            </View>
                          </View>
                          {isSelected && (
                            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: colors.buttonBg, justifyContent: "center", alignItems: "center" }}>
                              <FastImage source={checkIc} style={{ width: 12, height: 12 }} tintColor="black" />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    });
                  })()}
                </ScrollView>
              </View>
            )}
          </View>

          <View style={{ marginBottom: 16 }}>
            <AppText type={TWELVE} style={{ color: themeColors.secondaryText, marginBottom: 8 }}>Memo (Optional)</AppText>
            <View style={{ backgroundColor: isDark ? themeColors.card : "#F5F6F8", borderRadius: 8, paddingHorizontal: 16, height: 48, justifyContent: "center", borderWidth: 1, borderColor: isDark ? themeColors.border : "#E8EAEF" }}>
              <TextInput
                placeholder="e.g. XRP destination tag"
                placeholderTextColor={themeColors.secondaryText}
                style={{ color: themeColors.text, fontSize: 14, padding: 0 }}
                value={saveAddrMemo}
                onChangeText={setSaveAddrMemo}
              />
            </View>
          </View>
        </View>
      )}

      {saveAddrStep === "owner" && (
        <View>
          <AppText type={FOURTEEN} style={{ color: themeColors.secondaryText, marginBottom: 24, lineHeight: 20 }}>
            Please provide the details of the address owner (the person you are transacting with). These details will be used to comply with regulatory requirements when transacting with this address.
          </AppText>

          <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: themeColors.text, marginBottom: 16 }}>
            Who does this address belong to?
          </AppText>

          {[
            { id: "SELF", label: "Myself" },
            { id: "OTHER", label: "Someone else" }
          ].map((o) => {
            const isSelected = saveAddrOwnership === o.id;
            return (
              <TouchableOpacity
                key={o.id}
                onPress={() => setSaveAddrOwnership(o.id)}
                style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}
              >
                <View style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  borderWidth: isSelected ? 2 : 1,
                  borderColor: isSelected ? colors.primary : themeColors.secondaryText,
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 12
                }}>
                  {isSelected && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary }} />}
                </View>
                <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: themeColors.text }}>{o.label}</AppText>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {saveAddrStep === "other_identity" && (
        <View>
          <AppText type={FOURTEEN} style={{ color: themeColors.secondaryText, marginBottom: 24, lineHeight: 20 }}>
            Identify the recipient for this withdrawal address when it belongs to someone else.
          </AppText>

          <View style={{ marginBottom: 20 }}>
            <AppText type={TWELVE} weight={MEDIUM} style={{ color: themeColors.secondaryText, marginBottom: 8 }}>Full legal name</AppText>
            <View style={{ backgroundColor: isDark ? themeColors.card : "#F5F6F8", borderRadius: 8, paddingHorizontal: 16, height: 48, justifyContent: "center", borderWidth: 1, borderColor: isDark ? themeColors.border : "#E8EAEF" }}>
              <TextInput
                placeholder="Enter full legal name"
                placeholderTextColor={themeColors.secondaryText}
                style={{ color: themeColors.text, fontSize: 14, padding: 0 }}
                value={saveAddrBenFullName}
                onChangeText={setSaveAddrBenFullName}
              />
            </View>
          </View>

          <View style={{ marginBottom: 20 }}>
            <AppText type={TWELVE} weight={MEDIUM} style={{ color: themeColors.secondaryText, marginBottom: 8 }}>PAN or National ID</AppText>
            <View style={{ backgroundColor: isDark ? themeColors.card : "#F5F6F8", borderRadius: 8, paddingHorizontal: 16, height: 48, justifyContent: "center", borderWidth: 1, borderColor: isDark ? themeColors.border : "#E8EAEF" }}>
              <TextInput
                placeholder="Enter PAN or National ID"
                placeholderTextColor={themeColors.secondaryText}
                style={{ color: themeColors.text, fontSize: 14, padding: 0 }}
                value={saveAddrBenPan}
                onChangeText={setSaveAddrBenPan}
              />
            </View>
          </View>

          <View style={{ marginBottom: 20 }}>
            <AppText type={TWELVE} weight={MEDIUM} style={{ color: themeColors.secondaryText, marginBottom: 8 }}>Country of residence</AppText>
            <TouchableOpacity
              onPress={() => saveAddrCountrySheetRef.current?.open()}
              style={{
                backgroundColor: isDark ? themeColors.card : "#F5F6F8",
                borderRadius: 8,
                paddingHorizontal: 16,
                height: 48,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderWidth: 1,
                borderColor: isDark ? themeColors.border : "#E8EAEF"
              }}
            >
              <AppText type={FOURTEEN} style={{ color: saveAddrBenCountry ? themeColors.text : themeColors.secondaryText }}>
                {saveAddrBenCountry || "Select country"}
              </AppText>
            </TouchableOpacity>
          </View>

          <View style={{ marginBottom: 20 }}>
            <AppText type={TWELVE} weight={MEDIUM} style={{ color: themeColors.secondaryText, marginBottom: 8 }}>PIN / Postal code</AppText>
            <View style={{ backgroundColor: isDark ? themeColors.card : "#F5F6F8", borderRadius: 8, paddingHorizontal: 16, height: 48, justifyContent: "center", borderWidth: 1, borderColor: isDark ? themeColors.border : "#E8EAEF" }}>
              <TextInput
                placeholder="Enter PIN or Postal code"
                placeholderTextColor={themeColors.secondaryText}
                style={{ color: themeColors.text, fontSize: 14, padding: 0 }}
                value={saveAddrBenPin}
                onChangeText={setSaveAddrBenPin}
              />
            </View>
          </View>

          <View style={{ marginBottom: 20 }}>
            <AppText type={TWELVE} weight={MEDIUM} style={{ color: themeColors.secondaryText, marginBottom: 8 }}>Full residential address</AppText>
            <View style={{ backgroundColor: isDark ? themeColors.card : "#F5F6F8", borderRadius: 8, paddingHorizontal: 16, minHeight: 80, paddingTop: 12, borderWidth: 1, borderColor: isDark ? themeColors.border : "#E8EAEF" }}>
              <TextInput
                placeholder="Enter address"
                placeholderTextColor={themeColors.secondaryText}
                style={{ color: themeColors.text, fontSize: 14, padding: 0 }}
                value={saveAddrBenAddress}
                onChangeText={setSaveAddrBenAddress}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>
      )}

      {saveAddrStep === "wallet_type" && (
        <View>
          <AppText type={FOURTEEN} style={{ color: themeColors.secondaryText, marginBottom: 24, lineHeight: 20 }}>
            Choose whether this withdrawal address is controlled in your own wallet or by an exchange / virtual asset service provider.
          </AppText>

          <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: themeColors.text, marginBottom: 16 }}>
            Address type
          </AppText>

          {[
            { id: "SELF_HOSTED", label: "The address owner's self-hosted wallet" },
            { id: "EXCHANGE", label: "A wallet hosted by a Virtual Asset Service Provider / Exchange" }
          ].map((w) => {
            const isSelected = saveAddrWalletType === w.id;
            return (
              <TouchableOpacity
                key={w.id}
                onPress={() => setSaveAddrWalletType(w.id)}
                style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}
              >
                <View style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  borderWidth: isSelected ? 2 : 1,
                  borderColor: isSelected ? colors.primary : themeColors.secondaryText,
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 12
                }}>
                  {isSelected && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary }} />}
                </View>
                <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: themeColors.text }}>{w.label}</AppText>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {saveAddrStep === "proof_select" && (
        <View>
          <AppText type={FOURTEEN} style={{ color: themeColors.secondaryText, marginBottom: 24, lineHeight: 20 }}>
            Verification method for your self-hosted wallet (same address entered above).
          </AppText>

          <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: themeColors.text, marginBottom: 16 }}>
            Verification method
          </AppText>

          {[
            { id: "satoshi", label: "Satoshi test" },
            { id: "metamask", label: "MetaMask signature" }
          ].map((p) => {
            const isSelected = saveAddrProofMethod === p.id;
            return (
              <TouchableOpacity
                key={p.id}
                onPress={() => setSaveAddrProofMethod(p.id)}
                style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}
              >
                <View style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  borderWidth: isSelected ? 2 : 1,
                  borderColor: isSelected ? colors.primary : themeColors.secondaryText,
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 12
                }}>
                  {isSelected && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary }} />}
                </View>
                <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: themeColors.text }}>{p.label}</AppText>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
      {saveAddrStep === "exchange" && (
        <View>
          <AppText type={FOURTEEN} style={{ color: themeColors.secondaryText, marginBottom: 12 }}>
            Which exchange hosts this address?
          </AppText>
          <View style={{ backgroundColor: isDark ? themeColors.card : "#F5F6F8", borderRadius: 8, paddingHorizontal: 16, height: 48, justifyContent: "center", borderWidth: 1, borderColor: isDark ? themeColors.border : "#E8EAEF", marginBottom: 16 }}>
            <TextInput
              placeholder="Search exchange..."
              placeholderTextColor={themeColors.secondaryText}
              style={{ color: themeColors.text, fontSize: 14, padding: 0 }}
              value={saveAddrExchangeSearch}
              onChangeText={setSaveAddrExchangeSearch}
            />
          </View>
          <ScrollView style={{ maxHeight: 300 }}>
            {ADDRESS_BOOK_TOP_EXCHANGES.filter(e => e.label.toLowerCase().includes(saveAddrExchangeSearch.toLowerCase())).map((e) => (
              <TouchableOpacity
                key={e.value}
                onPress={() => setSaveAddrExchange(e.value)}
                style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: isDark ? "#333" : "#EEE" }}
              >
                <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: saveAddrExchange === e.value ? 2 : 1, borderColor: saveAddrExchange === e.value ? colors.primary : themeColors.secondaryText, justifyContent: "center", alignItems: "center", marginRight: 16 }}>
                  {saveAddrExchange === e.value && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary }} />}
                </View>
                <AppText type={FOURTEEN} style={{ color: themeColors.text }}>{e.label}</AppText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {saveAddrStep === "verify_method" && (
        <View style={{ alignItems: "center" }}>
          <FastImage
            source={security_vector2}
            style={{ width: 140, height: 140, marginBottom: 0 }}
            resizeMode="contain"
          />

          <View style={{ width: "100%", alignItems: "flex-start" }}>
            <AppText type={SIXTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text, marginBottom: 0 }}>
              {/* Confirm it's you */}
            </AppText>
            <AppText type={THIRTEEN} style={{ color: themeColors.secondaryText, marginBottom: 24, lineHeight: 20 }}>
              Your account has a single verification option for this step. Tap Continue to open the secure prompt and finish saving this withdrawal address.
            </AppText>
          </View>

          {(() => {
            // Force web parity: If email is available, only show email for this user.
            const methods = saveAddrVerifyOptions.includes("email") ? ["email"] : saveAddrVerifyOptions;

            return methods.map((method) => {
              // Force isSelected if there's only one method (web parity)
              const isSelected = methods.length === 1 ? true : (selectedSaveAddrVerifyMethod === method);
              let icon = EMAIL;
              let title = "Email";
              let sub = "";

              if (method === "email") {
                const email = userData?.emailId || "";
                const [local, domain] = email.split("@");
                sub = email ? `${local.slice(0, 2)}***@${domain}` : "";
              } else if (method === "mobile") {
                icon = PHONE_VERIFY;
                title = "Phone Number";
                const phone = userData?.mobileNumber || "";
                sub = phone ? `${phone.slice(0, 2)}*****${phone.slice(-2)}` : "";
              } else if (method === "google_authenticator") {
                icon = GOOGLE_VERIFY;
                title = "Authenticator App";
              } else if (method === "passkey") {
                icon = PASSKEY_VERIFY;
                title = "Passkeys";
              }

              return (
                <TouchableOpacity
                  key={method}
                  onPress={() => setSelectedSaveAddrVerifyMethod(method)}
                  disabled={methods.length === 1}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 16,
                    width: "100%",
                    marginBottom: 12,
                    backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
                    borderRadius: 12,
                    opacity: methods.length === 1 ? 0.8 : 1 // Subtle hint that it's fixed
                  }}
                >
                  <View style={{ width: 32, height: 32, justifyContent: "center", alignItems: "center", marginRight: 16 }}>
                    <FastImage
                      source={icon}
                      style={{ width: 24, height: 24 }}
                      // tintColor={themeColors.text}
                      resizeMode="contain"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: themeColors.text }}>{title}</AppText>
                    {!!sub && <AppText type={TWELVE} style={{ color: themeColors.secondaryText, marginTop: 4 }}>{sub}</AppText>}
                  </View>
                  <View style={{
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    borderWidth: 1.5,
                    borderColor: isSelected ? colors.primary : themeColors.border,
                    backgroundColor: isSelected ? colors.primary : "transparent",
                    justifyContent: "center",
                    alignItems: "center"
                  }}>
                    {isSelected && <FastImage source={checkIc} style={{ width: 12, height: 12 }} tintColor="black" />}
                  </View>
                </TouchableOpacity>
              );
            });
          })()}
        </View>
      )}
    </View>
  );
};

export default AddWithdrawalAddressBasics;
