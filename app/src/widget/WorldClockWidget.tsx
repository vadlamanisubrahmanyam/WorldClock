// Widgets are rendered by Android, not the RN runtime, so this component
// must return only react-native-android-widget primitives (FlexWidget,
// TextWidget, ...) — never View/Text/etc — and must not use hooks.
// 'use no memo' opts this file out of React Compiler auto-memoization,
// which otherwise inserts hooks widgets aren't allowed to use.
"use no memo";
import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";
import type { AppSettings, TimeZoneEntry } from "../types";
import { formatOffset, formatTime } from "../utils/time";

function opacityToAlphaHex(opacity: number): string {
  const clamped = Math.max(0, Math.min(100, opacity));
  const alpha = Math.round((clamped / 100) * 255);
  return alpha.toString(16).padStart(2, "0").toUpperCase();
}

export function WorldClockWidget({
  timezones,
  settings,
}: {
  timezones: TimeZoneEntry[];
  settings: AppSettings;
}) {
  const isDark =
    settings.widgetTextTheme === "dark" ||
    (settings.widgetTextTheme === "auto" && settings.widgetOpacity >= 35);
  const textColor = isDark ? "#FFFFFF" : "#111111";
  const subTextColor = isDark ? "#D0D0D0" : "#444444";
  const backgroundColor = `#1C1C1E${opacityToAlphaHex(settings.widgetOpacity)}`;

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: "match_parent",
        width: "match_parent",
        backgroundColor,
        borderRadius: 20,
        padding: 14,
        flexDirection: "column",
        justifyContent: "center",
      }}
      accessibilityLabel="WorldClock widget"
    >
      {timezones.length === 0 ? (
        <TextWidget text="Tap to set up WorldClock" style={{ color: textColor, fontSize: 14 }} />
      ) : (
        timezones.map((tz, index) => (
          <FlexWidget
            key={tz.id}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              width: "match_parent",
              marginTop: index === 0 ? 0 : 6,
            }}
          >
            <FlexWidget style={{ flexDirection: "column" }}>
              <TextWidget
                text={tz.label}
                style={{ color: textColor, fontSize: 13, fontWeight: "bold" }}
              />
              <TextWidget
                text={formatOffset(tz.ianaZone)}
                style={{ color: subTextColor, fontSize: 10 }}
              />
            </FlexWidget>
            <TextWidget
              text={formatTime(tz.ianaZone, settings.timeFormat)}
              style={{ color: textColor, fontSize: 16, fontWeight: "bold" }}
            />
          </FlexWidget>
        ))
      )}
    </FlexWidget>
  );
}
