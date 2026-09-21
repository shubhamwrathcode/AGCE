import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  StyleSheet,
  Platform,
} from 'react-native';
import { KeyboardAwareScrollView } from '@codler/react-native-keyboard-aware-scroll-view';
import RBSheet from 'react-native-raw-bottom-sheet';
import FastImage from 'react-native-fast-image';
import { AppText, BOLD, FOURTEEN, MEDIUM, SEMI_BOLD, TEN, THIRTEEN, TWELVE } from '../../../common';
import { colors, darkTheme } from '../../../theme/colors';
import {
  decNum,
  getDecimalPlaces,
  getTickSize,
  sanitizeIncrementInput,
} from '../../../helper/futuresUtils';
import { REMOVE, infoIcon } from '../../../helper/ImageAssets';

const FuturesAdjustMarginModal = ({
  visible,
  onClose,
  onConfirm,
  isDark,
  themeColors,
  loading,
  pos,
  selectedCoin,
  availableBalance = 0,
}) => {
  const [activeTab, setActiveTab] = useState('Add'); // 'Add' | 'Remove'
  const [amount, setAmount] = useState('');
  const sheetRef = useRef(null);
  const inputBg = isDark ? darkTheme.darkThemeInputColor : '#F4F4F4';

  const isLong = String(pos?.side ?? '').toUpperCase() === 'LONG' || String(pos?.side ?? '').toUpperCase() === 'BUY';
  const sideLabel = isLong ? 'Long' : 'Short';
  const sideColor = isLong ? colors.green : colors.red;
  const sideBg = isLong ? 'rgba(38, 166, 154, 0.15)' : 'rgba(235, 77, 92, 0.15)';

  const currentMargin = Number(pos?.isolated_margin_allocated ?? pos?.initial_margin ?? pos?.margin) || 0;
  const entryPrice = Number(pos?.average_entry_price ?? pos?.entry_price) || 0;
  const markPrice = Number(pos?.mark_price ?? pos?.computedMark) || entryPrice;
  const qty = Number(pos?.quantity ?? pos?.filled_quantity) || 0;
  const leverage = Number(pos?.leverage) || 1;

  // Maintenance margin calculation
  const mmRate = Number(pos?.maintenance_margin_rate) || 0.005;
  const maintenanceMargin = Number(pos?.maintenance_margin) || (entryPrice * qty * mmRate) || (currentMargin * 0.1);

  // PNL
  const sideSign = isLong ? 1 : -1;
  const pnl = Number(pos?.unrealized_pnl) || ((markPrice - entryPrice) * qty * sideSign) || 0;

  // Max Addable: user's available futures wallet balance
  const maxAddable = Math.max(0, Number(availableBalance) || 0);

  // Max Removable: can remove up to currentMargin - maintenanceMargin + min(0, pnl) (clamped >= 0)
  const maxRemovable = Math.max(
    0,
    currentMargin - maintenanceMargin + Math.min(0, pnl)
  );

  const maxAllowed = activeTab === 'Add' ? maxAddable : maxRemovable;

  useEffect(() => {
    if (visible) {
      setAmount('');
      setActiveTab('Add');
      const timer = setTimeout(() => {
        sheetRef.current?.open();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      sheetRef.current?.close();
    }
  }, [visible]);

  const numAmount = Number(amount) || 0;
  const projectedMargin = activeTab === 'Add'
    ? currentMargin + numAmount
    : Math.max(0, currentMargin - numAmount);

  // Projected Margin Ratio: mm / (projectedMargin + pnl) * 100
  const marginEquity = projectedMargin + pnl;
  const projectedMarginRatio = marginEquity > 0
    ? (maintenanceMargin / marginEquity) * 100
    : 100;

  // Projected Liquidation Price
  let projectedLiqPrice = 0;
  if (qty > 0) {
    if (isLong) {
      projectedLiqPrice = Math.max(0, entryPrice - ((projectedMargin - maintenanceMargin) / qty));
    } else {
      projectedLiqPrice = Math.max(0, entryPrice + ((projectedMargin - maintenanceMargin) / qty));
    }
  }

  const handleMaxPress = () => {
    if (maxAllowed <= 0) {
      setAmount('');
      return;
    }
    setAmount(parseFloat(maxAllowed.toFixed(4)).toString());
  };

  const handleConfirm = () => {
    if (!numAmount || numAmount <= 0 || numAmount > maxAllowed) return;
    if (onConfirm) {
      onConfirm({
        position_id: pos?._id || pos?.id,
        symbol: pos?.symbol,
        amount: numAmount,
        type: activeTab === 'Add' ? 'ADD' : 'REMOVE',
        side: pos?.side,
      });
    }
  };

  const symbolDisplay = pos?.symbol
    ? pos.symbol.includes('-PERP')
      ? pos.symbol.replace('-PERP', '').replace('USDT', '/USDT')
      : pos.symbol
    : 'BNB/USDT';

  const isValidAmount = numAmount > 0 && numAmount <= maxAllowed;

  return (
    <RBSheet
      ref={sheetRef}
      keyboardAvoidingViewEnabled={true}
      customModalProps={{ statusBarTranslucent: true }}
      closeOnDragDown={true}
      closeOnPressMask={true}
      height={520}
      animationType="slide"
      onClose={onClose}
      customStyles={{
        container: {
          backgroundColor: themeColors.background,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          paddingHorizontal: 20,
        },
        wrapper: {
          backgroundColor: '#0006',
        },
        draggableIcon: {
          backgroundColor: themeColors.themeBorderColor || '#ccc',
          width: 40,
        },
      }}
    >
      <KeyboardAwareScrollView
        enableOnAndroid={true}
        showsVerticalScrollIndicator={false}
        extraScrollHeight={Platform.OS === 'ios' ? 40 : 80}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, paddingBottom: 6 }}>
          <AppText weight={BOLD} style={{ fontSize: 18, color: themeColors.text }}>
            Adjust margin
          </AppText>
          <TouchableOpacity onPress={() => sheetRef.current?.close()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <FastImage source={REMOVE} style={{ width: 14, height: 14 }} tintColor={themeColors.text} resizeMode="contain" />
          </TouchableOpacity>
        </View>

        {/* Subheader */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }}>
          <AppText style={{ color: themeColors.text, fontSize: 13 }} weight={MEDIUM}>
            {symbolDisplay} · Isolated
          </AppText>
          <View style={{ backgroundColor: sideBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
            <AppText style={{ color: sideColor, fontSize: 11 }} weight={SEMI_BOLD}>
              {sideLabel}
            </AppText>
          </View>
        </View>

        {/* Tabs: Add Margin / Remove Margin */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: isDark ? '#181A20' : '#EAECEF',
            borderRadius: 8,
            padding: 4,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
          }}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: 9,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 6,
              backgroundColor: activeTab === 'Add' ? (isDark ? '#2B313A' : '#FFFFFF') : 'transparent',
              shadowColor: activeTab === 'Add' ? '#000' : 'transparent',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: activeTab === 'Add' ? 0.2 : 0,
              shadowRadius: 2,
              elevation: activeTab === 'Add' ? 2 : 0,
            }}
            activeOpacity={0.8}
            onPress={() => {
              setActiveTab('Add');
              setAmount('');
            }}
          >
            <AppText
              style={{
                color: activeTab === 'Add' ? (isDark ? '#FFFFFF' : '#1E2329') : (isDark ? '#848E9C' : '#707A8A'),
                fontSize: 13,
              }}
              weight={activeTab === 'Add' ? BOLD : MEDIUM}
            >
              Add Margin
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: 9,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 6,
              backgroundColor: activeTab === 'Remove' ? (isDark ? '#2B313A' : '#FFFFFF') : 'transparent',
              shadowColor: activeTab === 'Remove' ? '#000' : 'transparent',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: activeTab === 'Remove' ? 0.2 : 0,
              shadowRadius: 2,
              elevation: activeTab === 'Remove' ? 2 : 0,
            }}
            activeOpacity={0.8}
            onPress={() => {
              setActiveTab('Remove');
              setAmount('');
            }}
          >
            <AppText
              style={{
                color: activeTab === 'Remove' ? (isDark ? '#FFFFFF' : '#1E2329') : (isDark ? '#848E9C' : '#707A8A'),
                fontSize: 13,
              }}
              weight={activeTab === 'Remove' ? BOLD : MEDIUM}
            >
              Remove Margin
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Amount Input */}
        <AppText style={{ color: themeColors.secondaryText, fontSize: 12, marginBottom: 6 }} weight={MEDIUM}>
          Amount (USDT)
        </AppText>
        <View
          style={{
            backgroundColor: inputBg,
            borderRadius: 8,
            paddingHorizontal: 12,
            height: 44,
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 4,
          }}
        >
          <TextInput
            style={{ color: themeColors.text, fontSize: 14, padding: 0, flex: 1 }}
            placeholder="Enter amount"
            placeholderTextColor={themeColors.secondaryText}
            keyboardType="decimal-pad"
            value={amount}
            editable={!loading}
            onChangeText={(val) => setAmount(sanitizeIncrementInput(val, 0.0001))}
          />
          <AppText style={{ color: themeColors.secondaryText, fontSize: 13, marginRight: 10 }}>
            USDT
          </AppText>
          <TouchableOpacity onPress={handleMaxPress} disabled={loading} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <AppText style={{ color: colors.orangeTheme || '#F0B90B', fontSize: 13 }} weight={SEMI_BOLD}>
              Max
            </AppText>
          </TouchableOpacity>
        </View>
        <AppText style={{ color: themeColors.secondaryText, fontSize: 11, marginBottom: 16 }}>
          {activeTab === 'Add'
            ? `Max Available ${maxAddable.toFixed(8)} USDT`
            : `Max Removable ${maxRemovable.toFixed(8)} USDT`}
        </AppText>

        {/* Stats Table */}
        <View style={{ gap: 8, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <AppText style={{ color: themeColors.secondaryText, fontSize: 13 }}>
              Currently Assigned Margin
            </AppText>
            <AppText style={{ color: themeColors.text, fontSize: 13 }} weight={MEDIUM}>
              {currentMargin.toFixed(5)} USDT
            </AppText>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <AppText style={{ color: themeColors.secondaryText, fontSize: 13 }}>
              {activeTab === 'Add' ? 'Max addable' : 'Max removable'}
            </AppText>
            <AppText style={{ color: themeColors.text, fontSize: 13 }} weight={MEDIUM}>
              {maxAllowed.toFixed(8)} USDT
            </AppText>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <AppText style={{ color: themeColors.secondaryText, fontSize: 13 }}>
              Margin Ratio
            </AppText>
            <AppText style={{ color: themeColors.text, fontSize: 13 }} weight={MEDIUM}>
              {projectedMarginRatio > 0 ? `${projectedMarginRatio.toFixed(4)}%` : '—'}
            </AppText>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <AppText style={{ color: themeColors.secondaryText, fontSize: 13 }}>
              {activeTab === 'Add' ? 'Est. Liq. Price after increase' : 'Est. Liq. Price after decrease'}
            </AppText>
            <AppText style={{ color: themeColors.text, fontSize: 13 }} weight={MEDIUM}>
              {projectedLiqPrice > 0 ? `${projectedLiqPrice.toFixed(3)} USDT` : '—'}
            </AppText>
          </View>
        </View>

        {/* Info Banner */}
        <View
          style={{
            backgroundColor: isDark ? 'rgba(30, 42, 60, 0.7)' : '#EDF4FE',
            padding: 12,
            borderRadius: 8,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            marginBottom: 20,
          }}
        >
          <View
            style={{
              width: 18,
              height: 18,
              borderRadius: 9,
              backgroundColor: '#2F80ED',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppText style={{ color: colors.white, fontSize: 11 }} weight={BOLD}>
              i
            </AppText>
          </View>
          <AppText style={{ color: isDark ? '#BDD7F5' : '#2D629D', fontSize: 12, flex: 1 }}>
            {activeTab === 'Add'
              ? 'Adds USDT from your futures wallet into this Isolated position.'
              : 'Removes USDT from this Isolated position back into your futures wallet.'}
          </AppText>
        </View>

        {/* Confirm Button */}
        <TouchableOpacity
          onPress={handleConfirm}
          disabled={!isValidAmount || loading}
          style={{
            backgroundColor: colors.orangeTheme || '#F0B90B',
            borderRadius: 8,
            paddingVertical: 14,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: (!isValidAmount || loading) ? 0.5 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <AppText weight={BOLD} style={{ color: colors.white, fontSize: 15 }}>
              Confirm
            </AppText>
          )}
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </RBSheet>
  );
};

export default FuturesAdjustMarginModal;
