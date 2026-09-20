import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { getToneOption } from "../data/tones";
import { getAlarms, saveAlarms } from "../storage/alarmStore";
import type { Alarm } from "../types";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Next occurrence for an alarm's hour/minute + repeatDays (0=Sun..6=Sat).
 * Empty repeatDays = the next single occurrence (today if the time hasn't
 * passed yet, otherwise tomorrow).
 *
 * Deliberately NOT using expo-notifications' native weekday/calendar
 * trigger here — that trigger type has a track record of inconsistent
 * behaviour across Expo SDK versions and platforms (several open reports of
 * it silently never firing). Instead this computes one concrete timestamp
 * and schedules a plain `trigger: <Date>`, which is the oldest, simplest,
 * and most consistently reliable trigger form across every version of the
 * library. The trade-off — and it's a real one, see README — is that a
 * *repeating* alarm only has its *next* single occurrence scheduled at any
 * given time, so something needs to reschedule the following one after
 * each firing. See rescheduleAllAlarms below.
 */
export function nextOccurrence(
  hour: number,
  minute: number,
  repeatDays: number[],
  from: Date = new Date()
): Date {
  const base = new Date(from);
  base.setHours(hour, minute, 0, 0);

  if (repeatDays.length === 0) {
    if (base.getTime() <= from.getTime()) {
      base.setTime(base.getTime() + DAY_MS);
    }
    return base;
  }

  for (let i = 0; i < 8; i++) {
    const candidate = new Date(base.getTime() + i * DAY_MS);
    if (repeatDays.includes(candidate.getDay()) && candidate.getTime() > from.getTime()) {
      return candidate;
    }
  }
  // Unreachable (repeatDays is non-empty and 8 days always covers a full
  // week plus one), kept only so TypeScript sees every path return a Date.
  return base;
}

function formatAlarmBody(alarm: Alarm): string {
  if (alarm.repeatDays.length === 0) return "One-time alarm";
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return alarm.repeatDays
    .slice()
    .sort((a, b) => a - b)
    .map((d) => names[d])
    .join(", ");
}

export async function cancelNotificationIds(ids: string[]): Promise<void> {
  await Promise.all(
    ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {}))
  );
}

/**
 * Cancels any previously-scheduled occurrence for this alarm and, if it's
 * enabled, schedules the next one. Returns the new notificationIds to
 * persist (empty array if disabled).
 */
export async function scheduleAlarm(alarm: Alarm): Promise<string[]> {
  await cancelNotificationIds(alarm.notificationIds);
  if (!alarm.enabled) return [];

  const tone = getToneOption(alarm.toneId);
  const when = nextOccurrence(alarm.hour, alarm.minute, alarm.repeatDays);

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: alarm.label.trim() || "Alarm",
      body: formatAlarmBody(alarm),
      sound: tone.soundFile ?? "default",
      ...(Platform.OS === "android" ? { channelId: tone.channelId } : {}),
      data: { kind: "alarm", alarmId: alarm.id, repeats: alarm.repeatDays.length > 0 },
    },
    trigger: when,
  });
  return [id];
}

/**
 * Re-derives and re-schedules every enabled alarm's next occurrence, and
 * persists the resulting notification ids. Cheap and idempotent — safe to
 * call on every app launch. Call this:
 *  - on every app start (App.tsx), and
 *  - after the user dismisses/opens a fired alarm notification,
 * since that's what stands in for a proper background reschedule job here
 * (see the caveat on nextOccurrence above, and the README).
 */
export async function rescheduleAllAlarms(): Promise<void> {
  const alarms = await getAlarms();
  let changed = false;
  const next = await Promise.all(
    alarms.map(async (alarm) => {
      const notificationIds = await scheduleAlarm(alarm);
      if (
        notificationIds.length !== alarm.notificationIds.length ||
        notificationIds.some((id, i) => id !== alarm.notificationIds[i])
      ) {
        changed = true;
      }
      return { ...alarm, notificationIds };
    })
  );
  if (changed) {
    await saveAlarms(next);
  }
}

/**
 * Call when a fired alarm's notification is opened/dismissed. For a
 * one-time alarm this flips it off (it already did its one job); for a
 * repeating alarm this just re-derives the next week's occurrence.
 */
export async function handleAlarmFired(alarmId: string): Promise<void> {
  const alarms = await getAlarms();
  const alarm = alarms.find((a) => a.id === alarmId);
  if (!alarm) return;

  if (alarm.repeatDays.length === 0) {
    const next = alarms.map((a) => (a.id === alarmId ? { ...a, enabled: false, notificationIds: [] } : a));
    await saveAlarms(next);
  } else {
    await rescheduleAllAlarms();
  }
}
