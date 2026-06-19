const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Change StatusBar to be translucent so Edge-to-Edge works natively,
// but we handle the padding JS-side in SafeRoot!
code = code.replace(
  /<StatusBar\s+backgroundColor=\{colors\.white\}\s+barStyle=\{isDark \? "light-content" : "dark-content"\}\s+translucent=\{false\}\s+\/>/,
  `<StatusBar
        backgroundColor="transparent"
        barStyle={isDark ? "light-content" : "dark-content"}
        translucent={true}
      />`
);

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed StatusBar');
