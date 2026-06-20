import React, { useRef, useState, useEffect, useMemo } from 'react';
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
import { showError, showSuccess } from '../../helper/logger';

const StakingPurchase = ({ route, navigation }: any) => {
  const { plan: stakeSelectedPlan } = route.params || {};

  const confirmOverviewSheetRef = useRef<any>(null);
  const dispatch = useDispatch<any>();

  const [stakeAmount, setStakeAmount] = useState("");
  const [stakeChecked, setStakeChecked] = useState(false);
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

  const submitStake = () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      showError("Please enter a valid amount");
      return;
    }

    const amountNum = parseFloat(stakeAmount);
    const minAmount = stakeSelectedPlan?.minimumAmount || 0;
    const maxAmount = stakeSelectedPlan?.maximumAmount || Infinity;

    if (amountNum < minAmount) {
      showError(`Minimum staking amount is ${minAmount} ${stakeSelectedPlan?.currency}`);
      return;
    }

    if (amountNum > maxAmount) {
      showError(`Maximum staking amount is ${maxAmount} ${stakeSelectedPlan?.currency}`);
      return;
    }

    if (amountNum > parseFloat(stakeWalletBalance)) {
      showError(`Insufficient balance. Available: ${stakeWalletBalance} ${stakeSelectedPlan?.currency}`);
      return;
    }

    confirmOverviewSheetRef.current?.open();
  };

  const finalSubmitStake = async () => {
    setStakeLoading(true);
    try {
      const amountNum = parseFloat(stakeAmount);
      const payload = {
        packageId: stakeSelectedPlan?._id || stakeSelectedPlan?.packageId || stakeSelectedPlan?.id,
        investAmount: amountNum,
        walletType: "earning"
      };

      console.log("=== STAKING API CALL ===");
      console.log("URL:", "staking/subscribe");
      console.log("PAYLOAD:", JSON.stringify(payload, null, 2));

      const res: any = await appOperation.customer.Staking_Subscribe(payload);

      console.log("RESPONSE:", JSON.stringify(res, null, 2));
      console.log("========================");

      if (res?.success) {
        showSuccess(res?.message || "Staking subscription successful.");
        confirmOverviewSheetRef.current?.close();
        dispatch(getStaking());
        NavigationService.goBack();
      } else {
        showError(res?.message || "Staking failed. Please try again.");
      }
    } catch (e: any) {
      showError(e?.message || "Staking failed. Please try again.");
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

      <View style={{ flex: 1, paddingTop: 10 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}>


          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
            <View>
              <AppText style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>Protocol</AppText>
              <AppText style={{ fontSize: 15, fontFamily: fontFamilySemiBold, color: colors.black }}>{stakeSelectedPlan.currency}</AppText>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <AppText style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>Est. APR</AppText>
              <AppText style={{ fontSize: 15, fontFamily: fontFamilySemiBold, color: '#03a66d' }}>{stakeSelectedPlan.returnPercentage}%</AppText>
            </View>
          </View>

          <View style={{ marginBottom: 20 }}>
            <AppText style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>Amount</AppText>
            <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#eee', borderRadius: 8, height: 48, paddingHorizontal: 12 }}>
              <TextInput
                style={{ flex: 1, fontSize: 14, color: colors.black, height: '100%' }}
                placeholder={`Min. ${stakeSelectedPlan.minAmount}`}
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={stakeAmount}
                onChangeText={setStakeAmount}
              />
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <AppText style={{ fontSize: 14, fontFamily: fontFamilySemiBold, color: colors.black, marginRight: 10 }}>{stakeSelectedPlan.currency}</AppText>
                <View style={{ width: 1, height: 14, backgroundColor: '#eee', marginRight: 10 }} />
                <TouchableOpacity onPress={() => setStakeAmount(stakeWalletBalance)}>
                  <AppText style={{ fontSize: 14, color: '#f0b90b', fontFamily: fontFamilyMedium }}>Max</AppText>
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ marginTop: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <AppText style={{ fontSize: 12, color: '#888' }}>Available</AppText>
                <AppText style={{ fontSize: 12, fontFamily: fontFamilySemiBold, color: colors.black }}>
                  {stakeBalanceLoading ? "Loading..." : `${parseFloat(stakeWalletBalance).toFixed(4).replace(/\.?0+$/, '') || '0'} ${stakeSelectedPlan.currency}`}
                </AppText>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <AppText style={{ fontSize: 12, color: '#888' }}>Your current staking</AppText>
                <AppText style={{ fontSize: 12, fontFamily: fontFamilySemiBold, color: colors.black }}>
                  {currentStakingLoading ? "Loading..." : `${parseFloat(currentStaking).toFixed(4).replace(/\.?0+$/, '') || '0'} ${stakeSelectedPlan.currency}`}
                </AppText>
              </View>
            </View>
          </View>

          {/* Est APR */}
          <View style={{ marginBottom: 20 }}>
            <AppText style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>Est. APR</AppText>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 12 }}>
              <AppText style={{ fontSize: 14, color: '#888' }}>Standard APR</AppText>
              <AppText style={{ fontSize: 14, fontFamily: fontFamilySemiBold, color: colors.black }}>{stakeSelectedPlan.returnPercentage}%</AppText>
            </View>
          </View>

          {/* Est Daily Return */}
          <View style={{ marginBottom: 24 }}>
            <AppText style={{ fontSize: 13, color: colors.black, fontFamily: fontFamilySemiBold, marginBottom: 8 }}>Est. Daily Return</AppText>
            <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 12 }}>
              <FastImage source={{ uri: `${IMAGE_BASE_URL}${stakeSelectedPlan.iconPath || stakeSelectedPlan.image || ''}` }} style={{ width: 24, height: 24, marginRight: 10 }} resizeMode="contain" />
              <AppText style={{ fontSize: 14, fontFamily: fontFamilySemiBold, color: '#03a66d' }}>{estDailyReturn} {stakeSelectedPlan.currency}</AppText>
            </View>
          </View>

          {/* Trading Rules */}
          <View style={{ marginBottom: 24 }}>
            <View style={{ alignSelf: 'flex-start', paddingBottom: 4, marginBottom: 16 }}>
              <AppText style={{ fontSize: 14, fontFamily: fontFamilySemiBold, color: colors.black }}>Trading Rules</AppText>
            </View>

            <View style={{ paddingLeft: 4 }}>
              {/* Vertical Line Background */}
              <View style={{ position: 'absolute', left: 7.5, top: 4, bottom: 24, width: 1, backgroundColor: '#ddd' }} />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.black, marginRight: 12 }} />
                  <AppText style={{ fontSize: 13, color: '#888' }}>Staking Time</AppText>
                </View>
                <AppText style={{ fontSize: 13, color: '#888' }}>Now</AppText>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#ddd', marginRight: 12 }} />
                  <AppText style={{ fontSize: 13, color: '#888' }}>Return Accrues</AppText>
                </View>
                <AppText style={{ fontSize: 13, color: '#888' }}>D+1</AppText>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#ddd', marginRight: 12 }} />
                  <AppText style={{ fontSize: 13, color: '#888' }}>{stakeSelectedPlan.currency} Distributes</AppText>
                </View>
                <AppText style={{ fontSize: 13, color: '#888' }}>Daily</AppText>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#ddd', marginRight: 12 }} />
                  <AppText style={{ fontSize: 13, color: '#888' }}>Unbonding Period</AppText>
                </View>
                <AppText style={{ fontSize: 13, color: '#888' }}>About {stakeSelectedPlan.unbondingPeriodDays ?? stakeSelectedPlan.unbondingPeriod ?? 0} day(s)</AppText>
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, marginTop: 8 }}>
              <AppText style={{ fontSize: 13, color: '#888' }}>Early Withdrawal Penalty</AppText>
              <AppText style={{ fontSize: 13, fontFamily: fontFamilySemiBold, color: colors.black }}>{stakeSelectedPlan.earlyWithdrawalPenalty || 10}%</AppText>
            </View>
          </View>

          {/* Agreement & Footer */}
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}
            onPress={() => setStakeChecked(!stakeChecked)}
          >
            <View style={{ width: 16, height: 16, borderRadius: 4, borderWidth: 1, borderColor: colors.black, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
              {stakeChecked && <FastImage source={checkIc} style={{ width: 10, height: 10 }} resizeMode="contain" />}
            </View>
            <AppText style={{ fontSize: 12, color: colors.black }}>I have read and accepted the <AppText style={{ color: '#f0b90b', textDecorationLine: 'underline' }}>Staking User Agreement</AppText></AppText>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 20 }}>
            <TouchableOpacity
              style={{ flex: 1, backgroundColor: (!stakeAmount || !stakeChecked || stakeLoading) ? '#f0f0f5' : colors.orangeTheme, paddingVertical: 14, borderRadius: 8, alignItems: 'center' }}
              onPress={submitStake}
              disabled={!stakeAmount || !stakeChecked || stakeLoading}
            >
              <AppText style={{ fontSize: 14, fontFamily: fontFamilySemiBold, color: (!stakeAmount || !stakeChecked || stakeLoading) ? '#b7b7b7' : colors.black }}>
                {stakeLoading ? "Processing..." : "Confirm"}
              </AppText>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </View>

      <RBSheet
        ref={confirmOverviewSheetRef}
        keyboardAvoidingViewEnabled={false}
        dragFromTopOnly={true}
        {...({ customModalProps: { statusBarTranslucent: true } } as any)}
        closeOnDragDown={true}
        closeOnPressMask={true}
        height={730}
        customStyles={{
          wrapper: { backgroundColor: "rgba(0,0,0,0.5)" },
          draggableIcon: { backgroundColor: "#ccc" },
          container: { borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: colors.white }
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <FastImage source={stakeSelectedPlan?.iconPath ? { uri: `${IMAGE_BASE_URL}${stakeSelectedPlan.iconPath}` } : usdtIcon} style={{ width: 24, height: 24, marginRight: 8 }} resizeMode="contain" />
            <AppText style={{ fontSize: 18, fontFamily: fontFamilySemiBold, color: colors.black }}>Staking Overview</AppText>
          </View>
          <TouchableOpacity onPress={() => confirmOverviewSheetRef.current?.close()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <FastImage source={closeIcon} style={{ width: 16, height: 16 }} resizeMode="contain" tintColor="#888" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
          <AppText style={{ fontSize: 14, color: '#888', marginBottom: 20 }}>
            You are about to stake the following package. Please review the details.
          </AppText>

          <View style={{ backgroundColor: '#f9f9f9', padding: 16, borderRadius: 12, marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
              <AppText style={{ fontSize: 14, color: '#888', fontFamily: fontFamilyMedium }}>Currency</AppText>
              <AppText style={{ fontSize: 14, color: colors.black, fontFamily: fontFamilyMedium }}>{stakeSelectedPlan?.currency || "—"}</AppText>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
              <AppText style={{ fontSize: 14, color: '#888', fontFamily: fontFamilyMedium }}>Currency Name</AppText>
              <AppText style={{ fontSize: 14, color: colors.black, fontFamily: fontFamilyMedium }}>{stakeSelectedPlan?.currencyFullName || stakeSelectedPlan?.currency || "—"}</AppText>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
              <AppText style={{ fontSize: 14, color: '#888', fontFamily: fontFamilyMedium }}>Staking Type</AppText>
              <AppText style={{ fontSize: 14, color: colors.black, fontFamily: fontFamilyMedium }}>Locked Staking</AppText>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
              <AppText style={{ fontSize: 14, color: '#888', fontFamily: fontFamilyMedium }}>Staking Amount</AppText>
              <AppText style={{ fontSize: 14, color: '#03a66d', fontFamily: fontFamilyMedium }}>{Number(stakeAmount || 0).toFixed(2).replace(/\.?0+$/, '') || stakeAmount} {stakeSelectedPlan?.currency}</AppText>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
              <AppText style={{ fontSize: 14, color: '#888', fontFamily: fontFamilyMedium }}>Est. APR</AppText>
              <AppText style={{ fontSize: 14, color: '#03a66d', fontFamily: fontFamilyMedium }}>{stakeSelectedPlan?.returnPercentage ?? "—"}%</AppText>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
              <AppText style={{ fontSize: 14, color: '#888', fontFamily: fontFamilyMedium }}>Duration</AppText>
              <AppText style={{ fontSize: 14, color: colors.black, fontFamily: fontFamilyMedium }}>{stakeSelectedPlan?.duration ?? stakeSelectedPlan?.durationDays} Days</AppText>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
              <AppText style={{ fontSize: 14, color: '#888', fontFamily: fontFamilyMedium }}>Est. Daily Return</AppText>
              <AppText style={{ fontSize: 14, color: '#03a66d', fontFamily: fontFamilyMedium }}>{estDailyReturn} {stakeSelectedPlan?.currency}</AppText>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
              <AppText style={{ fontSize: 14, color: '#888', fontFamily: fontFamilyMedium }}>Your current staking</AppText>
              <AppText style={{ fontSize: 14, color: colors.black, fontFamily: fontFamilyMedium }}>{Number(currentStaking || 0).toFixed(2).replace(/\.?0+$/, '') || currentStaking} {stakeSelectedPlan?.currency}</AppText>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
              <AppText style={{ fontSize: 14, color: '#888', fontFamily: fontFamilyMedium }}>Return Accrues</AppText>
              <AppText style={{ fontSize: 14, color: colors.black, fontFamily: fontFamilyMedium }}>D+1</AppText>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
              <AppText style={{ fontSize: 14, color: '#888', fontFamily: fontFamilyMedium }}>Reward Distributes</AppText>
              <AppText style={{ fontSize: 14, color: colors.black, fontFamily: fontFamilyMedium }}>Daily</AppText>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
              <AppText style={{ fontSize: 14, color: '#888', fontFamily: fontFamilyMedium }}>Unbonding Period</AppText>
              <AppText style={{ fontSize: 14, color: colors.black, fontFamily: fontFamilyMedium }}>About {stakeSelectedPlan?.unbondingPeriodDays ?? stakeSelectedPlan?.unbondingPeriod ?? 0} day(s)</AppText>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
              <AppText style={{ fontSize: 14, color: '#888', fontFamily: fontFamilyMedium }}>Wallet</AppText>
              <AppText style={{ fontSize: 14, color: colors.black, fontFamily: fontFamilyMedium }}>Earning Wallet</AppText>
            </View>
            {stakeSelectedPlan?.earlyWithdrawalPenalty > 0 && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
                <AppText style={{ fontSize: 14, color: '#888', fontFamily: fontFamilyMedium }}>Early Withdrawal Penalty</AppText>
                <AppText style={{ fontSize: 14, color: colors.black, fontFamily: fontFamilyMedium }}>{stakeSelectedPlan.earlyWithdrawalPenalty}%</AppText>
              </View>
            )}
          </View>


          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 20 }}>
            <TouchableOpacity
              style={{ flex: 1, backgroundColor: stakeLoading ? '#f0f0f5' : colors.orangeTheme, paddingVertical: 14, borderRadius: 8, alignItems: 'center' }}
              onPress={finalSubmitStake}
              disabled={stakeLoading}
            >
              <AppText style={{ fontSize: 14, fontFamily: fontFamilySemiBold, color: stakeLoading ? '#b7b7b7' : colors.black }}>
                {stakeLoading ? "Processing..." : "Confirm"}
              </AppText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </RBSheet>
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
