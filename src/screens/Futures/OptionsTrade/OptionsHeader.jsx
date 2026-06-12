import React from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import FastImage from 'react-native-fast-image';

import { AppText } from '../../../common';
import { useTheme } from '../../../hooks/useTheme';
import { BOLD, MEDIUM, REGULAR, SEMI_BOLD } from '../../../theme/typography';
import { downIcon, printIcon } from '../../../helper/ImageAssets'; // using existing icons

const OptionsHeader = ({ selectedOptionType, setSelectedOptionType }) => {
  const { colors: themeColors, isDark } = useTheme();

  const topNavItems = ['Options Chain', 'Easy', 'Options Strategies'];
  const optionTypes = ['All', 'Call', 'Put'];

  return (
    <View style={styles.container}>
      {/* Top Links */}
      <View style={styles.topLinksRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topLinksScroll}>
          {topNavItems.map((item, index) => (
            <TouchableOpacity key={index} style={styles.topLinkItem}>
              <AppText 
                weight={index === 0 ? BOLD : MEDIUM} 
                style={{ color: index === 0 ? themeColors.text : themeColors.secondaryText, fontSize: 14 }}
              >
                {item}
              </AppText>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.moreBtn}>
          <AppText weight={BOLD} style={{ color: themeColors.secondaryText, fontSize: 16 }}>...</AppText>
        </TouchableOpacity>
      </View>

      {/* Title & Price */}
      <View style={styles.titleRow}>
        <TouchableOpacity style={styles.coinSelector}>
          <AppText weight={BOLD} style={{ fontSize: 22, color: themeColors.text }}>BTC Options</AppText>
          <FastImage source={downIcon} style={styles.downIcon} tintColor={themeColors.text} resizeMode="contain" />
        </TouchableOpacity>
        <View style={styles.badge}>
          <AppText weight={SEMI_BOLD} style={{ color: '#fff', fontSize: 10 }}>+50.47%</AppText>
        </View>
        <View style={{ flex: 1 }} />
        <TouchableOpacity>
          <FastImage source={printIcon} style={styles.historyIcon} tintColor={themeColors.text} resizeMode="contain" />
        </TouchableOpacity>
      </View>

      {/* Filter Toggles */}
      <View style={styles.filterRow}>
        <View style={styles.optionTypes}>
          {optionTypes.map((type) => {
            const isSelected = selectedOptionType === type;
            return (
              <TouchableOpacity 
                key={type} 
                style={styles.optionTypeBtn}
                onPress={() => setSelectedOptionType(type)}
              >
                <AppText 
                  weight={isSelected ? BOLD : MEDIUM}
                  style={{ color: isSelected ? themeColors.text : themeColors.secondaryText, fontSize: 14 }}
                >
                  {type}
                </AppText>
                {isSelected && <View style={[styles.activeLine, { backgroundColor: themeColors.text }]} />}
              </TouchableOpacity>
            );
          })}
        </View>
        <TouchableOpacity style={styles.filterIconBtn}>
          <View style={[styles.filterLines, { borderBottomColor: themeColors.text }]} />
          <View style={[styles.filterLines, { width: 10, borderBottomColor: themeColors.text, alignSelf: 'flex-end' }]} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default OptionsHeader;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  topLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  topLinksScroll: {
    gap: 16,
    alignItems: 'center',
  },
  topLinkItem: {
    paddingVertical: 4,
  },
  moreBtn: {
    marginLeft: 16,
    paddingBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  coinSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  downIcon: {
    width: 12,
    height: 12,
    marginTop: 2,
  },
  badge: {
    backgroundColor: '#38B781',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 10,
  },
  historyIcon: {
    width: 20,
    height: 20,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionTypes: {
    flexDirection: 'row',
    gap: 20,
  },
  optionTypeBtn: {
    position: 'relative',
    paddingVertical: 4,
  },
  activeLine: {
    position: 'absolute',
    bottom: -4,
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 2,
  },
  filterIconBtn: {
    gap: 4,
    justifyContent: 'center',
    height: 24,
    width: 24,
  },
  filterLines: {
    borderBottomWidth: 1.5,
    width: 16,
  }
});
