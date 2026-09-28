/**
 * Futures per-symbol margin mode helpers
 * (GET futures/symbol-settings, POST futures/margin-type) — mirrors the web app.
 */

export function toApiMarginMode(uiMode) {
  return String(uiMode || '').toLowerCase() === 'isolated' ? 'ISOLATED' : 'CROSS';
}

export function toUiMarginMode(apiMode) {
  return String(apiMode || '').toUpperCase() === 'ISOLATED' ? 'Isolated' : 'Cross';
}

const CODE_COPY = {
  SYMBOL_REQUIRED: 'Select a contract first.',
  INVALID_MARGIN_MODE: 'Choose Cross or Isolated.',
  OPEN_POSITION: 'Cannot change margin mode while you have an open position on this contract.',
  OPEN_ORDERS: 'Cannot change margin mode while you have open orders on this contract.',
  INVALID_LEVERAGE: 'Leverage is outside the allowed range for this contract.',
  INSUFFICIENT_FUTURES_BALANCE: 'Insufficient futures balance for this leverage or margin change.',
  INTERNAL_ERROR: 'Something went wrong. Please try again.',
};

function extractRawError(res) {
  if (res == null) return '';
  if (typeof res === 'string') return res.trim();
  const nested = res?.error;
  if (typeof nested === 'string' && nested.trim()) return nested.trim();
  if (nested && typeof nested === 'object') {
    const msg = nested.message || nested.code;
    if (msg != null && String(msg).trim()) return String(msg).trim();
  }
  const top = res?.message || res?.msg;
  return top != null ? String(top).trim() : '';
}

export function formatFuturesSymbolMarginError(res, fallback = 'Request failed') {
  const code = String(res?.error?.code || res?.code || '').toUpperCase();
  if (code && CODE_COPY[code]) return CODE_COPY[code];
  const raw = extractRawError(res);
  if (!raw) return fallback;
  return CODE_COPY[raw.toUpperCase()] || raw;
}

/** Server leverage → whole number ≥ 1, or null when missing/invalid. */
export function toUiLeverage(apiLeverage) {
  if (apiLeverage == null) return null;
  const lev = Math.round(Number(apiLeverage));
  return Number.isFinite(lev) && lev >= 1 ? lev : null;
}

const CLOSED_ORDER_STATUSES = ['FILLED', 'CANCELLED', 'CANCELED', 'REJECTED', 'EXPIRED'];

/** Margin mode can't change while this contract has an open position or a working order. */
export function isMarginModeLocked(symbol, positions, openOrders) {
  const hasPosition = (positions || []).some((p) => {
    if (!p) return false;
    if (symbol && p.symbol && p.symbol !== symbol) return false;
    const rawQty = p.quantity && typeof p.quantity === 'object' && p.quantity.$numberDecimal != null
      ? p.quantity.$numberDecimal
      : p.quantity;
    const qty = parseFloat(rawQty);
    return Number.isFinite(qty) ? qty !== 0 : true;
  });
  if (hasPosition) return true;
  return (openOrders || []).some((o) => {
    if (!o) return false;
    if (symbol && o.symbol && o.symbol !== symbol) return false;
    return !CLOSED_ORDER_STATUSES.includes(String(o.status || '').toUpperCase());
  });
}
