/**
 * Futures place/close outcome + reason text.
 * Parity with web: futures_trade/index.js (futuresPlaceOutcome)
 * and Order/futuresProfileOrderHelpers.js (futuresOrderReasonText).
 */

export const FUTURES_TERMINAL_STATUSES = new Set(['CANCELLED', 'REJECTED', 'EXPIRED']);

const FUTURES_REASON_LABELS = {
  USER_REQUEST: 'Cancelled by you',
  USER_CANCEL: 'Cancelled by you',
  LIQUIDATION: 'Cancelled by liquidation',
};

/** Parse filled_quantity: number, string, or { $numberDecimal }. Missing → 0. */
export function parseFuturesFilledQuantity(raw) {
  if (raw == null || raw === '') return 0;
  if (typeof raw === 'object' && raw.$numberDecimal != null) {
    const n = Number(raw.$numberDecimal);
    return Number.isFinite(n) ? n : 0;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

export function futuresStatusMessage(order) {
  if (typeof order?.status_message === 'string' && order.status_message.trim()) {
    return order.status_message.trim();
  }
  return null;
}

/**
 * Read order from place/close response: data.order, else data.
 * @returns {{ kind: 'placed'|'partial'|'none', message: string|null }}
 */
export function futuresPlaceOutcome(order) {
  if (!order) return { kind: 'placed', message: null };
  const status = String(order.status ?? '').toUpperCase();
  const filled = parseFuturesFilledQuantity(order.filled_quantity);
  const message = futuresStatusMessage(order);

  if (FUTURES_TERMINAL_STATUSES.has(status)) {
    if (filled > 0) {
      return {
        kind: 'partial',
        message:
          message ||
          'Your order was partly filled. The remaining amount was cancelled.',
      };
    }
    return {
      kind: 'none',
      message:
        message ||
        'Your order could not be filled and was cancelled. Your position has not changed.',
    };
  }
  if (message) return { kind: 'partial', message };
  return { kind: 'placed', message: null };
}

export function isFuturesTerminalOrder(order) {
  return FUTURES_TERMINAL_STATUSES.has(String(order?.status ?? '').toUpperCase());
}

/**
 * Profile / Close Reason text: status_message, then mapped cancel/reject code, else "—".
 */
export function futuresOrderReasonText(order) {
  const message = futuresStatusMessage(order);
  if (message) return message;
  const code = String(order?.cancelled_reason || order?.rejection_reason || '').trim();
  if (!code) return '—';
  if (FUTURES_REASON_LABELS[code]) return FUTURES_REASON_LABELS[code];
  const words = code.replace(/[_:]+/g, ' ').toLowerCase().trim();
  if (!words) return '—';
  return words.charAt(0).toUpperCase() + words.slice(1);
}
