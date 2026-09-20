import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_TONE_ID } from "../data/tones";
import type { Alarm } from "../types";

const KEY = "worldclock:alarms";

export async function getAlarms(): Promise<Alarm[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: Alarm[] = JSON.parse(raw);
    // Backfills fields that didn't exist in earlier saved data, without
    // clobbering them when they do exist.
    return parsed.map((a) => ({
      ...a,
      toneId: a.toneId ?? DEFAULT_TONE_ID,
      notificationIds: a.notificationIds ?? [],
    }));
  } catch {
    return [];
  }
}

export async function saveAlarms(alarms: Alarm[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(alarms));
}

export function makeAlarmId(): string {
  return `alarm-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
}
