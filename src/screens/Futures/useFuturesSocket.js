/**
 * useFuturesSocket – Isolated Futures-only socket layer
 * Now refactored to consume the global SocketContext to match web implementation.
 */

import { useContext } from "react";
import { SocketContext } from "../../SocketProvider";
import { useSelector } from "react-redux";
import { useFuturesPrice } from "../../services/socket/socketLiveStore";

export function useFuturesSocket() {
  const context = useContext(SocketContext);
  
  // We use Redux to get futuresData so components only re-render if they select specific parts.
  // Wait, if this hook returns the full object, the caller might still re-render if they select the full object.
  const futuresData = useSelector(state => state.home.futuresData);
  const futuresPrice = useFuturesPrice();

  const isConnected = context?.socket?.connected || false;

  return {
    isConnected,
    futuresData: futuresData,
    futuresPrice,
    subscribeToFutures: context?.subscribeToFutures,
    unsubscribeFromFutures: context?.unsubscribeFromFutures,
    subscribeToMarket: context?.subscribeToMarket,
    unsubscribeFromMarket: context?.unsubscribeFromMarket,
    socket: context?.socket,
  };
}
