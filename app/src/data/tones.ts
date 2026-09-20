export interface ToneOption {
  id: string;
  label: string;
  /**
   * Android notification channel id for this tone. Android locks a
   * channel's sound once the channel is created — the OS ignores a
   * per-notification sound override after that — so each selectable tone
   * needs its own channel rather than one shared channel with a variable
   * sound. See src/notifications/notifications.ts.
   */
  channelId: string;
  /**
   * Filename as bundled by the expo-notifications config plugin's
   * "sounds" array in app.json (see scripts/generate_tones.py for how
   * these were generated). Undefined = system default notification sound.
   */
  soundFile?: string;
}

export const TONE_OPTIONS: ToneOption[] = [
  { id: "default", label: "Default (system sound)", channelId: "alarm-default" },
  { id: "classic", label: "Classic Beep", channelId: "alarm-classic", soundFile: "alarm_classic.wav" },
  { id: "chime", label: "Gentle Chime", channelId: "alarm-chime", soundFile: "alarm_chime.wav" },
  { id: "digital", label: "Digital Alarm", channelId: "alarm-digital", soundFile: "alarm_digital.wav" },
];

export function getToneOption(id: string): ToneOption {
  return TONE_OPTIONS.find((t) => t.id === id) ?? TONE_OPTIONS[0];
}

export const DEFAULT_TONE_ID = TONE_OPTIONS[0].id;
