import { ActivityIndicator, Dimensions, Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import RBSheet from "react-native-raw-bottom-sheet";
import CrossMarginRiskModal from "../crossMargin/CrossMarginRiskModal";
import IsolatedMarginRiskModal from "../isolatedMargin/IsolatedMarginRiskModal";
import AddFundsSheet from "../AddFundsSheet";
import { colors } from "../../../theme/colors";
import { universalPaddingHorizontal } from "../../../theme/dimens";
import { AppText } from "../../../shared";
import { setOpenOrders } from "../../../slices/homeSlice";
import { cancelOrder } from "../../../actions/homeActions";
import { getStableId } from "./spotOrderHelpers";

const { width: Width } = Dimensions.get("window");

export function SpotNumberSheet({
  isDark,
  rbSheetNumber,
  renderNumber,
  themeColors,
}) {
  return (
        <RBSheet
          ref={rbSheetNumber}
          closeOnDragDown={true}
          closeOnPressMask={true}
          height={300}
          animationType="none"
          customStyles={{
            container: {
              backgroundColor: isDark ? themeColors.sheetDarkColor : themeColors.themeElevationColor,
              height: 300,
              borderRadius: 10,
              paddingHorizontal: universalPaddingHorizontal,
            },
            wrapper: {
              backgroundColor: "#0006",
            },
            draggableIcon: {
              backgroundColor: "transparent",
            },
          }}
        >
          {renderNumber()}
        </RBSheet>
  );
}

export function SpotOverlaySheets({
  coinBalance,
  crossRisk,
  currencyData,
  dispatch,
  fetchSpotOpenOrdersTab,
  headerTab,
  isCancelLoading,
  isCancelModalVisible,
  isDark,
  isOrderTypeModalVisible,
  isolatedRiskRow,
  lastOrderPlacedTimeRef,
  marginMode,
  openOrdersRef,
  orderToCancel,
  orderTypeSheetHeight,
  rbSheetAddFunds,
  rbSheetCrossRisk,
  rbSheetIsolatedRisk,
  rbSheetMarginConfirm,
  renderMarginConfirmSheet,
  renderOrderTypeSheet,
  setCancelledOrderIds,
  setIsCancelLoading,
  setIsCancelModalVisible,
  setIsOrderTypeModalVisible,
  setOrderToCancel,
  themeColors,
}) {
  return (
    <>
      <CrossMarginRiskModal
        ref={rbSheetCrossRisk}
        risk={crossRisk}
      />
      <IsolatedMarginRiskModal
        ref={rbSheetIsolatedRisk}
        row={isolatedRiskRow}
      />

      {/* Order Type Modal (Native 0-lag) */}
      <Modal
        visible={isOrderTypeModalVisible}
        transparent={true}
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={() => setIsOrderTypeModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setIsOrderTypeModalVisible(false)}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "flex-end",
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e?.stopPropagation?.()}
            style={{
              backgroundColor: isDark ? themeColors.sheetDarkColor : themeColors.themeElevationColor,
              height: orderTypeSheetHeight,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingHorizontal: universalPaddingHorizontal,
              paddingTop: 12,
              paddingBottom: 8,
            }}
          >
            <View style={{ alignItems: "center", marginBottom: 8 }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: isDark ? colors.white_opacity : colors.black_opacity }} />
            </View>
            {renderOrderTypeSheet()}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Add Funds Bottom Sheet */}
      <RBSheet
        ref={rbSheetAddFunds}
        closeOnDragDown={true}
        closeOnPressMask={true}
        height={500}
        animationType="fade"
        openDuration={250}
        closeDuration={200}
        customModalProps={{ statusBarTranslucent: true }}
        customStyles={{
          container: {
            backgroundColor: isDark ? themeColors.sheetDarkColor : themeColors.themeElevationColor,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingHorizontal: universalPaddingHorizontal,
            paddingTop: 12,
            paddingBottom: 8,
          },
          wrapper: {
            backgroundColor: "#0006",
          },
          draggableIcon: {
            backgroundColor: themeColors.themeBorderColor,
            width: 40,
          },
        }}
      >
        <AddFundsSheet
          coinBalance={coinBalance}
          currencyData={currencyData}
          themeColors={themeColors}
          isDark={isDark}
          marginMode={marginMode}
          onClose={() => rbSheetAddFunds?.current?.close()}
        />
      </RBSheet>

      {/* Margin Order Confirm Bottom Sheet */}
      <RBSheet
        ref={rbSheetMarginConfirm}
        closeOnDragDown={true}
        closeOnPressMask={true}
        height={460}
        animationType="fade"
        openDuration={250}
        closeDuration={200}
        customModalProps={{ statusBarTranslucent: true }}
        customStyles={{
          container: {
            backgroundColor: isDark ? themeColors.sheetDarkColor : themeColors.themeElevationColor,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingHorizontal: universalPaddingHorizontal,
            paddingTop: 12,
            paddingBottom: 8,
          },
          wrapper: {
            backgroundColor: "#0006",
          },
          draggableIcon: {
            backgroundColor: themeColors.themeBorderColor,
            width: 40,
          },
        }}
      >
        {renderMarginConfirmSheet()}
      </RBSheet>

      {/* Cancel Order Modal (In-Screen Root Overlay - Zero Android Dialog artifact) */}
      {isCancelModalVisible && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              zIndex: 99999,
              elevation: 99999,
              backgroundColor: "rgba(0,0,0,0.6)",
              justifyContent: "center",
              alignItems: "center",
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setIsCancelModalVisible(false)}
            style={StyleSheet.absoluteFillObject}
          />
          <View
            style={{
              backgroundColor: isDark ? themeColors.sheetDarkColor : themeColors.themeElevationColor,
              borderRadius: 20,
              padding: 25,
              width: Width * 0.85,
              alignSelf: "center",
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.25,
              shadowRadius: 20,
              elevation: 10,
              borderWidth: 1,
              borderColor: themeColors.themeBorderColor,
            }}
          >
            <AppText
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: themeColors.text,
                textAlign: "center",
                marginBottom: 15,
              }}
            >
              Cancel Order
            </AppText>

            <AppText
              style={{
                fontSize: 15,
                color: themeColors.secondaryText,
                textAlign: "center",
                marginBottom: 25,
                lineHeight: 22,
              }}
            >
              Are you sure you want to cancel this order?
            </AppText>

            <View style={{ flexDirection: "row", width: "100%", gap: 10 }}>
              <TouchableOpacity
                onPress={() => setIsCancelModalVisible(false)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  backgroundColor: themeColors.themeElevationColor,
                  borderWidth: 1,
                  borderColor: themeColors.themeBorderColor,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AppText style={{ fontSize: 14, fontWeight: "600", color: themeColors.text }}>
                  No, Keep
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={isCancelLoading}
                onPress={async () => {
                  const orderId = orderToCancel?._id?.$oid || orderToCancel?._id || orderToCancel?.order_id || orderToCancel?.id;
                  if (orderId) {
                    setIsCancelLoading(true);
                    let tt = undefined;
                    if (headerTab === "Margin") tt = marginMode === "Cross" ? "cross" : "margin";
                    const res = await dispatch(cancelOrder({ order_id: orderId, tradeType: tt }));
                    setIsCancelLoading(false);
                    if (res?.success) {
                      lastOrderPlacedTimeRef.current = 0;
                      setCancelledOrderIds((prev) => new Set(prev).add(String(orderId)));
                      const currentOrders = openOrdersRef.current ?? [];
                      const updatedOrders = currentOrders.filter((o) => getStableId(o) !== String(orderId));
                      dispatch(setOpenOrders(updatedOrders));
                      setIsCancelModalVisible(false);
                      setOrderToCancel(null);
                      setTimeout(() => {
                        fetchSpotOpenOrdersTab(true);
                      }, 200);
                    }
                  } else {
                    setIsCancelModalVisible(false);
                    setOrderToCancel(null);
                  }
                }}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  backgroundColor: themeColors.red,
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: themeColors.red,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 5,
                  opacity: isCancelLoading ? 0.7 : 1,
                }}
              >
                {isCancelLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <AppText style={{ fontSize: 14, fontWeight: "600", color: "#FFFFFF" }}>
                    Yes, Cancel
                  </AppText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </>
  );
}
