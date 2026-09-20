import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { getToneOption } from "../data/tones";
import { getTimerState, saveTimerState } from "../storage/timerStore";
import type { TimerState } from "../types";

/**
 * The timer is normally watched with the app open, where a plain
 * `setInterval` in TimerAdmin.tsx drives the visible countdown. This
 * schedules one notification as a backstop for the case where the app gets
 * backgrounded (or killed) before the timer finishes, so it still rings —
 * same underlying mechanism as alarms (see alarmScheduler.ts), just a
 * single one-shot trigger with no repeat/reschedule logic needed.
 */
async function scheduleBackstop(endAt: number, toneId: string): Promise<string> {
  const tone = getToneOption(toneId);
  return Notifications.scheduleNotificationAsync({
    content: {
      title: "Timer done",
      body: "Your WorldClock countdown timer finished.",
      sound: tone.soundFile ?? "default",
      ...(Platform.OS === "android" ? { channelId: tone.channelId } : {}),
      data: { kind: "timer" },
    },
    trigger: new Date(endAt),
  });
}

async function cancelBackstop(notificationId: string | null): Promise<void> {
  if (!notificationId) return;
  await Notifications.cancelScheduledNotificationAsync(notificationId).catch(() => {});
}

export async function startTimer(durationMs: number, toneId: string): Promise<TimerState> {
  const current = await getTimerState();
  await cancelBackstop(current.notificationId);

  const endAt = Date.now() + durationMs;
  const notificationId = await scheduleBackstop(endAt, toneId);
  const next: TimerState = { endAt, remainingMs: durationMs, durationMs, toneId, notificationId };
  await saveTimerState(next);
  return next;
}

export async function pauseTimer(): Promise<TimerState> {
  const current = await getTimerState();
  await cancelBackstop(current.notificationId);
  const remainingMs = current.endAt ? Math.max(0, current.endAt - Date.now()) : current.remainingMs;
  const next: TimerState = { ...current, endAt: null, remainingMs, notificationId: null };
  await saveTimerState(next);
  return next;
}

export async function resumeTimer(): Promise<TimerState> {
  const current = await getTimerState();
  const endAt = Date.now() + current.remainingMs;
  const notificationId = await scheduleBackstop(endAt, current.toneId);
  const next: TimerState = { ...current, endAt, notificationId };
  await saveTimerState(next);
  return next;
}

export async function resetTimer(durationMs: number, toneId: string): Promise<TimerState> {
  const current = await getTimerState();
  await cancelBackstop(current.notificationId);
  const next: TimerState = { endAt: null, remainingMs: durationMs, durationMs, toneId, notificationId: null };
  await saveTimerState(next);
  return next;
}

/** Call when the timer's own notification fires/is opened, so stale state doesn't linger. */
export async function handleTimerFired(): Promise<void> {
  const current = await getTimerState();
  await saveTimerState({ ...current, endAt: null, remainingMs: 0, notificationId: null });
}
