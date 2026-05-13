// import React, { useEffect, useRef, useState } from 'react';
// import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
// import CoinCard from './CoinCard';
// import CustomDots from './CustomDots';
// import { useAppSelector } from '../../store/hooks';

// const { width } = Dimensions.get('window');
// const CARD_WIDTH = width * 0.45 + 20;

// const coins = [
//   { id: 1, currency: 'BTC' },
//   { id: 2, currency: 'USDT' },
//   { id: 3, currency: 'ETH' },
//   { id: 3, currency: 'ETH' },

// ];

// const CoinSlider = (style) => {
//   const scrollRef = useRef(null);
//   const hotCoins = useAppSelector(state => state.home.coinPairs);
//   const [activeIndex, setActiveIndex] = useState(0);

//   // console.log(hotCoins, "hotCoins");

//   const scrollToIndex = (index) => {
//     scrollRef.current?.scrollTo({ x: index * CARD_WIDTH, animated: true });
//     setActiveIndex(index);
//   };

//   useEffect(() => {
//     const interval = setInterval(() => {
//       let nextIndex = (activeIndex + 1) % coins.length;
//       scrollToIndex(nextIndex);
//     }, 2000); // scroll every 3 seconds

//     return () => clearInterval(interval);
//   }, [activeIndex]);

//   const onScroll = (e) => {
//     const index = Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH);
//     setActiveIndex(index);
//   };

//   return (
//     <View style={[styles.wrapper, style]}>
//       <ScrollView
//         horizontal
//         pagingEnabled={false}
//         ref={scrollRef}
//         showsHorizontalScrollIndicator={false}
//         onScroll={onScroll}
//         scrollEventThrottle={16}
//         // contentContainerStyle={styles.scrollContainer}
//           contentContainerStyle={{justifyContent: "space-between", paddingHorizontal: 16, gap: 10 }} // 👈 Important fix

//       >
//         {hotCoins?.slice(0, 6)?.map((coin,index) => (
//            <View
//             key={coin.id + '-' + index}
//             // style={{alignItems: "center"}}
//             // style={{marginHorizontal: 10}}
//     //         style={
//     //           [index == 0 ?
//     //             {marginLeft:10}:
//     //             index == coins?.length-1 
//     //             ? 
//     //            { marginLeft:10 ,paddingRight:17}
//     //            :
//     //            {paddingLeft:18}, 
//     // ]}
//   >
//           <CoinCard key={coin.id} currency={coin.currency} data={coin}/>
//           </View>
//         ))}
//       </ScrollView>

//       <View style={styles.dotContainer}>
//         {hotCoins?.slice(0, 5)?.map((_, i) => (
//           <CustomDots key={i} index={i} activeIndex={activeIndex} />
//         ))}
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   wrapper: {
//     paddingVertical: 10,

//   },
//   scrollContainer: {
//     paddingHorizontal: 10,
//   },
//   dotContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     marginTop: 10,
//   },
// });

// export default CoinSlider;


// import React, { useState } from 'react';
// import {Dimensions, StyleSheet, View} from 'react-native';
// import CoinCard from './CoinCard';
// import Carousel from 'react-native-reanimated-carousel';

// import CustomDots from './CustomDots';
// const width = Dimensions.get('window').width;

// const baseOptions = {
//   width: width / 2 - 20,
// };

// const CoinSlider = ({hide = true}) => {
//   const [activeIndex, setActiveIndex] = useState(0);

//   // const hotCoins = useAppSelector(state => state.home.hotCoins);

//   const hotCoins = [
//     {index: 0, item: {
//       __v: 123,
//       _id: "567",
//       available: "567",
//       base_currency: "567",
//       base_currency_id: "567",
//       buy_price: 123,
//       change: 123,
//       createdAt: "567",
//       high: 123,
//       icon_path: "567",
//       low: 123,
//       open: 123,
//       quote_currency: "567",
//       quote_currency_id: "567",
//       sell_price: 123,
//       status: "567",
//       type: "567",
//       updatedAt: "567",
//       volume: 123,
//     }, currency: "BTC"},
//     {index: 1, item:{
//       __v: 123,
//       _id: "567",
//       available: "567",
//       base_currency: "567",
//       base_currency_id: "567",
//       buy_price: 123,
//       change: 123,
//       createdAt: "567",
//       high: 123,
//       icon_path: "567",
//       low: 123,
//       open: 123,
//       quote_currency: "567",
//       quote_currency_id: "567",
//       sell_price: 123,
//       status: "567",
//       type: "567",
//       updatedAt: "567",
//       volume: 123,
//     }, currency: "BTC"},
//     {index: 2, item: {
//       __v: 123,
//       _id: "567",
//       available: "567",
//       base_currency: "567",
//       base_currency_id: "567",
//       buy_price: 123,
//       change: 123,
//       createdAt: "567",
//       high: 123,
//       icon_path: "567",
//       low: 123,
//       open: 123,
//       quote_currency: "567",
//       quote_currency_id: "567",
//       sell_price: 123,
//       status: "567",
//       type: "567",
//       updatedAt: "567",
//       volume: 123,
//     }, currency: "BTC"}
//   ];

//   const renderItem = ({item, index}) => {
//     return <CoinCard item={item} index={index} />;
//   };
//   return (
//     <View style={{paddingHorizontal: 20}}>
//     <Carousel
//       {...baseOptions}
//       data={hotCoins}
//       style={styles.container}
//       renderItem={renderItem}
//       autoPlay={true}
//       onSnapToItem={index => setActiveIndex(index)}
//       autoPlayInterval={1000}
//     />
//     <View style={styles.dotContainer}>
//         {hotCoins?.map((data , index) => {
//           return (
//             <CustomDots
//               key={data?.index}
//               index={index}
//               activeIndex={activeIndex}
//             />
//           );
//         })}
//       </View>

//     </View>
//   );
// };

// export default CoinSlider;
// const styles = StyleSheet.create({
//   container: {width: '100%', height: 160, marginTop: 12},
//   dotContainer: {
//     alignItems: 'center',
//     flexDirection: 'row',
//     justifyContent: 'center',
//     marginVertical: 10,
//     // marginRight:20
//   },
// });

import React, { useEffect, useMemo, useCallback, useRef } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { useAppSelector } from '../../store/hooks';
import NavigationService from '../../navigation/NavigationService';
import { WALLET_SCREEN } from '../../navigation/routes';
import FastImage from 'react-native-fast-image';
import { IMAGE_BASE_URL } from '../../helper/Constants';
import MiniSparkline from '../../shared/components/MiniSparkline';
import { AppText, BOLD, FOURTEEN, NINE, SEMI_BOLD, TEN, TWELVE } from '../../shared';
import { useTheme } from '../../hooks/useTheme';
import { colors, lightTheme } from '../../theme/colors';

const { width } = Dimensions.get('window');

const CAROUSEL_AUTO_MS = 3000;

const CoinSlider = () => {
  const coinPairs = useAppSelector((state) => state.home.coinPairs);
  const hotPairsChart = useAppSelector((state) => state.home.hotPairsChart) ?? {};
  const carouselRef = useRef(null);
  const { colors: themeColors } = useTheme();

  const SIDE_SPACE = 12;
  const ITEM_WIDTH = width / 2 - SIDE_SPACE;

  // Same as Market: preferred coins BTC, ETH, BNB with chart_data
  const featuredCoins = useMemo(() => {
    if (!coinPairs || coinPairs.length === 0) return [];
    const preferred = ['BTC', 'ETH', 'BNB'];
    const out = [];
    for (const sym of preferred) {
      const found = coinPairs.find(
        (p) => p?.base_currency?.toUpperCase() === sym && p?.quote_currency?.toUpperCase() === 'USDT'
      );
      if (found) {
        out.push({
          ...found,
          chart_data: hotPairsChart[sym] ?? [],
        });
      }
    }
    return out;
  }, [coinPairs, hotPairsChart]);

  const slideCount = featuredCoins.length;

  useEffect(() => {
    if (slideCount <= 1) return undefined;
    const id = setInterval(() => {
      try {
        carouselRef.current?.next?.({ animated: true });
      } catch {
        /* ignore */
      }
    }, CAROUSEL_AUTO_MS);
    return () => clearInterval(id);
  }, [slideCount]);

  const handlePress = useCallback((item) => {
    if (item?.base_currency && item?.quote_currency) {
      NavigationService.navigate(WALLET_SCREEN, { coinDetail: item });
    }
  }, []);

  const formatInr = useCallback((v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return '0';
    const rounded = Math.round(n);
    return String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }, []);

  const renderItem = ({ item, index }) => {
    const sym = String(item?.base_currency || '').toUpperCase();
    const coinName = sym === 'BTC' ? 'Bitcoin' : sym === 'ETH' ? 'Ethereum' : sym || '—';
    const change = Number(item?.change_percentage) || 0;
    const isPositive = change >= 0;
    const pctStr = `${Math.abs(change).toFixed(1)}%`;
    const priceStr = `INR ${formatInr(item?.buy_price)}`;

    return (
      <View style={styles.cardWrapper}>
        <View style={[styles.card, { backgroundColor: colors.iconBgColor }]}>
          <View style={styles.topRow}>
            <FastImage
              source={item?.icon_path ? { uri: IMAGE_BASE_URL + item.icon_path } : undefined}
              resizeMode="contain"
              style={styles.coinIcon}
            />
            <View style={styles.sparkWrap}>
              <MiniSparkline
                chartData={item?.chart_data}
                isPositive={isPositive}
                width={72}
                height={26}
                chartId={`home-mini-${index}`}
                fallbackPrice={Number(item?.buy_price) || 100}
              />
            </View>
          </View>

          <View style={styles.midRow}>
            <AppText weight={BOLD} type={TWELVE} numberOfLines={1} style={{ color: themeColors.text }}>
              {coinName}{' '}
              <AppText type={NINE} style={{ color: '#9CA3AF' }}>
                {sym}
              </AppText>
            </AppText>
            <View style={styles.pctRow}>
              <AppText type={TEN} style={{ color: isPositive ? '#10B981' : '#EF4444' }}>
                {isPositive ? '▲' : '▼'} {pctStr}
              </AppText>
            </View>
          </View>

          <AppText weight={SEMI_BOLD} type={TWELVE} numberOfLines={1} style={{ color: '#111827', marginTop: 6 }}>
            {priceStr}
          </AppText>
        </View>
      </View>
    );
  };

  if (featuredCoins.length === 0) return null;

  return (
    <View style={{ paddingHorizontal: SIDE_SPACE, marginBottom: -16 }}>
      <Carousel
        ref={carouselRef}
        loop={slideCount > 1}
        width={ITEM_WIDTH}
        height={130}
        autoPlay={false}
        data={featuredCoins}
        scrollAnimationDuration={600}
        renderItem={renderItem}
        mode="parallax"
        modeConfig={{
          parallaxScrollingScale: 1,
          parallaxScrollingOffset: 0,
        }}
        panGestureHandlerProps={{
          activeOffsetX: [-10, 10],
        }}
        style={{ width: '100%' }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginHorizontal: 5,
  },
  card: {
    borderRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 8,
    justifyContent: 'flex-start',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinIcon: {
    width: 26,
    height: 26,
  },
  sparkWrap: {
    width: 78,
    height: 30,
    alignItems: 'flex-end',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  midRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  pctRow: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});

export default CoinSlider;

