import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, ActivityIndicator, TextInput, Platform } from 'react-native';
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
        style={{ height: 30, justifyContent: "center", paddingVertical: 10 }}
      >
        <View style={{ height: 6, backgroundColor: isDark ? "#2A2A2A" : "#E5E7EB", borderRadius: 3, width: "100%" }} />
        <View style={{ height: 6, backgroundColor: themeColors.spotTradeBuy || colors.green, borderRadius: 3, width: `${value}%`, position: "absolute", left: 0 }} />
        <View
          style={{ position: "absolute", left: `${value}%`, width: 16, height: 16, borderRadius: 8, backgroundColor: themeColors.spotTradeBuy || colors.green, marginLeft: -8 }}
          pointerEvents="none"
        />
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4, paddingHorizontal: 4 }}>
        {[0, 25, 50, 75, 100].map((pct) => (
          <TouchableOpacity key={pct} onPress={() => onValueChange(pct)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <AppText style={{ fontSize: 11, color: value >= pct ? themeColors.text : themeColors.secondaryText }}>{pct}%</AppText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const FuturesClosePositionModal = ({ visible, onClose, onConfirm, isDark, themeColors, loading, pos }) => {
  const [closePositionType, setClosePositionType] = useState('MARKET');
  const [closePositionPrice, setClosePositionPrice] = useState('');
  const [closePositionQty, setClosePositionQty] = useState('');
  const [closePositionSliderPct, setClosePositionSliderPct] = useState(0);
  const [isQtyFocused, setIsQtyFocused] = useState(false);

  useEffect(() => {
    if (visible && pos) {
      setClosePositionType('MARKET');
      const markPx = decNum(pos.mark_price);
      if (Number.isFinite(markPx)) setClosePositionPrice(String(markPx));
      const qty = decNum(pos.quantity);
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

  const displayQty = (!isQtyFocused && closePositionSliderPct > 0)
    ? `${closePositionSliderPct}% (≈${closePositionQty})`
    : closePositionQty;

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
      height={580}
      customStyles={{
        wrapper: {
          backgroundColor: "rgba(0,0,0,0.5)"
        },
        draggableIcon: {
          backgroundColor: "transparent",
        },
        container: {
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          paddingHorizontal: 16,
          paddingBottom: 24,
          backgroundColor: isDark ? colors.bottomsheetDark || "#1E1E1E" : colors.white
        }
      }}
    >
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16, marginTop: 4 }}>
            <AppText style={{ color: themeColors.text, fontSize: 18 }} weight={BOLD}>
              Close by {closePositionType === "MARKET" ? "Market" : "Limit"}
            </AppText>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <AppText style={{ color: themeColors.secondaryText, fontSize: 20 }}>✕</AppText>
            </TouchableOpacity>
          </View>

          {/* Subtitle */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 }}>
            <AppText style={{ color: themeColors.text, fontSize: 13 }} weight={SEMI_BOLD}>
              {pos?.symbol ? pos.symbol.replace("USDT", "/USDT") : "—"}
            </AppText>
            <AppText style={{ color: themeColors.secondaryText }}>·</AppText>
            <AppText style={{ color: themeColors.secondaryText, fontSize: 13 }}>
              {String(pos?.margin_type ?? "ISOLATED").toUpperCase()}
            </AppText>
            <AppText style={{ color: themeColors.secondaryText }}>·</AppText>
            <AppText style={{ color: isLong ? themeColors.spotTradeBuy || colors.green : themeColors.spotTradeSell || colors.red, fontSize: 13 }} weight={BOLD}>
              {isLong ? "L" : "S"}
            </AppText>
          </View>

          {/* Type Toggle */}
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
            {["MARKET", "LIMIT"].map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => {
                  setClosePositionType(t);
                  const maxQty = parseFloat(pos?.quantity || 0);
                  if (t === "LIMIT") {
                    setClosePositionQty(maxQty > 0 ? maxQty.toFixed(8).replace(/\.?0+$/, "") : "");
                    setClosePositionSliderPct(100);
                  } else {
                    setClosePositionQty(maxQty > 0 ? maxQty.toFixed(8).replace(/\.?0+$/, "") : "");
                    setClosePositionSliderPct(100);
                  }
                }}
                style={{
                  flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center",
                  backgroundColor: closePositionType === t ? (isDark ? colors.white : "#111827") : (isDark ? "#2A2A2A" : "#f3f4f6"),
                  borderWidth: closePositionType === t ? 0 : 1, borderColor: isDark ? "#444" : "#e5e7eb",
                }}
              >
                <AppText style={{ color: closePositionType === t ? (isDark ? colors.black : colors.white) : themeColors.text, fontSize: 13 }} weight={MEDIUM}>
                  {t === "MARKET" ? "Market" : "Limit"}
                </AppText>
              </TouchableOpacity>
            ))}
          </View>

          {/* Limit Price Input */}
          {closePositionType === "LIMIT" && (
            <View style={{ marginBottom: 12, position: "relative" }}>
              <TextInput
                style={{
                  backgroundColor: isDark ? "#2A2A2A" : "#f9fafb", borderWidth: 1, borderColor: isDark ? "#444" : "#e5e7eb",
                  borderRadius: 10, padding: 12, color: themeColors.text, fontSize: 14,
                }}
                placeholder="Price" placeholderTextColor={themeColors.secondaryText} keyboardType="numeric"
                value={closePositionPrice} onChangeText={setClosePositionPrice}
              />
              <View style={{ position: "absolute", right: 14, top: 0, bottom: 0, justifyContent: "center" }}>
                <AppText style={{ color: themeColors.secondaryText, fontSize: 12 }}>{quoteAsset}</AppText>
              </View>
            </View>
          )}

          {/* Size Input */}
          <View style={{ marginBottom: closePositionType === "LIMIT" ? 4 : 16, position: "relative" }}>
            <AppText style={{ color: themeColors.secondaryText, fontSize: 12, marginBottom: 4 }}>Size</AppText>
            <View style={{ position: "relative" }}>
              <TextInput
                style={{
                  backgroundColor: isDark ? "#2A2A2A" : "#f9fafb", borderWidth: 1, borderColor: isDark ? "#444" : "#e5e7eb",
                  borderRadius: 10, padding: 12, color: themeColors.text, fontSize: 14,
                }}
                placeholder="0" placeholderTextColor={themeColors.secondaryText} keyboardType={isQtyFocused ? "numeric" : "default"}
                editable={closePositionType === "LIMIT" || closePositionType === "MARKET"}
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
              <View style={{ position: "absolute", right: 14, top: 0, bottom: 0, justifyContent: "center" }}>
                <AppText style={{ color: themeColors.secondaryText, fontSize: 12 }}>{baseAsset}</AppText>
              </View>
            </View>
          </View>

          {/* Slider */}
          <View style={{ marginBottom: 16, marginTop: 12 }}>
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

          {/* Info Rows */}
          <View style={{ borderTopWidth: 1, borderTopColor: isDark ? "#444" : "#f3f4f6", paddingTop: 12, marginBottom: 16 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 }}>
              <AppText style={{ color: themeColors.secondaryText, fontSize: 12 }}>Holding</AppText>
              <AppText style={{ color: themeColors.text, fontSize: 12 }} weight={MEDIUM}>
                {pos?.quantity ? (Math.floor(parseFloat(pos.quantity) * 100000000) / 100000000).toFixed(8).replace(/\.?0+$/, "") : "—"} {baseAsset}
              </AppText>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 }}>
              <AppText style={{ color: themeColors.secondaryText, fontSize: 12 }}>Unrealized PNL</AppText>
              <AppText style={{ color: pos?.unrealized_pnl >= 0 ? colors.green : colors.red, fontSize: 12 }} weight={MEDIUM}>
                {pos?.unrealized_pnl ? parseFloat(pos.unrealized_pnl).toFixed(4) : "0.0000"} {quoteAsset}
              </AppText>
            </View>
          </View>

          {/* Warning */}
          {closePositionType === "MARKET" && (
            <AppText style={{ color: "#d97706", fontSize: 12, marginBottom: 16 }}>
              The system will cancel position orders and execute the position assets as a market order.
            </AppText>
          )}

          {/* Footer */}
          <TouchableOpacity
            style={{ backgroundColor: isDark ? colors.white : "#111827", paddingVertical: 14, borderRadius: 10, alignItems: "center" }}
            disabled={loading}
            onPress={handleConfirm}
          >
            {loading ? (
              <ActivityIndicator size="small" color={isDark ? colors.black : colors.white} />
            ) : (
              <AppText style={{ color: isDark ? colors.black : colors.white, fontSize: 15 }} weight={BOLD}>Confirm</AppText>
            )}
          </TouchableOpacity>
        </View>
    </RBSheet>
  );
};

export default FuturesClosePositionModal;
