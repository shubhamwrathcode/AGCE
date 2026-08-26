# AGCE Project Task Log

## 1. Authentication & Security
- [x] **Bottom Tab Authentication Guard**: Secured `Home` and `Wallet` tabs in `Navigator.tsx`, `Home.js`, and `WalletNew.js`. Unauthenticated users navigating to Home or Wallet are redirected to `LOGIN_SCREEN` with toast `"Please login first to access Home / Wallet"`.
- [x] **User State Reset on Logout**: Added `dispatch(setUserData(null))` in `logoutAction` within `authActions.ts`.

---

## 2. UI & Theme Consistency (`darkTheme.darkThemeInputColor`)
- [x] **OTP Input 6-Digit Component**: Updated background in `OtpInput6Digit.js` to `darkTheme.darkThemeInputColor` (`#2b313d`) with 0 border by default and 1.5 active digit border.
- [x] **Auth Email / Phone Tab Bar**: Updated phone input background to `darkTheme.darkThemeInputColor`.
- [x] **Deposit Coin Screen**: Updated search bar background to `darkTheme.darkThemeInputColor` in `DepositCoin.tsx`.
- [x] **Select Coin Search**: Updated search bar background and text colors in `SelectCoin.js`.
- [x] **Withdrawal Form**: Updated all security verification inputs (Email, Mobile, Authenticator, Fund Password), Chain selector, and Withdraw button disabled background color to `darkTheme.darkThemeInputColor` in `WithdrawForm.js`.
- [x] **Add Withdrawal Address Sheet**: Applied `darkTheme.darkThemeInputColor` to all inputs (Label, Coin selector, Network selector, Address, Memo, Recipient legal name, PAN, Country selector, PIN, Residential address, Exchange selector, Manual name input, and Verify method cards) in `AddWithdrawalAddressBasics.js`.
- [x] **Welcome Screen Chart WebView**: Removed right-side black line/border by hiding scroll indicators and fixed loading background flash with theme-matched `palette.bg` `renderLoading` in `Welcome.js`.
- [x] **Staking Purchase Screen Fields**: Applied `darkTheme.darkThemeInputColor` / `darkTheme.lightthemeinputcolor` across all input and info cards (Amount input, Est. APR card, Est. Daily Return card, Early Withdrawal Penalty card, and Staking Overview RBSheet card) in `StakingPurchase.tsx`. Fixed quote syntax in `colors.ts`.

---

## 3. Spot Trading & Performance Optimization (`Spot.jsx`)
- [x] **Cancel → Re-Place Order Stale State Sync Fix**:
  - In `confirmCancelOrder`, immediately pruned the cancelled order from Redux `spotOpenOrders` (`dispatch(setOpenOrders(updatedOrders))`) and reset `lastOrderPlacedTimeRef.current = 0`.
  - Previously, cancel order only added ID to component `cancelledOrderIds` Set without updating Redux, causing `openOrdersRef.current` to retain the ghost cancelled order; when placing a subsequent order, the stale cache clashed with the new DB response causing a 1-time layout flick.
- [x] **Android Fabric Crash Fix**: Fixed `java.lang.NullPointerException: Attempt to invoke interface method 'java.lang.Object[] android.text.Spannable.getSpans'` by adding `{props.children ?? ""}` fallback in `AppText.tsx` and guarding `toFixedEight` in `utility.ts`.
- [x] **Cancel Order Modal Top-Left Shadow Flash Fix**:
  - Replaced native Android Dialog Modal with pure in-screen React Native root overlay (`StyleSheet.absoluteFillObject`, `zIndex: 99999`, `elevation: 99999`).
  - Completely eliminated the Android native window creation delay and the top-left status-bar shadow glitch during open/close.
- [x] **Database Replication / Premature Read Safety Guard (Device-Specific Flicker Fix)**:
  - Added `lastOrderPlacedTimeRef` guard inside `fetchSpotOpenOrdersTab`: if an order was placed within 2s and the backend database read replica momentarily returns 0 items, the existing cached list is preserved and a silent 350ms retry runs instead of wiping Redux `openOrders` to empty `[]`.
  - Added 300ms commit debounce post-submission before querying `spot_me_orders_open` to ensure server database transaction is committed.
- [x] **Low-End / Older Android Devices Pure Memo Isolation**:
  - Created standalone `PastOrderItemCard` with strict custom `memo` comparator for Order History tab (`mountedOrdersTab === 2`), isolating every past order row from parent re-renders.
  - Added strict `memo` custom comparator on `OpenOrderItemCard` to freeze open order card rendering and prevent DOM-level layout re-calculations.
  - Reset `amountAnim.setValue(0)` and `totalAnim.setValue(0)` synchronously on order submit to eliminate 200ms JS-thread animation callback collisions with incoming order data.
  - Implemented universal `getStableId` handling MongoDB BSON/Object IDs (`item._id?.$oid`, `.toString()`) to eliminate duplicate key collision (`open_[object Object]`).
  - Implemented immutable `[...filtered].sort(...)` with defensive timestamps and deterministic `idB.localeCompare(idA)` tie-breaking across JS engines (Hermes / V8 / JSC).
  - Stabilized `userId = userData?.id` dependencies across fetch hooks to prevent parallel race conditions on wallet balance changes.
  - Guarded Redux `setOpenOrders`, `setPastOrders`, and `setTradeHistory` with `!isEqual(current, next)`.
- [x] **Order History Flicker / Fluctuate (Appear → Disappear → Appear) Fix**:
  - Synchronized `tradeType` param (`margin`/`cross`/`spot`) in `fetchSpotOrderHistoryTab` to prevent mismatched endpoint data overwriting Redux cache.
  - Guarded `setPastOrders` in `homeSlice.ts` and `setTradeHistory` in `walletSlice.ts` with `!isEqual(state, next)`.
  - Kept bottom history tab container permanently mounted by eliminating `{showSpotHistoryLoader ? <HistorySectionLoader /> : ...}` wrapper.
- [x] **Android Elevation Shadow Artifact**: Removed `elevation: 9999` from `CustomDropdown.js` and removed `elevation: 100` from `Spot.jsx` to eliminate dark vertical rectangle artifact across cards during scroll.
- [x] **Intermittent Order Book Clearing Fix**: Removed inadvertent `dispatch(setBuyOrders([]))` and `dispatch(setSellOrders([]))` from `useFocusEffect` blur cleanup in `Spot.jsx`. When returning to Spot, cached order book data is retained and instantly visible while socket feeds continue without clearing.
- [x] **Spot/Margin Navigation Lag Fix**:
  - Replaced lingering `useFocusEffect` in conditional child `MarginHistorySection.jsx` with `useEffect` to ensure polling timers are instantly cleaned up on unmount (`clearInterval`).
  - Switched whole-slice `useSelector(state => state.home)` in `MarginHistorySection.jsx` to specific field selectors to stop re-renders on every 800ms socket tick.
  - Memoized `MarginHistorySection` and `MarginBottomSection` with `React.memo`.
  - Decoupled `coinData` from margin effect dependency array in `Spot.jsx` via `coinDataRef`.
- [x] **Binance-Level Spot ↔ Margin Continuity & Native Order Type Modal**:
  - Maintained cached `buyOrders` and `sellOrders` during Spot ↔ Margin switching on the same coin pair (no skeleton/loading flash).
  - Converted Margin/Spot Order Type Sheet to native React Native `<Modal transparent animationType="slide">` positioned outside `ScrollView` for instant 0-lag opening, closing, and selection without JS-thread blocking.

---

## 4. Futures Trading Optimization (`FuturesTrade.jsx`)
- [x] **Futures Order Type & Leverage Sheets (Smooth Slide Fix)**:
  - Converted `Order Type Sheet` and `Adjust Leverage Sheet` in `FuturesTrade.jsx` from `RBSheet` to native React Native `<Modal animationType="slide">` located outside `<ScrollView>`.
  - Eliminated sheet opening/closing stutter, frame drops, and JS-thread parent component re-render interference.

---

## 5. Build & Release Verification
- [x] **Android Debug Build**: Verified successful compilation and running on device.
- [x] **Android Release Bundle**: `./gradlew assembleRelease` passed with **BUILD SUCCESSFUL**.
