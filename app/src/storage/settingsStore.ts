import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AppSettings } from "../types";

const KEY = "worldclock:settings";

export const DEFAULT_SETTINGS: AppSettings = {
  timeFormat: "24h",
  widgetOpacity: 70,
  widgetBackgroundTheme: "dark",
};

export async function getSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(settings));
}
