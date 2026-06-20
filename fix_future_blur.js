const fs = require('fs');
let code = fs.readFileSync('src/screens/Futures/FuturesTrade.jsx', 'utf8');

// 1. Import setFuturesData
if (!code.includes('setFuturesData')) {
    code = code.replace(
        /import { getOpenOrders, getUserFuturesWallet } from '\.\.\/\.\.\/slices\/walletSlice';/,
        `import { getOpenOrders, getUserFuturesWallet } from '../../slices/walletSlice';\nimport { setFuturesData } from '../../slices/homeSlice';`
    );
}

// 2. Clear on coin selection
const handleSelectCoinTarget = `  const handleSelectCoin = (pair) => {
    setSelectedCoin(pair);`;

const handleSelectCoinReplacement = `  const handleSelectCoin = (pair) => {
    dispatch(setFuturesData(null));
    setSelectedCoin(pair);`;

code = code.replace(handleSelectCoinTarget, handleSelectCoinReplacement);

// 3. Clear on blur
const useEffectTarget = `  useEffect(() => {
    if (isFocused && selectedCoin) {
      subscribeToFutures({ symbol: selectedCoin.symbol });
      return () => {
        unsubscribeFromFutures({ symbol: selectedCoin.symbol, base_currency_id: selectedCoin._id });
      };
    }
  }, [isFocused, selectedCoin, subscribeToFutures, unsubscribeFromFutures]);`;

const useEffectReplacement = `  useEffect(() => {
    if (isFocused && selectedCoin) {
      subscribeToFutures({ symbol: selectedCoin.symbol });
      return () => {
        dispatch(setFuturesData(null));
        unsubscribeFromFutures({ symbol: selectedCoin.symbol, base_currency_id: selectedCoin._id });
      };
    }
  }, [isFocused, selectedCoin, subscribeToFutures, unsubscribeFromFutures, dispatch]);`;

code = code.replace(useEffectTarget, useEffectReplacement);

fs.writeFileSync('src/screens/Futures/FuturesTrade.jsx', code);
console.log('Fixed FutureTrade blur and selection');
