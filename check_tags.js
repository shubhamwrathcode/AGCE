const fs = require('fs');
const content = fs.readFileSync('src/screens/wallet/WalletNew.js', 'utf8');
const lines = content.split('\n');

let views = 0;
for(let i=690; i<985; i++) {
  const line = lines[i];
  const openMatch = line.match(/<View[^>]*>/g);
  const selfClose = line.match(/<View[^>]*\/>/g);
  const closeMatch = line.match(/<\/View>/g);
  
  let opens = (openMatch ? openMatch.length : 0) - (selfClose ? selfClose.length : 0);
  let closes = closeMatch ? closeMatch.length : 0;
  
  views += opens;
  views -= closes;
  
  if (opens > 0 || closes > 0) {
    console.log(`L${i+1}: ${line.trim()} | Total: ${views}`);
  }
}
