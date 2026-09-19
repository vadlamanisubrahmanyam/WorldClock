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

// Theme-based, not opacity-based: the opacity slider only ever controls how
// see-through the card is, never text/background colour. Two explicit
// palettes, chosen by the user in Settings — no "auto" guessing.
const PALETTES = {
  dark: { rgb: "28, 28, 30", text: "#FFFFFF", subText: "#D0D0D0" },
  light: { rgb: "255, 255, 255", text: "#111111", subText: "#5C5C60" },
} as const;

// Using an rgba() *function* string (not an 8-digit hex) is the important
// part here: an 8-digit hex is ambiguous between the CSS convention
// (#RRGGBBAA, alpha last) and Android's native convention (#AARRGGBB, alpha
// first) — that ambiguity was why the opacity slider used to look like it
// wasn't doing anything (and made "opaque" settings render almost fully
// transparent). rgba(r, g, b, a) names each channel explicitly, so there's
// nothing for either convention to get backwards.
function toRgba(rgb: string, opacityPercent: number): string {
  const clamped = Math.max(0, Math.min(100, opacityPercent));
  return `rgba(${rgb}, ${(clamped / 100).toFixed(2)})`;
}

export function WorldClockWidget({
  timezones,
  settings,
}: {
  timezones: TimeZoneEntry[];
  settings: AppSettings;
}) {
  const palette = PALETTES[settings.widgetBackgroundTheme];
  const textColor = palette.text;
  const subTextColor = palette.subText;
  const backgroundColor = toRgba(palette.rgb, settings.widgetOpacity);

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
