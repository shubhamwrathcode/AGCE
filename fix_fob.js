const fs = require('fs');
let code = fs.readFileSync('src/screens/Futures/FuturesTrade.jsx', 'utf8');

code = code.replace(
  /\{\(!futuresData\?.sell_order && !futuresData\?.buy_order\) \? \(/g,
  "{(allAsks.length === 0 && allBids.length === 0) ? ("
);

fs.writeFileSync('src/screens/Futures/FuturesTrade.jsx', code);
console.log('Fixed futuresData in FuturesOrderBook');
