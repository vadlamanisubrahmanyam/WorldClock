import Slider from "@react-native-community/slider";
import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { DEFAULT_SETTINGS, getSettings, saveSettings } from "../storage/settingsStore";
import type { AppSettings, TimeFormat, WidgetTextTheme } from "../types";
import { refreshWidget } from "../widget/refreshWidget";

export function SettingsScreen({ onBack }: { onBack: () => void }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s);
      setLoaded(true);
    });
  }, []);

  async function update(patch: Partial<AppSettings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    await saveSettings(next);
    await refreshWidget();
  }

  if (!loaded) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Text style={styles.headerAction}>Done</Text>
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 44 }} />
      </View>

      <Text style={styles.sectionLabel}>Time format</Text>
      <View style={styles.segmented}>
        {(["12h", "24h"] as TimeFormat[]).map((fmt) => (
          <Pressable
            key={fmt}
            style={[styles.segment, settings.timeFormat === fmt && styles.segmentActive]}
            onPress={() => update({ timeFormat: fmt })}
          >
            <Text
              style={[styles.segmentText, settings.timeFormat === fmt && styles.segmentTextActive]}
            >
              {fmt === "12h" ? "12-hour" : "24-hour"}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Widget background</Text>
      <Text style={styles.sectionValue}>{settings.widgetOpacity}% opaque</Text>
      <Slider
        style={{ width: "100%", height: 40 }}
        minimumValue={0}
        maximumValue={100}
        step={5}
        value={settings.widgetOpacity}
        minimumTrackTintColor="#5B8CFF"
        maximumTrackTintColor="#2A2A2E"
        thumbTintColor="#5B8CFF"
        onSlidingComplete={(value) => update({ widgetOpacity: Math.round(value) })}
      />
      <View style={styles.sliderEnds}>
        <Text style={styles.sliderEndText}>Transparent</Text>
        <Text style={styles.sliderEndText}>Solid</Text>
      </View>

      <Text style={styles.sectionLabel}>Widget text colour</Text>
      <View style={styles.segmented}>
        {(["auto", "light", "dark"] as WidgetTextTheme[]).map((theme) => (
          <Pressable
            key={theme}
            style={[styles.segment, settings.widgetTextTheme === theme && styles.segmentActive]}
            onPress={() => update({ widgetTextTheme: theme })}
          >
            <Text
              style={[
                styles.segmentText,
                settings.widgetTextTheme === theme && styles.segmentTextActive,
              ]}
            >
              {theme[0].toUpperCase() + theme.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.hint}>
        "Auto" picks light or dark text based on how opaque the widget background is.
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
    marginBottom: 20,
  },
  title: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
  headerAction: { color: "#5B8CFF", fontSize: 15, fontWeight: "600", width: 60 },
  sectionLabel: {
    color: "#8A8A8E",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  sectionValue: { color: "#FFFFFF", fontSize: 15, marginBottom: 4 },
  segmented: { flexDirection: "row", backgroundColor: "#1C1C1E", borderRadius: 10, padding: 4 },
  segment: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8 },
  segmentActive: { backgroundColor: "#5B8CFF" },
  segmentText: { color: "#8A8A8E", fontSize: 14, fontWeight: "600" },
  segmentTextActive: { color: "#FFFFFF" },
  sliderEnds: { flexDirection: "row", justifyContent: "space-between" },
  sliderEndText: { color: "#5C5C60", fontSize: 12 },
  hint: { color: "#5C5C60", fontSize: 12, marginTop: 10 },
});
