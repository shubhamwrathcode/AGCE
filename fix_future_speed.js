const fs = require('fs');
let code = fs.readFileSync('src/screens/Futures/FuturesTrade.jsx', 'utf8');

const target = `    if (isFocused && pairData.length === 0) {
      subscribeToFutures();
      const t = setTimeout(() => subscribeToFutures(), 800);
      return () => {
        clearTimeout(t);
        unsubscribeFromFutures();
      };
    }`;

// Replace with nothing, so it doesn't do the redundant "subscribe to all futures" which delays the specific pair orderbook.
code = code.replace(target, '');

fs.writeFileSync('src/screens/Futures/FuturesTrade.jsx', code);
console.log('Removed redundant global subscribeToFutures');
