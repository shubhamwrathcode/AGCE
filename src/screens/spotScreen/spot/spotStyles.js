import { StyleSheet } from "react-native";
import { colors } from "../../../theme/colors";
import { fontFamily, fontFamilyMedium, fontFamilySemiBold } from "../../../theme/typography";
import { universalPaddingHorizontal, borderWidth } from "../../../theme/dimens";
import { ORDER_BOOK_LIST_END_PAD, ORDER_BOOK_LIST_MAX_HEIGHT, SPOT_ORDER_V_GAP } from "./spotConstants";

export const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingBottom: 60,
  },
  minicontainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: SPOT_ORDER_V_GAP,
  },
  contain: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  barContainer: {
    padding: 16,
    backgroundColor: "#fff",
    // flex: 1,
    justifyContent: "center",
    height: 500,
  },
  // secondcontainer: {
  //   padding: 12,
  //   backgroundColor: '#fff',
  // },
  secondcontainer: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: SPOT_ORDER_V_GAP,
  },
  leftPanel: {
    flex: 4,
    paddingRight: 6,
  },
  rightPanel: {
    flex: 6,
    paddingLeft: 6,
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: SPOT_ORDER_V_GAP,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 4,
    marginRight: 6,
  },
  activeTab: {
    backgroundColor: "#00C076",
  },
  tabText: {
    color: "#000",
    fontSize: 12,
  },
  activeTabText: {
    color: "#fff",
  },
  ordersTabContentWrapper: {
    minHeight: 120,
    marginTop: 4,
    marginBottom: 8,
    marginHorizontal: 5,
    position: "relative",
    paddingBottom: 40,
  },
  ordersTabPanel: {
    paddingVertical: 4,
    paddingHorizontal: 2,
    borderRadius: 10,
  },
  dropdown: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    justifyContent: "space-between",
    marginBottom: SPOT_ORDER_V_GAP,
    alignItems: "center",
  },
  dropdownText: {
    fontSize: 11,
  },
  spotOrderInputBlock: {
    marginBottom: SPOT_ORDER_V_GAP,
  },
  spotOrderSliderWrap: {
    marginBottom: SPOT_ORDER_V_GAP,
  },
  spotOrderTifRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 10,
    rowGap: 4,
    marginBottom: 6,
    alignItems: "center",
  },
  spotOrderTifChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  spotOrderTifBox: {
    width: 12,
    height: 12,
    borderRadius: 2,
    borderWidth: 1,
  },
  spotOrderTifText: {
    fontSize: 13,
    fontFamily: fontFamilyMedium
  },
  slippageCheckbox: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  slippageCheckIcon: {
    width: 9,
    height: 9,
  },
  spotOrderSlippageError: {
    fontSize: 9,
    lineHeight: 12,
  },
  spotOrderSubmitWrap: {
    marginTop: SPOT_ORDER_V_GAP,
    width: "100%",
    alignSelf: "stretch",
  },
  spotOrderSubmitBtn: {
    height: 36,
    minHeight: 36,
    borderRadius: 8,
  },
  spotOrderSubmitTitle: {
    fontSize: 12,
    color: colors.white,
  },
  spotOrderFooterBelowCta: {
    width: "100%",
    alignSelf: "stretch",
    marginTop: SPOT_ORDER_V_GAP,
    marginBottom: SPOT_ORDER_V_GAP,
    marginLeft: 5
  },
  spotOrderFooterFeesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: 16,
    rowGap: 4,
  },
  spotOrderFooterFeeText: {
    fontSize: 11,
  },
  spotOrderStakingCard: {
    marginTop: SPOT_ORDER_V_GAP,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  spotOrderStakingAprText: {
    fontSize: 11,
    color: "#f59e0b",
  },
  /** Outer: centers the label+value stack vertically when taller than content. */
  spotOrderFieldCard: {
    justifyContent: "center",
    alignItems: "stretch",
    paddingVertical: 2,
    paddingHorizontal: 12,
    minHeight: 40,
    borderRadius: 8,
    borderWidth: 0,
    overflow: "visible",
  },
  /** Inner: label + row treated as one block (centered inside spotOrderFieldCard). */
  spotOrderFieldStack: {
    width: "100%",
    height: 36,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "stretch",
    position: "relative",
  },
  spotOrderInputLabel: {
    fontSize: 10,
    fontFamily: fontFamilySemiBold,
    fontWeight: "500",
    textAlign: "left",
    marginLeft: 0,
    marginBottom: 0,
    lineHeight: 14,
  },
  spotOrderInputBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 6,
    paddingHorizontal: 2,
    minHeight: 27,
  },
  spotOrderStepBtn: {
    paddingVertical: 0,
    paddingHorizontal: 0,
    minWidth: 24,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  spotOrderStepBtnText: {
    fontSize: 14,
    fontFamily: fontFamily,
  },
  spotOrderInputValue: {
    flex: 1,
    fontSize: 14,
    textAlign: "center",
    textAlignVertical: "center",
    paddingVertical: 2,
    paddingHorizontal: 2,
    minHeight: 27,
    alignSelf: "center",
    fontFamily: fontFamily,
    lineHeight: 20,
  },
  spotOrderTotalValue: {
    flex: 1,
  },
  /** Price / Amount / Total only — shorter vertical footprint */
  spotOrderFieldCardDense: {
    minHeight: 44,
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  /** Price row: extra min height so label ↔ value gap (marginTop) does not clip */
  spotOrderFieldCardPrice: {
    minHeight: 52,
  },
  /** Amount / Total when empty — Binance-like short row, label centered */
  spotOrderFieldCardTight: {
    minHeight: 32,
    paddingVertical: 0,
    paddingHorizontal: 2,
    justifyContent: "center",
  },
  spotOrderAmountEmptyOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  spotOrderTotalEmptyInner: {
    minHeight: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  spotOrderInputBoxDense: {
    minHeight: 23,
  },
  spotOrderInputValueDense: {
    minHeight: 23,
    paddingVertical: 0,
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fontFamily,
    fontWeight: "600",
  },
  /** Slippage: slightly larger placeholder/value than dense amount; % overlay so caret stays centered */
  spotOrderSlippageInputShell: {
    flex: 1,
    position: "relative",
    minHeight: 20,
    justifyContent: "center",
    alignSelf: "stretch",
  },
  spotOrderSlippageInput: {
    width: "100%",
    fontSize: 10,
    lineHeight: 14,
    minHeight: 20,
    paddingVertical: 0,
    paddingLeft: 26,
    paddingRight: 26,
    fontFamily: fontFamilyMedium,
    textAlign: "center",
    textAlignVertical: "center",
  },
  spotOrderSlippagePctWrap: {
    position: "absolute",
    right: -10,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  spotOrderSlippagePctText: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: fontFamilyMedium,
  },
  /** Price / Amount steppers (+/−) */
  spotOrderStepBtnSpotPair: {
    minWidth: 28,
  },
  /** Total row: same side width as ± so value centers like Price/Amount */
  spotOrderTotalSideSpacer: {
    minWidth: 28,
  },
  spotOrderStepBtnTextDense: {
    fontSize: 13,
    fontFamily: fontFamily,
  },
  input: {
    // borderWidth: 1,
    // borderColor: '#ccc',
    height: 40,
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
    backgroundColor: "#EBEAE7",
    fontWeight: "400",
    marginTop: 0,
  },
  percentButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    marginTop: 8,
  },
  percentBtn: {
    // borderWidth: 1,
    // borderColor: '#aaa',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  selectedPercentBtn: (theme) => ({
    backgroundColor: theme === "Dark" ? colors.buttonDarkBg : "#F3BB2B",
    // borderColor: '#00C076',
  }),
  assetBox: {
    borderRadius: 6,
    padding: 5,
  },
  assetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 3,
  },
  assetActionRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 6,
    marginTop: SPOT_ORDER_V_GAP,
  },
  assetLabel: {
    fontSize: 14,
    fontFamily: fontFamilySemiBold
  },
  assetValue: {
    fontSize: 13,
    fontFamily: fontFamilyMedium
  },
  assetActionBtn: {
    flex: 1,
    minHeight: 34,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  assetActionText: {
    fontSize: 11,
  },
  buyBtn: {
    backgroundColor: "#00C076",
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: "center",
  },
  buyBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  orderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4.5,
    minHeight: 26,
    width: "100%",
  },
  orderRowThreeCol: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  orderPrice: {
    color: "#E86161",
    fontSize: 12,
    flex: 1,
    textAlign: "left",
  },
  orderSize: {
    fontSize: 12,
    flex: 1,
    textAlign: "right",
  },
  orderTotal: {
    flex: 1,
    textAlign: "right",
  },
  orderBookTabRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    marginBottom: 8,
  },
  orderBookTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
  },
  orderBookTabActive: {
    borderBottomWidth: 2,
  },
  orderBookTabText: {
    fontSize: 13,
    color: colors.secondaryText,
  },
  orderBookTabTextActive: {
    fontWeight: "600",
  },
  orderBookFilterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  orderBookFilterBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: "center",
    borderRadius: 4,
    backgroundColor: colors.white_fifteen,
  },
  orderBookFilterBtnActive: {
    backgroundColor: colors.buttonDarkBg,
  },
  orderBookFilterText: {
    fontSize: 11,
    color: colors.secondaryText,
  },
  orderBookFilterTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  orderBookHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: 2,
    marginBottom: 4,
  },
  orderBookHeaderText: {
    fontSize: 11,
    color: "#9D9D9D",
    flex: 1,
  },
  currentPriceBox: {
    marginVertical: 4,
    paddingVertical: 2,
    flexDirection: "column",
    alignItems: "flex-start",
  },
  spotObToolbarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 0,
  },
  spotObRatioRow: {
    width: "100%",
    flexDirection: "row",
  },
  spotObRatioPill: {
    flex: 1,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  ratioIndicatorBar: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 0,
    paddingVertical: 0,
    gap: 10,
  },
  ratioIndicatorHalf: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  ratioIndicatorTrack: {
    flex: 3,
    height: 3,
    backgroundColor: "rgba(128,128,128,0.12)",
    borderRadius: 2,
    flexDirection: "row",
    overflow: "hidden",
  },
  ratioIndicatorFill: {
    height: "100%",
  },
  spotObAggTrigger: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 32,
  },
  spotObAggCaret: {
    width: 10,
    height: 10,
  },
  spotObViewCycleBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  spotObViewCycleIcon: {
    width: 15,
    height: 15,
  },
  spotObAggBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  spotObAggPopover: {
    position: "absolute",
    width: 144,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  spotObAggRow: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  currentPrice: {
    color: "#00C076",
    fontWeight: "bold",
    fontSize: 19,
  },
  currentPriceUSD: {
    fontSize: 11,
    color: "#8E8E93",
    fontWeight: "500",
  },
  selectContainer: {
    height: 25,
    flexDirection: "row",
    alignItems: "center",
    // borderWidth: 1,
    // borderColor: colors.white,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 20,
    justifyContent: "space-between",
  },
  checkImage: {
    height: 16,
    width: 16,
  },
  tableWrapper: {
    borderRadius: 10,
    overflow: "hidden",
    // backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
  },

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
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
    backgroundColor: "transparent",
  },
  orderBookEmptyList: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: ORDER_BOOK_LIST_MAX_HEIGHT,
    backgroundColor: "transparent",
  },
  orderBookListContentAsks: {
    flexGrow: 0,
    paddingBottom: ORDER_BOOK_LIST_END_PAD,
  },
  orderBookListContentBids: {
    flexGrow: 0,
    paddingBottom: ORDER_BOOK_LIST_END_PAD,
  },
  emptyOrderBook: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    backgroundColor: "transparent",
  },
  filterBtn: {
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  // Card styles for orders – height content-driven (no fixed height)
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 5,
    paddingBottom: 8,
  },
  orderCard: {
    borderRadius: 10,
    padding: universalPaddingHorizontal,
    marginBottom: 10,
    marginTop: 10,
    borderWidth: borderWidth,
    borderColor: "#ccc",
    width: "100%",
    alignSelf: "center",
    backgroundColor: colors.themeElevationColor,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    flexWrap: "wrap",
  },
  currencyText: {
    fontSize: 16,
    fontWeight: "600",
    marginRight: 6,
  },
  cardLinkIcon: {
    width: 16,
    height: 16,
  },
  orderTypeLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  rightInfo: {
    alignItems: "flex-end",
    minWidth: 140,
  },
  dateText: {
    fontSize: 12,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  labelText: {
    fontSize: 12,
    marginRight: 8,
    minWidth: 110,
  },
  valueText: {
    fontSize: 12,
    flex: 1,
    flexShrink: 1,
    textAlign: "right",
  },
  actionRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.grey,
    alignItems: "flex-end",
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: "#A65C5C",
  },
  binIcon: {
    width: 18,
    height: 18,
    marginRight: 6,
  },
  cancelButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },
  expandButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  expandButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },
  executedTradesContainer: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
  },
  executedTradeCard: {
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: borderWidth,
  },
  noDataRow: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  noDataText: {
    fontSize: 16,
    fontStyle: "italic",
    marginTop: 16,
  },
  viewAllButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 16,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  // Open Order card – same design as OpenOrder.js screen
  openOrderCard: {
    padding: 14,
    paddingBottom: 0,
    width: "100%",
    alignSelf: "center",
  },
  openOrderTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  orderHistoryChevron: {
    width: 10,
    height: 10,
    marginTop: 2,
  },
  pairRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  coinIconSmall: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 6,
    backgroundColor: "transparent",
  },
  openOrderCardTitle: {
    fontSize: 15,
    marginRight: 6,
    fontWeight: "600",
  },
  openOrderCardDate: {
    fontSize: 12,
  },
  openOrderTypeLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  openOrderCardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  kvRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 1,
  },
  kvK: {
    fontSize: 12,
    flex: 1,
  },
  kvV: {
    fontSize: 12,
    flex: 1,
    textAlign: "right",
  },
  execTradesBtn: {
    alignSelf: "flex-end",
    paddingVertical: 4,
    paddingHorizontal: 5,

    borderRadius: 5,

  },
  execTradesBtnRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  execTradesBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },
  execTradesBox: {
    marginTop: 8,
    backgroundColor: "rgba(128, 128, 128, 0.08)",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  execTradeItem: {
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128, 128, 128, 0.15)",
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginBottom: 0,
  },
  execTradeHeaderRow: {
    marginBottom: 4,
  },
  execTradeHeaderText: {
    fontSize: 12,
  },
  execTradeKvRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 1,
  },
  execTradeKvK: {
    fontSize: 12,
    flex: 1,
  },
  execTradeKvV: {
    fontSize: 12,
    flex: 1,
    textAlign: "right",
  },
  openOrderCardLabel: {
    fontSize: 13,
    flex: 1,
  },
  openOrderCardValue: {
    fontSize: 13,
    flex: 1,
    textAlign: "right",
  },
  openOrderCardDivider: {
    height: 1,
    backgroundColor: "#ccc",
    marginTop: 14,
  },
  cancelActionBtn: {
    borderWidth: 1,
    borderColor: "#FF4F4F",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
  },
});
