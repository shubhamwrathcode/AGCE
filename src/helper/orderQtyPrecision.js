import BigNumber from "bignumber.js";

const BN = BigNumber.clone({ DECIMAL_PLACES: 18, ROUNDING_MODE: BigNumber.ROUND_DOWN });

/** Decimal places from an increment like 0.00001 (avoids float noise). */
export function decimalPlacesFromStep(step) {
  if (step === undefined || step === null || step === "") return 8;
  const n = Number(step);
  if (!Number.isFinite(n) || n <= 0) return 8;
  const s = String(step);
  if (/e-/i.test(s)) {
    const exp = parseInt(s.split(/e-/i)[1], 10);
    return Number.isFinite(exp) ? exp : 8;
  }
  const dot = s.indexOf(".");
  if (dot < 0) return 0;
  return s.replace(/0+$/, "").slice(dot + 1).length;
}

/**
 * Floor to `precision` decimal places without IEEE under-floor
 * (e.g. 0.0003 with 5 dp stays 0.0003, not 0.00029).
 */
export function floorToDecimalPlaces(value, precision) {
  const n = new BN(value);
  if (!n.isFinite()) return NaN;
  const dp = Math.max(0, Number(precision) || 0);
  return n.decimalPlaces(dp, BN.ROUND_DOWN).toNumber();
}

/** Snap to step/tick. mode: "floor" | "ceil" | "round". */
export function snapToIncrement(value, increment, mode) {
  const n = new BN(String(value));
  const inc = new BN(String(increment));
  if (!n.isFinite() || !inc.isFinite() || inc.lte(0)) return Number(value);
  const units = n.dividedBy(inc);
  const steps = mode === "ceil"
    ? units.minus(1e-9).integerValue(BN.ROUND_CEIL)
    : mode === "floor"
      ? units.plus(1e-9).integerValue(BN.ROUND_FLOOR)
      : units.integerValue(BN.ROUND_HALF_UP);
  const dp = decimalPlacesFromStep(increment);
  return steps.times(inc).decimalPlaces(dp, BN.ROUND_HALF_UP).toNumber();
}

export function formatIncrement(value, increment) {
  const n = Number(value);
  const inc = Number(increment);
  if (!Number.isFinite(n)) return "";
  const dp = Number.isFinite(inc) && inc > 0 ? decimalPlacesFromStep(inc) : 2;
  return n.toFixed(dp);
}

/** min_notional can be a number, a string or `{ $numberDecimal }`. */
export function parseMinNotionalValue(minNotional, fallback = 5) {
  const parsed = typeof minNotional === "object" && minNotional?.$numberDecimal != null
    ? Number(minNotional.$numberDecimal)
    : Number(minNotional);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * Same minimum the amount hint shows.
 * minBase is min_notional / price rounded up to step_size.
 * minQuote is that base size times price, rounded to tick_size.
 */
export function effectiveOrderMinimum({ price, stepSize, tickSize, minOrderQty, minNotional }) {
  const step = Number(stepSize) > 0 ? Number(stepSize) : 0.00001;
  const tick = Number(tickSize) > 0 ? Number(tickSize) : 0.01;
  const minQty = Number(minOrderQty) > 0 ? Number(minOrderQty) : step;
  const minNot = parseMinNotionalValue(minNotional);
  const px = Number(price);
  const hasPx = Number.isFinite(px) && px > 0;
  const minBase = hasPx
    ? Math.max(minQty, snapToIncrement(minNot / px, step, "ceil"))
    : minQty;
  const minQuote = hasPx
    ? Math.max(minNot, snapToIncrement(minBase * px, tick, "round"))
    : minNot;
  return { step, tick, minBase, minQuote, price: px, hasPx };
}

function compactAmount(value, increment) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return "0";
  if (increment) {
    const formatted = formatIncrement(n, increment);
    const parsed = Number(formatted);
    return Number.isFinite(parsed) ? parsed.toString() : formatted;
  }
  const trimmed = n.toFixed(8).replace(/\.?0+$/, "");
  return trimmed || "0";
}

/** Short inline label, e.g. "Min Amount 5.76 USDT" or "Max Amount 0.00003 BTC". */
export function amountLimitLabel(kind, value, increment, unit) {
  const symbol = unit ? ` ${unit}` : "";
  return `${kind} Amount ${compactAmount(value, increment)}${symbol}`;
}

export function minimumQtyMessage(mins, { isQuote, base, quote }) {
  return amountLimitLabel(
    "Min",
    isQuote ? mins.minQuote : mins.minBase,
    isQuote ? mins.tick : mins.step,
    isQuote ? quote : base,
  );
}

/**
 * Quote amount: reject below the hint minimum. At or above it, floor to step,
 * then raise to minBase when tick rounding made the displayed minimum floor short.
 * Base amount: floor to step and reject below minBase.
 */
export function resolveSubmittedBaseQty({
  amount,
  isQuote,
  price,
  stepSize,
  tickSize,
  minOrderQty,
  minNotional,
  base,
  quote,
}) {
  const mins = effectiveOrderMinimum({ price, stepSize, tickSize, minOrderQty, minNotional });
  const n = parseFloat(String(amount ?? "").replace(/,/g, ""));
  const message = minimumQtyMessage(mins, { isQuote, base, quote });
  if (!Number.isFinite(n) || n <= 0) {
    return { ok: false, qty: NaN, message: "", ...mins };
  }
  if (isQuote) {
    if (!mins.hasPx) {
      return { ok: false, qty: NaN, message: "Price is required to size this order", ...mins };
    }
    const below = n + mins.tick / 10 < mins.minQuote;
    let qty = snapToIncrement(n / mins.price, mins.step, "floor");
    if (!below && qty + mins.step / 10 < mins.minBase) qty = mins.minBase;
    if (below || !(qty > 0) || qty + mins.step / 10 < mins.minBase) {
      return { ok: false, qty, message, ...mins };
    }
    return { ok: true, qty, message: "", ...mins };
  }
  const qty = snapToIncrement(n, mins.step, "floor");
  if (!(qty > 0) || qty + mins.step / 10 < mins.minBase) {
    return { ok: false, qty, message, ...mins };
  }
  return { ok: true, qty, message: "", ...mins };
}

/** API-safe decimal string (no trailing zeros, no 0.00029 from 0.0003). */
export function formatDecimalString(value, precision) {
  const n = new BN(value);
  if (!n.isFinite()) return "0";
  const dp = Math.max(0, Number(precision) || 0);
  return n.decimalPlaces(dp, BN.ROUND_DOWN).toFixed(dp).replace(/\.?0+$/, "") || "0";
}

/** Step-multiple check without float noise. */
export function isMultipleOfIncrement(value, increment) {
  const n = new BN(String(value));
  const inc = new BN(String(increment));
  if (!n.isFinite() || !inc.isFinite() || inc.lte(0)) return true;
  return n.modulo(inc).isZero();
}

/**
 * Amount-field hint, shown only while the field is focused.
 * Below the minimum: "Minimum Qty is {this unit} ≈ {other unit}".
 * At or above it: "≈ {other unit}" for the typed size.
 */
export function buildAmountHint({
  amountRaw,
  isQuote,
  price,
  stepSize,
  tickSize,
  minOrderQty,
  minNotional,
  base,
  quote,
  defaultStep = 0.00001,
}) {
  const step = Number(stepSize) > 0 ? Number(stepSize) : defaultStep;
  const tick = Number(tickSize) > 0 ? Number(tickSize) : 0.01;
  const minQty = Number(minOrderQty) > 0 ? Number(minOrderQty) : step;
  const minNot = parseMinNotionalValue(minNotional, 0);
  const px = Number(price);
  const hasPx = Number.isFinite(px) && px > 0;
  const baseSym = base || "—";
  const quoteSym = quote || "—";

  const minBase = hasPx && minNot > 0
    ? Math.max(minQty, snapToIncrement(minNot / px, step, "ceil"))
    : minQty;
  const minQuote = hasPx
    ? Math.max(minNot, snapToIncrement(minBase * px, tick, "round"))
    : minNot;

  const amt = parseFloat(String(amountRaw ?? "").replace(/,/g, ""));
  const hasAmt = Number.isFinite(amt) && amt > 0;
  const belowMin = !hasAmt || (isQuote ? amt + tick / 10 < minQuote : amt + step / 10 < minBase);

  if (belowMin) {
    if (isQuote) {
      return hasPx
        ? `Minimum Qty is ${formatIncrement(minQuote, tick)} ${quoteSym} ≈ ${formatIncrement(minBase, step)} ${baseSym}`
        : `Minimum Qty is ${formatIncrement(minQuote || minNot, tick)} ${quoteSym}`;
    }
    return hasPx
      ? `Minimum Qty is ${formatIncrement(minBase, step)} ${baseSym} ≈ ${formatIncrement(minQuote, tick)} ${quoteSym}`
      : `Minimum Qty is ${formatIncrement(minBase, step)} ${baseSym}`;
  }

  if (!hasPx) return "";
  if (isQuote) {
    let baseQty = snapToIncrement(amt / px, step, "floor");
    if (baseQty + step / 10 < minBase) baseQty = minBase;
    return `≈ ${formatIncrement(baseQty, step)} ${baseSym}`;
  }
  const worth = snapToIncrement(amt * px, tick, "round");
  return `≈ ${formatIncrement(worth, tick)} ${quoteSym}`;
}
