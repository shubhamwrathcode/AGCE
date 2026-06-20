const fs = require('fs');
let file = fs.readFileSync('/Users/wrathcodetechnology/Desktop/Projects/AGCE/src/screens/staking/StakingDashboard.tsx', 'utf-8');

// 1. Remove refs
file = file.replace('  const stakeSheetRef = useRef<any>(null);\n', '');
file = file.replace('  const confirmOverviewSheetRef = useRef<any>(null);\n', '');

// 2. Remove states
const statesToRemove = [
  '  const [stakeSelectedPlan, setStakeSelectedPlan] = useState<any>(null);\n',
  '  const [stakeAmount, setStakeAmount] = useState("");\n',
  '  const [stakeChecked, setStakeChecked] = useState(false);\n',
  '  const [stakeLoading, setStakeLoading] = useState(false);\n',
  '  const [stakeWalletBalance, setStakeWalletBalance] = useState("0");\n',
  '  const [currentStaking, setCurrentStaking] = useState("0");\n',
  '  const [stakeBalanceLoading, setStakeBalanceLoading] = useState(false);\n',
  '  const [currentStakingLoading, setCurrentStakingLoading] = useState(false);\n',
  '  const [stakeError, setStakeError] = useState("");\n'
];
statesToRemove.forEach(state => {
  file = file.replace(state, '');
});

// 3. Replace openStakeSheet
const openStakeSheetStart = file.indexOf('  const openStakeSheet = async (plan: any) => {');
const submitStakeStart = file.indexOf('  const submitStake = async () => {');
if (openStakeSheetStart !== -1 && submitStakeStart !== -1) {
  const replacement = `  const openStakeSheet = (plan: any) => {
    planSheetRef.current?.close();
    setTimeout(() => {
      NavigationService.navigate('StakingPurchase', { plan });
    }, 400);
  };\n\n`;
  file = file.substring(0, openStakeSheetStart) + replacement + file.substring(submitStakeStart);
}

// 4. Remove submitStake, finalSubmitStake, estDailyReturn
const removeBlock = (startStr, endStr) => {
  const start = file.indexOf(startStr);
  if (start === -1) return;
  const end = file.indexOf(endStr, start);
  if (end === -1) return;
  file = file.substring(0, start) + file.substring(end + endStr.length);
};

removeBlock('  const submitStake = async () => {', '  };\n\n');
removeBlock('  const finalSubmitStake = async () => {', '  };\n\n');
removeBlock('  const estDailyReturn = useMemo(() => {', '  }, [stakeAmount, stakeSelectedPlan]);\n\n');

// 5. Remove RBSheets from JSX
removeBlock('      <RBSheet\n        ref={stakeSheetRef}', '</RBSheet>\n\n');
removeBlock('      <RBSheet\n        ref={confirmOverviewSheetRef}', '</RBSheet>\n\n');

fs.writeFileSync('/Users/wrathcodetechnology/Desktop/Projects/AGCE/src/screens/staking/StakingDashboard.tsx', file);
