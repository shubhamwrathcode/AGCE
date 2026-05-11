/**
 * Shared parsing for coin `chain` + per-network status/limits (deposit & withdraw APIs).
 * Aligns with web: DepositPage (deposit_status), WithdrawPage (withdrawal_status).
 */

export function networkKeysFromChain(chain) {
    if (chain == null) return [];
    if (Array.isArray(chain)) {
        return chain
            .map((c) => {
                if (typeof c === 'string' && c.trim()) return c.trim();
                if (c != null && typeof c === 'object' && !Array.isArray(c)) {
                    const k = Object.keys(c)[0];
                    return k || '';
                }
                return '';
            })
            .filter(Boolean);
    }
    if (typeof chain === 'object') {
        return Object.keys(chain);
    }
    return [];
}

/** Same chain code normalization as `withdrawCoinsNormalize` wallet `chains[]` rows. */
const WALLET_CHAIN_TO_APP = {
    BSC: 'BEP20',
    ETH: 'ERC20',
    ERC20: 'ERC20',
    BEP20: 'BEP20',
    TRC20: 'TRC20',
    TRON: 'TRC20',
    POLYGON: 'POLYGON',
    MATIC: 'POLYGON',
    BTC: 'BTC',
    SOL: 'SOLANA',
    SOLANA: 'SOLANA',
};

/** When `item.chain` is missing but API sends `chains: [{ chain, network, ... }]`. */
export function networkKeysFromWalletChainsArray(chains) {
    if (!Array.isArray(chains) || chains.length === 0) return [];
    const out = [];
    for (const ch of chains) {
        if (!ch || typeof ch !== 'object') continue;
        const raw = String(ch.chain || ch.network || '').trim().toUpperCase();
        if (!raw) continue;
        const code = String(WALLET_CHAIN_TO_APP[raw] || raw).trim().toUpperCase();
        if (code && !out.includes(code)) out.push(code);
    }
    return out;
}

/** Web DepositPage: deposit_status[chain] === "ACTIVE" */
export function getActiveDepositChainKeys(item) {
    if (!item) return [];
    const keys = networkKeysFromChain(item.chain);
    const ds = item.deposit_status;
    if (typeof ds === 'string') {
        if (ds === 'SUSPENDED') return [];
        return keys;
    }
    if (ds && typeof ds === 'object' && !Array.isArray(ds) && Object.keys(ds).length > 0) {
        return keys.filter((k) => ds[k] === 'ACTIVE');
    }
    return keys;
}

/** Web WithdrawPage: withdrawal_status[chain] === "ACTIVE" */
export function getActiveWithdrawChainKeys(item) {
    if (!item) return [];
    let keys = networkKeysFromChain(item.chain);
    if (keys.length === 0 && Array.isArray(item.chains)) {
        keys = networkKeysFromWalletChainsArray(item.chains);
    }
    const ws = item.withdrawal_status;
    if (typeof ws === 'string') {
        if (ws === 'SUSPENDED') return [];
        return keys;
    }
    // Empty `{}` must not filter out every network (catalog often omits per-chain flags).
    if (ws && typeof ws === 'object' && !Array.isArray(ws) && Object.keys(ws).length > 0) {
        return keys.filter((k) => ws[k] === 'ACTIVE');
    }
    return keys;
}

/** Per-chain field or scalar (matches web getChainValue). */
export function valueForChain(coin, field, chainKey) {
    if (!coin) return undefined;
    const raw = coin[field];
    if (raw == null) return undefined;
    if (typeof raw === 'object' && !Array.isArray(raw) && chainKey && chainKey in raw) {
        return raw[chainKey];
    }
    if (typeof raw === 'string' || typeof raw === 'number') {
        return raw;
    }
    return undefined;
}

export function isDepositCoinDisabled(item) {
    if (!item) return true;
    if (typeof item.deposit_status === 'string' && item.deposit_status === 'SUSPENDED') {
        return true;
    }
    return getActiveDepositChainKeys(item).length === 0;
}

export function isWithdrawCoinDisabled(item) {
    if (!item) return true;
    if (typeof item.withdrawal_status === 'string' && item.withdrawal_status === 'SUSPENDED') {
        return true;
    }
    return getActiveWithdrawChainKeys(item).length === 0;
}

export function parseNum(v, fallback = 0) {
    if (v == null || v === '') return fallback;
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : fallback;
}
