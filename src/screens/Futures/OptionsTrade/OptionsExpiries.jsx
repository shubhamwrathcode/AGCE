import React from 'react';
import { View, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import FastImage from 'react-native-fast-image';
import { AppText } from '../../../common';
import { useTheme } from '../../../hooks/useTheme';
import { fontFamilyMedium } from '../../../theme/typography';
import { right_arrow } from '../../../helper/ImageAssets';

const OptionsExpiries = ({ expiries = [], selectedExpiry, setSelectedExpiry }) => {
  const { colors: themeColors, isDark } = useTheme();

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {expiries.map((date) => {
          const isSelected = selectedExpiry === date;
          const displayDate = date === 'ALL' ? 'All' : date;
          
          return (
            <TouchableOpacity
              key={date}
              style={[
                styles.pill,
                {
                  backgroundColor: isSelected
                    ? (isDark ? '#FFFFFF' : '#1C1C1E')
                    : (isDark ? '#2C2D31' : '#F2F3F5')
                }
              ]}
              onPress={() => setSelectedExpiry(date)}
            >
              <AppText
                style={{
                  fontFamily: fontFamilyMedium,
                  color: isSelected
                    ? (isDark ? '#000000' : '#FFFFFF')
                    : (isDark ? '#FFFFFF' : '#1C1C1E'),
                  fontSize: 13
                }}
              >
                {displayDate}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={styles.chevronContainer}>
        <FastImage source={right_arrow} style={styles.chevronIcon} resizeMode="contain" tintColor={themeColors.secondaryText} />
      </View>
    </View>
  );
};

export default OptionsExpiries;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  scrollContent: {
    paddingHorizontal: 15,
    paddingRight: 40, // Space for chevron
    gap: 10,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  chevronContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)', // Optional gradient/fade effect could be added
  },
  chevronIcon: {
    width: 14,
    height: 14,
    opacity: 0.5,
  }
});
