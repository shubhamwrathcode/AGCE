const fs = require('fs');

let content = fs.readFileSync('src/screens/spotScreen/Spot.jsx', 'utf8');

// The one currently remaining is at line 1095 (inside Spot)
// Let's replace it with nothing.
content = content.replace(/const buyOrders = useAppSelector\(\(state\) => state\.home\.buyOrders\);\n/, '');
content = content.replace(/const sellOrders = useAppSelector\(\(state\) => state\.home\.sellOrders\);\n/, '');
content = content.replace(/const recentTrades = useAppSelector\(\(state\) => state\.home\.recentTrades\);\n/, '');

// Now let's inject them back inside OrderBookSection
const orderBookSectionPattern = /const OrderBookSection = memo\(\(\{[\s\S]*?\}\) => \{\n  const \{ theme, colors: themeColors, isDark \} = useTheme\(\);\n/;

content = content.replace(orderBookSectionPattern, (match) => {
  return match + '  const buyOrders = useAppSelector((state) => state.home.buyOrders);\n  const sellOrders = useAppSelector((state) => state.home.sellOrders);\n';
});

fs.writeFileSync('src/screens/spotScreen/Spot.jsx', content);
console.log('Fixed Spot.jsx 2');
