import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../../hooks/useTheme';

import OptionsHeader from './OptionsHeader';
import OptionsExpiries from './OptionsExpiries';
import OptionsChainTable from './OptionsChainTable';

const expiriesData = ['2026-05-30', '2026-05-31', '2026-06-01', '2026-06-05'];

const OptionsTrade = () => {
  const { colors: themeColors } = useTheme();

  const [selectedOptionType, setSelectedOptionType] = useState('All');
  const [selectedExpiry, setSelectedExpiry] = useState(expiriesData[0]);

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <OptionsHeader
        selectedOptionType={selectedOptionType}
        setSelectedOptionType={setSelectedOptionType}
      />
      <OptionsExpiries
        expiries={expiriesData}
        selectedExpiry={selectedExpiry}
        setSelectedExpiry={setSelectedExpiry}
      />
      <OptionsChainTable
        selectedExpiry={selectedExpiry}
      />
    </View>
  );
};

export default OptionsTrade;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
});
