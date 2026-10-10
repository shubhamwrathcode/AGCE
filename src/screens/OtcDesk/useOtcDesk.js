import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import Toast from "react-native-simple-toast";
import { appOperation } from "../../appOperation";
import { CUSTOMER_TYPE, GUEST_TYPE } from "../../appOperation/types";
import NavigationService from "../../navigation/NavigationService";
import { KYC_VERIFICATION_SCREEN, LOGIN_SCREEN, NAVIGATION_AUTH_STACK } from "../../navigation/routes";
import { SocketContext } from "../../SocketProvider";
import { socketService } from "../../services/socket/SocketService";
import { useAppSelector } from "../../store/hooks";
import {
  BACKUP_POLL_MS,
  amountErrorFor,
  amountUnitLimit,
  apiMessage,
  coinCode,
  deskView,
  findListedPair,
  formatApprox,
  formatMoney,
  mapActivePairs,
  mapOtcPairs,
  matchSpotPair,
  newIdempotencyKey,
  overlayOtcPairs,
  pairKeyOf,
  pickDefaultPair,
  positiveLast,
  remainingMs,
  sizeRfq,
  tickerFromConvert,
  tickerFromSpotPair,
  trimDecimal,
} from "./otcDeskLogic";

const toast = (message) => {
  if (!message) return;
  Toast.showWithGravity(String(message), Toast.SHORT, Toast.BOTTOM);
};

async function apiCall(run) {
  try {
    return await run();
  } catch (err) {
    if (err && typeof err === "object") return err;
    return { success: false, message: String(err || "Something went wrong") };
  }
}

function spotRow(rows, code) {
  const want = coinCode(code);
  const list = Array.isArray(rows) ? rows : [];
  return (
    list.find((r) => coinCode(r?.short_name) === want) ||
    list.find((r) => coinCode(r?.currency) === want) ||
    null
  );
}

export default function useOtcDesk() {
  const userData = useAppSelector((state) => state.auth.userData);
  const marketPairs = useAppSelector((state) => state.home.coinPairs);
  const { socketHandlersReady, subscribeToMarket, unsubscribeFromMarket } = useContext(SocketContext) || {};
  const isLoggedIn = Boolean(userData) || Boolean(appOperation.customerToken);
  const kycVerified = Number(userData?.kycVerified ?? userData?.kyc_verified) === 2;

  const [assets, setAssets] = useState([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [quoteType, setQuoteType] = useState("buy");
  const [pairKey, setPairKey] = useState("");
  const [amountCoin, setAmountCoinState] = useState("");
  const [amount, setAmount] = useState("");
  const [minNotional, setMinNotional] = useState("");
  const [maxNotional, setMaxNotional] = useState("");
  const [minBaseByAsset, setMinBaseByAsset] = useState({});
  const [spendBalance, setSpendBalance] = useState("");
  const [lockedBalance, setLockedBalance] = useState("");
  const [activePairs, setActivePairs] = useState([]);
  const [otcPairs, setOtcPairs] = useState([]);
  const [deskOpen, setDeskOpen] = useState(true);
  const [rfq, setRfq] = useState(null);
  const [quote, setQuote] = useState(null);
  const rfqRef = useRef(rfq);
  const quoteRef = useRef(quote);
  const notifiedQuoteId = useRef("");
  const dismissedRfqId = useRef("");
  const acceptKeyRef = useRef({ quoteId: "", key: "" });
  rfqRef.current = rfq;
  quoteRef.current = quote;
  const [trade, setTrade] = useState(null);
  const [trades, setTrades] = useState([]);
  const [tradesLoading, setTradesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [ticker, setTicker] = useState(null);
  const [isConnected, setIsConnected] = useState(() => socketService.getIsConnected());
  const [convertRates, setConvertRates] = useState(null);

  useEffect(() => {
    const on = () => setIsConnected(true);
    const off = () => setIsConnected(false);
    socketService.onConnect(on);
    const socket = socketService.getSocket();
    socket?.on("disconnect", off);
    return () => {
      socketService.offConnect(on);
      socket?.off("disconnect", off);
    };
  }, [socketHandlersReady]);

  useEffect(() => {
    let cancelled = false;
    async function loadActivePairs() {
      setAssetsLoading(true);
      const res = await apiCall(() =>
        appOperation.get("user/get-pairs", undefined, undefined, isLoggedIn ? CUSTOMER_TYPE : GUEST_TYPE)
      );
      if (cancelled) return;
      setAssetsLoading(false);
      if (!res?.success) return;
      const rows = Array.isArray(res.data) ? res.data : res.data?.pairs;
      setActivePairs(mapActivePairs(rows));
    }
    loadActivePairs();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  useEffect(() => {
    if (activePairs.length || !Array.isArray(marketPairs) || !marketPairs.length) return;
    setActivePairs(mapActivePairs(marketPairs));
  }, [activePairs.length, marketPairs]);

  const pairs = useMemo(() => overlayOtcPairs(activePairs, otcPairs), [activePairs, otcPairs]);

  useEffect(() => {
    setPairKey((prev) => (findListedPair(pairs, prev) ? prev : pickDefaultPair(pairs)));
  }, [pairs]);

  const refreshTradeList = useCallback(async () => {
    if (!isLoggedIn) return;
    const tradesRes = await apiCall(() =>
      appOperation.get("otc/trades", { page: 1, limit: 20 }, undefined, CUSTOMER_TYPE)
    );
    const items = tradesRes?.success ? tradesRes.data?.items : null;
    if (Array.isArray(items)) setTrades(items);
  }, [isLoggedIn]);

  useEffect(() => {
    let cancelled = false;
    if (!isLoggedIn) {
      setAssets([]);
      setOtcPairs([]);
      setTrades([]);
      setRfq(null);
      setQuote(null);
      return undefined;
    }

    async function loadAssets() {
      setAssetsLoading(true);
      const res = await apiCall(() => appOperation.get("otc/assets", undefined, undefined, CUSTOMER_TYPE));
      if (cancelled) return;
      setAssetsLoading(false);
      if (!res?.success) {
        setAssets([]);
        setOtcPairs([]);
        return;
      }
      const items = Array.isArray(res.data?.items) ? res.data.items : [];
      setAssets(items);
      setOtcPairs(mapOtcPairs(res.data?.pairs));
      setDeskOpen(res.data?.desk_open !== false);
      setMinNotional(res.data?.min_notional != null ? String(res.data.min_notional) : "");
      setMaxNotional(res.data?.max_notional != null ? String(res.data.max_notional) : "");
      setMinBaseByAsset(res.data?.min_base && typeof res.data.min_base === "object" ? res.data.min_base : {});
    }

    async function loadTrades() {
      setTradesLoading(true);
      const res = await apiCall(() =>
        appOperation.get("otc/trades", { page: 1, limit: 20 }, undefined, CUSTOMER_TYPE)
      );
      if (cancelled) return;
      setTradesLoading(false);
      const items = res?.success ? res.data?.items : null;
      if (!Array.isArray(items)) return;
      setTrades(items);
    }

    async function loadCurrent() {
      const res = await apiCall(() => appOperation.get("otc/rfq/current", undefined, undefined, CUSTOMER_TYPE));
      if (cancelled || !res?.success || !res.data?.rfq?.id) return;
      setRfq((prev) => (prev?.id ? prev : res.data.rfq));
      if (res.data.quote?.id) {
        setQuote((prev) => (prev?.id ? prev : res.data.quote));
      }
    }

    loadAssets();
    loadTrades();
    loadCurrent();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  const applyIncomingQuote = useCallback((nextRfq, nextQuote) => {
    if (!nextRfq?.id || nextRfq.id === dismissedRfqId.current) return;
    const current = rfqRef.current;
    if (current?.id && current.id !== nextRfq.id) return;
    const wasWaiting = String(current?.status || "").toUpperCase() === "OPEN" && current.id === nextRfq.id;
    setRfq(nextRfq);
    if (!nextQuote?.id) return;
    setQuote(nextQuote);
    if (wasWaiting && nextQuote.status === "ISSUED" && notifiedQuoteId.current !== nextQuote.id) {
      notifiedQuoteId.current = nextQuote.id;
      toast("Quote is ready. You can accept it.");
    }
  }, []);

  useEffect(() => {
    if (!socketHandlersReady) return undefined;
    const onQuote = (payload) => {
      applyIncomingQuote(payload && payload.rfq, payload && payload.quote);
    };
    socketService.on("otc:quote", onQuote);
    return () => {
      socketService.off("otc:quote", onQuote);
    };
  }, [socketHandlersReady, applyIncomingQuote]);

  useEffect(() => {
    if (!isLoggedIn || !isConnected) return undefined;
    if (String(rfqRef.current?.status || "").toUpperCase() !== "OPEN") return undefined;
    let stopped = false;
    apiCall(() => appOperation.get("otc/rfq/current", undefined, undefined, CUSTOMER_TYPE)).then((res) => {
      if (stopped || !res?.success || !res.data?.rfq?.id) return;
      applyIncomingQuote(res.data.rfq, res.data.quote);
    });
    return () => {
      stopped = true;
    };
  }, [isLoggedIn, isConnected, applyIncomingQuote]);

  useEffect(() => {
    if (!isLoggedIn || isConnected) return undefined;
    let stopped = false;
    async function tick() {
      const status = String(rfqRef.current?.status || "").toUpperCase();
      const quoteStatus = String(quoteRef.current?.status || "").toUpperCase();
      const waiting =
        !rfqRef.current?.id || status === "OPEN" || (status === "QUOTED" && quoteStatus !== "ISSUED");
      if (!waiting) return;
      const res = await apiCall(() => appOperation.get("otc/rfq/current", undefined, undefined, CUSTOMER_TYPE));
      if (stopped || !res?.success || !res.data?.rfq?.id) return;
      applyIncomingQuote(res.data.rfq, res.data.quote);
    }
    const interval = setInterval(tick, BACKUP_POLL_MS);
    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, [isLoggedIn, isConnected, applyIncomingQuote]);

  const expiredSyncRef = useRef("");

  const applyExpiredRfq = useCallback(async (id) => {
    const res = await apiCall(() =>
      appOperation.get(`otc/rfq/${encodeURIComponent(id)}`, undefined, undefined, CUSTOMER_TYPE)
    );
    if (res?.success && res.data?.id) setRfq(res.data);
    else setRfq((prev) => (prev && String(prev.id) === String(id) ? { ...prev, status: "EXPIRED" } : prev));
    await refreshTradeList();
  }, [refreshTradeList]);

  const applyExpiredQuote = useCallback(async () => {
    const res = await apiCall(() => appOperation.get("otc/rfq/current", undefined, undefined, CUSTOMER_TYPE));
    const next = res?.success ? res.data?.rfq : null;
    const nextStatus = String(next?.status || "").toUpperCase();
    if (next?.id && (nextStatus === "OPEN" || nextStatus === "QUOTED")) {
      setRfq(next);
      if (res.data?.quote?.id) setQuote(res.data.quote);
      else setQuote((prev) => (prev ? { ...prev, status: "EXPIRED" } : prev));
    } else {
      setRfq((prev) => (prev ? { ...prev, status: "REJECTED_TIMEOUT" } : prev));
      setQuote((prev) => (prev ? { ...prev, status: "EXPIRED" } : prev));
    }
    await refreshTradeList();
  }, [refreshTradeList]);

  useEffect(() => {
    const requestOpen = String(rfq?.status || "").toUpperCase() === "OPEN" && rfq?.expiresAt;
    const quoteLive = quote?.status === "ISSUED" && quote?.expiresAt;
    if (!requestOpen && !quoteLive) return undefined;
    const tick = () => {
      const now = Date.now();
      setNowMs(now);
      if (!isLoggedIn) return;
      if (requestOpen && rfq?.id && remainingMs(rfq.expiresAt, now) <= 0) {
        if (expiredSyncRef.current !== String(rfq.id)) {
          expiredSyncRef.current = String(rfq.id);
          applyExpiredRfq(rfq.id);
        }
        return;
      }
      if (quoteLive && quote?.id && remainingMs(quote.expiresAt, now) <= 0) {
        const key = `quote:${quote.id}`;
        if (expiredSyncRef.current === key) return;
        expiredSyncRef.current = key;
        applyExpiredQuote();
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [quote?.id, quote?.status, quote?.expiresAt, rfq?.id, rfq?.status, rfq?.expiresAt, isLoggedIn, applyExpiredRfq, applyExpiredQuote]);

  const view = deskView(rfq, quote, nowMs);
  const countdownMs = quote ? remainingMs(quote.expiresAt, nowMs) : 0;
  const selectedPair = useMemo(() => findListedPair(pairs, pairKey), [pairs, pairKey]);
  const payCoin = quoteType === "sell" ? coinCode(selectedPair?.base) : coinCode(selectedPair?.quote);
  const getCoin = quoteType === "sell" ? coinCode(selectedPair?.quote) : coinCode(selectedPair?.base);
  const pairBase = coinCode(selectedPair?.base);
  const pairQuote = coinCode(selectedPair?.quote);
  const amountAsset = amountCoin === pairBase || amountCoin === pairQuote ? amountCoin : pairBase || pairQuote;
  const spendAsset = quoteType === "sell" ? pairBase : pairQuote;

  useEffect(() => {
    if (!pairBase && !pairQuote) return;
    setAmountCoinState((prev) => (prev === pairBase || prev === pairQuote ? prev : pairBase || pairQuote));
  }, [pairBase, pairQuote]);

  const setAmountCoin = useCallback((code) => {
    const next = coinCode(code);
    if ((next !== pairBase && next !== pairQuote) || next === amountCoin) return;
    setAmountCoinState(next);
    setAmount("");
  }, [pairBase, pairQuote, amountCoin]);

  const balanceGen = useRef(0);
  const refreshSpotBalances = useCallback(async () => {
    const gen = balanceGen.current + 1;
    balanceGen.current = gen;
    if (!isLoggedIn) {
      setSpendBalance("");
      setLockedBalance("");
      return;
    }
    const payCode = spendAsset;
    if (!payCode) return;
    const res = await apiCall(() => appOperation.customer.user_wallet("spot"));
    if (balanceGen.current !== gen) return;
    const row = res?.success ? spotRow(res.data, payCode) : null;
    setSpendBalance(row ? String(row.balance ?? "0") : "0");
    setLockedBalance(row ? String(row.locked_balance ?? "0") : "0");
  }, [isLoggedIn, spendAsset]);

  useEffect(() => {
    refreshSpotBalances();
  }, [refreshSpotBalances]);

  const matchedSpotPair = useMemo(
    () => matchSpotPair(marketPairs, payCoin, getCoin),
    [marketPairs, payCoin, getCoin]
  );

  useEffect(() => {
    if (!payCoin || !getCoin) return undefined;
    if (typeof subscribeToMarket === "function") subscribeToMarket("otc");
    return () => {
      if (typeof unsubscribeFromMarket === "function") unsubscribeFromMarket("otc");
    };
  }, [payCoin, getCoin, isConnected, subscribeToMarket, unsubscribeFromMarket]);

  useEffect(() => {
    if (!isLoggedIn) {
      setConvertRates(null);
      return undefined;
    }
    let stopped = false;
    apiCall(() => appOperation.get("fiat/convert/rates", undefined, undefined, CUSTOMER_TYPE)).then((res) => {
      if (stopped || !res?.success) return;
      setConvertRates(res.data || null);
    });
    return () => {
      stopped = true;
    };
  }, [isLoggedIn]);

  useEffect(() => {
    if (!payCoin || !getCoin) {
      setTicker(null);
      return undefined;
    }
    const live = tickerFromSpotPair(matchedSpotPair) || tickerFromConvert(convertRates, payCoin, getCoin);
    if (live) {
      setTicker(live);
      return undefined;
    }
    if (isConnected) return undefined;

    let stopped = false;
    let timer;
    async function loadBackup() {
      const res = await apiCall(() =>
        appOperation.get(
          "otc/ticker",
          { pay_asset: String(payCoin).toUpperCase(), get_asset: String(getCoin).toUpperCase() },
          undefined,
          isLoggedIn ? CUSTOMER_TYPE : GUEST_TYPE
        )
      );
      if (stopped) return;
      const last = res?.success ? positiveLast(res.data?.last) : null;
      if (last) setTicker({ ...res.data, last });
      timer = setTimeout(loadBackup, BACKUP_POLL_MS);
    }
    loadBackup();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [payCoin, getCoin, matchedSpotPair, convertRates, isConnected, isLoggedIn]);

  const limitsForPair = useCallback(() => {
    const userLimit = selectedPair && selectedPair.limit_source === "user";
    const pairMinCoin = String((selectedPair && selectedPair.min_base) || "").trim();
    return {
      minQtyRaw: pairMinCoin || (userLimit ? "" : minBaseByAsset[pairBase]),
      pairMin: String((selectedPair && selectedPair.min_notional) || (userLimit ? "" : minNotional) || "").trim(),
      pairMax: String((selectedPair && selectedPair.max_notional) || (userLimit ? "" : maxNotional) || "").trim(),
      pairMaxCoin: String((selectedPair && selectedPair.max_base) || "").trim(),
    };
  }, [selectedPair, minBaseByAsset, pairBase, minNotional, maxNotional]);

  const submitRfq = useCallback(async () => {
    if (!isLoggedIn) {
      NavigationService.navigate(NAVIGATION_AUTH_STACK, { screen: LOGIN_SCREEN });
      return;
    }
    if (!kycVerified) {
      toast("Submit your KYC before requesting a quote.");
      NavigationService.navigate(KYC_VERIFICATION_SCREEN);
      return;
    }
    if (!selectedPair || !payCoin || !getCoin) {
      toast("Select a pair before requesting a quote.");
      return;
    }
    const last = positiveLast(ticker && ticker.last);
    const baseCode = coinCode(selectedPair.base);
    const quoteCode = coinCode(selectedPair.quote);
    const sized = sizeRfq({ quoteType, amount, amountAsset, baseCode, quoteCode, last });
    if (!last) {
      toast("Live last is not available yet.");
      return;
    }
    if (!sized) {
      toast("Please enter a valid amount.");
      return;
    }
    const problem = amountErrorFor({
      amount,
      last,
      sized,
      baseCode,
      quoteCode,
      payCoin,
      ...limitsForPair(),
      spendBalance,
    }).error;
    if (problem) {
      toast(problem);
      return;
    }
    if (!deskOpen) {
      toast("The OTC desk is closed. Try again during desk hours.");
      return;
    }
    setSubmitting(true);
    const res = await apiCall(() =>
      appOperation.post(
        "otc/rfq",
        {
          side: String(quoteType).toUpperCase(),
          pay_asset: String(payCoin).toUpperCase(),
          pay_amount: sized.pay,
          get_asset: String(getCoin).toUpperCase(),
          get_amount: sized.get,
          request_rate: last,
        },
        CUSTOMER_TYPE
      )
    );
    setSubmitting(false);
    if (!res?.success) {
      toast(apiMessage(res, "Could not create RFQ."));
      return;
    }
    const created = res.data || {};
    setTrade(null);
    setRfq(created);
    setQuote(created.quote && created.quote.id ? created.quote : null);
    setAmount("");
    toast(created.quote && created.quote.id ? "Firm quote ready. Review it and accept." : "Quote requested. Awaiting desk.");
  }, [
    isLoggedIn,
    kycVerified,
    selectedPair,
    payCoin,
    getCoin,
    ticker,
    quoteType,
    amount,
    amountAsset,
    limitsForPair,
    spendBalance,
    deskOpen,
  ]);

  const cancelRfq = useCallback(async () => {
    if (!rfq?.id) return;
    const status = String(rfq.status || "").toUpperCase();
    const closed = status === "EXPIRED" || (rfq.expiresAt && remainingMs(rfq.expiresAt, Date.now()) <= 0);
    if (status !== "OPEN" || closed) {
      if (closed) {
        await applyExpiredRfq(rfq.id);
        toast("This request has expired.");
      }
      return;
    }
    setSubmitting(true);
    const res = await apiCall(() =>
      appOperation.post(`otc/rfq/${encodeURIComponent(rfq.id)}/cancel`, {}, CUSTOMER_TYPE)
    );
    setSubmitting(false);
    if (!res?.success) {
      const message = apiMessage(res, "Could not cancel RFQ.");
      if (res?.code === "RFQ_NOT_CANCELLABLE" && /EXPIRED/i.test(message)) {
        await applyExpiredRfq(rfq.id);
        toast("This request has expired.");
        return;
      }
      toast(message);
      return;
    }
    setRfq(res.data);
    toast("RFQ cancelled.");
  }, [rfq, applyExpiredRfq]);

  const acceptQuote = useCallback(async () => {
    if (!kycVerified || !quote?.id) return;
    setSubmitting(true);
    const quoteId = String(quote.id);
    if (acceptKeyRef.current.quoteId !== quoteId || !acceptKeyRef.current.key) {
      acceptKeyRef.current = { quoteId, key: newIdempotencyKey("otc") };
    }
    const res = await apiCall(() =>
      appOperation.post(`otc/quote/${encodeURIComponent(quoteId)}/accept`, {}, CUSTOMER_TYPE, {
        "Idempotency-Key": acceptKeyRef.current.key,
      })
    );
    setSubmitting(false);
    if (!res?.success) {
      toast(apiMessage(res, "Could not accept quote."));
      return;
    }
    acceptKeyRef.current = { quoteId: "", key: "" };
    const data = res.data || {};
    if (data.quote) setQuote(data.quote);
    if (data.trade?.id) {
      setTrade(data.trade);
      setTrades((prev) => {
        const id = String(data.trade.id);
        const rest = (Array.isArray(prev) ? prev : []).filter((row) => String(row.id) !== id);
        return [data.trade, ...rest];
      });
    }
    setRfq((prev) => (prev ? { ...prev, status: "ACCEPTED" } : prev));
    toast("Quote accepted.");
    await refreshTradeList();
    await refreshSpotBalances();
  }, [kycVerified, quote?.id, refreshTradeList, refreshSpotBalances]);

  useEffect(() => {
    if (!isLoggedIn) return undefined;
    const openWalletTrade = (row) => {
      const status = String(row?.status || "").toUpperCase();
      return status === "PENDING_SETTLEMENT" || status === "HELD";
    };
    const watching = openWalletTrade(trade) || trades.some(openWalletTrade);
    if (!watching) return undefined;
    let stopped = false;
    const timer = setInterval(async () => {
      const res = await apiCall(() =>
        appOperation.get("otc/trades", { page: 1, limit: 20 }, undefined, CUSTOMER_TYPE)
      );
      if (stopped || !res?.success || !Array.isArray(res.data?.items)) return;
      const items = res.data.items;
      setTrades(items);
      const current = trade?.id ? items.find((row) => String(row.id) === String(trade.id)) : null;
      if (current) setTrade(current);
      await refreshSpotBalances();
    }, 5000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [isLoggedIn, trade, trades, refreshSpotBalances]);

  const lastN = Number(positiveLast(ticker && ticker.last) || 0);
  const userPairLimit = selectedPair && selectedPair.limit_source === "user";
  const spendN = Number(spendBalance);
  const amountInQuote = amountAsset === pairQuote;
  const pairMinCoin = String((selectedPair && selectedPair.min_base) || "").trim();
  const configuredMinBase = pairMinCoin || (userPairLimit ? "" : String(minBaseByAsset[pairBase] || "").trim());
  const resolvedMinNotional = String(
    (selectedPair && selectedPair.min_notional) || (userPairLimit ? "" : minNotional) || ""
  ).trim();
  const minAmountRaw = amountUnitLimit({
    enteredInQuote: amountInQuote,
    baseRaw: configuredMinBase,
    quoteRaw: resolvedMinNotional,
    price: lastN,
    quoteCode: pairQuote,
    pick: "min",
  });
  const minBase = minAmountRaw ? `Min ${amountInQuote ? formatMoney(minAmountRaw) : minAmountRaw}` : "";
  const typedAmount = Number(amount);
  const amountApprox =
    lastN > 0 && Number.isFinite(typedAmount) && typedAmount > 0
      ? amountInQuote
        ? `≈${formatApprox(typedAmount / lastN)} ${pairBase}`
        : `≈${formatApprox(typedAmount * lastN)} ${pairQuote}`
      : "";
  const minQuoteLabel = resolvedMinNotional ? `Minimum ${formatMoney(resolvedMinNotional)} ${pairQuote}` : "";
  const maxBase = (() => {
    if (!Number.isFinite(spendN) || spendN <= 0) return "";
    if (amountAsset === spendAsset) return trimDecimal(spendN);
    if (!(lastN > 0)) return "";
    return amountInQuote ? trimDecimal(spendN * lastN) : trimDecimal(spendN / lastN);
  })();

  const pairOptions = useMemo(
    () =>
      pairs.map((row) => {
        const base = coinCode(row.base);
        const quote = coinCode(row.quote);
        const asset = assets.find((item) => item.code === base);
        return {
          symbol: `${base}/${quote}`,
          name: asset ? asset.name : row.name || base,
          iconPath: asset ? asset.icon_path : row.iconPath || "",
        };
      }),
    [pairs, assets]
  );

  const baseOptions = useMemo(() => {
    const codes = [pairBase, pairQuote].filter(Boolean);
    return codes.map((code) => {
      const asset = assets.find((item) => item.code === code);
      return {
        symbol: code,
        name: asset ? asset.name : code,
        iconPath: asset ? asset.icon_path : "",
      };
    });
  }, [assets, pairBase, pairQuote]);

  const onPairChange = useCallback((key) => {
    setPairKey(key);
    setAmount("");
  }, []);

  const onMax = useCallback(() => {
    if (maxBase) setAmount(maxBase);
  }, [maxBase]);

  const amountReview = useMemo(() => {
    const last = positiveLast(ticker && ticker.last);
    const sized = sizeRfq({
      quoteType,
      amount,
      amountAsset,
      baseCode: pairBase,
      quoteCode: pairQuote,
      last,
    });
    const limits = limitsForPair();
    return amountErrorFor({
      amount,
      last,
      sized,
      baseCode: pairBase,
      quoteCode: pairQuote,
      payCoin,
      ...limits,
      spendBalance,
    });
  }, [ticker, quoteType, amount, amountAsset, pairBase, pairQuote, payCoin, limitsForPair, spendBalance]);

  const startNewRequest = useCallback(() => {
    if (rfqRef.current?.id) dismissedRfqId.current = rfqRef.current.id;
    setRfq(null);
    setQuote(null);
    setTrade(null);
    setAmount("");
  }, []);

  const goToLogin = useCallback(() => {
    NavigationService.navigate(NAVIGATION_AUTH_STACK, { screen: LOGIN_SCREEN });
  }, []);

  const goToKyc = useCallback(() => {
    NavigationService.navigate(KYC_VERIFICATION_SCREEN);
  }, []);

  return {
    assetsLoading,
    quoteType,
    setQuoteType,
    pairKey,
    onPairChange,
    pairOptions,
    baseOptions,
    amountAsset,
    setAmountCoin,
    amount,
    setAmount,
    onMax,
    minBase,
    amountApprox,
    minQuoteLabel,
    amountError: amountReview.error,
    amountWarning: amountReview.warning,
    available: spendBalance,
    availableAsset: spendAsset,
    lockedBalance,
    ticker,
    submitting,
    deskOpen,
    view,
    countdownMs,
    isLoggedIn,
    kycVerified,
    rfq,
    quote,
    trade,
    trades,
    tradesLoading,
    submitRfq,
    cancelRfq,
    acceptQuote,
    startNewRequest,
    goToLogin,
    goToKyc,
  };
}
