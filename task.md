# AGCE Development Tasks



### 1. Cross margin — Margin Level + risk
- Cross trade page pe `GET /v1/cross/risk` poll (~5s) + wallet/balance refresh ke baad risk refresh.
- Cross-specific risk **sheet** (isolated modal reuse nahi); drag-to-close hataaya taaki scroll flicker / accidental close na ho.
- ML gauge UI: compact arc + (i), Buy/Sell ke upar, halki border, chart se 5px gap.
- Order book height **7 rows** pe lock — trade panel alignment ke liye.

### 2. Cross Positions — Maint. Margin
- Size tab pe web jaisa **Maint. Margin** value (pehle dash aa raha tha).

### 3. Isolated margin — ML + risk + Size tab
- Isolated ML green pill + (i) → isolated risk sheet (`margin/account/:pairId`); Cross gauge Isolated pe nahi.
- Size tab label **Maint. Margin** (web jaisa) + card alignment fix.
- Isolated ≠ Cross risk APIs alag rakhe.

### 4. Isolated + Cross — Market Close confirm + single press
- Close pe pehle Yes/No confirm; **Yes** pe hi API.
- Isolated settle sheet (web: Close Position + Holding/Notional); Cross Market/Limit sheet + confirm.
- In-flight lock: ek position pe 3–4 tap se multiple close nahi. Isolated, Cross trade, Futures close, wallet Cross sheet.

### 5. Futures — Close Position modal
- Web-like sheet: Market/Limit, %, Holding + Est. value; Close bottom pe pin.
- Full close → `close_position: true`; partial → `quantity` + `reduce_only: true`.
- Yes/No + lock until response. First Yes pe “Closing…” dikh ke close na hone wala bug fix.

### 6. Futures — TP/SL (Buy/Sell tab)
- App web **mobile** follow: ek Buy/Sell tab + ek button (desktop dual buttons nahi).
- Short TP/SL Buy panel se bhi sahi side pe jaaye.

### 7. Futures — Position History + detail
- Liq. Fee: liquidated **and** `liq_fee > 0` pe show (max 8 decimals), warna `—`.
- Open position detail: Size, Entry, Mark, Liq. Price, Margin, PNL, Opened Time, Status. Closed Time / Exit / Liq. Fee open pe `—`.
- History detail: Closed/Opened Time, Exit, Realized PNL, Liq. Fee. Payload `liq_fee` drop na ho (module store).
- Qty/price/PnL/fee/margin/ROE max **8 decimals**, trailing zeros trim.

### 8. Isolated — Position History (Spot Size / history)
- `GET margin/positions/history` all pairs (pair-only nahi).
- Status Liquidated vs Close All (`close_reason`). Liq. Fee same rule; pair from `pos.pair`.

### 9. Isolated + Cross — false “Minimum 5 USDT” error
- Qty snap `step_size` pe **bina float drift** (`0.00007` → `0.00006` nahi).
- Total / quote USDT → base qty **ceil to step**.
- Min notional: USDT mode pe entered USDT; warna `price × snapped qty`. Price parse se commas strip.
- Retest: `77332.2 × 0.00007` (Total `5.4`) pe 5 USDT error nahi.

### 10. Profile drawer — RN Text warning
- Theme toggle `TouchableOpacity` ke andar extra space hataaya (`Text strings must be rendered within a <Text> component` on focus).
