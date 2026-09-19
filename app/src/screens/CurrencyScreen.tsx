import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { fetchLatestRates } from "../api/frankfurter";
import { CURRENCY_OPTIONS } from "../data/currencies";
import {
  getCurrencyPrefs,
  getRatesCache,
  saveCurrencyPrefs,
  saveRatesCache,
} from "../storage/currencyStore";
import type { CurrencyPrefs, RatesCache } from "../types";

const STALE_AFTER_MS = 12 * 60 * 60 * 1000; // 12 hours

export function CurrencyScreen() {
  const [prefs, setPrefs] = useState<CurrencyPrefs>({ from: "USD", to: "INR" });
  const [amount, setAmount] = useState("1");
  const [cache, setCache] = useState<RatesCache | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerFor, setPickerFor] = useState<"from" | "to" | null>(null);

  const loadCache = useCallback(async (base: string, force = false) => {
    const existing = await getRatesCache();
    const isStale =
      !existing || existing.base !== base || Date.now() - existing.fetchedAt > STALE_AFTER_MS;

    if (existing && existing.base === base) setCache(existing);

    if (isStale || force) {
      setLoading(true);
      setError(null);
      try {
        const fresh = await fetchLatestRates(base);
        setCache(fresh);
        await saveRatesCache(fresh);
      } catch {
        if (!existing || existing.base !== base) {
          setError("Could not reach the exchange-rate service — showing no rate.");
        }
      } finally {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    (async () => {
      const p = await getCurrencyPrefs();
      setPrefs(p);
      await loadCache(p.from);
    })();
  }, [loadCache]);

  async function updatePrefs(next: CurrencyPrefs) {
    setPrefs(next);
    await saveCurrencyPrefs(next);
    if (next.from !== prefs.from) {
      await loadCache(next.from);
    }
  }

  function swap() {
    updatePrefs({ from: prefs.to, to: prefs.from });
  }

  const rate = cache?.rates?.[prefs.to];
  const numericAmount = parseFloat(amount.replace(",", ".")) || 0;
  const converted = rate ? numericAmount * rate : null;

  const lastUpdatedLabel = useMemo(() => {
    if (!cache || cache.base !== prefs.from) return "";
    const fetched = new Date(cache.fetchedAt);
    return `Rates as of ${cache.date} · fetched ${fetched.toLocaleString()}`;
  }, [cache, prefs.from]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 20 }}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={() => loadCache(prefs.from, true)}
          tintColor="#5B8CFF"
        />
      }
    >
      <Text style={styles.title}>Currency Converter</Text>

      <View style={styles.card}>
        <Text style={styles.fieldLabel}>From</Text>
        <View style={styles.fieldRow}>
          <TextInput
            style={styles.amountInput}
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
          <Pressable style={styles.currencyPicker} onPress={() => setPickerFor("from")}>
            <Text style={styles.currencyPickerText}>{prefs.from}</Text>
          </Pressable>
        </View>

        <Pressable style={styles.swapButton} onPress={swap}>
          <Text style={styles.swapButtonText}>⇅ Swap</Text>
        </Pressable>

        <Text style={styles.fieldLabel}>To</Text>
        <View style={styles.fieldRow}>
          <Text style={styles.resultText}>{converted !== null ? converted.toFixed(2) : "–"}</Text>
          <Pressable style={styles.currencyPicker} onPress={() => setPickerFor("to")}>
            <Text style={styles.currencyPickerText}>{prefs.to}</Text>
          </Pressable>
        </View>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
      {!!lastUpdatedLabel && <Text style={styles.updatedText}>{lastUpdatedLabel}</Text>}
      {loading && <Text style={styles.updatedText}>Refreshing rate…</Text>}

      <Text style={styles.hint}>
        Rates come from the European Central Bank via Frankfurter and update once per working
        day. Pull down to refresh.
      </Text>

      <Modal
        visible={pickerFor !== null}
        animationType="slide"
        onRequestClose={() => setPickerFor(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Pressable onPress={() => setPickerFor(null)} hitSlop={12}>
              <Text style={styles.headerAction}>Close</Text>
            </Pressable>
            <Text style={styles.title}>Select currency</Text>
            <View style={{ width: 60 }} />
          </View>
          <FlatList
            data={CURRENCY_OPTIONS}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <Pressable
                style={styles.optionRow}
                onPress={() => {
                  if (pickerFor === "from") updatePrefs({ ...prefs, from: item.code });
                  if (pickerFor === "to") updatePrefs({ ...prefs, to: item.code });
                  setPickerFor(null);
                }}
              >
                <Text style={styles.rowLabel}>{item.code}</Text>
                <Text style={styles.rowSub}>{item.name}</Text>
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B0B0F" },
  modalContainer: { flex: 1, padding: 20, backgroundColor: "#0B0B0F", paddingTop: 60 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerAction: { color: "#5B8CFF", fontSize: 15, fontWeight: "600", width: 60 },
  title: { color: "#FFFFFF", fontSize: 22, fontWeight: "700", marginBottom: 16 },
  card: { backgroundColor: "#1C1C1E", borderRadius: 16, padding: 16 },
  fieldLabel: {
    color: "#8A8A8E",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  fieldRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  amountInput: { flex: 1, color: "#FFFFFF", fontSize: 28, fontWeight: "700", padding: 0 },
  resultText: { flex: 1, color: "#FFFFFF", fontSize: 28, fontWeight: "700" },
  currencyPicker: {
    backgroundColor: "#2A2A2E",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  currencyPickerText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  swapButton: {
    alignSelf: "center",
    marginVertical: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#2A2A2E",
    borderRadius: 20,
  },
  swapButtonText: { color: "#5B8CFF", fontSize: 14, fontWeight: "700" },
  errorText: { color: "#FF6B6B", fontSize: 13, marginTop: 12 },
  updatedText: { color: "#5C5C60", fontSize: 12, marginTop: 12 },
  hint: { color: "#5C5C60", fontSize: 12, marginTop: 16, lineHeight: 17 },
  optionRow: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2A2A2E",
  },
  rowLabel: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  rowSub: { color: "#8A8A8E", fontSize: 12, marginTop: 2 },
});
