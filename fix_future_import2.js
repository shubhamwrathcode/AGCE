const fs = require('fs');
let code = fs.readFileSync('src/screens/Futures/FuturesTrade.jsx', 'utf8');

if (!code.includes('import { setFuturesData }')) {
    code = code.replace(
        /import React, \{([\s\S]*?)\} from 'react';/,
        `import React, {$1} from 'react';\nimport { setFuturesData } from "../../slices/homeSlice";`
    );
}

fs.writeFileSync('src/screens/Futures/FuturesTrade.jsx', code);
console.log('Added setFuturesData import to FuturesTrade.jsx');
