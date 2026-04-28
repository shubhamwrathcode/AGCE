// // ReferralTreeTabs.native.js
// import React, { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   Dimensions,
//   Platform,
// } from "react-native";
// import { TabView, TabBar } from "react-native-tab-view";

// import { AppSafeAreaView } from "../../shared";
// import KeyBoardAware from "../../shared/components/KeyboardAware";
// import { useAppSelector } from "../../store/hooks";
// import { useDispatch } from "react-redux";
// import { getDownline, getPayoutHistory } from "../../actions/accountActions";
// import { colors } from "../../theme/colors";

// const { width: SCREEN_WIDTH } = Dimensions.get("window");

// const ReferralTreeTabs = () => {
//   const dispatch = useDispatch();
//   const theme = useAppSelector((s) => s.auth.theme);
//   const userData = useAppSelector((s) => s.auth.userData);

//   // data from redux (you already have these in your original)
//   const treeRoot = useAppSelector((s) => s.home.treeRoot);
//   const flatInvestments = useAppSelector((s) => s.home.flatInvestments);
//   const payoutHistory = useAppSelector((s) => s.home.payoutHistory);

//   // Outer tab (Referral List | Investment Summary | ROI Payout History)
//   const [outerIndex, setOuterIndex] = useState(0);
//   const [outerRoutes] = useState([
//     { key: "referralList", title: "Referral List" },
//     { key: "investmentSummary", title: "Investment Summary" },
//     { key: "roiPayoutHistory", title: "ROI Payout History" },
//   ]);

//   // Inner tabs (inside Referral List: Table View | Chart View)
//   const [innerIndex, setInnerIndex] = useState(0);
//   const [innerRoutes] = useState([
//     { key: "tableView", title: "Table View" },
//     { key: "chartView", title: "Chart View" },
//   ]);

//   useEffect(() => {
//     // load top-level data
//     dispatch(getPayoutHistory());
//     // get downline whenever userData available
//     if (userData?.id) {
//       dispatch(getDownline(userData.id, 1));
//     }
//   }, [dispatch, userData]);

//   /* -------------------------
//      Scenes: stub implementations
//      We'll replace TableScene and ChartScene with real logic next.
//      ------------------------- */

//   // Table (inner) - stub
//   const TableScene = () => {
//     return (
//       <View style={styles.sceneStub}>
//         <Text style={styles.stubTitle}>Table View (will render referral table)</Text>
//         <Text style={styles.stubNote}>Data source: redux state.home.treeRoot / flatInvestments</Text>
//       </View>
//     );
//   };

//   // Chart (inner) - stub
//   const ChartScene = () => {
//     return (
//       <View style={styles.sceneStub}>
//         <Text style={styles.stubTitle}>Chart (Tree) View (will render recursive tree)</Text>
//         <Text style={styles.stubNote}>Data source: redux state.home.treeRoot</Text>
//       </View>
//     );
//   };

//   // Investment Summary (outer)
//   const InvestmentSummaryScene = () => {
//     const totalSelfInvestment = flatInvestments
//       .filter((inv) => inv.type === "self")
//       .reduce((s, inv) => s + parseFloat(inv.amount || 0), 0);

//     const totalDownlineInvestment = flatInvestments
//       .filter((inv) => inv.type === "downline" && inv.your_upline_percent > 0)
//       .reduce((s, inv) => s + parseFloat(inv.amount || 0), 0);

//     const totalAll = totalSelfInvestment + totalDownlineInvestment;

//     return (
//       <View style={styles.sceneContent}>
//         <Text style={styles.h5}>💼 Total Investments Summary</Text>
//         <Text style={styles.summaryText}>Total Self Investment: ₹{totalSelfInvestment.toLocaleString()}</Text>
//         <Text style={styles.summaryText}>Total Downline Investment: ₹{totalDownlineInvestment.toLocaleString()}</Text>
//         <Text style={styles.summaryText}>Grand Total: ₹{totalAll.toLocaleString()}</Text>
//       </View>
//     );
//   };

//   // Payout (outer)
//   const PayoutScene = () => {
//     return (
//       <View style={styles.sceneContent}>
//         <Text style={styles.h5}>💰 ROI Payout History</Text>
//         <Text style={styles.summaryText}>Total payouts: {payoutHistory?.length ?? 0}</Text>
//         <Text style={styles.stubNote}>Full payout list will render here (we'll wire it next).</Text>
//       </View>
//     );
//   };

//   // Inner TabView used only inside Referral List tab
//   const ReferralListInnerTabs = () => {
//     const renderScene = ({ route }) => {
//       switch (route.key) {
//         case "tableView":
//           return <TableScene />;
//         case "chartView":
//           return <ChartScene />;
//         default:
//           return null;
//       }
//     };

//     return (
//       <TabView
//         navigationState={{ index: innerIndex, routes: innerRoutes }}
//         renderScene={renderScene}
//         onIndexChange={setInnerIndex}
//         initialLayout={{ width: SCREEN_WIDTH }}
//         renderTabBar={(props) => (
//           <TabBar
//             {...props}
//             indicatorStyle={styles.innerIndicator}
//             style={styles.innerTabBar}
//             labelStyle={styles.tabLabel}
//           />
//         )}
//       />
//     );
//   };

//   // Outer scenes: referralList contains inner TabView
//   const renderOuterScene = ({ route }) => {
//     switch (route.key) {
//       case "referralList":
//         return <ReferralListInnerTabs />;
//       case "investmentSummary":
//         return <InvestmentSummaryScene />;
//       case "roiPayoutHistory":
//         return <PayoutScene />;
//       default:
//         return null;
//     }
//   };

//   return (
//     <AppSafeAreaView style={{ backgroundColor: theme === "Dark" ? "#0A0A0A" : "#fff", flex: 1 }}>
//       <KeyBoardAware>
//         <View style={styles.container}>
//           <TabView
//             navigationState={{ index: outerIndex, routes: outerRoutes }}
//             renderScene={renderOuterScene}
//             onIndexChange={setOuterIndex}
//             initialLayout={{ width: SCREEN_WIDTH }}
//             renderTabBar={(props) => (
//               <TabBar
//                 {...props}
//                 indicatorStyle={styles.outerIndicator}
//                 style={styles.outerTabBar}
//                 labelStyle={styles.tabLabel}
//               />
//             )}
//           />
//         </View>
//       </KeyBoardAware>
//     </AppSafeAreaView>
//   );
// };

// export default ReferralTreeTabs;

// /* -------------------------
//    Styles
//    ------------------------- */
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     paddingTop: Platform.OS === "ios" ? 10 : 20,
//     marginHorizontal: 10
//   },
//   outerTabBar: {
//     // backgroundColor: "#0b0b0b",
//     backgroundColor: "transparent",
//     // borderWidth: 1,
//     // borderColor: colors.buttonBg,
//     // borderRadius: 10
//   },
//   innerTabBar: {
//     backgroundColor: "transparent",
//   },
//   outerIndicator: {
//     backgroundColor: colors.buttonBg,
//   },
//   innerIndicator: {
//     backgroundColor: "transparent",
//   },
//   tabLabel: {
//     fontSize: 12,
//     color: "#fff",
//   },

//   // scene stubs
//   sceneStub: {
//     padding: 16,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   sceneContent: {
//     padding: 16,
//   },
//   stubTitle: {
//     fontSize: 16,
//     fontWeight: "700",
//   },
//   stubNote: {
//     marginTop: 8,
//     color: "#aaa",
//   },

//   // summary styles
//   h5: {
//     fontSize: 16,
//     fontWeight: "700",
//     marginBottom: 8,
//   },
//   summaryText: {
//     fontSize: 14,
//     marginBottom: 6,
//   },
// });

// ReferralTreeTabs.native.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
  FlatList,
  ScrollView,
} from "react-native";
import { TabView, TabBar } from "react-native-tab-view";

import {
  AppSafeAreaView,
  AppText,
  BLACK,
  FOURTEEN,
  SEMI_BOLD,
  Toolbar,
  YELLOW,
} from "../../shared";
import KeyBoardAware from "../../shared/components/KeyboardAware";
import { useAppSelector } from "../../store/hooks";
import { useDispatch } from "react-redux";
import { getDownline, getPayoutHistory } from "../../actions/accountActions";
import { colors } from "../../theme/colors";
import { TouchableOpacity } from "react-native-gesture-handler";
import moment from "moment";
import FastImage from "react-native-fast-image";
import { add, folder, minus } from "../../helper/ImageAssets";
import InvestmentSummary from "./InvestmentSummary";
import ROIHistory from "./ROIHistory";
import { getReferralList } from "../../actions/homeActions";
import { toFixedSix } from "../../helper/utility";
import { SpinnerSecond } from "../../shared/components/SpinnerSecond";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// --- Referral Table Tree Component ---
const ReferralTableTree = ({ nodes = [], level = 1 }) => {
  const [expandedNodes, setExpandedNodes] = useState({});

  const toggleExpand = (id) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const renderRows = (data, lvl) => {
    return data.map((user, idx) => {
      const isExpanded = expandedNodes[user.id];
      const totalInvestment =
        user.total_invested_amount?.reduce(
          (sum, inv) => sum + parseFloat(inv.amount || 0),
          0
        ) || 0;

      return (
        <View key={user.id}>
          {/* Row */}
          <View style={styles.row}>
            <View
              style={[styles.cell, { width: 40, paddingLeft: (lvl - 1) * 10 }]}
            >
              {user?.referrals?.length > 0 && lvl < 5 && (
                <TouchableOpacity onPress={() => toggleExpand(user.id)}>
                  <FastImage
                    source={isExpanded ? minus : add}
                    style={{ width: 20, height: 20 }}
                    resizeMode="contain"
                    tintColor={colors.white}
                  />
                </TouchableOpacity>
              )}
            </View>

            <AppText style={[styles.cell, { width: 50 }]}>{idx + 1}</AppText>
            <AppText style={[styles.cell, { width: 80 }]}>{user.name}</AppText>
            <AppText style={[styles.cell, { width: 120 }]}>
              {user.emailId}
            </AppText>
            <AppText style={[styles.cell, { width: 60 }]}>{user.level}</AppText>
            <AppText
              style={[
                styles.cell,
                { width: 100 },
                user.kycVerified === 2 ? styles.success : styles.danger,
              ]}
            >
              {user.kycVerified === 2 ? "Verified" : "Not Verified"}
            </AppText>
            <AppText style={[styles.cell, { width: 80 }]}>
              {user.total_refer || 0}
            </AppText>
            <AppText style={[styles.cell, { width: 140 }]}>
              ₹{totalInvestment.toLocaleString()}
            </AppText>
          </View>

          {/* Children */}
          {isExpanded &&
            user.referrals?.length > 0 &&
            renderRows(user.referrals, lvl + 1)}
        </View>
      );
    });
  };

  return <View>{renderRows(nodes, level)}</View>;
};

// --- Main ReferralTree Component ---
const ReferralTree = () => {
  const dispatch = useDispatch();
  const theme = useAppSelector((s) => s.auth.theme);
  const userData = useAppSelector((s) => s.auth.userData);

  // data from redux (you already have these in your original)
  const referralList = useAppSelector((s) => s.home.referralList);
  const flatInvestments = useAppSelector((s) => s.home.flatInvestments);
  const payoutHistory = useAppSelector((s) => s.home.payoutHistory);
  const [activeTab, setActiveTab] = useState("ReferralList");

  //   // Outer tab (Referral List | Investment Summary | ROI Payout History)

  const headers = [
    "Sr no.",
    "Full Name",
    "UUID",
    "KYC Status",
    "Join Date",
  ];

  useEffect(() => {
    // load top-level data
    dispatch(getReferralList());
    // get downline whenever userData available
  }, []);

  // const totalSelfInvestment = flatInvestments
  //   .filter((inv) => inv.type === "self")
  //   .reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);

  // const totalDownlineInvestment = flatInvestments
  //   .filter((inv) => inv.type === "downline" && inv.your_upline_percent > 0)
  //   .reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);

  // const totalAllInvestment = totalSelfInvestment + totalDownlineInvestment;

  return (
   <AppSafeAreaView
      style={[
        styles.container,
        { backgroundColor: theme === "Dark" && "#0A0A0A" },
      ]}
    >
      {/* Summary Section */}
      <Toolbar
        isSecond
        title={"Refferal List"}
        style={{ width: "60%", backgroundColor: "transparent" }}
      />
      {/* Table Section */}
      {referralList?.length > 0 ? <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.tableWrapper}>
          <ScrollView stickyHeaderIndices={[0]}>
            {/* Table Header */}
            {referralList?.length > 0 && (
              <ScrollView style={[styles.row, styles.headerRow]} horizontal>
                {headers.map((h, idx) => (
                  <AppText key={idx} style={[styles.cell, styles.headerCell]}>
                    {h}
                  </AppText>
                ))}
              </ScrollView>
            )}

            {/* Table Body */}
            {referralList?.length > 0 ? (
              referralList?.map((inv, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.row,
                    idx % 2 === 0 ? styles.evenRow : styles.oddRow,
                  ]}
                >
                  <AppText style={styles.cell}>{idx + 1}</AppText>
                  
                  <AppText style={styles.cell}>
                    {inv?.firstName} {inv?.lastName}
                  </AppText>
                  <AppText style={styles.cell}>
                    {inv?.uuid}
                  </AppText>
                  <AppText style={styles.cell}>
                    {inv?.kycVerified == 1 ? "Not Verified" : inv?.kycVerified == 2 ? "Verified" : inv?.kycVerified == 3 ? "Rejected" : "Not Submitted"}
                  </AppText>
                  <AppText style={styles.cell}>
                     {moment(inv?.createdAt).subtract(10, 'days').calendar()}
                  </AppText>
                </View>
              ))
            ) : (
              <View style={styles.noDataRow}>
                <FastImage
                  source={folder}
                  resizeMode="contain"
                  style={{ width: 80, height: 80 }}
                />
                <AppText style={styles.noDataText}>No Data</AppText>
              </View>
            )}
          </ScrollView>
        </View>
      </ScrollView> : <View style={styles.noDataRow}>
                <FastImage
                  source={folder}
                  resizeMode="contain"
                  style={{ width: 80, height: 80 }}
                />
                <AppText style={styles.noDataText}>No Data</AppText>
              </View>}
      
      <SpinnerSecond />
    </AppSafeAreaView>
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
    // backgroundColor: "#FFD700",
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
    textAlign: "center",
    // color:
  },
  headerCell: { fontWeight: "bold", fontSize: 13 },

  noDataRow: { justifyContent: "center", alignItems: "center", flex: 1 },
  noDataText: { color: "#888", fontStyle: "italic" },
});

export default ReferralTree;
