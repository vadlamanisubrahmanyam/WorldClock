# WorldClock

Home-screen widget + in-app clock for up to 5 time zones, and an offline-friendly
currency converter. Personal/family utility app — sideloaded, not published to
Play Store. See `FamilyGuard_Design_Document`-style companion doc for the full
design rationale; this README covers just what's needed to build and run.

## Layout

```
WorldClock/
├── .github/workflows/build-apk.yml   # CI: prebuild + assemble APK
└── app/                              # Expo project root
    ├── app.json                      # Expo config incl. the widget plugin
    ├── index.js                      # entry: registers app + widget task handler
    ├── App.tsx                       # simple tab switcher (Clock / Currency)
    └── src/
        ├── types.ts
        ├── data/               # curated time zone + currency lists (offline)
        ├── storage/            # AsyncStorage wrappers (settings/zones/rates)
        ├── api/frankfurter.ts  # currency rate fetch (no key, no cap)
        ├── utils/time.ts       # Intl-based formatting, no extra tz package
        ├── widget/             # the actual home-screen widget + task handler
        └── screens/            # Home, Admin, Settings, Currency
```

## One-time setup

```bash
cd app
npm install
```

If a dependency version mismatches your machine's Expo SDK, run
`npx expo install --check` to let Expo correct versions — the versions pinned
in `package.json` target **Expo SDK 51 / React Native 0.74**, matching the
rest of the portfolio's pipeline.

### Important version pin

`react-native-android-widget` only supports RN 0.76+ from its `0.15.0` release
onward. For RN < 0.76 (which is what this project and the rest of the
portfolio currently use) you need `react-native-android-widget@0.14.2`
specifically — already pinned in `package.json`. Don't let `npm update` or
`expo install` bump this past 0.14.x until the whole portfolio moves to RN
0.76+.

## Running

This app uses a native module (the widget), so **Expo Go will not work** —
same as CallVault/PocketPTT. Use a dev client build:

```bash
npx expo prebuild --platform android --clean
npx expo run:android
```

## Build pipeline (CI)

Same shape as the rest of the portfolio: `expo prebuild` → Gradle →
GitHub Actions → APK artifact → sideload via ADB. See
`.github/workflows/build-apk.yml`.

**Release signing is not wired up yet** — `assembleRelease` in CI currently
produces an **unsigned** APK. This is the same open gap PocketPTT shipped
v1 with; wire in the committed-keystore + `gradle.properties` pattern used
elsewhere in the portfolio before relying on this for a device you don't want
to reinstall/uninstall repeatedly.

## Widget notes

- The widget and the app talk to each other purely through `AsyncStorage`
  (which is backed by `SharedPreferences` on Android) — no extra native
  bridging code needed, no backend.
- Widget auto-refresh is capped by Android at 30 minutes
  (`updatePeriodMillis`); every settings/time-zone change from inside the app
  triggers an immediate `requestWidgetUpdate` on top of that, so day-to-day
  edits show up instantly — only the passive minute-by-minute tick is capped.
- `assets/widget-preview/worldclock.png` is a placeholder generated with
  Pillow. Swap it for a real screenshot of the widget once you've built and
  placed it on a home screen — that's what Android shows in the widget
  picker.

## Currency data

Frankfurter (`api.frankfurter.dev`) mirrors European Central Bank reference
rates: free, no API key, no usage cap, updated once per working day
(~16:00 CET). `src/data/currencies.ts` is a static list matching ECB's
published currency set (~31 currencies) — if a currency you need isn't in
that list, ECB doesn't publish it and Frankfurter won't have it either; a
secondary provider would be needed for full 170-currency coverage.

## Open items (carried over from the design doc)

- Confirm package id / app name before a first real install.
- Wire release signing into CI.
- Decide if per-zone individual widgets are wanted alongside the multi-zone one.
