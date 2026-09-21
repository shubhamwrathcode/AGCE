import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import {
  AppText,
  SIXTEEN,
  FOURTEEN,
  TWELVE,
  TEN,
  SEMI_BOLD,
  BOLD,
  MEDIUM,
} from '../../../shared';
import { colors } from '../../../theme/colors';
import { useTheme } from '../../../hooks/useTheme';
import { appOperation } from '../../../appOperation';
import { decNum } from './helpers/optionsDataHelpers';
import { MARGIN_TRANSFER_SCREEN, OPTIONS_PNL_ANALYSIS_SCREEN } from '../../../navigation/routes';
import { futureTransferIcon, downIcon, historyIcon } from '../../../helper/ImageAssets';
import NavigationService from '../../../navigation/NavigationService';

function fmtUsdt(val) {
  const n = decNum(val);
  if (!Number.isFinite(n) || n === 0) return '0.0000 USDT';
  return `${n.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })} USDT`;
}

function fmtPercent(val) {
  const n = decNum(val);
  if (!Number.isFinite(n) || n === 0) return '0.00%';
  return `${n.toFixed(2)}%`;
}

const OptionsAccountSection = ({ accountUpdate = null, style, hideHeader = false, onClose = null }) => {
  const { colors: themeColors, isDark } = useTheme();
  const isFocused = useIsFocused();

  const [walletRest, setWalletRest] = useState(null);
  const [marginRatioExpanded, setMarginRatioExpanded] = useState(true);
  const [totalEquityExpanded, setTotalEquityExpanded] = useState(true);

  const fetchWallet = useCallback(async () => {
    try {
      const res = await appOperation.customer.optionsWallet();
      if (res?.data) {
        setWalletRest(res.data);
      } else if (res?.code === 200 && res?.result) {
        setWalletRest(res.result);
      } else if (res && typeof res === 'object') {
        setWalletRest(res);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      fetchWallet();
    }
  }, [isFocused, fetchWallet]);

  // Color palette for high contrast and clean presentation
  const labelColor = isDark ? '#848E9C' : '#707A8A';
  const valueColor = isDark ? '#EAECEF' : '#1E2026';
  const headerColor = isDark ? '#FFFFFF' : '#1E2026';
  const cardBg = isDark ? '#1E2026' : '#F5F7FA';
  const btnBg = isDark ? '#2B313A' : '#EEF0F2';
  const btnBorder = isDark ? '#363D47' : '#DDE2E5';

  // Merge WS updates with REST wallet data
  const accountBalance = accountUpdate?.margin_balance ?? accountUpdate?.total_equity ?? walletRest?.total_balance ?? 0;
  const marginRatio = accountUpdate?.margin_ratio ?? accountUpdate?.mmr ?? 0;
  const maintenanceMargin = accountUpdate?.maintenance_margin ?? 0;
  const adjustedEquity = accountUpdate?.adjusted_equity ?? null;

  const totalEquity = accountUpdate?.total_equity ?? walletRest?.total_balance ?? 0;
  const marketValue = accountUpdate?.market_value ?? accountUpdate?.options_market_value ?? 0;
  const marginBalance = accountUpdate?.margin_balance ?? totalEquity;
  const availableMargin = accountUpdate?.available_balance ?? walletRest?.available_balance ?? 0;
  const initialMargin = accountUpdate?.initial_margin ?? accountUpdate?.imr ?? 0;
  const lockedInOrders = accountUpdate?.in_order ?? walletRest?.locked_balance ?? 0;

  const unrealizedPnl = accountUpdate?.unrealized_pnl ?? 0;
  const upnlNum = decNum(unrealizedPnl);
  const upnlColor = upnlNum > 0 ? colors.green : upnlNum < 0 ? '#F6465D' : valueColor;

  const handleTransfer = () => {
    if (typeof onClose === 'function') {
      onClose();
    }
    NavigationService.navigate(MARGIN_TRANSFER_SCREEN, {
      fromWalletType: 'spot',
      toWalletType: 'options',
      coin: 'USDT',
    });
  };

  const handlePnlAnalysis = () => {
    if (typeof onClose === 'function') {
      onClose();
    }
    NavigationService.navigate(OPTIONS_PNL_ANALYSIS_SCREEN);
  };

  return (
    <View style={[styles.container, { backgroundColor: cardBg, borderColor: isDark ? '#2B313A' : '#EAEAEA' }, style]}>
      {/* Header with Title & Transfer Icon (if not hidden) */}
      {!hideHeader && (
        <View style={styles.headerRow}>
          <AppText type={SIXTEEN} weight={BOLD} style={{ color: headerColor }}>
            Account
          </AppText>
          <TouchableOpacity
            onPress={handleTransfer}
            style={styles.transferBtn}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <FastImage
              source={futureTransferIcon}
              style={styles.transferIcon}
              tintColor="#F0B90B"
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Account Balance Row */}
      <View style={styles.row}>
        <AppText type={FOURTEEN} style={{ color: labelColor }}>
          Account
        </AppText>
        <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: valueColor }}>
          {fmtUsdt(accountBalance)}
        </AppText>
      </View>

      {/* Margin Ratio (Collapsible) */}
      <TouchableOpacity
        style={styles.collapsibleHeaderRow}
        activeOpacity={0.7}
        onPress={() => setMarginRatioExpanded(!marginRatioExpanded)}
      >
        <AppText type={FOURTEEN} weight={BOLD} style={{ color: headerColor }}>
          Margin Ratio
        </AppText>
        <View style={styles.collapsibleRight}>
          <AppText type={FOURTEEN} weight={BOLD} style={{ color: '#F6465D', marginRight: 6 }}>
            ⏱ {fmtPercent(marginRatio)}
          </AppText>
          <FastImage
            source={downIcon}
            style={[
              styles.caretIcon,
              marginRatioExpanded && { transform: [{ rotate: '180deg' }] },
            ]}
            tintColor={labelColor}
            resizeMode="contain"
          />
        </View>
      </TouchableOpacity>

      {marginRatioExpanded && (
        <View style={styles.subRowsContainer}>
          <View style={styles.subRow}>
            <AppText type={TWELVE} style={{ color: labelColor }}>
              Maintenance Margin
            </AppText>
            <AppText type={TWELVE} weight={MEDIUM} style={{ color: valueColor }}>
              {fmtUsdt(maintenanceMargin)}
            </AppText>
          </View>
          <View style={styles.subRow}>
            <AppText type={TWELVE} style={{ color: labelColor }}>
              Adjusted Equity
            </AppText>
            <AppText type={TWELVE} weight={MEDIUM} style={{ color: valueColor }}>
              {adjustedEquity != null ? fmtUsdt(adjustedEquity) : '—'}
            </AppText>
          </View>
        </View>
      )}

      {/* Total Equity (Collapsible) */}
      <TouchableOpacity
        style={styles.collapsibleHeaderRow}
        activeOpacity={0.7}
        onPress={() => setTotalEquityExpanded(!totalEquityExpanded)}
      >
        <AppText type={FOURTEEN} weight={BOLD} style={{ color: headerColor }}>
          Total Equity
        </AppText>
        <View style={styles.collapsibleRight}>
          <AppText type={FOURTEEN} weight={BOLD} style={{ color: valueColor, marginRight: 6 }}>
            {fmtUsdt(totalEquity)}
          </AppText>
          <FastImage
            source={downIcon}
            style={[
              styles.caretIcon,
              totalEquityExpanded && { transform: [{ rotate: '180deg' }] },
            ]}
            tintColor={labelColor}
            resizeMode="contain"
          />
        </View>
      </TouchableOpacity>

      {totalEquityExpanded && (
        <View style={styles.subRowsContainer}>
          <View style={styles.subRow}>
            <AppText type={TWELVE} style={{ color: labelColor }}>
              Market Value
            </AppText>
            <AppText type={TWELVE} weight={MEDIUM} style={{ color: valueColor }}>
              {fmtUsdt(marketValue)}
            </AppText>
          </View>
          <View style={styles.subRow}>
            <AppText type={TWELVE} style={{ color: labelColor }}>
              Margin Balance
            </AppText>
            <AppText type={TWELVE} weight={MEDIUM} style={{ color: valueColor }}>
              {fmtUsdt(marginBalance)}
            </AppText>
          </View>
          <View style={styles.subRow}>
            <AppText type={TWELVE} style={{ color: labelColor }}>
              Available Margin
            </AppText>
            <AppText type={TWELVE} weight={MEDIUM} style={{ color: valueColor }}>
              {fmtUsdt(availableMargin)}
            </AppText>
          </View>
          <View style={styles.subRow}>
            <AppText type={TWELVE} style={{ color: labelColor }}>
              Initial Margin
            </AppText>
            <AppText type={TWELVE} weight={MEDIUM} style={{ color: valueColor }}>
              {fmtUsdt(initialMargin)}
            </AppText>
          </View>
          <View style={styles.subRow}>
            <AppText type={TWELVE} style={{ color: labelColor }}>
              Locked in orders
            </AppText>
            <AppText type={TWELVE} weight={MEDIUM} style={{ color: valueColor }}>
              {fmtUsdt(lockedInOrders)}
            </AppText>
          </View>
        </View>
      )}

      {/* Unrealized PnL Row */}
      <View style={styles.row}>
        <AppText type={FOURTEEN} weight={BOLD} style={{ color: headerColor }}>
          Unrealized PnL
        </AppText>
        <AppText type={FOURTEEN} weight={BOLD} style={{ color: upnlColor }}>
          {fmtUsdt(unrealizedPnl)}
        </AppText>
      </View>

      {/* Options PNL Analysis Button */}
      <TouchableOpacity
        style={[
          styles.pnlAnalysisBtn,
          { backgroundColor: btnBg, borderColor: btnBorder },
        ]}
        activeOpacity={0.75}
        onPress={handlePnlAnalysis}
      >
        <FastImage
          source={historyIcon}
          style={styles.pnlIcon}
          tintColor={labelColor}
          resizeMode="contain"
        />
        <AppText type={TWELVE} weight={MEDIUM} style={{ color: valueColor, marginLeft: 8 }}>
          Options PNL Analysis
        </AppText>
      </TouchableOpacity>
    </View>
  );
};

export default React.memo(OptionsAccountSection);

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  transferBtn: {
    padding: 4,
  },
  transferIcon: {
    width: 20,
    height: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
  },
  collapsibleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 4,
  },
  collapsibleRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  caretIcon: {
    width: 10,
    height: 10,
    marginLeft: 4,
  },
  subRowsContainer: {
    paddingLeft: 6,
    paddingVertical: 2,
    marginBottom: 6,
  },
  subRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  pnlAnalysisBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 16,
  },
  pnlIcon: {
    width: 14,
    height: 14,
  },
});
