/**
 * Skeleton for AdminTradeHistory (Bonus History). Shown while admin trade list is loading.
 */
import React, { useEffect, useRef } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { colors } from "../../theme/colors";
import ShimmerBone from "../../shared/components/ShimmerBone";
import { useTheme } from "../../hooks/useTheme";

const SHIMMER_STRIP_WIDTH = 80;
const CELL_WIDTH = 110;
const ROW_HEIGHT = 40;

// Reusing generic ShimmerBone

const TableRowSkeleton = () => (
  <View style={styles.row}>
    <ShimmerBone width={40} height={14} borderRadius={4} style={styles.cell} />
    <ShimmerBone width={70} height={14} borderRadius={4} style={styles.cell} />
    <ShimmerBone width={60} height={14} borderRadius={4} style={styles.cell} />
    <ShimmerBone width={80} height={14} borderRadius={4} style={styles.cell} />
    <ShimmerBone width={50} height={14} borderRadius={4} style={styles.cell} />
  </View>
);

const AdminTradeHistorySkeleton = () => {
  const { colors: themeColors, isDark } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.tableWrapper}>
        <View style={[styles.row, styles.headerRow, { borderBottomColor: isDark ? themeColors.border : colors.overlayColor || '#333' }]}>
          <ShimmerBone width={50} height={14} borderRadius={4} style={styles.cell} />
          <ShimmerBone width={70} height={14} borderRadius={4} style={styles.cell} />
          <ShimmerBone width={60} height={14} borderRadius={4} style={styles.cell} />
          <ShimmerBone width={80} height={14} borderRadius={4} style={styles.cell} />
          <ShimmerBone width={50} height={14} borderRadius={4} style={styles.cell} />
        </View>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <TableRowSkeleton key={i} />
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  tableWrapper: {
    borderRadius: 10,
    overflow: "hidden",
    paddingRight: 20,
  },
  row: { flexDirection: "row" },
  headerRow: {
    borderBottomWidth: 2,
    paddingBottom: 10,
    marginBottom: 8,
  },
  cell: {
    width: CELL_WIDTH,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
});

export default AdminTradeHistorySkeleton;
