import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { StackActions, useNavigation, useRoute } from "@react-navigation/native";
import { AppSafeAreaView, AppText, Button, SEMI_BOLD, TWELVE, FOURTEEN, BOLD, MEDIUM, EIGHTEEN, SIXTEEN } from "../../shared";
import { colors } from "../../theme/colors";
import { useTheme } from "../../hooks/useTheme";
import FastImage from "react-native-fast-image";
import { back_ic, checkIc, downIcon, searchIcon } from "../../helper/ImageAssets";
import NavigationService from "../../navigation/NavigationService";
import { appOperation } from "../../appOperation";
import { useAppDispatch } from "../../store/hooks";
import { getUserWallet } from "../../actions/walletActions";
import { alertSuccessMessage } from "../../helper/logger";
import {
  buildDeclarationBody,
  classifyDeclarationDetail,
  classifyDeclarationSubmit,
  declarationChoiceValue,
  localDeclarationError,
  optionLabel,
  stepReady,
} from "../../helper/depositDeclaration";

const EMPTY_FORM = {
  senderIsSelf: null,
  sourceType: "",
  senderType: "",
  firstName: "",
  lastName: "",
  companyName: "",
  country: "",
  exchangeName: "",
  confirmed: false,
};

const LAST_STEP = 2;

const FALLBACK_FORM = {
  sender_is_self: [
    { value: true, label: "I sent this deposit" },
    { value: false, label: "Someone else sent this deposit" },
  ],
  sender_type: [
    { value: "PERSONAL", label: "Individual" },
    { value: "COMPANY", label: "Company" },
  ],
  source_type: [
    { value: "PRIVATE_WALLET", label: "Private wallet" },
    { value: "EXCHANGE", label: "Exchange" },
  ],
};

function textOrDash(value) {
  if (value == null || value === "") return "—";
  return String(value);
}

function withFallbackOptions(form) {
  const source = form && typeof form === "object" ? form : {};
  const pick = (key) => (Array.isArray(source[key]) && source[key].length ? source[key] : FALLBACK_FORM[key]);
  return {
    sender_is_self: pick("sender_is_self").map((opt) => ({ ...opt, value: declarationChoiceValue(opt?.value) })),
    sender_type: pick("sender_type"),
    source_type: pick("source_type"),
  };
}

async function readApi(request) {
  try {
    const res = await request();
    return res && typeof res === "object" ? res : { success: false };
  } catch (err) {
    if (err && typeof err === "object") return err;
    return { success: false, message: err ? String(err) : "" };
  }
}

function flagEmoji(code) {
  const iso = String(code || "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(iso)) return "";
  return iso.replace(/./g, (ch) => String.fromCodePoint(127397 + ch.charCodeAt(0)));
}

function countryOptionsFromIntl() {
  const display = typeof Intl !== "undefined" && Intl.DisplayNames ? new Intl.DisplayNames(["en"], { type: "region" }) : null;
  if (!display) return [];
  const opts = [];
  for (let i = 65; i <= 90; i += 1) {
    for (let j = 65; j <= 90; j += 1) {
      const code = String.fromCharCode(i) + String.fromCharCode(j);
      let name = "";
      try {
        name = display.of(code) || "";
      } catch {
        name = "";
      }
      if (!name || name.toUpperCase() === code) continue;
      if (opts.some((opt) => opt.label === name)) continue;
      opts.push({ value: code, label: name, flag: flagEmoji(code) });
    }
  }
  opts.sort((a, b) => a.label.localeCompare(b.label));
  return opts;
}

function countryOptionsFromApi(res) {
  const raw = res?.success ? res?.data : res;
  const list = Array.isArray(raw) ? raw : raw?.countries;
  if (!Array.isArray(list)) return [];
  return list
    .map((c) => {
      const code = String(c?.code || c?.iso2 || c?.alpha2 || "").trim();
      const name = String(c?.name || c?.country_name || c?.label || "").trim();
      if (!name) return null;
      const value = /^[A-Za-z]{2}$/.test(code) ? code.toUpperCase() : name;
      const flag = typeof c?.flag === "string" && c.flag.trim() ? c.flag.trim() : flagEmoji(value);
      return { value, label: name, flag };
    })
    .filter(Boolean)
    .sort((a, b) => a.label.localeCompare(b.label));
}

function CountryFlag({ flag }) {
  if (!flag) return <View style={styles.flagSpacer} />;
  if (/^https?:\/\//i.test(flag)) {
    return <FastImage source={{ uri: flag }} style={styles.flagImage} resizeMode="cover" />;
  }
  return <AppText style={styles.flagEmoji}>{flag}</AppText>;
}

function ChoiceRow({ checked, label, onPress, border, fieldBg, textColor, secondary }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.choice, { borderColor: checked ? colors.orangeTheme : border, backgroundColor: fieldBg }]}
    >
      <View style={[styles.radio, { borderColor: checked ? colors.orangeTheme : secondary }]}>
        {checked ? <View style={[styles.radioDot, { backgroundColor: colors.orangeTheme }]} /> : null}
      </View>
      <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: textColor, flex: 1 }}>
        {label}
      </AppText>
    </TouchableOpacity>
  );
}

function TextField({ label, value, onChangeText, textColor, secondary, border, fieldBg }) {
  return (
    <View style={styles.field}>
      <AppText type={TWELVE} weight={MEDIUM} style={{ color: secondary, marginBottom: 6 }}>
        {label}
      </AppText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Enter here"
        placeholderTextColor={secondary}
        style={[styles.input, { color: textColor, borderColor: border, backgroundColor: fieldBg }]}
      />
    </View>
  );
}

export default function DepositDeclaration() {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useAppDispatch();
  const { colors: themeColors, isDark } = useTheme();
  const depositId = String(route.params?.depositId || route.params?.row?.id || "").trim();

  const [phase, setPhase] = useState("loading");
  const [payload, setPayload] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [formState, setFormState] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [retryCredit, setRetryCredit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(0);
  const [countries, setCountries] = useState([]);
  const [countryOpen, setCountryOpen] = useState(false);
  const [countryQuery, setCountryQuery] = useState("");

  const leaveToHistory = useCallback(() => {
    navigation.dispatch(StackActions.pop(2));
  }, [navigation]);

  const load = useCallback(async () => {
    if (!depositId) {
      leaveToHistory();
      return;
    }
    setPhase("loading");
    setLoadError("");
    const res = await readApi(() => appOperation.customer.get_deposit_declaration(depositId));
    const classified = classifyDeclarationDetail(res);
    if (classified.kind === "leave") {
      leaveToHistory();
      return;
    }
    if (classified.kind !== "ok") {
      setPhase("error");
      setLoadError(classified.message);
      return;
    }
    const card = classified.data.deposit;
    const status = String(card?.status || "").toUpperCase();
    setPayload(classified.data);
    if (status === "COMPLETED") {
      setPhase("summary");
      return;
    }
    if (status === "AWAITING_DECLARATION") {
      setPhase("form");
      return;
    }
    setPhase("other");
  }, [depositId, leaveToHistory]);

  useEffect(() => {
    setFormState(EMPTY_FORM);
    setFormError("");
    setRetryCredit(false);
    setStep(0);
    void load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await readApi(() => appOperation.customer.get_countries());
      const fromApi = countryOptionsFromApi(res);
      const next = fromApi.length ? fromApi : countryOptionsFromIntl();
      if (!cancelled) setCountries(next);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const deposit = payload?.deposit || null;
  const form = useMemo(() => withFallbackOptions(payload?.form), [payload]);
  const prefill = payload?.prefill || {};
  const showPersonalName = formState.senderIsSelf === true || formState.senderType === "PERSONAL";
  const showCompany = formState.senderIsSelf === false && formState.senderType === "COMPANY";
  const showSenderType = formState.senderIsSelf === false;
  const showExchange = formState.sourceType === "EXCHANGE";
  const canAdvance = stepReady(step, formState);
  const countryLabel = optionLabel(countries, formState.country);
  const selectedCountry = countries.find((c) => c.value === formState.country) || null;
  const filteredCountries = useMemo(() => {
    const q = countryQuery.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter((c) => c.label.toLowerCase().includes(q) || String(c.value).toLowerCase().includes(q));
  }, [countries, countryQuery]);

  const border = isDark ? themeColors.border : "#EEE";
  const fieldBg = isDark ? "rgba(255,255,255,0.04)" : "#FAFAFA";

  const chooseSender = (value) => {
    const next = declarationChoiceValue(value);
    setFormError("");
    setRetryCredit(false);
    setFormState((prev) => {
      if (next === true) {
        return {
          ...prev,
          senderIsSelf: true,
          senderType: "",
          firstName: prefill.first_name || prefill.firstName || "",
          lastName: prefill.last_name || prefill.lastName || "",
          companyName: "",
        };
      }
      return {
        ...prev,
        senderIsSelf: false,
        senderType: "",
        firstName: "",
        lastName: "",
        companyName: "",
      };
    });
  };

  const finishSuccess = async (message) => {
    try {
      await dispatch(getUserWallet(""));
    } catch {
      /* Wallet screens refetch on their own focus. */
    }
    if (message) alertSuccessMessage(message);
    leaveToHistory();
  };

  const onSubmit = async () => {
    if (submitting || step < LAST_STEP) return;
    const message = localDeclarationError(formState);
    if (message) {
      setRetryCredit(false);
      setFormError(message);
      return;
    }
    setSubmitting(true);
    setFormError("");
    setRetryCredit(false);
    try {
      const body = buildDeclarationBody(formState);
      const res = await readApi(() => appOperation.customer.submit_deposit_declaration(depositId, body));
      const classified = classifyDeclarationSubmit(res);
      if (classified.kind === "ok") {
        await finishSuccess(classified.message);
        return;
      }
      if (classified.kind === "leave") {
        leaveToHistory();
        return;
      }
      if (classified.kind === "invalid") {
        setFormError(classified.message || "Check the details and try again");
        return;
      }
      setRetryCredit(true);
    } catch {
      setRetryCredit(true);
    } finally {
      setSubmitting(false);
    }
  };

  const summaryRows = useMemo(() => {
    const declaration = deposit?.declaration || {};
    const personal = declaration.sender_type !== "COMPANY";
    const name = personal
      ? [declaration.first_name, declaration.last_name].filter(Boolean).join(" ")
      : declaration.company_name;
    const senderLabel = optionLabel(form.sender_is_self, declaration.sender_is_self);
    const typeLabel = optionLabel(form.sender_type, declaration.sender_type);
    const sourceLabel = optionLabel(form.source_type, declaration.source_type);
    return [
      ["Who sent this deposit?", senderLabel],
      declaration.sender_is_self === false ? ["Originator type", typeLabel] : null,
      name ? ["Name", name] : null,
      declaration.country ? ["Country of residence", optionLabel(countries, declaration.country) || declaration.country] : null,
      ["Address type", sourceLabel],
      declaration.exchange_name ? ["Exchange name", declaration.exchange_name] : null,
    ].filter((row) => row && row[1]);
  }, [countries, deposit, form]);

  return (
    <AppSafeAreaView style={{ flex: 1, backgroundColor: themeColors.background }}>
      <View style={[styles.header, { borderBottomColor: border }]}>
        <TouchableOpacity onPress={() => NavigationService.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <FastImage source={back_ic} style={{ width: 18, height: 18 }} resizeMode="contain" tintColor={themeColors.text} />
        </TouchableOpacity>
        <AppText type={EIGHTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text }}>
          Address Confirmation
        </AppText>
        <View style={{ width: 18, height: 18 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {phase === "loading" ? (
            <ActivityIndicator style={{ marginTop: 24 }} color={colors.orangeTheme} />
          ) : null}

          {phase === "error" ? (
            <View>
              <AppText type={FOURTEEN} style={{ color: "#FF3F34", marginBottom: 16 }}>
                {loadError}
              </AppText>
              <View style={styles.actions}>
                <TouchableOpacity style={[styles.cancelBtn, { borderColor: border }]} onPress={leaveToHistory}>
                  <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text }}>
                    Cancel
                  </AppText>
                </TouchableOpacity>
                <Button containerStyle={styles.nextBtn} onPress={() => void load()}>
                  Try again
                </Button>
              </View>
            </View>
          ) : null}

          {deposit && phase !== "loading" && phase !== "error" ? (
            <View style={[styles.facts, { borderColor: border }]}>
              <AppText type={SIXTEEN} weight={BOLD} style={{ color: themeColors.text }}>
                {textOrDash(deposit.amount)} {textOrDash(deposit.short_name)}
              </AppText>
              <AppText type={TWELVE} style={{ color: themeColors.secondaryText, marginTop: 4 }}>
                Network {textOrDash(deposit.chain)}
              </AppText>
              <AppText type={TWELVE} style={{ color: themeColors.secondaryText, marginTop: 4 }}>
                From {textOrDash(deposit.from_address)}
              </AppText>
            </View>
          ) : null}

          {phase === "summary" ? (
            <View>
              {summaryRows.map(([label, value]) => (
                <View key={label} style={[styles.summaryRow, { borderBottomColor: border }]}>
                  <AppText type={TWELVE} style={{ color: themeColors.secondaryText, flex: 1 }}>
                    {label}
                  </AppText>
                  <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: themeColors.text, flex: 1, textAlign: "right" }}>
                    {value}
                  </AppText>
                </View>
              ))}
              {deposit?.declaration?.confirmed === true ? (
                <AppText type={TWELVE} style={{ color: themeColors.secondaryText, marginTop: 12 }}>
                  I confirm this information is true and complete.
                </AppText>
              ) : null}
              <Button containerStyle={[styles.nextBtn, { marginTop: 20 }]} onPress={leaveToHistory}>
                Close
              </Button>
            </View>
          ) : null}

          {phase === "other" ? (
            <View>
              <AppText type={FOURTEEN} weight={MEDIUM} style={{ color: themeColors.text }}>
                {deposit?.status === "REJECTED" ? "Blocked" : deposit?.status === "PENDING" ? "Pending" : textOrDash(deposit?.status)}
              </AppText>
              <Button containerStyle={[styles.nextBtn, { marginTop: 20 }]} onPress={leaveToHistory}>
                Close
              </Button>
            </View>
          ) : null}

          {phase === "form" ? (
            <View>
              {step === 0 ? (
                <View>
                  <AppText type={FOURTEEN} style={{ color: themeColors.secondaryText, lineHeight: 20 }}>
                    Please provide the details of the address owner (the person you are transacting with). These details will be used to comply with regulatory requirements when transacting with this address.
                  </AppText>
                  <AppText type={TWELVE} weight={SEMI_BOLD} style={{ color: themeColors.text, marginTop: 12 }}>
                    Your balance does not change until you submit.
                  </AppText>
                  <AppText type={SIXTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text, marginTop: 18, marginBottom: 10 }}>
                    Who sent this deposit?
                  </AppText>
                  {form.sender_is_self.map((opt) => (
                    <ChoiceRow
                      key={String(opt.value)}
                      checked={formState.senderIsSelf === opt.value}
                      label={opt.label}
                      onPress={() => chooseSender(opt.value)}
                      border={border}
                      fieldBg={fieldBg}
                      textColor={themeColors.text}
                      secondary={themeColors.secondaryText}
                    />
                  ))}
                </View>
              ) : null}

              {step === 1 ? (
                <View>
                  {showSenderType ? (
                    <>
                      <AppText type={SIXTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text, marginBottom: 10 }}>
                        Originator Type
                      </AppText>
                      {form.sender_type.map((opt) => (
                        <ChoiceRow
                          key={String(opt.value)}
                          checked={formState.senderType === opt.value}
                          label={opt.label}
                          onPress={() => {
                            setFormError("");
                            setFormState((prev) => ({
                              ...prev,
                              senderType: opt.value,
                              firstName: opt.value === "PERSONAL" ? prev.firstName : "",
                              lastName: opt.value === "PERSONAL" ? prev.lastName : "",
                              companyName: opt.value === "COMPANY" ? prev.companyName : "",
                            }));
                          }}
                          border={border}
                          fieldBg={fieldBg}
                          textColor={themeColors.text}
                          secondary={themeColors.secondaryText}
                        />
                      ))}
                    </>
                  ) : null}

                  {showPersonalName || showCompany ? (
                    <AppText type={SIXTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text, marginTop: 8, marginBottom: 10 }}>
                      Originator Details
                    </AppText>
                  ) : null}

                  {showPersonalName ? (
                    <>
                      <TextField
                        label="First name"
                        value={formState.firstName}
                        onChangeText={(text) => setFormState((prev) => ({ ...prev, firstName: text }))}
                        border={border}
                        fieldBg={fieldBg}
                        textColor={themeColors.text}
                        secondary={themeColors.secondaryText}
                      />
                      <TextField
                        label="Last name"
                        value={formState.lastName}
                        onChangeText={(text) => setFormState((prev) => ({ ...prev, lastName: text }))}
                        border={border}
                        fieldBg={fieldBg}
                        textColor={themeColors.text}
                        secondary={themeColors.secondaryText}
                      />
                    </>
                  ) : null}

                  {showCompany ? (
                    <TextField
                      label="Name (Full Name or Entity Name)"
                      value={formState.companyName}
                      onChangeText={(text) => setFormState((prev) => ({ ...prev, companyName: text }))}
                      border={border}
                      fieldBg={fieldBg}
                      textColor={themeColors.text}
                      secondary={themeColors.secondaryText}
                    />
                  ) : null}

                  {formState.senderIsSelf === true || formState.senderType ? (
                    <View style={styles.field}>
                      <AppText type={TWELVE} weight={MEDIUM} style={{ color: themeColors.secondaryText, marginBottom: 6 }}>
                        Country of Residence
                      </AppText>
                      <TouchableOpacity
                        style={[styles.input, styles.select, { borderColor: border, backgroundColor: fieldBg }]}
                        onPress={() => setCountryOpen(true)}
                        activeOpacity={0.85}
                      >
                        <View style={styles.selectValue}>
                          {selectedCountry?.flag ? <CountryFlag flag={selectedCountry.flag} /> : null}
                          <AppText type={FOURTEEN} style={{ color: countryLabel ? themeColors.text : themeColors.secondaryText, flex: 1 }}>
                            {countryLabel || "Select"}
                          </AppText>
                        </View>
                        <FastImage source={downIcon} style={styles.chevron} resizeMode="contain" tintColor={themeColors.secondaryText} />
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              ) : null}

              {step === 2 ? (
                <View>
                  <AppText type={SIXTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text, marginBottom: 10 }}>
                    Address Type
                  </AppText>
                  {form.source_type.map((opt) => (
                    <ChoiceRow
                      key={String(opt.value)}
                      checked={formState.sourceType === opt.value}
                      label={opt.label}
                      onPress={() => {
                        setFormError("");
                        setFormState((prev) => ({
                          ...prev,
                          sourceType: opt.value,
                          exchangeName: opt.value === "EXCHANGE" ? prev.exchangeName : "",
                        }));
                      }}
                      border={border}
                      fieldBg={fieldBg}
                      textColor={themeColors.text}
                      secondary={themeColors.secondaryText}
                    />
                  ))}
                  {showExchange ? (
                    <TextField
                      label="Exchange name"
                      value={formState.exchangeName}
                      onChangeText={(text) => setFormState((prev) => ({ ...prev, exchangeName: text }))}
                      border={border}
                      fieldBg={fieldBg}
                      textColor={themeColors.text}
                      secondary={themeColors.secondaryText}
                    />
                  ) : null}
                  <TouchableOpacity
                    style={styles.checkRow}
                    onPress={() => setFormState((prev) => ({ ...prev, confirmed: !prev.confirmed }))}
                  >
                    <View style={[styles.check, { borderColor: formState.confirmed ? colors.orangeTheme : border, backgroundColor: formState.confirmed ? colors.orangeTheme : "transparent" }]}>
                      {formState.confirmed ? (
                        <AppText type={TWELVE} weight={BOLD} style={{ color: colors.white }}>
                          ✓
                        </AppText>
                      ) : null}
                    </View>
                    <AppText type={FOURTEEN} style={{ color: themeColors.text, flex: 1 }}>
                      I confirm this information is true and complete.
                    </AppText>
                  </TouchableOpacity>
                </View>
              ) : null}

              {formError ? (
                <AppText type={TWELVE} style={{ color: "#FF3F34", marginTop: 12 }}>
                  {formError}
                </AppText>
              ) : null}
              {retryCredit ? (
                <AppText type={TWELVE} style={{ color: "#FF3F34", marginTop: 8 }}>
                  Credit failed. This deposit is still waiting.
                </AppText>
              ) : null}

              <View style={styles.actions}>
                <TouchableOpacity style={[styles.cancelBtn, { borderColor: border }]} onPress={leaveToHistory}>
                  <AppText type={FOURTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text }}>
                    Cancel
                  </AppText>
                </TouchableOpacity>
                {step < LAST_STEP ? (
                  <Button
                    containerStyle={styles.nextBtn}
                    disabled={!canAdvance}
                    onPress={() => {
                      setFormError("");
                      setStep((current) => current + 1);
                    }}
                  >
                    Next
                  </Button>
                ) : (
                  <Button containerStyle={styles.nextBtn} disabled={!canAdvance || submitting} loading={submitting} onPress={() => void onSubmit()}>
                    {retryCredit ? "Try again" : "Submit"}
                  </Button>
                )}
              </View>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={countryOpen} transparent animationType="slide" onRequestClose={() => setCountryOpen(false)}>
        <KeyboardAvoidingView style={styles.sheetRoot} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={() => setCountryOpen(false)} />
          <View style={[styles.sheet, { backgroundColor: themeColors.background }]}>
            <View style={[styles.sheetHandle, { backgroundColor: isDark ? "#3A3A3C" : "#D1D5DB" }]} />
            <View style={styles.sheetHead}>
              <AppText type={EIGHTEEN} weight={SEMI_BOLD} style={{ color: themeColors.text }}>
                Select country
              </AppText>
              <TouchableOpacity onPress={() => setCountryOpen(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <AppText type={SIXTEEN} weight={MEDIUM} style={{ color: themeColors.secondaryText }}>
                  Close
                </AppText>
              </TouchableOpacity>
            </View>
            <View style={[styles.searchWrap, { borderColor: border, backgroundColor: fieldBg }]}>
              <FastImage source={searchIcon} style={styles.searchIcon} resizeMode="contain" tintColor={themeColors.secondaryText} />
              <TextInput
                value={countryQuery}
                onChangeText={setCountryQuery}
                placeholder="Search country"
                placeholderTextColor={themeColors.secondaryText}
                style={[styles.searchInput, { color: themeColors.text }]}
                autoCorrect={false}
                autoCapitalize="none"
              />
            </View>
            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => String(item.value)}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.countryList}
              ListEmptyComponent={
                <AppText type={FOURTEEN} style={{ color: themeColors.secondaryText, textAlign: "center", marginTop: 28 }}>
                  No country found
                </AppText>
              }
              renderItem={({ item }) => {
                const selected = item.value === formState.country;
                return (
                  <TouchableOpacity
                    activeOpacity={0.75}
                    style={[
                      styles.countryRow,
                      {
                        borderBottomColor: border,
                        backgroundColor: selected ? (isDark ? "rgba(209,170,103,0.12)" : "rgba(209,170,103,0.16)") : "transparent",
                      },
                    ]}
                    onPress={() => {
                      setFormState((prev) => ({ ...prev, country: item.value }));
                      setCountryOpen(false);
                      setCountryQuery("");
                    }}
                  >
                    <CountryFlag flag={item.flag} />
                    <AppText type={FOURTEEN} weight={selected ? SEMI_BOLD : MEDIUM} style={{ color: themeColors.text, flex: 1 }}>
                      {item.label}
                    </AppText>
                    {selected ? (
                      <FastImage source={checkIc} style={styles.checkIcon} resizeMode="contain" tintColor={colors.orangeTheme} />
                    ) : null}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </AppSafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 52,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
  },
  content: { padding: 16, paddingBottom: 40 },
  facts: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 16 },
  choice: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  field: { marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    minHeight: 46,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  select: { justifyContent: "space-between", flexDirection: "row", alignItems: "center" },
  selectValue: { flexDirection: "row", alignItems: "center", flex: 1, gap: 10 },
  chevron: { width: 14, height: 14, marginLeft: 8 },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 },
  check: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: { flexDirection: "row", gap: 12, marginTop: 20 },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  nextBtn: { flex: 1, marginTop: 0 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  countryList: { paddingBottom: 24 },
  countryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 12,
    paddingHorizontal: 12,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
  },
  sheetRoot: { flex: 1, justifyContent: "flex-end" },
  sheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },
  sheet: {
    height: Math.min(Dimensions.get("window").height * 0.78, 680),
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 8,
    overflow: "hidden",
  },
  sheetHandle: { width: 42, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 8 },
  sheetHead: {
    paddingHorizontal: 18,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  searchWrap: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 46,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchIcon: { width: 16, height: 16 },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 10 },
  flagEmoji: { fontSize: 22, width: 28, textAlign: "center" },
  flagImage: { width: 28, height: 20, borderRadius: 3 },
  flagSpacer: { width: 28 },
  checkIcon: { width: 16, height: 16 },
});
