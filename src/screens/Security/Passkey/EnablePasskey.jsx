import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView, Platform, Modal } from 'react-native';
import { AppText, BOLD, FOURTEEN, SIXTEEN, TWENTY, SEMI_BOLD, TWELVE, EIGHT, EIGHTEEN, TWENTY_FOUR, TWENTY_TWO, MEDIUM } from '../../../shared';
import { useTheme } from '../../../hooks/useTheme';
import NavigationService from '../../../navigation/NavigationService';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import * as routes from '../../../navigation/routes';
import FastImage from 'react-native-fast-image';
import { back_ic, easyVerificaton, enablepasskey, headPhoneIcon, highsecurity, INFO, multidevice, security_risk_vector, googleAuthenticator, PHONE, right_ic, securityrisk } from '../../../helper/ImageAssets';
import { colors } from '../../../theme/colors';

const EnablePasskey = () => {
  const { colors: themeColors, isDark } = useTheme();
  const [isRiskModalVisible, setRiskModalVisible] = useState(false);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.white }]}>
      <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : '#F0F0F0' }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => NavigationService.goBack()}>
          <FastImage source={back_ic} tintColor={colors.black} style={{ width: 18, height: 18 }} resizeMode='contain' />
        </TouchableOpacity>

        <AppText type={EIGHTEEN} weight={BOLD} style={[styles.headerTitle, { color: themeColors.text }]}>
          Passkey
        </AppText>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => {
            NavigationService.navigate(routes.CREATE_TICKET_SCREEN)
          }}>
            <FastImage source={headPhoneIcon} tintColor={colors.black} style={{ width: 18, height: 18 }} resizeMode='contain' />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <FastImage source={INFO} tintColor={colors.black} style={{ width: 18, height: 18 }} resizeMode='contain' />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>

        <FastImage source={enablepasskey} style={{ width: 200, height: 200, alignSelf: 'center' }} resizeMode='contain' />

        <AppText type={TWENTY_TWO} weight={SEMI_BOLD} style={[styles.mainTitle, { color: themeColors.text }]}>
          Enable Passkey
        </AppText>

        {/* Feature List */}
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <View style={[styles.iconWrap, { backgroundColor: isDark ? '#2A2A2E' : '#F5F5F5' }]}>
              <FastImage source={highsecurity} tintColor={colors.black} style={{ width: 24, height: 24 }} resizeMode='contain' />
            </View>
            <View style={styles.featureTextWrap}>
              <AppText type={SIXTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text }}>High Security</AppText>
              <AppText type={TWELVE} weight={MEDIUM} style={{ color: themeColors.secondaryText, marginTop: 4 }}>
                Protect accounts from traditional password theft risks
              </AppText>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.iconWrap, { backgroundColor: isDark ? '#2A2A2E' : '#F5F5F5' }]}>
              <FastImage source={easyVerificaton} tintColor={colors.black} style={{ width: 24, height: 24 }} resizeMode='contain' />
            </View>
            <View style={styles.featureTextWrap}>
              <AppText type={SIXTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text }}>Easy Verification</AppText>
              <AppText type={TWELVE} style={{ color: themeColors.secondaryText, marginTop: 4 }}>
                Verify in one tap, free from remembering complex passwords
              </AppText>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.iconWrap, { backgroundColor: isDark ? '#2A2A2E' : '#F5F5F5' }]}>
              <FastImage source={multidevice} tintColor={colors.black} style={{ width: 24, height: 24 }} resizeMode='contain' />
            </View>
            <View style={styles.featureTextWrap}>
              <AppText type={SIXTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text }}>Multi-Device</AppText>
              <AppText type={TWELVE} style={{ color: themeColors.secondaryText, marginTop: 4 }}>
                Use passkey across devices seamlessly
              </AppText>
            </View>
          </View>
        </View>

      </View>

      {/* Bottom Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: isDark ? '#FFFFFF' : '#2A2A2E' }]}
          activeOpacity={0.8}
          // navigate to next passkey screen (e.g., add passkey functionality)
          onPress={() => setRiskModalVisible(true)}
        >
          <AppText type={SIXTEEN} weight={SEMI_BOLD} style={{ color: isDark ? '#000000' : '#FFFFFF' }}>
            Add a Passkey
          </AppText>
        </TouchableOpacity>
      </View>
      {/* Security Risk Modal */}
      <Modal
        visible={isRiskModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setRiskModalVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setRiskModalVisible(false)}>
          <TouchableOpacity activeOpacity={1} style={[styles.bottomSheet, { backgroundColor: isDark ? '#1E1E22' : '#FFFFFF' }]}>
            <View style={styles.handleBar} />

            <FastImage source={securityrisk} style={styles.modalIllustration} resizeMode="contain" />

            <AppText type={TWENTY} weight={BOLD} style={[styles.modalTitle, { color: themeColors.text }]}>
              Security Risk Warning
            </AppText>

            <AppText type={TWELVE} style={[styles.modalSubtitle, { color: themeColors.secondaryText }]}>
              To enhance your account security, please activate at least one additional verification method.
            </AppText>

            <View style={styles.modalOptions}>
              <TouchableOpacity 
                style={[styles.optionCard, { borderColor: isDark ? '#333' : '#F0F0F0' }]} 
                activeOpacity={0.7}
                onPress={() => {
                  setRiskModalVisible(false);
                  NavigationService.navigate(routes.DOWNLOAD_AUTHENTICATOR_SCREEN);
                }}
              >
                <FastImage source={googleAuthenticator} style={styles.optionIcon} resizeMode="contain" />
                <AppText type={SIXTEEN} weight={MEDIUM} style={[styles.optionText, { color: themeColors.text }]}>Google Authenticator</AppText>
                <FastImage source={right_ic} style={styles.rightArrow} tintColor="#C1C1C1" resizeMode="contain" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.optionCard, { borderColor: isDark ? '#333' : '#F0F0F0' }]}
                activeOpacity={0.7}
                onPress={() => {
                  setRiskModalVisible(false);
                  NavigationService.navigate(routes.PASSKEY_ADD_PHONE_SCREEN);
                }}
              >
                <FastImage source={PHONE} style={styles.optionIcon} resizeMode="contain" />
                <AppText type={SIXTEEN} weight={MEDIUM} style={[styles.optionText, { color: themeColors.text }]}>Phone Number</AppText>
                <FastImage source={right_ic} style={styles.rightArrow} tintColor="#C1C1C1" resizeMode="contain" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
    justifyContent: 'space-between',
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  phoneMockup: {
    width: 100,
    height: 160,
    borderWidth: 6,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  phoneScreen: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    backgroundColor: '#FDFBF7', // Light tint for screen background
  },
  phoneTopBar: {
    width: '60%',
    height: 16,
    backgroundColor: '#D1AA67',
    position: 'absolute',
    top: -4,
    right: -10,
    transform: [{ rotate: '15deg' }],
  },
  keyCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#D1AA67',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },
  phoneBottomTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 20,
    borderRightWidth: 20,
    borderTopWidth: 20,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#D1AA67',
    marginBottom: 10,
  },
  mainTitle: {
    textAlign: 'center',
    marginBottom: 32,
  },
  featuresList: {
    gap: 24,
  },
  featureItem: {
    flexDirection: 'row',
  },
  iconWrap: {
    width: 45,
    height: 45,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureTextWrap: {
    flex: 1,
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    paddingTop: 16,
  },
  addBtn: {
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    alignItems: 'center',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginTop: 12,
    marginBottom: 24,
  },
  modalIllustration: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  modalTitle: {
    marginBottom: 12,
    textAlign: 'center',
  },
  modalSubtitle: {
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  modalOptions: {
    width: '100%',
    gap: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  optionIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  optionText: {
    flex: 1,
  },
  rightArrow: {
    width: 14,
    height: 14,
  },
});

export default EnablePasskey;
