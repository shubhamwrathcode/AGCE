import { View, StyleSheet, TouchableOpacity, TextInput, Animated, Platform, Keyboard } from "react-native";
import FastImage from "react-native-fast-image";
import MarginHeaderDropdowns from "../MarginHeaderDropdowns";
import MarginBottomSection from "../MarginBottomSection";
import CrossMarginLevelGauge from "../crossMargin/CrossMarginLevelGauge";
import { add, checkIc, downIcon, INFO, trade_btn } from "../../../helper/ImageAssets";
import { colors, darkTheme } from "../../../theme/colors";
import { fontFamilySemiBold } from "../../../theme/typography";
import CustomDropdown from "../../../shared/components/CustomDropdown";
import { universalPaddingHorizontal } from "../../../theme/dimens";
import { AppText, BOLD, Button, MEDIUM, SEMI_BOLD } from "../../../shared";
import PercentQuickSelect from "../../../shared/components/PercentQuickSelect";
import { DEPOSIT_COIN_SCREEN, NAVIGATION_AUTH_STACK, LOGIN_SCREEN } from "../../../navigation/routes";
import NavigationService from "../../../navigation/NavigationService";
import { showError } from "../../../helper/logger";
import { styles } from "./spotStyles";
import { SPOT_ORDER_V_GAP } from "./spotConstants";
import { ShimmerBox } from "./ShimmerBox";

export function SpotOrderForm({
  activePercentage,
  amount,
  amountAnim,
  amountInputRef,
  amtDenom,
  base_currency,
  buy_price,
  coinBalance,
  crossAccount,
  crossBorrowable,
  currencyData,
  formatPriceThousands,
  formatTotal,
  handleAmountStep,
  handlePriceBlur,
  handlePriceInput,
  handlePriceStep,
  handleQty,
  handleQuantityBlur,
  handleTotal,
  handleTotalPercentage,
  headerTab,
  inputSelectionColor,
  isBuy,
  isDark,
  isLimit,
  isMarketLikeOrder,
  isPlacingOrder,
  isPriceFocused,
  isSlippageInputFocused,
  isSwitchingTab,
  isTotalFocused,
  isolatedMlDisplay,
  isolatedMlStatus,
  limitFok,
  limitIoc,
  marginAccountData,
  marginLeverage,
  marginMode,
  navigation,
  numberSelectLimit,
  onSubmit,
  parsedCrossRisk,
  price,
  priceAnim,
  quote_currency,
  rbSheetCrossRisk,
  rbSheetIsolatedRisk,
  setAmount,
  setAmtDenom,
  setIsAmountFocused,
  setIsBuy,
  setIsOrderTypeModalVisible,
  setIsPriceFocused,
  setIsSlippageInputFocused,
  setIsStopFocused,
  setIsTotalFocused,
  setLimitFok,
  setLimitIoc,
  setMarginLeverage,
  setMarginMode,
  setPrice,
  setSlippageEnabled,
  setSlippagePct,
  setStopPrice,
  setTab,
  showAmtDenomSelect,
  showStopPriceField,
  slippageEnabled,
  slippageError,
  slippageInputRef,
  slippagePct,
  slippagePlaceholder,
  spotFooterMakerTakerPct,
  spotOrderType,
  staticBuyPrice,
  stopAnim,
  stopPrice,
  tab,
  theme,
  themeColors,
  total,
  totalAnim,
  totalDisplayValue,
  userData,
}) {
  return (
    <>
              {/* Right: Buy/Sell + fields */}
              <View style={styles.rightPanel}>

                <View
                  style={[
                    styles.tabContainer,
                    {
                      borderWidth: 0.5,
                      borderColor: themeColors.themeBorderColor,
                      borderRadius: 8,
                      overflow: "hidden",
                      paddingVertical: 0,
                      paddingHorizontal: 0,
                    },
                  ]}
                >
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => { setTab("Buy"); setIsBuy(true); }}
                    style={{ flex: 1, overflow: "hidden", alignItems: "center", justifyContent: "center", paddingVertical: 8, height: 32 }}
                  >
                    <FastImage
                      source={trade_btn}
                      tintColor={tab === "Buy" ? (themeColors.spotTradeBuy ?? colors.spotTradeBuy) : themeColors.background}
                      resizeMode="stretch"
                      style={StyleSheet.absoluteFillObject}
                    />
                    <AppText weight={SEMI_BOLD} style={[styles.tabText, { color: tab === "Buy" ? colors.white : themeColors.secondaryText }]}>Buy</AppText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => { setTab("Sell"); setIsBuy(false); }}
                    style={{ flex: 1, overflow: "hidden", alignItems: "center", justifyContent: "center", paddingVertical: 8, height: 32 }}
                  >
                    <FastImage
                      source={trade_btn}
                      tintColor={tab === "Sell" ? (themeColors.spotTradeSell ?? colors.spotTradeSell) : themeColors.background}
                      resizeMode="stretch"
                      style={[
                        StyleSheet.absoluteFillObject,
                        { transform: [{ rotate: "180deg" }] },
                      ]}
                    />
                    <AppText
                      weight={SEMI_BOLD}
                      style={[
                        styles.tabText,
                        {
                          color: tab === "Sell" ? themeColors.textOnButton : themeColors.secondaryText,
                        },
                      ]}
                    >
                      Sell
                    </AppText>
                  </TouchableOpacity>
                </View>

                {headerTab === "Margin" && (
                  <MarginHeaderDropdowns
                    marginMode={marginMode}
                    setMarginMode={setMarginMode}
                    marginLeverage={marginLeverage}
                    setMarginLeverage={setMarginLeverage}
                    themeColors={themeColors}
                    isDark={isDark}
                    universalPaddingHorizontal={universalPaddingHorizontal}
                    styles={styles}
                    coinBalance={coinBalance}
                    crossAccount={crossAccount}
                    crossBorrowable={crossBorrowable}
                    currencyData={currencyData}
                    marginAccount={marginAccountData}
                    formatTotal={formatTotal}
                    loading={isPlacingOrder}
                    price={price}
                    buy_price={buy_price}
                    customModalProps={{ statusBarTranslucent: true }}
                  />
                )}

                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setIsOrderTypeModalVisible(true)}
                    style={[
                      styles.dropdown,
                      {
                        backgroundColor: isDark ? darkTheme.darkThemeInputColor : '#F7F7F7',
                        flex: 1,
                        borderRadius: 10,
                        borderWidth: 0,
                        marginBottom: 8,
                        paddingVertical: 6,
                        paddingHorizontal: 12,
                      },
                    ]}
                  >
                    <AppText
                      weight={MEDIUM}
                      style={{ color: themeColors.text, fontSize: 14 }}
                    >
                      {numberSelectLimit}
                    </AppText>
                    <FastImage
                      source={INFO}
                      style={{ height: 14, width: 14, marginLeft: 6 }}
                      resizeMode="contain"
                      tintColor={themeColors.secondaryText}
                    />
                    <View style={{ flex: 1 }} />
                    <FastImage
                      source={downIcon}
                      resizeMode="contain"
                      style={{ width: 10, height: 10 }}
                      tintColor={themeColors.secondaryText}
                    />
                  </TouchableOpacity>
                </View>

                {/* Price field (web parity)
                    - LIMIT / STOP_LIMIT: editable + stepper
                    - MARKET / STOP_MARKET: readonly "Best Market Price" */}
                <View style={styles.spotOrderInputBlock}>
                  <View
                    style={[
                      styles.spotOrderFieldCard,
                      {
                        backgroundColor: isDark ? darkTheme.darkThemeInputColor : '#F7F7F7',
                        borderWidth: 0,
                      },
                    ]}
                  >
                    <View style={styles.spotOrderFieldStack}>
                      <Animated.View
                        pointerEvents="none"
                        style={{
                          // backgroundColor: "red",
                          position: "absolute",
                          left: 0,
                          right: 0,
                          alignItems: "center",
                          top: priceAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [12, 2],
                          }),
                        }}
                      >
                        <Animated.Text
                          style={{
                            color: "#8E8E93",
                            fontSize: priceAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [13, 10],
                            }),
                            fontWeight: "500",
                          }}
                        >
                          Price ({quote_currency})
                        </Animated.Text>
                      </Animated.View>

                      {isLimit ? (
                        <View
                          style={[
                            styles.spotOrderInputBox,
                            styles.spotOrderInputBoxDense,
                            {
                              backgroundColor: "transparent",
                              paddingHorizontal: 0,
                              paddingVertical: 0,
                              marginTop: 2,
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "space-between"
                            },
                          ]}
                        >
                          <TouchableOpacity
                            onPress={() => handlePriceStep(-1)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            style={{ width: 34, alignItems: 'center', justifyContent: 'center' }}
                          >
                            <AppText style={{ fontSize: 20, color: themeColors.secondaryText, lineHeight: 22 }}>-</AppText>
                          </TouchableOpacity>
                          <TextInput
                            placeholder={""}
                            placeholderTextColor={themeColors.secondaryText}
                            selectionColor={inputSelectionColor}
                            value={
                              isPriceFocused
                                ? (price !== "" ? price : staticBuyPrice)
                                : formatPriceThousands(price !== "" ? price : staticBuyPrice)
                            }
                            onChangeText={(text) => handlePriceInput(text, setPrice)}
                            onBlur={() => {
                              setIsPriceFocused(false);
                              handlePriceBlur(price, setPrice);
                            }}
                            onFocus={() => setIsPriceFocused(true)}
                            keyboardType="numeric"
                            style={[
                              styles.spotOrderInputValue,
                              {
                                flex: 1,
                                color: themeColors.text,
                                textAlign: "center",
                                fontSize: 13,
                                fontWeight: "bold",
                                paddingVertical: 0,
                                marginTop: 8,
                                ...(Platform.OS === "android" ? { includeFontPadding: false } : {}),
                              },
                            ]}
                            editable
                          />
                          <TouchableOpacity
                            onPress={() => handlePriceStep(1)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            style={{ width: 34, alignItems: 'center', justifyContent: 'center' }}
                          >
                            <AppText style={{ fontSize: 20, color: themeColors.secondaryText, lineHeight: 22 }}>+</AppText>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View
                          style={{
                            width: "100%",
                            minHeight: 23,
                            justifyContent: "center",
                            alignItems: "center",
                            marginTop: 0,
                          }}
                        >
                          <AppText
                            style={[
                              styles.spotOrderInputValue,
                              {
                                flex: 0,
                                color: "#8E8E93",
                                fontSize: 12,
                                textAlign: "center",
                                alignSelf: "center",
                                marginTop: 8,
                              },
                            ]}
                          >
                            Best Market Price
                          </AppText>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {showStopPriceField && (
                  <View style={styles.spotOrderInputBlock}>
                    <View
                      style={[
                        styles.spotOrderFieldCard,
                        {
                          backgroundColor: isDark ? darkTheme.darkThemeInputColor : '#F7F7F7',
                          borderWidth: 0,
                        },
                      ]}
                    >
                      <View style={styles.spotOrderFieldStack}>
                        <Animated.View
                          pointerEvents="none"
                          style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            alignItems: "center",
                            top: stopAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [8, 2],
                            }),
                          }}
                        >
                          <Animated.Text
                            style={{
                              color: "#8E8E93",
                              fontSize: stopAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [13, 10],
                              }),
                              fontWeight: "500",
                            }}
                          >
                            Stop Price ({quote_currency})
                          </Animated.Text>
                        </Animated.View>
                        <View
                          style={[
                            styles.spotOrderInputBox,
                            styles.spotOrderInputBoxDense,
                            {
                              backgroundColor: "transparent",
                              paddingHorizontal: 0,
                              paddingVertical: 0,
                              marginTop: 2,
                            },
                          ]}
                        >
                          <TextInput
                            placeholder={""}
                            placeholderTextColor={themeColors.secondaryText}
                            selectionColor={inputSelectionColor}
                            value={stopPrice}
                            onChangeText={(text) => handlePriceInput(text, setStopPrice)}
                            onBlur={() => {
                              setIsStopFocused(false);
                              handlePriceBlur(stopPrice, setStopPrice);
                            }}
                            onFocus={() => setIsStopFocused(true)}
                            keyboardType="numeric"
                            style={[
                              styles.spotOrderInputValue,
                              {
                                color: themeColors.text,
                                textAlign: "center",
                                fontSize: 13,
                                fontWeight: "bold",
                                paddingVertical: 0,
                                marginTop: 8,
                                ...(Platform.OS === "android" ? { includeFontPadding: false } : {}),
                              },
                            ]}
                          />
                        </View>
                      </View>
                    </View>
                  </View>
                )}

                <View style={[styles.spotOrderInputBlock, showAmtDenomSelect && { zIndex: 100, elevation: 100 }]}>
                  <View
                    style={[
                      styles.spotOrderFieldCard,
                      {
                        backgroundColor: isDark ? darkTheme.darkThemeInputColor : '#F7F7F7',
                        borderWidth: 0,
                        overflow: "visible",
                      },
                      showAmtDenomSelect && { zIndex: 100, elevation: 100 },
                    ]}
                  >
                    <View style={[styles.spotOrderFieldStack, showAmtDenomSelect && { zIndex: 100, elevation: 100, overflow: "visible" }]}>
                      <Animated.View
                        pointerEvents="none"
                        style={{
                          position: "absolute",
                          left: 0,
                          right: 0,
                          alignItems: "center",
                          top: amountAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [8, 2],
                          }),
                        }}
                      >
                        <Animated.Text
                          style={{
                            color: "#8E8E93",
                            fontSize: amountAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [13, 10],
                            }),
                            fontWeight: "500",
                          }}
                        >
                          {showAmtDenomSelect ? "Amount" : `Amount (${base_currency})`}
                        </Animated.Text>
                      </Animated.View>
                      <View
                        style={[
                          styles.spotOrderInputBox,
                          styles.spotOrderInputBoxDense,
                          {
                            backgroundColor: "transparent",
                            paddingHorizontal: 0,
                            paddingVertical: 0,
                            marginTop: 2,
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between"
                          },
                        ]}
                      >
                        {(!showAmtDenomSelect) && (
                          <TouchableOpacity
                            onPress={() => handleAmountStep(-1)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            style={{ width: 34, alignItems: 'center', justifyContent: 'center', }}
                          >
                            <AppText style={{ fontSize: 20, color: themeColors.secondaryText, lineHeight: 22 }}>-</AppText>
                          </TouchableOpacity>
                        )}
                        <TextInput
                          ref={amountInputRef}
                          placeholder={""}
                          placeholderTextColor={themeColors.secondaryText}
                          selectionColor={inputSelectionColor}
                          value={amount}
                          onChangeText={(text) => handleQty(text)}
                          onBlur={() => {
                            setIsAmountFocused(false);
                            handleQuantityBlur(amount, setAmount);
                          }}
                          onFocus={() => setIsAmountFocused(true)}
                          keyboardType="numeric"
                          style={[
                            styles.spotOrderInputValue,
                            {
                              flex: 1,
                              color: themeColors.text,
                              textAlign: "center",
                              paddingLeft: 0,
                              fontSize: 13,
                              fontWeight: "bold",
                              paddingVertical: 0,
                              marginTop: 8,
                              ...(Platform.OS === "android" ? { includeFontPadding: false } : {}),
                            },
                          ]}
                        />
                        {showAmtDenomSelect ? (
                          <View style={{ position: "absolute", right: -5, marginTop: 8, zIndex: 10, }}>
                            <CustomDropdown
                              data={[base_currency, quote_currency]}
                              selected={amtDenom === "BASE" ? base_currency : quote_currency}
                              onSelect={(item) => {
                                setAmtDenom(item === base_currency ? "BASE" : "QUOTE");
                              }}
                              icon={downIcon}
                              compact
                              align="right"
                              triggerStyle={{ backgroundColor: 'transparent', borderWidth: 0, minWidth: 60 }}
                              dropdownWidth={100}
                            />
                          </View>
                        ) : (
                          <TouchableOpacity
                            onPress={() => handleAmountStep(1)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            style={{ width: 34, alignItems: 'center', justifyContent: 'center', }}
                          >
                            <AppText style={{ fontSize: 20, color: themeColors.secondaryText, lineHeight: 22 }}>+</AppText>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                </View>
                <View style={styles.spotOrderSliderWrap}>
                  <PercentQuickSelect
                    activeValue={activePercentage}
                    onSelect={handleTotalPercentage}
                    theme={theme}
                  />
                </View>

                {spotOrderType === "LIMIT" ? (
                  <View style={styles.spotOrderInputBlock}>
                    <View
                      style={[
                        styles.spotOrderFieldCard,
                        {
                          backgroundColor: isDark ? darkTheme.darkThemeInputColor : '#F7F7F7',
                          borderWidth: 0,
                        },
                      ]}
                    >
                      <View style={styles.spotOrderFieldStack}>
                        <Animated.View
                          pointerEvents="none"
                          style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            alignItems: "center",
                            top: totalAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [8, 2],
                            }),
                          }}
                        >
                          <Animated.Text
                            style={{
                              color: "#8E8E93",
                              fontSize: totalAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [13, 10],
                              }),
                              fontWeight: "500",
                            }}
                          >
                            Total ({quote_currency})
                          </Animated.Text>
                        </Animated.View>
                        <View
                          style={[
                            styles.spotOrderInputBox,
                            styles.spotOrderInputBoxDense,
                            {
                              backgroundColor: "transparent",
                              paddingHorizontal: 0,
                              paddingVertical: 0,
                              marginTop: 2,
                            },
                          ]}
                        >
                          <TextInput
                            placeholder={""}
                            placeholderTextColor={themeColors.secondaryText}
                            selectionColor={inputSelectionColor}
                            value={isTotalFocused ? total : (amount ? formatTotal(totalDisplayValue) : "")}
                            onChangeText={handleTotal}
                            onBlur={() => setIsTotalFocused(false)}
                            onFocus={() => setIsTotalFocused(true)}
                            keyboardType="numeric"
                            style={[
                              styles.spotOrderInputValue,
                              {
                                flex: 1,
                                color: themeColors.text,
                                textAlign: "center",
                                fontSize: 13,
                                fontWeight: "bold",
                                paddingVertical: 0,
                                marginTop: 8,
                                ...(Platform.OS === "android" ? { includeFontPadding: false } : {}),
                              },
                            ]}
                            editable={true}
                          />
                        </View>
                      </View>
                    </View>
                  </View>
                ) : null}

                {/* Web parity: IOC/FOK toggles are visible for Spot form footer.
                    API uses them only for LIMIT / STOP_LIMIT (we only send then), but UI stays consistent. */}
                {(headerTab !== "Margin" || isMarketLikeOrder) && (
                  <View style={styles.spotOrderTifRow}>
                    {headerTab !== "Margin" && (
                      <>
                        <TouchableOpacity
                          onPress={() => {
                            setLimitIoc((v) => {
                              const next = !v;
                              if (next) setLimitFok(false);
                              return next;
                            });
                          }}
                          style={styles.spotOrderTifChip}
                          hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                        >
                          <View style={[styles.slippageCheckbox, { borderColor: themeColors.themeBorderColor }]}>
                            {limitIoc ? (
                              <FastImage source={checkIc} tintColor={isDark ? colors.white : colors.black} style={[styles.slippageCheckIcon, {
                              }]} resizeMode="contain" />
                            ) : null}
                          </View>
                          <AppText style={[styles.spotOrderTifText, { color: themeColors.text }]}>IOC</AppText>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => {
                            setLimitFok((v) => {
                              const next = !v;
                              if (next) setLimitIoc(false);
                              return next;
                            });
                          }}
                          style={styles.spotOrderTifChip}
                          hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                        >
                          <View style={[styles.slippageCheckbox, { borderColor: themeColors.themeBorderColor }]}>
                            {limitFok ? (
                              <FastImage source={checkIc} tintColor={isDark ? colors.white : colors.black} style={styles.slippageCheckIcon} resizeMode="contain" />
                            ) : null}
                          </View>
                          <AppText style={[styles.spotOrderTifText, { color: themeColors.text }]}>FOK</AppText>
                        </TouchableOpacity>
                      </>
                    )}
                    {isMarketLikeOrder && (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setSlippageEnabled((v) => !v)}
                        style={styles.spotOrderTifChip}
                        hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                      >
                        <View
                          style={[
                            styles.slippageCheckbox,
                            { borderColor: themeColors.themeBorderColor },
                          ]}
                        >
                          {slippageEnabled ? (
                            <FastImage source={checkIc} tintColor={isDark ? colors.white : colors.black} style={styles.slippageCheckIcon} resizeMode="contain" />
                          ) : null}
                        </View>
                        <AppText style={[styles.spotOrderTifText, { color: themeColors.text }]}>Slippage</AppText>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {isMarketLikeOrder && slippageEnabled ? (
                  <View style={{ marginBottom: SPOT_ORDER_V_GAP }}>
                    <View style={styles.spotOrderInputBlock}>
                      <TouchableOpacity
                        activeOpacity={1}
                        onPress={() => slippageInputRef.current?.focus()}
                        style={[
                          styles.spotOrderFieldCard,
                          {
                            backgroundColor: isDark ? darkTheme.darkThemeInputColor : '#F7F7F7',
                            borderWidth: 0,
                          },
                        ]}
                      >
                        <View style={styles.spotOrderFieldStack}>
                          {!isSlippageInputFocused && String(slippagePct ?? "").trim() === "" ? (
                            <View
                              pointerEvents="none"
                              style={{
                                position: "absolute",
                                left: 0,
                                right: 0,
                                alignItems: "center",
                                top: 8,
                              }}
                            >
                              <AppText
                                style={{
                                  color: "#8E8E93",
                                  fontSize: 13,
                                  fontWeight: "500",
                                }}
                              >
                                {slippagePlaceholder}
                              </AppText>
                            </View>
                          ) : null}
                          <View
                            style={[
                              styles.spotOrderInputBox,
                              styles.spotOrderInputBoxDense,
                              {
                                backgroundColor: "transparent",
                                paddingHorizontal: 0,
                                paddingVertical: 0,
                                marginTop: 2,
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                              },
                            ]}
                          >
                            <View style={styles.spotOrderTotalSideSpacer} />
                            <View style={styles.spotOrderSlippageInputShell}>
                              <TextInput
                                ref={slippageInputRef}
                                value={slippagePct}
                                onChangeText={(t) => setSlippagePct(String(t).replace(/[^0-9.]/g, ""))}
                                placeholder={""}
                                placeholderTextColor={themeColors.secondaryText}
                                selectionColor={inputSelectionColor}
                                keyboardType="numeric"
                                textAlign="center"
                                accessibilityLabel="Slippage tolerance percent"
                                onFocus={() => setIsSlippageInputFocused(true)}
                                onBlur={() => setIsSlippageInputFocused(false)}
                                style={[
                                  styles.spotOrderInputValue,
                                  {
                                    flex: 1,
                                    color: themeColors.text,
                                    fontSize: 13,
                                    fontWeight: "bold",
                                    paddingVertical: 0,
                                    marginTop: 0,
                                    ...(Platform.OS === "android" ? { includeFontPadding: false } : {}),
                                  },
                                ]}
                              />
                              {(isSlippageInputFocused || String(slippagePct ?? "").trim() !== "") ? (
                                <View pointerEvents="none" style={styles.spotOrderSlippagePctWrap}>
                                  <AppText style={[styles.spotOrderSlippagePctText, { color: themeColors.secondaryText, fontSize: 13, fontWeight: "bold" }]}>
                                    %
                                  </AppText>
                                </View>
                              ) : null}
                            </View>
                            <View style={styles.spotOrderTotalSideSpacer} />
                          </View>
                        </View>
                      </TouchableOpacity>
                    </View>
                    {slippageError ? (
                      <AppText style={[styles.spotOrderSlippageError, { color: themeColors.red }]}>
                        {slippageError}
                      </AppText>
                    ) : null}
                  </View>
                ) : null}

                {headerTab === "Margin" ? (
                  <MarginBottomSection
                    quote_currency={quote_currency}
                    base_currency={base_currency}
                    coinBalance={coinBalance}
                    marginMode={marginMode}
                    crossAccount={crossAccount}
                    crossBorrowable={crossBorrowable}
                    isBuy={isBuy}
                    onSubmit={onSubmit}
                    themeColors={themeColors}
                    isDark={isDark}
                    userData={userData}
                    inputSelectionColor={inputSelectionColor}
                    fontFamilySemiBold={fontFamilySemiBold}
                    onBorrowPress={() => {
                      if (!userData) {
                        showError("Please login first to manage margin funds");
                        NavigationService.navigate(NAVIGATION_AUTH_STACK, { screen: LOGIN_SCREEN });
                        return;
                      }
                      // rbSheetAddFunds?.current?.open();
                      NavigationService.navigate(DEPOSIT_COIN_SCREEN)

                    }}
                    marginLeverage={marginLeverage}
                    price={price}
                    amount={amount}
                    buy_price={buy_price}
                    amountIsQuote={showAmtDenomSelect && amtDenom === "QUOTE"}
                    formatTotal={formatTotal}
                    styles={styles}
                    currencyData={currencyData}
                    loading={isPlacingOrder}
                    aboveButton={
                      headerTab === "Margin" && userData && marginMode === "Cross" ? (
                        <View
                          style={{
                            width: "100%",
                            marginBottom: 8,
                            borderWidth: 1,
                            borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
                            borderRadius: 10,
                            paddingHorizontal: 10,
                            paddingTop: 8,
                            paddingBottom: 6,
                          }}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "space-between",
                              paddingBottom: 4,
                            }}
                          >
                            <AppText weight={BOLD} style={{ fontSize: 13, color: themeColors.text }}>
                              {`${base_currency || "BTC"}/${quote_currency || "USDT"}`}
                            </AppText>
                            <View
                              style={{
                                backgroundColor: isDark ? "rgba(142,148,158,0.18)" : "rgba(142,148,158,0.15)",
                                borderRadius: 3,
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                              }}
                            >
                              <AppText style={{ fontSize: 10, color: themeColors.secondaryText }}>Cross</AppText>
                            </View>
                          </View>
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => rbSheetCrossRisk.current?.open()}
                            style={{ alignItems: "center", paddingTop: 4 }}
                          >
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 5 }}>
                              <AppText style={{ fontSize: 12, color: themeColors.secondaryText }}>
                                Margin Level
                              </AppText>
                              <FastImage
                                source={INFO}
                                style={{ height: 12, width: 12 }}
                                resizeMode="contain"
                                tintColor={themeColors.secondaryText}
                              />
                            </View>
                            <CrossMarginLevelGauge
                              level={parsedCrossRisk.margin_level}
                              mmr={parsedCrossRisk.liquidationMarginLevel ?? 1.1}
                              warningRate={parsedCrossRisk.marginCallLevel ?? 1.15}
                              isDark={isDark}
                            />
                          </TouchableOpacity>
                        </View>
                      ) : headerTab === "Margin" && userData && marginMode === "Isolated" ? (
                        <View
                          style={{
                            width: "100%",
                            marginBottom: 8,
                            paddingBottom: 10,
                            borderBottomWidth: StyleSheet.hairlineWidth,
                            borderBottomColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                          }}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "space-between",
                              marginBottom: 8,
                            }}
                          >
                            <AppText weight={BOLD} style={{ fontSize: 13, color: themeColors.text }}>
                              {`${base_currency || "BTC"}/${quote_currency || "USDT"}`}
                            </AppText>
                            <View
                              style={{
                                backgroundColor: isDark ? "rgba(142,148,158,0.18)" : "rgba(142,148,158,0.15)",
                                borderRadius: 3,
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                              }}
                            >
                              <AppText style={{ fontSize: 10, color: themeColors.secondaryText }}>Isolated</AppText>
                            </View>
                          </View>
                          <AppText style={{ fontSize: 12, color: themeColors.secondaryText, marginBottom: 6 }}>
                            Margin Level
                          </AppText>
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => rbSheetIsolatedRisk.current?.open()}
                            style={{
                              alignSelf: "flex-start",
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 4,
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              borderRadius: 4,
                              backgroundColor: isolatedMlStatus.key === "margin_call"
                                ? (isDark ? "rgba(217,119,6,0.28)" : "#fff7ed")
                                : isolatedMlStatus.key === "liquidated"
                                  ? (isDark ? "rgba(220,38,38,0.28)" : "#fef2f2")
                                  : isolatedMlStatus.key === "unavailable"
                                    ? (isDark ? "rgba(156,163,175,0.18)" : "rgba(156,163,175,0.15)")
                                    : (isDark ? "rgba(22,163,74,0.28)" : "#e8f5e9"),
                            }}
                          >
                            <AppText
                              weight={SEMI_BOLD}
                              style={{
                                fontSize: 12,
                                color: isolatedMlStatus.key === "margin_call"
                                  ? (isDark ? "#ffffff" : "#d97706")
                                  : isolatedMlStatus.key === "liquidated"
                                    ? (isDark ? "#ffffff" : "#dc2626")
                                    : isolatedMlStatus.key === "unavailable"
                                      ? (isDark ? "#9ca3af" : "#9ca3af")
                                      : (isDark ? "#ffffff" : "#16a34a"),
                              }}
                            >
                              {isolatedMlDisplay}
                            </AppText>
                            <FastImage
                              source={INFO}
                              style={{ height: 11, width: 11 }}
                              resizeMode="contain"
                              tintColor={
                                isolatedMlStatus.key === "unavailable"
                                  ? "#9ca3af"
                                  : (isDark ? "#ffffff" : isolatedMlStatus.color)
                              }
                            />
                          </TouchableOpacity>
                        </View>
                      ) : null
                    }
                  />
                ) : (
                  <>
                    <View style={{ marginTop: 8 }}>
                      {/* Available / Max */}
                      <View style={{ marginBottom: 16, gap: 6 }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <AppText style={{ fontSize: 13, color: colors.placeholderColor, flexShrink: 0, marginTop: 2 }}>Available</AppText>
                          <View style={{ flexDirection: "row", alignItems: "flex-end", flexShrink: 1, paddingLeft: 10 }}>
                            {isSwitchingTab ? (
                              <ShimmerBox width={80} height={14} borderRadius={4} />
                            ) : (
                              <AppText style={{ fontSize: 13, color: themeColors.text, fontWeight: "600", flexShrink: 1, textAlign: "right" }}>
                                {(() => {
                                  const val = isBuy ? (coinBalance?.quote_currency_balance || 0) : (coinBalance?.base_currency_balance || 0);
                                  const res = parseFloat(Number(val).toFixed(8)).toString();
                                  return (res === "NaN" ? "0" : res).replace('.', '.\u200B');
                                })()} {isBuy ? quote_currency : base_currency}
                              </AppText>
                            )}
                            <TouchableOpacity
                              activeOpacity={0.7}
                              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                              onPress={() => {
                                if (!userData) {
                                  showError("Please login first to deposit funds");
                                  NavigationService.navigate(NAVIGATION_AUTH_STACK, { screen: LOGIN_SCREEN });
                                  return;
                                }
                                navigation.navigate(DEPOSIT_COIN_SCREEN);
                              }}
                              style={{ marginLeft: 6, padding: 4, flexShrink: 0, marginBottom: 2 }}
                            >
                              <FastImage source={add} style={{ width: 14, height: 14 }} tintColor={themeColors.text} resizeMode="contain" />
                            </TouchableOpacity>
                          </View>
                        </View>

                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <AppText style={{ fontSize: 13, color: colors.placeholderColor, flexShrink: 0, marginTop: 2 }}>Max</AppText>
                          {isSwitchingTab ? (
                            <ShimmerBox width={80} height={14} borderRadius={4} />
                          ) : (
                            <AppText style={{ fontSize: 13, color: themeColors.text, fontWeight: "600", flexShrink: 1, paddingLeft: 10, textAlign: "right" }}>
                              {(() => {
                                const val = isBuy ? (coinBalance?.quote_currency_balance || 0) : (coinBalance?.base_currency_balance || 0);
                                const res = formatTotal(Number(val)) || "0";
                                return res.replace('.', '.\u200B');
                              })()} {isBuy ? quote_currency : base_currency}
                            </AppText>
                          )}
                        </View>
                      </View>
                    </View>

                    {/* Buy Button */}
                    <View style={styles.spotOrderSubmitWrap}>
                      <Button
                        children={
                          !userData
                            ? "Login"
                            : isBuy
                              ? `Buy ${base_currency}`
                              : `Sell ${base_currency}`
                        }
                        disabled={!userData ? false : isPlacingOrder}
                        loading={isPlacingOrder}
                        activeOpacity={!userData ? 0.75 : amount ? 0.75 : 1}
                        containerStyle={[
                          styles.spotOrderSubmitBtn,
                          {
                            backgroundColor: !userData
                              ? (themeColors.spotTradeBuy ?? colors.spotTradeBuy)
                              : amount
                                ? (isBuy
                                  ? (themeColors.spotTradeBuy ?? colors.spotTradeBuy)
                                  : (themeColors.spotTradeSell ?? colors.spotTradeSell))
                                : (isBuy
                                  ? (isDark ? "#19402E" : "#A7E2C6")
                                  : (isDark ? "#4A1D20" : "#F2B2B4")),
                          },
                        ]}
                        onPress={() => {
                          if (!userData) {
                            NavigationService.reset(NAVIGATION_AUTH_STACK);
                            return;
                          }
                          if (amount) {
                            Keyboard.dismiss();
                            onSubmit();
                          }
                        }}
                        titleStyle={styles.spotOrderSubmitTitle}
                      />
                    </View>
                  </>
                )}

                {/* Web TradeCenterSection: fees + staking row directly under Buy/Sell CTA */}
                <View style={styles.spotOrderFooterBelowCta}>
                  <View style={styles.spotOrderFooterFeesRow}>
                    <AppText weight={SEMI_BOLD} style={[styles.spotOrderFooterFeeText, { color: themeColors.text }]}>
                      Maker {spotFooterMakerTakerPct.maker}%
                    </AppText>
                    <AppText weight={SEMI_BOLD} style={[styles.spotOrderFooterFeeText, { color: themeColors.text }]}>
                      Taker {spotFooterMakerTakerPct.taker}%
                    </AppText>
                  </View>

                </View>
              </View>
    </>
  );
}
