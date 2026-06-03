const fs = require('fs');
const content = fs.readFileSync('src/screens/wallet/WalletNew.js', 'utf8');

let stack = [];
let i = 0;
while (i < content.length) {
  // Find next '<'
  const nextOpen = content.indexOf('<', i);
  if (nextOpen === -1) break;
  
  // Check if it's a comment
  if (content.substring(nextOpen, nextOpen + 4) === '<!--') {
    i = content.indexOf('-->', nextOpen) + 3;
    continue;
  }
  
  // Check if it's a JSX comment {/* ... */}
  if (content.substring(nextOpen - 1, nextOpen + 2) === '{/*') {
    i = content.indexOf('*/}', nextOpen) + 3;
    continue;
  }

  // Find '>'
  const nextClose = content.indexOf('>', nextOpen);
  if (nextClose === -1) break;
  
  const tagContent = content.substring(nextOpen + 1, nextClose).trim();
  
  if (tagContent.startsWith('/')) {
    // Closing tag
    const tagName = tagContent.substring(1).split(/\s+/)[0];
    if (stack.length > 0 && stack[stack.length - 1].name === tagName) {
      stack.pop();
    } else {
      console.log(`Mismatch: Found </${tagName}> but expected </${stack.length > 0 ? stack[stack.length - 1].name : 'empty'}> at index ${nextOpen}`);
    }
  } else if (tagContent.endsWith('/')) {
    // Self-closing tag
  } else {
    // Opening tag
    const tagName = tagContent.split(/\s+/)[0];
    // Ignore non-components like JSX fragments or empty string if it's < > 
    if (tagName && !tagName.includes('=') && !tagName.startsWith('{') && /^[A-Z]/.test(tagName)) {
      stack.push({ name: tagName, pos: nextOpen });
    }
  }
  i = nextClose + 1;
}

console.log("Remaining stack:");
console.log(stack.map(s => `${s.name} at char ${s.pos}`));
