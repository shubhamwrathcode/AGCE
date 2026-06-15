import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../../hooks/useTheme';

import OptionsHeader from './OptionsHeader';
import OptionsExpiries from './OptionsExpiries';
import OptionsChainTable from './OptionsChainTable';
import OptionsSettingsSheet from './OptionsSettingsSheet';
import OptionsEasyMode from './OptionsEasyMode';
import { colors } from '../../../theme/colors';

const expiriesData = ['2026-05-30', '2026-05-31', '2026-06-01', '2026-06-05'];

const OptionsTrade = () => {
  const { colors: themeColors } = useTheme();

  const [activeTab, setActiveTab] = useState(0);
  const [selectedOptionType, setSelectedOptionType] = useState('All');
  const [selectedExpiry, setSelectedExpiry] = useState(expiriesData[0]);
  const [isSettingsVisible, setSettingsVisible] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: colors.white }]}>
      <OptionsHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedOptionType={selectedOptionType}
        setSelectedOptionType={setSelectedOptionType}
        onOpenSettings={() => setSettingsVisible(true)}
      />
      {activeTab === 0 && (
        <>
          <OptionsExpiries
            expiries={expiriesData}
            selectedExpiry={selectedExpiry}
            onSelectExpiry={setSelectedExpiry}
          />
          <OptionsChainTable
            selectedExpiry={selectedExpiry}
          />
        </>
      )}
      {activeTab === 1 && (
        <OptionsEasyMode 
          expiries={expiriesData}
          selectedExpiry={selectedExpiry}
          onSelectExpiry={setSelectedExpiry}
        />
      )}
      <OptionsSettingsSheet 
        visible={isSettingsVisible} 
        onClose={() => setSettingsVisible(false)} 
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
