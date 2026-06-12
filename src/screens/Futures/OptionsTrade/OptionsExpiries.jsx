import React from 'react';
import { View, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { AppText } from '../../../common';
import { useTheme } from '../../../hooks/useTheme';
import { SEMI_BOLD, MEDIUM } from '../../../theme/typography';

const OptionsExpiries = ({ expiries, selectedExpiry, setSelectedExpiry }) => {
  const { colors: themeColors, isDark } = useTheme();

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {expiries.map((date) => {
          const isSelected = selectedExpiry === date;
          return (
            <TouchableOpacity
              key={date}
              style={[
                styles.pill,
                {
                  backgroundColor: isSelected
                    ? (isDark ? '#2C2D31' : '#F5F5F5')
                    : 'transparent'
                }
              ]}
              onPress={() => setSelectedExpiry(date)}
            >
              <AppText
                weight={isSelected ? SEMI_BOLD : MEDIUM}
                style={{
                  color: isSelected ? themeColors.text : themeColors.secondaryText,
                  fontSize: 13
                }}
              >
                {date}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default OptionsExpiries;

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  }
});
