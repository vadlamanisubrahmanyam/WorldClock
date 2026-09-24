import React from "react";
import { requestWidgetUpdate } from "react-native-android-widget";
import { getSettings } from "../storage/settingsStore";
import { getTimezones } from "../storage/timezoneStore";
import { WorldClockWidget } from "./WorldClockWidget";

/**
 * Call after any settings or time-zone change so a widget already on the
 * home screen updates immediately, instead of waiting for the next
 * `updatePeriodMillis` tick (capped by Android at 30 min — see README).
 *
 * `widgetNotFound` fires if requestWidgetUpdate's native lookup
 * (AppWidgetManager.getAppWidgetIds against the generated provider class)
 * finds zero placed instances — previously silent, now logged, since a
 * silent miss here would look identical to "settings changes don't
 * affect the widget" from the outside. Check `adb logcat | grep WorldClock`
 * after changing a setting: this line means the widget genuinely wasn't
 * found (check it's actually on the home screen); its absence means the
 * lookup succeeded and the problem is elsewhere (native rendering).
 */
export async function refreshWidget(): Promise<void> {
  const [settings, timezones] = await Promise.all([getSettings(), getTimezones()]);
  requestWidgetUpdate({
    widgetName: "WorldClock",
    renderWidget: () => <WorldClockWidget timezones={timezones} settings={settings} />,
    widgetNotFound: () => {
      console.warn("[WorldClock] refreshWidget: no placed 'WorldClock' widget instance found");
    },
  });
}
