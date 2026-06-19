const fs = require('fs');

let content = fs.readFileSync('src/screens/spotScreen/Spot.jsx', 'utf8');

// 1. Remove useAppSelectors
content = content.replace(/const buyOrders = useAppSelector\(\(state\) => state\.home\.buyOrders\);\n/, '');
content = content.replace(/const sellOrders = useAppSelector\(\(state\) => state\.home\.sellOrders\);\n/, '');
content = content.replace(/const recentTrades = useAppSelector\(\(state\) => state\.home\.recentTrades\);\n/, '');

// 2. Remove useState definitions
content = content.replace(/const \[LocalBuyOrders, setLocalBuyOrders\] = useState\(\[\]\);\n/, '');
content = content.replace(/const \[LocalSellOrders, setLocalSellOrders\] = useState\(\[\]\);\n/, '');

// 3. Remove setLocal calls
content = content.replace(/\bsetLocalBuyOrders\(.*?\);\n?/g, '');
content = content.replace(/\bsetLocalSellOrders\(.*?\);\n?/g, '');

// 4. Remove the crazy useEffect for currency LOCAL
const effectPattern = /useEffect\(\(\) => \{\s+if \(currency\?\.available === "LOCAL"\) \{\s+dispatch\(setBuyOrders\(LocalBuyOrders\)\);\s+dispatch\(setSellOrders\(LocalSellOrders\)\);\s+dispatch\(setRecentTrades\(recentTrades\)\);\s+\}\s+\}, \[LocalBuyOrders, LocalSellOrders, recentTrades, currency, dispatch\]\);\n/;
content = content.replace(effectPattern, '');

fs.writeFileSync('src/screens/spotScreen/Spot.jsx', content);
console.log('Fixed Spot.jsx');
