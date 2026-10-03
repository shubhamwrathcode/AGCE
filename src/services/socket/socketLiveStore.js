import { createContext, useCallback, useContext, useSyncExternalStore } from "react";

/**
 * High-frequency socket payloads live here instead of in React context/state.
 * A context value change re-renders every consumer of the context; these stores
 * only re-render components that call the matching hook.
 */
const createLiveStore = (initialValue = null) => {
  let value = initialValue;
  const listeners = new Set();

  return {
    get: () => value,
    set: (next) => {
      if (Object.is(next, value)) return;
      value = next;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
};

export const exchangeDataStore = createLiveStore();
export const futuresDataStore = createLiveStore();
export const futuresPriceStore = createLiveStore();

/** True while the subtree is not visible; live hooks stop pushing renders until it is shown again. */
export const LiveUpdatesPausedContext = createContext(false);

const noopUnsubscribe = () => {};

const useLiveValue = (store) => {
  const paused = useContext(LiveUpdatesPausedContext);
  const subscribe = useCallback(
    (listener) => (paused ? noopUnsubscribe : store.subscribe(listener)),
    [store, paused],
  );
  return useSyncExternalStore(subscribe, store.get, store.get);
};

export const useExchangeData = () => useLiveValue(exchangeDataStore);

export const useFuturesData = () => useLiveValue(futuresDataStore);

export const useFuturesPrice = () => useLiveValue(futuresPriceStore);
