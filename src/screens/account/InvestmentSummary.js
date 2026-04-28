import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from "react-native";
import { AppText, BLACK, WHITE, YELLOW } from "../../shared";
import { colors } from "../../theme/colors";
import { folder } from "../../helper/ImageAssets";
import FastImage from "react-native-fast-image";

const InvestmentSummary = ({
  investments = [],
  totalSelfInvestment = 0,
  totalDownlineInvestment = 0,
  totalAllInvestment = 0,
}) => {
  const filteredInvestments = investments.filter(
    (inv) => inv.type === "self" || inv.your_upline_percent > 0
  );

  const headers = [
    "Sr no.",
    "Date",
    "Investment Id",
    "Name",
    "Email",
    "Level",
    "Type",
    "Amount",
    "Currency",
    "ROI%",
    "Status",
  ];

  return (
    <View style={styles.container}>
      {/* Summary Section */}
      <View style={styles.summaryCard}>
        <AppText style={styles.summaryTitle}>💼 Total Investments Summary</AppText>
        <View style={styles.summaryList}>
          <AppText style={styles.summaryItem}>
            <AppText style={styles.summaryLabel}  color={YELLOW}>Total Self Investment: </AppText>
            ₹{totalSelfInvestment?.toLocaleString()}
          </AppText>
          <AppText style={styles.summaryItem}>
            <AppText style={styles.summaryLabel} color={YELLOW}>Total Downline Investment: </AppText>
            ₹{totalDownlineInvestment?.toLocaleString()}
          </AppText>
          <AppText style={styles.summaryItem}>
            <AppText style={styles.summaryLabel} color={YELLOW}>Grand Total: </AppText>
            ₹{totalAllInvestment?.toLocaleString()}
          </AppText>
        </View>
      </View>

      {/* Table Section */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.tableWrapper}>
          <ScrollView stickyHeaderIndices={[0]} >
            {/* Table Header */}
            <ScrollView style={[styles.row, styles.headerRow]} horizontal>
              {headers.map((h, idx) => (
                <AppText key={idx} style={[styles.cell, styles.headerCell]}>
                  {h}
                </AppText>
              ))}
            </ScrollView>

            {/* Table Body */}
            {filteredInvestments.length > 0 ? (
              filteredInvestments.map((inv, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.row,
                    idx % 2 === 0 ? styles.evenRow : styles.oddRow,
                  ]}
                >
                  <AppText style={styles.cell}>{idx + 1}</AppText>
                  <AppText style={styles.cell}>
                    {new Date(inv.date).toLocaleString()}
                  </AppText>
                  <AppText style={styles.cell}>{inv.investmentId}</AppText>
                  <AppText style={styles.cell}>{inv.userName}</AppText>
                  <AppText style={styles.cell}>{inv.email}</AppText>
                  <AppText style={styles.cell}>{inv.level || "---"}</AppText>
                  <AppText style={styles.cell}>{inv.type}</AppText>
                  <AppText style={styles.cell}>{inv.amount}</AppText>
                  <AppText style={styles.cell}>{inv.currency}</AppText>
                  <AppText style={styles.cell}>
                    {inv.type === "self"
                      ? inv.self_roi_percent
                      : inv.your_upline_percent}
                    %
                  </AppText>
                  <AppText
                    style={[
                      styles.cell,
                      inv.status === "ACTIVE"
                        ? { color: "green", fontWeight: "bold" }
                        : inv.status === "COMPLETED"
                        ? { color: "orange", fontWeight: "bold" }
                        : { color: "red", fontWeight: "bold" },
                    ]}
                  >
                    {inv.status}
                  </AppText>
                </View>
              ))
            ) : (
              <View style={styles.noDataRow}>
                 <FastImage source={folder} resizeMode="contain" style={{width: 80, height: 80}} />
                <AppText style={styles.noDataText}>No Investment</AppText>
              </View>
            )}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 10, flex: 1 },

  summaryCard: {
    // backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: { fontWeight: "bold", fontSize: 16, marginBottom: 8 },
  summaryList: { gap: 4 },
  summaryItem: { fontSize: 14 },
  summaryLabel: { fontWeight: "bold" },

  tableWrapper: {
    borderRadius: 10,
    overflow: "hidden",
    // backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  row: { flexDirection: "row" },
  headerRow: {
    backgroundColor: "#000000",
    borderBottomWidth: 2,
    borderBottomColor: "#b8860b",
  },
//   evenRow: { backgroundColor: "#fff" },
//   oddRow: { backgroundColor: "#f9f9f9" },
// 
  cell: {
    width: 100,
    paddingVertical: 10,
    paddingHorizontal: 10,
    fontSize: 12,
    textAlign: "center"
    // color:
  },
  headerCell: { fontWeight: "bold", fontSize: 13 },

//   noDataRow: { padding: 20, alignItems: "center" },
  noDataText: { color: "#888", fontStyle: "italic" },
  noDataRow: {justifyContent: "center", margin: 140 },
});

export default InvestmentSummary;
