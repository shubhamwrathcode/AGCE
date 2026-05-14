import React, { useCallback, useMemo } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View, Dimensions } from "react-native";
import { AppText, FOURTEEN, SEMI_BOLD, TWELVE } from "../../shared";
import FastImage from "react-native-fast-image";
import {
  NO_NOTIFICATION_ICON,
  NO_NOTIFICATION_ICON_LIGHT,
  starFillIcon,
  starIcon,
  back_ic,
} from "../../helper/ImageAssets";
import { useAppSelector } from "../../store/hooks";
import { toFixedFive, toFixedThree } from "../../helper/utility";
import { colors } from "../../theme/colors";
import { addToFavorites } from "../../actions/homeActions";
import { useDispatch } from "react-redux";
import { IMAGE_BASE_URL } from "../../helper/Constants";
import { useTheme } from "../../hooks/useTheme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const H_PAD = Math.max(14, SCREEN_WIDTH * 0.04);
const ROW_HEIGHT_DEFAULT = 40;
const ROW_HEIGHT_HOME_TAB = 60;

const formatInrPrice = (usdPrice) => {
  if (usdPrice == null || isNaN(usdPrice)) return "—";
  const inr = Number(usdPrice) * 90;
  return inr >= 1000 ? `${(inr / 1000).toFixed(2)}K` : `${inr.toFixed(2)}`;
};

const MarketRow = React.memo(({ item, favoriteArray, onPress, onToggleFavorite, pairTypography, hideStar }) => {
  const { colors: themeColors, isDark } = useTheme();
  const isHomeTab = pairTypography === "homeTab";
  const isFavorite = favoriteArray?.includes(item?._id);
  const isNegative = (item?.change_percentage ?? 0) < 0;

  const handleAddFav = useCallback(
    (e) => {
      e?.stopPropagation?.();
      onToggleFavorite(item?._id);
    },
    [item?._id, onToggleFavorite]
  );

  const handlePress = useCallback(() => onPress(item), [item, onPress]);

  const changeStr =
    item?.change_percentage != null
      ? (item.change_percentage >= 0 ? "+" : "") + toFixedThree(item.change_percentage) + "%"
      : "0%";
  const priceStr = item?.buy_price != null ? toFixedFive(item.buy_price) : "0";
  const inrStr = formatInrPrice(item?.buy_price);
  const ticker = String(item?.base_currency || "").toUpperCase() || "—";
  const quote = String(item?.quote_currency || "").trim().toUpperCase() || "USDT";
  const pairLabel = ticker && ticker !== "—" ? `${ticker}/${quote}` : "—";
  const fullName = item?.base_currency_fullname || item?.base_currency_name || item?.base_currency || ticker;
  const iconUri = item?.icon_path ? IMAGE_BASE_URL + item.icon_path : null;

  if (isHomeTab) {
    const last = item?.buy_price ?? item?.last_price ?? item?.price ?? 0;
    const sub = item?.sell_price ?? item?.usd_price ?? item?.usdt_price ?? 0;
    const chg = Number(item?.change_percentage ?? item?.changePercentage ?? item?.change) || 0;
    const isUp = chg >= 0;
    const chgText = `${Math.abs(chg).toFixed(2)}%`;
    const iconBg = isDark ? themeColors.card : "#F3F4F6";

    return (
      <TouchableOpacity
        style={[styles.row, styles.rowHomeTab]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.nameCol}>
          <View style={styles.nameRowHomeTab}>
            {!hideStar && (
              <TouchableOpacity onPress={handleAddFav} activeOpacity={0.7} style={styles.starBtnHomeTab}>
                <FastImage
                  source={isFavorite ? starFillIcon : starIcon}
                  resizeMode="contain"
                  style={styles.starIcon}
                  tintColor={isFavorite ? colors.starColor : themeColors.secondaryText}
                />
              </TouchableOpacity>
            )}
            <View style={[styles.iconCircleHomeTab, {}]}>
              {iconUri ? (
                <FastImage source={{ uri: iconUri }} resizeMode="contain" style={styles.coinIconHomeTab} />
              ) : (
                <View style={[styles.coinIconHomeTab, styles.coinIconPlaceholder, { backgroundColor: themeColors.card }]} />
              )}
            </View>
            <View style={styles.nameBlock}>
              <AppText numberOfLines={1} weight={SEMI_BOLD} ellipsizeMode="tail" style={[styles.coinListPair, { color: themeColors.text }]}>
                {fullName}
              </AppText>
              <AppText numberOfLines={1} ellipsizeMode="tail" style={[styles.coinListSub, { color: themeColors.secondaryText }]}>
                {ticker}
              </AppText>
            </View>
          </View>
        </View>

        <View style={styles.priceCol}>
          <AppText numberOfLines={1} weight={SEMI_BOLD} ellipsizeMode="tail" style={[styles.coinListPair, { color: themeColors.text }]}>
            {String(last)}
          </AppText>
          <Text numberOfLines={1} style={[styles.coinListPriceSub, { color: themeColors.secondaryText }]}>
            $ {String(sub)}
          </Text>
        </View>

        <View style={styles.chgCol}>
          <View
            style={[
              styles.changePillHomeTab,
              { backgroundColor: isUp ? "#2DBE7E" : "#EF4444" },
            ]}
          >
            <Text numberOfLines={1} style={styles.changeTextHomeTab}>
              {isUp ? "▲ " : "▼ "}
              {chgText}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: themeColors.border }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.nameCol}>
        <View style={styles.nameRow}>
          {!hideStar && (
            <TouchableOpacity onPress={handleAddFav} activeOpacity={0.7} style={styles.starBtn}>
              <FastImage
                source={isFavorite ? starFillIcon : starIcon}
                resizeMode="contain"
                style={styles.starIcon}
                tintColor={isFavorite ? colors.starColor : themeColors.secondaryText}
              />
            </TouchableOpacity>
          )}
          {iconUri ? (
            <FastImage source={{ uri: iconUri }} resizeMode="cover" style={styles.coinIcon} />
          ) : (
            <View style={[styles.coinIcon, styles.coinIconPlaceholder, { backgroundColor: themeColors.card }]} />
          )}
          <View style={styles.nameBlock}>
            <AppText numberOfLines={1} ellipsizeMode="tail" style={[styles.symbolText, { color: themeColors.text }]}>
              {pairLabel}
            </AppText>
            <AppText numberOfLines={1} ellipsizeMode="tail" style={[styles.fullName, { color: themeColors.secondaryText }]}>
              {fullName}
            </AppText>
          </View>
        </View>
      </View>

      <View style={styles.priceCol}>
        <Text numberOfLines={1} style={[styles.lastPrice, { color: themeColors.text }]}>
          {priceStr}
        </Text>
        <Text numberOfLines={1} style={[styles.inrPrice, { color: themeColors.secondaryText }]}>
          {inrStr}
        </Text>
      </View>

      <View style={styles.chgCol}>
        <View style={[styles.chgPill, isNegative ? styles.chgPillRed : styles.chgPillGreen]}>
          <Text numberOfLines={1} style={styles.chgPillText}>
            {changeStr}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.item?._id === nextProps.item?._id &&
    prevProps.item?.buy_price === nextProps.item?.buy_price &&
    prevProps.item?.last_price === nextProps.item?.last_price &&
    prevProps.item?.sell_price === nextProps.item?.sell_price &&
    prevProps.item?.change_percentage === nextProps.item?.change_percentage &&
    prevProps.favoriteArray?.includes(prevProps.item?._id) === nextProps.favoriteArray?.includes(nextProps.item?._id) &&
    prevProps.pairTypography === nextProps.pairTypography &&
    prevProps.hideStar === nextProps.hideStar
  );
});

MarketRow.displayName = "MarketRow";

const MarketList = React.memo(({ filterData, style, onPress, scrollEnabled = true, pairTypography, hideStar = false }) => {
  const { colors: themeColors, isDark } = useTheme();
  const rowHeight = pairTypography === "homeTab" ? ROW_HEIGHT_HOME_TAB : ROW_HEIGHT_DEFAULT;
  const dispatch = useDispatch();
  const favoriteArray = useAppSelector((state) => state.home.favoriteArray);

  const handleAddFav = useCallback(
    (id) => {
      dispatch(addToFavorites({ pair_id: id }));
    },
    [dispatch]
  );

  const handlePress = useCallback(
    (item) => {
      if (onPress) onPress(item);
    },
    [onPress]
  );

  const renderItem = useCallback(
    ({ item }) => (
      <MarketRow
        item={item}
        favoriteArray={favoriteArray}
        onPress={handlePress}
        onToggleFavorite={handleAddFav}
        pairTypography={pairTypography}
        hideStar={hideStar}
      />
    ),
    [favoriteArray, handlePress, handleAddFav, pairTypography, hideStar]
  );

  const keyExtractor = useCallback((item, index) => item?._id || index.toString(), []);

  const ListHeaderComponent = useMemo(() => {
    if (pairTypography === "homeTab") {
      return (
        <View style={[styles.tableHeader, styles.tableHeaderHomeTab, { borderBottomColor: "transparent" }]}>
          <AppText
            numberOfLines={1}
            style={[styles.tableHeaderText, styles.tableHeaderTextNoMargin, { flex: 1.2, color: themeColors.secondaryText }]}
          >
            Symbol
          </AppText>
          <AppText
            numberOfLines={1}
            style={[
              styles.tableHeaderText,
              styles.tableHeaderTextNoMargin,
              { flex: 1, textAlign: "right", color: themeColors.secondaryText },
            ]}
          >
            Last Price
          </AppText>
          <View style={styles.headerChgWrap}>
            <View style={styles.headerChgInner}>
              <AppText
                numberOfLines={1}
                style={[styles.tableHeaderText, styles.tableHeaderTextNoMargin, { color: themeColors.secondaryText }]}
              >
                24H Change
              </AppText>
              <FastImage
                source={back_ic}
                style={{ width: 10, height: 10, transform: [{ rotate: "90deg" }] }}
                resizeMode="contain"
                tintColor="#9CA3AF"
              />
            </View>
          </View>
        </View>
      );
    }
    return (
      <View style={[styles.tableHeader, { borderBottomColor: themeColors.border }]}>
        <View style={styles.headerCellName}>
          <AppText
            numberOfLines={1}
            style={[styles.tableHeaderText, styles.tableHeaderTextNoMargin, { color: themeColors.secondaryText }]}
          >
            Pair
          </AppText>
        </View>
        <View style={styles.headerCellPrice}>
          <AppText
            numberOfLines={1}
            style={[styles.tableHeaderText, styles.tableHeaderTextNoMargin, { color: themeColors.secondaryText }]}
          >
            Last Price
          </AppText>
        </View>
        <View style={styles.headerCellChg}>
          <AppText
            numberOfLines={1}
            style={[styles.tableHeaderText, styles.tableHeaderTextNoMargin, { color: themeColors.secondaryText }]}
          >
            24h Chg%
          </AppText>
        </View>
      </View>
    );
  }, [themeColors.border, themeColors.secondaryText, pairTypography]);

  const ListEmptyComponent = useMemo(
    () => (
      <View style={styles.emptyWrap}>
        <FastImage
          source={isDark ? NO_NOTIFICATION_ICON : NO_NOTIFICATION_ICON_LIGHT}
          resizeMode="contain"
          style={styles.emptyIcon}
        />
        <AppText type={FOURTEEN} style={[styles.emptyText, { color: themeColors.secondaryText }]}>
          No coins found
        </AppText>
        <AppText type={TWELVE} style={[styles.emptySubtext, { color: themeColors.secondaryText }]}>
          Try changing filters or search
        </AppText>
      </View>
    ),
    [themeColors.secondaryText]
  );

  const data = Array.isArray(filterData) ? filterData : [];

  return (
    <View style={[styles.modal, style]}>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={data.length > 0 ? ListHeaderComponent : null}
        ListEmptyComponent={ListEmptyComponent}
        scrollEnabled={scrollEnabled}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        initialNumToRender={8}
        windowSize={10}
        getItemLayout={(_unused, index) => ({
          length: rowHeight,
          offset: rowHeight * index,
          index,
        })}
      />
    </View>
  );
});

MarketList.displayName = "MarketList";

export default MarketList;

const styles = StyleSheet.create({
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginBottom: 2,
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tableHeaderHomeTab: {
    paddingHorizontal: 0,
    paddingTop: 2,
    paddingBottom: 2,
  },
  tableHeaderText: {
    fontSize: 10,
    color: "#9CA3AF",
    marginRight: 5,
  },
  tableHeaderTextNoMargin: {
    marginRight: 0,
  },
  headerChgWrap: {
    flex: 0.9,
    alignItems: "flex-end",
    minWidth: 0,
  },
  headerChgInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  headerCellName: {
    flex: 1.2,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    minWidth: 0,
  },
  headerCellPrice: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 3,
    minWidth: 0,
  },
  headerCellChg: {
    flex: 0.9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 3,
    minWidth: 0,
  },
  sortIcon: {
    width: 10,
    height: 10,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 10,
    alignItems: "center",
    minHeight: ROW_HEIGHT_DEFAULT,
  },
  rowHomeTab: {
    paddingVertical: 6,
    paddingHorizontal: 0,
  },
  nameCol: {
    flex: 1.2,
    minWidth: 0,
    justifyContent: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  nameRowHomeTab: {
    flexDirection: "row",
    alignItems: "center",
  },
  starBtnHomeTab: {
    width: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  iconCircleHomeTab: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  coinIconHomeTab: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  coinListPair: {
    fontSize: 12,
    fontWeight: "600",
  },
  coinListSub: {
    marginTop: 0,
    fontSize: 10,
  },
  coinListPriceMain: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "right",
  },
  coinListPriceSub: {
    marginTop: 0,
    fontSize: 10,
    textAlign: "right",
  },
  changePillHomeTab: {
    minWidth: 52,
    paddingHorizontal: 6,
    height: 22,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  changeTextHomeTab: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  chgCol: {
    flex: 0.75,
    alignItems: "flex-end",
    justifyContent: "center",
    minWidth: 0,
  },
  starBtn: {
    width: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  starIcon: {
    width: 11,
    height: 11,
  },
  coinIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: "hidden",
  },
  coinIconPlaceholder: {
    backgroundColor: colors.themeElevationColor,
  },
  nameBlock: {
    flex: 1,
    minWidth: 0,
  },
  symbolText: {
    fontSize: 12,
    fontWeight: "700",
  },
  fullName: {
    fontSize: 10,
    marginTop: 1,
  },
  priceCol: {
    flex: 1,
    minWidth: 0,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  lastPrice: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
  },
  inrPrice: {
    fontSize: 11,
    marginTop: 1,
    textAlign: "right",
  },
  chgPill: {
    minWidth: 54,
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  chgPillRed: {
    backgroundColor: colors.red,
  },
  chgPillGreen: {
    backgroundColor: colors.green,
  },
  chgPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.white,
  },
  modal: {
    width: "100%",
    flex: 1,
    paddingTop: 2,
    paddingBottom: 4,
    paddingLeft: 4,
    paddingRight: H_PAD,
  },
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    marginBottom: 16,
    opacity: 0.7,
  },
  emptyText: {
    textAlign: "center",
    marginBottom: 4,
  },
  emptySubtext: {
    textAlign: "center",
    opacity: 0.8,
  },
});
