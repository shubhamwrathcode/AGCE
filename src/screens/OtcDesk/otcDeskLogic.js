import BigNumber from "bignumber.js";

const AMOUNT_RE = /^\d+(\.\d+)?$/;
export const BACKUP_POLL_MS = 15000;

export function coinCode(value) {
  if (value && typeof value === "object") {
    return String(value.short_name || value.code || value.symbol || value.name || "")
      .trim()
      .toUpperCase();
  }
  return String(value || "").trim().toUpperCase();
}

export function positiveLast(...candidates) {
  for (const raw of candidates) {
    if (raw == null || raw === "") continue;
    const n = Number(String(raw).replace(/,/g, ""));
    if (Number.isFinite(n) && n > 0) return String(n);
  }
  return null;
}

function pairCodes(pair) {
  if (!pair) return { base: "", quote: "" };
  return {
    base: coinCode(pair.base_currency || pair.base_asset || pair.base),
    quote: coinCode(pair.quote_currency || pair.quote_asset || pair.quote),
  };
}

export function matchSpotPair(pairs, payCoin, getCoin) {
  const a = coinCode(payCoin);
  const b = coinCode(getCoin);
  if (!a || !b) return null;
  const list = Array.isArray(pairs) ? pairs : [];
  return (
    list.find((p) => {
      const { base, quote } = pairCodes(p);
      return (base === a && quote === b) || (base === b && quote === a);
    }) || null
  );
}

export function tickerFromSpotPair(pair) {
  if (!pair) return null;
  const { base, quote } = pairCodes(pair);
  const last = positiveLast(pair.buy_price, pair.sell_price, pair.last, pair.close, pair.price);
  if (!last) return null;
  const change = pair.change_percentage ?? pair.change ?? pair.change_24hour;
  return {
    pair: `${base}/${quote}`,
    last,
    change_percent: String(change ?? "0"),
  };
}

function findPairMid(rates, baseAsset, quoteAsset) {
  const base = String(baseAsset || "").toUpperCase();
  const quote = String(quoteAsset || "").toUpperCase();
  const pairs = Array.isArray(rates?.pairs) ? rates.pairs : [];
  const row = pairs.find(
    (p) =>
      String(p?.base_asset || "").toUpperCase() === base &&
      String(p?.quote_asset || "").toUpperCase() === quote
  );
  if (!row || row.mid == null || row.mid === "") return null;
  const mid = Number(row.mid);
  if (!Number.isFinite(mid) || mid <= 0) return null;
  return { mid: String(row.mid) };
}

export function tickerFromConvert(rates, payCoin, getCoin) {
  const getPay = findPairMid(rates, getCoin, payCoin);
  const payGet = getPay ? null : findPairMid(rates, payCoin, getCoin);
  const midInfo = getPay || payGet;
  const last = positiveLast(midInfo?.mid);
  if (!last) return null;
  const pair = getPay
    ? `${coinCode(getCoin)}/${coinCode(payCoin)}`
    : `${coinCode(payCoin)}/${coinCode(getCoin)}`;
  return { pair, last, change_percent: "0" };
}

export function apiMessage(res, fallback) {
  if (res && res.message) return res.message;
  return fallback;
}

export function mapActivePairs(rows) {
  return (Array.isArray(rows) ? rows : [])
    .map((row) => ({
      base: coinCode(row.base_currency || row.base),
      quote: coinCode(row.quote_currency || row.quote),
      name: String(row.base_currency_fullname || row.name || "").trim(),
      iconPath: String(row.icon_path || "").trim(),
    }))
    .filter((row) => row.base && row.quote && row.base !== row.quote);
}

export function mapOtcPairs(rows) {
  return (Array.isArray(rows) ? rows : [])
    .map((row) => ({
      base: coinCode(row.base),
      quote: coinCode(row.quote),
      buy_available: row.buy_available,
      sell_available: row.sell_available,
      min_base: String(row.min_base || "").trim(),
      max_base: String(row.max_base || "").trim(),
      min_notional: String(row.min_notional || "").trim(),
      max_notional: String(row.max_notional || "").trim(),
      limit_source: row.limit_source,
    }))
    .filter((row) => row.base && row.quote);
}

export function pairKeyOf(row) {
  if (!row) return "";
  if (typeof row === "string") return row;
  return `${coinCode(row.base || row.base_currency)}/${coinCode(row.quote || row.quote_currency)}`;
}

export function overlayOtcPairs(activeRows, otcRows) {
  const extras = new Map(otcRows.map((row) => [pairKeyOf(row), row]));
  const seen = new Set();
  const out = activeRows.map((row) => {
    const key = pairKeyOf(row);
    seen.add(key);
    const extra = extras.get(key);
    return extra ? { ...row, ...extra, name: row.name, iconPath: row.iconPath } : row;
  });
  otcRows.forEach((row) => {
    if (seen.has(pairKeyOf(row))) return;
    out.push(row);
  });
  return out;
}

export function pickDefaultPair(pairs) {
  const first = Array.isArray(pairs) ? pairs[0] : null;
  if (!first || !first.base || !first.quote) return "";
  return `${coinCode(first.base)}/${coinCode(first.quote)}`;
}

export function findListedPair(pairs, key) {
  const want = String(key || "").toUpperCase();
  return (Array.isArray(pairs) ? pairs : []).find((row) => pairKeyOf(row) === want) || null;
}

export function formatMoney(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return String(raw || "");
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function formatApprox(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return "";
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 8,
    maximumFractionDigits: 8,
  });
}

export function trimDecimal(raw, places = 8) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return "";
  const scale = places === 2 ? 2 : 8;
  return n.toFixed(scale).replace(/\.?0+$/, "");
}

export function quotePlaces(code) {
  const asset = String(code || "").toUpperCase();
  if (asset === "USDT" || asset === "USDC" || asset === "USD") return 2;
  return 8;
}

export function formatAvail(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return "0";
  return n.toLocaleString(undefined, { maximumFractionDigits: 8 });
}

/** Digits and one decimal point only. Letters such as "0.0d" are dropped. */
export function sanitizeAmount(raw, places = 8) {
  let text = String(raw ?? "").replace(/[^\d.]/g, "");
  const firstDot = text.indexOf(".");
  if (firstDot >= 0) {
    text = text.slice(0, firstDot + 1) + text.slice(firstDot + 1).replace(/\./g, "");
  }
  const parts = text.split(".");
  const whole = (parts[0] || "").replace(/^0+(?=\d)/, "");
  if (parts.length === 1) return whole;
  return `${whole || "0"}.${parts[1].slice(0, places)}`;
}

/**
 * One limit, in the coin the user typed.
 * Quote entry uses the USDT order value. Base entry uses that value converted at the live price.
 * The higher minimum wins. The lower maximum wins. The other coin is not checked again.
 */
export function amountUnitLimit({ enteredInQuote, baseRaw, quoteRaw, price, quoteCode, pick }) {
  const baseN = Number(baseRaw);
  const quoteN = Number(quoteRaw);
  const hasBase = Number.isFinite(baseN) && baseN > 0;
  const hasQuote = Number.isFinite(quoteN) && quoteN > 0;
  const px = Number(price);
  const parts = [];
  if (enteredInQuote) {
    if (hasQuote) parts.push(quoteN);
    if (hasBase && px > 0) parts.push(baseN * px);
  } else {
    if (hasBase) parts.push(baseN);
    if (hasQuote && px > 0) parts.push(quoteN / px);
  }
  if (!parts.length) return "";
  const n = pick === "max" ? Math.min(...parts) : Math.max(...parts);
  if (!Number.isFinite(n) || n <= 0) return "";
  return trimDecimal(n, enteredInQuote ? quotePlaces(quoteCode) : 8);
}

/** Buy pays the quote coin and receives the base coin. Sell is the reverse. The amount coin is only the unit typed. */
export function sizeRfq({ quoteType, amount, amountAsset, baseCode, quoteCode, last }) {
  const qty = String(amount || "").trim();
  const lastText = positiveLast(last);
  if (!lastText || !baseCode || !quoteCode) return null;
  if (!AMOUNT_RE.test(qty) || qty === "0" || /^0+(\.0+)?$/.test(qty)) return null;
  const enteredInQuote = amountAsset === quoteCode;
  const price = Number(lastText);
  const baseQty = enteredInQuote ? trimDecimal(Number(qty) / price) : qty;
  const qtyN = Number(baseQty);
  if (!Number.isFinite(qtyN) || qtyN <= 0) return null;
  const notionalN = enteredInQuote ? Number(qty) : qtyN * price;
  const quoteNotional = trimDecimal(notionalN, quotePlaces(quoteCode));
  const pay = quoteType === "sell" ? baseQty : quoteNotional;
  const get = quoteType === "sell" ? quoteNotional : baseQty;
  if (!AMOUNT_RE.test(String(pay)) || !AMOUNT_RE.test(String(get))) return null;
  return {
    pay,
    get,
    payAsset: quoteType === "sell" ? baseCode : quoteCode,
    getAsset: quoteType === "sell" ? quoteCode : baseCode,
    baseQty,
    quoteNotional,
    qtyN,
    notionalN,
    enteredInQuote,
  };
}

export function amountErrorFor({
  amount,
  last,
  sized,
  baseCode,
  quoteCode,
  payCoin,
  minQtyRaw,
  pairMin,
  pairMax,
  pairMaxCoin,
  spendBalance,
}) {
  const empty = { error: "", warning: "" };
  const text = String(amount || "").trim();
  if (!text) return empty;
  if (!AMOUNT_RE.test(text)) return { error: "Enter a valid amount.", warning: "" };
  if (text === "0" || /^0+(\.0+)?$/.test(text)) return { error: "Enter an amount greater than 0.", warning: "" };
  if (!last) return { error: "Live price is not available yet.", warning: "" };
  if (!sized) return { error: "Enter a valid amount.", warning: "" };
  const price = Number(positiveLast(last) || 0);
  const unit = sized.enteredInQuote ? quoteCode : baseCode;
  const limitArgs = { enteredInQuote: sized.enteredInQuote, price, quoteCode };
  const minText = amountUnitLimit({
    ...limitArgs,
    baseRaw: minQtyRaw,
    quoteRaw: pairMin,
    pick: "min",
  });
  const notionalMaxText = amountUnitLimit({
    ...limitArgs,
    baseRaw: "",
    quoteRaw: pairMax,
    pick: "max",
  });
  const coinMaxText = amountUnitLimit({
    ...limitArgs,
    baseRaw: pairMaxCoin,
    quoteRaw: "",
    pick: "max",
  });
  const typed = Number(text);
  if (minText && typed < Number(minText)) {
    return {
      error: sized.enteredInQuote
        ? `Minimum order value is ${formatMoney(minText)} ${unit}.`
        : `Minimum amount is ${minText} ${unit}.`,
      warning: "",
    };
  }
  const aboveDeskMax = Boolean(notionalMaxText && typed > Number(notionalMaxText));
  if (!aboveDeskMax && coinMaxText && typed > Number(coinMaxText)) {
    return {
      error: `Maximum amount is ${sized.enteredInQuote ? formatMoney(coinMaxText) : coinMaxText} ${unit}.`,
      warning: "",
    };
  }
  const payN = Number(sized.pay);
  const haveN = Number(spendBalance);
  if (spendBalance !== "" && Number.isFinite(payN) && Number.isFinite(haveN) && payN > haveN) {
    return {
      error: `Insufficient ${String(payCoin || sized.payAsset || "").toUpperCase()} balance (needed ${sized.pay}, available ${spendBalance}).`,
      warning: "",
    };
  }
  if (!aboveDeskMax) return empty;
  const shown = sized.enteredInQuote ? formatMoney(notionalMaxText) : notionalMaxText;
  return {
    error: "",
    warning: `Above the desk maximum of ${shown} ${unit}. This request goes to the desk. Compliance reviews it after you accept a quote.`,
  };
}

export function remainingMs(expiresAt, nowMs) {
  if (!expiresAt) return 0;
  const end = new Date(expiresAt).getTime();
  if (Number.isNaN(end)) return 0;
  return Math.max(0, end - nowMs);
}

export function deskView(rfq, quote, nowMs) {
  if (!rfq) return "form";
  if (rfq.status === "CANCELLED") return "cancelled";
  if (rfq.status === "ACCEPTED" || quote?.status === "ACCEPTED") return "accepted";
  if (quote?.status === "VOID") return "void";
  const requestClosed = rfq.status === "OPEN" && rfq.expiresAt && remainingMs(rfq.expiresAt, nowMs) <= 0;
  const expired =
    rfq.status === "EXPIRED" ||
    rfq.status === "REJECTED_TIMEOUT" ||
    quote?.status === "EXPIRED" ||
    requestClosed ||
    (quote?.status === "ISSUED" && remainingMs(quote.expiresAt, nowMs) <= 0);
  if (expired) return "expired";
  if (rfq.status === "OPEN") return "awaiting";
  if (rfq.status === "QUOTED" && quote?.status === "ISSUED") return "quote";
  if (rfq.status === "QUOTED") return "awaiting";
  return "form";
}

export function formatCountdown(ms) {
  const total = Math.max(0, Math.floor(Number(ms) / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function moneyLine(amount, asset) {
  if (amount == null || amount === "") return "—";
  return `${amount} ${asset || ""}`.trim();
}

/** Same cut the ledger credits: fee rounded down, net is the rest. */
export function netAfterProfit(getAmount, feePercent) {
  const grossText = String(getAmount || "").trim();
  const pctText = String(feePercent == null ? "" : feePercent).trim();
  if (!/^\d+(\.\d+)?$/.test(grossText)) return "";
  if (pctText === "" || pctText === "0") return grossText;
  if (!/^\d+(\.\d+)?$/.test(pctText)) return grossText;
  const gross = new BigNumber(grossText);
  const pct = new BigNumber(pctText);
  if (!gross.isFinite() || gross.lte(0) || !pct.isFinite() || pct.lte(0)) return grossText;
  const dot = grossText.indexOf(".");
  const places = dot === -1 ? 0 : grossText.length - dot - 1;
  const scale = Math.min(18, Math.max(8, places));
  const fee = gross.times(pct).div(100).decimalPlaces(scale, BigNumber.ROUND_DOWN);
  if (fee.lte(0)) return grossText;
  const net = gross.minus(fee);
  if (net.lte(0)) return "";
  return net.toFixed(18).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
}

export const STATUS_COPY = {
  awaiting: {
    title: "Quote requested, awaiting desk",
    body: "Your RFQ is with the desk. This page checks status every few seconds until a quote is issued.",
  },
  quote: {
    title: "Quote ready",
    body: "Review the desk quote and accept before it expires.",
  },
  accepted: {
    title: "Quote accepted",
    body: "Funds are locked for settlement. Track the trade in Recent Completed Trades.",
  },
  cancelled: {
    title: "RFQ cancelled",
    body: "This request is no longer active. You can submit a new RFQ.",
  },
  expired: {
    title: "Quote expired",
    body: "This quote is no longer valid. Submit a new RFQ to get another quote.",
  },
  void: {
    title: "Quote withdrawn",
    body: "The desk withdrew this quote. Submit a new RFQ if you still want to trade.",
  },
};

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatCurrency(val) {
  const n = Number(String(val).replace(/,/g, ""));
  if (!Number.isFinite(n)) return val || "—";
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function toRecentTradeRow(t, idx) {
  const side = String(t.side || "BUY").toUpperCase();
  const base = t.pair_base || (t.pair && t.pair.split("/")[0]) || "BTC";
  const quote = t.pair_quote || (t.pair && t.pair.split("/")[1]) || "USDT";
  const isBuy = side === "BUY";
  const amt = t.amount || (isBuy ? t.get_amount : t.pay_amount) || t.base_amount || "0";
  const price = t.rate || t.price || t.quote_rate || "0";
  const total = t.total || (Number(amt) * Number(price)) || "0";
  return {
    id: t.id || `trade-${idx}`,
    date: formatDate(t.settled_at || t.createdAt || t.created_at || t.date),
    pair: `${base}/${quote}`,
    base,
    type: isBuy ? "Buy" : "Sell",
    amount: `${amt} ${base}`,
    price: formatCurrency(price),
    total: formatCurrency(total),
  };
}

export function completedTrades(trades, limit) {
  const settled = (Array.isArray(trades) ? trades : []).filter((row) => {
    const status = String(row?.status || "").toUpperCase();
    return !status || status === "SETTLED";
  });
  const rows = settled.map(toRecentTradeRow);
  return Number(limit) > 0 ? rows.slice(0, Number(limit)) : rows;
}

export function newIdempotencyKey(prefix = "otc") {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
