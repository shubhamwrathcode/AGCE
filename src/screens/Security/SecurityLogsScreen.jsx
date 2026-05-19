import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, ScrollView, Dimensions } from 'react-native';
import { AppSafeAreaView, AppText, SEMI_BOLD, EIGHTEEN, MEDIUM, FOURTEEN, TWELVE } from '../../shared';
import { useTheme } from '../../hooks/useTheme';
import NavigationService from '../../navigation/NavigationService';
import FastImage from 'react-native-fast-image';
import { back_ic, NO_NOTIFICATION_ICON, NO_NOTIFICATION_ICON_LIGHT } from '../../helper/ImageAssets';
import { colors } from '../../theme/colors';

const { width } = Dimensions.get('window');

const LOGIN_HISTORY_HEADERS = ['Type', 'Time', 'Status', 'IP', 'Login Location'];
const SECURITY_SETTINGS_HEADERS = ['Action', 'Time', 'Status', 'IP', 'Login Location']; // Assuming these headers, adjust if needed

const SecurityLogsScreen = () => {
  const { colors: themeColors, isDark } = useTheme();

  const [activeMainTab, setActiveMainTab] = useState('Logins History');

  // Empty state for now
  const [logs, setLogs] = useState([]);

  const headersToUse = activeMainTab === 'Logins History' ? LOGIN_HISTORY_HEADERS : SECURITY_SETTINGS_HEADERS;

  return (
    <AppSafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#121214' : colors.white }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => NavigationService.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <FastImage
            source={back_ic}
            tintColor={isDark ? colors.white : colors.black}
            style={{ width: 18, height: 18 }}
            resizeMode='contain'
          />
        </TouchableOpacity>

        <AppText type={EIGHTEEN} weight={SEMI_BOLD} style={[styles.headerTitle, { color: themeColors.text }]}>
          Security Logs
        </AppText>
        <View style={{ width: 24 }} />
      </View>

      {/* Main Tabs */}
      <View style={styles.mainTabsContainer}>
        <TouchableOpacity onPress={() => setActiveMainTab('Logins History')} style={styles.mainTabBtn}>
          <AppText
            type={FOURTEEN}
            weight={activeMainTab === 'Logins History' ? SEMI_BOLD : MEDIUM}
            style={{ color: activeMainTab === 'Logins History' ? themeColors.text : (isDark ? '#8A8A93' : '#8E8E93') }}
          >
            Logins History
          </AppText>
          {activeMainTab === 'Logins History' && (
            <View style={[styles.activeTabIndicator, { backgroundColor: themeColors.text }]} />
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setActiveMainTab('Security Settings History')} style={styles.mainTabBtn}>
          <AppText
            type={FOURTEEN}
            weight={activeMainTab === 'Security Settings History' ? SEMI_BOLD : MEDIUM}
            style={{ color: activeMainTab === 'Security Settings History' ? themeColors.text : (isDark ? '#8A8A93' : '#8E8E93') }}
          >
            Security Settings History
          </AppText>
          {activeMainTab === 'Security Settings History' && (
            <View style={[styles.activeTabIndicator, { backgroundColor: themeColors.text }]} />
          )}
        </TouchableOpacity>
      </View>

      {/* Table Header Row */}
      <View style={[styles.tableHeaderContainer, { borderBottomColor: isDark ? '#2C2C2E' : '#F5F5F5' }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tableHeaderScroll}>
          {headersToUse.map((header, index) => (
            <AppText
              key={header}
              type={TWELVE}
              weight={MEDIUM}
              style={[
                styles.columnHeader,
                { color: isDark ? '#8A8A93' : '#8E8E93' },
                index === headersToUse.length - 1 && { marginRight: 0 }
              ]}
            >
              {header}
            </AppText>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {logs.length === 0 ? (
          <View style={styles.emptyState}>
            <FastImage
              source={isDark ? NO_NOTIFICATION_ICON : NO_NOTIFICATION_ICON_LIGHT}
              style={{ width: 100, height: 100 }}
              resizeMode="contain"
            />
            <AppText type={FOURTEEN} weight={MEDIUM} style={{ marginTop: 16, color: themeColors.text }}>
              No data
            </AppText>
          </View>
        ) : (
          <ScrollView>
            {/* List items will go here */}
          </ScrollView>
        )}
      </View>
    </AppSafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 13,
    height: Platform.OS === 'ios' ? 44 : 56,
  },
  headerBtn: {
    padding: 6,
    marginLeft: -4,
  },
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: -1,
  },
  mainTabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 12,
  },
  mainTabBtn: {
    marginRight: 24,
    alignItems: 'center',
    paddingBottom: 4,
  },
  activeTabIndicator: {
    height: 2,
    width: '60%',
    position: 'absolute',
    bottom: -2,
    borderRadius: 1,
  },
  tableHeaderContainer: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    marginTop: 5,
  },
  tableHeaderScroll: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  columnHeader: {
    marginRight: 32,
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100, // offset for visual center
  },
});

export default SecurityLogsScreen;
