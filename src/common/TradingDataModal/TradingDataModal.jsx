import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from "react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Modal from "react-native-modal";
import { useAppSelector } from "../../store/hooks";
import { useDispatch } from "react-redux";
import FastImage from "react-native-fast-image";
import { closeIcon, downIcon, searchIcon, starFillIcon, starIcon } from "../../helper/ImageAssets";
import { colors } from "../../theme/colors";
import { IMAGE_BASE_URL } from "../../helper/Constants";
import { toFixedFive, toFixedThree } from "../../helper/utility";
import { addToFavorites } from "../../actions/homeActions";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = Math.min(SCREEN_HEIGHT * 0.82, 640);

function compactVolume(value) {
  const n = Number(value);
  if (value == null || Number.isNaN(n)) return "—";
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return `${n.toFixed(2)}`;
}

function pairSortKey(item) {
  return `${item?.base_currency || ""}/${item?.quote_currency || ""}`.toLowerCase();
}

function getChangePct(item) {
  const v = item?.change_percentage ?? item?.change;
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

/** Sort caret: same `downIcon` as rest of app; rotate 180° for ascending (chevron-up). */
function SortCaret({ columnKey, sortKey, sortDir, inactiveColor, activeColor }) {
  const active = sortKey === columnKey;
  const tint = active ? activeColor : inactiveColor;
  const pointingUp = active && sortDir > 0;
  return (
    <View
      style={[
        styles.sortCaretWrap,
        { transform: [{ rotate: pointingUp ? "180deg" : "0deg" }] },
      ]}
    >
      <FastImage
        source={downIcon}
        resizeMode="contain"
        style={[styles.sortCaretImg, { tintColor: tint, opacity: active ? 1 : 0.55 }]}
      />
    </View>
  );
}

const TradingDataModal = ({ visible, onClose, setCurrency, isDark, theme }) => {
  const dispatch = useDispatch();
  const coinData = useAppSelector((state) => state.home.coinPairs);
  const favoriteArray = useAppSelector((state) => state.home.favoriteArray);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState("pair");
  const [sortDir, setSortDir] = useState(1);

  const darkMode = typeof isDark === "boolean" ? isDark : theme === "Dark";
  const modalBg = darkMode ? "#0F141C" : "#FFFFFF";
  const textColor = darkMode ? "#FFFFFF" : "#000000";
  const subTextColor = darkMode ? "rgba(255,255,255,0.55)" : "#9D9D9D";
  const borderColor = darkMode ? "rgba(255,255,255,0.12)" : "#E8E8E8";
  const rowBorderColor = darkMode ? "rgba(255,255,255,0.08)" : "#EEEEEE";
  const searchBarBg = darkMode ? "rgba(255,255,255,0.06)" : "#F5F5F5";
  const pasteBg = darkMode ? "rgba(255,255,255,0.10)" : "#EBEBEB";
  const closeCircleBg = darkMode ? "rgba(255,255,255,0.12)" : "#E8E8E8";
  const iconTint = darkMode ? colors.white : colors.black;
  const searchTint = darkMode ? "rgba(255,255,255,0.65)" : "#595757";

  useEffect(() => {
    if (visible) setSearchQuery("");
  }, [visible]);

  const cycleSort = useCallback(
    (key) => {
      if (sortKey === key) setSortDir((d) => -d);
      else {
        setSortKey(key);
        setSortDir(key === "change" || key === "volume" || key === "price" ? -1 : 1);
      }
    },
    [sortKey]
  );

  const filteredSorted = useMemo(() => {
    if (!coinData || !Array.isArray(coinData)) return [];
    const q = searchQuery.trim().toLowerCase();
    let list = q
      ? coinData.filter((item) => {
        const pair = pairSortKey(item);
        const base = (item?.base_currency || "").toLowerCase();
        const quote = (item?.quote_currency || "").toLowerCase();
        const full = (item?.base_currency_fullname || "").toLowerCase();
        return pair.includes(q) || base.includes(q) || quote.includes(q) || full.includes(q);
      })
      : [...coinData];

    const dir = sortDir;
    const cmp = (a, b) => {
      let va;
      let vb;
      switch (sortKey) {
        case "volume":
          va = Number(a?.volume) || 0;
          vb = Number(b?.volume) || 0;
          return va === vb ? pairSortKey(a).localeCompare(pairSortKey(b)) : va < vb ? -1 : 1;
        case "price":
          va = Number(a?.buy_price) || 0;
          vb = Number(b?.buy_price) || 0;
          return va === vb ? pairSortKey(a).localeCompare(pairSortKey(b)) : va < vb ? -1 : 1;
        case "change":
          va = getChangePct(a);
          vb = getChangePct(b);
          return va === vb ? pairSortKey(a).localeCompare(pairSortKey(b)) : va < vb ? -1 : 1;
        case "pair":
        default:
          return pairSortKey(a).localeCompare(pairSortKey(b));
      }
    };
    list.sort((a, b) => dir * cmp(a, b));
    return list;
  }, [coinData, searchQuery, sortKey, sortDir]);

  const handleChangePair = useCallback(
    (item) => {
      setCurrency(item);
      onClose();
    },
    [setCurrency, onClose]
  );

  const handlePaste = useCallback(async () => {
    try {
      const Clipboard = require("@react-native-clipboard/clipboard").default;
      const text = await Clipboard.getString();
      if (text && typeof text === "string") setSearchQuery(text.trim());
    } catch {
      /* ignore */
    }
  }, []);

  const handleToggleFavorite = useCallback(
    (id) => {
      if (id) dispatch(addToFavorites({ pair_id: id }));
    },
    [dispatch]
  );

  const sortActiveTint = darkMode ? "#FFFFFF" : "#222222";

  const renderHeader = useCallback(
    () => (
      <View style={[styles.tableHeaderWrap, { borderBottomColor: rowBorderColor }]}>
        <View style={styles.tableHeaderLeft}>
          <TouchableOpacity
            style={styles.headerSortRow}
            onPress={() => cycleSort("pair")}
            activeOpacity={0.7}
          >
            {/* Trading Pair */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.headerLabel, { color: subTextColor }]}>
                Trading Pair
              </Text>

              <View style={{ marginLeft: 4 }}>
                <Text style={{ fontSize: 8, color: subTextColor }}>▲</Text>
                <Text style={{ fontSize: 8, color: subTextColor, marginTop: -3 }}>▼</Text>
              </View>
            </View>

            {/* Slash */}
            <Text style={{ marginHorizontal: 6, color: subTextColor }}>/</Text>

            {/* Total */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.headerLabel, { color: subTextColor }]}>
                Total
              </Text>

              <View style={{ marginLeft: 4 }}>
                <Text style={{ fontSize: 8, color: subTextColor }}>▲</Text>
                <Text style={{ fontSize: 8, color: subTextColor, marginTop: -3 }}>▼</Text>
              </View>
            </View>
          </TouchableOpacity>
         
        </View>
        <View style={styles.tableHeaderRight}>
          <TouchableOpacity
            style={styles.headerSortRowEnd}
            onPress={() => cycleSort("price")}
            activeOpacity={0.7}
          >
            {/* Price */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.headerLabel, { color: subTextColor }]}>
                Price
              </Text>

              <View style={{ marginLeft: 4 }}>
                <Text style={{ fontSize: 8, color: subTextColor }}>▲</Text>
                <Text style={{ fontSize: 8, color: subTextColor, marginTop: -3 }}>▼</Text>
              </View>
            </View>

            {/* Slash */}
            <Text style={{ marginHorizontal: 6, color: subTextColor }}>/</Text>

            {/* Chg% */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.headerLabel, { color: subTextColor }]}>
                Chg%
              </Text>

              <View style={{ marginLeft: 4 }}>
                <Text style={{ fontSize: 8, color: subTextColor }}>▲</Text>
                <Text style={{ fontSize: 8, color: subTextColor, marginTop: -3 }}>▼</Text>
              </View>
            </View>
          </TouchableOpacity>
         
        </View>
      </View>
    ),
    [cycleSort, rowBorderColor, sortActiveTint, sortDir, sortKey, subTextColor]
  );

  const renderItem = useCallback(
    ({ item }) => {
      const isFavorite = favoriteArray?.includes(item?._id);
      const chg = getChangePct(item);
      const chgNeg = chg < 0;
      const iconUri = item?.icon_path ? IMAGE_BASE_URL + item.icon_path : null;
      const fullName = item?.base_currency_fullname || item?.base_currency || "—";
      const volStr = compactVolume(item?.volume);
      const subtitle = `${fullName} | ${volStr}`;
      const priceStr = item?.buy_price != null ? toFixedFive(item.buy_price) : "—";
      const changeStr = `${chg >= 0 ? "+" : ""}${toFixedThree(chg)}%`;

      return (
        <TouchableOpacity
          style={[styles.row, { borderBottomColor: rowBorderColor }]}
          onPress={() => handleChangePair(item)}
          activeOpacity={0.65}
        >
          <View style={styles.rowLeft}>
            <TouchableOpacity
              onPress={(e) => {
                e?.stopPropagation?.();
                handleToggleFavorite(item?._id);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.starWrap}
            >
              <FastImage
                source={isFavorite ? starFillIcon : starIcon}
                resizeMode="contain"
                style={styles.starIcon}
                tintColor={isFavorite ? colors.starColor : subTextColor}
              />
            </TouchableOpacity>
            {iconUri ? (
              <FastImage source={{ uri: iconUri }} resizeMode="cover" style={styles.coinIcon} />
            ) : (
              <View style={[styles.coinIcon, styles.coinIconPh, { backgroundColor: searchBarBg }]} />
            )}
            <View style={styles.pairBlock}>
              <Text style={[styles.pairLine, { color: textColor }]} numberOfLines={1}>
                {item?.base_currency}
                <Text style={{ fontWeight: "400", color: subTextColor }}>/{item?.quote_currency}</Text>
              </Text>
              <Text style={[styles.subLine, { color: subTextColor }]} numberOfLines={1}>
                {subtitle}
              </Text>
            </View>
          </View>
          <View style={styles.rowRight}>
            <Text style={[styles.priceLine, { color: textColor }]} numberOfLines={1}>
              {priceStr}
            </Text>
            <Text style={[styles.changeLine, { color: chgNeg ? colors.red : colors.green }]} numberOfLines={1}>
              {changeStr}
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [
      favoriteArray,
      handleChangePair,
      handleToggleFavorite,
      rowBorderColor,
      searchBarBg,
      subTextColor,
      textColor,
    ]
  );

  const keyExtractor = useCallback((item, index) => item?._id || String(index), []);

  const listEmpty = useMemo(
    () => (
      <View style={styles.emptyWrap}>
        <Text style={[styles.emptyText, { color: subTextColor }]}>No pairs found</Text>
      </View>
    ),
    [subTextColor]
  );

  return (
    <Modal
      isVisible={visible}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      animationInTiming={280}
      animationOutTiming={240}
      backdropOpacity={darkMode ? 0.55 : 0.35}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      style={styles.modalRoot}
      useNativeDriver
      useNativeDriverForBackdrop
      propagateSwipe
      avoidKeyboard
    >
      <View style={[styles.sheet, { height: SHEET_HEIGHT, backgroundColor: modalBg }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>Select Token</Text>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeCircle, { backgroundColor: closeCircleBg }]}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.75}
          >
            <FastImage source={closeIcon} resizeMode="contain" style={styles.closeIcon} tintColor={iconTint} />
          </TouchableOpacity>
        </View>

        <View style={[styles.searchRow, { backgroundColor: searchBarBg, borderColor }]}>
          <FastImage source={searchIcon} resizeMode="contain" style={styles.searchGlyph} tintColor={searchTint} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search token"
            placeholderTextColor={subTextColor}
            style={[styles.searchInput, { color: textColor }]}
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
          <TouchableOpacity
            style={[styles.pasteBtn, { backgroundColor: pasteBg }]}
            onPress={handlePaste}
            activeOpacity={0.8}
          >
            <Text style={[styles.pasteText, { color: textColor }]}>Paste</Text>
          </TouchableOpacity>
        </View>

        {renderHeader()}

        <FlatList
          style={styles.listFlex}
          data={filteredSorted}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={listEmpty}
          initialNumToRender={14}
          maxToRenderPerBatch={16}
          windowSize={10}
        />
      </View>
    </Modal>
  );
};

export default TradingDataModal;

const styles = StyleSheet.create({
  modalRoot: {
    margin: 0,
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 10,
    overflow: "hidden",
  },
  listFlex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    marginTop: 2,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
  },
  closeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  closeIcon: {
    width: 15,
    height: 15,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingLeft: 10,
    paddingRight: 5,
    paddingVertical: 4,
    marginBottom: 10,
  },
  searchGlyph: {
    width: 14,
    height: 14,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 4,
    paddingHorizontal: 2,
    minHeight: 34,
  },
  pasteBtn: {
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
    marginLeft: 4,
  },
  pasteText: {
    fontSize: 12,
    fontWeight: "600",
  },
  sortCaretWrap: {
    marginLeft: 3,
    width: 12,
    height: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  sortCaretImg: {
    width: 8,
    height: 8,
  },
  tableHeaderWrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 8,
    marginBottom: 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tableHeaderLeft: {
    flex: 1,
    gap: 4,
  },
  tableHeaderRight: {
    flex: 1,
    alignItems: "flex-end",
    gap: 4,
  },
  headerSortRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  headerSortRowEnd: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: "600",
  },
  listContent: {
    paddingBottom: 24,
    flexGrow: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
    paddingRight: 8,
  },
  starWrap: {
    marginRight: 5,
  },
  starIcon: {
    width: 14,
    height: 14,
  },
  coinIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
  },
  coinIconPh: {},
  pairBlock: {
    flex: 1,
    minWidth: 0,
  },
  pairLine: {
    fontSize: 14,
    fontWeight: "700",
  },
  subLine: {
    fontSize: 11,
    marginTop: 2,
  },
  rowRight: {
    alignItems: "flex-end",
    maxWidth: "38%",
  },
  priceLine: {
    fontSize: 13,
    fontWeight: "700",
  },
  changeLine: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  emptyWrap: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
  },
});
