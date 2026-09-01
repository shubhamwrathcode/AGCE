# AGCE Development Tasks

### 1. Fiat Deposit & Help Integration
- Developed standalone Deposit Fiat screen with web parity, Virtual IBAN account details, and one-tap copy actions.
- Added Deposit Fiat Help bottom sheet with accordion FAQ questions and guidance.
- Added cross-navigation link in the FAQ sheet to easily switch to Crypto Deposit.
- Integrated KYC verification modal check for unverified users before allowing virtual account creation.

### 2. Fiat Withdrawal Feature & Security Verification
- Built end-to-end Fiat Withdrawal flow with live AED wallet balance, daily limits tracking, and real-time fee quote preview.
- Implemented UAE bank account addition and email OTP verification for whitelist management.
- Integrated multi-channel 2FA security verification (Email OTP, SMS OTP, Authenticator, and Fund Password) before submitting withdrawal requests.
- Added Withdraw Fiat Help bottom sheet with FAQ guidance and a quick link to Crypto Withdrawal.

### 3. Crypto Deposit & Withdrawal FAQ Enhancements
- Updated Crypto Deposit FAQ sheet with a bottom note and quick link to Deposit Fiat (AED).
- Updated Crypto Withdrawal FAQ sheet with a bottom note and quick link to Withdraw Fiat (AED).
- Optimized bottom sheet heights and scroll containers to prevent content cutoff when expanding FAQ items.

### 4. Direct File Download Module
- Built an Android native download module (FileDownloadModule) registered in MainApplication.
- Enabled direct saving of statement CSV files to the device Downloads folder with system download notifications.
- Replaced the native share sheet dialog with a smooth, direct download experience matching web behavior.

### 5. Deposit & Withdrawal History Parity
- Redesigned Fiat Deposit and Withdrawal History screens to achieve full parity with the web platform.
- Implemented Time filter dropdown (All time, 7d, 30d, 90d) and Status filter dropdown with bottom sheet selectors.
- Added Export Excel button that generates and downloads CSV statements directly to storage, automatically disabling when no records are present.
- Updated deposit history list items into a clean 3-row layout displaying Date & Status, Amount, Masked Sender IBAN, and Wallet.
- Maintained interactive detail sheets for viewing full transaction metadata and references.

### 6. Universal Deposit & Withdraw Choice Sheets
- Connected Deposit and Withdrawal actions in the Profile Drawer to open dual-option choice sheets (Crypto / Fiat).
- Connected the Estimated Balance card Deposit button on the Home screen to open the Deposit Choice Sheet.
