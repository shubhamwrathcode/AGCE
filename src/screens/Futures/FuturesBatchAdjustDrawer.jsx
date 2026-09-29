import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, X } from 'lucide-react-native';
import { AppText, BOLD, SEMI_BOLD } from '../../shared';
import { colors } from '../../theme/colors';
import ToggleSwitch from '../../common/ToggleSwitch';
import FuturesLeverageSlider from './FuturesLeverageSlider';

const OPEN_MS = 420;
const CLOSE_MS = 280;
const PANEL_WIDTH_RATIO = 0.86;

/**
 * Right-side drawer: batch leverage + margin mode (mirrors web FuturesBatchAdjustDrawer).
 * Draft (toggles + values) is owned by the parent so reopen keeps the last state.
 * `draft.marginMode` is lowercase: 'cross' | 'isolated'.
 */
export default function FuturesBatchAdjustDrawer({
  visible,
  onClose,
  maxLeverage = 125,
  draft,
  onDraftChange,
  onConfirm,
  isDark = true,
  themeColors = {},
}) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const panelWidth = Math.min(Math.round(windowWidth * PANEL_WIDTH_RATIO), 420);

  const [mounted, setMounted] = useState(visible);
  const [submitting, setSubmitting] = useState(false);
  const [isSliding, setIsSliding] = useState(false);
  const [segmentWidth, setSegmentWidth] = useState(0);

  const translateX = useRef(new Animated.Value(panelWidth)).current;
  const segmentThumbX = useRef(new Animated.Value(0)).current;
  const backdropOpacity = translateX.interpolate({
    inputRange: [0, panelWidth],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const latest = useRef({});
  latest.current = { panelWidth, submitting, onClose };

  const swipeResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          !latest.current.submitting && g.dx > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onPanResponderMove: (_, g) => {
          translateX.setValue(Math.max(0, g.dx));
        },
        onPanResponderRelease: (_, g) => {
          const { panelWidth: w, onClose: close } = latest.current;
          if (g.dx > w * 0.3 || g.vx > 0.6) {
            close?.();
          } else {
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
              bounciness: 0,
              speed: 18,
            }).start();
          }
        },
        onPanResponderTerminate: () => {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
        },
      }),
    [translateX],
  );

  const levEnabled = !!draft?.leverageEnabled;
  const modeEnabled = !!draft?.marginModeEnabled;
  const leverageVal = Number.isFinite(Number(draft?.leverage)) ? Number(draft.leverage) : 1;
  const marginModeDraft = draft?.marginMode === 'isolated' ? 'isolated' : 'cross';

  const clampLev = (n) => {
    const x = Number(n);
    if (!Number.isFinite(x) || x < 1) return 1;
    return Math.min(Math.round(x), maxLeverage);
  };

  const patchDraft = (partial) => {
    onDraftChange?.({
      leverageEnabled: levEnabled,
      marginModeEnabled: modeEnabled,
      leverage: leverageVal,
      marginMode: marginModeDraft,
      ...partial,
    });
  };

  useEffect(() => {
    if (visible) {
      setMounted(true);
      translateX.setValue(panelWidth);
      Animated.timing(translateX, {
        toValue: 0,
        duration: OPEN_MS,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
        useNativeDriver: true,
      }).start();
    } else if (mounted) {
      Animated.timing(translateX, {
        toValue: panelWidth,
        duration: CLOSE_MS,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setMounted(false);
        setSubmitting(false);
        setIsSliding(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- animate on visibility edge only
  }, [visible]);

  useEffect(() => {
    const thumbW = Math.max(0, (segmentWidth - 8) / 2);
    Animated.timing(segmentThumbX, {
      toValue: marginModeDraft === 'isolated' ? thumbW : 0,
      duration: 220,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [marginModeDraft, segmentWidth, segmentThumbX]);

  const requestClose = () => {
    if (submitting) return;
    onClose?.();
  };

  const canConfirm = (levEnabled || modeEnabled) && !submitting;

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setSubmitting(true);
    try {
      const payload = {
        leverageEnabled: levEnabled,
        leverage: clampLev(leverageVal),
        marginModeEnabled: modeEnabled,
        marginMode: marginModeDraft,
      };
      const ok = await onConfirm?.(payload);
      if (ok !== false) {
        patchDraft({ leverage: payload.leverage, marginMode: payload.marginMode });
        onClose?.();
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) return null;

  const panelBg = isDark ? colors.newThemeColor : (themeColors.background || '#FFFFFF');
  const dividerColor = isDark ? 'rgba(255, 255, 255, 0.08)' : '#ECECEE';
  const textColor = themeColors.text || (isDark ? '#EAECEF' : '#14161A');
  const mutedColor = themeColors.secondaryText || (isDark ? '#848E9C' : '#9A9DA3');
  const iconColor = isDark ? '#848E9C' : '#7A7F8A';
  const thumbWidth = Math.max(0, (segmentWidth - 8) / 2);

  const renderSwitchRow = (label, sub, value, onToggle) => (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', minHeight: 44 }}>
      <View style={{ flex: 1, marginRight: 12 }}>
        <AppText weight={SEMI_BOLD} style={{ fontSize: 15, color: textColor }}>
          {label}
        </AppText>
        <AppText style={{ fontSize: 12.5, lineHeight: 18, color: mutedColor, marginTop: 4 }}>
          {sub}
        </AppText>
      </View>
      <View style={{ marginTop: 2 }}>
        <ToggleSwitch
          value={value}
          onValueChange={onToggle}
          isDark={isDark}
          activeTrackColor={colors.orangeTheme}
          activeThumbColor="#FFFFFF"
        />
      </View>
    </View>
  );

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={requestClose}>
      <View style={{ flex: 1 }}>
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: isDark ? 'rgba(0, 0, 0, 0.55)' : 'rgba(15, 23, 42, 0.35)',
            opacity: backdropOpacity,
          }}
        >
          <Pressable style={{ flex: 1 }} onPress={requestClose} />
        </Animated.View>

        <Animated.View
          {...swipeResponder.panHandlers}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: panelWidth,
            backgroundColor: panelBg,
            borderTopLeftRadius: 16,
            borderBottomLeftRadius: 16,
            shadowColor: '#000',
            shadowOffset: { width: -8, height: 0 },
            shadowOpacity: isDark ? 0.45 : 0.12,
            shadowRadius: 16,
            elevation: 16,
            transform: [{ translateX }],
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingTop: insets.top + 10,
              paddingBottom: 12,
              paddingHorizontal: 8,
              borderBottomWidth: 1,
              borderBottomColor: dividerColor,
            }}
          >
            <TouchableOpacity
              onPress={requestClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
            >
              <ChevronLeft color={iconColor} size={24} strokeWidth={2} />
            </TouchableOpacity>
            <AppText weight={BOLD} style={{ flex: 1, fontSize: 15, lineHeight: 20, color: textColor, marginHorizontal: 4 }}>
              Batch Adjust Leverage and Margin Mode
            </AppText>
            <TouchableOpacity
              onPress={requestClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
            >
              <X color={iconColor} size={20} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}
            scrollEnabled={!isSliding}
            showsVerticalScrollIndicator={false}
          >
            <View style={{ paddingBottom: 18, marginBottom: 8 }}>
              {renderSwitchRow(
                'Batch adjust leverage',
                'Apply one leverage across eligible markets',
                levEnabled,
                () => patchDraft({ leverageEnabled: !levEnabled, leverage: clampLev(leverageVal) }),
              )}
              {levEnabled && (
                <View style={{ marginTop: 14, marginBottom: 4 }}>
                  <FuturesLeverageSlider
                    value={clampLev(leverageVal)}
                    onChange={(v) => patchDraft({ leverage: clampLev(v) })}
                    onSlidingChange={setIsSliding}
                    minLeverage={1}
                    maxLeverage={maxLeverage}
                    isDark={isDark}
                    themeColors={themeColors}
                  />
                </View>
              )}
            </View>

            <View style={{ borderTopWidth: 1, borderTopColor: dividerColor, paddingTop: 18, paddingBottom: 18, marginBottom: 8 }}>
              {renderSwitchRow(
                'Batch adjust margin mode',
                'Switch eligible markets to Cross or Isolated',
                modeEnabled,
                () => patchDraft({ marginModeEnabled: !modeEnabled, marginMode: marginModeDraft }),
              )}
              {modeEnabled && (
                <View
                  onLayout={(e) => setSegmentWidth(e.nativeEvent.layout.width)}
                  style={{
                    flexDirection: 'row',
                    marginTop: 14,
                    padding: 4,
                    borderRadius: 12,
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F2F3F5',
                  }}
                >
                  {segmentWidth > 0 && (
                    <Animated.View
                      pointerEvents="none"
                      style={{
                        position: 'absolute',
                        top: 4,
                        left: 4,
                        bottom: 4,
                        width: thumbWidth,
                        borderRadius: 9,
                        backgroundColor: isDark ? '#EAECEF' : '#FFFFFF',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: isDark ? 0 : 0.08,
                        shadowRadius: 3,
                        elevation: isDark ? 0 : 1,
                        transform: [{ translateX: segmentThumbX }],
                      }}
                    />
                  )}
                  {[
                    { key: 'cross', label: 'Cross' },
                    { key: 'isolated', label: 'Isolated' },
                  ].map((opt) => {
                    const active = marginModeDraft === opt.key;
                    return (
                      <TouchableOpacity
                        key={opt.key}
                        activeOpacity={0.8}
                        onPress={() => patchDraft({ marginMode: opt.key })}
                        style={{ flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center' }}
                      >
                        <AppText
                          weight={SEMI_BOLD}
                          style={{
                            fontSize: 14,
                            color: active
                              ? (isDark ? '#1E2329' : '#14161A')
                              : (isDark ? '#848E9C' : '#9A9DA3'),
                          }}
                        >
                          {opt.label}
                        </AppText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                marginTop: 8,
                marginBottom: 12,
                paddingVertical: 12,
                paddingHorizontal: 14,
                borderRadius: 10,
                borderWidth: 1,
                backgroundColor: isDark ? 'rgba(209, 170, 103, 0.12)' : 'rgba(209, 170, 103, 0.10)',
                borderColor: isDark ? 'rgba(209, 170, 103, 0.28)' : 'rgba(209, 170, 103, 0.35)',
              }}
            >
              <AppText style={{ fontSize: 14, lineHeight: 19, color: colors.orangeTheme, marginRight: 10 }}>⚠</AppText>
              <AppText style={{ flex: 1, fontSize: 12.5, lineHeight: 19, color: isDark ? '#C9B07A' : '#8A7340' }}>
                Leverage can update even with open positions. Margin mode only switches on markets with no open
                positions or orders. If leverage exceeds a market maximum, it is adjusted down automatically.
              </AppText>
            </View>
          </ScrollView>

          {/* Footer */}
          <View
            style={{
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: Math.max(12, insets.bottom + 8),
              borderTopWidth: 1,
              borderTopColor: dividerColor,
            }}
          >
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={!canConfirm}
              onPress={handleConfirm}
              style={{
                minHeight: 48,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: canConfirm
                  ? colors.orangeTheme
                  : (isDark ? 'rgba(255, 255, 255, 0.08)' : '#E7E9EC'),
              }}
            >
              {submitting ? (
                <ActivityIndicator color={isDark ? '#1E2329' : '#14161A'} />
              ) : (
                <AppText
                  weight={BOLD}
                  style={{
                    fontSize: 15,
                    color: canConfirm
                      ? (isDark ? '#1E2329' : '#14161A')
                      : (isDark ? '#5E6673' : '#A9ADB5'),
                  }}
                >
                  Confirm
                </AppText>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
