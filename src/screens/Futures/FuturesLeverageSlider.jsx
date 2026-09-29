import React, { useMemo, useRef, useState } from 'react';
import { PanResponder, TouchableOpacity, View } from 'react-native';
import { AppText, BOLD, MEDIUM } from '../../shared';

const MAX_SLIDER_TICKS = 6;
const THUMB_SIZE = 18;
const THUMB_HALF = THUMB_SIZE / 2;
const RAIL_HEIGHT = 28;
const TRACK_HEIGHT = 4;
const TICK_LABEL_WIDTH = 44;

/** Pick exactly `maxTicks` values from a sorted list (first + last + evenly spaced between). */
function buildSliderStops(sorted, maxTicks = MAX_SLIDER_TICKS) {
  if (sorted.length <= maxTicks) return sorted;
  const picks = [];
  for (let i = 0; i < maxTicks; i += 1) {
    picks.push(sorted[Math.round((i / (maxTicks - 1)) * (sorted.length - 1))]);
  }
  return [...new Set(picks)].sort((a, b) => a - b);
}

function normalizeAllowedValues(allowedValues) {
  if (!Array.isArray(allowedValues) || allowedValues.length === 0) return null;
  const sorted = [...new Set(allowedValues.map((x) => Math.round(Number(x))).filter((n) => Number.isFinite(n) && n > 0))]
    .sort((a, b) => a - b);
  return sorted.length ? sorted : null;
}

function snapToAllowed(n, allowedSorted) {
  const x = Number(n);
  if (!Number.isFinite(x)) return allowedSorted[0];
  const rounded = Math.round(x);
  if (allowedSorted.includes(rounded)) return rounded;
  return allowedSorted.reduce((best, v) => (Math.abs(v - x) < Math.abs(best - x) ? v : best), allowedSorted[0]);
}

/** Up to 6 tick labels — same stops as the web leverage slider (all values when a short allowed list is given). */
export function getLeverageSliderTicks(maxLeverage, allowedValues = null) {
  const allowed = normalizeAllowedValues(allowedValues);
  if (allowed) {
    return allowed.length <= 10 ? allowed : buildSliderStops(allowed, MAX_SLIDER_TICKS);
  }
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

/**
 * − / value / + stepper + draggable slider with tick labels (mirrors web FuturesLeverageSlider).
 * When `allowedValues` is set (e.g. margin isolated [1..10] or cross [3, 5]), only those values are selectable.
 */
export default function FuturesLeverageSlider({
  value,
  onChange,
  onSlidingChange,
  minLeverage = 1,
  maxLeverage = 125,
  allowedValues = null,
  isDark = true,
  themeColors = {},
}) {
  const allowedKey = Array.isArray(allowedValues) ? allowedValues.join(',') : '';
  // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by contents, not array identity
  const allowedSorted = useMemo(() => normalizeAllowedValues(allowedValues), [allowedKey]);

  const max = allowedSorted
    ? allowedSorted[allowedSorted.length - 1]
    : Math.max(1, Math.round(Number(maxLeverage) || 125));
  const min = allowedSorted
    ? allowedSorted[0]
    : Math.max(1, Math.round(Number(minLeverage) || 1));

  const clamp = (n) => {
    if (allowedSorted) return snapToAllowed(n, allowedSorted);
    const x = Number(n);
    if (!Number.isFinite(x) || x < min) return min;
    return Math.min(Math.round(x), max);
  };

  const bump = (delta) => {
    if (allowedSorted) {
      const idx = allowedSorted.indexOf(current);
      const from = idx >= 0 ? idx : allowedSorted.findIndex((v) => v >= current);
      const base = from >= 0 ? from : 0;
      onChange?.(allowedSorted[Math.max(0, Math.min(allowedSorted.length - 1, base + delta))]);
      return;
    }
    onChange?.(clamp(current + delta));
  };

  const current = clamp(value);
  const [trackWidth, setTrackWidth] = useState(0);
  const fillRatio = max > min ? (current - min) / (max - min) : 0;
  const ticks = useMemo(() => getLeverageSliderTicks(max, allowedSorted), [max, allowedSorted]);

  const latest = useRef({});
  latest.current = { trackWidth, min, max, onChange, onSlidingChange, allowedSorted };
  const grantXRef = useRef(0);
  const lastEmittedRef = useRef(null);

  const emitAt = (x) => {
    const { trackWidth: w, min: lo, max: hi, onChange: cb, allowedSorted: allowed } = latest.current;
    if (!w) return;
    const ratio = Math.min(1, Math.max(0, x / w));
    const raw = lo + ratio * (hi - lo);
    const next = allowed ? snapToAllowed(raw, allowed) : Math.round(raw);
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
  const stepRowBg = isDark ? '#222325' : '#F8FAFC';
  const stepRowBorder = isDark ? 'rgba(203, 213, 225, 0.06)' : '#CBD5E1';
  const stepBtnBg = isDark ? '#222325' : '#FFFFFF';
  const stepBtnText = isDark ? '#E6E6E6' : '#334155';
  const stepDivider = isDark ? 'rgba(226, 232, 240, 0.1)' : '#E2E8F0';
  const stepValText = isDark ? '#FFFFFF' : '#0F172A';
  const tickActiveText = isDark ? '#B2B2B2' : '#0F172A';

  const tickPct = (x) => (max <= min ? 0 : Math.min(1, Math.max(0, (x - min) / (max - min))));

  return (
    <View style={{ marginBottom: 16 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'stretch',
          height: 40,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: stepRowBorder,
          backgroundColor: stepRowBg,
          overflow: 'hidden',
          marginBottom: 16,
        }}
      >
        <TouchableOpacity
          onPress={() => bump(-1)}
          activeOpacity={0.8}
          style={{ width: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: stepBtnBg, borderRightWidth: 1, borderRightColor: stepDivider }}
        >
          <AppText style={{ fontSize: 16, color: stepBtnText }}>−</AppText>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <AppText weight={MEDIUM} style={{ fontSize: 14, color: stepValText }}>{current}x</AppText>
        </View>
        <TouchableOpacity
          onPress={() => bump(1)}
          activeOpacity={0.8}
          style={{ width: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: stepBtnBg, borderLeftWidth: 1, borderLeftColor: stepDivider }}
        >
          <AppText style={{ fontSize: 16, color: stepBtnText }}>+</AppText>
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
          const isActive = current >= x;
          return (
            <TouchableOpacity
              key={`${x}-${i}`}
              onPress={() => onChange?.(clamp(x))}
              hitSlop={{ top: 8, bottom: 8 }}
              style={{
                position: 'absolute',
                left: tickPct(x) * trackWidth - TICK_LABEL_WIDTH / 2,
                width: TICK_LABEL_WIDTH,
                alignItems: 'center',
              }}
            >
              <AppText
                weight={isActive ? BOLD : MEDIUM}
                numberOfLines={1}
                style={{ fontSize: 11, color: isActive ? tickActiveText : '#94A3B8' }}
              >
                {x}x
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
