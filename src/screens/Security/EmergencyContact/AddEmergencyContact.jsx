import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, TextInput, ScrollView } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useTheme } from '../../../hooks/useTheme';
import NavigationService from '../../../navigation/NavigationService';
import * as routes from '../../../navigation/routes';
import FastImage from 'react-native-fast-image';
import CountryPicker from 'react-native-country-picker-modal';
import {
  AppSafeAreaView,
  AppText,
  BOLD,
  FOURTEEN,
  SIXTEEN,
  SEMI_BOLD,
  TWELVE,
  MEDIUM,
  EIGHTEEN,
  THIRTEEN,
} from '../../../shared';
import { back_ic, downIcon } from '../../../helper/ImageAssets';
import { colors } from '../../../theme/colors';

const AddEmergencyContact = () => {
  const { colors: themeColors, isDark } = useTheme();
  const route = useRoute();

  // Form states
  const [name, setName] = useState('');
  const [countryCode, setCountryCode] = useState(['91']);
  const [country, setCountry] = useState('IN');
  const [selectedCountry, setSelectedCountry] = useState({
    cca2: 'IN',
    callingCode: ['91'],
    name: 'India',
  });
  const [pickerVisible, setPickerVisible] = useState(false);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Prefill details if navigating back from Confirm screen
  useEffect(() => {
    if (route.params?.prefillData) {
      const data = route.params.prefillData;
      setName(data.name || '');
      setEmail(data.email || '');
      setPhone(data.phone || '');
      if (data.countryCode) {
        const cleanedCode = data.countryCode.replace('+', '');
        setCountryCode([cleanedCode]);
      }
    }
  }, [route.params?.prefillData]);

  const handleSave = () => {
    // Go to confirm information screen, pass data along
    NavigationService.navigate(routes.CONFIRM_EMERGENCY_CONTACT_SCREEN, {
      contactData: {
        relation: 'Emergency Contact',
        name: name.trim() || 'Hello',
        countryCode: `+${countryCode[0]}`,
        phone: phone.trim(),
        email: email.trim() || 'agce12@gmail.com',
      }
    });
  };

  // Convert cca2 to flag emoji
  const getFlagEmoji = (cca2) => {
    if (!cca2) return '🇮🇳';
    const codePoints = cca2
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  return (
    <AppSafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#121214' : '#FFFFFF' }]}>
      {/* Header matching mockup */}
      <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : '#F0F0F0' }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => NavigationService.goBack()}>
          <FastImage
            source={back_ic}
            tintColor={isDark ? colors.white : colors.black}
            style={{ width: 18, height: 18 }}
            resizeMode='contain'
          />
        </TouchableOpacity>

        <AppText type={EIGHTEEN} weight={SEMI_BOLD} style={[styles.headerTitle, { color: themeColors.text }]}>
          Confirm Information
        </AppText>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Emergency Contact Name */}
        <View style={styles.inputGroup}>
          <AppText type={FOURTEEN} weight={SEMI_BOLD} style={[styles.label, { color: themeColors.text }]}>
            Emergency Contact Name
          </AppText>
          <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F7' }]}>
            <TextInput
              style={[styles.input, { color: themeColors.text }]}
              placeholder="Please Enter"
              placeholderTextColor="#8A8A93"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>
          <AppText type={TWELVE} style={[styles.helpText, { color: isDark ? '#8A8A93' : '#8E8E93' }]}>
            Enter the full name of your trusted emergency contact. This name will be used for communication and verification purposes.
          </AppText>
        </View>

        {/* Contact Information */}
        <View style={styles.inputGroup}>
          <AppText type={FOURTEEN} weight={SEMI_BOLD} style={[styles.label, { color: themeColors.text }]}>
            Contact Information
          </AppText>
          <View style={[styles.inputContainer, { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F7' }]}>
            <TextInput
              style={[styles.input, { color: themeColors.text }]}
              placeholder="Enter Email Address"
              placeholderTextColor="#8A8A93"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* Phone Number */}
        <View style={styles.inputGroup}>
          <AppText type={FOURTEEN} weight={SEMI_BOLD} style={[styles.label, { color: themeColors.text }]}>
            Phone Number
          </AppText>
          <View style={[styles.phoneInputRow, { backgroundColor: isDark ? '#1C1C1E' : '#F5F5F7' }]}>
            {/* Country Selector */}
            <TouchableOpacity
              style={styles.countryPickerBtn}
              activeOpacity={0.8}
              onPress={() => setPickerVisible(true)}
            >
              <AppText type={FOURTEEN} style={styles.flagEmoji}>
                {getFlagEmoji(country)}
              </AppText>
              <AppText type={FOURTEEN} style={{ color: themeColors.text }}>
                +{countryCode[0]}
              </AppText>
              <FastImage source={downIcon} style={styles.downArrow} tintColor={isDark ? '#8A8A93' : '#8E8E93'} resizeMode="contain" />
            </TouchableOpacity>

            {/* Vertical Divider */}
            <View style={[styles.divider, { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA' }]} />

            {/* Phone TextInput */}
            <TextInput
              style={[styles.phoneInput, { color: themeColors.text }]}
              placeholder="Enter your phone number"
              placeholderTextColor="#8A8A93"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          {/* Golden Highlighted Helper Text */}
          <View style={styles.helpTextContainer}>
            <AppText type={TWELVE} style={{ color: isDark ? '#8A8A93' : '#8E8E93', lineHeight: 18 }}>
              Your emergency contact may be notified if unusual account inactivity is detected. For a smoother verification process, it is recommended that your emergency contact is also an <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: '#D4AF37' }}>AGCE</AppText> user.
            </AppText>
          </View>

          <CountryPicker
            onSelect={(countryItem) => {
              setCountry(countryItem.cca2);
              setCountryCode([countryItem.callingCode[0]]);
              setSelectedCountry({
                cca2: countryItem.cca2,
                callingCode: [countryItem.callingCode[0]],
                name: typeof countryItem.name === 'string' ? countryItem.name : countryItem.name?.common || '',
              });
              setPickerVisible(false);
            }}
            withFilter
            withCallingCode={true}
            withEmoji
            countryCode={country}
            visible={pickerVisible}
            onClose={() => setPickerVisible(false)}
            containerButtonStyle={{ display: 'none' }}
            theme={{
              backgroundColor: isDark ? themeColors.background : colors.white,
              onBackgroundTextColor: themeColors.text,
              fontSize: 14,
              itemHeight: 50,
            }}
          />
        </View>

      </ScrollView>

      {/* Save Button at the bottom */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: isDark ? '#FFFFFF' : '#2A2A2E' }]}
          activeOpacity={0.8}
          onPress={handleSave}
        >
          <AppText type={SIXTEEN} weight={SEMI_BOLD} style={{ color: isDark ? '#000000' : '#FFFFFF' }}>
            Continue
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
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: -1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 10,
    fontSize: 14,
  },
  inputContainer: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    paddingVertical: 0,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  countryPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  flagEmoji: {
    fontSize: 20,
    marginRight: 6,
  },
  downArrow: {
    width: 10,
    height: 10,
    marginLeft: 6,
  },
  divider: {
    width: 1,
    height: 24,
    marginHorizontal: 10,
  },
  phoneInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    paddingVertical: 0,
  },
  helpText: {
    marginTop: 8,
    lineHeight: 18,
  },
  helpTextContainer: {
    marginTop: 8,
  },
  submitBtn: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomContainer: {
    paddingHorizontal: 15,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    paddingTop: 16,
  },
});

export default AddEmergencyContact;
