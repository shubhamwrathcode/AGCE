const fs = require('fs');
let code = fs.readFileSync('src/screens/Futures/FuturesTrade.jsx', 'utf8');

// The orderbook logic starts around "const obAsks = React.useMemo"
// We will replace the entire "const renderOrderBook = () => (" block.
// But wait, it's easier to create a component `<FuturesOrderBook />` right above `FuturesUI`.

const newComponent = `
const FuturesOrderBook = React.memo(({ viewModeIndex, precision, onPriceSelect, selectedCoin, tickSize }) => {
  const { theme, colors: themeColors, isDark } = useTheme();
  const allAsks = useSelector(state => state.home.futuresData?.sell_order) || [];
  const allBids = useSelector(state => state.home.futuresData?.buy_order) || [];

  const obAsks = React.useMemo(() => {
    const aggregated = aggregateOrderBookRows(allAsks, precision);
    return viewModeIndex === 0 ? aggregated.slice(0, 10).reverse() : viewModeIndex === 2 ? aggregated.slice(0, 20).reverse() : [];
  }, [allAsks, viewModeIndex, precision]);

  const obBids = React.useMemo(() => {
    const aggregated = aggregateOrderBookRows(allBids, precision);
    return viewModeIndex === 0 ? aggregated.slice(0, 10) : viewModeIndex === 1 ? aggregated.slice(0, 20) : [];
  }, [allBids, viewModeIndex, precision]);

  const maxVolume = React.useMemo(() => {
    const maxAsk = obAsks.reduce((max, a) => Math.max(max, a.remaining || 0), 0);
    const maxBid = obBids.reduce((max, b) => Math.max(max, b.remaining || 0), 0);
    return Math.max(maxAsk, maxBid, 1);
  }, [obAsks, obBids]);

  const orderBookBidAskRatio = React.useMemo(() => {
    const bid = obBids.reduce((s, o) => s + (Number(o.remaining ?? o.quantity) || 0), 0);
    const ask = obAsks.reduce((s, o) => s + (Number(o.remaining ?? o.quantity) || 0), 0);
    return { bid, ask };
  }, [obBids, obAsks]);

  if (!allAsks.length && !allBids.length) {
    return (
      <View style={{ flex: 1 }}>
        <OrderBookSkeleton />
        <OrderBookSkeleton />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, paddingRight: 6 }}>
      {/* Asks */}
      {(viewModeIndex === 0 || viewModeIndex === 2) && (
        <View style={{ flex: viewModeIndex === 0 ? 1 : 2, justifyContent: 'flex-end', marginBottom: viewModeIndex === 0 ? 4 : 0 }}>
          {obAsks.map((ask, index) => (
            <TouchableOpacity key={"ask-" + index} onPress={() => onPriceSelect(ask.price)} activeOpacity={0.7}>
              <OrderBookAskRow item={ask} maxVolume={maxVolume} themeColors={themeColors} isDark={isDark} selectedCoin={selectedCoin} styles={styles} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Middle Spread/Mark Price */}
      {viewModeIndex === 0 && (
        <View style={{ marginVertical: 8, paddingVertical: 4, alignItems: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
            <AppText weight={SEMI_BOLD} style={{ fontSize: 16, color: themeColors.text, marginRight: 6 }}>
              {parseFloat(Number(allBids[0]?.price || allAsks[0]?.price || 0).toFixed(getTickSize(selectedCoin)))}
            </AppText>
          </View>
        </View>
      )}

      {/* Bids */}
      {(viewModeIndex === 0 || viewModeIndex === 1) && (
        <View style={{ flex: viewModeIndex === 0 ? 1 : 2, justifyContent: 'flex-start' }}>
          {obBids.map((bid, index) => (
            <TouchableOpacity key={"bid-" + index} onPress={() => onPriceSelect(bid.price)} activeOpacity={0.7}>
              <OrderBookBidRow item={bid} maxVolume={maxVolume} themeColors={themeColors} isDark={isDark} selectedCoin={selectedCoin} styles={styles} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
});

`;

code = code.replace(/const FuturesUI = \(\) => \{/, newComponent + "\nconst FuturesUI = () => {");

fs.writeFileSync('src/screens/Futures/FuturesTrade.jsx', code);
console.log('Injected FuturesOrderBook');
