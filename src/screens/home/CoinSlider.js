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

import React, { useState, useMemo, useCallback } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import CustomDots from './CustomDots';
import { useAppSelector } from '../../store/hooks';
import MarketFeaturedCard from '../other/MarketFeaturedCard';
import NavigationService from '../../navigation/NavigationService';
import { WALLET_SCREEN } from '../../navigation/routes';

const { width } = Dimensions.get('window');

const CoinSlider = () => {
  const coinPairs = useAppSelector((state) => state.home.coinPairs);
  const hotPairsChart = useAppSelector((state) => state.home.hotPairsChart) ?? {};
  const [activeIndex, setActiveIndex] = useState(0);

  const SIDE_SPACE = 12;
  const ITEM_WIDTH = width / 2 - SIDE_SPACE - 6;

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

  const handlePress = useCallback((item) => {
    if (item?.base_currency && item?.quote_currency) {
      NavigationService.navigate(WALLET_SCREEN, { coinDetail: item });
    }
  }, []);

  const renderItem = ({ item, index }) => (
    <View style={styles.cardWrapper}>
      <MarketFeaturedCard
        data={item}
        chartData={item?.chart_data}
        chartId={`home-${index}`}
        onPress={handlePress}
      />
    </View>
  );

  if (featuredCoins.length === 0) return null;

  return (
    <View style={{ paddingHorizontal: SIDE_SPACE }}>
      <Carousel
        loop
        width={ITEM_WIDTH}
        height={230}
        autoPlay
        data={featuredCoins}
        scrollAnimationDuration={1000}
        onSnapToItem={(index) => setActiveIndex(index)}
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

      <View style={styles.dotContainer}>
        {featuredCoins.map((_, index) => (
          <CustomDots key={index} index={index} activeIndex={activeIndex} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginHorizontal: 5, // small spacing between cards
  },
  dotContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
});

export default CoinSlider;

