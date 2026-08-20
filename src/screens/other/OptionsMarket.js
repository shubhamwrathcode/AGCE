import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView, FlatList, ActivityIndicator } from "react-native";
import { AppText, ELEVEN, SEMI_BOLD, TWELVE } from "../../shared";
import { colors } from "../../theme/colors";
import NavigationService from "../../navigation/NavigationService";
import { OPTIONS_SCREEN, FUTURES_SCREEN } from "../../navigation/routes";
import { toFixedFive, toFixedThree } from "../../helper/utility";
import FastImage from "react-native-fast-image";
import { NO_NOTIFICATION_ICON, NO_NOTIFICATION_ICON_LIGHT, DOWN_ARROW, downIcon, starIcon, starFillIcon, favUnCheck } from "../../helper/ImageAssets";
import { useTheme } from "../../hooks/useTheme";
import useOptionsWebSocket, { OPTIONS_CHANNELS } from "../Futures/OptionsTrade/hooks/useOptionsWebSocket";
import { useIsFocused } from "@react-navigation/native";
import RBSheet from "react-native-raw-bottom-sheet";
import optionsSocketService from "../../services/socket/OptionsSocketService";
import { useDispatch } from "react-redux";
import { useAppSelector } from "../../store/hooks";
import { IMAGE_BASE_URL } from "../../helper/Constants";
import { addToFavorites } from "../../actions/homeActions";

const OptionContractItem = React.memo(({ item, index, themeColors, isDark, onPress, iconUri, isFavorite, onToggleFavorite }) => {
  const getDecimalsFromTickSize = (tickSize) => {
    const tickSizeNum = Number(tickSize);
    if (!tickSizeNum || tickSizeNum <= 0 || Number.isNaN(tickSizeNum)) return 2;
    if (tickSizeNum < 1) return Math.max(0, Math.ceil(-Math.log10(tickSizeNum)));
    return 0;
  };

  const rawPrice = item?.buy_price ?? item?.mark_price ?? item?.last_price;
  const parsedPrice = rawPrice != null && !isNaN(Number(rawPrice)) ? Number(rawPrice) : null;
  const priceText = parsedPrice != null ? parsedPrice.toFixed(getDecimalsFromTickSize(item?.tick_size)) : "—";

  const typeStr = String(item?.option_type || item?.type || "").toUpperCase();
  const isCall = typeStr === "C" || typeStr === "CALL";
  const strike = item?.strike || 0;
  const expiry = item?.expiry || "";

  return (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: themeColors.border }]}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.nameCol}>
        <View style={styles.nameRow}>
          <TouchableOpacity onPress={() => onToggleFavorite(item?._id)} activeOpacity={0.7} style={{ padding: 4, marginRight: 4 }}>
            <FastImage
              source={isFavorite ? starFillIcon : starIcon}
              style={{ width: 14, height: 14 }}
              tintColor={isFavorite ? colors.startintcolor : themeColors.secondaryText}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <FastImage
            source={iconUri ? { uri: iconUri } : (isDark ? NO_NOTIFICATION_ICON_LIGHT : NO_NOTIFICATION_ICON)}
            style={{ width: 24, height: 24, marginRight: 10, borderRadius: 12 }}
            resizeMode="contain"
          />
          <View style={styles.nameBlock}>
            <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: themeColors.text, marginBottom: 2 }} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.8}>
              {item?.symbol}
            </AppText>
            <AppText type={ELEVEN} style={{ color: themeColors.secondaryText }} numberOfLines={1}>
              {isCall ? "Call" : "Put"} · {strike}
            </AppText>
          </View>
        </View>
      </View>
      <View style={styles.priceCol}>
        <AppText type={TWELVE} weight={SEMI_BOLD} style={[styles.priceText, { color: themeColors.text, marginBottom: 2 }]}>
          {priceText}
        </AppText>
        {parsedPrice != null && (
          <AppText type={ELEVEN} style={[styles.priceText, { color: themeColors.secondaryText }]}>
            ${priceText}
          </AppText>
        )}
      </View>
    </TouchableOpacity>
  );
});

const OptionsMarket = ({ search }) => {
  const { colors: themeColors, isDark } = useTheme();
  const isFocused = useIsFocused();
  const rbSheetRef = useRef(null);

  // Use state to track selected underlying asset. Default empty means "All".
  const [selectedAsset, setSelectedAsset] = useState("");
  const [allContractsByUnderlying, setAllContractsByUnderlying] = useState({});
  const [hasReceivedAllContracts, setHasReceivedAllContracts] = useState(false);

  const coinPairs = useAppSelector((state) => state.home.coinPairs) || [];
  const favoriteArray = useAppSelector((state) => state.home.favoriteArray) || [];
  const dispatch = useDispatch();

  const getCoinIcon = useCallback((underlying) => {
    const base = String(underlying || "").replace(/USDT|USDC/i, "").toUpperCase();
    const pair = coinPairs.find(p => {
      const sym = String(p?.base_currency || p?.currency?.short_name || p?.short_name || "").replace(/[\/|-]/g, "").toUpperCase();
      return sym.startsWith(base);
    });
    const iconPath = pair?.currency?.icon || pair?.icon || pair?.icon_path;
    if (iconPath) {
      if (iconPath.startsWith('http')) return iconPath;
      return IMAGE_BASE_URL + (iconPath.startsWith('/') ? iconPath.substring(1) : iconPath);
    }
    return null;
  }, [coinPairs]);

  const {
    underlyings,
    chains: singleChains,
    isMarketLoading,
    isContractsLoading,
    isConnected,
  } = useOptionsWebSocket(selectedAsset, null, isFocused);

  useEffect(() => {
    console.log("OptionsMarket: underlyings length:", underlyings?.length, "isConnected:", isConnected, "isFocused:", isFocused);
  }, [underlyings, isConnected, isFocused]);

  // Manual fetch for "All" contracts since useOptionsWebSocket only subscribes to one
  useEffect(() => {
    if (selectedAsset !== "") {
      setAllContractsByUnderlying({}); // Clear when not "All"
      setHasReceivedAllContracts(true);
      return;
    }

    // We don't acquire the socket here to avoid authChanged conflicts with useOptionsWebSocket
    // useOptionsWebSocket already acquired it.

    // Timeout fallback in case there are no contracts at all
    const fallbackTimer = setTimeout(() => setHasReceivedAllContracts(true), 1000);

    const onContractsUpdate = (data) => {
      if (!data || typeof data !== "object") return;
      const key = String(data.underlying || "").toUpperCase();
      if (!key) return;
      setAllContractsByUnderlying((prev) => ({ ...prev, [key]: data }));
      setHasReceivedAllContracts(true);
    };

    optionsSocketService.on("contracts_update", onContractsUpdate);

    if (isConnected) {
      underlyings.forEach((u) => {
        if (u && u.underlying) {
          console.log("OptionsMarket: EMIT subscribe ->", {
            channel: OPTIONS_CHANNELS.CONTRACTS,
            underlying: u.underlying,
            expiry: "ALL",
          });
          optionsSocketService.emit("subscribe", {
            channel: OPTIONS_CHANNELS.CONTRACTS,
            underlying: u.underlying,
            expiry: "ALL",
          });
        }
      });
    }

    return () => {
      clearTimeout(fallbackTimer);
      optionsSocketService.off("contracts_update", onContractsUpdate);
      if (isConnected) {
        underlyings.forEach((u) => {
          if (u && u.underlying) {
            console.log("OptionsMarket: EMIT unsubscribe ->", {
              channel: OPTIONS_CHANNELS.CONTRACTS,
              underlying: u.underlying,
              expiry: "ALL",
            });
            optionsSocketService.emit("unsubscribe", {
              channel: OPTIONS_CHANNELS.CONTRACTS,
              underlying: u.underlying,
              expiry: "ALL",
            });
          }
        });
      }
    };
  }, [selectedAsset, underlyings, isConnected]);

  const assetOptions = useMemo(() => {
    const opts = [{ key: "", label: "All", iconUri: null }];
    if (underlyings && underlyings.length > 0) {
      underlyings.forEach((u) => {
        if (u && u.symbol) {
          opts.push({ key: u.symbol, label: u.symbol, iconUri: getCoinIcon(u.symbol) });
        }
      });
    }
    return opts;
  }, [underlyings, getCoinIcon]);

  const allContracts = useMemo(() => {
    let list = [];
    if (selectedAsset !== "") {
      if (singleChains && Array.isArray(singleChains)) {
        singleChains.forEach((chain) => {
          if (chain.calls) list = list.concat(chain.calls);
          if (chain.puts) list = list.concat(chain.puts);
        });
      }
    } else {
      if (underlyings && underlyings.length > 0) {
        underlyings.forEach((u) => {
          const key = String(u.underlying || "").toUpperCase();
          const data = allContractsByUnderlying[key];
          if (data) {
            let extracted = [];
            if (Array.isArray(data)) extracted = data;
            else if (Array.isArray(data?.contracts)) extracted = data.contracts;
            else if (Array.isArray(data?.data?.contracts)) extracted = data.data.contracts;
            else if (Array.isArray(data?.data)) extracted = data.data;
            list = list.concat(extracted);
          }
        });
      } else {
        Object.values(allContractsByUnderlying).forEach((data) => {
          let extracted = [];
          if (Array.isArray(data)) extracted = data;
          else if (Array.isArray(data?.contracts)) extracted = data.contracts;
          else if (Array.isArray(data?.data?.contracts)) extracted = data.data.contracts;
          else if (Array.isArray(data?.data)) extracted = data.data;
          list = list.concat(extracted);
        });
      }
    }
    return list;
  }, [selectedAsset, singleChains, allContractsByUnderlying, underlyings]);

  const filterOptionsData = useMemo(() => {
    let data = [...allContracts];
    if (search) {
      const s = search.toLowerCase();
      data = data.filter((item) =>
        item?.symbol?.toLowerCase()?.includes(s) || item?.underlying?.toLowerCase()?.includes(s)
      );
    }
    return data;
  }, [allContracts, search]);

  const handleNavigate = useCallback((item) => {
    if (item?.symbol) {
      let baseAsset = item?.symbol?.split('-')[0];
      if (baseAsset?.includes('_')) {
        baseAsset = baseAsset.split('_')[0];
      }
      
      NavigationService.navigate(FUTURES_SCREEN, {
        screen: "Options",
        params: { symbol: baseAsset, pair: item }
      });
    }
  }, []);

  const handleToggleFavorite = useCallback((id) => {
    if (id) {
      dispatch(addToFavorites({ pair_id: id }));
    }
  }, [dispatch]);

  const renderItem = useCallback(({ item, index }) => (
    <OptionContractItem
      item={item}
      index={index}
      themeColors={themeColors}
      isDark={isDark}
      onPress={handleNavigate}
      iconUri={getCoinIcon(item?.underlying || item?.symbol)}
      isFavorite={favoriteArray?.includes(item?._id)}
      onToggleFavorite={handleToggleFavorite}
    />
  ), [themeColors, isDark, handleNavigate, getCoinIcon, favoriteArray, handleToggleFavorite]);

  const selectedLabel = assetOptions.find(o => o.key === selectedAsset)?.label || "All";

  return (
    <View style={styles.container}>
      {/* Dropdown for Underlying Asset */}
      <View style={styles.dropdownContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.dropdownButton, { backgroundColor: isDark ? colors.themeElevationColor : '#F5F5F5' }]}
          onPress={() => rbSheetRef.current?.open()}
        >
          <AppText weight={SEMI_BOLD} style={{ color: themeColors.text }}>{selectedLabel}</AppText>
          <FastImage source={downIcon} style={styles.downArrow} tintColor={themeColors.secondaryText} resizeMode="contain" />
        </TouchableOpacity>
      </View>

      {isMarketLoading || (selectedAsset !== "" && isContractsLoading) || (selectedAsset === "" && !hasReceivedAllContracts) ? (
        <View style={styles.empty}>
          <ActivityIndicator size="large" color={themeColors.text} />
        </View>
      ) : filterOptionsData?.length > 0 ? (
        <FlatList
          data={filterOptionsData}
          keyExtractor={(item, index) => item?.symbol || String(index)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          initialNumToRender={15}
          maxToRenderPerBatch={15}
          windowSize={5}
        />
      ) : (
        <View style={styles.empty}>
          <FastImage source={isDark ? NO_NOTIFICATION_ICON : NO_NOTIFICATION_ICON_LIGHT} resizeMode="contain" style={{ width: 100, height: 100 }} />
          <AppText type={TWELVE} style={{ color: themeColors.secondaryText }}>
            No options data at the moment.
          </AppText>
        </View>
      )}

      {/* Asset Selection Modal */}
      <RBSheet
        ref={rbSheetRef}
        customModalProps={{ statusBarTranslucent: true }}
        closeOnDragDown={true}
        closeOnPressMask={true}
        customStyles={{
          wrapper: { backgroundColor: "rgba(0,0,0,0.5)" },
          draggableIcon: { backgroundColor: themeColors.secondaryText },
          container: { backgroundColor: themeColors.background, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
        }}
        height={300}
      >
        <View style={styles.sheetContainer}>
          <AppText weight={SEMI_BOLD} style={[styles.sheetTitle, { color: themeColors.text }]}>Select Asset</AppText>
          <FlatList
            data={assetOptions}
            keyExtractor={(item) => item.key || "ALL"}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.sheetItem}
                onPress={() => {
                  setSelectedAsset(item.key);
                  rbSheetRef.current?.close();
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  {item.iconUri ? (
                    <FastImage source={{ uri: item.iconUri }} style={{ width: 20, height: 20, marginRight: 10, borderRadius: 10 }} resizeMode="contain" />
                  ) : item.key !== "" ? (
                    <FastImage source={isDark ? NO_NOTIFICATION_ICON_LIGHT : NO_NOTIFICATION_ICON} style={{ width: 20, height: 20, marginRight: 10, borderRadius: 10 }} resizeMode="contain" />
                  ) : null}
                  <AppText style={{ color: selectedAsset === item.key ? themeColors.text : themeColors.secondaryText, fontWeight: selectedAsset === item.key ? "bold" : "normal" }}>
                    {item.label}
                  </AppText>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </RBSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 0, marginTop: 4, paddingBottom: 12 },
  dropdownContainer: {
    paddingHorizontal: 0,
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  downArrow: {
    width: 10,
    height: 10,
  },
  list: { paddingBottom: 24, paddingHorizontal: 4, paddingTop: 2 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 40,
  },
  nameCol: { flex: 1.5, minWidth: 0, justifyContent: "center" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  nameBlock: { flex: 1, minWidth: 0 },
  symbolRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  volText: { marginTop: 1 },
  priceCol: { flex: 0.7, minWidth: 60, alignItems: "flex-end", justifyContent: "center" },
  priceText: { textAlign: "right" },
  chgPill: {
    minWidth: 64,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  chgPillRed: { backgroundColor: colors.red },
  chgPillGreen: { backgroundColor: colors.green },
  chgPillText: { color: colors.white },
  perpBadge: {
    marginLeft: 2,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 40 },
  sheetContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  sheetTitle: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: "center",
  },
  sheetItem: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#444",
  }
});

export default OptionsMarket;
