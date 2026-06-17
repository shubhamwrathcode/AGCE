import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Modal, ActivityIndicator, TextInput } from 'react-native';
import { AppText, FOURTEEN, SIXTEEN, TWELVE } from '../../../common';
import { colors } from '../../../theme/colors';
import { fontFamilyMedium, fontFamilySemiBold } from '../../../theme/typography';
import { decNum } from '../../../helper/futuresUtils';

const FuturesClosePositionModal = ({ visible, onClose, onConfirm, isDark, themeColors, loading, pos }) => {
  const [orderType, setOrderType] = useState('MARKET');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');

  useEffect(() => {
    if (visible && pos) {
      setOrderType('MARKET');
      const markPx = decNum(pos.mark_price);
      if (Number.isFinite(markPx)) setPrice(String(markPx));
      const qty = decNum(pos.quantity);
      if (Number.isFinite(qty)) setQuantity(String(qty));
    }
  }, [visible, pos]);

  const handleConfirm = () => {
    onConfirm({ orderType, price, quantity });
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{
          width: '90%',
          backgroundColor: themeColors.background,
          borderRadius: 16,
          padding: 24,
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
        }}>
          <AppText type={SIXTEEN} style={{ color: themeColors.text, fontFamily: fontFamilySemiBold, marginBottom: 16, textAlign: 'center' }}>
            Close Position
          </AppText>
          
          <View style={{ flexDirection: 'row', marginBottom: 16, backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", borderRadius: 8, padding: 4 }}>
            <TouchableOpacity
              onPress={() => setOrderType('MARKET')}
              style={{ flex: 1, paddingVertical: 8, alignItems: 'center', backgroundColor: orderType === 'MARKET' ? (isDark ? '#333' : '#fff') : 'transparent', borderRadius: 6 }}
            >
              <AppText type={FOURTEEN} style={{ color: orderType === 'MARKET' ? themeColors.text : themeColors.secondaryText, fontFamily: fontFamilySemiBold }}>Market</AppText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setOrderType('LIMIT')}
              style={{ flex: 1, paddingVertical: 8, alignItems: 'center', backgroundColor: orderType === 'LIMIT' ? (isDark ? '#333' : '#fff') : 'transparent', borderRadius: 6 }}
            >
              <AppText type={FOURTEEN} style={{ color: orderType === 'LIMIT' ? themeColors.text : themeColors.secondaryText, fontFamily: fontFamilySemiBold }}>Limit</AppText>
            </TouchableOpacity>
          </View>

          {orderType === 'LIMIT' && (
            <View style={{ marginBottom: 16 }}>
              <AppText type={TWELVE} style={{ color: themeColors.secondaryText, marginBottom: 8, fontFamily: fontFamilyMedium }}>Price</AppText>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: themeColors.themeBorderColor || '#e0e0e0',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  color: themeColors.text,
                  fontFamily: fontFamilyMedium,
                }}
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
                placeholder="Enter limit price"
                placeholderTextColor={themeColors.secondaryText}
              />
            </View>
          )}

          <View style={{ marginBottom: 24 }}>
            <AppText type={TWELVE} style={{ color: themeColors.secondaryText, marginBottom: 8, fontFamily: fontFamilyMedium }}>Quantity</AppText>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: themeColors.themeBorderColor || '#e0e0e0',
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: themeColors.text,
                fontFamily: fontFamilyMedium,
              }}
              keyboardType="numeric"
              value={quantity}
              onChangeText={setQuantity}
              placeholder="Enter quantity to close"
              placeholderTextColor={themeColors.secondaryText}
            />
          </View>

          <View style={{ flexDirection: 'row', width: '100%', gap: 12 }}>
            <TouchableOpacity
              onPress={onClose}
              disabled={loading}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 8,
                backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
                alignItems: 'center'
              }}
            >
              <AppText type={FOURTEEN} style={{ color: themeColors.text, fontFamily: fontFamilySemiBold }}>
                Cancel
              </AppText>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleConfirm}
              disabled={loading}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 8,
                backgroundColor: colors.yellow,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center'
              }}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <AppText type={FOURTEEN} style={{ color: colors.white, fontFamily: fontFamilySemiBold }}>
                  Confirm
                </AppText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default FuturesClosePositionModal;
