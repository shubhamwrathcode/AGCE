import type {Middleware} from '@reduxjs/toolkit';
import {
  setBuyOrders,
  setCoinData,
  setFuturesData,
  setFuturesPairs,
  setHotPairsChart,
  setRecentTrades,
  setSellOrders,
} from '../slices/homeSlice';

// High-frequency socket ticks. Screens that are not visible skip these and catch up when
// shown (see navigation/withTabStoreGate); every other action reaches them immediately.
const LIVE_MARKET_ACTIONS = new Set<string>([
  setCoinData.type,
  setHotPairsChart.type,
  setFuturesPairs.type,
  setFuturesData.type,
  setBuyOrders.type,
  setSellOrders.type,
  setRecentTrades.type,
]);

type State = Record<string, any>;

/** `[slice, key]` pairs that live ticks have written to, learned as they are dispatched. */
const livePaths: Array<[string, string]> = [];
const livePathIds = new Set<string>();

const recordLivePaths = (before: State, after: State) => {
  if (before === after) return;
  for (const slice of Object.keys(after)) {
    const prevSlice = before[slice];
    const nextSlice = after[slice];
    if (prevSlice === nextSlice || !nextSlice || typeof nextSlice !== 'object') continue;
    for (const key of Object.keys(nextSlice)) {
      if (prevSlice?.[key] === nextSlice[key]) continue;
      const id = `${slice}.${key}`;
      if (!livePathIds.has(id)) {
        livePathIds.add(id);
        livePaths.push([slice, key]);
      }
    }
  }
};

let currentActionType: string | undefined;

export const trackCurrentAction: Middleware = api => next => action => {
  const previous = currentActionType;
  currentActionType = (action as {type?: string})?.type;
  const isLive = currentActionType !== undefined && LIVE_MARKET_ACTIONS.has(currentActionType);
  const before = isLive ? api.getState() : undefined;
  try {
    const result = next(action);
    if (isLive) recordLivePaths(before, api.getState());
    return result;
  } finally {
    currentActionType = previous;
  }
};

/** Only meaningful inside a store subscriber, i.e. while the action is being dispatched. */
export const isDispatchingLiveMarketTick = () =>
  currentActionType !== undefined && LIVE_MARKET_ACTIONS.has(currentActionType);

/**
 * `next` with every live-tick field taken from `held`, so a hidden screen receives
 * account/order updates without also receiving the market ticks it skipped.
 */
export const withLiveFieldsFrom = (next: State, held: State): State => {
  let result = next;
  for (const [slice, key] of livePaths) {
    const heldValue = held[slice]?.[key];
    if (next[slice]?.[key] === heldValue) continue;
    if (result === next) result = {...next};
    if (result[slice] === next[slice]) result[slice] = {...next[slice]};
    result[slice][key] = heldValue;
  }
  return result;
};
