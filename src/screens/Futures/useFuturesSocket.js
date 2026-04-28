/**
 * useFuturesSocket – Isolated Futures-only socket layer
 * Now refactored to consume the global SocketContext to match web implementation.
 */

import { useContext, useState, useEffect, useMemo } from "react";
import { SocketContext } from "../../SocketProvider";
import { normalizeOrderbookOrders } from "../../helper/futuresUtils";

export function useFuturesSocket() {
  const context = useContext(SocketContext);
  const [normalizedData, setNormalizedData] = useState(null);

  useEffect(() => {
    if (!context?.futuresData) return;

    const data = context.futuresData;
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
  }, [context?.futuresData]);

  const isConnected = context?.socket?.connected || false;

  return {
    isConnected,
    futuresData: normalizedData,
    subscribeToFutures: context?.subscribeToFutures,
    unsubscribeFromFutures: context?.unsubscribeFromFutures,
    setFuturesHistoryTab: context?.setFuturesHistoryTab,
    socket: context?.socket,
  };
}
