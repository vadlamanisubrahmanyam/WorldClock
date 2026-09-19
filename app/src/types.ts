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
