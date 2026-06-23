import { IMAGE_BASE_URL } from "../../../../helper/Constants";

/** Unwrap MongoDB $numberDecimal or plain values to string. */
export function decStr(v) {
    if (v == null) return "";
    if (typeof v === "object" && v.$numberDecimal != null) return String(v.$numberDecimal);
    return String(v);
}

export function decNum(v) {
    const n = parseFloat(decStr(v));
    return Number.isFinite(n) ? n : 0;
}

/** BTC → BTCUSDT */
export function underlyingKeyFromAsset(asset) {
    const base = String(asset || "").trim().toUpperCase();
    if (!base) return "";
    if (base.endsWith("USDT") || base.endsWith("USDC")) return base;
    return `${base}USDT`;
}

/** BTCUSDT → BTC */
export function assetFromUnderlying(underlying) {
    return String(underlying || "").replace(/USDT$|USDC$/i, "");
}

/** BTCUSDT → BTC/USDT for display */
export function formatUnderlyingPair(underlying) {
    const u = String(underlying || "");
    const m = u.match(/^(.+?)(USDT|USDC)$/i);
    if (m) return `${m[1]}/${m[2].toUpperCase()}`;
    return u || "—";
}

/** Resolve backend icon path from market_overview.underlying_icons */
export function resolveUnderlyingIconUrl(iconPath) {
    if (!iconPath) return ""; // return a placeholder if needed
    const s = String(iconPath).trim();
    if (!s) return "";
    if (s.startsWith("http") || s.startsWith("/images/")) return s;
    return `${IMAGE_BASE_URL.replace(/\/$/, '')}${s.startsWith('/') ? '' : '/'}${s}`;
}

/** Build ticker list from market_overview payload. */
export function underlyingsFromMarketOverview(overview) {
    const list = overview?.underlyings || [];
    const prices = overview?.index_prices || {};
    const icons = overview?.underlying_icons || {};
    return list.map((u) => {
        const symbol = assetFromUnderlying(u);
        const price = decNum(prices[u]);
        return {
            symbol,
            underlying: u,
            price,
            iconPath: resolveUnderlyingIconUrl(icons[u] || null),
            change: 0,
            isPos: true,
            base_currency: symbol,
            quote_currency: u.replace(symbol, ''),
        };
    });
}
