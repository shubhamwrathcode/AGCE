import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Platform } from 'react-native';
import FastImage from 'react-native-fast-image';
import { AppText } from '../../../common';
import { useTheme } from '../../../hooks/useTheme';
import { fontFamilyMedium, fontFamilySemiBold, fontFamilyBold } from '../../../theme/typography';
import { back_ic, filterIcon, NO_NOTIFICATION_ICON, NO_NOTIFICATION_ICON_LIGHT } from '../../../helper/ImageAssets';
import { useNavigation } from '@react-navigation/native';

const OptionHistory = () => {
  const { colors: themeColors, isDark } = useTheme();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState(0);

  const tabs = ['Order History', 'Open Orders'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <FastImage source={back_ic} style={styles.backIcon} tintColor={themeColors.text} resizeMode="contain" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <AppText style={[styles.headerTitle, { color: themeColors.text }]}>Trade</AppText>
          <AppText style={[styles.headerSubtitle, { color: themeColors.secondaryText }]}>Options</AppText>
        </View>

        <View style={styles.backBtn} />

      </View>

      {/* Tabs Row */}
      <View style={[styles.tabsRow, { borderBottomColor: isDark ? '#333' : '#F0F0F0' }]}>
        <View style={styles.leftTabs}>
          {tabs.map((tab, index) => {
            const isActive = activeTab === index;
            return (
              <TouchableOpacity key={index} style={styles.tabBtn} onPress={() => setActiveTab(index)}>
                <AppText style={[styles.tabText, {
                  color: isActive ? themeColors.text : themeColors.secondaryText,
                  fontFamily: isActive ? fontFamilyBold : fontFamilyMedium
                }]}>
                  {tab}
                </AppText>
                {isActive && <View style={[styles.activeUnderline, { backgroundColor: themeColors.text }]} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.filterBtn}>
          <FastImage source={filterIcon} style={styles.filterIcon} tintColor={themeColors.text} resizeMode="contain" />
        </TouchableOpacity>
      </View>

      {/* Empty State Body */}
      <View style={styles.bodyContainer}>
        <FastImage
          source={isDark ? NO_NOTIFICATION_ICON : NO_NOTIFICATION_ICON_LIGHT}
          style={styles.emptyIcon}
          resizeMode="contain"
        />
        <AppText style={[styles.emptyText, { color: themeColors.secondaryText }]}>No data</AppText>
      </View>

    </SafeAreaView>
  );
};

export default OptionHistory;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  backIcon: {
    width: 20,
    height: 20,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fontFamilyBold,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: fontFamilyMedium,
    marginTop: 2,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  leftTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  tabBtn: {
    paddingVertical: 12,
    position: 'relative',
  },
  tabText: {
    fontSize: 15,
  },
  activeUnderline: {
    position: 'absolute',
    bottom: -1,
    left: '50%',
    marginLeft: -15,
    width: 30,
    height: 3,
    borderRadius: 2,
  },
  filterBtn: {
    paddingVertical: 12,
    paddingLeft: 12,
  },
  filterIcon: {
    width: 18,
    height: 18,
  },
  bodyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100, // Move it slightly up from true center
  },
  emptyIcon: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: fontFamilyMedium,
  }
});
