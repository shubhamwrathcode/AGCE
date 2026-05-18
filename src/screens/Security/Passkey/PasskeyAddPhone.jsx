import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView, Platform, TextInput } from 'react-native';
import { AppText, BOLD, FOURTEEN, SIXTEEN, SEMI_BOLD, TWELVE, MEDIUM, EIGHTEEN, THIRD, THIRTEEN } from '../../../shared';
import { useTheme } from '../../../hooks/useTheme';
import NavigationService from '../../../navigation/NavigationService';
import FastImage from 'react-native-fast-image';
import CountryPicker from 'react-native-country-picker-modal';
import { back_ic, downIcon } from '../../../helper/ImageAssets';
import { colors } from '../../../theme/colors';

const PasskeyAddPhone = () => {
  const { colors: themeColors, isDark } = useTheme();

  const [countryCode, setCountryCode] = useState([]);
  const [country, setCountry] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [phone, setPhone] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [emailCode, setEmailCode] = useState('');

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.white }]}>
      <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : '#F0F0F0' }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => NavigationService.goBack()}>
          <FastImage source={back_ic} tintColor={colors.black} style={{ width: 18, height: 18 }} resizeMode='contain' />
        </TouchableOpacity>

        <AppText type={EIGHTEEN} weight={BOLD} style={[styles.headerTitle, { color: themeColors.text }]}>
          Add Phone
        </AppText>
      </View>

      <View style={styles.content}>
        {/* Country Code */}
        <View style={styles.inputGroup}>
          <AppText type={FOURTEEN} weight={MEDIUM} style={[styles.label, { color: themeColors.text }]}>Country Code</AppText>
          <TouchableOpacity
            style={[styles.inputContainer, { backgroundColor: isDark ? '#2A2A2E' : '#F7F7F7', justifyContent: 'space-between' }]}
            activeOpacity={0.8}
            onPress={() => setPickerVisible(true)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 }}>
              {selectedCountry ? (
                <>
                  <AppText type={FOURTEEN} style={{ marginRight: 8 }}>
                    {selectedCountry.cca2.toUpperCase().replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397))}
                  </AppText>
                  <AppText type={FOURTEEN} style={{ color: themeColors.text }} numberOfLines={1}>
                    {typeof selectedCountry.name === 'string' ? selectedCountry.name : selectedCountry.name?.common || ''} (+{selectedCountry.callingCode[0]})
                  </AppText>
                </>
              ) : (
                <AppText type={FOURTEEN} style={{ color: '#999' }}>
                  Please select country and region
                </AppText>
              )}
            </View>
            <FastImage source={downIcon} style={styles.downArrow} tintColor="#999" resizeMode="contain" />
          </TouchableOpacity>
          <CountryPicker
            onSelect={(countryItem) => {
              setCountry(countryItem.cca2);
              setCountryCode([countryItem.callingCode[0]]);
              setSelectedCountry(countryItem);
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

        {/* Phone */}
        <View style={styles.inputGroup}>
          <AppText type={FOURTEEN} weight={MEDIUM} style={[styles.label, { color: themeColors.text }]}>Phone</AppText>
          <View style={[styles.inputContainer, { backgroundColor: isDark ? '#2A2A2E' : '#F7F7F7' }]}>
            <TextInput
              style={[styles.input, { color: themeColors.text }]}
              placeholder="Please input Phone"
              placeholderTextColor="#999"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* SMS Code */}
        <View style={styles.inputGroup}>
          <AppText type={FOURTEEN} weight={MEDIUM} style={[styles.label, { color: themeColors.text }]}>SMS Code</AppText>
          <View style={[styles.inputContainer, { backgroundColor: isDark ? '#2A2A2E' : '#F7F7F7' }]}>
            <TextInput
              style={[styles.input, { color: themeColors.text }]}
              placeholder="Input SMS code"
              placeholderTextColor="#999"
              value={smsCode}
              onChangeText={setSmsCode}
              keyboardType="number-pad"
            />
            <TouchableOpacity style={styles.actionBtn}>
              <AppText type={THIRTEEN} weight={MEDIUM} style={{ color: colors.orangeTheme }}>Get SMS</AppText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Email Verification Code */}
        <View style={styles.inputGroup}>
          <AppText type={FOURTEEN} weight={MEDIUM} style={[styles.label, { color: themeColors.text }]}>Email Verification Code</AppText>
          <View style={[styles.inputContainer, { backgroundColor: isDark ? '#2A2A2E' : '#F7F7F7' }]}>
            <TextInput
              style={[styles.input, { color: themeColors.text }]}
              placeholder="Input Email code"
              placeholderTextColor="#999"
              value={emailCode}
              onChangeText={setEmailCode}
              keyboardType="number-pad"
            />
            <TouchableOpacity style={styles.actionBtn}>
              <AppText type={THIRTEEN} weight={MEDIUM} style={{ color: colors.orangeTheme }}>Get Email Code</AppText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: isDark ? '#FFFFFF' : '#2A2A2E' }]}
          activeOpacity={0.8}
          onPress={() => NavigationService.navigate('PASSKEY_SECURITY_VERIFICATION_SCREEN')}
        >
          <AppText type={SIXTEEN} weight={SEMI_BOLD} style={{ color: isDark ? '#000000' : '#FFFFFF' }}>
            Submit
          </AppText>
        </TouchableOpacity>

        {/* Unable to Verify Link */}
        <TouchableOpacity style={styles.linkContainer}>
          <AppText type={THIRTEEN} weight={MEDIUM} style={[styles.linkText, { color: themeColors.text }]}>
            Unable to Verify?
          </AppText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter-Regular', // Fallback, managed by AppText usually but we use TextInput here
    paddingVertical: 0,
  },
  downArrow: {
    width: 12,
    height: 12,
    marginLeft: 10,
  },
  actionBtn: {
    paddingLeft: 10,
    justifyContent: 'center',
  },
  submitBtn: {
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  linkContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  linkText: {
    textDecorationLine: 'underline',
  },
});

export default PasskeyAddPhone;
