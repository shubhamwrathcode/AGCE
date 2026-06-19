const fs = require('fs');
let code = fs.readFileSync('src/screens/Futures/FuturesTrade.jsx', 'utf8');

// 1. Replace the call
if (code.includes('{renderOrderBook()}')) {
    code = code.replace(
        /\{renderOrderBook\(\)\}/,
        `<FuturesOrderBook 
            viewModeIndex={viewModeIndex} 
            precision={precision} 
            onPriceSelect={(p) => setPrice(String(formatPriceByTick(p, selectedCoin)))} 
            selectedCoin={selectedCoin} 
            tickSize={getTickSize(selectedCoin)} 
          />`
    );
}

// 2. Fix the dependencies on line 838
code = code.replace(
  /}, \[livePriceState, futuresData, liveCoin\]\);/g,
  "}, [livePriceState, liveCoin]);"
);

// 3. Fix dependencies on line 1007
code = code.replace(
  /}, \[futuresPairs, futuresData\]\);/g,
  "}, [futuresPairs]);"
);

// 4. Import
if (!code.includes("import FuturesOrderBook")) {
    code = code.replace(
        /import React, \{ useState, useEffect, useRef \} from 'react';/,
        `import React, { useState, useEffect, useRef } from 'react';\nimport FuturesOrderBook from './FuturesOrderBook';`
    );
}

fs.writeFileSync('src/screens/Futures/FuturesTrade.jsx', code);
console.log('Fixed FuturesTrade safely');
