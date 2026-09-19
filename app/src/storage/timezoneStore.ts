import AsyncStorage from "@react-native-async-storage/async-storage";
import type { TimeZoneEntry } from "../types";

const KEY = "worldclock:timezones";
export const MAX_TIMEZONES = 5;

const DEFAULT_TIMEZONES: TimeZoneEntry[] = [
  { id: "default-ist", ianaZone: "Asia/Kolkata", label: "India (IST)", order: 0 },
];

export async function getTimezones(): Promise<TimeZoneEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULT_TIMEZONES;
    const parsed: TimeZoneEntry[] = JSON.parse(raw);
    return parsed.length > 0
      ? [...parsed].sort((a, b) => a.order - b.order)
      : DEFAULT_TIMEZONES;
  } catch {
    return DEFAULT_TIMEZONES;
  }
}

export async function saveTimezones(zones: TimeZoneEntry[]): Promise<void> {
  const normalized = zones.slice(0, MAX_TIMEZONES).map((z, i) => ({ ...z, order: i }));
  await AsyncStorage.setItem(KEY, JSON.stringify(normalized));
}
