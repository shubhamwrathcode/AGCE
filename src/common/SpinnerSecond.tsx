import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Easing, Dimensions, Modal } from 'react-native';
import { useAppSelector } from '../store/hooks';
import { APP_LOGO } from '../helper/ImageAssets';
import FastImage from 'react-native-fast-image';
import { colors } from '../theme/colors';

interface SpinnerSecondProps {
  loading?: boolean;
}

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');

const SpinnerSecond = ({ loading }: SpinnerSecondProps) => {
  const isLoading = useAppSelector(state => state.auth.isLoading);
  const loadingFor = useAppSelector(state => state.auth.loadingFor);
  const scaleValue = useRef(new Animated.Value(1)).current;

  // Ensure it shows even for OTP if needed, or based on overall isLoading
  const shouldShow = isLoading || loading;

  useEffect(() => {
    if (!shouldShow) {
      scaleValue.setValue(1);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleValue, {
          toValue: 1.1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: 0.9,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [shouldShow]);

  if (!shouldShow) return null;

  return (
    <Modal transparent visible={shouldShow} animationType="fade">
      <View style={styles.container}>
        <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
          <FastImage
            source={APP_LOGO}
            style={styles.logo}
            resizeMode="contain"

          />
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
  },
});

export { SpinnerSecond };
