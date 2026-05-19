import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, ScrollView, Dimensions } from 'react-native';
import { AppSafeAreaView, AppText, SEMI_BOLD, EIGHTEEN, MEDIUM, FOURTEEN, THIRTEEN, TWELVE } from '../../shared';
import { useTheme } from '../../hooks/useTheme';
import NavigationService from '../../navigation/NavigationService';
import FastImage from 'react-native-fast-image';
import { back_ic, NO_NOTIFICATION_ICON, NO_NOTIFICATION_ICON_LIGHT } from '../../helper/ImageAssets';
import { colors } from '../../theme/colors';

const { width } = Dimensions.get('window');

const AuthorizedDevicesScreen = () => {
  const { colors: themeColors, isDark } = useTheme();

  // Empty state matching web authorizedDevices.js
  const [devices, setDevices] = useState([]);

  const cardBg = isDark ? '#1C1C1E' : colors.white;
  const borderCol = isDark ? '#2C2C2E' : '#E5E5EA';
  const labelCol = isDark ? '#8A8A93' : '#8E8E93';
  const valCol = themeColors.text;

  return (
    <AppSafeAreaView style={[styles.safeArea, { backgroundColor: colors.white }]}>
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

        <AppText type={EIGHTEEN} weight={SEMI_BOLD} style={[styles.headerTitle, { color: valCol }]}>
          Authorized devices
        </AppText>
        <View style={{ width: 24 }} />
      </View>

      {/* Sub-header description */}
      <View style={styles.subHeader}>
        <AppText type={THIRTEEN} weight={MEDIUM} style={{ color: labelCol, }}>
          Manage and review devices that are authorized to access your account.
        </AppText>
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
            <AppText type={FOURTEEN} weight={MEDIUM} style={{ marginTop: 16, color: valCol }}>
              No data
            </AppText>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {devices.map((row, idx) => (
              <View key={row.id ?? idx} style={[styles.logCard, { backgroundColor: cardBg, borderColor: borderCol }]}>
                <View style={[styles.cardRow, { borderBottomColor: borderCol }]}>
                  <AppText type={THIRTEEN} weight={MEDIUM} style={{ color: labelCol }}>Devices</AppText>
                  <AppText type={THIRTEEN} weight={MEDIUM} style={{ color: valCol }}>{row.device}</AppText>
                </View>
                <View style={[styles.cardRow, { borderBottomColor: borderCol }]}>
                  <AppText type={THIRTEEN} weight={MEDIUM} style={{ color: labelCol }}>Login time</AppText>
                  <AppText type={THIRTEEN} weight={MEDIUM} style={{ color: valCol }}>{row.loginTime}</AppText>
                </View>
                <View style={[styles.cardRow, { borderBottomColor: borderCol }]}>
                  <AppText type={THIRTEEN} weight={MEDIUM} style={{ color: labelCol }}>IP address</AppText>
                  <AppText type={THIRTEEN} weight={MEDIUM} style={{ color: valCol }}>{row.ip}</AppText>
                </View>
                <View style={[styles.cardRow, { borderBottomColor: borderCol }]}>
                  <AppText type={THIRTEEN} weight={MEDIUM} style={{ color: labelCol }}>Login place</AppText>
                  <AppText type={THIRTEEN} weight={MEDIUM} style={{ color: valCol }}>{row.place}</AppText>
                </View>
                <View style={[styles.cardRow, { borderBottomWidth: 0, paddingBottom: 10 }]}>
                  <AppText type={THIRTEEN} weight={MEDIUM} style={{ color: labelCol }}>Device Type</AppText>
                  <AppText type={THIRTEEN} weight={MEDIUM} style={{ color: valCol }}>{row.deviceType}</AppText>
                </View>
              </View>
            ))}
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
    paddingHorizontal: 16,
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
  subHeader: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  logCard: {
    borderRadius: 10,
    borderWidth: 0.7,
    paddingVertical: 5,
    marginBottom: 15,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
});

export default AuthorizedDevicesScreen;
