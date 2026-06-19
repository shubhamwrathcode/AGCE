const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Revert SafeRoot wrapper
code = code.replace(/<SafeRoot>\n\s*<SocketProvider>/, "<SocketProvider>");
code = code.replace(/<\/SocketProvider>\n\s*<\/SafeRoot>/, "</SocketProvider>");

// 2. Remove SafeRoot definition
code = code.replace(/const SafeRoot = \(\{\s*children\s*\}: \{\s*children: React\.ReactNode\s*\}\) => \{[\s\S]*?\};\n/, "");

// 3. Revert imports
code = code.replace(/import \{ SafeAreaProvider, useSafeAreaInsets \} from "react-native-safe-area-context";\nimport \{ Platform, View \} from "react-native";/, "import { SafeAreaProvider } from \"react-native-safe-area-context\";");

// 4. Revert StatusBar
code = code.replace(/<StatusBar\s+backgroundColor="transparent"\s+barStyle=\{isDark \? "light-content" : "dark-content"\}\s+translucent=\{true\}\s+\/>/, `<StatusBar
        backgroundColor={colors.white}
        barStyle={isDark ? "light-content" : "dark-content"}
        translucent={false}
      />`);

fs.writeFileSync('src/App.tsx', code);
console.log('Reverted App.tsx');
