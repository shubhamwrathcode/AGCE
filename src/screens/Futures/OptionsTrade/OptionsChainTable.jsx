import React, { useRef, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { AppText } from '../../../common';
import { useTheme } from '../../../hooks/useTheme';
import { fontFamilyMedium, SEMI_BOLD } from '../../../theme/typography';
import { colors } from '../../../theme/colors';

const CALLS_HEADERS = [
  { title: 'Last', w: 60, align: 'center' },
  { title: 'Leverage', w: 70, align: 'center' },
  { title: '24h Vol', w: 70, align: 'center' },
  { title: 'OI', w: 60, align: 'center' },
  { title: 'Vega', w: 60, align: 'center' },
  { title: 'Theta', w: 70, align: 'center' },
  { title: 'Gamma', w: 70, align: 'center' },
  { title: 'Delta', w: 60, align: 'center' },
  { title: 'Ask Size', w: 70, align: 'center' },
  { title: 'APR(Ask)', w: 80, align: 'center' },
  { title: 'APR(Bid)', w: 80, align: 'center' },
  { title: 'Bid Size', w: 70, align: 'center' },
  { title: 'Positions', w: 80, align: 'center' },
  { title: 'Mark/IV', w: 70, align: 'center' },
  { title: 'Ask/IV', w: 70, align: 'center' },
  { title: 'Bid/IV', w: 70, align: 'center' },
];

const PUTS_HEADERS = [
  { title: 'Bid/IV', w: 70, align: 'center' },
  { title: 'Ask/IV', w: 70, align: 'center' },
  { title: 'Mark/IV', w: 70, align: 'center' },
  { title: 'Positions', w: 80, align: 'center' },
  { title: 'Bid Size', w: 70, align: 'center' },
  { title: 'APR(Bid)', w: 80, align: 'center' },
  { title: 'APR(Ask)', w: 80, align: 'center' },
  { title: 'Ask Size', w: 70, align: 'center' },
  { title: 'Delta', w: 60, align: 'center' },
  { title: 'Gamma', w: 70, align: 'center' },
  { title: 'Theta', w: 70, align: 'center' },
  { title: 'Vega', w: 60, align: 'center' },
  { title: 'OI', w: 60, align: 'center' },
  { title: '24h Vol', w: 70, align: 'center' },
  { title: 'Leverage', w: 70, align: 'center' },
  { title: 'Last', w: 60, align: 'center' },
];

const CALLS_WIDTH = CALLS_HEADERS.reduce((a, b) => a + b.w, 0);
const PUTS_WIDTH = PUTS_HEADERS.reduce((a, b) => a + b.w, 0);

const ROW_HEIGHT = 56;
const HEADER_ROW_HEIGHT = 35;

function formatVal(v, precision = 2) {
  if (v === null || v === undefined) return '--';
  return Number(v).toFixed(precision);
}

function formatPct(v) {
  if (v === null || v === undefined) return '--';
  return Number(v).toFixed(2) + '%';
}

const OptionsChainTable = ({ selectedExpiry, chains = [], currentPrice = 0, selectedAsset = '' }) => {
  const { colors: themeColors, isDark } = useTheme();

  const leftScrollRef = useRef(null);
  const rightScrollRef = useRef(null);
  const isSyncingLeft = useRef(false);
  const isSyncingRight = useRef(false);

  useEffect(() => {
    setTimeout(() => {
      leftScrollRef.current?.scrollToEnd({ animated: false });
    }, 100);
  }, []);

  const handleLeftScroll = (e) => {
    if (isSyncingRight.current) return;
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const max = contentSize.width - layoutMeasurement.width;
    if (max <= 0) return;
    isSyncingLeft.current = true;
    rightScrollRef.current?.scrollTo({ x: max - contentOffset.x, animated: false });
    setTimeout(() => { isSyncingLeft.current = false; }, 50);
  };

  const handleRightScroll = (e) => {
    if (isSyncingLeft.current) return;
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const max = contentSize.width - layoutMeasurement.width;
    if (max <= 0) return;
    isSyncingRight.current = true;
    leftScrollRef.current?.scrollTo({ x: max - contentOffset.x, animated: false });
    setTimeout(() => { isSyncingRight.current = false; }, 50);
  };

  const rowsToRender = useMemo(() => {
    let targetChain = chains?.find(c => c.date === selectedExpiry);
    if (!targetChain && chains?.length > 0) {
      if (selectedExpiry === 'ALL') {
        const mergedMap = new Map();
        chains.forEach(chain => {
          chain.data.forEach(row => {
             if (!mergedMap.has(row.strike)) {
               mergedMap.set(row.strike, { ...row });
             }
          });
        });
        return Array.from(mergedMap.values()).sort((a,b) => a.strike - b.strike);
      } else {
        targetChain = chains[0];
      }
    }
    return targetChain?.data || [];
  }, [chains, selectedExpiry]);

  let activeLineIdx = rowsToRender.findIndex(s => s.strike > currentPrice);
  if (activeLineIdx === -1) activeLineIdx = rowsToRender.length;

  return (
    <View style={styles.container}>
      {/* Top Header Row (Static) */}
      <View style={styles.topHeaderRow}>
        <AppText style={{ color: themeColors.text, fontSize: 14, flex: 1, fontFamily: fontFamilyMedium }}>Calls</AppText>
        <AppText style={{ color: themeColors.text, fontSize: 14, flex: 1, textAlign: 'center', fontFamily: fontFamilyMedium }}>{selectedExpiry === 'ALL' ? 'All Expiries' : selectedExpiry}</AppText>
        <AppText style={{ color: themeColors.text, fontSize: 14, flex: 1, textAlign: 'right', fontFamily: fontFamilyMedium }}>Puts</AppText>
      </View>

      <View style={styles.subHeaderStaticRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.dashedTextContainer}>
            <AppText style={{ color: themeColors.secondaryText, fontSize: 12 }}>Underlying:</AppText>
          </View>
          <AppText style={{ color: themeColors.secondaryText, fontSize: 12 }}> {currentPrice > 0 ? formatVal(currentPrice, 2) : '...'}</AppText>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.dashedTextContainer}>
            <AppText style={{ color: themeColors.secondaryText, fontSize: 12 }}>Expires in:</AppText>
          </View>
          <AppText style={{ color: themeColors.secondaryText, fontSize: 12 }}> --</AppText>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.dashedTextContainer}>
            <AppText style={{ color: themeColors.secondaryText, fontSize: 12 }}>ATM Vol:</AppText>
          </View>
          <AppText style={{ color: themeColors.secondaryText, fontSize: 12 }}> --</AppText>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: themeColors.themeBorderColor || '#EAEAEA' }]} />

      {/* Scrollable Table Area */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        <View style={{ flexDirection: 'row' }}>

          {/* Calls Side */}
          <View style={{ flex: 1 }}>
            <ScrollView
              ref={leftScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              onScroll={handleLeftScroll}
              scrollEventThrottle={16}
            >
              <View>
                {/* Header */}
                <View style={[styles.headerColsRow, { height: HEADER_ROW_HEIGHT, width: CALLS_WIDTH, backgroundColor: isDark ? '#1C1D21' : '#F9F9F9' }]}>
                  {CALLS_HEADERS.map((h, i) => (
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
                {rowsToRender.map((row, idx) => {
                  const strikePriceNum = row.strike;
                  const isCallITM = strikePriceNum < currentPrice;
                  const callBg = isCallITM ? (isDark ? 'rgba(56, 183, 129, 0.15)' : '#F2FFF6') : 'transparent';

                  const isRowAboveLine = idx === activeLineIdx - 1;
                  const isRowBelowLine = idx === activeLineIdx;
                  const rowHeight = ROW_HEIGHT + (isRowAboveLine || isRowBelowLine ? 8 : 0);
                  const paddingBottom = isRowAboveLine ? 8 : 0;
                  const paddingTop = isRowBelowLine ? 8 : 0;
                  const borderBottomWidth = isRowAboveLine ? 0 : 1;

                  const cRaw = row.callRaw || {};
                  const cLeg = row.call || {};

                  return (
                    <View key={`call-${idx}`} style={[styles.dataCellRow, { height: rowHeight, paddingTop, paddingBottom, borderBottomWidth, width: CALLS_WIDTH, borderBottomColor: themeColors.themeBorderColor || '#F0F0F0', backgroundColor: callBg }]}>
                      <View style={{ width: 60, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>{formatVal(cLeg.last)}</AppText>
                      </View>
                      <View style={{ width: 70, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>{cRaw.leverage ? `${cRaw.leverage}X` : '--'}</AppText>
                      </View>
                      <View style={{ width: 70, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>{formatVal(cLeg.vol, 0)}</AppText>
                      </View>
                      <View style={{ width: 60, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>{formatVal(cLeg.oi, 0)}</AppText>
                      </View>
                      <View style={{ width: 60, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>{formatVal(cLeg.vega, 4)}</AppText>
                      </View>
                      <View style={{ width: 70, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>{formatVal(cLeg.theta, 4)}</AppText>
                      </View>
                      <View style={{ width: 70, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>{formatVal(cLeg.gamma, 5)}</AppText>
                      </View>
                      <View style={{ width: 60, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>{formatVal(cLeg.delta, 3)}</AppText>
                      </View>
                      <View style={{ width: 70, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>{formatVal(cLeg.askSize, 1)}</AppText>
                      </View>
                      <View style={{ width: 80, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>{cLeg.apr ? formatPct(cLeg.apr) : '--'}</AppText>
                      </View>
                      <View style={{ width: 80, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>{cLeg.apr ? formatPct(cLeg.apr) : '--'}</AppText>
                      </View>
                      <View style={{ width: 70, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>{formatVal(cLeg.bidSize, 1)}</AppText>
                      </View>
                      <View style={{ width: 80, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>{formatVal(cLeg.positions, 0)}</AppText>
                      </View>
                      <View style={{ width: 70, height: ROW_HEIGHT, alignItems: 'center', justifyContent: 'center' }}>
                        <AppText style={{ color: cLeg.markIvPct ? colors.green : themeColors.text, fontSize: 13, fontFamily: fontFamilyMedium }}>{formatVal(cRaw.mark_price)}</AppText>
                        <AppText style={{ color: themeColors.secondaryText, fontSize: 10, fontFamily: fontFamilyMedium, marginTop: 2 }}>{formatPct(cLeg.markIvPct)}</AppText>
                      </View>
                      <View style={{ width: 70, height: ROW_HEIGHT, alignItems: 'center', justifyContent: 'center' }}>
                        <AppText style={{ color: colors.red, fontSize: 13, fontFamily: fontFamilyMedium }}>{formatVal(cRaw.ask_price)}</AppText>
                        <AppText style={{ color: themeColors.secondaryText, fontSize: 10, fontFamily: fontFamilyMedium, marginTop: 2 }}>{formatPct(cLeg.askIvPct)}</AppText>
                      </View>
                      <View style={{ width: 70, height: ROW_HEIGHT, alignItems: 'center', justifyContent: 'center' }}>
                        <AppText style={{ color: colors.green, fontSize: 13, fontFamily: fontFamilyMedium }}>{formatVal(cRaw.bid_price)}</AppText>
                        <AppText style={{ color: themeColors.secondaryText, fontSize: 10, fontFamily: fontFamilyMedium, marginTop: 2 }}>{formatPct(cLeg.bidIvPct || cLeg.markIvPct)}</AppText>
                      </View>
                    </View>
                  )
                })}
              </View>
            </ScrollView>
          </View>

          {/* Center Strike */}
          <View style={{ width: 80, backgroundColor: isDark ? '#1C1D21' : '#F9F9F9', zIndex: 2 }}>

            <View style={[styles.headerColsRow, { height: HEADER_ROW_HEIGHT, justifyContent: 'center' }]}>
              <View style={styles.dashedTextContainer}>
                <AppText weight={SEMI_BOLD} style={{ color: themeColors.secondaryText, fontSize: 11, textAlign: 'center' }}>Strike</AppText>
              </View>
            </View>

            {rowsToRender.map((row, idx) => {
              const isRowAboveLine = idx === activeLineIdx - 1;
              const isRowBelowLine = idx === activeLineIdx;
              const rowHeight = ROW_HEIGHT + (isRowAboveLine || isRowBelowLine ? 8 : 0);
              const paddingBottom = isRowAboveLine ? 8 : 0;
              const paddingTop = isRowBelowLine ? 8 : 0;
              const borderBottomWidth = isRowAboveLine ? 0 : 1;

              return (
                <View key={`strike-${idx}`} style={[styles.dataCellRow, { height: rowHeight, paddingTop, paddingBottom, borderBottomWidth, justifyContent: 'center', borderBottomColor: themeColors.themeBorderColor || '#F0F0F0' }]}>
                  <View>
                    <AppText style={{ fontFamily: fontFamilyMedium, color: themeColors.text, fontSize: 12, textAlign: 'center' }}>{row.strike}</AppText>
                    <AppText style={{ color: themeColors.secondaryText, fontSize: 9, fontFamily: fontFamilyMedium, textAlign: 'center', marginTop: 2 }}>{formatPct(row.diffPct)}</AppText>
                  </View>
                </View>
              )
            })}
          </View>

          {/* Puts Side */}
          <View style={{ flex: 1 }}>
            <ScrollView
              ref={rightScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              onScroll={handleRightScroll}
              scrollEventThrottle={16}
            >
              <View>
                {/* Header */}
                <View style={[styles.headerColsRow, { height: HEADER_ROW_HEIGHT, width: PUTS_WIDTH, backgroundColor: isDark ? '#1C1D21' : '#F9F9F9' }]}>
                  {PUTS_HEADERS.map((h, i) => (
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
                {rowsToRender.map((row, idx) => {
                  const strikePriceNum = row.strike;
                  const isPutITM = strikePriceNum > currentPrice;
                  const putBg = isPutITM ? (isDark ? 'rgba(235, 78, 92, 0.15)' : '#FFF2F2') : 'transparent';

                  const isRowAboveLine = idx === activeLineIdx - 1;
                  const isRowBelowLine = idx === activeLineIdx;
                  const rowHeight = ROW_HEIGHT + (isRowAboveLine || isRowBelowLine ? 8 : 0);
                  const paddingBottom = isRowAboveLine ? 8 : 0;
                  const paddingTop = isRowBelowLine ? 8 : 0;
                  const borderBottomWidth = isRowAboveLine ? 0 : 1;

                  const pRaw = row.putRaw || {};
                  const pLeg = row.put || {};

                  return (
                    <View key={`put-${idx}`} style={[styles.dataCellRow, { height: rowHeight, paddingTop, paddingBottom, borderBottomWidth, width: PUTS_WIDTH, borderBottomColor: themeColors.themeBorderColor || '#F0F0F0', backgroundColor: putBg }]}>
                      <View style={{ width: 70, height: ROW_HEIGHT, alignItems: 'center', justifyContent: 'center' }}>
                        <AppText style={{ color: colors.green, fontSize: 13, fontFamily: fontFamilyMedium }}>{formatVal(pRaw.bid_price)}</AppText>
                        <AppText style={{ color: themeColors.secondaryText, fontSize: 10, fontFamily: fontFamilyMedium, marginTop: 2 }}>{formatPct(pLeg.bidIvPct || pLeg.markIvPct)}</AppText>
                      </View>
                      <View style={{ width: 70, height: ROW_HEIGHT, alignItems: 'center', justifyContent: 'center' }}>
                        <AppText style={{ color: colors.red, fontSize: 13, fontFamily: fontFamilyMedium }}>{formatVal(pRaw.ask_price)}</AppText>
                        <AppText style={{ color: themeColors.secondaryText, fontSize: 10, fontFamily: fontFamilyMedium, marginTop: 2 }}>{formatPct(pLeg.askIvPct)}</AppText>
                      </View>
                      <View style={{ width: 70, height: ROW_HEIGHT, alignItems: 'center', justifyContent: 'center' }}>
                        <AppText style={{ color: pLeg.markIvPct ? colors.green : themeColors.text, fontSize: 13, fontFamily: fontFamilyMedium }}>{formatVal(pRaw.mark_price)}</AppText>
                        <AppText style={{ color: themeColors.secondaryText, fontSize: 10, fontFamily: fontFamilyMedium, marginTop: 2 }}>{formatPct(pLeg.markIvPct)}</AppText>
                      </View>
                      <View style={{ width: 80, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>{formatVal(pLeg.positions, 0)}</AppText>
                      </View>
                      <View style={{ width: 70, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>{formatVal(pLeg.bidSize, 1)}</AppText>
                      </View>
                      <View style={{ width: 80, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>{pLeg.apr ? formatPct(pLeg.apr) : '--'}</AppText>
                      </View>
                      <View style={{ width: 80, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>{pLeg.apr ? formatPct(pLeg.apr) : '--'}</AppText>
                      </View>
                      <View style={{ width: 70, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>{formatVal(pLeg.askSize, 1)}</AppText>
                      </View>
                      <View style={{ width: 60, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>{formatVal(pLeg.delta, 3)}</AppText>
                      </View>
                      <View style={{ width: 70, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>{formatVal(pLeg.gamma, 5)}</AppText>
                      </View>
                      <View style={{ width: 70, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>{formatVal(pLeg.theta, 4)}</AppText>
                      </View>
                      <View style={{ width: 60, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>{formatVal(pLeg.vega, 4)}</AppText>
                      </View>
                      <View style={{ width: 60, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>{formatVal(pLeg.oi, 0)}</AppText>
                      </View>
                      <View style={{ width: 70, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>{formatVal(pLeg.vol, 0)}</AppText>
                      </View>
                      <View style={{ width: 70, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>{pRaw.leverage ? `${pRaw.leverage}X` : '--'}</AppText>
                      </View>
                      <View style={{ width: 60, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>{formatVal(pLeg.last)}</AppText>
                      </View>
                    </View>
                  )
                })}
              </View>
            </ScrollView>
          </View>

          {/* Current Price Indicator Overlay */}
          {rowsToRender.length > 0 && currentPrice > 0 && (
            <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: HEADER_ROW_HEIGHT + (activeLineIdx * ROW_HEIGHT) + 8, alignItems: 'center', zIndex: 10 }}>
              <View style={{ position: 'absolute', left: 0, right: 0, height: 1.5, backgroundColor: isDark ? '#FFF' : '#222', top: -0.75 }} />
              <View style={{ backgroundColor: isDark ? '#FFF' : '#000', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, top: -13 }}>
                <AppText numberOfLines={1} style={{ color: isDark ? '#000' : '#FFF', fontSize: 12, fontFamily: fontFamilyMedium }}>{formatVal(currentPrice, 2)}</AppText>
              </View>
            </View>
          )}

        </View>
        <View style={{ height: 50 }}></View>
      </ScrollView>
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
  }
});
