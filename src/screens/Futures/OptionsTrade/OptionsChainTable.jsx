import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { AppText } from '../../../common';
import { useTheme } from '../../../hooks/useTheme';
import { BOLD, MEDIUM, REGULAR, SEMI_BOLD } from '../../../theme/typography';
import { colors } from '../../../theme/colors';

const CALLS_HEADERS = [
  { title: 'Last', w: 60, align: 'flex-start' },
  { title: 'Leverage', w: 70, align: 'flex-end' },
  { title: '24h Vol', w: 70, align: 'flex-end' },
  { title: 'OI', w: 60, align: 'flex-end' },
  { title: 'Vega', w: 60, align: 'flex-end' },
  { title: 'Theta', w: 70, align: 'flex-end' },
  { title: 'Gamma', w: 70, align: 'flex-end' },
  { title: 'Delta', w: 60, align: 'flex-end' },
  { title: 'Ask Size', w: 70, align: 'flex-end' },
  { title: 'APR(Ask)', w: 80, align: 'flex-end' },
  { title: 'APR(Bid)', w: 80, align: 'flex-end' },
  { title: 'Bid Size', w: 70, align: 'flex-end' },
  { title: 'Positions', w: 80, align: 'flex-end' },
  { title: 'Mark/IV', w: 70, align: 'flex-end' },
  { title: 'Ask/IV', w: 70, align: 'flex-end' },
  { title: 'Bid/IV', w: 70, align: 'flex-end' },
];

const PUTS_HEADERS = [
  { title: 'Bid/IV', w: 70, align: 'flex-start' },
  { title: 'Ask/IV', w: 70, align: 'flex-start' },
  { title: 'Mark/IV', w: 70, align: 'flex-start' },
  { title: 'Positions', w: 80, align: 'flex-start' },
  { title: 'Bid Size', w: 70, align: 'flex-start' },
  { title: 'APR(Bid)', w: 80, align: 'flex-start' },
  { title: 'APR(Ask)', w: 80, align: 'flex-start' },
  { title: 'Ask Size', w: 70, align: 'flex-start' },
  { title: 'Delta', w: 60, align: 'flex-start' },
  { title: 'Gamma', w: 70, align: 'flex-start' },
  { title: 'Theta', w: 70, align: 'flex-start' },
  { title: 'Vega', w: 60, align: 'flex-start' },
  { title: 'OI', w: 60, align: 'flex-start' },
  { title: '24h Vol', w: 70, align: 'flex-start' },
  { title: 'Leverage', w: 70, align: 'flex-start' },
  { title: 'Last', w: 60, align: 'flex-start' },
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
const HEADER_ROW_HEIGHT = 50;

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

  return (
    <View style={styles.container}>
      {/* Top Header Row (Static) */}
      <View style={styles.topHeaderRow}>
        <AppText weight={BOLD} style={{ color: themeColors.text, fontSize: 13, flex: 1 }}>Calls</AppText>
        <AppText weight={BOLD} style={{ color: themeColors.text, fontSize: 13, flex: 1, textAlign: 'center' }}>2026-05-21</AppText>
        <AppText weight={BOLD} style={{ color: themeColors.text, fontSize: 13, flex: 1, textAlign: 'right' }}>Puts</AppText>
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
                {/* Desktop-like Sub-Header */}
                <View style={[styles.subHeaderColsRow, { height: 30, width: CALLS_WIDTH, justifyContent: 'flex-end', paddingRight: 6 }]}>
                  <AppText style={{ color: themeColors.secondaryText, fontSize: 10 }}>Underlying Forward: 77,474.3  |  ATM Vol: 31.12%</AppText>
                </View>

                {/* Header */}
                <View style={[styles.headerColsRow, { height: HEADER_ROW_HEIGHT, width: CALLS_WIDTH }]}>
                  {CALLS_HEADERS.map((h, i) => (
                    <View key={i} style={{ width: h.w, alignItems: h.align, paddingHorizontal: 6 }}>
                      <AppText weight={SEMI_BOLD} style={{ color: themeColors.text, fontSize: 11 }}>{h.title}</AppText>
                    </View>
                  ))}
                </View>
                
                {/* Rows */}
                {STRIKES.map((item, idx) => (
                  <View key={`call-${idx}`} style={[styles.dataCellRow, { height: ROW_HEIGHT, width: CALLS_WIDTH, borderBottomColor: themeColors.themeBorderColor || '#F0F0F0' }]}>
                    <View style={{ width: 60, alignItems: 'flex-start', paddingHorizontal: 6 }}>
                      <AppText style={{ color: themeColors.text, fontSize: 12 }}>--</AppText>
                    </View>
                    <View style={{ width: 70, alignItems: 'flex-end', paddingHorizontal: 6 }}>
                      <AppText style={{ color: themeColors.text, fontSize: 12 }}>59.65X</AppText>
                    </View>
                    <View style={{ width: 70, alignItems: 'flex-end', paddingHorizontal: 6 }}>
                      <AppText style={{ color: themeColors.text, fontSize: 12 }}>1.87</AppText>
                    </View>
                    <View style={{ width: 60, alignItems: 'flex-end', paddingHorizontal: 6 }}>
                      <AppText style={{ color: themeColors.text, fontSize: 12 }}>0.00</AppText>
                    </View>
                    <View style={{ width: 60, alignItems: 'flex-end', paddingHorizontal: 6 }}>
                      <AppText style={{ color: themeColors.text, fontSize: 12 }}>3.586</AppText>
                    </View>
                    <View style={{ width: 70, alignItems: 'flex-end', paddingHorizontal: 6 }}>
                      <AppText style={{ color: themeColors.text, fontSize: 12 }}>-196.81</AppText>
                    </View>
                    <View style={{ width: 70, alignItems: 'flex-end', paddingHorizontal: 6 }}>
                      <AppText style={{ color: themeColors.text, fontSize: 12 }}>0.00061</AppText>
                    </View>
                    <View style={{ width: 60, alignItems: 'flex-end', paddingHorizontal: 6 }}>
                      <AppText style={{ color: themeColors.text, fontSize: 12 }}>0.447</AppText>
                    </View>
                    <View style={{ width: 70, alignItems: 'flex-end', paddingHorizontal: 6 }}>
                      <AppText style={{ color: themeColors.text, fontSize: 12 }}>805.7</AppText>
                    </View>
                    <View style={{ width: 80, alignItems: 'flex-end', paddingHorizontal: 6 }}>
                      <AppText style={{ color: themeColors.text, fontSize: 12 }}>11.71%</AppText>
                    </View>
                    <View style={{ width: 80, alignItems: 'flex-end', paddingHorizontal: 6 }}>
                      <AppText style={{ color: themeColors.text, fontSize: 12 }}>9.74%</AppText>
                    </View>
                    <View style={{ width: 70, alignItems: 'flex-end', paddingHorizontal: 6 }}>
                      <AppText style={{ color: themeColors.text, fontSize: 12 }}>1,413</AppText>
                    </View>
                    <View style={{ width: 80, alignItems: 'flex-end', paddingHorizontal: 6 }}>
                      <AppText style={{ color: themeColors.text, fontSize: 12 }}>2,137</AppText>
                    </View>
                    <View style={{ width: 70, alignItems: 'flex-end', paddingHorizontal: 6 }}>
                      <AppText style={{ color: themeColors.text, fontSize: 12 }}>4,942.6</AppText>
                    </View>
                    <View style={{ width: 70, alignItems: 'flex-end', paddingHorizontal: 6 }}>
                      <AppText weight={SEMI_BOLD} style={{ color: colors.red, fontSize: 12 }}>4,945.0</AppText>
                    </View>
                    <View style={{ width: 70, alignItems: 'flex-end', paddingHorizontal: 6 }}>
                      <AppText weight={SEMI_BOLD} style={{ color: colors.green, fontSize: 12 }}>4,940.2</AppText>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Center Strike */}
          <View style={{ width: 80, backgroundColor: isDark ? '#1C1D21' : '#F6F6F6', zIndex: 2 }}>
            <View style={[styles.subHeaderColsRow, { height: 30, justifyContent: 'center' }]} />

            <View style={[styles.headerColsRow, { height: HEADER_ROW_HEIGHT, justifyContent: 'center' }]}>
              <AppText weight={SEMI_BOLD} style={{ color: themeColors.secondaryText, fontSize: 11, textAlign: 'center' }}>Strike Price</AppText>
            </View>

            {STRIKES.map((item, idx) => (
              <View key={`strike-${idx}`} style={[styles.dataCellRow, { height: ROW_HEIGHT, justifyContent: 'center', borderBottomColor: themeColors.themeBorderColor || '#F0F0F0' }]}>
                <View>
                  <AppText weight={MEDIUM} style={{ color: themeColors.text, fontSize: 13, textAlign: 'center' }}>{item.price}</AppText>
                  <AppText style={{ color: themeColors.secondaryText, fontSize: 10, textAlign: 'center', marginTop: 2 }}>{item.pct}</AppText>
                </View>
              </View>
            ))}
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
                {/* Desktop-like Sub-Header */}
                <View style={[styles.subHeaderColsRow, { height: 30, width: PUTS_WIDTH, justifyContent: 'flex-start', paddingLeft: 6 }]}>
                  <AppText style={{ color: themeColors.secondaryText, fontSize: 10 }}>Time to Expiration: 22h 12m</AppText>
                </View>

                {/* Header */}
                <View style={[styles.headerColsRow, { height: HEADER_ROW_HEIGHT, width: PUTS_WIDTH }]}>
                  {PUTS_HEADERS.map((h, i) => (
                    <View key={i} style={{ width: h.w, alignItems: h.align, paddingHorizontal: 6 }}>
                      <AppText weight={SEMI_BOLD} style={{ color: themeColors.text, fontSize: 11 }}>{h.title}</AppText>
                    </View>
                  ))}
                </View>

                {/* Rows */}
                {STRIKES.map((item, idx) => (
                  <View key={`put-${idx}`} style={[styles.dataCellRow, { height: ROW_HEIGHT, width: PUTS_WIDTH, borderBottomColor: themeColors.themeBorderColor || '#F0F0F0' }]}>
                    <View style={{ width: 70, alignItems: 'flex-start', paddingHorizontal: 6 }}>
                      <AppText weight={SEMI_BOLD} style={{ color: colors.green, fontSize: 12 }}>4,940.2</AppText>
                    </View>
                    <View style={{ width: 70, alignItems: 'flex-start', paddingHorizontal: 6 }}>
                      <AppText weight={SEMI_BOLD} style={{ color: colors.red, fontSize: 12 }}>4,945.0</AppText>
                    </View>
                    <View style={{ width: 70, alignItems: 'flex-start', paddingHorizontal: 6 }}>
                      <AppText style={{ color: themeColors.text, fontSize: 12 }}>4,942.6</AppText>
                    </View>
                    <View style={{ width: 80, alignItems: 'flex-start', paddingHorizontal: 6 }}>
                      <AppText style={{ color: themeColors.text, fontSize: 12 }}>2,137</AppText>
                    </View>
                    <View style={{ width: 70, alignItems: 'flex-start', paddingHorizontal: 6 }}>
                      <AppText style={{ color: themeColors.text, fontSize: 12 }}>1,413</AppText>
                    </View>
                    <View style={{ width: 80, alignItems: 'flex-start', paddingHorizontal: 6 }}>
                      <AppText style={{ color: themeColors.text, fontSize: 12 }}>9.74%</AppText>
                    </View>
                    <View style={{ width: 80, alignItems: 'flex-start', paddingHorizontal: 6 }}>
                      <AppText style={{ color: themeColors.text, fontSize: 12 }}>11.71%</AppText>
                    </View>
                    <View style={{ width: 70, alignItems: 'flex-start', paddingHorizontal: 6 }}>
                      <AppText style={{ color: themeColors.text, fontSize: 12 }}>805.7</AppText>
                    </View>
                    <View style={{ width: 60, alignItems: 'flex-start', paddingHorizontal: 6 }}>
                      <AppText style={{ color: themeColors.text, fontSize: 12 }}>0.447</AppText>
                    </View>
                    <View style={{ width: 70, alignItems: 'flex-start', paddingHorizontal: 6 }}>
                      <AppText style={{ color: themeColors.text, fontSize: 12 }}>0.00061</AppText>
                    </View>
                    <View style={{ width: 70, alignItems: 'flex-start', paddingHorizontal: 6 }}>
                      <AppText style={{ color: themeColors.text, fontSize: 12 }}>-196.81</AppText>
                    </View>
                    <View style={{ width: 60, alignItems: 'flex-start', paddingHorizontal: 6 }}>
                      <AppText style={{ color: themeColors.text, fontSize: 12 }}>3.586</AppText>
                    </View>
                    <View style={{ width: 60, alignItems: 'flex-start', paddingHorizontal: 6 }}>
                      <AppText style={{ color: themeColors.text, fontSize: 12 }}>0.00</AppText>
                    </View>
                    <View style={{ width: 70, alignItems: 'flex-start', paddingHorizontal: 6 }}>
                      <AppText style={{ color: themeColors.text, fontSize: 12 }}>1.87</AppText>
                    </View>
                    <View style={{ width: 70, alignItems: 'flex-start', paddingHorizontal: 6 }}>
                      <AppText style={{ color: themeColors.text, fontSize: 12 }}>59.65X</AppText>
                    </View>
                    <View style={{ width: 60, alignItems: 'flex-start', paddingHorizontal: 6 }}>
                      <AppText style={{ color: themeColors.text, fontSize: 12 }}>--</AppText>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Current Price Indicator Overlay */}
          <View pointerEvents="none" style={[styles.currentPriceIndicator, { top: 30 + HEADER_ROW_HEIGHT + (8 * ROW_HEIGHT) }]}>
            <View style={[styles.currentPriceBadge, { backgroundColor: themeColors.text }]}>
              <AppText weight={BOLD} style={{ color: themeColors.background, fontSize: 11 }}>77,474.3</AppText>
            </View>
          </View>

        </View>
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
    paddingVertical: 12,
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
  dashedUnderline: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
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
