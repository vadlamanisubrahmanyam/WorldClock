import type { TimeFormat } from "../types";

/**
 * All formatting below uses the built-in Intl API with an explicit
 * `timeZone`, backed by the IANA tz database that ships with Hermes — no
 * extra package, no network call, works fully offline.
 */

export function formatTime(ianaZone: string, format: TimeFormat, date: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: ianaZone,
      hour: "numeric",
      minute: "2-digit",
      hour12: format === "12h",
    }).format(date);
  } catch {
    return "--:--";
  }
}

export function formatOffset(ianaZone: string, date: Date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: ianaZone,
      timeZoneName: "shortOffset",
    }).formatToParts(date);
    const offset = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
    return offset === "GMT" ? "UTC+0" : offset.replace("GMT", "UTC");
  } catch {
    return "";
  }
}

export function formatDateLabel(ianaZone: string, date: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: ianaZone,
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(date);
  } catch {
    return "";
  }
}
