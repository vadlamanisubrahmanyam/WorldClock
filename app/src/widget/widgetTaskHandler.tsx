import React from "react";
import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import { getSettings } from "../storage/settingsStore";
import { getTimezones } from "../storage/timezoneStore";
import { WorldClockWidget } from "./WorldClockWidget";

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  switch (props.widgetAction) {
    case "WIDGET_ADDED":
    case "WIDGET_UPDATE":
    case "WIDGET_RESIZED": {
      const [settings, timezones] = await Promise.all([getSettings(), getTimezones()]);
      props.renderWidget(<WorldClockWidget timezones={timezones} settings={settings} />);
      break;
    }

    // Tapping anywhere on the widget uses the built-in "OPEN_APP" click
    // action (see WorldClockWidget.tsx), which Android handles without
    // this handler being involved — nothing to do here for WIDGET_CLICK.
    case "WIDGET_CLICK":
    case "WIDGET_DELETED":
    default:
      break;
  }
}
