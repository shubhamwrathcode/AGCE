import {
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { AppText, ELEVEN, FOURTEEN, SEMI_BOLD } from "../../shared";
import { colors } from "../../theme/colors";

const OptionsPairList = ({
  pairs = [],
  selectedPair,
  onSelectPair,
  searchTerm = "",
  onSearchChange,
  theme = "Dark",
}) => {
  const isDark = theme === "Dark";

  const handleSelect = (pair) => {
    if (typeof onSelectPair === "function") {
      onSelectPair(pair);
    }
  };

  const formatNumber = (data, decimal = 1) => {
    const num = typeof data === "string" ? Number(data) : data;
    if (typeof num === "number" && !isNaN(num)) {
      return parseFloat(num.toFixed(decimal));
    }
    return "0.00";
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#1D1D1D" : colors.white },
      ]}
    >
      <AppText
        type={FOURTEEN}
        weight={SEMI_BOLD}
        style={[styles.title, { color: isDark ? colors.white : colors.black }]}
      >
        Select Options Pair
      </AppText>

      <View
        style={[
          styles.searchWrapper,
          { backgroundColor: isDark ? "#2A2A2A" : "#F2F2F2" },
        ]}
      >
        <TextInput
          value={searchTerm}
          onChangeText={onSearchChange}
          placeholder="Search by name or asset"
          placeholderTextColor={isDark ? "#6F6F6F" : "#9D9D9D"}
          style={[
            styles.searchInput,
            { color: isDark ? colors.white : colors.black },
          ]}
        />
      </View>

      <FlatList
        data={pairs}
        keyExtractor={(item) =>
          item?._id ?? `${item?.base_currency}-${item?.quote_currency}`
        }
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <AppText
              type={ELEVEN}
              style={{ color: isDark ? "#9D9D9D" : "#666666" }}
            >
              No pairs found
            </AppText>
          </View>
        }
        renderItem={({ item }) => {
          const isSelected =
            selectedPair?.base_currency === item?.base_currency &&
            selectedPair?.quote_currency === item?.quote_currency;
          const changeColor =
            item?.change_percentage < 0 ? colors.red : colors.green;

          return (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleSelect(item)}
              style={[
                styles.row,
                {
                  backgroundColor: isSelected
                    ? "#00C0761A"
                    : isDark
                    ? "#1D1D1D"
                    : colors.white,
                  borderColor: isSelected ? "#00C076" : "#2A2A2A33",
                },
              ]}
            >
              <View>
                <AppText
                  type={FOURTEEN}
                  weight={SEMI_BOLD}
                  style={{ color: isDark ? colors.white : colors.black }}
                >
                  {item?.base_currency}/{item?.quote_currency}
                </AppText>
                <AppText
                  type={ELEVEN}
                  style={{ color: isDark ? "#9D9D9D" : "#666666" }}
                >
                  {item?.name || `${item?.base_currency} ${item?.quote_currency}`}
                </AppText>
              </View>

              <View style={styles.rowRight}>
                <AppText
                  type={FOURTEEN}
                  weight={SEMI_BOLD}
                  style={{ color: isDark ? colors.white : colors.black }}
                >
                  {formatNumber(item?.buy_price)}
                </AppText>
                <AppText type={ELEVEN} style={{ color: changeColor }}>
                  {formatNumber(item?.change_percentage)}%
                </AppText>
              </View>
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => (
          <View
            style={{
              height: StyleSheet.hairlineWidth,
              backgroundColor: isDark ? "#2A2A2A" : "#E6E6E6",
            }}
          />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
  },
  title: {
    textAlign: "center",
    marginBottom: 12,
  },
  searchWrapper: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rowRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default OptionsPairList;

