const fs = require('fs');
let code = fs.readFileSync('src/screens/spotScreen/Spot.jsx', 'utf8');

// 1. Add useState, useRef, useEffect imports if needed in OrderBookSection.
// Wait, they are probably already imported in the file, but we use React.useState or just useState.
// Let's use React.useState, React.useRef, React.useEffect to be safe.

const target = `  const currentPriceColor = change_percentage < 0 ? themeColors.red : themeColors.green;`;

const replacement = `  const [isPricePositive, setIsPricePositive] = React.useState(true);
  const prevPriceRef = React.useRef(0);

  React.useEffect(() => {
    const currentNum = Number(buy_price);
    if (currentNum > prevPriceRef.current && prevPriceRef.current !== 0) {
      setIsPricePositive(true);
    } else if (currentNum < prevPriceRef.current && prevPriceRef.current !== 0) {
      setIsPricePositive(false);
    }
    if (currentNum > 0) {
      prevPriceRef.current = currentNum;
    }
  }, [buy_price]);

  const currentPriceColor = isPricePositive ? themeColors.green : themeColors.red;`;

code = code.replace(target, replacement);

fs.writeFileSync('src/screens/spotScreen/Spot.jsx', code);
console.log('Fixed current price color logic');
