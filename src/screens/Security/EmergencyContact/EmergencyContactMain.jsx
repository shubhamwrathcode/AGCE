import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useTheme } from '../../../hooks/useTheme';
import NavigationService from '../../../navigation/NavigationService';
import * as routes from '../../../navigation/routes';
import FastImage from 'react-native-fast-image';
import {
  AppSafeAreaView,
  AppText,
  BOLD,
  FOURTEEN,
  SIXTEEN,
  SEMI_BOLD,
  TWELVE,
  EIGHTEEN,
  TWENTY_TWO,
  THIRTEEN,
  MEDIUM,
} from '../../../shared';
import { back_ic, emergencyContact as emergencyImg } from '../../../helper/ImageAssets';
import { colors } from '../../../theme/colors';

const EmergencyContactMain = () => {
  const { colors: themeColors, isDark } = useTheme();
  const route = useRoute();

  // Purely local UI state
  const [emergencyContactData, setEmergencyContactData] = useState(null);

  useEffect(() => {
    if (route.params?.contactData) {
      setEmergencyContactData(route.params.contactData);
    }
  }, [route.params?.contactData]);

  const handleDisable = () => {
    Alert.alert(
      "Disable Emergency Contact",
      "Are you sure you want to disable your emergency contact? This will reduce your account's recovery options.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disable",
          style: "destructive",
          onPress: () => {
            setEmergencyContactData(null);
          }
        }
      ]
    );
  };

  const handleAddOrChange = () => {
    NavigationService.navigate(routes.ADD_EMERGENCY_CONTACT_SCREEN);
  };

  return (
    <AppSafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#121214' : '#FFFFFF' }]}>
      {/* Header matching mockup */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => NavigationService.goBack()}>
          <FastImage
            source={back_ic}
            tintColor={isDark ? colors.white : colors.black}
            style={{ width: 20, height: 20 }}
            resizeMode='contain'
          />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <View style={styles.setupContainer}>
          <View style={styles.illustrationContainer}>
            <FastImage
              source={emergencyImg}
              style={styles.illustration}
              resizeMode='contain'
            />
          </View>

          <AppText
            type={TWENTY_TWO}
            weight={SEMI_BOLD}
            style={[styles.mainTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}
          >
            Emergency Contact
          </AppText>

          <AppText
            type={TWELVE}
            weight={MEDIUM}
            style={[styles.mainSubtitle, { color: isDark ? '#8A8A93' : '#8E8E93' }]}
          >
            At AGCE, the security of your digital assets remains our highest priority. The Emergency Contact feature is designed to help protect your account by allowing us to send email and SMS notifications to you and your trusted contacts if your account becomes inactive for an extended period. Your selected emergency contacts may also request account access support or initiate an inheritance claim process when necessary.
          </AppText>
        </View>

      </View>

      {/* Footer Buttons */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: isDark ? '#FFFFFF' : '#2A2A2E' }]}
          activeOpacity={0.8}
          onPress={handleAddOrChange}
        >
          <AppText type={SIXTEEN} weight={SEMI_BOLD} style={{ color: isDark ? '#000000' : '#FFFFFF' }}>
            Add Emergency Contact
          </AppText>
        </TouchableOpacity>

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
    paddingHorizontal: 20,
    height: Platform.OS === 'ios' ? 44 : 56,
  },
  headerBtn: {
    padding: 4,
    marginLeft: -8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  setupContainer: {
    flex: 1,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  illustration: {
    width: 150,
    height: 150,
  },
  mainTitle: {
    textAlign: 'left',
    fontSize: 24,
    // lineHeight: 30,
    marginBottom: 10,
  },
  mainSubtitle: {
    textAlign: 'left',
    lineHeight: 20
  },
  detailsContainer: {
    flex: 1,
    paddingTop: 8,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00C853',
    marginRight: 8,
  },
  bannerDescription: {
    lineHeight: 18,
    marginBottom: 24,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.1)',
  },
  infoLabel: {
    flex: 1,
  },
  bottomContainer: {
    paddingHorizontal: 15,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    paddingTop: 16,
  },
  actionBtn: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default EmergencyContactMain;
