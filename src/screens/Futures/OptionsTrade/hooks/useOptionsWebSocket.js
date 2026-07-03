import { useEffect, useState, useRef } from 'react';
import { useAppSelector } from '../../../../store/hooks';
import optionsSocketService from '../../../../services/socket/OptionsSocketService';
import { underlyingsFromMarketOverview, underlyingKeyFromAsset, buildChainsFromContracts } from '../helpers/optionsDataHelpers';

export const OPTIONS_CHANNELS = {
    MARKET_OVERVIEW: "options:market_overview",
    CONTRACTS: "options:contracts",
};

export default function useOptionsWebSocket(selectedAsset = "") {
    const token = useAppSelector((state) => state.auth.token);
    const socketRef = useRef(null);

    const [isConnected, setIsConnected] = useState(false);
    const [marketOverview, setMarketOverview] = useState(null);
    const [contractsPayload, setContractsPayload] = useState(null);
    const lastContractsUpdateRef = useRef(0);

    const underlying = underlyingKeyFromAsset(selectedAsset);

    useEffect(() => {
        const socket = optionsSocketService.connect(undefined, token);
        socketRef.current = socket;

        const resubscribeAll = () => {
            optionsSocketService.emit("subscribe", { channel: OPTIONS_CHANNELS.MARKET_OVERVIEW });
            if (underlying) {
                optionsSocketService.emit("subscribe", {
                    channel: OPTIONS_CHANNELS.CONTRACTS,
                    underlying: underlying,
                    expiry: "ALL", // Always fetch ALL expiries, we filter in UI
                });
            }
        };

        const onConnect = () => {
            setIsConnected(true);
            resubscribeAll();
        };

        const onDisconnect = () => {
            setIsConnected(false);
            setContractsPayload(null);
        };

        const onMarketOverview = (data) => {
            if (data && typeof data === "object") setMarketOverview(data);
        };

        const onContractsUpdate = (data) => {
            if (data && typeof data === "object") {
                const now = Date.now();
                if (now - lastContractsUpdateRef.current > 500) {
                    setContractsPayload(data);
                    lastContractsUpdateRef.current = now;
                }
            }
        };

        optionsSocketService.on("connect", onConnect);
        optionsSocketService.on("disconnect", onDisconnect);
        optionsSocketService.on("market_overview", onMarketOverview);
        optionsSocketService.on("contracts_update", onContractsUpdate); // The event name from backend for contracts is 'contracts_update' usually? Wait, let me check the web code!

        if (socket.connected) {
            onConnect();
        }

        return () => {
            optionsSocketService.off("connect", onConnect);
            optionsSocketService.off("disconnect", onDisconnect);
            optionsSocketService.off("market_overview", onMarketOverview);
            optionsSocketService.off("contracts_update", onContractsUpdate);
            
            optionsSocketService.emit("unsubscribe", { channel: OPTIONS_CHANNELS.MARKET_OVERVIEW });
            if (underlying) {
                optionsSocketService.emit("unsubscribe", { channel: OPTIONS_CHANNELS.CONTRACTS, underlying, expiry: "ALL" });
            }
            optionsSocketService.disconnect();
        };
    }, [token, underlying]);

    const underlyings = underlyingsFromMarketOverview(marketOverview);
    const expiryDatesList = marketOverview?.expiry_dates?.[underlying] || [];
    
    // Process contracts into chains
    const spotPrice = marketOverview?.index_prices?.[underlying] || 0;
    const allChains = buildChainsFromContracts(contractsPayload?.contracts || [], spotPrice);

    return {
        isConnected,
        marketOverview,
        underlyings,
        expiries: ['ALL', ...expiryDatesList],
        chains: allChains,
        currentPrice: spotPrice,
        isMarketLoading: marketOverview === null,
        isContractsLoading: contractsPayload === null,
    };
}
