const fs = require('fs');

let content = fs.readFileSync('src/SocketProvider.js', 'utf8');
if(content.includes('dispatch(setFuturesData')) {
  console.log('Already dispatches');
} else {
  console.log('Does not dispatch');
}
