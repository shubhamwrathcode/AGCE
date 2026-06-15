import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import FastImage from 'react-native-fast-image';

import { AppText } from '../../../common';
import { useTheme } from '../../../hooks/useTheme';
import { BOLD, fontFamilyMedium, fontFamilySemiBold, MEDIUM, REGULAR, SEMI_BOLD } from '../../../theme/typography';
import { downIcon, filterNew, history, historyIcon, menuIcon, printIcon } from '../../../helper/ImageAssets'; // using existing icons
import { colors } from '../../../theme/colors';

const OptionsHeader = ({ activeTab, setActiveTab, selectedOptionType, setSelectedOptionType, onOpenSettings }) => {
  const { colors: themeColors, isDark } = useTheme();

  const topNavItems = ['Options Chain', 'Easy', 'Options Strategies'];
  const optionTypes = ['All', 'Call', 'Put'];

  return (
    <View style={styles.container}>
      {/* Top Links */}
      <View style={styles.topLinksRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topLinksScroll}>
          {topNavItems.map((item, index) => (
            <TouchableOpacity key={index} style={styles.topLinkItem} onPress={() => setActiveTab(index)}>
              <AppText
                style={{
                  fontFamily: fontFamilySemiBold,
                  color: activeTab === index ? themeColors.text : themeColors.secondaryText, fontSize: 15
                }}
              >
                {item}
              </AppText>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.moreBtn}>
          <FastImage source={menuIcon} style={{ width: 18, height: 18, }} resizeMode='contain' tintColor={colors.black} />
        </TouchableOpacity>
      </View>

      {/* Title & Price */}
      <View style={styles.titleRow}>
        <TouchableOpacity style={styles.coinSelector}>
          <AppText style={{ fontSize: 18, color: themeColors.text, fontFamily: fontFamilySemiBold }}>BTC Options</AppText>
          <FastImage source={downIcon} style={styles.downIcon} tintColor={themeColors.text} resizeMode="contain" />
        </TouchableOpacity>
        <View style={styles.badge}>
          <AppText style={{ color: '#fff', fontSize: 10, fontFamily: fontFamilyMedium }}>+50.47%</AppText>
        </View>
        <View style={{ flex: 1 }} />
        <TouchableOpacity>
          <FastImage source={historyIcon} style={styles.historyIcon} tintColor={themeColors.text} resizeMode="contain" />
        </TouchableOpacity>
      </View>

      {/* Filter Toggles */}
      {activeTab === 0 && (
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
                    style={{
                      color: isSelected ? themeColors.text : themeColors.secondaryText, fontSize: 14,
                      fontFamily: fontFamilySemiBold
                    }}
                  >
                    {type}
                  </AppText>
                  {isSelected && <View style={[styles.activeLine, { backgroundColor: themeColors.text }]} />}
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity style={styles.filterIconBtn} onPress={onOpenSettings}>
            <FastImage source={filterNew} style={{ width: 20, height: 20, }} resizeMode='contain' />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default OptionsHeader;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
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
    // marginLeft: 16,
    marginTop: 5
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
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
    width: 24,
    height: 24,
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
