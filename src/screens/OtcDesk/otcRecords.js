import { moneyLine } from "./otcDeskLogic";

export const LIVE_STATUS = new Set(["OPEN", "QUOTED"]);
export const LOCKED_STATUS = new Set(["PENDING_SETTLEMENT", "HELD"]);

export function formatWhen(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function ticketLabel(id) {
  const text = String(id || "").trim();
  if (!text) return "—";
  return text.slice(-8).toUpperCase();
}

function filled(...values) {
  for (const raw of values) {
    if (raw == null) continue;
    const text = String(raw).trim();
    if (!text || text === "—" || text === "-") continue;
    return text;
  }
  return "";
}

function rowRate(row, quote) {
  const quotedHere = quote && String(quote.rfq_id || quote.rfqId || "") === String(row?.id);
  return filled(
    quotedHere ? quote?.rate : "",
    row?.rate,
    row?.quote?.rate,
    row?.quote_rate,
    row?.quote_price,
    row?.desk_rate,
    row?.price,
    row?.executed_rate,
    row?.request_rate,
  );
}

function trimNumber(value) {
  if (!Number.isFinite(value)) return "";
  return value.toFixed(8).replace(/\.?0+$/, "");
}

function tradedAmountLine(row, rate) {
  const amount = filled(row?.net_get_amount, row?.get_amount, row?.traded_amount);
  const directAsset = filled(row?.get_asset, row?.traded_asset);
  if (amount) return moneyLine(amount, directAsset);
  const pay = Number(String(row?.pay_amount ?? "").replace(/,/g, ""));
  const price = Number(String(rate || "").replace(/,/g, ""));
  if (!(pay > 0) || !(price > 0)) return "—";
  const side = String(row?.side || "").toUpperCase();
  if (side === "SELL") return moneyLine(trimNumber(pay * price), filled(row?.pair_quote, row?.get_asset));
  if (side === "BUY") return moneyLine(trimNumber(pay / price), filled(row?.pair_base, row?.get_asset));
  return "—";
}

export function rfqPair(row) {
  if (row?.pair_base && row?.pair_quote) return `${row.pair_base}/${row.pair_quote}`;
  const side = String(row?.side || "").toUpperCase();
  if (side === "SELL" && row?.pay_asset && row?.get_asset) return `${row.pay_asset}/${row.get_asset}`;
  if (row?.get_asset && row?.pay_asset) return `${row.get_asset}/${row.pay_asset}`;
  return "—";
}

export function toTableRow(row, quote) {
  const status = String(row?.status || "—");
  const statusKey = status.toUpperCase();
  const quotedHere = quote && String(quote.rfq_id || quote.rfqId || "") === String(row?.id);
  const rate = rowRate(row, quote);
  const sideRaw = String(row?.side || "").toUpperCase();
  const isTrade = LOCKED_STATUS.has(statusKey)
    || statusKey === "SETTLED"
    || statusKey === "VOID"
    || (row?.quote_id && row?.rfq_id && String(row.id) !== String(row.rfq_id));
  const settlementRaw = filled(row?.settlement_status, row?.settlementStatus);
  const settlementKey = settlementRaw.toUpperCase();
  const settlement = statusKey === "SETTLED" || settlementKey === "SETTLED" || row?.settled_at
    ? "Settled"
    : statusKey === "PENDING_SETTLEMENT" || settlementKey === "PENDING" || settlementKey === "PENDING_SETTLEMENT"
      ? "Pending"
      : statusKey === "HELD" || settlementKey === "HELD"
        ? "Held"
        : statusKey === "VOID" || settlementKey === "VOID"
          ? "Void"
          : "Unsettled";
  return {
    id: String(row?.id || rfqPair(row)),
    ticketId: ticketLabel(row?.id),
    date: formatWhen(row?.createdAt || row?.created_at),
    type: isTrade ? "Trade" : "RFQ",
    pair: rfqPair(row),
    side: sideRaw === "SELL" ? "Sell" : sideRaw === "BUY" ? "Buy" : "—",
    pay: moneyLine(row?.pay_amount, row?.pay_asset),
    receive: moneyLine(row?.net_get_amount || row?.get_amount, row?.get_asset),
    tradedAmount: tradedAmountLine(row, rate),
    quotePrice: rate || "—",
    limitPrice: String(row?.request_rate || "").trim() || rate || "—",
    averagePrice: rate || "—",
    progress: statusKey === "QUOTED" ? "Quoted" : statusKey === "OPEN" ? "Open" : LOCKED_STATUS.has(statusKey) ? "Funds locked" : "—",
    filledTotal: statusKey === "OPEN" || statusKey === "QUOTED"
      ? `0 / ${moneyLine(row?.pay_amount, row?.pay_asset)}`
      : LOCKED_STATUS.has(statusKey)
        ? moneyLine(row?.pay_amount, row?.pay_asset)
        : "—",
    status,
    settlement,
    source: !isTrade && statusKey === "OPEN" ? row : null,
    view: {
      id: String(row?.id || ""),
      ticketId: ticketLabel(row?.id),
      pair: rfqPair(row),
      side: sideRaw === "SELL" ? "Sell" : sideRaw === "BUY" ? "Buy" : "—",
      pay: moneyLine(row?.pay_amount, row?.pay_asset),
      receive: moneyLine(row?.net_get_amount || row?.get_amount, row?.get_asset),
      status,
      requestRate: String(row?.request_rate || "").trim(),
      rate: rate || "",
      expiresAt: row?.expiresAt || (quotedHere ? quote?.expiresAt : null) || null,
      createdAt: row?.createdAt || row?.created_at || null,
    },
  };
}

export function otcDetailRecord(row) {
  return {
    pair: row?.pair || "—",
    date: row?.date || "—",
    ticketId: row?.ticketId || "—",
    type: row?.type || "—",
    side: row?.side || "—",
    pay: row?.pay || "—",
    receive: row?.receive || "—",
    tradedAmount: row?.tradedAmount || "—",
    quotePrice: row?.quotePrice == null || row?.quotePrice === "" ? "—" : String(row.quotePrice),
    limitPrice: row?.limitPrice == null || row?.limitPrice === "" ? "—" : String(row.limitPrice),
    progress: row?.progress || "—",
    filledTotal: row?.filledTotal || "—",
    status: row?.status || "—",
    settlement: row?.settlement || "—",
    requestRate: row?.view?.requestRate || "—",
    deskRate: row?.view?.rate || "The desk sets the rate",
    opened: row?.view?.createdAt ? formatWhen(row.view.createdAt) : (row?.date || "—"),
    validUntil: row?.view?.expiresAt ? formatWhen(row.view.expiresAt) : "",
  };
}

export function buildOtcTableRows({ tab, trades, rfq, quote, trade, view }) {
  const history = Array.isArray(trades) ? trades : [];
  const status = String(rfq?.status || "").toUpperCase();
  const seen = new Set();
  const take = (row) => {
    if (!row) return false;
    const id = row.id ? String(row.id) : "";
    const rfqKey = row.rfq_id ? `rfq:${row.rfq_id}` : "";
    if ((id && seen.has(id)) || (rfqKey && seen.has(rfqKey))) return false;
    if (id) seen.add(id);
    if (rfqKey) seen.add(rfqKey);
    return true;
  };
  const liveStatus = (row) => LIVE_STATUS.has(String(row?.status || "").toUpperCase());
  const locked = (row) => LOCKED_STATUS.has(String(row?.status || "").toUpperCase());
  if (tab === "active") {
    const list = [];
    if (rfq && (view === "awaiting" || view === "quote") && take(rfq)) {
      list.push({ ...rfq, rate: quote?.rate || rfq.rate });
    }
    history.forEach((row) => {
      if ((liveStatus(row) || locked(row)) && take(row)) list.push(row);
    });
    if (locked(trade) && take(trade)) list.push(trade);
    return list.map((row) => toTableRow(row, quote));
  }
  const past = history.filter((row) => !locked(row) && !liveStatus(row));
  past.forEach((row) => {
    if (row?.id) seen.add(String(row.id));
    if (row?.rfq_id) seen.add(`rfq:${row.rfq_id}`);
  });
  const extras = [];
  if (trade?.id && !locked(trade) && !seen.has(String(trade.id))) extras.push(trade);
  if (rfq?.id && (view === "expired" || (status && status !== "OPEN" && status !== "QUOTED"))) {
    const closed = { ...rfq, rate: quote?.rate || rfq.rate };
    if (!locked(closed) && !seen.has(String(rfq.id)) && !seen.has(`rfq:${rfq.id}`)) extras.push(closed);
  }
  return [...extras, ...past].map((row) => toTableRow(row, quote));
}
