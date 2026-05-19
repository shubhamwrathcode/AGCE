import React from 'react';
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
  THIRTEEN,
  MEDIUM,
  TWENTY_TWO,
  TWENTY,
} from '../../../shared';
import { back_ic, editIcon, binIcon, peopleIcon, profileNewIcon } from '../../../helper/ImageAssets';
import { colors } from '../../../theme/colors';

const ConfirmEmergencyContact = () => {
  const { colors: themeColors, isDark } = useTheme();
  const route = useRoute();

  // Retrieve contactData passed from the previous screen
  const contactData = route.params?.contactData || {
    name: 'Hello',
    email: 'agce12@gmail.com',
    phone: '',
    countryCode: '+91',
  };

  const handleSaveContact = () => {
    NavigationService.navigate(routes.EMERGENCY_CONTACT_SCREEN, {
      contactData,
    });
  };

  const handleEdit = () => {
    // Navigate back to the Add screen, passing back the current data to prefill
    NavigationService.navigate(routes.ADD_EMERGENCY_CONTACT_SCREEN, {
      prefillData: contactData,
    });
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Contact Info",
      "Are you sure you want to delete this emergency contact info?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            // Navigate back to the main unconfigured screen
            NavigationService.navigate(routes.EMERGENCY_CONTACT_SCREEN, {
              contactData: null,
            });
          }
        }
      ]
    );
  };

  return (
    <AppSafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#121214' : '#FFFFFF' }]}>
      {/* Header matching mockup */}
      <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : '#F0F0F0' }]}>
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
        <AppText
          type={TWENTY}
          weight={SEMI_BOLD}
          style={[styles.mainTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}
        >
          Confirm Information
        </AppText>

        <AppText
          type={THIRTEEN}
          weight={MEDIUM}
          style={[styles.mainSubtitle, { color: isDark ? '#8A8A93' : '#8E8E93' }]}
        >
          Please review the contact details carefully before continuing. We will use this information to reach your emergency contact when the conditions you set are triggered.
        </AppText>

        {/* Contact detail box/card */}
        <View style={[styles.card, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', }]}>

          {/* Header row: User Avatar + Name + Action Buttons */}
          <View style={styles.cardHeaderRow}>
            <View style={styles.userInfoContainer}>
              <FastImage
                source={profileNewIcon}
                style={styles.userIcon}
                tintColor={'#000000'}
                resizeMode="contain"
              />
              <AppText type={SIXTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text }}>
                {contactData.name || 'Hello'}
              </AppText>
            </View>

            {/* Edit / Delete Icons */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity onPress={handleEdit} style={styles.iconBtn}>
                <FastImage
                  source={editIcon}
                  style={styles.actionIcon}
                  // tintColor={colors.n}
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={styles.iconBtn}>
                <FastImage
                  source={binIcon}
                  style={[styles.actionIcon, { width: 18, height: 18 }]}
                  tintColor={colors.black}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Details Row: Contact Email */}
          <View style={[styles.detailRow, { borderBottomColor: isDark ? '#2C2C2E' : '#E5E5EA' }]}>
            <AppText type={THIRTEEN} weight={MEDIUM} style={{ color: isDark ? '#8A8A93' : '#8E8E93' }}>
              Contact Email
            </AppText>
            <AppText type={THIRTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text }}>
              {contactData.email || 'Not Provided'}
            </AppText>
          </View>

          {/* Details Row: Contact Phone Number */}
          <View style={styles.detailRow}>
            <AppText type={THIRTEEN} weight={MEDIUM} style={{ color: isDark ? '#8A8A93' : '#8E8E93' }}>
              Contact Phone Number
            </AppText>
            <AppText type={THIRTEEN} weight={MEDIUM} style={{ color: themeColors.text }}>
              {contactData.phone ? `${contactData.countryCode} ${contactData.phone}` : 'Not Provided'}
            </AppText>
          </View>

        </View>
      </View>

      {/* Footer Button: Save */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.continueBtn, { backgroundColor: isDark ? '#FFFFFF' : '#2A2A2E' }]}
          activeOpacity={0.8}
          onPress={handleSaveContact}
        >
          <AppText type={SIXTEEN} weight={SEMI_BOLD} style={{ color: isDark ? '#000000' : '#FFFFFF' }}>
            Save
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
    paddingHorizontal: 18,
    height: Platform.OS === 'ios' ? 44 : 56,
  },
  headerBtn: {
    padding: 4,
    marginLeft: -8,
  },
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: -1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 14,
  },
  mainTitle: {
    textAlign: 'left',
    lineHeight: 30,
    marginBottom: 12,
  },
  mainSubtitle: {
    textAlign: 'left',
    lineHeight: 20,
    marginBottom: 10,
  },
  card: {
    borderRadius: 12,
    padding: 5,
    marginTop: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    padding: 6,
    marginLeft: 5,
  },
  actionIcon: {
    width: 16,
    height: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    paddingTop: 16,
  },
  continueBtn: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ConfirmEmergencyContact;
