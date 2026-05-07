import React, { useCallback, useMemo } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View, Dimensions } from "react-native";
import { AppText, FOURTEEN, TWELVE } from "../../shared";
import FastImage from "react-native-fast-image";
import { NO_NOTIFICATION_ICON, NO_NOTIFICATION_ICON_LIGHT, starFillIcon, starIcon } from "../../helper/ImageAssets";
import { useAppSelector } from "../../store/hooks";
import { toFixedFive, toFixedThree } from "../../helper/utility";
import { colors } from "../../theme/colors";
import { addToFavorites } from "../../actions/homeActions";
import { useDispatch } from "react-redux";
import { BASE_URL, IMAGE_BASE_URL } from "../../helper/Constants";
import { useTheme } from "../../hooks/useTheme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const H_PAD = Math.max(14, SCREEN_WIDTH * 0.04);
const ROW_HEIGHT = 40;

const formatInrPrice = (usdPrice) => {
  if (usdPrice == null || isNaN(usdPrice)) return "—";
  const inr = Number(usdPrice) * 90;
  return inr >= 1000 ? `${(inr / 1000).toFixed(2)}K` : `${inr.toFixed(2)}`;
};

const MarketRow = React.memo(({ item, favoriteArray, onPress, onToggleFavorite }) => {
  const { colors: themeColors } = useTheme();
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
  const ticker = item?.base_currency || "—";
  const fullName = item?.base_currency_fullname || item?.base_currency || ticker;
  const iconUri = item?.icon_path ? IMAGE_BASE_URL + item.icon_path : null;

  return (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: themeColors.border }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.nameCol}>
        <View style={styles.nameRow}>
          <TouchableOpacity onPress={handleAddFav} activeOpacity={0.7} style={styles.starBtn}>
            <FastImage
              source={isFavorite ? starFillIcon : starIcon}
              resizeMode="contain"
              style={styles.starIcon}
              tintColor={isFavorite ? colors.starColor : themeColors.secondaryText}
            />
          </TouchableOpacity>
          {iconUri ? (
            <FastImage
              source={{ uri: iconUri }}
              resizeMode="cover"
              style={styles.coinIcon}
            />
          ) : (
            <View style={[styles.coinIcon, styles.coinIconPlaceholder, { backgroundColor: themeColors.card }]} />
          )}
          <View style={styles.nameBlock}>
            <AppText numberOfLines={1} style={[styles.symbolText, { color: themeColors.text }]}>
              {ticker}
              <Text style={{ fontWeight: "400", color: themeColors.secondaryText, fontSize: 11.5 }}>
                {' '}/{item?.quote_currency}
              </Text>
            </AppText>
            <AppText numberOfLines={1} style={[styles.fullName, { color: themeColors.secondaryText }]}>
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

      <View style={[styles.chgPill, isNegative ? styles.chgPillRed : styles.chgPillGreen]}>
        <Text numberOfLines={1} style={styles.chgPillText}>
          {changeStr}
        </Text>
      </View>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.item?._id === nextProps.item?._id &&
    prevProps.item?.buy_price === nextProps.item?.buy_price &&
    prevProps.item?.change_percentage === nextProps.item?.change_percentage &&
    prevProps.favoriteArray?.includes(prevProps.item?._id) === nextProps.favoriteArray?.includes(nextProps.item?._id)
  );
});

MarketRow.displayName = "MarketRow";

const MarketList = React.memo(({ filterData, style, onPress, scrollEnabled = true }) => {
  const { colors: themeColors, isDark } = useTheme();
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
      />
    ),
    [favoriteArray, handlePress, handleAddFav]
  );

  const keyExtractor = useCallback((item, index) => item?._id || index.toString(), []);

  const ListHeaderComponent = useMemo(
    () => (
      <View style={[styles.tableHeader, { borderBottomColor: themeColors.border }]}>
        <View style={styles.headerCellName}>
          <AppText style={[styles.tableHeaderText, { color: themeColors.secondaryText }]}>Pair</AppText>
        </View>
        <View style={styles.headerCellPrice}>
          <AppText style={[styles.tableHeaderText, { color: themeColors.secondaryText }]}>Last Price</AppText>
        </View>
        <View style={styles.headerCellChg}>
          <AppText style={[styles.tableHeaderText, { color: themeColors.secondaryText }]}>24h Chg%</AppText>
        </View>
      </View>
    ),
    [themeColors.border, themeColors.secondaryText]
  );

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
          length: ROW_HEIGHT,
          offset: ROW_HEIGHT * index,
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
  tableHeaderText: {
    fontSize: 11,
    fontWeight: "600",
    marginRight: 5
  },
  headerCellName: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  headerCellPrice: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 3,
  },
  headerCellChg: {
    width: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 3,
    marginLeft: 20,
  },
  sortIcon: {
    width: 10,
    height: 10,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    minHeight: ROW_HEIGHT,
  },
  nameCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
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
    fontSize: 13,
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
    minWidth: 64,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 26,
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
