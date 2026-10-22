import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { appOperation } from '../appOperation';

/** Spot / options VIP fees are percents: 0.1 → 0.100%, 0.13 → 0.130%. */
export function formatTradeFeePercent(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const four = n.toFixed(4);
  return `${four.endsWith('0') ? n.toFixed(3) : four}%`;
}

/** Futures fees are fractions: 0.0002 → 0.02%, 0.0005 → 0.05%. */
export function formatFractionFeePercent(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const text = (n * 100).toFixed(8).replace(/\.?0+$/, '');
  return `${text || '0'}%`;
}

function pairFeeLabel(fee) {
  if (fee == null || fee === '') return '---';
  return `${fee}%`;
}

function hasSession() {
  return Boolean(appOperation.customerToken);
}

/**
 * `product` is `spot` (also isolated and cross), `futures`, or `options`.
 * `fees` is null unless fee_source is vip, so Regular keeps the pair/contract/config rate.
 * `ready` stays false until that check finishes, so the form does not flash a placeholder.
 */
export function useVipTradeFees(product = 'spot') {
  const userData = useSelector((state) => state.auth?.userData);
  const signedIn = Boolean(userData) && hasSession();
  const [state, setState] = useState(() => ({ ready: !signedIn, fees: null }));

  useEffect(() => {
    if (!signedIn) {
      setState({ ready: true, fees: null });
      return undefined;
    }
    let cancelled = false;
    setState((prev) => ({ ...prev, ready: false }));
    const requested = product === 'futures' || product === 'options' ? product : 'spot';
    const formatFee = requested === 'futures' ? formatFractionFeePercent : formatTradeFeePercent;
    appOperation.customer
      .getMyVip(requested)
      .then((res) => {
        if (cancelled) return;
        const data = res?.success && res.data && !Array.isArray(res.data) ? res.data : null;
        if (!data || data.fee_source !== 'vip') {
          setState({ ready: true, fees: null });
          return;
        }
        const maker = formatFee(data.maker_fee);
        const taker = formatFee(data.taker_fee);
        setState({
          ready: true,
          fees: maker && taker ? { maker, taker } : null,
        });
      })
      .catch(() => {
        if (!cancelled) setState({ ready: true, fees: null });
      });
    return () => {
      cancelled = true;
    };
  }, [product, signedIn]);

  return state;
}

/** VIP rate when the account has one. Otherwise the pair or contract rate. "---" until known. */
export function resolveTradeFeeLabel(vipState, pairFee, side, asFraction = false) {
  if (!vipState?.ready) return '---';
  const vipText = side === 'taker' ? vipState.fees?.taker : vipState.fees?.maker;
  if (vipText) return vipText;
  if (asFraction) return formatFractionFeePercent(pairFee) || '---';
  return pairFeeLabel(pairFee);
}

export function parseVipAmount(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function formatVipVolumeNumber(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

export function formatVipUsdt(value) {
  return `${formatVipVolumeNumber(value)} USDT`;
}

export function sortedVipTiers(tiers) {
  return [...(tiers || [])]
    .filter((tier) => tier && tier.enabled !== false)
    .sort((a, b) => Number(a.sort) - Number(b.sort));
}

export function progressFromVipStatus(status) {
  const vip = sortedVipTiers(status?.tiers);
  const hasSchedule = vip.length > 0;
  const volume = parseVipAmount(status?.volume_usdt_30d);
  const remaining = parseVipAmount(status?.volume_remaining_usdt);
  const saved = status?.tier ? vip.find((tier) => tier.code === status.tier) : null;
  const currentMin = saved ? parseVipAmount(saved.min_volume_usdt) : 0;
  const next = status?.next_tier ? vip.find((tier) => tier.code === status.next_tier) : null;
  const nextMin = next ? parseVipAmount(next.min_volume_usdt) : null;
  const atTop = hasSchedule && !status?.next_tier;
  let percent = atTop ? 100 : 0;
  if (!atTop && nextMin != null) {
    const span = nextMin - currentMin;
    percent = span > 0 ? Math.min(100, Math.max(0, ((volume - currentMin) / span) * 100)) : 0;
  }
  return {
    label: status?.tier_label || 'Regular',
    volume,
    nextLabel: status?.next_tier_label,
    nextMin,
    percent,
    remaining,
    atTop,
    hasSchedule,
    qualifies: !atTop && hasSchedule && remaining <= 0 && Boolean(status?.next_tier),
  };
}

/** Visual band metadata aligned with web VOLUME_BANDS (tag index + accent class). */
export const VIP_VOLUME_BANDS = [
  { btnClass: 'one', accent: '#b5b5bd', tagIndex: 0 },
  { btnClass: 'two', accent: '#e08a4a', tagIndex: 1 },
  { btnClass: 'three', accent: '#3ecf8e', tagIndex: 2 },
  { btnClass: 'four', accent: '#4f8cff', tagIndex: 3 },
  { btnClass: 'five', accent: '#a76bff', tagIndex: 4 },
  { btnClass: 'six', accent: '#f1c76a', tagIndex: 5 },
];

function rowsFromVipApi(status, formatFee) {
  const vip = sortedVipTiers(status?.tiers);
  if (!vip.length) return null;
  const regularMaker = Number(status?.regular_maker_fee);
  const regularTaker = Number(status?.regular_taker_fee);
  const firstMin = parseVipAmount(vip[0].min_volume_usdt);
  const regular = {
    ...VIP_VOLUME_BANDS[0],
    id: 'Regular',
    code: null,
    volume: `< ${formatVipVolumeNumber(firstMin)}`,
    makerFee: formatFee(regularMaker) || '—',
    takerFee: formatFee(regularTaker) || '—',
    benefits: 'Standard rate',
  };
  const rows = vip.map((tier, index) => {
    const style = VIP_VOLUME_BANDS[Math.min(index + 1, VIP_VOLUME_BANDS.length - 1)];
    const next = vip[index + 1];
    const min = parseVipAmount(tier.min_volume_usdt);
    const nextMin = next ? parseVipAmount(next.min_volume_usdt) : null;
    const upper = nextMin == null ? null : Number.isInteger(nextMin) ? nextMin - 1 : nextMin;
    const rebate = regularTaker - Number(tier.taker_fee);
    return {
      ...style,
      id: tier.label || tier.code,
      code: tier.code,
      volume:
        upper == null
          ? `≥ ${formatVipVolumeNumber(min)}`
          : `${formatVipVolumeNumber(min)} – ${formatVipVolumeNumber(upper)}`,
      makerFee: formatFee(tier.maker_fee) || '—',
      takerFee: formatFee(tier.taker_fee) || '—',
      benefits: rebate > 0 ? `Save ${formatFee(rebate)}` : 'VIP rate',
    };
  });
  return [regular, ...rows];
}

export function spotVipRowsFromApi(status) {
  return rowsFromVipApi(status, (v) => formatTradeFeePercent(v) || '—');
}

export function futuresVipRowsFromApi(status) {
  return rowsFromVipApi(status, (v) => formatFractionFeePercent(v) || '—');
}

export function optionsVipRowsFromApi(status) {
  return rowsFromVipApi(status, (v) => formatTradeFeePercent(v) || '—');
}

export function isYourVipTier(tier, status) {
  if (!status) return false;
  if (tier.code && status.tier) return tier.code === status.tier;
  if (!status.tier) return tier.id === 'Regular';
  return tier.id === status.tier_label;
}

function withBandMeta(rows) {
  return rows.map((row, index) => ({
    ...VIP_VOLUME_BANDS[Math.min(index, VIP_VOLUME_BANDS.length - 1)],
    ...row,
  }));
}

/** Guest / empty-tiers published schedules (handoff §5). */
export const VIP_GUEST_MARKETS = [
  {
    key: 'spot',
    label: 'Spot & margin',
    rows: withBandMeta([
      { id: 'Regular', volume: '< 50,000', makerFee: '0.120%', takerFee: '0.150%', benefits: 'Standard rate' },
      { id: 'VIP 1', volume: '50,000 – 249,999', makerFee: '0.100%', takerFee: '0.130%', benefits: '0.020% lower' },
      { id: 'VIP 2', volume: '250,000 – 999,999', makerFee: '0.100%', takerFee: '0.115%', benefits: '0.035% lower' },
      { id: 'VIP 3', volume: '1,000,000 – 4,999,999', makerFee: '0.100%', takerFee: '0.108%', benefits: '0.042% lower' },
      { id: 'VIP 4', volume: '5,000,000 – 24,999,999', makerFee: '0.100%', takerFee: '0.104%', benefits: '0.046% lower' },
      { id: 'VIP 5', volume: '≥ 25,000,000', makerFee: '0.100%', takerFee: '0.100%', benefits: '0.050% lower' },
    ]),
  },
  {
    key: 'futures',
    label: 'Futures',
    rows: withBandMeta([
      { id: 'Regular', volume: '< 50,000', makerFee: '0.025%', takerFee: '0.058%', benefits: 'Standard rate' },
      { id: 'VIP 1', volume: '50,000 – 249,999', makerFee: '0.023%', takerFee: '0.055%', benefits: '0.003% lower' },
      { id: 'VIP 2', volume: '250,000 – 999,999', makerFee: '0.022%', takerFee: '0.053%', benefits: '0.005% lower' },
      { id: 'VIP 3', volume: '1,000,000 – 4,999,999', makerFee: '0.021%', takerFee: '0.052%', benefits: '0.006% lower' },
      { id: 'VIP 4', volume: '5,000,000 – 24,999,999', makerFee: '0.0205%', takerFee: '0.051%', benefits: '0.007% lower' },
      { id: 'VIP 5', volume: '≥ 25,000,000', makerFee: '0.020%', takerFee: '0.050%', benefits: '0.008% lower' },
    ]),
  },
  {
    key: 'options',
    label: 'Options',
    rows: withBandMeta([
      { id: 'Regular', volume: '< 50,000', makerFee: '0.030%', takerFee: '0.038%', benefits: 'Standard rate' },
      { id: 'VIP 1', volume: '50,000 – 249,999', makerFee: '0.030%', takerFee: '0.034%', benefits: '0.004% lower' },
      { id: 'VIP 2', volume: '250,000 – 999,999', makerFee: '0.030%', takerFee: '0.032%', benefits: '0.006% lower' },
      { id: 'VIP 3', volume: '1,000,000 – 4,999,999', makerFee: '0.030%', takerFee: '0.031%', benefits: '0.007% lower' },
      { id: 'VIP 4', volume: '5,000,000 – 24,999,999', makerFee: '0.030%', takerFee: '0.030%', benefits: '0.008% lower' },
      { id: 'VIP 5', volume: '≥ 25,000,000', makerFee: '0.030%', takerFee: '0.030%', benefits: '0.008% lower' },
    ]),
  },
];
