import React, {
  createContext,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useState,
} from "react";
import { AppState } from "react-native";
import { useDispatch } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  setCoinData,
  setFuturesPairs,
  setHotPairsChart,
  setRandom,
  setSocket,
  setSocketLoading,
} from "./slices/homeSlice";
import { setLoading } from "./slices/authSlice";
import { socketService } from "./services/socket/SocketService";
import { USER_TOKEN_KEY } from "./helper/Constants";

export const SocketContext = createContext(null);

// Web-style flow: market:subscribe → market:update, exchange:subscribe → exchange:update (no polling)

export const SocketProvider = ({ children }) => {
  const dispatch = useDispatch();
  const isInitializedRef = useRef(false);
  const [futuresData, setFuturesData] = useState(null);
  const pendingSubscriptions = useRef({
    market: false,
    exchange: null,
    futures: null,
  });
  const currentExchangeSubscription = useRef(null);
  const isMarketSubscribed = useRef(false);
  const currentFuturesSubscription = useRef(null);

  const subscribeToMarket = useCallback(() => {
    pendingSubscriptions.current.market = true;
    if (isMarketSubscribed.current) return;
    if (socketService.getSocket()?.connected) {
      isMarketSubscribed.current = true;
      socketService.emit("market:subscribe");
    }
  }, []);

  const unsubscribeFromMarket = useCallback(() => {
    pendingSubscriptions.current.market = false;
    if (!isMarketSubscribed.current) return;
    isMarketSubscribed.current = false;
    if (socketService.getSocket()?.connected) {
      socketService.emit("market:unsubscribe");
    }
  }, []);

  const subscribeToExchange = useCallback((baseCurrencyId, quoteCurrencyId) => {
    if (!baseCurrencyId || !quoteCurrencyId) {
      if (socketService.getSocket()?.connected) {
        socketService.emit("exchange:subscribe", {});
      }
      return;
    }
    const subKey = `${baseCurrencyId}-${quoteCurrencyId}`;
    if (currentExchangeSubscription.current === subKey) {
      return;
    }
    currentExchangeSubscription.current = subKey;
    pendingSubscriptions.current.exchange = {
      base_currency_id: baseCurrencyId,
      quote_currency_id: quoteCurrencyId,
    };
    if (socketService.getSocket()?.connected) {
      socketService.emit("exchange:subscribe", {
        base_currency_id: baseCurrencyId,
        quote_currency_id: quoteCurrencyId,
      });
    }
  }, []);

  const unsubscribeFromExchange = useCallback((baseCurrencyId, quoteCurrencyId) => {
    currentExchangeSubscription.current = null;
    pendingSubscriptions.current.exchange = null;
    if (socketService.getSocket()?.connected && baseCurrencyId != null && quoteCurrencyId != null) {
      socketService.emit("exchange:unsubscribe", {
        base_currency_id: baseCurrencyId,
        quote_currency_id: quoteCurrencyId,
      });
    }
  }, []);

  const subscribeToFutures = useCallback((baseCurrencyId, quoteCurrencyId) => {
    if (!baseCurrencyId || !quoteCurrencyId) {
      if (currentFuturesSubscription.current === "all") return;
      currentFuturesSubscription.current = "all";
      if (socketService.getSocket()?.connected) {
        socketService.emit('futures:subscribe', {});
      }
      return;
    }
    const subKey = `${baseCurrencyId}-${quoteCurrencyId}`;
    if (currentFuturesSubscription.current === subKey) return;
    currentFuturesSubscription.current = subKey;
    pendingSubscriptions.current.futures = { base_currency_id: baseCurrencyId, quote_currency_id: quoteCurrencyId };
    if (socketService.getSocket()?.connected) {
      socketService.emit('futures:subscribe', {
        base_currency_id: baseCurrencyId,
        quote_currency_id: quoteCurrencyId
      });
    }
  }, []);

  const unsubscribeFromFutures = useCallback((baseCurrencyId, quoteCurrencyId) => {
    currentFuturesSubscription.current = null;
    pendingSubscriptions.current.futures = null;
    if (socketService.getSocket()?.connected) {
      socketService.emit('futures:unsubscribe', {
        base_currency_id: baseCurrencyId,
        quote_currency_id: quoteCurrencyId
      });
    }
  }, []);

  const setFuturesHistoryTab = useCallback((tab, skip = 0, limit = 50) => {
    if (socketService.getSocket()?.connected) {
      console.log("Futures set history tab");

      socketService.emit('futures:set_history_tab', {
        tab,
        skip: Math.max(0, skip),
        limit: Math.min(100, Math.max(1, limit))
      });
    }
  }, []);

  const handlersRef = useRef(null);

  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    let cancelled = false;
    let marketThrottleTimer = null;
    let futuresThrottleTimer = null;

    const setup = async () => {
      const token = await AsyncStorage.getItem(USER_TOKEN_KEY).catch(() => null);
      if (cancelled) return;
      // Connect with auth token so backend sends open_orders & executed_order (match web)
      const socket = socketService.connect(undefined, token || undefined);

      const handleConnect = () => {
        if (cancelled) return;
        dispatch(setSocket(socketService.getSocket()));
        dispatch(setRandom(Math.random()));
        dispatch(setLoading(false));
        if (pendingSubscriptions.current.market) {
          isMarketSubscribed.current = true;
          socketService.emit("market:subscribe");
        }
        if (pendingSubscriptions.current.exchange) {
          socketService.emit("exchange:subscribe", pendingSubscriptions.current.exchange);
        }
        if (pendingSubscriptions.current.futures) {
          socketService.emit("futures:subscribe", pendingSubscriptions.current.futures);
        }
      };

      let lastMarketFlush = 0;
      let pendingMarketData = null;
      const MARKET_THROTTLE_MS = 1000;

      const flushMarketData = () => {
        if (!pendingMarketData) return;
        const data = pendingMarketData;
        pendingMarketData = null;
        lastMarketFlush = Date.now();

        const hot = data?.hot ?? (data?.hot_pairs_chart ? Object.values(data.hot_pairs_chart) : []);
        const payload = {
          pairs: data?.pairs ?? [],
          hot: Array.isArray(hot) ? hot : [],
          new_listed: data?.new_listed ?? [],
        };
        dispatch(setCoinData(payload));
        if (data?.hot_pairs_chart && typeof data.hot_pairs_chart === "object") {
          dispatch(setHotPairsChart(data.hot_pairs_chart));
        }
        const futuresList = data?.futures_pairs ?? data?.futuresPairs ?? null;
        if (futuresList != null && Array.isArray(futuresList)) {
          dispatch(setFuturesPairs(futuresList));
        }
        dispatch(setSocketLoading(false));
        dispatch(setLoading(false));
      };

      const handleMarketUpdate = (data) => {
        if (!isMarketSubscribed.current) return;
        pendingMarketData = data;
        const now = Date.now();
        const elapsed = now - lastMarketFlush;

        if (elapsed >= MARKET_THROTTLE_MS || lastMarketFlush === 0) {
          flushMarketData();
          if (marketThrottleTimer) {
            clearTimeout(marketThrottleTimer);
            marketThrottleTimer = null;
          }
        } else if (!marketThrottleTimer) {
          marketThrottleTimer = setTimeout(() => {
            marketThrottleTimer = null;
            flushMarketData();
          }, MARKET_THROTTLE_MS - elapsed);
        }
      };

      const handleExchangeUpdate = (data) => {
        if (currentExchangeSubscription.current == null) return;
        if (data) {
          dispatch(setCoinData(data));
        }
        dispatch(setSocketLoading(false));
        dispatch(setLoading(false));
      };

      let pendingFuturesData = null;
      const FUTURES_THROTTLE_MS = 300;

      const flushFuturesData = () => {
        if (!pendingFuturesData) return;
        setFuturesData(pendingFuturesData);
        pendingFuturesData = null;
      };

      const handleFuturesUpdate = (data) => {
        if (!data || currentFuturesSubscription.current == null) return;
        pendingFuturesData = data;

        if (!futuresThrottleTimer) {
          futuresThrottleTimer = setTimeout(() => {
            futuresThrottleTimer = null;
            flushFuturesData();
          }, FUTURES_THROTTLE_MS);
        }
      };

      handlersRef.current = { handleConnect, handleMarketUpdate, handleExchangeUpdate, handleFuturesUpdate };
      socketService.onConnect(handleConnect);
      socketService.on("market:update", handleMarketUpdate);
      socketService.on("exchange:update", handleExchangeUpdate);
      socketService.on("message", handleExchangeUpdate);
      socketService.on("futures:update", handleFuturesUpdate);

      // subscribeToMarket(); removed to prevent auto-subscribe, Market data should only be subscribed on Market screen
    };

    setup();

    return () => {
      cancelled = true;
      if (marketThrottleTimer) {
        clearTimeout(marketThrottleTimer);
        marketThrottleTimer = null;
      }
      if (futuresThrottleTimer) {
        clearTimeout(futuresThrottleTimer);
        futuresThrottleTimer = null;
      }
      const h = handlersRef.current;
      if (h) {
        socketService.offConnect(h.handleConnect);
        socketService.off("market:update", h.handleMarketUpdate);
        socketService.off("exchange:update", h.handleExchangeUpdate);
        socketService.off("futures:update", h.handleFuturesUpdate);
        handlersRef.current = null;
      }
    };
  }, [dispatch, subscribeToMarket]);

  // Reconnect when app returns to foreground (do not create new socket or duplicate listeners)
  const appStateRef = useRef(AppState.currentState);
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      const cameToForeground =
        nextAppState === "active" &&
        (appStateRef.current === "background" || appStateRef.current === "inactive");
      appStateRef.current = nextAppState;
      if (!cameToForeground) return;
      const socket = socketService.getSocket();
      if (socket && !socket.connected) {
        socket.connect();
      }
    });
    return () => subscription.remove();
  }, []);

  const contextValue = useMemo(
    () => ({
      socket: socketService.getSocket(),
      futuresData,
      subscribeToMarket,
      unsubscribeFromMarket,
      subscribeToExchange,
      unsubscribeFromExchange,
      subscribeToFutures,
      unsubscribeFromFutures,
      setFuturesHistoryTab,
    }),
    [futuresData, subscribeToMarket, unsubscribeFromMarket, subscribeToExchange, unsubscribeFromExchange, subscribeToFutures, unsubscribeFromFutures, setFuturesHistoryTab]
  );

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};
