import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { TIMEZONE_OPTIONS } from "../data/timezones";
import { getTimezones, MAX_TIMEZONES, saveTimezones } from "../storage/timezoneStore";
import type { TimeZoneEntry } from "../types";
import { formatOffset } from "../utils/time";
import { refreshWidget } from "../widget/refreshWidget";

function makeId(): string {
  return `tz-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
}

export function AdminScreen({ onBack }: { onBack: () => void }) {
  const [zones, setZones] = useState<TimeZoneEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    getTimezones().then((z) => {
      setZones(z);
      setLoaded(true);
    });
  }, []);

  async function persist(next: TimeZoneEntry[]) {
    setZones(next);
    await saveTimezones(next);
    await refreshWidget();
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= zones.length) return;
    const next = [...zones];
    [next[index], next[target]] = [next[target], next[index]];
    persist(next);
  }

  function remove(id: string) {
    if (zones.length <= 1) {
      Alert.alert("At least one time zone is required.");
      return;
    }
    persist(zones.filter((z) => z.id !== id));
  }

  function addZone(ianaZone: string, city: string) {
    if (zones.length >= MAX_TIMEZONES) {
      Alert.alert(`You can configure up to ${MAX_TIMEZONES} time zones.`);
      return;
    }
    const entry: TimeZoneEntry = { id: makeId(), ianaZone, label: city, order: zones.length };
    persist([...zones, entry]);
    setPickerOpen(false);
    setQuery("");
  }

  const filteredOptions = TIMEZONE_OPTIONS.filter((opt) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      opt.city.toLowerCase().includes(q) ||
      opt.country.toLowerCase().includes(q) ||
      opt.ianaZone.toLowerCase().includes(q)
    );
  });

  if (!loaded) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Text style={styles.headerAction}>Done</Text>
        </Pressable>
        <Text style={styles.title}>Time Zones</Text>
        <View style={{ width: 44 }} />
      </View>

      <FlatList
        data={zones}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>{item.label}</Text>
              <Text style={styles.rowSub}>
                {item.ianaZone} · {formatOffset(item.ianaZone)}
              </Text>
            </View>
            <View style={styles.rowActions}>
              <Pressable onPress={() => move(index, -1)} disabled={index === 0} hitSlop={8}>
                <Text style={[styles.actionText, index === 0 && styles.actionDisabled]}>↑</Text>
              </Pressable>
              <Pressable
                onPress={() => move(index, 1)}
                disabled={index === zones.length - 1}
                hitSlop={8}
              >
                <Text style={[styles.actionText, index === zones.length - 1 && styles.actionDisabled]}>
                  ↓
                </Text>
              </Pressable>
              <Pressable onPress={() => remove(item.id)} hitSlop={8}>
                <Text style={[styles.actionText, styles.removeText]}>Remove</Text>
              </Pressable>
            </View>
          </View>
        )}
      />

      <Pressable
        style={[styles.addButton, zones.length >= MAX_TIMEZONES && styles.addButtonDisabled]}
        onPress={() => zones.length < MAX_TIMEZONES && setPickerOpen(true)}
        disabled={zones.length >= MAX_TIMEZONES}
      >
        <Text style={styles.addButtonText}>
          {zones.length >= MAX_TIMEZONES ? "Maximum of 5 reached" : "+ Add time zone"}
        </Text>
      </Pressable>

      <Modal visible={pickerOpen} animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Pressable onPress={() => setPickerOpen(false)} hitSlop={12}>
              <Text style={styles.headerAction}>Cancel</Text>
            </Pressable>
            <Text style={styles.title}>Add Time Zone</Text>
            <View style={{ width: 44 }} />
          </View>
          <TextInput
            style={styles.search}
            placeholder="Search city or country"
            placeholderTextColor="#8A8A8E"
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
          <FlatList
            data={filteredOptions}
            keyExtractor={(item) => item.ianaZone}
            renderItem={({ item }) => (
              <Pressable style={styles.optionRow} onPress={() => addZone(item.ianaZone, item.city)}>
                <View>
                  <Text style={styles.rowLabel}>{item.city}</Text>
                  <Text style={styles.rowSub}>
                    {item.country} · {item.ianaZone}
                  </Text>
                </View>
                <Text style={styles.rowSub}>{formatOffset(item.ianaZone)}</Text>
              </Pressable>
            )}
            ListEmptyComponent={<Text style={styles.empty}>No matches.</Text>}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#0B0B0F" },
  modalContainer: { flex: 1, padding: 20, backgroundColor: "#0B0B0F", paddingTop: 60 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
  headerAction: { color: "#5B8CFF", fontSize: 15, fontWeight: "600", width: 60 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2A2A2E",
  },
  rowLabel: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  rowSub: { color: "#8A8A8E", fontSize: 12, marginTop: 2 },
  rowActions: { flexDirection: "row", alignItems: "center", gap: 14 },
  actionText: { color: "#5B8CFF", fontSize: 16, fontWeight: "700" },
  actionDisabled: { color: "#3A3A3E" },
  removeText: { color: "#FF6B6B", fontSize: 13 },
  addButton: {
    marginTop: 14,
    backgroundColor: "#1C1C1E",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  addButtonDisabled: { opacity: 0.5 },
  addButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
  search: {
    backgroundColor: "#1C1C1E",
    color: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 15,
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2A2A2E",
  },
  empty: { color: "#8A8A8E", textAlign: "center", marginTop: 40 },
});
