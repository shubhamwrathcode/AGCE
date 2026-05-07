import React, { useMemo, useState } from "react";
import { FlatList, TextInput, TouchableOpacity, View } from "react-native";
import FastImage from "react-native-fast-image";
import { AppText, DISCLAIMTEXT, EIGHTEEN, SEMI_BOLD, TWELVE } from "../../../shared";
import { colors } from "../../../theme/colors";
import { bitcoin_ic, checkIc, moreOption, searchIcon } from "../../../helper/ImageAssets";

const GenericWalletTab = ({
  title,
  theme,
  themeColors,
  showBalance,
  setShowBalance,
  walletBalance,
  portfolioPreferredAmount,
  portfolioPreferredCurrency,
  portfolioUsdtEstimate,
  formatEstimateHeader,
  safeRound,
  safeNum,
  totalWalletQty,
  approxUsdLine,
  buildCoinIconUri,
  failedIconMap,
  setFailedIconMap,
  userWalletRows,
  actions,
  hintText,
  hideZeroDefault = false,
  eyeCloseIcon,
  eyeOpenIcon,
  onOpenCoinSheet,
}) => {
  const [hideZero, setHideZero] = useState(Boolean(hideZeroDefault));
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const list = Array.isArray(userWalletRows) ? [...userWalletRows] : [];
    list.sort((a, b) => {
      const ta = safeNum(a?.balance) + safeNum(a?.locked_balance) + safeNum(a?.bonus);
      const tb = safeNum(b?.balance) + safeNum(b?.locked_balance) + safeNum(b?.bonus);
      if (ta > 0 && tb === 0) return -1;
      if (ta === 0 && tb > 0) return 1;
      return tb - ta;
    });

    const s = search.trim().toLowerCase();
    let out = list;
    if (s) {
      out = out.filter(
        (it) =>
          String(it?.short_name || "").toLowerCase().includes(s) ||
          String(it?.currency || "").toLowerCase().includes(s)
      );
    }
    if (hideZero) out = out.filter((it) => totalWalletQty(it) > 0);
    return out;
  }, [userWalletRows, safeNum, search, hideZero, totalWalletQty]);

  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 18 }}>
      <AppText weight={SEMI_BOLD} type={EIGHTEEN}>
        {title}
      </AppText>

      {actions?.length ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
          {actions.map((a) => (
            <TouchableOpacity
              key={a.key}
              onPress={a.onPress}
              style={[styles.pillBtn, { backgroundColor: themeColors.themeElevationColor, borderColor: themeColors.border }]}
            >
              <AppText type={TWELVE} weight={SEMI_BOLD}>{a.label}</AppText>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      <View
        style={{
          marginTop: 18,
          borderWidth: 1,
          borderColor: themeColors.border,
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 12,
          backgroundColor: themeColors.themeElevationColor,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <AppText color={DISCLAIMTEXT}>Total Assets</AppText>
          <TouchableOpacity onPress={() => setShowBalance((v) => !v)}>
            <FastImage
              source={showBalance ? eyeCloseIcon : eyeOpenIcon}
              resizeMode="contain"
              style={{ width: 18, height: 18 }}
              tintColor={theme !== "Dark" ? colors.disclaimText : colors.disclaimDarText}
            />
          </TouchableOpacity>
        </View>
        <View style={{ marginTop: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}>
            <AppText weight={SEMI_BOLD} style={{ fontSize: 22 }}>
              {showBalance ? formatEstimateHeader(portfolioPreferredAmount(walletBalance), 5) : "****"}{" "}
            </AppText>
            <AppText color={DISCLAIMTEXT}>{portfolioPreferredCurrency(walletBalance)}</AppText>
          </View>
          <AppText color={DISCLAIMTEXT} style={{ marginTop: 4 }}>
            ≈ {showBalance ? formatEstimateHeader(portfolioUsdtEstimate(walletBalance), 5) : "****"}{" "}
            {walletBalance?.Currency || "USD"}
          </AppText>
        </View>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 14 }}>
        <View style={[styles.searchBox, { borderColor: themeColors.border, backgroundColor: themeColors.themeElevationColor }]}>
          <FastImage source={searchIcon} style={{ width: 14, height: 14 }} resizeMode="contain" tintColor={"#787878"} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search"
            placeholderTextColor={"#787878"}
            style={{ flex: 1, height: 40, fontSize: 13, color: theme !== "Dark" ? "#000" : "#FFF" }}
            returnKeyType="search"
          />
        </View>

        <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 8 }} onPress={() => setHideZero((v) => !v)}>
          <View style={styles.checkbox}>
            {hideZero ? (
              <FastImage source={checkIc} style={{ width: 8, height: 8 }} resizeMode="contain" tintColor={colors.buttonBg} />
            ) : null}
          </View>
          <AppText type={TWELVE} color={DISCLAIMTEXT}>Hide 0 balances</AppText>
        </TouchableOpacity>
      </View>

      {hintText ? (
        <View style={[styles.hintBar, { backgroundColor: themeColors.themeElevationColor, borderColor: themeColors.border }]}>
          <AppText color={DISCLAIMTEXT} style={{ marginRight: 8 }}>ⓘ</AppText>
          <AppText type={TWELVE} color={DISCLAIMTEXT} style={{ flex: 1 }}>
            {hintText}
          </AppText>
        </View>
      ) : null}

      <FlatList
        data={rows}
        keyExtractor={(item, idx) => String(item?.currency_id || idx)}
        style={{ marginTop: 10 }}
        renderItem={({ item }) => {
          const total = totalWalletQty(item);
          return (
            <View style={[styles.row, { borderBottomColor: themeColors.border }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                <View style={{ borderRadius: 16, overflow: "hidden" }}>
                  <FastImage
                    source={
                      failedIconMap?.[String(item?.currency_id)]
                        ? bitcoin_ic
                        : (buildCoinIconUri(item?.icon_path)
                          ? { uri: buildCoinIconUri(item?.icon_path) }
                          : bitcoin_ic)
                    }
                    style={{ width: 28, height: 28 }}
                    resizeMode="cover"
                    onError={() => {
                      const id = String(item?.currency_id ?? "");
                      if (!id) return;
                      setFailedIconMap((prev) => (prev?.[id] ? prev : { ...(prev || {}), [id]: true }));
                    }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText weight={SEMI_BOLD}>{item?.short_name}</AppText>
                  <AppText type={TWELVE} color={DISCLAIMTEXT}>{item?.currency}</AppText>
                </View>
              </View>

              <View style={{ alignItems: "flex-end" }}>
                <AppText weight={SEMI_BOLD}>{safeRound(total, 8)}</AppText>
                <AppText type={TWELVE} color={DISCLAIMTEXT}>{approxUsdLine(item)}</AppText>
              </View>

              <TouchableOpacity style={{ paddingLeft: 10, paddingVertical: 6 }} onPress={() => onOpenCoinSheet?.(item)}>
                <FastImage source={moreOption} style={{ width: 18, height: 18, transform: [{ rotate: "90deg" }] }} resizeMode="contain" tintColor={DISCLAIMTEXT} />
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </View>
  );
};

const styles = {
  pillBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 1,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 42,
  },
  checkbox: {
    width: 15,
    height: 15,
    borderWidth: 1,
    borderColor: colors.grey,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  hintBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
};

export default GenericWalletTab;

