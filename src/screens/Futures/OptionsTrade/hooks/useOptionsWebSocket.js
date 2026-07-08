import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppSelector } from '../../../../store/hooks';
import { appOperation } from '../../../../appOperation';
import optionsSocketService from '../../../../services/socket/OptionsSocketService';
import { underlyingsFromMarketOverview, underlyingKeyFromAsset, buildChainsFromContracts } from '../helpers/optionsDataHelpers';
import { bumpOptionsWsEvent, bumpOptionsWsStat, logOptionsWs } from '../helpers/optionsWsDebug';

export const OPTIONS_CHANNELS = {
    MARKET_OVERVIEW: "options:market_overview",
    CONTRACTS: "options:contracts",
    ACCOUNT: "options:account",
    CONTRACT_DETAIL: "options:contract_detail",
    USER_ORDERS: "options:user_orders",
    USER_POSITIONS: "options:user_positions",
};

function normalizeUserOrdersPayload(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.orders)) return data.orders;
    return [];
}

function normalizeUserPositionsPayload(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.positions)) return data.positions;
    return [];
}

function normalizeAccountPayload(data) {
    if (!data || typeof data !== "object") return null;
    return data;
}

function matchesContractDetailSymbol(updateSymbol, activeSymbol) {
    if (!activeSymbol) return false;
    if (!updateSymbol) return true;
    return String(updateSymbol).toUpperCase() === String(activeSymbol).toUpperCase();
}

export default function useOptionsWebSocket(selectedAsset = "", selectedSymbol = null, enabled = true) {
    const userData = useAppSelector((state) => state.auth.userData);
    const isAuthenticated = Boolean(userData);
    const authToken = isAuthenticated ? (appOperation.customerToken || undefined) : undefined;
    const enabledRef = useRef(enabled);
    enabledRef.current = enabled;
    const socketRef = useRef(null);
    const subscribedRef = useRef({
        account: false,
        userOrders: false,
        userPositions: false,
        contractDetail: null,
    });
    const contractDetailSymbolRef = useRef(null);

    const [isConnected, setIsConnected] = useState(false);
    const [marketOverview, setMarketOverview] = useState(null);
    const [contractsPayload, setContractsPayload] = useState(null);
    const [accountUpdate, setAccountUpdate] = useState(null);
    const [userOrders, setUserOrders] = useState([]);
    const [userPositions, setUserPositions] = useState([]);
    const [userOrdersReady, setUserOrdersReady] = useState(false);
    const [userPositionsReady, setUserPositionsReady] = useState(false);
    const [orderbookUpdate, setOrderbookUpdate] = useState(null);
    const [recentTrades, setRecentTrades] = useState([]);
    const [contractDetailReady, setContractDetailReady] = useState(false);

    const underlying = underlyingKeyFromAsset(selectedAsset);

    useEffect(() => {
        bumpOptionsWsStat("hookMount");
        logOptionsWs("hook mount", { underlying, isAuthenticated, hasToken: Boolean(authToken) });

        const socket = optionsSocketService.acquire(undefined, authToken);
        socketRef.current = socket;

        const resubscribeAll = () => {
            if (!enabledRef.current) return;
            bumpOptionsWsStat("resubscribeAll");
            logOptionsWs("resubscribeAll", { underlying, isAuthenticated });
            optionsSocketService.emit("subscribe", { channel: OPTIONS_CHANNELS.MARKET_OVERVIEW });
            if (underlying) {
                optionsSocketService.emit("subscribe", {
                    channel: OPTIONS_CHANNELS.CONTRACTS,
                    underlying: underlying,
                    expiry: "ALL",
                });
            }
            if (isAuthenticated) {
                subscribedRef.current.account = true;
                optionsSocketService.emit("subscribe", { channel: OPTIONS_CHANNELS.ACCOUNT });
                subscribedRef.current.userOrders = true;
                setUserOrdersReady(false);
                optionsSocketService.emit("subscribe", { channel: OPTIONS_CHANNELS.USER_ORDERS });
                subscribedRef.current.userPositions = true;
                setUserPositionsReady(false);
                optionsSocketService.emit("subscribe", { channel: OPTIONS_CHANNELS.USER_POSITIONS });
            }
        };

        const onConnect = () => {
            bumpOptionsWsStat("socketConnect");
            logOptionsWs("socket connect (hook listener)");
            setIsConnected(true);
            resubscribeAll();
        };

        const onDisconnect = () => {
            bumpOptionsWsStat("socketDisconnect");
            logOptionsWs("socket disconnect (hook listener)");
            setIsConnected(false);
            if (!enabledRef.current) return;
            setContractsPayload(null);
            setUserOrdersReady(false);
            setUserPositionsReady(false);
        };

        const onMarketOverview = (data) => {
            if (!enabledRef.current) return;
            if (data && typeof data === "object") {
                bumpOptionsWsEvent("market_overview");
                setMarketOverview(data);
            }
        };

        const onContractsUpdate = (data) => {
            if (!enabledRef.current) return;
            if (data && typeof data === "object") {
                bumpOptionsWsEvent("contracts_update");
                setContractsPayload(data);
            }
        };

        const onAccountUpdate = (data) => {
            if (!enabledRef.current) return;
            const normalized = normalizeAccountPayload(data);
            if (normalized) {
                bumpOptionsWsEvent("account_update");
                setAccountUpdate(normalized);
            }
        };

        const onUserOrdersUpdate = (orders) => {
            if (!enabledRef.current) return;
            bumpOptionsWsEvent("user_orders_update");
            setUserOrders(normalizeUserOrdersPayload(orders));
            setUserOrdersReady(true);
        };

        const onUserPositionsUpdate = (positions) => {
            if (!enabledRef.current) return;
            bumpOptionsWsEvent("user_positions_update");
            setUserPositions(normalizeUserPositionsPayload(positions));
            setUserPositionsReady(true);
        };

        const onOrderbookUpdate = (data) => {
            if (!enabledRef.current) return;
            if (!data || typeof data !== "object") return;
            const active = contractDetailSymbolRef.current;
            if (!matchesContractDetailSymbol(data.symbol, active)) return;
            bumpOptionsWsEvent("orderbook_update");
            setOrderbookUpdate(data);
            setContractDetailReady(true);
        };

        const onRecentTradesUpdate = (data) => {
            if (!enabledRef.current) return;
            if (!contractDetailSymbolRef.current) return;
            bumpOptionsWsEvent("recent_trades_update");
            setRecentTrades(Array.isArray(data) ? data : []);
            if (Array.isArray(data) && data.length > 0) {
                setContractDetailReady(true);
            }
        };

        optionsSocketService.on("connect", onConnect);
        optionsSocketService.on("disconnect", onDisconnect);
        optionsSocketService.on("market_overview", onMarketOverview);
        optionsSocketService.on("contracts_update", onContractsUpdate);
        optionsSocketService.on("account_update", onAccountUpdate);
        optionsSocketService.on("user_orders_update", onUserOrdersUpdate);
        optionsSocketService.on("user_positions_update", onUserPositionsUpdate);
        optionsSocketService.on("orderbook_update", onOrderbookUpdate);
        optionsSocketService.on("recent_trades_update", onRecentTradesUpdate);

        if (socket.connected) {
            onConnect();
        }

        return () => {
            bumpOptionsWsStat("hookUnmount");
            logOptionsWs("hook unmount", { underlying, consumerCount: optionsSocketService.getConsumerCount?.() });

            optionsSocketService.off("connect", onConnect);
            optionsSocketService.off("disconnect", onDisconnect);
            optionsSocketService.off("market_overview", onMarketOverview);
            optionsSocketService.off("contracts_update", onContractsUpdate);
            optionsSocketService.off("account_update", onAccountUpdate);
            optionsSocketService.off("user_orders_update", onUserOrdersUpdate);
            optionsSocketService.off("user_positions_update", onUserPositionsUpdate);
            optionsSocketService.off("orderbook_update", onOrderbookUpdate);
            optionsSocketService.off("recent_trades_update", onRecentTradesUpdate);

            const tornDown = optionsSocketService.release();
            if (!tornDown) {
                subscribedRef.current = {
                    account: false,
                    userOrders: false,
                    userPositions: false,
                    contractDetail: subscribedRef.current.contractDetail,
                };
                return;
            }

            optionsSocketService.emit("unsubscribe", { channel: OPTIONS_CHANNELS.MARKET_OVERVIEW });
            if (underlying) {
                optionsSocketService.emit("unsubscribe", { channel: OPTIONS_CHANNELS.CONTRACTS, underlying, expiry: "ALL" });
            }
            if (subscribedRef.current.account) {
                optionsSocketService.emit("unsubscribe", { channel: OPTIONS_CHANNELS.ACCOUNT });
            }
            if (subscribedRef.current.userOrders) {
                optionsSocketService.emit("unsubscribe", { channel: OPTIONS_CHANNELS.USER_ORDERS });
            }
            if (subscribedRef.current.userPositions) {
                optionsSocketService.emit("unsubscribe", { channel: OPTIONS_CHANNELS.USER_POSITIONS });
            }
            if (subscribedRef.current.contractDetail) {
                optionsSocketService.emit("unsubscribe", {
                    channel: OPTIONS_CHANNELS.CONTRACT_DETAIL,
                    symbol: subscribedRef.current.contractDetail,
                });
            }
            subscribedRef.current = {
                account: false,
                userOrders: false,
                userPositions: false,
                contractDetail: null,
            };
        };
    }, [authToken, underlying, isAuthenticated]);

    useEffect(() => {
        const socket = socketRef.current;
        if (!socket?.connected) return undefined;

        if (!enabled) {
            optionsSocketService.emit("unsubscribe", { channel: OPTIONS_CHANNELS.MARKET_OVERVIEW });
            if (underlying) {
                optionsSocketService.emit("unsubscribe", {
                    channel: OPTIONS_CHANNELS.CONTRACTS,
                    underlying,
                    expiry: "ALL",
                });
            }
            if (subscribedRef.current.account) {
                optionsSocketService.emit("unsubscribe", { channel: OPTIONS_CHANNELS.ACCOUNT });
            }
            if (subscribedRef.current.userOrders) {
                optionsSocketService.emit("unsubscribe", { channel: OPTIONS_CHANNELS.USER_ORDERS });
            }
            if (subscribedRef.current.userPositions) {
                optionsSocketService.emit("unsubscribe", { channel: OPTIONS_CHANNELS.USER_POSITIONS });
            }
            if (subscribedRef.current.contractDetail) {
                optionsSocketService.emit("unsubscribe", {
                    channel: OPTIONS_CHANNELS.CONTRACT_DETAIL,
                    symbol: subscribedRef.current.contractDetail,
                });
            }
            return undefined;
        }

        optionsSocketService.emit("subscribe", { channel: OPTIONS_CHANNELS.MARKET_OVERVIEW });
        if (underlying) {
            optionsSocketService.emit("subscribe", {
                channel: OPTIONS_CHANNELS.CONTRACTS,
                underlying,
                expiry: "ALL",
            });
        }
        if (isAuthenticated) {
            optionsSocketService.emit("subscribe", { channel: OPTIONS_CHANNELS.ACCOUNT });
            optionsSocketService.emit("subscribe", { channel: OPTIONS_CHANNELS.USER_ORDERS });
            optionsSocketService.emit("subscribe", { channel: OPTIONS_CHANNELS.USER_POSITIONS });
        }
        if (subscribedRef.current.contractDetail) {
            optionsSocketService.emit("subscribe", {
                channel: OPTIONS_CHANNELS.CONTRACT_DETAIL,
                symbol: subscribedRef.current.contractDetail,
            });
        }

        return undefined;
    }, [enabled, underlying, isConnected, isAuthenticated]);

    useEffect(() => {
        if (!enabled || !isConnected || !selectedSymbol) {
            return undefined;
        }

        bumpOptionsWsStat("contractEffectMount");
        logOptionsWs("contract_detail effect mount", { selectedSymbol, isConnected });

        const socket = socketRef.current;
        if (!socket) return;

        const prevSymbol = subscribedRef.current.contractDetail;
        if (prevSymbol && prevSymbol !== selectedSymbol) {
            optionsSocketService.emit("unsubscribe", {
                channel: OPTIONS_CHANNELS.CONTRACT_DETAIL,
                symbol: prevSymbol,
            });
            setOrderbookUpdate(null);
            setRecentTrades([]);
            setContractDetailReady(false);
        }

        subscribedRef.current.contractDetail = selectedSymbol;
        contractDetailSymbolRef.current = selectedSymbol;
        setContractDetailReady(false);
        bumpOptionsWsStat("subscribeEmit");
        logOptionsWs("subscribe contract_detail", { symbol: selectedSymbol });
        optionsSocketService.emit("subscribe", {
            channel: OPTIONS_CHANNELS.CONTRACT_DETAIL,
            symbol: selectedSymbol,
        });

        return () => {
            bumpOptionsWsStat("contractEffectUnmount");
            logOptionsWs("contract_detail effect unmount", { selectedSymbol });
            if (subscribedRef.current.contractDetail === selectedSymbol) {
                bumpOptionsWsStat("unsubscribeEmit");
                optionsSocketService.emit("unsubscribe", {
                    channel: OPTIONS_CHANNELS.CONTRACT_DETAIL,
                    symbol: selectedSymbol,
                });
                subscribedRef.current.contractDetail = null;
                contractDetailSymbolRef.current = null;
            }
        };
    }, [enabled, isConnected, selectedSymbol]);

    const refreshLiveTradeChannels = useCallback(() => {
        const socket = socketRef.current;
        if (!socket?.connected) return;

        const symbol = subscribedRef.current.contractDetail;
        if (symbol) {
            socket.emit("subscribe", {
                channel: OPTIONS_CHANNELS.CONTRACT_DETAIL,
                symbol,
            });
        }

        if (isAuthenticated && subscribedRef.current.userOrders) {
            socket.emit("subscribe", { channel: OPTIONS_CHANNELS.USER_ORDERS });
        }
        if (isAuthenticated && subscribedRef.current.userPositions) {
            socket.emit("subscribe", { channel: OPTIONS_CHANNELS.USER_POSITIONS });
        }
        if (isAuthenticated && subscribedRef.current.account) {
            socket.emit("subscribe", { channel: OPTIONS_CHANNELS.ACCOUNT });
        }
    }, [isAuthenticated]);

    const underlyings = underlyingsFromMarketOverview(marketOverview);
    const expiryDatesList = marketOverview?.expiry_dates?.[underlying] || [];

    const spotPrice = marketOverview?.index_prices?.[underlying] || 0;
    const allChains = buildChainsFromContracts(contractsPayload?.contracts || [], spotPrice);

    const normalizeOrderbookLevels = (levels) => {
        if (!Array.isArray(levels)) return [];
        return levels.map((row) => {
            if (Array.isArray(row)) {
                return { price: Number(row[0]) || 0, qty: Number(row[1]) || 0 };
            }
            return {
                price: Number(row.price ?? row[0]) || 0,
                qty: Number(row.quantity ?? row.qty ?? row[1]) || 0,
            };
        });
    };

    const orderbook = orderbookUpdate && matchesContractDetailSymbol(orderbookUpdate.symbol, selectedSymbol)
        ? {
            symbol: orderbookUpdate.symbol,
            bids: normalizeOrderbookLevels(orderbookUpdate.bids),
            asks: normalizeOrderbookLevels(orderbookUpdate.asks),
            timestamp: orderbookUpdate.timestamp,
        }
        : null;

    return {
        isConnected,
        marketOverview,
        underlyings,
        expiries: ['ALL', ...expiryDatesList],
        chains: allChains,
        currentPrice: spotPrice,
        accountUpdate,
        userOrders,
        userPositions,
        orderbook,
        recentTrades: selectedSymbol ? recentTrades : [],
        isMarketLoading: marketOverview === null,
        isContractsLoading: contractsPayload === null,
        isOrderbookLoading: selectedSymbol ? !contractDetailReady : false,
        isAccountLoading: isAuthenticated && accountUpdate === null,
        isUserOrdersLoading: isAuthenticated && isConnected && !userOrdersReady,
        isUserPositionsLoading: isAuthenticated && isConnected && !userPositionsReady,
        refreshLiveTradeChannels,
    };
}
