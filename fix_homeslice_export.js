const fs = require('fs');
let code = fs.readFileSync('src/slices/homeSlice.ts', 'utf8');

if (!code.includes('setFuturesData,')) {
    code = code.replace(
        /setRecentTrades\n\} = homeSlice.actions;/,
        'setRecentTrades,\n  setFuturesData\n} = homeSlice.actions;'
    );
}

fs.writeFileSync('src/slices/homeSlice.ts', code);
console.log('Added setFuturesData to exports');
