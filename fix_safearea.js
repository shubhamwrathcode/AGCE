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

const files = walk('src/screens/Security');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Check if SafeAreaView is imported from react-native
  if (content.match(/import\s+{[^}]*SafeAreaView[^}]*}\s+from\s+['"]react-native['"]/m)) {
    // Remove SafeAreaView from the react-native import
    content = content.replace(/(import\s+{[^}]*)SafeAreaView,?([^}]*}\s+from\s+['"]react-native['"])/m, (match, p1, p2) => {
      // Clean up empty commas and spaces
      let cleaned = (p1 + p2).replace(/,\s*,/g, ',').replace(/{\s*,/g, '{').replace(/,\s*}/g, '}');
      // If the import is empty like import {} from 'react-native', we could leave it or remove it, leaving it is fine.
      return cleaned;
    });
    
    // Check if SafeAreaView is already imported from react-native-safe-area-context
    if (!content.match(/import\s+{[^}]*SafeAreaView[^}]*}\s+from\s+['"]react-native-safe-area-context['"]/m)) {
      // Add the import at the top
      content = "import { SafeAreaView } from 'react-native-safe-area-context';\n" + content;
    }
    
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
  }
});
