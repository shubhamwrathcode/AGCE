import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { AppText } from '../../../common';
import { useTheme } from '../../../hooks/useTheme';
import { BOLD, fontFamilyMedium, fontFamilySemiBold, MEDIUM, REGULAR, SEMI_BOLD } from '../../../theme/typography';
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

const STRIKES = [
  { price: '73,500', pct: '-5.13%' },
  { price: '74,000', pct: '-4.48%' },
  { price: '74,500', pct: '-3.84%' },
  { price: '75,000', pct: '-3.19%' },
  { price: '75,500', pct: '-2.55%' },
  { price: '76,000', pct: '-1.90%' },
  { price: '76,500', pct: '-1.26%' },
  { price: '77,000', pct: '-0.61%' },
  { price: '77,500', pct: '+0.03%' },
  { price: '78,000', pct: '+0.68%' },
];

const ROW_HEIGHT = 56;
const HEADER_ROW_HEIGHT = 35;

const OptionsChainTable = ({ selectedExpiry }) => {
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

  const CURRENT_PRICE = 75500;
  let activeLineIdx = STRIKES.findIndex(s => parseFloat(s.price.replace(',', '')) > CURRENT_PRICE);
  if (activeLineIdx === -1) activeLineIdx = STRIKES.length;

  return (
    <View style={styles.container}>
      {/* Top Header Row (Static) */}
      <View style={styles.topHeaderRow}>
        <AppText style={{ color: themeColors.text, fontSize: 14, flex: 1, fontFamily: fontFamilyMedium }}>Calls</AppText>
        <AppText style={{ color: themeColors.text, fontSize: 14, flex: 1, textAlign: 'center', fontFamily: fontFamilyMedium }}>2026-05-21</AppText>
        <AppText style={{ color: themeColors.text, fontSize: 14, flex: 1, textAlign: 'right', fontFamily: fontFamilyMedium }}>Puts</AppText>
      </View>

      <View style={styles.subHeaderStaticRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.dashedTextContainer}>
            <AppText style={{ color: themeColors.secondaryText, fontSize: 12 }}>Underlying:</AppText>
          </View>
          <AppText style={{ color: themeColors.secondaryText, fontSize: 12 }}> 75,500.0</AppText>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.dashedTextContainer}>
            <AppText style={{ color: themeColors.secondaryText, fontSize: 12 }}>Expires in:</AppText>
          </View>
          <AppText style={{ color: themeColors.secondaryText, fontSize: 12 }}> 1h 3m</AppText>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.dashedTextContainer}>
            <AppText style={{ color: themeColors.secondaryText, fontSize: 12 }}>ATM Vol:</AppText>
          </View>
          <AppText style={{ color: themeColors.secondaryText, fontSize: 12 }}> 32.08%</AppText>
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
                {STRIKES.map((item, idx) => {
                  const strikePriceNum = parseFloat(item.price.replace(',', ''));
                  const isCallITM = strikePriceNum < CURRENT_PRICE;
                  const callBg = isCallITM ? (isDark ? 'rgba(56, 183, 129, 0.15)' : '#F2FFF6') : 'transparent';

                  const isRowAboveLine = idx === activeLineIdx - 1;
                  const isRowBelowLine = idx === activeLineIdx;
                  const rowHeight = ROW_HEIGHT + (isRowAboveLine || isRowBelowLine ? 8 : 0);
                  const paddingBottom = isRowAboveLine ? 8 : 0;
                  const paddingTop = isRowBelowLine ? 8 : 0;
                  const borderBottomWidth = isRowAboveLine ? 0 : 1;

                  return (
                    <View key={`call-${idx}`} style={[styles.dataCellRow, { height: rowHeight, paddingTop, paddingBottom, borderBottomWidth, width: CALLS_WIDTH, borderBottomColor: themeColors.themeBorderColor || '#F0F0F0', backgroundColor: callBg }]}>
                      <View style={{ width: 60, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>--</AppText>
                      </View>
                      <View style={{ width: 70, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>59.65X</AppText>
                      </View>
                      <View style={{ width: 70, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>1.87</AppText>
                      </View>
                      <View style={{ width: 60, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>0.00</AppText>
                      </View>
                      <View style={{ width: 60, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>3.586</AppText>
                      </View>
                      <View style={{ width: 70, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>-196.81</AppText>
                      </View>
                      <View style={{ width: 70, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>0.00061</AppText>
                      </View>
                      <View style={{ width: 60, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>0.447</AppText>
                      </View>
                      <View style={{ width: 70, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>805.7</AppText>
                      </View>
                      <View style={{ width: 80, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>11.71%</AppText>
                      </View>
                      <View style={{ width: 80, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>9.74%</AppText>
                      </View>
                      <View style={{ width: 70, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>1,413</AppText>
                      </View>
                      <View style={{ width: 80, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>2,137</AppText>
                      </View>
                      <View style={{ width: 70, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>4,942.6</AppText>
                      </View>
                      <View style={{ width: 70, height: ROW_HEIGHT, alignItems: 'center', justifyContent: 'center' }}>
                        <AppText style={{ color: colors.red, fontSize: 13, fontFamily: fontFamilyMedium }}>2,393</AppText>
                        <AppText style={{ color: themeColors.secondaryText, fontSize: 10, fontFamily: fontFamilyMedium, marginTop: 2 }}>61.70%</AppText>
                      </View>
                      <View style={{ width: 70, height: ROW_HEIGHT, alignItems: 'center', justifyContent: 'center' }}>
                        <AppText style={{ color: colors.green, fontSize: 13, fontFamily: fontFamilyMedium }}>2,212</AppText>
                        <AppText style={{ color: themeColors.secondaryText, fontSize: 10, fontFamily: fontFamilyMedium, marginTop: 2 }}>37.05%</AppText>
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

            {STRIKES.map((item, idx) => {
              const isRowAboveLine = idx === activeLineIdx - 1;
              const isRowBelowLine = idx === activeLineIdx;
              const rowHeight = ROW_HEIGHT + (isRowAboveLine || isRowBelowLine ? 8 : 0);
              const paddingBottom = isRowAboveLine ? 8 : 0;
              const paddingTop = isRowBelowLine ? 8 : 0;
              const borderBottomWidth = isRowAboveLine ? 0 : 1;

              return (
                <View key={`strike-${idx}`} style={[styles.dataCellRow, { height: rowHeight, paddingTop, paddingBottom, borderBottomWidth, justifyContent: 'center', borderBottomColor: themeColors.themeBorderColor || '#F0F0F0' }]}>
                  <View>
                    <AppText style={{ fontFamily: fontFamilyMedium, color: themeColors.text, fontSize: 12, textAlign: 'center' }}>{item.price}</AppText>
                    <AppText style={{ color: themeColors.secondaryText, fontSize: 9, fontFamily: fontFamilyMedium, textAlign: 'center', marginTop: 2 }}>{item.pct}</AppText>
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
                {STRIKES.map((item, idx) => {
                  const strikePriceNum = parseFloat(item.price.replace(',', ''));
                  const isPutITM = strikePriceNum > CURRENT_PRICE;
                  const putBg = isPutITM ? (isDark ? 'rgba(235, 78, 92, 0.15)' : '#FFF2F2') : 'transparent';

                  const isRowAboveLine = idx === activeLineIdx - 1;
                  const isRowBelowLine = idx === activeLineIdx;
                  const rowHeight = ROW_HEIGHT + (isRowAboveLine || isRowBelowLine ? 8 : 0);
                  const paddingBottom = isRowAboveLine ? 8 : 0;
                  const paddingTop = isRowBelowLine ? 8 : 0;
                  const borderBottomWidth = isRowAboveLine ? 0 : 1;

                  return (
                    <View key={`put-${idx}`} style={[styles.dataCellRow, { height: rowHeight, paddingTop, paddingBottom, borderBottomWidth, width: PUTS_WIDTH, borderBottomColor: themeColors.themeBorderColor || '#F0F0F0', backgroundColor: putBg }]}>
                      <View style={{ width: 70, height: ROW_HEIGHT, alignItems: 'center', justifyContent: 'center' }}>
                        <AppText style={{ color: colors.green, fontSize: 13, fontFamily: fontFamilyMedium }}>32</AppText>
                        <AppText style={{ color: themeColors.secondaryText, fontSize: 10, fontFamily: fontFamilyMedium, marginTop: 2 }}>37.41%</AppText>
                      </View>
                      <View style={{ width: 70, height: ROW_HEIGHT, alignItems: 'center', justifyContent: 'center' }}>
                        <AppText style={{ color: colors.red, fontSize: 13, fontFamily: fontFamilyMedium }}>51</AppText>
                        <AppText style={{ color: themeColors.secondaryText, fontSize: 10, fontFamily: fontFamilyMedium, marginTop: 2 }}>40.73%</AppText>
                      </View>
                      <View style={{ width: 70, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>4,942.6</AppText>
                      </View>
                      <View style={{ width: 80, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>2,137</AppText>
                      </View>
                      <View style={{ width: 70, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>1,413</AppText>
                      </View>
                      <View style={{ width: 80, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>9.74%</AppText>
                      </View>
                      <View style={{ width: 80, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>11.71%</AppText>
                      </View>
                      <View style={{ width: 70, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>805.7</AppText>
                      </View>
                      <View style={{ width: 60, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>0.447</AppText>
                      </View>
                      <View style={{ width: 70, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>0.00061</AppText>
                      </View>
                      <View style={{ width: 70, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>-196.81</AppText>
                      </View>
                      <View style={{ width: 60, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>3.586</AppText>
                      </View>
                      <View style={{ width: 60, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>0.00</AppText>
                      </View>
                      <View style={{ width: 70, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>1.87</AppText>
                      </View>
                      <View style={{ width: 70, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>59.65X</AppText>
                      </View>
                      <View style={{ width: 60, alignItems: 'center', paddingHorizontal: 6 }}>
                        <AppText style={{ color: themeColors.text, fontSize: 11, fontFamily: fontFamilyMedium }}>--</AppText>
                      </View>
                    </View>
                  )
                })}
              </View>
            </ScrollView>
          </View>

          {/* Current Price Indicator Overlay */}
          <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: HEADER_ROW_HEIGHT + (activeLineIdx * ROW_HEIGHT) + 8, alignItems: 'center', zIndex: 10 }}>
            {/* The horizontal line */}
            <View style={{ position: 'absolute', left: 0, right: 0, height: 1.5, backgroundColor: isDark ? '#FFF' : '#222', top: -0.75 }} />
            {/* The badge */}
            <View style={{ backgroundColor: isDark ? '#FFF' : '#000', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, top: -13 }}>
              <AppText numberOfLines={1} style={{ color: isDark ? '#000' : '#FFF', fontSize: 12, fontFamily: fontFamilyMedium }}>75,500.0</AppText>
            </View>
          </View>

        </View>
        <View style=
          {{ height: 50 }}></View>
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
