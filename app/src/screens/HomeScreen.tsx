import React, { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { DEFAULT_SETTINGS, getSettings } from "../storage/settingsStore";
import { getTimezones } from "../storage/timezoneStore";
import type { AppSettings, TimeZoneEntry } from "../types";
import { formatDateLabel, formatOffset, formatTime } from "../utils/time";

export function HomeScreen({
  onOpenAdmin,
  onOpenSettings,
}: {
  onOpenAdmin: () => void;
  onOpenSettings: () => void;
}) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [timezones, setTimezones] = useState<TimeZoneEntry[]>([]);
  const [now, setNow] = useState(new Date());

  // Re-runs each time this screen mounts, which — since App.tsx swaps
  // screens by conditional render rather than a navigator — happens every
  // time the user comes back from Admin/Settings, picking up their edits.
  useEffect(() => {
    let mounted = true;
    (async () => {
      const [s, tz] = await Promise.all([getSettings(), getTimezones()]);
      if (mounted) {
        setSettings(s);
        setTimezones(tz);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>WorldClock</Text>
        <Pressable onPress={onOpenSettings} hitSlop={12}>
          <Text style={styles.headerAction}>Settings</Text>
        </Pressable>
      </View>

      <FlatList
        data={timezones}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View>
              <Text style={styles.rowLabel}>{item.label}</Text>
              <Text style={styles.rowSub}>
                {formatDateLabel(item.ianaZone, now)} · {formatOffset(item.ianaZone, now)}
              </Text>
            </View>
            <Text style={styles.rowTime}>{formatTime(item.ianaZone, settings.timeFormat, now)}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No time zones configured yet.</Text>}
      />

      <Pressable style={styles.adminButton} onPress={onOpenAdmin}>
        <Text style={styles.adminButtonText}>Manage time zones ({timezones.length}/5)</Text>
      </Pressable>

      <Text style={styles.hint}>
        Add the WorldClock widget to your home screen for the same view without opening the app.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#0B0B0F" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: { color: "#FFFFFF", fontSize: 26, fontWeight: "700" },
  headerAction: { color: "#5B8CFF", fontSize: 15, fontWeight: "600" },
  list: { paddingBottom: 12 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2A2A2E",
  },
  rowLabel: { color: "#FFFFFF", fontSize: 17, fontWeight: "600" },
  rowSub: { color: "#8A8A8E", fontSize: 12, marginTop: 2 },
  rowTime: { color: "#FFFFFF", fontSize: 24, fontWeight: "700" },
  empty: { color: "#8A8A8E", textAlign: "center", marginTop: 40 },
  adminButton: {
    marginTop: 12,
    backgroundColor: "#1C1C1E",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  adminButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
  hint: { color: "#5C5C60", fontSize: 12, textAlign: "center", marginTop: 12 },
});
