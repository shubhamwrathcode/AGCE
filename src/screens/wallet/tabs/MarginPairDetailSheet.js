import React, { forwardRef } from "react";
import { View, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import FastImage from "react-native-fast-image";
import RBSheet from "react-native-raw-bottom-sheet";
import { AppText, BOLD, DISCLAIMTEXT, FOURTEEN, SEMI_BOLD, SIXTEEN, TWENTY_SIX } from "../../../shared";
import { colors } from "../../../theme/colors";
import NavigationService from "../../../navigation/NavigationService";
import { MARGIN_BORROW_REPAY_SCREEN, MARGIN_TRANSFER_SCREEN, TRADE_SCREEN } from "../../../navigation/routes";
import { close_ic } from "../../../helper/ImageAssets";

const MarginPairDetailSheet = forwardRef(({ theme, themeColors, selectedPair, buildCoinIconUri }, ref) => {
  return (
    <RBSheet
      ref={ref}
      height={550}
      openDuration={250}
      customStyles={{
        container: {
          backgroundColor: theme === "Dark" ? colors.black : colors.white,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        },
      }}
    >
      {selectedPair && (
        <View style={{ flex: 1, paddingBottom: 10 }}>
          <View style={[styles.header, { borderBottomWidth: 1, borderBottomColor: themeColors.border }]}>
            <View style={styles.titleRow}>
              <FastImage
                source={{ uri: buildCoinIconUri(selectedPair.icon_path) }}
                style={styles.icon}
                resizeMode="cover"
              />
              <View>
                <AppText type={SIXTEEN} weight={BOLD}>{selectedPair.pair}</AppText>
                <AppText type={FOURTEEN} color={DISCLAIMTEXT}>{selectedPair.base} / {selectedPair.quote}</AppText>
              </View>
            </View>
            <TouchableOpacity onPress={() => ref.current?.close()} style={styles.closeBtn}>
              <FastImage source={close_ic} style={styles.closeIcon} tintColor={themeColors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <View style={styles.hero}>
              <AppText type={TWENTY_SIX} weight={BOLD}>{selectedPair.netBase} {selectedPair.base}</AppText>
              <AppText type={FOURTEEN} color={DISCLAIMTEXT}>{selectedPair.netQuote} {selectedPair.quote}</AppText>
            </View>

            <View style={styles.content}>
              <DetailRow label="Available" valBase={selectedPair.availableBase} valQuote={selectedPair.availableQuote} base={selectedPair.base} quote={selectedPair.quote} />
              <DetailRow label="Borrowable" valBase={selectedPair.borrowableBase} valQuote={selectedPair.borrowableQuote} base={selectedPair.base} quote={selectedPair.quote} />
              <DetailRow label="Loan Cap" valBase={selectedPair.loanCapBase} valQuote={selectedPair.loanCapQuote} base={selectedPair.base} quote={selectedPair.quote} />
              <DetailRow label="Borrowed" valBase={selectedPair.borrowedBase} valQuote={selectedPair.borrowedQuote} base={selectedPair.base} quote={selectedPair.quote} />
              <DetailRow label="Frozen" valBase={selectedPair.frozenBase} valQuote={selectedPair.frozenQuote} base={selectedPair.base} quote={selectedPair.quote} />

              <View style={styles.row}>
                <AppText type={FOURTEEN} color={DISCLAIMTEXT}>Est. Liq. Price</AppText>
                <AppText type={FOURTEEN} weight={SEMI_BOLD}>{selectedPair.liqPrice || "—"}</AppText>
              </View>

              {selectedPair.mmr ? (
                <View style={styles.row}>
                  <AppText type={FOURTEEN} color={DISCLAIMTEXT}>Margin Level</AppText>
                  <AppText type={FOURTEEN} weight={SEMI_BOLD}>{selectedPair.marginLevel}</AppText>
                </View>
              ) : null}
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <ActionBtn label="Borrow" onPress={() => { ref.current?.close(); NavigationService.navigate(MARGIN_BORROW_REPAY_SCREEN, { defaultTab: "borrow", pairId: selectedPair.pair_id }); }} />
            <ActionBtn label="Repay" onPress={() => { ref.current?.close(); NavigationService.navigate(MARGIN_BORROW_REPAY_SCREEN, { defaultTab: "repay", pairId: selectedPair.pair_id }); }} />
            <ActionBtn label="Transfer" onPress={() => { ref.current?.close(); NavigationService.navigate(MARGIN_TRANSFER_SCREEN, { fromWalletType: "spot", toWalletType: "margin", coin: selectedPair?.base }); }} />
            <ActionBtn label="Trade" onPress={() => { ref.current?.close(); NavigationService.navigate(TRADE_SCREEN, { trade_pair: selectedPair.pairRaw }); }} />
          </View>
        </View>
      )}
    </RBSheet>
  );
});

const DetailRow = ({ label, valBase, valQuote, base, quote }) => (
  <View style={styles.row}>
    <AppText type={FOURTEEN} color={DISCLAIMTEXT}>{label}</AppText>
    <View style={{ alignItems: "flex-end" }}>
      <AppText type={FOURTEEN} weight={SEMI_BOLD}>{valBase} {base}</AppText>
      <AppText type={FOURTEEN} color={DISCLAIMTEXT}>{valQuote} {quote}</AppText>
    </View>
  </View>
);

const ActionBtn = ({ label, onPress }) => (
  <TouchableOpacity style={styles.actionBtn} onPress={onPress}>
    <AppText type={FOURTEEN} weight={SEMI_BOLD}>{label}</AppText>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    paddingBottom: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  closeBtn: {
    padding: 5,
  },
  closeIcon: {
    width: 14,
    height: 14,
  },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 5,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    marginTop: "auto",
    marginBottom: 10,
  },
  actionBtn: {
    flex: 1,
    height: 44,
    backgroundColor: "#F5F6F7", // Generic grey
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default MarginPairDetailSheet;
