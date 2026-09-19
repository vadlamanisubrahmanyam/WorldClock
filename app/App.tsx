import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { AdminScreen } from "./src/screens/AdminScreen";
import { CurrencyScreen } from "./src/screens/CurrencyScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";

type Tab = "clock" | "currency";
type ClockView = "home" | "admin" | "settings";

// Deliberately not react-navigation: two tabs and two sub-screens don't
// need a navigator, and it keeps one fewer native dependency alongside the
// widget module. Conditional rendering below also means each screen remounts
// (and reloads its data from storage) whenever the user returns to it.
export default function App() {
  const [tab, setTab] = useState<Tab>("clock");
  const [clockView, setClockView] = useState<ClockView>("home");

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.content}>
        {tab === "clock" ? (
          clockView === "home" ? (
            <HomeScreen
              onOpenAdmin={() => setClockView("admin")}
              onOpenSettings={() => setClockView("settings")}
            />
          ) : clockView === "admin" ? (
            <AdminScreen onBack={() => setClockView("home")} />
          ) : (
            <SettingsScreen onBack={() => setClockView("home")} />
          )
        ) : (
          <CurrencyScreen />
        )}
      </View>

      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tabButton, tab === "clock" && styles.tabButtonActive]}
          onPress={() => {
            setTab("clock");
            setClockView("home");
          }}
        >
          <Text style={[styles.tabLabel, tab === "clock" && styles.tabLabelActive]}>Clock</Text>
        </Pressable>
        <Pressable
          style={[styles.tabButton, tab === "currency" && styles.tabButtonActive]}
          onPress={() => setTab("currency")}
        >
          <Text style={[styles.tabLabel, tab === "currency" && styles.tabLabelActive]}>
            Currency
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B0B0F" },
  content: { flex: 1 },
  tabBar: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#2A2A2E",
    backgroundColor: "#111114",
  },
  tabButton: { flex: 1, paddingVertical: 14, alignItems: "center" },
  tabButtonActive: { borderTopWidth: 2, borderTopColor: "#5B8CFF" },
  tabLabel: { color: "#8A8A8E", fontSize: 14, fontWeight: "600" },
  tabLabelActive: { color: "#FFFFFF" },
});
