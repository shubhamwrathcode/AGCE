import { useEffect, useState, useRef } from 'react';
import { useAppSelector } from '../../../../store/hooks';
import optionsSocketService from '../../../../services/socket/OptionsSocketService';
import { underlyingsFromMarketOverview, underlyingKeyFromAsset } from '../helpers/optionsDataHelpers';

export const OPTIONS_CHANNELS = {
    MARKET_OVERVIEW: "options:market_overview",
    CONTRACTS: "options:contracts",
};

export default function useOptionsWebSocket(selectedAsset = "") {
    const token = useAppSelector((state) => state.auth.token);
    const socketRef = useRef(null);

    const [isConnected, setIsConnected] = useState(false);
    const [marketOverview, setMarketOverview] = useState(null);

    useEffect(() => {
        const socket = optionsSocketService.connect(undefined, token);
        socketRef.current = socket;

        const onConnect = () => {
            setIsConnected(true);
            optionsSocketService.emit("subscribe", { channel: OPTIONS_CHANNELS.MARKET_OVERVIEW });
        };

        const onDisconnect = () => {
            setIsConnected(false);
        };

        const onMarketOverview = (data) => {
            if (data && typeof data === "object") setMarketOverview(data);
        };

        optionsSocketService.on("connect", onConnect);
        optionsSocketService.on("disconnect", onDisconnect);
        optionsSocketService.on("market_overview", onMarketOverview);

        if (socket.connected) {
            onConnect();
        }

        return () => {
            optionsSocketService.off("connect", onConnect);
            optionsSocketService.off("disconnect", onDisconnect);
            optionsSocketService.off("market_overview", onMarketOverview);
            optionsSocketService.emit("unsubscribe", { channel: OPTIONS_CHANNELS.MARKET_OVERVIEW });
            optionsSocketService.disconnect();
        };
    }, [token]);

    const underlyings = underlyingsFromMarketOverview(marketOverview);
    const underlying = underlyingKeyFromAsset(selectedAsset);
    const expiryDatesList = marketOverview?.expiry_dates?.[underlying] || [];

    return {
        isConnected,
        marketOverview,
        underlyings,
        expiries: ['ALL', ...expiryDatesList],
        isMarketLoading: marketOverview === null,
    };
}
