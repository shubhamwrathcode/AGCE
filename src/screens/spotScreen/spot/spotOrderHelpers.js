import { spotOpenOrderMarketLabel } from "../../../helper/utility";

function spotSideFilterFromDropdownLabel(label) {
  if (label === "Buy") return "BUY";
  if (label === "Sell") return "SELL";
  return "All";
}

function spotDropdownLabelFromSideFilter(filterVal) {
  if (filterVal === "BUY") return "Buy";
  if (filterVal === "SELL") return "Sell";
  return "All Sides";
}

function spotMeOpenOrdersItemsFromResponse(response) {
  const d = response?.data;
  if (Array.isArray(d?.items)) return d.items;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(d)) return d;
  return [];
}

function matchesOpenOrderKind(item, kind) {
  if (kind === "all") return true;
  const t = String(item?.type || item?.order_type || "").toUpperCase();
  if (kind === "limit") return t === "LIMIT";
  if (kind === "market") return t === "MARKET";
  if (kind === "stop_limit") return t === "STOP_LIMIT";
  if (kind === "stop_market") return t === "STOP_MARKET";
  return true;
}

function tradeHistoryMarketLabel(item, selectedBase, selectedQuote) {
  return spotOpenOrderMarketLabel(item, selectedBase, selectedQuote);
}

/**
 * Redux `pastOrders` may include orders from other pairs (e.g. History screen without pair filter).
 * Spot Order History tab must only render rows for the selected spot pair — avoids wrong list flash.
 */
function spotPastOrderMatchesScreenPair(order, baseSym, quoteSym) {
  if (!order || baseSym == null || quoteSym == null) return false;
  const b = String(baseSym).trim().toUpperCase();
  const q = String(quoteSym).trim().toUpperCase();
  if (!b || !q) return false;

  const ask = String(order?.ask_currency ?? "").trim().toUpperCase();
  const pay = String(order?.pay_currency ?? "").trim().toUpperCase();
  const ob = String(order?.base_currency ?? "").trim().toUpperCase();
  const oq = String(order?.quote_currency ?? "").trim().toUpperCase();
  if ((ask && pay && ask === b && pay === q) || (ob && oq && ob === b && oq === q)) return true;

  const raw = String(order?.pair ?? order?.symbol ?? order?.market ?? "")
    .trim()
    .toUpperCase()
    .replace(/\//g, "");
  const needle = `${b}${q}`;
  if (!raw) return false;
  if (raw === needle) return true;
  if (raw.endsWith(q)) {
    const prefix = raw.slice(0, raw.length - q.length);
    if (prefix === b) return true;
  }
  return false;
}

/** Collect every stable id for an order row (API vs socket may populate different fields). */
function spotOrderHistoryIds(item) {
  return [item?._id, item?.id, item?.order_id, item?.client_order_id]
    .filter((v) => v != null && String(v).trim() !== "")
    .map((v) => String(v).trim());
}

/** Dedupe order history — same order may appear with different id fields after socket + REST merge. */
function dedupeSpotOrderHistoryRows(rows) {
  const seen = new Set();
  const out = [];
  for (const r of rows || []) {
    const ids = spotOrderHistoryIds(r);
    if (!ids.length) continue;
    if (ids.some((id) => seen.has(id))) continue;
    ids.forEach((id) => seen.add(id));
    out.push(r);
  }
  return out;
}

function getStableId(item) {
  if (!item) return "";
  const raw = item?._id?.$oid || item?._id || item?.order_id || item?.id || item?.client_order_id || item?.orderId;
  if (raw != null && typeof raw === "object" && typeof raw.toString === "function") {
    const s = raw.toString();
    if (s && s !== "[object Object]") return String(s);
  }
  if (raw != null && typeof raw !== "object") return String(raw);
  return "";
}

// Compare order book rows by price and remaining to avoid re-renders when data unchanged
const orderBookDataEqual = (a, b) => {
  if (a === b) return true;
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i], y = b[i];
    if (String(x?.price) !== String(y?.price) || String(x?.remaining) !== String(y?.remaining)) return false;
  }
  return true;
};

const toFiniteOB = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const clamp01OB = (v) => Math.max(0, Math.min(1, v));

const SPOT_ORDER_BOOK_AGG_DEFAULTS = [0.1, 0.5, 1, 10, 100];

function getSpotOrderBookAggOptionsForPair(tickSize) {
  const tick = Number(tickSize);
  if (!Number.isFinite(tick) || tick <= 0) {
    return SPOT_ORDER_BOOK_AGG_DEFAULTS.slice();
  }
  const mults = [1, 10, 100, 1000, 10000];
  const out = [];
  for (const m of mults) {
    const v = tick * m;
    if (!Number.isFinite(v) || v <= 0) continue;
    out.push(parseFloat(Number(v).toPrecision(12)));
  }
  const unique = Array.from(new Set(out)).sort((a, b) => a - b);
  return unique.length ? unique : SPOT_ORDER_BOOK_AGG_DEFAULTS.slice();
}

function roundSpotPriceToAgg(price, agg) {
  const n = Number(price);
  const a = Number(agg);
  if (!Number.isFinite(n) || !Number.isFinite(a) || a <= 0) return n;
  return Math.round(n / a) * a;
}

const safeToFixed8 = (value, fallback = "0") => {
  const parsed = parseFloat(value);
  if (!Number.isFinite(parsed)) return fallback;
  const s = parsed.toFixed(8).replace(/\.?0+$/, "");
  return s === "" ? "0" : s;
};

function aggregateSpotOrderBookRows(orders, agg) {
  if (!orders?.length) return [];
  const map = new Map();
  for (const o of orders) {
    const bucket = roundSpotPriceToAgg(o.price, agg);
    const prev = map.get(bucket);
    if (prev) {
      prev.quantity = (Number(prev.quantity) || 0) + (Number(o.quantity) || 0);
      prev.remaining = (Number(prev.remaining) || 0) + (Number(o.remaining) || 0);
    } else {
      map.set(bucket, { ...o, price: bucket });
    }
  }
  return Array.from(map.values());
}

/** Numeric step only (no quote suffix in UI). */
function formatSpotAggStepLabel(step) {
  if (step == null || step === "") return "—";
  if (typeof step === "number" && Number.isFinite(step)) {
    const s = step >= 1 ? step.toString() : step.toFixed(8).replace(/\.?0+$/, "");
    return s || String(step);
  }
  const raw = String(step).trim();
  const m = raw.match(/^-?\d*\.?\d+(?:e[+-]?\d+)?/i);
  if (m) {
    const n = Number(m[0]);
    if (Number.isFinite(n)) {
      const s = n >= 1 ? n.toString() : n.toFixed(8).replace(/\.?0+$/, "");
      return s || m[0];
    }
  }
  return raw;
}


export {
  spotSideFilterFromDropdownLabel,
  spotDropdownLabelFromSideFilter,
  spotMeOpenOrdersItemsFromResponse,
  matchesOpenOrderKind,
  tradeHistoryMarketLabel,
  spotPastOrderMatchesScreenPair,
  spotOrderHistoryIds,
  dedupeSpotOrderHistoryRows,
  getStableId,
  orderBookDataEqual,
  toFiniteOB,
  clamp01OB,
  SPOT_ORDER_BOOK_AGG_DEFAULTS,
  getSpotOrderBookAggOptionsForPair,
  roundSpotPriceToAgg,
  safeToFixed8,
  aggregateSpotOrderBookRows,
  formatSpotAggStepLabel,
};
