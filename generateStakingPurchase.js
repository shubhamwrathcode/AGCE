const fs = require('fs');

const file = fs.readFileSync('/tmp/dashboard.tsx', 'utf-8');

const getSection = (startStr, endStr) => {
  const start = file.indexOf(startStr);
  const end = file.indexOf(endStr, start);
  if (start === -1 || end === -1) return '';
  return file.substring(start, end + endStr.length);
};

const scrollContent = getSection('<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}>', '</ScrollView>');
const rbSheetContent = getSection('<RBSheet\n        ref={confirmOverviewSheetRef}', '</RBSheet>');

const template = `import React, { useRef, useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import FastImage from 'react-native-fast-image';
import RBSheet from 'react-native-raw-bottom-sheet';
import { AppSafeAreaView, AppText } from '../../shared';
import { colors } from '../../theme/colors';
import { back_ic, closeIcon, checkIc, usdtIcon } from '../../helper/ImageAssets';
import { fontFamilyMedium, fontFamilySemiBold } from '../../theme/typography';
import NavigationService from '../../navigation/NavigationService';
import { IMAGE_BASE_URL } from '../../helper/Constants';
import { appOperation } from '../../appOperation';
import { useDispatch } from 'react-redux';
import { getStaking } from '../../actions/homeActions';

const StakingPurchase = ({ route, navigation }: any) => {
  const { plan: stakeSelectedPlan } = route.params || {};

  const confirmOverviewSheetRef = useRef<any>(null);
  const dispatch = useDispatch<any>();

  const [stakeAmount, setStakeAmount] = useState("");
  const [stakeChecked, setStakeChecked] = useState(false);
  const [stakeError, setStakeError] = useState("");
  const [stakeLoading, setStakeLoading] = useState(false);
  const [stakeWalletBalance, setStakeWalletBalance] = useState("0");
  const [currentStaking, setCurrentStaking] = useState("0");
  const [stakeBalanceLoading, setStakeBalanceLoading] = useState(false);
  const [currentStakingLoading, setCurrentStakingLoading] = useState(false);

  useEffect(() => {
    if (stakeSelectedPlan) {
      fetchBalances();
    }
  }, [stakeSelectedPlan]);

  const fetchBalances = async () => {
    setStakeBalanceLoading(true);
    try {
      let currencyId = stakeSelectedPlan?.currencyId || stakeSelectedPlan?.currency_id;
      if (!currencyId) {
        const walletRes: any = await appOperation.customer.user_main_wallet("earning");
        if (walletRes?.success && Array.isArray(walletRes.data)) {
          const row = walletRes.data.find((item: any) => String(item.coin?.short_name).toUpperCase() === String(stakeSelectedPlan.currency).toUpperCase());
          currencyId = row?.coin?.currency_id || row?.currency_id || row?.coin?._id;
        }
      }

      if (currencyId) {
        const balRes: any = await appOperation.customer.Staking_UserBalance(currencyId, "earning");
        if (balRes?.success && balRes.data) {
          const raw = balRes.data.balance ?? balRes.data.available ?? balRes.data.Balance ?? "0";
          setStakeWalletBalance(String(raw?.["$numberDecimal"] || raw));
        } else {
          setStakeWalletBalance("0");
        }
      } else {
        setStakeWalletBalance("0");
      }
    } catch (e) {
      setStakeWalletBalance("0");
    } finally {
      setStakeBalanceLoading(false);
    }

    setCurrentStakingLoading(true);
    try {
      const posRes: any = await appOperation.customer.Staking_MyPositions(1, 100);
      if (posRes?.success && Array.isArray(posRes.data)) {
        const activeMatches = posRes.data.filter((pos: any) =>
          String(pos?.status || "").toUpperCase() === "ACTIVE" &&
          (String(pos.packageId?._id || pos.packageId || "") === String(stakeSelectedPlan._id || stakeSelectedPlan.id) ||
            String(pos.currency || "").toUpperCase() === String(stakeSelectedPlan.currency).toUpperCase())
        );

        const total = activeMatches.reduce((sum: number, pos: any) => sum + (parseFloat(pos.investAmount) || 0), 0);
        setCurrentStaking(String(total));
      }
    } catch (e) {
      setCurrentStaking("0");
    } finally {
      setCurrentStakingLoading(false);
    }
  };

  const submitStake = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      setStakeError("Please enter a valid amount");
      return;
    }

    const amountNum = parseFloat(stakeAmount);
    const minAmount = parseFloat(stakeSelectedPlan?.minAmount || "0");
    if (amountNum < minAmount) {
      setStakeError(\`Minimum staking amount is \${minAmount} \${stakeSelectedPlan?.currency}\`);
      return;
    }

    const maxAmount = parseFloat(stakeSelectedPlan?.maxAmount || "0");
    if (maxAmount > 0 && amountNum > maxAmount) {
      setStakeError(\`Maximum staking amount is \${maxAmount} \${stakeSelectedPlan?.currency}\`);
      return;
    }

    if (amountNum > parseFloat(stakeWalletBalance)) {
      setStakeError(\`Insufficient balance. Available: \${stakeWalletBalance} \${stakeSelectedPlan?.currency}\`);
      return;
    }

    setStakeError("");
    confirmOverviewSheetRef.current?.open();
  };

  const finalSubmitStake = async () => {
    setStakeLoading(true);
    setStakeError("");
    try {
      const amountNum = parseFloat(stakeAmount);
      const res: any = await appOperation.customer.Staking_Subscribe({
        packageId: stakeSelectedPlan?._id || stakeSelectedPlan?.id,
        investAmount: amountNum,
        walletType: "earning"
      });

      if (res?.success) {
        Alert.alert("Success", res?.message || "Staking subscription successful.");
        confirmOverviewSheetRef.current?.close();
        dispatch(getStaking());
        NavigationService.goBack();
      } else {
        setStakeError(res?.message || "Staking failed. Please try again.");
      }
    } catch (e) {
      setStakeError("Staking failed. Please try again.");
    } finally {
      setStakeLoading(false);
    }
  };

  const estDailyReturn = useMemo(() => {
    if (!stakeAmount || !stakeSelectedPlan?.returnPercentage) return "0";
    const amountNum = parseFloat(stakeAmount) || 0;
    const apr = parseFloat(stakeSelectedPlan.returnPercentage) || 0;
    const dailyReturn = (amountNum * apr / 100) / 365;
    if (dailyReturn >= 0.01) return dailyReturn.toFixed(4);
    if (dailyReturn >= 0.0001) return dailyReturn.toFixed(6);
    return dailyReturn.toFixed(8);
  }, [stakeAmount, stakeSelectedPlan]);

  if (!stakeSelectedPlan) return null;

  return (
    <AppSafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => NavigationService.goBack()}>
          <FastImage source={back_ic} style={styles.icon} resizeMode="contain" tintColor={colors.black} />
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>{stakeSelectedPlan.currency} Staking</AppText>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20, paddingTop: 20 }}>
        ${scrollContent.replace(/<View style=\{\{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 \}\}>[\s\S]*?<\/TouchableOpacity>\s*<\/View>/, '').trim()}
      
      ${rbSheetContent}
    </AppSafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    height: 56,
  },
  iconBtn: {
    padding: 8,
    width: 36,
  },
  icon: {
    width: 20,
    height: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fontFamilySemiBold,
    color: colors.black,
  },
});

export default StakingPurchase;
`;

fs.writeFileSync('/Users/wrathcodetechnology/Desktop/Projects/AGCE/src/screens/staking/StakingPurchase.tsx', template);
