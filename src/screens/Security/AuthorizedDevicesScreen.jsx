import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, ScrollView, Dimensions } from 'react-native';
import { AppSafeAreaView, AppText, SEMI_BOLD, EIGHTEEN, MEDIUM, FOURTEEN, TWELVE } from '../../shared';
import { useTheme } from '../../hooks/useTheme';
import NavigationService from '../../navigation/NavigationService';
import FastImage from 'react-native-fast-image';
import { back_ic, NO_NOTIFICATION_ICON, NO_NOTIFICATION_ICON_LIGHT } from '../../helper/ImageAssets';
import { colors } from '../../theme/colors';

const { width } = Dimensions.get('window');

const TABS = ['Devices', 'Login time', 'IP address', 'Login place', 'Device Type'];

const AuthorizedDevicesScreen = () => {
  const { colors: themeColors, isDark } = useTheme();
  
  const [activeTab, setActiveTab] = useState('Devices');
  // Empty state for now
  const [devices, setDevices] = useState([]);

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
          Authorized devices
        </AppText>
        <View style={{ width: 24 }} />
      </View>

      {/* Table Header Row */}
      <View style={[styles.tableHeaderContainer, { borderBottomColor: isDark ? '#2C2C2E' : '#F5F5F5' }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tableHeaderScroll}>
          {TABS.map((tab, index) => {
            const isSelected = activeTab === tab;
            return (
              <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)}>
                <AppText
                  type={TWELVE}
                  weight={isSelected ? SEMI_BOLD : MEDIUM}
                  style={[
                    styles.columnHeader,
                    { color: isSelected ? themeColors.text : (isDark ? '#8A8A93' : '#8E8E93') },
                    index === TABS.length - 1 && { marginRight: 0 }
                  ]}
                >
                  {tab}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {devices.length === 0 ? (
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
  tableHeaderContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tableHeaderScroll: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  columnHeader: {
    marginRight: 20,
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

export default AuthorizedDevicesScreen;
