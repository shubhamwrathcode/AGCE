import React, { memo } from "react";
import { TouchableOpacity, View } from "react-native";
import FastImage from "react-native-fast-image";
import moment from "moment";
import {
  AppText,
  BOLD,
  FIFTEEN,
  FOURTEEN,
  MEDIUM,
  SEMI_BOLD,
  THIRTEEN,
} from "../../../shared";
import { colors, lightTheme } from "../../../theme/colors";
import { downIcon, right_ic } from "../../../helper/ImageAssets";
import { toFixedEight } from "../../../helper/utility";
import NavigationService from "../../../navigation/NavigationService";
import { SPOT_ORDER_HISTORY_DETAIL } from "../../../navigation/routes";
import { safeToFixed8 } from "./spotOrderHelpers";
import { styles } from "./spotStyles";

export const PastOrderItemCard = memo(function PastOrderItemCard({
  inv,
  themeColors,
  isDark,
  base_currency,
  quote_currency,
  buildCurrencyPairText,
  getOrderStatusRaw,
  getOrderStatusLabel,
  getSideColor,
  normalizePairSymbol,
  showExecutedTrades,
  setShowExecutedTrades,
}) {
  const orderId = inv?._id?.$oid || inv?._id || inv?.order_id || inv?.id;
  const baseSym = inv?.ask_currency || inv?.base_currency || base_currency || "";
  const quoteSym = inv?.pay_currency || inv?.quote_currency || quote_currency || "";
  const currencyPair = (baseSym && quoteSym) ? `${baseSym}/${quoteSym}` : buildCurrencyPairText(inv);
  const quoteCc =
    normalizePairSymbol(inv?.pay_currency) ||
    normalizePairSymbol(inv?.fee_asset) ||
    normalizePairSymbol(quote_currency);

  const parseNum = (val) => {
    if (val && val.$numberDecimal != null) return parseFloat(val.$numberDecimal);
    return parseFloat(val);
  };

  const price = parseNum(inv?.price) || 0;
  const qty = parseNum(inv?.quantity) || 0;
  const filled = parseNum(inv?.filled_quantity ?? inv?.filled) || 0;
  const avgPrice = parseNum(inv?.avg_execution_price ?? inv?.avgPrice ?? inv?.average_price) || price;
  const value = parseNum(inv?.executed_value ?? inv?.executedValue) || (avgPrice * filled);
  const feeVal = parseNum(inv?.total_fee ?? inv?.fee) || 0;
  const quoteCurrency =
    inv?.pay_currency ||
    inv?.quote_currency ||
    inv?.quote_currency_short_name ||
    inv?.quote_asset ||
    (typeof currencyPair === "string" && currencyPair.includes("/") ? currencyPair.split("/")[1]?.trim() : "") ||
    "";
  const feeAsset = inv?.fee_asset || quoteCurrency;
  const totalVal = value;

  const statusRaw = getOrderStatusRaw(inv);
  const statusLabel = getOrderStatusLabel(inv);

  const hasExecutedTrades = Array.isArray(inv?.executed_prices) && inv.executed_prices.length > 0;
  const showTrades = !!showExecutedTrades?.[orderId];

  const textColor = themeColors.text;
  const labelColor = isDark ? "#8E8E93" : "#666666";

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => NavigationService.navigate(SPOT_ORDER_HISTORY_DETAIL, { item: inv })}
      style={{
        paddingVertical: 12,
        paddingHorizontal: 0,
        borderBottomWidth: 1,
        borderBottomColor: themeColors.themeBorderColor,
      }}
    >
      <View>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 2 }}>
          <AppText style={{ color: textColor }} type={FIFTEEN} weight={BOLD}>
            {currencyPair}
          </AppText>
          <FastImage
            source={right_ic}
            style={{ width: 11, height: 11, marginLeft: 4 }}
            resizeMode="contain"
            tintColor={labelColor}
          />
        </View>
        <AppText weight={MEDIUM} type={FOURTEEN} style={{ color: labelColor, marginBottom: 2 }}>
          {(() => {
            const d = inv?.updatedAt || inv?.updated_at || inv?.createdAt || inv?.created_at || inv?.date || inv?.timestamp || inv?.time;
            return d ? moment(d).format("DD/MM/YYYY HH:mm:ss") : "---";
          })()}
        </AppText>

        <AppText style={{ marginBottom: 8 }} type={THIRTEEN} weight={BOLD}>
          <AppText weight={MEDIUM} type={THIRTEEN} style={{ color: getSideColor(inv?.side) }}>
            {String(inv?.side || "").toUpperCase()}<AppText weight={MEDIUM} type={THIRTEEN} style={{ color: isDark ? "#8E8E93" : "#666666" }}> · </AppText> <AppText weight={MEDIUM} type={THIRTEEN} style={{ color: colors.white }}>{String(inv?.order_type || inv?.type || inv?.orderType || "").toUpperCase()}</AppText>
          </AppText>
          <AppText weight={MEDIUM} type={THIRTEEN} style={{ color: isDark ? "#8E8E93" : "#666666" }}> · </AppText>
          <AppText weight={MEDIUM} type={THIRTEEN} style={{ color: colors.white }}>
            {statusLabel.toUpperCase()}
          </AppText>
        </AppText>

        <View style={{ gap: 5 }}>
          <View style={styles.kvRow}>
            <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: isDark ? "#8E8E93" : "#666666", flex: 1 }}>Price</AppText>
            <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: textColor, textAlign: "right", flex: 2 }} numberOfLines={3}>
              {String(inv?.order_type || inv?.type || "").toUpperCase() === "MARKET" ? "Market" : safeToFixed8(inv?.price, "—")}
            </AppText>
          </View>
          <View style={styles.kvRow}>
            <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: isDark ? "#8E8E93" : "#666666", flex: 1 }}>Quantity</AppText>
            <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: textColor, textAlign: "right", flex: 2 }} numberOfLines={3}>
              {safeToFixed8(qty, "—")}{baseSym ? ` ${baseSym}` : ""}
            </AppText>
          </View>
          <View style={styles.kvRow}>
            <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: isDark ? "#8E8E93" : "#666666", flex: 1 }}>Fee</AppText>
            <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: textColor, textAlign: "right", flex: 2 }} numberOfLines={3}>
              {`${safeToFixed8(feeVal)}${feeAsset ? ` ${feeAsset}` : ""}`.trim()}
            </AppText>
          </View>
          <View style={styles.kvRow}>
            <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: isDark ? "#8E8E93" : "#666666", flex: 1 }}>Total</AppText>
            <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: textColor, textAlign: "right", flex: 2 }} numberOfLines={3}>
              {safeToFixed8(totalVal)}
            </AppText>
          </View>
        </View>
      </View>

      {hasExecutedTrades && (
        <View style={{ marginTop: 8 }}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.execTradesBtn, {
              borderWidth: 1,
              borderColor: isDark ? 'transparent' : lightTheme.inputBorder,
            }]}
            onPress={() => setShowExecutedTrades((p) => ({ ...p, [orderId]: !p?.[orderId] }))}
          >
            <View style={styles.execTradesBtnRow}>
              <FastImage
                source={downIcon}
                tintColor={isDark ? colors.white : colors.lightGrey}
                style={[
                  styles.orderHistoryChevron,
                  { transform: [{ rotate: showTrades ? "180deg" : "0deg" }] },
                ]}
                resizeMode="contain"
              />
              <AppText style={[styles.execTradesBtnText, { color: textColor }]}> {' '}Executed trades</AppText>
            </View>
          </TouchableOpacity>

          {showTrades && (
            <View style={styles.execTradesBox}>
              {inv.executed_prices.map((tr, i) => (
                <View
                  key={`${orderId}_${tr?.trade_id ?? i}`}
                  style={[
                    styles.execTradeItem,
                    i === inv.executed_prices.length - 1 ? { borderBottomWidth: 0, marginBottom: 0 } : null,
                  ]}
                >
                  <View style={styles.execTradeHeaderRow}>
                    <AppText style={[styles.execTradeHeaderText, { color: labelColor }]} weight={MEDIUM}>
                      Trade #{i + 1}
                    </AppText>
                  </View>

                  <View style={{ gap: 4, marginTop: 4 }}>
                    <View style={styles.execTradeKvRow}>
                      <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: isDark ? "#8E8E93" : "#666666", flex: 1 }}>Price:</AppText>
                      <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: textColor, textAlign: "right", flex: 2 }} numberOfLines={3}>{toFixedEight(Number(tr?.price) || 0)} {quoteCc}</AppText>
                    </View>
                    <View style={styles.execTradeKvRow}>
                      <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: isDark ? "#8E8E93" : "#666666", flex: 1 }}>Amount:</AppText>
                      <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: textColor, textAlign: "right", flex: 2 }} numberOfLines={3}>{toFixedEight(Number(tr?.volume) || 0)} {baseSym}</AppText>
                    </View>
                    <View style={styles.execTradeKvRow}>
                      <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: isDark ? "#8E8E93" : "#666666", flex: 1 }}>Fee:</AppText>
                      <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: textColor, textAlign: "right", flex: 2 }} numberOfLines={3}>{toFixedEight(Number(tr?.fee) || 0)} {tr?.fee_currency || quoteCc}</AppText>
                    </View>
                    <View style={styles.execTradeKvRow}>
                      <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: isDark ? "#8E8E93" : "#666666", flex: 1 }}>Time:</AppText>
                      <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: textColor, textAlign: "right", flex: 2 }} numberOfLines={3}>
                        {tr?.time ? moment(tr.time).format("DD/MM/YYYY HH:mm:ss") : "---"}
                      </AppText>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}, (prev, next) => {
  const pId = prev.inv?._id?.$oid || prev.inv?._id || prev.inv?.order_id || prev.inv?.id;
  const nId = next.inv?._id?.$oid || next.inv?._id || next.inv?.order_id || next.inv?.id;
  const pTrades = prev.showExecutedTrades?.[pId];
  const nTrades = next.showExecutedTrades?.[nId];
  return (
    pId === nId &&
    pTrades === nTrades &&
    prev.inv?.status === next.inv?.status &&
    prev.inv?.filled_quantity === next.inv?.filled_quantity &&
    prev.inv?.quantity === next.inv?.quantity &&
    prev.inv?.price === next.inv?.price &&
    prev.isDark === next.isDark &&
    prev.base_currency === next.base_currency
  );
});
PastOrderItemCard.displayName = "PastOrderItemCard";
