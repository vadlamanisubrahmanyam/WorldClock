import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { TONE_OPTIONS } from "../data/tones";

let configured = false;

/**
 * Makes alarms/timer notifications show (and play sound) even while the app
 * is open in the foreground — without this, Android/iOS suppress a
 * notification's alert while its own app is the one in front.
 */
export function configureNotificationHandler(): void {
  if (configured) return;
  configured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/**
 * One Android notification channel per selectable tone. This is required,
 * not just tidy: Android locks a channel's sound the first time the channel
 * is created, and silently ignores any later per-notification sound
 * override — so "let the user pick a tone" only works if each tone is its
 * own channel. No-op on iOS (channels are an Android concept) and safe to
 * call on every app start (creating a channel that already exists is a
 * harmless no-op).
 */
export async function ensureAlarmChannels(): Promise<void> {
  if (Platform.OS !== "android") return;
  for (const tone of TONE_OPTIONS) {
    await Notifications.setNotificationChannelAsync(tone.channelId, {
      name: `Alarm — ${tone.label}`,
      importance: Notifications.AndroidImportance.MAX,
      sound: tone.soundFile ?? "default",
      vibrationPattern: [0, 400, 250, 400, 250, 400],
      lightColor: "#5B8CFF",
    });
  }
}

/**
 * Requests the OS notification permission (the Android 13+ POST_NOTIFICATIONS
 * runtime prompt; a no-op grant on earlier Android). This is NOT the same as
 * Android 12+'s separate "Alarms & reminders" exact-alarm permission, which
 * has no in-app runtime dialog — see README for why and what to do about it.
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}
