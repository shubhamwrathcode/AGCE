import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView, Platform, TextInput } from 'react-native';
import { AppText, BOLD, FOURTEEN, SIXTEEN, SEMI_BOLD, TWELVE, MEDIUM, TWENTY_TWO, THIRTEEN } from '../../../shared';
import { useTheme } from '../../../hooks/useTheme';
import NavigationService from '../../../navigation/NavigationService';
import FastImage from 'react-native-fast-image';
import { back_ic } from '../../../helper/ImageAssets';
import { colors } from '../../../theme/colors';

const SecurityVerification = () => {
  const { colors: themeColors, isDark } = useTheme();

  const [smsCode, setSmsCode] = useState('');
  const [emailCode, setEmailCode] = useState('');

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.white }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => NavigationService.goBack()}>
          <FastImage source={back_ic} tintColor={colors.black} style={{ width: 18, height: 18 }} resizeMode='contain' />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.topSection}>
          <AppText type={TWENTY_TWO} weight={BOLD} style={[styles.mainTitle, { color: themeColors.text }]}>
            Security Verification
          </AppText>
          <AppText type={THIRTEEN} weight={MEDIUM} style={[styles.subtitle, { color: '#999' }]}>
            To ensure the security of your account, please complete the following verification operations.
          </AppText>

          {/* SMS Code Group */}
          <View style={styles.inputGroup}>
            <AppText type={FOURTEEN} weight={MEDIUM} style={[styles.label, { color: themeColors.text }]}>Code sent to: +91***2</AppText>
            <View style={[styles.inputContainer, { backgroundColor: isDark ? '#2A2A2E' : '#F7F7F7' }]}>
              <TextInput
                style={[styles.input, { color: themeColors.text }]}
                placeholder="Please enter SMS Code"
                placeholderTextColor="#999"
                value={smsCode}
                onChangeText={setSmsCode}
                keyboardType="number-pad"
              />
              <TouchableOpacity style={styles.actionBtn}>
                <AppText type={THIRTEEN} weight={MEDIUM} style={{ color: colors.orangeTheme }}>Send</AppText>
              </TouchableOpacity>
            </View>
            <AppText type={TWELVE} style={{ color: '#999', marginTop: 8, marginLeft: 3 }}>Valid for 10 minutes</AppText>
          </View>

          {/* Email Code Group */}
          <View style={styles.inputGroup}>
            <AppText type={FOURTEEN} weight={MEDIUM} style={[styles.label, { color: themeColors.text }]}>Code sent to: r***9@gmail.com</AppText>
            <View style={[styles.inputContainer, { backgroundColor: isDark ? '#2A2A2E' : '#F7F7F7' }]}>
              <TextInput
                style={[styles.input, { color: themeColors.text }]}
                placeholder="Please enter Email Code"
                placeholderTextColor="#999"
                value={emailCode}
                onChangeText={setEmailCode}
                keyboardType="number-pad"
              />
              <TouchableOpacity style={styles.actionBtn}>
                <AppText type={THIRTEEN} weight={MEDIUM} style={{ color: colors.orangeTheme }}>Send</AppText>
              </TouchableOpacity>
            </View>
            <AppText type={TWELVE} style={{ color: '#999', marginTop: 8, marginLeft: 3 }}>Valid for 10 minutes</AppText>
          </View>
        </View>

        <View style={styles.bottomSection}>
          <TouchableOpacity 
            style={[styles.submitBtn, { backgroundColor: isDark ? '#FFFFFF' : '#2A2A2E' }]} 
            activeOpacity={0.8}
            onPress={() => NavigationService.navigate('PASSKEY_SCREEN')}
          >
            <AppText type={SIXTEEN} weight={SEMI_BOLD} style={{ color: isDark ? '#000000' : '#FFFFFF' }}>
              Confirm
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkContainer}>
            <AppText type={FOURTEEN} weight={MEDIUM} style={[styles.linkText, { color: themeColors.text }]}>
              Unable to Verify?
            </AppText>
          </TouchableOpacity>
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  topSection: {
    paddingTop: 10,
  },
  mainTitle: {
    marginBottom: 6,
  },
  subtitle: {
    lineHeight: 20,
    marginBottom: 22,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    marginBottom: 6,
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
    fontFamily: 'Inter-Regular',
    paddingVertical: 0,
  },
  actionBtn: {
    paddingLeft: 10,
    justifyContent: 'center',
  },
  bottomSection: {
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  submitBtn: {
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  linkText: {
    textDecorationLine: 'underline',
  },
});

export default SecurityVerification;
