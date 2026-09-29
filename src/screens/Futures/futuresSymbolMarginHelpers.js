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
  NOTHING_TO_ADJUST: 'Enable leverage and/or margin mode before confirming.',
  SYMBOLS_REQUIRED: 'No symbols to adjust.',
  BATCH_TOO_LARGE: 'Too many symbols in one batch (max 50).',
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

/** Human summary for batch leverage-margin response. */
export function summarizeLeverageMarginBatch(data) {
  if (!data || typeof data !== 'object') {
    return { title: 'Batch adjust completed', detail: '', succeeded: 0, failed: 0, total: 0 };
  }
  const succeeded = Number(data.succeeded) || 0;
  const failed = Number(data.failed) || 0;
  const total = Number(data.total) || succeeded + failed;
  const results = Array.isArray(data.results) ? data.results : [];

  const failHints = [];
  for (const row of results) {
    if (!row || row.ok) continue;
    const parts = [];
    if (row.margin_mode_error) {
      parts.push(formatFuturesSymbolMarginError({ error: row.margin_mode_error }, 'margin mode failed'));
    }
    if (row.leverage_error) {
      parts.push(formatFuturesSymbolMarginError({ error: row.leverage_error }, 'leverage failed'));
    }
    failHints.push(`${row.symbol || '—'}: ${parts.join('; ') || 'failed'}`);
    if (failHints.length >= 3) break;
  }

  let title;
  if (failed === 0) title = `Updated ${succeeded} market${succeeded === 1 ? '' : 's'}`;
  else if (succeeded === 0) title = `Could not update ${failed} market${failed === 1 ? '' : 's'}`;
  else title = `Updated ${succeeded} of ${total} markets`;

  const detailParts = [];
  if (data.truncated) detailParts.push('Only the first 50 listed contracts were included.');
  if (failHints.length) detailParts.push(failHints.join(' · '));

  return { title, detail: detailParts.join(' '), succeeded, failed, total };
}

/**
 * Trail text for "Default leverage & margin mode" row.
 * Enabled → e.g. "10x / Cross"; off → "Off".
 */
export function formatBatchAdjustTrail(draft, fallbacks = {}) {
  const levOn = !!draft?.leverageEnabled;
  const modeOn = !!draft?.marginModeEnabled;
  if (!levOn && !modeOn) return 'Off';

  const parts = [];
  if (levOn) {
    const lev = Math.round(Number(draft?.leverage ?? fallbacks.leverage));
    if (Number.isFinite(lev) && lev >= 1) parts.push(`${lev}x`);
  }
  if (modeOn) {
    const mode =
      draft?.marginMode === 'isolated' || draft?.marginMode === 'cross'
        ? draft.marginMode
        : String(fallbacks.marginMode || '').toLowerCase() === 'isolated'
          ? 'isolated'
          : 'cross';
    parts.push(mode === 'isolated' ? 'Isolated' : 'Cross');
  }
  return parts.length ? parts.join(' / ') : 'Off';
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
