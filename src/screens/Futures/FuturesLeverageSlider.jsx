import React, { useMemo, useRef, useState } from 'react';
import { PanResponder, TouchableOpacity, View } from 'react-native';
import { AppText, MEDIUM, SEMI_BOLD } from '../../shared';

const MAX_SLIDER_TICKS = 6;
const THUMB_SIZE = 18;
const THUMB_HALF = THUMB_SIZE / 2;
const RAIL_HEIGHT = 28;
const TRACK_HEIGHT = 4;
const TICK_LABEL_WIDTH = 44;

/** Up to 6 tick labels — same stops as the web leverage slider. */
export function getLeverageSliderTicks(maxLeverage) {
  const max = Math.max(1, Math.round(Number(maxLeverage) || 125));
  if (max <= 1) return [1];
  if (max === 10) return [1, 5, 10];
  if (max === 20) return [1, 4, 8, 12, 16, 20];
  if (max === 25) return [1, 5, 10, 15, 20, 25];
  if (max === 50) return [1, 10, 20, 30, 40, 50];
  if (max === 75) return [1, 15, 30, 45, 60, 75];
  if (max === 100) return [1, 20, 40, 60, 80, 100];
  if (max === 125) return [1, 25, 50, 75, 100, 125];

  const stops = [];
  for (let i = 0; i < MAX_SLIDER_TICKS; i += 1) {
    stops.push(Math.round(1 + (i / (MAX_SLIDER_TICKS - 1)) * (max - 1)));
  }
  return stops;
}

/** − / value / + stepper + draggable slider with tick labels (mirrors web FuturesLeverageSlider). */
export default function FuturesLeverageSlider({
  value,
  onChange,
  onSlidingChange,
  minLeverage = 1,
  maxLeverage = 125,
  isDark = true,
  themeColors = {},
}) {
  const max = Math.max(1, Math.round(Number(maxLeverage) || 125));
  const min = Math.max(1, Math.round(Number(minLeverage) || 1));

  const clamp = (n) => {
    const x = Number(n);
    if (!Number.isFinite(x) || x < min) return min;
    return Math.min(Math.round(x), max);
  };

  const current = clamp(value);
  const [trackWidth, setTrackWidth] = useState(0);
  const fillRatio = max > min ? (current - min) / (max - min) : 0;
  const ticks = useMemo(() => getLeverageSliderTicks(max), [max]);

  const latest = useRef({});
  latest.current = { trackWidth, min, max, onChange, onSlidingChange };
  const grantXRef = useRef(0);
  const lastEmittedRef = useRef(null);

  const emitAt = (x) => {
    const { trackWidth: w, min: lo, max: hi, onChange: cb } = latest.current;
    if (!w) return;
    const ratio = Math.min(1, Math.max(0, x / w));
    const next = Math.round(lo + ratio * (hi - lo));
    if (next !== lastEmittedRef.current) {
      lastEmittedRef.current = next;
      cb?.(next);
    }
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,
        onPanResponderGrant: (e) => {
          latest.current.onSlidingChange?.(true);
          grantXRef.current = e.nativeEvent.locationX - THUMB_HALF;
          lastEmittedRef.current = null;
          emitAt(grantXRef.current);
        },
        onPanResponderMove: (_, g) => emitAt(grantXRef.current + g.dx),
        onPanResponderRelease: () => latest.current.onSlidingChange?.(false),
        onPanResponderTerminate: () => latest.current.onSlidingChange?.(false),
      }),
    [],
  );

  const trackBg = isDark ? 'rgba(255, 255, 255, 0.2)' : '#E2E8F0';
  const trackFill = isDark ? '#FFFFFF' : '#0F172A';
  const stepBg = isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9';
  const stepDivider = isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0';
  const textColor = themeColors.text || (isDark ? '#FFFFFF' : '#0F172A');

  const tickPct = (x) => (max <= min ? 0 : Math.min(1, Math.max(0, (x - min) / (max - min))));

  return (
    <View style={{ marginBottom: 16 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'stretch',
          height: 50,
          borderRadius: 10,
          backgroundColor: stepBg,
          overflow: 'hidden',
          marginBottom: 18,
        }}
      >
        <TouchableOpacity
          onPress={() => onChange?.(clamp(current - 1))}
          activeOpacity={0.6}
          style={{ width: 64, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: stepDivider }}
        >
          <AppText weight={MEDIUM} style={{ fontSize: 22, color: textColor }}>−</AppText>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <AppText weight={SEMI_BOLD} style={{ fontSize: 18, color: textColor }}>{current}x</AppText>
        </View>
        <TouchableOpacity
          onPress={() => onChange?.(clamp(current + 1))}
          activeOpacity={0.6}
          style={{ width: 64, alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: stepDivider }}
        >
          <AppText weight={MEDIUM} style={{ fontSize: 22, color: textColor }}>+</AppText>
        </TouchableOpacity>
      </View>

      <View
        {...panResponder.panHandlers}
        onLayout={(e) => setTrackWidth(Math.max(0, e.nativeEvent.layout.width - THUMB_SIZE))}
        style={{ height: RAIL_HEIGHT, paddingHorizontal: THUMB_HALF, justifyContent: 'center' }}
      >
        <View pointerEvents="none" style={{ height: TRACK_HEIGHT, borderRadius: 2, backgroundColor: trackBg }}>
          <View
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: fillRatio * trackWidth,
              borderRadius: 2,
              backgroundColor: trackFill,
            }}
          />
        </View>
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: (RAIL_HEIGHT - THUMB_SIZE) / 2,
            left: fillRatio * trackWidth,
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            borderRadius: THUMB_HALF,
            backgroundColor: '#0F172A',
            borderWidth: 2,
            borderColor: '#FFFFFF',
            shadowColor: '#000',
            shadowOpacity: 0.2,
            shadowRadius: 2,
            shadowOffset: { width: 0, height: 1 },
            elevation: 2,
          }}
        />
      </View>

      <View style={{ height: 22, marginTop: 8, marginHorizontal: THUMB_HALF }}>
        {trackWidth > 0 && ticks.map((x, i) => {
          const isFirst = i === 0;
          const isLast = i === ticks.length - 1 && ticks.length > 1;
          let left = tickPct(x) * trackWidth - TICK_LABEL_WIDTH / 2;
          if (isFirst) left = -THUMB_HALF;
          else if (isLast) left = trackWidth + THUMB_HALF - TICK_LABEL_WIDTH;
          return (
            <TouchableOpacity
              key={`${x}-${i}`}
              onPress={() => onChange?.(clamp(x))}
              hitSlop={{ top: 8, bottom: 8 }}
              style={{
                position: 'absolute',
                left,
                width: TICK_LABEL_WIDTH,
                alignItems: isFirst ? 'flex-start' : isLast ? 'flex-end' : 'center',
              }}
            >
              <AppText weight={MEDIUM} numberOfLines={1} style={{ fontSize: 11, color: '#94A3B8' }}>{x}x</AppText>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
