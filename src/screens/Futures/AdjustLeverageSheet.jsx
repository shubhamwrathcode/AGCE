import React from 'react';
import { Modal, ScrollView, TouchableOpacity, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, BOLD, MEDIUM, SEMI_BOLD } from '../../shared';
import { closeIcon } from '../../helper/ImageAssets';

const GOLD = '#D1AA67';

/**
 * "Adjust Leverage" bottom sheet — mirrors web `agce-margin-lvg-modal-*` (mobile layout).
 * Shared by Futures leverage and Spot → Margin leverage.
 */
export default function AdjustLeverageSheet({
  visible,
  onClose,
  isDark = true,
  fieldLabel = 'Pair',
  coinIcon = null,
  coinLabel,
  slider,
  error = '',
  notes = [],
  warning = '',
  children,
  scrollEnabled = true,
  showCancel = true,
  busy = false,
  confirmLabel = 'Confirm',
  onConfirm,
}) {
  const insets = useSafeAreaInsets();

  const panelBg = isDark ? '#111214' : '#FFFFFF';
  const panelBorder = isDark ? 'rgba(255, 255, 255, 0.12)' : 'transparent';
  const headBorder = isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0';
  const titleColor = isDark ? '#FFFFFF' : '#0F172A';
  const closeColor = isDark ? '#94A3B8' : '#64748B';
  const labelColor = isDark ? '#94A3B8' : '#64748B';
  const ghostBg = isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9';
  const ghostText = isDark ? '#FFFFFF' : '#0F172A';
  const primaryText = isDark ? '#1E2329' : '#14161A';

  const requestClose = () => {
    if (!busy) onClose?.();
  };

  const labelStyle = { fontSize: 12, color: labelColor, marginBottom: 6 };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={requestClose}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={requestClose}
        style={{ flex: 1, backgroundColor: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.4)', justifyContent: 'flex-end' }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e?.stopPropagation?.()}
          style={{
            maxHeight: '90%',
            backgroundColor: panelBg,
            borderTopLeftRadius: 14,
            borderTopRightRadius: 14,
            borderWidth: 1,
            borderBottomWidth: 0,
            borderColor: panelBorder,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: 16,
              paddingHorizontal: 18,
              paddingBottom: 12,
              borderBottomWidth: 1,
              borderBottomColor: headBorder,
            }}
          >
            <AppText weight={BOLD} style={{ fontSize: 17, color: titleColor }}>
              Adjust Leverage
            </AppText>
            <TouchableOpacity
              onPress={requestClose}
              disabled={busy}
              style={{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}
            >
              <FastImage source={closeIcon} resizeMode="contain" style={{ width: 14, height: 14 }} tintColor={closeColor} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            scrollEnabled={scrollEnabled}
            style={{ flexGrow: 0, flexShrink: 1 }}
            contentContainerStyle={{ paddingTop: 16, paddingHorizontal: 18, paddingBottom: 8 }}
          >
            <AppText weight={MEDIUM} style={labelStyle}>{fieldLabel}</AppText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              {coinIcon}
              <AppText weight={BOLD} style={{ fontSize: 16, color: titleColor }}>{coinLabel || '—/—'}</AppText>
            </View>

            <AppText weight={MEDIUM} style={labelStyle}>Leverage</AppText>
            {slider}

            {!!error && (
              <AppText style={{ fontSize: 12, color: '#EF4444', marginTop: -12, marginBottom: 8 }}>{error}</AppText>
            )}

            <View style={{ marginBottom: 12 }}>
              {notes.map((note, i) => (
                <AppText
                  key={i}
                  style={{ fontSize: 12, lineHeight: 18, color: '#64748B', marginBottom: i === notes.length - 1 ? 0 : 8 }}
                >
                  {note}
                </AppText>
              ))}
            </View>

            {!!warning && (
              <AppText style={{ fontSize: 12, lineHeight: 17, color: '#EA580C', marginBottom: 8 }}>{warning}</AppText>
            )}

            {children}
          </ScrollView>

          <View
            style={{
              flexDirection: 'row',
              gap: 10,
              paddingTop: 14,
              paddingHorizontal: 18,
              paddingBottom: 18 + insets.bottom,
            }}
          >
            {showCancel && (
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={busy}
                onPress={requestClose}
                style={{
                  flex: 0.65,
                  maxWidth: '34%',
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  borderRadius: 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: ghostBg,
                }}
              >
                <AppText weight={SEMI_BOLD} style={{ fontSize: 13, color: ghostText }}>Cancel</AppText>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={busy}
              onPress={onConfirm}
              style={{
                flex: 2.1,
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 8,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: GOLD,
              }}
            >
              <AppText weight={SEMI_BOLD} style={{ fontSize: 13, color: primaryText }}>{confirmLabel}</AppText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
