export interface ToneOption {
  id: string;
  label: string;
  /**
   * Android notification channel id for this tone.
   *
   * Two separate Android quirks meet here, both confirmed by reading the
   * actual expo-notifications native source (not assumed):
   *
   * 1. Android locks a channel's sound at creation time. Re-creating a
   *    channel with the same id but different settings is a documented,
   *    silent no-op — createNotificationChannel() only takes effect the
   *    FIRST time a given channel id is ever created on a device. Code
   *    changes to an existing channel's sound never take effect after
   *    that, on any already-installed device.
   *
   *    This is exactly why the CHANNEL_VERSION suffix below exists: if you
   *    change what a tone's channel should sound like, bump
   *    CHANNEL_VERSION so every tone gets a fresh channel id — otherwise
   *    devices that already ran an earlier build keep the old, stale
   *    channel forever (this is what caused tones to silently not update
   *    on already-installed test devices).
   *
   * 2. Once a notification uses a channel (Android 8+), the OS ignores any
   *    per-notification sound override in favour of the channel's own
   *    sound — so each selectable tone needs its own channel rather than
   *    one shared channel with a variable sound. See
   *    src/notifications/notifications.ts.
   */
  channelId: string;
  /**
   * Filename as bundled by the expo-notifications config plugin's
   * "sounds" array in app.json (see scripts/generate_tones.py for how
   * these were generated). Undefined = system default notification sound
   * (resolved natively by SoundResolver.java to
   * Settings.System.DEFAULT_NOTIFICATION_URI when no matching raw
   * resource is found for the given name).
   */
  soundFile?: string;
}

/**
 * Bump this if a tone's underlying sound/settings change and you need
 * already-installed devices to actually pick up the change — see the
 * channelId doc comment above for why. Changing this does NOT require any
 * migration of stored Alarm/TimerState data: those only ever store a
 * tone's `id` (e.g. "classic"), and channelId is looked up fresh from
 * TONE_OPTIONS at schedule time.
 */
const CHANNEL_VERSION = "v2";

export const TONE_OPTIONS: ToneOption[] = [
  {
    id: "digital",
    label: "Digital Alarm",
    channelId: `alarm-digital-${CHANNEL_VERSION}`,
    soundFile: "alarm_digital.wav",
  },
  {
    id: "classic",
    label: "Classic Beep",
    channelId: `alarm-classic-${CHANNEL_VERSION}`,
    soundFile: "alarm_classic.wav",
  },
  {
    id: "chime",
    label: "Gentle Chime",
    channelId: `alarm-chime-${CHANNEL_VERSION}`,
    soundFile: "alarm_chime.wav",
  },
  {
    id: "default",
    label: "Default (system sound)",
    channelId: `alarm-default-${CHANNEL_VERSION}`,
  },
];

/**
 * "Default (system sound)" is deliberately NOT first: it plays whatever the
 * phone's own default *notification* sound is set to (via
 * Settings.System.DEFAULT_NOTIFICATION_URI, confirmed by reading
 * AndroidXNotificationsChannelManager's createSoundUriFromArguments in the
 * native source), which on plenty of Android devices/OEM skins is set to
 * Silent or something barely audible — outside this app's control. The
 * three bundled tones are actual audio files, so they play regardless of
 * that per-device setting. Making one of them the default is what makes
 * "it just rings" true out of the box; "Default (system sound)" stays
 * available as an explicit opt-in for anyone who wants it.
 */
export function getToneOption(id: string): ToneOption {
  return TONE_OPTIONS.find((t) => t.id === id) ?? TONE_OPTIONS[0];
}

export const DEFAULT_TONE_ID = TONE_OPTIONS[0].id;
