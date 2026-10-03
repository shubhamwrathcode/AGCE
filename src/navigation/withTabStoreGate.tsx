import * as React from "react";
import { Provider, ReactReduxContext } from "react-redux";
import { useNavigationState } from "@react-navigation/native";
import type { Store } from "redux";
import { isDispatchingLiveMarketTick, withLiveFieldsFrom } from "../store/liveMarketActions";
import { LiveUpdatesPausedContext } from "../services/socket/socketLiveStore";

/**
 * Store facade for one tab. While the tab is not visible it holds back live market ticks
 * (other actions still flow through in batches, with live fields kept at their held values), so
 * hidden tabs stop re-rendering several times a second. On becoming visible it publishes the
 * latest state in a layout effect, so the first painted frame is current.
 *
 * Suspense-based freezing (react-freeze / freezeOnBlur) is deliberately not used: with
 * Fabric + React 19.0 it re-clones every hidden host view on each commit and locked the
 * JS thread in this app.
 */
const HIDDEN_UPDATE_BATCH_MS = 1000;

function createGatedStore(store: Store) {
  let active = true;
  let stale = false;
  let snapshot = store.getState();
  let lastSeen = snapshot;
  let hiddenFlushTimer: ReturnType<typeof setTimeout> | null = null;
  const listeners = new Set<() => void>();

  const notify = () => listeners.forEach((listener) => listener());

  const cancelHiddenFlush = () => {
    if (hiddenFlushTimer == null) return;
    clearTimeout(hiddenFlushTimer);
    hiddenFlushTimer = null;
  };

  const publish = () => {
    cancelHiddenFlush();
    snapshot = store.getState();
    lastSeen = snapshot;
    stale = false;
    notify();
  };

  // A hidden tab gets non-live updates (API responses etc.) in one batch per window instead of
  // one render per response; a burst of wallet/portfolio responses would otherwise keep the JS
  // thread busy right when the user taps another tab.
  const scheduleHiddenFlush = () => {
    if (hiddenFlushTimer != null) return;
    hiddenFlushTimer = setTimeout(() => {
      hiddenFlushTimer = null;
      if (active) return;
      snapshot = withLiveFieldsFrom(store.getState(), snapshot);
      notify();
    }, HIDDEN_UPDATE_BATCH_MS);
  };

  const onStoreChange = () => {
    const state = store.getState();
    if (state === lastSeen) return;
    lastSeen = state;
    if (active) {
      publish();
    } else if (isDispatchingLiveMarketTick()) {
      stale = true;
    } else {
      scheduleHiddenFlush();
    }
  };

  const gated: Store = {
    ...store,
    getState: () => snapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };

  return {
    gated,
    connect: () => {
      if (snapshot !== store.getState()) publish();
      const unsubscribe = store.subscribe(onStoreChange);
      return () => {
        unsubscribe();
        cancelHiddenFlush();
      };
    },
    setActive: (next: boolean) => {
      active = next;
      if (active && (stale || hiddenFlushTimer != null)) publish();
    },
  };
}

function useIsParentFocused(navigation: any) {
  const parent = navigation.getParent?.();
  const [focused, setFocused] = React.useState<boolean>(() => parent?.isFocused?.() ?? true);

  React.useEffect(() => {
    if (!parent) return undefined;
    setFocused(parent.isFocused());
    const offFocus = parent.addListener("focus", () => setFocused(true));
    const offBlur = parent.addListener("blur", () => setFocused(false));
    return () => {
      offFocus();
      offBlur();
    };
  }, [parent]);

  return focused;
}

type TabScreenProps = { route: { key: string }; navigation: any };

function TabStoreGate({ route, navigation, children }: TabScreenProps & { children: React.ReactNode }) {
  const { store } = React.useContext(ReactReduxContext);
  // Selected tab is read from navigator state so activation happens in the same commit as the switch.
  const isSelected = useNavigationState((state) => state.routes[state.index]?.key === route.key);
  const isParentFocused = useIsParentFocused(navigation);
  const isActive = isSelected && isParentFocused;

  const [gate] = React.useState(() => createGatedStore(store));

  React.useLayoutEffect(() => {
    gate.setActive(isActive);
  }, [gate, isActive]);

  React.useEffect(() => gate.connect(), [gate]);

  return (
    <LiveUpdatesPausedContext.Provider value={!isActive}>
      <Provider store={gate.gated}>{children}</Provider>
    </LiveUpdatesPausedContext.Provider>
  );
}

export function withTabStoreGate<P extends TabScreenProps>(Screen: React.ComponentType<P>) {
  function GatedTabScreen(props: P) {
    return (
      <TabStoreGate route={props.route} navigation={props.navigation}>
        <Screen {...props} />
      </TabStoreGate>
    );
  }
  GatedTabScreen.displayName = `withTabStoreGate(${Screen.displayName || Screen.name || "Screen"})`;
  return GatedTabScreen;
}
