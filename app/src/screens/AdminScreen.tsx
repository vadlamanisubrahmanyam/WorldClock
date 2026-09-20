import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AlarmsAdmin } from "./admin/AlarmsAdmin";
import { TimerAdmin } from "./admin/TimerAdmin";
import { TimeZonesAdmin } from "./admin/TimeZonesAdmin";

type Section = "timezones" | "alarms" | "timer";

const SECTIONS: { id: Section; label: string }[] = [
  { id: "timezones", label: "Time Zones" },
  { id: "alarms", label: "Alarms" },
  { id: "timer", label: "Timer" },
];

export function AdminScreen({ onBack }: { onBack: () => void }) {
  const [section, setSection] = useState<Section>("timezones");

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Text style={styles.headerAction}>Done</Text>
        </Pressable>
        <Text style={styles.title}>Admin</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.segmented}>
        {SECTIONS.map((s) => (
          <Pressable
            key={s.id}
            style={[styles.segment, section === s.id && styles.segmentActive]}
            onPress={() => setSection(s.id)}
          >
            <Text style={[styles.segmentText, section === s.id && styles.segmentTextActive]}>
              {s.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.body}>
        {section === "timezones" && <TimeZonesAdmin />}
        {section === "alarms" && <AlarmsAdmin />}
        {section === "timer" && <TimerAdmin />}
      </View>
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
  title: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
  headerAction: { color: "#5B8CFF", fontSize: 15, fontWeight: "600", width: 60 },
  segmented: {
    flexDirection: "row",
    backgroundColor: "#1C1C1E",
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  segment: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8 },
  segmentActive: { backgroundColor: "#5B8CFF" },
  segmentText: { color: "#8A8A8E", fontSize: 13, fontWeight: "600" },
  segmentTextActive: { color: "#FFFFFF" },
  body: { flex: 1 },
});
