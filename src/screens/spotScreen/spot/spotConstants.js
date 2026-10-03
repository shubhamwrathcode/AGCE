import {
  limitTrade,
  market_ic,
  spotLimitTrade,
  spotMarket,
} from "../../../helper/ImageAssets";

/** Same vertical space between Buy/Sell column sections (tabs → fields → slider → IOC → assets → CTA → footer). */
export const SPOT_ORDER_V_GAP = 8;

export const DataLimit = [
  { id: "0.1", name: "Limit" },
  { id: "0.1", name: "Market" },
  { id: "0.1", name: "Spot Limit" },
  { id: "0.1", name: "Spot Market" },
];

/** Bottom sheet: Basic + Advanced (no separate “Conditional” step — Spot types listed here). */
export const ORDER_TYPE_SHEET_BASIC = [
  {
    name: "Limit",
    description: "Buy or sell at your chosen price or better.",
    icon: limitTrade,
  },
  {
    name: "Market",
    description: "Instantly trade at the current market price.",
    icon: market_ic,
  },
];
export const ORDER_TYPE_SHEET_ADVANCED = [
  {
    name: "Spot Limit",
    description: "Once the stop price is reached, a limit order is set at your selected price.",
    icon: spotLimitTrade,
  },
  {
    name: "Spot Market",
    description: "Once the stop price is reached, a market order is executed at the best price.",
    icon: spotMarket,
  },
];

/** Open orders filter chips (aligned with web TradeHistorySection / TradePage). */
export const SPOT_OPEN_ORDER_KINDS = [
  { id: "all", label: "All" },
  { id: "limit", label: "Limit" },
  { id: "market", label: "Market" },
  { id: "stop_limit", label: "Spot Limit" },
  { id: "stop_market", label: "Spot Market" },
];

/** Web TradeHistorySection side filter: All Sides / Buy / Sell (native select labels). */
export const SPOT_SIDE_DROPDOWN_LABELS = ["All Sides", "Buy", "Sell"];

/** ~6 visible rows per list; user scrolls for more. */
export const ORDER_BOOK_VISIBLE_ROWS = 6;
export const ORDER_BOOK_ROW_LAYOUT_HEIGHT = 28;
export const ORDER_BOOK_LIST_MAX_HEIGHT =
  ORDER_BOOK_VISIBLE_ROWS * ORDER_BOOK_ROW_LAYOUT_HEIGHT;
/** Tail inset after last row; inverted asks use paddingTop for the scroll end. */
export const ORDER_BOOK_LIST_END_PAD = 10;

export const Data = [
  { label: "0.1", value: "0.1" },
  { label: "0.01", value: "0.01" },
  { label: "0.001", value: "0.001" },
  { label: "0.0001", value: "0.0001" },
  { label: "0.00001", value: "0.00001" },
  { label: "0.000001", value: "0.000001" },
];
