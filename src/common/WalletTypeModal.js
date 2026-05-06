import React, { useEffect } from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { colors } from '../theme/colors';
import { useTheme } from '../hooks/useTheme';
import { AppText, BOLD, SEMI_BOLD } from './AppText';
import FastImage from 'react-native-fast-image';
import { closeIcon } from '../helper/ImageAssets';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const AnimatedView = Animated.createAnimatedComponent(View);

const WalletTypeModal = ({ visible, data, onSelect, onClose, selectedItem }) => {
  const { colors: themeColors, isDark } = useTheme();
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 160 });
      translateY.value = withSpring(0, {
        damping: 18,
        stiffness: 180,
      });
    } else {
      opacity.value = withTiming(0, { duration: 120 });
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 180 });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => {
    const translate = interpolate(
      translateY.value,
      [0, SCREEN_HEIGHT],
      [0, SCREEN_HEIGHT],
      Extrapolate.CLAMP
    );
    return {
      transform: [{ translateY: translate }],
    };
  });

  const handleClose = () => {
    opacity.value = withTiming(0, { duration: 120 });
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: 180 });
    setTimeout(() => {
      onClose();
    }, 180);
  };

  const handleSelectItem = (item) => {
    onSelect(item);
    handleClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <AnimatedView style={[styles.overlay, backdropStyle]}>
          <TouchableWithoutFeedback onPress={() => { }}>
            <AnimatedView
              style={[
                styles.modalContent,
                modalStyle,
                { backgroundColor: themeColors.background },
              ]}
            >
              <View style={styles.header}>
                <AppText
                  style={[
                    styles.title,
                    { color: themeColors.text },
                  ]}
                  weight={BOLD}
                >
                  Select Wallet Type
                </AppText>
                <TouchableOpacity
                  onPress={handleClose}
                  style={[
                    styles.closeButton,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255,255,255,0.1)'
                        : 'rgba(0,0,0,0.05)',
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <FastImage
                    source={closeIcon}
                    resizeMode="contain"
                    style={{ width: 15, height: 15 }}
                    tintColor={themeColors.text}
                  />
                </TouchableOpacity>
              </View>

              <FlatList
                data={data || []}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => {
                  const isSelected = selectedItem?.toLowerCase() === item?.toLowerCase();
                  return (
                    <TouchableOpacity
                      style={[
                        styles.item,
                        {
                          backgroundColor: isSelected
                            ? (isDark ? "rgba(255,255,255,0.05)" : "#F5F7F9")
                            : (isDark ? "rgba(255,255,255,0.05)" : "#F8F9FA"),
                          borderColor: isSelected ? themeColors.button : (isDark ? "rgba(255,255,255,0.05)" : "#EEE"),
                          borderWidth: 1
                        },
                      ]}
                      onPress={() => handleSelectItem(item)}
                      activeOpacity={0.7}
                    >
                      <AppText
                        style={[
                          styles.itemText,
                          { color: isDark ? colors.white : colors.black },
                        ]}
                        weight={isSelected ? BOLD : SEMI_BOLD}
                      >
                        {item?.toUpperCase()}
                      </AppText>
                    </TouchableOpacity>
                  );
                }}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
              />
            </AnimatedView>
          </TouchableWithoutFeedback>
        </AnimatedView>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxHeight: SCREEN_HEIGHT * 0.65,
    width: '100%',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: 8,
  },
  item: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 15,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 13,
    letterSpacing: -0.2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  }
});

export default WalletTypeModal;
