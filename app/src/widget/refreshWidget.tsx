import React from "react";
import { requestWidgetUpdate } from "react-native-android-widget";
import { getSettings } from "../storage/settingsStore";
import { getTimezones } from "../storage/timezoneStore";
import { WorldClockWidget } from "./WorldClockWidget";

/**
 * Call after any settings or time-zone change so a widget already on the
 * home screen updates immediately, instead of waiting for the next
 * `updatePeriodMillis` tick (capped by Android at 30 min — see README).
 * No-ops quietly if the widget isn't on the home screen.
 */
export async function refreshWidget(): Promise<void> {
  const [settings, timezones] = await Promise.all([getSettings(), getTimezones()]);
  requestWidgetUpdate({
    widgetName: "WorldClock",
    renderWidget: () => <WorldClockWidget timezones={timezones} settings={settings} />,
  });
}
