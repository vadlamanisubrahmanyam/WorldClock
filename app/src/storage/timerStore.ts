import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_TONE_ID } from "../data/tones";
import type { TimerState } from "../types";

const KEY = "worldclock:timerState";

export const DEFAULT_TIMER_STATE: TimerState = {
  endAt: null,
  remainingMs: 5 * 60 * 1000,
  durationMs: 5 * 60 * 1000,
  toneId: DEFAULT_TONE_ID,
  notificationId: null,
};

export async function getTimerState(): Promise<TimerState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULT_TIMER_STATE;
    return { ...DEFAULT_TIMER_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_TIMER_STATE;
  }
}

export async function saveTimerState(state: TimerState): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(state));
}
