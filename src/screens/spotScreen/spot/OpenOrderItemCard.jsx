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
import { colors } from "../../../theme/colors";
import { right_ic } from "../../../helper/ImageAssets";
import { toFixedEight } from "../../../helper/utility";
import NavigationService from "../../../navigation/NavigationService";
import { SPOT_ORDER_HISTORY_DETAIL } from "../../../navigation/routes";
import { getStableId, safeToFixed8 } from "./spotOrderHelpers";
import { styles } from "./spotStyles";

export const OpenOrderItemCard = memo(function OpenOrderItemCard({
  inv,
  themeColors,
  isDark,
  base_currency,
  buildCurrencyPairText,
  getOrderStatusRaw,
  getSideColor,
  onCancelPress,
}) {
  const statusRaw = getOrderStatusRaw(inv);
  const statusUpper = String(statusRaw || "").toUpperCase().trim();
  const currencyPair = buildCurrencyPairText(inv);

  const orderId = inv?._id?.$oid || inv?._id || inv?.order_id || inv?.id;
  const canCancel =
    !!orderId &&
    !["FILLED", "CANCELLED", "CANCELED", "COMPLETED", "EXECUTED", "REJECTED"].includes(statusUpper);

  const priceNum = Number(inv?.price) || 0;
  const typeUpper = String(inv?.order_type || inv?.type || inv?.orderType || "MARKET").toUpperCase();
  const side = String(inv?.side || "").toUpperCase();

  const eventTs =
    inv?.updatedAt || inv?.updated_at || inv?.createdAt || inv?.created_at || inv?.date || inv?.timestamp;
  const eventM = eventTs ? moment(eventTs) : null;
  const headerDateTime = eventM?.isValid() ? eventM.format("DD/MM/YYYY HH:mm:ss") : "---";

  const priceDisplay =
    String(inv?.order_type || inv?.type || "").toUpperCase() === "MARKET" ? "Market" : toFixedEight(priceNum);

  const parseNum = (val) => {
    if (val && val.$numberDecimal != null) return parseFloat(val.$numberDecimal);
    return parseFloat(val);
  };

  const price = parseNum(inv?.price) || 0;
  const avgPrice = parseNum(inv?.avg_execution_price ?? inv?.avgPrice ?? inv?.average_price) || price;
  const avgPriceDisplay = toFixedEight(avgPrice);

  const baseSym = inv?.ask_currency || inv?.base_currency || base_currency || "";
  const textColor = themeColors.text;
  const labelColor = themeColors.secondaryText;

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
          {headerDateTime}
        </AppText>
        <AppText style={{ color: getSideColor(inv?.side), marginBottom: 8 }} type={THIRTEEN} weight={SEMI_BOLD}>
          {side} <AppText style={{ color: isDark ? colors.white : colors.black, marginBottom: 8 }} type={THIRTEEN}>· {typeUpper}</AppText>
        </AppText>

        <View style={{ gap: 5 }}>
          <View style={styles.kvRow}>
            <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: isDark ? "#8E8E93" : "#666666", flex: 1 }}>Market</AppText>
            <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: textColor, textAlign: "right", flex: 2 }} numberOfLines={3}>{currencyPair}</AppText>
          </View>
          <View style={styles.kvRow}>
            <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: isDark ? "#8E8E93" : "#666666", flex: 1 }}>Type</AppText>
            <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: textColor, textAlign: "right", flex: 2 }} numberOfLines={3}>{typeUpper}</AppText>
          </View>
          <View style={styles.kvRow}>
            <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: isDark ? "#8E8E93" : "#666666", flex: 1 }}>Price</AppText>
            <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: textColor, textAlign: "right", flex: 2 }} numberOfLines={3}>{priceDisplay}</AppText>
          </View>
          <View style={styles.kvRow}>
            <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: isDark ? "#8E8E93" : "#666666", flex: 1 }}>Quantity</AppText>
            <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: textColor, textAlign: "right", flex: 2 }} numberOfLines={3}>
              {`${safeToFixed8(inv?.quantity ?? inv?.amount ?? inv?.origQty, "—")}${baseSym ? ` ${baseSym}` : ""}`}
            </AppText>
          </View>
          <View style={styles.kvRow}>
            <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: isDark ? "#8E8E93" : "#666666", flex: 1 }}>Avg Price</AppText>
            <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: textColor, textAlign: "right", flex: 2 }} numberOfLines={3}>
              {String(avgPriceDisplay ?? "—")}
            </AppText>
          </View>
        </View>
      </View>

      {canCancel ? (
        <View style={[styles.openOrderCardRow, { marginTop: 8, marginBottom: 4 }]}>
          <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: isDark ? "#8E8E93" : "#666666" }}>Action:</AppText>
          <TouchableOpacity
            style={styles.cancelActionBtn}
            activeOpacity={0.8}
            onPress={() => onCancelPress(inv)}
          >
            <AppText style={{ color: themeColors.red, fontWeight: "600", fontSize: 12 }}>Cancel</AppText>
          </TouchableOpacity>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}, (prev, next) => {
  const pId = getStableId(prev.inv);
  const nId = getStableId(next.inv);
  return (
    pId === nId &&
    prev.inv?.status === next.inv?.status &&
    prev.inv?.filled_quantity === next.inv?.filled_quantity &&
    prev.inv?.quantity === next.inv?.quantity &&
    prev.inv?.price === next.inv?.price &&
    prev.isDark === next.isDark &&
    prev.base_currency === next.base_currency
  );
});
OpenOrderItemCard.displayName = "OpenOrderItemCard";
