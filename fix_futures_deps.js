const fs = require('fs');
let code = fs.readFileSync('src/screens/Futures/FuturesTrade.jsx', 'utf8');

// 1. Line 838: }, [livePriceState, futuresData, liveCoin]);
code = code.replace(
  /}, \[livePriceState, futuresData, liveCoin\]\);/g,
  "}, [livePriceState, liveCoin, contractData, firstAskPrice, firstBidPrice]);"
);

// 2. Line 1007: }, [futuresPairs, futuresData]);
code = code.replace(
  /}, \[futuresPairs, futuresData\]\);/g,
  "}, [futuresPairs]);"
);

// 3. Delete obAsks, obBids, maxVolume, renderOrderBook
// These are obsolete and replaced by FuturesOrderBook component.
code = code.replace(/const renderOrderBook = \(\) => \([\s\S]*?<\/View>\n    <\/View>\n  \);/g, "");

code = code.replace(/const obAsks = React\.useMemo\(\(\) => \{[\s\S]*?\}, \[futuresData\?.sell_order, viewModeIndex, precision\]\);/g, "");

code = code.replace(/const obBids = React\.useMemo\(\(\) => \{[\s\S]*?\}, \[futuresData\?.buy_order, viewModeIndex, precision\]\);/g, "");

code = code.replace(/const maxVolume = React\.useMemo\(\(\) => \{[\s\S]*?\}, \[obAsks, obBids\]\);/g, "");

fs.writeFileSync('src/screens/Futures/FuturesTrade.jsx', code);
console.log('Fixed futuresData usages in FuturesTrade.jsx');
