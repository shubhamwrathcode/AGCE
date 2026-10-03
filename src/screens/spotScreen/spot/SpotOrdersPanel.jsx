import { View, TouchableOpacity, ScrollView } from "react-native";
import FastImage from "react-native-fast-image";
import { Refresh } from "../../../helper/ImageAssets";
import MarginHistorySection from "../MarginHistorySection";
import { colors } from "../../../theme/colors";
import CustomDropdown from "../../../shared/components/CustomDropdown";
import { AppText, MEDIUM, SEMI_BOLD } from "../../../shared";
import { OPEN_ORDER_SCREEN } from "../../../navigation/routes";
import NavigationService from "../../../navigation/NavigationService";
import { styles } from "./spotStyles";
import { SPOT_OPEN_ORDER_KINDS, SPOT_SIDE_DROPDOWN_LABELS } from "./spotConstants";
import { spotDropdownLabelFromSideFilter, spotSideFilterFromDropdownLabel } from "./spotOrderHelpers";
import { OpenOrderItemCard } from "./OpenOrderItemCard";
import { PastOrderItemCard } from "./PastOrderItemCard";

export function SpotOrdersPanel({
  activeTab,
  base_currency,
  buildCurrencyPairText,
  currencyData,
  filteredOpenOrders,
  getOrderStatusLabel,
  getOrderStatusRaw,
  getSideColor,
  handleCancelOpenOrderPress,
  handleSpotOrdersPrimaryTab,
  headerTab,
  historyOnly,
  isDark,
  marginAccountData,
  marginMode,
  mountedOrdersTab,
  normalizePairSymbol,
  openOrderKeyExtractor,
  openOrderKindTab,
  openOrdersSlice,
  orderBookReady,
  orderFilter,
  ordersBottomTabBarWidthRef,
  ordersBottomTabItemLayoutRef,
  ordersBottomTabScrollRef,
  pastOrderKeyExtractor,
  pastOrdersForSpotPair,
  pastOrdersSlice,
  quote_currency,
  renderSpotOrdersEmptyState,
  renderTradeHistorySection,
  setOpenOrderKindTab,
  setOrderFilter,
  setShowExecutedTrades,
  setTradeHistorySideFilter,
  showExecutedTrades,
  themeColors,
  tradeHistorySideFilter,
}) {
  return (
            headerTab === "Margin" ? (
              <MarginHistorySection
                currencyData={currencyData}
                themeColors={themeColors}
                isDark={isDark}
                marginMode={marginMode}
                marginAccountData={marginAccountData}
              />
            ) : (
              <>
                {/* Bottom tabs: Open Orders / Order History / Trade History */}
                {(historyOnly || orderBookReady) && (
                  <View
                    style={{
                      flexDirection: "row",
                      marginTop: 6,
                      alignItems: "center",
                      marginHorizontal: 8,
                    }}
                  >
                    <ScrollView
                      ref={ordersBottomTabScrollRef}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ flexDirection: "row", alignItems: "center", gap: 8, paddingRight: 8 }}
                      style={{ flex: 1 }}
                      onLayout={(e) => {
                        ordersBottomTabBarWidthRef.current = e.nativeEvent.layout.width;
                      }}
                    >
                      {[
                        { id: 1, label: "Open Orders" },
                        { id: 2, label: "Order History" },
                        { id: 3, label: "Trade History" },
                      ].map((t) => (
                        <TouchableOpacity
                          key={t.id}
                          activeOpacity={0.8}
                          onLayout={(e) => {
                            const { x, width } = e.nativeEvent.layout;
                            ordersBottomTabItemLayoutRef.current[t.id] = { x, width };
                          }}
                          onPress={() => handleSpotOrdersPrimaryTab(t.id)}
                          style={{ alignItems: "center", minHeight: 28, justifyContent: "center", paddingHorizontal: 2 }}
                        >
                          <AppText
                            numberOfLines={1}
                            weight={SEMI_BOLD}
                            style={{
                              color: activeTab === t.id ? themeColors.text : themeColors.secondaryText,
                              fontSize: 14,
                            }}
                          >
                            {t.label}
                            {typeof t.count === "number" && t.count > 0 ? ` (${t.count})` : ""}
                          </AppText>
                          <View
                            style={{
                              minWidth: 24,
                              height: 2,
                              marginTop: 2,
                              backgroundColor: activeTab === t.id ? isDark ? colors.white : colors.buttonBg : "transparent",
                              borderRadius: 1,
                            }}
                          />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {(historyOnly || orderBookReady) && (
                  <View style={styles.ordersTabContentWrapper}>
                    {mountedOrdersTab === 1 ? (
                      <View style={[styles.ordersTabPanel, { zIndex: 100 }]}>
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6, paddingHorizontal: 2, zIndex: 100 }}>
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            nestedScrollEnabled
                            keyboardShouldPersistTaps="handled"
                            style={{ flex: 1, marginRight: 6 }}
                            contentContainerStyle={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 6,
                              paddingVertical: 2,
                            }}
                          >
                            {SPOT_OPEN_ORDER_KINDS.map((k) => {
                              const active = openOrderKindTab === k.id;
                              return (
                                <TouchableOpacity
                                  key={k.id}
                                  activeOpacity={0.85}
                                  onPress={() => setOpenOrderKindTab(k.id)}
                                  style={{
                                    paddingHorizontal: 8,
                                    paddingVertical: 4,
                                    borderRadius: 6,
                                    backgroundColor: active ? themeColors.input : "transparent",
                                  }}
                                >
                                  <AppText
                                    weight={MEDIUM}
                                    style={{
                                      fontSize: 12,
                                      color: active ? themeColors.text : themeColors.secondaryText,
                                    }}
                                  >
                                    {k.label}
                                  </AppText>
                                </TouchableOpacity>
                              );
                            })}
                          </ScrollView>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, zIndex: 100 }}>
                            <View style={{ width: 105, zIndex: 100 }}>
                              <CustomDropdown
                                compact
                                align="right"
                                data={SPOT_SIDE_DROPDOWN_LABELS}
                                selected={spotDropdownLabelFromSideFilter(orderFilter)}
                                onSelect={(label) => setOrderFilter(spotSideFilterFromDropdownLabel(label))}
                              />
                            </View>
                            <TouchableOpacity
                              onPress={() => {
                                setOpenOrderKindTab("all");
                                setOrderFilter("All");
                              }}
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 4,
                                paddingVertical: 4,
                                paddingLeft: 4,
                              }}
                            >
                              <FastImage source={Refresh} tintColor={isDark ? colors.white : colors.black} style={{ width: 12, height: 12 }} resizeMode="contain" />
                              <AppText weight={MEDIUM} style={{ fontSize: 12, color: themeColors.secondaryText }}>Reset</AppText>
                            </TouchableOpacity>
                          </View>
                        </View>

                        {filteredOpenOrders?.length > 0 ? (
                          <>
                            <View style={styles.scrollContent}>
                              {openOrdersSlice.map((item, index) => (
                                <OpenOrderItemCard
                                  key={openOrderKeyExtractor(item, index)}
                                  inv={item}
                                  themeColors={themeColors}
                                  isDark={isDark}
                                  base_currency={base_currency}
                                  buildCurrencyPairText={buildCurrencyPairText}
                                  getOrderStatusRaw={getOrderStatusRaw}
                                  getSideColor={getSideColor}
                                  onCancelPress={handleCancelOpenOrderPress}
                                />
                              ))}
                            </View>
                            {filteredOpenOrders?.length > 5 && (
                              <TouchableOpacity
                                style={styles.viewAllButton}
                                onPress={() => NavigationService.navigate(OPEN_ORDER_SCREEN)}
                              >
                                <AppText style={[styles.viewAllText, { color: colors.buttonBg }]}>View All</AppText>
                              </TouchableOpacity>
                            )}
                          </>
                        ) : (
                          renderSpotOrdersEmptyState("Please login to view your open orders")
                        )}
                      </View>
                    ) : null}

                    {mountedOrdersTab === 2 ? (
                      <View style={styles.ordersTabPanel}>
                        {pastOrdersForSpotPair?.length > 0 ? (
                          <>
                            <View style={styles.scrollContent}>
                              {(pastOrdersSlice ?? []).map((item, index) => (
                                <PastOrderItemCard
                                  key={pastOrderKeyExtractor(item, index)}
                                  inv={item}
                                  themeColors={themeColors}
                                  isDark={isDark}
                                  base_currency={base_currency}
                                  quote_currency={quote_currency}
                                  buildCurrencyPairText={buildCurrencyPairText}
                                  getOrderStatusRaw={getOrderStatusRaw}
                                  getOrderStatusLabel={getOrderStatusLabel}
                                  getSideColor={getSideColor}
                                  normalizePairSymbol={normalizePairSymbol}
                                  showExecutedTrades={showExecutedTrades}
                                  setShowExecutedTrades={setShowExecutedTrades}
                                />
                              ))}
                            </View>
                            {pastOrdersForSpotPair?.length > 5 && (
                              <TouchableOpacity
                                activeOpacity={0.8}
                                style={styles.viewAllButton}
                                onPress={() => NavigationService.navigate('Trade_History')}
                              >
                                <AppText style={[styles.viewAllText, { color: isDark ? colors.white : colors.buttonBg }]}>View More</AppText>
                              </TouchableOpacity>
                            )}
                          </>
                        ) : (
                          renderSpotOrdersEmptyState("Please login to view your order history")
                        )}
                      </View>
                    ) : null}

                    {mountedOrdersTab === 3 ? (
                      <View style={[styles.ordersTabPanel, { zIndex: 100 }]}>
                        <>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              justifyContent: "flex-end",
                              gap: 6,
                              marginBottom: 6,
                              paddingLeft: 2,
                              paddingRight: 14,
                              alignSelf: "flex-start",
                              zIndex: 100,
                            }}
                          >
                            <View style={{ width: 110, zIndex: 100 }}>
                              <CustomDropdown
                                compact
                                data={SPOT_SIDE_DROPDOWN_LABELS}
                                selected={spotDropdownLabelFromSideFilter(tradeHistorySideFilter)}
                                onSelect={(label) => setTradeHistorySideFilter(spotSideFilterFromDropdownLabel(label))}
                              />
                            </View>
                            <TouchableOpacity
                              onPress={() => setTradeHistorySideFilter("All")}
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 4,
                                paddingVertical: 4,
                                paddingLeft: 4,
                              }}
                            >
                              <FastImage source={Refresh} tintColor={isDark ? colors.white : colors.black} style={{ width: 12, height: 12 }} resizeMode="contain" />
                              <AppText style={{ fontSize: 13, color: themeColors.secondaryText }}>Reset</AppText>
                            </TouchableOpacity>
                          </View>
                          {renderTradeHistorySection()}
                        </>
                      </View>
                    ) : null}
                  </View>
                )}
              </>
            )
  );
}
