import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import FastImage from 'react-native-fast-image';
import { useRoute } from '@react-navigation/native';
import { AppSafeAreaView, AppText, SEMI_BOLD, TWELVE, TEN, FOURTEEN, FIFTEEN, Button, ELEVEN } from '../../shared';
import { useTheme } from '../../hooks/useTheme';
import { back_ic, copyIcon, externalLinkIcon } from '../../helper/ImageAssets';
import NavigationService from '../../navigation/NavigationService';
import { colors } from '../../theme/colors';
import { copyText } from '../../helper/utility';
import moment from 'moment';
import { CREATE_TICKET_SCREEN, DEPOSIT_COIN_SCREEN, DEPOSIT_SCREEN } from '../../navigation/routes';

type RouteParams = {
  row?: any;
};

const statusTone = (label: string) => {
  const t = String(label || '').toLowerCase();
  if (!t || t === '—') return 'neutral';
  if (/(completed|confirmed|success|credited|done|approve|approved)/i.test(t)) return 'success';
  if (/(pending|processing|confirming|queued|wait)/i.test(t)) return 'pending';
  if (/(fail|failed|reject|rejected|cancel|error|expired)/i.test(t)) return 'danger';
  return 'info';
};

const truncateMid = (s: any, headLen = 10, tailLen = 6) => {
  if (s == null || s === '' || s === '—') return '—';
  const str = String(s);
  if (str.length <= headLen + tailLen + 1) return str;
  return `${str.slice(0, headLen)}…${str.slice(-tailLen)}`;
};

const pickExplorerHref = (raw: any): string | null => {
  if (raw == null) return null;
  const s = typeof raw === 'string' ? raw.trim() : String(raw).trim();
  return s || null;
};

const resolveExplorerUrl = (explorer: any, kind: 'address' | 'tx', value: string) => {
  const ex = explorer && typeof explorer === 'object' ? explorer : {};
  const tpl =
    kind === 'address'
      ? pickExplorerHref(ex.address) || pickExplorerHref(ex.address_url) || pickExplorerHref(ex.account)
      : pickExplorerHref(ex.tx) ||
        pickExplorerHref(ex.transaction) ||
        pickExplorerHref(ex.tx_hash_url) ||
        pickExplorerHref(ex.txUrl);
  if (!tpl || !value || value === '—') return null;
  if (/\{address\}/i.test(tpl) && kind === 'address') return tpl.replace(/\{address\}/gi, encodeURIComponent(value));
  if ((/\{txid\}/i.test(tpl) || /\{txhash\}/i.test(tpl)) && kind === 'tx') {
    return tpl.replace(/\{txid\}/gi, encodeURIComponent(value)).replace(/\{txhash\}/gi, encodeURIComponent(value));
  }
  return tpl;
};

const buildSteps = (tone: string, time: string, status: string) => {
  if (tone === 'danger') {
    return [
      { title: 'Deposit recorded', time, emphasized: false, subtitle: '' },
      { title: status !== '—' ? status : 'Deposit unsuccessful', time, emphasized: true, subtitle: '' },
    ];
  }
  if (tone === 'success') {
    return [
      { title: 'Deposit received', time, emphasized: false, subtitle: '' },
      { title: status !== '—' ? status : 'Credited', time, emphasized: true, subtitle: '' },
    ];
  }
  return [
    { title: 'Deposit submitted', time, emphasized: false, subtitle: '' },
    {
      title: status !== '—' ? status : 'Processing',
      time,
      emphasized: true,
      subtitle: 'You will receive an email when this deposit completes.',
    },
  ];
};

export default function DepositHistoryDetailScreen() {
  const route = useRoute();
  const { colors: themeColors, isDark } = useTheme();
  const row = ((route?.params as RouteParams) || {})?.row ?? {};

  const statusLabel = String(row?.statusLabel || row?.action || row?.status || '—');
  const tone = statusTone(statusLabel);
  const dateStr = row?.date || (row?.createdAt ? moment(row.createdAt).format('DD/MM/YYYY, HH:mm:ss') : '—');
  const steps = useMemo(() => buildSteps(tone, dateStr, statusLabel), [tone, dateStr, statusLabel]);

  const networkPretty =
    row?.chain_full_name && row.chain_full_name !== '—' ? row.chain_full_name : row?.network || row?.chain || '—';

  const addrFull = row?.address && row.address !== '—' ? String(row.address) : '—';
  const txFull = row?.txid && row.txid !== '—' ? String(row.txid) : '—';
  const addressHref = resolveExplorerUrl(row?.explorer, 'address', addrFull);
  const txHref = resolveExplorerUrl(row?.explorer, 'tx', txFull);

  const statusColor =
    tone === 'success' ? '#16A34A' : tone === 'danger' ? '#DC2626' : tone === 'pending' ? '#B45309' : themeColors.text;
  const stepAccent =
    tone === 'success' ? '#16A34A' : tone === 'danger' ? '#DC2626' : tone === 'pending' ? '#B45309' : '#64748B';
  const stepAccentSoft =
    tone === 'success'
      ? 'rgba(22, 163, 74, 0.22)'
      : tone === 'danger'
        ? 'rgba(220, 38, 38, 0.22)'
        : tone === 'pending'
          ? 'rgba(180, 83, 9, 0.22)'
          : 'rgba(100, 116, 139, 0.22)';

  const onDepositAgain = () => {
    NavigationService.navigate(DEPOSIT_COIN_SCREEN);
  };

  const onOpenUrl = async (url: string | null) => {
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch {
      /* ignore */
    }
  };

  const Row = ({ label, value, right }: { label: string; value: React.ReactNode; right?: React.ReactNode }) => (
    <View style={[styles.row, { borderBottomColor: isDark ? themeColors.border : '#EEE' }]}>
      <AppText type={TWELVE} style={{ color: themeColors.secondaryText }}>
        {label}
      </AppText>
      <View style={styles.rowRight}>
        {typeof value === 'string' ? (
          <AppText type={TWELVE} style={{ color: themeColors.text }}>
            {value}
          </AppText>
        ) : (
          value
        )}
        {right ? <View style={styles.rowActions}>{right}</View> : null}
      </View>
    </View>
  );

  return (
    <AppSafeAreaView style={{ flex: 1, backgroundColor: themeColors.background }}>
      <View style={[styles.header, { borderBottomColor: isDark ? themeColors.border : '#EEE' }]}>
        <TouchableOpacity
          onPress={() => NavigationService.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <FastImage source={back_ic} style={{ width: 18, height: 18 }} resizeMode="contain" tintColor={themeColors.text} />
        </TouchableOpacity>
        <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text }}>
          Deposit Details
        </AppText>
        <View style={{ width: 18, height: 18 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.stepper}>
          {steps.map((s: any, idx: number) => {
            const isLast = idx === steps.length - 1;
            const isCompleted = tone === 'success';
            const showHighlight = isCompleted && isLast;
            return (
              <View key={idx} style={styles.stepRow}>
              <View style={styles.stepTrack}>
                <View style={[styles.stepDot, isCompleted && { backgroundColor: stepAccent }]} />
                {idx < steps.length - 1 ? (
                  <View style={[styles.stepLine, isCompleted && { backgroundColor: stepAccent }]} />
                ) : null}
              </View>
              <View style={{ flex: 1 }}>
                <AppText
                  type={TWELVE}
                  weight={s.emphasized ? SEMI_BOLD : undefined}
                  style={{ color: showHighlight ? stepAccent : themeColors.text }}
                >
                  {s.title}
                </AppText>
                {s.subtitle ? (
                  <AppText type={TEN} style={{ color: themeColors.secondaryText, marginTop: 6 }}>
                    {s.subtitle}
                  </AppText>
                ) : null}
                <AppText type={TEN} style={{ color: themeColors.secondaryText, marginTop: 6 }}>
                  {s.time}
                </AppText>
              </View>
              </View>
            );
          })}
        </View>

        {tone === 'danger' ? (
          <AppText type={TEN} style={[styles.note, { color: themeColors.secondaryText }]}>
            This deposit did not complete as expected. If funds left your external wallet, contact support with this reference.
          </AppText>
        ) : tone === 'success' ? (
          <AppText type={TEN} style={[styles.note, { color: themeColors.secondaryText }]}>
            Your deposit has been credited. Balances may take a moment to update everywhere.
          </AppText>
        ) : (
          <AppText type={TEN} style={[styles.note, { color: themeColors.secondaryText }]}>
            Please note that you will receive an email once this deposit is confirmed.
          </AppText>
        )}

        <TouchableOpacity onPress={() => NavigationService.navigate(CREATE_TICKET_SCREEN)} style={styles.linkRow}>
          <AppText type={ELEVEN} weight={SEMI_BOLD} style={{ color: colors.orangeTheme }}>
            Report Scam
          </AppText>
        </TouchableOpacity>

        <View style={[styles.card, { borderColor: isDark ? themeColors.border : '#EEE' }]}>
          <Row
            label="Status"
            value={
              <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: statusColor }}>
                {statusLabel}
              </AppText>
            }
          />
          <Row label="Date" value={dateStr} />
          <Row label="Deposit wallet" value={row?.depositWallet || 'Main Wallet'} />
          <Row
            label="Coin"
            value={
              <View style={styles.coinRow}>
                <View style={[styles.coinIcon, { borderColor: isDark ? themeColors.border : '#E5E7EB' }]}>
                  <AppText type={TEN} weight={SEMI_BOLD} style={{ color: themeColors.text }}>
                    {String(row?.short_name || '—').slice(0, 2)}
                  </AppText>
                </View>
                <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: themeColors.text }}>
                  {row?.short_name || '—'}
                </AppText>
              </View>
            }
          />
          <Row label="Amount" value={`${row?.net_amount || row?.amount || '—'} ${row?.short_name || ''}`.trim()} />
          <Row label="Network" value={networkPretty} />
          <Row
            label="Address"
            value={
              <AppText type={TWELVE} style={{ color: themeColors.text }}>
                {row?.addressShort || truncateMid(addrFull)}
              </AppText>
            }
            right={
              <>
                <TouchableOpacity
                  onPress={() => (addrFull && addrFull !== '—' ? copyText(addrFull) : undefined)}
                  disabled={!addrFull || addrFull === '—'}
                  style={styles.iconBtn}
                >
                  <FastImage source={copyIcon} style={styles.icon} resizeMode="contain" tintColor={themeColors.secondaryText} />
                </TouchableOpacity>
                {addressHref ? (
                  <TouchableOpacity onPress={() => onOpenUrl(addressHref)} style={styles.iconBtn}>
                    <FastImage
                      source={externalLinkIcon}
                      style={styles.icon}
                      resizeMode="contain"
                      tintColor={themeColors.secondaryText}
                    />
                  </TouchableOpacity>
                ) : null}
              </>
            }
          />
          <Row
            label="TxID"
            value={
              <AppText type={TWELVE} style={{ color: themeColors.text }}>
                {row?.txidShort || truncateMid(txFull)}
              </AppText>
            }
            right={
              <>
                <TouchableOpacity
                  onPress={() => (txFull && txFull !== '—' ? copyText(txFull) : undefined)}
                  disabled={!txFull || txFull === '—'}
                  style={styles.iconBtn}
                >
                  <FastImage source={copyIcon} style={styles.icon} resizeMode="contain" tintColor={themeColors.secondaryText} />
                </TouchableOpacity>
                {txHref ? (
                  <TouchableOpacity onPress={() => onOpenUrl(txHref)} style={styles.iconBtn}>
                    <FastImage
                      source={externalLinkIcon}
                      style={styles.icon}
                      resizeMode="contain"
                      tintColor={themeColors.secondaryText}
                    />
                  </TouchableOpacity>
                ) : null}
              </>
            }
          />
        </View>

        <TouchableOpacity onPress={() => NavigationService.navigate(CREATE_TICKET_SCREEN)} style={styles.chatRow}>
          <AppText type={TWELVE} style={{ color: colors.orangeTheme }}>
            Need help? Chat with us
          </AppText>
        </TouchableOpacity>

        <Button children="Deposit Again" onPress={onDepositAgain} containerStyle={styles.depositAgainBtn} />
      </ScrollView>
    </AppSafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 52,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  stepper: {
    marginTop: 6,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepTrack: {
    width: 18,
    alignItems: 'center',
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
  },
  stepLine: {
    width: 2,
    height: 40,
    backgroundColor: '#C7F9E9',
  },
  note: {
    lineHeight: 18,
    marginTop:10
  },
  linkRow: {
    paddingVertical: 5,
  },
  card: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    maxWidth: '66%',
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
  },
  icon: {
    width: 14,
    height: 14,
  },
  coinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  coinIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
  },
  chatRow: {
    marginTop: 14,
    alignItems: 'center',
  },
  depositAgainBtn: {
    marginTop: 14,
    borderRadius: 999,
  },
});

