"""
Synthesizes a handful of alarm tone .wav files with pure-stdlib `wave` + `math`
— no audio assets, no extra Python dependency, no paid service. Run once
locally (`python3 scripts/generate_tones.py`) and commit the output; these
are static assets bundled into the app via the expo-notifications config
plugin's "sounds" array in app.json.

Filenames matter: they must match (a) the paths listed in app.json's
expo-notifications "sounds" array, and (b) `soundFile` in src/data/tones.ts,
and (c) be valid Android resource names — lowercase letters, digits, and
underscores only (no hyphens), since they land in android/app/.../res/raw/.
"""
import math
import os
import struct
import wave

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "assets", "sounds")
SAMPLE_RATE = 22050


def tone_samples(freq, duration_s, volume=0.6, wave_shape="sine"):
    n = int(SAMPLE_RATE * duration_s)
    fade = max(1, int(n * 0.08))  # short fade in/out avoids clicks at segment edges
    samples = []
    for i in range(n):
        t = i / SAMPLE_RATE
        if wave_shape == "square":
            raw = 1.0 if math.sin(2 * math.pi * freq * t) >= 0 else -1.0
        else:
            raw = math.sin(2 * math.pi * freq * t)
        env = 1.0
        if i < fade:
            env = i / fade
        elif i > n - fade:
            env = (n - i) / fade
        samples.append(raw * volume * env)
    return samples


def silence_samples(duration_s):
    return [0.0] * int(SAMPLE_RATE * duration_s)


def write_wav(filename, segments):
    """segments: list of sample lists (floats -1..1), concatenated in order."""
    all_samples = [s for seg in segments for s in seg]
    path = os.path.join(OUT_DIR, filename)
    with wave.open(path, "w") as f:
        f.setnchannels(1)
        f.setsampwidth(2)  # 16-bit PCM
        f.setframerate(SAMPLE_RATE)
        frames = b"".join(
            struct.pack("<h", max(-32767, min(32767, int(s * 32767)))) for s in all_samples
        )
        f.writeframes(frames)
    print(f"wrote {filename} ({len(all_samples) / SAMPLE_RATE:.2f}s)")


def make_classic_beep():
    # Three short, evenly spaced beeps — the generic "alarm clock" sound.
    beep = tone_samples(880, 0.18)
    gap = silence_samples(0.12)
    write_wav("alarm_classic.wav", [beep, gap, beep, gap, beep])


def make_gentle_chime():
    # Soft ascending three-note chime (C5, E5, G5), each note separated by
    # a short gap rather than true polyphony (keeps this dependency-free).
    notes = [523.25, 659.25, 783.99]
    segments = []
    for freq in notes:
        segments.append(tone_samples(freq, 0.35, volume=0.45))
        segments.append(silence_samples(0.05))
    write_wav("alarm_chime.wav", segments)


def make_digital_alarm():
    # Harsher, faster square-wave beeps — a more "digital alarm clock" character.
    beep = tone_samples(1200, 0.10, volume=0.55, wave_shape="square")
    gap = silence_samples(0.07)
    segments = [beep, gap] * 5
    write_wav("alarm_digital.wav", segments)


if __name__ == "__main__":
    os.makedirs(OUT_DIR, exist_ok=True)
    make_classic_beep()
    make_gentle_chime()
    make_digital_alarm()
