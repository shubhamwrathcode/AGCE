# AGCE Development Tasks

## 1. Buy Crypto and Convert History
- Buy Crypto Layout and Web Parity in BuyCryptoScreen.jsx
  - Redesigned Convert interface matching web design with Spend and Receive cards, live rate calculations, and fee summary panel.
  - Fixed USDT and coin asset icons using tetherIcon with contain resize mode.
  - Implemented high-contrast active and inactive tab buttons for Dark and Light themes.
- Embedded Mode in Spot Trading
  - Embedded BuyCryptoScreen directly under SpotHeader in Spot.jsx when Buy Crypto tab is selected.
- Convert History Screen in ConvertHistoryScreen.jsx
  - Created standalone page ConvertHistoryScreen.jsx registered as CONVERT_HISTORY_SCREEN.
  - Implemented Status filters with equal uniform width for All, Buy, Sell, Executed, and Failed.
  - Implemented Time filters for All time, 7 days, 30 days, and 90 days with pull to refresh and pagination.
  - Built Convert Details bottom sheet with step progress, metadata, Reference ID copy, and re-order action.
  - Fixed back navigation to return directly to Trade tab with Buy Crypto selected.
- Spot Available Balance and Limits
  - Dynamic Spot wallet balance fetching for Buy AED and Sell Crypto with auto-refetch on coin switch.
  - Integrated MAX quick-fill button on Sell side.
  - Aligned ticket limit visibility to web parity.

## 2. Wallet Deposit and Withdraw Choice Sheets and Fiat Deposit
- Deposit and Withdraw Choice Sheets in DepositChoiceSheet.jsx and WithdrawChoiceSheet.jsx
  - Implemented slide-up sheets for wallet quick actions across Overview, Spot, Main, and Coin Detail sheets.
  - Provided dual options for Deposit Crypto or Withdraw Crypto and Deposit Fiat or Withdraw Fiat.
  - Styled with TradingDataModal dark theme colors.
- Deposit Fiat Screen in DepositFiatScreen.jsx
  - Created standalone DepositFiatScreen.jsx with full parity to web.
  - Added header history icon button routing directly to DepositFiatHistoryScreen.
  - Added Fiat Gateway Hero with 3 value props and web SVG icons.
  - Added Virtual Account Card showing Account Name, Bank, Account Number, and IBAN with copy icon and deposit instructions.
  - Added Create Bank Account Card showing AED currency box, UAE flag SVG, Bank Transfer method card, and action button.
  - Added KYC verification check prompting KYC modal if not verified.
  - Added 4-step How to deposit Fiat horizontal scroll cards.
- Deposit Fiat History Screen in DepositFiatHistoryScreen.jsx
  - Created dedicated screen registered as DEPOSIT_FIAT_HISTORY_SCREEN.
  - Added Time filters for All time, 7 days, 30 days, and 90 days with equal width tabs.
  - Added Status filter pills with uniform equal width for All, Completed, In review, Refund pending, Refunded, and Failed.
  - Added Pull to refresh, empty states, and interactive transaction detail bottom sheet.

## 3. Fiat Withdrawal Feature
- API Services Layer in appOperation
  - Added fiat_whitelist_list, fiat_whitelist_create, fiat_whitelist_verify, fiat_whitelist_resend_otp, fiat_whitelist_delete.
  - Added fiat_withdrawals_preview, fiat_withdrawals_submit, fiat_withdrawals_list, fiat_withdrawals_detail, fiat_withdrawals_cancel.
- Withdraw Fiat Main Screen in WithdrawFiatScreen.jsx
  - Added header back button, title, and history icon leading to WithdrawFiatHistoryScreen.
  - Added Hero Banner with 3 value props and web SVG icons.
  - Added Spot AED available balance with MAX button, Daily remaining tracking, and transaction limits.
  - Added Beneficiary bank card displaying masked IBAN, Bank name, and Verified status.
  - Added Add Bank Account and Email OTP verification bottom sheets with 60s resend timer.
  - Added real-time fee and net payout preview quote.
  - Added 2FA security verification sheet for Email OTP and Fund password before submission.
  - Added 4-step How to withdraw Fiat horizontal scroll cards.
- Withdraw Fiat History Screen in WithdrawFiatHistoryScreen.jsx
  - Added equal width Time filters for All time, 7 days, 30 days, and 90 days.
  - Added uniform Status filter pills for All, Under review, Submitted, Sent to bank, Completed, Rejected, Cancelled, and Failed.
  - Added transaction cards with timestamp, Amount, Fee, Destination Bank, and status badge.
  - Added Review action opening Transaction Details sheet with copy action.
  - Added Cancel action for pending withdrawals.
  - Added full Dark and Light theme compatibility.
