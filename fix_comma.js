const fs = require('fs');
let code = fs.readFileSync('src/SocketProvider.js', 'utf8');

code = code.replace(
  /setSocketLoading,\n,\n  setFuturesData/,
  'setSocketLoading,\n  setFuturesData'
);

fs.writeFileSync('src/SocketProvider.js', code);
console.log('Fixed extra comma');
