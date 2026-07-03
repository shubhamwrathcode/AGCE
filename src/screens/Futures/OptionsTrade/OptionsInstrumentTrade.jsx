import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Dimensions, TextInput, Platform, Keyboard, Modal, Pressable } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../../hooks/useTheme';
import { AppText, BOLD, MEDIUM, SEMI_BOLD, TWELVE, FOURTEEN, SIXTEEN, TEN, THIRTEEN, AppSafeAreaView } from '../../../common';
import { colors } from '../../../theme/colors';
import FastImage from 'react-native-fast-image';
import {
  back_ic,
  candle,
  right_ic,
  downIcon,
  INFO,
  limitTrade,
  tick,
  order_1,
  order_2,
  order_3,
  NO_NOTIFICATION_ICON
} from '../../../helper/ImageAssets';
import { fontFamilyMedium, fontFamilySemiBold } from '../../../theme/typography';
import PercentQuickSelect from '../../../shared/components/PercentQuickSelect';

const { width: Width } = Dimensions.get('window');

// Dummy Orderbook Data
const MOCK_ASKS = Array(5).fill({ price: "105,248.47", amount: "2.54K", ratio: 80 });
const MOCK_BIDS = Array(5).fill({ price: "105,248.47", amount: "2.54K", ratio: 30 });

const SPOT_OB_VIEW_ICONS = [order_1, order_2, order_3];
const obPrecisionOptions = ['0.1', '0.01', '0.001'];

const OptionsInstrumentTrade = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const themeObj = useTheme();
  const { colors: themeColors, isDark } = themeObj;

  const { item, currentPrice, selectedAsset, isCall } = route.params || {};
  const symbol = item?.symbol || "BTC-234521-32212-R";

  // State
  const [tradeTab, setTradeTab] = useState('buy'); // 'buy' or 'sell'
  const [bottomTab, setBottomTab] = useState('positions'); // positions, orders, assets
  const [sliderValue, setSliderValue] = useState(0);
  const [reduceOnly, setReduceOnly] = useState(false);
  const [amount, setAmount] = useState('');
  const [isAmountFocused, setIsAmountFocused] = useState(false);

  const [precision, setPrecision] = useState('0.01');
  const [obPrecisionOpen, setObPrecisionOpen] = useState(false);
  const [obPrecisionLayout, setObPrecisionLayout] = useState(null);
  const precisionTriggerRef = React.useRef(null);
  const [viewModeIndex, setViewModeIndex] = useState(0);

  const openObPrecisionMenu = () => {
    precisionTriggerRef.current?.measure((x, y, w, h, px, py) => {
      setObPrecisionLayout({ x: px, y: py, w, h });
      setObPrecisionOpen(true);
    });
  };

  const closeObPrecisionMenu = () => {
    setObPrecisionOpen(false);
  };

  const cycleViewMode = () => {
    setViewModeIndex((prev) => (prev + 1) % 3);
  };

  const handleSliderChange = (val) => {
    setSliderValue(val);
  };

  // Dummy metrics
  const indexPrice = currentPrice || 73514.6;
  const changeStr = "0.00%";
  const delta = "-0.0006";
  const theta = "-7.1397";
  const gamma = "0.000002";

  const AVAILABLE_W = width - 32;
  const LEFT_W = AVAILABLE_W * 0.42;
  const RIGHT_W = AVAILABLE_W * 0.52;

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 10, marginLeft: -10 }}>
        <FastImage source={back_ic} style={{ width: 18, height: 18 }} resizeMode="contain" tintColor={themeColors.text} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.symbolSelector}>
        <AppText type={SIXTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text }}>{symbol}</AppText>
        <FastImage source={downIcon} style={{ width: 11, height: 11, marginLeft: 4 }}
          resizeMode='contain' tintColor={themeColors.text} />
      </TouchableOpacity>
      <View style={{ flex: 1 }} />
      <TouchableOpacity style={{ padding: 10, marginRight: -10 }}>
        <FastImage source={candle} style={{ width: 24, height: 24 }} resizeMode="contain" tintColor={themeColors.text} />
      </TouchableOpacity>
    </View>
  );

  const renderMetrics = () => (
    <View style={styles.metricsRow}>
      <View style={{ flex: 1.2 }}>
        <AppText type={TEN} style={{ color: themeColors.secondaryText }}>Index Price</AppText>
        <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text, marginTop: 4 }}>{indexPrice.toLocaleString()}</AppText>
      </View>
      <View style={{ flex: 1 }}>
        <AppText type={TEN} style={{ color: themeColors.secondaryText }}>Change</AppText>
        <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: colors.green, marginTop: 4 }}>{changeStr}</AppText>
      </View>
      <View style={{ flex: 1 }}>
        <AppText type={TEN} style={{ color: themeColors.secondaryText }}>Delta</AppText>
        <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text, marginTop: 4 }}>{delta}</AppText>
      </View>
      <View style={{ flex: 1 }}>
        <AppText type={TEN} style={{ color: themeColors.secondaryText }}>Theta</AppText>
        <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text, marginTop: 4 }}>{theta}</AppText>
      </View>
      <View style={{ flex: 1 }}>
        <AppText type={TEN} style={{ color: themeColors.secondaryText }}>Gamma</AppText>
        <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text, marginTop: 4 }}>{gamma}</AppText>
      </View>
    </View>
  );

  return (
    <AppSafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <View style={{ paddingHorizontal: 16 }}>
          {renderHeader()}
          {renderMetrics()}

          <View style={{ flexDirection: 'row', marginTop: 24, justifyContent: 'space-between' }}>
            {/* Orderbook Left */}
            <View style={{ width: LEFT_W }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <AppText type={TEN} style={{ color: themeColors.secondaryText }}>Price{"\n"}(USDT)</AppText>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <AppText type={TEN} style={{ color: themeColors.secondaryText, textAlign: 'right' }}>Amount{"\n"}(USDT)</AppText>
                </View>
              </View>

              <View style={{ gap: 2 }}>
                {MOCK_ASKS.map((ask, i) => (
                  <View key={`ask-${i}`} style={[styles.obRow, { position: 'relative', overflow: 'hidden' }]}>
                    <View style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: `${ask.ratio}%`, backgroundColor: isDark ? "rgba(232, 97, 97, 0.18)" : "rgba(255, 77, 79, 0.14)" }} />
                    <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: colors.red, fontFamily: fontFamilyMedium }}>{ask.price}</AppText>
                    <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: themeColors.text, fontFamily: fontFamilyMedium }}>{ask.amount}</AppText>
                  </View>
                ))}
              </View>

              <View style={{ marginVertical: 8 }}>
                <AppText type={SIXTEEN} weight={BOLD} style={{ color: colors.green }}>105,254.47</AppText>
                <AppText type={TWELVE} style={{ color: themeColors.secondaryText, marginTop: 2 }}>≈ $105,254.47</AppText>
              </View>

              <View style={{ gap: 2 }}>
                {MOCK_BIDS.map((bid, i) => (
                  <View key={`bid-${i}`} style={[styles.obRow, { position: 'relative', overflow: 'hidden' }]}>
                    <View style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: `${bid.ratio}%`, backgroundColor: isDark ? "rgba(2, 192, 118, 0.15)" : "rgba(56, 183, 129, 0.18)" }} />
                    <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: colors.green, fontFamily: fontFamilyMedium }}>{bid.price}</AppText>
                    <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: themeColors.text, fontFamily: fontFamilyMedium }}>{bid.amount}</AppText>
                  </View>
                ))}
              </View>

              {/* Ratio Bar */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 12, gap: 4 }}>
                <View style={{ flex: 0.48, height: 4, backgroundColor: isDark ? "rgba(2, 192, 118, 0.15)" : "rgba(56, 183, 129, 0.18)", borderRadius: 2 }}>
                  <AppText type={TEN} style={{ color: colors.green, position: 'absolute', top: 6, left: 4, fontSize: 9 }}>48%</AppText>
                </View>
                <View style={{ flex: 0.52, height: 4, backgroundColor: isDark ? "rgba(232, 97, 97, 0.18)" : "rgba(255, 77, 79, 0.14)", borderRadius: 2 }}>
                  <AppText type={TEN} style={{ color: colors.red, position: 'absolute', top: 6, right: 4, fontSize: 9 }}>52%</AppText>
                </View>
              </View>

              {/* Precision Dropdown */}
              <View style={styles.spotObToolbarRow}>
                <TouchableOpacity
                  ref={precisionTriggerRef}
                  onPress={openObPrecisionMenu}
                  style={[styles.spotObAggTrigger, { backgroundColor: themeColors.input, borderColor: themeColors.themeBorderColor, borderRadius: 5 }]}
                  activeOpacity={0.75}
                >
                  <AppText type={TEN} weight={SEMI_BOLD} style={{ color: themeColors.text, fontSize: 11, lineHeight: 14 }}>{precision}</AppText>
                  <FastImage source={downIcon} style={styles.spotObAggCaret} resizeMode='contain' tintColor={themeColors.secondaryText} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={cycleViewMode}
                  style={[styles.spotObViewCycleBtn, { backgroundColor: themeColors.input, borderColor: themeColors.themeBorderColor }]}
                  activeOpacity={0.75}
                >
                  <FastImage source={SPOT_OB_VIEW_ICONS[viewModeIndex]} style={styles.layoutIcon} resizeMode='contain' />
                </TouchableOpacity>
              </View>

              <Modal visible={obPrecisionOpen} transparent animationType="fade" onRequestClose={closeObPrecisionMenu}>
                <Pressable style={styles.spotObAggBackdrop} onPress={closeObPrecisionMenu} />
                {obPrecisionLayout ? (
                  <View
                    style={[
                      styles.spotObAggPopover,
                      {
                        top: obPrecisionLayout.y + obPrecisionLayout.h + 4,
                        left: Math.max(8, Math.min(obPrecisionLayout.x + obPrecisionLayout.w - 144, Width - 8 - 144)),
                        backgroundColor: themeColors.card,
                        borderColor: themeColors.themeBorderColor,
                      },
                    ]}
                  >
                    {obPrecisionOptions.map((opt) => {
                      const selected = precision === opt;
                      return (
                        <TouchableOpacity
                          key={opt}
                          style={[
                            styles.spotObAggRow,
                            selected && { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)" },
                          ]}
                          activeOpacity={0.7}
                          onPress={() => {
                            setPrecision(opt);
                            closeObPrecisionMenu();
                          }}
                        >
                          <AppText
                            type={TEN}
                            weight={selected ? SEMI_BOLD : undefined}
                            style={{ color: themeColors.text, fontSize: 11, lineHeight: 14 }}
                          >
                            {opt}
                          </AppText>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : null}
              </Modal>
            </View>

            {/* Order Entry Right */}
            <View style={{ width: RIGHT_W }}>
              {/* Buy / Sell Toggle */}
              <View style={[styles.toggleContainer, { backgroundColor: themeColors.input }]}>
                <TouchableOpacity style={[styles.toggleBtn, tradeTab === 'buy' && styles.toggleActive]} onPress={() => setTradeTab('buy')}>
                  <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: tradeTab === 'buy' ? colors.white : themeColors.secondaryText }}>Buy</AppText>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.toggleBtn, tradeTab === 'sell' && { backgroundColor: colors.red }]} onPress={() => setTradeTab('sell')}>
                  <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: tradeTab === 'sell' ? colors.white : themeColors.secondaryText }}>Sell</AppText>
                </TouchableOpacity>
              </View>

              {/* Order Type Dropdown (Removed as requested) */}

              {/* Price Row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <AppText type={TEN} style={{ color: themeColors.secondaryText }}>Price</AppText>
                  <FastImage source={INFO} style={{ width: 10, height: 10, marginLeft: 4 }} tintColor={themeColors.secondaryText} />
                </View>
                <AppText type={TEN} style={{ color: '#b9b9b9', marginLeft: 8 }}>Tick 5.000</AppText>
              </View>

              <View style={[styles.inputContainer, { backgroundColor: themeColors.input, flexDirection: 'row', alignItems: 'center' }]}>
                <TextInput
                  style={{ color: themeColors.text, fontSize: 14, fontFamily: fontFamilyMedium, padding: 0, flex: 1, paddingVertical: Platform.OS === 'android' ? 4 : 8 }}
                  placeholder="6930"
                  placeholderTextColor={themeColors.text}
                />
                <AppText style={{ color: themeColors.text, fontFamily: fontFamilyMedium }}>USDT</AppText>
              </View>

              {/* IV Row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <AppText type={TWELVE} style={{ color: themeColors.secondaryText }}>IV</AppText>
                  <FastImage source={INFO} style={{ width: 10, height: 10, marginLeft: 4 }} tintColor={themeColors.secondaryText} />
                </View>
                <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: themeColors.text }}>68.7%</AppText>
              </View>

              {/* Amount Row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 4 }}>
                <AppText type={TEN} style={{ color: themeColors.secondaryText }}>Amount</AppText>
                <AppText type={TEN} style={{ color: '#b9b9b9', marginLeft: 8 }}>Step 0.01</AppText>
              </View>

              <View style={[styles.inputContainer, { backgroundColor: themeColors.input, flexDirection: 'row', alignItems: 'center' }]}>
                <TextInput
                  style={{ color: themeColors.text, fontSize: 13, fontFamily: fontFamilyMedium, padding: 0, flex: 1, paddingVertical: Platform.OS === 'android' ? 4 : 8 }}
                  placeholder="Amount"
                  placeholderTextColor={themeColors.secondaryText}
                />
                <AppText style={{ color: themeColors.text, fontFamily: fontFamilyMedium }}>Contract</AppText>
              </View>

              <View style={{ marginTop: 4 }}>
                <AppText type={TEN} style={{ color: themeColors.secondaryText }}>1 Cont = 1 BTCUSDT</AppText>
              </View>

              {/* Slider */}
              <View style={{ marginVertical: 8 }}>
                <PercentQuickSelect
                  activeValue={sliderValue}
                  onSelect={(val) => {
                    Keyboard.dismiss();
                    setIsAmountFocused(false);
                    handleSliderChange(val);
                    if (val === 0) {
                      setAmount('');
                    }
                  }}
                  theme={themeObj.theme}
                />
              </View>

              {/* Reduce Only & TIF */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <TouchableOpacity onPress={() => setReduceOnly(!reduceOnly)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={[styles.checkbox, reduceOnly && { backgroundColor: themeColors.text, borderColor: themeColors.text, alignItems: 'center', justifyContent: 'center' }]}>
                    {reduceOnly && <FastImage source={tick} style={{ width: 10, height: 10 }} tintColor={isDark ? colors.black : colors.white} resizeMode="contain" />}
                  </View>
                  <AppText type={TWELVE} style={[{ color: themeColors.secondaryText }, styles.dashedUnderline]}>Reduce Only</AppText>
                </TouchableOpacity>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <AppText type={TWELVE} style={{ color: themeColors.secondaryText }}>TIF</AppText>
                  <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: themeColors.text }}>GTC</AppText>
                  <FastImage source={downIcon} style={{ width: 8, height: 8 }} resizeMode='contain' tintColor={themeColors.secondaryText} />
                </TouchableOpacity>
              </View>

              {/* Action Button */}
              <TouchableOpacity style={[
                styles.actionBtn,
                { backgroundColor: tradeTab === 'buy' ? colors.green : colors.red, opacity: 0.5 }
              ]}>
                <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: colors.white }}>
                  {tradeTab === 'buy' ? 'Buy BTC' : 'Sell BTC'}
                </AppText>
              </TouchableOpacity>

              {/* Cost & Fee Rate */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <AppText type={TWELVE} style={{ color: themeColors.secondaryText }}>Cost --</AppText>
                <View style={styles.dashedUnderline}>
                  <AppText type={TWELVE} style={{ color: themeColors.secondaryText }}>Fee Rate</AppText>
                </View>
              </View>

            </View>
          </View>
        </View>

        {/* Bottom Tabs */}
        <View style={{ marginTop: 24, borderTopWidth: 1, borderTopColor: themeColors.themeBorderColor || '#EAEAEA' }}>
          <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginTop: 16 }}>
            <TouchableOpacity onPress={() => setBottomTab('positions')} style={{ borderBottomWidth: bottomTab === 'positions' ? 2 : 0, borderBottomColor: themeColors.text, paddingBottom: 4 }}>
              <AppText type={SIXTEEN} weight={bottomTab === 'positions' ? BOLD : SEMI_BOLD} style={{ color: bottomTab === 'positions' ? themeColors.text : themeColors.secondaryText }}>Positions (0)</AppText>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setBottomTab('orders')} style={{ borderBottomWidth: bottomTab === 'orders' ? 2 : 0, borderBottomColor: themeColors.text, paddingBottom: 4, marginLeft: 16 }}>
              <AppText type={SIXTEEN} weight={bottomTab === 'orders' ? BOLD : SEMI_BOLD} style={{ color: bottomTab === 'orders' ? themeColors.text : themeColors.secondaryText }}>Orders (0)</AppText>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setBottomTab('assets')} style={{ borderBottomWidth: bottomTab === 'assets' ? 2 : 0, borderBottomColor: themeColors.text, paddingBottom: 4, marginLeft: 16 }}>
              <AppText type={SIXTEEN} weight={bottomTab === 'assets' ? BOLD : SEMI_BOLD} style={{ color: bottomTab === 'assets' ? themeColors.text : themeColors.secondaryText }}>Assets</AppText>
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <TouchableOpacity>
              <FastImage source={NO_NOTIFICATION_ICON} style={{ width: 18, height: 18 }} tintColor={themeColors.text} />
            </TouchableOpacity>
          </View>

          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
            <FastImage source={NO_NOTIFICATION_ICON} style={{ width: 80, height: 80, opacity: 0.5 }} resizeMode="contain" />
            <AppText style={{ color: themeColors.text, marginTop: 16, fontFamily: fontFamilyMedium }}>No data</AppText>
          </View>
        </View>
      </ScrollView>
    </AppSafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
  },
  symbolSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  obRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 2,
    marginBottom: 4,
  },
  toggleBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 18,
  },
  toggleActive: {
    backgroundColor: colors.green,
  },
  orderTypeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 8,
    marginTop: 16,
  },
  inputContainer: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionBtn: {
    paddingVertical: 8,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 10,
  },
  checkbox: {
    width: 14,
    height: 14,
    borderWidth: 1,
    borderColor: '#b9b9b9',
    borderRadius: 2,
  },
  dashedUnderline: {
    borderBottomWidth: 1,
    borderBottomColor: '#b9b9b9',
    borderStyle: 'dashed',
  },
  spotObToolbarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 0,
    marginTop: 12,
  },
  spotObAggTrigger: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 32,
  },
  spotObAggCaret: {
    width: 10,
    height: 10,
  },
  spotObViewCycleBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  layoutIcon: {
    width: 15,
    height: 15,
  },
  spotObAggBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  spotObAggPopover: {
    position: "absolute",
    width: 144,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  spotObAggRow: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  }
});

export default OptionsInstrumentTrade;
