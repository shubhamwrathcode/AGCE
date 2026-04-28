import {
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { AppText, ELEVEN, FIFTEEN, FOURTEEN, SEMI_BOLD } from "../../shared";
import { colors } from "../../theme/colors";
import { toFixedFive } from "../../helper/utility";
import { useTheme } from "../../hooks/useTheme";

const FuturePairList = ({
  pairs = [],
  selectedPair,
  onSelectPair,
  searchTerm = "",
  onSearchChange,
}) => {
  const { isDark, colors: themeColors } = useTheme();

  const selectedBorder = isDark ? colors.buttonDarkBg : colors.buttonBg;
  const selectedBg = isDark ? "rgba(243, 187, 43, 0.14)" : "rgba(243, 187, 43, 0.10)";
  const cardBg = themeColors.background;
  const inputBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
  const divider = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  const handleSelect = (pair) => {
    if (typeof onSelectPair === "function") {
      onSelectPair(pair);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: cardBg },
      ]}
    >
      <AppText
        type={FIFTEEN}
        weight={SEMI_BOLD}
        style={[styles.title, { color: themeColors.text }]}
      >
        Select Futures Pair
      </AppText>

      <View
        style={[
          styles.searchWrapper,
          {
            backgroundColor: inputBg,
            borderColor: divider,
          },
        ]}
      >
        <TextInput
          value={searchTerm}
          onChangeText={onSearchChange}
          placeholder="Search by name or asset"
          placeholderTextColor={isDark ? "#6F6F6F" : "#9D9D9D"}
          style={[
            styles.searchInput,
            { color: themeColors.text },
          ]}
        />
      </View>

      <FlatList
        data={pairs}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item) =>
          item?._id ?? `${item?.short_name}-${item?.margin_asset}`
        }
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <AppText
              type={ELEVEN}
              style={{ color: themeColors.secondaryText }}
            >
              No pairs found
            </AppText>
          </View>
        }
        renderItem={({ item }) => {
          const isSelected = selectedPair?._id === item?._id;
          const changeColor =
            item?.change_percentage < 0 ? colors.red : colors.green;

          return (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleSelect(item)}
              style={[
                styles.row,
                { backgroundColor: isSelected ? selectedBg : cardBg },
                isSelected
                  ? [styles.rowSelected, { borderColor: divider }]
                  : [styles.rowUnselected, { borderColor: divider }],
              ]}
            >
              {isSelected && (
                <View
                  pointerEvents="none"
                  style={[
                    styles.selectedAccent,
                    { backgroundColor: selectedBorder },
                  ]}
                />
              )}
              <View>
                <AppText
                  type={FOURTEEN}
                  weight={SEMI_BOLD}
                  style={{ color: themeColors.text }}
                >
                  {item?.short_name}
                  {item?.margin_asset ? `/${item?.margin_asset}` : ""}
                </AppText>
                <AppText
                  type={ELEVEN}
                  style={{ color: themeColors.secondaryText }}
                >
                  {item?.name}
                </AppText>
              </View>

              <View style={styles.rowRight}>
                <AppText
                  type={FOURTEEN}
                  weight={SEMI_BOLD}
                  style={{ color: themeColors.text }}
                >
                  {toFixedFive(item?.buy_price)}
                </AppText>
                <AppText type={ELEVEN} style={{ color: changeColor }}>
                  {item?.change_percentage}%
                </AppText>
              </View>
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={null}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 1,
    paddingBottom: 16,
    paddingTop: 8,
  },
  title: {
    textAlign: "center",
    marginBottom: 10,
  },
  searchWrapper: {
    borderRadius: 8,
    height: 44,
    paddingHorizontal: 12,
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
  searchInput: {
    fontSize: 14,
    height: 44,
    paddingVertical: 0,
  },
  listContent: {
    paddingTop: 4,
    paddingBottom: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 10,
  },
  rowUnselected: {},
  rowSelected: {},
  selectedAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    opacity: 0.95,
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

export default FuturePairList;
