import React from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, ScrollView, TouchableWithoutFeedback, Dimensions } from 'react-native';
import FastImage from 'react-native-fast-image';
import { useTheme } from '../../../hooks/useTheme';
import { closeIcon, futureTransferIcon } from '../../../helper/ImageAssets';
import { AppText, SIXTEEN, BOLD } from '../../../common';
import OptionsAccountSection from './OptionsAccountSection';
import NavigationService from '../../../navigation/NavigationService';
import { MARGIN_TRANSFER_SCREEN } from '../../../navigation/routes';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const OptionsAccountSheet = ({ visible, onClose, accountUpdate }) => {
  const { isDark } = useTheme();

  const handleTransfer = () => {
    onClose();
    NavigationService.navigate(MARGIN_TRANSFER_SCREEN, {
      fromWalletType: 'spot',
      toWalletType: 'options',
      coin: 'USDT',
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View
          style={[
            styles.sheetContainer,
            { backgroundColor: isDark ? '#1E2026' : '#FFFFFF' },
          ]}
        >
          {/* Drag Handle */}
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: isDark ? '#363D47' : '#DDE2E5' }]} />
          </View>

          {/* Sheet Header */}
          <View style={styles.header}>
            <AppText type={SIXTEEN} weight={BOLD} style={{ color: isDark ? '#FFFFFF' : '#1E2026' }}>
              Options Account
            </AppText>
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={handleTransfer}
                style={styles.transferBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <FastImage
                  source={futureTransferIcon}
                  style={styles.transferIcon}
                  tintColor="#F0B90B"
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <FastImage
                  source={closeIcon}
                  style={styles.closeIcon}
                  tintColor={isDark ? '#EAECEF' : '#1E2026'}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Account Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <OptionsAccountSection
              accountUpdate={accountUpdate}
              hideHeader={true}
              onClose={onClose}
              style={{
                backgroundColor: 'transparent',
                borderWidth: 0,
                padding: 0,
                marginVertical: 0,
              }}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default React.memo(OptionsAccountSheet);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  sheetContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.85,
    paddingBottom: 24,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  transferBtn: {
    padding: 2,
  },
  transferIcon: {
    width: 20,
    height: 20,
  },
  closeBtn: {
    padding: 2,
  },
  closeIcon: {
    width: 14,
    height: 14,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 20,
  },
});
