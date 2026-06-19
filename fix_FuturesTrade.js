const fs = require('fs');
let code = fs.readFileSync('src/screens/Futures/FuturesTrade.jsx', 'utf8');

// 1. Replace the destructuring of futuresData
code = code.replace(
  /futuresData,\n\s*futuresPrice,/,
  "futuresPrice,"
);

// 2. Add selectors at the top of FuturesTrade component
const selectorCode = `
  const futuresBalance = useSelector(state => state.home.futuresData?.balance?.available_balance);
  const lastPrice = useSelector(state => state.home.futuresData?.last_price);
  const buyPrice = useSelector(state => state.home.futuresData?.buy_price);
  const dataPrice = useSelector(state => state.home.futuresData?.price);
  const contractData = useSelector(state => state.home.futuresData?.contract);
  const contractsList = useSelector(state => state.home.futuresData?.contracts);
  const pairsList = useSelector(state => state.home.futuresData?.pairs);
  const firstAskPrice = useSelector(state => state.home.futuresData?.sell_order?.[0]?.price);
  const firstBidPrice = useSelector(state => state.home.futuresData?.buy_order?.[0]?.price);
`;
code = code.replace(
  /const userFuturesWallet = useSelector\(\(state\) => state\.wallet\.userFuturesWallet\);\n/,
  `const userFuturesWallet = useSelector((state) => state.wallet.userFuturesWallet);\n${selectorCode}`
);

// 3. Replace balanceToUse
code = code.replace(
  /futuresData\?\.balance\?\.available_balance/g,
  "futuresBalance"
);

// 4. Replace livePrice calculation
const livePriceOld = `let p = futuresData?.last_price || futuresData?.buy_price || futuresData?.price;
    if (!p && futuresData?.contract) {
      p = futuresData.contract.mark_price || futuresData.contract.last_price;
    }
    if (!p) p = liveCoin?.last_price || liveCoin?.buy_price;
    if (!p) {
      const allAsks = futuresData?.sell_order || [];
      const allBids = futuresData?.buy_order || [];
      p = allAsks[0]?.price || allBids[0]?.price;
    }`;

const livePriceNew = `let p = lastPrice || buyPrice || dataPrice;
    if (!p && contractData) {
      p = contractData.mark_price || contractData.last_price;
    }
    if (!p) p = liveCoin?.last_price || liveCoin?.buy_price;
    if (!p) {
      p = firstAskPrice || firstBidPrice;
    }`;

code = code.replace(livePriceOld, livePriceNew);

// 5. Replace pairsList logic
code = code.replace(
  /\(futuresData\?\.contracts \|\| futuresData\?\.pairs \|\| \[\]\)/g,
  "(contractsList || pairsList || [])"
);

fs.writeFileSync('src/screens/Futures/FuturesTrade.jsx', code);
console.log('Fixed FuturesTrade selections');
