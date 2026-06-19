const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.match(/\.(js|jsx|ts|tsx)$/)) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('src');
let count = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  if (content.match(/import\s+{[^}]*SafeAreaView[^}]*}\s+from\s+['"]react-native['"]/m)) {
    content = content.replace(/(import\s+{[^}]*)SafeAreaView,?([^}]*}\s+from\s+['"]react-native['"])/m, (match, p1, p2) => {
      let cleaned = (p1 + p2).replace(/,\s*,/g, ',').replace(/{\s*,/g, '{').replace(/,\s*}/g, '}');
      return cleaned;
    });
    
    if (!content.match(/import\s+{[^}]*SafeAreaView[^}]*}\s+from\s+['"]react-native-safe-area-context['"]/m)) {
      content = "import { SafeAreaView } from 'react-native-safe-area-context';\n" + content;
    }
    
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
    count++;
  }
});
console.log('Total fixed:', count);
