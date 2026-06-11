import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Dimensions, TextInput } from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import FastImage from 'react-native-fast-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import RBSheet from 'react-native-raw-bottom-sheet';
import FuturePairList from './FuturePairList';
import { useFuturesSocket } from './useFuturesSocket';
import { AppText, BOLD, MEDIUM, SEMI_BOLD, TWELVE, FOURTEEN, SIXTEEN, TEN, THIRTEEN, Button } from '../../shared';
import { useTheme } from '../../hooks/useTheme';
import { colors } from '../../theme/colors';
import ToggleSwitch from '../../common/ToggleSwitch';
import PercentQuickSelect from '../../shared/components/PercentQuickSelect';
// Dummy icons (replace with actual from ImageAssets when available)
import {
  back_ic,
  downIcon,
  printIcon,
  INFO,
  limitTrade,
  market_ic,
  spotLimitTrade,
  spotMarket,
  tick,
  REMOVE,
  closeIcon,
  candle,
  history_line,
  add
} from '../../helper/ImageAssets';
import { fontFamilyMedium, fontFamilySemiBold } from '../../theme/typography';

const { width } = Dimensions.get('window');

const dummyAsks = Array(7).fill({ price: '105,248.47', size: '2.54K' });
const dummyBids = Array(5).fill({ price: '105,248.47', size: '2.54K' });

const FuturesUI = () => {
  const themeObj = useTheme();
  const { colors: themeColors, isDark } = themeObj;
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState('Open');
  const [sliderValue, setSliderValue] = useState(0);
  const pairSheetRef = useRef(null);

  const {
    isConnected,
    futuresData,
    subscribeToFutures,
    unsubscribeFromFutures,
    subscribeToMarket,
    unsubscribeFromMarket
  } = useFuturesSocket();
  const isFocused = useIsFocused();
  const futuresPairs = useSelector((state) => state.home.futuresPairs);
  const [pairData, setPairData] = useState([]);
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [orderType, setOrderType] = useState('Limit');
  const orderTypeSheetRef = useRef(null);
  const [marginMode, setMarginMode] = useState('Cross');
  const marginModeSheetRef = useRef(null);
  const [batchAdjustMarginMode, setBatchAdjustMarginMode] = useState(false);
  const [contractUnit, setContractUnit] = useState('Amount (BTC)');
  const contractUnitSheetRef = useRef(null);
  const [marginLeverage, setMarginLeverage] = useState(10);
  const [leverageDraft, setLeverageDraft] = useState(10);
  const rbSheetMarginLeverage = useRef(null);

  const ORDER_TYPE_SHEET_BASIC = [
    {
      name: "Limit",
      description: "Buy or sell at your chosen price or better.",
      icon: limitTrade,
    },
    {
      name: "Market",
      description: "Instantly trade at the current market price.",
      icon: market_ic,
    },
    {
      name: "Conditional",
      description: "Your order will be placed automatically when the target price is reached.",
      icon: spotLimitTrade,
    },
  ];

  const renderOrderTypeRow = (item, index) => {
    const selected = orderType === item.name;
    return (
      <TouchableOpacity
        key={item.name}
        activeOpacity={0.75}
        onPress={() => {
          setOrderType(item.name);
          orderTypeSheetRef.current?.close();
        }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 14,
          paddingHorizontal: 4,
          borderBottomWidth: index - 1 ? 0 : StyleSheet.hairlineWidth,
          borderBottomColor: index - 1 ? 'transparent' : themeColors.themeBorderColor || "#ccc",
        }}
      >
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: colors.newThemeColor || "#2C2D31",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <FastImage source={item.icon} tintColor={colors.white} style={{ width: 16, height: 16 }} resizeMode="contain" />
        </View>
        <View style={{ flex: 1, marginLeft: 12, paddingRight: 8 }}>
          <AppText weight={SEMI_BOLD} style={{ color: themeColors.text, fontSize: 14, marginBottom: 3 }}>
            {item.name}
          </AppText>
          <AppText type={TWELVE} style={{ color: themeColors.secondaryText, fontSize: 11, lineHeight: 15 }}>
            {item.description}
          </AppText>
        </View>
        {selected ? (
          <View style={{ width: 16, height: 16, borderRadius: 10, backgroundColor: isDark ? colors.white : colors.black, alignItems: "center", justifyContent: "center" }}>
            <FastImage source={tick} tintColor={isDark ? colors.black : colors.white} style={{ width: 8, height: 8 }} resizeMode="contain" />
          </View>
        ) : (
          <View style={{ width: 26 }} />
        )}
      </TouchableOpacity>
    );
  };

  useEffect(() => {
    // Prioritize live data from Redux (market:update), fallback to static futures socket
    const pairsArray = (futuresPairs && futuresPairs.length > 0)
      ? futuresPairs
      : (futuresData?.contracts || futuresData?.pairs || []);

    if (pairsArray && pairsArray.length > 0) {
      setPairData(pairsArray);
      if (!selectedCoin) {
        setSelectedCoin(pairsArray[0]);
      }
    }
  }, [futuresPairs, selectedCoin, futuresData]);

  useEffect(() => {
    if (isFocused && pairData.length === 0) {
      subscribeToFutures();
      const t = setTimeout(() => subscribeToFutures(), 800);
      return () => clearTimeout(t);
    }
  }, [isFocused, pairData.length, subscribeToFutures]);

  useEffect(() => {
    if (isFocused) {
      subscribeToMarket?.();
    } else {
      unsubscribeFromMarket?.();
    }
  }, [isFocused, subscribeToMarket, unsubscribeFromMarket]);

  const handleSelectCoin = (pair) => {
    setSelectedCoin(pair);
    pairSheetRef.current?.close();
    setSearchTerm("");
    subscribeToFutures(pair.base_currency_id, pair.quote_currency_id);
  };

  const filteredPairs = pairData?.filter((pair) => {
    const term = searchTerm.toLowerCase();
    const shortName = (pair?.short_name || pair?.base_asset || "").toLowerCase();
    const marginAsset = (pair?.margin_asset || "").toLowerCase();
    const name = (pair?.name || pair?.symbol || "").toLowerCase();
    return (
      shortName.includes(term) ||
      marginAsset.includes(term) ||
      name.includes(term)
    );
  });

  const Header = () => (
    <View style={styles.header}>
      <View>
        <TouchableOpacity style={styles.pairRow} onPress={() => pairSheetRef.current?.open()}>
          <AppText type={SIXTEEN} weight={SEMI_BOLD} style={{ fontSize: 20 }}>
            {selectedCoin ? `${selectedCoin.short_name || selectedCoin.base_asset}/${selectedCoin.margin_asset}` : 'RON/USDT'}
          </AppText>
          <FastImage source={downIcon} style={styles.smallIcon} resizeMode='contain' tintColor={themeColors.text} />
        </TouchableOpacity>
        <View style={styles.changeBadge}>
          <AppText type={TWELVE} weight={MEDIUM} style={{ color: colors.white }}>
            {selectedCoin ? `${selectedCoin.change_percentage >= 0 ? '+' : ''}${selectedCoin.change_percentage}%` : '+50.47%'}
          </AppText>
        </View>
      </View>

      <View style={[styles.headerIcons, { flexDirection: 'row', gap: 4 }]}>
        <TouchableOpacity style={{ padding: 6 }} activeOpacity={0.7}>
          <FastImage
            source={candle}
            style={{ width: 22, height: 22 }}
            resizeMode="contain"
            tintColor={themeColors.text}
          />
        </TouchableOpacity>
        <TouchableOpacity style={{ padding: 6, marginLeft: 2 }} activeOpacity={0.7}>
          <FastImage
            source={history_line}
            style={{ width: 22, height: 22 }}
            resizeMode="contain"
            tintColor={themeColors.text}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  const OrderBook = () => (
    <View style={styles.leftColumn}>
      <View style={styles.fundingRow}>
        <AppText type={TEN} color={themeColors.secondaryText} style={[styles.dashedUnderline, { alignSelf: 'flex-start' }]}>Funding / Countdown</AppText>
        <AppText type={TEN} weight={SEMI_BOLD} style={[styles.dashedUnderline, { marginTop: 4, alignSelf: 'flex-start' }]}>0.0100% / 03:23:21</AppText>
      </View>

      <View style={styles.obHeader}>
        <AppText type={TEN} color={themeColors.secondaryText}>Price{"\n"}(USDT)</AppText>
        <AppText type={TEN} color={themeColors.secondaryText} style={{ textAlign: 'right' }}>Size{"\n"}(USDT)</AppText>
      </View>

      {/* Asks (Red) */}
      <View style={styles.asksContainer}>
        {dummyAsks.map((item, index) => (
          <View key={`ask-${index}`} style={styles.obRow}>
            {/* Background fill representation */}
            <View style={[styles.obFillRed, { width: index === 1 || index === 2 || index === 4 ? '40%' : '0%' }]} />
            <AppText type={TWELVE} color={colors.red}>{item.price}</AppText>
            <AppText type={TWELVE}>{item.size}</AppText>
          </View>
        ))}
      </View>

      {/* Current Price */}
      <View style={styles.currentPrice}>
        <AppText type={SIXTEEN} weight={BOLD} color={colors.green}>105,254.47</AppText>
        <AppText type={TWELVE} color={themeColors.secondaryText}>≈ $105,254.47</AppText>
      </View>

      {/* Bids (Green) */}
      <View style={styles.bidsContainer}>
        {dummyBids.map((item, index) => (
          <View key={`bid-${index}`} style={styles.obRow}>
            <View style={[styles.obFillGreen, { width: index === 2 || index === 3 || index === 4 ? '50%' : '0%' }]} />
            <AppText type={TWELVE} color={colors.green}>{item.price}</AppText>
            <AppText type={TWELVE}>{item.size}</AppText>
          </View>
        ))}
      </View>

      {/* Ratio Bar */}
      <View style={styles.ratioBarContainer}>
        <View style={styles.ratioGreen}><AppText type={TEN} color={colors.green}>48%</AppText></View>
        <View style={styles.ratioRed}><AppText type={TEN} color={colors.red}>52%</AppText></View>
      </View>

      {/* Precision Dropdown */}
      <View style={styles.precisionRow}>
        <View style={styles.precisionDropdown}>
          <AppText type={TWELVE} color={themeColors.secondaryText}>0.01</AppText>
          <FastImage source={downIcon} style={{ width: 10, height: 10 }} tintColor={themeColors.secondaryText} />
        </View>
        <View style={styles.layoutIcon}>
          <View style={styles.layoutIconTop} />
          <View style={styles.layoutIconBot} />
        </View>
      </View>
    </View>
  );

  const OrderForm = () => (
    <View style={styles.rightColumn}>
      {/* Open / Close Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity style={[styles.toggleBtn, activeTab === 'Open' && styles.toggleActive]}>
          <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: activeTab === 'Open' ? colors.white : themeColors.secondaryText }}>Open</AppText>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.toggleBtn, activeTab === 'Close' && styles.toggleActive]}>
          <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: activeTab === 'Close' ? colors.white : themeColors.secondaryText }}>Close</AppText>
        </TouchableOpacity>
      </View>

      {/* Margin / Leverage */}
      <View style={[styles.marginRow, { marginBottom: 8 }]}>
        <TouchableOpacity
          style={[styles.marginBox, { paddingVertical: 8, borderRadius: 6 }]}
          onPress={() => marginModeSheetRef.current?.open()}
        >
          <AppText type={THIRTEEN} weight={SEMI_BOLD}>{marginMode}</AppText>
          <FastImage source={downIcon} style={{ width: 10, height: 10 }} resizeMode='contain' tintColor={themeColors.secondaryText} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.marginBox, { flex: 0.6, paddingVertical: 8, borderRadius: 6 }]}
          onPress={() => rbSheetMarginLeverage.current?.open()}
          activeOpacity={0.8}
        >
          <AppText type={THIRTEEN} weight={SEMI_BOLD}>{marginLeverage}x</AppText>
          <FastImage source={downIcon} style={{ width: 10, height: 10 }} resizeMode='contain' tintColor={themeColors.secondaryText} />
        </TouchableOpacity>
      </View>

      {/* Order Type */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => orderTypeSheetRef.current?.open()}
          style={{
            backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
            flex: 1,
            borderRadius: 6,
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 8,
            paddingHorizontal: 10,
          }}
        >
          <AppText
            weight={MEDIUM}
            style={{ color: themeColors.text, fontSize: 14 }}
          >
            {orderType}
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

      {/* Price Input */}
      <View style={styles.inputRow}>
        <View style={styles.inputBox}>
          <AppText type={TEN} color={themeColors.secondaryText} style={{ marginBottom: -4 }}>Price (USDT)</AppText>
          <TextInput
            value="0.057508"
            style={[styles.textInput, { color: themeColors.text }]}
            editable={false}
          />
        </View>
        <TouchableOpacity style={styles.bboBtn}>
          <AppText type={TWELVE} weight={SEMI_BOLD}>BBO</AppText>
        </TouchableOpacity>
      </View>

      {/* Amount Input */}
      <View style={[styles.inputBox, { flex: 0, marginTop: 12, height: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
        <View style={{ justifyContent: 'center' }}>
          <AppText type={TEN} color={themeColors.secondaryText} style={{ marginBottom: -5 }}>{contractUnit}</AppText>
          <TextInput
            value="45%"
            style={[styles.textInput, { color: themeColors.text }]}
            editable={false}
          />
        </View>
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
          onPress={() => contractUnitSheetRef.current?.open()}
          activeOpacity={0.8}
        >
          <AppText type={TWELVE} weight={SEMI_BOLD}>
            {contractUnit.includes('BTC') ? 'BTC' : contractUnit.includes('USDT') ? 'USDT' : 'Cont.'}
          </AppText>
          <FastImage source={downIcon} style={{ width: 8, height: 8 }} resizeMode='contain' tintColor={themeColors.text} />
        </TouchableOpacity>
      </View>

      {/* Slider */}
      <View style={{ marginVertical: 10 }}>
        <PercentQuickSelect
          activeValue={sliderValue}
          onSelect={setSliderValue}
          theme={themeObj.theme}
        />
      </View>

      {/* TP/SL */}
      <View style={styles.tpslRow}>
        <View style={styles.checkbox} />
        <AppText type={TWELVE} style={[styles.dashedUnderline, { alignSelf: 'flex-start' }]}>TP/SL</AppText>
      </View>

      {/* Available */}
      <View style={styles.availableRow}>
        <AppText type={TWELVE} color={themeColors.secondaryText}>Available</AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <AppText type={TWELVE}>-- USDT </AppText>
          <FastImage source={add} style={{ width: 16, height: 16 }} resizeMode='contain' />
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.buttonWrapper}>
        <View style={styles.maxRow}>
          <AppText type={TWELVE} color={themeColors.secondaryText}>Max</AppText>
          <AppText type={TWELVE}>0 RON</AppText>
        </View>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.green }]}>
          <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: colors.white }}>Open Long</AppText>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonWrapper}>
        <View style={[styles.maxRow, { bottom: 5 }]}>
          <AppText type={TWELVE} color={themeColors.secondaryText}>Max</AppText>
          <AppText type={TWELVE}>0 RON</AppText>
        </View>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.red }]}>
          <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: colors.white }}>Open Short</AppText>
        </TouchableOpacity>
      </View>
    </View>
  );

  const BottomTabs = () => (
    <View style={styles.bottomTabsContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bottomTabs}>
        <View style={styles.bottomTabActive}>
          <AppText type={SIXTEEN} weight={BOLD}>Open Orders (0)</AppText>
          <View style={styles.activeTabIndicator} />
        </View>
        <View style={styles.bottomTab}>
          <AppText type={FOURTEEN} weight={SEMI_BOLD} color={themeColors.secondaryText}>Orders (0)</AppText>
        </View>
        <View style={styles.bottomTab}>
          <AppText type={FOURTEEN} weight={SEMI_BOLD} color={themeColors.secondaryText}>Assets</AppText>
        </View>
      </ScrollView>
      <TouchableOpacity style={styles.historyIconBtn}>
        <FastImage source={printIcon} style={{ width: 18, height: 18 }} tintColor={themeColors.text} />
      </TouchableOpacity>
    </View>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.telescopeIcon} />
      <AppText type={FOURTEEN} color={themeColors.secondaryText}>No data</AppText>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background, paddingTop: insets.top }]}>
      <Header />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.mainContent}>
          <OrderBook />
          <OrderForm />
        </View>
        <View style={styles.divider} />
        <BottomTabs />
        <View style={styles.divider} />
        <EmptyState />

        <RBSheet
          ref={pairSheetRef}
          closeOnDragDown={true}
          closeOnPressMask={true}
          height={Dimensions.get("window").height * 0.7}
          animationType="slide"
          customStyles={{
            container: {
              backgroundColor: themeColors.themeElevationColor || themeColors.background,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
            },
            wrapper: {
              backgroundColor: "#0006",
            },
            draggableIcon: {
              backgroundColor: themeColors.themeBorderColor || "#ccc",
              width: 40,
            },
          }}
        >
          <FuturePairList
            pairs={pairData}
            selectedPair={selectedCoin}
            onSelectPair={handleSelectCoin}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onClose={() => pairSheetRef.current?.close()}
          />
        </RBSheet>

        {/* Margin Mode Sheet */}
        <RBSheet
          ref={marginModeSheetRef}
          closeOnDragDown={true}
          closeOnPressMask={true}
          height={480}
          animationType="slide"
          customStyles={{
            container: {
              backgroundColor: themeColors.themeElevationColor || themeColors.background,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingHorizontal: 20,
            },
            wrapper: {
              backgroundColor: "#0006",
            },
            draggableIcon: {
              backgroundColor: themeColors.themeBorderColor || "#ccc",
              width: 40,
            },
          }}
        >
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 8, paddingBottom: 4 }}>
              <AppText weight={BOLD} style={{ fontSize: 18, color: themeColors.text }}>
                Margin Mode
              </AppText>

            </View>
            <AppText style={{ color: themeColors.secondaryText, fontSize: 13, marginBottom: 20 }}>
              Select the unit type you want to use for placing your order.
            </AppText>

            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                {
                  name: "Isolated",
                  description:
                    "In isolated margin mode, the position margin is the allocated amount, and your loss is limited to it upon liquidation. You can also adjust the margin for positions in this mode.",
                },
                {
                  name: "Cross",
                  description:
                    "In cross margin mode, the entire account balance is used as margin, and you may lose it all upon liquidation.",
                },
              ].map((item) => {
                const isSelected = marginMode === item.name;
                return (
                  <TouchableOpacity
                    key={item.name}
                    activeOpacity={0.8}
                    onPress={() => {
                      setMarginMode(item.name);
                    }}
                    style={{
                      backgroundColor: 'transparent',
                      borderWidth: 1,
                      borderColor: isSelected
                        ? themeColors.text
                        : (themeColors.themeBorderColor || "#e0e0e0"),
                      borderRadius: 6,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      marginBottom: 16,
                    }}
                  >
                    <AppText
                      weight={SEMI_BOLD}
                      style={{
                        color: themeColors.text,
                        fontSize: 15,
                        marginBottom: 6,
                      }}
                    >
                      {item.name}
                    </AppText>
                    <AppText
                      style={{
                        color: themeColors.secondaryText,
                        fontSize: 12,
                        lineHeight: 18,
                      }}
                    >
                      {item.description}
                    </AppText>
                  </TouchableOpacity>
                );
              })}

              <AppText style={{ color: themeColors.secondaryText, fontSize: 12, marginBottom: 20, marginTop: 4 }}>
                Switching margin modes only applies to the current contract.
              </AppText>

              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
                <AppText weight={MEDIUM} style={{ fontSize: 15, color: themeColors.text }}>
                  Batch Adjust Margin Mode
                </AppText>
                <ToggleSwitch
                  value={batchAdjustMarginMode}
                  onValueChange={setBatchAdjustMarginMode}
                  isDark={isDark}
                />
              </View>
            </ScrollView>
          </View>
        </RBSheet>

        {/* Contract Unit Preferences Sheet */}
        <RBSheet
          ref={contractUnitSheetRef}
          closeOnDragDown={true}
          closeOnPressMask={true}
          height={520}
          animationType="slide"
          customStyles={{
            container: {
              backgroundColor: themeColors.themeElevationColor || themeColors.background,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingHorizontal: 20,
            },
            wrapper: {
              backgroundColor: "#0006",
            },
            draggableIcon: {
              backgroundColor: themeColors.themeBorderColor || "#ccc",
              width: 40,
            },
          }}
        >
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 8, paddingBottom: 4 }}>
              <AppText weight={BOLD} style={{ fontSize: 18, color: themeColors.text }}>
                Contract Unit Preferences
              </AppText>
              <TouchableOpacity onPress={() => contractUnitSheetRef.current?.close()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <FastImage source={REMOVE} style={{ width: 16, height: 16 }} tintColor={themeColors.text} resizeMode="contain" />
              </TouchableOpacity>
            </View>
            <AppText style={{ color: themeColors.secondaryText, fontSize: 13, marginBottom: 20 }}>
              Select the unit type you want to use for placing your order.
            </AppText>

            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                {
                  name: "Amount (BTC)",
                  description: "Specify the quantity of BTC tokens you wish to trade.",
                },
                {
                  name: "Value (USDT)",
                  description: "Enter the total position value in USDT. The required margin will change according to your selected leverage.",
                },
                {
                  name: "Cost (USDT)",
                  description: "Enter the margin amount for this position. This amount remains constant regardless of leverage changes.",
                },
                {
                  name: "Amount (Contracts)",
                  description: "Specify the total number of contracts you want to place for this order.",
                },
              ].map((item) => {
                const isSelected = contractUnit === item.name;
                return (
                  <TouchableOpacity
                    key={item.name}
                    activeOpacity={0.8}
                    onPress={() => {
                      setContractUnit(item.name);
                      contractUnitSheetRef.current?.close();
                    }}
                    style={{
                      backgroundColor: 'transparent',
                      borderWidth: 1,
                      borderColor: isSelected
                        ? themeColors.text
                        : (themeColors.themeBorderColor || "#e0e0e0"),
                      borderRadius: 6,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      marginBottom: 16,
                    }}
                  >
                    <AppText
                      weight={SEMI_BOLD}
                      style={{
                        color: themeColors.text,
                        fontSize: 15,
                        marginBottom: 6,
                      }}
                    >
                      {item.name}
                    </AppText>
                    <AppText
                      style={{
                        color: themeColors.secondaryText,
                        fontSize: 12,
                        lineHeight: 18,
                      }}
                    >
                      {item.description}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </RBSheet>

        {/* Adjust Leverage Sheet */}
        <RBSheet
          ref={rbSheetMarginLeverage}
          closeOnDragDown={false}
          closeOnPressMask={true}
          height={600}
          animationType="slide"
          onOpen={() => {
            setLeverageDraft(marginLeverage);
          }}
          customStyles={{
            container: {
              backgroundColor: colors.white,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingHorizontal: 16,
              paddingTop: 8,
              paddingBottom: 16,
            },
            wrapper: {
              backgroundColor: "#0006",
            },
          }}
        >
          <View style={{ flex: 1, paddingHorizontal: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 4, paddingBottom: 20 }}>
              <AppText weight={BOLD} style={{ fontSize: 18, color: themeColors.text, marginTop: 10 }}>
                Adjust Leverage
              </AppText>
              <TouchableOpacity onPress={() => rbSheetMarginLeverage.current?.close()} style={{ padding: 4 }}>
                <FastImage
                  source={closeIcon}
                  resizeMode="contain"
                  style={{ width: 15, height: 15 }}
                  tintColor={themeColors.secondaryText}
                />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Pair Row */}
              <AppText style={{ color: themeColors.secondaryText, fontSize: 13, marginBottom: 8 }}>Pair</AppText>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
                <FastImage source={{ uri: "https://cryptologos.cc/logos/bitcoin-btc-logo.png" }} style={{ width: 24, height: 24, borderRadius: 12, marginRight: 8 }} />
                <AppText weight={BOLD} style={{ fontSize: 16, color: themeColors.text }}>{selectedCoin?.short_name ? `${selectedCoin.short_name}/${selectedCoin.margin_asset}` : 'BTC/USDT'}</AppText>
              </View>

              {/* Leverage Input */}
              <AppText style={{ color: themeColors.secondaryText, fontSize: 13, marginBottom: 8 }}>Leverage</AppText>
              <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#fff", borderWidth: 1, borderColor: isDark ? "rgba(255,255,255,0.1)" : "#E5E5EA", padding: 14, borderRadius: 8, marginBottom: 16 }}>
                <AppText weight={MEDIUM} style={{ fontSize: 16, color: themeColors.text }}>{leverageDraft}x</AppText>
              </View>

              {/* Quick selector row */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
                {[1, 2, 3, 4].map((i) => {
                  const maxLeverage = selectedCoin?.max_leverage || 125;
                  const val = Math.round((maxLeverage / 5) * i);
                  const x = val < 1 ? 1 : val;
                  const isSelected = leverageDraft === x;
                  return (
                    <TouchableOpacity
                      key={`lev-${x}`}
                      onPress={() => setLeverageDraft(x)}
                      style={{
                        flex: 1,
                        marginHorizontal: 4,
                        paddingVertical: 10,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: isSelected ? themeColors.text : (isDark ? "rgba(255,255,255,0.1)" : "#E5E5EA"),
                        backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F2F2F7",
                        alignItems: "center"
                      }}
                    >
                      <AppText weight={MEDIUM} style={{ color: themeColors.text, fontSize: 13 }}>
                        {x}x
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity
                onPress={() => setLeverageDraft(selectedCoin?.max_leverage || 125)}
                style={{
                  marginHorizontal: 4,
                  paddingVertical: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: leverageDraft === (selectedCoin?.max_leverage || 125) ? themeColors.text : (isDark ? "rgba(255,255,255,0.1)" : "#E5E5EA"),
                  backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#E5E5EA",
                  alignItems: "center",
                  marginBottom: 24
                }}
              >
                <AppText weight={SEMI_BOLD} style={{ color: themeColors.text, fontSize: 14 }}>
                  {selectedCoin?.max_leverage || 125}x
                </AppText>
              </TouchableOpacity>

              {/* Removed details list to match web logic */}
              <AppText style={{ color: '#FF3B30', fontSize: 12, marginBottom: 10, marginTop: 10 }}>
                * Selecting higher leverage such as [10x] increases your liquidation risk. Always manage your risk levels. See our help article for more information.
              </AppText>
            </ScrollView>

            {/* Confirm Button */}
            <Button
              onPress={() => {
                setMarginLeverage(leverageDraft);
                rbSheetMarginLeverage.current?.close();
              }}
              containerStyle={{
                marginTop: 12,
                marginBottom: 8,
                backgroundColor: isDark ? "#FFFFFF" : "#1C1C1E",
              }}
              textStyle={{
                color: isDark ? "#000000" : "#FFFFFF"
              }}
            >
              Confirm
            </Button>
          </View>
        </RBSheet>


        <RBSheet
          ref={orderTypeSheetRef}
          closeOnDragDown={true}
          closeOnPressMask={true}
          height={Math.min(540, Dimensions.get("window").height * 0.6)}
          animationType="slide"
          customStyles={{
            container: {
              backgroundColor: themeColors.themeElevationColor || themeColors.background,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: 8,
            },
            wrapper: {
              backgroundColor: "#0006",
            },
            draggableIcon: {
              backgroundColor: themeColors.themeBorderColor || "#ccc",
              width: 40,
            },
          }}
        >
          <View style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: 14,
                marginBottom: 4,
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: themeColors.themeBorderColor,
              }}
            >
              <AppText weight={SEMI_BOLD} style={{ fontSize: 16, color: themeColors.text }}>
                Order Type
              </AppText>
              <TouchableOpacity
                onPress={() => orderTypeSheetRef?.current?.close()}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: themeColors.themeElevationColor || themeColors.background,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: themeColors.themeBorderColor,
                }}
              >
                <FastImage source={REMOVE} style={{ width: 18, height: 18 }} resizeMode="contain" tintColor={colors.black} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 24 }}
              showsVerticalScrollIndicator={false}
            >
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12, marginBottom: 6 }}>
                <AppText weight={SEMI_BOLD} style={{ fontSize: 13, color: themeColors.text }}>
                  Basic
                </AppText>
                <TouchableOpacity
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={{ marginLeft: 4, top: 2 }}
                >
                  <FastImage source={INFO} style={{ width: 12, height: 12 }} resizeMode="contain" tintColor={themeColors.secondaryText} />
                </TouchableOpacity>
              </View>
              {ORDER_TYPE_SHEET_BASIC.map(renderOrderTypeRow)}
            </ScrollView>
          </View>
        </RBSheet>
      </ScrollView>
    </View>
  );
};

export default FuturesUI;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pairRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  smallIcon: {
    width: 12,
    height: 12,
    marginLeft: 6,
  },
  changeBadge: {
    backgroundColor: colors.green,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    marginLeft: 16,
  },
  dummyIconLine: {
    width: 20, height: 16, borderWidth: 1, borderColor: '#333', borderRadius: 4,
  },
  dummyIconCandle: {
    width: 16, height: 16, borderLeftWidth: 2, borderRightWidth: 2, borderColor: '#333',
  },
  mainContent: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  leftColumn: {
    flex: 0.45,
    paddingRight: 10,
  },
  rightColumn: {
    flex: 0.55,
    paddingLeft: 10,
  },
  dashedUnderline: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    borderStyle: 'dashed',
  },
  fundingRow: {
    marginBottom: 16,
  },
  obHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  obRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    position: 'relative',
  },
  obFillRed: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(235, 77, 92, 0.15)',
  },
  obFillGreen: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(2, 192, 118, 0.15)',
  },
  currentPrice: {
    marginVertical: 12,
  },
  ratioBarContainer: {
    flexDirection: 'row',
    height: 12,
    marginTop: 16,
    marginBottom: 12,
    borderRadius: 2,
    overflow: 'hidden',
  },
  ratioGreen: {
    flex: 0.48,
    backgroundColor: 'rgba(2, 192, 118, 0.15)',
    justifyContent: 'center',
    paddingLeft: 4,
  },
  ratioRed: {
    flex: 0.52,
    backgroundColor: 'rgba(235, 77, 92, 0.15)',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 4,
  },
  precisionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  precisionDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    gap: 4,
  },
  layoutIcon: {
    width: 20,
    height: 20,
    justifyContent: 'space-between',
  },
  layoutIconTop: {
    height: 8,
    backgroundColor: colors.green,
    borderRadius: 2,
  },
  layoutIconBot: {
    height: 8,
    backgroundColor: colors.red,
    borderRadius: 2,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 20,
    padding: 2,
    marginBottom: 16,
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
  marginRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  marginBox: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
  },
  orderTypeBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.03)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  infoIcon: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inputBox: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 42,
    justifyContent: 'center',
  },
  textInput: {
    padding: 0,
    margin: 0,
    fontSize: 14,
    fontFamily: fontFamilySemiBold
  },
  bboBtn: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    paddingHorizontal: 10,
    borderRadius: 6,
    height: 42,
    justifyContent: 'center',
  },
  sliderContainer: {
    marginVertical: 20,
    paddingHorizontal: 4,
  },
  sliderTrack: {
    height: 2,
    backgroundColor: '#eee',
    width: '100%',
    position: 'absolute',
    top: 6,
    left: 4,
  },
  sliderKnob: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#666',
    position: 'absolute',
    left: '25%', // Adjust based on sliderValue
    top: 0,
    zIndex: 1,
  },
  sliderMarks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  sliderDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ccc',
    marginBottom: 4,
  },
  tpslRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  checkbox: {
    width: 14,
    height: 14,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 2,
  },
  availableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addIcon: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonWrapper: {
    marginBottom: 12,
  },
  maxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  actionBtn: {
    paddingVertical: 8,
    borderRadius: 24,
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: 8,
  },
  bottomTabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bottomTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  bottomTabActive: {
    alignItems: 'center',
  },
  activeTabIndicator: {
    width: 20,
    height: 3,
    backgroundColor: colors.black,
    marginTop: 4,
    borderRadius: 2,
  },
  bottomTab: {
    alignItems: 'center',
  },
  historyIconBtn: {
    marginLeft: 'auto',
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  telescopeIcon: {
    width: 60,
    height: 60,
    backgroundColor: '#f5f5f5', // Placeholder
    borderRadius: 30,
    marginBottom: 12,
  }
});