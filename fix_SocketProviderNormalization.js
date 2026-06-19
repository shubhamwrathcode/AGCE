const fs = require('fs');
let code = fs.readFileSync('src/SocketProvider.js', 'utf8');

// Add import
if (!code.includes('normalizeOrderbookOrders')) {
  code = code.replace(
    /import \{ socketService \} from "\.\/services\/socket\/SocketService";/,
    `import { socketService } from "./services/socket/SocketService";\nimport { normalizeOrderbookOrders } from "./helper/futuresUtils";`
  );
}

// Replace the dispatch payload with normalized payload
const oldDispatch = /futuresDataRef\.current = data;\n          dispatch\(setFuturesData\(data\)\);/g;

const newDispatch = `
          const normalized = { ...data };
          if (data.buy_order != null) {
            normalized.buy_order = normalizeOrderbookOrders(data.buy_order || []);
          }
          if (data.sell_order != null) {
            normalized.sell_order = normalizeOrderbookOrders(data.sell_order || []);
          }
          if (data.recent_trades != null) {
            normalized.recent_trades = (data.recent_trades || []).map((t) => ({
              price: parseFloat(t.price) || 0,
              quantity: parseFloat(t.quantity) || 0,
              side: t.side || "BUY",
              time: t.time || new Date().toLocaleTimeString("en-GB", { hour12: false }),
            }));
          }
          futuresDataRef.current = normalized;
          dispatch(setFuturesData(normalized));`;

code = code.replace(oldDispatch, newDispatch);

fs.writeFileSync('src/SocketProvider.js', code);
console.log('Added normalization to SocketProvider');
