import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { AppSafeAreaView, AppText, Toolbar, SEMI_BOLD, MEDIUM } from '../../shared';
import { colors } from '../../theme/colors';
import { universalPaddingHorizontalHigh, universalPaddingTop } from '../../theme/dimens';
import { appOperation } from '../../appOperation';
import Toast from 'react-native-simple-toast';
import { useTheme } from '../../hooks/useTheme';
import FastImage from 'react-native-fast-image';
import { down_arrow } from '../../helper/ImageAssets';
import ToggleSwitch from '../../common/ToggleSwitch';

// --- Default Data Structures ---
const SYSTEM_TOGGLES = [
  { id: "account", label: "Account Notifications" },
  { id: "asset", label: "Asset Management" },
  { id: "trade", label: "Trade" },
  { id: "earn", label: "Earn" },
  { id: "copy", label: "Copy Trading" },
  { id: "other", label: "Other" },
];

const EXTRA_SECTIONS = [
  { id: "activities", title: "Activities", keys: [{ id: "a1", label: "Activity summary" }, { id: "a2", label: "Device alerts" }] },
  { id: "newlyListed", title: "Newly Listed", keys: [{ id: "n1", label: "New listings" }, { id: "n2", label: "Listing reminders" }] },
  { id: "agcePay", title: "AGCE Pay", keys: [{ id: "p1", label: "Payment updates" }, { id: "p2", label: "Security alerts" }] },
  { id: "market", title: "Market Alerts", keys: [{ id: "m1", label: "Price alerts" }, { id: "m2", label: "Volatility" }] },
  { id: "moments", title: "Moments", keys: [{ id: "mo1", label: "Mentions" }, { id: "mo2", label: "Replies" }] },
  { id: "prediction", title: "Prediction", keys: [{ id: "pr1", label: "Prediction outcomes" }, { id: "pr2", label: "Market events" }] },
];

const UI_SYSTEM_TO_API: Record<string, string> = {
  account: "accountNotifications",
  asset: "assetManagement",
  trade: "trade",
  earn: "earn",
  copy: "copyTrading",
  other: "other",
};

const defaultAlertState = () => {
  const system = SYSTEM_TOGGLES.reduce((acc: any, { id }) => {
    acc[id] = true;
    return acc;
  }, {});
  const extras: any = {};
  EXTRA_SECTIONS.forEach((sec) => {
    extras[sec.id] = sec.keys.reduce((acc: any, k) => {
      acc[k.id] = true;
      return acc;
    }, {});
  });
  return { system, ...extras };
};

function truthyAlertFlag(v: any) {
  return v === true || v === 1 || v === "true" || v === "1";
}

function readApiAlertSubdoc(root: any, ...aliases: string[]) {
  if (!root || typeof root !== "object") return {};
  for (const a of aliases) {
    const o = root[a];
    if (o && typeof o === "object" && !Array.isArray(o)) return o;
  }
  return {};
}

function apiAlertChannelToUIPrefs(apiSlice: any) {
  const base = defaultAlertState();
  if (!apiSlice || typeof apiSlice !== "object") return base;

  const sn = apiSlice.systemNotifications;
  if (sn && typeof sn === "object") {
    SYSTEM_TOGGLES.forEach(({ id }) => {
      const ak = UI_SYSTEM_TO_API[id];
      base.system[id] = truthyAlertFlag(sn[ak]);
    });
  }

  const act = readApiAlertSubdoc(apiSlice, "activities");
  base.activities.a1 = truthyAlertFlag(act.activitySummary);
  base.activities.a2 = truthyAlertFlag(act.deviceAlert);

  const nl = readApiAlertSubdoc(apiSlice, "newListed", "newlyListed");
  base.newlyListed.n1 = truthyAlertFlag(nl.newListings);
  base.newlyListed.n2 = truthyAlertFlag(nl.listingReminder);

  const ag = readApiAlertSubdoc(apiSlice, "agcePlay", "agcePay");
  base.agcePay.p1 = truthyAlertFlag(ag.paymentUpdates);
  base.agcePay.p2 = truthyAlertFlag(ag.secirtyAlerts ?? ag.securityAlerts);

  const ma = readApiAlertSubdoc(apiSlice, "marketAlerts", "market");
  base.market.m1 = truthyAlertFlag(ma.priceAlerts);
  base.market.m2 = truthyAlertFlag(ma.volatility);

  const mom = readApiAlertSubdoc(apiSlice, "moments");
  base.moments.mo1 = truthyAlertFlag(mom.mentions);
  base.moments.mo2 = truthyAlertFlag(mom.replies);

  const pr = readApiAlertSubdoc(apiSlice, "prediction");
  base.prediction.pr1 = truthyAlertFlag(pr.predictionOutcomes);
  base.prediction.pr2 = truthyAlertFlag(pr.marketEvents);

  return base;
}

function mergeAlertChannel(patch: any) {
  const base = defaultAlertState();
  if (!patch || typeof patch !== "object") return base;
  const out = { ...base };
  Object.keys(base).forEach((k) => {
    if (typeof base[k] === "object" && base[k] !== null) {
      out[k] = { ...base[k], ...(patch[k] || {}) };
    }
  });
  return out;
}

function uiPrefsToApiAlertChannel(ui: any) {
  const u = mergeAlertChannel(ui);
  const sn: any = {};
  SYSTEM_TOGGLES.forEach(({ id }) => {
    sn[UI_SYSTEM_TO_API[id]] = !!u.system[id];
  });
  return {
    systemNotifications: sn,
    activities: {
      activitySummary: !!u.activities.a1,
      deviceAlert: !!u.activities.a2,
    },
    newListed: {
      newListings: !!u.newlyListed.n1,
      listingReminder: !!u.newlyListed.n2,
    },
    agcePlay: {
      paymentUpdates: !!u.agcePay.p1,
      secirtyAlerts: !!u.agcePay.p2,
    },
    marketAlerts: {
      priceAlerts: !!u.market.m1,
      volatility: !!u.market.m2,
    },
    moments: {
      mentions: !!u.moments.mo1,
      replies: !!u.moments.mo2,
    },
    prediction: {
      predictionOutcomes: !!u.prediction.pr1,
      marketEvents: !!u.prediction.pr2,
    },
  };
}

function alertSettingsPickData(res: any) {
  if (!res || typeof res !== "object") return null;
  let inner = res.data;
  if (!inner || typeof inner !== "object") return null;
  if (
    inner.data &&
    typeof inner.data === "object" &&
    inner.data.messages &&
    inner.data.email
  ) {
    inner = inner.data;
  }
  if (
    inner.messages &&
    inner.email &&
    typeof inner.messages === "object" &&
    typeof inner.email === "object" &&
    !Array.isArray(inner.messages) &&
    !Array.isArray(inner.email)
  ) {
    return { messages: inner.messages, email: inner.email };
  }
  return null;
}

// --- Component ---
const DirectMessageManagement = () => {
  const { colors: themeColors, isDark } = useTheme();
  const [tab, setTab] = useState<"message" | "email">("message");
  const [expanded, setExpanded] = useState<string>("system");
  const [hydrated, setHydrated] = useState(false);
  const [prefs, setPrefs] = useState({
    message: defaultAlertState(),
    email: defaultAlertState()
  });

  useEffect(() => {
    let cancelled = false;
    const fetchSettings = async () => {
      try {
        const res: any = await appOperation.customer.get_alert_settings_setting();
        if (cancelled) return;

        const pair = alertSettingsPickData(res);
        if (pair) {
          const merged = {
            message: mergeAlertChannel(apiAlertChannelToUIPrefs(pair.messages)),
            email: mergeAlertChannel(apiAlertChannelToUIPrefs(pair.email)),
          };
          setPrefs(merged);
        }
      } catch (err) {
        // Fallback to defaults
      } finally {
        if (!cancelled) setHydrated(true);
      }
    };
    fetchSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((next: any) => {
    setPrefs(next);

    const body = {
      messages: uiPrefsToApiAlertChannel(next.message),
      email: uiPrefsToApiAlertChannel(next.email),
    };

    appOperation.customer.update_alert_settings_setting(body)
      .then((res: any) => {
        if (res?.success === true || res?.success === 1) {
          Toast.showWithGravity(res?.message || "Alert settings saved.", Toast.SHORT, Toast.BOTTOM);
        } else if (res?.success === false || res?.success === 0) {
          Toast.showWithGravity(res?.message || "Could not save alert settings.", Toast.LONG, Toast.BOTTOM);
        }
      })
      .catch(() => {
        Toast.showWithGravity("Failed to save settings. Please try again.", Toast.LONG, Toast.BOTTOM);
      });
  }, []);

  const toggleSystem = (id: string) => {
    const next = {
      ...prefs,
      [tab]: {
        ...prefs[tab],
        system: { ...prefs[tab].system, [id]: !prefs[tab].system[id] },
      },
    };
    persist(next);
  };

  const toggleExtra = (sectionId: string, keyId: string) => {
    const next = {
      ...prefs,
      [tab]: {
        ...prefs[tab],
        [sectionId]: {
          ...prefs[tab][sectionId],
          [keyId]: !prefs[tab][sectionId][keyId],
        },
      },
    };
    persist(next);
  };

  const sections = [
    { id: "system", title: "System Notifications", keys: SYSTEM_TOGGLES },
    ...EXTRA_SECTIONS
  ];

  return (
    <AppSafeAreaView style={{ backgroundColor: colors.white }}>
      <Toolbar isSecond title="Alert Setting" style={{ width: "72%", backgroundColor: "transparent" }} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabButton, tab === "message" && styles.tabButtonActive]}
            onPress={() => setTab("message")}
          >
            <AppText weight={SEMI_BOLD} style={[styles.tabText, tab === "message" ? { color: colors.black } : { color: themeColors.secondaryText }]}>
              Messages
            </AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, tab === "email" && styles.tabButtonActive]}
            onPress={() => setTab("email")}
          >
            <AppText weight={SEMI_BOLD} style={[styles.tabText, tab === "email" ? { color: colors.black } : { color: themeColors.secondaryText }]}>
              Email
            </AppText>
          </TouchableOpacity>
        </View>

        {!hydrated ? (
          <ActivityIndicator size="large" color={colors.black} style={styles.loader} />
        ) : (
          <View style={styles.accordionContainer}>
            {sections.map((sec) => {
              const isOpen = expanded === sec.id;
              return (
                <View key={sec.id} style={styles.accordionItem}>
                  <TouchableOpacity
                    style={styles.accordionHeader}
                    onPress={() => setExpanded(isOpen ? "" : sec.id)}
                    activeOpacity={0.7}
                  >
                    <AppText weight={SEMI_BOLD} style={styles.accordionTitle}>
                      {sec.title}
                    </AppText>
                    <FastImage
                      source={down_arrow}
                      style={[
                        { width: 13, height: 13 },
                        isOpen && { transform: [{ rotate: '180deg' }] }
                      ]}
                      tintColor={themeColors.secondaryText}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>

                  {isOpen && (
                    <View style={styles.accordionBody}>
                      {sec.id === "system"
                        ? sec.keys.map((row) => (
                          <View key={row.id} style={styles.toggleRow}>
                            <AppText weight={MEDIUM} style={styles.toggleLabel}>{row.label}</AppText>
                            <ToggleSwitch
                              value={!!prefs[tab]?.system?.[row.id]}
                              onValueChange={() => toggleSystem(row.id)}
                              isDark={isDark}
                            />
                          </View>
                        ))
                        : sec.keys.map((row) => (
                          <View key={row.id} style={styles.toggleRow}>
                            <AppText weight={MEDIUM} style={styles.toggleLabel}>{row.label}</AppText>
                            <ToggleSwitch
                              value={!!prefs[tab]?.[sec.id as keyof typeof defaultAlertState]?.[row.id]}
                              onValueChange={() => toggleExtra(sec.id, row.id)}
                              isDark={isDark}
                            />
                          </View>
                        ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </AppSafeAreaView>
  );
};

export default DirectMessageManagement;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: universalPaddingHorizontalHigh,
    paddingTop: 10,
    paddingBottom: 40,
  },
  loader: {
    marginTop: 40,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.iconBgColor,
  },
  tabButton: {
    marginRight: 20,
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.black,
  },
  tabText: {
    fontSize: 16,
  },
  accordionContainer: {
    marginTop: 10,
  },
  accordionItem: {
    borderBottomWidth: 1,
    borderBottomColor: colors.iconBgColor,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  accordionTitle: {
    fontSize: 15,
    color: colors.black,
  },
  accordionBody: {
    paddingBottom: 15,
    paddingTop: 5,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  toggleLabel: {
    fontSize: 15,
    color: '#333333',
  },
});
