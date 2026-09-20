export type TimeFormat = "12h" | "24h";
/** "dark" = dark card background with light text. "light" = white card background with dark text. */
export type WidgetBackgroundTheme = "dark" | "light";

export interface AppSettings {
  timeFormat: TimeFormat;
  /** 0 = fully transparent, 100 = fully opaque */
  widgetOpacity: number;
  widgetBackgroundTheme: WidgetBackgroundTheme;
}

export interface TimeZoneEntry {
  /** stable local id, not the IANA zone id (a zone can be added more than once with different labels) */
  id: string;
  ianaZone: string;
  label: string;
  order: number;
}

export interface CurrencyPrefs {
  from: string;
  to: string;
}

export interface RatesCache {
  base: string;
  /** the date these rates were published, as returned by the API */
  date: string;
  rates: Record<string, number>;
  /** epoch ms — when this device fetched the rates, not when they were published */
  fetchedAt: number;
}

export interface Alarm {
  id: string;
  hour: number; // 0-23
  minute: number; // 0-59
  label: string;
  /** 0=Sunday .. 6=Saturday. Empty = one-time (single) alarm. */
  repeatDays: number[];
  enabled: boolean;
  toneId: string;
  /**
   * IDs of the currently-scheduled OS notification(s) backing this alarm —
   * always 0 or 1 in this app (one upcoming occurrence at a time; see
   * src/notifications/alarmScheduler.ts for why). Kept as an array so
   * cancelling is a uniform loop regardless of count.
   */
  notificationIds: string[];
}

export interface TimerState {
  /** epoch ms this run should end, or null if no timer is running/paused-with-progress */
  endAt: number | null;
  /** ms remaining, valid when paused (endAt is null but a run was in progress) */
  remainingMs: number;
  /** the configured duration, so Reset can restore it */
  durationMs: number;
  toneId: string;
  /** OS notification id scheduled as a background backstop for when the app isn't open at completion */
  notificationId: string | null;
}
