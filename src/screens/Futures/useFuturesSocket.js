/**
 * useFuturesSocket – Isolated Futures-only socket layer
 * Now refactored to consume the global SocketContext to match web implementation.
 */

import { useContext, useState, useEffect, useMemo, useRef } from "react";
import { SocketContext } from "../../SocketProvider";
import { normalizeOrderbookOrders } from "../../helper/futuresUtils";

export function useFuturesSocket() {
  const context = useContext(SocketContext);
  const [normalizedData, setNormalizedData] = useState(null);

  const timeoutRef = useRef(null);
  const pendingDataRef = useRef(null);

  useEffect(() => {
    if (!context?.futuresData) return;

    pendingDataRef.current = context.futuresData;

    if (!timeoutRef.current) {
      timeoutRef.current = setTimeout(() => {
        const data = pendingDataRef.current;
        if (data) {
          const normalized = { ...data };

          if (data.buy_order != null) {
            normalized.buy_order = normalizeOrderbookOrders(data.buy_order || []);
          }
          if (data.sell_order != null) {
            normalized.sell_order = normalizeOrderbookOrders(data.sell_order || []);
          }

          if (data.recent_trades != null) {
            normalized.recent_trades = (data.recent_trades || []).map((t) => ({
              price: parseFloat(t.price) || 0,
              quantity: parseFloat(t.quantity) || 0,
              side: t.side || "BUY",
              time: t.time || new Date().toLocaleTimeString("en-GB", { hour12: false }),
            }));
          }

          setNormalizedData(normalized);
        }
        timeoutRef.current = null;
      }, 300); // 300ms throttle limit for smooth UI without freezing
    }

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [context?.futuresData]);

  const isConnected = context?.socket?.connected || false;

  return {
    isConnected,
    futuresData: normalizedData,
    futuresPrice: context?.futuresPrice,
    subscribeToFutures: context?.subscribeToFutures,
    unsubscribeFromFutures: context?.unsubscribeFromFutures,
    subscribeToMarket: context?.subscribeToMarket,
    unsubscribeFromMarket: context?.unsubscribeFromMarket,
    socket: context?.socket,
  };
}
