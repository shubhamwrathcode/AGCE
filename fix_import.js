const fs = require('fs');
let code = fs.readFileSync('src/screens/Futures/FuturesTrade.jsx', 'utf8');

if (!code.includes("import FuturesOrderBook")) {
    code = code.replace(
        /import React[\s\S]*?from 'react';/,
        `$& \nimport FuturesOrderBook from './FuturesOrderBook';`
    );
}

fs.writeFileSync('src/screens/Futures/FuturesTrade.jsx', code);
console.log('Added import to FuturesTrade.jsx');
