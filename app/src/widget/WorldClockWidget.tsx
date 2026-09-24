// Widgets are rendered by Android, not the RN runtime, so this component
// must return only react-native-android-widget primitives (FlexWidget,
// TextWidget, ...) — never View/Text/etc — and must not use hooks.
// 'use no memo' opts this file out of React Compiler auto-memoization,
// which otherwise inserts hooks widgets aren't allowed to use.
"use no memo";
import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";
import type { RgbaColor } from "react-native-android-widget";
import type { AppSettings, TimeZoneEntry } from "../types";
import { formatOffset, formatTime } from "../utils/time";

// Theme-based, not opacity-based: the opacity slider only ever controls how
// see-through the card is, never text/background colour. Two explicit
// palettes, chosen by the user in Settings — no "auto" guessing.
const PALETTES = {
  dark: { rgb: "28, 28, 30", text: "#FFFFFF", subText: "#D0D0D0" },
  light: { rgb: "255, 255, 255", text: "#111111", subText: "#5C5C60" },
} as const;

// react-native-android-widget's own color type (ColorProp, see
// node_modules/react-native-android-widget/.../style.props.d.ts) is
// `HexColor | RgbaColor`, and its convertColor() handles both an 8-digit
// hex and an rgba(r, g, b, alpha) string correctly (alpha as 0-1 for rgba).
// rgba() is used here purely because it's easier to read/generate from a
// 0-100 opacity value than hand-rolling hex — not because the hex form was
// broken. The cast below is safe: `rgb` always comes from PALETTES above.
function toRgba(rgb: string, opacityPercent: number): RgbaColor {
  const clamped = Math.max(0, Math.min(100, opacityPercent));
  const alpha = Number((clamped / 100).toFixed(2));
  return `rgba(${rgb}, ${alpha})` as RgbaColor;
}

export function WorldClockWidget({
  timezones,
  settings,
}: {
  timezones: TimeZoneEntry[];
  settings: AppSettings;
}) {
  // Defensive fallback: if settings ever arrives without a recognized
  // widgetBackgroundTheme (e.g. stale AsyncStorage data from an older
  // build), fall back to "dark" instead of throwing — an undefined lookup
  // into PALETTES here would fail the whole render silently and leave the
  // widget stuck showing its last successful render, which looks exactly
  // like "changes don't take effect."
  const palette = PALETTES[settings.widgetBackgroundTheme] ?? PALETTES.dark;
  const textColor = palette.text;
  const subTextColor = palette.subText;
  const backgroundColor = toRgba(palette.rgb, settings.widgetOpacity);

  // TEMPORARY DIAGNOSTIC — remove once the opacity/theme issue is
  // confirmed fixed. Shows the exact settings values this render actually
  // received, directly on the home screen widget. If this line visibly
  // updates when you change Settings but the card's look doesn't, the bug
  // is in native rendering/compositing, not in getting settings to the
  // widget. If this line DOESN'T update either, the bug is upstream (the
  // widget isn't re-rendering at all — see refreshWidget.tsx's
  // widgetNotFound logging).
  const debugLine = `theme=${settings.widgetBackgroundTheme} op=${settings.widgetOpacity} ${new Date().toLocaleTimeString()}`;

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
      <TextWidget text={debugLine} style={{ color: "#FF6B6B", fontSize: 8 }} />
    </FlexWidget>
  );
}
