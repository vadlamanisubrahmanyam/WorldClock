import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, Modal, Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { TONE_OPTIONS, getToneOption } from "../../data/tones";
import { cancelNotificationIds, scheduleAlarm } from "../../notifications/alarmScheduler";
import { getAlarms, makeAlarmId, saveAlarms } from "../../storage/alarmStore";
import { DEFAULT_SETTINGS, getSettings } from "../../storage/settingsStore";
import type { Alarm, AppSettings } from "../../types";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function emptyDraft(): Alarm {
  const now = new Date();
  return {
    id: makeAlarmId(),
    hour: now.getHours(),
    minute: now.getMinutes(),
    label: "",
    repeatDays: [],
    enabled: true,
    toneId: TONE_OPTIONS[0].id,
    notificationIds: [],
  };
}

function formatTime(hour: number, minute: number, format: "12h" | "24h"): string {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: format === "12h",
  }).format(d);
}

function summarizeRepeat(alarm: Alarm): string {
  if (alarm.repeatDays.length === 0) return "One time";
  if (alarm.repeatDays.length === 7) return "Every day";
  return alarm.repeatDays
    .slice()
    .sort((a, b) => a - b)
    .map((d) => DAY_NAMES[d])
    .join(", ");
}

export function AlarmsAdmin() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState<Alarm | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    (async () => {
      const [a, s] = await Promise.all([getAlarms(), getSettings()]);
      setAlarms(a);
      setSettings(s);
      setLoaded(true);
    })();
  }, []);

  async function persist(next: Alarm[]) {
    setAlarms(next);
    await saveAlarms(next);
  }

  async function toggleEnabled(alarm: Alarm, enabled: boolean) {
    let notificationIds: string[] = [];
    if (enabled) {
      notificationIds = await scheduleAlarm({ ...alarm, enabled: true });
    } else {
      await cancelNotificationIds(alarm.notificationIds);
    }
    const next = alarms.map((a) => (a.id === alarm.id ? { ...a, enabled, notificationIds } : a));
    await persist(next);
  }

  function removeAlarm(alarm: Alarm) {
    Alert.alert("Delete alarm?", formatTime(alarm.hour, alarm.minute, settings.timeFormat), [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await cancelNotificationIds(alarm.notificationIds);
          await persist(alarms.filter((a) => a.id !== alarm.id));
        },
      },
    ]);
  }

  async function saveDraft(draft: Alarm) {
    const exists = alarms.some((a) => a.id === draft.id);
    const notificationIds = draft.enabled ? await scheduleAlarm(draft) : [];
    const withIds = { ...draft, notificationIds };
    const next = exists ? alarms.map((a) => (a.id === draft.id ? withIds : a)) : [...alarms, withIds];
    await persist(next);
    setEditing(null);
  }

  function toggleDay(draft: Alarm, day: number): Alarm {
    const has = draft.repeatDays.includes(day);
    const repeatDays = has ? draft.repeatDays.filter((d) => d !== day) : [...draft.repeatDays, day];
    return { ...draft, repeatDays };
  }

  const sorted = [...alarms].sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute));

  if (!loaded) return null;

  return (
    <View style={styles.container}>
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => setEditing(item)} onLongPress={() => removeAlarm(item)}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTime, !item.enabled && styles.dimmed]}>
                {formatTime(item.hour, item.minute, settings.timeFormat)}
              </Text>
              <Text style={styles.rowSub}>
                {item.label.trim() ? `${item.label} · ` : ""}
                {summarizeRepeat(item)} · {getToneOption(item.toneId).label}
              </Text>
            </View>
            <Switch
              value={item.enabled}
              onValueChange={(v) => toggleEnabled(item, v)}
              trackColor={{ false: "#2A2A2E", true: "#5B8CFF" }}
              thumbColor="#FFFFFF"
            />
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No alarms yet.</Text>}
      />
      <Text style={styles.hint}>Tap an alarm to edit it, or hold to delete.</Text>
      <Text style={styles.hint}>
        If an alarm doesn't ring on time, check Settings → Apps → WorldClock → Alarms &amp;
        reminders on your phone — Android 12+ can silently deny exact-alarm scheduling and
        there's no in-app prompt for it.
      </Text>

      <Pressable style={styles.addButton} onPress={() => setEditing(emptyDraft())}>
        <Text style={styles.addButtonText}>+ Add alarm</Text>
      </Pressable>

      <Modal visible={editing !== null} animationType="slide" onRequestClose={() => setEditing(null)}>
        {editing && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setEditing(null)} hitSlop={12}>
                <Text style={styles.headerAction}>Cancel</Text>
              </Pressable>
              <Text style={styles.title}>
                {alarms.some((a) => a.id === editing.id) ? "Edit Alarm" : "New Alarm"}
              </Text>
              <Pressable onPress={() => saveDraft(editing)} hitSlop={12}>
                <Text style={[styles.headerAction, styles.saveAction]}>Save</Text>
              </Pressable>
            </View>

            <Pressable style={styles.timeButton} onPress={() => setShowTimePicker(true)}>
              <Text style={styles.timeButtonText}>
                {formatTime(editing.hour, editing.minute, settings.timeFormat)}
              </Text>
            </Pressable>
            {showTimePicker && (
              <DateTimePicker
                value={(() => {
                  const d = new Date();
                  d.setHours(editing.hour, editing.minute, 0, 0);
                  return d;
                })()}
                mode="time"
                is24Hour={settings.timeFormat === "24h"}
                display="default"
                onChange={(_event, selected) => {
                  setShowTimePicker(false);
                  if (selected) {
                    setEditing({ ...editing, hour: selected.getHours(), minute: selected.getMinutes() });
                  }
                }}
              />
            )}

            <Text style={styles.sectionLabel}>Repeat</Text>
            <View style={styles.dayRow}>
              {DAY_LABELS.map((label, day) => {
                const active = editing.repeatDays.includes(day);
                return (
                  <Pressable
                    key={day}
                    style={[styles.dayChip, active && styles.dayChipActive]}
                    onPress={() => setEditing(toggleDay(editing, day))}
                  >
                    <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.hint}>
              {editing.repeatDays.length === 0
                ? "No days selected — this alarm fires once, then turns itself off."
                : `Repeats every ${summarizeRepeat(editing).toLowerCase()}.`}
            </Text>

            <Text style={styles.sectionLabel}>Label</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Wake up"
              placeholderTextColor="#8A8A8E"
              value={editing.label}
              onChangeText={(label) => setEditing({ ...editing, label })}
            />

            <Text style={styles.sectionLabel}>Tone</Text>
            {TONE_OPTIONS.map((tone) => (
              <Pressable
                key={tone.id}
                style={styles.toneRow}
                onPress={() => setEditing({ ...editing, toneId: tone.id })}
              >
                <Text style={styles.toneLabel}>{tone.label}</Text>
                <Text style={styles.toneCheck}>{editing.toneId === tone.id ? "✓" : ""}</Text>
              </Pressable>
            ))}
            <Text style={styles.hint}>
              "Default (system sound)" uses your phone's own default notification sound, which
              is silent on some devices/OEMs — the other three always play, since they're
              bundled sounds.
            </Text>

            {alarms.some((a) => a.id === editing.id) && (
              <Pressable
                style={styles.deleteButton}
                onPress={() => {
                  setEditing(null);
                  removeAlarm(editing);
                }}
              >
                <Text style={styles.deleteButtonText}>Delete alarm</Text>
              </Pressable>
            )}
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2A2A2E",
  },
  rowTime: { color: "#FFFFFF", fontSize: 24, fontWeight: "700" },
  rowSub: { color: "#8A8A8E", fontSize: 12, marginTop: 2 },
  dimmed: { color: "#5C5C60" },
  empty: { color: "#8A8A8E", textAlign: "center", marginTop: 40 },
  hint: { color: "#5C5C60", fontSize: 12, marginTop: 10 },
  addButton: {
    marginTop: 14,
    backgroundColor: "#1C1C1E",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  addButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
  modalContainer: { flex: 1, padding: 20, backgroundColor: "#0B0B0F", paddingTop: 60 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
  headerAction: { color: "#5B8CFF", fontSize: 15, fontWeight: "600" },
  saveAction: { fontWeight: "700" },
  timeButton: {
    backgroundColor: "#1C1C1E",
    borderRadius: 14,
    paddingVertical: 20,
    alignItems: "center",
    marginBottom: 8,
  },
  timeButtonText: { color: "#FFFFFF", fontSize: 34, fontWeight: "700" },
  sectionLabel: {
    color: "#8A8A8E",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  dayRow: { flexDirection: "row", justifyContent: "space-between" },
  dayChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1C1C1E",
    alignItems: "center",
    justifyContent: "center",
  },
  dayChipActive: { backgroundColor: "#5B8CFF" },
  dayChipText: { color: "#8A8A8E", fontSize: 14, fontWeight: "700" },
  dayChipTextActive: { color: "#FFFFFF" },
  input: {
    backgroundColor: "#1C1C1E",
    color: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  toneRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2A2A2E",
  },
  toneLabel: { color: "#FFFFFF", fontSize: 15 },
  toneCheck: { color: "#5B8CFF", fontSize: 16, fontWeight: "700", width: 20, textAlign: "right" },
  deleteButton: { marginTop: 24, alignItems: "center", paddingVertical: 12 },
  deleteButtonText: { color: "#FF6B6B", fontSize: 15, fontWeight: "600" },
});
