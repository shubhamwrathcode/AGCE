import React, { useRef, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FastImage from 'react-native-fast-image';
import Animated, { useSharedValue, useAnimatedScrollHandler, useAnimatedRef, scrollTo } from 'react-native-reanimated';
import { NO_NOTIFICATION_ICON, NO_NOTIFICATION_ICON_LIGHT, checkIc, checkIcon, downIcon } from '../../../helper/ImageAssets';
import { AppText } from '../../../common';
import { useTheme } from '../../../hooks/useTheme';
import { fontFamilyMedium, SEMI_BOLD } from '../../../theme/typography';
import { colors } from '../../../theme/colors';
import OptionsExpiries from './OptionsExpiries';
import { applyChainFilters, parseStrikeFilterInput } from './helpers/optionsDataHelpers';

const CALLS_HEADERS = [
  { title: 'Last', w: 60, align: 'center' },
  { title: 'Vega', w: 60, align: 'center' },
  { title: 'Theta', w: 70, align: 'center' },
  { title: 'Gamma', w: 70, align: 'center' },
  { title: 'Delta', w: 60, align: 'center' },
  { title: 'Bid/IV', w: 70, align: 'center' },
  { title: 'Mark/IV', w: 70, align: 'center' },
  { title: 'Ask/IV', w: 70, align: 'center' },
];

const PUTS_HEADERS = [
  { title: 'Bid/IV', w: 70, align: 'center' },
  { title: 'Mark/IV', w: 70, align: 'center' },
  { title: 'Ask/IV', w: 70, align: 'center' },
  { title: 'Delta', w: 60, align: 'center' },
  { title: 'Gamma', w: 70, align: 'center' },
  { title: 'Theta', w: 70, align: 'center' },
  { title: 'Vega', w: 60, align: 'center' },
  { title: 'Last', w: 60, align: 'center' },
];



const ROW_HEIGHT = 56;
const HEADER_ROW_HEIGHT = 35;

function withCommas(n, precision) {
  const parts = Number(n).toFixed(precision).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

function formatVal(v, precision = 2) {
  if (v === null || v === undefined) return '--';
  const n = Number(v);
  if (!Number.isFinite(n)) return '--';
  return withCommas(n, precision);
}

function formatPct(v) {
  if (v === null || v === undefined) return '--';
  const n = Number(v);
  if (!Number.isFinite(n)) return '--';
  return (n > 0 ? '+' : '') + n.toFixed(2) + '%';
}

function formatPrice(v, precision = 2) {
  if (v === null || v === undefined) return '--';
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return '--';
  return withCommas(n, precision);
}

function formatIvPct(v) {
  if (v === null || v === undefined) return '--';
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return '--';
  return n.toFixed(2) + '%';
}

const OptionsChainTable = ({ expiries, selectedExpiry, setSelectedExpiry, chains = [], currentPrice = 0, selectedAsset = '', isMarketLoading = false, onOpenPairList }) => {
  const { colors: themeColors, isDark } = useTheme();
  const navigation = useNavigation();

  const [cols, setCols] = useState({
    last: true,
    vega: true,
    theta: true,
    gamma: true,
  });
  const [menuCols, setMenuCols] = useState({
    last: true,
    vega: true,
    theta: true,
    gamma: true,
  });
  const [showColMenu, setShowColMenu] = useState(false);

  const [oddSize, setOddSize] = useState(true);
  const [strikeMinStr, setStrikeMinStr] = useState('');
  const [strikeMaxStr, setStrikeMaxStr] = useState('');
  const [debouncedFilters, setDebouncedFilters] = useState({ min: '', max: '' });

  useEffect(() => {
    const timer = setTimeout(() => {
      setCols(menuCols);
    }, 300);
    return () => clearTimeout(timer);
  }, [menuCols]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters({ min: strikeMinStr, max: strikeMaxStr });
    }, 500);
    return () => clearTimeout(timer);
  }, [strikeMinStr, strikeMaxStr]);

  const activeCallsHeaders = useMemo(() => CALLS_HEADERS.filter(h => {
    if (!cols.last && h.title === 'Last') return false;
    if (!cols.vega && h.title === 'Vega') return false;
    if (!cols.theta && h.title === 'Theta') return false;
    if (!cols.gamma && h.title === 'Gamma') return false;
    return true;
  }), [cols]);

  const activePutsHeaders = useMemo(() => PUTS_HEADERS.filter(h => {
    if (!cols.last && h.title === 'Last') return false;
    if (!cols.vega && h.title === 'Vega') return false;
    if (!cols.theta && h.title === 'Theta') return false;
    if (!cols.gamma && h.title === 'Gamma') return false;
    return true;
  }), [cols]);

  const ACTIVE_CALLS_WIDTH = activeCallsHeaders.reduce((a, b) => a + b.w, 0);
  const ACTIVE_PUTS_WIDTH = activePutsHeaders.reduce((a, b) => a + b.w, 0);

  const leftScrollRef = useAnimatedRef();
  const rightScrollRef = useAnimatedRef();
  const activeScroll = useSharedValue(0); // 0 = none, 1 = left, 2 = right

  useEffect(() => {
    setTimeout(() => {
      leftScrollRef.current?.scrollToEnd({ animated: false });
    }, 100);
  }, []);

  const handleLeftScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      if (activeScroll.value !== 1) return;
      const max = e.contentSize.width - e.layoutMeasurement.width;
      if (max <= 0) return;
      scrollTo(rightScrollRef, max - e.contentOffset.x, 0, false);
    }
  });

  const handleRightScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      if (activeScroll.value !== 2) return;
      const max = e.contentSize.width - e.layoutMeasurement.width;
      if (max <= 0) return;
      scrollTo(leftScrollRef, max - e.contentOffset.x, 0, false);
    }
  });

  const { chainsToRender, chainOffsets, elementsToRender } = useMemo(() => {
    const filteredChains = applyChainFilters(chains, {
      oddSize,
      strikeMin: parseStrikeFilterInput(debouncedFilters.min),
      strikeMax: parseStrikeFilterInput(debouncedFilters.max),
    });

    let targetChain = filteredChains?.find(c => c.date === selectedExpiry);
    let selectedChains = [];
    if (!targetChain && filteredChains?.length > 0) {
      if (selectedExpiry === 'ALL') {
        selectedChains = filteredChains;
      } else {
        selectedChains = [filteredChains[0]];
      }
    } else if (targetChain) {
      selectedChains = [targetChain];
    }

    // Pre-calculate exact Y offsets for each chain in a single pass (O(N))
    const offsets = [];
    const flattenedElements = [];
    let currentTop = HEADER_ROW_HEIGHT;

    selectedChains.forEach((chain, chainIdx) => {
      let activeLineIdx = chain.data.findIndex(s => s.strike > currentPrice);
      if (activeLineIdx === -1) activeLineIdx = chain.data.length;

      offsets.push({
        headerTop: currentTop,
        indicatorTop: currentTop + 35 + (activeLineIdx * ROW_HEIGHT) + (activeLineIdx > 0 ? 8 : 0) // exact top of the active line
      });

      flattenedElements.push({ type: 'header', chainIdx, activeLineIdx, date: chain.date });
      currentTop += 35; // group header

      chain.data.forEach((row, idx) => {
        const isRowAboveLine = idx === activeLineIdx - 1;
        const isRowBelowLine = idx === activeLineIdx;
        flattenedElements.push({ type: 'row', chainIdx, row, idx, isRowAboveLine, isRowBelowLine });
        currentTop += ROW_HEIGHT + (isRowAboveLine || isRowBelowLine ? 8 : 0);
      });
    });

    return { chainsToRender: selectedChains, chainOffsets: offsets, elementsToRender: flattenedElements };
  }, [chains, selectedExpiry, currentPrice, oddSize, debouncedFilters]);

  return (
    <View style={styles.container}>
      <OptionsExpiries
        expiries={expiries}
        selectedExpiry={selectedExpiry}
        setSelectedExpiry={setSelectedExpiry}
      />

      {/* Filter Bar */}
      <ScrollView style={{ flexGrow: 0 }} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center' }}>
        <TouchableOpacity onPress={() => setOddSize(!oddSize)} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
          <View style={{
            width: 16, height: 16,
            borderWidth: oddSize ? 0 : 1.5,
            borderColor: themeColors.secondaryText,
            borderRadius: 4,
            marginRight: 8,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: oddSize ? '#0D6EFD' : 'transparent'
          }}>
            {oddSize && <FastImage source={checkIc} style={{ width: 10, height: 10 }} tintColor="#FFF" resizeMode="contain" />}
          </View>
          <AppText style={{ color: themeColors.text, fontSize: 13, fontFamily: fontFamilyMedium }}>Odd Size</AppText>
        </TouchableOpacity>

        <TouchableOpacity onPress={onOpenPairList} style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1,
          borderColor: isDark ? '#333' : '#DDE2E5', borderRadius: 6, paddingHorizontal: 10, height: 32, marginRight: 12
        }}>
          <AppText style={{
            color: themeColors.text, fontSize: 12,
            fontFamily: fontFamilyMedium
          }}>{selectedAsset ? (selectedAsset.endsWith('USDT') ? selectedAsset : `${selectedAsset}USDT`) : 'BTCUSDT'}</AppText>
          <FastImage source={downIcon} style={{ width: 8, height: 8, marginLeft: 6 }} tintColor={themeColors.text} resizeMode="contain" />
        </TouchableOpacity>

        <AppText style={{ color: themeColors.text, fontSize: 13, fontFamily: fontFamilyMedium, marginRight: 8 }}>Strike Price</AppText>
        <TextInput
          style={{ width: 60, height: 32, borderWidth: 1, borderColor: isDark ? '#333' : '#DDE2E5', borderRadius: 6, color: themeColors.text, paddingHorizontal: 8, paddingVertical: 0, fontSize: 12, fontFamily: fontFamilyMedium }}
          placeholder="Min"
          placeholderTextColor={themeColors.secondaryText}
          keyboardType="numeric"
          value={strikeMinStr}
          onChangeText={setStrikeMinStr}
        />
        <AppText style={{ color: themeColors.text, fontSize: 13, marginHorizontal: 6 }}>-</AppText>
        <TextInput
          style={{ width: 60, height: 32, borderWidth: 1, borderColor: isDark ? '#333' : '#DDE2E5', borderRadius: 6, color: themeColors.text, paddingHorizontal: 8, paddingVertical: 0, fontSize: 12, fontFamily: fontFamilyMedium }}
          placeholder="Max"
          placeholderTextColor={themeColors.secondaryText}
          keyboardType="numeric"
          value={strikeMaxStr}
          onChangeText={setStrikeMaxStr}
        />

        <TouchableOpacity
          onPress={() => {
            setStrikeMinStr('');
            setStrikeMaxStr('');
            setOddSize(true);
          }}
          style={{ marginLeft: 12 }}
        >
          <AppText style={{ color: '#6B7785', fontSize: 13, fontFamily: fontFamilyMedium }}>Reset</AppText>
        </TouchableOpacity>
      </ScrollView>

      <View style={[styles.divider, { backgroundColor: themeColors.themeBorderColor || '#EAEAEA' }]} />

      {/* Scrollable Table Area */}
      {isMarketLoading ? (
        <View style={{ flex: 1, paddingTop: 10 }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <View key={i} style={{ flexDirection: 'row', height: 56, borderBottomWidth: 1, borderColor: isDark ? '#2C2D31' : '#F0F0F0', alignItems: 'center' }}>
              <View style={{ flex: 1, height: 20, backgroundColor: isDark ? '#2A2A2A' : '#E8E8E8', borderRadius: 4, marginHorizontal: 16 }} />
              <View style={{ width: 60, height: 20, backgroundColor: isDark ? '#2A2A2A' : '#E8E8E8', borderRadius: 4, marginHorizontal: 10 }} />
              <View style={{ flex: 1, height: 20, backgroundColor: isDark ? '#2A2A2A' : '#E8E8E8', borderRadius: 4, marginHorizontal: 16 }} />
            </View>
          ))}
        </View>
      ) : chainsToRender.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', }}>
          <FastImage
            source={isDark ? NO_NOTIFICATION_ICON : NO_NOTIFICATION_ICON_LIGHT}
            style={{ width: 100, height: 100 }}
            resizeMode="contain"
          />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

          <View style={{ flexDirection: 'row' }}>

            {/* Calls Side */}
            <View style={{ flex: 1 }}>
              {/* FIXED CALLS HEADERS */}
              {chainsToRender.map((chain, chainIdx) => {
                return (
                  <View key={`fixed-calls-${chainIdx}`} pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: chainOffsets[chainIdx]?.headerTop || 0, height: 35, justifyContent: 'center', paddingLeft: 16, backgroundColor: isDark ? '#1C1D21' : '#F9F9F9', borderBottomWidth: 1, borderTopWidth: 1, borderColor: themeColors.themeBorderColor || '#F0F0F0', zIndex: 5 }}>
                    <AppText style={{ color: themeColors.text, fontSize: 13, fontFamily: fontFamilyMedium }}>Calls</AppText>
                  </View>
                );
              })}

              <Animated.ScrollView
                ref={leftScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                onScroll={handleLeftScroll}
                scrollEventThrottle={16}
                onTouchStart={() => { activeScroll.value = 1; }}
              >
                <View>
                  {/* Header */}
                  <View style={[styles.headerColsRow, { height: HEADER_ROW_HEIGHT, width: ACTIVE_CALLS_WIDTH, backgroundColor: isDark ? '#1C1D21' : '#F9F9F9' }]}>
                    {activeCallsHeaders.map((h, i) => (
                      <View key={i} style={{ width: h.w, alignItems: h.align, paddingHorizontal: 6 }}>
                        <View style={styles.dashedTextContainer}>
                          <AppText style={{
                            color: themeColors.secondaryText, fontSize: 11,
                            fontFamily: fontFamilyMedium
                          }}>{h.title}</AppText>
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Rows */}
                  {elementsToRender.map((el, i) => {
                    if (el.type === 'header') {
                      return <View key={`call-hdr-${i}`} style={{ height: 35, width: ACTIVE_CALLS_WIDTH, backgroundColor: isDark ? '#1C1D21' : '#F9F9F9', borderBottomWidth: 1, borderTopWidth: 1, borderColor: themeColors.themeBorderColor || '#F0F0F0' }} />;
                    }

                    const { row, isRowAboveLine, isRowBelowLine } = el;
                    const strikePriceNum = row.strike;
                    const isCallITM = strikePriceNum < currentPrice;
                    const itmBg = isDark ? 'rgb(38, 41, 47)' : 'rgba(2, 192, 118, 0.05)';
                    const callBg = isCallITM ? itmBg : 'transparent';

                    const rowHeight = ROW_HEIGHT + (isRowAboveLine || isRowBelowLine ? 8 : 0);
                    const paddingBottom = isRowAboveLine ? 8 : 0;
                    const paddingTop = isRowBelowLine ? 8 : 0;
                    const borderBottomWidth = isRowAboveLine ? 0 : 1;

                    const cRaw = row.callRaw || {};
                    const cLeg = row.call || {};

                    return (
                      <TouchableOpacity 
                        key={`call-${i}`}
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate('OptionsInstrumentTrade', { item: cRaw, currentPrice, selectedAsset, isCall: true })}
                        style={[styles.dataCellRow, { height: rowHeight, paddingTop, paddingBottom, borderBottomWidth, width: ACTIVE_CALLS_WIDTH, borderBottomColor: themeColors.themeBorderColor || '#F0F0F0', backgroundColor: callBg }]}
                      >
                        {cols.last && <View style={{ width: 60, alignItems: 'center', paddingHorizontal: 6 }}>
                          <AppText style={{ color: themeColors.text, fontSize: 12, fontFamily: fontFamilyMedium }}>{formatPrice(cLeg.last, 0)}</AppText>
                        </View>}
                        {cols.vega && <View style={{ width: 60, alignItems: 'center', paddingHorizontal: 6 }}>
                          <AppText style={{ color: themeColors.text, fontSize: 12, fontFamily: fontFamilyMedium }}>{formatVal(cLeg.vega, 4)}</AppText>
                        </View>}
                        {cols.theta && <View style={{ width: 70, alignItems: 'center', paddingHorizontal: 6 }}>
                          <AppText style={{ color: themeColors.text, fontSize: 12, fontFamily: fontFamilyMedium }}>{formatVal(cLeg.theta, 4)}</AppText>
                        </View>}
                        {cols.gamma && <View style={{ width: 70, alignItems: 'center', paddingHorizontal: 6 }}>
                          <AppText style={{ color: themeColors.text, fontSize: 12, fontFamily: fontFamilyMedium }}>{formatVal(cLeg.gamma, 6)}</AppText>
                        </View>}
                        <View style={{ width: 60, alignItems: 'center', paddingHorizontal: 6 }}>
                          <AppText style={{ color: themeColors.text, fontSize: 12, fontFamily: fontFamilyMedium }}>{formatVal(cLeg.delta, 4)}</AppText>
                        </View>
                        <View style={{ width: 70, height: ROW_HEIGHT, alignItems: 'center', justifyContent: 'center' }}>
                          <AppText style={{ color: colors.green, fontSize: 12, fontFamily: fontFamilyMedium }}>{formatPrice(cLeg.bidIv, 0)}</AppText>
                        </View>
                        <View style={{ width: 70, height: ROW_HEIGHT, alignItems: 'center', justifyContent: 'center' }}>
                          <AppText style={{ color: colors.green, fontSize: 12, fontFamily: fontFamilyMedium }}>{formatPrice(cLeg.markIv, 1)}</AppText>
                          <AppText style={{ color: themeColors.secondaryText, fontSize: 10, fontFamily: fontFamilyMedium, marginTop: 2 }}>{formatIvPct(cLeg.markIvPct)}</AppText>
                        </View>
                        <View style={{ width: 70, height: ROW_HEIGHT, alignItems: 'center', justifyContent: 'center' }}>
                          <AppText style={{ color: colors.red, fontSize: 12, fontFamily: fontFamilyMedium }}>{formatPrice(cLeg.askIv, 0)}</AppText>
                          <AppText style={{ color: themeColors.secondaryText, fontSize: 10, fontFamily: fontFamilyMedium, marginTop: 2 }}>{formatIvPct(cLeg.askIvPct)}</AppText>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Animated.ScrollView>
            </View>

            {/* Center Strike */}
            <View style={{ width: 80, backgroundColor: isDark ? '#1C1D21' : '#F9F9F9', zIndex: 9999, elevation: 9999, overflow: 'visible' }}>
              <View style={[styles.headerColsRow, { height: HEADER_ROW_HEIGHT, justifyContent: 'center', zIndex: 10000, elevation: 10000, overflow: 'visible' }]}>
                <TouchableOpacity onPress={() => setShowColMenu(!showColMenu)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <AppText weight={SEMI_BOLD} style={{ color: themeColors.text, fontSize: 11, textAlign: 'center', marginRight: 4 }}>Strike Price</AppText>
                </TouchableOpacity>

                <Modal visible={showColMenu} transparent animationType="fade">
                  <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowColMenu(false)}>
                    <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
                      <View style={[styles.colMenuDropdown, { backgroundColor: isDark ? '#2C2D31' : '#FFFFFF' }]}>
                        {[
                          { key: 'last', label: 'Last' },
                          { key: 'vega', label: 'Vega' },
                          { key: 'theta', label: 'Theta' },
                          { key: 'gamma', label: 'Gamma' },
                        ].map(c => (
                          <TouchableOpacity
                            key={c.key}
                            style={styles.colMenuItem}
                            onPress={() => setMenuCols(prev => ({ ...prev, [c.key]: !prev[c.key] }))}
                          >
                            <View style={{
                              width: 16, height: 16,
                              borderWidth: menuCols[c.key] ? 0 : 1.5,
                              borderColor: themeColors.secondaryText,
                              borderRadius: 4,
                              marginRight: 10,
                              justifyContent: 'center',
                              alignItems: 'center',
                              backgroundColor: menuCols[c.key] ? (colors.primary || '#38B781') : 'transparent'
                            }}>
                              {menuCols[c.key] && (
                                <FastImage source={checkIc} style={{ width: 10, height: 10 }} tintColor={colors.white} resizeMode="contain" />
                              )}
                            </View>
                            <AppText style={{ color: themeColors.text, fontSize: 13 }}>{c.label}</AppText>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </TouchableOpacity>
                  </TouchableOpacity>
                </Modal>
              </View>

              {elementsToRender.map((el, i) => {
                if (el.type === 'header') {
                  return (
                    <View key={`strike-hdr-${i}`} style={[styles.headerColsRow, { height: HEADER_ROW_HEIGHT, justifyContent: 'center', backgroundColor: isDark ? '#1C1D21' : '#F9F9F9' }]}>
                      <View style={{ height: 35, justifyContent: 'center', alignItems: 'center' }}>
                        <AppText style={{ color: themeColors.text, fontSize: 12, fontFamily: fontFamilyMedium }}>{el.date}</AppText>
                      </View>
                    </View>
                  );
                }

                const { row, isRowAboveLine, isRowBelowLine } = el;
                const rowHeight = ROW_HEIGHT + (isRowAboveLine || isRowBelowLine ? 8 : 0);
                const paddingBottom = isRowAboveLine ? 8 : 0;
                const paddingTop = isRowBelowLine ? 8 : 0;
                const borderBottomWidth = isRowAboveLine ? 0 : 1;

                return (
                  <View key={`strike-${i}`} style={[styles.dataCellRow, { height: rowHeight, paddingTop, paddingBottom, borderBottomWidth, justifyContent: 'center', borderBottomColor: themeColors.themeBorderColor || '#F0F0F0' }]}>
                    <View>
                      <AppText style={{ fontFamily: fontFamilyMedium, color: themeColors.text, fontSize: 12, textAlign: 'center' }}>{withCommas(row.strike, 0)}</AppText>
                      <AppText style={{ color: themeColors.secondaryText, fontSize: 9, fontFamily: fontFamilyMedium, textAlign: 'center', marginTop: 2 }}>{formatPct(row.diffPct)}</AppText>
                    </View>
                  </View>
                );
              })}</View>

            {/* Puts Side */}
            <View style={{ flex: 1 }}>
              <Animated.ScrollView
                ref={rightScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                onScroll={handleRightScroll}
                scrollEventThrottle={16}
                onTouchStart={() => { activeScroll.value = 2; }}
              >
                <View>
                  {/* Header */}
                  <View style={[styles.headerColsRow, { height: HEADER_ROW_HEIGHT, width: ACTIVE_PUTS_WIDTH, backgroundColor: isDark ? '#1C1D21' : '#F9F9F9' }]}>
                    {activePutsHeaders.map((h, i) => (
                      <View key={i} style={{ width: h.w, alignItems: h.align, paddingHorizontal: 6 }}>
                        <View style={styles.dashedTextContainer}>
                          <AppText style={{
                            color: themeColors.secondaryText, fontSize: 11,
                            fontFamily: fontFamilyMedium
                          }}>{h.title}</AppText>
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Rows */}
                  {elementsToRender.map((el, i) => {
                    if (el.type === 'header') {
                      return (
                        <View key={`put-hdr-${i}`} style={{ height: 35, justifyContent: 'center', width: ACTIVE_PUTS_WIDTH, paddingLeft: 16, alignItems: 'flex-start', backgroundColor: isDark ? '#1C1D21' : '#F9F9F9', borderBottomWidth: 1, borderTopWidth: 1, borderColor: themeColors.themeBorderColor || '#F0F0F0' }}>
                          <AppText style={{ color: themeColors.text, fontSize: 13, fontFamily: fontFamilyMedium }}>Puts</AppText>
                        </View>
                      );
                    }

                    const { row, isRowAboveLine, isRowBelowLine } = el;
                    const strikePriceNum = row.strike;
                    const isPutITM = strikePriceNum > currentPrice;
                    const itmBg = isDark ? 'rgb(38, 41, 47)' : 'rgba(2, 192, 118, 0.05)';
                    const putBg = isPutITM ? itmBg : 'transparent';

                    const rowHeight = ROW_HEIGHT + (isRowAboveLine || isRowBelowLine ? 8 : 0);
                    const paddingBottom = isRowAboveLine ? 8 : 0;
                    const paddingTop = isRowBelowLine ? 8 : 0;
                    const borderBottomWidth = isRowAboveLine ? 0 : 1;

                    const pRaw = row.putRaw || {};
                    const pLeg = row.put || {};

                    return (
                      <TouchableOpacity 
                        key={`put-${i}`}
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate('OptionsInstrumentTrade', { item: pRaw, currentPrice, selectedAsset, isCall: false })}
                        style={[styles.dataCellRow, { height: rowHeight, paddingTop, paddingBottom, borderBottomWidth, width: ACTIVE_PUTS_WIDTH, borderBottomColor: themeColors.themeBorderColor || '#F0F0F0', backgroundColor: putBg }]}
                      >
                        <View style={{ width: 70, height: ROW_HEIGHT, alignItems: 'center', justifyContent: 'center' }}>
                          <AppText style={{ color: colors.green, fontSize: 12, fontFamily: fontFamilyMedium }}>{formatPrice(pLeg.bidIv, 0)}</AppText>
                        </View>
                        <View style={{ width: 70, height: ROW_HEIGHT, alignItems: 'center', justifyContent: 'center' }}>
                          <AppText style={{ color: colors.red, fontSize: 12, fontFamily: fontFamilyMedium }}>{formatPrice(pLeg.markIv, 1)}</AppText>
                          <AppText style={{ color: themeColors.secondaryText, fontSize: 10, fontFamily: fontFamilyMedium, marginTop: 2 }}>{formatIvPct(pLeg.markIvPct)}</AppText>
                        </View>
                        <View style={{ width: 70, height: ROW_HEIGHT, alignItems: 'center', justifyContent: 'center' }}>
                          <AppText style={{ color: colors.red, fontSize: 12, fontFamily: fontFamilyMedium }}>{formatPrice(pLeg.askIv, 0)}</AppText>
                          <AppText style={{ color: themeColors.secondaryText, fontSize: 10, fontFamily: fontFamilyMedium, marginTop: 2 }}>{formatIvPct(pLeg.askIvPct)}</AppText>
                        </View>
                        <View style={{ width: 60, alignItems: 'center', paddingHorizontal: 6 }}>
                          <AppText style={{ color: themeColors.text, fontSize: 12, fontFamily: fontFamilyMedium }}>{formatVal(pLeg.delta, 4)}</AppText>
                        </View>
                        {cols.gamma && <View style={{ width: 70, alignItems: 'center', paddingHorizontal: 6 }}>
                          <AppText style={{ color: themeColors.text, fontSize: 12, fontFamily: fontFamilyMedium }}>{formatVal(pLeg.gamma, 6)}</AppText>
                        </View>}
                        {cols.theta && <View style={{ width: 70, alignItems: 'center', paddingHorizontal: 6 }}>
                          <AppText style={{ color: themeColors.text, fontSize: 12, fontFamily: fontFamilyMedium }}>{formatVal(pLeg.theta, 4)}</AppText>
                        </View>}
                        {cols.vega && <View style={{ width: 60, alignItems: 'center', paddingHorizontal: 6 }}>
                          <AppText style={{ color: themeColors.text, fontSize: 12, fontFamily: fontFamilyMedium }}>{formatVal(pLeg.vega, 4)}</AppText>
                        </View>}
                        {cols.last && <View style={{ width: 60, alignItems: 'center', paddingHorizontal: 6 }}>
                          <AppText style={{ color: themeColors.text, fontSize: 12, fontFamily: fontFamilyMedium }}>{formatPrice(pLeg.last, 0)}</AppText>
                        </View>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Animated.ScrollView>
            </View>

            {/* Current Price Indicator Overlay */}
            {chainsToRender.length > 0 && currentPrice > 0 && chainsToRender.map((chain, chainIdx) => {
              return (
                <View key={`indicator-${chainIdx}`} pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: chainOffsets[chainIdx]?.indicatorTop || 0, alignItems: 'center', zIndex: 99999, elevation: 99999 }}>
                  <View style={{ position: 'absolute', left: 0, right: 0, height: 1.5, backgroundColor: isDark ? '#FFF' : '#222', top: -0.75 }} />
                  <View style={{ backgroundColor: isDark ? '#FFF' : '#000', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, top: -13, zIndex: 99999, elevation: 99999 }}>
                    <AppText numberOfLines={1} style={{ color: isDark ? '#000' : '#FFF', fontSize: 12, fontFamily: fontFamilyMedium }}>{formatVal(currentPrice, 2)}</AppText>
                  </View>
                </View>
              );
            })}

          </View>
          <View style={{ height: 50 }}></View>
        </ScrollView>
      )}
    </View>
  );
};

export default OptionsChainTable;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeaderRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 5,
  },
  subHeaderColsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  headerColsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  dataCellRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  subHeaderStaticRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  dashedTextContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#A0A0A0',
    borderStyle: 'dashed',
  },
  divider: {
    height: 1,
    width: '100%',
  },
  currentPriceIndicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentPriceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 11,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 240,
  },
  colMenuDropdown: {
    width: 130,
    borderRadius: 8,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  colMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  }
});

