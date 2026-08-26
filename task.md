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
- [x] **Staking Purchase Screen Fields**: Applied `darkTheme.darkThemeInputColor` / `darkTheme.lightthemeinputcolor` across all input and info cards (Amount input, Est. APR card, Est. Daily Return card, Early Withdrawal Penalty card, and Staking Overview RBSheet card) in `StakingPurchase.tsx`.

---

## 3. Spot Trading & Performance Optimization
- [x] **Android Fabric Crash Fix**: Fixed `java.lang.NullPointerException: Attempt to invoke interface method 'java.lang.Object[] android.text.Spannable.getSpans'` by adding `{props.children ?? ""}` fallback in `AppText.tsx` and guarding `toFixedEight` in `utility.ts`.
- [x] **Cancel Order Modal Optimization**: Replaced heavy JS `ReactNativeModal` with native React Native `<Modal transparent animationType="fade">` in `Spot.jsx` for instant 0-lag opening and closing.
- [x] **Spot Order Placement Silent Insertion (Flicker Fix)**:
  - Removed Android experimental layout animation.
  - Converted open order cards into memoized `OpenOrderItemCard`.
  - Bound `openOrderKeyExtractor` to stable database IDs (`open_${id}`).
  - Guarded Redux `setOpenOrders` with `!isEqual(state.spotOpenOrders, next)` in `homeSlice.ts`.
  - Kept bottom history tab container permanently mounted by eliminating `{showSpotHistoryLoader ? <HistorySectionLoader /> : ...}` wrapper in `Spot.jsx`.
- [x] **Android Elevation Shadow Artifact**: Removed `elevation: 9999` from `CustomDropdown.js` and removed `elevation: 100` from `Spot.jsx` to eliminate dark vertical rectangle artifact across cards during scroll.
- [x] **Intermittent Order Book Clearing Fix**: Removed inadvertent `dispatch(setBuyOrders([]))` and `dispatch(setSellOrders([]))` from `useFocusEffect` blur cleanup in `Spot.jsx`. When returning to Spot, cached order book data is retained and instantly visible while socket feeds continue without clearing.
- [x] **Spot/Margin Navigation Lag Fix**:
  - Replaced lingering `useFocusEffect` in conditional child `MarginHistorySection.jsx` with `useEffect` to ensure polling timers are instantly cleaned up on unmount (`clearInterval`).
  - Switched whole-slice `useSelector(state => state.home)` in `MarginHistorySection.jsx` to specific field selectors to stop re-renders on every 800ms socket tick.
  - Memoized `MarginHistorySection` and `MarginBottomSection` with `React.memo`.
  - Decoupled `coinData` from margin effect dependency array in `Spot.jsx` via `coinDataRef`.

---

## 4. Build & Release Verification
- [x] **Android Debug Build**: Verified successful compilation and running on device.
- [x] **Android Release Bundle**: `./gradlew assembleRelease` passed with **BUILD SUCCESSFUL**.
