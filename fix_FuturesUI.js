const fs = require('fs');
let code = fs.readFileSync('src/screens/Futures/FuturesTrade.jsx', 'utf8');

// The original inline orderbook logic:
const inlineOrderBookPattern = /const obAsks = React\.useMemo\(\(\) => \{[\s\S]*?const renderOrderBook = \(\) => \([\s\S]*?\{viewModeIndex === 0 && \([\s\S]*?<\/View>\s*\)\s*\};\n/m;

// Replace it with:
const replacement = `
  const handlePriceSelect = React.useCallback((p) => {
    setPrice(String(p));
  }, []);

  const renderOrderBook = () => (
    <FuturesOrderBook 
      viewModeIndex={viewModeIndex} 
      precision={precision} 
      onPriceSelect={handlePriceSelect} 
      selectedCoin={selectedCoin} 
      tickSize={getTickSize(selectedCoin)} 
    />
  );
`;

code = code.replace(inlineOrderBookPattern, replacement);
fs.writeFileSync('src/screens/Futures/FuturesTrade.jsx', code);
console.log('Fixed FuturesUI renderOrderBook');
