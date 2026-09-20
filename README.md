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
        ├── data/               # curated time zone + currency + tone lists (offline)
        ├── storage/            # AsyncStorage wrappers (settings/zones/rates/alarms/timer)
        ├── api/frankfurter.ts  # currency rate fetch (no key, no cap)
        ├── utils/time.ts       # Intl-based formatting, no extra tz package
        ├── widget/             # the actual home-screen widget + task handler
        ├── notifications/      # alarm/timer scheduling engine (expo-notifications)
        └── screens/
            ├── Home, Settings, Currency
            └── AdminScreen.tsx + admin/  # segmented: Time Zones, Alarms, Timer
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

`expo-notifications` is pinned to `~0.28.19` (the version SDK 51 itself
bundles) and `@react-native-community/datetimepicker` to `8.2.0` (declares
`expo: ">=50.0.0"` as a peer). Both were verified against a real `npm install`
+ `npx tsc --noEmit` of this exact project, not assumed.

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
- Widget background/text colour is theme-based, not "auto": `Settings →
  Widget theme` picks **Dark** (dark card, light text) or **Light** (white
  card, dark text) explicitly — `src/widget/WorldClockWidget.tsx`. The
  opacity slider only ever fades that chosen background; it never changes
  text colour.
- **Correction to an earlier note here:** a previous version of this file
  blamed the opacity-slider issue on 8-digit hex alpha ordering
  (`#RRGGBBAA` vs `#AARRGGBB`). Having since installed the actual pinned
  `react-native-android-widget@0.14.2` and read its `convertColor()` source
  directly, that explanation was wrong — this exact version parses an
  8-digit hex the same way it parses `rgba()`, both correctly. The code
  still uses `rgba(r, g, b, a)` (see `src/widget/WorldClockWidget.tsx`)
  because it's easier to generate from a 0–100 opacity value and its type
  (`RgbaColor`) is exported and checked by `npx tsc`, not because the hex
  form was broken. If opacity still looks wrong on-device, the more likely
  cause is Android 12+'s own system-drawn widget background/corner chrome
  sitting behind the content — that's a platform behaviour, not something
  fixable in this file — worth confirming against a real device before
  chasing it further in code.
- The app icon (`assets/icon.png`, `assets/adaptive-icon.png`) is a digital
  readout ("12:47"), not an analog clock face, to match what the widget
  itself actually shows. Regenerate with
  `python3 scripts/generate_icons.py` after editing the script.

## Alarms & Timer

Both live under **Admin** (segmented alongside Time Zones) rather than a
separate tab, and both ring via `expo-notifications` local notifications —
there's no separate native alarm module here. What that gets you, and what
it genuinely doesn't:

- **What it does well:** an alarm or timer still fires and rings even if
  the app is backgrounded or killed, because the notification is scheduled
  with the OS (`AlarmManager` underneath), not a JS timer. `expo-notifications`
  reschedules any not-yet-fired notification automatically after a device
  reboot (it adds `RECEIVE_BOOT_COMPLETED` itself), so existing alarms
  survive a restart.
- **Tone per alarm/timer:** Android locks a notification channel's sound
  once the channel is created and ignores any later per-notification
  override — so each selectable tone (`src/data/tones.ts`) gets its own
  Android channel (`src/notifications/notifications.ts`), not one shared
  channel with a swappable sound. The three non-default tones are
  synthesized beeps/chimes (`scripts/generate_tones.py`, pure Python
  `wave` + `math`, no audio assets needed) — swap in real `.wav` files at
  the same paths for a nicer sound if you want.
- **Repeat days, honestly:** rather than trust `expo-notifications`' native
  weekday/calendar trigger — which has a real history of inconsistent
  firing across SDK versions and platforms in community bug reports — this
  computes the *next single occurrence* in JS and schedules a plain
  `trigger: <Date>` (the oldest, simplest, most consistently reliable
  trigger form in the library). The trade-off: only the *next* occurrence
  of a repeating alarm is ever scheduled at one time, so something has to
  reschedule the following week's occurrence after each firing. This app
  does that on every app launch and whenever a fired alarm's notification
  is opened/dismissed (`rescheduleAllAlarms` / `handleAlarmFired` in
  `src/notifications/alarmScheduler.ts`) — which covers normal use (you
  open the app or dismiss the alarm within the week) but isn't a true
  background job. If a repeating alarm's notification is swiped away
  without opening the app *and* the app isn't reopened before the next
  occurrence, that next occurrence won't have been (re)scheduled. Worth
  knowing before relying on this for something that matters.
- **Android 12+ exact-alarm permission:** scheduling at an exact time
  needs `SCHEDULE_EXACT_ALARM` (declared in `app.json`), but Android 13+
  can silently deny it for a sideloaded app with no in-app prompt — it's a
  special "Alarms & reminders" toggle under system Settings, not a normal
  runtime permission dialog. The Alarms screen has an in-app hint pointing
  there; there's no automatic deep-link to that exact settings page here
  (would need native code this project can't verify without a device to
  test on).
- **Not a true "system alarm clock":** this rings at notification volume
  through a notification sound, the same way any app's local notification
  does — it does not use `AlarmManager.setAlarmClock` (the mode Android's
  own Clock app uses, which is exempt from Doze/Do Not Disturb and forces
  the device's alarm audio stream). In silent or Do Not Disturb mode, these
  alarms may not ring. Getting that last bit of "real alarm clock" behavior
  needs custom native Kotlin — flagged here rather than silently assumed.
- **Timer** is a plain countdown watched locally while the app is open,
  plus one scheduled notification as a backstop in case the app gets
  backgrounded before it finishes (`src/notifications/timerScheduler.ts`).
  Pausing/resetting cancels that backstop; resuming reschedules it.

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
- Alarms: confirm on a real device whether Android auto-grants or denies
  `SCHEDULE_EXACT_ALARM` for this package, and whether the in-app hint is
  enough or a settings deep-link is worth adding.
- Alarms/Timer: replace the synthesized placeholder tones
  (`scripts/generate_tones.py` output) with real sound files if the beeps
  aren't pleasant enough to wake up to.
- Decide if repeating alarms need a sturdier background-reschedule story
  than "on app open / on alarm dismissal" (see the Alarms & Timer section
  above) — would require native scheduling code this project doesn't have.
