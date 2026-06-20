const fs = require('fs');
let code = fs.readFileSync('src/screens/spotScreen/Spot.jsx', 'utf8');

const target = `
        if (socketThrottleTimerRef.current) {
          clearTimeout(socketThrottleTimerRef.current);
          socketThrottleTimerRef.current = null;
        }
        pendingSocketFlushRef.current = null;`;

const replacement = `
        if (socketThrottleTimerRef.current) {
          clearTimeout(socketThrottleTimerRef.current);
          socketThrottleTimerRef.current = null;
        }
        pendingSocketFlushRef.current = null;
        dispatch(setBuyOrders([]));
        dispatch(setSellOrders([]));`;

code = code.replace(target, replacement);

fs.writeFileSync('src/screens/spotScreen/Spot.jsx', code);
console.log('Fixed Spot blur');
