import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, ActivityIndicator, TextInput, Platform, ScrollView } from 'react-native';
import { KeyboardAwareScrollView } from '@codler/react-native-keyboard-aware-scroll-view';
import RBSheet from 'react-native-raw-bottom-sheet';
import { AppText, BOLD, FOURTEEN, MEDIUM, SEMI_BOLD, TWELVE, SIXTEEN } from '../../../common';
import { colors } from '../../../theme/colors';
import { fontFamilyMedium, fontFamilySemiBold } from '../../../theme/typography';
import { decNum } from '../../../helper/futuresUtils';

const CustomDraggableSlider = ({ value, onValueChange, themeColors, isDark }) => {
  const [trackWidth, setTrackWidth] = useState(0);

  const updateValue = (locationX) => {
    if (trackWidth > 0) {
      let newX = locationX;
      if (newX < 0) newX = 0;
      if (newX > trackWidth) newX = trackWidth;
      const newPct = Math.round((newX / trackWidth) * 100);
      onValueChange(newPct);
    }
  };

  return (
    <View style={{ marginBottom: 16 }}>
      <View
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onResponderGrant={(evt) => updateValue(evt.nativeEvent.locationX)}
        onResponderMove={(evt) => updateValue(evt.nativeEvent.locationX)}
        style={{ height: 40, justifyContent: "center", paddingVertical: 10 }}
      >
        <View style={{ height: 4, backgroundColor: isDark ? "#444" : "#E5E7EB", borderRadius: 2 }}>
          <View style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${value}%`, backgroundColor: themeColors.text, borderRadius: 2 }} />
        </View>
        <View style={{ position: "absolute", left: `${value}%`, marginLeft: -10, width: 20, height: 20, borderRadius: 10, backgroundColor: themeColors.text, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 2, borderWidth: 2, borderColor: colors.white }} />
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        {[0, 25, 50, 75, 100].map((step) => (
          <TouchableOpacity key={step} onPress={() => onValueChange(step)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <AppText style={{ color: themeColors.secondaryText, fontSize: 10 }}>{step}%</AppText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const FuturesClosePositionModal = ({ visible, onClose, onConfirm, isDark, themeColors, loading, pos }) => {
  const [closePositionType, setClosePositionType] = useState('MARKET');
  const [closePositionPrice, setClosePositionPrice] = useState("");
  const [closePositionQty, setClosePositionQty] = useState("");
  const [closePositionSliderPct, setClosePositionSliderPct] = useState(100);
  const [isQtyFocused, setIsQtyFocused] = useState(false);

  useEffect(() => {
    if (visible && pos) {
      setClosePositionType('MARKET');
      const markPx = decNum(pos.computedMark ?? pos.mark_price);
      if (Number.isFinite(markPx)) setClosePositionPrice(String(markPx));
      const qty = decNum(pos.computedQty ?? pos.quantity);
      if (Number.isFinite(qty)) {
        setClosePositionQty(String(qty));
        setClosePositionSliderPct(100);
      }
    } else {
      setClosePositionSliderPct(0);
    }
  }, [visible, pos]);

  const handleConfirm = () => {
    onConfirm({ orderType: closePositionType, price: closePositionPrice, quantity: closePositionQty });
  };

  const isLong = pos?.side === "LONG";
  const baseAsset = pos?.symbol ? pos.symbol.replace(/USDT.*/, '') : "";
  const quoteAsset = pos?.symbol && pos.symbol.includes("USDT") ? "USDT" : "USD";

  const displayQty = closePositionQty;

  const sheetRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        sheetRef.current?.open();
      }, 100);
    } else {
      sheetRef.current?.close();
    }
  }, [visible]);

  return (
    <RBSheet
      ref={sheetRef}
      keyboardAvoidingViewEnabled={Platform.OS === 'ios'}
      {...({ customModalProps: { statusBarTranslucent: true } })}
      closeOnDragDown={true}
      closeOnPressMask={true}
      onClose={onClose}
      height={600}
      customStyles={{
        wrapper: {
          backgroundColor: "rgba(0,0,0,0.5)"
        },
        draggableIcon: {
          backgroundColor: isDark ? "#444" : "#E5E7EB",
          width: 40,
        },
        container: {
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          paddingHorizontal: 16,
          paddingBottom: 24,
          backgroundColor: isDark ? themeColors.background || "#1E1E1E" : colors.white
        }
      }}
    >
      <KeyboardAwareScrollView
        style={{ flex: 1, marginTop: 8 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        extraScrollHeight={Platform.OS === 'ios' ? 24 : 60}
      >
        {/* Header */}
        <View style={{ marginBottom: 20 }}>
          <AppText style={{ color: themeColors.text, fontSize: 18 }} weight={BOLD}>
            Close Position
          </AppText>
        </View>

        {/* Info Block */}
        <View style={{ marginBottom: 24 }}>
          {/* Symbol Row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
            <AppText style={{ color: themeColors.secondaryText, fontSize: 14 }}>Symbol</AppText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <AppText style={{ color: themeColors.text, fontSize: 14 }} weight={SEMI_BOLD}>
                {baseAsset}{quoteAsset} <AppText style={{ color: themeColors.secondaryText, fontSize: 12 }} weight={MEDIUM}>Perp</AppText>
              </AppText>
              <View style={{ backgroundColor: isLong ? 'rgba(38, 166, 154, 0.15)' : 'rgba(239, 83, 80, 0.15)', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 }}>
                <AppText style={{ color: isLong ? colors.green : colors.red, fontSize: 10 }} weight={SEMI_BOLD}>
                  {isLong ? 'Long' : 'Short'} {pos?.leverage}x
                </AppText>
              </View>
            </View>
          </View>

          {/* Entry Price Row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <AppText style={{ color: themeColors.secondaryText, fontSize: 14 }}>Entry Price ({quoteAsset})</AppText>
            <AppText style={{ color: themeColors.text, fontSize: 14 }} weight={MEDIUM}>
              {Number(decNum(pos?.average_entry_price ?? pos?.entry_price) || 0).toFixed(2)}
            </AppText>
          </View>

          {/* Mark Price Row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <AppText style={{ color: themeColors.secondaryText, fontSize: 14 }}>Mark Price ({quoteAsset})</AppText>
            <AppText style={{ color: themeColors.text, fontSize: 14 }} weight={MEDIUM}>
              {parseFloat(pos?.mark_price || 0).toFixed(2)}
            </AppText>
          </View>
        </View>

        {/* Price Section */}
        <View style={{ marginBottom: 20 }}>
          <AppText style={{ color: themeColors.secondaryText, fontSize: 13, marginBottom: 8 }}>Price</AppText>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1, backgroundColor: isDark ? "#2A2A2A" : "#F4F4F4", borderRadius: 8, paddingHorizontal: 12, height: 44, justifyContent: 'center' }}>
              {closePositionType === "MARKET" ? (
                <AppText style={{ color: themeColors.secondaryText, fontSize: 14 }}>Market Price</AppText>
              ) : (
                <TextInput
                  style={{ color: themeColors.text, fontSize: 14, padding: 0 }}
                  placeholder="Price"
                  placeholderTextColor={themeColors.secondaryText}
                  keyboardType="numeric"
                  value={closePositionPrice}
                  onChangeText={setClosePositionPrice}
                />
              )}
            </View>
            <TouchableOpacity
              onPress={() => setClosePositionType(closePositionType === "MARKET" ? "LIMIT" : "MARKET")}
              style={{ backgroundColor: isDark ? "#2A2A2A" : "#F4F4F4", borderRadius: 8, paddingHorizontal: 12, height: 44, width: 100, alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}
            >
              <AppText style={{ color: themeColors.text, fontSize: 14 }}>
                {closePositionType === "MARKET" ? "Market" : "Limit"}
              </AppText>
              <AppText style={{ color: themeColors.secondaryText, fontSize: 10 }}>▼</AppText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Amount Section */}
        <View style={{ marginBottom: 16 }}>
          <AppText style={{ color: themeColors.secondaryText, fontSize: 13, marginBottom: 8 }}>Amount</AppText>
          <View style={{ backgroundColor: isDark ? "#2A2A2A" : "#F4F4F4", borderRadius: 8, paddingHorizontal: 12, height: 44, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <TextInput
              style={{ color: themeColors.text, fontSize: 14, padding: 0, flex: 1 }}
              placeholder="0"
              placeholderTextColor={themeColors.secondaryText}
              keyboardType={isQtyFocused ? "numeric" : "default"}
              value={displayQty}
              onFocus={() => setIsQtyFocused(true)}
              onBlur={() => setIsQtyFocused(false)}
              onChangeText={(val) => {
                setClosePositionQty(val);
                const maxQty = parseFloat(pos?.quantity || 0);
                const v = parseFloat(val || 0);
                if (maxQty > 0) {
                  setClosePositionSliderPct(Math.min(100, Math.round((v / maxQty) * 100)));
                }
              }}
            />
            <AppText style={{ color: themeColors.secondaryText, fontSize: 14, marginLeft: 8 }}>{baseAsset}</AppText>
          </View>
        </View>

        {/* Slider */}
        {/*
        <View style={{ marginBottom: 24, paddingHorizontal: 8 }}>
          <CustomDraggableSlider
            value={closePositionSliderPct}
            onValueChange={(pct) => {
              const maxQty = parseFloat(pos?.quantity || 0);
              const qty = maxQty > 0 ? (maxQty * pct / 100) : 0;
              setClosePositionQty(qty.toFixed(8).replace(/\.?0+$/, "") || "0");
              setClosePositionSliderPct(pct);
            }}
            themeColors={themeColors}
            isDark={isDark}
          />
        </View>
        */}

        {/* Bottom Summary */}
        <View style={{ gap: 8, marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <AppText style={{ color: themeColors.secondaryText, fontSize: 13 }}>Position Amount</AppText>
            <AppText style={{ color: themeColors.text, fontSize: 13 }} weight={MEDIUM}>
              {closePositionQty || 0} {baseAsset}
            </AppText>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <AppText style={{ color: themeColors.secondaryText, fontSize: 13 }}>Estimated PNL</AppText>
            <AppText style={{ color: pos?.unrealized_pnl >= 0 ? colors.green : colors.red, fontSize: 13 }} weight={MEDIUM}>
              {pos?.unrealized_pnl ? ((parseFloat(pos.unrealized_pnl) * closePositionSliderPct) / 100).toFixed(4) : "0.0000"} {quoteAsset}
            </AppText>
          </View>
        </View>

        <View style={{ flex: 1 }} />

        {/* Footer Confirm Button */}
        <TouchableOpacity
          style={{ backgroundColor: isDark ? colors.white : "#000000", paddingVertical: 14, borderRadius: 10, alignItems: "center" }}
          disabled={loading}
          onPress={handleConfirm}
        >
          {loading ? (
            <ActivityIndicator size="small" color={isDark ? colors.black : colors.white} />
          ) : (
            <AppText style={{ color: isDark ? colors.black : colors.white, fontSize: 15 }} weight={BOLD}>Confirm</AppText>
          )}
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </RBSheet>
  );
};

export default FuturesClosePositionModal;

