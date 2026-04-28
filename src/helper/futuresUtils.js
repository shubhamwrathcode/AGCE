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
      _id: o._id || `ob-${i}`,
    };
  });
}
