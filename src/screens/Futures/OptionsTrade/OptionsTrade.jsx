import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useTheme } from '../../../hooks/useTheme';
import RBSheet from 'react-native-raw-bottom-sheet';

import OptionsHeader from './OptionsHeader';
import OptionsChainTable from './OptionsChainTable';
import OptionsSettingsSheet from './OptionsSettingsSheet';
import OptionsEasyMode from './OptionsEasyMode';
import OptionsStrategies from './OptionsStrategies';
import OptionsMoreSheet from './OptionsMoreSheet';
import OptionsPairList from '../../Options/OptionsPairList';
import useOptionsWebSocket from './hooks/useOptionsWebSocket';

const OptionsTrade = ({ route }) => {
  const { colors: themeColors, theme } = useTheme();
  const isFocused = useIsFocused();

  const initialAsset = route?.params?.symbol
    ? String(route.params.symbol).replace(/USDT|USDC/i, "").toUpperCase()
    : 'BTC';

  const [selectedAsset, setSelectedAsset] = useState(initialAsset);
  const [searchTerm, setSearchTerm] = useState('');

  const { underlyings, expiries, chains, currentPrice, isMarketLoading, isContractsLoading } = useOptionsWebSocket(selectedAsset, null, isFocused);

  const [activeTab, setActiveTab] = useState(0);
  const [selectedOptionType, setSelectedOptionType] = useState('All');
  const [selectedExpiry, setSelectedExpiry] = useState('ALL');
  const [isSettingsVisible, setSettingsVisible] = useState(false);
  const [isMoreSheetVisible, setMoreSheetVisible] = useState(false);

  const pairSheetRef = useRef(null);

  // Default to first underlying if current selectedAsset is not in the list, unless a route param was provided
  useEffect(() => {
    if (route?.params?.symbol) {
      const base = String(route.params.symbol).replace(/USDT|USDC/i, "").toUpperCase();
      setSelectedAsset(base);
    } else if (underlyings?.length > 0 && !underlyings.find(u => u.symbol === selectedAsset)) {
      setSelectedAsset(underlyings[0].symbol);
    }
  }, [underlyings, selectedAsset, route?.params?.symbol]);

  // Ensure selectedExpiry is valid within the dynamic expiries list
  useEffect(() => {
    if (expiries?.length > 0 && selectedExpiry !== 'ALL' && !expiries.includes(selectedExpiry)) {
      setSelectedExpiry('ALL');
    }
  }, [expiries, selectedExpiry]);

  const filteredPairs = useMemo(() => {
    if (!underlyings || !Array.isArray(underlyings)) return [];
    if (!searchTerm) return underlyings;
    const s = searchTerm.toLowerCase();
    return underlyings.filter(pair =>
      pair?.symbol?.toLowerCase()?.includes(s) ||
      pair?.underlying?.toLowerCase()?.includes(s)
    );
  }, [underlyings, searchTerm]);

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <OptionsHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedOptionType={selectedOptionType}
        setSelectedOptionType={setSelectedOptionType}
        selectedAsset={selectedAsset}
        onOpenSettings={() => setSettingsVisible(true)}
        onOpenMoreSheet={() => setMoreSheetVisible(true)}
        onOpenPairList={() => pairSheetRef.current?.open()}
      />
      <View style={[styles.divider, { backgroundColor: themeColors.themeBorderColor || '#EAEAEA' }]} />

      {activeTab === 0 && (
        <OptionsChainTable
          expiries={expiries}
          selectedExpiry={selectedExpiry}
          setSelectedExpiry={setSelectedExpiry}
          chains={chains}
          currentPrice={currentPrice}
          selectedAsset={selectedAsset}
          isMarketLoading={isMarketLoading}
          isContractsLoading={isContractsLoading}
          onOpenPairList={() => pairSheetRef.current?.open()}
        />
      )}
      {activeTab === 1 && (
        <OptionsEasyMode
          expiries={expiries}
          selectedExpiry={selectedExpiry}
          setSelectedExpiry={setSelectedExpiry}
        />
      )}
      {activeTab === 2 && (
        <OptionsStrategies />
      )}
      <OptionsSettingsSheet
        visible={isSettingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
      <OptionsMoreSheet
        visible={isMoreSheetVisible}
        onClose={() => setMoreSheetVisible(false)}
      />
      <RBSheet
        ref={pairSheetRef}
        keyboardAvoidingViewEnabled={false}
        customModalProps={{ statusBarTranslucent: true }}
        closeOnDragDown={true}
        closeOnPressMask={true}
        height={600}
        customStyles={{
          wrapper: {
            backgroundColor: "rgba(0,0,0,0.5)"
          },
          draggableIcon: {
            backgroundColor: themeColors.secondaryText || "#CCC",
          },
          container: {
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            backgroundColor: themeColors.background,
          }
        }}
      >
        <OptionsPairList
          pairs={filteredPairs}
          selectedPair={underlyings?.find(u => u.symbol === selectedAsset)}
          onSelectPair={(pair) => {
            setSelectedAsset(pair.symbol);
            pairSheetRef.current?.close();
          }}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          theme={theme === 'dark' ? 'Dark' : 'Light'}
          onClose={() => pairSheetRef.current?.close()}
        />
      </RBSheet>
    </View>
  );
};

export default OptionsTrade;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
