import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    FlatList,
    TextInput,
    ActivityIndicator,
    Modal,
    Dimensions,
    PanResponder,
    Platform,
    Vibration,
    RefreshControl,
} from 'react-native';
import RBSheet from 'react-native-raw-bottom-sheet';
import {
    AppSafeAreaView,
    AppText,
    Button,
    SEMI_BOLD,
    SIXTEEN,
    FOURTEEN,
    FIFTEEN,
    THIRTEEN,
    TWELVE,
    TEN,
    TWENTY,
    YELLOW,
    GREEN,
    RED,
    BLACK,
    WHITE,
    Toolbar,
    ELEVEN,
    EIGHTEEN,
    MEDIUM,
    BOLD,
} from '../../shared';
import KeyBoardAware from '../../shared/components/KeyboardAware';
import FastImage from 'react-native-fast-image';
import QRCode from 'react-native-qrcode-svg';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import NavigationService from '../../navigation/NavigationService';
import { BASE_URL } from '../../helper/Constants';
import { colors } from '../../theme/colors';
import { useTheme } from '../../hooks/useTheme';
import { universalPaddingHorizontal, universalPaddingHorizontalHigh } from '../../theme/dimens';
import {
    getDepositActiveCoins,
    generateAddress,
    verifyDeposit,
    getAllCoins,
    getDepositHistory,
} from '../../actions/walletActions';
import { getNotificationList } from '../../actions/homeActions';
import { copyText, shortenAddress, dateFormatter } from '../../helper/utility';
import { BACK_ICON, searchIcon, copyIcon, printIcon, upIcon, downIcon, INFO, NO_NOTIFICATION_ICON, NO_NOTIFICATION_ICON_LIGHT } from '../../helper/ImageAssets';
import { setLoading } from '../../slices/authSlice';
import { setWalletAddress } from '../../slices/walletSlice';
import { showError } from '../../helper/logger';
import moment from 'moment';
import { WALLET_HISTORY_SCREEN } from '../../navigation/routes';
import { appOperation } from '../../appOperation';
import ShimmerBone from '../../shared/components/ShimmerBone';

const SHEET_HEIGHT = Math.round(Dimensions.get('window').height * 0.72);

/** FlatList row stride: inner row + bottom gap (must match `coinFlatListRow` marginBottom). */
const COIN_LIST_ROW_GAP = 12;
const COIN_LIST_ROW_INNER = 64;
const COIN_LIST_ROW_STRIDE = COIN_LIST_ROW_INNER + COIN_LIST_ROW_GAP;

const LETTER_KEYS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const triggerRailHaptic = () => {
    if (Platform.OS === 'android') {
        try {
            Vibration.vibrate(1);
        } catch {
            /* ignore */
        }
    }
};

/** First list index for each A–Z that appears in sorted data (by short_name). */
const buildLetterFirstIndexMap = (sorted: any[]): Record<string, number> => {
    const map: Record<string, number> = {};
    (sorted || []).forEach((item, index) => {
        const sn = String(item?.short_name || '');
        const ch = sn.charAt(0);
        if (!/[A-Za-z]/.test(ch)) return;
        const L = ch.toUpperCase();
        if (map[L] === undefined) map[L] = index;
    });
    return map;
};

/** Jump target: exact letter, else next letter with data, else previous. */
const resolveScrollIndexForLetter = (letter: string, map: Record<string, number>): number | null => {
    if (map[letter] !== undefined) return map[letter];
    const start = LETTER_KEYS.indexOf(letter);
    if (start < 0) return null;
    for (let i = start; i < LETTER_KEYS.length; i++) {
        const k = LETTER_KEYS[i];
        if (map[k] !== undefined) return map[k];
    }
    for (let i = start - 1; i >= 0; i--) {
        const k = LETTER_KEYS[i];
        if (map[k] !== undefined) return map[k];
    }
    return null;
};

const indexToRailLetter = (sorted: any[], index: number): string | null => {
    if (index < 0 || index >= sorted.length) return null;
    const sn = String(sorted[index]?.short_name || '');
    const ch = sn.charAt(0);
    if (!/[A-Za-z]/.test(ch)) return null;
    return ch.toUpperCase();
};

const yToRailLetter = (locationY: number, railHeight: number): string => {
    const h = Math.max(1, railHeight);
    const y = Math.max(0, Math.min(locationY, h));
    const ratio = y / h;
    const idx = Math.min(
        LETTER_KEYS.length - 1,
        Math.floor(ratio * LETTER_KEYS.length)
    );
    return LETTER_KEYS[idx];
};

/**
 * Network keys from `chain` (web + mobile API):
 * - string[] e.g. ["BEP20","ERC20"]
 * - object e.g. { BEP20: {...} }
 * - array of single-key objects (edge case)
 */
const networkKeysFromChain = (chain: any): string[] => {
    if (chain == null) return [];
    if (Array.isArray(chain)) {
        return chain
            .map((c) => {
                if (typeof c === 'string' && c.trim()) return c.trim();
                if (c != null && typeof c === 'object' && !Array.isArray(c)) {
                    const k = Object.keys(c)[0];
                    return k || '';
                }
                return '';
            })
            .filter(Boolean);
    }
    if (typeof chain === 'object') {
        return Object.keys(chain);
    }
    return [];
};

/** Same as web DepositPage: chains where deposit_status[chain] === "ACTIVE". */
const getActiveNetworkKeys = (item: any): string[] => {
    if (!item) return [];
    const keys = networkKeysFromChain(item.chain);
    const ds = item.deposit_status;
    if (typeof ds === 'string') {
        if (ds === 'SUSPENDED') return [];
        return keys;
    }
    if (ds && typeof ds === 'object' && !Array.isArray(ds)) {
        return keys.filter((k) => ds[k] === 'ACTIVE');
    }
    return keys;
};

const limitForChain = (limits: any, chainKey: string): string | number | null | undefined => {
    if (limits == null) return null;
    if (typeof limits === 'object' && !Array.isArray(limits) && chainKey in limits) {
        return limits[chainKey];
    }
    if (typeof limits === 'string' || typeof limits === 'number') {
        return limits;
    }
    return null;
};

const isCoinDepositDisabled = (item: any) => {
    if (!item) return true;
    if (typeof item.deposit_status === 'string' && item.deposit_status === 'SUSPENDED') {
        return true;
    }
    return getActiveNetworkKeys(item).length === 0;
};

const sortCoinsByShortName = (arr: any[]) =>
    [...arr].sort((a, b) =>
        String(a?.short_name || '').localeCompare(String(b?.short_name || ''), undefined, {
            sensitivity: 'base',
            numeric: true,
        })
    );

const DepositCoinSelectListSkeleton = () => (
    <View style={styles.selectCoinPhase}>
        <View style={[styles.selectCoinSearchWrap, { borderWidth: 0 }]}>
            <ShimmerBone width="100%" height={48} borderRadius={10} />
        </View>
        <View style={styles.selectCoinListRow}>
            <View style={[styles.sectionListFlex, { paddingTop: 4 }]}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                    <View
                        key={i}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginBottom: COIN_LIST_ROW_GAP,
                            minHeight: COIN_LIST_ROW_INNER,
                        }}
                    >
                        <ShimmerBone width={40} height={40} borderRadius={20} />
                        <View style={{ marginLeft: 12, flex: 1 }}>
                            <ShimmerBone width={88} height={16} borderRadius={4} style={{ marginBottom: 8 }} />
                            <ShimmerBone width="55%" height={12} borderRadius={4} />
                        </View>
                    </View>
                ))}
            </View>
        </View>
    </View>
);

const DepositCoin = () => {
    const route = useRoute();
    const dispatch = useAppDispatch();
    const { colors: themeColors, isDark } = useTheme();
    const walletAddress = useAppSelector((state) => state.wallet.walletAddress);
    const depositActiveCoins = useAppSelector((state) => state.wallet.depositActiveCoins);
    const notificationList = useAppSelector((state) => state.home.notificationList);

    const depositHistoryRedux = useAppSelector((state) => state.wallet.depositHistory);

    const [availableCurrency, setAvailableCurrency] = useState<any[]>([]);
    const [allData, setAllData] = useState<any[]>([]);
    const [searchPair, setSearchPair] = useState('');
    const [selectedCurrency, setSelectedCurrency] = useState<any>({});
    const [selectedNetwork, setSelectedNetwork] = useState('');
    const [depositAddress, setDepositAddress] = useState('');
    const [recentDepositHistory, setRecentDepositHistory] = useState<any[]>([]);
    const [allCoinData, setAllCoinData] = useState<any[]>([]);
    const [modalData, setModalData] = useState<any>({});
    const [loadingDeposit, setLoadingDeposit] = useState(false);
    const [checkDepositStatus, setCheckDepositStatus] = useState(false);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [faqActiveIndex, setFaqActiveIndex] = useState<number | null>(null);

    const faqData = [
        {
            title: "How to deposit crypto?",
            content: "To deposit cryptocurrency, you need to send it from your external wallet to the deposit address provided by Crypto Bank platform. Always double-check the address and network before confirming the transaction."
        },
        {
            title: "How to Deposit Crypto Step-by-step Guide",
            content: "• Go to Deposit Section – Navigate to the deposit page\n• Select Your Crypto – Choose the cryptocurrency\n• Copy the Deposit Address – Ensure you copy the correct address\n• Send Funds – Paste the address into your external wallet\n• Wait for Confirmation – Blockchain transactions may take time"
        },
        {
            title: "Deposit hasn't arrived?",
            content: "• Check Transaction Status – Use a blockchain explorer\n• Verify the Network – Ensure you sent funds using the correct network\n• Confirm Minimum Deposit Amount – Some cryptocurrencies have a minimum deposit limit\n• Contact Support – If it's been a long time, reach out to customer support"
        }
    ];

    const networkSheetRef = useRef<any>(null);
    const coinFlatListRef = useRef<FlatList<any>>(null);
    const letterFirstIndexMapRef = useRef<Record<string, number>>({});
    const sortedSelectCoinsRef = useRef<any[]>([]);
    const railLayoutHeightRef = useRef(1);
    const railDragActiveRef = useRef(false);
    const lastRailHapticLetterRef = useRef<string | null>(null);
    const bubbleHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const scrollToLetterRef = useRef<(letter: string, animated: boolean) => void>(() => { });

    /** selectCoin = full-screen list; deposit = address + history (after coin + network chosen) */
    const [depositFlowPhase, setDepositFlowPhase] = useState<'selectCoin' | 'deposit'>('selectCoin');
    const [coinForNetworkSheet, setCoinForNetworkSheet] = useState<any>(null);
    /** A–Z highlight from list scroll */
    const [railScrollLetter, setRailScrollLetter] = useState<string | null>(null);
    /** Large floating letter while using the index rail */
    const [bubbleLetter, setBubbleLetter] = useState<string | null>(null);

    // Modal states
    const [showMoreDetailsModal, setShowMoreDetailsModal] = useState(false);
    const [showDepositDetailsModal, setShowDepositDetailsModal] = useState(false);
    const [showDepositConfirmedModal, setShowDepositConfirmedModal] = useState(false);
    const [selectCoinListLoading, setSelectCoinListLoading] = useState(() => {
        return !(depositActiveCoins && depositActiveCoins.length > 0);
    });

    const isFirstLoad = useRef(true);
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        console.log("Pull to refresh triggered! Fetching latest Deposit data...");
        setRefreshing(true);
        if (depositFlowPhase === 'selectCoin') {
            await dispatch(getDepositActiveCoins(null));
        } else {
            await Promise.all([
                dispatch(getDepositActiveCoins(null)),
                dispatch(getDepositHistory(0, 5))
            ]);
        }
        setRefreshing(false);
        console.log("Refresh Complete.");
    }, [dispatch, depositFlowPhase]);

    useFocusEffect(
        useCallback(() => {
            let cancelled = false;
            if (depositFlowPhase !== 'selectCoin') {
                return () => {
                    cancelled = true;
                };
            }
            
            if (isFirstLoad.current) {
                if (!depositActiveCoins || depositActiveCoins.length === 0) {
                    setSelectCoinListLoading(true);
                }
            }

            (async () => {
                await dispatch(getDepositActiveCoins(null));
                if (!cancelled) {
                    setSelectCoinListLoading(false);
                    isFirstLoad.current = false;
                }
            })();
            return () => {
                cancelled = true;
            };
        }, [dispatch, depositFlowPhase])
    );

    useEffect(() => {
        getAllCoinsData();
        handleNotifications();
        fetchDepositHistory();
    }, []);

    useEffect(() => {
        return () => {
            if (bubbleHideTimeoutRef.current) {
                clearTimeout(bubbleHideTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (searchPair) {
            const filteredPair = allData?.filter((item) =>
                item?.short_name?.toLowerCase()?.includes(searchPair?.toLowerCase()) ||
                item?.name?.toLowerCase()?.includes(searchPair?.toLowerCase())
            );
            setAvailableCurrency(filteredPair);
        } else {
            setAvailableCurrency(allData);
        }
    }, [searchPair]);

    /** Single continuous list: all coins sorted by `short_name` (search uses filtered `availableCurrency`). */
    const sortedSelectCoins = useMemo(
        () => sortCoinsByShortName(availableCurrency || []),
        [availableCurrency]
    );

    const letterFirstIndexMap = useMemo(
        () => buildLetterFirstIndexMap(sortedSelectCoins),
        [sortedSelectCoins]
    );

    useEffect(() => {
        sortedSelectCoinsRef.current = sortedSelectCoins;
    }, [sortedSelectCoins]);

    useEffect(() => {
        letterFirstIndexMapRef.current = letterFirstIndexMap;
    }, [letterFirstIndexMap]);

    useEffect(() => {
        if (depositFlowPhase !== 'selectCoin') {
            setRailScrollLetter(null);
            setBubbleLetter(null);
        }
    }, [depositFlowPhase]);

    scrollToLetterRef.current = (letter: string, animated: boolean) => {
        const map = letterFirstIndexMapRef.current;
        const list = sortedSelectCoinsRef.current;
        const idx = resolveScrollIndexForLetter(letter, map);
        if (idx == null || idx < 0 || !list.length) return;
        try {
            coinFlatListRef.current?.scrollToIndex({
                index: idx,
                animated,
                viewPosition: 0,
                viewOffset: 0,
            });
        } catch {
            coinFlatListRef.current?.scrollToOffset({
                offset: idx * COIN_LIST_ROW_STRIDE,
                animated,
            });
        }
    };

    const viewabilityConfig = useMemo(
        () => ({
            itemVisiblePercentThreshold: 18,
            minimumViewTime: 48,
        }),
        []
    );

    const onViewableItemsChangedRef = useRef<
        ((info: { viewableItems: any[]; changed: any[] }) => void) | null
    >(null);
    onViewableItemsChangedRef.current = ({ viewableItems }) => {
        if (railDragActiveRef.current) return;
        const top = viewableItems.find((v: any) => v?.isViewable && typeof v?.index === 'number');
        if (top?.index == null) return;
        const letter = indexToRailLetter(sortedSelectCoinsRef.current, top.index);
        setRailScrollLetter(letter);
    };

    const onViewableItemsChanged = useCallback((info: { viewableItems: any[]; changed: any[] }) => {
        onViewableItemsChangedRef.current?.(info);
    }, []);

    const highlightedRailLetter = bubbleLetter ?? railScrollLetter;

    const alphabetPanResponder = useMemo(
        () =>
            PanResponder.create({
                onStartShouldSetPanResponder: () => true,
                onMoveShouldSetPanResponder: () => true,
                onStartShouldSetPanResponderCapture: () => true,
                onMoveShouldSetPanResponderCapture: () => true,
                onPanResponderTerminationRequest: () => false,
                onShouldBlockNativeResponder: () => true,
                onPanResponderGrant: (evt) => {
                    if (bubbleHideTimeoutRef.current) {
                        clearTimeout(bubbleHideTimeoutRef.current);
                        bubbleHideTimeoutRef.current = null;
                    }
                    railDragActiveRef.current = true;
                    const letter = yToRailLetter(evt.nativeEvent.locationY, railLayoutHeightRef.current);
                    setBubbleLetter(letter);
                    setRailScrollLetter(letter);
                    lastRailHapticLetterRef.current = letter;
                    scrollToLetterRef.current(letter, false);
                    triggerRailHaptic();
                },
                onPanResponderMove: (evt) => {
                    const letter = yToRailLetter(evt.nativeEvent.locationY, railLayoutHeightRef.current);
                    setBubbleLetter(letter);
                    setRailScrollLetter(letter);
                    if (lastRailHapticLetterRef.current !== letter) {
                        lastRailHapticLetterRef.current = letter;
                        scrollToLetterRef.current(letter, false);
                        triggerRailHaptic();
                    }
                },
                onPanResponderRelease: () => {
                    railDragActiveRef.current = false;
                    lastRailHapticLetterRef.current = null;
                    bubbleHideTimeoutRef.current = setTimeout(() => setBubbleLetter(null), 160);
                },
                onPanResponderTerminate: () => {
                    railDragActiveRef.current = false;
                    lastRailHapticLetterRef.current = null;
                    setBubbleLetter(null);
                },
            }),
        []
    );

    const getCoinItemLayout = useCallback(
        (_: any, index: number) => ({
            length: COIN_LIST_ROW_STRIDE,
            offset: COIN_LIST_ROW_STRIDE * index,
            index,
        }),
        []
    );

    useEffect(() => {
        if (walletAddress) {
            setDepositAddress(walletAddress);
        }
    }, [walletAddress]);

    useEffect(() => {
        if (depositActiveCoins && Array.isArray(depositActiveCoins) && depositActiveCoins.length > 0) {
            setAvailableCurrency(depositActiveCoins);
            setAllData(depositActiveCoins);
        }
    }, [depositActiveCoins]);

    const getAllCoinsData = async () => {
        const data = await dispatch(getAllCoins());
        if (data) {
            setAllCoinData(data);
        }
    };

    const fetchDepositHistory = async () => {
        try {
            const result = await dispatch(getDepositHistory(0, 5));
            if (result && Array.isArray(result) && result.length > 0) {
                const recentData = result.slice(0, 5);
                setRecentDepositHistory(recentData);
            } else {
                setRecentDepositHistory([]);
            }
        } catch (e) {
            setRecentDepositHistory([]);
        }
    };

    useEffect(() => {
        if (depositHistoryRedux && Array.isArray(depositHistoryRedux) && depositHistoryRedux.length > 0) {
            const recentData = depositHistoryRedux.slice(0, 5);
            setRecentDepositHistory(recentData);
        } else {
            setRecentDepositHistory([]);
        }
    }, [depositHistoryRedux]);

    const handleNotifications = async () => {
        try {
            await dispatch(getNotificationList());
        } catch (e) {
            console.error("Notification error:", e);
        }
    };

    useEffect(() => {
        if (notificationList && notificationList.length > 0) {
            let announcement = notificationList.filter((item: any) => item?.type === 'announcement');
            if (announcement?.length === 1) {
                setAnnouncements([...announcement, ...announcement]);
            } else if (announcement?.length > 1) {
                setAnnouncements(announcement?.reverse());
            } else {
                setAnnouncements([]);
            }
        } else {
            setAnnouncements([]);
        }
    }, [notificationList]);

    const openNetworkSheetForCoin = (item: any) => {
        if (isCoinDepositDisabled(item)) {
            if (networkKeysFromChain(item?.chain).length === 0) {
                showError('No deposit network available for this coin');
            } else {
                showError('No active deposit network for this coin');
            }
            return;
        }
        setCoinForNetworkSheet(item);
        networkSheetRef.current?.open();
    };

    const handleNetworkChosenFromSheet = (chain: string) => {
        const coin = coinForNetworkSheet;
        if (!coin || !chain) return;
        setSelectedCurrency(coin);
        setSelectedNetwork(chain);
        setDepositAddress('');
        dispatch(setWalletAddress(''));
        networkSheetRef.current?.close();
        setCoinForNetworkSheet(null);
        setDepositFlowPhase('deposit');
        getDepositAddress(false, chain);
    };

    const handleHeaderBack = () => {
        if (depositFlowPhase === 'deposit') {
            setDepositFlowPhase('selectCoin');
            setSelectedCurrency({});
            setSelectedNetwork('');
            setDepositAddress('');
            dispatch(setWalletAddress(''));
            setCoinForNetworkSheet(null);
            setSearchPair('');
        } else {
            NavigationService.goBack();
        }
    };

    const getDepositAddress = async (generate: boolean, selectedNetwork: string) => {
        setDepositAddress('');
        dispatch(setLoading(true));
        const data = {
            generate,
            chain: selectedNetwork,
            currency_id: selectedCurrency?._id || '',
        };
        await dispatch(generateAddress(data));
        dispatch(setLoading(false));
    };

    const completeDeposit = async () => {
        setCheckDepositStatus(true);
        await new Promise<void>((resolve) => {
            setTimeout(() => {
                handleVerifyDeposit('checkPayment');
                resolve();
            }, 10000);
        });
    };

    const handleVerifyDeposit = async (status?: string) => {
        if (!selectedNetwork || !selectedCurrency?._id) return;

        setLoadingDeposit(true);
        const data = {
            status: status || '',
            chain: selectedNetwork,
            currency_id: selectedCurrency?._id,
        };

        try {
            const result = await dispatch(verifyDeposit(data));

            // Match web version logic exactly
            if (result?.success) {
                if (result?.message === "New deposit detected. Processing transfer to main wallet.") {
                    // Show modal when deposit is detected (equivalent to depositHistory("showModal"))
                    const historyData = await dispatch(getDepositHistory(0, 5));
                    if (historyData && historyData.length > 0) {
                        setRecentDepositHistory(historyData);
                        const filteredData = historyData?.slice(0, 1)[0];
                        if (filteredData) {
                            const shortTxHash = shortenAddress(filteredData?.transaction_hash);
                            setModalData({ ...filteredData, shortTxHash });
                            setShowDepositConfirmedModal(true);
                        }
                    }
                } else {
                    if (status === "checkPayment") {
                        showError("New deposit not found. Please check after some time.");
                    }
                }
            }

            // Call transfer_funds after promise resolves, only if status is checkPayment
            // This happens regardless of success, matching web version
            if (status === "checkPayment") {
                setCheckDepositStatus(false);
                // Pass data and currency as object to match web version's intent
                if (result?.data) {
                    appOperation.customer.transfer_funds({
                        data: result?.data,
                        currency: result?.currency
                    });
                }
            }
        } catch (e) {
            console.error("Verify deposit error:", e);
            if (status === "checkPayment") {
                setCheckDepositStatus(false);
            }
        }

        setLoadingDeposit(false);
    };

    const handleDepositModal = (item: any) => {
        const shortAddress = shortenAddress(item?.from_address);
        const shortToAddress = shortenAddress(item?.to_address);
        const shortTxHash = shortenAddress(item?.transaction_hash);
        setModalData({ ...item, shortAddress, shortTxHash, shortToAddress });
        setShowDepositDetailsModal(true);
    };

    const renderCoinListItem = ({ item }: { item: any }) => {
        const disabled = isCoinDepositDisabled(item);
        const suspended =
            item?.deposit_status === 'SUSPENDED' ||
            (typeof item?.deposit_status === 'object' &&
                item?.deposit_status != null &&
                !Array.isArray(item.deposit_status) &&
                networkKeysFromChain(item.chain).length > 0 &&
                getActiveNetworkKeys(item).length === 0);
        return (
            <TouchableOpacity
                style={[
                    styles.coinItem,
                    styles.coinFlatListRow,
                    disabled && styles.coinItemDisabled,
                ]}
                onPress={() => openNetworkSheetForCoin(item)}
                activeOpacity={disabled ? 1 : 0.7}
            >
                <FastImage
                    source={{ uri: BASE_URL + item?.icon_path }}
                    style={styles.coinIcon}
                    resizeMode="cover"
                />
                <View style={styles.coinInfo}>
                    <AppText weight={SEMI_BOLD} type={FOURTEEN} style={{ color: themeColors.text }}>
                        {item?.short_name}
                    </AppText>
                    <AppText type={TWELVE} color={colors.textGray}>
                        {item?.name}
                    </AppText>
                </View>
                {suspended && (
                    <AppText type={TEN} color={RED} weight={SEMI_BOLD}>
                        Suspended
                    </AppText>
                )}
            </TouchableOpacity>
        );
    };

    const renderDepositHistoryItem = ({ item }: { item: any }) => {
        if (!item) return null;

        const shortAddress = shortenAddress(item?.from_address || '', 12);
        const shortTxHash = shortenAddress(item?.transaction_hash || '', 12);

        // Try multiple ways to find the coin image
        let filteredImageData = null;

        // First try from allCoinData
        if (allCoinData && allCoinData.length > 0) {
            filteredImageData = allCoinData.find(
                (data: any) =>
                    data?.short_name === item?.short_name ||
                    data?.short_name === item?.currency ||
                    data?.name === item?.currency
            );
        }

        // If not found, try from depositActiveCoins
        if (!filteredImageData && depositActiveCoins && depositActiveCoins.length > 0) {
            filteredImageData = depositActiveCoins.find(
                (data: any) =>
                    data?.short_name === item?.short_name ||
                    data?.short_name === item?.currency ||
                    data?.name === item?.currency
            );
        }

        const imageUri = filteredImageData?.icon_path
            ? BASE_URL + filteredImageData.icon_path
            : null;

        return (
            <View
                style={[
                    styles.depositHistoryItem,
                    { backgroundColor: themeColors.background, borderWidth: 1, borderColor: isDark ? themeColors.border : '#EEE' }
                ]}
            >
                <TouchableOpacity
                    style={styles.depositHistoryContent}
                    onPress={() => handleDepositModal(item)}
                    activeOpacity={0.7}
                >
                    <View style={styles.depositHistoryLeft}>
                        <View style={styles.coinImageContainer}>
                            {imageUri ? (
                                <FastImage
                                    source={{ uri: imageUri }}
                                    style={styles.historyCoinIcon}
                                    resizeMode="cover"
                                />
                            ) : (
                                <View style={[styles.historyCoinIcon, { backgroundColor: colors.textGray, opacity: 0.3 }]} />
                            )}
                        </View>
                        <View style={styles.depositHistoryLeftContent}>
                            <AppText
                                weight={SEMI_BOLD}
                                type={FOURTEEN}
                                numberOfLines={1}
                                style={{ color: themeColors.text }}
                            >
                                {item?.amount} {item?.currency}
                            </AppText>
                            <AppText
                                type={TWELVE}
                                color={item?.status === 'SUCCESS' ? GREEN : YELLOW}
                                style={{ marginTop: 4 }}
                            >
                                {item?.status === 'SUCCESS' ? 'Completed' : 'Pending'}
                            </AppText>
                        </View>
                    </View>

                    {/* Right Side: Network, Date, Address, TxID */}
                    <View style={styles.depositHistoryRight}>
                        <View style={styles.depositHistoryRightItem}>
                            <View style={styles.labelValueRow}>
                                <AppText type={TEN} color={colors.textGray} style={styles.labelText}>
                                    Network
                                </AppText>
                                <AppText
                                    type={TWELVE}
                                    numberOfLines={1}
                                    style={{ flex: 1, marginLeft: 8, color: themeColors.text }}
                                >
                                    {item?.chain || 'Internal transfer'}
                                </AppText>
                            </View>
                        </View>
                        <View style={[styles.depositHistoryRightItem, { marginTop: 6 }]}>
                            <View style={styles.labelValueRow}>
                                <AppText type={TEN} color={colors.textGray} style={styles.labelText}>
                                    Date
                                </AppText>
                                <AppText
                                    type={TEN}
                                    style={{ flex: 1, marginLeft: 8, color: themeColors.text }}
                                >
                                    {moment(item.updatedAt).format('DD-MM-YYYY hh:mm A')}
                                </AppText>
                            </View>
                        </View>
                        <View style={[styles.depositHistoryRightItem, { marginTop: 6 }]}>
                            <View style={styles.labelValueRow}>
                                <AppText type={TEN} color={colors.textGray} style={styles.labelText}>
                                    Address
                                </AppText>
                                <View style={[styles.addressRow, { flex: 1, marginLeft: 8, flexShrink: 1 }]}>
                                    <AppText
                                        type={TEN}
                                        numberOfLines={1}
                                        style={styles.addressText}
                                    >
                                        {shortAddress || '----'}
                                    </AppText>
                                    {shortAddress && (
                                        <TouchableOpacity
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                copyText(item?.from_address);
                                            }}
                                            style={styles.copyButton}
                                        >
                                            <FastImage
                                                source={copyIcon}
                                                style={styles.copyIcon}
                                                resizeMode="contain"
                                                tintColor={colors.textGray}
                                            />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        </View>
                        <View style={[styles.depositHistoryRightItem, { marginTop: 6 }]}>
                            <View style={styles.labelValueRow}>
                                <AppText type={TEN} color={colors.textGray} style={styles.labelText}>
                                    TxID
                                </AppText>
                                <View style={[styles.addressRow, {
                                    flex: 1, marginLeft: 8, flexShrink: 1,
                                }]}>
                                    <AppText
                                        type={TEN}
                                        numberOfLines={1}
                                        style={styles.addressText}
                                        color={WHITE}
                                    >
                                        {shortTxHash || '----'}
                                    </AppText>
                                    {shortTxHash && (
                                        <TouchableOpacity
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                copyText(item?.transaction_hash);
                                            }}
                                            style={styles.copyButton}
                                        >
                                            <FastImage
                                                source={copyIcon}
                                                style={styles.copyIcon}
                                                resizeMode="contain"
                                                tintColor={colors.textGray}
                                            />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() => handleDepositModal(item)}
                    activeOpacity={0.7}
                >
                    <AppText type={FOURTEEN} color={YELLOW} weight={SEMI_BOLD}>
                        View
                    </AppText>
                </TouchableOpacity>
            </View>
        );
    };

    const headerTitle =
        depositFlowPhase === 'selectCoin'
            ? 'Select Coin'
            : `Deposit ${selectedCurrency?.short_name || ''}`;

    return (
        <AppSafeAreaView style={{ flex: 1, backgroundColor: themeColors.background }}>
            <View style={styles.headerView}>
                <TouchableOpacity onPress={handleHeaderBack}>
                    <FastImage
                        source={BACK_ICON}
                        resizeMode="contain"
                        style={{ width: 20, height: 20 }}
                        tintColor={themeColors.text}
                    />
                </TouchableOpacity>
                <AppText
                    color={themeColors.text}
                    weight={SEMI_BOLD}
                    type={EIGHTEEN}
                >
                    {headerTitle}
                </AppText>
                <TouchableOpacity
                    style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
                    onPress={() => NavigationService.navigate("Wallet_History")}
                >
                    <FastImage
                        source={printIcon}
                        resizeMode="contain"
                        style={{ width: 24, height: 20 }}
                        tintColor={themeColors.text}
                    />

                </TouchableOpacity>
            </View>

            {depositFlowPhase === 'selectCoin' ? (
                selectCoinListLoading ? (
                    <DepositCoinSelectListSkeleton />
                ) : (
                    <View style={styles.selectCoinPhase}>
                        <View style={[styles.selectCoinSearchWrap, { borderColor: isDark ? themeColors.border : '#EEE' }]}>
                            <FastImage
                                source={searchIcon}
                                style={styles.selectCoinSearchIcon}
                                resizeMode="contain"
                                tintColor={colors.textGray}
                            />
                            <TextInput
                                style={[
                                    styles.selectCoinSearchInput,
                                    {
                                        backgroundColor: themeColors.background,
                                        borderColor: isDark ? themeColors.border : '#EEE',
                                        color: themeColors.text,
                                    },
                                ]}
                                placeholder="Search Coins"
                                placeholderTextColor={themeColors.secondaryText}
                                value={searchPair}
                                onChangeText={setSearchPair}
                            />
                        </View>
                        <View style={styles.selectCoinListRow}>
                            <FlatList
                                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeColors.text} />}
                                ref={coinFlatListRef}
                                data={sortedSelectCoins}
                                keyExtractor={(item, index) =>
                                    item?._id ? String(item._id) : String(index)
                                }
                                renderItem={renderCoinListItem}
                                showsVerticalScrollIndicator={false}
                                style={styles.sectionListFlex}
                                contentContainerStyle={[
                                    styles.sectionListContent,
                                    styles.sectionListContentWithIndex,
                                ]}
                                keyboardShouldPersistTaps="handled"
                                getItemLayout={getCoinItemLayout}
                                initialNumToRender={24}
                                maxToRenderPerBatch={20}
                                windowSize={9}
                                updateCellsBatchingPeriod={50}
                                removeClippedSubviews={Platform.OS === 'android'}
                                viewabilityConfig={viewabilityConfig}
                                onViewableItemsChanged={onViewableItemsChanged}
                                extraData={isDark}
                                onScrollToIndexFailed={({ index }) => {
                                    const list = sortedSelectCoinsRef.current;
                                    if (!list.length) return;
                                    const safe = Math.max(0, Math.min(index, list.length - 1));
                                    setTimeout(() => {
                                        try {
                                            coinFlatListRef.current?.scrollToOffset({
                                                offset: safe * COIN_LIST_ROW_STRIDE,
                                                animated: false,
                                            });
                                        } catch {
                                            /* ignore */
                                        }
                                    }, 64);
                                }}
                                ListEmptyComponent={
                                    <View style={styles.emptyContainer}>
                                        <AppText type={FOURTEEN} color={colors.textGray}>
                                            No coins found
                                        </AppText>
                                    </View>
                                }
                            />
                            {sortedSelectCoins.length > 0 && (
                                <>
                                    {bubbleLetter != null && (
                                        <View
                                            style={[styles.alphabetBubbleWrap, styles.alphabetBubbleZ]}
                                            pointerEvents="none"
                                        >
                                            <View
                                                style={[
                                                    styles.alphabetBubble,
                                                    isDark
                                                        ? styles.alphabetBubbleDark
                                                        : styles.alphabetBubbleLight,
                                                ]}
                                            >
                                                <AppText
                                                    weight={SEMI_BOLD}
                                                    type={TWENTY}
                                                    style={styles.alphabetBubbleText}
                                                >
                                                    {bubbleLetter}
                                                </AppText>
                                            </View>
                                        </View>
                                    )}
                                    <View
                                        style={[styles.alphabetIndexRail, styles.alphabetIndexRailZ]}
                                        onLayout={(e) => {
                                            railLayoutHeightRef.current = e.nativeEvent.layout.height;
                                        }}
                                        collapsable={false}
                                    >
                                        <View
                                            style={styles.alphabetIndexLettersColumn}
                                            pointerEvents="none"
                                        >
                                            {LETTER_KEYS.map((label) => {
                                                const isHighlighted = highlightedRailLetter === label;
                                                const mutedColor = themeColors.secondaryText;
                                                const selectedColor = themeColors.text;
                                                return (
                                                    <View
                                                        key={label}
                                                        style={styles.alphabetIndexLetterCell}
                                                    >
                                                        <AppText
                                                            type={TEN}
                                                            style={{
                                                                ...styles.alphabetIndexLetter,
                                                                color: isHighlighted
                                                                    ? selectedColor
                                                                    : mutedColor,
                                                            }}
                                                        >
                                                            {label}
                                                        </AppText>
                                                    </View>
                                                );
                                            })}
                                        </View>
                                        <View
                                            style={StyleSheet.absoluteFill}
                                            {...alphabetPanResponder.panHandlers}
                                        />
                                    </View>
                                </>
                            )}
                        </View>
                    </View>
                )
            ) : (
                <KeyBoardAware refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeColors.text} />}>
                    <View style={styles.container}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={[styles.section, styles.selectedSection]}>
                                <View style={styles.depositSummaryRow}>
                                    <FastImage
                                        source={{ uri: BASE_URL + selectedCurrency?.icon_path }}
                                        style={styles.depositSummaryIcon}
                                        resizeMode="cover"
                                    />
                                    <View style={{ flex: 1 }}>
                                        <AppText weight={SEMI_BOLD} type={FOURTEEN} style={{ color: themeColors.text }}>
                                            {selectedCurrency?.short_name}{' '}
                                            <AppText type={TWELVE} color={colors.textGray}>
                                                {selectedCurrency?.name}
                                            </AppText>
                                        </AppText>
                                        <AppText type={TWELVE} style={{ marginTop: 4, color: themeColors.secondaryText }}>
                                            Network: {selectedNetwork}
                                        </AppText>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => {
                                            setDepositFlowPhase('selectCoin');
                                            setSelectedCurrency({});
                                            setSelectedNetwork('');
                                            setDepositAddress('');
                                            dispatch(setWalletAddress(''));
                                            setSearchPair('');
                                        }}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    >
                                        <AppText type={FOURTEEN} style={{ color: colors.buttonBg }} weight={SEMI_BOLD}>
                                            Change
                                        </AppText>
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.warningBox}>
                                    <AppText type={TEN} color={colors.textGray}>
                                        Make sure you also selected the same{' '}
                                        <AppText type={TEN} weight={BOLD} style={{ color: colors.buttonBg }}>
                                            {selectedCurrency?.short_name}-{selectedNetwork}
                                        </AppText>{' '}
                                        network on the platform where you are withdrawing funds for this deposit.
                                    </AppText>
                                </View>
                            </View>

                            {/* Deposit Address Section */}
                            {selectedNetwork && (
                                <View style={styles.section}>
                                    <AppText weight={SEMI_BOLD} type={SIXTEEN} style={styles.sectionTitle}>
                                        Deposit Address
                                    </AppText>

                                    {!depositAddress ? (
                                        <Button
                                            children="Generate Address"
                                            onPress={() => getDepositAddress(true, selectedNetwork)}
                                            containerStyle={styles.generateButton}
                                        />
                                    ) : (
                                        <>
                                            <View style={styles.warningBox}>
                                                <AppText type={TEN} color={colors.textGray}>
                                                    If you deposit via another network your assets may be lost
                                                </AppText>
                                            </View>

                                            <View style={styles.addressContainer}>
                                                <View style={styles.qrWrapper}>
                                                    <QRCode value={depositAddress} size={100} />
                                                </View>
                                                <View style={styles.addressInfo}>
                                                    <AppText type={TWELVE} color={colors.textGray}>
                                                        Address
                                                    </AppText>
                                                    <TouchableOpacity
                                                        style={styles.addressRow}
                                                        onPress={() => {
                                                            copyText(depositAddress);
                                                        }}
                                                    >
                                                        <AppText type={FOURTEEN} numberOfLines={1} style={{ flex: 1, color: themeColors.text }}>
                                                            {depositAddress}
                                                        </AppText>
                                                        <FastImage
                                                            source={copyIcon}
                                                            style={styles.copyIcon}
                                                            resizeMode="contain"
                                                            tintColor={colors.textGray}
                                                        />
                                                    </TouchableOpacity>
                                                </View>
                                            </View>

                                            <TouchableOpacity
                                                onPress={() => setShowMoreDetailsModal(true)}
                                                style={styles.moreDetailsButton}
                                            >
                                                <AppText type={FOURTEEN} color={YELLOW}>
                                                    More Details {'>'}
                                                </AppText>
                                            </TouchableOpacity>

                                            {checkDepositStatus ? (
                                                <View style={styles.loadingContainer}>
                                                    <ActivityIndicator size="small" color={YELLOW} />
                                                    <AppText type={TEN} color={GREEN} style={styles.loadingText}>
                                                        Transaction in progress! Blockchain validation is underway.
                                                        This may take a few minutes
                                                    </AppText>
                                                </View>
                                            ) : (
                                                <Button
                                                    children="Transfer Completed"
                                                    onPress={completeDeposit}
                                                    containerStyle={styles.transferButton}
                                                />
                                            )}
                                            <AppText type={TEN} color={YELLOW} style={styles.helpText}>
                                                Click here once transaction status completed on your end.
                                            </AppText>
                                        </>
                                    )}
                                </View>
                            )}

                            {/* FAQ Section - same card UI as KycStatus */}
                            <View style={styles.faqSection}>
                                <View style={[styles.faqSectionCard, { backgroundColor: themeColors.background, borderColor: isDark ? themeColors.border : '#EEE', borderWidth: 1 }]}>
                                    <AppText type={FIFTEEN} weight={SEMI_BOLD} style={[styles.faqSectionCardTitle, { color: themeColors.text }] as any}>
                                        FAQ
                                    </AppText>
                                    <FlatList
                                        data={faqData}
                                        keyExtractor={(_, index) => String(index)}
                                        style={styles.faqListWrap}
                                        contentContainerStyle={styles.faqScrollContent}
                                        scrollEnabled={false}
                                        renderItem={({ item, index }) => (
                                            <View style={[styles.faqItemInner, index === faqData.length - 1 && styles.faqItemInnerLast]}>
                                                <TouchableOpacity
                                                    style={styles.faqQuestionRow}
                                                    onPress={() => setFaqActiveIndex(faqActiveIndex === index ? null : index)}
                                                    activeOpacity={0.7}
                                                >
                                                    <AppText type={THIRTEEN} weight={SEMI_BOLD} style={[styles.faqQuestion, { color: themeColors.secondaryText }] as any}>
                                                        {item.title}
                                                    </AppText>
                                                    <FastImage
                                                        source={faqActiveIndex === index ? upIcon : downIcon}
                                                        resizeMode="contain"
                                                        style={styles.faqArrow}
                                                        tintColor={themeColors.secondaryText}
                                                    />
                                                </TouchableOpacity>
                                                {faqActiveIndex === index && (
                                                    <View style={styles.faqAnswer}>
                                                        {item.content.split('\n').map((line: string, lineIndex: number) => (
                                                            <AppText key={lineIndex} type={TWELVE} style={{ color: themeColors.secondaryText, lineHeight: 18 }}>
                                                                {line}
                                                            </AppText>
                                                        ))}
                                                    </View>
                                                )}
                                            </View>
                                        )}
                                    />
                                </View>
                            </View>

                            {announcements?.length > 0 && (
                                <View style={styles.announcementsSection}>
                                    <View style={styles.announcementsHeader}>
                                        <AppText weight={SEMI_BOLD} type={SIXTEEN} style={styles.sectionTitle}>
                                            Announcements
                                        </AppText>
                                        <TouchableOpacity
                                            onPress={() => {
                                            }}
                                        >
                                            <AppText type={FOURTEEN} color={YELLOW}>
                                                More &gt;
                                            </AppText>
                                        </TouchableOpacity>
                                    </View>
                                    <ScrollView
                                        style={styles.announcementsScroll}
                                        showsVerticalScrollIndicator={false}
                                        nestedScrollEnabled={true}
                                    >
                                        {announcements?.map((item, index) => (
                                            <View key={index} style={[
                                                styles.announcementItem,
                                                { backgroundColor: themeColors.background, borderColor: isDark ? themeColors.border : '#EEE', borderWidth: 1 }
                                            ]}>
                                                <AppText
                                                    weight={SEMI_BOLD}
                                                    type={FOURTEEN}
                                                    color={themeColors.text}
                                                >
                                                    {item?.title}
                                                </AppText>
                                                <AppText
                                                    type={TEN}
                                                    color={colors.textGray}
                                                    style={{ marginTop: 5 }}
                                                >
                                                    {moment(item?.updatedAt).format('DD-MM-YYYY hh:mm A')}
                                                </AppText>
                                            </View>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}

                            {/* Recent Deposits Section */}
                            <View style={styles.recentDepositsSection}>
                                <View style={styles.recentDepositsHeader}>
                                    <View style={styles.recentDepositsTitleRow}>
                                        <AppText weight={SEMI_BOLD} type={SIXTEEN} style={styles.sectionTitle}>
                                            Recent Deposits
                                        </AppText>
                                        {loadingDeposit && (
                                            <View style={styles.loadingIndicator}>
                                                <AppText type={TEN} color={colors.textGray}>
                                                    Syncing recent deposits
                                                </AppText>
                                                <ActivityIndicator
                                                    size="small"
                                                    color={YELLOW}
                                                    style={{ marginLeft: 5 }}
                                                />
                                            </View>
                                        )}
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => {
                                            NavigationService.navigate("Wallet_History")
                                        }}
                                    >
                                        <AppText type={FOURTEEN} color={YELLOW}>
                                            More &gt;
                                        </AppText>
                                    </TouchableOpacity>
                                </View>

                                {recentDepositHistory && recentDepositHistory.length > 0 ? (
                                    <View>
                                        {recentDepositHistory.map((item, index) => (
                                            <View key={item?._id || index.toString()}>
                                                {renderDepositHistoryItem({ item })}
                                            </View>
                                        ))}
                                    </View>
                                ) : (
                                    <FastImage source={isDark ? NO_NOTIFICATION_ICON : NO_NOTIFICATION_ICON_LIGHT} style={{ width: 120, height: 80, alignSelf: 'center' }}
                                        resizeMode='contain' />
                                )}
                            </View>
                        </ScrollView>
                    </View>
                </KeyBoardAware>
            )}

            <RBSheet
                ref={networkSheetRef}
                height={SHEET_HEIGHT}
                closeOnDragDown
                closeOnPressMask
                customStyles={{
                    container: {
                        borderTopLeftRadius: 20,
                        borderTopRightRadius: 20,
                        backgroundColor: themeColors.background,
                    },
                    wrapper: { backgroundColor: 'rgba(0,0,0,0.6)' },
                    draggableIcon: { backgroundColor: colors.textGray },
                }}
            >
                <View style={styles.networkSheetInner}>
                    <AppText
                        weight={SEMI_BOLD}
                        type={SIXTEEN}
                        style={{
                            ...styles.networkSheetTitle,
                            color: themeColors.text,
                        }}
                    >
                        Choose Network
                    </AppText>
                    <ScrollView
                        style={styles.networkSheetScroll}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {getActiveNetworkKeys(coinForNetworkSheet).map((chainKey: string, idx: number) => {
                            const minDep = limitForChain(coinForNetworkSheet?.min_deposit, chainKey);
                            const maxDep = limitForChain(coinForNetworkSheet?.max_deposit, chainKey);
                            const hasRange = minDep != null || maxDep != null;
                            return (
                                <TouchableOpacity
                                    key={`${chainKey}-${idx}`}
                                    style={[styles.networkCard, { borderColor: isDark ? themeColors.border : '#EEE' }]}
                                    onPress={() => handleNetworkChosenFromSheet(chainKey)}
                                    activeOpacity={0.75}
                                >
                                    <View style={styles.networkCardTitleRow}>
                                        <AppText
                                            weight={SEMI_BOLD}
                                            type={FOURTEEN}
                                            style={{ color: themeColors.text }}
                                        >
                                            {chainKey}
                                        </AppText>
                                        <AppText
                                            type={TWELVE}
                                            color={colors.textGray}
                                            style={{ flex: 1, marginLeft: 8 }}
                                        >
                                            {coinForNetworkSheet?.name || coinForNetworkSheet?.short_name} ·{' '}
                                            {chainKey}
                                        </AppText>
                                    </View>
                                    <AppText type={TEN} color={colors.textGray} style={styles.networkCardLine}>
                                        1 block confirmation/s
                                    </AppText>
                                    <AppText type={TEN} color={colors.textGray} style={styles.networkCardLine}>
                                        {hasRange ? (
                                            <>
                                                Min. / max deposit: {minDep ?? '—'} - {maxDep ?? '—'}{' '}
                                                {coinForNetworkSheet?.short_name}
                                            </>
                                        ) : (
                                            <>
                                                Min. deposit &gt;0 {coinForNetworkSheet?.short_name}
                                            </>
                                        )}
                                    </AppText>
                                    <AppText type={TEN} color={colors.textGray} style={styles.networkCardLine}>
                                        Est. arrival ≈ 2 mins
                                    </AppText>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                    <View style={styles.networkSheetNotice}>
                        <FastImage source={INFO} style={styles.networkSheetNoticeIcon} resizeMode="contain" tintColor={colors.textGray} />
                        <AppText type={TEN} color={colors.textGray} style={{ flex: 1, lineHeight: 16 }}>
                            Please note that only supported networks on our platform are shown; if you
                            deposit via another network your assets may be lost.
                        </AppText>
                    </View>
                </View>
            </RBSheet>

            {/* More Details Modal */}
            <Modal
                visible={showMoreDetailsModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowMoreDetailsModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View
                        style={[
                            styles.modalContent,
                            { backgroundColor: themeColors.background, borderColor: isDark ? themeColors.border : '#EEE', borderWidth: 1 },
                        ]}
                    >
                        <View style={styles.modalHeader}>
                            <AppText weight={SEMI_BOLD} type={SIXTEEN}>
                                More Info
                            </AppText>
                            <TouchableOpacity onPress={() => setShowMoreDetailsModal(false)}>
                                <AppText type={TWENTY}>×</AppText>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.detailsContainer}>
                            <View style={styles.detailRow}>
                                <AppText type={FOURTEEN}>Minimum deposit</AppText>
                                <AppText type={FOURTEEN} weight={SEMI_BOLD}>
                                    {limitForChain(selectedCurrency?.min_deposit, selectedNetwork) ??
                                        '—'}{' '}
                                    {selectedCurrency?.short_name}
                                </AppText>
                            </View>
                            <View style={styles.detailRow}>
                                <AppText type={FOURTEEN}>Maximum deposit</AppText>
                                <AppText type={FOURTEEN} weight={SEMI_BOLD}>
                                    {limitForChain(selectedCurrency?.max_deposit, selectedNetwork) ??
                                        '—'}{' '}
                                    {selectedCurrency?.short_name}
                                </AppText>
                            </View>
                            <View style={styles.detailRow}>
                                <AppText type={FOURTEEN}>Wallet</AppText>
                                <AppText type={FOURTEEN} weight={SEMI_BOLD}>
                                    Spot Wallet
                                </AppText>
                            </View>
                            <View style={styles.detailRow}>
                                <AppText type={FOURTEEN}>Credited (Trading enabled)</AppText>
                                <AppText type={FOURTEEN} weight={SEMI_BOLD}>
                                    After 2 network confirmations
                                </AppText>
                            </View>
                            <AppText type={TEN} color={colors.textGray} style={styles.warningText}>
                                • Do not send NFTs to this address{'\n'}• Do not transact with
                                Sanctioned Entities{'\n'}• This is {selectedNetwork} deposit address
                                type. Transferring to an unsupported network could result in loss of
                                deposit.
                            </AppText>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Deposit Details Modal */}
            <Modal
                visible={showDepositDetailsModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowDepositDetailsModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View
                        style={[
                            styles.modalContent,
                            { backgroundColor: themeColors.background, borderColor: isDark ? themeColors.border : '#EEE', borderWidth: 1 },
                        ]}
                    >
                        <View style={styles.modalHeader}>
                            <AppText weight={SEMI_BOLD} type={SIXTEEN}>
                                Deposit Details
                            </AppText>
                            <TouchableOpacity onPress={() => setShowDepositDetailsModal(false)}>
                                <AppText type={TWENTY}>×</AppText>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.detailsContainer}>
                            <View style={styles.detailRow}>
                                <AppText type={FOURTEEN} color={themeColors.text} style={styles.modalLabel}>
                                    Status
                                </AppText>
                                <AppText
                                    type={FOURTEEN}
                                    weight={SEMI_BOLD}
                                    color={modalData?.status === 'SUCCESS' ? GREEN : themeColors.text}
                                    style={styles.modalValue}
                                >
                                    {modalData?.status === 'SUCCESS' ? 'Completed' : 'Pending'}
                                </AppText>
                            </View>
                            <View style={styles.detailRow}>
                                <AppText type={FOURTEEN} color={themeColors.text} style={styles.modalLabel}>
                                    Date
                                </AppText>
                                <AppText
                                    type={FOURTEEN}
                                    weight={SEMI_BOLD}
                                    color={themeColors.text}
                                    style={styles.modalValue}
                                >
                                    {moment(modalData?.updatedAt).format('DD-MM-YYYY hh:mm A')}
                                </AppText>
                            </View>
                            <View style={styles.detailRow}>
                                <AppText type={FOURTEEN} color={themeColors.text} style={styles.modalLabel}>
                                    Coin
                                </AppText>
                                <AppText
                                    type={FOURTEEN}
                                    weight={SEMI_BOLD}
                                    color={themeColors.text}
                                    style={styles.modalValue}
                                >
                                    {modalData?.short_name}
                                </AppText>
                            </View>
                            <View style={styles.detailRow}>
                                <AppText type={FOURTEEN} color={themeColors.text} style={styles.modalLabel}>
                                    Deposit amount
                                </AppText>
                                <AppText
                                    type={FOURTEEN}
                                    weight={SEMI_BOLD}
                                    color={themeColors.text}
                                    style={styles.modalValue}
                                >
                                    {modalData?.amount} {modalData?.short_name}
                                </AppText>
                            </View>
                            <View style={styles.detailRow}>
                                <AppText type={FOURTEEN} color={themeColors.text} style={styles.modalLabel}>
                                    Network
                                </AppText>
                                <AppText
                                    type={FOURTEEN}
                                    weight={SEMI_BOLD}
                                    color={themeColors.text}
                                    style={styles.modalValue}
                                >
                                    {modalData?.chain || 'Internal Transaction'}
                                </AppText>
                            </View>
                            <View style={styles.detailRow}>
                                <AppText type={FOURTEEN} color={themeColors.text} style={styles.modalLabel}>
                                    From Address
                                </AppText>
                                <View style={[styles.addressRow, styles.modalValue]}>
                                    <AppText
                                        type={FOURTEEN}
                                        weight={SEMI_BOLD}
                                        color={themeColors.text}
                                        style={{ flex: 1 }}
                                        numberOfLines={1}
                                    >
                                        {modalData?.shortAddress || modalData?.from_address || '----'}
                                    </AppText>
                                    {modalData?.from_address && (
                                        <TouchableOpacity
                                            onPress={() => copyText(modalData?.from_address)}
                                            style={styles.copyButton}
                                        >
                                            <FastImage
                                                source={copyIcon}
                                                style={styles.copyIcon}
                                                resizeMode="contain"
                                                tintColor={colors.textGray}
                                            />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                            <View style={styles.detailRow}>
                                <AppText type={FOURTEEN} color={themeColors.text} style={styles.modalLabel}>
                                    Deposit Address
                                </AppText>
                                <View style={[styles.addressRow, styles.modalValue]}>
                                    <AppText
                                        type={FOURTEEN}
                                        weight={SEMI_BOLD}
                                        color={themeColors.text}
                                        style={{ flex: 1 }}
                                        numberOfLines={1}
                                    >
                                        {modalData?.shortToAddress || modalData?.to_address || '----'}
                                    </AppText>
                                    {modalData?.to_address && (
                                        <TouchableOpacity
                                            onPress={() => copyText(modalData?.to_address)}
                                            style={styles.copyButton}
                                        >
                                            <FastImage
                                                source={copyIcon}
                                                style={styles.copyIcon}
                                                resizeMode="contain"
                                                tintColor={colors.textGray}
                                            />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                            <View style={styles.detailRow}>
                                <AppText type={FOURTEEN} color={themeColors.text} style={styles.modalLabel}>
                                    TxID
                                </AppText>
                                <View style={[styles.addressRow, styles.modalValue]}>
                                    <AppText
                                        type={FOURTEEN}
                                        weight={SEMI_BOLD}
                                        color={themeColors.text}
                                        style={{ flex: 1 }}
                                        numberOfLines={1}
                                    >
                                        {modalData?.shortTxHash || modalData?.transaction_hash || '----'}
                                    </AppText>
                                    {modalData?.transaction_hash && (
                                        <TouchableOpacity
                                            onPress={() => copyText(modalData?.transaction_hash)}
                                            style={styles.copyButton}
                                        >
                                            <FastImage
                                                source={copyIcon}
                                                style={styles.copyIcon}
                                                resizeMode="contain"
                                                tintColor={colors.textGray}
                                            />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                            <View style={styles.detailRow}>
                                <AppText type={FOURTEEN} color={themeColors.text} style={styles.modalLabel}>
                                    Deposit wallet
                                </AppText>
                                <AppText
                                    type={FOURTEEN}
                                    weight={SEMI_BOLD}
                                    color={themeColors.text}
                                    style={styles.modalValue}
                                >
                                    {modalData?.description?.includes('bonus')
                                        ? 'Bonus Wallet'
                                        : 'Main Wallet'}
                                </AppText>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Deposit Confirmed Modal */}
            <Modal
                visible={showDepositConfirmedModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowDepositConfirmedModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View
                        style={[
                            styles.modalContent,
                            { backgroundColor: themeColors.background, borderColor: isDark ? themeColors.border : '#EEE', borderWidth: 1 },
                        ]}
                    >
                        <View style={styles.modalHeader}>
                            <View style={styles.confirmedHeader}>
                                <AppText weight={SEMI_BOLD} type={SIXTEEN}>
                                    Deposit Processing
                                </AppText>
                                <AppText type={TWENTY} color={GREEN}>
                                    ✓
                                </AppText>
                            </View>
                            <TouchableOpacity onPress={() => setShowDepositConfirmedModal(false)}>
                                <AppText type={TWENTY}>×</AppText>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.detailsContainer}>
                            <View style={styles.stepContainer}>
                                <AppText weight={SEMI_BOLD} type={FOURTEEN}>
                                    Deposit order submitted
                                </AppText>
                                <AppText type={TEN} color={colors.textGray}>
                                    {moment(modalData.createdAt).format('DD-MM-YYYY hh:mm A')}
                                </AppText>
                            </View>
                            <View style={styles.stepContainer}>
                                <AppText weight={SEMI_BOLD} type={FOURTEEN}>
                                    System processing
                                </AppText>
                                <AppText type={TEN} color={colors.textGray}>
                                    {moment(modalData.createdAt).format('DD-MM-YYYY hh:mm A')}
                                </AppText>
                            </View>
                            <View style={styles.stepContainer}>
                                <AppText weight={SEMI_BOLD} type={FOURTEEN}>
                                    Deposit completed
                                </AppText>
                                <AppText type={TEN} color={colors.textGray}>
                                    ----
                                </AppText>
                            </View>
                            <View style={styles.detailRow}>
                                <AppText type={FOURTEEN}>Status</AppText>
                                <AppText type={FOURTEEN} weight={SEMI_BOLD} color={YELLOW}>
                                    Pending
                                </AppText>
                            </View>
                            <View style={styles.detailRow}>
                                <AppText type={FOURTEEN}>Coin</AppText>
                                <AppText type={FOURTEEN} weight={SEMI_BOLD}>
                                    {modalData?.short_name}
                                </AppText>
                            </View>
                            <View style={styles.detailRow}>
                                <AppText type={FOURTEEN}>Deposited amount</AppText>
                                <AppText type={FOURTEEN} weight={SEMI_BOLD}>
                                    {modalData?.amount}
                                </AppText>
                            </View>
                            <View style={styles.detailRow}>
                                <AppText type={FOURTEEN}>Network</AppText>
                                <AppText type={FOURTEEN} weight={SEMI_BOLD}>
                                    {modalData?.chain}
                                </AppText>
                            </View>
                            <View style={styles.detailRow}>
                                <AppText type={FOURTEEN}>TxID</AppText>
                                <AppText type={FOURTEEN} weight={SEMI_BOLD}>
                                    {modalData?.shortTxHash?.trim() || '----'}
                                </AppText>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        </AppSafeAreaView>
    );
};

export default DepositCoin;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: universalPaddingHorizontalHigh,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    backIcon: {
        width: 24,
        height: 24,
    },
    section: {
        marginBottom: 20,
        padding: 15,
        borderRadius: 10,
        marginTop: 20,
    },
    selectedSection: {
        borderColor: YELLOW,
    },
    sectionTitle: {
        marginBottom: 10,
    },
    selectButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
    },
    searchIcon: {
        width: 20,
        height: 20,
    },
    quickSelectContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 10,
        gap: 10,
    },
    quickCoinItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderRadius: 8,
        gap: 5,
    },
    quickCoinItemSelected: {
        borderWidth: 1,
        borderColor: '#F3BB2B',
    },
    quickCoinIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
    },
    warningBox: {
        backgroundColor: 'rgba(30, 86, 245, 0.12)',
        padding: 10,
        borderRadius: 8,
        marginTop: 10,
    },
    generateButton: {
        marginTop: 10,
        alignSelf: 'center',
        width: '80%',
    },
    addressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 15,
        gap: 15,
    },
    qrWrapper: {
        padding: 10,
        borderRadius: 10,
    },
    addressInfo: {
        flex: 1,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        // gap: 5,
        marginTop: 5,
    },
    copyIcon: {
        width: 16,
        height: 16,
    },
    moreDetailsButton: {
        marginTop: 15,
    },
    transferButton: {
        marginTop: 15,
        width: '50%',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 15,
        gap: 10,
    },
    loadingText: {
        flex: 1,
    },
    helpText: {
        marginTop: 10,
        textAlign: "left"
    },
    faqSection: {
        marginTop: 20,
    },
    faqSectionCard: {
        borderRadius: 16,
        padding: 14,
        marginBottom: 14,
        overflow: 'hidden' as const,
    },
    faqSectionCardTitle: {
        marginBottom: 8,
    },
    faqListWrap: {},
    faqScrollContent: { paddingBottom: 8 },
    faqItemInner: {
        paddingVertical: 12,
        borderBottomWidth: 0.4,
        borderColor: colors.inputBorder
    },
    faqItemInnerLast: { borderBottomWidth: 0 },
    faqQuestionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    faqQuestion: { flex: 1 },
    faqArrow: { width: 10, height: 10, marginLeft: 8 },
    faqAnswer: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
    },
    announcementsSection: {
        marginTop: 20,
    },
    announcementsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    announcementsScroll: {
        maxHeight: 150,
    },
    announcementItem: {
        padding: 10,
        marginBottom: 10,
        borderRadius: 8,
    },
    recentDepositsSection: {
        marginTop: 20,
        marginBottom: 30,
    },
    recentDepositsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    recentDepositsTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    loadingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    depositHistoryItem: {
        flexDirection: 'row',
        padding: 12,
        marginBottom: 10,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'flex-start',
    },
    depositHistoryContent: {
        flex: 1,
        flexDirection: 'row',
        minWidth: 0,
    },
    depositAmountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: 4,
    },
    dateInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    viewButton: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingLeft: 10,
        paddingRight: 5,
        minWidth: 50,
    },
    depositHistoryLeft: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        minWidth: 120,
    },
    coinImageContainer: {
        justifyContent: 'flex-start',
    },
    depositHistoryLeftContent: {
        flex: 1,
        minWidth: 0,
    },
    depositHistoryRight: {
        flex: 1,
        minWidth: 0,
        paddingLeft: 12,
        marginRight: 8,
    },
    depositHistoryRightItem: {
        marginBottom: 6,
    },
    labelValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        width: "110%",
    },
    labelText: {
        minWidth: 80,
    },
    historyCoinIcon: {
        width: 30,
        height: 30,
        borderRadius: 15,
    },
    addressText: {
        // marginRight: 5,
        width: "100%"
    },
    copyButton: {
        padding: 4,
    },
    emptyContainer: {
        padding: 20,
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    confirmedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    searchInput: {
        padding: 12,
        borderRadius: 8,
        marginBottom: 15,
    },
    modalList: {
        maxHeight: 400,
    },
    coinItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 4,
        gap: 10,
    },
    coinIcon: {
        width: 30,
        height: 30,
        borderRadius: 15,
    },
    coinInfo: {
        flex: 1,
    },
    networkItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderRadius: 8,
        marginBottom: 5,
    },
    selectedNetworkItem: {
        backgroundColor: colors.amber_fifty,
        borderColor: YELLOW,
        borderWidth: 1,
        marginTop: 10
    },
    detailsContainer: {
        marginTop: 10,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingVertical: 12,
        borderBottomWidth: 1,
        minHeight: 44,
    },
    modalLabel: {
        minWidth: 120,
        maxWidth: 120,
    },
    modalValue: {
        flex: 1,
        marginLeft: 16,
        alignItems: 'flex-end',
    },
    warningText: {
        marginTop: 10,
    },
    stepContainer: {
        paddingVertical: 10,
        borderBottomWidth: 1,
    },
    headerView: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 20,
        paddingHorizontal: 25
    },
    selectCoinPhase: {
        flex: 1,
        paddingHorizontal: universalPaddingHorizontalHigh,
    },
    selectCoinListRow: {
        flex: 1,
        flexDirection: 'row',
        position: 'relative',
        minHeight: 0,
    },
    sectionListFlex: {
        flex: 1,
    },
    coinFlatListRow: {
        minHeight: COIN_LIST_ROW_INNER,
        marginBottom: COIN_LIST_ROW_GAP,
    },
    selectCoinSearchWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        marginBottom: 8,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    selectCoinSearchIcon: {
        width: 20,
        height: 20,
        marginRight: 10,
    },
    selectCoinSearchInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 14,
    },
    sectionListContent: {
        paddingTop: 6,
        paddingBottom: 32,
    },
    sectionListContentWithIndex: {
        paddingRight: 30,
    },
    alphabetBubbleWrap: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    alphabetBubbleZ: {
        zIndex: 5,
    },
    alphabetIndexRailZ: {
        zIndex: 10,
    },
    alphabetBubble: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    alphabetBubbleLight: {
        backgroundColor: 'rgba(0,0,0,0.38)',
    },
    alphabetBubbleDark: {
        backgroundColor: 'rgba(255,255,255,0.12)',
    },
    alphabetBubbleText: {
        color: '#FFFFFF',
    },
    alphabetIndexRail: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 28,
        maxHeight: '100%',
    },
    alphabetIndexLettersColumn: {
        flex: 1,
        flexDirection: 'column',
        paddingVertical: 8,
    },
    alphabetIndexLetterCell: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 2,
    },
    alphabetIndexLetter: {
        fontSize: 10,
        lineHeight: 12,
        fontWeight: '700',
    },
    coinItemDisabled: {
        opacity: 0.45,
    },
    networkSheetInner: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    networkSheetTitle: {
        marginBottom: 12,
    },
    networkSheetScroll: {
        maxHeight: SHEET_HEIGHT - 168,
    },
    networkCard: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
    },
    networkCardTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: 8,
    },
    networkCardLine: {
        marginTop: 4,
    },
    networkSheetNotice: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: 'rgba(30, 86, 245, 0.12)',
        padding: 12,
        borderRadius: 10,
        marginTop: 4,
        marginBottom: 20,
    },
    networkSheetNoticeIcon: {
        width: 18,
        height: 18,
        marginRight: 10,
        marginTop: 2,
    },
    depositSummaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    depositSummaryIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
});

