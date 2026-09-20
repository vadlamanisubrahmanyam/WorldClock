import React, { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { TONE_OPTIONS } from "../../data/tones";
import { handleTimerFired, pauseTimer, resetTimer, resumeTimer, startTimer } from "../../notifications/timerScheduler";
import { DEFAULT_TIMER_STATE, getTimerState } from "../../storage/timerStore";
import type { TimerState } from "../../types";

const PRESETS_MIN = [1, 5, 10, 20];

function msToParts(ms: number): { h: number; m: number; s: number } {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  return {
    h: Math.floor(totalSeconds / 3600),
    m: Math.floor((totalSeconds % 3600) / 60),
    s: totalSeconds % 60,
  };
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

export function TimerAdmin() {
  const [state, setState] = useState<TimerState>(DEFAULT_TIMER_STATE);
  const [loaded, setLoaded] = useState(false);
  const [displayMs, setDisplayMs] = useState(DEFAULT_TIMER_STATE.durationMs);
  const [editH, setEditH] = useState("0");
  const [editM, setEditM] = useState("5");
  const [editS, setEditS] = useState("0");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    (async () => {
      const s = await getTimerState();
      const parts = msToParts(s.durationMs);
      setEditH(String(parts.h));
      setEditM(String(parts.m));
      setEditS(String(parts.s));
      if (s.endAt) {
        const remaining = Math.max(0, s.endAt - Date.now());
        if (remaining === 0) {
          await handleTimerFired();
          setState({ ...s, endAt: null, remainingMs: s.durationMs });
          setDisplayMs(s.durationMs);
        } else {
          setState(s);
          setDisplayMs(remaining);
        }
      } else {
        setState(s);
        setDisplayMs(s.remainingMs);
      }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (state.endAt === null) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    const endAt = state.endAt;
    intervalRef.current = setInterval(async () => {
      const remaining = Math.max(0, endAt - Date.now());
      setDisplayMs(remaining);
      if (remaining <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        await handleTimerFired();
        setState((prev) => ({ ...prev, endAt: null, remainingMs: prev.durationMs }));
        setDisplayMs(state.durationMs);
      }
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.endAt, state.durationMs]);

  const isRunning = state.endAt !== null;
  const isPaused = !isRunning && state.remainingMs > 0 && state.remainingMs < state.durationMs;
  const isIdle = !isRunning && !isPaused;

  function currentEditedDurationMs(): number {
    const h = Math.max(0, parseInt(editH, 10) || 0);
    const m = Math.max(0, parseInt(editM, 10) || 0);
    const s = Math.max(0, parseInt(editS, 10) || 0);
    return (h * 3600 + m * 60 + s) * 1000;
  }

  async function onStart() {
    const durationMs = currentEditedDurationMs();
    if (durationMs <= 0) return;
    const next = await startTimer(durationMs, state.toneId);
    setState(next);
    setDisplayMs(durationMs);
  }

  async function onPause() {
    const next = await pauseTimer();
    setState(next);
  }

  async function onResume() {
    const next = await resumeTimer();
    setState(next);
  }

  async function onReset() {
    const next = await resetTimer(currentEditedDurationMs() || state.durationMs, state.toneId);
    setState(next);
    setDisplayMs(next.durationMs);
  }

  function applyPreset(minutes: number) {
    setEditH("0");
    setEditM(String(minutes));
    setEditS("0");
    setDisplayMs(minutes * 60 * 1000);
  }

  const parts = msToParts(displayMs);

  if (!loaded) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.countdown}>
        {parts.h > 0 ? `${pad(parts.h)}:` : ""}
        {pad(parts.m)}:{pad(parts.s)}
      </Text>

      {isIdle && (
        <>
          <View style={styles.durationRow}>
            <View style={styles.durationField}>
              <TextInput
                style={styles.durationInput}
                keyboardType="number-pad"
                value={editH}
                onChangeText={setEditH}
                maxLength={2}
              />
              <Text style={styles.durationLabel}>hr</Text>
            </View>
            <View style={styles.durationField}>
              <TextInput
                style={styles.durationInput}
                keyboardType="number-pad"
                value={editM}
                onChangeText={setEditM}
                maxLength={2}
              />
              <Text style={styles.durationLabel}>min</Text>
            </View>
            <View style={styles.durationField}>
              <TextInput
                style={styles.durationInput}
                keyboardType="number-pad"
                value={editS}
                onChangeText={setEditS}
                maxLength={2}
              />
              <Text style={styles.durationLabel}>sec</Text>
            </View>
          </View>

          <View style={styles.presetRow}>
            {PRESETS_MIN.map((min) => (
              <Pressable key={min} style={styles.presetChip} onPress={() => applyPreset(min)}>
                <Text style={styles.presetChipText}>{min}m</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      <View style={styles.buttonRow}>
        {isIdle && (
          <Pressable style={styles.primaryButton} onPress={onStart}>
            <Text style={styles.primaryButtonText}>Start</Text>
          </Pressable>
        )}
        {isRunning && (
          <>
            <Pressable style={styles.secondaryButton} onPress={onPause}>
              <Text style={styles.secondaryButtonText}>Pause</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={onReset}>
              <Text style={styles.secondaryButtonText}>Reset</Text>
            </Pressable>
          </>
        )}
        {isPaused && (
          <>
            <Pressable style={styles.primaryButton} onPress={onResume}>
              <Text style={styles.primaryButtonText}>Resume</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={onReset}>
              <Text style={styles.secondaryButtonText}>Reset</Text>
            </Pressable>
          </>
        )}
      </View>

      <Text style={styles.sectionLabel}>Tone</Text>
      {TONE_OPTIONS.map((tone) => (
        <Pressable
          key={tone.id}
          style={styles.toneRow}
          onPress={() => setState({ ...state, toneId: tone.id })}
          disabled={isRunning}
        >
          <Text style={[styles.toneLabel, isRunning && styles.dimmed]}>{tone.label}</Text>
          <Text style={styles.toneCheck}>{state.toneId === tone.id ? "✓" : ""}</Text>
        </Pressable>
      ))}
      {isRunning && <Text style={styles.hint}>Pause the timer to change its tone.</Text>}

      <Text style={styles.hint}>
        Rings via a notification, so it still fires if you leave the app while it counts down —
        see the README for what that does and doesn't guarantee (e.g. silent mode).
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center" },
  countdown: { color: "#FFFFFF", fontSize: 56, fontWeight: "700", marginTop: 20, marginBottom: 20 },
  durationRow: { flexDirection: "row", gap: 16, marginBottom: 16 },
  durationField: { alignItems: "center" },
  durationInput: {
    backgroundColor: "#1C1C1E",
    color: "#FFFFFF",
    borderRadius: 10,
    width: 64,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    paddingVertical: 10,
  },
  durationLabel: { color: "#8A8A8E", fontSize: 12, marginTop: 4 },
  presetRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  presetChip: {
    backgroundColor: "#1C1C1E",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  presetChipText: { color: "#5B8CFF", fontSize: 13, fontWeight: "600" },
  buttonRow: { flexDirection: "row", gap: 12, marginBottom: 24, width: "100%" },
  primaryButton: {
    flex: 1,
    backgroundColor: "#5B8CFF",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#1C1C1E",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
  sectionLabel: {
    color: "#8A8A8E",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    alignSelf: "flex-start",
  },
  toneRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2A2A2E",
    width: "100%",
  },
  toneLabel: { color: "#FFFFFF", fontSize: 15 },
  dimmed: { color: "#5C5C60" },
  toneCheck: { color: "#5B8CFF", fontSize: 16, fontWeight: "700", width: 20, textAlign: "right" },
  hint: { color: "#5C5C60", fontSize: 12, marginTop: 16, textAlign: "center", lineHeight: 17 },
});
