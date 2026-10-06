import React, { useEffect, useMemo, useRef, useState } from "react";
import { Modal, Pressable, StyleSheet, TouchableOpacity, View } from "react-native";
import { AppText, ELEVEN, MEDIUM, SEMI_BOLD, TEN, TWELVE } from "../../../common";
import { useTheme } from "../../../hooks/useTheme";

const RATE_COLOR = "#D1AA67";

function parseRate(raw) {
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function formatRatePct(rate, decimals = 5) {
  if (rate == null) return "—";
  return `${(rate * 100).toFixed(decimals)}%`;
}

function formatCapFloorPct(rate) {
  if (rate == null) return "—";
  return `${(rate * 100).toFixed(4)}%`;
}

function formatAnnualized(rate, intervalHours) {
  if (rate == null) return "—";
  const annualized = rate * (24 / intervalHours) * 365 * 100;
  return `${annualized.toFixed(2)}%`;
}

function parseNextFundingMs(raw) {
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n < 1e12 ? n * 1000 : n;
}

function formatCountdown(msLeft) {
  if (msLeft == null) return "--:--:--";
  const total = Math.max(0, Math.floor(msLeft / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((x) => String(x).padStart(2, "0")).join(":");
}

/** Own 1s timer, so the countdown re-renders only this component. */
function Countdown({ nextMs, active }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active || nextMs == null) return undefined;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active, nextMs]);

  return <AppText type={ELEVEN} weight={MEDIUM}>{formatCountdown(nextMs != null ? nextMs - now : null)}</AppText>;
}

const FUNDING_FIELDS = [
  "funding_rate",
  "next_funding_time",
  "funding_interval_hours",
  "funding_rate_cap",
  "funding_rate_floor",
];

/**
 * `futures:update` alternates between contract-list and selected-contract payloads, so the last
 * known funding values are held per symbol instead of read from the latest payload only.
 */
function useHeldFundingFields(pair, liveContract) {
  const symbol = pair?.symbol;
  const heldRef = useRef({ symbol: null, data: {} });

  return useMemo(() => {
    if (heldRef.current.symbol !== symbol) heldRef.current = { symbol, data: {} };
    const live = liveContract && (!liveContract.symbol || liveContract.symbol === symbol) ? liveContract : null;

    const held = heldRef.current.data;
    let next = held;
    for (const src of [pair, live]) {
      if (!src) continue;
      for (const field of FUNDING_FIELDS) {
        if (src[field] != null && src[field] !== next[field]) {
          if (next === held) next = { ...held };
          next[field] = src[field];
        }
      }
    }
    heldRef.current.data = next;
    return next;
  }, [symbol, pair, liveContract]);
}

/**
 * Funding rate + countdown with a details popup on tap
 * (web `futures_trade/FuturesFundingTicker.jsx` parity).
 */
function FuturesFundingTicker({ pair, liveContract, active = true }) {
  const { colors: themeColors, isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const contract = useHeldFundingFields(pair, liveContract);

  const intervalHours = Math.max(1, Number(contract?.funding_interval_hours) || 8);
  const rate = parseRate(contract?.funding_rate);
  const cap = parseRate(contract?.funding_rate_cap);
  const floor = parseRate(contract?.funding_rate_floor);
  const nextMs = parseNextFundingMs(contract?.next_funding_time);
  const longsPay = rate == null ? true : rate >= 0;

  const mutedColor = isDark ? "#848E9C" : "#707A8A";
  const valueColor = isDark ? "#EAECEF" : "#1E2329";

  return (
    <>
      <TouchableOpacity activeOpacity={0.7} onPress={() => setOpen(true)} hitSlop={{ top: 6, bottom: 6 }}>
        <AppText
          type={TEN}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
          style={[
            styles.label,
            { color: themeColors.text, textDecorationColor: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.28)" },
          ]}
        >
          Funding ({intervalHours}h) / Countdown
        </AppText>
        <AppText
          type={ELEVEN}
          weight={MEDIUM}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
          style={[styles.valueRow, styles.tabular, { color: themeColors.text }]}
        >
          <AppText type={ELEVEN} weight={MEDIUM} style={{ color: RATE_COLOR }}>
            {formatRatePct(rate)}
          </AppText>
          {" / "}
          <Countdown nextMs={nextMs} active={active} />
        </AppText>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable
            style={[
              styles.popup,
              {
                backgroundColor: isDark ? "#1E2329" : "#FFFFFF",
                borderColor: isDark ? "rgba(255,255,255,0.08)" : "#EAECEF",
              },
            ]}
          >
            <AppText type={TWELVE} weight={SEMI_BOLD} style={[styles.popupTitle, { color: valueColor }]}>
              Funding ({intervalHours}h) / Countdown
            </AppText>
            <AppText type={TWELVE} style={[styles.intro, { color: isDark ? "#B7BDC6" : "#707A8A" }]}>
              The payment rate exchanged between the long and short positions for the next funding. If the
              funding rate is positive, longs pay shorts. If negative, shorts pay longs.
            </AppText>

            <View style={styles.row}>
              <AppText type={TWELVE} style={[styles.key, { color: mutedColor }]}>Interval / Direction</AppText>
              <AppText type={TWELVE} style={[styles.val, { color: valueColor }]}>
                {intervalHours}h / {longsPay ? "Long Pays " : "Short Pays "}
                <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: RATE_COLOR }}>
                  {longsPay ? "Short" : "Long"}
                </AppText>
              </AppText>
            </View>
            <View style={styles.row}>
              <AppText type={TWELVE} style={[styles.key, { color: mutedColor }]}>Current Rate / Annualized</AppText>
              <AppText type={TWELVE} style={[styles.val, styles.tabular, { color: valueColor }]}>
                {formatRatePct(rate)} / {formatAnnualized(rate, intervalHours)}
              </AppText>
            </View>
            <View style={styles.row}>
              <AppText type={TWELVE} style={[styles.key, { color: mutedColor }]}>Funding Cap / Floor</AppText>
              <AppText type={TWELVE} style={[styles.val, styles.tabular, { color: valueColor }]}>
                {formatCapFloorPct(cap)} / {formatCapFloorPct(floor)}
              </AppText>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    opacity: 0.6,
    textDecorationLine: "underline",
    textDecorationStyle: "dotted",
  },
  valueRow: {
    marginTop: 3,
  },
  tabular: {
    fontVariant: ["tabular-nums"],
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  popup: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 6,
  },
  popupTitle: {
    marginBottom: 8,
  },
  intro: {
    lineHeight: 18,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 8,
  },
  key: {
    flexShrink: 1,
  },
  val: {
    textAlign: "right",
  },
});

export default React.memo(FuturesFundingTicker);
