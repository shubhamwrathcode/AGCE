# Work Log — 6 Oct 2026

All work below is done in the AGCE app for both **Android and iOS** (same React Native code).
The latest Android build **v26 (26.0.0, versionCode 26)** is uploaded to the **Play Store**.

---

## 1. Futures Trade — Funding rate / Countdown (same as website)

**Requirement:** Show the website's "Funding (8h) / Countdown" in the app.

**Done:**
- New component `src/screens/Futures/components/FuturesFundingTicker.jsx` (copy of the website's `FuturesFundingTicker.jsx`).
- Shown on the **Futures Trade screen, above the order book**.
- Shows the funding rate (gold colour) and a live countdown to the next funding (`HH:MM:SS`, updates every second).
- `8h` comes from the contract's `funding_interval_hours`.
- Tap opens a details popup (same text as the website):
  - Interval / Direction (Long pays Short or Short pays Long)
  - Current Rate / Annualized
  - Funding Cap / Floor
- Data comes from the futures pair list and live socket `contract`. Last known values are kept per pair, so the value does not flicker to "—" between socket updates.
- Text always stays on one line. On small phones or large system fonts it shrinks a little instead of wrapping or getting cut.
- Performance: the 1-second timer re-renders only the countdown text, not the whole screen, and stops when the screen is not visible.

---

## 2. Futures order form — website changes brought to the app

The website fixed the futures order form today. The same changes are now in the app, with the same formulas.

**a) Taker fee bug (`src/helper/futuresUtils.js`)**
- Socket `taker_fee_rate` is a percent (0.058 = 0.058%). The app was using it directly in the formula as 0.058.
- Now it is divided by 100 (0.00058), same as the website.
- **Max** and the **25/50/75/100% slider** are now correct.
- Example (11.97 USDT, 10x): Max was ~75.80 USDT → now **119.07 USDT** (same as website).

**b) Place-order margin check (`FuturesTrade.jsx`)**
- Now uses the website formula: `required = notional × (1/leverage + fee)`.
- Earlier, bigger orders were wrongly blocked with "Insufficient margin".
- Still skipped for reduce-only and close orders.

**c) Margin row (below Available)**
- Was hardcoded `0.00 / 0.00 USDT`.
- Now shows `(Max − Available) / Max USDT`. Example: `107.09 / 119.07 USDT`.
- Logged out: `-- / -- USDT`. Always in USDT, even when the amount unit is BTC.

**d) Fee rate label (new)**
- Added below Cost / Max: `Fee rate — Maker 0.025% / Taker 0.058%`.
- Shown as the socket sends it (no × 100), same as the website.

**e) Available balance**
- Now uses socket `effective_available` first, then `available_balance` (same as website).
- Available, Max, slider, Margin, order check and leverage modal all use this one value.

**Verified:** with the website's example numbers, the app gives Max 119.07 and Margin 107.09 / 119.07. On a real account (2.04189 USDT, 61x) the app shows Margin 118.26 / 120.30, which matches the website formula.

---

## 3. Futures order book — more rows

- Order book now shows **7 rows on each side** (was 6): 7 sell + 7 buy.
- Single-side view (layout button) shows 14 rows (was 12).
- Row count, list height and loading skeleton now all come from one constant (`ORDER_BOOK_VISIBLE_ROWS`), so it can be changed in one place.

---

## 4. Release

- All the above changes are done for **Android and iOS**.
- Latest Android build **v26 (26.0.0)** uploaded to the **Play Store**.
