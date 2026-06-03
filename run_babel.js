const fs = require('fs');
const parser = require('@babel/parser');
const content = fs.readFileSync('src/screens/wallet/WalletNew.js', 'utf8');

try {
  parser.parse(content, {
    sourceType: 'module',
    plugins: ['jsx']
  });
  console.log("No syntax errors found by Babel.");
} catch (e) {
  console.error(e);
}
