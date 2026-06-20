const fs = require('fs');
let file = fs.readFileSync('/Users/wrathcodetechnology/Desktop/Projects/AGCE/src/navigation/Navigator.tsx', 'utf-8');

if (!file.includes('import StakingPurchase')) {
  const importStr = "import StakingDashboard from \"../screens/staking/StakingDashboard\";";
  file = file.replace(importStr, `${importStr}\nimport StakingPurchase from "../screens/staking/StakingPurchase";`);
}

if (!file.includes('name="StakingPurchase"')) {
  const componentStr = `<Stack.Screen
        name="StakingDashboard"
        component={StakingDashboard}
        options={{ headerShown: false }}
      />`;
  file = file.replace(componentStr, `${componentStr}\n      <Stack.Screen\n        name="StakingPurchase"\n        component={StakingPurchase}\n        options={{ headerShown: false }}\n      />`);
}

fs.writeFileSync('/Users/wrathcodetechnology/Desktop/Projects/AGCE/src/navigation/Navigator.tsx', file);
