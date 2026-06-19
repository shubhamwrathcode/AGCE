const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const importToAdd = `import { Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";`;

// Add useSafeAreaInsets import if missing
if (!code.includes('useSafeAreaInsets')) {
    code = code.replace(
        /import \{ SafeAreaProvider \} from "react-native-safe-area-context";/,
        `import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";\nimport { Platform, View } from "react-native";`
    );
}

const safeRootCode = `
const SafeRoot = ({ children }: { children: React.ReactNode }) => {
  const insets = useSafeAreaInsets();
  const { colors: themeColors, isDark } = useTheme();
  return (
    <View style={{ flex: 1, paddingTop: Platform.OS === 'android' ? insets.top : 0, backgroundColor: isDark ? '#000000' : '#FFFFFF' }}>
      {children}
    </View>
  );
};
`;

if (!code.includes('const SafeRoot')) {
    code = code.replace(
        /const MainApp = \(\) => \{/,
        safeRootCode + "\nconst MainApp = () => {"
    );
}

// Wrap SocketProvider in SafeRoot
if (!code.includes('<SafeRoot>')) {
    code = code.replace(
        /<SocketProvider>/,
        "<SafeRoot>\n      <SocketProvider>"
    );
    code = code.replace(
        /<\/SocketProvider>/,
        "</SocketProvider>\n      </SafeRoot>"
    );
}

fs.writeFileSync('src/App.tsx', code);
console.log('Fixed App.tsx');
