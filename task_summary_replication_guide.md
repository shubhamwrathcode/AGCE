# Universal Replication Blueprint & Technical Execution Guide
> **Exchange App (AGCE / Arab Global Clone Projects)**  
> **Purpose**: This document contains complete code snippets, exact target file paths, web reference sources, and drop-in logic for replicating all 15+ features/fixes across any clone project seamlessly.

---

## 📋 Table of Contents
1. [Spot Chart Live Price & 24h Stats Sync](#1-spot-chart-live-price--24h-stats-sync)
2. [Universal CoinIcon System & Fallback Asset](#2-universal-coinicon-system--fallback-asset)
3. [CoinIcon Integration Across All Wallet Screens](#3-coinicon-integration-across-all-wallet-screens)
4. [Wallet Overview Accounts Alignment (P2P/Swap Removal)](#4-wallet-overview-accounts-alignment-p2pswap-removal)
5. [Futures Leverage Modal Dynamic Range & 150x Support](#5-futures-leverage-modal-dynamic-range--150x-support)
6. [Futures Price & Amount Input Precision Enforcement](#6-futures-price--amount-input-precision-enforcement)
7. [Futures Order Book Fixed Precision, Dynamic Headers & Layout](#7-futures-order-book-fixed-precision-dynamic-headers--layout)
8. [Futures Dynamic Base & Quote Symbol Resolution](#8-futures-dynamic-base--quote-symbol-resolution)
9. [Futures Isolated Position Adjust Margin Modal (Add & Remove)](#9-futures-isolated-position-adjust-margin-modal-add--remove)
10. [Futures Combined All-Pairs History & Trade History Tab](#10-futures-combined-all-pairs-history--trade-history-tab)
11. [Futures TP/SL Trigger Price & Title Formatting](#11-futures-tpsl-trigger-price--title-formatting)
12. [Options Trade Sell-Side Reduce-Only Enforcement](#12-options-trade-sell-side-reduce-only-enforcement)
13. [Options Chain Filter Bar Odd Size Removal](#13-options-chain-filter-bar-odd-size-removal)
14. [Options Chain Margin Summary Strip (IMR, MMR, Balances)](#14-options-chain-margin-summary-strip-imr-mmr-balances)
15. [Options Account Section & Header Bottom Sheet Modal](#15-options-account-section--header-bottom-sheet-modal)
16. [Master Step-by-Step Execution Checklist](#16-master-step-by-step-execution-checklist)

---

## 1. Spot Chart Live Price & 24h Stats Sync

### Target Files:
- `src/screens/spotScreen/SpotChartScreen.jsx`
- `src/SocketProvider.js`

### Implementation:
1. In `SpotChartScreen.jsx`, ensure Redux `coinData` takes precedence over route params in `mergedPair`:
```javascript
const mergedPair = useMemo(() => {
  const fromList = pairFromList;
  const raw = pair;
  return {
    ...raw,
    ...fromList,
    buy_price: fromList?.buy_price ?? raw?.buy_price ?? "0",
    change: fromList?.change ?? raw?.change ?? 0,
    change_percentage: fromList?.change_percentage ?? raw?.change_percentage ?? 0,
    high: fromList?.high ?? raw?.high,
    low: fromList?.low ?? raw?.low,
    volume: fromList?.volume ?? raw?.volume,
  };
}, [pair, pairFromList]);
```
2. Subscribe to `"spot_chart"` market channel on screen focus:
```javascript
useFocusEffect(
  useCallback(() => {
    subscribeToMarket("spot_chart");
    return () => {
      unsubscribeFromMarket("spot_chart");
    };
  }, [subscribeToMarket, unsubscribeFromMarket])
);
```

---

## 2. Universal CoinIcon System & Fallback Asset

### Target Files:
- `assets/images/activities_icon.png` (Fallback asset)
- `src/helper/ImageAssets.js`
- `src/helper/coinIconUrl.ts`
- `src/common/CoinIcon.tsx`

### Implementation:
1. Export `activities_icon` in `src/helper/ImageAssets.js`:
```javascript
export const activities_icon = require('../../assets/images/activities_icon.png');
```

2. Clean URL resolver in `src/helper/coinIconUrl.ts`:
```typescript
import { IMAGE_BASE_URL } from "./Constants";

export function getCoinIconUrl(coin: any): string | null {
  if (!coin) return null;
  const raw = coin?.icon_path || coin?.icon || coin?.image || coin?.logo;
  if (
    raw == null ||
    String(raw).trim() === '' ||
    String(raw).trim() === 'null' ||
    String(raw).trim() === 'undefined'
  ) return null;

  const s = String(raw).trim();
  if (/^https?:\/\//i.test(s)) return s;
  const base = String(IMAGE_BASE_URL || "").replace(/\/+$/, "");
  const path = s.startsWith("/") ? s : `/${s}`;
  return `${base}${path}`;
}
```

3. Universal `CoinIcon.tsx` component:
```tsx
import React, { useState, useEffect } from 'react';
import { View, StyleProp } from 'react-native';
import FastImage, { FastImageStyle } from 'react-native-fast-image';
import { SvgXml } from 'react-native-svg';
import { getCoinIconUrl } from '../helper/coinIconUrl';
import { activities_icon } from '../helper/ImageAssets';

export interface CoinIconProps {
  coin: any;
  style?: StyleProp<FastImageStyle>;
  resizeMode?: 'contain' | 'cover' | 'stretch' | 'center';
  fallback?: any;
}

export const CoinIcon: React.FC<CoinIconProps> = ({
  coin,
  style,
  resizeMode = 'cover',
  fallback = activities_icon,
}) => {
  const uri = getCoinIconUrl(coin);
  const [loadFailed, setLoadFailed] = useState(false);
  const [svgXml, setSvgXml] = useState<string | null>(null);

  const isSvg = uri ? /\.svg(\?.*)?$/i.test(uri) : false;

  useEffect(() => {
    setLoadFailed(false);
    setSvgXml(null);
    if (!uri || !isSvg) return;
    let active = true;
    fetch(uri)
      .then((res) => (res.ok ? res.text() : null))
      .then((text) => {
        if (active && text && text.includes('<svg')) setSvgXml(text);
        else if (active) setLoadFailed(true);
      })
      .catch(() => { if (active) setLoadFailed(true); });
    return () => { active = false; };
  }, [uri, isSvg]);

  if (!uri || loadFailed) {
    return <FastImage source={fallback} style={style as StyleProp<FastImageStyle>} resizeMode={resizeMode} />;
  }

  if (isSvg && svgXml) {
    return <SvgXml xml={svgXml} style={style as any} />;
  }

  return (
    <FastImage
      source={{ uri, priority: FastImage.priority.normal }}
      style={style as StyleProp<FastImageStyle>}
      resizeMode={resizeMode}
      onError={() => setLoadFailed(true)}
    />
  );
};

export default React.memo(CoinIcon);
```

---

## 3. CoinIcon Integration Across All Wallet Screens

### Target Files:
- `src/screens/wallet/WalletNew.js`
- `src/screens/wallet/tabs/SpotWalletTab.js`
- `src/screens/wallet/tabs/GenericWalletTab.js`
- `src/screens/wallet/tabs/MarginWalletTab.js`
- `src/screens/wallet/DepositWallet.js`
- `src/screens/wallet/Transfer.js`
- `src/common/CoinListModal.js`
- `src/screens/wallet/sheets/CoinDetailSheet.js`

### Usage:
Replace all `<FastImage source={{ uri: ... }} />` coin icon instances with:
```jsx
<CoinIcon coin={item} style={{ width: 28, height: 28 }} resizeMode="cover" fallback={activities_icon} />
```

---

## 4. Wallet Overview Accounts Alignment (P2P/Swap Removal)

### Target File:
- `src/screens/wallet/WalletNew.js`

### Implementation:
In `accountRows` memo in `WalletNew.js`, comment out `p2p` and `swap` accounts:
```javascript
// Comment out P2P and Swap to match web AssetOverview exactly
// p2p: { ... },
// swap: { ... },
```
Ensure account list order matches:
1. Main Account
2. Spot Account
3. Isolated Margin
4. Cross Margin
5. Futures Account
6. Earning Account
7. Options Account

---

## 5. Futures Leverage Modal Dynamic Range & 150x Support

### Target File:
- `src/screens/Futures/FuturesTrade.jsx`

### Implementation:
```javascript
export function getLeverageOptions(maxLeverage) {
  const max = Number(maxLeverage) || 125;
  const milestones = [5, 10, 20, 50, 75, 100, 125, 150];
  const filtered = milestones.filter((m) => m <= max);
  if (!filtered.includes(max)) filtered.push(max);
  filtered.sort((a, b) => a - b);
  return filtered;
}
```
In Leverage Bottom Sheet:
- Render interactive pills using `getLeverageOptions(selectedCoin?.max_leverage)`.
- Use interactive `−` and `+` buttons and a numeric `TextInput` clamped between `1` and `selectedCoin.max_leverage`.

---

## 6. Futures Price & Amount Input Precision Enforcement

### Target Files:
- `src/helper/futuresUtils.js`
- `src/screens/Futures/FuturesTrade.jsx`

### Implementation:
1. In `futuresUtils.js`:
```javascript
export function getTickSize(pair) {
  const raw = pair?.tick_size ?? pair?.price_precision ?? pair?.price_decimal ?? pair?.quote_decimal;
  const n = parseFloat(raw);
  return Number.isFinite(n) && n > 0 ? n : 0.1;
}

export function getStepSize(pair) {
  const raw = pair?.step_size ?? pair?.quantity_precision ?? pair?.qty_decimal ?? pair?.base_decimal;
  const n = parseFloat(raw);
  return Number.isFinite(n) && n > 0 ? n : 0.001;
}

export function sanitizeIncrementInput(val, increment) {
  if (val === "" || val === undefined || val === null) return "";
  let clean = String(val).replace(/[^0-9.]/g, "");
  const parts = clean.split(".");
  if (parts.length > 2) clean = `${parts[0]}.${parts.slice(1).join("")}`;
  const incStr = String(increment || "0.1");
  const maxDp = incStr.includes(".") ? incStr.split(".")[1].length : 0;
  if (maxDp > 0 && clean.includes(".")) {
    const [intPart, decPart] = clean.split(".");
    return `${intPart}.${decPart.slice(0, maxDp)}`;
  }
  return clean;
}
```
2. In `FuturesTrade.jsx`:
- On Price inputs: `onChangeText={(t) => setPrice(sanitizeIncrementInput(t, getTickSize(selectedCoin)))}`
- On Amount inputs: `onChangeText={(t) => setAmount(sanitizeIncrementInput(t, stepSize))}`
- Attach dynamic `maxLength={dotIdx >= 0 ? dotIdx + 1 + maxDp : undefined}`.

---

## 7. Futures Order Book Fixed Precision, Dynamic Headers & Layout

### Target Files:
- `src/helper/futuresUtils.js`
- `src/screens/Futures/FuturesTrade.jsx`

### Implementation:
1. Dynamic precision reset on pair change:
```javascript
useEffect(() => {
  if (selectedCoin) {
    const tick = getTickSize(selectedCoin);
    setObPrecision(String(tick));
  }
}, [selectedCoin?.symbol, selectedCoin?._id]);
```
2. Dynamic column headers:
- Left: `Price (${currentQuoteAsset})`
- Right: `Size (${currentBaseAsset})`
3. Fixed row slicing (`visibleRowCount = 6` for dual view, `12` for single side):
```javascript
const obAsks = useMemo(() => {
  const sliced = asks.slice(-visibleRowCount);
  return padOrderBookRows(sliced, visibleRowCount, "ask");
}, [asks, visibleRowCount]);
```

---

## 8. Futures Dynamic Base & Quote Symbol Resolution

### Target File:
- `src/screens/Futures/FuturesTrade.jsx`

### Implementation:
```javascript
const currentBaseAsset =
  selectedCoin?.short_name ||
  selectedCoin?.base_asset ||
  selectedCoin?.base_currency ||
  (selectedCoin?.symbol ? selectedCoin.symbol.split("USDT")[0].replace(/[^A-Za-z0-9]/g, "") : "") ||
  "BTC";

const currentQuoteAsset =
  selectedCoin?.margin_asset ||
  selectedCoin?.quote_asset ||
  selectedCoin?.quote_currency ||
  "USDT";
```
Apply across:
- `Buy ${currentBaseAsset}` / `Sell ${currentBaseAsset}` buttons.
- `Amount (${currentBaseAsset})` / `Value (${currentQuoteAsset})` dropdown & preferences sheet.

---

## 9. Futures Isolated Position Adjust Margin Modal (Add & Remove)

### Target Files:
- `src/screens/Futures/components/FuturesAdjustMarginModal.jsx` (New component)
- `src/screens/Futures/components/FuturesHistorySection.jsx`
- `src/appOperation/lib/customer/index.ts`

### Implementation:
1. API Endpoint in `customer/index.ts`:
```typescript
async adjustPositionMargin(payload: {
  position_id: string;
  symbol: string;
  amount: number;
  margin: number;
  type: number; // 1 = ADD, 2 = REMOVE
  action: 'ADD' | 'REMOVE';
  side: string;
}) {
  return this.post('v1/futures/isolated-margin', payload);
}
```
2. Render edit icon button (`editnew`) next to Margin in `renderFuturesPositionItem` for `pos.margin_type === 'ISOLATED'`.

---

## 10. Futures Combined All-Pairs History & Trade History Tab

### Target Files:
- `src/screens/Futures/FuturesTrade.jsx`
- `src/screens/Futures/FutureHistoryScreen.jsx`
- `src/screens/Futures/components/FuturesHistorySection.jsx`
- `src/helper/futuresUtils.js`

### Implementation:
1. Remove symbol restrictions in fetchers:
- Request `/v1/futures/positions/open` (all pairs).
- Request `/v1/futures/positions/history` (all pairs).
- Request `/v1/futures/orders/open` (all pairs).
- Request `/v1/futures/orders/history` (all pairs).
- Request `/v1/futures/trades` (all pairs).
2. Wire `computeTradeHistoryItem` in `futuresUtils.js` for deep key extraction (`price`, `qty`, `total`, `fee`, `realizedPnl`).

---

## 11. Futures TP/SL Trigger Price & Title Formatting

### Target Files:
- `src/helper/futuresUtils.js`
- `src/screens/Futures/components/FuturesHistorySection.jsx`
- `src/screens/Futures/FutureHistoryCardDetailPage.jsx`

### Implementation:
1. In `futuresUtils.js`:
```javascript
export function formatFuturesOrderType(rawType) {
  const s = String(rawType || "").toUpperCase();
  if (s.includes("TAKE_PROFIT") && s.includes("MARKET")) return "TP Market";
  if (s.includes("TAKE_PROFIT") && s.includes("LIMIT")) return "TP Limit";
  if (s.includes("STOP") && s.includes("MARKET")) return "SL Market";
  if (s.includes("STOP") && s.includes("LIMIT")) return "SL Limit";
  if (s.includes("TRAILING")) return "Trailing Stop";
  if (s === "MARKET") return "Market";
  if (s === "LIMIT") return "Limit";
  return s || "Limit";
}

export function getFuturesOrderDisplayPrice(order) {
  const triggerPrice = order.trigger_price ?? order.stop_price;
  if (triggerPrice != null && Number(triggerPrice) > 0) return String(triggerPrice);
  const limitPrice = order.price ?? order.limit_price;
  if (limitPrice != null && Number(limitPrice) > 0) return String(limitPrice);
  return "Market";
}

export function getFuturesOrderTriggerText(order) {
  if (order.tp_price && order.sl_price) return `TP ${order.tp_price} · SL ${order.sl_price}`;
  if (order.trigger_price) return `Trigger ${order.trigger_price}`;
  if (order.stop_price) return `Stop ${order.stop_price}`;
  return "—";
}
```

---

## 12. Options Trade Sell-Side Reduce-Only Enforcement

### Target File:
- `src/screens/Futures/OptionsTrade/OptionsInstrumentTrade.jsx`

### Implementation:
```javascript
const isSell = tradeTab === "sell";
const effectiveReduceOnly = isSell ? true : false;
```
In JSX:
```jsx
{isSell && (
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <FastImage source={tick} style={{ width: 14, height: 14 }} />
    <AppText style={{ marginLeft: 6, color: themeColors.text }}>Reduce Only</AppText>
  </View>
)}
```
- On **Buy** tab: Reduce Only is completely hidden (`TIF` is right aligned).
- On **Sell** tab: Reduce Only is permanently visible, checked, and enforced in the order payload.

---

## 13. Options Chain Filter Bar Odd Size Removal

### Target File:
- `src/screens/Futures/OptionsTrade/OptionsChainTable.jsx`

### Implementation:
- Remove the `Odd Size` checkbox component and state from `OptionsChainTable.jsx`.
- Filter bar starts directly with Asset Selector (`BTCUSDT ▾`), Strike Min-Max inputs, and Reset button.

---

## 14. Options Chain Margin Summary Strip (IMR, MMR, Balances)

### Target Files:
- `src/screens/Futures/OptionsTrade/OptionsChainTable.jsx`
- `src/screens/Futures/OptionsTrade/OptionsTrade.jsx`

### Implementation:
Render a compact 2-row margin summary above `<OptionsExpiries ... />`:
- Row 1: `IMR` (e.g. `0.00%`) & `Margin Balance` (e.g. `0.00 USD ▾`)
- Row 2: `MMR` (e.g. `0.00%`) & `Available Margin` (e.g. `0.00 USD`)
- Tapping anywhere on the strip opens `OptionsAccountSheet`.

---

## 15. Options Account Section & Header Bottom Sheet Modal

### Target Files:
- `src/screens/Futures/OptionsTrade/OptionsAccountSection.jsx` (New)
- `src/screens/Futures/OptionsTrade/OptionsAccountSheet.jsx` (New)
- `src/screens/Futures/OptionsTrade/OptionsHeader.jsx`
- `src/screens/Futures/OptionsTrade/OptionsTrade.jsx`
- `src/screens/Futures/OptionsTrade/OptionsInstrumentTrade.jsx`

### Key Features:
1. **Header Wallet Icon**: Located next to History icon in `OptionsHeader.jsx`.
2. **Bottom Sheet Modal (`OptionsAccountSheet`)**:
   - Modern sliding modal with drag handle, title `Options Account`, amber `⇆` transfer button, and `✕` close button.
   - Contains collapsible **Margin Ratio** (Maintenance Margin, Adjusted Equity).
   - Contains collapsible **Total Equity** (Market Value, Margin Balance, Available Margin, Initial Margin, Locked in orders).
   - Contains **Unrealized PnL** (Green $\ge 0$, Red $< 0$).
   - Contains **Options PNL Analysis** button (auto-dismisses sheet before navigating to `OPTIONS_PNL_ANALYSIS_SCREEN`).
3. **High-Contrast Theme Styling**:
   - Background: `#1E2026`
   - Labels: Crisp `#848E9C`
   - Values: Bright white `#FFFFFF` / `#EAECEF`

---

## 16. Spot / Margin Trade Buy/Sell Tab iOS Inverted Text (`llǝS`) Fix

### Problem
In `Spot.jsx`, the Sell tab used an `ImageBackground` rotated `180deg` to mirror the trapezoid background button shape. Because the `<AppText>Sell</AppText>` was placed inside the transformed container, it attempted a counter-rotation (`transform: [{ rotate: '180deg' }]`). On certain iOS devices/versions, nested transform inheritance failed or compounded, rendering the text upside-down/inverted (`llǝS`).

### Solution & Changes:
- Decoupled the background image from the text:
  - Rendered `<FastImage source={trade_btn} style={[StyleSheet.absoluteFillObject, { transform: [{ rotate: '180deg' }] }]} />` as an absolute background layer.
  - Placed `<AppText>Sell</AppText>` as a direct sibling child of `<TouchableOpacity>` with NO rotation or transform applied.
  - Guaranteed normal upright rendering across all iOS and Android devices.

**Target File**:
- `src/screens/spotScreen/Spot.jsx`

---

## 17. Master Step-by-Step Execution Checklist

When replicating to a new project, execute in this exact sequence:

1. [ ] **Assets**: Ensure `activities_icon.png` is placed in `assets/images/` and exported in `ImageAssets.js`.
2. [ ] **CoinIcon**: Create `src/helper/coinIconUrl.ts` and `src/common/CoinIcon.tsx`.
3. [ ] **Wallet Overview**: Update `WalletNew.js` (use `CoinIcon`, comment out `p2p`/`swap`).
4. [ ] **Spot Chart**: Update `SpotChartScreen.jsx` `mergedPair` & socket channels.
5. [ ] **Spot Buy/Sell Tabs**: Ensure `Spot.jsx` uses decoupled `FastImage` background and untransformed `AppText` for Buy/Sell tabs.
6. [ ] **Futures Leverage**: Add `getLeverageOptions` & dynamic input in `FuturesTrade.jsx`.
7. [ ] **Futures Precisions**: Add `getTickSize`, `getStepSize`, `sanitizeIncrementInput` in `futuresUtils.js` and enforce on inputs.
8. [ ] **Futures Order Book**: Add dynamic base/quote headers, `toFixed` precision, and fixed 6/12 row slicing in `FuturesTrade.jsx`.
9. [ ] **Futures Asset Symbols**: Add `currentBaseAsset` & `currentQuoteAsset` in `FuturesTrade.jsx`.
10. [ ] **Futures Adjust Margin**: Create `FuturesAdjustMarginModal.jsx` and add `adjustPositionMargin` API service in `customer/index.ts`.
11. [ ] **Futures History**: Remove single-symbol filters in `FutureHistoryScreen.jsx` & `FuturesTrade.jsx`, add Trade History tab.
12. [ ] **Futures TP/SL Formatting**: Add `formatFuturesOrderType`, `getFuturesOrderDisplayPrice`, `getFuturesOrderTriggerText`.
13. [ ] **Options Reduce Only**: Enforce `effectiveReduceOnly` (hidden on Buy, checked on Sell) in `OptionsInstrumentTrade.jsx`.
14. [ ] **Options Odd Size**: Remove static Odd Size checkbox in `OptionsChainTable.jsx`.
15. [ ] **Options Margin Strip**: Add `OptionsMarginSummary` in `OptionsChainTable.jsx`.
16. [ ] **Options Account Section & Sheet**: Add `OptionsAccountSection.jsx`, `OptionsAccountSheet.jsx`, Header Wallet Icon, and navigation callbacks.
