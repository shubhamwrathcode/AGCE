import React from 'react';
import { View, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { AppText } from '../../../common';
import { useTheme } from '../../../hooks/useTheme';
import { SEMI_BOLD, MEDIUM, fontFamilyMedium } from '../../../theme/typography';

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
                style={{
                  fontFamily: fontFamilyMedium,
                  color: isSelected ? themeColors.text : themeColors.secondaryText,
                  fontSize: 12
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
    // paddingVertical: 5,
  },
  scrollContent: {
    paddingHorizontal: 5,
    gap: 10,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
  }
});
