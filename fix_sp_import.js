const fs = require('fs');
let code = fs.readFileSync('src/SocketProvider.js', 'utf8');

// Find the homeSlice import statement and add setFuturesData
const homeSliceImportRegex = /import\s*\{([\s\S]*?)\}\s*from\s*"(\.\/slices\/homeSlice)";/;
const match = code.match(homeSliceImportRegex);

if (match) {
    const importedItems = match[1];
    if (!importedItems.includes('setFuturesData')) {
        const newImportedItems = importedItems + ',\n  setFuturesData';
        code = code.replace(homeSliceImportRegex, `import {${newImportedItems}\n} from "$2";`);
    }
}

fs.writeFileSync('src/SocketProvider.js', code);
console.log('Added setFuturesData import to SocketProvider.js');
