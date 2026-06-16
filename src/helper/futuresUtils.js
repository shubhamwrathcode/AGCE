/**
 * Utilities for futures trading: tick/step size, validation, and data formatting.
 * Aligned with web UsdMFutures / futuresUtils for consistency.
 */

export function getDecimalPlaces(value) {
  if (!value || value >= 1) return 0;
  const str = String(value);
  if (str.includes("e-")) {
    return parseInt(str.split("e-")[1], 10) || 0;
  }
  const decimalPart = str.split(".")[1];
  return decimalPart ? decimalPart.length : 0;
}

export function getTickSize(pair) {
  const raw = pair?.tickSize ?? pair?.tick_size;
  if (raw != null && Number(raw) > 0) {
    return Number(raw);
  }
  const prec = pair?.price_precision;
  if (typeof prec === "number" && prec >= 0) {
    return Math.pow(10, -prec);
  }
  return 0.01;
}

export function getStepSize(pair) {
  const raw = pair?.stepSize ?? pair?.step_size;
  if (raw != null && Number(raw) > 0) {
    return Number(raw);
  }
  const prec = pair?.quantity_precision;
  if (typeof prec === "number" && prec >= 0) {
    return Math.pow(10, -prec);
  }
  return 0.00001;
}

export function formatPriceByTick(price, pair) {
  if (price === undefined || price === null || isNaN(price)) return 0;
  const tickSize = getTickSize(pair);
  if (!tickSize || tickSize <= 0) return Number(price);
  const rounded = Math.round(Number(price) / tickSize) * tickSize;
  const precision = getDecimalPlaces(tickSize);
  return parseFloat(rounded.toFixed(precision));
}

export function formatQtyByStep(qty, pair) {
  if (qty === undefined || qty === null || isNaN(qty)) return 0;
  const stepSize = getStepSize(pair);
  if (!stepSize || stepSize <= 0) return Number(qty);
  const rounded = Math.round(Number(qty) / stepSize) * stepSize;
  const precision = getDecimalPlaces(stepSize);
  return parseFloat(rounded.toFixed(precision));
}

function isMultipleOf(value, step) {
  if (!step || step <= 0) return true;
  const ratio = value / step;
  return Math.abs(ratio - Math.round(ratio)) < 1e-8;
}

export function validateFuturesOrderInputs({ price, quantity, pair, orderType }) {
  const tickSize = getTickSize(pair);
  const stepSize = getStepSize(pair);
  const minNotional = pair?.minNotional ?? pair?.min_notional ?? 5;

  const numPrice = parseFloat(price);
  const numQty = parseFloat(quantity);
  const notional = numPrice * numQty;

  if (orderType === "Limit" && (isNaN(numPrice) || numPrice <= 0)) {
    return { valid: false, message: "Please enter a valid limit price." };
  }
  if (isNaN(numQty) || numQty <= 0) {
    return { valid: false, message: "Quantity must be greater than 0." };
  }

  if (orderType === "Limit") {
    if (!isMultipleOf(numPrice, tickSize)) {
      return { valid: false, message: `Price must be a multiple of ${tickSize}` };
    }
  }

  if (!isMultipleOf(numQty, stepSize)) {
    return { valid: false, message: `Quantity must be a multiple of ${stepSize}` };
  }

  if (notional < minNotional) {
    return {
      valid: false,
      message: `Minimum order value is ${minNotional} ${pair?.margin_asset || "USDT"}`,
    };
  }

  return { valid: true };
}

/**
 * Normalize orderbook from backend (same as web).
 */
export function normalizeOrderbookOrders(orders) {
  if (!Array.isArray(orders)) return [];
  return orders.map((o, i) => {
    const price = parseFloat(o.price) || 0;
    const remaining =
      o.remaining != null
        ? parseFloat(o.remaining)
        : (o.size != null ? parseFloat(o.size) : parseFloat(o.quantity) || 0);
    const sum = o.sum != null ? parseFloat(o.sum) : price * remaining;
    return {
      price,
      remaining,
      size: remaining,
      sum,
      quantity: remaining,
    };
  });
}

const DEFAULT_ORDER_BOOK_AGG_OPTIONS = [0.1, 0.01, 0.001, 0.0001];

export function getOrderBookAggOptionsForPair(tickSize) {
    const tick = Number(tickSize);
    if (!Number.isFinite(tick) || tick <= 0) {
        return DEFAULT_ORDER_BOOK_AGG_OPTIONS.slice();
    }
    const mults = [1, 10, 100, 1000, 10000];
    const out = [];
    for (const m of mults) {
        const v = tick * m;
        if (!Number.isFinite(v) || v <= 0) continue;
        out.push(parseFloat(v.toPrecision(12)));
    }
    const unique = Array.from(new Set(out)).sort((a, b) => a - b);
    return unique.length ? unique : DEFAULT_ORDER_BOOK_AGG_OPTIONS.slice();
}

export function roundPriceToAgg(price, agg) {
    const n = Number(price);
    if (!Number.isFinite(n) || !agg) return n;
    return Math.round(n / agg) * agg;
}

export function aggregateOrderBookRows(orders, agg) {
    if (!orders?.length) return [];
    const map = new Map();
    for (const o of orders) {
        const bucket = roundPriceToAgg(o.price, agg);
        const qty = Number(o.quantity ?? o.remaining) || 0;
        const prev = map.get(bucket);
        if (prev) {
            prev.quantity  = (Number(prev.quantity)  || 0) + qty;
            prev.remaining = (Number(prev.remaining) || 0) + qty;
        } else {
            map.set(bucket, { ...o, price: bucket, quantity: qty, remaining: qty });
        }
    }
    return Array.from(map.values());
}

export function decUsd(v) {
    if (v == null) return null;
    if (typeof v === "object" && v !== null && "$numberDecimal" in v) {
        const n = Number(v.$numberDecimal);
        return Number.isFinite(n) ? n : null;
    }
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}

export function getMaxNotionalAtLeverage(tiers, selectedLeverage) {
    if (!Array.isArray(tiers) || tiers.length === 0) return Infinity;
    const lev = Number(selectedLeverage);
    if (!Number.isFinite(lev) || lev < 1) return Infinity;

    let maxNotional = 0;
    let hasFinite = false;
    for (const tier of tiers) {
        if (Number(tier.max_leverage) >= lev) {
            const parsed = decUsd(tier.max_notional_usd);
            const cap = parsed == null ? Infinity : parsed;
            if (Number.isFinite(cap)) hasFinite = true;
            if (cap > maxNotional) maxNotional = cap;
        }
    }
    if (!hasFinite && maxNotional === 0) return Infinity;
    return maxNotional;
}

export function getTierLeverageButtons(leverageTiers, maxLeverage = 125) {
    const maxLev = Number(maxLeverage) || 125;
    if (!Array.isArray(leverageTiers) || leverageTiers.length === 0) {
        return [1, maxLev].filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);
    }
    const set = new Set();
    for (const tier of leverageTiers) {
        const ml = Number(tier.max_leverage);
        if (Number.isFinite(ml) && ml >= 1) set.add(Math.round(ml));
    }
    const arr = [...set].sort((a, b) => a - b);
    return arr.length ? arr : [1, maxLev];
}

export function resolveTakerFeeRate(contract) {
    if (!contract) return 0;
    const rate = Number(contract.taker_fee_rate);
    if (Number.isFinite(rate) && rate >= 0) return rate;
    const pct = Number(contract.taker_fee);
    if (Number.isFinite(pct) && pct >= 0) return pct / 100;
    return 0;
}

export function computeMaxOpenNotional(effectiveAvailable, leverage, takerFeeRate) {
    const avail = Number(effectiveAvailable);
    const lev = Math.max(1, Number(leverage) || 1);
    const fee = Number(takerFeeRate);
    if (!Number.isFinite(avail) || avail <= 0) return 0;
    const feeVal = Number.isFinite(fee) && fee >= 0 ? fee : 0;
    const denom = 1 / lev + feeVal;
    if (denom <= 0) return 0;
    return avail / denom;
}

export function decNum(val) {
  if (val == null) return NaN;
  if (typeof val === "object" && val.$numberDecimal !== undefined) {
    return parseFloat(val.$numberDecimal);
  }
  const n = parseFloat(val);
  return Number.isFinite(n) ? n : NaN;
}

export function computePosition(pos, liveMarkPrice = null, selectedCoin = null) {
  const qty = decNum(pos.quantity);
  const entry = decNum(pos.average_entry_price ?? pos.entry_price);
  
  let mark = decNum(pos.mark_price);
  if (!Number.isFinite(mark) || mark <= 0) {
    if (liveMarkPrice && selectedCoin && pos.symbol === selectedCoin.symbol) {
      const lm = Number(String(liveMarkPrice ?? "").replace(/,/g, ""));
      if (Number.isFinite(lm) && lm > 0) mark = lm;
    }
  }

  const sideSign = String(pos.side ?? "").toUpperCase() === "SHORT" ? -1 : 1;
  let pnl = decNum(pos.unrealized_pnl);
  
  if ((!Number.isFinite(pnl) || pnl === 0) && Number.isFinite(entry) && Number.isFinite(mark) && Number.isFinite(qty)) {
    pnl = (mark - entry) * qty * sideSign;
  }
  if (!Number.isFinite(pnl)) pnl = 0;

  const margin = decNum(pos.isolated_margin_allocated ?? pos.initial_margin);
  
  const apiRoe = decNum(pos.roe_pct);
  const roe = Number.isFinite(apiRoe)
    ? apiRoe
    : Number.isFinite(margin) && margin > 0
      ? (pnl / margin) * 100
      : NaN;

  const mm = decNum(pos.maintenance_margin);
  const marginRatio = Number.isFinite(mm) && Number.isFinite(margin) && margin + pnl > 0
    ? (mm / (margin + pnl)) * 100
    : NaN;

  return { qty, entry, mark, pnl, margin, roe, marginRatio };
}

export function formatCloseReason(reason, status) {
  const r = String(reason ?? status ?? "").toUpperCase();
  if (r === "USER") return "Closed manually";
  if (r === "LIQUIDATED" || r === "LIQUIDATION") return "Liquidated";
  if (r === "ADL") return "ADL";
  if (r === "CLOSED") return "Closed";
  if (r === "EXPIRED") return "Expired";
  return reason || status || "—";
}

export function computeClosedPosition(pos) {
  const entry = decNum(pos.average_entry_price ?? pos.entry_price);
  const exit = decNum(pos.average_exit_price ?? pos.close_price ?? pos.mark_price);
  let qty = decNum(pos.quantity);
  
  if ((!Number.isFinite(qty) || qty <= 0) && Number.isFinite(entry) && entry > 0) {
    const initMargin = decNum(pos.initial_margin ?? pos.isolated_margin_allocated);
    const lev = Number(pos.leverage);
    if (Number.isFinite(initMargin) && initMargin > 0 && Number.isFinite(lev) && lev > 0) {
      qty = (initMargin * lev) / entry;
    }
  }

  const pnl = decNum(pos.realized_pnl);
  const fees = decNum(pos.total_fees ?? pos.fees ?? pos.accumulated_fees);
  const funding = decNum(pos.total_funding ?? pos.funding_fee);
  const reason = formatCloseReason(pos.close_reason, pos.status);
  return { entry, exit, qty, pnl, fees, funding, reason };
}

export function computeFuturesLeverageStats({
    availableBalance = 0,
    leverage = 1,
    maxLeverage = 125,
    leverageTiers = [],
    takerFeeRate = 0,
}) {
    const bal = Number(availableBalance) || 0;
    const lev = Number(leverage) || 1;
    const maxLev = Number(maxLeverage) || 125;

    const maxNotionalAtLev = getMaxNotionalAtLeverage(leverageTiers, lev);
    const maxNotionalAtMaxLev = getMaxNotionalAtLeverage(leverageTiers, maxLev);

    const allowFromBalance = computeMaxOpenNotional(bal, lev, takerFeeRate);
    const allowToOpen =
        Number.isFinite(maxNotionalAtLev) && maxNotionalAtLev !== Infinity
            ? Math.min(allowFromBalance, maxNotionalAtLev)
            : allowFromBalance;

    const maxBorrowableFromBal = bal * Math.max(0, maxLev - 1);
    const maximumBorrowable =
        Number.isFinite(maxNotionalAtMaxLev) && maxNotionalAtMaxLev !== Infinity
            ? Math.min(maxBorrowableFromBal, maxNotionalAtMaxLev)
            : maxBorrowableFromBal;

    const currentLoanLimit =
        Number.isFinite(maxNotionalAtLev) && maxNotionalAtLev !== Infinity ? maxNotionalAtLev : null;

    return {
        allowToOpen,
        maximumBorrowable,
        maxLeverage: maxLev,
        currentLoanLimit,
        maxNotionalAtLev,
    };
}
