import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from "../../../hooks/useTheme";
import { useAppSelector, useAppDispatch } from "../../../store/hooks";
import { getPasskeyList, verifySecurityPasskey } from "../../../actions/accountActions";
import { Passkey } from "react-native-passkey";
import { showError, showSuccess } from "../../../helper/logger";
import NavigationService from "../../../navigation/NavigationService";
import {
  AppSafeAreaView,
  AppText,
  BOLD,
  EIGHTEEN,
  SIXTEEN,
  MEDIUM,
  SEMI_BOLD,
} from '../../../shared';
import FastImage from 'react-native-fast-image';
import { back_ic, right_ic } from '../../../helper/ImageAssets';
import * as routes from '../../../navigation/routes';

const AddPhoneNumberScreen = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { colors: themeColors, isDark } = useTheme();
  const userData = useAppSelector((state) => state.auth.userData);

  const [passkeySupported, setPasskeySupported] = React.useState(false);
  const [hasPasskey, setHasPasskey] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    setPasskeySupported(Passkey.isSupported());

    const fetchPasskeys = async () => {
      try {
        const res = await dispatch(getPasskeyList());
        if (res?.success && active) {
          const list = res.data?.passkeys || [];
          setHasPasskey(list.length > 0);
        }
      } catch (err) {
        console.warn('[AddPhoneNumberScreen] Error fetching passkeys:', err);
      }
    };
    void fetchPasskeys();

    return () => {
      active = false;
    };
  }, [dispatch]);

  // Mask helper matching the mockup screenshot
  const profileMobile = userData?.mobileNumber ?? userData?.mobile_number ?? '';
  const rawEmail = userData?.emailId || userData?.email;
  const userHasPhone = !!profileMobile && profileMobile !== "null" && profileMobile !== "undefined";

  const maskPhone = (phone) => {
    if (!phone || phone === "null" || phone === "undefined") return '';
    const cleaned = String(phone).replace(/\s/g, '');
    const isIndia = cleaned.startsWith("+91") || cleaned.startsWith("91");
    const prefix = isIndia ? "+91" : "";
    const digitsOnly = cleaned.replace(/^\+91|^91/, '');
    if (digitsOnly.length < 2) return '';
    return `${prefix}*****${digitsOnly.slice(-1)}`;
  };

  const displayPhone = maskPhone(profileMobile);

  return (
    <AppSafeAreaView style={{ backgroundColor: isDark ? '#121214' : '#FFFFFF', flex: 1 }}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: isDark ? '#1E1E22' : '#F0F0F0' }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <FastImage
              source={back_ic}
              style={styles.backIcon}
              tintColor={isDark ? '#FFFFFF' : '#000000'}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <AppText weight={SEMI_BOLD} type={EIGHTEEN} style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Phone Number
            </AppText>
          </View>
          <View style={{ width: 24 }} />
        </View>

        {/* Content List exactly matching screenshot */}
        <View style={{ paddingTop: 8 }}>
          {/* Phone Number Row */}
          {userHasPhone ? (
            <View style={styles.row}>
              <AppText type={SIXTEEN} weight={MEDIUM} style={{ color: isDark ? '#FFFFFF' : '#1A1A1C' }}>
                Phone Number
              </AppText>
              <AppText type={SIXTEEN} style={{ color: isDark ? '#8A8A93' : '#9E9EAE' }}>
                {displayPhone}
              </AppText>
            </View>
          ) : null}

          {/* Change Email Row */}
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={async () => {
              if (hasPasskey && passkeySupported) {
                try {
                  const signId = rawEmail || profileMobile;
                  const result = await dispatch(verifySecurityPasskey(signId, true, true));
                  if (result && result !== 'BIOMETRIC_VERIFIED') {
                    showSuccess('Passkey verified successfully');
                    navigation.navigate(routes.CHANGE_PHONE_NUMBER_SCREEN, {
                      passkeyVerified: true,
                      passkeyUserId: result,
                    });
                    return;
                  }
                } catch (err) {
                  console.warn('[AddPhoneNumberScreen] Silent passkey verification failed:', err);
                }
              }

              const methods = ['email'];
              if (hasPasskey && passkeySupported) {
                methods.push('passkey');
              }
              navigation.navigate(routes.PASSKEY_SECURITY_VERIFICATION_SCREEN, {
                targetScreen: routes.CHANGE_PHONE_NUMBER_SCREEN,
                purpose: 'change_mobile',
                verifyMethods: methods,
                skipDirectVerification: true,
              });
            }}
          >
            <AppText type={SIXTEEN} weight={MEDIUM} style={{ color: isDark ? '#FFFFFF' : '#1A1A1C' }}>
              Change Phone Number
            </AppText>
            <FastImage
              source={right_ic}
              style={styles.chevronIcon}
              tintColor={isDark ? '#8A8A93' : '#9E9EAE'}
              resizeMode="contain"
            />
          </TouchableOpacity>

          {/* Unlink Phone Number Row */}
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={async () => {
              if (hasPasskey && passkeySupported) {
                try {
                  const signId = rawEmail || profileMobile;
                  const result = await dispatch(verifySecurityPasskey(signId, true, true));
                  if (result && result !== 'BIOMETRIC_VERIFIED') {
                    showSuccess('Passkey verified successfully');
                    navigation.navigate(routes.UNLINK_PHONE_NUMBER_SCREEN, {
                      passkeyVerified: true,
                      passkeyUserId: result,
                    });
                    return;
                  }
                } catch (err) {
                  console.warn('[AddPhoneNumberScreen] Silent passkey verification failed:', err);
                }
              }

              const methods = ['email'];
              if (hasPasskey && passkeySupported) {
                methods.push('passkey');
              }
              navigation.navigate(routes.PASSKEY_SECURITY_VERIFICATION_SCREEN, {
                targetScreen: routes.UNLINK_PHONE_NUMBER_SCREEN,
                purpose: 'delete_mobile',
                verifyMethods: methods,
                skipDirectVerification: true,
              });
            }}
          >
            <AppText type={SIXTEEN} weight={MEDIUM} style={{ color: isDark ? '#FFFFFF' : '#1A1A1C' }}>
              Unlink Phone Number
            </AppText>
            <FastImage
              source={right_ic}
              style={styles.chevronIcon}
              tintColor={isDark ? '#8A8A93' : '#9E9EAE'}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </AppSafeAreaView>
  );
};

export default AddPhoneNumberScreen;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 6,
  },
  backIcon: {
    width: 20,
    height: 20
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 48,
  },
  chevronIcon: {
    width: 14,
    height: 14,
  },
});
